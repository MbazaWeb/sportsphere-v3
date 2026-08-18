'use client';

import { useCartStore } from '@/store/cartStore';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useState } from 'react';
import { X } from 'lucide-react';

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const open = useCartStore((s) => s.open);
  const setOpen = useCartStore((s) => s.setOpen);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const total = useCartStore((s) => s.total);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60" onClick={() => setOpen(false)}>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0b0e14] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Cart</h2>
          <button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5 text-white" /></button>
        </div>
        {done ? (
          <p className="text-sm text-emerald-300">{done}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">Cart is empty.</p>
        ) : (
          <>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-xl border border-slate-800 p-2">
                  {it.image ? <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{it.title}</p>
                    <p className="text-xs text-slate-400">{it.sellerName} · x{it.qty}</p>
                    <p className="text-sm text-gold">TZS {(it.price * it.qty).toLocaleString()}</p>
                  </div>
                  <button type="button" className="text-xs text-red-400" onClick={() => remove(it.id)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="mb-3 flex justify-between text-white">
                <span>Total</span>
                <span className="font-bold text-gold">TZS {total().toLocaleString()}</span>
              </div>
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black disabled:opacity-60"
                onClick={async () => {
                  if (!isAuthenticated) { setLoginModalOpen(true); return; }
                  setBusy(true);
                  try {
                    const res = await apiFetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items, total: total() }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Checkout failed');
                    setDone('Order placed. Payment pending (pay on delivery).');
                    clear();
                  } catch (e: any) {
                    alert(e.message);
                  }
                  setBusy(false);
                }}
              >
                {busy ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
