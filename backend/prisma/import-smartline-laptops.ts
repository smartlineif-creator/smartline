import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_URL = 'https://smartline.if.ua/ua/g25229246-noutbuki';
const CATEGORY_SLUG = 'noutbuky';

type SourceOffer = {
  price?: string;
  url?: string;
  availability?: string;
};

type SourceProduct = {
  name?: string;
  description?: string;
  image?: string;
  sku?: string;
  offers?: SourceOffer;
};

type ParsedListing = {
  name: string;
  description: string;
  price: number;
  images: string[];
  sku: string | null;
  sourceUrl: string;
  slug: string;
  isActive: boolean;
  attributes: Array<{ name: string; value: string; unit?: string }>;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (char) => cyrillicMap[char] || char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePrice(value?: string) {
  if (!value) return null;
  const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, 'https://smartline.if.ua').toString();
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function extractProductId(sourceUrl: string) {
  return sourceUrl.match(/\/p(\d+)-/)?.[1] ?? null;
}

function buildSlug(name: string, sourceUrl: string, sku: string | null) {
  const productId = extractProductId(sourceUrl);
  const suffix = sku?.replace(/[^\dA-Za-z]+/g, '-').toLowerCase() || productId || 'smartline';
  const base = toSlug(name);
  return `${base}-${suffix}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractAttributes(name: string) {
  const normalized = name.replace(/\u00a0/g, ' ');
  const lower = normalized.toLowerCase();
  const attributes: ParsedListing['attributes'] = [];

  const brand = normalized.match(/\b(Apple|Dell|HP|Hp|Lenovo|Asus|Acer|MSI|Gateway|Huawei|Samsung|Microsoft|Fujitsu|Toshiba)\b/i)?.[1];
  if (brand) {
    attributes.push({ name: 'Бренд', value: brand.replace(/^Hp$/, 'HP') });
  }

  const processor = normalized.match(/\b(Intel\s+Core\s+i[3579][- ]?\d+[a-z0-9]*|i[3579][- ]?\d+[a-z0-9]*|Ryzen\s*[3579](?:\s+\d+)?|AMD\s+Ryzen\s*[3579](?:\s+\d+)?|M[123](?:\s+Pro|\s+Max)?|N\d{2,4}|Pentium\s+\w+|Celeron\s+\w+)\b/i)?.[1];
  if (processor) {
    attributes.push({ name: 'Процесор', value: processor.replace(/\s+/g, ' ').trim() });
  }

  const ram = lower.match(/(\d{1,3})\s*gb\s*ddr([345])/i);
  if (ram) {
    attributes.push({ name: "Оперативна пам'ять", value: ram[1], unit: 'ГБ' });
    attributes.push({ name: "Тип пам'яті", value: `DDR${ram[2]}` });
  }

  const ssd = lower.match(/(\d{2,4})\s*gb\s*ssd/i);
  if (ssd) {
    attributes.push({ name: 'SSD', value: ssd[1], unit: 'ГБ' });
  }

  const hdd = lower.match(/(\d{2,4})\s*gb\s*hdd/i);
  if (hdd) {
    attributes.push({ name: 'HDD', value: hdd[1], unit: 'ГБ' });
  }

  const screenSize = normalized.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:["”])/);
  if (screenSize) {
    attributes.push({ name: 'Розмір екрану', value: screenSize[1].replace(',', '.'), unit: 'дюйм' });
  }

  const display = normalized.match(/\b(FullHD|QHD\+?|UHD|IPS|OLED|Touch|Сенсорний)\b/gi);
  if (display && display.length > 0) {
    attributes.push({ name: 'Дисплей', value: Array.from(new Set(display.map((item) => item.replace(/\+/g, '+').trim()))).join(', ') });
  }

  return dedupeAttributes(attributes);
}

function dedupeAttributes(attributes: ParsedListing['attributes']) {
  const seen = new Set<string>();
  return attributes.filter((attribute) => {
    const key = `${attribute.name}::${attribute.value}::${attribute.unit || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitValueAndUnit(rawValue: string) {
  const normalized = rawValue.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(.+?)\s*(дюйм|Гц|мм|кг|GB|MB|TB|ГБ|МБ|ТБ|МГц)$/i);

  if (!match) {
    return { value: normalized };
  }

  return {
    value: match[1].trim(),
    unit: match[2]
      .replace(/^GB$/i, 'ГБ')
      .replace(/^MB$/i, 'МБ')
      .replace(/^TB$/i, 'ТБ')
      .replace(/^МГц$/i, 'МГц'),
  };
}

function normalizeAttribute(name: string, rawValue: string) {
  const parsed = splitValueAndUnit(rawValue);
  let value = parsed.value;
  let unit = parsed.unit;

  if (/оперативної пам'?яті/i.test(name) && unit === 'МБ') {
    const numericValue = Number.parseFloat(value.replace(',', '.'));
    if (Number.isFinite(numericValue) && numericValue > 0 && numericValue <= 256) {
      unit = 'ГБ';
    }
  }

  if (/об'єм ssd/i.test(name) && unit === 'МБ') {
    const numericValue = Number.parseFloat(value.replace(',', '.'));
    if (Number.isFinite(numericValue) && numericValue >= 64) {
      unit = 'ГБ';
    }
  }

  return { value, unit };
}

function buildDescription(listing: ParsedListing) {
  const sourceLink = `<p><a href="${listing.sourceUrl}" target="_blank" rel="noopener noreferrer">Джерело товару</a></p>`;
  const body = listing.description.trim().startsWith('<')
    ? listing.description.trim()
    : `<p>${listing.description}</p>`;
  return `${body}${sourceLink}`;
}

function normalizeImageUrl(url: string) {
  return url.replace(/_w\d+_h\d+_/i, '_');
}

function extractFirstMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ?? null;
}

function parseDetailDescription(html: string) {
  const block = extractFirstMatch(
    html,
    /data-qaid="product_description">([\s\S]*?)<\/div><\/div><\/div><div class="b-product__social-links">/i,
  );

  if (!block) return null;
  return block.trim();
}

function parseDetailImages(html: string) {
  const imageMatches = Array.from(
    html.matchAll(/<img class="cs-image-holder__image(?: csjs-image)?"[^>]+src="([^"]+)"/gi),
  );

  return uniqueStrings(
    imageMatches.map((match) => normalizeImageUrl(absoluteUrl(decodeHtml(match[1])))),
  );
}

