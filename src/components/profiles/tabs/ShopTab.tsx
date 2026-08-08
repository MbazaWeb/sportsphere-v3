'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShoppingBag, Ticket, Tag, CreditCard, Truck } from 'lucide-react';

export function ShopTab() {
  const [shopSubtab, setShopSubtab] = useState<'products' | 'tickets'>('products');
  const products: any[] = [];
  const tickets: any[] = [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-3">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15"><Tag className="h-4 w-4 text-gold" /></div><div><p className="text-xs font-bold text-white">Official Shop</p><p className="text-[10px] text-muted-foreground">Powered by SportsSphere Commerce</p></div></div>
        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">OPEN</span>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface p-1">
        <button onClick={() => setShopSubtab('products')} className={cn('flex-1 rounded-lg py-2 text-xs font-bold transition-colors', shopSubtab === 'products' ? 'bg-gold text-black' : 'text-muted-foreground')}><ShoppingBag className="mr-1 inline h-3.5 w-3.5" /> Products</button>
        <button onClick={() => setShopSubtab('tickets')} className={cn('flex-1 rounded-lg py-2 text-xs font-bold transition-colors', shopSubtab === 'tickets' ? 'bg-gold text-black' : 'text-muted-foreground')}><Ticket className="mr-1 inline h-3.5 w-3.5" /> Tickets</button>
      </div>

      {shopSubtab === 'products' && (products.length === 0 ? <div className="flex flex-col items-center justify-center py-8"><ShoppingBag className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No products available</p></div> : <div className="grid grid-cols-2 gap-3">{products.map((item, i) => <div key={i} className="glass-card rounded-xl overflow-hidden glass-card-hover"><div className={cn('relative aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}><span className="text-3xl font-black text-white/20">SS</span>{item.stock === 'Sold out' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Sold Out</span></div>}</div><div className="p-3"><p className="text-xs font-bold text-white leading-tight">{item.name}</p><div className="mt-1 flex items-center justify-between"><p className="text-xs font-bold text-gold">{item.price}</p><p className="text-[9px] text-muted-foreground">{item.usd}</p></div><p className={cn('mt-1 text-[9px] font-semibold', item.stock === 'Sold out' ? 'text-red-400' : item.stock === 'Low stock' ? 'text-yellow-400' : 'text-green-400')}>{item.stock}</p>{item.stock !== 'Sold out' && <button className="mt-2 w-full rounded-lg bg-gold py-1.5 text-[10px] font-bold text-black">Add to Cart</button>}</div></div>)}</div>)}

      {shopSubtab === 'tickets' && (tickets.length === 0 ? <div className="flex flex-col items-center justify-center py-8"><Ticket className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No tickets available</p></div> : <div className="flex flex-col gap-3">{tickets.map((t, i) => <div key={i} className="glass-card rounded-2xl p-4 glass-card-hover"><div className="flex items-start justify-between mb-2"><div><p className="text-sm font-bold text-white">{t.match}</p><p className="text-[10px] text-muted-foreground">{t.date} · {t.kickoff}</p></div><span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', t.available ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>{t.available ? 'Available' : 'Sold Out'}</span></div><p className="text-sm font-bold text-gold mb-2">{t.price}</p>{t.available && <button className="w-full rounded-xl bg-gold py-2 text-sm font-bold text-black">Pre-Book</button>}</div>)}</div>)}

      <div className="mt-4 glass-card rounded-2xl p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider"><CreditCard className="h-3.5 w-3.5" /> Payment & Delivery</h3>
        <div className="flex flex-wrap gap-1 mb-2">{['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Visa', 'Mastercard'].map(p => <span key={p} className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-white">{p}</span>)}</div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3 text-gold" /> {shopSubtab === 'tickets' ? 'Mobile ticket · Instant delivery' : '2-5 days delivery · Pickup available'}</p>
      </div>
    </div>
  );
}
