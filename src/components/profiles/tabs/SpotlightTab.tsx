'use client';

import { Crown } from 'lucide-react';

export function SpotlightTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-card mb-4"><Crown className="h-7 w-7 text-muted-foreground/40" /></div>
      <p className="text-sm text-muted-foreground">No spotlight videos yet</p>
    </div>
  );
}
