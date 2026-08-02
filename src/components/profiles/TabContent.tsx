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
  MapPin, Clock, Trophy, Users, ChevronRight, Zap, Play,
  BarChart3, Target, Flag, Calendar, ArrowUpRight, FileText,
  CheckCircle, AlertCircle, Pen, Crown, Sparkles, Flame,
  Award, Medal, Gift, Diamond, Gem, Music, Mic, Podcast,
  Video, Image, Camera, Tv, Radio, Newspaper, BookOpen,
  GraduationCap, Briefcase, Building, Home, Wifi, Coffee,
  Utensils, Car, Bus, Train, Plane, Globe, Compass, Info,
} from 'lucide-react';

// ─── Fetch hook for profile data (replaces static imports) ──
function useProfileData<T>(type: string, key: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/profile-data?type=${type}&key=${key}`);
        if (res.ok && !cancelled) setData(await res.json());
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [type, key]);
  return { data, loading };
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
  const items = [
    { icon: Pen, color: 'text-blue-400', bg: 'bg-blue-500/10', text: 'Posted a new update', time: '2h ago' },
    { icon: Trophy, color: 'text-gold', bg: 'bg-gold/10', text: 'Match result: Won 2-1', time: '5h ago' },
    { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', text: 'New fan joined', time: '1d ago' },
  ];
  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      <h3 className="mb-3 text-sm font-bold text-white">Recent Activity</h3>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0', item.bg)}>
              <item.icon className={cn('h-4 w-4', item.color)} />
            </div>
            <p className="flex-1 text-sm text-foreground/80">{item.text}</p>
            <span className="text-xs text-muted-foreground">{item.time}</span>
          </div>
        ))}
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
  const { data: team, loading } = useProfileData<ReturnType<typeof Object>>("team", "manchesterunited");
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

      {/* Identity */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Player Info</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Position',   value: p.position },
            { label: 'Nationality',value: p.nationality },
            { label: 'Age',        value: String(p.age) },
            { label: 'Height',     value: p.height },
            { label: 'Foot',       value: p.foot },
            { label: 'Contract',   value: `Until ${p.contractUntil}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-surface p-2.5">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Team — clickable */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-xs font-bold text-gold uppercase tracking-wider">Current Team</h3>
        <button
          onClick={async () => { try { const res = await fetch('/api/users?handle=@manchesterunited'); if (res.ok) { const u = await res.json(); const {apiUserToViewing} = await import('@/types'); setViewingUser(apiUserToViewing(u,false)); } } catch {} }}
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
          { label: 'xG',             value: p.seasonStats.xG,             max: 20  },
          { label: 'xA',             value: p.seasonStats.xA,             max: 10  },
          { label: 'Shot Accuracy',  value: p.seasonStats.shotAccuracy,   max: 100 },
          { label: 'Pass Accuracy',  value: p.seasonStats.passAccuracy,   max: 100 },
          { label: 'Dribble Success',value: p.seasonStats.dribbleSuccess, max: 100 },
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

      {/* Trophies */}
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
      <InfoCard title="Next Event" subtitle="Dec 14" detail="Man Utd vs Arsenal · PL" accent="text-gold" icon={Calendar} />
      <InfoCard title="Facilities" subtitle="Available" detail="Parking, VIP Boxes, Museum" accent="text-blue-400" icon={Building} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Stadium Information</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Capacity', value: '74,310' },
            { label: 'Built', value: '1910' },
            { label: 'Surface', value: 'Grass' },
            { label: 'Rating', value: '4.8 ★' },
          ].map((info) => (
            <div key={info.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{info.value}</p>
              <p className="text-[10px] text-muted-foreground">{info.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Venue Overview ───────────────────────────────────────────
function VenueOverview() {
  return (
    <>
      <InfoCard title="Upcoming Event" subtitle="Next" detail="Concert: Taylor Swift · Dec 20" accent="text-gold" icon={Calendar} />
      <InfoCard title="Location" subtitle="Address" detail="London, England · Wembley Park" accent="text-blue-400" icon={MapPin} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Venue Details</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Capacity', value: '90,000' },
            { label: 'Events/Yr', value: '32+' },
            { label: 'Parking', value: '2,000' },
            { label: 'Rating', value: '4.7 ★' },
          ].map((info) => (
            <div key={info.label} className="rounded-xl bg-surface p-3 text-center">
              <p className="text-sm font-bold text-gold">{info.value}</p>
              <p className="text-[10px] text-muted-foreground">{info.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Academy Overview ─────────────────────────────────────────
function AcademyOverview() {
  return (
    <>
      <InfoCard title="Current Enrollment" subtitle="2024/25 Season" detail="240 Students · 12 Teams" accent="text-gold" icon={Users} />
      <InfoCard title="Programs" subtitle="Available" detail="U8 to U18 · Residential & Day" accent="text-blue-400" icon={GraduationCap} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Notable Alumni</h3>
        <div className="flex gap-2 flex-wrap">
          {['Messi', 'Xavi', 'Iniesta', 'Puyol', 'Busquets'].map((alum) => (
            <span key={alum} className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-1 text-xs font-semibold text-gold">
              {alum}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Community Overview ───────────────────────────────────────
function CommunityOverview() {
  return (
    <>
      <InfoCard title="Active Now" subtitle="Online" detail="2,412 members online" accent="text-gold" icon={Users} />
      <InfoCard title="Top Discussion" subtitle="Trending" detail="Match day thread: Man Utd vs Arsenal" accent="text-yellow-400" icon={Flame} />
      
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Community Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Members', value: '125K' },
            { label: 'Posts/Day', value: '340' },
            { label: 'Created', value: '2023' },
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
  const posts = [
    { content: 'Incredible performance from the lads today. The atmosphere at the stadium was unreal.', time: '2h ago', likes: 234, comments: 45 },
    { content: 'Match day preview: Key battles to watch, formation analysis, and predicted lineups.', time: '6h ago', likes: 567, comments: 89 },
    { content: 'Training session update: New tactical setup being tested ahead of the big game.', time: '1d ago', likes: 123, comments: 23 },
  ];
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, i) => (
        <article key={i} className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-black">SS</div>
            <div>
              <p className="text-sm font-bold text-white">SportSphere</p>
              <p className="text-xs text-muted-foreground">{post.time}</p>
            </div>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-foreground/90">{post.content}</p>
          <div className="flex items-center gap-4 border-t border-surface-border pt-3 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-gold transition-colors"><Heart className="h-3.5 w-3.5" /> {post.likes}</button>
            <button className="flex items-center gap-1 hover:text-gold transition-colors"><MessageCircle className="h-3.5 w-3.5" /> {post.comments}</button>
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
  const positions = ['All', 'GK', 'DEF', 'MID', 'FWD'];
  const squad = [
    { name: 'Onana', number: 1, pos: 'GK', nat: 'CMR' },
    { name: 'Dalot', number: 20, pos: 'RB', nat: 'POR' },
    { name: 'Martinez', number: 5, pos: 'CB', nat: 'ARG' },
    { name: 'Shaw', number: 23, pos: 'LB', nat: 'ENG' },
    { name: 'Mainoo', number: 37, pos: 'CM', nat: 'ENG' },
    { name: 'Bruno', number: 8, pos: 'CM', nat: 'POR' },
    { name: 'Garnacho', number: 17, pos: 'LW', nat: 'ARG' },
    { name: 'Rashford', number: 10, pos: 'ST', nat: 'ENG' },
    { name: 'Hojlund', number: 11, pos: 'ST', nat: 'DEN' },
  ];
  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {positions.map((pos, i) => (
          <button key={pos} className={cn('flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            i === 0 ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
            {pos}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {squad.map((p) => (
          <div key={p.number} className="glass-card rounded-xl p-3 glass-card-hover">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-bold text-gold">{p.number}</span>
              <span className="text-xs font-medium text-muted-foreground w-8">{p.nat}</span>
              <p className="flex-1 text-sm font-bold text-white">{p.name}</p>
              <span className="rounded-md bg-gold/10 border border-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">{p.pos}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fixtures Content ─────────────────────────────────────────
function FixturesContent() {
  const fixtures = [
    { home: 'Man Utd', away: 'Arsenal', date: 'Dec 14', time: '17:30', comp: 'PL' },
    { home: 'Wolves', away: 'Man Utd', date: 'Dec 21', time: '15:00', comp: 'PL' },
    { home: 'Man Utd', away: 'Newcastle', date: 'Dec 26', time: '15:00', comp: 'PL' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {fixtures.map((f, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden glass-card-hover">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{f.comp}</span>
            <span className="text-[10px] font-bold text-gold">{f.date}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <p className="flex-1 text-right text-sm font-bold text-white">{f.home}</p>
            <span className="mx-4 text-xs text-muted-foreground">{f.time}</span>
            <p className="flex-1 text-sm font-bold text-white">{f.away}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Results Content ──────────────────────────────────────────
function ResultsContent() {
  const results = [
    { home: 'Man Utd', away: 'Arsenal', hs: 2, as: 1 },
    { home: 'Tottenham', away: 'Man Utd', hs: 0, as: 3 },
    { home: 'Man Utd', away: 'Brighton', hs: 1, as: 0 },
  ];
  return (
    <div className="flex flex-col gap-2">
      {results.map((r, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center justify-between">
            <p className="flex-1 text-right text-sm font-bold text-white">{r.home}</p>
            <div className="mx-4 flex items-center gap-2">
              <span className={cn('text-xl font-black tabular-nums', r.hs > r.as ? 'text-gold' : 'text-white')}>{r.hs}</span>
              <span className="text-sm text-muted-foreground">–</span>
              <span className={cn('text-xl font-black tabular-nums', r.as > r.hs ? 'text-gold' : 'text-white')}>{r.as}</span>
            </div>
            <p className="flex-1 text-sm font-bold text-white">{r.away}</p>
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
      <div className="mb-2 grid grid-cols-[2rem_1fr_3rem_3rem] items-center px-2 text-[10px] font-bold uppercase text-muted-foreground">
        <span>#</span><span>Team</span><span className="text-right">GD</span><span className="text-right">Pts</span>
      </div>
      <div className="flex flex-col gap-1">
        {table.map((row) => (
          <div key={row.pos} className={cn(
            'grid grid-cols-[2rem_1fr_3rem_3rem] items-center rounded-xl px-2 py-3 border transition-colors',
            row.pos === 1 ? 'bg-gold/10 border-gold/30' : 'glass-card border-surface-border'
          )}>
            <span className={cn('text-sm font-black', row.pos === 1 ? 'text-gold' : row.pos <= 4 ? 'text-gold/70' : 'text-muted-foreground')}>
              {row.pos}
            </span>
            <span className="text-sm font-bold text-white">
              {row.team}
              {row.pos === 1 && <Crown className="ml-1 inline h-3 w-3 text-gold" />}
            </span>
            <span className="text-right text-xs text-muted-foreground">{row.gd}</span>
            <span className={cn('text-right text-sm font-black', row.pos === 1 ? 'text-gold' : 'text-white')}>{row.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Statistics Content ───────────────────────────────────────
function StatisticsContent() {
  const stats = [
    { label: 'Goals Scored', value: 34, max: 50 },
    { label: 'Goals Conceded', value: 14, max: 50 },
    { label: 'Clean Sheets', value: 7, max: 20 },
    { label: 'Possession Avg', value: 58, max: 100 },
    { label: 'Pass Accuracy', value: 87, max: 100 },
    { label: 'Win Rate', value: 73, max: 100 },
  ];
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
    <div className="flex flex-col gap-2">
      {[
        { title: 'Man Utd vs Arsenal', comp: 'Premier League', date: 'Dec 14', status: 'Upcoming' },
        { title: 'Man Utd vs Bayern Munich', comp: 'Champions League', date: 'Dec 10', status: 'Finished 2–1' },
        { title: 'Tottenham vs Man Utd', comp: 'Premier League', date: 'Dec 7', status: 'Finished 0–3' },
      ].map((m, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.comp} · {m.date}</p>
            </div>
            <span className={cn('text-xs font-medium', m.status === 'Upcoming' ? 'text-gold' : 'text-muted-foreground')}>{m.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline Content ─────────────────────────────────────────
function TimelineContent() {
  const events = [
    { min: 78, type: 'goal', text: 'Rashford fires in the winner! 2–1 Man Utd', team: 'home' },
    { min: 56, type: 'goal', text: 'Rashford equalizes! 1–1', team: 'home' },
    { min: 45, type: 'info', text: 'Second half begins', team: null },
    { min: 34, type: 'goal', text: 'Saka scores for Arsenal 0–1', team: 'away' },
    { min: 23, type: 'goal', text: 'Rashford opens the scoring! 1–0', team: 'home' },
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
  return (
    <div className="flex flex-col gap-2">
      {[
        { player: 'Leny Yoro', from: 'Lille', type: 'In', fee: '£58.9M' },
        { player: 'Joshua Zirkzee', from: 'Bologna', type: 'In', fee: '£42.5M' },
        { player: 'Scott McTominay', to: 'Napoli', type: 'Out', fee: '£25.7M' },
      ].map((t, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                t.type === 'In' ? 'bg-gold/20 text-gold' : 'bg-red-500/20 text-red-400')}>
                {t.type}
              </span>
              <div>
                <p className="text-sm font-bold text-white">{t.player}</p>
                <p className="text-xs text-muted-foreground">{t.from || t.to}</p>
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
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square glass-card rounded-xl flex items-center justify-center glass-card-hover">
          <Image className="h-5 w-5 text-muted-foreground/40" />
        </div>
      ))}
    </div>
  );
}

// ─── Videos Content ───────────────────────────────────────────
function VideosContent() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { title: 'Rashford Goal vs Arsenal', views: '1.2M', dur: '0:45', gradient: 'from-green-600 to-emerald-900' },
        { title: 'Training Session Highlights', views: '450K', dur: '2:30', gradient: 'from-blue-600 to-indigo-900' },
        { title: 'Match Analysis', views: '320K', dur: '5:12', gradient: 'from-purple-600 to-violet-900' },
        { title: 'Fan Cam: Best Moments', views: '780K', dur: '1:00', gradient: 'from-orange-600 to-red-900' },
      ].map((v, i) => (
        <div key={i} className={cn('relative flex aspect-video items-end justify-end overflow-hidden rounded-xl bg-gradient-to-b', v.gradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative p-2">
            <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{v.dur}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="line-clamp-1 text-xs font-bold text-white">{v.title}</p>
            <p className="text-[10px] text-white/60">{v.views} views</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fans Content ─────────────────────────────────────────────
function FansContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const fans = [
    { name: 'David Mbaza',    handle: '@davidmbaza',    avatar: 'DM' },
    { name: 'Sarah Chen',     handle: '@sarahchen',     avatar: 'SC' },
    { name: 'Marcus Johnson', handle: '@marcusj',       avatar: 'MJ' },
    { name: 'Goal Highlights',handle: '@goalsdaily',    avatar: 'GH' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {fans.map((fan) => {
        return (
          <button key={fan.handle} onClick={async () => { try { const res = await fetch(`/api/users?handle=${encodeURIComponent(fan.handle)}`); if(res.ok){const u=await res.json(); const {apiUserToViewing}=await import('@/types'); setViewingUser(apiUserToViewing(u,false));} } catch {} }}
            className="glass-card rounded-xl p-3 text-left glass-card-hover w-full">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold', fan.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                {fan.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{fan.name}</p>
                <p className="text-xs text-muted-foreground">{fan.handle}</p>
              </div>
              <span className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-1 text-xs font-bold text-gold">View</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Career Content ───────────────────────────────────────────
function CareerContent() {
  const { data: p, loading } = useProfileData<{ careerTimeline: { season: string; team: string; apps: number; goals: number; assists: number; honours: string[] }[] }>("player", "rashford");
  if (loading) return <ProfileDataSkeleton />;
  if (!p) return <EmptyCard message="Career data unavailable" />;
  const timeline = [...p.careerTimeline].reverse();
  return (
    <div className="flex flex-col gap-0">
      {timeline.map((item, i) => (
        <div key={item.season} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold bg-gold/10 flex-shrink-0">
              <span className="text-[9px] font-bold text-gold">{item.season.slice(0,4)}</span>
            </div>
            {i < timeline.length - 1 && <div className="w-px flex-1 bg-surface-border my-1" />}
          </div>
          <div className="flex-1 glass-card rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-white">{item.team}</p>
              <span className="text-xs text-muted-foreground">{item.season}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{item.apps} apps</span>
              <span className="text-gold font-semibold">{item.goals} goals</span>
              <span>{item.assists} assists</span>
            </div>
            {item.honours.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.honours.map((h) => (
                  <span key={h} className="rounded-md bg-gold/10 border border-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">🏆 {h}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Achievements Content ─────────────────────────────────────
function AchievementsContent() {
  const items = [
    { title: 'Golden Boot 24/25', desc: 'Top scorer with 25 goals', Icon: Trophy, unlocked: true },
    { title: '100 Caps', desc: '100 international appearances', Icon: Flag, unlocked: true },
    { title: 'UCL Winner', desc: 'Champions League 2023/24', Icon: Crown, unlocked: false },
    { title: 'Fan Favourite', desc: '10K+ followers', Icon: Heart, unlocked: true },
    { title: 'Player of the Month', desc: 'December 2024', Icon: Award, unlocked: true },
    { title: 'Team of the Year', desc: '2024 Selection', Icon: Medal, unlocked: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((a, i) => (
        <div key={i} className={cn('glass-card rounded-xl p-4 text-center glass-card-hover',
          a.unlocked ? 'border-gold/20' : 'opacity-50')}>
          <div className={cn('mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl',
            a.unlocked ? 'bg-gold/10' : 'bg-surface')}>
            <a.Icon className={cn('h-5 w-5', a.unlocked ? 'text-gold' : 'text-muted-foreground')} />
          </div>
          <p className="text-xs font-bold text-white">{a.title}</p>
          <p className="text-[10px] text-muted-foreground">{a.desc}</p>
          {a.unlocked ? (
            <span className="mt-2 inline-block rounded-full bg-gold/10 px-2 py-0.5 text-[8px] font-bold text-gold">Unlocked</span>
          ) : (
            <span className="mt-2 inline-block rounded-full bg-surface px-2 py-0.5 text-[8px] font-bold text-muted-foreground">Locked</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Events Content ───────────────────────────────────────────
function EventsContent() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { title: 'Match Day', date: 'Dec 14', location: 'Old Trafford', type: 'Match' },
        { title: 'Fan Meet & Greet', date: 'Dec 20', location: 'City Centre', type: 'Event' },
        { title: 'Academy Open Day', date: 'Jan 5', location: 'Training Ground', type: 'Open' },
      ].map((e, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 flex-shrink-0">
              <Calendar className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.date} · {e.location}</p>
            </div>
            <span className="rounded-lg bg-gold/10 border border-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">{e.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Polls Content ────────────────────────────────────────────
function PollsContent() {
  return (
    <div className="flex flex-col gap-3">
      {[
        { question: 'Who will win the match?', options: [{ label: 'Man Utd', pct: 55 }, { label: 'Arsenal', pct: 30 }, { label: 'Draw', pct: 15 }], total: '12.4K' },
        { question: 'Player of the Match?', options: [{ label: 'Rashford', pct: 72 }, { label: 'Saka', pct: 18 }, { label: 'Bruno', pct: 10 }], total: '8.9K' },
      ].map((poll, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 glass-card-hover">
          <p className="mb-3 text-sm font-bold text-white">{poll.question}</p>
          <div className="flex flex-col gap-2">
            {poll.options.map((opt, j) => (
              <button key={j} className="relative overflow-hidden rounded-lg bg-surface p-2.5 text-left">
                <div className="absolute inset-y-0 left-0 bg-gold/20" style={{ width: `${opt.pct}%` }} />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="text-xs font-bold text-gold">{opt.pct}%</span>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{poll.total} votes</p>
        </div>
      ))}
    </div>
  );
}

// ─── About Content ────────────────────────────────────────────
function AboutContent({ config }: { config: ProfileTypeConfig }) {
  const { mockData, label } = config;
  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-2 text-sm font-bold text-white">About</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{mockData.bio || `Official ${label.toLowerCase()} profile on SportSphere.`}</p>
      </div>
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 text-sm font-bold text-white">Details</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between py-1.5 border-b border-surface-border">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-bold text-gold">{label}</span>
          </div>
          {mockData.location && (
            <div className="flex items-center justify-between py-1.5 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium text-white">{mockData.location}</span>
            </div>
          )}
          {mockData.handle && (
            <div className="flex items-center justify-between py-1.5 border-b border-surface-border">
              <span className="text-sm text-muted-foreground">Handle</span>
              <span className="text-sm font-bold text-gold">{mockData.handle}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">On SportSphere since</span>
            <span className="text-sm font-medium text-white">{mockData.joined || '2023'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Content ─────────────────────────────────────────────
function ShopContent() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { name: 'Home Kit 24/25', price: '£89.99', gradient: 'from-red-600 to-red-800' },
        { name: 'Away Kit 24/25', price: '£89.99', gradient: 'from-blue-600 to-blue-800' },
        { name: 'Training Top', price: '£54.99', gradient: 'from-gray-600 to-gray-800' },
        { name: 'Scarf', price: '£24.99', gradient: 'from-red-500 to-yellow-600' },
      ].map((item, i) => (
        <div key={i} className="glass-card rounded-xl overflow-hidden glass-card-hover">
          <div className={cn('aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
            <span className="text-3xl font-black text-white/20">SS</span>
          </div>
          <div className="p-3">
            <p className="text-xs font-bold text-white">{item.name}</p>
            <p className="text-xs font-bold text-gold">{item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tickets Content ──────────────────────────────────────────
function TicketsContent() {
  return (
    <div className="flex flex-col gap-3">
      {[
        { match: 'Man Utd vs Arsenal', date: 'Dec 14', venue: 'Old Trafford', price: 'From £65', available: true },
        { match: 'Man Utd vs Newcastle', date: 'Dec 26', venue: 'Old Trafford', price: 'From £50', available: true },
        { match: 'Man Utd vs Liverpool', date: 'Jan 5', venue: 'Old Trafford', price: 'From £75', available: false },
      ].map((t, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-white">{t.match}</p>
              <p className="text-xs text-muted-foreground">{t.date} · {t.venue}</p>
              <p className="mt-1 text-sm font-bold text-gold">{t.price}</p>
            </div>
            <button className={cn('rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
              t.available ? 'bg-gold text-black hover:bg-gold/90' : 'bg-surface border border-surface-border text-muted-foreground')}>
              {t.available ? 'Buy' : 'Sold Out'}
            </button>
          </div>
        </div>
      ))}
    </div>
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
          <div key={i} onClick={async () => { if(!team.handle) return; try { const res = await fetch(`/api/users?handle=${encodeURIComponent(team.handle)}`); if(res.ok){const u=await res.json(); const {apiUserToViewing}=await import('@/types'); setViewingUser(apiUserToViewing(u,false));} } catch {} }}
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