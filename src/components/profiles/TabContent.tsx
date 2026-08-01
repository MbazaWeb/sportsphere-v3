'use client';

import { type ProfileTypeConfig } from './profileConfig';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { getFeedUser } from '@/data/feedData';
import {
  Heart, MessageCircle, Share2, Bookmark, Star, TrendingUp,
  MapPin, Clock, Trophy, Users, ChevronRight, Zap, Play,
  BarChart3, Target, Flag, Calendar, ArrowUpRight, FileText,
  CheckCircle, AlertCircle, Pen,
} from 'lucide-react';

interface TabContentProps { config: ProfileTypeConfig; tabId: string; }

export default function TabContent({ config, tabId }: TabContentProps) {
  return (
    <motion.div key={tabId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }} className="p-4">
      <TabContentInner config={config} tabId={tabId} />
    </motion.div>
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

function InfoCard({ title, subtitle, detail, accent }: { title: string; subtitle: string; detail: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
      <p className={cn('mt-1 text-sm font-medium', accent)}>{detail}</p>
    </div>
  );
}

function RecentActivity() {
  const items = [
    { icon: Pen, color: 'text-blue-400', bg: 'bg-blue-500/10', text: 'Posted a new update', time: '2h ago' },
    { icon: Trophy, color: 'text-sport-green', bg: 'bg-sport-green/10', text: 'Match result: Won 2-1', time: '5h ago' },
    { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', text: 'New fan joined', time: '1d ago' },
  ];
  return (
    <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Recent Activity</h3>
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

function OverviewContent({ config }: { config: ProfileTypeConfig }) {
  const { id } = config;
  return (
    <div className="flex flex-col gap-4">
      {id === 'team'        && <TeamOverview />}
      {id === 'competition' && <CompetitionOverview />}
      {id === 'match'       && <MatchOverview />}
      {id === 'player'      && <PlayerOverview />}
      {id === 'coach'       && <CoachOverview />}
      {id === 'stadium'     && <StadiumOverview />}
      {id === 'community'   && <CommunityOverview />}
      {id === 'fan'         && <FanOverview />}
      {!['team','competition','match','player','coach','stadium','community','fan'].includes(id) && (
        <GenericOverview config={config} />
      )}
      <RecentActivity />
    </div>
  );
}

function TeamOverview() {
  return (
    <>
      <InfoCard title="Next Match" subtitle="Premier League — Matchday 16" detail="Arsenal (A) · Dec 14, 17:30" accent="text-sport-green" />
      <InfoCard title="Current Form" subtitle="Last 5 matches" detail="W W D W L" accent="text-yellow-400" />
      <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Top Performers</h3>
        <div className="flex flex-col gap-3">
          {[
            { name: 'Rashford', stat: '8 Goals', initials: 'MR' },
            { name: 'Bruno Fernandes', stat: '7 Assists', initials: 'BF' },
            { name: 'Onana', stat: '4 Clean Sheets', initials: 'AO' },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-bold text-sport-green">{p.initials}</div>
              <p className="flex-1 text-sm font-medium text-white">{p.name}</p>
              <span className="text-xs text-muted-foreground">{p.stat}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CompetitionOverview() {
  return (
    <>
      <InfoCard title="Current Leader" subtitle="After Matchday 15" detail="Manchester City · 38 pts" accent="text-sport-green" />
      <InfoCard title="Top Scorer" subtitle="Golden Boot Race" detail="Haaland · 15 goals" accent="text-yellow-400" />
      <InfoCard title="Next Fixtures" subtitle="Matchday 16" detail="8 matches this weekend" accent="text-blue-400" />
    </>
  );
}

function MatchOverview() {
  return (
    <>
      <div className="rounded-2xl bg-surface-elevated border border-surface-border p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold uppercase text-red-400">Live · 78:45</span>
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">MU</div>
            <p className="text-sm font-semibold text-white">Man Utd</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-sport-green">2</span>
            <span className="text-xl text-muted-foreground">–</span>
            <span className="text-3xl font-bold text-white">1</span>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">AR</div>
            <p className="text-sm font-semibold text-white">Arsenal</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
          <span>Rashford 23&apos;, 56&apos;</span>
          <span>Saka 34&apos;</span>
        </div>
      </div>
      <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Player of the Match</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sport-green text-sm font-bold text-black">MR</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Marcus Rashford</p>
            <p className="text-xs text-muted-foreground">2 Goals · 3 Key Passes · 89% Pass Acc.</p>
          </div>
          <button className="rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">Vote</button>
        </div>
      </div>
    </>
  );
}

function PlayerOverview() {
  return (
    <>
      <InfoCard title="Season Stats" subtitle="2024/25 Premier League" detail="12 Goals, 5 Assists in 18 apps" accent="text-sport-green" />
      <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Performance Index</h3>
        {[
          { label: 'Goals per 90', value: 0.67, max: 1.0 },
          { label: 'Dribbles Success', value: 72, max: 100 },
          { label: 'Pass Accuracy', value: 84, max: 100 },
        ].map((stat) => (
          <div key={stat.label} className="mb-3 last:mb-0">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-xs font-bold text-white">{stat.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-sport-green" style={{ width: `${(stat.value / stat.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CoachOverview() {
  return (
    <>
      <InfoCard title="Current Team" subtitle="Since 2024" detail="Manchester City · Win Rate 73%" accent="text-sport-green" />
      <InfoCard title="Preferred Formation" subtitle="Most Used" detail="4-3-3  (68% of matches)" accent="text-blue-400" />
    </>
  );
}

function StadiumOverview() {
  return (
    <>
      <InfoCard title="Next Event" subtitle="Dec 14" detail="Man Utd vs Arsenal · PL" accent="text-sport-green" />
      <InfoCard title="Facilities" subtitle="Available" detail="Parking, VIP Boxes, Museum" accent="text-blue-400" />
    </>
  );
}

function CommunityOverview() {
  return (
    <>
      <InfoCard title="Active Now" subtitle="Online" detail="2,412 members online" accent="text-sport-green" />
      <InfoCard title="Top Discussion" subtitle="Trending" detail="Match day thread: Man Utd vs Arsenal" accent="text-yellow-400" />
    </>
  );
}

function FanOverview() {
  return (
    <>
      <InfoCard title="Prediction Accuracy" subtitle="This Season" detail="89% · Top 5% of fans" accent="text-sport-green" />
      <InfoCard title="Favourite Team" subtitle="Supporting" detail="Manchester United" accent="text-red-400" />
    </>
  );
}

function GenericOverview({ config }: { config: ProfileTypeConfig }) {
  return (
    <>
      <InfoCard title="About" subtitle={config.mockData.role || config.label}
        detail={config.mockData.bio || `${config.mockData.name} profile`} accent="text-sport-green" />
      {config.mockData.location && (
        <InfoCard title="Location" subtitle="Based in" detail={config.mockData.location} accent="text-blue-400" />
      )}
    </>
  );
}

function FeedContent() {
  const posts = [
    { content: 'Incredible performance from the lads today. The atmosphere at the stadium was unreal.', time: '2h ago', likes: 234, comments: 45 },
    { content: 'Match day preview: Key battles to watch, formation analysis, and predicted lineups.', time: '6h ago', likes: 567, comments: 89 },
    { content: 'Training session update: New tactical setup being tested ahead of the big game.', time: '1d ago', likes: 123, comments: 23 },
  ];
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, i) => (
        <article key={i} className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sport-green text-xs font-bold text-black">SS</div>
            <div>
              <p className="text-sm font-semibold text-white">SportSphere</p>
              <p className="text-xs text-muted-foreground">{post.time}</p>
            </div>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-foreground/90">{post.content}</p>
          <div className="flex items-center gap-4 border-t border-surface-border pt-3 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-sport-green transition-colors"><Heart className="h-3.5 w-3.5" /> {post.likes}</button>
            <button className="flex items-center gap-1 hover:text-sport-green transition-colors"><MessageCircle className="h-3.5 w-3.5" /> {post.comments}</button>
            <button className="hover:text-sport-green transition-colors"><Share2 className="h-3.5 w-3.5" /></button>
            <button className="ml-auto hover:text-sport-green transition-colors"><Bookmark className="h-3.5 w-3.5" /></button>
          </div>
        </article>
      ))}
    </div>
  );
}

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
            i === 0 ? 'bg-sport-green text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
            {pos}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {squad.map((p) => (
          <div key={p.number} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{p.number}</span>
            <span className="text-xs font-medium text-muted-foreground w-8">{p.nat}</span>
            <p className="flex-1 text-sm font-semibold text-white">{p.name}</p>
            <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{p.pos}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixturesContent() {
  const fixtures = [
    { home: 'Man Utd', away: 'Arsenal', date: 'Dec 14', time: '17:30', comp: 'PL' },
    { home: 'Wolves', away: 'Man Utd', date: 'Dec 21', time: '15:00', comp: 'PL' },
    { home: 'Man Utd', away: 'Newcastle', date: 'Dec 26', time: '15:00', comp: 'PL' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {fixtures.map((f, i) => (
        <div key={i} className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{f.comp}</span>
            <span className="text-[10px] text-sport-green">{f.date}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <p className="flex-1 text-right text-sm font-semibold text-white">{f.home}</p>
            <span className="mx-4 text-xs text-muted-foreground">{f.time}</span>
            <p className="flex-1 text-sm font-semibold text-white">{f.away}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsContent() {
  const results = [
    { home: 'Man Utd', away: 'Arsenal', hs: 2, as: 1 },
    { home: 'Tottenham', away: 'Man Utd', hs: 0, as: 3 },
    { home: 'Man Utd', away: 'Brighton', hs: 1, as: 0 },
  ];
  return (
    <div className="flex flex-col gap-2">
      {results.map((r, i) => (
        <div key={i} className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
          <div className="flex items-center justify-between">
            <p className="flex-1 text-right text-sm font-semibold text-white">{r.home}</p>
            <div className="mx-4 flex items-center gap-2">
              <span className={cn('text-xl font-bold tabular-nums', r.hs > r.as ? 'text-sport-green' : 'text-white')}>{r.hs}</span>
              <span className="text-sm text-muted-foreground">–</span>
              <span className={cn('text-xl font-bold tabular-nums', r.as > r.hs ? 'text-sport-green' : 'text-white')}>{r.as}</span>
            </div>
            <p className="flex-1 text-sm font-semibold text-white">{r.away}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
      <div className="mb-2 grid grid-cols-[2rem_1fr_3rem_3rem] items-center px-2 text-[10px] font-semibold uppercase text-muted-foreground">
        <span>#</span><span>Team</span><span className="text-right">GD</span><span className="text-right">Pts</span>
      </div>
      <div className="flex flex-col gap-1">
        {table.map((row) => (
          <div key={row.pos} className="grid grid-cols-[2rem_1fr_3rem_3rem] items-center rounded-xl bg-surface-elevated border border-surface-border px-2 py-3">
            <span className={cn('text-sm font-bold', row.pos <= 4 ? 'text-sport-green' : 'text-muted-foreground')}>{row.pos}</span>
            <span className="text-sm font-semibold text-white">{row.team}</span>
            <span className="text-right text-xs text-muted-foreground">{row.gd}</span>
            <span className="text-right text-sm font-bold text-white">{row.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <div key={s.label} className="rounded-xl bg-surface-elevated border border-surface-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="text-sm font-bold text-white">{s.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-sport-green transition-all" style={{ width: `${(s.value / s.max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchesContent() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { title: 'Man Utd vs Arsenal', comp: 'Premier League', date: 'Dec 14', status: 'Upcoming' },
        { title: 'Man Utd vs Bayern Munich', comp: 'Champions League', date: 'Dec 10', status: 'Finished 2–1' },
        { title: 'Tottenham vs Man Utd', comp: 'Premier League', date: 'Dec 7', status: 'Finished 0–3' },
      ].map((m, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-3">
          <div>
            <p className="text-sm font-semibold text-white">{m.title}</p>
            <p className="text-xs text-muted-foreground">{m.comp} · {m.date}</p>
          </div>
          <span className={cn('text-xs font-medium', m.status === 'Upcoming' ? 'text-sport-green' : 'text-muted-foreground')}>{m.status}</span>
        </div>
      ))}
    </div>
  );
}

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
              e.type === 'goal' ? 'border-sport-green bg-sport-green/20' : 'border-surface-border bg-surface')}>
              <span className={cn('text-[10px] font-bold', e.type === 'goal' ? 'text-sport-green' : 'text-muted-foreground')}>{e.min}&apos;</span>
            </div>
            {i < events.length - 1 && <div className="w-px flex-1 bg-surface-border my-1" />}
          </div>
          <div className={cn('flex-1 rounded-xl p-3 mb-2',
            e.type === 'goal' ? 'bg-sport-green/10 border border-sport-green/20' : 'bg-surface-elevated border border-surface-border')}>
            <p className={cn('text-sm', e.type === 'goal' ? 'font-semibold text-sport-green' : 'text-foreground/80')}>{e.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineupsContent() {
  return <SimpleList items={['Onana (GK)', 'Dalot (RB)', 'Martinez (CB)', 'Shaw (LB)', 'Mainoo (CM)', 'Bruno (CM)', 'Garnacho (LW)', 'Rashford (ST)', 'Hojlund (ST)']} title="Starting XI" />;
}

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
        <div key={i} className="flex gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
          <span className="text-xs font-bold text-sport-green mt-0.5">{c.min}&apos;</span>
          <p className="text-sm text-foreground/80">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function TransfersContent() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { player: 'Leny Yoro', from: 'Lille', type: 'In', fee: '£58.9M' },
        { player: 'Joshua Zirkzee', from: 'Bologna', type: 'In', fee: '£42.5M' },
        { player: 'Scott McTominay', to: 'Napoli', type: 'Out', fee: '£25.7M' },
      ].map((t, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-3">
          <div className="flex items-center gap-3">
            <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold',
              t.type === 'In' ? 'bg-sport-green/20 text-sport-green' : 'bg-red-500/20 text-red-400')}>
              {t.type}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{t.player}</p>
              <p className="text-xs text-muted-foreground">{t.from || t.to}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{t.fee}</span>
        </div>
      ))}
    </div>
  );
}

function MediaContent() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
          <Play className="h-5 w-5 text-muted-foreground/40" />
        </div>
      ))}
    </div>
  );
}

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
            <p className="line-clamp-1 text-xs font-semibold text-white">{v.title}</p>
            <p className="text-[10px] text-white/60">{v.views} views</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
        const user = getFeedUser(fan.handle);
        return (
          <button key={fan.handle} onClick={() => user && setViewingUser(user)}
            className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3 text-left hover:border-sport-green/20 transition-colors w-full">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold', user?.verified ? 'bg-sport-green text-black' : 'bg-surface text-white')}>
              {fan.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{fan.name}</p>
              <p className="text-xs text-muted-foreground">{fan.handle}</p>
            </div>
            <span className="rounded-lg bg-surface border border-surface-border px-3 py-1 text-xs text-muted-foreground">View</span>
          </button>
        );
      })}
    </div>
  );
}

