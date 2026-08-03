'use client';

import { Trophy } from 'lucide-react';

export function CareerTab() {
  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider"><Trophy className="h-4 w-4" /> Career History</h3>
      <div className="flex flex-col items-center justify-center py-8"><Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Career data unavailable</p></div>
    </div>
  );
}
