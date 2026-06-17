'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminGetPromotions, adminCreatePromotion, adminUpdatePromotion, adminDeletePromotion, getCategories, getProducts } from '@/lib/api';
import { Promotion, Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Search, X, Tag, Package, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { getMainImage, formatPrice, getProductPrice } from '@/lib/utils';

type TargetMode = 'products' | 'category';

interface FormState {
  name: string;
  discount: string;
  startDate: string;
  endDate: string;
  mode: TargetMode;
  categoryId: string;
  selectedProducts: Product[];
  productSearch: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  discount: '10',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  mode: 'products',
  categoryId: '',
  selectedProducts: [],
  productSearch: '',
};

function getStatus(p: Promotion): 'active' | 'scheduled' | 'expired' | 'disabled' {
  if (!p.isActive) return 'disabled';
  const now = new Date();
  if (new Date(p.endDate) < now) return 'expired';
  if (new Date(p.startDate) > now) return 'scheduled';
  return 'active';
}

const STATUS_LABELS = {
  active: { label: 'Активна', cls: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Запланована', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Завершена', cls: 'bg-gray-100 text-gray-500' },
  disabled: { label: 'Вимкнена', cls: 'bg-yellow-100 text-yellow-700' },
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [catDropOpen, setCatDropOpen] = useState(false);

  const load = useCallback(() =>
    adminGetPromotions().then((r: any) => setPromotions(r.data || r)).catch(() => {}),
  []);

  useEffect(() => {
    load();
    getCategories().then((cats) => setCategories(cats));
    getProducts({ limit: 200 }).then((r: any) => setAllProducts(r.data || []));
  }, [load]);

  // Close category dropdown on outside click
  useEffect(() => {
    if (!catDropOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-cat-drop]')) setCatDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catDropOpen]);

  // Flat list of categories with hierarchy for custom dropdown
  const categoryOptions = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId);
    const result: { id: string; name: string; isParent: boolean }[] = [];
    for (const p of parents) {
      result.push({ id: p.id, name: p.name, isParent: true });
      const children = categories.filter((c) => c.parentId === p.id);
      for (const ch of children) {
        result.push({ id: ch.id, name: ch.name, isParent: false });
      }
    }
    return result;
  }, [categories]);

  const selectedCategoryName = useMemo(
    () => categoryOptions.find((o) => o.id === form.categoryId)?.name ?? null,
    [categoryOptions, form.categoryId],
  );

  const searchResults = useMemo(() => {
    const q = form.productSearch.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter(
        (p) =>
          (p.name.toLowerCase().includes(q) || p.slug.includes(q)) &&
          !form.selectedProducts.find((s) => s.id === p.id),
      )
      .slice(0, 8);
  }, [form.productSearch, allProducts, form.selectedProducts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCatDropOpen(false);
    setShowForm(true);
  };

  const openEdit = (p: Promotion) => {
    const existingProducts = (p.products ?? [])
      .map((pp) => allProducts.find((ap) => ap.id === pp.productId))
      .filter(Boolean) as Product[];

    setEditingId(p.id);
    setForm({
      name: p.name,
      discount: String(p.discountPercent),
      startDate: p.startDate.slice(0, 10),
      endDate: p.endDate.slice(0, 10),
      mode: p.categoryId ? 'category' : 'products',
      categoryId: p.categoryId ?? '',
      selectedProducts: existingProducts,
      productSearch: '',
    });
    setShowForm(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addProduct = (p: Product) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, p],
      productSearch: '',
    }));
  };

  const removeProduct = (id: string) =>
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((p) => p.id !== id),
    }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Вкажіть назву'); return; }
    const discount = Number(form.discount);
    if (!discount || discount < 1 || discount > 99) { toast.error('Знижка має бути від 1 до 99%'); return; }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      toast.error('Дата початку має бути раніше дати кінця'); return;
    }
    if (form.mode === 'products' && form.selectedProducts.length === 0) {
      toast.error('Виберіть хоча б один товар'); return;
    }
    if (form.mode === 'category' && !form.categoryId) {
      toast.error('Виберіть категорію'); return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        discountPercent: Number(form.discount),
        startDate: form.startDate,
        endDate: form.endDate,
        categoryId: form.mode === 'category' ? form.categoryId : null,
        productIds: form.mode === 'products' ? form.selectedProducts.map((p) => p.id) : [],
      };

      if (editingId) {
        await adminUpdatePromotion(editingId, data);
        toast.success('Акцію оновлено');
      } else {
        await adminCreatePromotion(data);
        toast.success('Акцію створено');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeletePromotion(deleteTarget.id);
      toast.success('Акцію видалено');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Помилка');
    }
  };


  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Акції</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Знижки на конкретні товари або цілі категорії.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Нова акція
        </Button>
      </div>

      {/* Promotions list */}
      <div className="overflow-hidden rounded-lg border bg-white divide-y">
        {promotions.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Акцій ще немає</div>
        ) : (
          promotions.map((p) => {
            const status = getStatus(p);
            const { label, cls } = STATUS_LABELS[status];
            const targetLabel = p.categoryId
              ? `Категорія: ${p.category?.name ?? '—'}`
              : `${p.products?.length ?? 0} товарів`;

            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                {/* Discount badge */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 font-bold text-sm">
                  -{p.discountPercent}%
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(p.startDate).toLocaleDateString('uk-UA')}
                      {' — '}
                      {new Date(p.endDate).toLocaleDateString('uk-UA')}
                    </span>
                    <span className="flex items-center gap-1">
                      {p.categoryId ? <Tag className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                      {targetLabel}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} aria-label="Редагувати">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteTarget(p)}
                    aria-label="Видалити"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-white shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold">
                {editingId ? 'Редагувати акцію' : 'Нова акція'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Name + discount */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Назва акції</Label>
                  <Input
                    placeholder="Літній розпродаж"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Знижка %</Label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={form.discount}
                    onChange={(e) => setField('discount', e.target.value)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Початок</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Кінець</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
                </div>
              </div>

              {/* Target mode tabs */}
              <div className="space-y-3">
                <Label>На що діє знижка</Label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setField('mode', 'products')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                      form.mode === 'products'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-muted-foreground hover:bg-gray-50'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    Конкретні товари
                  </button>
                  <button
                    type="button"
                    onClick={() => setField('mode', 'category')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l ${
                      form.mode === 'category'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-muted-foreground hover:bg-gray-50'
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                    Категорія
                  </button>
                </div>

                {/* Products mode */}
                {form.mode === 'products' && (
                  <div className="space-y-2">
                    {/* Selected products */}
                    {form.selectedProducts.length > 0 && (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto rounded-lg border p-2">
                        {form.selectedProducts.map((p) => (
                          <div key={p.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-100">
                              <Image src={getMainImage(p)} alt={p.name} fill className="object-contain p-0.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium leading-none">{p.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(getProductPrice(p))}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProduct(p.id)}
                              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Пошук товару за назвою або slug..."
                        value={form.productSearch}
                        onChange={(e) => setField('productSearch', e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border bg-white shadow-lg divide-y max-h-48 overflow-y-auto">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => addProduct(p)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50"
                            >
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-100">
                                <Image src={getMainImage(p)} alt={p.name} fill className="object-contain p-0.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.category?.name} · {p.slug}</p>
                              </div>
                              <span className="shrink-0 text-sm font-medium text-gray-700">
                                {formatPrice(getProductPrice(p))}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {form.selectedProducts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Знайдіть і виберіть товари вище
                      </p>
                    )}
                  </div>
                )}

                {/* Category mode */}
                {form.mode === 'category' && (
                  <div className="space-y-2">
                    <div className="relative" data-cat-drop>
                      <button
                        type="button"
                        onClick={() => setCatDropOpen((v) => !v)}
                        className="flex w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2.5 text-sm shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className={form.categoryId ? 'text-gray-900' : 'text-muted-foreground'}>
                          {selectedCategoryName ?? 'Оберіть категорію...'}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${catDropOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {catDropOpen && (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1 rounded-lg border bg-white shadow-lg max-h-52 overflow-y-auto divide-y divide-gray-50">
                          <button
                            type="button"
                            onClick={() => { setField('categoryId', ''); setCatDropOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-gray-50"
                          >
                            Оберіть категорію...
                          </button>
                          {categoryOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => { setField('categoryId', opt.id); setCatDropOpen(false); }}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                                form.categoryId === opt.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                              }`}
                            >
                              {!opt.isParent && (
                                <span className="shrink-0 text-muted-foreground">└</span>
                              )}
                              <span className={opt.isParent ? 'font-medium' : ''}>{opt.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {form.categoryId && (
                      <p className="text-xs text-muted-foreground">
                        Знижка застосується до всіх товарів у вибраній категорії автоматично.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t px-5 py-4">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                Скасувати
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Збереження...' : editingId ? 'Зберегти зміни' : 'Створити акцію'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-950">Видалити акцію?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Акція <span className="font-medium text-gray-900">{deleteTarget.name}</span> буде видалена. Цю дію не можна скасувати.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Скасувати</Button>
              <Button variant="destructive" onClick={handleDelete}>Видалити</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
