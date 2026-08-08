'use client';

// ─── Scout Board Tab (signature feature) ──────────────────────
//
// Kanban-style scouting board with 4 columns:
//
//   Watching → Shortlisted → Recommended → Signed
//
// Players are entered in the edit form as a textarea, one per line:
//   Name | Position | Club | Rating 0-100 | Status | Note
//
// Status is case-insensitive; missing/invalid status defaults to "Watching".
// Cards are sorted within each column by rating (highest first).

import { Eye, Star, CheckCircle2, Trophy, ClipboardList, Search } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, ProgressBar, rpString } from '../../shared/ui';

export interface ScoutPlayer {
  name: string;
  position: string;
  club: string;
  rating: number;   // 0-100
  status: 'Watching' | 'Shortlisted' | 'Recommended' | 'Signed';
  note: string;
}

export const STATUS_META: Record<
  ScoutPlayer['status'],
  { label: string; short: string; icon: typeof Eye; color: string; dotColor: string; barColor: 'gold' | 'green' | 'red' | 'blue'; badgeColor: 'gold' | 'green' | 'red' | 'blue' | 'muted' }
> = {
  Watching:     { label: 'Watching',     short: 'Watch',   icon: Eye,           color: '#3B82F6', dotColor: '#3B82F6', barColor: 'blue',  badgeColor: 'blue'  },
  Shortlisted:  { label: 'Shortlisted',  short: 'Short',   icon: Star,          color: '#F5C518', dotColor: '#F5C518', barColor: 'gold',  badgeColor: 'gold'  },
  Recommended:  { label: 'Recommended',  short: 'Recom',   icon: CheckCircle2,  color: '#34D399', dotColor: '#34D399', barColor: 'green', badgeColor: 'green' },
  Signed:       { label: 'Signed',       short: 'Signed',  icon: Trophy,        color: '#A855F7', dotColor: '#A855F7', barColor: 'gold',  badgeColor: 'gold'  },
};

const VALID_STATUSES = ['Watching', 'Shortlisted', 'Recommended', 'Signed'] as const;

export function parseScoutingBoard(raw: string): ScoutPlayer[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      const rawStatus = (parts[4] || 'Watching').toLowerCase();
      const status = VALID_STATUSES.find(s => s.toLowerCase() === rawStatus) || 'Watching';
      const rating = Math.max(0, Math.min(100, parseInt(parts[3] || '0', 10) || 0));
      return {
        name: parts[0] || 'Unknown',
        position: parts[1] || '',
        club: parts[2] || '',
        rating,
        status,
        note: parts[5] || '',
      };
    })
    .filter(p => p.name !== 'Unknown' || p.position || p.club);
}

function PlayerCard({ player }: { player: ScoutPlayer }) {
  const meta = STATUS_META[player.status];
  const Icon = meta.icon;
  return (
    <div className="rounded-lg bg-surface border border-surface-border/60 p-2.5 mb-2 hover:border-gold/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-bold text-white leading-tight flex-1 min-w-0 break-words">{player.name}</p>
        <span className="text-[10px] font-bold text-gold flex-shrink-0">{player.rating}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {player.position && <Badge color="muted">{player.position}</Badge>}
        {player.club && <span className="text-[10px] text-muted-foreground truncate">{player.club}</span>}
      </div>
      <ProgressBar value={player.rating} max={100} color={meta.barColor} />
      {player.note && <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-tight">{player.note}</p>}
    </div>
  );
}

function Column({ status, players }: { status: ScoutPlayer['status']; players: ScoutPlayer[] }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col rounded-xl bg-surface/40 border border-surface-border/40 p-2 min-h-[120px]">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: meta.dotColor }} />
          <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: meta.dotColor }}>
            {meta.label}
          </span>
        </div>
        <span className="text-[10px] font-bold text-white bg-surface px-1.5 rounded-full flex-shrink-0">{players.length}</span>
      </div>
      <div className="flex flex-col gap-1">
        {players.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/40 text-center py-4">No players</p>
        ) : (
          players.map((p, i) => <PlayerCard key={i} player={p} />)
        )}
      </div>
    </div>
  );
}

export function ScoutBoardTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const players = parseScoutingBoard(rpString(rp, 'scoutingBoard'));

  if (players.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Your scouting board is empty"
        message="Add players from Edit Profile → Scouting Board. Format: Name | Position | Club | Rating 0-100 | Status | Note"
      />
    );
  }

  // Sort each column by rating descending
  const byStatus = (status: ScoutPlayer['status']) =>
    players.filter(p => p.status === status).sort((a, b) => b.rating - a.rating);

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <SectionTitle icon={Search} action={<Badge color="muted">{players.length} total</Badge>}>
          Scouting Board
        </SectionTitle>
        <p className="text-[11px] text-muted-foreground">
          Players you are actively tracking. Drag-and-drop coming soon — for now, edit the Status column in your profile.
        </p>
      </Card>

      {/* Kanban: 1-col on mobile, 2-col on small, 4-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <Column status="Watching"    players={byStatus('Watching')} />
        <Column status="Shortlisted" players={byStatus('Shortlisted')} />
        <Column status="Recommended" players={byStatus('Recommended')} />
        <Column status="Signed"      players={byStatus('Signed')} />
      </div>
    </div>
  );
}
