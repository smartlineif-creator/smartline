/**
 * Full demo seed: categories + subcategories + products + images + variants
 * Run from /backend: npx ts-node --transpile-only prisma/seed_full.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Transliteration helper
function sl(str: string) {
  return str
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (c) => {
      const m: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',
        и:'y',і:'i',ї:'yi',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',
        р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',
        щ:'shch',ь:'',ю:'iu',я:'ia',ё:'io',
      };
      return m[c] || c;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Unsplash image helper
function img(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=800&q=80&auto=format&fit=crop`;
}

async function upsertCategory(data: {
  name: string; slug: string; parentId?: string; icon?: string;
}) {
  return prisma.category.upsert({
    where: { slug: data.slug },
    update: { name: data.name, icon: data.icon },
    create: data,
  });
}

async function createProduct(data: {
  name: string; slug: string; description: string;
  basePrice: number; compareAtPrice?: number;
  categoryId: string; isFeatured?: boolean;
  images: string[]; // array of URLs, first is main
}) {
  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) {
    await prisma.productImage.deleteMany({ where: { productId: existing.id } });
    await prisma.variant.deleteMany({ where: { productId: existing.id } });
    await prisma.productOptionGroup.deleteMany({ where: { productId: existing.id } });
    await prisma.product.delete({ where: { id: existing.id } });
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice,
      categoryId: data.categoryId,
      isFeatured: data.isFeatured ?? false,
      isActive: true,
    },
  });

  await prisma.productImage.createMany({
    data: data.images.map((url, i) => ({
      productId: product.id,
      url,
      isMain: i === 0,
      sortOrder: i,
    })),
  });

  return product;
}

async function createVariantWithSelections(
  productId: string,
  name: string,
  slug: string,
  price: number,
  stock: number,
  optionValueIds: string[],
  compareAtPrice?: number,
) {
  const existing = await prisma.variant.findUnique({ where: { slug } });
  if (existing) return existing;

  const v = await prisma.variant.create({
    data: { productId, name, slug, price, stock, ...(compareAtPrice ? { compareAtPrice } : {}) },
  });
  if (optionValueIds.length > 0) {
    await prisma.variantOptionSelection.createMany({
      data: optionValueIds.map((optionValueId) => ({ variantId: v.id, optionValueId })),
    });
  }
  return v;
}

async function addOptionGroups(
  productId: string,
  groups: Array<{ name: string; values: string[] }>,
): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const group = await prisma.productOptionGroup.create({
      data: { productId, name: g.name, sortOrder: gi },
    });
    result[g.name] = {};
    for (let vi = 0; vi < g.values.length; vi++) {
      const ov = await prisma.productOptionValue.create({
        data: { groupId: group.id, value: g.values[vi], sortOrder: vi },
      });
      result[g.name][g.values[vi]] = ov.id;
    }
  }
  return result;
}

async function main() {
  console.log('🌱 Starting full demo seed...\n');

  // ============================================================
  // STEP 1 – CATEGORIES
  // ============================================================

  // Existing top-level
  const catNoutbuky   = await upsertCategory({ name: 'Ноутбуки',       slug: 'noutbuky',   icon: '💻' });
  const catSmartfony  = await upsertCategory({ name: 'Смартфони',      slug: 'smartfony',  icon: '📱' });
  const catAksesuary  = await upsertCategory({ name: 'Аксесуари',      slug: 'aksesuary',  icon: '🎧' });

  // New top-level
  const catPlanshety  = await upsertCategory({ name: 'Планшети',       slug: 'planshety',  icon: '📟' });
  const catTV         = await upsertCategory({ name: 'Телевізори',     slug: 'televizory', icon: '📺' });
  const catKonsoli    = await upsertCategory({ name: 'Ігрові консолі', slug: 'konsoli',    icon: '🎮' });
  const catFoto       = await upsertCategory({ name: 'Фото та відео',  slug: 'foto',       icon: '📷' });
  const catAudio      = await upsertCategory({ name: 'Аудіо',          slug: 'audio',      icon: '🔊' });

  // Subcategories – Ноутбуки
  const subMacBook    = await upsertCategory({ name: 'MacBook',         slug: 'macbook',         parentId: catNoutbuky.id,  icon: '🍎' });
  const subGaming     = await upsertCategory({ name: 'Ігрові ноутбуки',slug: 'igrovyi-noutbuky', parentId: catNoutbuky.id,  icon: '🕹️' });
  const subBusiness   = await upsertCategory({ name: 'Бізнес ноутбуки',slug: 'biznes-noutbuky',  parentId: catNoutbuky.id,  icon: '💼' });
  const subUltrabook  = await upsertCategory({ name: 'Ультрабуки',     slug: 'ultrabooky',       parentId: catNoutbuky.id,  icon: '⚡' });

  // Subcategories – Смартфони
  const subIPhone    = await upsertCategory({ name: 'iPhone',   slug: 'iphone',   parentId: catSmartfony.id, icon: '🍎' });
  const subSamsung   = await upsertCategory({ name: 'Samsung',  slug: 'samsung',  parentId: catSmartfony.id, icon: '🌀' });
  const subPixel     = await upsertCategory({ name: 'Google Pixel', slug: 'google-pixel', parentId: catSmartfony.id, icon: '🔵' });
  const subXiaomi    = await upsertCategory({ name: 'Xiaomi',   slug: 'xiaomi',   parentId: catSmartfony.id, icon: '🟠' });

  // Subcategories – Аксесуари
  const subNakushniki = await upsertCategory({ name: 'Навушники',       slug: 'nakushnyky',  parentId: catAksesuary.id, icon: '🎧' });
  const subKably      = await upsertCategory({ name: 'Кабелі',          slug: 'kabli',       parentId: catAksesuary.id, icon: '🔌' });
  const subChohly     = await upsertCategory({ name: 'Чохли',           slug: 'chohly',      parentId: catAksesuary.id, icon: '🛡️' });
  const subZaryadky   = await upsertCategory({ name: 'Зарядні пристрої',slug: 'zaryadky',    parentId: catAksesuary.id, icon: '⚡' });
  const subPaverbanka = await upsertCategory({ name: 'Павербанки',      slug: 'paverbanka',  parentId: catAksesuary.id, icon: '🔋' });

  // Subcategories – Планшети
  const subIPad      = await upsertCategory({ name: 'iPad',             slug: 'ipad',           parentId: catPlanshety.id, icon: '🍎' });
  const subAndroidTab= await upsertCategory({ name: 'Android планшети', slug: 'android-tab',    parentId: catPlanshety.id, icon: '🤖' });

  // Subcategories – Телевізори
  const subOLED      = await upsertCategory({ name: 'OLED',     slug: 'oled-tv',   parentId: catTV.id, icon: '✨' });
  const subSmartTV   = await upsertCategory({ name: 'Smart TV', slug: 'smart-tv',  parentId: catTV.id, icon: '📡' });

  // Subcategories – Консолі
  const subPS        = await upsertCategory({ name: 'PlayStation', slug: 'playstation',     parentId: catKonsoli.id, icon: '🎮' });
  const subXbox      = await upsertCategory({ name: 'Xbox',        slug: 'xbox',            parentId: catKonsoli.id, icon: '🟩' });
  const subNintendo  = await upsertCategory({ name: 'Nintendo',    slug: 'nintendo',        parentId: catKonsoli.id, icon: '🔴' });

  // Subcategories – Фото
  const subMirrorless= await upsertCategory({ name: 'Бездзеркальні',  slug: 'bezdzerkalni',  parentId: catFoto.id, icon: '📸' });
  const subDrons     = await upsertCategory({ name: 'Дрони',          slug: 'drony',         parentId: catFoto.id, icon: '🚁' });

  // Subcategories – Аудіо
  const subSpeakers  = await upsertCategory({ name: 'Колонки',         slug: 'kolonky',       parentId: catAudio.id, icon: '🔊' });
  const subSoundbar  = await upsertCategory({ name: 'Саундбари',       slug: 'soundbar',      parentId: catAudio.id, icon: '🎵' });

  console.log('✅ Categories done\n');

  // ============================================================
  // STEP 2 – PRODUCTS WITH IMAGES & VARIANTS
  // ============================================================

  // --- НОУТБУКИ ---

  // 1. MacBook Pro 14"
  const mbp = await createProduct({
    name: 'Apple MacBook Pro 14" M3',
    slug: 'apple-macbook-pro-14',
    description: 'Найпотужніший ноутбук Apple з чіпом M3. Дисплей Liquid Retina XDR 14.2", до 22 годин автономної роботи. Ідеальний для розробників, дизайнерів і відеографів.',
    basePrice: 79999,
    categoryId: subMacBook.id,
    isFeatured: true,
    images: [
      img('1517336714731-489689fd1ca8'),
      img('1496181133206-80ce9b88a853'),
      img('1611186871525-7ab5c5ae1b9c'),
    ],
  });
  {
    const opts = await addOptionGroups(mbp.id, [
      { name: 'Чіп', values: ['M3', 'M3 Pro'] },
      { name: "Оперативна пам'ять", values: ['18 ГБ', '36 ГБ'] },
      { name: 'Накопичувач', values: ['512 ГБ', '1 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(mbp.id, 'M3 / 18 ГБ / 512 ГБ', 'apple-macbook-pro-14-m3-18hb-512hb', 79999, 5, [V['Чіп']['M3'], V["Оперативна пам'ять"]['18 ГБ'], V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(mbp.id, 'M3 / 18 ГБ / 1 ТБ',   'apple-macbook-pro-14-m3-18hb-1tb',   89999, 3, [V['Чіп']['M3'], V["Оперативна пам'ять"]['18 ГБ'], V['Накопичувач']['1 ТБ']]);
    await createVariantWithSelections(mbp.id, 'M3 Pro / 18 ГБ / 512 ГБ', 'apple-macbook-pro-14-m3pro-18hb-512hb', 109999, 4, [V['Чіп']['M3 Pro'], V["Оперативна пам'ять"]['18 ГБ'], V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(mbp.id, 'M3 Pro / 36 ГБ / 512 ГБ', 'apple-macbook-pro-14-m3pro-36hb-512hb', 129999, 2, [V['Чіп']['M3 Pro'], V["Оперативна пам'ять"]['36 ГБ'], V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(mbp.id, 'M3 Pro / 36 ГБ / 1 ТБ',   'apple-macbook-pro-14-m3pro-36hb-1tb',   149999, 3, [V['Чіп']['M3 Pro'], V["Оперативна пам'ять"]['36 ГБ'], V['Накопичувач']['1 ТБ']]);
  }
  console.log('✅ MacBook Pro 14"');

  // 2. MacBook Air 13"
  const mba = await createProduct({
    name: 'Apple MacBook Air 13" M3',
    slug: 'apple-macbook-air-13',
    description: 'Надтонкий і легкий MacBook Air з чіпом M3. Дисплей Liquid Retina 13.6", вага лише 1.24 кг. Найпопулярніший ноутбук у світі.',
    basePrice: 44999,
    categoryId: subMacBook.id,
    images: [
      img('1611186871525-7ab5c5ae1b9c'),
      img('1517336714731-489689fd1ca8'),
    ],
  });
  {
    const opts = await addOptionGroups(mba.id, [
      { name: 'Чіп', values: ['M2', 'M3'] },
      { name: 'Накопичувач', values: ['256 ГБ', '512 ГБ', '1 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(mba.id, 'M2 / 256 ГБ', 'apple-macbook-air-13-m2-256hb', 44999, 8, [V['Чіп']['M2'], V['Накопичувач']['256 ГБ']]);
    await createVariantWithSelections(mba.id, 'M2 / 512 ГБ', 'apple-macbook-air-13-m2-512hb', 49999, 5, [V['Чіп']['M2'], V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(mba.id, 'M3 / 256 ГБ', 'apple-macbook-air-13-m3-256hb', 54999, 6, [V['Чіп']['M3'], V['Накопичувач']['256 ГБ']]);
    await createVariantWithSelections(mba.id, 'M3 / 512 ГБ', 'apple-macbook-air-13-m3-512hb', 59999, 4, [V['Чіп']['M3'], V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(mba.id, 'M3 / 1 ТБ',   'apple-macbook-air-13-m3-1tb',   69999, 2, [V['Чіп']['M3'], V['Накопичувач']['1 ТБ']]);
  }
  console.log('✅ MacBook Air 13"');

  // 3. MacBook Air 15"
  const mba15 = await createProduct({
    name: 'Apple MacBook Air 15" M3',
    slug: 'apple-macbook-air-15',
    description: 'Великий MacBook Air з 15.3-дюймовим Liquid Retina дисплеєм і чіпом M3. Більше простору для творчості.',
    basePrice: 64999,
    categoryId: subMacBook.id,
    images: [
      img('1496181133206-80ce9b88a853'),
      img('1611186871525-7ab5c5ae1b9c'),
    ],
  });
  {
    const opts = await addOptionGroups(mba15.id, [
      { name: 'Накопичувач', values: ['256 ГБ', '512 ГБ', '1 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(mba15.id, '256 ГБ', 'apple-macbook-air-15-m3-256hb', 64999, 5, [V['Накопичувач']['256 ГБ']]);
    await createVariantWithSelections(mba15.id, '512 ГБ', 'apple-macbook-air-15-m3-512hb', 74999, 4, [V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(mba15.id, '1 ТБ',   'apple-macbook-air-15-m3-1tb',   89999, 2, [V['Накопичувач']['1 ТБ']]);
  }
  console.log('✅ MacBook Air 15"');

  // 4. ASUS ROG Strix G16
  const rog = await createProduct({
    name: 'ASUS ROG Strix G16 (2024)',
    slug: 'asus-rog-strix-g16-2024',
    description: 'Ігровий ноутбук з Intel Core i9-14900HX і NVIDIA RTX 4070. Дисплей 16" QHD 240 Гц. Система охолодження ROG Intelligent Cooling.',
    basePrice: 89999,
    categoryId: subGaming.id,
    images: [
      img('1593640408182-31c228fa8ee5'),
      img('1603481546303-a0ea0661543c'),
    ],
  });
  {
    const opts = await addOptionGroups(rog.id, [
      { name: "Оперативна пам'ять", values: ['16 ГБ', '32 ГБ'] },
      { name: 'Накопичувач', values: ['1 ТБ', '2 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(rog.id, '16 ГБ / 1 ТБ', 'asus-rog-strix-g16-2024-16hb-1tb', 89999, 3, [V["Оперативна пам'ять"]['16 ГБ'], V['Накопичувач']['1 ТБ']]);
    await createVariantWithSelections(rog.id, '32 ГБ / 1 ТБ', 'asus-rog-strix-g16-2024-32hb-1tb', 104999, 2, [V["Оперативна пам'ять"]['32 ГБ'], V['Накопичувач']['1 ТБ']]);
    await createVariantWithSelections(rog.id, '32 ГБ / 2 ТБ', 'asus-rog-strix-g16-2024-32hb-2tb', 119999, 1, [V["Оперативна пам'ять"]['32 ГБ'], V['Накопичувач']['2 ТБ']]);
  }
  console.log('✅ ASUS ROG Strix G16');

  // 5. Razer Blade 16
  const razer = await createProduct({
    name: 'Razer Blade 16 (2024)',
    slug: 'razer-blade-16-2024',
    description: 'Преміальний ігровий ноутбук з NVIDIA RTX 4090 і дисплеєм Mini LED 16" 240 Гц. Алюмінієвий корпус товщиною 16.99 мм.',
    basePrice: 159999,
    compareAtPrice: 174999,
    categoryId: subGaming.id,
    isFeatured: true,
    images: [
      img('1603481546303-a0ea0661543c'),
      img('1593640408182-31c228fa8ee5'),
    ],
  });
  {
    const opts = await addOptionGroups(razer.id, [
      { name: "Оперативна пам'ять", values: ['32 ГБ', '64 ГБ'] },
      { name: 'Накопичувач', values: ['1 ТБ', '2 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(razer.id, '32 ГБ / 1 ТБ', 'razer-blade-16-2024-32hb-1tb', 159999, 2, [V["Оперативна пам'ять"]['32 ГБ'], V['Накопичувач']['1 ТБ']], 174999);
    await createVariantWithSelections(razer.id, '64 ГБ / 2 ТБ', 'razer-blade-16-2024-64hb-2tb', 189999, 1, [V["Оперативна пам'ять"]['64 ГБ'], V['Накопичувач']['2 ТБ']]);
  }
  console.log('✅ Razer Blade 16');

  // 6. Lenovo ThinkPad X1 Carbon
  const tp = await createProduct({
    name: 'Lenovo ThinkPad X1 Carbon Gen 12',
    slug: 'lenovo-thinkpad-x1-carbon-gen-12',
    description: 'Легкий бізнес-ноутбук вагою 1.12 кг з Intel Core Ultra 7. Клавіатура з підсвіткою, сканер відбитків пальців, ThinkShutter.',
    basePrice: 74999,
    categoryId: subBusiness.id,
    images: [
      img('1588872657578-7efd1f1555ed'),
      img('1496181133206-80ce9b88a853'),
    ],
  });
  await createVariantWithSelections(tp.id, 'Core Ultra 7 / 32 ГБ / 1 ТБ', 'lenovo-thinkpad-x1-carbon-gen-12', 74999, 4, []);

  console.log('✅ ThinkPad X1 Carbon');

  // 7. Dell XPS 13
  const dell = await createProduct({
    name: 'Dell XPS 13 Plus (2024)',
    slug: 'dell-xps-13-plus-2024',
    description: 'Ультрабук з бездотиковою сенсорною панеллю і OLED дисплеєм 13.4". Intel Core Ultra 9, до 12 годин автономної роботи.',
    basePrice: 69999,
    categoryId: subUltrabook.id,
    images: [
      img('1496181133206-80ce9b88a853'),
      img('1588872657578-7efd1f1555ed'),
    ],
  });
  {
    const opts = await addOptionGroups(dell.id, [
      { name: 'Накопичувач', values: ['512 ГБ', '1 ТБ', '2 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(dell.id, '512 ГБ', 'dell-xps-13-plus-2024-512hb', 69999, 5, [V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(dell.id, '1 ТБ',   'dell-xps-13-plus-2024-1tb',   79999, 3, [V['Накопичувач']['1 ТБ']]);
    await createVariantWithSelections(dell.id, '2 ТБ',   'dell-xps-13-plus-2024-2tb',   94999, 1, [V['Накопичувач']['2 ТБ']]);
  }
  console.log('✅ Dell XPS 13 Plus');

  // --- СМАРТФОНИ ---

  // 8. iPhone 15 Pro
  const ip15 = await createProduct({
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'Чіп A17 Pro, корпус з титану Grade 5, камера 48 Мп з оптичним зумом 5×. Action Button для швидкого доступу до функцій.',
    basePrice: 42999,
    categoryId: subIPhone.id,
    isFeatured: true,
    images: [
      img('1695048133142-1a20484d2569'),
      img('1510557880182-3d4d3cba35a5'),
      img('1603015388786-22c15c24bab1'),
    ],
  });
  {
    const opts = await addOptionGroups(ip15.id, [
      { name: 'Колір', values: ['Чорний титан', 'Білий титан', 'Натуральний титан', 'Синій титан'] },
      { name: "Вбудована пам'ять", values: ['128 ГБ', '256 ГБ', '512 ГБ'] },
    ]);
    const V = opts;
    const colors = ['Чорний титан','Білий титан','Натуральний титан','Синій титан'];
    const mems = ['128 ГБ','256 ГБ','512 ГБ'];
    const priceMap: Record<string,number> = { '128 ГБ': 42999, '256 ГБ': 47999, '512 ГБ': 57999 };
    for (const col of colors) {
      for (const mem of mems) {
        const stock = Math.floor(Math.random() * 6) + 1;
        await createVariantWithSelections(
          ip15.id,
          `${col} / ${mem}`,
          `iphone-15-pro-${sl(col)}-${sl(mem)}`,
          priceMap[mem], stock,
          [V['Колір'][col], V["Вбудована пам'ять"][mem]],
        );
      }
    }
  }
  console.log('✅ iPhone 15 Pro');

  // 9. iPhone 15
  const ip15base = await createProduct({
    name: 'iPhone 15',
    slug: 'iphone-15',
    description: 'Динамічний острів, камера 48 Мп, чіп A16 Bionic. USB-C для швидкого заряджання. Дисплей Super Retina XDR 6.1".',
    basePrice: 32999,
    categoryId: subIPhone.id,
    images: [
      img('1510557880182-3d4d3cba35a5'),
      img('1695048133142-1a20484d2569'),
    ],
  });
  {
    const opts = await addOptionGroups(ip15base.id, [
      { name: 'Колір', values: ['Чорний', 'Рожевий', 'Жовтий', 'Зелений', 'Синій'] },
      { name: "Вбудована пам'ять", values: ['128 ГБ', '256 ГБ', '512 ГБ'] },
    ]);
    const V = opts;
    const priceMap: Record<string,number> = { '128 ГБ': 32999, '256 ГБ': 37999, '512 ГБ': 47999 };
    for (const col of ['Чорний','Рожевий','Жовтий']) {
      for (const mem of ['128 ГБ','256 ГБ']) {
        await createVariantWithSelections(
          ip15base.id, `${col} / ${mem}`,
          `iphone-15-${sl(col)}-${sl(mem)}`,
          priceMap[mem], 5,
          [V['Колір'][col], V["Вбудована пам'ять"][mem]],
        );
      }
    }
  }
  console.log('✅ iPhone 15');

  // 10. Samsung Galaxy S24 Ultra
  const s24 = await createProduct({
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Titanium корпус, S Pen у комплекті, камера 200 Мп з оптичним зумом 10×, Snapdragon 8 Gen 3 for Galaxy.',
    basePrice: 54999,
    categoryId: subSamsung.id,
    images: [
      img('1610945415295-d9bbf067e59c'),
      img('1610945264462-b71e6d9ae05c'),
    ],
  });
  {
    const opts = await addOptionGroups(s24.id, [
      { name: 'Колір', values: ['Titanium Black', 'Titanium Violet', 'Titanium Green', 'Titanium Orange'] },
      { name: "Вбудована пам'ять", values: ['256 ГБ', '512 ГБ', '1 ТБ'] },
    ]);
    const V = opts;
    const pMap: Record<string,number> = { '256 ГБ': 54999, '512 ГБ': 64999, '1 ТБ': 79999 };
    for (const col of ['Titanium Black','Titanium Violet','Titanium Green']) {
      for (const mem of ['256 ГБ','512 ГБ']) {
        await createVariantWithSelections(
          s24.id, `${col} / ${mem}`,
          `samsung-galaxy-s24-ultra-${sl(col)}-${sl(mem)}`,
          pMap[mem], 3,
          [V['Колір'][col], V["Вбудована пам'ять"][mem]],
        );
      }
    }
  }
  console.log('✅ Samsung Galaxy S24 Ultra');

  // 11. Samsung Galaxy S24+
  const s24plus = await createProduct({
    name: 'Samsung Galaxy S24+',
    slug: 'samsung-galaxy-s24-plus',
    description: 'Великий екран 6.7" Dynamic AMOLED 2X 120 Гц, Snapdragon 8 Gen 3, батарея 4900 мАг з зарядженням 45 Вт.',
    basePrice: 39999,
    categoryId: subSamsung.id,
    images: [
      img('1610945264462-b71e6d9ae05c'),
      img('1610945415295-d9bbf067e59c'),
    ],
  });
  {
    const opts = await addOptionGroups(s24plus.id, [
      { name: 'Колір', values: ['Cobalt Violet', 'Jade Green', 'Onyx Black'] },
      { name: "Вбудована пам'ять", values: ['256 ГБ', '512 ГБ'] },
    ]);
    const V = opts;
    for (const col of ['Cobalt Violet','Jade Green','Onyx Black']) {
      for (const mem of ['256 ГБ','512 ГБ']) {
        await createVariantWithSelections(
          s24plus.id, `${col} / ${mem}`,
          `samsung-galaxy-s24-plus-${sl(col)}-${sl(mem)}`,
          mem === '256 ГБ' ? 39999 : 49999, 4,
          [V['Колір'][col], V["Вбудована пам'ять"][mem]],
        );
      }
    }
  }
  console.log('✅ Samsung Galaxy S24+');

  // 12. Google Pixel 8 Pro
  const pixel = await createProduct({
    name: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro',
    description: 'Чіп Google Tensor G3, камера 50 Мп з AI-покращенням, 7 років оновлень Android. Найрозумніший Android-смартфон.',
    basePrice: 37999,
    categoryId: subPixel.id,
    images: [
      img('1603015388786-22c15c24bab1'),
      img('1510557880182-3d4d3cba35a5'),
    ],
  });
  {
    const opts = await addOptionGroups(pixel.id, [
      { name: 'Колір', values: ['Obsidian', 'Porcelain', 'Bay'] },
      { name: "Вбудована пам'ять", values: ['128 ГБ', '256 ГБ', '1 ТБ'] },
    ]);
    const V = opts;
    for (const col of ['Obsidian','Porcelain','Bay']) {
      for (const mem of ['128 ГБ','256 ГБ']) {
        await createVariantWithSelections(
          pixel.id, `${col} / ${mem}`,
          `google-pixel-8-pro-${sl(col)}-${sl(mem)}`,
          mem === '128 ГБ' ? 37999 : 44999, 3,
          [V['Колір'][col], V["Вбудована пам'ять"][mem]],
        );
      }
    }
  }
  console.log('✅ Google Pixel 8 Pro');

  // 13. Xiaomi 14
  const xiaomi = await createProduct({
    name: 'Xiaomi 14',
    slug: 'xiaomi-14',
    description: 'Snapdragon 8 Gen 3, камера Leica 50 Мп, зарядження 90 Вт HyperCharge. Дисплей AMOLED 6.36" 120 Гц.',
    basePrice: 29999,
    compareAtPrice: 34999,
    categoryId: subXiaomi.id,
    images: [
      img('1610945264462-b71e6d9ae05c'),
      img('1603015388786-22c15c24bab1'),
    ],
  });
  {
    const opts = await addOptionGroups(xiaomi.id, [
      { name: 'Колір', values: ['Black', 'White', 'Jade Green'] },
      { name: "Вбудована пам'ять", values: ['256 ГБ', '512 ГБ'] },
    ]);
    const V = opts;
    for (const col of ['Black','White','Jade Green']) {
      for (const mem of ['256 ГБ','512 ГБ']) {
        await createVariantWithSelections(
          xiaomi.id, `${col} / ${mem}`,
          `xiaomi-14-${sl(col)}-${sl(mem)}`,
          mem === '256 ГБ' ? 29999 : 36999, 5,
          [V['Колір'][col], V["Вбудована пам'ять"][mem]],
          mem === '256 ГБ' ? 34999 : undefined,
        );
      }
    }
  }
  console.log('✅ Xiaomi 14');

  // --- ПЛАНШЕТИ ---

  // 14. iPad Pro 13"
  const ipadpro = await createProduct({
    name: 'Apple iPad Pro 13" M4',
    slug: 'apple-ipad-pro-13-m4',
    description: 'Найтонший продукт Apple — 5.1 мм. Дисплей Ultra Retina XDR OLED, чіп M4, підтримка Apple Pencil Pro та Magic Keyboard.',
    basePrice: 59999,
    categoryId: subIPad.id,
    isFeatured: true,
    images: [
      img('1544244015-0df4cec08479'),
      img('1617788026248-b31b1a04bd14'),
    ],
  });
  {
    const opts = await addOptionGroups(ipadpro.id, [
      { name: 'Підключення', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
      { name: 'Накопичувач', values: ['256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ'] },
    ]);
    const V = opts;
    for (const con of ['Wi-Fi','Wi-Fi + Cellular']) {
      for (const ssd of ['256 ГБ','512 ГБ','1 ТБ']) {
        const base = con === 'Wi-Fi' ? 0 : 6000;
        const ssdPrice: Record<string,number> = { '256 ГБ': 59999, '512 ГБ': 74999, '1 ТБ': 99999 };
        await createVariantWithSelections(
          ipadpro.id, `${con} / ${ssd}`,
          `apple-ipad-pro-13-m4-${sl(con)}-${sl(ssd)}`,
          ssdPrice[ssd] + base, 3,
          [V['Підключення'][con], V['Накопичувач'][ssd]],
        );
      }
    }
  }
  console.log('✅ iPad Pro 13"');

  // 15. iPad Air 11"
  const ipadair = await createProduct({
    name: 'Apple iPad Air 11" M2',
    slug: 'apple-ipad-air-11-m2',
    description: 'Потужний і універсальний планшет з чіпом M2 і дисплеєм Liquid Retina 11". Підтримка Apple Pencil Pro.',
    basePrice: 32999,
    categoryId: subIPad.id,
    images: [
      img('1617788026248-b31b1a04bd14'),
      img('1544244015-0df4cec08479'),
    ],
  });
  {
    const opts = await addOptionGroups(ipadair.id, [
      { name: 'Колір', values: ['Blue', 'Purple', 'Starlight', 'Space Gray'] },
      { name: 'Накопичувач', values: ['128 ГБ', '256 ГБ', '512 ГБ'] },
    ]);
    const V = opts;
    const priceMap: Record<string,number> = { '128 ГБ': 32999, '256 ГБ': 38999, '512 ГБ': 49999 };
    for (const col of ['Blue','Purple','Starlight']) {
      for (const ssd of ['128 ГБ','256 ГБ']) {
        await createVariantWithSelections(
          ipadair.id, `${col} / ${ssd}`,
          `apple-ipad-air-11-m2-${sl(col)}-${sl(ssd)}`,
          priceMap[ssd], 4,
          [V['Колір'][col], V['Накопичувач'][ssd]],
        );
      }
    }
  }
  console.log('✅ iPad Air 11"');

  // 16. Samsung Galaxy Tab S9 Ultra
  const tabs9 = await createProduct({
    name: 'Samsung Galaxy Tab S9 Ultra',
    slug: 'samsung-galaxy-tab-s9-ultra',
    description: 'Великий AMOLED дисплей 14.6" 120 Гц, Snapdragon 8 Gen 2, S Pen у комплекті, 12 000 мАг батарея.',
    basePrice: 47999,
    categoryId: subAndroidTab.id,
    images: [
      img('1544244015-0df4cec08479'),
      img('1617788026248-b31b1a04bd14'),
    ],
  });
  {
    const opts = await addOptionGroups(tabs9.id, [
      { name: "Оперативна пам'ять", values: ['12 ГБ', '16 ГБ'] },
      { name: 'Накопичувач', values: ['256 ГБ', '512 ГБ', '1 ТБ'] },
    ]);
    const V = opts;
    await createVariantWithSelections(tabs9.id, '12 ГБ / 256 ГБ', 'samsung-tab-s9-ultra-12hb-256hb', 47999, 3, [V["Оперативна пам'ять"]['12 ГБ'], V['Накопичувач']['256 ГБ']]);
    await createVariantWithSelections(tabs9.id, '12 ГБ / 512 ГБ', 'samsung-tab-s9-ultra-12hb-512hb', 54999, 2, [V["Оперативна пам'ять"]['12 ГБ'], V['Накопичувач']['512 ГБ']]);
    await createVariantWithSelections(tabs9.id, '16 ГБ / 1 ТБ',   'samsung-tab-s9-ultra-16hb-1tb',   69999, 1, [V["Оперативна пам'ять"]['16 ГБ'], V['Накопичувач']['1 ТБ']]);
  }
  console.log('✅ Samsung Galaxy Tab S9 Ultra');

  // --- ТЕЛЕВІЗОРИ ---

  // 17. LG OLED C3
  const lgOled = await createProduct({
    name: 'LG OLED C3 55"',
    slug: 'lg-oled-c3-55',
    description: 'OLED evo панель, процесор α9 Gen6 AI, Dolby Vision IQ, ATMOS. Чорний колір з нескінченним контрастом. HDMI 2.1 для PS5 та Xbox.',
    basePrice: 44999,
    compareAtPrice: 54999,
    categoryId: subOLED.id,
    isFeatured: true,
    images: [
      img('1593642632559-0c6d3fc62b89'),
      img('1601944177325-f8867652837f'),
    ],
  });
  {
    const opts = await addOptionGroups(lgOled.id, [
      { name: 'Діагональ', values: ['55"', '65"', '77"'] },
    ]);
    const V = opts;
    await createVariantWithSelections(lgOled.id, '55"', 'lg-oled-c3-55', 44999, 4, [V['Діагональ']['55"']], 54999);
    await createVariantWithSelections(lgOled.id, '65"', 'lg-oled-c3-65', 64999, 3, [V['Діагональ']['65"']]);
    await createVariantWithSelections(lgOled.id, '77"', 'lg-oled-c3-77', 99999, 2, [V['Діагональ']['77"']]);
  }
  console.log('✅ LG OLED C3');

  // 18. Samsung Neo QLED 8K
  const samsungTV = await createProduct({
    name: 'Samsung Neo QLED 8K QN900C 65"',
    slug: 'samsung-neo-qled-8k-qn900c-65',
    description: 'Перший у своєму класі 8K Neo QLED телевізор. Процесор Neural Quantum 8K, Dolby Atmos, Object Tracking Sound+.',
    basePrice: 129999,
    categoryId: subSmartTV.id,
    images: [
      img('1601944177325-f8867652837f'),
      img('1593642632559-0c6d3fc62b89'),
    ],
  });
  await createVariantWithSelections(samsungTV.id, '65"', 'samsung-neo-qled-8k-qn900c-65', 129999, 2, []);
  console.log('✅ Samsung Neo QLED 8K');

  // --- ІГРОВІ КОНСОЛІ ---

  // 19. PS5
  const ps5 = await createProduct({
    name: 'Sony PlayStation 5',
    slug: 'sony-playstation-5',
    description: 'Консоль нового покоління з SSD NVMe 825 ГБ, 4K 120 FPS, Ray Tracing, DualSense з тактильними відчуттями.',
    basePrice: 19999,
    categoryId: subPS.id,
    isFeatured: true,
    images: [
      img('1606813907291-d86efa9b94db'),
      img('1593642632599-d47e3900efcd'),
    ],
  });
  {
    const opts = await addOptionGroups(ps5.id, [
      { name: 'Комплектація', values: ['Disk Edition', 'Digital Edition'] },
    ]);
    const V = opts;
    await createVariantWithSelections(ps5.id, 'Disk Edition',    'sony-playstation-5-disk',    19999, 8, [V['Комплектація']['Disk Edition']]);
    await createVariantWithSelections(ps5.id, 'Digital Edition', 'sony-playstation-5-digital', 15999, 5, [V['Комплектація']['Digital Edition']]);
  }
  console.log('✅ Sony PlayStation 5');

  // 20. Xbox Series X
  const xbox = await createProduct({
    name: 'Microsoft Xbox Series X',
    slug: 'microsoft-xbox-series-x',
    description: 'Найпотужніша консоль Xbox: 4K 120 FPS, 1 ТБ SSD, Quick Resume, Xbox Game Pass Ultimate сумісність.',
    basePrice: 18999,
    categoryId: subXbox.id,
    images: [
      img('1593642632599-d47e3900efcd'),
      img('1606813907291-d86efa9b94db'),
    ],
  });
  await createVariantWithSelections(xbox.id, '1 ТБ', 'microsoft-xbox-series-x-1tb', 18999, 6, []);
  console.log('✅ Xbox Series X');

  // 21. Nintendo Switch OLED
  const nintendo = await createProduct({
    name: 'Nintendo Switch OLED',
    slug: 'nintendo-switch-oled',
    description: '7-дюймовий OLED дисплей, покращені динаміки, 64 ГБ пам\'яті, широкий підставка. Грай вдома та в дорозі.',
    basePrice: 14999,
    categoryId: subNintendo.id,
    images: [
      img('1578303512597-81e6cc155b3e'),
      img('1606813907291-d86efa9b94db'),
    ],
  });
  {
    const opts = await addOptionGroups(nintendo.id, [
      { name: 'Колір', values: ['White', 'Neon Red/Blue', 'Splatoon 3 Edition'] },
    ]);
    const V = opts;
    await createVariantWithSelections(nintendo.id, 'White', 'nintendo-switch-oled-white', 14999, 7, [V['Колір']['White']]);
    await createVariantWithSelections(nintendo.id, 'Neon Red/Blue', 'nintendo-switch-oled-neon', 14999, 5, [V['Колір']['Neon Red/Blue']]);
    await createVariantWithSelections(nintendo.id, 'Splatoon 3 Edition', 'nintendo-switch-oled-splatoon', 16999, 2, [V['Колір']['Splatoon 3 Edition']]);
  }
  console.log('✅ Nintendo Switch OLED');

  // --- ФОТО ТА ВІДЕО ---

  // 22. Sony A7 V
  const sonyA7 = await createProduct({
    name: 'Sony A7V Mirrorless',
    slug: 'sony-a7v-mirrorless',
    description: 'Повнокадрова бездзеркальна камера 33 Мп BSI CMOS, 4K 120 FPS, AI-розпізнавання суб\'єкта, 828 кадрів на одному заряді.',
    basePrice: 109999,
    categoryId: subMirrorless.id,
    images: [
      img('1502920917128-1aa500764b2e'),
      img('1516035069371-29a1b244cc32'),
    ],
  });
  {
    const opts = await addOptionGroups(sonyA7.id, [
      { name: 'Комплектація', values: ['Body', 'Kit 28-70mm'] },
    ]);
    const V = opts;
    await createVariantWithSelections(sonyA7.id, 'Body',       'sony-a7v-body',   109999, 3, [V['Комплектація']['Body']]);
    await createVariantWithSelections(sonyA7.id, 'Kit 28-70mm','sony-a7v-kit',    129999, 2, [V['Комплектація']['Kit 28-70mm']]);
  }
  console.log('✅ Sony A7V');

  // 23. DJI Mini 4 Pro
  const dji = await createProduct({
    name: 'DJI Mini 4 Pro',
    slug: 'dji-mini-4-pro',
    description: 'Дрон вагою менше 249 г з камерою 4K 60 FPS HDR, Obstacle Sensing у 4 напрямках, ActiveTrack 360°.',
    basePrice: 34999,
    categoryId: subDrons.id,
    isFeatured: true,
    images: [
      img('1534043464124-4a4e9c26e6f8'),
      img('1516035069371-29a1b244cc32'),
    ],
  });
  {
    const opts = await addOptionGroups(dji.id, [
      { name: 'Комплектація', values: ['Standard', 'Fly More Combo', 'Fly More Combo Plus'] },
    ]);
    const V = opts;
    await createVariantWithSelections(dji.id, 'Standard',           'dji-mini-4-pro-standard',    34999, 4, [V['Комплектація']['Standard']]);
    await createVariantWithSelections(dji.id, 'Fly More Combo',     'dji-mini-4-pro-combo',       49999, 3, [V['Комплектація']['Fly More Combo']]);
    await createVariantWithSelections(dji.id, 'Fly More Combo Plus','dji-mini-4-pro-combo-plus',  59999, 2, [V['Комплектація']['Fly More Combo Plus']]);
  }
  console.log('✅ DJI Mini 4 Pro');

  // --- АУДІО ---

  // 24. Sonos Era 300
  const sonos = await createProduct({
    name: 'Sonos Era 300',
    slug: 'sonos-era-300',
    description: 'Просторовий звук Dolby Atmos. 6 підсилювачів, 6 драйверів. Wi-Fi та Bluetooth. Підтримка Apple AirPlay 2.',
    basePrice: 19999,
    categoryId: subSpeakers.id,
    images: [
      img('1608043152269-423dbba4e7e1'),
      img('1545454459-efc498a1dc73'),
    ],
  });
  {
    const opts = await addOptionGroups(sonos.id, [
      { name: 'Колір', values: ['Black', 'White'] },
    ]);
    const V = opts;
    await createVariantWithSelections(sonos.id, 'Black', 'sonos-era-300-black', 19999, 5, [V['Колір']['Black']]);
    await createVariantWithSelections(sonos.id, 'White', 'sonos-era-300-white', 19999, 4, [V['Колір']['White']]);
  }
  console.log('✅ Sonos Era 300');

  // 25. Samsung HW-Q990C Soundbar
  const soundbar = await createProduct({
    name: 'Samsung HW-Q990C Soundbar',
    slug: 'samsung-hw-q990c-soundbar',
    description: '11.1.4 канальний саундбар з Dolby Atmos та DTS:X. 656 Вт, бездротовий сабвуфер і тилові колонки у комплекті.',
    basePrice: 29999,
    compareAtPrice: 35999,
    categoryId: subSoundbar.id,
    images: [
      img('1545454459-efc498a1dc73'),
      img('1608043152269-423dbba4e7e1'),
    ],
  });
  await createVariantWithSelections(soundbar.id, 'Стандарт', 'samsung-hw-q990c-soundbar', 29999, 3, [], 35999);
  console.log('✅ Samsung HW-Q990C Soundbar');

  // --- АКСЕСУАРИ ---

  // 26. Sony WH-1000XM5
  const sony = await createProduct({
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    description: 'Лідер за шумопоглинанням. 8 мікрофонів, 30 годин роботи, Multipoint для 2 пристроїв, LDAC Hi-Res Audio.',
    basePrice: 14999,
    categoryId: subNakushniki.id,
    isFeatured: true,
    images: [
      img('1505740420928-5e560c06d30e'),
      img('1546435770-a3e426bf472b'),
    ],
  });
  {
    const opts = await addOptionGroups(sony.id, [
      { name: 'Колір', values: ['Black', 'Silver'] },
    ]);
    const V = opts;
    await createVariantWithSelections(sony.id, 'Black',  'sony-wh-1000xm5-black',  14999, 8, [V['Колір']['Black']]);
    await createVariantWithSelections(sony.id, 'Silver', 'sony-wh-1000xm5-silver', 14999, 5, [V['Колір']['Silver']]);
  }
  console.log('✅ Sony WH-1000XM5');

  // 27. Apple AirPods Pro 2
  const airpods = await createProduct({
    name: 'Apple AirPods Pro 2 (USB-C)',
    slug: 'apple-airpods-pro-2-usb-c',
    description: 'Adaptive Audio, Personalized Spatial Audio, Transparency mode. До 30 годин із зарядним кейсом. IP54.',
    basePrice: 8999,
    categoryId: subNakushniki.id,
    images: [
      img('1572635196237-14b3f281503f'),
      img('1588423771073-b8903fead85b'),
    ],
  });
  await createVariantWithSelections(airpods.id, 'Стандарт', 'apple-airpods-pro-2-usb-c', 8999, 12, []);
  console.log('✅ AirPods Pro 2');

  // 28. Apple AirPods Max
  const airpodsMax = await createProduct({
    name: 'Apple AirPods Max',
    slug: 'apple-airpods-max',
    description: 'Накладні навушники з High-Fidelity Audio, Active Noise Cancellation, Spatial Audio з динамічним відстеженням голови.',
    basePrice: 19999,
    categoryId: subNakushniki.id,
    images: [
      img('1546435770-a3e426bf472b'),
      img('1505740420928-5e560c06d30e'),
    ],
  });
  {
    const opts = await addOptionGroups(airpodsMax.id, [
      { name: 'Колір', values: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Orange'] },
    ]);
    const V = opts;
    for (const col of ['Midnight','Starlight','Blue','Purple','Orange']) {
      await createVariantWithSelections(airpodsMax.id, col, `apple-airpods-max-${sl(col)}`, 19999, 4, [V['Колір'][col]]);
    }
  }
  console.log('✅ AirPods Max');

  // 29. Кабель USB-C
  const cable = await createProduct({
    name: 'Кабель USB-C to USB-C 240W',
    slug: 'kabel-usb-c-usb-c-240w',
    description: 'Підтримка 240 Вт зарядження, 40 Гбіт/с передача, 8K відео. Нейлонове плетіння, довжина на вибір.',
    basePrice: 599,
    categoryId: subKably.id,
    images: [
      img('1558618666-fcd25c85cd64'),
      img('1603481546303-a0ea0661543c'),
    ],
  });
  {
    const opts = await addOptionGroups(cable.id, [
      { name: 'Довжина', values: ['0.5 м', '1 м', '2 м'] },
      { name: 'Колір', values: ['Black', 'White', 'Gray'] },
    ]);
    const V = opts;
    const lenPrice: Record<string,number> = { '0.5 м': 499, '1 м': 599, '2 м': 799 };
    for (const len of ['0.5 м','1 м','2 м']) {
      for (const col of ['Black','White','Gray']) {
        await createVariantWithSelections(
          cable.id, `${len} / ${col}`,
          `kabel-usb-c-usb-c-240w-${sl(len)}-${sl(col)}`,
          lenPrice[len], 15,
          [V['Довжина'][len], V['Колір'][col]],
        );
      }
    }
  }
  console.log('✅ Кабель USB-C');

  // 30. Apple MagSafe Charger 25W
  const magsafe = await createProduct({
    name: 'Apple MagSafe Charger 25W',
    slug: 'apple-magsafe-charger-25w',
    description: 'Зарядний пристрій MagSafe 25 Вт для iPhone 15 та новіших. Магнітне вирівнювання, бездротова зарядка без кабелю.',
    basePrice: 1499,
    categoryId: subZaryadky.id,
    images: [
      img('1558618666-fcd25c85cd64'),
    ],
  });
  {
    const opts = await addOptionGroups(magsafe.id, [
      { name: 'Довжина кабелю', values: ['1 м', '2 м'] },
    ]);
    const V = opts;
    await createVariantWithSelections(magsafe.id, '1 м', 'apple-magsafe-charger-25w-1m', 1499, 10, [V['Довжина кабелю']['1 м']]);
    await createVariantWithSelections(magsafe.id, '2 м', 'apple-magsafe-charger-25w-2m', 1799, 8,  [V['Довжина кабелю']['2 м']]);
  }
  console.log('✅ Apple MagSafe Charger 25W');

  // 31. Anker 737 PowerBank 24000 mAh
  const powerbank = await createProduct({
    name: 'Anker 737 PowerBank 24000 мАг',
    slug: 'anker-737-powerbank-24000',
    description: '24 000 мАг, 140 Вт зарядження, 3 порти (2× USB-C + 1× USB-A). Зарядить MacBook Pro за 1.5 години.',
    basePrice: 4999,
    compareAtPrice: 5999,
    categoryId: subPaverbanka.id,
    images: [
      img('1609091839311-28d581a93622'),
      img('1558618666-fcd25c85cd64'),
    ],
  });
  await createVariantWithSelections(powerbank.id, 'Black', 'anker-737-powerbank-24000-black', 4999, 8, [], 5999);
  console.log('✅ Anker 737 PowerBank');

  // 32. Чохол MagSafe для iPhone 15 Pro
  const chohol = await createProduct({
    name: 'Чохол MagSafe Leather Case',
    slug: 'chohol-magsafe-leather-case',
    description: 'Шкіряний чохол з підтримкою MagSafe для iPhone. Натуральна шкіра, вирівнюється по магнітах, не ковзає.',
    basePrice: 1299,
    categoryId: subChohly.id,
    images: [
      img('1601784551446-20c9e07cdbdb'),
      img('1603481546303-a0ea0661543c'),
    ],
  });
  {
    const opts = await addOptionGroups(chohol.id, [
      { name: 'Модель iPhone', values: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16'] },
      { name: 'Колір', values: ['Brown', 'Black', 'Midnight', 'Forest Green'] },
    ]);
    const V = opts;
    const modelPrice: Record<string,number> = { 'iPhone 15': 1299, 'iPhone 15 Pro': 1399, 'iPhone 15 Pro Max': 1499, 'iPhone 16': 1499 };
    for (const model of ['iPhone 15','iPhone 15 Pro','iPhone 15 Pro Max']) {
      for (const col of ['Brown','Black','Midnight']) {
        await createVariantWithSelections(
          chohol.id, `${model} / ${col}`,
          `chohol-magsafe-${sl(model)}-${sl(col)}`,
          modelPrice[model], Math.floor(Math.random() * 5) + 1,
          [V['Модель iPhone'][model], V['Колір'][col]],
        );
      }
    }
  }
  console.log('✅ Чохол MagSafe');

  // ============================================================
  console.log('\n🎉 Full demo seed completed!');
  console.log(`Total categories: ${await prisma.category.count()}`);
  console.log(`Total products:   ${await prisma.product.count()}`);
  console.log(`Total variants:   ${await prisma.variant.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
