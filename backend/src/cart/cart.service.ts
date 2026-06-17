import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class MergeCartItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items: MergeCartItemDto[];
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isMain: true } },
            promotions: {
              include: { promotion: true },
              where: {
                promotion: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() },
                },
              },
            },
          },
        },
        variant: true,
      },
    });
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });
    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
        include: { product: true, variant: true },
      });
    }
    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      },
      include: { product: true, variant: true },
    });
  }

  async removeItem(userId: string, itemId: string) {
    return this.prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  }

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  async mergeCart(userId: string, dto: MergeCartDto) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const existing = await tx.cartItem.findFirst({
          where: { userId, productId: item.productId, variantId: item.variantId ?? null },
        });
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.cartItem.create({
            data: { userId, productId: item.productId, variantId: item.variantId, quantity: item.quantity },
          });
        }
      }
    });
    return this.getCart(userId);
  }
}
