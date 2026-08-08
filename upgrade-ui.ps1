# ============================================================
# SportSphere UI/UX Upgrade Script - Gold Theme
# Run: .\upgrade-ui.ps1
# ============================================================

Write-Host "🏆 SportSphere UI/UX Upgrade - Gold Theme" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Set project root
$projectRoot = "C:\Users\Mbaza\Documents\Projects\SportSphere-v2"
Set-Location $projectRoot

# ============================================================
# PART 1: Replace all sport-green references with gold
# ============================================================
Write-Host "📦 PART 1: Replacing colors..." -ForegroundColor Cyan

$extensions = @("*.tsx", "*.ts", "*.css", "*.jsx", "*.js")

$replacements = @(
    @{Pattern = 'sport-green'; Replacement = 'gold'},
    @{Pattern = 'text-sport-green'; Replacement = 'text-gold'},
    @{Pattern = 'bg-sport-green'; Replacement = 'bg-gold'},
    @{Pattern = 'border-sport-green'; Replacement = 'border-gold'},
    @{Pattern = 'ring-sport-green'; Replacement = 'ring-gold'},
    @{Pattern = 'hover:bg-sport-green'; Replacement = 'hover:bg-gold'},
    @{Pattern = 'hover:border-sport-green'; Replacement = 'hover:border-gold'},
    @{Pattern = 'focus:ring-sport-green'; Replacement = 'focus:ring-gold'},
    @{Pattern = 'from-sport-green'; Replacement = 'from-gold'},
    @{Pattern = 'to-sport-green'; Replacement = 'to-gold'},
    @{Pattern = 'via-sport-green'; Replacement = 'via-gold'},
    @{Pattern = 'shadow-sport-green'; Replacement = 'shadow-gold'}
)

$count = 0
foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path "src" -Recurse -Filter $ext
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        $modified = $false
        
        foreach ($rep in $replacements) {
            if ($content -match $rep.Pattern) {
                $content = $content -replace $rep.Pattern, $rep.Replacement
                $modified = $true
            }
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $count++
        }
    }
}

Write-Host "✅ Updated $count files with gold colors!" -ForegroundColor Green
Write-Host ""

# ============================================================
# PART 2: Add gold shimmer animation to globals.css
# ============================================================
Write-Host "📦 PART 2: Adding gold animations..." -ForegroundColor Cyan

$globalsPath = "src\app\globals.css"
$globalsContent = Get-Content $globalsPath -Raw

$shimmerAnimation = @"

/* Gold Shimmer Animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(245,197,24,0.10) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 200% 100%;
}

/* Gold Pulse Animation */
@keyframes gold-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.animate-gold-pulse {
  animation: gold-pulse 1.5s ease-in-out infinite;
}

/* Gold Glow Animation */
@keyframes gold-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(245,197,24,0.2);
  }
  50% {
    box-shadow: 0 0 40px rgba(245,197,24,0.4);
  }
}

.animate-gold-glow {
  animation: gold-glow 2s ease-in-out infinite;
}

/* Slide Up Animation */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out forwards;
}

/* Scale In Animation */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}
"@

if ($globalsContent -notmatch "animate-shimmer") {
    $globalsContent = $globalsContent + $shimmerAnimation
    Set-Content -Path $globalsPath -Value $globalsContent -NoNewline
    Write-Host "✅ Added animations to globals.css" -ForegroundColor Green
} else {
    Write-Host "⏭️ Animations already present in globals.css" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# PART 3: Create SkeletonLoader Component
# ============================================================
Write-Host "📦 PART 3: Creating SkeletonLoader.tsx..." -ForegroundColor Cyan

$skeletonContent = @'
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
'@

$skeletonPath = "src\components\ui\SkeletonLoader.tsx"
Set-Content -Path $skeletonPath -Value $skeletonContent -NoNewline
Write-Host "✅ Created: SkeletonLoader.tsx" -ForegroundColor Green
Write-Host ""

# ============================================================
# PART 4: Create usePullToRefresh Hook
# ============================================================
Write-Host "📦 PART 4: Creating usePullToRefresh.ts..." -ForegroundColor Cyan

$pullContent = @'
'use client';

import { useState, useEffect, useRef } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80, maxPull = 120 }: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const distance = Math.min(diff * 0.6, maxPull);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      isPulling.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh, threshold, maxPull]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
}
'@

$pullPath = "src\hooks\usePullToRefresh.ts"
Set-Content -Path $pullPath -Value $pullContent -NoNewline
Write-Host "✅ Created: usePullToRefresh.ts" -ForegroundColor Green
Write-Host ""

