'use client';

// ─── Coach Tactical Identity Tab ───────────────────────────────
//
// Shows the coach's preferred formation, alternate formations,
// philosophy, and pressing/possession/defensive/build-up styles.
// The formation is rendered as a visual pitch diagram.

import { Layout, Target, Shield, Zap, Layers, BookOpen, Swords, RefreshCw, Users } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, KeyValueRow, rpString, rpArray } from '../../shared/ui';

// Render a simple formation pitch (4-3-3 etc.) using CSS.
// The formation string like "4-3-3" maps to rows of player dots.
function FormationPitch({ formation }: { formation: string }) {
  const rows = formation.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
  if (rows.length === 0) return null;

  return (
    <div className="relative w-full rounded-xl bg-gradient-to-b from-emerald-900/40 to-emerald-950/60 border border-emerald-700/30 p-3 overflow-hidden">
      {/* Center line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-400/30" />
      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-emerald-400/30" />

      {/* Rows of players — GK at bottom, attack at top */}
      <div className="relative flex flex-col-reverse gap-3 py-2">
        {rows.map((count, idx) => (
          <div key={idx} className="flex justify-around">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/80 border-2 border-gold shadow-[0_0_8px_rgba(245,197,24,0.4)]">
                <span className="text-[10px] font-bold text-black">{rows.length - idx}</span>
              </div>
            ))}
          </div>
        ))}
        {/* GK */}
        <div className="flex justify-around">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/80 border-2 border-emerald-400">
            <span className="text-[10px] font-bold text-black">GK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoachTacticalTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'coach');
  const formation = rpString(rp, 'preferredFormation');
  const alternates = rpArray(rp, 'alternateFormations').map(String);
  const philosophy = rpString(rp, 'playingPhilosophy');
  const pressing = rpString(rp, 'pressingStyle');
  const possession = rpString(rp, 'possessionStyle');
  const defensive = rpString(rp, 'defensiveApproach');
  const buildUp = rpString(rp, 'buildUpStyle');

  // New fields
  const attackingPrinciples = rpString(rp, 'attackingPrinciples');
  const defensivePrinciples = rpString(rp, 'defensivePrinciples');
  const inGameManagement = rpString(rp, 'inGameManagement');
  const manManagementStyle = rpString(rp, 'manManagementStyle');

  const hasAny = formation || philosophy || pressing || possession || defensive || buildUp || alternates.length
    || attackingPrinciples || defensivePrinciples || inGameManagement || manManagementStyle;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Layout}
        title="No tactical identity yet"
        message="Add your preferred formation, philosophy, and pressing style to show your tactical identity."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Preferred formation pitch */}
      {formation && (
        <Card hover>
          <SectionTitle icon={Layout}>Preferred Formation</SectionTitle>
          <FormationPitch formation={formation} />
          <p className="text-center text-base font-black text-gold mt-2">{formation}</p>
          {alternates.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {alternates.map((f, i) => <Badge key={i} color="muted">{f}</Badge>)}
            </div>
          )}
        </Card>
      )}

      {/* Philosophy */}
      {philosophy && (
        <Card hover>
          <SectionTitle icon={BookOpen}>Playing Philosophy</SectionTitle>
          <p className="text-sm text-white leading-relaxed">{philosophy}</p>
        </Card>
      )}

      {/* Style attributes */}
      {(pressing || possession || defensive || buildUp) && (
        <Card hover>
          <SectionTitle icon={Layers}>Style Profile</SectionTitle>
          {pressing &&   <KeyValueRow label="Pressing Style"    value={<Badge color={pressing === 'High Press' ? 'red' : 'muted'}>{pressing}</Badge>} />}
          {possession && <KeyValueRow label="Possession Style"  value={<Badge color={possession === 'Dominant' ? 'gold' : 'muted'}>{possession}</Badge>} />}
          {defensive &&  <KeyValueRow label="Defensive Approach" value={<Badge color="muted">{defensive}</Badge>} />}
          {buildUp &&    <KeyValueRow label="Build-up Style"     value={<Badge color="muted">{buildUp}</Badge>} />}
        </Card>
      )}

      {/* ── Attacking Principles ── */}
      {attackingPrinciples && (
        <Card hover>
          <SectionTitle icon={Swords}>Attacking Principles</SectionTitle>
          <p className="text-sm text-white leading-relaxed">{attackingPrinciples}</p>
        </Card>
      )}

      {/* ── Defensive Principles ── */}
      {defensivePrinciples && (
        <Card hover>
          <SectionTitle icon={Shield}>Defensive Principles</SectionTitle>
          <p className="text-sm text-white leading-relaxed">{defensivePrinciples}</p>
        </Card>
      )}

      {/* ── In-Game Management ── */}
      {inGameManagement && (
        <Card hover>
          <SectionTitle icon={RefreshCw}>In-Game Management</SectionTitle>
          <Badge color="gold">{inGameManagement}</Badge>
        </Card>
      )}

      {/* ── Man-Management Style ── */}
      {manManagementStyle && (
        <Card hover>
          <SectionTitle icon={Users}>Man-Management Style</SectionTitle>
          <Badge color="blue">{manManagementStyle}</Badge>
        </Card>
      )}
    </div>
  );
}
