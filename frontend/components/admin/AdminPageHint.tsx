'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';

interface Tip {
  text: string;
}

interface Props {
  storageKey: string;
  title?: string;
  tips: Tip[];
}

export default function AdminPageHint({ storageKey, title = 'Як користуватись цією сторінкою', tips }: Props) {
  const key = `admin-hint-collapsed:${storageKey}`;
  const [collapsed, setCollapsed] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(key);
    if (stored === 'dismissed') { setDismissed(true); return; }
    if (stored === 'open') setCollapsed(false);
  }, [key]);

  if (!mounted || dismissed) return null;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(key, next ? 'closed' : 'open');
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(key, 'dismissed');
  };

  return (
    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Info className="h-4 w-4 shrink-0 text-blue-500" />
        <button
          type="button"
          onClick={toggle}
          className="flex flex-1 items-center justify-between text-left text-sm font-medium text-blue-800"
        >
          {title}
          {collapsed
            ? <ChevronDown className="h-4 w-4 text-blue-400" />
            : <ChevronUp className="h-4 w-4 text-blue-400" />}
        </button>
        <button
          type="button"
          onClick={dismiss}
          title="Приховати назавжди"
          className="ml-1 rounded p-0.5 text-blue-300 hover:text-blue-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <ul className="space-y-1.5 border-t border-blue-100 px-5 py-3 text-sm text-blue-800">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0 select-none text-blue-400">•</span>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
