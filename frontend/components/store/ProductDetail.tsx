'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, Variant, Attribute } from '@/types';
import {
  cn,
  formatPrice,
  getProductDisplayPrices,
  getProductDisplayName,
  getProductHref,
  getProductStock,
  getMainImage,
} from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { createReview } from '@/lib/api';
import WishlistButton from './WishlistButton';

interface Props {
  product: Product;
}

const ATTRIBUTE_PRIORITY_RULES: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /бренд|виробник/i, score: 90 },
  { pattern: /модель|серія|тип процесора|модель процесора|чіп|процесор/i, score: 100 },
  { pattern: /оперативн.*пам|ram/i, score: 98 },
  { pattern: /вбудован.*пам|об.?єм ssd|об.?єм hdd|накопичувач|пам.?ять/i, score: 97 },
  { pattern: /діагонал|екран|диспле|матриц|роздільна здатність|refresh|частота оновлення/i, score: 96 },
  { pattern: /камер|мп|сенсор/i, score: 94 },
  { pattern: /відео|граф|gpu/i, score: 95 },
  { pattern: /батар|акумулятор|ємність/i, score: 93 },
  { pattern: /стан|колір|матеріал|корпус/i, score: 92 },
  { pattern: /вага|ширина|висота|довжина|товщина|розмір/i, score: 84 },
  { pattern: /інтерфейс|bluetooth|wi-?fi|usb|nfc|sim|мереж/i, score: 82 },
  { pattern: /ос|операційн|windows|android|ios/i, score: 86 },
  { pattern: /гарант/i, score: 70 },
];

const ATTRIBUTE_HIDE_RULES = [
  /два відеоадаптери/i,
  /два жорстк/i,
];

const ATTRIBUTE_GROUPS: Array<{ title: string; pattern: RegExp }> = [
  { title: 'Основне', pattern: /бренд|виробник|тип$|стан|колір|матеріал|модель|серія|призначення|сумісність|форм-фактор/i },
  { title: 'Продуктивність', pattern: /процесор|чіп|cpu|ядер|частота|gpu|відео|граф/i },
  { title: "Пам'ять і накопичувач", pattern: /оперативн.*пам|ram|ssd|hdd|накопичувач|вбудован.*пам|об.?єм/i },
  { title: 'Дисплей', pattern: /екран|диспле|матриц|роздільна здатність|частота оновлення|діагонал|сенсор/i },
  { title: 'Підключення і функції', pattern: /bluetooth|wi-?fi|usb|nfc|sim|мереж|інтерфейс|порт|камера|мікрофон|динамік|кардридер|ос|операційн/i },
  { title: 'Габарити і живлення', pattern: /вага|ширина|висота|довжина|товщина|розмір|батар|акумулятор|живлення/i },
];

function getVariantSelections(variant?: Variant) {
  return Object.fromEntries(
    (variant?.selections || []).map((selection) => [selection.optionValue.group.name, selection.optionValue.value]),
  );
}

function matchesSelections(variant: Variant, selectedOptions: Record<string, string>) {
  const variantSelections = getVariantSelections(variant);
  return Object.entries(selectedOptions).every(([groupName, value]) => variantSelections[groupName] === value);
}

function findCompatibleVariant(
  variants: Variant[],
  selectedOptions: Record<string, string>,
  preferredGroupName?: string,
  requireInStock = false,
) {
  const exactMatch = variants.find((variant) => {
    const variantSelections = getVariantSelections(variant);
    const selectionKeys = Object.keys(variantSelections);
    return selectionKeys.length > 0
      && (!requireInStock || variant.stock > 0)
      && selectionKeys.every((key) => selectedOptions[key] === variantSelections[key]);
  });
  if (exactMatch) return exactMatch;
  return variants.find((variant) => {
    if (preferredGroupName && getVariantSelections(variant)[preferredGroupName] !== selectedOptions[preferredGroupName]) return false;
    if (requireInStock && variant.stock <= 0) return false;
    return matchesSelections(variant, selectedOptions);
  }) || variants.find((variant) => {
    if (!preferredGroupName) return false;
    if (requireInStock && variant.stock <= 0) return false;
    return getVariantSelections(variant)[preferredGroupName] === selectedOptions[preferredGroupName];
  });
}

