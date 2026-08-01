'use client';

import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { getFeedUser, HOME_FEED, SPOTLIGHT_FEED } from '@/data/feedData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Zap, Shield, X, Send, ChevronDown, Trophy, Sparkles, Flame, Crown } from 'lucide-react';
import type { HomeSubTab } from '@/store/navigationStore';
import { useState, useRef } from 'react';

const SUBTABS: { id: HomeSubTab; label: string }[] = [
  { id: 'for-you',   label: 'For You'   },
  { id: 'trending',  label: 'Trending'  },
  { id: 'spotlight', label: 'Spotlight' },
];

// --- Share Sheet -----------------------------------------------
function ShareSheet({ onClose }: { onClose: () => void }) {
  const options = ['Copy Link', 'Share to Story', 'Send as Message', 'Twitter/X', 'WhatsApp'];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        exit={{ y: 200 }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl bg-surface-elevated border-t border-surface-border p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-border" />
        <h3 className="mb-4 text-sm font-bold text-white">Share</h3>
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <button key={opt} onClick={onClose}
              className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-surface transition-colors text-left">
              {opt}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-surface py-3 text-sm font-semibold text-muted-foreground">Cancel</button>
      </motion.div>
    </div>
  );
}

// --- Comment Sheet ---------------------------------------------
function CommentSheet({ itemId, onClose }: { itemId: number; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [text, setText] = useState('');
  const [comments, setComments] = useState([
    { id: 1, user: 'Sarah Chen', avatar: 'SC', text: 'Absolutely class! ??', time: '2m', likes: 45 },
    { id: 2, user: 'Marcus J',   avatar: 'MJ', text: 'Rashford is back to his best this season', time: '5m', likes: 23 },
    { id: 3, user: 'GK Union',   avatar: 'GU', text: 'What a performance ??', time: '12m', likes: 12 },
  ]);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const handleSubmit = () => {
    if (!isAuthenticated) { onClose(); setLoginModalOpen(true); return; }
    if (!text.trim()) return;
    setComments(prev => [{ id: Date.now(), user: 'You', avatar: 'ME', text, time: 'now', likes: 0 }, ...prev]);
    setText('');
  };

  const handleReply = (commentId: number) => {
    if (!isAuthenticated) { onClose(); setLoginModalOpen(true); return; }
    const r = replies[commentId];
    if (!r?.trim()) return;
    setReplies(prev => ({ ...prev, [commentId]: '' }));
    setReplyingTo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[75vh] w-full max-w-lg flex-col rounded-t-3xl bg-surface-elevated border-t border-surface-border"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-border">
          <div className="mx-auto h-1 w-10 rounded-full bg-surface-border absolute top-3 left-1/2 -translate-x-1/2" />
          <h3 className="text-sm font-bold text-white">Comments</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-gold">
                {c.avatar}
              </div>
              <div className="flex-1">
                <div className="rounded-2xl bg-surface px-3 py-2">
                  <p className="text-xs font-semibold text-white mb-0.5">{c.user}</p>
                  <p className="text-sm text-foreground/90">{c.text}</p>
                </div>
                <div className="mt-1 flex items-center gap-4 px-1">
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  <button className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors">
                    {c.likes} likes
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors">
                    Reply
                  </button>
                </div>
                {replyingTo === c.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input value={replies[c.id] ?? ''} onChange={(e) => setReplies(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder={`Reply to ${c.user}...`} autoFocus
                      className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
                    <button onClick={() => handleReply(c.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gold">
                      <Send className="h-3 w-3 text-black" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 border-t border-surface-border p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-black flex-shrink-0">ME</div>
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment...'}
            className="flex-1 rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
          <button onClick={handleSubmit} disabled={!text.trim()}
            className={cn('flex h-9 w-9 items-center justify-center rounded-full transition-colors flex-shrink-0',
              text.trim() ? 'bg-gold' : 'bg-surface border border-surface-border')}>
            <Send className={cn('h-4 w-4', text.trim() ? 'text-black' : 'text-muted-foreground')} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main HomeTab ----------------------------------------------
export default function HomeTab() {
  const homeSubTab    = useNavigationStore((s) => s.homeSubTab);
  const setHomeSubTab = useNavigationStore((s) => s.setHomeSubTab);
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [shareId, setShareId] = useState<number | null>(null);
  const [commentId, setCommentId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-black text-gold-gradient">SportSphere</h1>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold animate-pulse" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {SUBTABS.map((tab) => (
            <button key={tab.id} onClick={() => setHomeSubTab(tab.id)}
              className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                homeSubTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <motion.div key={homeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {homeSubTab === 'for-you'   && <ForYouContent onShare={setShareId} onComment={setCommentId} />}
        {homeSubTab === 'trending'  && <TrendingContent />}
        {homeSubTab === 'spotlight' && <SpotlightContent />}
      </motion.div>

      <AnimatePresence>
        {shareId !== null && <ShareSheet onClose={() => setShareId(null)} />}
        {commentId !== null && <CommentSheet itemId={commentId} onClose={() => setCommentId(null)} />}
      </AnimatePresence>
    </div>
  );
}

// --- For You --------------------------------------------------
function ForYouContent({ onShare, onComment }: { onShare: (id: number) => void; onComment: (id: number) => void }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-gold">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            <span className="text-[10px] font-bold uppercase text-white/80 tracking-wider">Today's Match Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">
            Come hang out with <br />
            <span className="text-black">Atlanta Sports</span>
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-1">
              {['??', '??', '??', '??'].map((emoji, i) => (
                <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/20 bg-black/20 text-[8px]">
                  {emoji}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-semibold text-white/80">12.4K fans online</span>
          </div>
        </div>
      </div>

      {/* Match Intelligence Card */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Today's Match Intelligence</h3>
          </div>
          <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20">MU</div>
            <p className="text-xs font-semibold text-white">Man Utd</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-gold">2</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-2xl font-black text-white">1</span>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20">AR</div>
            <p className="text-xs font-semibold text-white">Arsenal</p>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> Rashford 23'</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> Saka 34'</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> Rashford 56'</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2">
          <span className="text-[10px] text-muted-foreground">78' · Premier League</span>
          <span className="flex h-5 items-center rounded-full bg-gold/10 px-2 text-[10px] font-bold text-gold">LIVE</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Leaderboard</h3>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { rank: 1, name: 'Michael Brown', team: 'RKS 2018', points: '9+', avatar: 'MB', color: 'text-gold' },
            { rank: 2, name: 'Sarah Chen', team: 'Phoenix FC', points: '7+', avatar: 'SC', color: 'text-muted-foreground' },
            { rank: 3, name: 'Marcus J', team: 'United FC', points: '5+', avatar: 'MJ', color: 'text-muted-foreground' },
          ].map((item) => (
            <div key={item.rank} className="flex items-center gap-3 rounded-xl bg-surface p-2.5">
              <span className={cn('w-5 text-center text-sm font-black', item.color)}>{item.rank}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">{item.avatar}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.team}</p>
              </div>
              <span className="text-sm font-bold text-gold">{item.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Choose Your Teams */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Choose Your Teams</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['Alex', 'Sydney', 'Emma', 'Chris', 'Jordan', 'Taylor', 'Riley', 'Morgan'].map((name) => (
            <button key={name} className="flex-shrink-0 rounded-xl bg-surface border border-surface-border px-4 py-2 text-sm font-medium text-white hover:border-gold/30 transition-colors">
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Posts */}
      {HOME_FEED.map((item) => <FeedCard key={item.id} item={item} onShare={onShare} onComment={onComment} />)}
    </div>
  );
}

// --- Feed Card ------------------------------------------------
function FeedCard({ item, onShare, onComment }: {
  item: typeof HOME_FEED[number];
  onShare: (id: number) => void;
  onComment: (id: number) => void;
}) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = getFeedUser(item.handle);
  if (!user) return null;

  const handleSave = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    setSaved(!saved);
  };

  return (
    <article className="glass-card rounded-2xl overflow-hidden glass-card-hover">
      {item.breaking && (
        <div className="flex items-center gap-2 border-b border-gold/20 bg-gold/5 px-4 py-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-gold">Breaking</span>
        </div>
      )}
      <div className="p-4">
        {/* User header */}
        <button onClick={() => setViewingUser(user)} className="mb-3 flex items-center gap-3 text-left w-full">
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            user.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
            {user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              {user.verified && <Shield className="h-3.5 w-3.5 text-gold" />}
            </div>
            <span className="text-xs text-muted-foreground">{user.handle} · {item.time}</span>
          </div>
        </button>

        <p className="mb-3 text-sm leading-relaxed text-foreground/90">{item.content}</p>

        {'tag' in item && item.tag && (
          <button onClick={() => { const h = (item.tag as any).handle; if (h) { const u = getFeedUser(h); if (u) setViewingUser(u); } }}
            className={cn('mb-3 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium border transition-all active:scale-95',
              (item.tag as any).type === 'team' ? 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20')}>
            {(item.tag as any).label}
          </button>
        )}

        {/* Photo */}
        {item.type === 'photo' && (
          <div className="mb-3 h-52 overflow-hidden rounded-xl bg-gradient-to-br from-gold via-orange-600 to-red-800 flex items-end p-3">
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">Emirates Stadium · Match Day</span>
          </div>
        )}

        {/* Video */}
        {item.type === 'video' && (
          <div className="mb-3 relative h-52 overflow-hidden rounded-xl bg-gradient-to-br from-gold to-red-800 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
            </div>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">2:34</span>
          </div>
        )}

        {/* Poll */}
        {'poll' in item && item.poll && (
          <div className="mb-3 flex flex-col gap-2">
            {(item.poll as {label:string;pct:number}[]).map((opt, i) => (
              <button key={i} className="relative overflow-hidden rounded-lg bg-surface p-3 text-left">
                <div className="absolute inset-y-0 left-0 bg-gold/20 rounded-lg" style={{ width: `${opt.pct}%` }} />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="text-xs font-bold text-muted-foreground">{opt.pct}%</span>
                </div>
              </button>
            ))}
            <p className="text-xs text-muted-foreground">{'pollTotal' in item ? (item.pollTotal as number).toLocaleString() : ''} votes</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-1">
          <button onClick={() => setLiked(!liked)}
            className={cn('flex items-center gap-1.5 transition-colors', liked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400')}>
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="text-xs">{formatCount(item.likes + (liked ? 1 : 0))}</span>
          </button>
          <button onClick={() => onComment(item.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.comments)}</span>
          </button>
          <button onClick={() => onShare(item.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors">
            <Share2 className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.shares)}</span>
          </button>
          <button onClick={handleSave}
            className={cn('transition-colors', saved ? 'text-gold' : 'text-muted-foreground hover:text-gold')}>
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>
    </article>
  );
}

// --- Trending -------------------------------------------------
function TrendingContent() {
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);

  const handleJoin = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
  };

  const topics = [
    { t: '#PremierLeague', posts: '24.5K', hot: true },
    { t: '#Haaland',       posts: '18.2K', hot: true },
    { t: '#TransferWindow',posts: '15.8K', hot: false },
    { t: '#Arsenal',       posts: '12.3K', hot: false },
    { t: '#AFCON2025',     posts: '9.7K',  hot: true },
    { t: '#UCL',           posts: '8.1K',  hot: false },
  ];

  const communities = [
    { name: 'Gooners',    members: '125K' },
    { name: 'Red Devils', members: '98K'  },
    { name: 'GK Union',   members: '67.8K'},
  ];

  return (
    <div className="p-4 flex flex-col gap-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" /> Live Now
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[
            { match: 'Man Utd 2–1 Arsenal', league: 'PL', min: "78'" },
            { match: 'Real Madrid 1–1 Barca', league: 'La Liga', min: 'HT' },
            { match: 'Inter 0–0 AC Milan', league: 'Serie A', min: "34'" },
          ].map((m, i) => (
            <div key={i} className="flex-shrink-0 glass-card rounded-xl p-3 min-w-[175px] glass-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-gold">{m.league} · {m.min}</span>
              </div>
              <p className="text-sm font-semibold text-white">{m.match}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-gold" /> Trending
        </h2>
        <div className="flex flex-col gap-2">
          {topics.map((item, i) => (
            <div key={i} className="flex items-center justify-between glass-card rounded-xl p-4 glass-card-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                  {item.hot ? <Flame className="h-4 w-4 text-gold" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold text-white">{item.t}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.posts} posts</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Communities</h2>
        <div className="flex flex-col gap-2">
          {communities.map((c, i) => (
            <div key={i} className="flex items-center justify-between glass-card rounded-xl p-4 glass-card-hover">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.members} members</p>
              </div>
              <button onClick={handleJoin}
                className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors">
                Join
              </button>
            </div>
          ))}
        </div>
        {!isAuthenticated && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <button onClick={() => setLoginModalOpen(true)} className="text-gold hover:underline">Sign in</button> to join communities
          </p>
        )}
      </section>
    </div>
  );
}

// --- Spotlight -------------------------------------------------
function SpotlightContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleLike = (id: number) => {
    setLikedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div ref={containerRef} className="h-[calc(100vh-8rem)] overflow-y-auto snap-y snap-mandatory scrollbar-hide">
      {SPOTLIGHT_FEED.map((item, index) => {
        const user = getFeedUser(item.handle);
        const liked = likedItems.has(item.id);
        return (
          <div key={item.id} className="relative h-[calc(100vh-8rem)] w-full snap-start snap-always flex-shrink-0 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-b ${item.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <div className="ml-1.5 h-0 w-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white" />
              </div>
            </div>

            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
              {user && (
                <button onClick={() => setViewingUser(user)} className="flex flex-col items-center gap-1">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold text-sm font-bold',
                    user.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                    {user.avatar}
                  </div>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold -mt-3">
                    <span className="text-[10px] font-bold text-black">+</span>
                  </div>
                </button>
              )}

              <button onClick={() => toggleLike(item.id)} className="flex flex-col items-center gap-1">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', liked ? 'bg-pink-500/30' : 'bg-black/30 backdrop-blur-sm')}>
                  <Heart className={cn('h-6 w-6', liked ? 'text-pink-400 fill-current' : 'text-white')} />
                </div>
                <span className="text-xs font-semibold text-white">{liked ? '1.3M' : item.views}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-white">4.2K</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-white">Share</span>
              </button>

              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                <Bookmark className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="absolute bottom-6 left-4 right-20">
              {user && (
                <button onClick={() => setViewingUser(user)} className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{user.handle}</span>
                  {user.verified && <Shield className="h-3.5 w-3.5 text-gold" />}
                </button>
              )}
              <h3 className="text-base font-bold text-white leading-tight mb-1">{item.title}</h3>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{item.duration}</span>
                <span className="text-xs text-white/70">{item.views} views</span>
              </div>
            </div>

            {index === 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce">
                <ChevronDown className="h-5 w-5 text-white/40" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}