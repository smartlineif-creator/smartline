import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { Prisma } from '@prisma/client';

const PRODUCT_RELATION_RECOMMENDED = 'RECOMMENDED';
const PRODUCT_RELATION_WITH_THIS_BUY = 'WITH_THIS_BUY';
const PRODUCT_CATEGORY_LINK_ACCESSORY = 'ACCESSORY';
const PRODUCT_CATEGORY_LINK_RECOMMENDED_CAT = 'RECOMMENDED_CATEGORY';
const PRODUCT_CATEGORY_LINK_WITH_THIS_BUY_CAT = 'WITH_THIS_BUY_CATEGORY';

const ACTIVE_PROMOTION_WHERE = {
  isActive: true,
  startDate: { lte: new Date() },
  endDate: { gte: new Date() },
};

const CARD_PRODUCT_INCLUDE = {
  category: {
    include: {
      promotions: { where: ACTIVE_PROMOTION_WHERE },
    },
  },
  attributes: true,
  images: { where: { isMain: true } },
  variants: { where: { isActive: true, price: { gt: 0 } } },
  promotions: {
    include: { promotion: true },
    where: { promotion: ACTIVE_PROMOTION_WHERE },
  },
  // Include only ratings for approved reviews to compute averageRating on the frontend
  reviews: {
    where: { isApproved: true },
    select: { rating: true },
  },
  _count: { select: { reviews: true } },
};

const VARIANT_SELECTIONS_INCLUDE = {
  include: {
    selections: {
      include: {
        optionValue: {
          include: { group: true },
        },
      },
    },
  },
};

