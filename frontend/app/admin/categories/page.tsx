'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCategories, adminDeleteCategory, adminReorderCategories } from '@/lib/api';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronUp,
  FolderTree,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHint from '@/components/admin/AdminPageHint';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const persistOrder = async (list: Category[], scopeParentId: string | null) => {
    const reordered = list.map((c, i) => ({ ...c, sortOrder: i }));
    setCategories((prev) => {
      if (scopeParentId === null) return reordered;
      return prev.map((c) => (c.id === scopeParentId ? { ...c, children: reordered } : c));
    });
    try {
      await adminReorderCategories(reordered.map((c) => ({ id: c.id, sortOrder: c.sortOrder })));
    } catch {
      toast.error('Помилка перестановки категорій');
      load();
    }
  };

  const handleRootDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    await persistOrder(arrayMove(categories, oldIndex, newIndex), null);
  };

  const handleChildDragEnd = (parent: Category) => async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const children = parent.children ?? [];
    const oldIndex = children.findIndex((c) => c.id === active.id);
    const newIndex = children.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    await persistOrder(arrayMove(children, oldIndex, newIndex), parent.id);
  };

  const moveRoot = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next, null);
  };

  const moveChild = (parent: Category, idx: number, dir: -1 | 1) => {
    const children = parent.children ?? [];
    const target = idx + dir;
    if (target < 0 || target >= children.length) return;
    const next = [...children];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next, parent.id);
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
      <AdminPageHint
        storageKey="categories"
        tips={[
          { text: 'Категорії утворюють дерево: дочірні відображаються з відступом під батьківськими.' },
          { text: 'Перетягніть за іконку ≡ (або скористайтесь стрілками), щоб змінити порядок категорій — він одразу відобразиться в меню, каталозі й футері.' },
          { text: 'У налаштуваннях категорії задайте "Фільтровані характеристики" — назви атрибутів для фільтрів у каталозі (Процесор, ОС, Стан).' },
          { text: 'Також задайте "Шаблони варіантних груп" — назви конфігурацій зі своїми одиницями (Оперативна пам\'ять · ГБ, SSD · ГБ). Вони з\'являться у дропдауні при редагуванні товарів цієї категорії.' },
          { text: 'Видалення категорії неможливе, якщо в ній є товари або підкатегорії.' },
        ]}
      />
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRootDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {categories.map((cat, idx) => {
                const hasChildren = (cat.children?.length ?? 0) > 0;
                const isCollapsed = collapsedIds.has(cat.id);
                return (
                  <div key={cat.id}>
                    <SortableCategoryRow
                      cat={cat}
                      onDelete={setDeleteTarget}
                      depth={0}
                      hasChildren={hasChildren}
                      isCollapsed={isCollapsed}
                      onToggle={hasChildren ? () => toggleCollapse(cat.id) : undefined}
                      index={idx}
                      total={categories.length}
                      onMove={moveRoot}
                    />
                    {hasChildren && !isCollapsed && (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd(cat)}>
                        <SortableContext items={(cat.children ?? []).map((c) => c.id)} strategy={verticalListSortingStrategy}>
                          {(cat.children ?? []).map((sub, subIdx) => (
                            <SortableCategoryRow
                              key={sub.id}
                              cat={sub}
                              parentName={cat.name}
                              onDelete={setDeleteTarget}
                              depth={1}
                              index={subIdx}
                              total={cat.children!.length}
                              onMove={(i, dir) => moveChild(cat, i, dir)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>
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

interface CategoryRowProps {
  cat: Category;
  parentName?: string;
  onDelete: (category: Category) => void;
  depth: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  index: number;
  total: number;
  onMove: (idx: number, dir: -1 | 1) => void;
  isDragging?: boolean;
  handleRef?: (node: HTMLElement | null) => void;
  handleProps?: Record<string, any>;
}

function SortableCategoryRow(props: Omit<CategoryRowProps, 'isDragging' | 'handleRef' | 'handleProps'>) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.cat.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined, position: 'relative' }}
    >
      <CategoryRow {...props} isDragging={isDragging} handleRef={setActivatorNodeRef} handleProps={{ ...attributes, ...listeners }} />
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
  index,
  total,
  onMove,
  isDragging = false,
  handleRef,
  handleProps,
}: CategoryRowProps) {
  return (
    <div
      className={`flex items-center justify-between border-b bg-white px-4 py-3 last:border-0 transition-colors hover:bg-gray-50 ${depth > 0 ? 'bg-gray-50/50 pl-10' : ''} ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* Drag handle */}
        <button
          type="button"
          ref={handleRef}
          {...handleProps}
          aria-label="Перетягнути для зміни порядку"
          className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Up/down order buttons */}
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            aria-label="Перемістити вище"
            className="flex h-3.5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-default disabled:opacity-20"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            aria-label="Перемістити нижче"
            className="flex h-3.5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-default disabled:opacity-20"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

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
