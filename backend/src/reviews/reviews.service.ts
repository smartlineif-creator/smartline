import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  authorName: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  text?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findByProduct(productId: string, onlyApproved = true) {
    return this.prisma.review.findMany({
      where: { productId, ...(onlyApproved ? { isApproved: true } : {}) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByService(serviceId: string, onlyApproved = true) {
    return this.prisma.review.findMany({
      where: { serviceId, ...(onlyApproved ? { isApproved: true } : {}) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(page = 1, limit = 20, approved?: boolean) {
    const where: { isApproved?: boolean } = {};
    // No explicit `approved` filter → public callers only ever see approved
    // reviews. The unfiltered/unapproved views live behind findPending(), which
    // is guarded at the controller level — see reviews.controller.ts.
    where.isApproved = approved ?? true;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { name: true, slug: true } },
          service: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findPending(page = 1, limit = 20) {
    const where = { isApproved: false };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { name: true, slug: true } },
          service: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(dto: CreateReviewDto, userId?: string) {
    const { productId, serviceId, ...rest } = dto;
    if (Boolean(productId) === Boolean(serviceId)) {
      throw new BadRequestException(
        'Provide exactly one of productId or serviceId',
      );
    }

    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new BadRequestException('Product not found');
    } else if (serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw new BadRequestException('Service not found');
    }

    return this.prisma.review.create({
      data: { ...rest, productId, serviceId, userId, isApproved: false },
    });
  }

  async approve(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
