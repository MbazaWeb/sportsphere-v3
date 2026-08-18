'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { ShoppingBag } from 'lucide-react';

export function ShopTab({ userId, name }: { userId?: string; name?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const res = await apiFetch(`/api/feed?userId=${encodeURIComponent(userId)}`);
      const posts = res.ok ? await res.json() : [];
      setItems((Array.isArray(posts) ? posts : []).filter((p: any) => p.postType === 'shop' || p.postType === 'official'));
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading shop…</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground">No products yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-xl border border-surface-border">
          {p.mediaUrls?.[0] && <img src={p.mediaUrls[0]} alt="" className="w-full max-h-56 object-cover" />}
          <div className="p-3">
            <p className="text-sm font-bold text-white">{p.content}</p>
            <button
              type="button"
              className="mt-2 w-full rounded-xl bg-gold py-2 text-sm font-bold text-black"
              onClick={() => useCartStore.getState().add({
                id: p.id,
                title: p.content,
                image: p.mediaUrls?.[0],
                price: p.id.includes('jersey') ? 45000 : p.id.includes('tff') ? 5000 : 20000,
                sellerId: userId || '',
                sellerName: name || 'Shop',
              })}
            >
              Add to cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