# ============================================================
# PART 5: Create ThemeToggle Component
# ============================================================
Write-Host "📦 PART 5: Creating ThemeToggle.tsx..." -ForegroundColor Cyan

$themeContent = @'
'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn("relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 glass-card hover:glass-card-hover")}
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5">
        <Sun className={cn("absolute inset-0 h-5 w-5 transition-all duration-300", isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-gold")} />
        <Moon className={cn("absolute inset-0 h-5 w-5 transition-all duration-300", isDark ? "rotate-0 scale-100 opacity-100 text-gold" : "-rotate-90 scale-0 opacity-0")} />
      </div>
    </button>
  );
}
'@

$themePath = "src\components\ui\ThemeToggle.tsx"
Set-Content -Path $themePath -Value $themeContent -NoNewline
Write-Host "✅ Created: ThemeToggle.tsx" -ForegroundColor Green
Write-Host ""

# ============================================================
# PART 6: Create GoldBadge Component
# ============================================================
Write-Host "📦 PART 6: Creating GoldBadge.tsx..." -ForegroundColor Cyan

$badgeContent = @'
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
'@

$badgePath = "src\components\ui\GoldBadge.tsx"
Set-Content -Path $badgePath -Value $badgeContent -NoNewline
Write-Host "✅ Created: GoldBadge.tsx" -ForegroundColor Green
Write-Host ""

# ============================================================
# PART 7: Create AnimatedCounter Component
# ============================================================
Write-Host "📦 PART 7: Creating AnimatedCounter.tsx..." -ForegroundColor Cyan

$counterContent = @'
'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  labelClassName?: string;
}

export default function AnimatedCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
  labelClassName = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' },
          },
        }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          className="text-2xl font-black text-gold"
        >
          {prefix}
          {value}
          {suffix}
        </motion.span>
        {label && (
          <p className={cn('text-xs text-muted-foreground mt-1', labelClassName)}>
            {label}
          </p>
        )}
      </motion.div>
    </div>
  );
}
'@

$counterPath = "src\components\ui\AnimatedCounter.tsx"
Set-Content -Path $counterPath -Value $counterContent -NoNewline
Write-Host "✅ Created: AnimatedCounter.tsx" -ForegroundColor Green
Write-Host ""

# ============================================================
# PART 8: Update profileConfig.ts with gold gradients
# ============================================================
Write-Host "📦 PART 8: Updating profileConfig with gold gradients..." -ForegroundColor Cyan

