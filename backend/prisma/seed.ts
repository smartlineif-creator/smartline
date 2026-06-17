import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartline.com.ua' },
    update: {},
    create: {
      email: 'admin@smartline.com.ua',
      password: adminPassword,
      name: 'Адміністратор',
      role: Role.ADMIN,
    },
  });
  console.log('Admin user:', admin.email);

  // Test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@smartline.com.ua' },
    update: {},
    create: {
      email: 'user@smartline.com.ua',
      password: userPassword,
      name: 'Тестовий Користувач',
      phone: '+380501234567',
    },
  });
  console.log('Test user:', user.email);

  // Categories
  const smartphones = await prisma.category.upsert({
    where: { slug: 'smartfony' },
    update: {},
    create: {
      name: 'Смартфони',
      slug: 'smartfony',
      icon: '📱',
      attributeTemplates: {
        create: [
          { name: 'Бренд', sortOrder: 0 },
          { name: 'Діагональ екрану', unit: 'дюйм', sortOrder: 1 },
          { name: 'Оперативна пам\'ять', unit: 'ГБ', sortOrder: 2 },
          { name: 'Вбудована пам\'ять', unit: 'ГБ', sortOrder: 3 },
          { name: 'Батарея', unit: 'мАг', sortOrder: 4 },
        ],
      },
    },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: 'noutbuky' },
    update: {},
    create: {
      name: 'Ноутбуки',
      slug: 'noutbuky',
      icon: '💻',
      attributeTemplates: {
        create: [
          { name: 'Бренд', sortOrder: 0 },
          { name: 'Процесор', sortOrder: 1 },
          { name: 'Оперативна пам\'ять', unit: 'ГБ', sortOrder: 2 },
          { name: 'Розмір екрану', unit: 'дюйм', sortOrder: 3 },
        ],
      },
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'aksesuary' },
    update: {},
    create: {
      name: 'Аксесуари',
      slug: 'aksesuary',
      icon: '🎧',
    },
  });

  console.log('Categories created');

  // Sample products
  const iphone = await prisma.product.upsert({
    where: { slug: 'apple-iphone-15-pro' },
    update: {},
    create: {
      name: 'Apple iPhone 15 Pro',
      slug: 'apple-iphone-15-pro',
      description: '<p>Новий iPhone 15 Pro з чіпом A17 Pro та камерою 48 МП.</p>',
      isFeatured: true,
      categoryId: smartphones.id,
      variants: {
        create: [
          { name: '128 ГБ', price: 44999 },
          { name: '256 ГБ', price: 49999 },
          { name: '512 ГБ', price: 59999 },
        ],
      },
      attributes: {
        create: [
          { name: 'Бренд', value: 'Apple', sortOrder: 0 },
          { name: 'Діагональ екрану', value: '6.1', unit: 'дюйм', sortOrder: 1 },
          { name: 'Оперативна пам\'ять', value: '8', unit: 'ГБ', sortOrder: 2 },
          { name: 'Батарея', value: '3274', unit: 'мАг', sortOrder: 4 },
        ],
      },
      images: {
        create: [{ url: 'https://placehold.co/600x600/1a1a2e/ffffff.png?text=iPhone+15+Pro', isMain: true, sortOrder: 0 }],
      },
    },
  });

  const samsung = await prisma.product.upsert({
    where: { slug: 'samsung-galaxy-s24-ultra' },
    update: {},
    create: {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: '<p>Samsung Galaxy S24 Ultra — флагман з S-Pen та AI можливостями.</p>',
      isFeatured: true,
      categoryId: smartphones.id,
      basePrice: 54999,
      attributes: {
        create: [
          { name: 'Бренд', value: 'Samsung', sortOrder: 0 },
          { name: 'Діагональ екрану', value: '6.8', unit: 'дюйм', sortOrder: 1 },
          { name: 'Оперативна пам\'ять', value: '12', unit: 'ГБ', sortOrder: 2 },
        ],
      },
      images: {
        create: [{ url: 'https://placehold.co/600x600/1428a0/ffffff.png?text=Galaxy+S24+Ultra', isMain: true, sortOrder: 0 }],
      },
    },
  });

  const macbook = await prisma.product.upsert({
    where: { slug: 'apple-macbook-pro-14' },
    update: {},
    create: {
      name: 'Apple MacBook Pro 14"',
      slug: 'apple-macbook-pro-14',
      description: '<p>MacBook Pro 14 з чіпом M3 Pro — для професіоналів.</p>',
      isFeatured: true,
      categoryId: laptops.id,
      basePrice: 79999,
      attributes: {
        create: [
          { name: 'Бренд', value: 'Apple', sortOrder: 0 },
          { name: 'Процесор', value: 'Apple M3 Pro', sortOrder: 1 },
          { name: 'Оперативна пам\'ять', value: '18', unit: 'ГБ', sortOrder: 2 },
          { name: 'Розмір екрану', value: '14.2', unit: 'дюйм', sortOrder: 3 },
        ],
      },
      images: {
        create: [{ url: 'https://placehold.co/600x600/2d2d2d/ffffff.png?text=MacBook+Pro+14', isMain: true, sortOrder: 0 }],
      },
    },
  });

  // Banner
  await prisma.banner.upsert({
    where: { id: 'banner-home-1' },
    update: { imageUrl: 'https://placehold.co/1200x400/1a1a2e/ffffff.png?text=SmartLine+iPhone+15+Pro' },
    create: {
      id: 'banner-home-1',
      title: 'iPhone 15 Pro — тепер у SmartLine',
      imageUrl: 'https://placehold.co/1200x400/1a1a2e/ffffff.png?text=SmartLine+iPhone+15+Pro',
      link: '/product/apple-iphone-15-pro',
      position: 'home',
      sortOrder: 0,
    },
  });

  console.log('Products and banners created');
  console.log('\n✅ Seed completed!');
  console.log('Admin login: admin@smartline.com.ua / admin123');
  console.log('User login: user@smartline.com.ua / user123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
