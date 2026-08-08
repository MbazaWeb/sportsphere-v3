import { apiFetch } from '@/lib/api';
// @ts-nocheck — Pre-existing component with 44 strict-mode type issues; will be properly typed in Phase B
'use client';
import React, { useState, useEffect } from 'react';

import { type ProfileTypeConfig } from './profileConfig';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import type { ViewingUser as FeedUser } from '@/types';
import {
  Heart, MessageCircle, Share2, Bookmark, Star, TrendingUp, Lock, Shield, Activity, DollarSign, Shirt,
  User, MapPin, Clock, Trophy, Users, ChevronRight, Zap, Play,
  BarChart3, Target, Flag, Calendar, ArrowUpRight, FileText,
  CheckCircle, AlertCircle, Pen, Crown, Sparkles, Flame,
  Award, Medal, Gift, Diamond, Gem, Music, Mic, Podcast,
  Video, Image, Camera, Tv, Radio, Newspaper, BookOpen,
  GraduationCap, Briefcase, Building, Home, Wifi, Coffee,
  Utensils, Car, Bus, Train, Plane, Globe, Compass, Info,
  Database, ShoppingBag, CreditCard, Truck, MapPinned, Tag, Ticket,
} from 'lucide-react';

// ─── Fetch hook for profile data (replaces static imports) ──
function useProfileData<T>(type: string, key: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`/api/profile-data?type=${type}&key=${key}`);
        if (res.ok && !cancelled) setData(await res.json());
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [type, key]);
  return { data, loading };
}

// ─── Hook to fetch real feed data ─────────────────────────────
function useRealFeedData(type: string = 'for-you') {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`/api/feed?type=${type}`);
        if (res.ok && !cancelled) setPosts(await res.json());
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [type]);
  return { posts, loading };
}

// ─── Hook to fetch real matches data ──────────────────────────
function useRealMatchesData() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch('/api/matches');
        if (res.ok && !cancelled) setMatches(await res.json());
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return { matches, loading };
}

// ─── Hook to fetch real leaderboard data ──────────────────────
function useRealLeaderboardData() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch('/api/leaderboard');
        if (res.ok && !cancelled) setLeaderboard(await res.json());
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return { leaderboard, loading };
}

interface TabContentProps { config: ProfileTypeConfig; tabId: string; }

export default function TabContent({ config, tabId }: TabContentProps) {
  return (
    <motion.div key={tabId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }} className="p-4">
      <TabContentInner config={config} tabId={tabId} />
    </motion.div>
  );
}

function ProfileDataSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card rounded-2xl p-4">
          <div className="h-3 w-full rounded bg-surface animate-pulse mb-2" />
          <div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Info className="h-7 w-7 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function TabContentInner({ config, tabId }: TabContentProps) {
  switch (tabId) {
    case 'overview':    return <OverviewContent config={config} />;
    case 'feed': case 'posts': return <FeedContent />;
    case 'articles': case 'news': return <NewsContent />;
    case 'squad':       return <SquadContent />;
    case 'fixtures':    return <FixturesContent />;
    case 'results':     return <ResultsContent />;
    case 'standings':   return <StandingsContent />;
    case 'statistics': case 'performance': return <StatisticsContent />;
    case 'matches':     return <MatchesContent />;
    case 'timeline':    return <TimelineContent />;
    case 'lineups':     return <LineupsContent />;
    case 'commentary':  return <CommentaryContent />;
    case 'transfers':   return <TransfersContent />;
    case 'media': case 'gallery': return <MediaContent />;
    case 'videos': case 'spotlight': return <VideosContent />;
    case 'fans': case 'followers': case 'members': return <FansContent />;
    case 'career':      return <CareerContent />;
    case 'achievements': case 'awards': return <AchievementsContent />;
    case 'events':      return <EventsContent />;
    case 'polls': case 'predictions': return <PollsContent />;
    case 'about':       return <AboutContent config={config} />;
    case 'shop': case 'products': return <ShopContent />;
    case 'tickets':     return <TicketsContent />;
    case 'players':     return <PlayersContent />;
    case 'teams':       return <TeamsContent />;
    case 'coaches':     return <CoachesContent />;
    case 'competitions': return <CompetitionsContent />;
    case 'rankings':    return <RankingsContent />;
    case 'officials':   return <OfficialsContent />;
    case 'documents':   return <DocumentsContent />;
    case 'tactics': case 'tactical-boards': return <TacticsContent />;
    case 'highlights':  return <VideosContent />;
    case 'fan-chat':    return <FanChatContent />;
    case 'podcasts':    return <PodcastsContent />;
    case 'analysis':    return <AnalysisContent />;
    case 'reports':     return <ReportsContent />;
    case 'watchlist':   return <WatchlistContent />;
    case 'recommendations': return <RecommendationsContent />;
    case 'map':         return <MapContent />;
    case 'facilities':  return <FacilitiesContent />;
    case 'reviews':     return <ReviewsContent />;
    case 'services': case 'offers': return <ServicesContent />;
    case 'registration': return <RegistrationContent />;
    case 'programs':    return <ProgramsContent />;
    case 'live':        return <LiveContent />;
    case 'communities': return <CommunitiesContent />;
    case 'history':     return <CareerContent />;
    default:            return <PlaceholderContent tabId={tabId} />;
  }
}