$configPath = "src\components\profiles\profileConfig.ts"
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    
    $gradientReplacements = @(
        @{Pattern = "from-red-700 via-red-600 to-red-900"; Replacement = "from-gold via-orange-500 to-red-800"},
        @{Pattern = "from-purple-700 via-indigo-600 to-purple-900"; Replacement = "from-gold via-yellow-500 to-orange-600"},
        @{Pattern = "from-green-700 via-emerald-600 to-green-900"; Replacement = "from-gold via-yellow-500 to-emerald-700"},
        @{Pattern = "from-red-600 via-orange-500 to-red-800"; Replacement = "from-gold via-orange-500 to-red-800"},
        @{Pattern = "from-sky-600 via-cyan-500 to-blue-900"; Replacement = "from-gold via-cyan-400 to-blue-800"},
        @{Pattern = "from-amber-600 via-orange-500 to-red-800"; Replacement = "from-gold via-orange-500 to-red-800"},
        @{Pattern = "from-stone-500 via-stone-600 to-stone-800"; Replacement = "from-gold via-stone-500 to-stone-800"},
        @{Pattern = "from-blue-600 via-red-500 to-blue-900"; Replacement = "from-gold via-red-500 to-blue-800"},
        @{Pattern = "from-red-600 via-red-500 to-rose-800"; Replacement = "from-gold via-red-500 to-rose-800"},
        @{Pattern = "from-blue-700 via-indigo-500 to-blue-900"; Replacement = "from-gold via-indigo-500 to-blue-800"},
        @{Pattern = "from-gray-700 via-gray-600 to-black"; Replacement = "from-gold via-gray-600 to-black"},
        @{Pattern = "from-teal-600 via-cyan-500 to-teal-900"; Replacement = "from-gold via-cyan-400 to-teal-800"},
        @{Pattern = "from-emerald-600 via-green-500 to-emerald-900"; Replacement = "from-gold via-emerald-500 to-emerald-800"},
        @{Pattern = "from-pink-600 via-violet-500 to-purple-900"; Replacement = "from-gold via-violet-400 to-purple-800"},
        @{Pattern = "from-yellow-600 via-amber-500 to-orange-800"; Replacement = "from-gold via-amber-400 to-orange-800"},
        @{Pattern = "from-lime-600 via-green-500 to-emerald-800"; Replacement = "from-gold via-lime-400 to-emerald-800"},
        @{Pattern = "from-red-600 via-red-500 to-red-800"; Replacement = "from-gold via-red-500 to-red-800"}
    )
    
    foreach ($grad in $gradientReplacements) {
        $configContent = $configContent -replace $grad.Pattern, $grad.Replacement
    }
    
    Set-Content -Path $configPath -Value $configContent -NoNewline
    Write-Host "✅ Updated: profileConfig.ts with gold gradients" -ForegroundColor Green
} else {
    Write-Host "⚠️ profileConfig.ts not found" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# PART 9: Update ProfileExplorer.tsx
# ============================================================
Write-Host "📦 PART 9: Updating ProfileExplorer.tsx..." -ForegroundColor Cyan

$explorerPath = "src\components\profiles\ProfileExplorer.tsx"
if (Test-Path $explorerPath) {
    $explorerContent = Get-Content $explorerPath -Raw
    $explorerContent = $explorerContent -replace 'bg-sport-green', 'bg-gold'
    $explorerContent = $explorerContent -replace 'text-sport-green', 'text-gold'
    $explorerContent = $explorerContent -replace 'border-sport-green', 'border-gold'
    Set-Content -Path $explorerPath -Value $explorerContent -NoNewline
    Write-Host "✅ Updated: ProfileExplorer.tsx" -ForegroundColor Green
} else {
    Write-Host "⚠️ ProfileExplorer.tsx not found" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# PART 10: Add ThemeToggle to BottomNav
# ============================================================
Write-Host "📦 PART 10: Adding ThemeToggle to BottomNav..." -ForegroundColor Cyan

$bottomNavPath = "src\components\layout\BottomNav.tsx"
if (Test-Path $bottomNavPath) {
    $bottomNavContent = Get-Content $bottomNavPath -Raw
    
    if ($bottomNavContent -notmatch "ThemeToggle") {
        $bottomNavContent = $bottomNavContent -replace "import { cn } from '@/lib/utils';", "import { cn } from '@/lib/utils';`nimport ThemeToggle from '@/components/ui/ThemeToggle';"
        
        $bottomNavContent = $bottomNavContent -replace '(</nav>)', '      <div className="absolute right-4 top-1/2 -translate-y-1/2">`n        <ThemeToggle />`n      </div>`n    $1'
        
        Set-Content -Path $bottomNavPath -Value $bottomNavContent -NoNewline
        Write-Host "✅ Added ThemeToggle to BottomNav.tsx" -ForegroundColor Green
    } else {
        Write-Host "⏭️ ThemeToggle already in BottomNav.tsx" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ BottomNav.tsx not found" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# FINAL SUMMARY
# ============================================================
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "🏆 UI/UX UPGRADE COMPLETE!" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Files Updated:" -ForegroundColor Green
Write-Host "  • All sport-green → gold across entire project" -ForegroundColor Green
Write-Host "  • ProfileExplorer.tsx - Gold theme applied" -ForegroundColor Green
Write-Host "  • profileConfig.ts - Gold gradients" -ForegroundColor Green
Write-Host "  • globals.css - Gold animations added" -ForegroundColor Green
Write-Host "  • BottomNav.tsx - ThemeToggle added" -ForegroundColor Green
Write-Host ""
Write-Host "✅ New Files Created:" -ForegroundColor Green
Write-Host "  • src/components/ui/SkeletonLoader.tsx" -ForegroundColor Green
Write-Host "  • src/hooks/usePullToRefresh.ts" -ForegroundColor Green
Write-Host "  • src/components/ui/ThemeToggle.tsx" -ForegroundColor Green
Write-Host "  • src/components/ui/GoldBadge.tsx" -ForegroundColor Green
Write-Host "  • src/components/ui/AnimatedCounter.tsx" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Animations Added:" -ForegroundColor Green
Write-Host "  • animate-shimmer - Loading shimmer effect" -ForegroundColor Green
Write-Host "  • animate-gold-pulse - Pulsing gold indicator" -ForegroundColor Green
Write-Host "  • animate-gold-glow - Glowing gold shadow" -ForegroundColor Green
Write-Host "  • animate-slide-up - Slide up animation" -ForegroundColor Green
Write-Host "  • animate-scale-in - Scale in animation" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm install (if needed)" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host "  3. Test your app!" -ForegroundColor White
Write-Host ""
Write-Host "🏆 Your SportSphere app now has a premium gold theme!" -ForegroundColor Yellow