/** Для storefront — тільки активні варіанти */
const PRODUCT_RELATIONS_INCLUDE = {
  attributes: { orderBy: { sortOrder: 'asc' as const } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  reviews: {
    where: { isApproved: true },
    include: { user: { select: { name: true } } },
  },
  crossSellsFrom: {
    include: { related: { include: CARD_PRODUCT_INCLUDE } },
  },
  relationsFrom: {
    orderBy: { sortOrder: 'asc' as const },
    include: { related: { include: CARD_PRODUCT_INCLUDE } },
  },
  categoryLinks: { include: { category: true } },
  promotions: {
    include: { promotion: true },
    where: { promotion: ACTIVE_PROMOTION_WHERE },
  },
};

/** Для storefront — тільки активні варіанти */
const PRODUCT_INCLUDE = {
  category: {
    include: {
      promotions: { where: ACTIVE_PROMOTION_WHERE },
    },
  },
  optionGroups: {
    orderBy: { sortOrder: 'asc' as const },
    include: { values: { orderBy: { sortOrder: 'asc' as const } } },
  },
  variants: { where: { isActive: true, price: { gt: 0 } }, ...VARIANT_SELECTIONS_INCLUDE },
  ...PRODUCT_RELATIONS_INCLUDE,
};

/** Для адмін-панелі — всі варіанти (включно з вимкненими) */
const ADMIN_PRODUCT_INCLUDE = {
  category: true,
  optionGroups: {
    orderBy: { sortOrder: 'asc' as const },
    include: { values: { orderBy: { sortOrder: 'asc' as const } } },
  },
  variants: { ...VARIANT_SELECTIONS_INCLUDE },
  ...PRODUCT_RELATIONS_INCLUDE,
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAdminList(q?: string, limit = 200) {
    return this.prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        category: true,
        images: { where: { isMain: true }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 300),
    });
  }

  async findAll(query: ProductQueryDto) {
    const {
      categoryId,
      categorySlug,
      q,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      page = 1,
      limit = 24,
      featured,
      options,
    } = query;

    const where: Prisma.ProductWhereInput = { isActive: true };

    let resolvedCategoryIds: string[] = [];
    if (categoryId) {
      where.categoryId = categoryId;
      resolvedCategoryIds = [categoryId];
    }
    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: { include: { children: true } } },
      });
      if (cat) {
        // Collect IDs of this category + all descendants (2 levels deep)
        resolvedCategoryIds = [cat.id];
        for (const child of (cat as any).children ?? []) {
          resolvedCategoryIds.push(child.id);
          for (const grandchild of child.children ?? []) {
            resolvedCategoryIds.push(grandchild.id);
          }
        }
        where.categoryId = { in: resolvedCategoryIds };
      }
    }
    if (featured === 'true') where.isFeatured = true;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          attributes: { some: { value: { contains: q, mode: 'insensitive' } } },
        },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    // Option variant filters: product must have at least one variant satisfying ALL groups
    const parsedOptions: Record<string, string[]> = {};
    if (options) {
      try {
        const raw: unknown = JSON.parse(options);
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          for (const [key, val] of Object.entries(
            raw as Record<string, unknown>,
          )) {
            if (typeof val === 'string') parsedOptions[key] = [val];
            else if (Array.isArray(val))
              parsedOptions[key] = (val as unknown[]).map(String);
          }
        }
      } catch {
        /* ignore malformed */
      }
    }

    const optionEntries = Object.entries(parsedOptions).filter(
      ([, vals]) => vals.length > 0,
    );

    // Determine the primary browsed category and fetch inherited attribute templates
    const primaryCategoryId = categoryId || (categorySlug ? resolvedCategoryIds[0] : undefined);
    const inheritedTemplates = primaryCategoryId
      ? await this.getInheritedTemplates(primaryCategoryId)
      : [];
    const attrTemplateNames = new Set(inheritedTemplates.map((t) => t.name));

    // Split filters: variant-based vs attribute-based
    const variantOptionEntries = optionEntries.filter(([name]) => !attrTemplateNames.has(name));
    const attributeOptionEntries = optionEntries.filter(([name]) => attrTemplateNames.has(name));

    if (variantOptionEntries.length > 0) {
      where.variants = {
        some: {
          isActive: true,
          price: { gt: 0 },
          AND: variantOptionEntries.map(([groupName, values]) => ({
            selections: {
              some: {
                optionValue: {
                  value: { in: values },
                  group: { name: groupName },
                },
              },
            },
          })),
        },
      };
    }

    if (attributeOptionEntries.length > 0) {
      where.AND = attributeOptionEntries.map(([name, values]) => ({
        attributes: { some: { name, value: { in: values } } },
      })) as Prisma.ProductWhereInput[];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === 'price_asc'
        ? { basePrice: 'asc' }
        : sortBy === 'price_desc'
          ? { basePrice: 'desc' }
          : sortBy === 'popular'
            ? { reviews: { _count: 'desc' } }
            : { createdAt: 'desc' };

    const skip = (page - 1) * limit;

    const [data, total, availableFilters] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          attributes: true,
          images: { where: { isMain: true } },
          variants: {
            where: { isActive: true, price: { gt: 0 } },
            include: {
              selections: {
                include: {
                  optionValue: { include: { group: true } },
                },
              },
            },
          },
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
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
      this.buildAvailableFilters(resolvedCategoryIds, parsedOptions, minPrice, maxPrice, inheritedTemplates),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      availableFilters,
    };
  }

  private async buildAvailableFilters(
    categoryIds?: string[],
    activeOptions: Record<string, string[]> = {},
    minPrice?: number,
    maxPrice?: number,
    inheritedTemplates: { name: string; sortOrder: number }[] = [],
  ) {
    // One query: fetch all active variants (with selections) for qualifying products.
    // Then compute facets in-memory using the "exclude-self" faceted pattern:
    // for each group G, show values that still yield results when combined
    // with all OTHER currently selected groups (not G itself).
    const baseProductWhere: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryIds && categoryIds.length > 0
        ? { categoryId: { in: categoryIds } }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            basePrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const variants = await this.prisma.variant.findMany({
      where: {
        isActive: true,
        price: { gt: 0 },
        product: baseProductWhere,
      },
      include: {
        selections: {
          include: { optionValue: { include: { group: true } } },
        },
      },
    });

    // Build a map of groupName -> sortOrder from all seen groups
    const groupMeta = new Map<string, number>();
    for (const v of variants) {
      for (const sel of v.selections) {
        const gn = sel.optionValue.group.name;
        if (!groupMeta.has(gn)) {
          groupMeta.set(gn, sel.optionValue.group.sortOrder ?? 0);
        }
      }
    }

    const activeEntries = Object.entries(activeOptions).filter(
      ([, vals]) => vals.length > 0,
    );

    const filterMap = new Map<string, { sortOrder: number; counts: Map<string, number> }>();

    for (const [groupName, sortOrder] of groupMeta) {
      // For this group: match variants against all OTHER active groups
      const otherActive = activeEntries.filter(([gn]) => gn !== groupName);

      const matching = variants.filter((variant) =>
        otherActive.every(([gn, vals]) =>
          variant.selections.some(
            (sel) =>
              sel.optionValue.group.name === gn &&
              vals.includes(sel.optionValue.value),
          ),
        ),
      );

      // Count distinct products per value
      const valueCounts = new Map<string, Set<string>>();
      for (const variant of matching) {
        for (const sel of variant.selections) {
          if (sel.optionValue.group.name === groupName) {
            const v = sel.optionValue.value;
            if (!valueCounts.has(v)) valueCounts.set(v, new Set());
            valueCounts.get(v)!.add(variant.productId);
          }
        }
      }

      if (valueCounts.size > 0) {
        const counts = new Map<string, number>();
        for (const [v, productSet] of valueCounts) counts.set(v, productSet.size);
        filterMap.set(groupName, { sortOrder, counts });
      }
    }

    const variantFilters: { groupName: string; values: { value: string; count: number }[] }[] =
      Array.from(filterMap.entries())
        .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
        .map(([groupName, { counts }]) => ({
          groupName,
          values: Array.from(counts.entries()).map(([value, count]) => ({ value, count })),
        }));

    if (inheritedTemplates.length === 0) return variantFilters;

    // Attribute-based facets — skip groups already covered by variant filters
    const variantGroupNames = new Set(variantFilters.map((f) => f.groupName.toLowerCase()));

    const productIds = (
      await this.prisma.product.findMany({
        where: baseProductWhere,
        select: { id: true },
      })
    ).map((p) => p.id);

    if (productIds.length > 0) {
      const templateNames = inheritedTemplates
        .filter((t) => !variantGroupNames.has(t.name.toLowerCase()))
        .map((t) => t.name);

      if (templateNames.length > 0) {
        const attrRows = await this.prisma.attribute.groupBy({
          by: ['name', 'value'],
          where: { name: { in: templateNames }, productId: { in: productIds } },
          _count: { productId: true },
          orderBy: [{ name: 'asc' }, { value: 'asc' }],
        });

        const attrMap = new Map<string, { value: string; count: number }[]>();
        for (const row of attrRows) {
          if (!attrMap.has(row.name)) attrMap.set(row.name, []);
          attrMap.get(row.name)!.push({ value: row.value, count: row._count.productId });
        }

        const sorted = [...inheritedTemplates]
          .filter((t) => !variantGroupNames.has(t.name.toLowerCase()))
          .sort((a, b) => a.sortOrder - b.sortOrder);

        for (const tmpl of sorted) {
          const values = attrMap.get(tmpl.name);
          if (values && values.length > 0) {
            variantFilters.push({ groupName: tmpl.name, values });
          }
        }
      }
    }

    return variantFilters;
  }

  async findAdminProducts(query: ProductQueryDto) {
    const {
      categoryId,
      categoryIds,
      q,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      page = 1,
      limit = 20,
      featured,
      isActive,
    } = query;

    const where: Prisma.ProductWhereInput = {};

    const parsedCategoryIds = categoryIds
      ? categoryIds.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (parsedCategoryIds.length > 1) {
      where.categoryId = { in: parsedCategoryIds };
    } else if (parsedCategoryIds.length === 1) {
      where.categoryId = parsedCategoryIds[0];
    } else if (categoryId) {
      where.categoryId = categoryId;
    }
    if (featured === 'true') where.isFeatured = true;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          attributes: { some: { value: { contains: q, mode: 'insensitive' } } },
        },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === 'price_asc'
        ? { basePrice: 'asc' }
        : sortBy === 'price_desc'
          ? { basePrice: 'desc' }
          : sortBy === 'popular'
            ? { reviews: { _count: 'desc' } }
            : { updatedAt: 'desc' };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          attributes: true,
          images: { where: { isMain: true } },
          variants: { where: { isActive: true, price: { gt: 0 } } },
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
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE as any,
    });
    if (product) return this.enrichProduct(product);

    const variant = await this.prisma.variant.findUnique({
      where: { slug },
      include: {
        product: { include: PRODUCT_INCLUDE as any },
        selections: {
          include: {
            optionValue: { include: { group: true } },
          },
        },
      },
    });

    if (!variant) throw new NotFoundException('Product not found');

    const selectionValues = (variant.selections as any[])
      .sort(
        (a, b) => a.optionValue.group.sortOrder - b.optionValue.group.sortOrder,
      )
      .map((s) => s.optionValue.value)
      .join(' ');

    const variantTitle = [variant.product.name, selectionValues]
      .filter(Boolean)
      .join(' ')
      .trim();

    const enrichedProduct = await this.enrichProduct(variant.product);
    return {
      ...enrichedProduct,
      selectedVariantId: variant.id,
      variantSeo: {
        title: variantTitle,
        description: `${variantTitle}. Купити в Smartline з доставкою по Україні.`,
        canonicalUrl: `/product/${variant.slug}`,
      },
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE as any,
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.enrichProduct(product);
  }

  async findByIdAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: ADMIN_PRODUCT_INCLUDE as any,
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.enrichProduct(product);
  }

  async count() {
    return {
      count: await this.prisma.product.count({ where: { isActive: true } }),
    };
  }

  async getOptionGroupNames(categoryId?: string): Promise<string[]> {
    const rows = await this.prisma.productOptionGroup.groupBy({
      by: ['name'],
      where: categoryId ? { product: { is: { categoryId } } } : undefined,
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: 30,
    });
    return rows.map((r) => r.name);
  }

  async getAttributeValues(name: string, categoryId?: string): Promise<string[]> {
    const productWhere: Prisma.ProductWhereInput = categoryId ? { categoryId } : {};
    const rows = await this.prisma.attribute.groupBy({
      by: ['value'],
      where: {
        name: { equals: name, mode: 'insensitive' },
        product: { is: productWhere },
      },
      _count: { value: true },
      orderBy: { _count: { value: 'desc' } },
      take: 20,
    });
    return rows.map((r) => r.value);
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || this.toSlug(dto.name);
    const {
      variants,
      attributes,
      images,
      optionGroups,
      recommendedProductIds,
      withThisBuyProductIds,
      accessoryCategoryIds,
      recommendedCategoryId,
      withThisBuyCategoryId,
      ...rest
    } = dto as any;
    const normalizedVariants = variants || [];
    const normalizedOptionGroups = this.normalizeOptionGroups(
      optionGroups || [],
    );
    const resolvedBasePrice = this.resolveBasePrice(
      rest.basePrice,
      normalizedVariants,
    );

    const createdProduct = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...rest,
          slug,
          basePrice: resolvedBasePrice,
          stock: rest.stock ?? 0,
        },
      });

      await this.replaceProductRelations(tx, product.id, {
        productSlug: slug,
        variants: normalizedVariants,
        attributes,
        images,
        optionGroups: normalizedOptionGroups,
        recommendedProductIds,
        withThisBuyProductIds,
        accessoryCategoryIds,
        recommendedCategoryId,
        withThisBuyCategoryId,
      });

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: ADMIN_PRODUCT_INCLUDE as any,
      });
    });
    return this.enrichProduct(createdProduct);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    const {
      variants,
      attributes,
      images,
      optionGroups,
      recommendedProductIds,
      withThisBuyProductIds,
      accessoryCategoryIds,
      recommendedCategoryId,
      withThisBuyCategoryId,
      ...rest
    } = dto as any;
    const normalizedVariants = variants || [];
    const normalizedOptionGroups = this.normalizeOptionGroups(
      optionGroups || [],
    );
    const resolvedBasePrice = this.resolveBasePrice(
      rest.basePrice,
      normalizedVariants,
    );

    const updatedProduct = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id },
        select: { slug: true },
      });

      await tx.product.update({
        where: { id },
        data: {
          ...rest,
          basePrice: resolvedBasePrice,
          stock: rest.stock ?? 0,
        },
      });

      await this.replaceProductRelations(tx, id, {
        productSlug: rest.slug || product.slug,
        variants: normalizedVariants,
        attributes,
        images,
        optionGroups: normalizedOptionGroups,
        recommendedProductIds,
        withThisBuyProductIds,
        accessoryCategoryIds,
        recommendedCategoryId,
        withThisBuyCategoryId,
      });

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: ADMIN_PRODUCT_INCLUDE as any,
      });
    });
    return this.enrichProduct(updatedProduct);
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async duplicate(id: string) {
    const source = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE as any,
    });

    if (!source) throw new NotFoundException('Product not found');

    const duplicateSlug = await this.generateUniqueProductSlug(
      `${source.slug}-copy`,
    );
    const duplicateName = await this.generateCopyName(source.name);
    const duplicateSku = source.sku
      ? await this.generateCopySku(source.sku)
      : undefined;

    return this.create({
      name: duplicateName,
      slug: duplicateSlug,
      sku: duplicateSku,
      description: source.description || undefined,
      basePrice: source.basePrice ? Number(source.basePrice) : null,
      compareAtPrice: source.compareAtPrice
        ? Number(source.compareAtPrice)
        : null,
      stock: source.stock ?? 0,
      isFeatured: false,
      isActive: false,
      categoryId: source.categoryId,
      optionGroups: (source.optionGroups || []).map(
        (group: any, groupIndex: number) => ({
          name: group.name,
          sortOrder: group.sortOrder ?? groupIndex,
          values: (group.values || []).map(
            (value: any, valueIndex: number) => ({
              value: value.value,
              sortOrder: value.sortOrder ?? valueIndex,
            }),
          ),
        }),
      ),
      variants: (source.variants || []).map((variant: any, index: number) => ({
        name: variant.name,
        price: Number(variant.price),
        compareAtPrice: variant.compareAtPrice
          ? Number(variant.compareAtPrice)
          : null,
        stock: variant.stock,
        sku: variant.sku ? `${variant.sku}-copy` : undefined,
        selections: (variant.selections || []).map((selection: any) => ({
          groupName: selection.optionValue.group.name,
          value: selection.optionValue.value,
        })),
      })),
      attributes: (source.attributes || []).map(
        (attribute: any, index: number) => ({
          name: attribute.name,
          value: attribute.value,
          unit: attribute.unit || undefined,
          sortOrder: attribute.sortOrder ?? index,
        }),
      ),
      images: (source.images || []).map((image: any, index: number) => ({
        url: image.url,
        isMain: image.isMain ?? index === 0,
        sortOrder: image.sortOrder ?? index,
      })),
      recommendedProductIds: (source.relationsFrom || [])
        .filter(
          (relation: any) => relation.type === PRODUCT_RELATION_RECOMMENDED,
        )
        .map((relation: any) => relation.relatedId),
      withThisBuyProductIds: (source.relationsFrom || [])
        .filter(
          (relation: any) => relation.type === PRODUCT_RELATION_WITH_THIS_BUY,
        )
        .map((relation: any) => relation.relatedId),
      accessoryCategoryIds: (source.categoryLinks || [])
        .filter((link: any) => link.type === PRODUCT_CATEGORY_LINK_ACCESSORY)
        .map((link: any) => link.categoryId),
      recommendedCategoryId: ((source.categoryLinks || []) as any[])
        .find((link) => link.type === PRODUCT_CATEGORY_LINK_RECOMMENDED_CAT)
        ?.categoryId ?? null,
      withThisBuyCategoryId: ((source.categoryLinks || []) as any[])
        .find((link) => link.type === PRODUCT_CATEGORY_LINK_WITH_THIS_BUY_CAT)
        ?.categoryId ?? null,
    });
  }

  async addImages(
    productId: string,
    images: { url: string; isMain?: boolean }[],
  ) {
    const creates = images.map((img, i) => ({
      productId,
      url: img.url,
      isMain: img.isMain ?? i === 0,
      sortOrder: i,
    }));
    return this.prisma.productImage.createMany({ data: creates });
  }

  async setCrossSell(productId: string, relatedIds: string[]) {
    await this.prisma.crossSell.deleteMany({ where: { productId } });
    if (relatedIds.length === 0) return [];
    return this.prisma.crossSell.createMany({
      data: relatedIds.map((relatedId) => ({ productId, relatedId })),
      skipDuplicates: true,
    });
  }

  private toSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[а-яёіїєґ]/g, (char) => cyrillicMap[char] || char)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private resolveBasePrice(
    basePrice: CreateProductDto['basePrice'],
    variants: NonNullable<CreateProductDto['variants']>,
  ) {
    if (basePrice != null) return basePrice;
    if (variants.length === 0) return undefined;

    const minVariantPrice = variants.reduce<number | null>((min, variant) => {
      const price = Number(variant.price);
      if (!Number.isFinite(price)) return min;
      return min == null ? price : Math.min(min, price);
    }, null);

    return minVariantPrice ?? undefined;
  }

  private normalizeOptionGroups(
    optionGroups: NonNullable<CreateProductDto['optionGroups']>,
  ) {
    return optionGroups
      .map((group, groupIndex) => ({
        name: group.name.trim(),
        sortOrder: group.sortOrder ?? groupIndex,
        values: (group.values || [])
          .map((value, valueIndex) => ({
            value: value.value.trim(),
            sortOrder: value.sortOrder ?? valueIndex,
          }))
          .filter((value) => value.value),
      }))
      .filter((group) => group.name && group.values.length > 0);
  }

  private async replaceProductRelations(
    tx: any,
    productId: string,
    data: {
      productSlug: string;
      variants: NonNullable<CreateProductDto['variants']>;
      attributes?: CreateProductDto['attributes'];
      images?: CreateProductDto['images'];
      optionGroups: ReturnType<ProductsService['normalizeOptionGroups']>;
      recommendedProductIds?: string[];
      withThisBuyProductIds?: string[];
      accessoryCategoryIds?: string[];
      recommendedCategoryId?: string | null;
      withThisBuyCategoryId?: string | null;
    },
  ) {
    await tx.variant.deleteMany({ where: { productId } });
    await tx.attribute.deleteMany({ where: { productId } });
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productOptionGroup.deleteMany({ where: { productId } });
    await tx.productRelation.deleteMany({ where: { productId } });
    await tx.productCategoryLink.deleteMany({ where: { productId } });

    const optionValueMap = new Map<string, string>();

    for (const group of data.optionGroups) {
      const createdGroup = await tx.productOptionGroup.create({
        data: {
          productId,
          name: group.name,
          sortOrder: group.sortOrder,
        },
      });

      for (const value of group.values) {
        const createdValue = await tx.productOptionValue.create({
          data: {
            groupId: createdGroup.id,
            value: value.value,
            sortOrder: value.sortOrder,
          },
        });
        optionValueMap.set(
          this.optionKey(group.name, value.value),
          createdValue.id,
        );
      }
    }

    if (data.attributes && data.attributes.length > 0) {
      await tx.attribute.createMany({
        data: data.attributes.map((attribute, index) => ({
          productId,
          name: attribute.name,
          value: attribute.value,
          unit: attribute.unit,
          sortOrder: attribute.sortOrder ?? index,
        })),
      });
    }

    if (data.images && data.images.length > 0) {
      await tx.productImage.createMany({
        data: data.images.map((image, index) => ({
          productId,
          url: image.url,
          isMain: image.isMain ?? index === 0,
          sortOrder: image.sortOrder ?? index,
        })),
      });
    }

    for (const [index, variant] of data.variants.entries()) {
      const selections = (variant.selections || [])
        .map((selection) => ({
          groupName: selection.groupName.trim(),
          value: selection.value.trim(),
        }))
        .filter((selection) => selection.groupName && selection.value);

      const createdVariant = await tx.variant.create({
        data: {
          productId,
          name:
            variant.name?.trim() ||
            selections.map((selection) => selection.value).join(' / ') ||
            `Варіант ${index + 1}`,
          slug:
            variant.slug?.trim() ||
            this.buildVariantSlug(productId, variant, data.productSlug, index),
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          stock: variant.stock ?? 0,
          sku: variant.sku,
          isActive: variant.isActive !== false,
        },
      });

      for (const selection of selections) {
        const optionValueId = optionValueMap.get(
          this.optionKey(selection.groupName, selection.value),
        );
        if (!optionValueId) continue;
        await tx.variantOptionSelection.create({
          data: {
            variantId: createdVariant.id,
            optionValueId,
          },
        });
      }
    }

    const recommendedIds = Array.from(
      new Set((data.recommendedProductIds || []).filter(Boolean)),
    );
    const withThisBuyIds = Array.from(
      new Set((data.withThisBuyProductIds || []).filter(Boolean)),
    );
    const accessoryIds = Array.from(
      new Set((data.accessoryCategoryIds || []).filter(Boolean)),
    );

    if (recommendedIds.length > 0) {
      await tx.productRelation.createMany({
        data: recommendedIds.map((relatedId, index) => ({
          productId,
          relatedId,
          type: PRODUCT_RELATION_RECOMMENDED,
          sortOrder: index,
        })),
        skipDuplicates: true,
      });
    }

    if (withThisBuyIds.length > 0) {
      await tx.productRelation.createMany({
        data: withThisBuyIds.map((relatedId, index) => ({
          productId,
          relatedId,
          type: PRODUCT_RELATION_WITH_THIS_BUY,
          sortOrder: index,
        })),
        skipDuplicates: true,
      });
    }

    if (accessoryIds.length > 0) {
      await tx.productCategoryLink.createMany({
        data: accessoryIds.map((categoryId) => ({
          productId,
          categoryId,
          type: PRODUCT_CATEGORY_LINK_ACCESSORY,
        })),
        skipDuplicates: true,
      });
    }

    if (data.recommendedCategoryId) {
      await tx.productCategoryLink.create({
        data: { productId, categoryId: data.recommendedCategoryId, type: PRODUCT_CATEGORY_LINK_RECOMMENDED_CAT },
      });
    }

    if (data.withThisBuyCategoryId) {
      await tx.productCategoryLink.create({
        data: { productId, categoryId: data.withThisBuyCategoryId, type: PRODUCT_CATEGORY_LINK_WITH_THIS_BUY_CAT },
      });
    }
  }

  private async getInheritedTemplates(categoryId: string) {
    const templates: { name: string; sortOrder: number }[] = [];
    let currentId: string | null = categoryId;
    while (currentId) {
      const cat: { parentId: string | null; attributeTemplates: { name: string; sortOrder: number }[] } | null =
        await this.prisma.category.findUnique({
          where: { id: currentId },
          select: { parentId: true, attributeTemplates: { select: { name: true, sortOrder: true } } },
        });
      if (!cat) break;
      templates.push(...cat.attributeTemplates);
      currentId = cat.parentId;
    }
    // Deduplicate by name (child overrides parent), preserve insertion order
    const seen = new Set<string>();
    return templates.filter((t) => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });
  }

  private optionKey(groupName: string, value: string) {
    return `${groupName}::${value}`;
  }

  private buildVariantSlug(
    productId: string,
    variant: NonNullable<CreateProductDto['variants']>[number],
    productSlug: string,
    index: number,
  ) {
    const rawSuffix =
      (variant.selections || []).length > 0
        ? (variant.selections || [])
            .map((selection) => selection.value)
            .join(' ')
        : variant.name || `${productId}-${index + 1}`;

    const suffix = this.toSlug(rawSuffix);
    return suffix ? `${productSlug}-${suffix}` : `${productSlug}-${index + 1}`;
  }

  private async generateUniqueProductSlug(baseSlug: string) {
    const normalizedBase = this.toSlug(baseSlug);
    let slug = normalizedBase;
    let index = 2;

    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${normalizedBase}-${index}`;
      index += 1;
    }

    return slug;
  }

  private async generateCopyName(name: string) {
    const baseName = `${name} (копія)`;
    let candidate = baseName;
    let index = 2;

    while (
      await this.prisma.product.findFirst({ where: { name: candidate } })
    ) {
      candidate = `${baseName} ${index}`;
      index += 1;
    }

    return candidate;
  }

  private async generateCopySku(sku: string) {
    const baseSku = `${sku}-copy`;
    let candidate = baseSku;
    let index = 2;

    while (await this.prisma.product.findFirst({ where: { sku: candidate } })) {
      candidate = `${baseSku}-${index}`;
      index += 1;
    }

    return candidate;
  }

  private async enrichProduct(product: any) {
    const relations = product.relationsFrom || [];
    const categoryLinks = product.categoryLinks || [];

    const recommendedProducts = relations
      .filter((relation: any) => relation.type === PRODUCT_RELATION_RECOMMENDED)
      .map((relation: any) => relation.related);

    const withThisBuyProducts = [
      ...relations
        .filter(
          (relation: any) => relation.type === PRODUCT_RELATION_WITH_THIS_BUY,
        )
        .map((relation: any) => relation.related),
      ...(product.crossSellsFrom || []).map(
        (relation: any) => relation.related,
      ),
    ].filter(
      (related: any, index: number, array: any[]) =>
        array.findIndex((item) => item.id === related.id) === index,
    );

    const accessoryCategories = categoryLinks
      .filter((link: any) => link.type === PRODUCT_CATEGORY_LINK_ACCESSORY)
      .map((link: any) => link.category);

    const accessoryProducts =
      accessoryCategories.length > 0
        ? await this.pickAccessoryProducts(
            product.id,
            accessoryCategories.map((category: any) => category.id),
          )
        : [];

    const similarProducts = await this.pickSimilarProducts(product);

    return {
      ...product,
      recommendedProducts,
      withThisBuyProducts,
      accessoryCategories,
      accessoryProducts,
      similarProducts,
    };
  }

  private async pickAccessoryProducts(
    productId: string,
    categoryIds: string[],
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        categoryId: { in: categoryIds },
      },
      include: CARD_PRODUCT_INCLUDE as any,
      take: 24,
      orderBy: { createdAt: 'desc' },
    });

    return this.shuffle(products).slice(0, 12);
  }

  private async pickSimilarProducts(product: any) {
    const brandValue = (product.attributes || []).find((attribute: any) =>
      /бренд|виробник/i.test(attribute.name),
    )?.value;
    const candidates = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        categoryId: product.categoryId,
      },
      include: CARD_PRODUCT_INCLUDE as any,
      take: 18,
      orderBy: { createdAt: 'desc' },
    });

    if (!brandValue) {
      return this.shuffle(candidates).slice(0, 8);
    }

    const withBrandBoost = candidates.sort((a: any, b: any) => {
      const aHasBrand = (a.attributes || []).some(
        (attribute: any) =>
          /бренд|виробник/i.test(attribute.name) &&
          attribute.value === brandValue,
      );
      const bHasBrand = (b.attributes || []).some(
        (attribute: any) =>
          /бренд|виробник/i.test(attribute.name) &&
          attribute.value === brandValue,
      );
      return Number(bHasBrand) - Number(aHasBrand);
    });

    return withBrandBoost.slice(0, 8);
  }

  private shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
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
