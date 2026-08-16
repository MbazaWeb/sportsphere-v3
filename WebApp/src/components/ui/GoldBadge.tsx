'use client';

import { cn } from '@/lib/utils';
import { Crown, ShieldCheck, Sparkles } from 'lucide-react';

interface GoldBadgeProps {
  type?: 'verified' | 'champion' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function GoldBadge({ type = 'verified', size = 'md', className }: GoldBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 text-[8px]',
    md: 'h-5 w-5 text-[10px]',
    lg: 'h-6 w-6 text-xs',
  };

  const typeConfig = {
    verified: { icon: ShieldCheck, label: 'Verified', gradient: 'from-gold to-gold-dark' },
    champion: { icon: Crown, label: 'Champion', gradient: 'from-gold to-orange-500' },
    premium: { icon: Sparkles, label: 'Premium', gradient: 'from-gold to-yellow-400' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full bg-gradient-to-r p-1 text-black font-bold", config.gradient, sizeClasses[size], className)}>
      <Icon className={cn("h-3 w-3", size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3")} />
      <span className="px-1">{config.label}</span>
    </div>
  );
}