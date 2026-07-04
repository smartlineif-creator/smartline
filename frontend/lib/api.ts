import {
  Product, Category, Banner, Promotion, Order, CartItem,
  Review, User, PaginatedResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
let refreshPromise: Promise<boolean> | null = null;

// Auth tokens live in localStorage and are sent via the Authorization header.
// The frontend and backend are on different origins (separate Render services),
// and browsers increasingly block third-party cookies cross-site — httpOnly
// cookies set by the backend can silently fail to persist. Bearer tokens work
// regardless of cookie policy.
//
// Server Components (admin dashboard, product/category edit pages, etc.) run
// on the frontend's own server and have no access to localStorage. To let
// them make authenticated calls too, the access token is mirrored into a
// plain (non-httpOnly) cookie on the FRONTEND's own origin — this is a
// first-party cookie from the browser's perspective (JS on this page sets it
// for this page's domain), so it isn't subject to third-party cookie
// blocking. Server Components read it back via next/headers and forward it
// as a Bearer header.
const ACCESS_TOKEN_KEY = 'sl_access_token';
const REFRESH_TOKEN_KEY = 'sl_refresh_token';
const ACCESS_COOKIE_NAME = 'sl_at';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveTokens(tokens: { accessToken?: string; refreshToken?: string }) {
  if (typeof window === 'undefined') return;
  if (tokens.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    document.cookie = `${ACCESS_COOKIE_NAME}=${tokens.accessToken}; path=/; max-age=900; SameSite=Lax`;
  }
  if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${ACCESS_COOKIE_NAME}=; path=/; max-age=0`;
}

async function getServerAccessToken(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_COOKIE_NAME)?.value ?? null;
  } catch {
    // Not in a request context (e.g. during build), skip
    return null;
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : undefined,
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json().catch(() => null);
        if (data?.accessToken) {
          saveTokens(data);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function shouldTryRefresh(path: string) {
  return ![
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
  ].includes(path);
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  tags?: string[],
): Promise<T> {
  const headers = new Headers(options.headers);
  // Don't set Content-Type for FormData — browser sets it with correct boundary
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = typeof window === 'undefined'
    ? await getServerAccessToken()
    : getAccessToken();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const requestOptions: RequestInit = {
    credentials: 'include',
    ...(tags ? { next: { tags } } : {}),
    ...options,
    headers,
  };

  let res = await fetch(`${API_URL}${path}`, requestOptions);

  if (res.status === 401 && typeof window !== 'undefined' && shouldTryRefresh(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const newAccessToken = getAccessToken();
      if (newAccessToken) headers.set('Authorization', `Bearer ${newAccessToken}`);
      res = await fetch(`${API_URL}${path}`, requestOptions);
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface GetProductsParams {
  categoryId?: string;
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  featured?: string;
  /** Option variant filters: { groupName: values[] } */
  options?: Record<string, string[]>;
}

export async function getProducts(params: GetProductsParams = {}) {
  const { options, ...rest } = params;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) flat[k] = String(v);
  }
  if (options && Object.keys(options).length > 0) {
    flat.options = JSON.stringify(options);
  }
  const query = new URLSearchParams(flat).toString();
  return apiFetch<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`, {
    next: { revalidate: 60 },
  });
}

export async function getProduct(slug: string) {
  return apiFetch<Product>(`/products/${slug}`, { cache: 'no-store' });
}

export async function getFeaturedProducts() {
  return getProducts({ featured: 'true', limit: 8 });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  return apiFetch<Category[]>('/categories', { next: { revalidate: 300 } });
}

