'use client';

// ─── Business Products Tab ────────────────────────────────────
//
// Shows products/services as a list parsed from textarea.
// Format: Product | Category | Price

import { ShoppingBag, Package } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, rpString } from '../../shared/ui';

interface Product { name: string; category: string; price: string; }

export function BusinessProductsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const raw = rpString(rp, 'products');
  const website = rpString(rp, 'website');

  const products: Product[] = raw
    ? raw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const p = line.split('|').map(s => s.trim());
        return { name: p[0] || '', category: p[1] || '', price: p[2] || '' };
      }).filter(p => p.name)
    : [];

  if (products.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No products published yet"
        message="Add your products from Edit Profile → Products. Format: Product | Category | Price"
      />
    );
  }

  // Group by category
  const byCategory: Record<string, Product[]> = {};
  products.forEach(p => {
    const cat = p.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });

  return (
    <div className="flex flex-col gap-3">
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold/15 border border-gold/30 text-gold text-sm font-bold uppercase py-2.5 hover:bg-gold/25 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />Visit Store
        </a>
      )}

      {Object.entries(byCategory).map(([category, items]) => (
        <Card key={category} hover>
          <SectionTitle icon={Package} action={<Badge color="muted">{items.length}</Badge>}>
            {category}
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((p, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{p.name}</p>
                {p.price && <p className="text-[11px] text-gold font-bold mt-0.5">{p.price}</p>}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
