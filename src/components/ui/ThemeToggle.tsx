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