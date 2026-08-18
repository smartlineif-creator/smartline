'use client';

import { useState, useRef } from 'react';
import { ServiceBlock, ServiceBlockFaq, ServiceBlockImage, ServiceBlockPricing } from '@/types';
import { uploadImage } from '@/lib/api';
import TiptapEditor from './TiptapEditor';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Loader2, Plus, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  blocks: ServiceBlock[];
  onChange: (blocks: ServiceBlock[]) => void;
}

const BLOCK_LABELS: Partial<Record<ServiceBlock['type'], string>> = {
  heading: 'Заголовок',
  text: 'Текст',
  image: 'Зображення',
  list: 'Список',
  faq: 'FAQ',
  pricing: 'Тарифи',
};

const ADDABLE_BLOCK_TYPES = ['heading', 'text', 'image', 'faq'] as const;
type AddableBlockType = (typeof ADDABLE_BLOCK_TYPES)[number];

const inputCls = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-gray-500';

function defaultBlock(type: AddableBlockType): ServiceBlock {
  switch (type) {
    case 'heading': return { type: 'heading', text: 'Новий заголовок' };
    case 'text':    return { type: 'text', html: '<p>Текст...</p>' };
    case 'image':   return { type: 'image', url: '', caption: '' };
    case 'faq':     return { type: 'faq', items: [{ question: 'Питання?', answer: 'Відповідь.' }] };
  }
}

export default function BlockEditor({ blocks, onChange }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  function update(idx: number, patch: Partial<ServiceBlock>) {
    onChange(blocks.map((b, i) => (i === idx ? { ...b, ...patch } as ServiceBlock : b)));
  }

  function remove(idx: number) {
    setEditingIdx(null);
    onChange(blocks.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[j]] = [next[j], next[idx]];
    if (editingIdx === idx) setEditingIdx(j);
    else if (editingIdx === j) setEditingIdx(idx);
    onChange(next);
  }

  function addBlock(type: AddableBlockType) {
    const next = [...blocks, defaultBlock(type)];
    onChange(next);
    setEditingIdx(next.length - 1);
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => (
        <div key={i}>
          <div className={`flex items-stretch overflow-hidden rounded-xl border transition-colors ${editingIdx === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
            {/* Drag hint */}
            <div className="flex w-9 cursor-grab items-center justify-center bg-gray-50 text-gray-400">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Preview */}
            <div className="min-w-0 flex-1 px-4 py-3">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-gray-400">
                {BLOCK_LABELS[block.type]}
              </p>
              <p className={`truncate text-sm ${block.type === 'heading' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                {previewText(block)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 px-2">
              <button onClick={() => move(i, -1)} title="Вгору" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(i, 1)} title="Вниз" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditingIdx(editingIdx === i ? null : i)} title="Редагувати" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                ✎
              </button>
              <button onClick={() => remove(i)} title="Видалити" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Inline editor */}
          {editingIdx === i && (
            <div className="mb-1 mt-1 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <BlockEditForm block={block} onChange={(b) => update(i, b as Partial<ServiceBlock>)} />
              <div className="mt-3 flex justify-end">
                <button onClick={() => setEditingIdx(null)} className="text-xs text-gray-400 transition-colors hover:text-gray-700">
                  Закрити
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add block toolbar */}
      <div className="mt-3 flex flex-wrap gap-2">
        {ADDABLE_BLOCK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

function previewText(block: ServiceBlock): string {
  switch (block.type) {
    case 'heading': return block.text;
    case 'text':    return block.html.replace(/<[^>]+>/g, '').slice(0, 80);
    case 'image':   return block.caption || block.url || 'Зображення';
    case 'list':    return `${block.title ?? 'Список'} · ${block.items.length} пунктів`;
    case 'faq':     return `${block.items.length} питань`;
    case 'pricing': return `${block.items.length} тарифи`;
  }
}

function BlockEditForm({ block, onChange }: { block: ServiceBlock; onChange: (b: ServiceBlock) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange({ ...block, url } as ServiceBlockImage);
    } catch {
      toast.error('Помилка завантаження');
    } finally {
      setUploading(false);
    }
  };

  if (block.type === 'heading') {
    return (
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Текст заголовка</label>
        <input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className={inputCls}
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <TiptapEditor
        value={block.html}
        onChange={(html) => onChange({ ...block, html })}
      />
    );
  }

  if (block.type === 'image') {
    return (
      <div className="flex flex-col gap-3">
        {block.url ? (
          <div className="group relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <Image src={block.url} alt={block.caption ?? ''} fill className="object-cover" />
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
                onClick={() => onChange({ ...block, url: '' })}
                className="rounded-lg bg-white p-1.5 text-red-500 shadow hover:bg-red-50"
                aria-label="Видалити фото"
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
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Підпис (необовʼязково)</label>
          <input
            value={block.caption ?? ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
    );
  }

if (block.type === 'faq') {
    return (
      <div className="flex flex-col gap-4">
        {block.items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-2 border-l-2 border-blue-400 pl-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-gray-500">Питання {idx + 1}</span>
              <button
                onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== idx) } as ServiceBlockFaq)}
                className="text-xs text-red-500 transition-colors hover:text-red-700"
              >
                Видалити
              </button>
            </div>
            <input
              value={item.question}
              onChange={(e) => {
                const items = block.items.map((it, i) => i === idx ? { ...it, question: e.target.value } : it);
                onChange({ ...block, items } as ServiceBlockFaq);
              }}
              placeholder="Питання"
              className={inputCls}
            />
            <textarea
              value={item.answer}
              onChange={(e) => {
                const items = block.items.map((it, i) => i === idx ? { ...it, answer: e.target.value } : it);
                onChange({ ...block, items } as ServiceBlockFaq);
              }}
              rows={2}
              placeholder="Відповідь"
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        ))}
        <button
          onClick={() => onChange({ ...block, items: [...block.items, { question: 'Нове питання', answer: 'Відповідь' }] } as ServiceBlockFaq)}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Додати питання
        </button>
      </div>
    );
  }

  if (block.type === 'pricing') {
    return (
      <div className="flex flex-col gap-4">
        {block.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 border-l-2 border-blue-400 pl-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <input
                value={item.label}
                onChange={(e) => {
                  const items = block.items.map((it, i) => i === idx ? { ...it, label: e.target.value } : it);
                  onChange({ ...block, items } as ServiceBlockPricing);
                }}
                placeholder="Назва тарифу"
                className={inputCls}
              />
              <input
                value={item.price}
                onChange={(e) => {
                  const items = block.items.map((it, i) => i === idx ? { ...it, price: e.target.value } : it);
                  onChange({ ...block, items } as ServiceBlockPricing);
                }}
                placeholder="Ціна, наприклад «500 грн»"
                className={inputCls}
              />
              <input
                value={item.note ?? ''}
                onChange={(e) => {
                  const items = block.items.map((it, i) => i === idx ? { ...it, note: e.target.value } : it);
                  onChange({ ...block, items } as ServiceBlockPricing);
                }}
                placeholder="Примітка (необов'язково)"
                className={inputCls}
              />
            </div>
            <button
              onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== idx) } as ServiceBlockPricing)}
              className="mt-1 text-gray-400 transition-colors hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...block, items: [...block.items, { label: 'Новий тариф', price: '0 грн' }] } as ServiceBlockPricing)}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Додати тариф
        </button>
      </div>
    );
  }

  return null;
}
