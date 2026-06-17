'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getCategories, adminDeleteCategory } from '@/lib/api';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const load = () =>
    getCategories()
      .then((data) => {
        setCategories(data);
        const withChildren = data.filter((c: Category) => !c.parentId && (c.children?.length ?? 0) > 0);
        setCollapsedIds(new Set(withChildren.map((c: Category) => c.id)));
      })
      .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const rootsWithChildren = categories.filter((c) => !c.parentId && (c.children?.length ?? 0) > 0);
  const allCollapsed = rootsWithChildren.length > 0 && rootsWithChildren.every((c) => collapsedIds.has(c.id));

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(rootsWithChildren.map((c) => c.id)));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteCategory(deleteTarget.id);
      toast.success('Категорію видалено');
      setDeleteTarget(null);
      load();
    } catch (error: any) {
      const message = error?.message || 'Помилка видалення';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Категорії</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Керуйте структурою каталогу і вкладеними розділами.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rootsWithChildren.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll} title={allCollapsed ? 'Розгорнути всі' : 'Згорнути всі'}>
              {allCollapsed
                ? <><ChevronsUpDown className="h-3.5 w-3.5 mr-1.5" />Розгорнути всі</>
                : <><ChevronsDownUp className="h-3.5 w-3.5 mr-1.5" />Згорнути всі</>
              }
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="h-4 w-4" />
              Додати
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Завантаження...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Категорій ще немає</div>
        ) : (
          categories.map((cat) => {
            const hasChildren = (cat.children?.length ?? 0) > 0;
            const isCollapsed = collapsedIds.has(cat.id);
            return (
              <div key={cat.id}>
                <CategoryRow
                  cat={cat}
                  onDelete={setDeleteTarget}
                  depth={0}
                  hasChildren={hasChildren}
                  isCollapsed={isCollapsed}
                  onToggle={hasChildren ? () => toggleCollapse(cat.id) : undefined}
                />
                {hasChildren && !isCollapsed && cat.children?.map((sub) => (
                  <CategoryRow
                    key={sub.id}
                    cat={sub}
                    parentName={cat.name}
                    onDelete={setDeleteTarget}
                    depth={1}
                  />
                ))}
              </div>
            );
          })
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
                <h2 className="text-lg font-semibold text-gray-950">Видалити категорію?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Категорія <span className="font-medium text-gray-900">{deleteTarget.name}</span> буде видалена. Цю дію не можна скасувати.
                </p>
                {!!deleteTarget._count && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {deleteTarget._count.products > 0 && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {deleteTarget._count.products} товарів у категорії
                      </span>
                    )}
                    {deleteTarget._count.children > 0 && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {deleteTarget._count.children} підкатегорій
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Скасувати
              </Button>
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

function CategoryRow({
  cat,
  parentName,
  onDelete,
  depth,
  hasChildren = false,
  isCollapsed = false,
  onToggle,
}: {
  cat: Category;
  parentName?: string;
  onDelete: (category: Category) => void;
  depth: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b px-4 py-3 last:border-0 transition-colors hover:bg-gray-50 ${depth > 0 ? 'bg-gray-50/50 pl-10' : ''}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Collapse toggle / indent indicator */}
        {depth === 0 ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={!hasChildren}
            aria-label={isCollapsed ? 'Розгорнути підкатегорії' : 'Згорнути підкатегорії'}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-30"
          >
            {hasChildren ? (
              <ChevronDown
                className="h-4 w-4 text-blue-600 transition-transform duration-200"
                style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              />
            ) : (
              <FolderTree className="h-4 w-4 text-blue-600" />
            )}
          </button>
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        )}

        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-gray-900">{cat.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {parentName ? `У розділі "${parentName}"` : 'Коренева категорія'}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {!!cat._count?.products && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {cat._count.products} товарів
              </span>
            )}
            {!!cat._count?.children && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${isCollapsed ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {cat._count.children} підкатегорій
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/admin/categories/${cat.id}/edit`} aria-label="Редагувати категорію">
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => onDelete(cat)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
