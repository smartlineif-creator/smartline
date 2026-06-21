'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminGetUsers, adminUpdateUser } from '@/lib/api';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminPageHint from '@/components/admin/AdminPageHint';
import { Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [discount, setDiscount] = useState('0');
  const [note, setNote] = useState('');
  const [role, setRole] = useState('USER');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => adminGetUsers().then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q)
    );
  }, [users, search]);

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
        <h1 className="text-2xl font-semibold tracking-tight">Клієнти</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Пошук за email або ім'ям..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ім'я</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Телефон</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Знижка</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Роль</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Дата</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Завантаження...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {search ? 'Нічого не знайдено' : 'Клієнтів ще немає'}
                </td></tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.name || '—'}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{(user as any).phone || '—'}</td>
                  <td className="px-4 py-3">
                    {user.discount > 0 ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        -{user.discount}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
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
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Знижка % <span className="text-muted-foreground">(0–100)</span></Label>
              <Input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} />
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
