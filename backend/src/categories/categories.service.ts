import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const CATEGORY_INCLUDE = {
  attributeTemplates: true,
  optionGroupTemplates: true,
} as const;

export interface ReorderCategoriesDto {
  categories: { id: string; sortOrder: number }[];
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            ...CATEGORY_INCLUDE,
            _count: {
              select: {
                children: true,
                products: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        ...CATEGORY_INCLUDE,
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, ...CATEGORY_INCLUDE },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          include: { ...CATEGORY_INCLUDE },
          orderBy: { sortOrder: 'asc' },
        },
        ...CATEGORY_INCLUDE,
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || this.toSlug(dto.name);
    const { attributeTemplates, optionGroupTemplates, ...rest } = dto;
    const sortOrder = await this.prisma.category.count({
      where: { parentId: dto.parentId ?? null },
    });
    return this.prisma.category.create({
      data: {
        ...rest,
        slug,
        sortOrder,
        attributeTemplates: attributeTemplates
          ? { create: attributeTemplates }
          : undefined,
        optionGroupTemplates: optionGroupTemplates
          ? { create: optionGroupTemplates }
          : undefined,
      },
      include: { ...CATEGORY_INCLUDE },
    });
  }

  async reorder(dto: ReorderCategoriesDto) {
    const ops = dto.categories.map(({ id, sortOrder }) =>
      this.prisma.category.update({ where: { id }, data: { sortOrder } }),
    );
    return this.prisma.$transaction(ops);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const { attributeTemplates, optionGroupTemplates, ...rest } = dto;
    return this.prisma.category.update({
      where: { id },
      data: {
        ...rest,
        ...(dto.slug ? {} : { slug: this.toSlug(dto.name || '') }),
        ...(attributeTemplates !== undefined
          ? {
              attributeTemplates: {
                deleteMany: {},
                create: attributeTemplates,
              },
            }
          : {}),
        ...(optionGroupTemplates !== undefined
          ? {
              optionGroupTemplates: {
                deleteMany: {},
                create: optionGroupTemplates,
              },
            }
          : {}),
      },
      include: { ...CATEGORY_INCLUDE },
    });
  }

  async remove(id: string) {
    const [children, products] = await Promise.all([
      this.prisma.category.count({ where: { parentId: id } }),
      this.prisma.product.count({ where: { categoryId: id } }),
    ]);

    if (children > 0) {
      throw new BadRequestException({
        code: 'CATEGORY_HAS_CHILDREN',
        message:
          'У категорії є підкатегорії. Спочатку перенесіть або видаліть їх.',
        childrenCount: children,
      });
    }
    if (products > 0) {
      throw new BadRequestException({
        code: 'CATEGORY_HAS_PRODUCTS',
        message:
          'У категорії є товари. Спочатку перенесіть їх в іншу категорію або видаліть.',
        productsCount: products,
      });
    }

    return this.prisma.category.delete({ where: { id } });
  }

  private toSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[а-яёіїєґ]/g, (char) => cyrillicMap[char] || char)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

const cyrillicMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
};
