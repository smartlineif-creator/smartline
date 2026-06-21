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
  promotions?: { promotion: Promotion }[];
  crossSells?: { related: Product }[];
  crossSellsFrom?: { related: Product }[];
  recommendedProducts?: Product[];
  withThisBuyProducts?: Product[];
  accessoryCategories?: Category[];
  recommendedCategoryId?: string | null;
  withThisBuyCategoryId?: string | null;
  accessoryProducts?: Product[];
  similarProducts?: Product[];
  _count?: { reviews: number };
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: Variant;
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
  productId: string;
  authorName: string;
  rating: number;
  text?: string;
  isApproved: boolean;
  createdAt: string;
  user?: { name?: string };
  product?: { name: string; slug: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  availableFilters?: CatalogFilter[];
}

export interface CartLocalItem {
  productId: string;
  variantId?: string;
  /** Product slug — used to fetch product data on the cart page */
  slug?: string;
  quantity: number;
}
