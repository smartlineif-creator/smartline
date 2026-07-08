'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Heart,
  Layers3,
  Loader2,
  Menu,
  PackageSearch,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { getCategories, getProducts } from '@/lib/api';
import { Category, Product } from '@/types';
import { formatPrice, getRepresentativeImage, getProductHref } from '@/lib/utils';
import ThemeToggle from '@/components/store/ThemeToggle';

function getCategoryPreviewText(category: Category, childrenCount: number) {
  if (childrenCount > 0) {
    return `Зібрали ${childrenCount} напрямки, щоб швидше дійти до потрібного товару.`;
  }
  if (/ноутбук/i.test(category.name)) {
    return 'У цьому розділі можна одразу перейти до всіх ноутбуків без додаткових фільтрів.';
  }
  if (/смартфон/i.test(category.name)) {
    return 'Тут зібрані всі смартфони в одному потоці для швидкого перегляду.';
  }
  if (/аксесуар/i.test(category.name)) {
    return 'Усі сумісні аксесуари вже в одному місці, без зайвих переходів.';
  }
  return 'Розділ відкривається одразу списком товарів, щоб не втрачати темп вибору.';
}

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState<Record<string, boolean>>({});
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const totalItems = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.count());
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        setActiveCategoryId((current) => current || data[0]?.id || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      queueMicrotask(() => {
        setSearchResults([]);
        setSearchOpen(false);
      });
      return;
    }
    queueMicrotask(() => setSearchLoading(true));
    searchDebounceRef.current = window.setTimeout(async () => {
      try {
        const res = await getProducts({ q, limit: 6 });
        setSearchResults(res.data);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];
  const activeChildren = activeCategory?.children || [];
  const visibleTotalItems = mounted ? totalItems : 0;
  const visibleWishlistCount = mounted ? wishlistCount : 0;

  const closeMenus = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setCatalogOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  };

  const toggleMobileCat = (id: string) => {
    setExpandedMobileCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCatalog = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setCatalogOpen(true);
  };

  const scheduleCloseCatalog = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setCatalogOpen(false), 180);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setSearchQuery('');
      closeMenus();
    }
  };

  return (
    <>
      <header
        className={`sl-header relative sticky top-0${scrolled ? ' sl-scrolled' : ''}`}
        style={{
          background: scrolled
            ? 'var(--sl-bg-surface-glass)'
            : 'var(--sl-bg-surface)',
          borderBottom: `1px solid var(--sl-border)`,
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          transition: 'background var(--sl-transition), backdrop-filter var(--sl-transition)',
        }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex h-16 items-center gap-2 sm:gap-3">
            {/* Logo */}
            <Link href="/" className="relative shrink-0" onClick={closeMenus}>
              <Image src="/logo.svg" alt="SmartLine" width={48} height={48} priority className="hidden dark:block" />
              <Image src="/logo-light.png" alt="SmartLine" width={48} height={48} priority className="dark:hidden" />
            </Link>

            {/* Catalog button — desktop */}
            <div
              className="relative hidden md:block"
              onMouseEnter={openCatalog}
              onMouseLeave={scheduleCloseCatalog}
            >
              <button
                type="button"
                onClick={() => setCatalogOpen((open) => !open)}
                onFocus={openCatalog}
                aria-expanded={catalogOpen}
                className="flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all"
                style={{
                  background: 'var(--sl-bg-elevated)',
                  color: catalogOpen ? 'var(--sl-text-primary)' : 'var(--sl-text-secondary)',
                  border: `1px solid ${catalogOpen ? 'var(--sl-border-hover)' : 'var(--sl-border)'}`,
                }}
              >
                <Layers3 className="h-4 w-4" />
                Каталог
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${catalogOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown — anchored under the button */}
              {catalogOpen && (
                <div
                  className="absolute left-0 top-full z-[9999] pt-1"
                  style={{ width: '820px' }}
                >
                  <div
                    className="overflow-hidden"
                    style={{
                      borderRadius: 'var(--sl-radius-lg)',
                      border: '1px solid var(--sl-border)',
                      background: 'var(--sl-bg-surface)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Dropdown header */}
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: '1px solid var(--sl-border)' }}
                    >
                      <div>
                        <Link
                          href="/catalog"
                          onClick={closeMenus}
                          className="sl-hover-accent text-[15px] font-semibold"
                          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-display)', letterSpacing: '0.05em' }}
                        >
                          УСІ КАТЕГОРІЇ
                        </Link>
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                          Швидкий перехід до основних напрямків каталогу.
                        </p>
                      </div>
                      <div
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          background: 'var(--sl-bg-elevated)',
                          color: 'var(--sl-text-secondary)',
                          fontFamily: 'var(--sl-font-mono)',
                          border: '1px solid var(--sl-border)',
                        }}
                      >
                        {categories.length} розділів
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-[220px_1fr]"
                      style={{ minHeight: categories.length > 0 ? 300 : 80, maxHeight: 440 }}
                    >
                      {/* Left: category list */}
                      <div
                        className="overflow-y-auto p-2"
                        style={{ borderRight: '1px solid var(--sl-border)', background: 'var(--sl-bg-primary)' }}
                      >
                        {categories.length > 0 ? (
                          <div className="space-y-0.5">
                            {categories.map((cat) => {
                              const isActive = activeCategory?.id === cat.id;
                              const childCount = cat.children?.length || 0;
                              return (
                                <Link
                                  key={cat.id}
                                  href={`/catalog/${cat.slug}`}
                                  onMouseEnter={() => setActiveCategoryId(cat.id)}
                                  onFocus={() => setActiveCategoryId(cat.id)}
                                  onClick={closeMenus}
                                  className="flex items-center rounded-lg px-3 py-2 transition-all"
                                  style={{
                                    background: isActive ? 'var(--sl-bg-elevated)' : 'transparent',
                                    borderLeft: `2px solid ${isActive ? 'var(--sl-accent)' : 'transparent'}`,
                                  }}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className="truncate text-sm font-medium"
                                      style={{
                                        color: isActive ? 'var(--sl-text-primary)' : 'var(--sl-text-secondary)',
                                        fontFamily: 'var(--sl-font-body)',
                                      }}
                                    >
                                      {cat.name}
                                    </div>
                                    {childCount > 0 && (
                                      <div className="text-[11px]" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                                        {childCount} підкатегорій
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight
                                    className="h-3.5 w-3.5 shrink-0"
                                    style={{ color: isActive ? 'var(--sl-accent)' : 'var(--sl-text-muted)', opacity: isActive ? 1 : 0.4 }}
                                  />
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-3 py-6 text-center text-sm" style={{ color: 'var(--sl-text-muted)' }}>
                            Завантаження...
                          </div>
                        )}
                      </div>

                      {/* Right: subcategories panel */}
                      <div className="flex flex-col overflow-y-auto p-4">
                        {activeCategory && (
                          <>
                            {/* Category header */}
                            <div
                              className="mb-3 pb-3"
                              style={{ borderBottom: '1px solid var(--sl-border)' }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h3
                                  className="text-base font-semibold"
                                  style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                                >
                                  {activeCategory.name}
                                </h3>
                                <Link
                                  href={`/catalog/${activeCategory.slug}`}
                                  onClick={closeMenus}
                                  className="flex shrink-0 items-center gap-1.5 text-xs font-medium transition-colors"
                                  style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)', whiteSpace: 'nowrap' }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.75')}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                                >
                                  Усі товари
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                              <p className="mt-0.5 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                                {getCategoryPreviewText(activeCategory, activeChildren.length)}
                              </p>
                            </div>

                            {activeChildren.length > 0 ? (
                              <div className="grid grid-cols-2 gap-x-2">
                                {activeChildren.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={`/catalog/${child.slug}`}
                                    onClick={closeMenus}
                                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-all"
                                    style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)';
                                      (e.currentTarget as HTMLElement).style.background = 'var(--sl-bg-elevated)';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)';
                                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                  >
                                    <span className="text-sm font-medium">{child.name}</span>
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sl-accent)', opacity: 0.6 }} />
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-3 rounded-xl p-4" style={{ background: 'var(--sl-bg-elevated)' }}>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}>
                                  <PackageSearch className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                                    Усі товари в одному місці
                                  </p>
                                  <p className="mt-0.5 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                                    Немає підкатегорій — одразу переглядай товари.
                                  </p>
                                </div>
                                <Link
                                  href={`/catalog/${activeCategory.slug}`}
                                  onClick={closeMenus}
                                  className="flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-opacity hover:opacity-80"
                                  style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
                                >
                                  Дивитися товари
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search — desktop */}
            <div ref={searchWrapperRef} className="relative hidden flex-1 sm:flex">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full">
                  {searchLoading
                    ? <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" style={{ color: 'var(--sl-accent)' }} />
                    : <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--sl-text-muted)' }} />
                  }
                  <input
                    type="search"
                    placeholder="Пошук товарів..."
                    className="h-10 w-full rounded-lg pl-9 pr-4 text-sm outline-none transition-all"
                    style={{
                      background: 'var(--sl-bg-elevated)',
                      border: `1px solid ${searchOpen ? 'var(--sl-accent)' : 'var(--sl-border)'}`,
                      color: 'var(--sl-text-primary)',
                      fontFamily: 'var(--sl-font-body)',
                      borderBottomLeftRadius: searchOpen ? 0 : undefined,
                      borderBottomRightRadius: searchOpen ? 0 : undefined,
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--sl-accent)';
                      if (searchResults.length > 0) setSearchOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
                      if (e.key === 'Enter') { setSearchOpen(false); }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchOpen(false); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--sl-text-muted)' }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Search dropdown */}
              {searchOpen && (
                <div
                  className="absolute left-0 right-0 top-10 z-[9999] overflow-hidden"
                  style={{
                    background: 'var(--sl-bg-surface)',
                    border: '1px solid var(--sl-accent)',
                    borderTop: 'none',
                    borderBottomLeftRadius: 'var(--sl-radius-md)',
                    borderBottomRightRadius: 'var(--sl-radius-md)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                  }}
                >
                  {searchResults.length === 0 && !searchLoading ? (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                      Нічого не знайдено
                    </div>
                  ) : (
                    <>
                      <div className="divide-y" style={{ borderColor: 'var(--sl-border)' }}>
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={getProductHref(product)}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); closeMenus(); }}
                            className="flex items-center gap-3 px-4 py-3 transition-all"
                            style={{ color: 'var(--sl-text-primary)' }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--sl-bg-elevated)'}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <div
                              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                              style={{ background: 'var(--sl-bg-elevated)' }}
                            >
                              <Image
                                src={getRepresentativeImage(product)}
                                alt={product.name}
                                fill
                                className="object-contain p-1"
                                sizes="40px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                                {product.name}
                              </div>
                              {product.category && (
                                <div className="text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                                  {product.category.name}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 text-sm font-semibold" style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}>
                              {formatPrice(product.basePrice)}
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); closeMenus(); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-all"
                        style={{
                          borderTop: '1px solid var(--sl-border)',
                          color: 'var(--sl-accent)',
                          fontFamily: 'var(--sl-font-mono)',
                          background: 'var(--sl-bg-elevated)',
                        }}
                      >
                        Показати всі результати для «{searchQuery.trim()}»
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/account"
                aria-label="Акаунт"
                onClick={closeMenus}
                className="flex h-10 w-10 items-center justify-center rounded-lg transition-all"
                style={{ color: 'var(--sl-text-secondary)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--sl-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <User className="h-5 w-5" />
              </Link>

              <Link
                href="/wishlist"
                aria-label="Вибране"
                onClick={closeMenus}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all"
                style={{ color: 'var(--sl-text-secondary)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--sl-status-error)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--sl-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Heart className="h-5 w-5" />
                {visibleWishlistCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{ background: 'var(--sl-status-error)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
                  >
                    {visibleWishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                aria-label="Кошик"
                onClick={closeMenus}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all"
                style={{ color: 'var(--sl-text-secondary)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--sl-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                {visibleTotalItems > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold"
                    style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
                  >
                    {visibleTotalItems}
                  </span>
                )}
              </Link>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Mobile hamburger */}
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg transition-all md:hidden"
                style={{ color: 'var(--sl-text-secondary)' }}
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

      </header>


      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 md:hidden"
          style={{ zIndex: 300, background: 'rgba(0,0,0,0.7)' }}
          onClick={closeMenus}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="fixed right-0 top-0 h-full w-[85vw] max-w-xs overflow-y-auto transition-transform duration-300 md:hidden"
        style={{
          zIndex: 301,
          background: 'var(--sl-bg-surface)',
          borderLeft: '1px solid var(--sl-border)',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: mobileMenuOpen ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--sl-border)' }}
        >
          <Image src="/logo.svg" alt="SmartLine" width={40} height={40} className="hidden rounded-lg dark:block" />
          <Image src="/logo-light.png" alt="SmartLine" width={40} height={40} className="rounded-lg dark:hidden" />
          <button
            type="button"
            onClick={closeMenus}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ color: 'var(--sl-text-muted)', background: 'var(--sl-bg-elevated)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer search */}
        <div className="px-4 pt-4 pb-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--sl-text-muted)' }}
              />
              <input
                type="search"
                placeholder="Пошук товарів..."
                className="h-10 w-full rounded-lg pl-9 pr-4 text-sm outline-none"
                style={{
                  background: 'var(--sl-bg-elevated)',
                  border: '1px solid var(--sl-border)',
                  color: 'var(--sl-text-primary)',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
              />
            </div>
          </form>
        </div>

        {/* Catalog link */}
        <div className="px-4 py-2">
          <Link
            href="/catalog"
            onClick={closeMenus}
            className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          >
            <Layers3 className="h-4 w-4" />
            КАТАЛОГ
          </Link>
        </div>

        {/* Categories */}
        <div className="px-4 py-2">
          <div
            className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Категорії
          </div>
          <div className="space-y-1">
            {categories.map((cat) => {
              const hasChildren = !!cat.children && cat.children.length > 0;
              const isExpanded = !!expandedMobileCats[cat.id];
              return (
                <div key={cat.id}>
                  <div className="flex items-center rounded-xl transition-all">
                    <Link
                      href={`/catalog/${cat.slug}`}
                      onClick={closeMenus}
                      className="flex min-h-11 flex-1 items-center rounded-xl px-3 py-2 text-sm font-medium transition-all"
                      style={{ color: 'var(--sl-text-secondary)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--sl-bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)';
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {cat.name}
                    </Link>
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleMobileCat(cat.id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Згорнути ${cat.name}` : `Розгорнути ${cat.name}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      >
                        <ChevronDown
                          className="h-4 w-4 transition-transform duration-200"
                          style={{ color: 'var(--sl-text-muted)', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="ml-4 border-l pl-3" style={{ borderColor: 'var(--sl-border)' }}>
                      {cat.children!.map((child) => (
                        <Link
                          key={child.id}
                          href={`/catalog/${child.slug}`}
                          onClick={closeMenus}
                          className="block rounded-lg px-3 py-2 text-sm transition-all"
                          style={{ color: 'var(--sl-text-muted)' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-muted)')}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom actions */}
        <div
          className="mt-4 px-4 pb-6"
          style={{ borderTop: '1px solid var(--sl-border)', paddingTop: '1rem' }}
        >
          <div
            className="flex items-center justify-between rounded-xl px-4"
            style={{ background: 'var(--sl-bg-elevated)', height: '44px' }}
          >
            <span className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--sl-text-secondary)' }}>
              <span style={{ fontSize: '16px' }}>🌗</span>
              Тема
            </span>
            <ThemeToggle />
          </div>
          <Link
            href="/account"
            onClick={closeMenus}
            className="mt-2 flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium"
            style={{ color: 'var(--sl-text-secondary)', background: 'var(--sl-bg-elevated)' }}
          >
            <User className="h-4 w-4" style={{ color: 'var(--sl-accent)' }} />
            Мій акаунт
          </Link>
          <Link
            href="/wishlist"
            onClick={closeMenus}
            className="mt-2 flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium"
            style={{ color: 'var(--sl-text-secondary)', background: 'var(--sl-bg-elevated)' }}
          >
            <Heart className="h-4 w-4" style={{ color: 'var(--sl-status-error)' }} />
            Вибране
            {visibleWishlistCount > 0 && (
              <span
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold"
                style={{ background: 'var(--sl-status-error)', color: '#fff' }}
              >
                {visibleWishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            onClick={closeMenus}
            className="mt-2 flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium"
            style={{ color: 'var(--sl-text-secondary)', background: 'var(--sl-bg-elevated)' }}
          >
            <ShoppingCart className="h-4 w-4" style={{ color: 'var(--sl-accent)' }} />
            Кошик
            {visibleTotalItems > 0 && (
              <span
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold"
                style={{ background: 'var(--sl-accent)', color: '#fff' }}
              >
                {visibleTotalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