function parseDetailAttributes(html: string) {
  const table = extractFirstMatch(
    html,
    /<table class="b-product-info" data-qaid="characteristics_block">([\s\S]*?)<\/table>/i,
  );

  if (!table) return [];

  const rows = Array.from(
    table.matchAll(
      /<tr data-qaid="attribute_item"><td class="b-product-info__cell" data-qaid="attribute_name">([\s\S]*?)<\/td><td class="b-product-info__cell" data-qaid="attribute_value">([\s\S]*?)<\/td><\/tr>/gi,
    ),
  );

  return dedupeAttributes(
    rows.map((row) => {
      const name = decodeHtml(row[1].replace(/<[^>]+>/g, ' '));
      const rawValue = decodeHtml(row[2].replace(/<[^>]+>/g, ' '));
      const parsed = normalizeAttribute(name, rawValue);

      return {
        name,
        value: parsed.value,
        unit: parsed.unit,
      };
    }).filter((item) => item.name && item.value),
  );
}

async function fetchDetail(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; SmartLineImporter/1.0)',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product detail ${sourceUrl}: ${response.status}`);
  }

  const html = await response.text();
  return {
    descriptionHtml: parseDetailDescription(html),
    images: parseDetailImages(html),
    attributes: parseDetailAttributes(html),
  };
}

async function fetchPage(page: number) {
  const url = page === 1 ? CATEGORY_URL : `${CATEGORY_URL}/page_${page}`;
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; SmartLineImporter/1.0)',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status}`);
  }

  return response.text();
}

function extractPageCount(html: string) {
  const match = html.match(/data-pagination-pages-count="(\d+)"/);
  return match ? Number.parseInt(match[1], 10) : 1;
}

