import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildBucketSlots,
  deltaPercent,
  getPeriodRange,
  resolvePeriod,
} from './dashboard.periods';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TopItemRow {
  kind: 'product' | 'service';
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async attention() {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * DAY_MS);

    const [
      newOrders,
      serviceRequests,
      pendingReviews,
      outOfStock,
      expiringPromotions,
    ] = await Promise.all([
      this.prisma.order.count({ where: { status: 'NEW' } }),
      this.prisma.order.count({
        where: { status: 'NEW', items: { some: { serviceId: { not: null } } } },
      }),
      this.prisma.review.count({ where: { isApproved: false } }),
      this.prisma.product.count({
        where: {
          isActive: true,
          OR: [
            { variants: { none: { isActive: true } }, stock: 0 },
            {
              variants: {
                some: { isActive: true },
                every: { OR: [{ isActive: false }, { stock: 0 }] },
              },
            },
          ],
        },
      }),
      this.prisma.promotion.count({
        where: { isActive: true, endDate: { gte: now, lte: soon } },
      }),
    ]);

    return {
      newOrders,
      serviceRequests,
      pendingReviews,
      outOfStock,
      expiringPromotions,
    };
  }

  async stats(periodParam?: string) {
    const period = resolvePeriod(periodParam);
    const now = new Date();
    const { bucket, current, previous } = getPeriodRange(period, now);

    // CANCELLED orders must not count as money: stock was restored and the
    // sale never happened. statusBreakdown below still shows them — it
    // deliberately uses its own where without this filter.
    const currentWhere: Prisma.OrderWhereInput = {
      createdAt: current,
      status: { not: 'CANCELLED' },
    };
    const previousWhere: Prisma.OrderWhereInput | null = previous
      ? { createdAt: previous, status: { not: 'CANCELLED' } }
      : null;

    const [
      currentAgg,
      previousAgg,
      productsTotal,
      statusRows,
      revenueSeries,
      topItems,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: currentWhere,
        _count: true,
        _sum: { totalAmount: true },
      }),
      previousWhere
        ? this.prisma.order.aggregate({
            where: previousWhere,
            _count: true,
            _sum: { totalAmount: true },
          })
        : Promise.resolve(null),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: current },
        _count: true,
      }),
      this.buildRevenueSeries(current, bucket),
      this.buildTopItems(currentWhere),
    ]);

    const ordersValue = currentAgg._count;
    const revenueValue = Number(currentAgg._sum.totalAmount ?? 0);
    const avgOrderValue = ordersValue > 0 ? revenueValue / ordersValue : 0;

    const prevOrders = previousAgg?._count ?? 0;
    const prevRevenue = previousAgg
      ? Number(previousAgg._sum.totalAmount ?? 0)
      : 0;
    const prevAvgOrder = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    return {
      period,
      bucket,
      metrics: {
        orders: {
          value: ordersValue,
          deltaPercent: deltaPercent(ordersValue, prevOrders),
        },
        revenue: {
          value: revenueValue,
          deltaPercent: deltaPercent(revenueValue, prevRevenue),
        },
        avgOrder: {
          value: Math.round(avgOrderValue),
          deltaPercent: deltaPercent(avgOrderValue, prevAvgOrder),
        },
        products: { value: productsTotal, deltaPercent: null },
      },
      statusBreakdown: statusRows.map((row) => ({
        status: row.status,
        count: row._count,
      })),
      revenueSeries,
      topItems,
    };
  }

  private async buildRevenueSeries(
    current: { gte?: Date; lt: Date },
    bucket: 'hour' | 'day' | 'week',
  ) {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: current, status: { not: 'CANCELLED' } },
      select: { createdAt: true, totalAmount: true },
    });

    const earliest = orders.length
      ? orders.reduce(
          (min, o) => (o.createdAt < min ? o.createdAt : min),
          orders[0].createdAt,
        )
      : undefined;
    const slots = buildBucketSlots(bucket, current, earliest);

    return slots.map((slot) => {
      const inSlot = orders.filter(
        (o) => o.createdAt >= slot.start && o.createdAt < slot.end,
      );
      return {
        bucket: slot.label,
        total: inSlot.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        orders: inSlot.length,
      };
    });
  }

  private async buildTopItems(
    currentWhere: Prisma.OrderWhereInput,
  ): Promise<TopItemRow[]> {
    const itemWhere = { order: currentWhere };

    const [productGroups, serviceGroups] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { ...itemWhere, productId: { not: null } },
        _sum: { quantity: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['serviceId'],
        where: { ...itemWhere, serviceId: { not: null } },
        _sum: { quantity: true },
      }),
    ]);

    const ranked = [
      ...productGroups.map((g) => ({
        kind: 'product' as const,
        id: g.productId as string,
        quantity: g._sum.quantity ?? 0,
      })),
      ...serviceGroups.map((g) => ({
        kind: 'service' as const,
        id: g.serviceId as string,
        quantity: g._sum.quantity ?? 0,
      })),
    ]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    if (ranked.length === 0) return [];

    const productIds = ranked
      .filter((r) => r.kind === 'product')
      .map((r) => r.id);
    const serviceIds = ranked
      .filter((r) => r.kind === 'service')
      .map((r) => r.id);

    const [items, products, services] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: {
          ...itemWhere,
          OR: [
            { productId: { in: productIds } },
            { serviceId: { in: serviceIds } },
          ],
        },
        select: {
          productId: true,
          serviceId: true,
          price: true,
          quantity: true,
        },
      }),
      productIds.length
        ? this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      serviceIds.length
        ? this.prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const revenueByKey = new Map<string, number>();
    for (const item of items) {
      const key = item.productId
        ? `product:${item.productId}`
        : item.serviceId
          ? `service:${item.serviceId}`
          : null;
      if (!key) continue;
      revenueByKey.set(
        key,
        (revenueByKey.get(key) ?? 0) + Number(item.price) * item.quantity,
      );
    }

    const nameById = new Map<string, string>([
      ...products.map((p): [string, string] => [p.id, p.name]),
      ...services.map((s): [string, string] => [s.id, s.name]),
    ]);

    return ranked.map((r) => ({
      kind: r.kind,
      id: r.id,
      name: nameById.get(r.id) ?? '—',
      quantity: r.quantity,
      revenue: revenueByKey.get(`${r.kind}:${r.id}`) ?? 0,
    }));
  }
}