function CareerContent() {
  return (
    <div className="flex flex-col gap-0">
      {[
        { year: '2024–Now', team: 'Manchester United', role: 'Forward' },
        { year: '2022–2024', team: 'Man Utd (Loan · Sunderland)', role: 'Forward' },
        { year: '2020–2022', team: 'Man Utd U23', role: 'Forward' },
        { year: '2017–2020', team: 'Man Utd Academy', role: 'Youth' },
      ].map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-sport-green bg-sport-green/20">
              <span className="text-[9px] font-bold text-sport-green">{item.year.slice(0, 4)}</span>
            </div>
            {i < 3 && <div className="w-px flex-1 bg-surface-border my-1" />}
          </div>
          <div className="flex-1 rounded-xl bg-surface-elevated border border-surface-border p-3 mb-2">
            <p className="text-sm font-semibold text-white">{item.team}</p>
            <p className="text-xs text-muted-foreground">{item.role} · {item.year}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AchievementsContent() {
  const items = [
    { title: 'Golden Boot 24/25', desc: 'Top scorer with 25 goals', Icon: Trophy, unlocked: true },
    { title: '100 Caps', desc: '100 international appearances', Icon: Flag, unlocked: true },
    { title: 'UCL Winner', desc: 'Champions League 2023/24', Icon: Star, unlocked: false },
    { title: 'Fan Favourite', desc: '10K+ followers', Icon: Heart, unlocked: true },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((a, i) => (
        <div key={i} className={cn('rounded-xl border p-4 text-center', a.unlocked ? 'bg-surface-elevated border-surface-border' : 'bg-surface border-surface-border/50 opacity-50')}>
          <div className={cn('mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl', a.unlocked ? 'bg-sport-green/10' : 'bg-surface')}>
            <a.Icon className={cn('h-5 w-5', a.unlocked ? 'text-sport-green' : 'text-muted-foreground')} />
          </div>
          <p className="text-xs font-semibold text-white">{a.title}</p>
          <p className="text-[10px] text-muted-foreground">{a.desc}</p>
        </div>
      ))}
    </div>
  );
}

function EventsContent() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { title: 'Match Day', date: 'Dec 14', location: 'Old Trafford', type: 'Match' },
        { title: 'Fan Meet & Greet', date: 'Dec 20', location: 'City Centre', type: 'Event' },
        { title: 'Academy Open Day', date: 'Jan 5', location: 'Training Ground', type: 'Open' },
      ].map((e, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface flex-shrink-0">
            <Calendar className="h-5 w-5 text-sport-green" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.date} · {e.location}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

function PollsContent() {
  return (
    <div className="flex flex-col gap-3">
      {[
        { question: 'Who will win the match?', options: [{ label: 'Man Utd', pct: 55 }, { label: 'Arsenal', pct: 30 }, { label: 'Draw', pct: 15 }], total: '12.4K' },
        { question: 'Player of the Match?', options: [{ label: 'Rashford', pct: 72 }, { label: 'Saka', pct: 18 }, { label: 'Bruno', pct: 10 }], total: '8.9K' },
      ].map((poll, i) => (
        <div key={i} className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
          <p className="mb-3 text-sm font-semibold text-white">{poll.question}</p>
          <div className="flex flex-col gap-2">
            {poll.options.map((opt, j) => (
              <button key={j} className="relative overflow-hidden rounded-lg bg-surface p-2.5 text-left">
                <div className="absolute inset-y-0 left-0 bg-sport-green/20" style={{ width: `${opt.pct}%` }} />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{opt.pct}%</span>
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

function AboutContent({ config }: { config: ProfileTypeConfig }) {
  const { mockData, label } = config;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
        <h3 className="mb-2 text-sm font-semibold text-white">About</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{mockData.bio || `Official ${label.toLowerCase()} profile on SportSphere.`}</p>
      </div>
      <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Details</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium text-white">{label}</span>
          </div>
          {mockData.location && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium text-white">{mockData.location}</span>
            </div>
          )}
          {mockData.handle && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Handle</span>
              <span className="text-sm font-medium text-sport-green">{mockData.handle}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">On SportSphere since</span>
            <span className="text-sm font-medium text-white">{mockData.joined || '2023'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopContent() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { name: 'Home Kit 24/25', price: '£89.99', gradient: 'from-red-600 to-red-800' },
        { name: 'Away Kit 24/25', price: '£89.99', gradient: 'from-blue-600 to-blue-800' },
        { name: 'Training Top', price: '£54.99', gradient: 'from-gray-600 to-gray-800' },
        { name: 'Scarf', price: '£24.99', gradient: 'from-red-500 to-yellow-600' },
      ].map((item, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-surface-border">
          <div className={cn('aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
            <span className="text-3xl font-black text-white/20">SS</span>
          </div>
          <div className="bg-surface-elevated p-3">
            <p className="text-xs font-semibold text-white">{item.name}</p>
            <p className="text-xs text-sport-green font-bold">{item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketsContent() {
  return (
    <div className="flex flex-col gap-3">
      {[
        { match: 'Man Utd vs Arsenal', date: 'Dec 14', venue: 'Old Trafford', price: 'From £65', available: true },
        { match: 'Man Utd vs Newcastle', date: 'Dec 26', venue: 'Old Trafford', price: 'From £50', available: true },
        { match: 'Man Utd vs Liverpool', date: 'Jan 5', venue: 'Old Trafford', price: 'From £75', available: false },
      ].map((t, i) => (
        <div key={i} className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{t.match}</p>
              <p className="text-xs text-muted-foreground">{t.date} · {t.venue}</p>
              <p className="mt-1 text-sm font-bold text-sport-green">{t.price}</p>
            </div>
            <button className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              t.available ? 'bg-sport-green text-black hover:bg-sport-green/90' : 'bg-surface border border-surface-border text-muted-foreground')}>
              {t.available ? 'Buy' : 'Sold Out'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsContent() {
  return (
    <div className="flex flex-col gap-3">
      {[
        { title: 'Breaking: Major transfer confirmed', source: 'SportSphere', time: '5m ago' },
        { title: 'Match preview: Key tactical battles', source: 'Analysis', time: '30m ago' },
        { title: 'Injury update ahead of the weekend', source: 'Medical Team', time: '2h ago' },
      ].map((n, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface flex-shrink-0">
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.source} · {n.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingsContent() {
  return (
    <div className="flex flex-col gap-1">
      {[
        { rank: 1, team: 'Argentina', pts: '1845' },
        { rank: 2, team: 'France', pts: '1838' },
        { rank: 3, team: 'England', pts: '1790' },
        { rank: 4, team: 'Brazil', pts: '1782' },
      ].map((r, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
          <span className={cn('w-6 text-center text-sm font-bold', r.rank <= 3 ? 'text-sport-green' : 'text-muted-foreground')}>{r.rank}</span>
          <span className="flex-1 text-sm font-semibold text-white">{r.team}</span>
          <span className="text-xs text-muted-foreground">{r.pts} pts</span>
        </div>
      ))}
    </div>
  );
}

function SimpleList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted-foreground">{i + 1}</div>
          <span className="flex-1 text-sm font-medium text-white">{item}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </div>
      ))}
    </div>
  );
}

function PlaceholderContent({ tabId, subtitle }: { tabId: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated">
        <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-semibold text-white capitalize">{tabId.replace(/-/g, ' ')}</p>
      <p className="mt-1 text-xs text-muted-foreground text-center">{subtitle || 'Content coming soon'}</p>
    </div>
  );
}

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
        const user = team.handle ? getFeedUser(team.handle) : null;
        return (
          <div key={i} onClick={() => user && setViewingUser(user)}
            className={cn('flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3', user && 'cursor-pointer hover:border-sport-green/20 transition-colors')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-bold text-white">{i + 1}</div>
            <p className="flex-1 text-sm font-semibold text-white">{team.name}</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
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