function dedupeAttributes(attributes: Attribute[]) {
  const seen = new Set<string>();
  return attributes.filter((attribute) => {
    const key = `${attribute.name}::${attribute.value}::${attribute.unit || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatAttribute(attribute: Attribute) {
  return `${attribute.value}${attribute.unit ? ` ${attribute.unit}` : ''}`;
}

function normalizeAttributeName(name: string) {
  return name.toLowerCase().replace(/[''`"]/g, '').replace(/\s+/g, ' ').trim();
}

function shouldHideAttribute(attribute: Attribute) {
  return ATTRIBUTE_HIDE_RULES.some((pattern) => pattern.test(attribute.name));
}

function getAttributePriorityScore(attribute: Attribute, categoryName?: string) {
  const normalizedName = normalizeAttributeName(attribute.name);
  let score = 0;
  for (const rule of ATTRIBUTE_PRIORITY_RULES) {
    if (rule.pattern.test(normalizedName)) score = Math.max(score, rule.score);
  }
  if (categoryName && new RegExp(categoryName, 'i').test(attribute.value)) score += 2;
  if (attribute.unit) score += 1;
  return score;
}

function pickPriorityAttributes(attributes: Attribute[], categoryName?: string) {
  return [...attributes]
    .sort((a, b) => {
      const scoreDiff = getAttributePriorityScore(b, categoryName) - getAttributePriorityScore(a, categoryName);
      if (scoreDiff !== 0) return scoreDiff;
      return a.sortOrder - b.sortOrder;
    })
    .slice(0, 6);
}

function groupAttributes(attributes: Attribute[]) {
  const groups = ATTRIBUTE_GROUPS.map((group) => ({ title: group.title, items: [] as Attribute[] }));
  const otherGroup = { title: 'Інші характеристики', items: [] as Attribute[] };
  for (const attribute of attributes) {
    const matchingGroup = ATTRIBUTE_GROUPS.find((group) => group.pattern.test(attribute.name));
    if (!matchingGroup) { otherGroup.items.push(attribute); continue; }
    const bucket = groups.find((group) => group.title === matchingGroup.title);
    bucket?.items.push(attribute);
  }
  return [
    ...groups.filter((group) => group.items.length > 0),
    ...(otherGroup.items.length > 0 ? [otherGroup] : []),
  ];
}

function getShelfMeta(product: Product) {
  return (product.attributes || [])
    .filter((attribute) => /бренд|виробник|процесор|чіп|оперативн.*пам|ram|ssd|hdd|накопичувач|екран|діагонал|стан|колір/i.test(attribute.name))
    .slice(0, 2)
    .map((attribute) => `${attribute.value}${attribute.unit ? ` ${attribute.unit}` : ''}`);
}

function ProductShelf({ title, description, products }: { title: string; description: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section
      className="mt-14 rounded-2xl p-5 sm:p-6"
      style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            {title.toUpperCase()}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>{description}</p>
        </div>
        <div className="text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
          {products.length} позицій
        </div>
      </div>
      <div className="-mx-2 overflow-x-auto px-2 pt-2 pb-6 -mt-2 -mb-6">
        <div className="flex min-w-max snap-x snap-mandatory gap-4">
          {products.map((item) => (
            <ProductShelfCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShelfCard({ item }: { item: Product }) {
  const { finalPrice, crossedPrice, promo } = getProductDisplayPrices(item);
  const highlights = getShelfMeta(item);
  return (
    <article
      className="group/shelf w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl transition-all duration-300"
      style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--sl-border-hover)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--sl-border)';
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <Link href={getProductHref(item)} className="relative block aspect-[4/3] overflow-hidden" style={{ background: 'var(--sl-bg-primary)' }}>
        <Image
          src={getMainImage(item)}
          alt={item.name}
          fill
          className="object-contain p-5 transition-transform duration-500 group-hover/shelf:scale-105"
          sizes="260px"
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {promo && (
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}>
              -{promo.discountPercent}%
            </span>
          )}
          {item.isFeatured && !promo && (
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}>
              ХІТ
            </span>
          )}
        </div>
        {/* Hover overlay — same style as ProductCard */}
        {highlights.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition-all duration-200 md:block group-hover/shelf:translate-y-0 group-hover/shelf:opacity-100">
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: 'var(--sl-bg-surface-glass)', border: '1px solid var(--sl-border)', backdropFilter: 'blur(12px)' }}
            >
              <div
                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--sl-text-muted)', borderBottom: '1px solid var(--sl-border)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Характеристики
              </div>
              <div className="px-3 py-2" style={{ display: 'grid', gap: '5px' }}>
                {highlights.map((val, i) => (
                  <span key={i} className="truncate text-xs font-semibold leading-tight" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link
          href={getProductHref(item)}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-[1.4]"
          style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)')}
        >
          {item.name}
        </Link>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
              {formatPrice(finalPrice)}
            </span>
            {crossedPrice && (
              <span className="text-xs line-through" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                {formatPrice(crossedPrice)}
              </span>
            )}
          </div>
          <Link
            href={getProductHref(item)}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--sl-accent-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--sl-accent)')}
          >
            Дивитись
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ProductDetail({ product }: Props) {
  const router = useRouter();
  const configurableGroups = product.optionGroups || [];
  const variants = useMemo(() => product.variants || [], [product.variants]);
  const hasConfigurableOptions = configurableGroups.length > 0 && variants.some((variant) => (variant.selections || []).length > 0);
  const firstVariant = variants.find((variant) => variant.id === product.selectedVariantId) || variants[0];

  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(() => firstVariant);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => (
    hasConfigurableOptions ? getVariantSelections(firstVariant) : {}
  ));
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllAttrs, setShowAllAttrs] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const resolvedVariant = useMemo(() => {
    if (!hasConfigurableOptions) return selectedVariant;
    return findCompatibleVariant(variants, selectedOptions) || selectedVariant || firstVariant;
  }, [firstVariant, hasConfigurableOptions, selectedOptions, selectedVariant, variants]);

  const { finalPrice, crossedPrice, promo } = getProductDisplayPrices(product, resolvedVariant);
  const displayName = getProductDisplayName(product, resolvedVariant);
  const images = product.images || [];
  const reviews = (product as Product & { reviews?: any[] }).reviews || [];
  const attributes = useMemo(
    () => dedupeAttributes((product.attributes || []).filter((attribute) => !shouldHideAttribute(attribute))),
    [product.attributes],
  );
  const recommendedProducts = product.recommendedProducts || [];
  const withThisBuyProducts = product.withThisBuyProducts || [];
  const accessoryProducts = product.accessoryProducts || [];
  const similarProducts = product.similarProducts || [];
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    : 0;
  const currentStock = getProductStock(product, resolvedVariant);
  const isOutOfStock = currentStock <= 0;

  const priorityAttributes = useMemo(() => pickPriorityAttributes(attributes, product.category?.name), [attributes, product.category?.name]);
  const secondaryAttributes = useMemo(() => {
    const priorityKeys = new Set(priorityAttributes.map((attribute) => `${attribute.name}::${attribute.value}`));
    return attributes.filter((attribute) => !priorityKeys.has(`${attribute.name}::${attribute.value}`));
  }, [attributes, priorityAttributes]);
  const visibleAttributes = useMemo(
    () => (showAllAttrs
      ? [...priorityAttributes, ...secondaryAttributes]
      : [...priorityAttributes, ...secondaryAttributes.slice(0, Math.max(0, 12 - priorityAttributes.length))]),
    [priorityAttributes, secondaryAttributes, showAllAttrs],
  );
  const groupedVisibleAttributes = useMemo(() => groupAttributes(visibleAttributes), [visibleAttributes]);

  const trustPoints = [
    { icon: CheckCircle2, title: currentStock > 0 ? 'Готовий до замовлення' : 'Актуальна картка', text: currentStock > 0 ? `${currentStock} шт. у системі` : 'Перевір опис і характеристики' },
    { icon: ShieldCheck, title: 'Прозорі характеристики', text: `${attributes.length} параметрів для порівняння` },
    { icon: Truck, title: 'Швидке оформлення', text: 'Один клік у кошик і далі checkout' },
    { icon: CreditCard, title: 'Зручна оплата', text: 'Можна перейти до покупки одразу' },
  ];

  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const addedTimerRef = useRef<number | null>(null);

  const handleAddToCart = useCallback(() => {
    addItem({ productId: product.id, variantId: resolvedVariant?.id, slug: resolvedVariant?.slug ?? product.slug, quantity: qty });
    toast.success(`${displayName} × ${qty} додано в кошик`);

    // Restart CSS animation via force-reflow (React 18 batching workaround)
    const btn = cartBtnRef.current;
    if (btn) {
      btn.classList.remove('sl-btn-cart-animate');
      void btn.offsetWidth; // trigger reflow — forces browser to reset animation state
      btn.classList.add('sl-btn-cart-animate');
      // Clean up class after the longest animation (ripple: 0.6s) so next click reruns it
      const onEnd = (e: AnimationEvent) => {
        if (e.animationName === 'sl-cart-ripple') {
          btn.classList.remove('sl-btn-cart-animate');
          btn.removeEventListener('animationend', onEnd);
        }
      };
      btn.addEventListener('animationend', onEnd);
    }

    // "Додано!" state
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAddedToCart(true);
    addedTimerRef.current = window.setTimeout(() => setAddedToCart(false), 1800);
  }, [addItem, product.id, resolvedVariant, qty, displayName]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview({ productId: product.id, authorName: reviewName, rating: reviewRating, text: reviewText });
      toast.success('Відгук надіслано на модерацію');
      setReviewText('');
      setReviewName('');
    } catch {
      toast.error('Помилка надсилання відгуку');
    }
  };

  const handleOptionSelect = (groupName: string, value: string) => {
    const nextSelectedOptions = { ...selectedOptions, [groupName]: value };
    const compatibleVariant = findCompatibleVariant(variants, nextSelectedOptions, groupName, true);
    if (!compatibleVariant) return;
    setSelectedOptions(getVariantSelections(compatibleVariant));
    setSelectedVariant(compatibleVariant);
    if (compatibleVariant.slug) router.replace(`/product/${compatibleVariant.slug}`, { scroll: false });
  };

  const isValueAvailable = (groupName: string, value: string) => {
    const nextSelectedOptions = { ...selectedOptions, [groupName]: value };
    // Суворий пошук: варіант має відповідати ВСІМ обраним опціям одночасно.
    // Loose fallback у findCompatibleVariant може знайти "iPhone 15 / Midnight"
    // коли вибрано "iPhone 15 Pro Max" — тому використовуємо власну перевірку.
    return variants.some((variant) => {
      const variantSelections = getVariantSelections(variant);
      return Object.entries(nextSelectedOptions).every(
        ([key, val]) => !variantSelections[key] || variantSelections[key] === val,
      );
    });
  };

  return (
    <div style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 pb-40 pt-6 sm:px-6 md:pb-16 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm" style={{ fontFamily: 'var(--sl-font-mono)' }}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href="/"
              style={{ color: 'var(--sl-text-muted)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-text-muted)')}
            >
              Головна
            </Link>
            <span style={{ color: 'var(--sl-border-hover)' }}>/</span>
            <Link
              href={`/catalog/${product.category?.slug}`}
              style={{ color: 'var(--sl-text-muted)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-text-muted)')}
            >
              {product.category?.name}
            </Link>
            <span style={{ color: 'var(--sl-border-hover)' }}>/</span>
            <span className="line-clamp-1" style={{ color: 'var(--sl-text-secondary)' }}>{displayName}</span>
          </div>
        </nav>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1.08fr)_420px]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Gallery */}
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_96px]">
              <div className="lg:order-1">
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl"
                  style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                >
                  <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs"
                      style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', border: '1px solid var(--sl-border)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      Реальні фото
                    </span>
                    {product.category?.name && (
                      <span
                        className="rounded-full px-3 py-1 text-xs"
                        style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', border: '1px solid var(--sl-border)', fontFamily: 'var(--sl-font-mono)' }}
                      >
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <Image
                    src={images[selectedImage]?.url || '/placeholder.svg'}
                    alt={images[selectedImage]?.alt || displayName}
                    fill
                    priority
                    className="object-contain p-4 sm:p-8"
                    sizes="(max-width: 1280px) 100vw, 720px"
                  />
                </div>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto lg:order-2 lg:flex-col lg:overflow-visible">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-all"
                      style={{
                        background: 'var(--sl-bg-elevated)',
                        border: `1px solid ${index === selectedImage ? 'var(--sl-accent)' : 'var(--sl-border)'}`,
                        boxShadow: index === selectedImage ? '0 0 0 2px var(--sl-accent-glow)' : 'none',
                      }}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt || `${displayName}, фото ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Product video */}
            {product.videoUrl && (
              <section>
                <video
                  src={product.videoUrl}
                  controls
                  playsInline
                  className="w-full rounded-2xl object-contain"
                  style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                />
              </section>
            )}

            {/* Priority attributes cards */}
            {priorityAttributes.length > 0 && (
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {priorityAttributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className="rounded-xl px-4 py-4"
                    style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                  >
                    <p
                      className="mb-1 text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {attribute.name}
                    </p>
                    <p
                      className="text-base font-semibold"
                      style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {formatAttribute(attribute)}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* Trust strip */}
            <section
              className="rounded-xl p-5 sm:p-6"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {trustPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <div key={point.title} className="space-y-2">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--sl-text-primary)' }}>{point.title}</p>
                        <p className="text-sm leading-5" style={{ color: 'var(--sl-text-muted)' }}>{point.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right: sticky buy panel */}
          <aside className="md:sticky md:top-[68px] md:self-start">
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--sl-bg-surface)',
                border: '1px solid var(--sl-border)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              }}
            >
              {/* Status badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    background: currentStock > 0 ? 'color-mix(in srgb, var(--sl-status-success) 10%, transparent)' : 'color-mix(in srgb, var(--sl-status-warning) 10%, transparent)',
                    color: currentStock > 0 ? 'var(--sl-status-success)' : 'var(--sl-status-warning)',
                    border: `1px solid ${currentStock > 0 ? 'color-mix(in srgb, var(--sl-status-success) 30%, transparent)' : 'color-mix(in srgb, var(--sl-status-warning) 30%, transparent)'}`,
                    fontFamily: 'var(--sl-font-mono)',
                  }}
                >
                  {currentStock > 0 ? 'В наявності' : 'Наявність уточнюється'}
                </span>
                {promo && (
                  <span
                    className="rounded-full px-3 py-1 text-sm font-bold"
                    style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
                  >
                    -{promo.discountPercent}%
                  </span>
                )}
              </div>

              <h1
                className="mb-3 text-2xl font-semibold leading-tight"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
              >
                {displayName}
              </h1>

              {/* SKU / Rating row */}
              <div
                className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                {(resolvedVariant?.sku || product.sku) && (
                  <span>
                    Артикул: <span style={{ color: 'var(--sl-text-secondary)' }}>{resolvedVariant?.sku || product.sku}</span>
                  </span>
                )}
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5" style={{ color: 'var(--sl-accent)' }}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star key={index} className={cn('h-4 w-4', index < Math.round(averageRating) ? 'fill-current' : '')} style={{ opacity: index < Math.round(averageRating) ? 1 : 0.3 }} />
                      ))}
                    </div>
                    <span style={{ color: 'var(--sl-text-secondary)' }}>{averageRating.toFixed(1)}</span>
                    <span>({reviews.length})</span>
                  </div>
                ) : (
                  <span>Новий товар у каталозі</span>
                )}
              </div>

              {/* Price box */}
              <div
                className="mb-6 rounded-xl px-5 py-4"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
              >
                <div className="flex items-end gap-3">
                  <span
                    className="text-4xl font-semibold tracking-tight"
                    style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                  >
                    {formatPrice(finalPrice)}
                  </span>
                  {crossedPrice && (
                    <span
                      className="pb-1 text-lg line-through"
                      style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {formatPrice(crossedPrice)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                  Ціна показана для поточної конфігурації
                </p>
              </div>

              {/* Configurable options */}
              {hasConfigurableOptions && (
                <div className="mb-6 space-y-5">
                  {configurableGroups.map((group) => (
                    <div key={group.id}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--sl-text-secondary)' }}>{group.name}</p>
                        <p className="text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>{selectedOptions[group.name]}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.values.map((value) => {
                          const selected = selectedOptions[group.name] === value.value;
                          const available = isValueAvailable(group.name, value.value);
                          // Ховаємо недоступні комбінації повністю
                          if (!available && !selected) return null;
                          return (
                            <button
                              key={value.id}
                              type="button"
                              onClick={() => handleOptionSelect(group.name, value.value)}
                              className="rounded-xl px-3 py-2 text-sm font-medium transition-all"
                              style={
                                selected
                                  ? { background: 'var(--sl-accent)', color: '#fff', border: '1px solid var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }
                                  : { background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }
                              }
                              onMouseEnter={(e) => {
                                if (!selected) {
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-accent)';
                                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)';
                                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-muted)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!selected) {
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
                                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
                                }
                              }}
                            >
                              {value.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Simple variants */}
              {!hasConfigurableOptions && product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <p className="mb-2 text-sm font-medium" style={{ color: 'var(--sl-text-secondary)' }}>Доступні варіанти</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(variant);
                            if (variant.slug) router.replace(`/product/${variant.slug}`, { scroll: false });
                          }}
                          className="rounded-xl px-3 py-2 text-sm font-medium transition-all"
                          style={
                            isSelected
                              ? { background: 'var(--sl-accent)', color: '#fff', border: '1px solid var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }
                              : { background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }
                          }
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-accent)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)';
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-muted)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
                            }
                          }}
                        >
                          {variant.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="mb-6 grid gap-3">

                {/* Quantity selector row */}
                {!isOutOfStock && (
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)', whiteSpace: 'nowrap' }}
                    >
                      Кількість:
                    </span>
                    <div
                      className="flex items-center rounded-xl"
                      style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                      role="group"
                      aria-label="Кількість товару"
                    >
                      <button
                        type="button"
                        aria-label="Зменшити кількість"
                        disabled={qty <= 1}
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-l-xl transition-all"
                        style={{
                          color: qty <= 1 ? 'var(--sl-text-muted)' : 'var(--sl-text-secondary)',
                          cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => { if (qty > 1) (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = qty <= 1 ? 'var(--sl-text-muted)' : 'var(--sl-text-secondary)'; }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="w-10 text-center text-base font-semibold tabular-nums"
                        aria-live="polite"
                        aria-label={`${qty} штук`}
                        style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Збільшити кількість"
                        disabled={qty >= currentStock}
                        onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-r-xl transition-all"
                        style={{
                          color: qty >= currentStock ? 'var(--sl-text-muted)' : 'var(--sl-text-secondary)',
                          cursor: qty >= currentStock ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => { if (qty < currentStock) (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = qty >= currentStock ? 'var(--sl-text-muted)' : 'var(--sl-text-secondary)'; }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {currentStock <= 5 && (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--sl-status-warning)', fontFamily: 'var(--sl-font-mono)' }}
                      >
                        залишилось {currentStock} шт.
                      </span>
                    )}
                  </div>
                )}

                {/* Add to cart + wishlist row */}
                <div className="flex gap-3">
                  <button
                    ref={cartBtnRef}
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold"
                    style={{
                      background: isOutOfStock
                        ? 'var(--sl-bg-elevated)'
                        : addedToCart
                          ? 'var(--sl-status-success)'
                          : 'var(--sl-accent)',
                      color: isOutOfStock ? 'var(--sl-text-muted)' : '#fff',
                      fontFamily: 'var(--sl-font-mono)',
                      boxShadow: isOutOfStock ? 'none' : '0 0 20px var(--sl-accent-glow-strong)',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      transition: 'background 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock && !addedToCart)
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock && !addedToCart)
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)';
                    }}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="sl-cart-icon h-5 w-5" />
                        Додано!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="sl-cart-icon h-5 w-5" />
                        {isOutOfStock ? 'Немає в наявності' : `Додати в кошик${qty > 1 ? ` (${qty})` : ''}`}
                      </>
                    )}
                  </button>
                  <WishlistButton
                    item={{
                      key: resolvedVariant?.slug ?? resolvedVariant?.id ?? product.id,
                      productId: product.id,
                      variantId: resolvedVariant?.id,
                      slug: resolvedVariant?.slug ?? product.slug,
                      name: displayName,
                      image: getMainImage(product),
                      price: finalPrice ?? 0,
                    }}
                    size="md"
                  />
                </div>

                {/* Buy now */}
                {!isOutOfStock && (
                  <Link
                    href="/checkout"
                    onClick={() => addItem({ productId: product.id, variantId: resolvedVariant?.id, slug: resolvedVariant?.slug ?? product.slug, quantity: qty })}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-all"
                    style={{
                      border: '1px solid var(--sl-accent)',
                      color: 'var(--sl-accent)',
                      background: 'transparent',
                      fontFamily: 'var(--sl-font-mono)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--sl-accent-muted)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    Купити зараз{qty > 1 ? ` (${qty})` : ''}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* Mini trust block */}
              <div
                className="space-y-3 rounded-xl p-4"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
              >
                <div className="flex items-start gap-3">
                  <PackageCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--sl-accent)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--sl-text-primary)' }}>Швидкий старт до рішення</p>
                    <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Головні характеристики й візуали вже над згином.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--sl-accent)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--sl-text-primary)' }}>Менше ризику перед оплатою</p>
                    <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Можна швидко звірити конфігурацію й артикул.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Tabs section */}
        <section className="mt-12">
          <Tabs defaultValue="specs">
            <TabsList
              className="mb-8 flex w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0 text-left"
            >
              {[
                { value: 'specs', label: 'Характеристики' },
                { value: 'description', label: 'Опис' },
                { value: 'reviews', label: `Відгуки (${reviews.length})` },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="sl-tab-trigger rounded-full px-4 py-2 text-sm font-medium"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Specs */}
            <TabsContent value="specs" className="mt-0">
              {visibleAttributes.length > 0 ? (
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                >
                  <div className="px-5 py-4 sm:px-6" style={{ borderBottom: '1px solid var(--sl-border)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>Повні характеристики</h2>
                    <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Важливі параметри для порівняння й швидкого вибору.</p>
                  </div>
                  <div>
                    {groupedVisibleAttributes.map((group, groupIndex) => (
                      <div
                        key={group.title}
                        style={{ borderTop: groupIndex > 0 ? '1px solid var(--sl-border)' : 'none' }}
                      >
                        {/* Section header */}
                        <div
                          className="flex items-center gap-2.5 px-5 py-2.5 sm:px-6"
                          style={{
                            background: 'var(--sl-bg-elevated)',
                            borderBottom: '1px solid var(--sl-border)',
                            borderLeft: '3px solid var(--sl-accent)',
                          }}
                        >
                          <h3
                            className="text-[10px] font-bold uppercase tracking-[0.15em]"
                            style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                          >
                            {group.title}
                          </h3>
                        </div>
                        {/* Attribute rows */}
                        <div>
                          {group.items.map((attribute, attrIdx) => (
                            <div
                              key={attribute.id}
                              className="grid gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-6"
                              style={{
                                background: attrIdx % 2 === 0 ? 'var(--sl-bg-surface)' : 'var(--sl-bg-primary)',
                                borderBottom: '1px solid var(--sl-border)',
                              }}
                            >
                              <div
                                className="text-xs font-medium"
                                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                              >
                                {attribute.name}
                              </div>
                              <div
                                className="text-sm font-semibold"
                                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                              >
                                {formatAttribute(attribute)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {attributes.length > visibleAttributes.length && (
                    <div className="px-5 py-4 sm:px-6" style={{ borderTop: '1px solid var(--sl-border)' }}>
                      <button
                        type="button"
                        onClick={() => setShowAllAttrs(!showAllAttrs)}
                        className="flex items-center gap-2 text-sm font-medium"
                        style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                      >
                        {showAllAttrs ? <><ChevronUp className="h-4 w-4" />Показати менше</> : <><ChevronDown className="h-4 w-4" />Показати всі ({attributes.length})</>}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Характеристики відсутні</p>
              )}
            </TabsContent>

            {/* Description */}
            <TabsContent value="description" className="mt-0">
              <div
                className="rounded-2xl px-5 py-6 sm:px-6"
                style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
              >
                {product.description ? (
                  <div
                    className="rich-content max-w-none"
                    style={{ color: 'var(--sl-text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Опис відсутній</p>
                )}
              </div>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-0">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div
                  className="rounded-2xl px-5 py-6 sm:px-6"
                  style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                >
                  <div className="mb-6 flex items-end gap-4">
                    <div>
                      <p className="text-4xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                        {reviews.length > 0 ? averageRating.toFixed(1) : '—'}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Середня оцінка</p>
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-0.5" style={{ color: 'var(--sl-accent)' }}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} className={cn('h-5 w-5', index < Math.round(averageRating) ? 'fill-current' : '')} style={{ opacity: index < Math.round(averageRating) ? 1 : 0.25 }} />
                        ))}
                      </div>
                      <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>{reviews.length} відгуків</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reviews.length > 0 ? reviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="rounded-xl p-4"
                        style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--sl-text-primary)' }}>{review.authorName}</p>
                            <div className="mt-1 flex items-center gap-0.5" style={{ color: 'var(--sl-accent)' }}>
                              {Array.from({ length: 5 }, (_, index) => (
                                <Star key={index} className="h-4 w-4" style={{ fill: index < review.rating ? 'currentColor' : 'none', opacity: index < review.rating ? 1 : 0.25 }} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.text && <p className="text-sm leading-6" style={{ color: 'var(--sl-text-secondary)' }}>{review.text}</p>}
                      </div>
                    )) : (
                      <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Поки що відгуків немає.</p>
                    )}
                  </div>
                </div>

                {/* Review form */}
                <form
                  onSubmit={handleReviewSubmit}
                  className="rounded-2xl p-5 sm:p-6 xl:sticky xl:top-[68px] xl:self-start"
                  style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                >
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>Залишити відгук</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Короткий чесний відгук допоможе наступному покупцю прийняти рішення.</p>
                  <div className="mt-5 space-y-4">
                    <input
                      type="text"
                      placeholder="Ваше ім'я"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      className="h-11 w-full rounded-xl px-3 text-sm outline-none"
                      style={{
                        background: 'var(--sl-bg-elevated)',
                        border: '1px solid var(--sl-border)',
                        color: 'var(--sl-text-primary)',
                        fontFamily: 'var(--sl-font-body)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                    />
                    <div>
                      <p className="mb-2 text-sm font-medium" style={{ color: 'var(--sl-text-secondary)' }}>Оцінка</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button key={rating} type="button" onClick={() => setReviewRating(rating)} className="rounded-md p-1">
                            <Star
                              className="h-6 w-6"
                              style={{
                                fill: rating <= reviewRating ? 'var(--sl-accent)' : 'none',
                                color: rating <= reviewRating ? 'var(--sl-accent)' : 'var(--sl-text-muted)',
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      placeholder="Що сподобалось, як поводиться товар у використанні..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl px-3 py-3 text-sm outline-none"
                      style={{
                        background: 'var(--sl-bg-elevated)',
                        border: '1px solid var(--sl-border)',
                        color: 'var(--sl-text-primary)',
                        fontFamily: 'var(--sl-font-body)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                    />
                    <button
                      type="submit"
                      className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)')}
                    >
                      Надіслати відгук
                    </button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <ProductShelf title="Рекомендовані товари" description="Ручна добірка моделей, які добре підходять до цього сценарію." products={recommendedProducts} />
        <ProductShelf title="З цим купують" description="Товари, які найчастіше докладають у той самий кошик для повного комплекту." products={withThisBuyProducts} />
        <ProductShelf title="Аксесуари" description="Добірка аксесуарів із прив'язаних категорій, щоб не шукати їх окремо." products={accessoryProducts} />
        <ProductShelf title="Схожі товари" description="Альтернативи з цієї самої категорії для швидкого порівняння." products={similarProducts} />
      </div>

    </div>
  );
}
