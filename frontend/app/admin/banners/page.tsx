'use client';

import { useEffect, useState } from 'react';
import { adminGetBanners, adminCreateBanner, adminUpdateBanner, adminDeleteBanner, uploadImage } from '@/lib/api';
import { Banner } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, AlertTriangle, Upload, X } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => adminGetBanners().then(setBanners).catch(() => {});
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setTitle(''); setImageUrl(''); setLink(''); setShowForm(true); };
  const openEdit = (b: Banner) => { setEditing(b); setTitle(b.title); setImageUrl(b.imageUrl); setLink(b.link || ''); setShowForm(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch { toast.error('Помилка завантаження'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Введіть заголовок'); return; }
    if (!imageUrl) { toast.error('Завантажте зображення'); return; }
    setSaving(true);
    try {
      const data = { title, imageUrl, link: link || undefined };
      if (editing) { await adminUpdateBanner(editing.id, data); toast.success('Оновлено'); }
      else { await adminCreateBanner(data); toast.success('Створено'); }
      setShowForm(false);
      load();
    } catch { toast.error('Помилка'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await adminDeleteBanner(deleteTarget.id); toast.success('Видалено'); setDeleteTarget(null); load(); } catch { toast.error('Помилка'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Банери</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Додати</Button>
      </div>

      <div className="grid gap-4">
        {banners.length === 0 && (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-muted-foreground">
            Банерів ще немає. Додайте перший!
          </div>
        )}
        {banners.map((b) => (
          <div key={b.id} className="bg-white border rounded-xl p-4 flex gap-4 items-center">
            <div className="relative w-32 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{b.title}</p>
              {b.link && <p className="text-sm text-muted-foreground">{b.link}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(b)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-950">Видалити банер?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Банер <span className="font-medium text-gray-900">{deleteTarget.title}</span> буде видалено. Цю дію не можна скасувати.
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">{editing ? 'Редагувати банер' : 'Новий банер'}</h3>
            <div>
              <Label>Заголовок *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Зображення</Label>
              {imageUrl ? (
                <div className="relative overflow-hidden rounded-lg border bg-gray-50">
                  <div className="relative h-36 w-full">
                    <Image src={imageUrl} alt="" fill className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute right-2 top-2 rounded bg-white p-1 text-red-500 shadow hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-blue-400"
                >
                  <Upload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Завантаження...' : 'Натисніть, щоб завантажити зображення'}
                  </span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div>
              <Label>Посилання</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/product/slug" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={saving}>Скасувати</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || uploading}>
                {saving ? 'Збереження...' : 'Зберегти'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
