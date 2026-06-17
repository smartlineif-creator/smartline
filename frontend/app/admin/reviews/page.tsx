'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGetReviews, adminApproveReview, adminDeleteReview } from '@/lib/api';
import { Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Star, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminGetReviews(filter === 'approved')
      .then((r) => setReviews(r.data))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    let active = true;
    adminGetReviews(filter === 'approved')
      .then((r) => { if (active) setReviews(r.data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter]);

  const handleApprove = async (id: string) => {
    try { await adminApproveReview(id); toast.success('Схвалено'); load(); } catch { toast.error('Помилка'); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await adminDeleteReview(deleteTarget.id); toast.success('Видалено'); setDeleteTarget(null); load(); } catch { toast.error('Помилка'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Відгуки</h1>

      <div className="flex gap-2 mb-4">
        {(['pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setLoading(true); setFilter(f); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {f === 'pending' ? 'На модерації' : 'Схвалені'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border divide-y">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Завантаження...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Відгуків немає</div>
        ) : reviews.map((review) => (
          <div key={review.id} className="p-4 flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{review.authorName}</span>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('uk-UA')}</span>
              </div>
              {(review as any).product && (
                <p className="text-xs text-blue-600 mb-1">{(review as any).product.name}</p>
              )}
              {review.text && <p className="text-sm">{review.text}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              {!review.isApproved && (
                <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(review.id)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(review)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
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
                <h2 className="text-lg font-semibold text-gray-950">Видалити відгук?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Відгук від <span className="font-medium text-gray-900">{deleteTarget.authorName}</span> буде видалено. Цю дію не можна скасувати.
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
    </div>
  );
}