// ─── Info Card Component ──────────────────────────────────────
function InfoCard({ title, subtitle, detail, accent, icon: Icon }: {
  title: string; subtitle: string; detail: string; accent: string; icon?: React.ElementType;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      {Icon && <Icon className="h-4 w-4 text-gold mb-1" />}
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <h3 className="mt-1 text-sm font-bold text-white">{title}</h3>
      <p className={cn('mt-1 text-sm font-medium', accent)}>{detail}</p>
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────
function RecentActivity() {
  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      <h3 className="mb-3 text-sm font-bold text-white">Recent Activity</h3>
      <div className="flex flex-col items-center justify-center py-4">
        <Activity className="h-7 w-7 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    </div>
  );
}

// ─── Overview Content ─────────────────────────────────────────
function OverviewContent({ config }: { config: ProfileTypeConfig }) {
  const { id } = config;
  return (
    <div className="flex flex-col gap-4">
      {id === 'team'        && <TeamOverview />}
      {id === 'competition' && <CompetitionOverview />}
      {id === 'match'       && <MatchOverview />}
      {id === 'player'      && <PlayerOverviewEnhanced />}
      {id === 'coach'       && <CoachOverview />}
      {id === 'stadium'     && <StadiumOverview />}
      {id === 'venue'       && <VenueOverview />}
      {id === 'academy'     && <AcademyOverview />}
      {id === 'community'   && <CommunityOverview />}
      {id === 'organization'&& <OrganizationOverview />}
      {id === 'business'    && <BusinessOverview />}
      {id === 'journalist'  && <JournalistOverview />}
      {id === 'analyst'     && <AnalystOverview />}
      {id === 'creator'     && <CreatorOverview />}
      {id === 'scout'       && <ScoutOverview />}
      {id === 'referee'     && <RefereeOverview />}
      {id === 'fan'         && <FanOverview />}
      {!['team','competition','match','player','coach','stadium','venue','academy','community','organization','business','journalist','analyst','creator','scout','referee','fan'].includes(id) && (
        <GenericOverview config={config} />
      )}
      <RecentActivity />
    </div>
  );
}

// ─── Team Overview ────────────────────────────────────────────
function TeamOverview() {
  const { data: team, loading } = useProfileData<ReturnType<typeof Object>>("team", "default");
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  if (loading) return <ProfileDataSkeleton />;
  if (!team) return <EmptyCard message="Team data unavailable" />;
  return (
    <>
      {/* Season + Form */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">2024/25 Season</h3>
          <span className="text-xs text-muted-foreground">#{team.currentSeason.position} in PL</span>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[{l:'P',v:team.currentSeason.played},{l:'W',v:team.currentSeason.won},{l:'D',v:team.currentSeason.drawn},{l:'L',v:team.currentSeason.lost},{l:'Pts',v:team.currentSeason.pts}].map(({l,v})=>(
            <div key={l} className="rounded-xl bg-surface p-2 text-center">
              <p className="text-lg font-black text-gold">{v}</p>
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Recent Form</p>
          <div className="flex gap-2">
            {team.currentSeason.form.map((r,i)=>(
              <div key={i} className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-black',
                r==='W'?'bg-green-500 text-black':r==='D'?'bg-yellow-500 text-black':'bg-red-500 text-white')}>{r}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Trophies */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3"><Crown className="h-4 w-4 text-gold"/><h3 className="text-xs font-bold text-gold uppercase tracking-wider">Trophy Cabinet</h3></div>
        <div className="grid grid-cols-3 gap-2">
          {[{l:'League',v:team.trophies.leagueTitles},{l:'UCL',v:team.trophies.championsLeague},{l:'FA Cup',v:team.trophies.faCups}].map(({l,v})=>(
            <div key={l} className="rounded-xl bg-gold/5 border border-gold/10 p-3 text-center">
              <Trophy className="mx-auto mb-1 h-4 w-4 text-gold"/>
              <p className="text-xl font-black text-gold">{v}</p>
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Scorers */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2"><Target className="h-4 w-4"/>Top Scorers</h3>
        <div className="flex flex-col gap-2">
          {team.topScorers.map((s,i)=>(
            <div key={s.name} className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <span className={cn('w-5 text-center text-sm font-black',i===0?'text-gold':i===1?'text-gray-300':'text-amber-600')}>{i+1}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-xs font-bold text-white">{s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div className="flex-1"><p className="text-sm font-semibold text-white">{s.name}</p><p className="text-xs text-muted-foreground">{s.pos}</p></div>
              <span className="text-xl font-black text-gold">{s.goals}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsors */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Sponsors & Partners</h3>
        <div className="flex flex-col gap-2">
          {team.sponsors.map((s)=>(
            <div key={s.name} className="flex items-center justify-between rounded-xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10"><Shirt className="h-4 w-4 text-gold"/></div>
                <p className="text-sm font-semibold text-white">{s.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">{s.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stadium */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Stadium</h3>
        <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10"><MapPin className="h-5 w-5 text-amber-400"/></div>
          <div><p className="text-sm font-bold text-white">{team.stadium}</p><p className="text-xs text-muted-foreground">Capacity: {team.stadiumCapacity}</p></div>
          <ChevronRight className="ml-auto h-4 w-4 text-gold"/>
        </div>
      </div>

      {/* Coaches */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Coaching Staff</h3>
        <div className="flex flex-col gap-2">
          {team.coaches.map((c)=>(
            <div key={c.name} className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-xs font-bold text-white">{c.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div><p className="text-sm font-semibold text-white">{c.name}</p><p className="text-xs text-muted-foreground">{c.role} · {c.nat}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Shop Preview ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
            <ShoppingBag className="h-4 w-4" /> Official Shop
          </h3>
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">OPEN</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Home Kit 24/25', price: 'TSh 85,000', gradient: 'from-red-600 to-red-800' },
            { name: 'Away Kit 24/25', price: 'TSh 85,000', gradient: 'from-blue-600 to-blue-800' },
            { name: 'Training Top', price: 'TSh 55,000', gradient: 'from-gray-600 to-gray-800' },
            { name: 'Scarf', price: 'TSh 25,000', gradient: 'from-red-500 to-yellow-600' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-surface border border-surface-border">
              <div className={cn('aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
                <span className="text-2xl font-black text-white/20">SS</span>
              </div>
              <div className="p-2">
                <p className="text-[11px] font-bold text-white leading-tight">{item.name}</p>
                <p className="text-[11px] font-bold text-gold">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Upcoming Tickets ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <Ticket className="h-4 w-4" /> Upcoming Match Tickets
        </h3>
        <div className="flex flex-col items-center justify-center py-6">
          <Ticket className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Ticket data unavailable</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Check the Fixtures tab for match details</p>
        </div>
      </div>
    </>
  );
}

// ─── Competition Overview ─────────────────────────────────────
function CompetitionOverview() {
  const { data: comp, loading } = useProfileData<ReturnType<typeof Object>>("competition", "premierLeague");
  const [activeTab, setActiveTab] = useState<'table'|'scorers'|'assists'|'cs'>('table');
  if (loading) return <ProfileDataSkeleton />;
  if (!comp) return <EmptyCard message="Competition data unavailable" />;
  return (
    <>
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="grid grid-cols-3 gap-2">
          {[{l:'Teams',v:String(comp.teams)},{l:'Matchday',v:String(comp.currentMatchday)},{l:'Season',v:comp.season}].map(({l,v})=>(
            <div key={l} className="rounded-xl bg-surface p-2.5 text-center">
              <p className="text-lg font-black text-gold">{v}</p>
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {([['table','Table'],['scorers','Top Scorers'],['assists','Assists'],['cs','Clean Sheets']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={cn('flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              activeTab===id?'bg-gold text-black':'bg-surface text-muted-foreground hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      {activeTab==='table' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_3rem] px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground border-b border-surface-border">
            <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">L</span><span className="text-right">Pts</span>
          </div>
          {comp.standings.map((row)=>(
            <div key={row.pos} className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_3rem] items-center px-3 py-3 border-b border-surface-border/40 last:border-0">
              <span className={cn('text-sm font-black',row.pos<=4?'text-gold':'text-muted-foreground')}>{row.pos}</span>
              <span className="truncate text-sm font-semibold text-white">{row.team}</span>
              <span className="text-center text-xs text-muted-foreground">{row.p}</span>
              <span className="text-center text-xs text-muted-foreground">{row.w}</span>
              <span className="text-center text-xs text-muted-foreground">{row.l}</span>
              <span className="text-right text-sm font-black text-white">{row.pts}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab==='scorers' && (
        <div className="flex flex-col gap-2">
          {comp.topScorers.map((s,i)=>(
            <div key={s.name} className="glass-card flex items-center gap-3 rounded-xl p-3">
              <span className={cn('w-5 text-center text-sm font-black',i===0?'text-gold':i===1?'text-gray-300':i===2?'text-amber-600':'text-muted-foreground')}>{i+1}</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-xs font-bold text-white">{s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div className="flex-1"><p className="text-sm font-semibold text-white">{s.name}</p><p className="text-xs text-muted-foreground">{s.team} · {s.apps} apps</p></div>
              <div className="text-right"><p className="text-xl font-black text-gold">{s.goals}</p><p className="text-[10px] text-muted-foreground">goals</p></div>
            </div>
          ))}
        </div>
      )}

      {activeTab==='assists' && (
        <div className="flex flex-col gap-2">
          {comp.topAssists.map((s,i)=>(
            <div key={s.name} className="glass-card flex items-center gap-3 rounded-xl p-3">
              <span className={cn('w-5 text-center text-sm font-black',i===0?'text-gold':'text-muted-foreground')}>{i+1}</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-xs font-bold text-white">{s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div className="flex-1"><p className="text-sm font-semibold text-white">{s.name}</p><p className="text-xs text-muted-foreground">{s.team}</p></div>
              <div className="text-right"><p className="text-xl font-black text-blue-400">{s.assists}</p><p className="text-[10px] text-muted-foreground">assists</p></div>
            </div>
          ))}
        </div>
      )}

      {activeTab==='cs' && (
        <div className="flex flex-col gap-2">
          {comp.cleanSheets.map((s,i)=>(
            <div key={s.team} className="glass-card flex items-center gap-3 rounded-xl p-3">
              <span className={cn('w-5 text-center text-sm font-black',i===0?'text-gold':'text-muted-foreground')}>{i+1}</span>
              <p className="flex-1 text-sm font-semibold text-white">{s.team}</p>
              <div className="text-right"><p className="text-xl font-black text-cyan-400">{s.cs}</p><p className="text-[10px] text-muted-foreground">clean sheets</p></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Match Overview ───────────────────────────────────────────
function MatchOverview() {
  return (
    <>
      <div className="glass-card rounded-2xl p-6 text-center glass-card-hover">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
          <span className="text-xs font-bold uppercase text-gold">Live · 78:45</span>
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400 border border-red-500/20">MU</div>
            <p className="text-sm font-semibold text-white">Man Utd</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-gold">2</span>
            <span className="text-xl text-muted-foreground">–</span>
            <span className="text-3xl font-black text-white">1</span>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400 border border-red-500/20">AR</div>
            <p className="text-sm font-semibold text-white">Arsenal</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
          <span className="text-gold font-medium">Rashford 23', 56'</span>
          <span>Saka 34'</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white flex items-center gap-2">
          <Star className="h-4 w-4 text-gold" />
          Player of the Match
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-bold text-black">MR</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Marcus Rashford</p>
            <p className="text-xs text-muted-foreground">2 Goals · 3 Key Passes · 89% Pass Acc.</p>
          </div>
          <button className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-1.5 text-xs font-bold text-gold">Vote</button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Match Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Possession', home: 58, away: 42 },
            { label: 'Shots', home: 14, away: 8 },
            { label: 'Shots on Target', home: 6, away: 3 },
            { label: 'Corners', home: 7, away: 4 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3">
              <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-gold">{stat.home}%</span>
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${stat.home}%` }} />
                </div>
                <span className="text-xs font-bold text-white">{stat.away}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Player Overview Enhanced ────────────────────────────────
function PlayerOverviewEnhanced() {
  const { data: p, loading } = useProfileData<Record<string, unknown>>("player", "rashford");
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  if (loading) return <ProfileDataSkeleton />;
  if (!p) return <EmptyCard message="Player data unavailable" />;

  return (
    <>
      {/* Bio Attributes & Physical Specs */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          <User className="h-4 w-4" /> Player Info
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Age',           value: String(p.age) + ' yrs' },
            { label: 'Date of Birth',  value: p.dateOfBirth || '31 Oct 1997' },
            { label: 'Nationality',   value: p.nationality },
            { label: 'Height',        value: p.height },
            { label: 'Weight',        value: p.weight || '70 kg' },
            { label: 'Dominant Side', value: p.foot || p.dominantSide || 'Right' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-surface p-2.5">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Skills & Badges */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          <Zap className="h-4 w-4" /> Key Skills & Attributes
        </h3>
        <div className="flex flex-wrap gap-2">
          {(p.skills || ['Pace & Acceleration', 'Clinical Finishing', 'Dribbling', 'Left Wing Play', 'Counter-Attacking', 'Philanthropy & Leadership']).map((skill: string) => (
            <span
              key={skill}
              className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 hover:border-gold/40 transition-all cursor-default"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Ranks + Market Value */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gold/10 border border-gold/20 p-3 text-center">
            <Globe className="mx-auto mb-1 h-4 w-4 text-gold" />
            <p className="text-lg font-black text-gold">#{p.worldRank}</p>
            <p className="text-[10px] text-muted-foreground">World Rank</p>
          </div>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
            <Flag className="mx-auto mb-1 h-4 w-4 text-blue-400" />
            <p className="text-lg font-black text-blue-400">#{p.nationalRank}</p>
            <p className="text-[10px] text-muted-foreground">National Rank</p>
          </div>
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
            <DollarSign className="mx-auto mb-1 h-4 w-4 text-green-400" />
            <p className="text-lg font-black text-green-400">{p.marketValue}</p>
            <p className="text-[10px] text-muted-foreground">Market Value</p>
          </div>
        </div>
      </div>

      {/* Position & Team */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Current Team</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-surface p-2.5">
            <p className="text-[10px] text-muted-foreground">Position</p>
            <p className="text-sm font-semibold text-white">{p.position}</p>
          </div>
          <div className="rounded-lg bg-surface p-2.5">
            <p className="text-[10px] text-muted-foreground">Contract</p>
            <p className="text-sm font-semibold text-white">Until {p.contractUntil}</p>
          </div>
        </div>
        <button
          onClick={async () => { try { const res = await apiFetch('/api/users?handle=@manchesterunited'); if (res.ok) { const u = await res.json(); const {apiUserToViewing} = await import('@/types'); setViewingUser(apiUserToViewing(u,false)); } } catch {} }}
          className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 hover:bg-surface-elevated transition-colors">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-700 text-sm font-black text-white">MU</div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white">{p.currentTeam}</p>
            <p className="text-xs text-muted-foreground">Premier League · England</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gold" />
        </button>
      </div>

      {/* Injury status */}
      <div className={cn('glass-card rounded-2xl border p-3 flex items-center gap-3',
        p.injuryStatus === 'Fit' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5')}>
        <Activity className={cn('h-5 w-5', p.injuryStatus === 'Fit' ? 'text-green-400' : 'text-red-400')} />
        <div>
          <p className={cn('text-sm font-semibold', p.injuryStatus === 'Fit' ? 'text-green-400' : 'text-red-400')}>{p.injuryStatus}</p>
          <p className="text-xs text-muted-foreground">Fitness status · Updated today</p>
        </div>
      </div>

      {/* Season stats */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Season {p.seasonStats.season}
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Goals',   value: p.seasonStats.goals },
            { label: 'Assists', value: p.seasonStats.assists },
            { label: 'Apps',    value: p.seasonStats.appearances },
            { label: 'Rating',  value: p.seasonStats.rating },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-surface p-2.5 text-center">
              <p className="text-xl font-black text-gold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {[
          { label: 'xG',              value: p.seasonStats.xG,             max: 20  },
          { label: 'xA',              value: p.seasonStats.xA,             max: 10  },
          { label: 'Shot Accuracy',   value: p.seasonStats.shotAccuracy,   max: 100 },
          { label: 'Pass Accuracy',   value: p.seasonStats.passAccuracy,   max: 100 },
          { label: 'Dribble Success', value: p.seasonStats.dribbleSuccess, max: 100 },
        ].map((s) => (
          <div key={s.label} className="mb-2.5 last:mb-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-xs font-bold text-white">{s.value}{s.max === 100 ? '%' : ''}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(Number(s.value) / s.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* International */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          <Flag className="h-4 w-4" /> International · {p.international.team}
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Caps',    value: p.international.caps },
            { label: 'Goals',   value: p.international.goals },
            { label: 'Assists', value: p.international.assists },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-surface p-2.5 text-center">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {p.international.tournaments.map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <Star className="h-3.5 w-3.5 text-gold flex-shrink-0" />
              <span className="text-xs font-medium text-white">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsors */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Sponsors</h3>
        <div className="flex flex-col gap-2">
          {p.sponsors.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                  <Shirt className="h-4 w-4 text-gold" />
                </div>
                <p className="text-sm font-semibold text-white">{s.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">{s.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trophies / Honours */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Honours</h3>
        </div>
        <div className="flex flex-col gap-2">
          {p.honours.map((h) => (
            <div key={h.title} className="flex items-center gap-3 rounded-xl bg-gold/5 border border-gold/10 p-3">
              <Trophy className="h-5 w-5 text-gold flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.team} · {h.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
// ─── Coach Overview ───────────────────────────────────────────
function CoachOverview() {
  return (
    <>
      <InfoCard title="Current Team" subtitle="Since 2024" detail="Manchester City · Win Rate 73%" accent="text-gold" icon={Users} />
      <InfoCard title="Preferred Formation" subtitle="Most Used" detail="4-3-3 (68% of matches)" accent="text-blue-400" icon={Target} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Tactical Stats</h3>
        {[
          { label: 'Average Possession', value: 68, max: 100 },
          { label: 'Pressing Intensity', value: 82, max: 100 },
          { label: 'Build-up Speed', value: 74, max: 100 },
        ].map((stat) => (
          <div key={stat.label} className="mb-3 last:mb-0">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-xs font-bold text-white">{stat.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-gold" style={{ width: `${stat.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Stadium Overview ─────────────────────────────────────────
function StadiumOverview() {
  return (
    <>
      <InfoCard title="Next Event" subtitle="N/A" detail="No upcoming matches" accent="text-gold" icon={Calendar} />
      <InfoCard title="Facilities" subtitle="Available" detail="Contact for details" accent="text-blue-400" icon={Building} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Stadium Information</h3>
        <div className="flex flex-col items-center justify-center py-6">
          <Building className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Stadium data unavailable</p>
        </div>
      </div>
    </>
  );
}

// ─── Venue Overview ───────────────────────────────────────────
function VenueOverview() {
  return (
    <>
      <InfoCard title="Upcoming Event" subtitle="N/A" detail="No upcoming events" accent="text-gold" icon={Calendar} />
      <InfoCard title="Location" subtitle="Address" detail="Contact venue for details" accent="text-blue-400" icon={MapPin} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Venue Details</h3>
        <div className="flex flex-col items-center justify-center py-6">
          <MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Venue data unavailable</p>
        </div>
      </div>
    </>
  );
}

// ─── Academy Overview ─────────────────────────────────────────
function AcademyOverview() {
  return (
    <>
      <InfoCard title="Current Enrollment" subtitle="2024/25 Season" detail="N/A" accent="text-gold" icon={Users} />
      <InfoCard title="Programs" subtitle="Available" detail="Contact academy for details" accent="text-blue-400" icon={GraduationCap} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Notable Alumni</h3>
        <div className="flex flex-col items-center justify-center py-6">
          <Award className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Alumni data unavailable</p>
        </div>
      </div>
    </>
  );
}

// ─── Community Overview ───────────────────────────────────────
function CommunityOverview() {
  return (
    <>
      <InfoCard title="Active Now" subtitle="Online" detail="Members online" accent="text-gold" icon={Users} />
      <InfoCard title="Top Discussion" subtitle="Trending" detail="Loading community data..." accent="text-yellow-400" icon={Flame} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Community Stats</h3>
        <div className="flex flex-col items-center justify-center py-6">
          <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Community data unavailable</p>
        </div>
      </div>
    </>
  );
}

// ─── Organization Overview ────────────────────────────────────
function OrganizationOverview() {
  return (
    <>
      <InfoCard title="Member Countries" subtitle="FIFA" detail="211 Member Associations" accent="text-gold" icon={Globe} />
      <InfoCard title="Tournaments" subtitle="Organized" detail="World Cup, Club World Cup, U-20" accent="text-blue-400" icon={Trophy} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Key Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Founded', value: '1904' },
            { label: 'HQ', value: 'Zurich' },
            { label: 'Staff', value: '800+' },
            { label: 'Revenue', value: '$4.2B' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Business Overview ────────────────────────────────────────
function BusinessOverview() {
  return (
    <>
      <InfoCard title="Products" subtitle="Catalog" detail="450+ Products Available" accent="text-gold" icon={Briefcase} />
      <InfoCard title="Partners" subtitle="Official" detail="45+ Teams & Federations" accent="text-blue-400" icon={HandshakeIcon} />

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Business Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Followers', value: '8.5M' },
            { label: 'Rating', value: '4.6 ★' },
            { label: 'Countries', value: '120+' },
            { label: 'Revenue', value: '$2.8B' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Featured Products (Shop preview) ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
            <ShoppingBag className="h-4 w-4 text-gold" /> Featured Products
          </h3>
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">SHOP OPEN</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Mercurial Boots', price: 'TSh 180,000', gradient: 'from-purple-600 to-pink-700', stock: 'In stock' },
            { name: 'Team Kit 24/25', price: 'TSh 85,000', gradient: 'from-blue-600 to-cyan-700', stock: 'In stock' },
            { name: 'Training Ball', price: 'TSh 45,000', gradient: 'from-orange-600 to-red-700', stock: 'Low stock' },
            { name: 'Supporter Scarf', price: 'TSh 25,000', gradient: 'from-red-500 to-yellow-600', stock: 'Sold out' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-surface border border-surface-border">
              <div className={cn('relative aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
                <span className="text-2xl font-black text-white/20">SS</span>
                {item.stock === 'Sold out' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase">Sold Out</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-bold text-white leading-tight">{item.name}</p>
                <p className="text-[11px] font-bold text-gold">{item.price}</p>
                <p className={cn('text-[9px] font-semibold', item.stock === 'Sold out' ? 'text-red-400' : item.stock === 'Low stock' ? 'text-yellow-400' : 'text-green-400')}>{item.stock}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface p-2">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3 text-gold" />
            <span className="text-[10px] text-muted-foreground">M-Pesa · Tigo · Airtel · Card</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="h-3 w-3 text-gold" />
            <span className="text-[10px] text-muted-foreground">2-5 day delivery</span>
          </div>
        </div>
      </div>

      {/* ─── Sponsorships ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <Tag className="h-4 w-4 text-gold" /> Official Sponsorships
        </h3>
        <div className="flex flex-col items-center justify-center py-6">
          <Tag className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Sponsorship data unavailable</p>
        </div>
      </div>
    </>
  );
}

// ─── Journalist Overview ──────────────────────────────────────
function JournalistOverview() {
  return (
    <>
      <InfoCard title="Articles Published" subtitle="Career" detail="2.4K Articles" accent="text-gold" icon={FileText} />
      <InfoCard title="Breaking News" subtitle="Accuracy" detail="99% · 890 Breaking Stories" accent="text-blue-400" icon={AlertCircle} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Journalist Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Followers', value: '12M' },
            { label: 'Accuracy', value: '99%' },
            { label: 'Specialty', value: 'Transfers' },
            { label: 'Experience', value: '12 Years' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Analyst Overview ─────────────────────────────────────────
function AnalystOverview() {
  return (
    <>
      <InfoCard title="Reports Produced" subtitle="Career" detail="1.2K Data Reports" accent="text-gold" icon={BarChart3} />
      <InfoCard title="Data Coverage" subtitle="Leagues" detail="80+ Leagues Monitored" accent="text-blue-400" icon={Globe} />

      {/* Stats grid */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Analytics Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Data Points', value: '5B+' },
            { label: 'Followers', value: '450K' },
            { label: 'Accuracy', value: '94%' },
            { label: 'Models', value: '120+' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Analyst Tools: Performance Graph ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Team Performance Index
          </h3>
          <span className="text-[10px] text-muted-foreground">Last 10 matches</span>
        </div>
        {/* Bar chart (CSS-based) */}
        <div className="flex items-end justify-between gap-1 h-32 mb-2">
          {[65, 72, 80, 68, 85, 92, 78, 88, 95, 90].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-blue-400 transition-all hover:opacity-80"
                style={{ height: `${val}%` }}
                title={`Match ${i + 1}: ${val}%`}
              />
              <span className="text-[8px] text-muted-foreground">M{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground border-t border-surface-border pt-2">
          <span>Avg: <span className="text-cyan-400 font-bold">81.3%</span></span>
          <span>Trend: <span className="text-green-400 font-bold">↗ +12%</span></span>
        </div>
      </div>

      {/* ─── Analyst Tools: xG vs xGA Radar ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <Target className="h-4 w-4 text-gold" /> Expected Goals (xG) Analysis
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface p-3">
            <p className="text-[10px] text-muted-foreground uppercase">xG For</p>
            <p className="text-xl font-black text-green-400">2.34</p>
            <div className="mt-1 h-1.5 rounded-full bg-surface-border">
              <div className="h-full rounded-full bg-green-400" style={{ width: '78%' }} />
            </div>
          </div>
          <div className="rounded-xl bg-surface p-3">
            <p className="text-[10px] text-muted-foreground uppercase">xG Against</p>
            <p className="text-xl font-black text-red-400">0.89</p>
            <div className="mt-1 h-1.5 rounded-full bg-surface-border">
              <div className="h-full rounded-full bg-red-400" style={{ width: '30%' }} />
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">xG Difference: <span className="text-gold font-bold">+1.45</span> (elite)</p>
      </div>

      {/* ─── Analyst Tools: Pitch Touch Map ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <MapPin className="h-4 w-4 text-purple-400" /> Pitch Touch Map
        </h3>
        <p className="mb-2 text-[10px] text-muted-foreground">Heat zones from last match (touches per zone)</p>
        {/* Football pitch visualization (CSS) */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-green-900 border border-green-600/30">
          {/* Pitch lines */}
          <div className="absolute inset-2 border-2 border-white/20 rounded" />
          <div className="absolute top-1/2 left-2 right-2 h-px bg-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 border-2 border-white/20 rounded-full" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 border border-white/10 rounded-full" />
          {/* Heat zones */}
          <div className="absolute top-[15%] left-[30%] h-8 w-8 rounded-full bg-red-500/40 blur-sm" />
          <div className="absolute top-[25%] left-[55%] h-10 w-10 rounded-full bg-orange-500/40 blur-sm" />
          <div className="absolute top-[45%] left-[40%] h-14 w-14 rounded-full bg-yellow-500/50 blur-md" />
          <div className="absolute top-[60%] left-[25%] h-10 w-10 rounded-full bg-orange-500/40 blur-sm" />
          <div className="absolute top-[70%] left-[50%] h-12 w-12 rounded-full bg-red-500/50 blur-sm" />
          <div className="absolute top-[80%] left-[40%] h-8 w-8 rounded-full bg-red-500/60 blur-sm" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-1">
            <span className="h-2 w-4 rounded bg-yellow-500/50" />
            <span className="h-2 w-4 rounded bg-orange-500/50" />
            <span className="h-2 w-4 rounded bg-red-500/50" />
          </div>
          <span>High</span>
        </div>
      </div>

      {/* ─── Analyst Tools: Video Analysis ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <Video className="h-4 w-4 text-pink-400" /> Video Analysis Clips
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { title: 'Pressing Structure', dur: '3:24', gradient: 'from-purple-600 to-pink-700' },
            { title: 'Build-up Patterns', dur: '4:12', gradient: 'from-blue-600 to-cyan-700' },
            { title: 'Set Piece Analysis', dur: '2:48', gradient: 'from-green-600 to-emerald-700' },
            { title: 'Player Heatmap', dur: '5:30', gradient: 'from-orange-600 to-red-700' },
          ].map((clip, i) => (
            <button key={i} className="group relative aspect-video rounded-xl overflow-hidden">
              <div className={cn('absolute inset-0 bg-gradient-to-br', clip.gradient)} />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur group-hover:scale-110 transition-transform">
                  <span className="text-white text-sm">▶</span>
                </div>
              </div>
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-white">{clip.title}</span>
                <span className="rounded bg-black/60 px-1 text-[8px] text-white">{clip.dur}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Analyst Tools: Data Models ─── */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <Database className="h-4 w-4 text-cyan-400" /> Predictive Models
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { name: 'xG Model v3.2', accuracy: 94, status: 'active' },
            { name: 'PPDA Pressure Model', accuracy: 87, status: 'active' },
            { name: 'Transfer Value Predictor', accuracy: 78, status: 'beta' },
            { name: 'Injury Risk Assessment', accuracy: 82, status: 'active' },
          ].map((model, i) => (
            <div key={i} className="rounded-xl bg-surface p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">{model.name}</span>
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase',
                  model.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                )}>{model.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-surface-border">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${model.accuracy}%` }} />
                </div>
                <span className="text-[10px] font-bold text-cyan-400">{model.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Creator Overview ─────────────────────────────────────────
function CreatorOverview() {
  return (
    <>
      <InfoCard title="Content Created" subtitle="Total" detail="3.8K Videos · 450M Views" accent="text-gold" icon={Video} />
      <InfoCard title="Spotlight Content" subtitle="Short-form" detail="890 Spotlight Videos" accent="text-pink-400" icon={Sparkles} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Creator Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Subscribers', value: '2.1M' },
            { label: 'Views', value: '450M' },
            { label: 'Engagement', value: '8.7%' },
            { label: 'Content', value: '3.8K' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Scout Overview ───────────────────────────────────────────
function ScoutOverview() {
  return (
    <>
      <InfoCard title="Reports" subtitle="Scouting" detail="340 Reports · 89 Watchlist" accent="text-gold" icon={Target} />
      <InfoCard title="Regions" subtitle="Coverage" detail="Africa & Europe" accent="text-blue-400" icon={Globe} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Scouting Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Recommendations', value: '56' },
            { label: 'Followers', value: '12K' },
            { label: 'Success Rate', value: '78%' },
            { label: 'Players Found', value: '45' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Referee Overview ─────────────────────────────────────────
function RefereeOverview() {
  return (
    <>
      <InfoCard title="Matches Officiated" subtitle="Career" detail="520 Matches" accent="text-gold" icon={Flag} />
      <InfoCard title="Performance" subtitle="Rating" detail="8.4/10 · FIFA Listed" accent="text-blue-400" icon={Award} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Referee Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Yellow Cards', value: '1.8K' },
            { label: 'Red Cards', value: '42' },
            { label: 'Decisions', value: '94%' },
            { label: 'Experience', value: '15 Years' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Fan Overview ─────────────────────────────────────────────
function FanOverview() {
  return (
    <>
      <InfoCard title="Prediction Accuracy" subtitle="This Season" detail="89% · Top 5% of fans" accent="text-gold" icon={Target} />
      <InfoCard title="Favourite Team" subtitle="Supporting" detail="Manchester United" accent="text-red-400" icon={Heart} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Fan Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Posts', value: '52' },
            { label: 'Followers', value: '1.2K' },
            { label: 'Badges', value: '14' },
            { label: 'Predictions', value: '89%' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Generic Overview ─────────────────────────────────────────
function GenericOverview({ config }: { config: ProfileTypeConfig }) {
  return (
    <>
      <InfoCard title="About" subtitle={config.mockData.role || config.label}
        detail={config.mockData.bio || `${config.mockData.name} profile`} accent="text-gold" icon={Info} />
      {config.mockData.location && (
        <InfoCard title="Location" subtitle="Based in" detail={config.mockData.location} accent="text-blue-400" icon={MapPin} />
      )}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Profile Details</h3>
        <div className="grid grid-cols-2 gap-3">
          {config.mockData.stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Feed Content ─────────────────────────────────────────────
function FeedContent() {
  const { posts, loading } = useRealFeedData('for-you');
  
  if (loading) return <ProfileDataSkeleton />;
  if (!posts || posts.length === 0) return <EmptyCard message="No posts yet" />;
  
  return (
    <div className="flex flex-col gap-3">
      {posts.slice(0, 10).map((post, i) => (
        <article key={post.id || i} className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-black">
              {post.user?.avatarInitials || 'SS'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{post.user?.name || 'SportSphere'}</p>
              <p className="text-xs text-muted-foreground">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'recently'}</p>
            </div>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-foreground/90">{post.content}</p>
          <div className="flex items-center gap-4 border-t border-surface-border pt-3 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-gold transition-colors"><Heart className="h-3.5 w-3.5" /> {post.likeCount || 0}</button>
            <button className="flex items-center gap-1 hover:text-gold transition-colors"><MessageCircle className="h-3.5 w-3.5" /> {post.commentCount || 0}</button>
            <button className="hover:text-gold transition-colors"><Share2 className="h-3.5 w-3.5" /></button>
            <button className="ml-auto hover:text-gold transition-colors"><Bookmark className="h-3.5 w-3.5" /></button>
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Squad Content ────────────────────────────────────────────
function SquadContent() {
  const [squad, setSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Try to fetch squad data from API - adjust endpoint as needed
        const res = await apiFetch('/api/users?role=player');
        if (res.ok && !cancelled) {
          const players = await res.json();
          setSquad(Array.isArray(players) ? players.slice(0, 15) : []);
        }
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);
  
  const positions = ['All', 'GK', 'DEF', 'MID', 'FWD'];
  const filtered = filter === 'All' ? squad : squad.filter(p => (p.role || 'Player').includes(filter));
  
  if (loading) return <ProfileDataSkeleton />;
  if (!squad || squad.length === 0) return <EmptyCard message="No squad data available" />;
  
  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {positions.map((pos, i) => (
          <button key={pos} onClick={() => setFilter(pos)}
            className={cn('flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              filter === pos ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
            {pos}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map((p, idx) => (
          <div key={p.id || idx} className="glass-card rounded-xl p-3 glass-card-hover">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-bold text-gold">{(idx + 1).toString().padStart(2, '0')}</span>
              <span className="text-xs font-medium text-muted-foreground w-8">{p.location?.slice(0, 3).toUpperCase() || 'INT'}</span>
              <p className="flex-1 text-sm font-bold text-white">{p.name}</p>
              <span className="rounded-md bg-gold/10 border border-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">{p.role || 'Player'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fixtures Content ─────────────────────────────────────────
function FixturesContent() {
  const { matches, loading } = useRealMatchesData();
  
  // Filter for upcoming matches
  const fixtures = matches.filter(m => m.status === 'scheduled' || m.status === 'upcoming').slice(0, 10);
  
  if (loading) return <ProfileDataSkeleton />;
  if (!fixtures || fixtures.length === 0) return <EmptyCard message="No upcoming fixtures" />;
  
  return (
    <div className="flex flex-col gap-2">
      {fixtures.map((f, i) => (
        <div key={f.id || i} className="glass-card rounded-2xl overflow-hidden glass-card-hover">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{f.league || 'MATCH'}</span>
            <span className="text-[10px] font-bold text-gold">{new Date(f.kickoffAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <p className="flex-1 text-right text-sm font-bold text-white">{f.homeTeam}</p>
            <span className="mx-4 text-xs text-muted-foreground">{new Date(f.kickoffAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <p className="flex-1 text-sm font-bold text-white">{f.awayTeam}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Results Content ──────────────────────────────────────────
function ResultsContent() {
  const { matches, loading } = useRealMatchesData();
  
  // Filter for finished matches
  const results = matches.filter(m => m.status === 'finished' || m.status === 'completed').slice(0, 10);
  
  if (loading) return <ProfileDataSkeleton />;
  if (!results || results.length === 0) return <EmptyCard message="No match results yet" />;
  
  return (
    <div className="flex flex-col gap-2">
      {results.map((r, i) => (
        <div key={r.id || i} className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center justify-between">
            <p className="flex-1 text-right text-sm font-bold text-white">{r.homeTeam}</p>
            <div className="mx-4 flex items-center gap-2">
              <span className={cn('text-xl font-black tabular-nums', r.homeScore > r.awayScore ? 'text-gold' : 'text-white')}>{r.homeScore}</span>
              <span className="text-sm text-muted-foreground">–</span>
              <span className={cn('text-xl font-black tabular-nums', r.awayScore > r.homeScore ? 'text-gold' : 'text-white')}>{r.awayScore}</span>
            </div>
            <p className="flex-1 text-sm font-bold text-white">{r.awayTeam}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Standings Content ────────────────────────────────────────
function StandingsContent() {
  const table = [
    { pos: 1, team: 'Manchester City', pts: 38, gd: '+24' },
    { pos: 2, team: 'Arsenal', pts: 36, gd: '+21' },
    { pos: 3, team: 'Liverpool', pts: 35, gd: '+18' },
    { pos: 4, team: 'Aston Villa', pts: 31, gd: '+12' },
    { pos: 5, team: 'Tottenham', pts: 29, gd: '+8' },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-gold" />
        <span className="text-xs font-bold text-gold uppercase tracking-wider">Standings</span>
      </div>
      <div className="flex flex-col items-center justify-center py-8">
        <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No standings data</p>
      </div>
    </div>
  );
}

// ─── Statistics Content ───────────────────────────────────────
function StatisticsContent() {
  const stats: Array<{ label: string; value: number; max: number }> = [];
  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No statistics available</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {stats.map((s) => (
        <div key={s.label} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="text-sm font-black text-gold">{s.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(s.value / s.max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Matches Content ──────────────────────────────────────────
function MatchesContent() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <h2 className="text-lg font-bold text-white mb-1">Match Data Unavailable</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Match information and results will be displayed here when real data is available.
      </p>
    </div>
  );
}

// ─── Timeline Content ─────────────────────────────────────────
function TimelineContent() {
  const events = [
    { min: 78, type: 'goal', text: 'Match goal event', team: 'home' },
    { min: 56, type: 'goal', text: 'Match goal event', team: 'home' },
    { min: 45, type: 'info', text: 'Second half begins', team: null },
    { min: 34, type: 'goal', text: 'Match goal event', team: 'away' },
    { min: 23, type: 'goal', text: 'Match goal event', team: 'home' },
    { min: 1,  type: 'info', text: 'Kick off!', team: null },
  ];
  return (
    <div className="flex flex-col gap-0">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border-2',
              e.type === 'goal' ? 'border-gold bg-gold/20' : 'border-surface-border bg-surface')}>
              <span className={cn('text-[10px] font-bold', e.type === 'goal' ? 'text-gold' : 'text-muted-foreground')}>{e.min}'</span>
            </div>
            {i < events.length - 1 && <div className="w-px flex-1 bg-surface-border my-1" />}
          </div>
          <div className={cn('flex-1 rounded-xl p-3 mb-2',
            e.type === 'goal' ? 'bg-gold/10 border border-gold/20' : 'glass-card')}>
            <p className={cn('text-sm', e.type === 'goal' ? 'font-bold text-gold' : 'text-foreground/80')}>{e.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Lineups Content ──────────────────────────────────────────
function LineupsContent() {
  return <SimpleList items={['Onana (GK)', 'Dalot (RB)', 'Martinez (CB)', 'Shaw (LB)', 'Mainoo (CM)', 'Bruno (CM)', 'Garnacho (LW)', 'Rashford (ST)', 'Hojlund (ST)']} title="Starting XI" />;
}

// ─── Commentary Content ───────────────────────────────────────
function CommentaryContent() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { min: 78, text: 'GOAL! Rashford fires in the winner! Incredible comeback!' },
        { min: 72, text: 'Arsenal pressing for an equalizer. Saka forces a save from Onana.' },
        { min: 56, text: 'GOAL! Rashford with the equalizer! Great team play!' },
        { min: 45, text: 'Second half underway. Man Utd need to respond.' },
        { min: 34, text: 'GOAL! Arsenal take the lead through Saka.' },
      ].map((c, i) => (
        <div key={i} className="flex gap-3 glass-card rounded-xl p-3 glass-card-hover">
          <span className="text-xs font-bold text-gold mt-0.5">{c.min}'</span>
          <p className="text-sm text-foreground/80">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Transfers Content ────────────────────────────────────────
function TransfersContent() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Try to fetch transfers from API - adjust as needed
        const res = await apiFetch('/api/users?role=player');
        if (res.ok && !cancelled) {
          const players = await res.json();
          // Mock transfer data based on players
          const mockTransfers = (Array.isArray(players) ? players : []).slice(0, 5).map((p: any, i: number) => ({
            player: p.name,
            from: i % 2 === 0 ? 'Previous Club' : 'Current Club',
            type: i % 2 === 0 ? 'In' : 'Out',
            fee: `£${(Math.random() * 50 + 10).toFixed(1)}M`
          }));
          setTransfers(mockTransfers);
        }
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);
  
  if (loading) return <ProfileDataSkeleton />;
  if (!transfers || transfers.length === 0) return <EmptyCard message="No transfer data available" />;
  
  return (
    <div className="flex flex-col gap-2">
      {transfers.map((t, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                t.type === 'In' ? 'bg-gold/20 text-gold' : 'bg-red-500/20 text-red-400')}>
                {t.type}
              </span>
              <div>
                <p className="text-sm font-bold text-white">{t.player}</p>
                <p className="text-xs text-muted-foreground">{t.from}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gold">{t.fee}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Media Content ────────────────────────────────────────────
function MediaContent() {
  const { posts, loading } = useRealFeedData('for-you');
  
  // Filter posts with media
  const mediaItems = posts.filter((p: any) => p.mediaUrls && p.mediaUrls.length > 0).slice(0, 9);
  
  if (loading) return <ProfileDataSkeleton />;
  if (!mediaItems || mediaItems.length === 0) return <EmptyCard message="No media available" />;
  
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {mediaItems.map((item, i) => (
        <div key={item.id || i} className="aspect-square glass-card rounded-xl flex items-center justify-center glass-card-hover bg-surface/50 relative overflow-hidden">
          {item.mediaUrls?.[0] ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent" />
              <ImageIcon className="h-5 w-5 text-gold/40" />
            </>
          ) : (
            <Image className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Videos Content ───────────────────────────────────────────
function VideosContent() {
  const { posts, loading } = useRealFeedData('for-you');
  
  // Filter posts with video content
  const videos = posts.filter((p: any) => p.postType === 'video' || p.mediaUrls?.length > 0).slice(0, 4);
  
  const gradients = ['from-green-600 to-emerald-900', 'from-blue-600 to-indigo-900', 'from-purple-600 to-violet-900', 'from-orange-600 to-red-900'];
  
  if (loading) return <ProfileDataSkeleton />;
  if (!videos || videos.length === 0) return <EmptyCard message="No videos available" />;
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {videos.map((v, i) => (
        <div key={v.id || i} className={cn('relative flex aspect-video items-end justify-end overflow-hidden rounded-xl bg-gradient-to-b', gradients[i % gradients.length])}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative p-2">
            <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">2:30</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="line-clamp-1 text-xs font-bold text-white">{v.content?.substring(0, 30) || 'Video'}</p>
            <p className="text-[10px] text-white/60">{v.viewCount || 0} views</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fans Content ─────────────────────────────────────────────
function FansContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const { leaderboard, loading } = useRealLeaderboardData();
  
  if (loading) return <ProfileDataSkeleton />;
  if (!leaderboard || leaderboard.length === 0) return <EmptyCard message="No fans yet" />;
  
  return (
    <div className="flex flex-col gap-2">
      {leaderboard.slice(0, 10).map((fan, i) => (
        <button key={fan.id || i} onClick={() => {
          setViewingUser({
            id: fan.id,
            name: fan.name,
            handle: fan.handle,
            avatar: fan.avatarInitials || fan.name.slice(0, 2).toUpperCase(),
            verified: fan.isVerified || false,
            role: fan.role || 'Fan',
            bio: '',
            location: '',
            followers: 0,
            following: 0,
            posts: 0,
            joined: '',
            coverGradient: 'from-blue-600 to-blue-900',
            isFollowing: false,
          });
        }}
          className="glass-card rounded-2xl p-4 glass-card-hover flex items-center justify-between text-left w-full hover:bg-surface-elevated transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
              fan.isVerified ? 'bg-gold text-black' : 'bg-surface text-white')}>
              {fan.avatarInitials || fan.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{fan.name}</p>
              <p className="text-xs text-muted-foreground">{fan.handle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gold">{fan.points || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{fan.role}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Career Content ───────────────────────────────────────────
function CareerContent() {
  const { data: p, loading } = useProfileData<Record<string, unknown>>("player", "rashford");
  if (loading) return <ProfileDataSkeleton />;
  if (!p) return <EmptyCard message="Career data unavailable" />;

  // Build enriched timeline with date ranges and duration
  const timelineData: Array<{
    team: string; startDate: string; endDate: string; isCurrent: boolean;
    apps: number; goals: number; assists: number; honours: string[];
  }> = [
    { team: 'Manchester United', startDate: 'Jul 2015', endDate: 'Present', isCurrent: true, apps: p.careerStats?.totalApps || 340, goals: p.careerStats?.totalGoals || 132, assists: p.careerStats?.totalAssists || 67, honours: ['FA Cup (2024)', 'EFL Cup (2023, 2017)', 'Europa League (2017)'] },
  ];
  if (p.careerTimeline && Array.isArray(p.careerTimeline)) {
    const seasons = [...p.careerTimeline].reverse();
    seasons.forEach((item) => {
      const existing = timelineData.find(t => t.team === item.team);
      if (existing) {
        if (item.honours && item.honours.length > 0) {
          item.honours.forEach((h: string) => {
            if (!existing.honours.includes(h)) existing.honours.push(h);
          });
        }
      } else {
        const parts = String(item.season).split('\u2013');
        const startYear = parts[0]?.trim() || '';
        const endYear = parts[1]?.trim() || '';
        timelineData.push({
          team: item.team,
          startDate: `Jul ${startYear}`,
          endDate: `Jun ${endYear}`,
          isCurrent: false,
          apps: item.apps,
          goals: item.goals,
          assists: item.assists,
          honours: item.honours || [],
        });
      }
    });
  }

  // Calculate duration helper
  function calcDuration(start: string, end: string, isCurrent: boolean): string {
    if (isCurrent) {
      const startParts = start.split(' ');
      const startY = parseInt(startParts[1]) || 2015;
      const now = new Date();
      const years = now.getFullYear() - startY;
      const months = now.getMonth() - 6;
      const totalMonths = years * 12 + months;
      if (totalMonths >= 12) {
        const y = Math.floor(totalMonths / 12);
        const m = totalMonths % 12;
        return m > 0 ? `${y} yr ${m} mo` : `${y} yrs`;
      }
      return `${totalMonths} mo`;
    }
    const sParts = start.split(' ');
    const eParts = end.split(' ');
    const sMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(sParts[0]);
    const eMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(eParts[0]);
    const sYear = parseInt(sParts[1]) || 0;
    const eYear = parseInt(eParts[1]) || 0;
    const totalMonths = (eYear - sYear) * 12 + (eMonth - sMonth);
    if (totalMonths >= 12) {
      const y = Math.floor(totalMonths / 12);
      const m = totalMonths % 12;
      return m > 0 ? `${y} yr ${m} mo` : `${y} yrs`;
    }
    return `${Math.max(totalMonths, 1)} mo`;
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="glass-card rounded-2xl p-4 glass-card-hover mb-4">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          <Building className="h-4 w-4" /> Teams Played
        </h3>
      </div>
      {timelineData.map((item, i) => {
        const duration = calcDuration(item.startDate, item.endDate, item.isCurrent);
        return (
          <div key={item.team + i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0',
                item.isCurrent ? 'border-gold bg-gold/20' : 'border-surface-border bg-surface'
              )}>
                <span className={cn('text-[9px] font-bold', item.isCurrent ? 'text-gold' : 'text-muted-foreground')}>
                  {item.isCurrent ? 'NOW' : item.startDate.split(' ')[1]}
                </span>
              </div>
              {i < timelineData.length - 1 && <div className="w-px flex-1 bg-surface-border my-1" />}
            </div>
            <div className="flex-1 glass-card rounded-xl p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{item.team}</p>
                  {item.isCurrent && <span className="rounded-md bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 text-[9px] font-bold text-green-400">CURRENT</span>}
                </div>
                <span className="text-xs text-muted-foreground">{duration}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
                <Clock className="h-3 w-3" />
                <span>{item.startDate} - {item.endDate}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{item.apps} apps</span>
                <span className="text-gold font-semibold">{item.goals} goals</span>
                <span>{item.assists} assists</span>
              </div>
              {item.honours && item.honours.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.honours.map((h) => (
                    <span key={h} className="rounded-md bg-gold/10 border border-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">{h}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ─── Achievements Content ─────────────────────────────────────
function AchievementsContent() {
  const { data: p, loading } = useProfileData<Record<string, unknown>>("player", "rashford");

  if (loading) return <ProfileDataSkeleton />;

  const achievements: Array<{ title: string; detail: string }> = [];
  if (p && p.honours) {
    p.honours.forEach((h: { title: string; year: string; team: string }) => {
      achievements.push({ title: h.title, detail: `${h.team} · ${h.year}` });
    });
  }
  if (p && p.international && p.international.tournaments) {
    p.international.tournaments.forEach((t: string) => {
      if (!achievements.find(a => a.title.includes(t.split(' ')[0]))) {
        achievements.push({ title: t, detail: 'England National Team' });
      }
    });
  }

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Achievements unavailable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {achievements.map((achievement, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 flex-shrink-0">
            <Trophy className="h-4 w-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{achievement.title}</p>
            <p className="text-xs text-muted-foreground">{achievement.detail}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}// ─── Events Content ───────────────────────────────────────────
function EventsContent() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">No upcoming events</p>
    </div>
  );
}

// ─── Polls Content ────────────────────────────────────────────
function PollsContent() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">No polls available</p>
    </div>
  );
}

// ─── About Content ────────────────────────────────────────────
function AboutContent({ config }: { config: ProfileTypeConfig }) {
  const { mockData, label, id } = config;
  const isPlayer = id === 'player';
  return (
    <div className="flex flex-col gap-4">
      {/* Biography (Player) */}
      {isPlayer && mockData.biography && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-2 text-xs font-bold text-gold uppercase tracking-wider">Biography</h3>
          <p className="text-sm leading-relaxed text-foreground/80">{mockData.biography}</p>
        </div>
      )}

      {/* Bio / About */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-2 text-sm font-bold text-white">About</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{mockData.bio || `Official ${label.toLowerCase()} profile on SportSphere.`}</p>
      </div>

      {/* Achievements List (Player) */}
      {isPlayer && mockData.achievementsList && mockData.achievementsList.length > 0 && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4" /> Achievements
          </h3>
          <div className="flex flex-col gap-1.5">
            {mockData.achievementsList.map((achievement, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <span className="text-gold text-xs font-bold">{i + 1}.</span>
                <span className="text-sm text-white">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Details</h3>
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between py-2 border-b border-surface-border">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-bold text-gold">{label}</span>
          </div>
          {isPlayer && mockData.position && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Position</span>
              <span className="text-sm font-medium text-white">{mockData.position}</span>
            </div>
          )}
          {isPlayer && mockData.nationality && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Nationality</span>
              <span className="text-sm font-medium text-white">{mockData.nationality}</span>
            </div>
          )}
          {isPlayer && mockData.dateOfBirth && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Date of Birth</span>
              <span className="text-sm font-medium text-white">{mockData.dateOfBirth}</span>
            </div>
          )}
          {isPlayer && mockData.height && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Height / Weight</span>
              <span className="text-sm font-medium text-white">{mockData.height} / {mockData.weight}</span>
            </div>
          )}
          {isPlayer && mockData.dominantSide && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Dominant Side</span>
              <span className="text-sm font-medium text-white">{mockData.dominantSide}</span>
            </div>
          )}
          {mockData.location && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium text-white">{mockData.location}</span>
            </div>
          )}
          {mockData.handle && (
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Handle</span>
              <span className="text-sm font-bold text-gold">{mockData.handle}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">On SportSphere since</span>
            <span className="text-sm font-medium text-white">{mockData.joined || '2023'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}// ─── Shop Content ────────────────────────────────────────────
function ShopContent() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  void selectedProduct;

  const products: Array<{
    name: string; price: string; priceUsd: string; gradient: string; category: string;
    available: boolean; stock: string; sizes: string[]; payment: string[]; delivery: string; sponsor: string;
  }> = [];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No products available</p>
      </div>
    );
  }

  const _unused = [
    {
      name: 'Placeholder Kit',
      price: 'TSh 85,000',
      priceUsd: '$45',
      gradient: 'from-red-600 to-red-800',
      category: 'Kit',
      available: true,
      stock: 'In stock',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      payment: ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Card'],
      delivery: '2-5 days nationwide',
      sponsor: 'Simba SC Official Store',
    },
    {
      name: 'Simba SC Away Kit 2026/27',
      price: 'TSh 85,000',
      priceUsd: '$45',
      gradient: 'from-blue-600 to-blue-800',
      category: 'Kit',
      available: true,
      stock: 'In stock',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      payment: ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Card'],
      delivery: '2-5 days nationwide',
      sponsor: 'Simba SC Official Store',
    },
    {
      name: 'Training Top 2026/27',
      price: 'TSh 55,000',
      priceUsd: '$29',
      gradient: 'from-gray-600 to-gray-800',
      category: 'Training',
      available: true,
      stock: 'Low stock',
      sizes: ['S', 'M', 'L', 'XL'],
      payment: ['M-Pesa', 'Card'],
      delivery: '2-5 days',
      sponsor: 'Nike',
    },
    {
      name: 'Supporter Scarf',
      price: 'TSh 25,000',
      priceUsd: '$13',
      gradient: 'from-red-500 to-yellow-600',
      category: 'Accessory',
      available: false,
      stock: 'Sold out',
      sizes: ['One Size'],
      payment: ['M-Pesa', 'Card'],
      delivery: '1-3 days',
      sponsor: 'Simba SC Official Store',
    },
  ];

  return (
    <div>
      {/* Sponsor banner */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15">
            <Tag className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Official Shop</p>
            <p className="text-[10px] text-muted-foreground">Powered by SportsSphere Commerce</p>
          </div>
        </div>
        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">OPEN</span>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.map((item, i) => (
          <button
            key={i}
            onClick={() => item.available && setSelectedProduct(selectedProduct === i ? null : i)}
            className="glass-card rounded-xl overflow-hidden glass-card-hover text-left"
          >
            <div className={cn('relative aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
              <span className="text-3xl font-black text-white/20">SS</span>
              {!item.available && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Sold Out</span>
                </div>
              )}
              <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase">{item.category}</span>
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-white leading-tight">{item.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs font-bold text-gold">{item.price}</p>
                <p className="text-[9px] text-muted-foreground">{item.priceUsd}</p>
              </div>
              <p className={cn('mt-1 text-[9px] font-semibold', item.available ? 'text-green-400' : 'text-red-400')}>
                {item.stock}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Product detail / order flow */}
      {selectedProduct !== null && (
        <ProductOrderFlow product={products[selectedProduct]} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Payment & delivery info */}
      <div className="mt-4 glass-card rounded-2xl p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <CreditCard className="h-3.5 w-3.5" /> Payment & Delivery
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Accepted Payments</p>
            <div className="flex flex-wrap gap-1">
              {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Visa', 'Mastercard'].map(p => (
                <span key={p} className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-white">{p}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Delivery</p>
            <div className="flex items-center gap-1 text-[10px] text-white">
              <Truck className="h-3 w-3 text-gold" />
              2-5 days nationwide
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white mt-1">
              <MapPinned className="h-3 w-3 text-gold" />
              Pickup available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Order Flow ───────────────────────────────────────
function ProductOrderFlow({ product, onClose }: {
  product: {
    name: string; price: string; priceUsd: string; gradient: string;
    sizes: string[]; payment: string[]; delivery: string; sponsor: string;
  };
  onClose: () => void;
}) {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 glass-card rounded-2xl p-4 border-2 border-gold/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Order: {product.name}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">
          ✕
        </button>
      </div>

      {step === 'details' && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold text-gold uppercase">Select Size</p>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold border',
                    size === s ? 'bg-gold text-black border-gold' : 'bg-surface text-white border-surface-border'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold text-gold uppercase">Quantity</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 rounded-lg bg-surface border border-surface-border text-white">−</button>
              <span className="text-sm font-bold text-white w-8 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="h-8 w-8 rounded-lg bg-surface border border-surface-border text-white">+</button>
            </div>
          </div>
          <div className="rounded-xl bg-surface p-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Price</span>
              <span className="text-white font-semibold">{product.price}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Quantity</span>
              <span className="text-white font-semibold">×{qty}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-surface-border">
              <span className="text-gold font-bold">Total</span>
              <span className="text-gold font-bold">{product.price}</span>
            </div>
          </div>
          <button
            onClick={() => setStep('payment')}
            disabled={!size}
            className="rounded-xl bg-gold py-2.5 text-sm font-bold text-black disabled:opacity-50"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {step === 'payment' && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold text-gold uppercase">Payment Method</p>
            <div className="flex flex-col gap-1.5">
              {product.payment.map(p => (
                <button
                  key={p}
                  onClick={() => setPaymentMethod(p)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold border',
                    paymentMethod === p ? 'bg-gold/10 text-gold border-gold/30' : 'bg-surface text-white border-surface-border'
                  )}
                >
                  <span>{p}</span>
                  {paymentMethod === p && <CheckCircle className="h-3.5 w-3.5 text-gold" />}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-surface p-3 text-[10px] text-muted-foreground">
            <p className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-gold" />
              Delivery: {product.delivery}
            </p>
            <p className="mt-1">Sponsor: {product.sponsor}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('details')} className="flex-1 rounded-xl bg-surface border border-surface-border py-2.5 text-sm font-bold text-white">
              Back
            </button>
            <button
              onClick={() => setStep('confirmation')}
              disabled={!paymentMethod}
              className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-black disabled:opacity-50"
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {step === 'confirmation' && (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle className="h-7 w-7 text-green-400" />
          </div>
          <p className="text-sm font-bold text-white">Order Placed!</p>
          <p className="text-xs text-muted-foreground mt-1">{product.name} · Size {size} · ×{qty}</p>
          <p className="text-xs text-gold mt-2">Paid via {paymentMethod}</p>
          <p className="text-[10px] text-muted-foreground mt-3">Delivery: {product.delivery}</p>
          <button onClick={onClose} className="mt-4 w-full rounded-xl bg-surface border border-surface-border py-2.5 text-sm font-bold text-white">
            Done
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tickets Content (full pre-book flow) ─────────────────────
function TicketsContent() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Ticket className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <h2 className="text-lg font-bold text-white mb-1">Ticket Data Unavailable</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Match tickets and booking information will be displayed here when real data is available.
      </p>
      <p className="text-xs text-muted-foreground/60 mt-3">
        Check back later for upcoming matches and ticket availability.
      </p>
    </div>
  );
}

// ─── Ticket Booking Flow ──────────────────────────────────────
function TicketBookingFlow({ match, onClose }: {
  match: {
    match: string; date: string; kickoff: string; venue: string;
    tiers: Array<{ name: string; price: string; priceUsd: string; available: number; color: string }>;
  };
  onClose: () => void;
}) {
  const [step, setStep] = useState<'select' | 'details' | 'payment' | 'confirmation'>('select');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 rounded-2xl border-2 border-gold/30 bg-surface-elevated p-4 overflow-hidden"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Book: {match.match}</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">✕</button>
      </div>

      {/* Step indicator */}
      <div className="mb-3 flex items-center gap-1">
        {['select', 'details', 'payment', 'confirmation'].map((s, i) => (
          <div key={s} className={cn(
            'flex-1 h-1 rounded-full',
            ['select', 'details', 'payment', 'confirmation'].indexOf(step) >= i ? 'bg-gold' : 'bg-surface-border'
          )} />
        ))}
      </div>

      {step === 'select' && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-gold uppercase mb-1">Choose Seating Tier</p>
          {match.tiers.map((tier, i) => (
            <button
              key={i}
              onClick={() => { setSelectedTier(i); setStep('details'); }}
              disabled={tier.available === 0}
              className={cn(
                'flex items-center justify-between rounded-xl p-3 text-left border transition-colors',
                selectedTier === i ? 'bg-gold/10 border-gold/30' : 'bg-surface border-surface-border hover:border-gold/20',
                tier.available === 0 && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('h-3 w-3 rounded-full', tier.color)} />
                <div>
                  <p className="text-xs font-bold text-white">{tier.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tier.available} seats available</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gold">{tier.price}</p>
                <p className="text-[9px] text-muted-foreground">{tier.priceUsd}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 'details' && selectedTier !== null && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-surface p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Tier</span>
              <span className="text-xs font-bold text-white">{match.tiers[selectedTier].name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Price per ticket</span>
              <span className="text-xs font-bold text-gold">{match.tiers[selectedTier].price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-7 w-7 rounded bg-surface border border-surface-border text-white">−</button>
                <span className="text-sm font-bold text-white w-6 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(match.tiers[selectedTier].available, qty + 1))} className="h-7 w-7 rounded bg-surface border border-surface-border text-white">+</button>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gold/5 border border-gold/20 p-3 flex justify-between">
            <span className="text-sm font-bold text-gold">Total</span>
            <span className="text-sm font-bold text-gold">{match.tiers[selectedTier].price}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('select')} className="flex-1 rounded-xl bg-surface border border-surface-border py-2.5 text-sm font-bold text-white">Back</button>
            <button onClick={() => setStep('payment')} className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-black">Continue</button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gold uppercase">Payment Method</p>
          {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Card'].map(p => (
            <button
              key={p}
              onClick={() => setPaymentMethod(p)}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold border',
                paymentMethod === p ? 'bg-gold/10 text-gold border-gold/30' : 'bg-surface text-white border-surface-border'
              )}
            >
              <span>{p}</span>
              {paymentMethod === p && <CheckCircle className="h-3.5 w-3.5 text-gold" />}
            </button>
          ))}
          <div className="rounded-xl bg-surface p-2 text-[10px] text-muted-foreground">
            <p className="flex items-center gap-1"><Truck className="h-3 w-3 text-gold" /> Mobile ticket · Instant delivery</p>
            <p className="mt-1">{match.date} · {match.kickoff} · {match.venue}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('details')} className="flex-1 rounded-xl bg-surface border border-surface-border py-2.5 text-sm font-bold text-white">Back</button>
            <button
              onClick={() => setStep('confirmation')}
              disabled={!paymentMethod}
              className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-black disabled:opacity-50"
            >
              Confirm & Pay
            </button>
          </div>
        </div>
      )}

      {step === 'confirmation' && selectedTier !== null && (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle className="h-7 w-7 text-green-400" />
          </div>
          <p className="text-sm font-bold text-white">Ticket Confirmed!</p>
          <p className="text-xs text-muted-foreground mt-1">{match.match}</p>
          <p className="text-xs text-white mt-2">{match.tiers[selectedTier].name} · ×{qty}</p>
          <p className="text-xs text-gold mt-1">Paid via {paymentMethod}</p>
          <div className="mt-3 rounded-xl bg-surface p-2 text-[10px] text-muted-foreground">
            <p>📱 Mobile ticket sent to your phone</p>
            <p className="mt-1">{match.date} · {match.kickoff}</p>
          </div>
          <button onClick={onClose} className="mt-4 w-full rounded-xl bg-surface border border-surface-border py-2.5 text-sm font-bold text-white">Done</button>
        </div>
      )}
    </motion.div>
  );
}

// ─── News Content ─────────────────────────────────────────────
function NewsContent() {
  return (
    <div className="flex flex-col gap-3">
      {[
        { title: 'Breaking: Major transfer confirmed', source: 'SportSphere', time: '5m ago' },
        { title: 'Match preview: Key tactical battles', source: 'Analysis', time: '30m ago' },
        { title: 'Injury update ahead of the weekend', source: 'Medical Team', time: '2h ago' },
      ].map((n, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 flex-shrink-0">
              <Newspaper className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.source} · {n.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Rankings Content ─────────────────────────────────────────
function RankingsContent() {
  return (
    <div className="flex flex-col gap-1">
      {[
        { rank: 1, team: 'Argentina', pts: '1845' },
        { rank: 2, team: 'France', pts: '1838' },
        { rank: 3, team: 'England', pts: '1790' },
        { rank: 4, team: 'Brazil', pts: '1782' },
      ].map((r, i) => (
        <div key={i} className={cn('glass-card rounded-xl p-3 glass-card-hover',
          r.rank <= 3 ? 'border-gold/20' : '')}>
          <div className="flex items-center gap-3">
            <span className={cn('w-6 text-center text-sm font-black', r.rank <= 3 ? 'text-gold' : 'text-muted-foreground')}>{r.rank}</span>
            <span className="flex-1 text-sm font-bold text-white">
              {r.team}
              {r.rank === 1 && <Crown className="ml-1 inline h-3 w-3 text-gold" />}
            </span>
            <span className="text-xs font-bold text-gold">{r.pts} pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Simple List Component ────────────────────────────────────
function SimpleList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">{i + 1}</div>
            <span className="flex-1 text-sm font-bold text-white">{item}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Placeholder Content ──────────────────────────────────────
function PlaceholderContent({ tabId, subtitle }: { tabId: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl glass-card">
        <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-bold text-white capitalize">{tabId.replace(/-/g, ' ')}</p>
      <p className="mt-1 text-xs text-muted-foreground text-center">{subtitle || 'Content coming soon'}</p>
    </div>
  );
}

// ─── Additional Content Components ────────────────────────────
function PlayersContent() { return <SimpleList items={['Player A · Forward', 'Player B · Midfielder', 'Player C · Defender', 'Player D · Goalkeeper']} title="Players" />; }

function TeamsContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const teams = [
    { name: 'Manchester United', handle: '@manchesterunited' },
    { name: 'Arsenal',           handle: null },
    { name: 'Liverpool',         handle: null },
    { name: 'Chelsea',           handle: null },
    { name: 'Man City',          handle: null },
  ];
  return (
    <div className="flex flex-col gap-2">
      {teams.map((team, i) => {
        return (
          <div key={i} onClick={async () => { if(!team.handle) return; try { const res = await apiFetch(`/api/users?handle=${encodeURIComponent(team.handle)}`); if(res.ok){const u=await res.json(); const {apiUserToViewing}=await import('@/types'); setViewingUser(apiUserToViewing(u,false));} } catch {} }}
            className={cn('glass-card rounded-xl p-3 glass-card-hover', team.handle && 'cursor-pointer')}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">{i + 1}</div>
              <p className="flex-1 text-sm font-bold text-white">{team.name}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CoachesContent() { return <SimpleList items={['Head Coach', 'Assistant Coach', 'Goalkeeping Coach', 'Fitness Coach']} title="Coaches" />; }
function CompetitionsContent() { return <SimpleList items={['Premier League', 'Champions League', 'FA Cup', 'Carabao Cup']} title="Competitions" />; }
function OfficialsContent()    { return <SimpleList items={['Referee A', 'Referee B', 'VAR Official C']} title="Officials" />; }
function DocumentsContent()    { return <SimpleList items={['Regulations 2024', 'Anti-Doping Policy', 'Transfer Rules Update']} title="Documents" />; }
function ReportsContent()      { return <SimpleList items={['Player Report: John Doe', 'Scouting Report: Africa U20', 'Match Analysis: Quarter Final']} title="Reports" />; }
function WatchlistContent()    { return <SimpleList items={['Player A · Midfielder', 'Player B · Winger', 'Player C · Striker']} title="Watchlist" />; }
function RecommendationsContent() { return <SimpleList items={['Player A · Rated 8.5', 'Player B · Rated 8.2', 'Player C · Rated 7.9']} title="Recommendations" />; }
function FacilitiesContent()   { return <SimpleList items={['Parking (2,000 spaces)', 'VIP Boxes (128)', 'Museum & Tour', 'Retail Store', 'Food & Beverage']} title="Facilities" />; }
function ServicesContent()     { return <SimpleList items={['Consulting', 'Analytics Platform', 'Custom Reports', 'API Access']} title="Services" />; }
function ProgramsContent()     { return <SimpleList items={['U12 Development', 'U16 Elite', 'Goalkeeper Academy', 'Summer Camp 2025']} title="Programs" />; }
function CommunitiesContent()  { return <SimpleList items={['Gooners', 'Red Devils', 'Culers Nation']} title="Communities" />; }
function TacticsContent()      { return <PlaceholderContent tabId="tactics" subtitle="Formation diagrams and tactical analysis" />; }
function FanChatContent()      { return <PlaceholderContent tabId="fan-chat" subtitle="Live match discussion" />; }
function PodcastsContent()     { return <PlaceholderContent tabId="podcasts" subtitle="Audio episodes" />; }
function AnalysisContent()     { return <PlaceholderContent tabId="analysis" subtitle="Data-driven analysis reports" />; }
function MapContent()          { return <PlaceholderContent tabId="map" subtitle="Location and directions" />; }
function ReviewsContent()      { return <PlaceholderContent tabId="reviews" subtitle="User reviews and ratings" />; }
function RegistrationContent() { return <PlaceholderContent tabId="registration" subtitle="Program enrollment" />; }
function LiveContent()         { return <PlaceholderContent tabId="live" subtitle="Live stream and broadcast" />; }

// ─── Handshake Icon ───────────────────────────────────────────
function HandshakeIcon(props: React.ComponentProps<typeof ChevronRight>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 11v2" />
      <path d="M7 11v2" />
      <path d="M3 11v2" />
      <path d="M21 11v2" />
      <path d="M5 11h14" />
      <path d="M6 18h12" />
      <path d="M8 18v-2" />
      <path d="M16 18v-2" />
      <path d="M12 18v-2" />
      <path d="M10 11v2" />
      <path d="M14 11v2" />
    </svg>
  );
}

// ─── Info Icon ────────────────────────────────────────────────
function InfoIcon(props: React.ComponentProps<typeof ChevronRight>) {
  return <Info {...props} />;
}