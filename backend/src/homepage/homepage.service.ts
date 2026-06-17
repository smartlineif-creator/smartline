import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSectionDto {
  type: string;
  order?: number;
  isActive?: boolean;
  config?: Record<string, any>;
}

export interface UpdateSectionDto {
  type?: string;
  order?: number;
  isActive?: boolean;
  config?: Record<string, any>;
}

export interface ReorderDto {
  sections: { id: string; order: number }[];
}

const DEFAULT_SECTIONS = [
  {
    type: 'hero',
    order: 1,
    isActive: true,
    config: { autoSelect: true, productId: null },
  },
  {
    type: 'marquee',
    order: 2,
    isActive: true,
    config: {},
  },
  {
    type: 'banners',
    order: 3,
    isActive: true,
    config: {},
  },
  {
    type: 'categories',
    order: 4,
    isActive: true,
    config: {
      title: 'Популярні напрямки',
      subtitle: 'Швидкий вхід у ключові категорії, щоб не шукати потрібний розділ вручну.',
      categoryIds: [],
    },
  },
  {
    type: 'carousel',
    order: 5,
    isActive: true,
    config: {
      eyebrow: 'Почніть із сильних моделей',
      title: 'Хіти, з яких починають вибір',
      subtitle: 'Популярні позиції з хорошим балансом ціни, стану та характеристик.',
      href: '/catalog',
      hrefLabel: 'Дивитись усі товари',
      source: 'featured',
      productIds: [],
      categorySlug: '',
    },
  },
  {
    type: 'promo',
    order: 6,
    isActive: true,
    config: {},
  },
  {
    type: 'reviews',
    order: 7,
    isActive: true,
    config: {},
  },
  {
    type: 'carousel',
    order: 8,
    isActive: true,
    config: {
      eyebrow: 'Свіжі надходження',
      title: 'Актуальні моделі',
      subtitle: 'Нові товари, які варто переглянути перед фінальним вибором.',
      href: '/catalog',
      hrefLabel: 'Перейти в каталог',
      source: 'latest',
      productIds: [],
      categorySlug: '',
    },
  },
  {
    type: 'carousel',
    order: 9,
    isActive: true,
    config: {
      eyebrow: 'Логічне доповнення',
      title: 'Аксесуари, які логічно додати одразу',
      subtitle: 'Корисні доповнення до ноутбука, смартфона або робочого місця.',
      href: '/catalog/aksesuary',
      hrefLabel: 'Усі аксесуари',
      source: 'category',
      productIds: [],
      categorySlug: 'aksesuary',
    },
  },
  {
    type: 'trust',
    order: 10,
    isActive: true,
    config: {},
  },
];

@Injectable()
export class HomepageService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const sections = await this.prisma.homepageSection.findMany({
      orderBy: { order: 'asc' },
    });

    // Seed defaults if DB is empty
    if (sections.length === 0) {
      await this.prisma.homepageSection.createMany({
        data: DEFAULT_SECTIONS,
      });
      return this.prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
    }

    return sections;
  }

  async findActive() {
    const sections = await this.findAll();
    return sections.filter((s) => s.isActive);
  }

  async create(dto: CreateSectionDto) {
    const lastSection = await this.prisma.homepageSection.findFirst({
      orderBy: { order: 'desc' },
    });
    const nextOrder = (lastSection?.order ?? 0) + 1;

    return this.prisma.homepageSection.create({
      data: {
        type: dto.type,
        order: dto.order ?? nextOrder,
        isActive: dto.isActive ?? true,
        config: dto.config ?? {},
      },
    });
  }

  async update(id: string, dto: UpdateSectionDto) {
    return this.prisma.homepageSection.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.config !== undefined && { config: dto.config }),
      },
    });
  }

  async reorder(dto: ReorderDto) {
    const ops = dto.sections.map(({ id, order }) =>
      this.prisma.homepageSection.update({ where: { id }, data: { order } }),
    );
    return this.prisma.$transaction(ops);
  }

  async remove(id: string) {
    return this.prisma.homepageSection.delete({ where: { id } });
  }
}