function extractProducts(html: string) {
  const matches = html.match(/<script type="application\/ld\+json">\{"@context": "http:\/\/schema\.org", "@type": "Product"[\s\S]*?<\/script>/g) || [];
  const products: SourceProduct[] = [];

  for (const match of matches) {
    const json = match
      .replace('<script type="application/ld+json">', '')
      .replace('</script>', '')
      .trim();

    try {
      const parsed = JSON.parse(json) as SourceProduct;
      if (parsed?.name && parsed?.offers?.url) {
        products.push(parsed);
      }
    } catch (error) {
      console.warn('Skipping malformed product JSON-LD block');
    }
  }

  return products;
}

function toListing(product: SourceProduct): ParsedListing | null {
  const name = decodeHtml(product.name || '');
  const description = decodeHtml(product.description || name);
  const price = parsePrice(product.offers?.price);
  const sourceUrl = absoluteUrl(product.offers?.url || '');

  if (!name || !price || !sourceUrl) return null;

  const sku = product.sku ? decodeHtml(product.sku) : null;
  const image = product.image ? normalizeImageUrl(absoluteUrl(product.image)) : null;
  const slug = buildSlug(name, sourceUrl, sku);
  const availability = product.offers?.availability || '';
  const isActive = /InStock/i.test(availability);

  return {
    name,
    description,
    price,
    images: image ? [image] : [],
    sku,
    sourceUrl,
    slug,
    isActive,
    attributes: extractAttributes(name),
  };
}

async function upsertListing(categoryId: string, listing: ParsedListing) {
  const existing = await prisma.product.findUnique({
    where: { slug: listing.slug },
    select: { id: true },
  });

  const data = {
    name: listing.name,
    slug: listing.slug,
    sku: listing.sku || undefined,
    description: buildDescription(listing),
    basePrice: listing.price,
    isFeatured: false,
    isActive: listing.isActive,
    categoryId,
  };

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data,
    });

    await prisma.attribute.deleteMany({ where: { productId: existing.id } });
    await prisma.productImage.deleteMany({ where: { productId: existing.id } });

    if (listing.attributes.length > 0) {
      await prisma.attribute.createMany({
        data: listing.attributes.map((attribute, index) => ({
          productId: existing.id,
          name: attribute.name,
          value: attribute.value,
          unit: attribute.unit,
          sortOrder: index,
        })),
      });
    }

    if (listing.images.length > 0) {
      await prisma.productImage.createMany({
        data: listing.images.map((url, index) => ({
          productId: existing.id,
          url,
          alt: `${listing.name}, фото ${index + 1}`,
          isMain: index === 0,
          sortOrder: index,
        })),
      });
    }

    return 'updated';
  }

  await prisma.product.create({
    data: {
      ...data,
      attributes: listing.attributes.length > 0
        ? {
            create: listing.attributes.map((attribute, index) => ({
              name: attribute.name,
              value: attribute.value,
              unit: attribute.unit,
              sortOrder: index,
            })),
          }
        : undefined,
      images: listing.images.length > 0
        ? {
            create: listing.images.map((url, index) => ({
              url,
              alt: `${listing.name}, фото ${index + 1}`,
              isMain: index === 0,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  return 'created';
}

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: CATEGORY_SLUG },
    select: { id: true, name: true },
  });

  if (!category) {
    throw new Error(`Category "${CATEGORY_SLUG}" not found. Create it before import.`);
  }

  const firstPageHtml = await fetchPage(1);
  const totalPages = extractPageCount(firstPageHtml);
  const seen = new Set<string>();

  let created = 0;
  let updated = 0;

  for (let page = 1; page <= totalPages; page += 1) {
    const html = page === 1 ? firstPageHtml : await fetchPage(page);
    const products = extractProducts(html)
      .map(toListing)
      .filter((item): item is ParsedListing => Boolean(item))
      .filter((item) => {
        if (seen.has(item.slug)) return false;
        seen.add(item.slug);
        return true;
      });

    console.log(`Page ${page}/${totalPages}: ${products.length} products`);

    for (const product of products) {
      try {
        const detail = await fetchDetail(product.sourceUrl);

        if (detail.descriptionHtml) {
          product.description = detail.descriptionHtml;
        }

        if (detail.images.length > 0) {
          product.images = detail.images;
        }

        if (detail.attributes.length > 0) {
          product.attributes = detail.attributes;
        }
      } catch (error) {
        console.warn(`Detail import skipped for ${product.sourceUrl}`);
      }

      const result = await upsertListing(category.id, product);
      if (result === 'created') created += 1;
      if (result === 'updated') updated += 1;
    }
  }

  console.log(`Imported laptops into "${category.name}"`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
}

const cyrillicMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
