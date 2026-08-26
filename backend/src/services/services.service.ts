import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Matches,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceTierDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  note?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class CreateServiceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug may only contain a-z, 0-9, and hyphens',
  })
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  // Optional: when tiers are provided the price is derived from the cheapest
  // tier, so the admin doesn't have to type a number that already exists.
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @IsArray()
  @IsOptional()
  blocks?: object[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ServiceTierDto)
  tiers?: ServiceTierDto[];
}

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug may only contain a-z, 0-9, and hyphens',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @IsArray()
  @IsOptional()
  blocks?: object[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ServiceTierDto)
  tiers?: ServiceTierDto[];
}

const ALLOWED_IMAGE_ORIGINS = ['r2.dev', 'r2.cloudflarestorage.com', 'pub-'];

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.service.findMany({
      where: includeInactive ? undefined : { isActive: true },
      // createdAt breaks the tie: every service ships with sortOrder 0, and with
      // equal keys Postgres returns rows in physical order — which shifts as soon
      // as a row is updated, making the admin list jump on every toggle.
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        tiers: { orderBy: { sortOrder: 'asc' } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        tiers: { orderBy: { sortOrder: 'asc' } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
    });
    if (!service || !service.isActive)
      throw new NotFoundException('Service not found');
    return service;
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  /** Derives the base price from the cheapest tier when it wasn't set explicitly. */
  private resolvePrice(
    price: number | undefined,
    tiers: ServiceTierDto[] | undefined,
  ): number | undefined {
    if (price !== undefined) return price;
    if (tiers?.length) return Math.min(...tiers.map((t) => t.price));
    return undefined;
  }

  async create(dto: CreateServiceDto) {
    const sanitized = this.sanitizeBlocks(dto.blocks ?? []);
    const price = this.resolvePrice(dto.price, dto.tiers);
    if (price === undefined) {
      throw new BadRequestException(
        'Вкажіть ціну або додайте хоча б один тариф',
      );
    }
    try {
      return await this.prisma.service.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          price,
          coverImage: dto.coverImage,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
          blocks: sanitized,
          ...(dto.tiers && {
            tiers: {
              create: dto.tiers.map((tier, index) => ({
                label: tier.label,
                price: tier.price,
                note: tier.note,
                sortOrder: tier.sortOrder ?? index,
              })),
            },
          }),
        },
        include: { tiers: { orderBy: { sortOrder: 'asc' } } },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('A service with this slug already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    const sanitized =
      dto.blocks !== undefined ? this.sanitizeBlocks(dto.blocks) : undefined;
    // Admin cleared the price but the payload carries tiers — keep the stored
    // price meaningful by deriving it from the cheapest tier.
    const price = this.resolvePrice(dto.price, dto.tiers);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.tiers !== undefined) {
          await this.syncTiers(tx, id, dto.tiers);
        }
        return tx.service.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.slug !== undefined && { slug: dto.slug }),
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
            ...(price !== undefined && { price }),
            ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            ...(sanitized !== undefined && { blocks: sanitized }),
          },
          include: { tiers: { orderBy: { sortOrder: 'asc' } } },
        });
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('A service with this slug already exists');
      }
      throw e;
    }
  }

  async duplicate(id: string) {
    const source = await this.prisma.service.findUnique({
      where: { id },
      include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!source) throw new NotFoundException('Service not found');

    const slug = await this.generateUniqueSlug(`${source.slug}-copy`);

    return this.prisma.service.create({
      data: {
        name: `${source.name} (копія)`,
        slug,
        description: source.description,
        price: source.price,
        coverImage: source.coverImage,
        // Hidden until the admin reviews and renames it
        isActive: false,
        sortOrder: source.sortOrder,
        blocks: source.blocks as Prisma.InputJsonValue,
        tiers: {
          create: source.tiers.map((tier, index) => ({
            label: tier.label,
            price: tier.price,
            note: tier.note,
            sortOrder: tier.sortOrder ?? index,
          })),
        },
      },
      include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  private async generateUniqueSlug(base: string): Promise<string> {
    let slug = base;
    for (let suffix = 2; ; suffix++) {
      const exists = await this.prisma.service.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return slug;
      slug = `${base}-${suffix}`;
    }
  }

  /**
   * Upsert-by-id sync, not deleteMany+createMany: OrderItem.tierId uses
   * onDelete: SetNull, so replacing all tiers on every save would null out
   * the tier link on every past order. Update rows whose id came in, create
   * rows without an id, delete only rows whose id is absent from dto.tiers.
   */
  private async syncTiers(
    tx: Prisma.TransactionClient,
    serviceId: string,
    tiers: ServiceTierDto[],
  ) {
    const existing = await tx.serviceTier.findMany({
      where: { serviceId },
      select: { id: true },
    });
    const incomingIds = new Set(tiers.filter((t) => t.id).map((t) => t.id));
    const toDelete = existing.filter((t) => !incomingIds.has(t.id));

    if (toDelete.length > 0) {
      await tx.serviceTier.deleteMany({
        where: { id: { in: toDelete.map((t) => t.id) } },
      });
    }

    for (const [index, tier] of tiers.entries()) {
      const data = {
        label: tier.label,
        price: tier.price,
        note: tier.note,
        sortOrder: tier.sortOrder ?? index,
      };
      if (tier.id) {
        await tx.serviceTier.update({ where: { id: tier.id }, data });
      } else {
        await tx.serviceTier.create({ data: { ...data, serviceId } });
      }
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }

  private sanitizeBlocks(blocks: object[]): object[] {
    return blocks.map((block) => {
      const b = block as Record<string, unknown>;
      if (b['type'] === 'image' && typeof b['url'] === 'string') {
        if (!this.isAllowedImageUrl(b['url'])) {
          return { ...b, url: '' };
        }
      }
      if (b['type'] === 'text' && typeof b['html'] === 'string') {
        return { ...b, html: this.stripUnsafeTags(b['html']) };
      }
      return b;
    });
  }

  private isAllowedImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:')
        return false;
      return ALLOWED_IMAGE_ORIGINS.some((origin) =>
        parsed.hostname.includes(origin),
      );
    } catch {
      // Relative URLs (e.g. /uploads/...) are allowed
      return url.startsWith('/');
    }
  }

  private stripUnsafeTags(html: string): string {
    return html.replace(
      /<(?!\/?(?:p|strong|em|ul|ol|li|br|h[1-6]|a)\b)[^>]+>/gi,
      '',
    );
  }
}
