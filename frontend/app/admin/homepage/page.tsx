'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  adminGetHomepageSections,
  adminCreateHomepageSection,
  adminUpdateHomepageSection,
  adminReorderHomepageSections,
  adminDeleteHomepageSection,
  HomepageSectionData,
  adminGetProducts,
  getCategories,
} from '@/lib/api';
import { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Settings, GripVertical, X, AlertTriangle, LayoutTemplate,
  Sparkles, Image as ImageIcon, Tags, LayoutList, Star, Shield,
  Megaphone, Rows3,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionType = 'hero' | 'marquee' | 'banners' | 'categories' | 'carousel' | 'promo' | 'reviews' | 'trust';

const SECTION_META: Record<SectionType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  hero:       { label: 'Головний CTA',       icon: Sparkles,     color: 'bg-purple-50 text-purple-700 border-purple-200', description: 'Великий блок із товаром, заголовком і кнопками' },
  marquee:    { label: 'Рядок, що біжить',   icon: Rows3,        color: 'bg-gray-50 text-gray-600 border-gray-200',       description: 'Анімований рядок із брендами' },
  banners:    { label: 'Банери',             icon: ImageIcon,    color: 'bg-blue-50 text-blue-700 border-blue-200',       description: 'Слайдер банерів (керується у Банери)' },
  categories: { label: 'Популярні напрямки', icon: Tags,         color: 'bg-green-50 text-green-700 border-green-200',    description: 'Сітка категорій для швидкого входу' },
  carousel:   { label: 'Карусель товарів',   icon: LayoutList,   color: 'bg-orange-50 text-orange-700 border-orange-200', description: 'Горизонтальна карусель із товарами' },
  promo:      { label: 'Акції',              icon: Megaphone,    color: 'bg-red-50 text-red-700 border-red-200',          description: 'Активні акції та розпродажі' },
  reviews:    { label: 'Відгуки',            icon: Star,         color: 'bg-yellow-50 text-yellow-700 border-yellow-200', description: 'Карусель відгуків покупців' },
  trust:      { label: 'Переваги',           icon: Shield,       color: 'bg-teal-50 text-teal-700 border-teal-200',       description: 'Блок "Чому купують тут"' },
};

const SOURCE_OPTIONS = [
  { value: 'featured', label: 'Хіти продажів (авто)' },
  { value: 'latest', label: 'Нові надходження (авто)' },
  { value: 'category', label: 'З категорії' },
  { value: 'manual', label: 'Вручну — вибрати товари' },
];

const SECTION_TYPES: SectionType[] = ['hero', 'marquee', 'banners', 'categories', 'carousel', 'promo', 'reviews', 'trust'];

const DEFAULT_MARQUEE_ITEMS = [
  '★ 4.9 з 5 — рейтинг покупців',
  '2 400+ замовлень щомісяця',
  'Доставка від 1 дня',
  'Гарантія 2 роки',
  'Безпечна оплата',
];

const DEFAULT_TRUST_CARDS = [
  { title: 'Живі товарні фото', text: 'Реальні фото допомагають оцінити стан і деталі до покупки.' },
  { title: 'Чесні характеристики', text: 'Менше плутанини перед оплатою і простіше порівняти кілька варіантів.' },
  { title: 'Зрозумілий шлях до покупки', text: 'Від вибору до кошика кілька зрозумілих кроків.' },
  { title: 'Довіра ще до checkout', text: 'Гарантія, наявність і акційна логіка показані там, де їх очікують.' },
];

