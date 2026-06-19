import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Unsplash CDN helper
const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// ─── Helper: create option group with variants ────────────────────────────────

async function addOptionGroupWithVariants(
  productId: string,
  groups: {
    name: string;
    values: { value: string; price: number; compareAtPrice?: number; stock: number }[];
  }[],
) {
  if (!groups.length) return;

  if (groups.length === 1) {
    const g = groups[0];
    const dbGroup = await prisma.productOptionGroup.create({
      data: { productId, name: g.name, sortOrder: 0 },
    });
    for (let i = 0; i < g.values.length; i++) {
      const v = g.values[i];
      const dbVal = await prisma.productOptionValue.create({
        data: { groupId: dbGroup.id, value: v.value, sortOrder: i },
      });
      await prisma.variant.create({
        data: {
          productId,
          name: v.value,
          slug: `${productId}-v${i}`,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          isActive: true,
          selections: { create: [{ optionValueId: dbVal.id }] },
        },
      });
    }
  } else if (groups.length === 2) {
    const [g1, g2] = groups;
    const dbG1 = await prisma.productOptionGroup.create({ data: { productId, name: g1.name, sortOrder: 0 } });
    const dbG2 = await prisma.productOptionGroup.create({ data: { productId, name: g2.name, sortOrder: 1 } });

    const g1Vals = await Promise.all(
      g1.values.map((v, i) =>
        prisma.productOptionValue.create({ data: { groupId: dbG1.id, value: v.value, sortOrder: i } }),
      ),
    );
    const g2Vals = await Promise.all(
      g2.values.map((v, i) =>
        prisma.productOptionValue.create({ data: { groupId: dbG2.id, value: v.value, sortOrder: i } }),
      ),
    );

    let varIdx = 0;
    for (let i = 0; i < g1.values.length; i++) {
      for (let j = 0; j < g2.values.length; j++) {
        const price = g1.values[i].price + Math.max(0, g2.values[j].price - g2.values[0].price);
        await prisma.variant.create({
          data: {
            productId,
            name: `${g1Vals[i].value} / ${g2Vals[j].value}`,
            slug: `${productId}-v${varIdx++}`,
            price,
            stock: g1.values[i].stock,
            isActive: true,
            selections: {
              create: [
                { optionValueId: g1Vals[i].id },
                { optionValueId: g2Vals[j].id },
              ],
            },
          },
        });
      }
    }
  }
}

// ─── Helper: set cross-sells by slug ─────────────────────────────────────────

