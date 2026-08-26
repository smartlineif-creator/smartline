export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  discount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  seoText?: string;
  sortOrder: number;
  children?: Category[];
  attributeTemplates?: AttributeTemplate[];
  optionGroupTemplates?: OptionGroupTemplate[];
  promotions?: { id: string; discountPercent: number; isActive: boolean; startDate: string; endDate: string }[];
  _count?: {
    children: number;
    products: number;
  };
}

export interface AttributeTemplate {
  id: string;
  name: string;
  unit?: string;
  sortOrder?: number;
  filterable?: boolean;
}

export interface OptionGroupTemplate {
  id: string;
  name: string;
  unit?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface Variant {
  id: string;
  name: string;
  slug?: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  stock: number;
  sku?: string;
  isActive?: boolean;
  selections?: VariantSelection[];
  videoUrl?: string | null;
  description?: string | null;
  images?: ProductImage[];
  attributes?: Attribute[];
}

export interface Attribute {
  id: string;
  name: string;
  value: string;
  unit?: string;
  sortOrder: number;
}

export interface ProductOptionValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  unit?: string | null;
  sortOrder: number;
  values: ProductOptionValue[];
}

export interface VariantSelection {
  id: string;
  optionValue: ProductOptionValue & {
    group: {
      id: string;
      name: string;
      sortOrder: number;
    };
  };
}

export interface Promotion {
  id: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  products?: { productId: string }[];
}

export interface VariantSeo {
  title: string;
  description: string;
  canonicalUrl: string;
}

export interface CatalogFilterValue {
  value: string;
  count: number;
}

export interface CatalogFilter {
  groupName: string;
  values: CatalogFilterValue[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  basePrice?: number | string | null;
  compareAtPrice?: number | string | null;
  stock?: number;
  videoUrl?: string | null;
  isFeatured: boolean;
  badge?: string | null;
  isActive: boolean;
  categoryId: string;
  category?: Category;
  selectedVariantId?: string;
  variantSeo?: VariantSeo;
  optionGroups?: ProductOptionGroup[];
  variants?: Variant[];
  attributes?: Attribute[];
  images?: ProductImage[];
  reviews?: Review[] | { rating: number }[];
  /** Detail-page aggregates over ALL approved reviews — `reviews` holds only the first page. */
  reviewsTotal?: number;
  reviewsAvg?: number;
  promotions?: { promotion: Promotion }[];
  crossSells?: { related: Product }[];
  crossSellsFrom?: { related: Product }[];
  recommendedProducts?: Product[];
  withThisBuyProducts?: Product[];
  accessoryCategories?: Category[];
  recommendedCategoryIds?: string[];
  withThisBuyCategoryIds?: string[];
  accessoryProducts?: Product[];
  similarProducts?: Product[];
  _count?: { reviews: number };
}

export interface OrderItem {
  id: string;
  productId?: string;
  product?: Product;
  variantId?: string;
  variant?: Variant;
  serviceId?: string;
  service?: { id: string; name: string; slug: string; coverImage?: string; price?: number | string };
  tierId?: string;
  name: string;
  variantName?: string;
  price: number | string;
  quantity: number;
}

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number | string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items?: OrderItem[];
  delivery: Record<string, any>;
  payment: Record<string, any>;
  ttn?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: Variant;
  quantity: number;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId?: string;
  serviceId?: string;
  authorName: string;
  rating: number;
  text?: string;
  isApproved: boolean;
  createdAt: string;
  user?: { name?: string };
  product?: { name: string; slug: string };
  service?: { name: string; slug: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  availableFilters?: CatalogFilter[];
  /** Real price bounds of the current selection — placeholders for the price filter. */
  priceRange?: { min: number; max: number } | null;
}

/** Aggregates over the whole order base (not the current page) for admin list tiles. */
export interface OrderListStats {
  total: number;
  newOrders: number;
  inProgress: number;
  revenue: number;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardAttention {
  newOrders: number;
  serviceRequests: number;
  pendingReviews: number;
  outOfStock: number;
  expiringPromotions: number;
}

export type DashboardPeriod = 'today' | '7d' | '30d' | 'all';
export type DashboardBucket = 'hour' | 'day' | 'week';

export interface DashboardMetric {
  value: number;
  deltaPercent: number | null;
}

export interface DashboardStatusBreakdownItem {
  status: OrderStatus;
  count: number;
}

export interface DashboardRevenueBucket {
  bucket: string;
  total: number;
  orders: number;
}

export interface DashboardTopItem {
  kind: 'product' | 'service';
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface DashboardStats {
  period: DashboardPeriod;
  bucket: DashboardBucket;
  metrics: {
    orders: DashboardMetric;
    revenue: DashboardMetric;
    avgOrder: DashboardMetric;
    products: DashboardMetric;
  };
  statusBreakdown: DashboardStatusBreakdownItem[];
  revenueSeries: DashboardRevenueBucket[];
  topItems: DashboardTopItem[];
}

export interface CartLocalItem {
  itemType: 'product' | 'service';
  productId?: string;
  variantId?: string;
  slug?: string;
  serviceId?: string;
  serviceSlug?: string;
  serviceName?: string;
  servicePrice?: number;
  tierId?: string;
  tierLabel?: string;
  quantity: number;
  /** Stock ceiling known at write time. Products only — the server re-checks it on order. */
  maxQuantity?: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface ServiceBlockHeading {
  type: 'heading';
  level?: 1 | 2 | 3;
  text: string;
}

export interface ServiceBlockText {
  type: 'text';
  html: string;
}

export interface ServiceBlockImage {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
}

export interface ServiceBlockList {
  type: 'list';
  title?: string;
  items: string[];
}

export interface ServiceBlockFaq {
  type: 'faq';
  items: { question: string; answer: string }[];
}

export interface ServiceBlockPricing {
  type: 'pricing';
  items: { label: string; price: string; note?: string; featured?: boolean }[];
}

export type ServiceBlock =
  | ServiceBlockHeading
  | ServiceBlockText
  | ServiceBlockImage
  | ServiceBlockList
  | ServiceBlockFaq
  | ServiceBlockPricing;

export interface ServiceTier {
  id: string;
  serviceId: string;
  label: string;
  price: number | string;
  note?: string | null;
  sortOrder: number;
}

/** What the admin form sends: `id` marks an existing row to update, its absence a row to create. */
export interface ServiceTierInput {
  id?: string;
  label: string;
  price: number;
  note?: string;
  sortOrder?: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number | string;
  coverImage?: string;
  isActive: boolean;
  sortOrder: number;
  blocks: ServiceBlock[];
  tiers?: ServiceTier[];
  reviews?: { rating: number }[];
  createdAt: string;
  updatedAt: string;
}

/** Payload shape for create/update — tiers come in as drafts, not full rows. */
export type ServiceInput = Omit<Partial<Service>, 'tiers'> & { tiers?: ServiceTierInput[] };
