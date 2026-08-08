'use client';

// ─── Generic tab renderer ──────────────────────────────────────
//
// Used by the 19 roles that don't have custom renderers yet.
// Renders roleProfile fields as a typed grid using the role's
// FieldDef schema. Fields are grouped by their `group` property
// (e.g., "Identity", "Performance", "Career") and rendered as
// labeled cards — NOT the old regex-matched RoleContentTab grid.
//
// This is what each "per-role" tab will look like until that role
// gets a custom renderer. It's still much richer than the old code
// because:
//   - Field labels come from the role's schema, not from key names
//   - Field grouping is explicit, not regex-derivated
//   - Empty state shows the role's tagline

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { ApiUserLike, RoleConfig, FieldDef } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, EmptyState, Badge, rpString, rpArray } from '../../shared/ui';

function fieldIcon(field: FieldDef): typeof Search {
  // Pick icon by field type / key heuristics
  const k = field.key.toLowerCase();
  const t = field.type;
  if (t === 'url' || k.includes('website') || k.includes('link')) return Search;
  if (k.includes('year') || k.includes('date') || k.includes('since') || k.includes('founded')) return Search;
  if (k.includes('count') || k.includes('number') || t === 'number') return Search;
  if (t === 'chips' || t === 'multiselect') return Search;
  return Search;
}

// Pick a sensible accent for a field based on its key
function fieldAccent(field: FieldDef): 'gold' | 'green' | 'red' | 'blue' | 'muted' {
  const k = field.key.toLowerCase();
  if (k.includes('win') || k.includes('success') || k.includes('promot')) return 'green';
  if (k.includes('loss') || k.includes('red') || k.includes('against') || k.includes('conceded')) return 'red';
  if (k.includes('rating') || k.includes('rank') || k.includes('trophy') || k.includes('title') || k.includes('champion')) return 'gold';
  if (k.includes('count') || k.includes('total')) return 'blue';
  return 'muted';
}

function renderFieldValue(field: FieldDef, rp: Record<string, unknown>): string {
  if (field.type === 'chips' || field.type === 'multiselect') {
    const arr = rpArray(rp, field.key).map(String);
    return arr.length > 0 ? arr.join(', ') : '';
  }
  return rpString(rp, field.key);
}

interface GenericTabProps {
  apiUser: ApiUserLike | null;
  roleConfig: RoleConfig;
  /** Filter to fields matching this group, or all if omitted. */
  groupFilter?: string;
  /** Tab title override. */
  title?: string;
}

export function GenericRoleTab({ apiUser, roleConfig, groupFilter, title }: GenericTabProps) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const [query, setQuery] = useState('');

  // Get fields, optionally filtered by group
  const fields = useMemo(() => {
    let f = roleConfig.fields;
    if (groupFilter) f = f.filter(field => (field.group || '').toLowerCase() === groupFilter.toLowerCase());
    if (query.trim()) {
      const q = query.toLowerCase();
      f = f.filter(field =>
        field.label.toLowerCase().includes(q) ||
        field.key.toLowerCase().includes(q) ||
        renderFieldValue(field, rp).toLowerCase().includes(q)
      );
    }
    return f;
  }, [roleConfig.fields, groupFilter, query, rp]);

  // Group fields by their `group` property
  const grouped = useMemo(() => {
    const groups = new Map<string, FieldDef[]>();
    for (const f of fields) {
      const g = f.group || 'Info';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(f);
    }
    return Array.from(groups.entries());
  }, [fields]);

  // Determine which fields have values
  const filledCount = fields.filter(f => renderFieldValue(f, rp)).length;
  const hasAnyValue = filledCount > 0;

  if (!hasAnyValue && !query) {
    return (
      <EmptyState
        icon={roleConfig.icon as React.ElementType}
        title={`No ${roleConfig.label.toLowerCase()} info yet`}
        message={roleConfig.tagline + ' Add your details from Edit Profile.'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search (only if many fields) */}
      {roleConfig.fields.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${roleConfig.label.toLowerCase()} fields…`}
            className="w-full rounded-xl bg-surface border border-surface-border py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/30 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Grouped field cards */}
      {grouped.map(([groupName, groupFields]) => {
        const filledInGroup = groupFields.filter(f => renderFieldValue(f, rp));
        if (filledInGroup.length === 0) return null;
        return (
          <Card key={groupName} hover>
            <SectionTitle>{groupName}</SectionTitle>
            <StatGrid cols={3}>
              {filledInGroup.map(field => {
                const value = renderFieldValue(field, rp);
                const Icon = fieldIcon(field);
                const accent = fieldAccent(field);
                // For chips/multiselect, render as wrapped badges instead of a single string
                if (field.type === 'chips' || field.type === 'multiselect') {
                  const arr = rpArray(rp, field.key).map(String);
                  return (
                    <div key={field.key} className="rounded-xl bg-surface p-3 border border-surface-border/50 sm:col-span-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3 w-3 text-gold/70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {arr.map((v, i) => <Badge key={i} color={accent}>{v}</Badge>)}
                      </div>
                    </div>
                  );
                }
                return (
                  <StatTile
                    key={field.key}
                    icon={Icon}
                    label={field.label}
                    value={value}
                    accent={accent}
                  />
                );
              })}
            </StatGrid>
          </Card>
        );
      })}

      {fields.length === 0 && query && (
        <EmptyState
          icon={Search}
          title="No matching fields"
          message={`No fields match "${query}". Try a different search.`}
        />
      )}
    </div>
  );
}
