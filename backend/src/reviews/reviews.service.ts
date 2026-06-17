import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  productId: string;

  @IsString()
  authorName: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
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

  async findAll(page = 1, limit = 20, approved?: boolean) {
    const where: any = {};
    if (approved !== undefined) where.isApproved = approved;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { product: { select: { name: true, slug: true } } },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(dto: CreateReviewDto, userId?: string) {
    return this.prisma.review.create({
      data: { ...dto, userId, isApproved: false },
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
