'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Service, ServiceBlock } from '@/types';
import { adminCreateService, adminUpdateService, uploadImage } from '@/lib/api';
import BlockEditor from './BlockEditor';
import ServiceTierEditor, { ServiceTierDraft } from './ServiceTierEditor';
import { toast } from 'sonner';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
import { cn, toSlug } from '@/lib/utils';

interface Props {
  initial?: Service;
}

const inputCls = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-gray-500';

export default function ServiceForm({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(String(initial?.price ?? ''));
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [blocks, setBlocks] = useState<ServiceBlock[]>((initial?.blocks as ServiceBlock[]) ?? []);
  const [tiers, setTiers] = useState<ServiceTierDraft[]>(
    (initial?.tiers ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      price: String(t.price),
      note: t.note ?? '',
    })),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    // toSlug transliterates Cyrillic — «Чистка ноутбука» → chystka-noutbuka
    if (!initial) setSlug(toSlug(val));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
    } catch {
      toast.error('Помилка завантаження');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Введіть назву'); return; }
    if (!slug.trim()) { toast.error('Введіть slug'); return; }
    // With tiers the price is optional — the backend derives it from the cheapest tier
    if (!price && tiers.length === 0) { toast.error('Введіть ціну або додайте тариф'); return; }
    if (price && (isNaN(Number(price)) || Number(price) < 0)) { toast.error('Введіть коректну ціну'); return; }
    if (tiers.some((t) => !t.label.trim() || isNaN(Number(t.price)) || Number(t.price) < 0)) {
      toast.error('Перевірте назви й ціни тарифів');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        price: price ? Number(price) : undefined,
        coverImage: coverImage || undefined,
        isActive,
        blocks,
        tiers: tiers.map((t, idx) => ({
          id: t.id,
          label: t.label.trim(),
          price: Number(t.price),
          note: t.note.trim() || undefined,
          sortOrder: idx,
        })),
      };
      if (initial) {
        await adminUpdateService(initial.id, data);
        toast.success('Збережено');
      } else {
        await adminCreateService(data);
        toast.success('Послугу створено');
        router.push('/admin/services');
      }
    } catch (e: unknown) {
      const msg = (e as Error).message;
      toast.error(msg?.includes('slug') ? 'Slug вже зайнятий' : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sidebar */}
      <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div>
          <h3 className={`${labelCls} mb-3`}>Основне</h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Назва</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Чистка ноутбука"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="chistka-noutbuka"
                className={`${inputCls} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Короткий опис</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Статус</label>
              <div
                className="mt-1 inline-flex w-fit rounded-lg border bg-gray-50 p-1"
                role="group"
                aria-label="Статус послуги"
              >
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  aria-pressed={isActive}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium', isActive ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600')}
                >
                  Активна
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  aria-pressed={!isActive}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium', !isActive ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-600')}
                >
                  Прихована
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Прихована послуга не показується на сайті, але лишається в адмінці.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className={`${labelCls} mb-3`}>Ціна</h3>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Ціна (грн)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
              placeholder={tiers.length > 0 ? 'Авто — з найдешевшого тарифу' : ''}
              className={inputCls}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {tiers.length > 0
              ? 'Можна лишити порожньою — тоді візьмемо ціну найдешевшого тарифу.'
              : 'Використовується, лише якщо тарифів немає. Коли тарифи додані, ціна на сайті рахується з них: один тариф — його ціна, кілька — «від» найдешевшого.'}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className={`${labelCls} mb-3`}>Тарифи</h3>
          <ServiceTierEditor tiers={tiers} onChange={setTiers} />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className={`${labelCls} mb-3`}>Обкладинка</h3>
          {coverImage ? (
            <div className="group relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <Image src={coverImage} alt="cover" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow hover:bg-gray-100"
                >
                  Замінити
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="rounded-lg bg-white p-1.5 text-red-500 shadow hover:bg-red-50"
                  aria-label="Видалити обкладинку"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cn(
                'w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                uploading ? 'cursor-not-allowed bg-gray-50' : 'hover:border-blue-400',
              )}
            >
              {uploading ? (
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              )}
              <span className="text-sm text-gray-500">
                {uploading ? 'Завантаження...' : 'Натисніть, щоб завантажити фото'}
              </span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

      </div>

      {/* Block editor */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className={`${labelCls} mb-4`}>Блоки контенту</h3>
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>

      {/* Sticky save bar */}
      <div className="pointer-events-none sticky bottom-4 z-30">
        <div className="pointer-events-auto ml-auto max-w-fit rounded-2xl border border-gray-200 bg-white/96 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/services"
              className="flex h-9 items-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Скасувати
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex h-9 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
