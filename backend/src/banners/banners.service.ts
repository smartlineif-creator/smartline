import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateBannerDto extends CreateBannerDto {}

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findActive(position = 'home') {
    return this.prisma.banner.findMany({
      where: { isActive: true, position },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateBannerDto) {
    await this.validateLink(dto.link);
    return this.prisma.banner.create({
      data: { ...dto, position: dto.position || 'home' },
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.validateLink(dto.link);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  /** Internal pages a banner may link to without a dynamic segment. */
  private static STATIC_PATHS = new Set([
    '/',
    '/catalog',
    '/services',
    '/about',
    '/contacts',
    '/privacy',
    '/terms',
    '/search',
    '/wishlist',
    '/cart',
  ]);

  /** Ensures the banner link points to a real internal page. Empty link is allowed. */
  private async validateLink(link?: string) {
    if (!link) return;
    const trimmed = link.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('/')) {
      throw new BadRequestException('Посилання має бути внутрішнім і починатися з «/»');
    }

    const path = trimmed.split(/[?#]/)[0].replace(/\/+$/, '') || '/';

    if (BannersService.STATIC_PATHS.has(path)) return;

    const match = path.match(/^\/(catalog|product|services)\/([^/]+)$/);
    if (!match) {
      throw new BadRequestException('Такої сторінки не існує');
    }

    const [, type, slug] = match;
    const exists =
      type === 'catalog'
        ? await this.prisma.category.findUnique({ where: { slug } })
        : type === 'product'
          ? await this.prisma.product.findUnique({ where: { slug } })
          : await this.prisma.service.findUnique({ where: { slug } });

    if (!exists) {
      throw new BadRequestException(`Сторінку «${path}» не знайдено`);
    }
  }

  async remove(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
