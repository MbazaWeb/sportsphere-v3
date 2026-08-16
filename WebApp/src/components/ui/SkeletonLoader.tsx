'use client';

import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'avatar' | 'hero';
  className?: string;
}

export default function SkeletonLoader({ variant = 'card', className }: SkeletonLoaderProps) {
  if (variant === 'hero') {
    return (
      <div className={cn("glass-card rounded-2xl p-6", className)}>
        <div className="h-32 w-full rounded-xl bg-surface animate-pulse" />
        <div className="mt-4 h-6 w-3/4 rounded-lg bg-surface animate-pulse" />
        <div className="mt-2 h-4 w-1/2 rounded-lg bg-surface animate-pulse" />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="h-12 w-12 rounded-full bg-surface animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 rounded-lg bg-surface animate-pulse" />
          <div className="mt-1 h-3 w-16 rounded-lg bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="h-4 w-full rounded-lg bg-surface animate-pulse" />
        <div className="h-4 w-3/4 rounded-lg bg-surface animate-pulse" />
        <div className="h-4 w-1/2 rounded-lg bg-surface animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl p-4", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded-lg bg-surface animate-pulse" />
          <div className="mt-1 h-3 w-20 rounded-lg bg-surface animate-pulse" />
        </div>
      </div>
      <div className="h-20 w-full rounded-xl bg-surface animate-pulse" />
      <div className="mt-3 flex gap-4">
        <div className="h-4 w-12 rounded-lg bg-surface animate-pulse" />
        <div className="h-4 w-12 rounded-lg bg-surface animate-pulse" />
        <div className="h-4 w-12 rounded-lg bg-surface animate-pulse" />
      </div>
    </div>
  );
}