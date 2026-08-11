'use client';

import { formatCount } from '@/store/useAppStore';

interface ProfileStatsProps {
  followers: number;
  following: number;
  posts: number;
  onOpenList: (type: 'followers' | 'following') => void;
}

export function ProfileStats({ followers, following, posts, onOpenList }: ProfileStatsProps) {
  return (
    <div className="mt-3 px-3 sm:px-4 grid grid-cols-3 gap-2 sm:gap-3">
      <button onClick={() => onOpenList('followers')} className="glass-card rounded-xl p-2.5 sm:p-3 text-center glass-card-hover hover:border-gold/30 transition-colors active:scale-95">
        <p className="text-sm sm:text-base font-black text-gold">{formatCount(followers)}</p>
        <p className="text-[9px] sm:text-[10px] font-medium uppercase text-muted-foreground">Followers</p>
      </button>
      <button onClick={() => onOpenList('following')} className="glass-card rounded-xl p-2.5 sm:p-3 text-center glass-card-hover hover:border-gold/30 transition-colors active:scale-95">
        <p className="text-sm sm:text-base font-black text-gold">{formatCount(following)}</p>
        <p className="text-[9px] sm:text-[10px] font-medium uppercase text-muted-foreground">Following</p>
      </button>
      <div className="glass-card rounded-xl p-2.5 sm:p-3 text-center glass-card-hover">
        <p className="text-sm sm:text-base font-black text-gold">{formatCount(posts)}</p>
        <p className="text-[9px] sm:text-[10px] font-medium uppercase text-muted-foreground">Posts</p>
      </div>
    </div>
  );
}
