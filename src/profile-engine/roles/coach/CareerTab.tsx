'use client';

// ─── Coach Career Tab ──────────────────────────────────────────
//
// Previous clubs (parsed from textarea), national team roles,
// academy experience, own playing career.

import { Trophy, Building2, Flag, GraduationCap, Footprints } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, KeyValueRow, Badge, TimelineItem, rpString } from '../../shared/ui';

interface ClubStint {
  years: string;
  club: string;
  role: string;
}

function parseStints(raw: string, defaultRole = 'Coach'): ClubStint[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        years: parts[0] || '',
        club: parts[1] || line,
        role: parts[2] || defaultRole,
      };
    })
    .filter(s => s.years || s.club);
}

export function CoachCareerTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const currentTeam = rpString(rp, 'currentTeam');
  const coachingRole = rpString(rp, 'coachingRole');
  const previousClubs = parseStints(rpString(rp, 'previousClubs'));
  const nationalTeams = parseStints(rpString(rp, 'nationalTeams'), 'National Team Coach');
  const academyExperience = rpString(rp, 'academyExperience');
  const playingCareer = rpString(rp, 'playingCareer');

  const hasAny = currentTeam || previousClubs.length || nationalTeams.length || academyExperience || playingCareer;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Trophy}
        title="No career history yet"
        message="Add your current team, previous clubs, and national team roles from Edit Profile."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current role */}
      {currentTeam && (
        <Card hover>
          <SectionTitle icon={Building2}>Current Role</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">{currentTeam}</p>
              {coachingRole && <Badge color="gold">{coachingRole}</Badge>}
            </div>
          </div>
        </Card>
      )}

      {/* Previous clubs timeline */}
      {previousClubs.length > 0 && (
        <Card hover>
          <SectionTitle icon={Trophy}>Previous Clubs</SectionTitle>
          <div className="flex flex-col">
            {previousClubs.map((s, i) => (
              <TimelineItem key={i} year={s.years} title={s.club} subtitle={s.role} icon={Building2} />
            ))}
          </div>
        </Card>
      )}

      {/* National teams */}
      {nationalTeams.length > 0 && (
        <Card hover>
          <SectionTitle icon={Flag}>National Team Roles</SectionTitle>
          <div className="flex flex-col">
            {nationalTeams.map((s, i) => (
              <TimelineItem key={i} year={s.years} title={s.club} subtitle={s.role} icon={Flag} />
            ))}
          </div>
        </Card>
      )}

      {/* Academy experience */}
      {academyExperience && (
        <Card hover>
          <SectionTitle icon={GraduationCap}>Academy Experience</SectionTitle>
          <p className="text-sm text-white whitespace-pre-line">{academyExperience}</p>
        </Card>
      )}

      {/* Playing career */}
      {playingCareer && (
        <Card hover>
          <SectionTitle icon={Footprints}>Playing Career</SectionTitle>
          <p className="text-sm text-white whitespace-pre-line">{playingCareer}</p>
        </Card>
      )}
    </div>
  );
}
