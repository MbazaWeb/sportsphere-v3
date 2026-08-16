'use client';

// ─── Academy Development Pipeline Tab (signature feature) ─────
//
// Shows the development pipeline visualizing graduate outcomes:
//   Youth → Development → First Team → Pro
//
// Graduates are entered as a textarea, one per line:
//   Name | Year | Position | Current Club | Status
//
// Status buckets each graduate into a pipeline stage:
//   Pro         → Pro
//   First Team  → First Team
//   Development → Development
//   Loaned      → Development (currently on loan)
//   Released    → (shown separately, didn't make it)
//
// The pipeline renders as a horizontal funnel showing counts at
// each stage, plus a list of graduates grouped by stage.

import { GraduationCap, Trophy, Users, ArrowRight, XCircle } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';

interface Graduate {
  name: string;
  year: string;
  position: string;
  club: string;
  status: 'Pro' | 'First Team' | 'Development' | 'Loaned' | 'Released' | string;
}

const STAGES: Array<{ key: string; label: string; short: string; icon: typeof Trophy; color: string }> = [
  { key: 'pro',         label: 'Professional', short: 'Pro',          icon: Trophy,        color: '#F5C518' },
  { key: 'first team',  label: 'First Team',   short: '1st Team',     icon: Users,         color: '#34D399' },
  { key: 'development', label: 'Development',  short: 'Dev',          icon: GraduationCap, color: '#3B82F6' },
];

function parseGraduates(raw: string): Graduate[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      const rawStatus = (p[4] || 'Development').toLowerCase();
      const status =
        rawStatus.includes('pro') ? 'Pro' :
        rawStatus.includes('first') ? 'First Team' :
        rawStatus.includes('loan') ? 'Loaned' :
        rawStatus.includes('releas') || rawStatus.includes('cut') ? 'Released' :
        'Development';
      return {
        name: p[0] || 'Unknown',
        year: p[1] || '',
        position: p[2] || '',
        club: p[3] || '',
        status,
      };
    })
    .filter(g => g.name !== 'Unknown' || g.club);
}

function StageCard({ graduate }: { graduate: Graduate }) {
  const isLoaned = graduate.status === 'Loaned';
  const isReleased = graduate.status === 'Released';
  return (
    <div className={`rounded-lg bg-surface border border-surface-border/60 p-2.5 hover:border-gold/40 transition-colors ${isReleased ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-bold text-white truncate">{graduate.name}</p>
        {graduate.year && <span className="text-[10px] text-muted-foreground flex-shrink-0">{graduate.year}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {graduate.position && <Badge color="muted">{graduate.position}</Badge>}
        {graduate.club && <span className="text-[10px] text-gold truncate">{graduate.club}</span>}
      </div>
      {isLoaned && <p className="text-[10px] text-blue-400 mt-1">On loan</p>}
      {isReleased && <p className="text-[10px] text-red-400 mt-1">Released</p>}
    </div>
  );
}

export function AcademyPipelineTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'academy');
  const graduates = parseGraduates(rpString(rp, 'graduates'));
  const proGraduates = rpNumber(rp, 'proGraduates');
  const playersPromoted = rpNumber(rp, 'playersPromoted');
  const playersDeveloped = rpNumber(rp, 'playersDeveloped');

  // Use declared counts if graduate list is empty
  const proCount = graduates.length > 0
    ? graduates.filter(g => g.status === 'Pro').length
    : proGraduates;
  const firstTeamCount = graduates.length > 0
    ? graduates.filter(g => g.status === 'First Team').length
    : playersPromoted;
  const devCount = graduates.length > 0
    ? graduates.filter(g => g.status === 'Development' || g.status === 'Loaned').length
    : 0;
  const releasedCount = graduates.length > 0
    ? graduates.filter(g => g.status === 'Released').length
    : 0;

  const totalGraduates = graduates.length || playersDeveloped;

  if (graduates.length === 0 && !totalGraduates) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No graduates recorded yet"
        message="Add your academy graduates from Edit Profile → Academy Graduates. Format: Name | Year | Position | Current Club | Status"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Pipeline funnel */}
      <Card hover>
        <SectionTitle icon={GraduationCap}>Development Pipeline</SectionTitle>
        <div className="flex items-center gap-1 mb-3 overflow-x-auto">
          {STAGES.map((stage, i) => {
            const count = stage.key === 'pro' ? proCount : stage.key === 'first team' ? firstTeamCount : devCount;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-[80px]">
                <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: `${stage.color}15`, border: `1px solid ${stage.color}30` }}>
                  <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: stage.color }} />
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: stage.color }}>{stage.short}</p>
                  <p className="text-lg font-black text-white">{count}</p>
                </div>
                {i < STAGES.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>
        {releasedCount > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <XCircle className="h-3 w-3 text-red-400" />
            <span>{releasedCount} released</span>
          </div>
        )}
      </Card>

      {/* Graduates grouped by stage */}
      {graduates.length > 0 && (
        <>
          {STAGES.map(stage => {
            const list = graduates.filter(g =>
              stage.key === 'pro' ? g.status === 'Pro' :
              stage.key === 'first team' ? g.status === 'First Team' :
              g.status === 'Development' || g.status === 'Loaned'
            );
            if (list.length === 0) return null;
            const Icon = stage.icon;
            return (
              <Card key={stage.key} hover>
                <SectionTitle icon={Icon} action={<Badge color="muted">{list.length}</Badge>}>
                  {stage.label}
                </SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {list.map((g, i) => <StageCard key={i} graduate={g} />)}
                </div>
              </Card>
            );
          })}

          {/* Released (separate) */}
          {releasedCount > 0 && (
            <Card hover>
              <SectionTitle icon={XCircle} action={<Badge color="red">{releasedCount}</Badge>}>
                Released
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {graduates.filter(g => g.status === 'Released').map((g, i) => <StageCard key={i} graduate={g} />)}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
