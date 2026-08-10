'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

export interface LocationResult {
  id: string;
  name: string;
  type: 'country' | 'region' | 'city';
  displayLabel: string;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  population?: number | null;
}

interface LocationPickerProps {
  value?: string;           // display label of selected location
  onSelect: (location: LocationResult) => void;
  onClear?: () => void;
  placeholder?: string;
  countryCode?: string;    // filter to a specific country (e.g. "TZ")
  className?: string;
  inputClassName?: string;
  types?: ('country' | 'region' | 'city')[];  // filter by types
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────

export function LocationPicker({
  value,
  onSelect,
  onClear,
  placeholder = 'Search location...',
  countryCode,
  className,
  inputClassName,
  types,
  disabled = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LocationResult | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Update selected when value prop changes
  useEffect(() => {
    if (value && !selected) {
      setSelected({ id: '', name: value, type: 'city', displayLabel: value });
    }
  }, [value]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      // Show popular locations
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: '8' });
        if (countryCode) params.set('country', countryCode);
        if (types && types.length === 1) params.set('type', types[0]);
        const res = await fetch(`/sportsphere/api/locations/search?${params}`);
        if (res.ok) setResults(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ q: q, limit: '10' });
      if (countryCode) params.set('country', countryCode);
      if (types && types.length === 1) params.set('type', types[0]);
      const res = await fetch(`/sportsphere/api/locations/search?${params}`);
      if (res.ok) setResults(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [countryCode, types]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSelected(null);
    if (onClear) onClear();

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 200);
    setIsOpen(true);
  };

  const handleSelect = (loc: LocationResult) => {
    setSelected(loc);
    setQuery(loc.displayLabel);
    setIsOpen(false);
    onSelect(loc);
  };

  const handleClear = () => {
    setQuery('');
    setSelected(null);
    setResults([]);
    if (onClear) onClear();
  };

  const handleFocus = () => {
    if (!isOpen) {
      if (results.length === 0) search(query);
      setIsOpen(true);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'country': return '🌍';
      case 'region': return '📍';
      default: return '🏢';
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'country': return 'Country';
      case 'region': return 'Region';
      default: return 'City';
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {/* Input */
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'placeholder:text-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            inputClassName
          )}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-72 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="px-4 py-3 text-sm text-muted-foreground">No locations found for &quot;{query}&quot;</div>
          )}

          {!loading && results.length > 0 && (
            <ul role="listbox" className="py-1">
              {results.map((loc) => (
                <li
                  key={loc.id || loc.displayLabel}
                  role="option"
                  aria-selected={selected?.id === loc.id}
                  onClick={() => handleSelect(loc)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    'hover:bg-accent',
                    selected?.id === loc.id && 'bg-accent'
                  )}
                >
                  <span className="text-lg flex-shrink-0">{typeIcon(loc.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{loc.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{loc.displayLabel}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                    {typeLabel(loc.type)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Compact inline variant (for forms) ──────────────────────────────────

interface LocationInlineProps {
  value?: string;
  onSelect: (location: LocationResult) => void;
  onClear?: () => void;
  countryCode?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function LocationInline({
  value,
  onSelect,
  onClear,
  countryCode,
  className,
  placeholder = 'Enter location...',
  disabled = false,
}: LocationInlineProps) {
  return (
    <LocationPicker
      value={value}
      onSelect={onSelect}
      onClear={onClear}
      countryCode={countryCode}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName="h-9 text-sm"
    />
  );
}

// ─── Display-only badge (shows selected location) ────────────────────────

interface LocationBadgeProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export function LocationBadge({ label, onRemove, className }: LocationBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'bg-primary/10 text-primary text-xs font-medium',
        className
      )}
    >
      <MapPin className="h-3 w-3" />
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:text-destructive transition-colors">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}