'use client';

import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface ServiceTierDraft {
  id?: string;
  label: string;
  price: string;
  note: string;
}

interface Props {
  tiers: ServiceTierDraft[];
  onChange: (tiers: ServiceTierDraft[]) => void;
}

const inputCls = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-gray-500';

export default function ServiceTierEditor({ tiers, onChange }: Props) {
  function update(idx: number, patch: Partial<ServiceTierDraft>) {
    onChange(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function remove(idx: number) {
    onChange(tiers.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= tiers.length) return;
    const next = [...tiers];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function add() {
    onChange([...tiers, { label: '', price: '', note: '' }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {tiers.map((tier, idx) => (
        <div key={tier.id ?? `new-${idx}`} className="flex items-start gap-2 rounded-xl border border-gray-200 p-3">
          <div className="flex shrink-0 flex-col gap-1 pt-1">
            <button onClick={() => move(idx, -1)} title="Вгору" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => move(idx, 1)} title="Вниз" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Label className={labelCls}>Назва тарифу</Label>
              <Input
                value={tier.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="Windows + драйвери"
                className={inputCls}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label className={labelCls}>Ціна (грн)</Label>
                <Input
                  type="number"
                  min={0}
                  value={tier.price}
                  onChange={(e) => update(idx, { price: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label className={labelCls}>Примітка</Label>
                <Input
                  value={tier.note}
                  onChange={(e) => update(idx, { note: e.target.value })}
                  placeholder="Необов'язково"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => remove(idx)}
            className="mt-1 shrink-0 text-gray-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="flex w-fit items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        <Plus className="h-3.5 w-3.5" /> Додати тариф
      </button>
    </div>
  );
}
