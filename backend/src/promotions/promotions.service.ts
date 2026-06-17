import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  categoryId?: string | null;

  @IsArray()
  @IsOptional()
  productIds?: string[];
}

export class UpdatePromotionDto extends CreatePromotionDto {}

const ACTIVE_WHERE = {
  isActive: true,
  startDate: { lte: new Date() },
  endDate: { gte: new Date() },
};

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async findActive() {
    return this.prisma.promotion.findMany({
      where: ACTIVE_WHERE,
      include: {
        category: true,
        products: {
          include: {
            product: {
              include: { images: { where: { isMain: true } }, variants: true },
            },
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          products: { select: { productId: true } },
        },
      }),
      this.prisma.promotion.count(),
    ]);
    return { data, total, page, limit };
  }

  async create(dto: CreatePromotionDto) {
    const { productIds, categoryId, ...rest } = dto;
    return this.prisma.promotion.create({
      data: {
        ...rest,
        startDate: new Date(rest.startDate),
        endDate: new Date(rest.endDate),
        categoryId: categoryId || null,
        products: productIds?.length
          ? { create: productIds.map((productId) => ({ productId })) }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        products: { select: { productId: true } },
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const { productIds, categoryId, ...rest } = dto;
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...rest,
        startDate: new Date(rest.startDate),
        endDate: new Date(rest.endDate),
        categoryId: categoryId ?? null,
        products: {
          deleteMany: {},
          ...(productIds?.length
            ? { create: productIds.map((productId) => ({ productId })) }
            : {}),
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        products: { select: { productId: true } },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.promotion.delete({ where: { id } });
  }
}
