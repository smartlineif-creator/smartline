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

  async findAll(
    userId?: string,
    page = 1,
    limit = 20,
    today?: boolean,
    userEmail?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) {
      // For logged-in non-admin users: match orders by userId OR guest orders by email
      if (userEmail) {
        where.OR = [{ userId }, { customerEmail: userEmail, userId: null }];
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
              service: {
                select: { id: true, name: true, slug: true, coverImage: true },
              },
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
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                coverImage: true,
                price: true,
              },
            },
          },
        },
        user: { select: { email: true, name: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Mirrors getActivePromotion in frontend/lib/utils.ts: product-level
  // ProductPromotion takes priority over category-level Promotion. Dates are
  // filtered here in JS (not via Prisma `where`) because the queries below
  // fetch category.promotions without a date filter, so an expired
  // category-level promotion must still be excluded manually.
  private activeDiscountPercent(product: {
    promotions: {
      promotion: {
        isActive: boolean;
        startDate: Date;
        endDate: Date;
        discountPercent: number;
      };
    }[];
    category: {
      promotions: {
        isActive: boolean;
        startDate: Date;
        endDate: Date;
        discountPercent: number;
      }[];
    } | null;
  }): number {
    const now = new Date();

    const productPromo = product.promotions.find(
      (pp) =>
        pp.promotion.isActive &&
        pp.promotion.startDate <= now &&
        pp.promotion.endDate >= now,
    )?.promotion;
    if (productPromo) return productPromo.discountPercent;

    const categoryPromo = product.category?.promotions.find(
      (p) => p.isActive && p.startDate <= now && p.endDate >= now,
    );
    return categoryPromo?.discountPercent ?? 0;
  }

  // Math.round(price * (1 - pct / 100)) matches getDiscountedPrice in
  // frontend/lib/utils.ts exactly — any other rounding would make the saved
  // order total disagree with the discounted price shown on the product and
  // cart pages by a few kopecks.
  private applyPromo(price: number, discountPercent: number): number {
    return discountPercent > 0
      ? Math.round(price * (1 - discountPercent / 100))
      : price;
  }

  async create(dto: CreateOrderDto, userId?: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems: {
        productId?: string;
        variantId?: string;
        serviceId?: string;
        tierId?: string;
        name: string;
        variantName?: string;
        price: number;
        quantity: number;
      }[] = [];

      for (const item of dto.items) {
        if (!item.productId && !item.serviceId) {
          throw new BadRequestException(
            'Each order item must have a productId or serviceId',
          );
        }

        if (item.serviceId) {
          const service = await tx.service.findUnique({
            where: { id: item.serviceId },
          });
          if (!service || !service.isActive) {
            throw new BadRequestException('Service not found or inactive');
          }

          if (item.tierId) {
            const tier = await tx.serviceTier.findUnique({
              where: { id: item.tierId },
            });
            if (!tier || tier.serviceId !== item.serviceId) {
              throw new BadRequestException(
                'Tier does not belong to the specified service',
              );
            }
            totalAmount += Number(tier.price) * item.quantity;
            orderItems.push({
              serviceId: item.serviceId,
              tierId: item.tierId,
              name: service.name,
              variantName: tier.label,
              price: Number(tier.price),
              quantity: item.quantity,
            });
            continue;
          }

          totalAmount += Number(service.price) * item.quantity;
          orderItems.push({
            serviceId: item.serviceId,
            name: service.name,
            price: Number(service.price),
            quantity: item.quantity,
          });
        } else if (item.variantId) {
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
            include: {
              product: {
                include: {
                  promotions: { include: { promotion: true } },
                  category: { include: { promotions: true } },
                },
              },
            },
          });
          const discountPercent = this.activeDiscountPercent(variant!.product);
          const price = this.applyPromo(
            Number(variant!.price),
            discountPercent,
          );
          totalAmount += price * item.quantity;
          orderItems.push({
            productId: variant!.productId,
            variantId: item.variantId,
            name: variant!.product.name,
            variantName: variant!.name ?? undefined,
            price,
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
            include: {
              promotions: { include: { promotion: true } },
              category: { include: { promotions: true } },
            },
          });
          const discountPercent = this.activeDiscountPercent(product!);
          const price = this.applyPromo(
            Number(product!.basePrice),
            discountPercent,
          );
          totalAmount += price * item.quantity;
          orderItems.push({
            productId: item.productId,
            name: product!.name,
            price,
            quantity: item.quantity,
          });
        }
      }

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
    const existing = await this.findOne(id);

    const extraData = {
      ...(dto.ttn ? { ttn: dto.ttn } : {}),
      ...(dto.adminNote ? { adminNote: dto.adminNote } : {}),
    };

    // Stock must move exactly once per status transition, even under
    // concurrent requests. The status change itself is a conditional
    // updateMany (compare-and-set): whichever request wins the row lock
    // performs the stock adjustment; the loser re-evaluates the WHERE
    // against the new status and gets count 0.
    const { updated, statusChanged } = await this.prisma.$transaction(
      async (tx) => {
        let changed = false;

        if (dto.status === 'CANCELLED') {
          const claimed = await tx.order.updateMany({
            where: { id, status: { not: 'CANCELLED' } },
            data: { status: 'CANCELLED', ...extraData },
          });
          changed = claimed.count === 1;

          if (changed) {
            // This request performed the cancel — restore stock
            const items = await tx.orderItem.findMany({
              where: { orderId: id },
            });
            for (const item of items) {
              if (item.variantId) {
                await tx.variant.update({
                  where: { id: item.variantId },
                  data: { stock: { increment: item.quantity } },
                });
              } else if (item.productId) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
          } else {
            // Already cancelled — only persist ttn/note
            await tx.order.update({ where: { id }, data: extraData });
          }
        } else {
          // Reviving a cancelled order must take the stock back; the same
          // CAS guarantees it happens exactly once
          const revived = await tx.order.updateMany({
            where: { id, status: 'CANCELLED' },
            data: { status: dto.status, ...extraData },
          });

          if (revived.count === 1) {
            changed = true;
            const items = await tx.orderItem.findMany({
              where: { orderId: id },
            });
            for (const item of items) {
              const where = item.variantId
                ? { id: item.variantId, stock: { gte: item.quantity } }
                : { id: item.productId!, stock: { gte: item.quantity } };
              const decremented = item.variantId
                ? await tx.variant.updateMany({
                    where,
                    data: { stock: { decrement: item.quantity } },
                  })
                : item.productId
                  ? await tx.product.updateMany({
                      where,
                      data: { stock: { decrement: item.quantity } },
                    })
                  : { count: 1 }; // service items carry no stock
              if (decremented.count === 0) {
                // Rolls back the whole transaction — order stays CANCELLED
                throw new BadRequestException(
                  `Недостатньо товару "${item.name}" на складі, щоб відновити замовлення`,
                );
              }
            }
          } else {
            // Regular transition between non-cancelled statuses
            const before = await tx.order.findUnique({
              where: { id },
              select: { status: true },
            });
            changed = before?.status !== dto.status;
            await tx.order.update({
              where: { id },
              data: { status: dto.status, ...extraData },
            });
          }
        }

        const updatedOrder = await tx.order.findUnique({ where: { id } });
        return { updated: updatedOrder!, statusChanged: changed };
      },
    );

    // Notify the customer only when something they care about changed —
    // saving just an admin note must not re-send the "status changed" email
    const ttnChanged = !!dto.ttn && dto.ttn !== existing.ttn;
    if (statusChanged || ttnChanged) {
      this.telegram.notifyOrderStatus(updated).catch(() => {});
      this.mail.sendOrderStatusUpdate(updated).catch(() => {});
    }
    return updated;
  }
}
