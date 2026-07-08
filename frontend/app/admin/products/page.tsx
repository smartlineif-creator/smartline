'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminDeleteProduct, adminDuplicateProduct, adminGetProducts, getCategories } from '@/lib/api';
import { Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, ArrowUpDown, ChevronDown, ChevronUp, Copy, Eye, Filter, Pencil, Plus, Search, Trash2, X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, getProductPrice, getMainImage, getFirstAvailableVariant } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import AdminPageHint from '@/components/admin/AdminPageHint';

interface CategoryOption {
  category: Category;
  depth: number;
}

type SortColumn = 'name' | 'category' | 'price' | 'stock' | 'status' | null;
type SortDir = 'asc' | 'desc';

function flattenCategories(categories: Category[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenCategories(category.children || [], depth + 1),
  ]);
}

function getStockCount(product: Product): number {
  const variants = product.variants || [];
  if (variants.length === 0) return product.stock || 0;
  return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const loading = !hasLoadedOnce;
  const filterRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    adminGetProducts({
      page,
      limit: 20,
      q: search || undefined,
      categoryId: categoryFilter || undefined,
      isActive: statusFilter === 'all' ? undefined : String(statusFilter === 'active'),
    })
      .then((r) => {
        setProducts(r.data);
        setTotal(r.total);
        setHasLoadedOnce(true);
        setSelectedIds((current) => current.filter((id) => r.data.some((p: Product) => p.id === id)));
      });
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    if (!filterOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setFilterOpen(false); };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filterOpen]);

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);
  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter !== 'all');
  const selectedCategoryName = useMemo(
    () => categoryOptions.find((o) => o.category.id === categoryFilter)?.category.name,
    [categoryOptions, categoryFilter],
  );

  const sortedProducts = useMemo(() => {
    if (!sortColumn) return products;
    return [...products].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === 'name') cmp = a.name.localeCompare(b.name, 'uk');
      else if (sortColumn === 'category') cmp = (a.category?.name || '').localeCompare(b.category?.name || '', 'uk');
      else if (sortColumn === 'price') cmp = getProductPrice(a) - getProductPrice(b);
      else if (sortColumn === 'stock') cmp = getStockCount(a) - getStockCount(b);
      else if (sortColumn === 'status') cmp = Number(b.isActive) - Number(a.isActive);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, sortColumn, sortDir]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-35" />;
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-blue-600" />
      : <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-blue-600" />;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteProduct(deleteTarget.id);
      toast.success('Товар видалено');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Помилка видалення'); }
    finally { setDeleting(false); }
  };

  const handleDuplicate = async (productId: string) => {
    try {
      await adminDuplicateProduct(productId);
      toast.success('Товар скопійовано як чернетку');
      load();
    } catch { toast.error('Не вдалося скопіювати товар'); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.allSettled(selectedIds.map((id) => adminDeleteProduct(id)));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const fail = results.length - ok;
      if (ok > 0) toast.success(`Видалено ${ok} товарів`);
      if (fail > 0) toast.error(`Не вдалося видалити ${fail} товарів`);
      setSelectedIds([]);
      load();
    } finally { setDeleting(false); }
  };

  const handleBulkDuplicate = async () => {
    if (selectedIds.length === 0) return;
    try {
      const results = await Promise.allSettled(selectedIds.map((id) => adminDuplicateProduct(id)));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const fail = results.length - ok;
      if (ok > 0) toast.success(`Скопійовано ${ok} товарів`);
      if (fail > 0) toast.error(`Не вдалося скопіювати ${fail} товарів`);
      setSelectedIds([]);
      load();
    } catch { toast.error('Не вдалося виконати масове копіювання'); }
  };

  const toggleSelection = (id: string) =>
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === products.length ? [] : products.map((p) => p.id));

  const getStockLabel = (product: Product) => {
    const variants = product.variants || [];
    if (variants.length === 0) return `${product.stock || 0} шт.`;
    const total = variants.reduce((s, v) => s + (v.stock || 0), 0);
    if (variants.length === 1) return `${total} шт.`;
    return `${total} шт. · ${variants.length} вар.`;
  };

  const resetFilters = () => {
    setSearchDraft(''); setSearch(''); setCategoryFilter(''); setStatusFilter('all'); setPage(1);
  };

  const thClass = (col: SortColumn) =>
    `text-left px-4 py-3 font-medium text-muted-foreground select-none whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors ${sortColumn === col ? 'text-blue-600' : ''}`;

  return (
    <div>
      <AdminPageHint
        storageKey="products"
        tips={[
          { text: 'Натисніть "Додати", щоб створити новий товар. Заповніть назву, ціну, категорію та хоча б одне зображення.' },
          { text: 'Іконка "Копія" поряд з товаром — швидке дублювання. Зручно для схожих моделей.' },
          { text: 'Червоний значок ⚠ означає, що товар неактивний або є проблема із залишком.' },
          { text: 'Фільтр за категорією + пошук — щоб швидко знайти потрібний товар у великому каталозі.' },
          { text: 'Конфігурації (варіанти) задаються всередині товару на вкладці "Конфігурації". Шаблони груп — у налаштуваннях категорії.' },
        ]}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Товари</h1>
          <p className="text-muted-foreground text-sm">{total} товарів</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" />Додати</Link>
        </Button>
      </div>

      <div className="mb-5 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Пошук по назві, slug, артикулу або характеристиці"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border bg-gray-50 p-1">
              {[
                { key: 'all', label: 'Усі' },
                { key: 'active', label: 'Активні' },
                { key: 'hidden', label: 'Приховані' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { setStatusFilter(item.key as typeof statusFilter); setPage(1); }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === item.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Category filter dropdown */}
            <div ref={filterRef} className="relative">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg"
                onClick={() => setFilterOpen((o) => !o)}
              >
                <Filter className="h-4 w-4" />
                {selectedCategoryName || 'Категорія'}
              </Button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-white shadow-xl overflow-hidden">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => { setCategoryFilter(''); setFilterOpen(false); setPage(1); }}
                      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        !categoryFilter
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Усі категорії
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto border-t px-2 pb-2 pt-1">
                    {categoryOptions.map(({ category, depth }) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => { setCategoryFilter(category.id); setFilterOpen(false); setPage(1); }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          categoryFilter === category.id
                            ? 'bg-blue-50 font-medium text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{ paddingLeft: 12 + depth * 16 }}
                      >
                        {depth > 0 && (
                          <span className="mr-1.5 text-gray-300">—</span>
                        )}
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" className="h-11 rounded-lg" onClick={resetFilters}>
                <X className="h-4 w-4" />Скинути
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {search && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Пошук: {search}
              </span>
            )}
            {selectedCategoryName && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Категорія: {selectedCategoryName}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Статус: {statusFilter === 'active' ? 'Активні' : 'Приховані'}
              </span>
            )}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
          <div className="text-sm font-medium text-blue-900">Вибрано: {selectedIds.length} товарів</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="border-blue-200 bg-white" onClick={handleBulkDuplicate}>
              <Copy className="h-4 w-4" />Копіювати вибрані
            </Button>
            <Button type="button" variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4" />Видалити вибрані
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleSelectAll}
                    aria-label="Вибрати всі товари"
                    className="h-4 w-4 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Фото</th>
                <th className={thClass('name')} onClick={() => handleSort('name')}>
                  Назва <SortIcon col="name" />
                </th>
                <th className={thClass('category')} onClick={() => handleSort('category')}>
                  Категорія <SortIcon col="category" />
                </th>
                <th className={thClass('price')} onClick={() => handleSort('price')}>
                  Ціна <SortIcon col="price" />
                </th>
                <th className={thClass('stock')} onClick={() => handleSort('stock')}>
                  Наявність <SortIcon col="stock" />
                </th>
                <th className={thClass('status')} onClick={() => handleSort('status')}>
                  Статус <SortIcon col="status" />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Завантаження товарів...
                  </td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Нічого не знайдено. Спробуй змінити пошук або фільтри.
                  </td>
                </tr>
              ) : sortedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelection(product.id)}
                      aria-label={`Вибрати товар ${product.name}`}
                      className="h-4 w-4 cursor-pointer accent-blue-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                      <Image src={getMainImage(product, getFirstAvailableVariant(product))} alt={product.name} fill className="object-contain p-1" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{product.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{product.slug}</div>
                    {product.sku && <div className="mt-0.5 text-xs text-muted-foreground">Арт. {product.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium tabular-nums">{formatPrice(getProductPrice(product))}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{getStockLabel(product)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.isActive ? 'Активний' : 'Прихований'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/product/${product.slug}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/products/${product.id}/edit`} onClick={(e) => e.stopPropagation()}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDuplicate(product.id); }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={(e) => { e.stopPropagation(); setDeleteTarget(product); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2 border-t p-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</Button>
            <span className="py-1.5 text-sm">Стор. {page} з {Math.ceil(total / 20)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>→</Button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-950">Видалити товар?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Товар <span className="font-medium text-gray-900">{deleteTarget.name}</span> буде видалено. Цю дію не можна скасувати.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Скасувати</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Видалення...' : 'Видалити'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
