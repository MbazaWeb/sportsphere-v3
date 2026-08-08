'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

interface ProfileCoverProps {
  coverGradient: string;
  pullProgress: number;
  isRefreshing: boolean;
  onBack: () => void;
}

export function ProfileCover({ coverGradient, pullProgress, isRefreshing, onBack }: ProfileCoverProps) {
  return (
    <div className={cn('relative h-44 w-full bg-gradient-to-br', coverGradient)}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div style={{ transform: 	`translateY(${pullProgress * 40}px)` }} className="absolute top-2 left-0 right-0 flex items-center justify-center pointer-events-none z-20">
        {isRefreshing ? (
          <div className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-black text-xs font-bold">↻</div>
        ) : pullProgress > 0 ? (
          <div className="h-6 w-6 rounded-full bg-gold/25 flex items-center justify-center text-gold text-xs font-bold">%</div>
        ) : null}
      </div>
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors">
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
