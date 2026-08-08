'use client';

import { cn } from '@/lib/utils';
import { formatCount } from '@/store/useAppStore';

interface ProfileStatsProps {
  followers: number;
  following: number;
  posts: number;
  onOpenList: (type: 'followers' | 'following') => void;
}

export function ProfileStats({ followers, following, posts, onOpenList }: ProfileStatsProps) {
  return (
    <div className="mt-4 px-4 grid grid-cols-3 gap-3">
      <button onClick={() => onOpenList('followers')} className="glass-card rounded-xl p-3 text-center glass-card-hover hover:border-gold/30 transition-colors">
        <p className="text-sm font-black text-gold">{formatCount(followers)}</p>
        <p className="text-[10px] font-medium uppercase text-muted-foreground">Followers</p>
      </button>
      <button onClick={() => onOpenList('following')} className="glass-card rounded-xl p-3 text-center glass-card-hover hover:border-gold/30 transition-colors">
        <p className="text-sm font-black text-gold">{formatCount(following)}</p>
        <p className="text-[10px] font-medium uppercase text-muted-foreground">Following</p>
      </button>
      <div className="glass-card rounded-xl p-3 text-center glass-card-hover">
        <p className="text-sm font-black text-gold">{formatCount(posts)}</p>
        <p className="text-[10px] font-medium uppercase text-muted-foreground">Posts</p>
      </div>
    </div>
  );
}
