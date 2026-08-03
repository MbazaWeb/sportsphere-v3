'use client';

import { cn } from '@/lib/utils';
import { UserPlus, UserMinus, MessageCircle, ShoppingBag } from 'lucide-react';

interface ProfileActionsProps {
  role: string;
  following: boolean;
  setFollowing: (val: boolean) => void;
}

export function ProfileActions({ role, following, setFollowing }: ProfileActionsProps) {
  return (
    <div className="mt-4 px-4 flex gap-2">
      <button onClick={() => setFollowing(!following)}
        className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all',
          following ? 'glass-card text-muted-foreground' : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]')}>
        {following ? <><UserMinus className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
      </button>
      <button className="flex items-center justify-center rounded-xl glass-card px-4 hover:bg-surface-elevated transition-colors">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </button>
      {(role === 'team' || role === 'business' || role === 'stadium') && (
        <button className="relative flex items-center justify-center rounded-xl glass-card px-4 hover:bg-surface-elevated transition-colors">
          <ShoppingBag className="h-4 w-4 text-gold" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-black">0</span>
        </button>
      )}
    </div>
  );
}
