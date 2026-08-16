'use client';

// ─── Player Scouting Tab ───────────────────────────────────────
//
// Visible to scouts, recruiters, agents. Shows:
//   - Market value (with a "verified by" badge when provenance exists)
//   - Playing style
//   - Strengths / Weaknesses chips
//   - Form + ranking
//   - Injury history (privacy-gated — only shown if user opted in)
//
// In a future iteration this tab will also show:
//   - Scout reports (multiple, with author attribution)
//   - Comparison vs other players
//   - Transfer interest (clubs watching)

import { TrendingUp, Target, Zap, AlertCircle, Heart, Activity, DollarSign, ShieldAlert, Brain } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, StatTile, StatGrid, ProgressBar, rpString, rpNumber, rpArray } from '../../shared/ui';

export function PlayerScoutingTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'player');
  const marketValue = rpString(rp, 'marketValue');
  const playingStyle = rpString(rp, 'playingStyle');
  const strengths = rpArray(rp, 'strengths').map(String);
  const weaknesses = rpArray(rp, 'weaknesses').map(String);
  const form = rpString(rp, 'form');
  const ranking = rpString(rp, 'ranking');
  const injuryHistory = rpString(rp, 'injuryHistory');

  // Privacy: injury history only shows if the user explicitly opted in
  // by writing to the field. Empty = hidden.
  const showInjury = injuryHistory.length > 0;

  const hasAny = marketValue || playingStyle || strengths.length || weaknesses.length || form || ranking;

  if (!hasAny && !showInjury) {
    return (
      <EmptyState
        icon={Target}
        title="No scouting info yet"
        message="Add your market value, playing style, strengths, and weaknesses to be discoverable by scouts."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Market value + form hero */}
      {(marketValue || form || ranking) && (
        <Card hover>
          <SectionTitle icon={DollarSign}>Market Intelligence</SectionTitle>
          <StatGrid cols={3}>
            {marketValue && <StatTile icon={DollarSign} label="Market Value" value={marketValue} accent="gold" />}
            {form && <StatTile icon={Activity} label="Form" value={form} accent={form === 'Excellent' ? 'green' : form === 'Injured' || form === 'Poor' ? 'red' : 'gold'} />}
            {ranking && <StatTile icon={TrendingUp} label="Ranking" value={ranking} />}
          </StatGrid>
        </Card>
      )}

      {/* Playing style */}
      {playingStyle && (
        <Card hover>
          <SectionTitle icon={Target}>Playing Style</SectionTitle>
          <p className="text-sm text-white leading-relaxed">{playingStyle}</p>
        </Card>
      )}

      {/* Strengths / Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <Card hover>
              <SectionTitle icon={Zap}>Strengths</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((s, i) => <Badge key={i} color="green">{s}</Badge>)}
              </div>
            </Card>
          )}
          {weaknesses.length > 0 && (
            <Card hover>
              <SectionTitle icon={AlertCircle}>Areas to Improve</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {weaknesses.map((w, i) => <Badge key={i} color="red">{w}</Badge>)}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Injury history (privacy-gated) */}
      {showInjury && (
        <Card>
          <SectionTitle icon={ShieldAlert}>Injury History</SectionTitle>
          <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-2.5 mb-2">
            <p className="text-[10px] text-yellow-400/80">
              Visible only because you opted in. Toggle off in Privacy settings to hide from public view.
            </p>
          </div>
          <p className="text-sm text-white whitespace-pre-line">{injuryHistory}</p>
        </Card>
      )}

      {/* ── Mental Attributes Summary (for scouts) ── */}
      {(() => {
        const mental = [
          { key: 'vision', label: 'Vision / Awareness' },
          { key: 'decisionMaking', label: 'Decision Making' },
          { key: 'leadership', label: 'Leadership' },
          { key: 'workRate', label: 'Work Rate' },
          { key: 'composure', label: 'Composure' },
        ].filter(m => rpNumber(rp, m.key) > 0);
        if (mental.length === 0) return null;
        return (
          <Card hover>
            <SectionTitle icon={Brain}>Mental Profile</SectionTitle>
            <div className="flex flex-col gap-2">
              {mental.map(m => {
                const val = Math.min(10, Math.max(0, rpNumber(rp, m.key)));
                return (
                  <div key={m.key}>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      <span>{m.label}</span>
                      <span className="text-white font-bold">{val}/10</span>
                    </div>
                    <ProgressBar value={val} max={10} color={val >= 8 ? 'green' : val >= 6 ? 'gold' : 'red'} />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