function getDefaultConfig(type: SectionType): Record<string, any> {
  switch (type) {
    case 'hero':
      return {
        autoSelect: true,
        productId: null,
        title: 'Техніка, яку хочеться купити зараз',
        subtitle: 'Живі фото, зрозумілі конфігурації, чесні характеристики.',
      };
    case 'marquee':
      return { items: DEFAULT_MARQUEE_ITEMS };
    case 'banners':
      return { title: '', subtitle: '' };
    case 'categories':
      return {
        title: 'Популярні напрямки',
        subtitle: 'Швидкий вхід у ключові категорії, щоб не шукати потрібний розділ вручну.',
        categoryIds: [],
      };
    case 'carousel':
      return {
        eyebrow: 'Нова секція',
        title: 'Назва каруселі',
        subtitle: '',
        href: '/catalog',
        hrefLabel: 'Дивитись усі',
        source: 'featured',
        productIds: [],
        categorySlug: '',
      };
    case 'promo':
      return {
        eyebrow: 'Пропозиції тижня',
        title: 'Ціни, які хочеться забрати зараз',
        subtitle: 'Активні офери, знижки та моделі, які варто подивитися першими.',
      };
    case 'reviews':
      return {
        eyebrow: 'Відгуки',
        title: 'Що кажуть покупці',
        subtitle: 'Реальні враження допомагають швидше зрозуміти, чи підходить магазин і товар.',
        ratingLabel: '★ 4.9 середня оцінка',
      };
    case 'trust':
      return {
        eyebrow: 'Чому купують тут',
        title: 'Чому з SmartLine спокійніше купувати',
        subtitle: 'Коротко про речі, які важливі перед покупкою техніки.',
        cards: DEFAULT_TRUST_CARDS,
      };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTitle(s: HomepageSectionData): string {
  const cfg = s.config as any;
  if (s.type === 'hero') return cfg.title || (cfg.autoSelect ? 'Авто-вибір товару' : (cfg.productId ? 'Конкретний товар' : 'Не налаштовано'));
  if (s.type === 'marquee') return `${(cfg.items ?? DEFAULT_MARQUEE_ITEMS).length} пунктів`;
  if (s.type === 'banners') return cfg.title || 'Слайдер банерів';
  if (s.type === 'carousel') return cfg.title || 'Карусель';
  if (s.type === 'categories') return cfg.title || 'Популярні напрямки';
  if (s.type === 'promo') return cfg.title || 'Акції';
  if (s.type === 'reviews') return cfg.title || 'Відгуки';
  if (s.type === 'trust') return cfg.title || 'Переваги';
  return '';
}

// ─── Editor ──────────────────────────────────────────────────────────────────

interface EditorProps {
  section: HomepageSectionData;
  products: Product[];
  categories: Category[];
  onSave: (id: string, config: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

function SectionEditor({ section, products, categories, onSave, onClose }: EditorProps) {
  const [cfg, setCfg] = useState<Record<string, any>>({
    ...getDefaultConfig(section.type as SectionType),
    ...section.config,
  });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const setC = (key: string, val: any) => setCfg((p) => ({ ...p, [key]: val }));
  const setListItem = (key: string, index: number, value: any) => {
    setCfg((prev) => {
      const next = [...(prev[key] ?? [])];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };
  const removeListItem = (key: string, index: number) => {
    setCfg((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((_: any, i: number) => i !== index) }));
  };
  const addListItem = (key: string, value: any) => {
    setCfg((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), value] }));
  };

  const searchResults = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return [];
    const selected: string[] = cfg.productIds ?? [];
    return products
      .filter((p) => (p.name.toLowerCase().includes(q) || p.slug.includes(q)) && !selected.includes(p.id))
      .slice(0, 8);
  }, [productSearch, products, cfg.productIds]);

  const addProduct = (p: Product) => {
    setC('productIds', [...(cfg.productIds ?? []), p.id]);
    setProductSearch('');
  };

  const removeProduct = (id: string) =>
    setC('productIds', (cfg.productIds ?? []).filter((x: string) => x !== id));

  const addCategory = (id: string) => {
    if (!(cfg.categoryIds ?? []).includes(id)) {
      setC('categoryIds', [...(cfg.categoryIds ?? []), id]);
    }
  };

  const removeCategory = (id: string) =>
    setC('categoryIds', (cfg.categoryIds ?? []).filter((x: string) => x !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(section.id, cfg);
      toast.success('Збережено');
      onClose();
    } catch {
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const flatCategories = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId);
    const result: { id: string; name: string; isParent: boolean }[] = [];
    for (const p of parents) {
      result.push({ id: p.id, name: p.name, isParent: true });
      const children = categories.filter((c) => c.parentId === p.id);
      for (const ch of children) result.push({ id: ch.id, name: ch.name, isParent: false });
    }
    return result;
  }, [categories]);

  const selectedProductObjects = (cfg.productIds ?? [])
    .map((id: string) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const meta = SECTION_META[section.type as SectionType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            {meta && (
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg border text-sm', meta.color)}>
                <meta.icon className="h-4 w-4" />
              </span>
            )}
            <div>
              <h2 className="text-base font-semibold">{meta?.label}</h2>
              <p className="text-xs text-muted-foreground">{meta?.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto p-5">

          {/* HERO */}
          {section.type === 'hero' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setC('autoSelect', true)}
                  className={cn('flex-1 rounded-lg border p-3 text-sm text-left transition-colors', cfg.autoSelect ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50')}
                >
                  <p className="font-medium">Авто-вибір</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Перший товар із хітів або нових надходжень</p>
                </button>
                <button
                  type="button"
                  onClick={() => setC('autoSelect', false)}
                  className={cn('flex-1 rounded-lg border p-3 text-sm text-left transition-colors', !cfg.autoSelect ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50')}
                >
                  <p className="font-medium">Конкретний товар</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Вибрати вручну зі списку</p>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Заголовок</Label>
                  <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Техніка, яку хочеться купити зараз" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Підзаголовок</Label>
                  <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} placeholder="Живі фото, зрозумілі конфігурації..." />
                </div>
              </div>
              {!cfg.autoSelect && (
                <div className="space-y-2">
                  <Label>Пошук товару</Label>
                  <div className="relative">
                    <Input
                      placeholder="Назва або slug..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border bg-white shadow-lg divide-y max-h-48 overflow-y-auto">
                        {searchResults.map((p) => (
                          <button key={p.id} type="button" onClick={() => { setC('productId', p.id); setProductSearch(''); }}
                            className={cn('flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50', cfg.productId === p.id && 'bg-blue-50 text-blue-700')}>
                            <span className="flex-1 text-sm truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.slug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {cfg.productId && (
                    <div className="flex items-center gap-2 rounded-lg border bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <span className="flex-1 truncate">{products.find((p) => p.id === cfg.productId)?.name ?? cfg.productId}</span>
                      <button onClick={() => setC('productId', null)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {section.type === 'categories' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Заголовок блоку</Label>
                  <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Популярні напрямки" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Підзаголовок</Label>
                  <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Категорії (порядок виводу)</Label>
                <div className="space-y-1">
                  {(cfg.categoryIds ?? []).map((cid: string) => {
                    const cat = flatCategories.find((c) => c.id === cid);
                    return (
                      <div key={cid} className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                        <span className="flex-1">{cat?.name ?? cid}</span>
                        <button onClick={() => removeCategory(cid)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mb-1">Якщо список порожній — виводяться всі кореневі категорії автоматично (до 8)</p>
                <select
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => { if (e.target.value) addCategory(e.target.value); }}
                >
                  <option value="">+ Додати категорію...</option>
                  {flatCategories
                    .filter((c) => !(cfg.categoryIds ?? []).includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.isParent ? c.name : `  └ ${c.name}`}</option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* CAROUSEL */}
          {section.type === 'carousel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Мітка (eyebrow)</Label>
                  <Input value={cfg.eyebrow ?? ''} onChange={(e) => setC('eyebrow', e.target.value)} placeholder="Почніть із сильних моделей" />
                </div>
                <div className="space-y-1.5">
                  <Label>Посилання &quot;Дивитись усі&quot;</Label>
                  <Input value={cfg.href ?? ''} onChange={(e) => setC('href', e.target.value)} placeholder="/catalog" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Заголовок</Label>
                  <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Хіти, з яких починають вибір" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Підзаголовок</Label>
                  <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Текст кнопки</Label>
                  <Input value={cfg.hrefLabel ?? ''} onChange={(e) => setC('hrefLabel', e.target.value)} placeholder="Дивитись усі товари" />
                </div>
                <div className="space-y-1.5">
                  <Label>Джерело товарів</Label>
                  <select
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    value={cfg.source ?? 'featured'}
                    onChange={(e) => setC('source', e.target.value)}
                  >
                    {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {cfg.source === 'category' && (
                <div className="space-y-1.5">
                  <Label>Slug категорії</Label>
                  <Input value={cfg.categorySlug ?? ''} onChange={(e) => setC('categorySlug', e.target.value)} placeholder="aksesuary" />
                </div>
              )}

              {cfg.source === 'manual' && (
                <div className="space-y-2">
                  <Label>Товари в каруселі</Label>
                  <div className="space-y-1">
                    {selectedProductObjects.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                        <span className="flex-1 truncate">{p.name}</span>
                        <button onClick={() => removeProduct(p.id)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Пошук товару..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border bg-white shadow-lg divide-y max-h-48 overflow-y-auto">
                        {searchResults.map((p) => (
                          <button key={p.id} type="button" onClick={() => addProduct(p)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-sm">
                            <span className="flex-1 truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.slug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MARQUEE */}
          {section.type === 'marquee' && (
            <div className="space-y-3">
              <div>
                <Label>Пункти рядка</Label>
                <p className="mt-1 text-xs text-muted-foreground">Кожен пункт буде повторюватись у повноширинному рядку на головній.</p>
              </div>
              <div className="space-y-2">
                {(cfg.items ?? DEFAULT_MARQUEE_ITEMS).map((item: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input value={item} onChange={(e) => setListItem('items', index, e.target.value)} />
                    <Button type="button" variant="outline" size="icon" onClick={() => removeListItem('items', index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={() => addListItem('items', '')} className="gap-2">
                <Plus className="h-4 w-4" />
                Додати пункт
              </Button>
            </div>
          )}

          {/* BANNERS */}
          {section.type === 'banners' && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Самі банери керуються в розділі <strong>Банери</strong>, тут редагується обгортка секції на головній.
              </div>
              <div className="space-y-1.5">
                <Label>Заголовок над банерами</Label>
                <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Необов'язково" />
              </div>
              <div className="space-y-1.5">
                <Label>Підзаголовок</Label>
                <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} placeholder="Необов'язково" />
              </div>
            </div>
          )}

          {/* PROMO */}
          {section.type === 'promo' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Мітка</Label>
                <Input value={cfg.eyebrow ?? ''} onChange={(e) => setC('eyebrow', e.target.value)} placeholder="Пропозиції тижня" />
              </div>
              <div className="space-y-1.5">
                <Label>Заголовок</Label>
                <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Ціни, які хочеться забрати зараз" />
              </div>
              <div className="space-y-1.5">
                <Label>Підзаголовок</Label>
                <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} />
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {section.type === 'reviews' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Мітка</Label>
                  <Input value={cfg.eyebrow ?? ''} onChange={(e) => setC('eyebrow', e.target.value)} placeholder="Відгуки" />
                </div>
                <div className="space-y-1.5">
                  <Label>Плашка рейтингу</Label>
                  <Input value={cfg.ratingLabel ?? ''} onChange={(e) => setC('ratingLabel', e.target.value)} placeholder="★ 4.9 середня оцінка" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Заголовок</Label>
                  <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Що кажуть покупці" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Підзаголовок</Label>
                  <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* TRUST */}
          {section.type === 'trust' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Мітка</Label>
                  <Input value={cfg.eyebrow ?? ''} onChange={(e) => setC('eyebrow', e.target.value)} placeholder="Чому купують тут" />
                </div>
                <div className="space-y-1.5">
                  <Label>Заголовок</Label>
                  <Input value={cfg.title ?? ''} onChange={(e) => setC('title', e.target.value)} placeholder="Чому з SmartLine спокійніше купувати" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Підзаголовок</Label>
                  <Input value={cfg.subtitle ?? ''} onChange={(e) => setC('subtitle', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Картки переваг</Label>
                {(cfg.cards ?? DEFAULT_TRUST_CARDS).map((card: { title: string; text: string }, index: number) => (
                  <div key={index} className="rounded-lg border bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Картка {index + 1}</span>
                      <button type="button" onClick={() => removeListItem('cards', index)} className="rounded p-1 hover:bg-white">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid gap-2">
                      <Input
                        value={card.title ?? ''}
                        onChange={(e) => setListItem('cards', index, { ...card, title: e.target.value })}
                        placeholder="Назва переваги"
                      />
                      <Input
                        value={card.text ?? ''}
                        onChange={(e) => setListItem('cards', index, { ...card, text: e.target.value })}
                        placeholder="Короткий опис"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addListItem('cards', { title: '', text: '' })} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Додати картку
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Скасувати</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable row ───────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: HomepageSectionData;
  index: number;
  total: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  handleRef?: (node: HTMLButtonElement | null) => void;
  handleProps?: Record<string, any>;
  onMove?: (idx: number, dir: -1 | 1) => void;
  onToggleActive?: (section: HomepageSectionData) => void;
  onEdit?: (section: HomepageSectionData) => void;
  onDelete?: (section: HomepageSectionData) => void;
}

function SectionCard({
  section,
  index,
  total,
  isDragging,
  isOverlay,
  handleRef,
  handleProps,
  onMove,
  onToggleActive,
  onEdit,
  onDelete,
}: SectionCardProps) {
  const meta = SECTION_META[section.type as SectionType];
  const Icon = meta?.icon ?? LayoutTemplate;
  const title = getTitle(section);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all',
        !section.isActive && 'opacity-50',
        isDragging && 'scale-[0.99] opacity-30',
        isOverlay && 'scale-[1.02] border-blue-200 shadow-2xl ring-2 ring-blue-100',
      )}
    >
      <button
        ref={handleRef}
        type="button"
        className="cursor-grab touch-none rounded p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
        title="Перетягнути секцію"
        aria-label="Перетягнути секцію"
        {...handleProps}
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </button>

      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm', meta?.color ?? 'bg-gray-50 text-gray-600 border-gray-200')}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{meta?.label ?? section.type}</p>
        {title && <p className="truncate text-xs text-muted-foreground">{title}</p>}
        {!title && <p className="text-xs italic text-muted-foreground">{meta?.description}</p>}
      </div>

      {!isOverlay && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove?.(index, -1)}
            disabled={index === 0}
            className="rounded p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-30"
            title="Вгору"
          >
            <ChevronUp className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => onMove?.(index, 1)}
            disabled={index === total - 1}
            className="rounded p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-30"
            title="Вниз"
          >
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          <button
            onClick={() => onToggleActive?.(section)}
            className="rounded p-1.5 transition-colors hover:bg-gray-100"
            title={section.isActive ? 'Приховати' : 'Показати'}
          >
            {section.isActive
              ? <Eye className="h-4 w-4 text-green-600" />
              : <EyeOff className="h-4 w-4 text-gray-400" />
            }
          </button>

          <button
            onClick={() => onEdit?.(section)}
            className="rounded p-1.5 transition-colors hover:bg-gray-100"
            title="Налаштувати"
          >
            <Settings className="h-4 w-4 text-gray-500" />
          </button>

          <button
            onClick={() => onDelete?.(section)}
            className="rounded p-1.5 transition-colors hover:bg-red-50"
            title="Видалити"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}

function SortableSectionCard(props: SectionCardProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.section.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      <SectionCard
        {...props}
        isDragging={isDragging}
        handleRef={setActivatorNodeRef}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HomepageSectionData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomepageSectionData | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeSection = activeDragId ? sections.find((section) => section.id === activeDragId) : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetHomepageSections();
      setSections(data);
    } catch {
      toast.error('Не вдалося завантажити секції');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
    adminGetProducts({ limit: 300 }).then((r: any) => setAllProducts(r.data || [])).catch(() => {});
    getCategories().then(setAllCategories).catch(() => {});
  }, [load]);

  const toggleActive = async (s: HomepageSectionData) => {
    try {
      await adminUpdateHomepageSection(s.id, { isActive: !s.isActive });
      setSections((prev) => prev.map((x) => x.id === s.id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      toast.error('Помилка');
    }
  };

  const persistOrder = async (nextSections: HomepageSectionData[]) => {
    const reordered = nextSections.map((s, i) => ({ ...s, order: i + 1 }));
    setSections(reordered);
    try {
      await adminReorderHomepageSections(reordered.map((s) => ({ id: s.id, order: s.order })));
    } catch {
      toast.error('Помилка перестановки');
      load();
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const newSections = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= newSections.length) return;
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    await persistOrder(newSections);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragId(String(active.id));
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    await persistOrder(arrayMove(sections, oldIndex, newIndex));
  };

  const handleSaveConfig = async (id: string, config: Record<string, any>) => {
    await adminUpdateHomepageSection(id, { config });
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, config } : s));
  };

  const handleCreateSection = async (type: SectionType) => {
    try {
      const created = await adminCreateHomepageSection({
        type,
        config: getDefaultConfig(type),
      });
      setSections((prev) => [...prev, created]);
      setAddPickerOpen(false);
      setEditing(created);
    } catch {
      toast.error('Помилка');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteHomepageSection(deleteTarget.id);
      setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Секцію видалено');
    } catch {
      toast.error('Помилка');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-950">Головна сторінка</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Керуйте секціями, їх порядком і вмістом
          </p>
        </div>
        <div className="relative">
          <Button onClick={() => setAddPickerOpen((v) => !v)} className="gap-2">
            <Plus className="h-4 w-4" />
            Додати секцію
          </Button>
          {addPickerOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-20 cursor-default"
                aria-label="Закрити меню додавання секції"
                onClick={() => setAddPickerOpen(false)}
              />
              <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border bg-white p-2 shadow-xl">
                <div className="px-2 pb-2 pt-1">
                  <p className="text-sm font-semibold text-gray-950">Нова секція</p>
                  <p className="text-xs text-muted-foreground">Оберіть тип блоку для головної сторінки.</p>
                </div>
                <div className="grid gap-1">
                  {SECTION_TYPES.map((type) => {
                    const meta = SECTION_META[type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleCreateSection(type)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50"
                      >
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', meta.color)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900">{meta.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{meta.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sections list */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Завантаження...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((section, idx) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  total={sections.length}
                  onMove={move}
                  onToggleActive={toggleActive}
                  onEdit={setEditing}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {activeSection ? (
              <SectionCard
                section={activeSection}
                index={sections.findIndex((section) => section.id === activeSection.id)}
                total={sections.length}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Editor modal */}
      {editing && (
        <SectionEditor
          section={editing}
          products={allProducts}
          categories={allCategories}
          onSave={handleSaveConfig}
          onClose={() => setEditing(null)}
        />
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
	                <h2 className="font-semibold text-gray-950">Видалити секцію?</h2>
	                <p className="mt-1 text-sm text-muted-foreground">
	                  Секція <span className="font-medium text-gray-900">{getTitle(deleteTarget) || SECTION_META[deleteTarget.type as SectionType]?.label || 'Без назви'}</span> буде видалена безповоротно.
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
