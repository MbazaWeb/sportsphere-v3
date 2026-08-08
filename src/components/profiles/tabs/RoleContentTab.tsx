'use client';

import {
  Trophy, Users, BarChart3, Briefcase, Building, MapPin, Calendar,
  Award, Star, Flag, Crown, ShieldCheck, Handshake, GraduationCap,
  Megaphone, Newspaper, Target, TrendingUp, Link as LinkIcon,
  Tv, Radio, Camera, Mic, Search, Heart, Sparkles,
} from 'lucide-react';
import type { ApiUser } from '../types';

// ─── Helpers ──────────────────────────────────────────────────
function safeStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function fmtLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

// Pick icon by key heuristics
function pickIcon(key: string): React.ElementType {
  const k = key.toLowerCase();
  if (k.includes('trophy') || k.includes('honour') || k.includes('honor')) return Trophy;
  if (k.includes('squad') || k.includes('member') || k.includes('team') || k.includes('player')) return Users;
  if (k.includes('stat') || k.includes('goal') || k.includes('appearances') || k.includes('win')) return BarChart3;
  if (k.includes('business') || k.includes('industry') || k.includes('product')) return Briefcase;
  if (k.includes('stadium') || k.includes('venue') || k.includes('address') || k.includes('capacity')) return Building;
  if (k.includes('location') || k.includes('country') || k.includes('city')) return MapPin;
  if (k.includes('date') || k.includes('year') || k.includes('since') || k.includes('founded')) return Calendar;
  if (k.includes('license') || k.includes('level') || k.includes('rank')) return Award;
  if (k.includes('website') || k.includes('url') || k.includes('link') || k.includes('social')) return LinkIcon;
  if (k.includes('agent') || k.includes('client')) return Handshake;
  if (k.includes('program') || k.includes('academy') || k.includes('school')) return GraduationCap;
  if (k.includes('article') || k.includes('report') || k.includes('publication')) return Newspaper;
  if (k.includes('broadcast') || k.includes('tv') || k.includes('stream')) return Tv;
  if (k.includes('radio') || k.includes('podcast')) return Radio;
  if (k.includes('camera') || k.includes('video') || k.includes('content')) return Camera;
  if (k.includes('mic') || k.includes('comment')) return Mic;
  if (k.includes('scout') || k.includes('search')) return Search;
  if (k.includes('sponsor') || k.includes('partner')) return Handshake;
  if (k.includes('mission') || k.includes('vision')) return Target;
  if (k.includes('follower') || k.includes('audience')) return TrendingUp;
  if (k.includes('heart') || k.includes('fan')) return Heart;
  return Star;
}

// ─── RoleContentTab ─────────────────────────────────────────────
// A single reusable component that renders the contents of
// `apiUser.roleProfile` (a JSON object the user fills in via
// EditProfileModal → Role Profile section) as a LinkedIn-style
// "Experience / Info" card. Each role gets the same shape, but the
// fields shown are role-specific (Player: position, goals, club…;
// Team: foundedYear, president, stadium, trophies…; etc.).
//
// This replaces the previous "X data unavailable" stubs.
interface RoleContentTabProps {
  apiUser: ApiUser | null;
  role: string;
  /** Optional title override. Defaults to `${role} Info`. */
  title?: string;
  /** Optional icon override. Defaults to Award. */
  icon?: React.ElementType;
  /** Optional keys to render (in this order). If omitted, all keys render. */
  keys?: string[];
}