async function setCrossSells(fromSlug: string, toSlugs: string[]) {
  const from = await prisma.product.findUnique({ where: { slug: fromSlug } });
  if (!from) return;
  for (const toSlug of toSlugs) {
    const to = await prisma.product.findUnique({ where: { slug: toSlug } });
    if (!to) continue;
    await prisma.crossSell.upsert({
      where: { productId_relatedId: { productId: from.id, relatedId: to.id } },
      update: {},
      create: { productId: from.id, relatedId: to.id },
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {

  // ── Wipe demo data ────────────────────────────────────────────────────────

  await prisma.crossSell.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.attributeTemplate.deleteMany();
  await prisma.category.deleteMany();
  console.log('🗑  Wiped old data');

  // ── Admin user ────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@smartline.com.ua' },
    update: {},
    create: {
      email: 'admin@smartline.com.ua',
      password: adminPassword,
      name: 'Адміністратор',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user ready');

  // ── Categories ────────────────────────────────────────────────────────────

  const catLaptops = await prisma.category.create({
    data: {
      name: 'Ноутбуки',
      slug: 'noutbuky',
      attributeTemplates: {
        create: [
          { name: 'Процесор', sortOrder: 0 },
          { name: 'Оперативна пам\'ять', unit: 'ГБ', sortOrder: 1 },
          { name: 'Накопичувач', unit: 'ГБ', sortOrder: 2 },
          { name: 'Екран', sortOrder: 3 },
          { name: 'Відеокарта', sortOrder: 4 },
          { name: 'ОС', sortOrder: 5 },
          { name: 'Стан', sortOrder: 6 },
        ],
      },
    },
  });

  const catGaming = await prisma.category.create({
    data: {
      name: 'Ігрові ноутбуки',
      slug: 'ihrovi-noutbuky',
      parentId: catLaptops.id,
      attributeTemplates: {
        create: [
          { name: 'Процесор', sortOrder: 0 },
          { name: 'Оперативна пам\'ять', unit: 'ГБ', sortOrder: 1 },
          { name: 'Накопичувач', unit: 'ГБ', sortOrder: 2 },
          { name: 'Екран', sortOrder: 3 },
          { name: 'Відеокарта', sortOrder: 4 },
          { name: 'ОС', sortOrder: 5 },
        ],
      },
    },
  });

  const catUltra = await prisma.category.create({
    data: {
      name: 'Ультрабуки',
      slug: 'ultrabuk',
      parentId: catLaptops.id,
      attributeTemplates: {
        create: [
          { name: 'Процесор', sortOrder: 0 },
          { name: 'Оперативна пам\'ять', unit: 'ГБ', sortOrder: 1 },
          { name: 'Накопичувач', unit: 'ГБ', sortOrder: 2 },
          { name: 'Екран', sortOrder: 3 },
          { name: 'ОС', sortOrder: 4 },
          { name: 'Стан', sortOrder: 5 },
        ],
      },
    },
  });

  const catPeriphery = await prisma.category.create({
    data: { name: 'Периферія', slug: 'peryferiia' },
  });

  const catMice = await prisma.category.create({
    data: {
      name: 'Миші',
      slug: 'myshi',
      parentId: catPeriphery.id,
      attributeTemplates: {
        create: [
          { name: 'Тип підключення', sortOrder: 0 },
          { name: 'DPI', sortOrder: 1 },
          { name: 'Бренд', sortOrder: 2 },
        ],
      },
    },
  });

  const catKeyboards = await prisma.category.create({
    data: {
      name: 'Клавіатури',
      slug: 'klaviatury',
      parentId: catPeriphery.id,
      attributeTemplates: {
        create: [
          { name: 'Тип підключення', sortOrder: 0 },
          { name: 'Тип перемикачів', sortOrder: 1 },
          { name: 'Підсвітка', sortOrder: 2 },
          { name: 'Розкладка', sortOrder: 3 },
          { name: 'Бренд', sortOrder: 4 },
        ],
      },
    },
  });

  const catHeadphones = await prisma.category.create({
    data: {
      name: 'Навушники',
      slug: 'navushnyky',
      parentId: catPeriphery.id,
      attributeTemplates: {
        create: [
          { name: 'Тип', sortOrder: 0 },
          { name: 'Тип підключення', sortOrder: 1 },
          { name: 'ANC', sortOrder: 2 },
          { name: 'Бренд', sortOrder: 3 },
        ],
      },
    },
  });

  const catPhones = await prisma.category.create({
    data: { name: 'Смартфони', slug: 'smartfony' },
  });

  const catIphone = await prisma.category.create({
    data: {
      name: 'iPhone',
      slug: 'iphone',
      parentId: catPhones.id,
      attributeTemplates: {
        create: [
          { name: 'Чіп', sortOrder: 0 },
          { name: 'Накопичувач', unit: 'ГБ', sortOrder: 1 },
          { name: 'Екран', sortOrder: 2 },
          { name: 'ОС', sortOrder: 3 },
        ],
      },
    },
  });

  const catAndroid = await prisma.category.create({
    data: {
      name: 'Android',
      slug: 'android',
      parentId: catPhones.id,
      attributeTemplates: {
        create: [
          { name: 'Процесор', sortOrder: 0 },
          { name: 'Оперативна пам\'ять', unit: 'ГБ', sortOrder: 1 },
          { name: 'Накопичувач', unit: 'ГБ', sortOrder: 2 },
          { name: 'Екран', sortOrder: 3 },
          { name: 'ОС', sortOrder: 4 },
        ],
      },
    },
  });

  console.log('✅ Categories created (9)');

  // ── LAPTOPS — general ─────────────────────────────────────────────────────

  const lenovo = await prisma.product.create({
    data: {
      name: 'Lenovo IdeaPad 3 15IAU7',
      slug: 'lenovo-ideapad-3-15iau7',
      sku: 'LEN-IP3-15IAU7',
      description: '<p>Надійний ноутбук для щоденних задач і навчання. Процесор Intel Core i5-1235U забезпечує плавну роботу в офісних застосунках, браузері та медіа. IPS-матриця з кутами огляду 178° дає комфортний перегляд.</p><ul><li>Швидкий SSD 512 ГБ — запуск Windows за 10 секунд</li><li>Акумулятор 45 Вт·год — до 7 годин автономної роботи</li><li>Wi-Fi 6, Bluetooth 5.1</li></ul>',
      basePrice: 18990,
      isFeatured: true,
      isActive: true,
      stock: 0,
      categoryId: catLaptops.id,
      images: {
        create: [
          { url: img('1496181133206-80ce9b88a853'), isMain: true,  sortOrder: 0 },
          { url: img('1541807084-5c52b6b3adef'), isMain: false, sortOrder: 1 },
          { url: img('1484788984921-03950022c38b'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'Intel Core i5-1235U',     sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '8',   unit: 'ГБ',         sortOrder: 1 },
          { name: 'Накопичувач',        value: '512', unit: 'ГБ',          sortOrder: 2 },
          { name: 'Екран',              value: '15.6" IPS 1920×1080',     sortOrder: 3 },
          { name: 'Відеокарта',         value: 'Intel Iris Xe Graphics',  sortOrder: 4 },
          { name: 'ОС',                 value: 'Windows 11 Home',          sortOrder: 5 },
          { name: 'Стан',               value: 'Новий',                    sortOrder: 6 },
        ],
      },
    },
  });

  await addOptionGroupWithVariants(lenovo.id, [
    {
      name: 'Оперативна пам\'ять',
      values: [
        { value: '8 ГБ',  price: 18990, stock: 5 },
        { value: '16 ГБ', price: 23490, stock: 3 },
      ],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'ASUS VivoBook 15 X1502',
      slug: 'asus-vivobook-15-x1502',
      sku: 'ASUS-VB15-X1502',
      description: '<p>Тонкий та легкий ноутбук з AMD Ryzen 5 та яскравою матрицею. Стильний дизайн Quiet Blue підкреслює індивідуальність.</p><ul><li>AMD Ryzen 5 5500U — 6 ядер до 4.0 ГГц</li><li>16 ГБ DDR4 — комфортна багатозадачність</li><li>Клавіатура з підсвічуванням</li></ul>',
      basePrice: 16490,
      compareAtPrice: 19990,
      isFeatured: true,
      isActive: true,
      stock: 4,
      categoryId: catLaptops.id,
      images: {
        create: [
          { url: img('1544717305-2702b0897b71'), isMain: true,  sortOrder: 0 },
          { url: img('1525547719571-a2d4ac8945e2'), isMain: false, sortOrder: 1 },
          { url: img('1496181133206-80ce9b88a853'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'AMD Ryzen 5 5500U', sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '16', unit: 'ГБ',   sortOrder: 1 },
          { name: 'Накопичувач',        value: '256', unit: 'ГБ',   sortOrder: 2 },
          { name: 'Екран',              value: '15.6" IPS 1920×1080', sortOrder: 3 },
          { name: 'ОС',                 value: 'Windows 11 Home',   sortOrder: 5 },
          { name: 'Стан',               value: 'Відновлений',       sortOrder: 6 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  const hp = await prisma.product.create({
    data: {
      name: 'HP Pavilion 15-eg3',
      slug: 'hp-pavilion-15-eg3',
      sku: 'HP-PAV15-EG3',
      description: '<p>HP Pavilion 15 з дискретною NVIDIA RTX 2050 — ідеальний баланс продуктивності та ціни. Для роботи в Adobe, легкого гейму та стрімінгу.</p><ul><li>Intel Core i7-1355U — 10-ядерний</li><li>NVIDIA GeForce RTX 2050 4 ГБ GDDR6</li><li>Дисплей 144 Гц для плавного відображення</li></ul>',
      basePrice: 29990,
      isFeatured: false,
      isActive: true,
      stock: 0,
      categoryId: catLaptops.id,
      images: {
        create: [
          { url: img('1593642632559-0c6d3fc62b89'), isMain: true,  sortOrder: 0 },
          { url: img('1484788984921-03950022c38b'), isMain: false, sortOrder: 1 },
          { url: img('1541807084-5c52b6b3adef'),    isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'Intel Core i7-1355U',         sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '16', unit: 'ГБ',             sortOrder: 1 },
          { name: 'Накопичувач',        value: '512', unit: 'ГБ',             sortOrder: 2 },
          { name: 'Екран',              value: '15.6" IPS 144 Гц 1920×1080', sortOrder: 3 },
          { name: 'Відеокарта',         value: 'NVIDIA GeForce RTX 2050',     sortOrder: 4 },
          { name: 'ОС',                 value: 'Windows 11 Home',              sortOrder: 5 },
          { name: 'Стан',               value: 'Новий',                        sortOrder: 6 },
        ],
      },
    },
  });

  await addOptionGroupWithVariants(hp.id, [
    {
      name: 'Оперативна пам\'ять',
      values: [
        { value: '16 ГБ', price: 29990, stock: 4 },
        { value: '32 ГБ', price: 35490, stock: 2 },
      ],
    },
    {
      name: 'Накопичувач',
      values: [
        { value: '512 ГБ', price: 29990, stock: 4 },
        { value: '1 ТБ',   price: 33490, stock: 2 },
      ],
    },
  ]);

  // ── GAMING LAPTOPS ────────────────────────────────────────────────────────

  const rog = await prisma.product.create({
    data: {
      name: 'ASUS ROG Strix G15',
      slug: 'asus-rog-strix-g15',
      sku: 'ASUS-ROG-G15-2023',
      description: '<p>Флагманський ігровий ноутбук ASUS ROG Strix G15 з RTX 4070 — для максимальної продуктивності у AAA-іграх та 3D-рендерингу.</p><ul><li>AMD Ryzen 9 7945HX — 16 ядер, найпотужніший мобільний процесор</li><li>NVIDIA GeForce RTX 4070 8 ГБ — 1080p та 1440p Ultra без компромісів</li><li>240 Гц QHD дисплей — кожен кадр чіткий та плавний</li><li>ROG Aura RGB-підсвітка з ефектами</li></ul>',
      basePrice: 59990,
      isFeatured: true,
      isActive: true,
      stock: 0,
      categoryId: catGaming.id,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      images: {
        create: [
          { url: img('1603302576837-37561b2e2302'), isMain: true,  sortOrder: 0 },
          { url: img('1593640495253-23196b27a87f'), isMain: false, sortOrder: 1 },
          { url: img('1542393545-10f5a40f3b68'),   isMain: false, sortOrder: 2 },
          { url: img('1496181133206-80ce9b88a853'), isMain: false, sortOrder: 3 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'AMD Ryzen 9 7945HX',           sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '16', unit: 'ГБ',             sortOrder: 1 },
          { name: 'Накопичувач',        value: '1000', unit: 'ГБ',            sortOrder: 2 },
          { name: 'Екран',              value: '15.6" QHD 240 Гц 2560×1440', sortOrder: 3 },
          { name: 'Відеокарта',         value: 'NVIDIA GeForce RTX 4070',     sortOrder: 4 },
          { name: 'ОС',                 value: 'Windows 11 Home',              sortOrder: 5 },
        ],
      },
    },
  });

  await addOptionGroupWithVariants(rog.id, [
    {
      name: 'Оперативна пам\'ять',
      values: [
        { value: '16 ГБ', price: 59990, stock: 3 },
        { value: '32 ГБ', price: 69990, stock: 2 },
      ],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'MSI Katana 15 B12VEK',
      slug: 'msi-katana-15-b12vek',
      sku: 'MSI-KAT15-B12VEK',
      description: '<p>MSI Katana 15 — ігровий ноутбук з GeForce RTX 4050 та Intel Core i7 12-го покоління. Cooler Boost 5 тримає температури під контролем навіть під тривалим навантаженням.</p><ul><li>Intel Core i7-12650H — 10 ядер (6P+4E)</li><li>RTX 4050 6 ГБ GDDR6</li><li>IPS 144 Гц</li></ul>',
      basePrice: 42990,
      compareAtPrice: 47990,
      isFeatured: false,
      isActive: true,
      stock: 5,
      categoryId: catGaming.id,
      images: {
        create: [
          { url: img('1542393545-10f5a40f3b68'),   isMain: true,  sortOrder: 0 },
          { url: img('1603302576837-37561b2e2302'), isMain: false, sortOrder: 1 },
          { url: img('1593640495253-23196b27a87f'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'Intel Core i7-12650H',         sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '16', unit: 'ГБ',             sortOrder: 1 },
          { name: 'Накопичувач',        value: '512', unit: 'ГБ',             sortOrder: 2 },
          { name: 'Екран',              value: '15.6" IPS 144 Гц 1920×1080', sortOrder: 3 },
          { name: 'Відеокарта',         value: 'NVIDIA GeForce RTX 4050',     sortOrder: 4 },
          { name: 'ОС',                 value: 'Windows 11 Home',              sortOrder: 5 },
        ],
      },
    },
  });

  // ── ULTRABOOKS ────────────────────────────────────────────────────────────

  const macbook = await prisma.product.create({
    data: {
      name: 'Apple MacBook Air 13" M2',
      slug: 'apple-macbook-air-13-m2',
      sku: 'APL-MBA13-M2-256',
      description: '<p>MacBook Air на чіпі M2 — найтонший MacBook в історії. Продуктивність без вентилятора: працює безшумно навіть під навантаженням.</p><ul><li>Чіп Apple M2 — 8-ядерний CPU та 8-ядерний GPU</li><li>Liquid Retina 13.6" 2560×1664</li><li>До 18 годин автономної роботи</li><li>MagSafe 3</li></ul>',
      basePrice: 47990,
      isFeatured: true,
      isActive: true,
      stock: 0,
      categoryId: catUltra.id,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      images: {
        create: [
          { url: img('1517336714731-489689fd1ca8'), isMain: true,  sortOrder: 0 },
          { url: img('1611532736597-de2d4265fba3'), isMain: false, sortOrder: 1 },
          { url: img('1525547719571-a2d4ac8945e2'), isMain: false, sortOrder: 2 },
          { url: img('1484788984921-03950022c38b'), isMain: false, sortOrder: 3 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'Apple M2 8-core CPU',         sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '8', unit: 'ГБ',             sortOrder: 1 },
          { name: 'Накопичувач',        value: '256', unit: 'ГБ',            sortOrder: 2 },
          { name: 'Екран',              value: '13.6" Liquid Retina 2560×1664', sortOrder: 3 },
          { name: 'ОС',                 value: 'macOS Sonoma',                sortOrder: 4 },
          { name: 'Стан',               value: 'Новий',                       sortOrder: 5 },
        ],
      },
    },
  });

  await addOptionGroupWithVariants(macbook.id, [
    {
      name: 'Накопичувач',
      values: [
        { value: '256 ГБ', price: 47990, stock: 4 },
        { value: '512 ГБ', price: 55990, stock: 3 },
        { value: '1 ТБ',   price: 67990, stock: 1 },
      ],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'Dell XPS 13 Plus 9320',
      slug: 'dell-xps-13-plus-9320',
      sku: 'DELL-XPS13-9320',
      description: '<p>Dell XPS 13 Plus — вершина ультрабукового дизайну. Алюмінієвий корпус, сенсорний F-ряд та OLED-дисплей з мільярдами кольорів.</p><ul><li>Intel Core i7-1260P — 12 ядер</li><li>OLED 13.4" 3456×2160</li><li>Клавіатура без зазорів</li><li>Thunderbolt 4 (x2)</li></ul>',
      basePrice: 52990,
      isFeatured: false,
      isActive: true,
      stock: 2,
      categoryId: catUltra.id,
      images: {
        create: [
          { url: img('1611532736597-de2d4265fba3'), isMain: true,  sortOrder: 0 },
          { url: img('1517336714731-489689fd1ca8'), isMain: false, sortOrder: 1 },
          { url: img('1541807084-5c52b6b3adef'),   isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'Intel Core i7-1260P',  sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '16', unit: 'ГБ',     sortOrder: 1 },
          { name: 'Накопичувач',        value: '512', unit: 'ГБ',     sortOrder: 2 },
          { name: 'Екран',              value: '13.4" OLED 3456×2160', sortOrder: 3 },
          { name: 'ОС',                 value: 'Windows 11 Pro',       sortOrder: 4 },
          { name: 'Стан',               value: 'Новий',                sortOrder: 5 },
        ],
      },
    },
  });

  console.log('✅ Laptops created (6)');

  // ── MICE ──────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'Logitech M185',
      slug: 'logitech-m185',
      sku: 'LOG-M185-GR',
      description: '<p>Компактна бездротова миша Logitech M185 — надійний вибір для офісу. Plug-and-play, акумулятор AA на 12 місяців роботи.</p>',
      basePrice: 499,
      isActive: true,
      stock: 12,
      categoryId: catMice.id,
      images: {
        create: [
          { url: img('1527864550417-7fd91fc51a46'), isMain: true,  sortOrder: 0 },
          { url: img('1585771724684-38269d6639fd'), isMain: false, sortOrder: 1 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип підключення', value: 'Бездротова (2.4 ГГц)', sortOrder: 0 },
          { name: 'DPI',             value: '1000',                  sortOrder: 1 },
          { name: 'Бренд',           value: 'Logitech',              sortOrder: 2 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'A4Tech OP-330 USB',
      slug: 'a4tech-op-330',
      sku: 'A4-OP330-BK',
      description: '<p>Класична дротова оптична миша A4Tech. 1600 DPI, USB, сумісна з будь-якою ОС.</p>',
      basePrice: 199,
      isActive: true,
      stock: 20,
      categoryId: catMice.id,
      images: {
        create: [
          { url: img('1527864550417-7fd91fc51a46'), isMain: true, sortOrder: 0 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип підключення', value: 'USB',      sortOrder: 0 },
          { name: 'DPI',             value: '1600',      sortOrder: 1 },
          { name: 'Бренд',           value: 'A4Tech',   sortOrder: 2 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'Logitech MX Master 3S',
      slug: 'logitech-mx-master-3s',
      sku: 'LOG-MX-M3S-BK',
      description: '<p>Logitech MX Master 3S — еталон ергономічної бездротової миші. Тихі кліки, колесо MagSpeed та 8000 DPI сенсор.</p><ul><li>Bluetooth + USB Logi Bolt</li><li>До 70 днів від одного заряджання</li><li>Logitech Flow — робота на 3 пристроях</li></ul>',
      basePrice: 3290,
      isFeatured: true,
      isActive: true,
      stock: 8,
      categoryId: catMice.id,
      images: {
        create: [
          { url: img('1615663245857-ac93bb7c39e7'), isMain: true,  sortOrder: 0 },
          { url: img('1527864550417-7fd91fc51a46'), isMain: false, sortOrder: 1 },
          { url: img('1585771724684-38269d6639fd'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип підключення', value: 'Bluetooth / USB Bolt', sortOrder: 0 },
          { name: 'DPI',             value: '8000',                  sortOrder: 1 },
          { name: 'Бренд',           value: 'Logitech',              sortOrder: 2 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'Razer DeathAdder V3',
      slug: 'razer-deathadder-v3',
      sku: 'RAZ-DAV3-BK',
      description: '<p>Razer DeathAdder V3 — легендарна ігрова миша. Ультралегка 59 г, Focus Pro 30K сенсор, Razer Optical Switches 3-го покоління.</p><ul><li>30 000 DPI із відстеженням до 750 IPS</li><li>Ергономічний правосторонній дизайн</li><li>USB-C Speedflex кабель</li></ul>',
      basePrice: 2890,
      isActive: true,
      stock: 6,
      categoryId: catMice.id,
      images: {
        create: [
          { url: img('1615663245857-ac93bb7c39e7'), isMain: true,  sortOrder: 0 },
          { url: img('1527864550417-7fd91fc51a46'), isMain: false, sortOrder: 1 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип підключення', value: 'USB-C',   sortOrder: 0 },
          { name: 'DPI',             value: '30000',    sortOrder: 1 },
          { name: 'Бренд',           value: 'Razer',   sortOrder: 2 },
        ],
      },
    },
  });

  console.log('✅ Mice created (4)');

  // ── KEYBOARDS ─────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'Keychron K2 Pro',
      slug: 'keychron-k2-pro',
      sku: 'KEY-K2PRO-RGB-RED',
      description: '<p>Keychron K2 Pro — компактна 75% механічна клавіатура з алюмінієвим корпусом, QMK/VIA та багатоплатформним підключенням. Хотсвоп-сокети — змінюй перемикачі без паяння.</p><ul><li>Bluetooth 5.1 або USB-C</li><li>Gateron Pro Red (лінійні, тихі)</li><li>Сумісна з macOS та Windows</li></ul>',
      basePrice: 3490,
      isFeatured: true,
      isActive: true,
      stock: 6,
      categoryId: catKeyboards.id,
      images: {
        create: [
          { url: img('1541140532154-b024d705b90a'), isMain: true,  sortOrder: 0 },
          { url: img('1618384887929-16ec8b57f14b'), isMain: false, sortOrder: 1 },
          { url: img('1587829741301-dc798b83add3'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип підключення',   value: 'USB-C / Bluetooth',          sortOrder: 0 },
          { name: 'Тип перемикачів',   value: 'Механічні Gateron Pro Red',  sortOrder: 1 },
          { name: 'Підсвітка',         value: 'RGB',                         sortOrder: 2 },
          { name: 'Розкладка',         value: 'UA/EN',                       sortOrder: 3 },
          { name: 'Бренд',             value: 'Keychron',                    sortOrder: 4 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  await prisma.product.create({
    data: {
      name: 'Logitech MK470 Slim Wireless',
      slug: 'logitech-mk470-slim',
      sku: 'LOG-MK470-GR',
      description: '<p>Logitech MK470 — бездротовий комплект із безшумними клавішами та ультратонким профілем. Один нано-приймач для обох пристроїв, до 36 місяців без заміни батарей.</p>',
      basePrice: 1290,
      isActive: true,
      stock: 10,
      categoryId: catKeyboards.id,
      images: {
        create: [
          { url: img('1587829741301-dc798b83add3'), isMain: true,  sortOrder: 0 },
          { url: img('1541140532154-b024d705b90a'), isMain: false, sortOrder: 1 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип підключення', value: 'Бездротова (2.4 ГГц)', sortOrder: 0 },
          { name: 'Тип перемикачів', value: 'Мембранні',             sortOrder: 1 },
          { name: 'Підсвітка',       value: 'Без підсвітки',          sortOrder: 2 },
          { name: 'Розкладка',       value: 'UA/EN',                  sortOrder: 3 },
          { name: 'Бренд',           value: 'Logitech',               sortOrder: 4 },
        ],
      },
    },
  });

  console.log('✅ Keyboards created (2)');

  // ── HEADPHONES ────────────────────────────────────────────────────────────

  const sony = await prisma.product.create({
    data: {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      sku: 'SON-WH1000XM5-BK',
      description: '<p>Sony WH-1000XM5 — кращі навушники з активним шумопоглинанням. 8 мікрофонів, QN1e HD та Bluetooth 5.2 для бездоганного звуку.</p><ul><li>30 годин з ANC</li><li>3 хвилини заряджання = 3 години роботи</li><li>LDAC Hi-Res Audio</li><li>Мультипідключення до 2 пристроїв</li></ul>',
      basePrice: 8990,
      isFeatured: true,
      isActive: true,
      stock: 7,
      categoryId: catHeadphones.id,
      images: {
        create: [
          { url: img('1505740420928-5e560c06d30e'), isMain: true,  sortOrder: 0 },
          { url: img('1484704849700-f032a568e944'), isMain: false, sortOrder: 1 },
          { url: img('1583394293253-7b8b1f7d7e5e'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип',             value: 'Повнорозмірні (over-ear)',    sortOrder: 0 },
          { name: 'Тип підключення', value: 'Bluetooth 5.2 / 3.5 мм',     sortOrder: 1 },
          { name: 'ANC',             value: 'Так',                          sortOrder: 2 },
          { name: 'Бренд',           value: 'Sony',                         sortOrder: 3 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  const hyperx = await prisma.product.create({
    data: {
      name: 'HyperX Cloud III Gaming',
      slug: 'hyperx-cloud-iii',
      sku: 'HPX-CLOUD3-BK',
      description: '<p>HyperX Cloud III — флагманська ігрова гарнітура з 53-мм драйверами та DTS Headphone:X Spatial Audio. Алюмінієвий каркас і шкіряні амбушюри для комфорту при тривалих сесіях.</p><ul><li>Мікрофон 16-bit/48kHz</li><li>7.1 об\'ємний звук через USB</li><li>PC, PS4/5, Xbox</li></ul>',
      basePrice: 3890,
      isActive: true,
      stock: 9,
      categoryId: catHeadphones.id,
      images: {
        create: [
          { url: img('1484704849700-f032a568e944'), isMain: true,  sortOrder: 0 },
          { url: img('1505740420928-5e560c06d30e'), isMain: false, sortOrder: 1 },
        ],
      },
      attributes: {
        create: [
          { name: 'Тип',             value: 'Повнорозмірні (over-ear)', sortOrder: 0 },
          { name: 'Тип підключення', value: 'USB-A / 3.5 мм',          sortOrder: 1 },
          { name: 'ANC',             value: 'Ні',                        sortOrder: 2 },
          { name: 'Бренд',           value: 'HyperX',                   sortOrder: 3 },
        ],
      },
    },
  });

  console.log('✅ Headphones created (2)');

  // ── SMARTPHONES ───────────────────────────────────────────────────────────

  const iphone = await prisma.product.create({
    data: {
      name: 'Apple iPhone 15 Pro',
      slug: 'apple-iphone-15-pro',
      sku: 'APL-IP15P-256-BLK',
      description: '<p>iPhone 15 Pro — перший iPhone з титановим корпусом та кнопкою Action. Чіп A17 Pro на 3 нм — найпотужніший мобільний чіп у світі.</p><ul><li>Система 3 камер: 48 МП основна + 12 МП ультраширока + 12 МП телефото 3×</li><li>USB-C з USB 3 (до 10 Гбіт/с)</li><li>ProMotion 120 Гц OLED Super Retina XDR</li></ul>',
      basePrice: 44990,
      isFeatured: true,
      isActive: true,
      stock: 0,
      categoryId: catIphone.id,
      images: {
        create: [
          { url: img('1510557880182-3d4d3cba35a5'), isMain: true,  sortOrder: 0 },
          { url: img('1592899677977-9c10002761d2'), isMain: false, sortOrder: 1 },
          { url: img('1632661674596-df8be070a5c5'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Чіп',        value: 'Apple A17 Pro',                sortOrder: 0 },
          { name: 'Накопичувач', value: '256', unit: 'ГБ',             sortOrder: 1 },
          { name: 'Екран',      value: '6.1" OLED 2556×1179 120 Гц', sortOrder: 2 },
          { name: 'ОС',         value: 'iOS 17',                       sortOrder: 3 },
        ],
      },
    },
  });

  await addOptionGroupWithVariants(iphone.id, [
    {
      name: 'Накопичувач',
      values: [
        { value: '128 ГБ', price: 39990, stock: 5 },
        { value: '256 ГБ', price: 44990, stock: 4 },
        { value: '512 ГБ', price: 54990, stock: 2 },
        { value: '1 ТБ',   price: 64990, stock: 1 },
      ],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────

  const samsung = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      sku: 'SAM-GS24U-256-BLK',
      description: '<p>Samsung Galaxy S24 Ultra — флагман із вбудованим S Pen та Snapdragon 8 Gen 3. Квадрокамера 200 МП з 10-кратним оптичним зумом.</p><ul><li>6.8" Dynamic AMOLED 2X 120 Гц</li><li>Акумулятор 5000 мА·год, 45 Вт</li><li>Galaxy AI — живий переклад та підсумок дзвінків</li></ul>',
      basePrice: 52990,
      isFeatured: true,
      isActive: true,
      stock: 0,
      categoryId: catAndroid.id,
      images: {
        create: [
          { url: img('1610945265064-0e34e5519bbf'), isMain: true,  sortOrder: 0 },
          { url: img('1580910051074-3eb694886505'), isMain: false, sortOrder: 1 },
          { url: img('1592899677977-9c10002761d2'), isMain: false, sortOrder: 2 },
        ],
      },
      attributes: {
        create: [
          { name: 'Процесор',           value: 'Snapdragon 8 Gen 3',             sortOrder: 0 },
          { name: 'Оперативна пам\'ять', value: '12', unit: 'ГБ',               sortOrder: 1 },
          { name: 'Накопичувач',        value: '256', unit: 'ГБ',               sortOrder: 2 },
          { name: 'Екран',              value: '6.8" Dynamic AMOLED 2X 120 Гц', sortOrder: 3 },
          { name: 'ОС',                 value: 'Android 14 / One UI 6',          sortOrder: 4 },
        ],
      },
    },
  });

  await addOptionGroupWithVariants(samsung.id, [
    {
      name: 'Накопичувач',
      values: [
        { value: '256 ГБ', price: 52990, stock: 4 },
        { value: '512 ГБ', price: 59990, stock: 2 },
        { value: '1 ТБ',   price: 69990, stock: 1 },
      ],
    },
  ]);

  console.log('✅ Smartphones created (2)');

  // ── CROSS-SELLS ───────────────────────────────────────────────────────────

  await setCrossSells('lenovo-ideapad-3-15iau7',  ['logitech-m185',       'logitech-mk470-slim', 'hyperx-cloud-iii']);
  await setCrossSells('asus-vivobook-15-x1502',   ['logitech-m185',       'keychron-k2-pro']);
  await setCrossSells('hp-pavilion-15-eg3',        ['logitech-mx-master-3s', 'keychron-k2-pro', 'hyperx-cloud-iii']);
  await setCrossSells('asus-rog-strix-g15',        ['razer-deathadder-v3', 'hyperx-cloud-iii', 'keychron-k2-pro']);
  await setCrossSells('msi-katana-15-b12vek',      ['razer-deathadder-v3', 'hyperx-cloud-iii']);
  await setCrossSells('apple-macbook-air-13-m2',   ['logitech-mx-master-3s', 'keychron-k2-pro', 'sony-wh-1000xm5']);
  await setCrossSells('dell-xps-13-plus-9320',     ['logitech-mx-master-3s', 'keychron-k2-pro', 'sony-wh-1000xm5']);
  await setCrossSells('apple-iphone-15-pro',       ['sony-wh-1000xm5',    'hyperx-cloud-iii']);
  await setCrossSells('samsung-galaxy-s24-ultra',  ['sony-wh-1000xm5']);
  await setCrossSells('razer-deathadder-v3',       ['hyperx-cloud-iii',   'keychron-k2-pro']);
  await setCrossSells('keychron-k2-pro',           ['logitech-mx-master-3s', 'hyperx-cloud-iii']);

  console.log('✅ Cross-sells set');

  // ── BANNERS ───────────────────────────────────────────────────────────────

  await prisma.banner.createMany({
    data: [
      {
        title: 'MacBook Air M2 — тепер зі знижкою',
        imageUrl: img('1517336714731-489689fd1ca8', 1400),
        link: '/catalog/noutbuky/ultrabuk',
        position: 'home',
        sortOrder: 0,
      },
      {
        title: 'Ігрові ноутбуки — нова колекція',
        imageUrl: img('1603302576837-37561b2e2302', 1400),
        link: '/catalog/noutbuky/ihrovi-noutbuky',
        position: 'home',
        sortOrder: 1,
      },
    ],
  });

  console.log('✅ Banners created');
  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('✅  Seed completed!');
  console.log('──────────────────────────────────────────────────────────────');
  console.log('Admin:      admin@smartline.com.ua / admin123');
  console.log('Categories: Ноутбуки → Ігрові / Ультрабуки');
  console.log('            Периферія → Миші / Клавіатури / Навушники');
  console.log('            Смартфони → iPhone / Android');
  console.log('Products:   6 ноутбуки · 4 миші · 2 клавіатури');
  console.log('            2 навушники · 2 смартфони  =  16 товарів');
  console.log('Videos:     ASUS ROG Strix, MacBook Air M2');
  console.log('Cross-sells: задані для всіх ноутбуків та периферії');
  console.log('──────────────────────────────────────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
