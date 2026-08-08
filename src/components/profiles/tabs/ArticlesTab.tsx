'use client';

import { Newspaper } from 'lucide-react';

export function ArticlesTab() {
  return <div className="flex flex-col items-center justify-center py-8"><Newspaper className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Articles unavailable</p></div>;
}
