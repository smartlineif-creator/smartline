import { PrismaClient, Variant } from '@prisma/client';

const prisma = new PrismaClient();

const cyrillicMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (char) => cyrillicMap[char] || char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function uniqueSlug(baseSlug: string, variant: Variant, usedSlugs: Set<string>, index: number) {
  const suffix = toSlug(variant.name || `${variant.id}-${index + 1}`) || `${index + 1}`;
  let candidate = `${baseSlug}-${suffix}`;
  let attempt = 2;

  while (usedSlugs.has(candidate)) {
    candidate = `${baseSlug}-${suffix}-${attempt}`;
    attempt += 1;
  }

  usedSlugs.add(candidate);
  return candidate;
}

async function main() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const existingSlugs = new Set(
    (await prisma.variant.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    }))
      .map((variant) => variant.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );

  let updated = 0;

  for (const product of products) {
    for (const [index, variant] of product.variants.entries()) {
      if (variant.slug) continue;

      const slug = uniqueSlug(product.slug, variant, existingSlugs, index);
      await prisma.variant.update({
        where: { id: variant.id },
        data: { slug },
      });
      updated += 1;
    }
  }

  console.log(`Backfilled variant slugs: ${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