export async function getCategoryBySlug(slug: string) {
  return apiFetch<Category>(`/categories/by-slug/${slug}`, { next: { revalidate: 300 } });
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export async function getBanners(position = 'home') {
  return apiFetch<Banner[]>(`/banners?position=${position}`, { next: { revalidate: 60 } });
}

// ─── Promotions ──────────────────────────────────────────────────────────────

export async function getActivePromotions() {
  return apiFetch<Promotion[]>('/promotions', { next: { revalidate: 60 } });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch<PaginatedResponse<Order>>(`/orders${query ? `?${query}` : ''}`);
}

export async function getOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}`);
}

export async function createOrder(data: any) {
  return apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCart() {
  return apiFetch<CartItem[]>('/cart');
}

export async function addToCart(data: { productId: string; variantId?: string; quantity: number }) {
  return apiFetch<CartItem>('/cart/items', { method: 'POST', body: JSON.stringify(data) });
}

export async function removeFromCart(itemId: string) {
  return apiFetch<void>(`/cart/items/${itemId}`, { method: 'DELETE' });
}

export async function mergeCart(items: { productId: string; variantId?: string; quantity: number }[]) {
  return apiFetch<CartItem[]>('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) });
}

export async function clearCartApi() {
  return apiFetch<void>('/cart/clear', { method: 'POST' });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const tokens = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveTokens(tokens);
  return tokens;
}

export async function register(data: { email: string; password: string; name?: string; phone?: string }) {
  const tokens = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  saveTokens(tokens);
  return tokens;
}

export async function logout() {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

export async function getMe() {
  return apiFetch<User>('/auth/me', { method: 'POST' });
}

export async function forgotPassword(email: string) {
  return apiFetch<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function updateProfile(data: { name?: string; phone?: string }) {
  return apiFetch<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<void>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function getReviews(productId: string) {
  return apiFetch<Review[]>(`/reviews?productId=${productId}`);
}

export async function getStoreReviews(page = 1) {
  return apiFetch<PaginatedResponse<Review>>(`/reviews?page=${page}`, {
    next: { revalidate: 300 },
  });
}

export async function createReview(data: any) {
  return apiFetch<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Nova Poshta ─────────────────────────────────────────────────────────────

export async function searchCities(query: string) {
  return apiFetch<any[]>(`/nova-poshta/cities?query=${encodeURIComponent(query)}`);
}

export async function getWarehouses(cityRef: string) {
  return apiFetch<any[]>(`/nova-poshta/warehouses?cityRef=${cityRef}`);
}

export async function searchStreets(cityRef: string, query: string) {
  const params = new URLSearchParams({ cityRef, query });
  return apiFetch<any[]>(`/nova-poshta/streets?${params}`);
}

// ─── Upload ──────────────────────────────────────────────────────────────────

async function convertHeicIfNeeded(file: File): Promise<File> {
  const looksHeic =
    /\.(heic|heif)$/i.test(file.name) || /image\/(heic|heif)/i.test(file.type);
  if (!looksHeic || typeof window === 'undefined') return file;
  const { heicTo } = await import('heic-to/next');
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], name, { type: 'image/jpeg' });
}

export async function uploadImage(file: File): Promise<string> {
  const prepared = await convertHeicIfNeeded(file);
  const formData = new FormData();
  formData.append('file', prepared);
  const data = await apiFetch<{ url: string }>('/upload/image', {
    method: 'POST',
    body: formData,
  });
  return data.url;
}

export async function uploadVideo(file: File): Promise<string> {
  // Step 1: get presigned URL from backend (fast, no body transfer)
  const presignRes = await fetch(`${API_URL}/upload/presign-video`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name }),
  });
  if (!presignRes.ok) throw new Error('Failed to get upload URL');
  const { uploadUrl, publicUrl } = await presignRes.json();

  // Step 2: upload directly to R2 (no backend in the middle)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error('Video upload to storage failed');

  return publicUrl;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function adminGetAllOrders(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch<PaginatedResponse<Order>>(`/orders?${query}`);
}

export async function adminGetOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}`);
}

