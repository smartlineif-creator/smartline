'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminCreateCategory, adminUpdateCategory, getCategories } from '@/lib/api';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'create' | 'edit';

interface Props {
  mode: Mode;
  category?: Category;
}

function flattenCategories(categories: Category[], excludeId?: string): Category[] {
  return categories.flatMap((category) => {
    if (category.id === excludeId) return [];
    return [category, ...flattenCategories(category.children || [], excludeId)];
  });
}

export default function CategoryForm({ mode, category }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(category?.name || '');
  const [parentId, setParentId] = useState(category?.parentId || '');
  const [attrTemplates, setAttrTemplates] = useState<{ name: string; unit: string; filterable: boolean }[]>(
    (category?.attributeTemplates || []).map((t) => ({ name: t.name, unit: t.unit || '', filterable: t.filterable ?? true })),
  );
  const [groupTemplates, setGroupTemplates] = useState<{ name: string; unit: string }[]>(
    (category?.optionGroupTemplates || []).map((t) => ({ name: t.name, unit: t.unit || '' })),
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectorOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setSelectorOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectorOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectorOpen]);

  const parentOptions = useMemo(
    () => flattenCategories(categories, category?.id),
    [categories, category?.id],
  );

  const selectedParent = parentOptions.find((item) => item.id === parentId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Вкажіть назву категорії');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        icon: '',
        parentId: parentId || undefined,
        attributeTemplates: attrTemplates
          .filter((t) => t.name.trim())
          .map((t, i) => ({ name: t.name.trim(), unit: t.unit.trim() || undefined, sortOrder: i, filterable: t.filterable })),
        optionGroupTemplates: groupTemplates
          .filter((t) => t.name.trim())
          .map((t, i) => ({ name: t.name.trim(), unit: t.unit.trim() || undefined, sortOrder: i })),
      };

      if (mode === 'edit' && category) {
        await adminUpdateCategory(category.id, payload);
        toast.success('Категорію оновлено');
      } else {
        await adminCreateCategory(payload);
        toast.success('Категорію створено');
      }
      router.push('/admin/categories');
      router.refresh();
    } catch {
      toast.error('Не вдалося зберегти категорію');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <Label htmlFor="category-name">Назва *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Наприклад, Смартфони"
              className="mt-2 h-11"
            />
          </div>

          <div>
            <Label>Батьківська категорія</Label>
            <div ref={selectorRef} className="relative mt-2">
              <button
                type="button"
                onClick={() => setSelectorOpen((open) => !open)}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm transition-colors hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className={selectedParent ? 'text-gray-900' : 'text-muted-foreground'}>
                  {selectedParent?.name || 'Коренева категорія'}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', selectorOpen && 'rotate-180')} />
              </button>

              {selectorOpen && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => { setParentId(''); setSelectorOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    <Check className={cn('h-4 w-4 text-blue-600', parentId && 'invisible')} />
                    Коренева категорія
                  </button>
                  {parentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => { setParentId(option.id); setSelectorOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      <Check className={cn('h-4 w-4 text-blue-600', parentId !== option.id && 'invisible')} />
                      <span className="truncate">{option.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5">
            <Label>Фільтровані характеристики</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Назви характеристик, за якими покупці зможуть фільтрувати товари в цій категорії.
            </p>
            <div className="mt-2 space-y-2">
              {attrTemplates.map((tmpl, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={tmpl.name}
                    onChange={(e) => {
                      const updated = [...attrTemplates];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setAttrTemplates(updated);
                    }}
                    placeholder="Назва (напр. Процесор)"
                    className="h-9 flex-1"
                  />
                  <Input
                    value={tmpl.unit}
                    onChange={(e) => {
                      const updated = [...attrTemplates];
                      updated[i] = { ...updated[i], unit: e.target.value };
                      setAttrTemplates(updated);
                    }}
                    placeholder="Одиниця (ГБ...)"
                    className="h-9 w-32"
                  />
                  <label
                    className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-600 hover:border-gray-300"
                    title="Чи можна фільтрувати товари за цією характеристикою в каталозі"
                  >
                    <input
                      type="checkbox"
                      checked={tmpl.filterable}
                      onChange={(e) => {
                        const updated = [...attrTemplates];
                        updated[i] = { ...updated[i], filterable: e.target.checked };
                        setAttrTemplates(updated);
                      }}
                      className="h-3.5 w-3.5"
                    />
                    Фільтр
                  </label>
                  <button
                    type="button"
                    onClick={() => setAttrTemplates(attrTemplates.filter((_, j) => j !== i))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAttrTemplates([...attrTemplates, { name: '', unit: '', filterable: true }])}
                className="flex h-9 items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600"
              >
                <Plus className="h-4 w-4" />
                Додати характеристику
              </button>
            </div>
        </div>

        <div className="mt-5">
          <Label>Шаблони варіантних груп</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Назви груп конфігурацій (RAM, SSD, Колір) для вибору при додаванні товару.
          </p>
          <div className="mt-2 space-y-2">
            {groupTemplates.map((tmpl, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={tmpl.name}
                  onChange={(e) => {
                    const updated = [...groupTemplates];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setGroupTemplates(updated);
                  }}
                  placeholder="Назва (напр. Оперативна пам'ять)"
                  className="h-9 flex-1"
                />
                <Input
                  value={tmpl.unit}
                  onChange={(e) => {
                    const updated = [...groupTemplates];
                    updated[i] = { ...updated[i], unit: e.target.value };
                    setGroupTemplates(updated);
                  }}
                  placeholder="Одиниця (ГБ...)"
                  className="h-9 w-32"
                />
                <button
                  type="button"
                  onClick={() => setGroupTemplates(groupTemplates.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setGroupTemplates([...groupTemplates, { name: '', unit: '' }])}
              className="flex h-9 items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
              Додати групу
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/categories">Скасувати</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </div>
    </form>
  );
}
