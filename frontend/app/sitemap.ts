import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartline.com.ua';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchJSON(path: string) {
  try {
    const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contacts`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const [categoriesRes, productsRes] = await Promise.all([
    fetchJSON('/categories'),
    fetchJSON('/products?limit=1000'),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = (categoriesRes || []).flatMap((cat: any) => {
    const routes = [{ url: `${BASE_URL}/catalog/${cat.slug}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 }];
    for (const sub of cat.children || []) {
      routes.push({ url: `${BASE_URL}/catalog/${sub.slug}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 });
    }
    return routes;
  });

  const productRoutes: MetadataRoute.Sitemap = ((productsRes?.data) || []).map((p: any) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
