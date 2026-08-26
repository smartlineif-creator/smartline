'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGetUsers, adminUpdateUser } from '@/lib/api';
import { pluralUk, stripNegative, STATE_BADGE } from '@/lib/utils';
import SortableTh from '@/components/admin/SortableTh';
import { useTableSort, compareText, compareNumber, compareDate, type SortComparators } from '@/lib/useTableSort';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import AdminPageHint from '@/components/admin/AdminPageHint';
import { Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';

type UserSortColumn = 'email' | 'name' | 'phone' | 'discount' | 'role' | 'date';

const USER_COMPARATORS: SortComparators<UserSortColumn, User> = {
  email: (a, b) => compareText(a.email, b.email),
  name: (a, b) => compareText(a.name, b.name),
  phone: (a, b) => compareText((a as User & { phone?: string }).phone, (b as User & { phone?: string }).phone),
  discount: (a, b) => compareNumber(a.discount, b.discount),
  role: (a, b) => compareText(a.role, b.role),
  date: (a, b) => compareDate(a.createdAt, b.createdAt),
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [discount, setDiscount] = useState('0');
  const [note, setNote] = useState('');
  const [role, setRole] = useState('USER');
  const [saving, setSaving] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loading = !hasLoadedOnce;

  const load = useCallback(() => {
    adminGetUsers({ page, limit: PAGE_SIZE, q: search || undefined })
      .then((r) => { setUsers(r.data); setTotal(r.total); })
      .catch(() => { setUsers([]); setTotal(0); })
      .finally(() => setHasLoadedOnce(true));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const openEdit = (u: User) => { setEditing(u); setDiscount(String(u.discount)); setNote((u as any).adminNote || ''); setRole(u.role || 'USER'); };

  const handleSave = async () => {
    if (!editing) return;
    const d = Number(discount);
    if (isNaN(d) || d < 0 || d > 100) { toast.error('Знижка має бути від 0 до 100'); return; }
    setSaving(true);
    try {
      await adminUpdateUser(editing.id, { discount: d, adminNote: note, role });
      toast.success('Оновлено');
      setEditing(null);
      load();
    } catch { toast.error('Помилка'); }
    finally { setSaving(false); }
  };

  const { sorted, column, direction, onSort } = useTableSort(users, USER_COMPARATORS);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <AdminPageHint
        storageKey="users"
        tips={[
          { text: 'Список усіх зареєстрованих покупців з датою реєстрації та кількістю замовлень.' },
          { text: 'Поле "Знижка" — персональний відсоток знижки. Ввійдіть в редагування, щоб змінити.' },
          { text: 'Роль ADMIN дає повний доступ до адмін-панелі. Надавайте обережно.' },
        ]}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Клієнти</h1>
          <p className="text-muted-foreground text-sm">{total} {pluralUk(total, 'клієнт', 'клієнти', 'клієнтів')}</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Пошук за email, ім'ям або телефоном..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh column="email" active={column} direction={direction} onSort={onSort} className="text-xs font-medium text-muted-foreground">Email</SortableTh>
                <SortableTh column="name" active={column} direction={direction} onSort={onSort} className="text-xs font-medium text-muted-foreground">Імʼя</SortableTh>
                <SortableTh column="phone" active={column} direction={direction} onSort={onSort} className="hidden text-xs font-medium text-muted-foreground sm:table-cell">Телефон</SortableTh>
                <SortableTh column="discount" active={column} direction={direction} onSort={onSort} className="text-xs font-medium text-muted-foreground">Знижка</SortableTh>
                <SortableTh column="role" active={column} direction={direction} onSort={onSort} className="text-xs font-medium text-muted-foreground">Роль</SortableTh>
                <SortableTh column="date" active={column} direction={direction} onSort={onSort} className="hidden text-xs font-medium text-muted-foreground sm:table-cell">Дата</SortableTh>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Завантаження...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {search ? 'Нічого не знайдено' : 'Клієнтів ще немає'}
                </td></tr>
              ) : sorted.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.name || '—'}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{(user as any).phone || '—'}</td>
                  <td className="px-4 py-3">
                    {user.discount > 0 ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATE_BADGE.on}`}>
                        -{user.discount}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ring-1 ${user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-gray-50 text-gray-500 ring-gray-200'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex justify-center gap-2 border-t p-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</Button>
            <span className="py-1.5 text-sm">Стор. {page} з {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</Button>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-semibold text-gray-950">Редагувати клієнта</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{editing.email}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select
                value={role}
                onChange={setRole}
                options={[
                  { value: 'USER', label: 'USER' },
                  { value: 'ADMIN', label: 'ADMIN' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Знижка % <span className="text-muted-foreground">(0–100)</span></Label>
              <Input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(stripNegative(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Нотатка адміна</Label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)} disabled={saving}>Скасувати</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Збереження...' : 'Зберегти'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
