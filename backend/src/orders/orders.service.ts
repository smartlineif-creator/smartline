import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
    private mail: MailService,
  ) {}

  async findAll(userId?: string, page = 1, limit = 20, today?: boolean, userEmail?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) {
      // For logged-in non-admin users: match orders by userId OR guest orders by email
      if (userEmail) {
        where.OR = [
          { userId },
          { customerEmail: userEmail, userId: null },
        ];
      } else {
        where.userId = userId;
      }
    }

    if (today) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { images: { where: { isMain: true } } } },
            },
          },
          user: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async stats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, newOrders, todayRevenue] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { status: 'NEW' } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      todayOrders,
      newOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
    };
  }

  async findOne(id: string, user?: Pick<User, 'id' | 'role'>) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(user && user.role !== Role.ADMIN ? { userId: user.id } : {}),
      },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isMain: true } } } },
            variant: true,
          },
        },
        user: { select: { email: true, name: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto, userId?: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems: {
        productId: string;
        variantId?: string;
        name: string;
        variantName?: string;
        price: number;
        quantity: number;
      }[] = [];

      for (const item of dto.items) {
        if (item.variantId) {
          // Atomically decrement stock only if sufficient — prevents race condition
          const updated = await tx.variant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            const variant = await tx.variant.findUnique({
              where: { id: item.variantId },
              include: { product: true },
            });
            const name = variant?.product?.name ?? 'товар';
            throw new BadRequestException(
              `Недостатньо товару "${name}" на складі`,
            );
          }
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });
          totalAmount += Number(variant!.price) * item.quantity;
          orderItems.push({
            productId: variant!.productId,
            variantId: item.variantId,
            name: variant!.product.name,
            variantName: variant!.name ?? undefined,
            price: Number(variant!.price),
            quantity: item.quantity,
          });
        } else {
          // Atomically decrement product stock only if sufficient
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });
            const name = product?.name ?? 'товар';
            throw new BadRequestException(
              `Недостатньо товару "${name}" на складі`,
            );
          }
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          totalAmount += Number(product!.basePrice) * item.quantity;
          orderItems.push({
            productId: item.productId,
            name: product!.name,
            price: Number(product!.basePrice),
            quantity: item.quantity,
          });
        }
      }

      // Add COD fee
      if (dto.payment.method === 'cod') totalAmount += 50;

      return tx.order.create({
        data: {
          userId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail,
          totalAmount,
          delivery: dto.delivery as any,
          payment: dto.payment as any,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });

    this.telegram.notifyNewOrder(order).catch(() => {});
    this.mail.sendOrderConfirmation(order).catch(() => {});
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    await this.findOne(id);
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.ttn ? { ttn: dto.ttn } : {}),
        ...(dto.adminNote ? { adminNote: dto.adminNote } : {}),
      },
    });

    this.telegram.notifyOrderStatus(updated).catch(() => {});
    this.mail.sendOrderStatusUpdate(updated).catch(() => {});
    return updated;
  }
}
