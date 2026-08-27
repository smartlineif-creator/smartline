import { MetadataRoute } from 'next';

// Regenerate hourly at runtime — if the API is unreachable during a build, the
// sitemap must not stay frozen with only the static routes until the next deploy.
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartlineif.com';
// NEXT_PUBLIC_API_URL already includes the /api prefix (same convention as
// lib/api.ts) — don't append it again or prod becomes /api/api/... → 404.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchJSON(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// The products endpoint caps limit at 100 (DTO @Max(100)), so a single
// ?limit=1000 request 400s and yields nothing. Page through all products.
async function fetchAllProducts(): Promise<any[]> {
  const LIMIT = 100;
  const first = await fetchJSON(`/products?limit=${LIMIT}&page=1`);
  const data = first?.data;
  if (!Array.isArray(data)) return [];
  const total = typeof first.total === 'number' ? first.total : data.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  if (pages === 1) return data;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      fetchJSON(`/products?limit=${LIMIT}&page=${i + 2}`),
    ),
  );
  return [data, ...rest.map((r) => r?.data || [])].flat();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contacts`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const [categoriesRes, products] = await Promise.all([
    fetchJSON('/categories'),
    fetchAllProducts(),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = (categoriesRes || []).flatMap((cat: any) => {
    const routes = [{ url: `${BASE_URL}/catalog/${cat.slug}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 }];
    for (const sub of cat.children || []) {
      routes.push({ url: `${BASE_URL}/catalog/${sub.slug}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 });
    }
    return routes;
  });

  const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