export async function adminUpdateOrderStatus(id: string, data: any) {
  return apiFetch<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminGetUsers(page = 1) {
  return apiFetch<PaginatedResponse<User>>(`/users?page=${page}`);
}

export async function adminUpdateUser(id: string, data: any) {
  return apiFetch<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminGetOrderStats() {
  return apiFetch<{ todayOrders: number; newOrders: number; todayRevenue: number }>('/orders/stats');
}

export async function adminGetProductCount() {
  return apiFetch<{ count: number }>('/products/count');
}

export async function adminGetProducts(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return apiFetch<PaginatedResponse<Product>>(`/products/admin${query ? `?${query}` : ''}`);
}

export async function adminCreateProduct(data: any) {
  return apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminGetProduct(id: string) {
  return apiFetch<Product>(`/products/admin/${id}`);
}

export async function adminGetOptionGroupNames(categoryId?: string): Promise<string[]> {
  const params = categoryId ? `?categoryId=${categoryId}` : '';
  return apiFetch<string[]>(`/products/option-group-names${params}`);
}

export async function adminGetAttributeValues(name: string, categoryId?: string): Promise<string[]> {
  const params = new URLSearchParams({ name });
  if (categoryId) params.set('categoryId', categoryId);
  return apiFetch<string[]>(`/products/attribute-values?${params}`);
}

export async function adminGetBadges(): Promise<{ value: string; count: number }[]> {
  return apiFetch<{ value: string; count: number }[]>('/products/badges');
}

export async function adminDeleteBadge(value: string): Promise<{ count: number }> {
  return apiFetch<{ count: number }>(
    `/products/badges?value=${encodeURIComponent(value)}`,
    { method: 'DELETE' },
  );
}

export async function adminGetProductOptions(params: { q?: string; limit?: number } = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  return apiFetch<Product[]>(`/products/admin/list${query ? `?${query}` : ''}`);
}

export async function adminUpdateProduct(id: string, data: any) {
  return apiFetch<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminDeleteProduct(id: string) {
  return apiFetch<void>(`/products/${id}`, { method: 'DELETE' });
}

export async function adminDuplicateProduct(id: string) {
  return apiFetch<Product>(`/products/${id}/duplicate`, { method: 'POST' });
}

export async function adminAddProductImages(productId: string, images: { url: string; isMain?: boolean }[]) {
  return apiFetch<void>(`/products/${productId}/images`, { method: 'POST', body: JSON.stringify({ images }) });
}

export async function adminSetCrossSell(productId: string, relatedIds: string[]) {
  return apiFetch<void>(`/products/${productId}/cross-sell`, { method: 'POST', body: JSON.stringify({ relatedIds }) });
}

export async function adminCreateCategory(data: any) {
  return apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function getAdminCategory(id: string) {
  return apiFetch<Category>(`/categories/${id}`);
}

export async function adminUpdateCategory(id: string, data: any) {
  return apiFetch<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminDeleteCategory(id: string) {
  return apiFetch<void>(`/categories/${id}`, { method: 'DELETE' });
}

export async function adminGetPromotions() {
  return apiFetch<PaginatedResponse<Promotion>>('/promotions?all=true');
}

export async function adminCreatePromotion(data: any) {
  return apiFetch<Promotion>('/promotions', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminUpdatePromotion(id: string, data: any) {
  return apiFetch<Promotion>(`/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminDeletePromotion(id: string) {
  return apiFetch<void>(`/promotions/${id}`, { method: 'DELETE' });
}

export async function adminGetBanners() {
  return apiFetch<Banner[]>('/banners?all=true');
}

export async function adminCreateBanner(data: any) {
  return apiFetch<Banner>('/banners', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminUpdateBanner(id: string, data: any) {
  return apiFetch<Banner>(`/banners/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminDeleteBanner(id: string) {
  return apiFetch<void>(`/banners/${id}`, { method: 'DELETE' });
}

export async function adminGetReviews(approved?: boolean) {
  const q = approved !== undefined ? `?approved=${approved}` : '';
  return apiFetch<PaginatedResponse<Review>>(`/reviews${q}`);
}

export async function adminApproveReview(id: string) {
  return apiFetch<Review>(`/reviews/${id}/approve`, { method: 'PATCH' });
}

export async function adminDeleteReview(id: string) {
  return apiFetch<void>(`/reviews/${id}`, { method: 'DELETE' });
}

// ─── Homepage Builder ────────────────────────────────────────────────────────

export interface HomepageSectionData {
  id: string;
  type: string;
  order: number;
  isActive: boolean;
  config: Record<string, any>;
}

export async function getHomepageSections() {
  return apiFetch<HomepageSectionData[]>('/homepage/sections', { cache: 'no-store' });
}

export async function adminGetHomepageSections() {
  return apiFetch<HomepageSectionData[]>('/homepage/sections/all');
}

export async function adminCreateHomepageSection(data: Partial<HomepageSectionData>) {
  return apiFetch<HomepageSectionData>('/homepage/sections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateHomepageSection(id: string, data: Partial<HomepageSectionData>) {
  return apiFetch<HomepageSectionData>(`/homepage/sections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminReorderHomepageSections(sections: { id: string; order: number }[]) {
  return apiFetch<HomepageSectionData[]>('/homepage/sections/reorder', {
    method: 'PUT',
    body: JSON.stringify({ sections }),
  });
}

export async function adminDeleteHomepageSection(id: string) {
  return apiFetch<void>(`/homepage/sections/${id}`, { method: 'DELETE' });
}

export async function createPayment(orderId: string) {
  return apiFetch<{ pageUrl: string }>('/payment/create', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}
