import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function sl(str: string) {
  return str
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (c) => {
      const m: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',
        ї:'yi',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',
        ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ё:'io',
      };
      return m[c] || c;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const cats = await prisma.category.findMany();
  const findCat = (slug: string) => cats.find((c) => c.slug === slug)!;

  const catNoutbuky = findCat('noutbuky');
  const catSmartfony = findCat('smartfony');
  const catAksesuary = findCat('aksesuary');

  // ---- Subcategories ----
  const subMacBook = await prisma.category.upsert({
    where: { slug: 'macbook' },
    update: {},
    create: { name: 'MacBook', slug: 'macbook', parentId: catNoutbuky.id, icon: '🍎' },
  });
  const subGaming = await prisma.category.upsert({
    where: { slug: 'igrovyi-noutbuky' },
    update: {},
    create: { name: 'Ігрові ноутбуки', slug: 'igrovyi-noutbuky', parentId: catNoutbuky.id, icon: '🎮' },
  });
  const subBusiness = await prisma.category.upsert({
    where: { slug: 'biznes-noutbuky' },
    update: {},
    create: { name: 'Бізнес ноутбуки', slug: 'biznes-noutbuky', parentId: catNoutbuky.id, icon: '💼' },
  });
  const subIPhone = await prisma.category.upsert({
    where: { slug: 'iphone' },
    update: {},
    create: { name: 'iPhone', slug: 'iphone', parentId: catSmartfony.id, icon: '📱' },
  });
  const subSamsung = await prisma.category.upsert({
    where: { slug: 'samsung' },
    update: {},
    create: { name: 'Samsung', slug: 'samsung', parentId: catSmartfony.id, icon: '📲' },
  });
  const subNakushniki = await prisma.category.upsert({
    where: { slug: 'nakushnyky' },
    update: {},
    create: { name: 'Навушники', slug: 'nakushnyky', parentId: catAksesuary.id, icon: '🎧' },
  });
  const subKably = await prisma.category.upsert({
    where: { slug: 'kabli' },
    update: {},
    create: { name: 'Кабелі', slug: 'kabli', parentId: catAksesuary.id, icon: '🔌' },
  });
  const subChohly = await prisma.category.upsert({
    where: { slug: 'chohly' },
    update: {},
    create: { name: 'Чохли', slug: 'chohly', parentId: catAksesuary.id, icon: '🛡️' },
  });
  console.log('Subcategories done');

  // ---- Helper to create variant with selections ----
  async function createVariant(
    productId: string,
    name: string,
    slug: string,
    price: number,
    stock: number,
    optionValueIds: string[],
    compareAtPrice?: number,
  ) {
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

  // ===== 1. MacBook Pro 14" – Чіп × RAM × Накопичувач =====
  const mbp = await prisma.product.create({
    data: {
      name: 'Apple MacBook Pro 14"',
      slug: 'apple-macbook-pro-14',
      description: 'Найпотужніший ноутбук Apple з чіпом M-серії.',
      basePrice: 79999,
      categoryId: subMacBook.id,
      isFeatured: true,
      isActive: true,
    },
  });
  const mbpChip = await prisma.productOptionGroup.create({ data: { productId: mbp.id, name: 'Чіп', sortOrder: 0 } });
  const mbpRam = await prisma.productOptionGroup.create({ data: { productId: mbp.id, name: "Оперативна пам'ять", sortOrder: 1 } });
  const mbpSsd = await prisma.productOptionGroup.create({ data: { productId: mbp.id, name: 'Накопичувач', sortOrder: 2 } });
  const m3 = await prisma.productOptionValue.create({ data: { groupId: mbpChip.id, value: 'M3', sortOrder: 0 } });
  const m3pro = await prisma.productOptionValue.create({ data: { groupId: mbpChip.id, value: 'M3 Pro', sortOrder: 1 } });
  const ram18 = await prisma.productOptionValue.create({ data: { groupId: mbpRam.id, value: '18 ГБ', sortOrder: 0 } });
  const ram36 = await prisma.productOptionValue.create({ data: { groupId: mbpRam.id, value: '36 ГБ', sortOrder: 1 } });
  const ssd512 = await prisma.productOptionValue.create({ data: { groupId: mbpSsd.id, value: '512 ГБ', sortOrder: 0 } });
  const ssd1tb = await prisma.productOptionValue.create({ data: { groupId: mbpSsd.id, value: '1 ТБ', sortOrder: 1 } });

  await createVariant(mbp.id, 'M3 / 18 ГБ / 512 ГБ', 'apple-macbook-pro-14-m3-18hb-512hb', 79999, 5, [m3.id, ram18.id, ssd512.id]);
  await createVariant(mbp.id, 'M3 / 18 ГБ / 1 ТБ', 'apple-macbook-pro-14-m3-18hb-1tb', 89999, 3, [m3.id, ram18.id, ssd1tb.id]);
  await createVariant(mbp.id, 'M3 Pro / 18 ГБ / 512 ГБ', 'apple-macbook-pro-14-m3pro-18hb-512hb', 109999, 4, [m3pro.id, ram18.id, ssd512.id]);
  await createVariant(mbp.id, 'M3 Pro / 36 ГБ / 512 ГБ', 'apple-macbook-pro-14-m3pro-36hb-512hb', 129999, 2, [m3pro.id, ram36.id, ssd512.id]);
  await createVariant(mbp.id, 'M3 Pro / 36 ГБ / 1 ТБ', 'apple-macbook-pro-14-m3pro-36hb-1tb', 149999, 3, [m3pro.id, ram36.id, ssd1tb.id]);
  console.log('MacBook Pro done');

  // ===== 2. MacBook Air 13" – Чіп × Накопичувач =====
  const mba = await prisma.product.create({
    data: { name: 'Apple MacBook Air 13"', slug: 'apple-macbook-air-13', description: 'Надтонкий і легкий MacBook Air.', basePrice: 44999, categoryId: subMacBook.id, isActive: true },
  });
  const mbaChip = await prisma.productOptionGroup.create({ data: { productId: mba.id, name: 'Чіп', sortOrder: 0 } });
  const mbaSsd = await prisma.productOptionGroup.create({ data: { productId: mba.id, name: 'Накопичувач', sortOrder: 1 } });
  const mbaM2 = await prisma.productOptionValue.create({ data: { groupId: mbaChip.id, value: 'M2', sortOrder: 0 } });
  const mbaM3 = await prisma.productOptionValue.create({ data: { groupId: mbaChip.id, value: 'M3', sortOrder: 1 } });
  const mba256 = await prisma.productOptionValue.create({ data: { groupId: mbaSsd.id, value: '256 ГБ', sortOrder: 0 } });
  const mba512 = await prisma.productOptionValue.create({ data: { groupId: mbaSsd.id, value: '512 ГБ', sortOrder: 1 } });
  const mba1tb = await prisma.productOptionValue.create({ data: { groupId: mbaSsd.id, value: '1 ТБ', sortOrder: 2 } });

  await createVariant(mba.id, 'M2 / 256 ГБ', 'apple-macbook-air-13-m2-256hb', 44999, 8, [mbaM2.id, mba256.id]);
  await createVariant(mba.id, 'M2 / 512 ГБ', 'apple-macbook-air-13-m2-512hb', 49999, 5, [mbaM2.id, mba512.id]);
  await createVariant(mba.id, 'M3 / 256 ГБ', 'apple-macbook-air-13-m3-256hb', 54999, 6, [mbaM3.id, mba256.id]);
  await createVariant(mba.id, 'M3 / 512 ГБ', 'apple-macbook-air-13-m3-512hb', 59999, 4, [mbaM3.id, mba512.id]);
  await createVariant(mba.id, 'M3 / 1 ТБ', 'apple-macbook-air-13-m3-1tb', 69999, 2, [mbaM3.id, mba1tb.id]);
  console.log('MacBook Air done');

  // ===== 3. ASUS ROG Strix G16 – RAM × Накопичувач =====
  const rog = await prisma.product.create({
    data: { name: 'ASUS ROG Strix G16 (2024)', slug: 'asus-rog-strix-g16-2024', description: 'Ігровий ноутбук з RTX 4070 та Intel Core i9.', basePrice: 89999, categoryId: subGaming.id, isActive: true },
  });
  const rogRam = await prisma.productOptionGroup.create({ data: { productId: rog.id, name: "Оперативна пам'ять", sortOrder: 0 } });
  const rogSsd = await prisma.productOptionGroup.create({ data: { productId: rog.id, name: 'Накопичувач', sortOrder: 1 } });
  const rogR16 = await prisma.productOptionValue.create({ data: { groupId: rogRam.id, value: '16 ГБ', sortOrder: 0 } });
  const rogR32 = await prisma.productOptionValue.create({ data: { groupId: rogRam.id, value: '32 ГБ', sortOrder: 1 } });
  const rogS1 = await prisma.productOptionValue.create({ data: { groupId: rogSsd.id, value: '1 ТБ', sortOrder: 0 } });
  const rogS2 = await prisma.productOptionValue.create({ data: { groupId: rogSsd.id, value: '2 ТБ', sortOrder: 1 } });

  await createVariant(rog.id, '16 ГБ / 1 ТБ', 'asus-rog-strix-g16-2024-16hb-1tb', 89999, 3, [rogR16.id, rogS1.id]);
  await createVariant(rog.id, '32 ГБ / 1 ТБ', 'asus-rog-strix-g16-2024-32hb-1tb', 104999, 2, [rogR32.id, rogS1.id]);
  await createVariant(rog.id, '32 ГБ / 2 ТБ', 'asus-rog-strix-g16-2024-32hb-2tb', 119999, 1, [rogR32.id, rogS2.id]);
  console.log('ASUS ROG done');

  // ===== 4. Lenovo ThinkPad X1 – simple =====
  const tp = await prisma.product.create({
    data: { name: 'Lenovo ThinkPad X1 Carbon Gen 12', slug: 'lenovo-thinkpad-x1-carbon-gen-12', description: 'Легкий бізнес-ноутбук.', basePrice: 74999, categoryId: subBusiness.id, isActive: true },
  });
  await createVariant(tp.id, 'Базова', 'lenovo-thinkpad-x1-carbon-gen-12', 74999, 4, []);
  console.log('ThinkPad done');

  // ===== 5. iPhone 15 Pro – Колір × Пам'ять × Стан =====
  const ip15 = await prisma.product.create({
    data: { name: 'iPhone 15 Pro', slug: 'iphone-15-pro', description: 'Найпродуктивніший iPhone з чіпом A17 Pro.', basePrice: 42999, categoryId: subIPhone.id, isFeatured: true, isActive: true },
  });
  const ipCol = await prisma.productOptionGroup.create({ data: { productId: ip15.id, name: 'Колір', sortOrder: 0 } });
  const ipMem = await prisma.productOptionGroup.create({ data: { productId: ip15.id, name: "Вбудована пам'ять", sortOrder: 1 } });
  const ipStan = await prisma.productOptionGroup.create({ data: { productId: ip15.id, name: 'Стан', sortOrder: 2 } });

  const ipBlk = await prisma.productOptionValue.create({ data: { groupId: ipCol.id, value: 'Чорний титан', sortOrder: 0 } });
  const ipWht = await prisma.productOptionValue.create({ data: { groupId: ipCol.id, value: 'Білий титан', sortOrder: 1 } });
  const ipNat = await prisma.productOptionValue.create({ data: { groupId: ipCol.id, value: 'Натуральний титан', sortOrder: 2 } });
  const ip128 = await prisma.productOptionValue.create({ data: { groupId: ipMem.id, value: '128 ГБ', sortOrder: 0 } });
  const ip256 = await prisma.productOptionValue.create({ data: { groupId: ipMem.id, value: '256 ГБ', sortOrder: 1 } });
  const ip512 = await prisma.productOptionValue.create({ data: { groupId: ipMem.id, value: '512 ГБ', sortOrder: 2 } });
  const ipNew = await prisma.productOptionValue.create({ data: { groupId: ipStan.id, value: 'Новий', sortOrder: 0 } });
  const ipRef = await prisma.productOptionValue.create({ data: { groupId: ipStan.id, value: 'Відновлений', sortOrder: 1 } });

  const ip15Data = [
    { col: ipBlk, mem: ip128, stan: ipNew, price: 42999, stock: 5 },
    { col: ipBlk, mem: ip256, stan: ipNew, price: 47999, stock: 3 },
    { col: ipBlk, mem: ip512, stan: ipNew, price: 57999, stock: 2 },
    { col: ipWht, mem: ip128, stan: ipNew, price: 42999, stock: 4 },
    { col: ipWht, mem: ip256, stan: ipNew, price: 47999, stock: 0 },
    { col: ipNat, mem: ip128, stan: ipNew, price: 42999, stock: 6 },
    { col: ipNat, mem: ip256, stan: ipNew, price: 47999, stock: 3 },
    { col: ipNat, mem: ip128, stan: ipRef, price: 36999, stock: 3, compareAt: 42999 },
    { col: ipNat, mem: ip256, stan: ipRef, price: 41999, stock: 2, compareAt: 47999 },
  ];
  for (const v of ip15Data) {
    const vname = `${v.col.value} / ${v.mem.value} / ${v.stan.value}`;
    const vslug = `iphone-15-pro-${sl(v.col.value)}-${sl(v.mem.value)}-${sl(v.stan.value)}`;
    await createVariant(ip15.id, vname, vslug, v.price, v.stock, [v.col.id, v.mem.id, v.stan.id], (v as any).compareAt);
  }
  console.log('iPhone 15 Pro done');

  // ===== 6. Samsung Galaxy S24 Ultra – Колір × Пам'ять =====
  const s24 = await prisma.product.create({
    data: { name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', description: 'Флагман Samsung із вбудованим пером S Pen.', basePrice: 54999, categoryId: subSamsung.id, isActive: true },
  });
  const s24Col = await prisma.productOptionGroup.create({ data: { productId: s24.id, name: 'Колір', sortOrder: 0 } });
  const s24Mem = await prisma.productOptionGroup.create({ data: { productId: s24.id, name: "Вбудована пам'ять", sortOrder: 1 } });
  const s24Blk = await prisma.productOptionValue.create({ data: { groupId: s24Col.id, value: 'Titanium Black', sortOrder: 0 } });
  const s24Vlt = await prisma.productOptionValue.create({ data: { groupId: s24Col.id, value: 'Titanium Violet', sortOrder: 1 } });
  const s24Grn = await prisma.productOptionValue.create({ data: { groupId: s24Col.id, value: 'Titanium Green', sortOrder: 2 } });
  const s24_256 = await prisma.productOptionValue.create({ data: { groupId: s24Mem.id, value: '256 ГБ', sortOrder: 0 } });
  const s24_512 = await prisma.productOptionValue.create({ data: { groupId: s24Mem.id, value: '512 ГБ', sortOrder: 1 } });

  for (const [col, mem, price, stock] of [
    [s24Blk, s24_256, 54999, 5], [s24Blk, s24_512, 64999, 3],
    [s24Vlt, s24_256, 54999, 4], [s24Vlt, s24_512, 64999, 2],
    [s24Grn, s24_256, 54999, 6], [s24Grn, s24_512, 64999, 1],
  ] as [any, any, number, number][]) {
    await createVariant(s24.id, `${col.value} / ${mem.value}`, `samsung-galaxy-s24-ultra-${sl(col.value)}-${sl(mem.value)}`, price, stock, [col.id, mem.id]);
  }
  console.log('Samsung S24 done');

  // ===== 7. Sony WH-1000XM5 – Колір =====
  const sony = await prisma.product.create({
    data: { name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', description: 'Найкращі навушники з шумопоглинанням.', basePrice: 14999, categoryId: subNakushniki.id, isFeatured: true, isActive: true },
  });
  const sonyCol = await prisma.productOptionGroup.create({ data: { productId: sony.id, name: 'Колір', sortOrder: 0 } });
  const sonyBlk = await prisma.productOptionValue.create({ data: { groupId: sonyCol.id, value: 'Чорний', sortOrder: 0 } });
  const sonySilv = await prisma.productOptionValue.create({ data: { groupId: sonyCol.id, value: 'Срібний', sortOrder: 1 } });
  await createVariant(sony.id, 'Чорний', `sony-wh-1000xm5-chornyy`, 14999, 8, [sonyBlk.id]);
  await createVariant(sony.id, 'Срібний', `sony-wh-1000xm5-sribnyy`, 14999, 5, [sonySilv.id]);
  console.log('Sony done');

  // ===== 8. AirPods Pro 2 – simple =====
  const ap = await prisma.product.create({
    data: { name: 'Apple AirPods Pro 2 (USB-C)', slug: 'apple-airpods-pro-2-usb-c', description: 'Безпровідні навушники з активним шумопоглинанням.', basePrice: 8999, categoryId: subNakushniki.id, isActive: true },
  });
  await createVariant(ap.id, 'Стандарт', 'apple-airpods-pro-2-usb-c', 8999, 12, []);
  console.log('AirPods done');

  // ===== 9. Кабель USB-C – Довжина × Колір =====
  const cable = await prisma.product.create({
    data: { name: 'Кабель USB-C to USB-C (240W)', slug: 'kabel-usb-c-usb-c-240w', description: 'Швидкісний кабель для заряджання та передачі даних.', basePrice: 599, categoryId: subKably.id, isActive: true },
  });
  const cLen = await prisma.productOptionGroup.create({ data: { productId: cable.id, name: 'Довжина', sortOrder: 0 } });
  const cCol = await prisma.productOptionGroup.create({ data: { productId: cable.id, name: 'Колір', sortOrder: 1 } });
  const c1m = await prisma.productOptionValue.create({ data: { groupId: cLen.id, value: '1 м', sortOrder: 0 } });
  const c2m = await prisma.productOptionValue.create({ data: { groupId: cLen.id, value: '2 м', sortOrder: 1 } });
  const cBlk = await prisma.productOptionValue.create({ data: { groupId: cCol.id, value: 'Чорний', sortOrder: 0 } });
  const cWht = await prisma.productOptionValue.create({ data: { groupId: cCol.id, value: 'Білий', sortOrder: 1 } });
  const cGry = await prisma.productOptionValue.create({ data: { groupId: cCol.id, value: 'Сірий', sortOrder: 2 } });
  for (const [len, col, price, stock] of [
    [c1m, cBlk, 599, 20], [c1m, cWht, 599, 18], [c1m, cGry, 599, 15],
    [c2m, cBlk, 799, 10], [c2m, cWht, 799, 8],  [c2m, cGry, 799, 12],
  ] as [any,any,number,number][]) {
    await createVariant(cable.id, `${len.value} / ${col.value}`, `kabel-usb-c-usb-c-240w-${sl(len.value)}-${sl(col.value)}`, price, stock, [len.id, col.id]);
  }
  console.log('Cable done');

  // ===== 10. Чохол MagSafe – Модель × Колір =====
  const chohol = await prisma.product.create({
    data: { name: 'Чохол MagSafe Leather Case', slug: 'chohol-magsafe-leather-case', description: 'Шкіряний чохол з підтримкою MagSafe.', basePrice: 1299, categoryId: subChohly.id, isActive: true },
  });
  const chMod = await prisma.productOptionGroup.create({ data: { productId: chohol.id, name: 'Модель iPhone', sortOrder: 0 } });
  const chCol = await prisma.productOptionGroup.create({ data: { productId: chohol.id, name: 'Колір', sortOrder: 1 } });
  const ch15 = await prisma.productOptionValue.create({ data: { groupId: chMod.id, value: 'iPhone 15', sortOrder: 0 } });
  const ch15p = await prisma.productOptionValue.create({ data: { groupId: chMod.id, value: 'iPhone 15 Pro', sortOrder: 1 } });
  const ch16 = await prisma.productOptionValue.create({ data: { groupId: chMod.id, value: 'iPhone 16', sortOrder: 2 } });
  const chBrn = await prisma.productOptionValue.create({ data: { groupId: chCol.id, value: 'Brown', sortOrder: 0 } });
  const chBlk = await prisma.productOptionValue.create({ data: { groupId: chCol.id, value: 'Black', sortOrder: 1 } });
  const chMid = await prisma.productOptionValue.create({ data: { groupId: chCol.id, value: 'Midnight', sortOrder: 2 } });
  for (const [model, col, price, stock] of [
    [ch15, chBrn, 1299, 5], [ch15, chBlk, 1299, 4],
    [ch15p, chBrn, 1399, 6], [ch15p, chBlk, 1399, 0], [ch15p, chMid, 1399, 3],
    [ch16, chBrn, 1499, 7], [ch16, chBlk, 1499, 5], [ch16, chMid, 1499, 2],
  ] as [any,any,number,number][]) {
    await createVariant(chohol.id, `${model.value} / ${col.value}`, `chohol-magsafe-${sl(model.value)}-${sl(col.value)}`, price, stock, [model.id, col.id]);
  }
  console.log('Чохол done');

  console.log('\n✅ Demo seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