export function RoleContentTab({ apiUser, role, title, icon, keys }: RoleContentTabProps) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const allKeys = Object.keys(rp);
  const renderKeys = keys && keys.length > 0 ? keys.filter(k => allKeys.includes(k)) : allKeys;

  const TitleIcon = icon || Award;
  const titleText = title || `${role.charAt(0).toUpperCase() + role.slice(1)} Info`;

  if (renderKeys.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <TitleIcon className="h-4 w-4" /> {titleText}
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <TitleIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No {role} info shared yet.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            This user hasn&apos;t filled in their role profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
        <TitleIcon className="h-4 w-4" /> {titleText}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {renderKeys.map(k => {
          const v = safeStr(rp[k]);
          if (!v) return null;
          const Icon = pickIcon(k);
          return (
            <div key={k} className="rounded-xl bg-surface p-3 border border-surface-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-gold/70" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{fmtLabel(k)}</p>
              </div>
              <p className="text-sm font-bold text-white break-words">{v}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Convenience wrappers (one per role-specific tab id) ───────
// Each is a thin wrapper around RoleContentTab with a sensible title,
// icon, and key filter. They read from apiUser.roleProfile so they
// are always real, never hardcoded.

export function CareerTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  // Career tab = roleProfile filtered to career-related keys
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const careerKeys = Object.keys(rp).filter(k =>
    /career|club|team|year|since|founded|experience|matches|games|appearances|goals|assists|win|trophy|honour|honor|license|level|position|contract|agent|client|report|article/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Career History" icon={Trophy} keys={careerKeys} />;
}

export function SquadTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const squadKeys = Object.keys(rp).filter(k =>
    /squad|player|member|coach|captain|president|owner|manager|staff|graduate/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Squad & Staff" icon={Users} keys={squadKeys} />;
}

export function ArticlesTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const articleKeys = Object.keys(rp).filter(k =>
    /article|report|publication|topic|media|content|piece|story/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Published Work" icon={Newspaper} keys={articleKeys} />;
}

export function AnalystToolsTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const toolKeys = Object.keys(rp).filter(k =>
    /model|tool|specialization|data|report|metric|stat|xg|ppda/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Tools & Models" icon={BarChart3} keys={toolKeys} />;
}

export function FacilitiesTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const facKeys = Object.keys(rp).filter(k =>
    /facilit|stadium|venue|capacity|surface|address|parking|event|court|pitch|gym|pool/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Facilities" icon={Building} keys={facKeys} />;
}

export function SpotlightTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const spotKeys = Object.keys(rp).filter(k =>
    /content|platform|follower|video|highlight|reel|stream|channel|equipment/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Spotlight" icon={Sparkles} keys={spotKeys} />;
}

export function TrophiesTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const trophyKeys = Object.keys(rp).filter(k =>
    /trophy|honour|honor|title|champion|winner|medal|cup|league|division/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Trophies & Honours" icon={Crown} keys={trophyKeys} />;
}

export function PortfolioTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const portfolioKeys = Object.keys(rp).filter(k =>
    /sponsor|partner|client|portfolio|deal|brand|product|service|invest|portfolio/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Portfolio" icon={Handshake} keys={portfolioKeys} />;
}

export function ServicesTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const serviceKeys = Object.keys(rp).filter(k =>
    /service|product|offering|branch|hour|business|industry/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Services & Products" icon={Briefcase} keys={serviceKeys} />;
}

export function ProgramsTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const programKeys = Object.keys(rp).filter(k =>
    /program|mission|vision|initiative|project|graduat|course|training/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Programs" icon={GraduationCap} keys={programKeys} />;
}

export function ClientsTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const clientKeys = Object.keys(rp).filter(k =>
    /client|player|coach|agent|deal|contract|represent/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Clients" icon={Handshake} keys={clientKeys} />;
}

export function MembersTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const memberKeys = Object.keys(rp).filter(k =>
    /member|count|rule|topic|admin|moderator|community/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Members" icon={Users} keys={memberKeys} />;
}

export function ReportsTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const reportKeys = Object.keys(rp).filter(k =>
    /report|scout|coverage|country|specialization|finding|recommendation/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Scouting Reports" icon={Search} keys={reportKeys} />;
}

// Standings & Fixtures tabs — these need real match data which we don't
// have wired yet. Show a clean "coming soon" state that reads any
// roleProfile keys the competition/league has filled in.
export function StandingsTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const standingKeys = Object.keys(rp).filter(k =>
    /standing|table|division|tier|season|participant|team/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Standings" icon={Trophy} keys={standingKeys} />;
}

export function FixturesTab({ apiUser, role }: { apiUser: ApiUser | null; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const fixtureKeys = Object.keys(rp).filter(k =>
    /fixture|schedule|match|round|date|kickoff|calendar|season/i.test(k)
  );
  return <RoleContentTab apiUser={apiUser} role={role} title="Fixtures" icon={Calendar} keys={fixtureKeys} />;
}
