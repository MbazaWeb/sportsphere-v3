'use client';

import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { formatTime, formatTimeShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Zap, Shield, X, Send, ChevronDown, Trophy, Sparkles, Flame, Crown, Check, Image as ImageIcon, Smile, Inbox, Info, BarChart3, Goal, Clock, ShoppingBag } from 'lucide-react';
import type { HomeSubTab } from '@/store/navigationStore';
import { apiUserToViewing } from '@/types';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useState, useRef, useEffect, useCallback } from 'react';

const SUBTABS: { id: HomeSubTab; label: string }[] = [
  { id: 'for-you',   label: 'For You'   },
  { id: 'trending',  label: 'Trending'  },
  { id: 'spotlight', label: 'Spotlight' },
];

// --- Types from API ---
interface ApiUser {
  id: string; name: string; handle: string; avatarInitials: string;
  isVerified: boolean; coverGradient: string; bio: string; role: string;
  location: string; followerCount: number; followingCount: number;
  postCount: number; registeredAt: string; verificationStatus: string;
}

interface ApiPost {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; teamTag: string | null; playerTag: string | null;
  isBreaking: boolean; likeCount: number; commentCount: number;
  shareCount: number; viewCount: number; createdAt: string;
  poll?: { id: string; question: string; options: string[]; totalVotes: number } | null;
  user: ApiUser;
}

interface ApiMatch {
  id: string; league: string; homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null;
  status: string; minute: number | null; venue: string | null;
  kickoffAt: string; events: { minute: number; type: string; player: string; team: string }[];
  continent: string; country: string;
}

interface ApiSpotlightItem {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; likeCount: number; commentCount: number;
  viewCount: number; createdAt: string;
  user: ApiUser;
}

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
function CommentSheet({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userProfile = useAuthStore((s) => s.userProfile);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [text, setText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; user: { name: string; avatarInitials: string; isVerified: boolean }; content: string; likeCount: number; createdAt: string }>>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComments() {
      try {
        const res = await fetch(`/api/comments?postId=${itemId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (e) { }
      setLoading(false);
    }
    loadComments();
  }, [itemId]);

  const handleSubmit = async () => {
    if (!isAuthenticated) { onClose(); setLoginModalOpen(true); return; }
    if (!text.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: itemId, content: text.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setText('');
      }
    } catch { }
  };

  const handleReply = (commentId: string) => {
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
            </div>
          ) : comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-gold">
                {c.user.avatarInitials}
              </div>
              <div className="flex-1">
                <div className="rounded-2xl bg-surface px-3 py-2">
                  <p className="text-xs font-semibold text-white mb-0.5">{c.user.name}</p>
                  <p className="text-sm text-foreground/90">{c.content}</p>
                </div>
                <div className="mt-1 flex items-center gap-4 px-1">
                  <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
                  <button className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors">
                    {c.likeCount} likes
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors">
                    Reply
                  </button>
                </div>
                {replyingTo === c.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input value={replies[c.id] ?? ''} onChange={(e) => setReplies(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder={`Reply to ${c.user.name}...`} autoFocus
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

        <div className="flex-shrink-0 border-t border-surface-border p-4 flex items-end gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-black flex-shrink-0">{userProfile?.avatar || 'ME'}</div>
          <div className="flex-1 flex items-end gap-2 rounded-2xl bg-surface border border-surface-border px-3 py-2 focus-within:ring-1 focus-within:ring-gold">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment...'}
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none max-h-24"
              style={{ minHeight: '24px' }}
            />
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-gold transition-colors flex-shrink-0" title="Add photo">
              <ImageIcon className="h-4 w-4" />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-gold transition-colors flex-shrink-0" title="Add GIF">
              <Smile className="h-4 w-4" />
            </button>
          </div>
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
  const setActiveTab  = useNavigationStore((s) => s.setActiveTab);
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [shareId, setShareId] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg">

      {/* --- SEARCH POPUP --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-[#1a2332] p-6 border border-gold/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-gold">Search</h2>
            <input type="text" placeholder="Type to search..." className="w-full rounded-lg border border-gray-700 bg-[#0b1426] p-3 text-white mb-4" autoFocus />
            <button onClick={() => setIsSearchOpen(false)} className="w-full rounded-lg bg-gray-700 py-2 hover:bg-gray-600 transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* --- CART POPUP --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-[#1a2332] p-6 border border-gold/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-gold">Your Cart</h2>
            <div className="mb-4 rounded-lg border border-gray-700 bg-[#0b1426] p-4 text-center">
              <p className="text-muted-foreground text-sm py-4">Your cart is empty.</p>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="w-full rounded-lg bg-gray-700 py-2 hover:bg-gray-600 transition-colors">Close</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => window.scrollTo(0,0)} className="flex items-center">
            <img src="/logo-wordmark.svg" alt="SportSphere" style={{ height: '28px', width: 'auto' }} />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSearchClick}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>

            <button 
              onClick={handleCartClick}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-gold" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-black">0</span>
            </button>

            <button onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); else setActiveTab('activity'); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            </button>
            <button onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); else setActiveTab('activity'); }}
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

function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" />
            <div className="h-2 w-16 rounded bg-surface animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-surface animate-pulse mb-2" />
        <div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-3">
          <div className="flex gap-4">
            <div className="h-3 w-8 rounded bg-surface animate-pulse" />
            <div className="h-3 w-8 rounded bg-surface animate-pulse" />
            <div className="h-3 w-8 rounded bg-surface animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ForYouContent({ onShare, onComment }: { onShare: (id: string) => void; onComment: (id: string) => void }) {
  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; handle: string; avatarInitials: string | null; coverGradient: string }>>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; rank: number; name: string; handle: string; avatarInitials: string | null; points: number; isVerified: boolean; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesRes, feedRes, usersRes, leaderboardRes] = await Promise.all([
          fetch('/api/matches?status=live'),
          fetch('/api/feed?type=for-you'),
          fetch('/api/users'),
          fetch('/api/leaderboard'),
        ]);
        if (matchesRes.ok) setLiveMatches(await matchesRes.json());
        if (feedRes.ok) setPosts(await feedRes.json());
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setTeams(allUsers.filter((u: { role: string }) => u.role === 'team').slice(0, 10));
        }
        if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      } catch (e) { }
      setLoading(false);
    }
    loadData();
  }, []);

  const featuredMatch = liveMatches[0];
  const [matchDetailOpen, setMatchDetailOpen] = useState(false);

  const openTeamByName = async (teamName: string) => {
    const handleGuess = '@' + teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(handleGuess)}`);
      if (res.ok) {
        const u = await res.json();
        setViewingUser(apiUserToViewing(u, false));
        return;
      }
    } catch { }
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const all = await res.json();
        const match = all.find((u: { name: string; role: string }) =>
          u.role === 'team' && u.name.toLowerCase() === teamName.toLowerCase()
        );
        if (match) {
          setViewingUser(apiUserToViewing(match, false));
        }
      }
    } catch { }
  };

  const openPlayerByName = async (playerName: string) => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const all = await res.json();
        const match = all.find((u: { name: string; role: string }) =>
          u.role === 'player' && (
            u.name.toLowerCase().includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(u.name.toLowerCase().split(' ')[0])
          )
        );
        if (match) {
          setViewingUser(apiUserToViewing(match, false));
        }
      }
    } catch { }
  };

  const openTeamByHandle = async (handle: string) => {
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
      if (res.ok) {
        const u = await res.json();
        setViewingUser(apiUserToViewing(u, false));
      }
    } catch { }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {featuredMatch && (
        <div className="premium-glow-border">
          <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-emerald-700 via-green-800 to-emerald-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di0ySDI0djJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="relative flex items-center justify-between p-3">
              <div className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live · {featuredMatch.minute}&apos;</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMatchDetailOpen(true); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                title="Match details & stats"
              >
                <Info className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            <div className="relative px-4 pb-2">
              <p className="text-[10px] font-bold uppercase text-white/70 tracking-wider">{featuredMatch.league}</p>
            </div>

            <div className="relative px-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => openTeamByName(featuredMatch.homeTeam)}
                  className="flex flex-col items-center gap-1.5 flex-1 group"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border-2 border-white/20 text-lg font-black text-white group-hover:border-gold group-hover:scale-105 transition-all">
                    {featuredMatch.homeTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center leading-tight group-hover:text-gold transition-colors">{featuredMatch.homeTeam}</p>
                </button>

                <button
                  onClick={() => setMatchDetailOpen(true)}
                  className="flex flex-col items-center group"
                >
                  <p className="text-4xl font-black text-white">
                    {featuredMatch.homeScore} <span className="text-white/40 mx-1">-</span> {featuredMatch.awayScore}
                  </p>
                  <p className="text-[10px] text-white/60 mt-1 group-hover:text-gold transition-colors flex items-center gap-1">
                    <Info className="h-2.5 w-2.5" /> Tap for stats
                  </p>
                </button>

                <button
                  onClick={() => openTeamByName(featuredMatch.awayTeam)}
                  className="flex flex-col items-center gap-1.5 flex-1 group"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border-2 border-white/20 text-lg font-black text-white group-hover:border-gold group-hover:scale-105 transition-all">
                    {featuredMatch.awayTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center leading-tight group-hover:text-gold transition-colors">{featuredMatch.awayTeam}</p>
                </button>
              </div>

              {featuredMatch.events && featuredMatch.events.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    {featuredMatch.events.filter((e: { team: string }) => e.team === 'home').map((e: { minute: number; player: string; type: string }, i: number) => (
                      <button
                        key={i}
                        onClick={() => openPlayerByName(e.player)}
                        className="flex items-center gap-1.5 text-left text-[11px] text-white/80 hover:text-gold transition-colors"
                      >
                        <span className="h-1 w-1 rounded-full bg-gold" />
                        <span className="font-semibold">{e.player}</span>
                        <span className="text-white/50">{e.minute}&apos;</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {featuredMatch.events.filter((e: { team: string }) => e.team === 'away').map((e: { minute: number; player: string; type: string }, i: number) => (
                      <button
                        key={i}
                        onClick={() => openPlayerByName(e.player)}
                        className="flex items-center gap-1.5 text-right text-[11px] text-white/80 hover:text-gold transition-colors"
                      >
                        <span className="text-white/50">{e.minute}&apos;</span>
                        <span className="font-semibold">{e.player}</span>
                        <span className="h-1 w-1 rounded-full bg-gold" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {matchDetailOpen && featuredMatch && (
        <MatchDetailModal match={featuredMatch} onClose={() => setMatchDetailOpen(false)} onTeamClick={openTeamByName} onPlayerClick={openPlayerByName} />
      )}

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Top Accounts</h3>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No leaderboard data.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/users?handle=${encodeURIComponent(item.handle)}`);
                    if (res.ok) {
                      const u = await res.json();
                      setViewingUser(apiUserToViewing(u, false));
                    }
                  } catch { }
                }}
                className="flex items-center gap-3 rounded-xl bg-surface p-2.5 text-left hover:bg-surface-elevated transition-colors w-full"
              >
                <span className={cn('w-5 text-center text-sm font-black', item.rank === 1 ? 'text-gold' : item.rank === 2 ? 'text-gray-300' : item.rank === 3 ? 'text-orange-400' : 'text-muted-foreground')}>
                  {item.rank}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                  {item.avatarInitials || item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{item.role}</p>
                </div>
                <span className="text-sm font-bold text-gold">{formatCount(item.points)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Choose Your Teams</h3>
        </div>
        {teams.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No teams available.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => openTeamByHandle(team.handle)}
                className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-surface border border-surface-border px-3 py-2 text-sm font-medium text-white hover:border-gold/30 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[10px] font-bold text-gold">
                  {team.avatarInitials || team.name.slice(0, 2).toUpperCase()}
                </div>
                {team.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No posts yet</p>
        </div>
      ) : (
        posts.map((item) => <FeedCard key={item.id} item={item} onShare={onShare} onComment={onComment} formatTime={formatTime} />)
      )}
    </div>
  );
}

function FeedCard({ item, onShare, onComment, formatTime }: {
  item: ApiPost;
  onShare: (id: string) => void;
  onComment: (id: string) => void;
  formatTime: (s: string) => string;
}) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState(item.poll?.totalVotes ?? 0);
  const user = item.user;

  const handleViewUser = useCallback(() => {
    setViewingUser({
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatarInitials,
      verified: user.isVerified,
      coverGradient: user.coverGradient,
      bio: user.bio || '',
      role: user.role,
      location: user.location || '',
      joined: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
      followers: user.followerCount || 0,
      following: user.followingCount || 0,
      posts: user.postCount || 0,
      isFollowing: false,
    });
  }, [user, setViewingUser]);

  const handleSave = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    setSaved(!saved);
  };

  return (
    <article className="glass-card premium-card rounded-2xl overflow-hidden glass-card-hover">
      {item.isBreaking && (
        <div className="flex items-center gap-2 border-b border-gold/20 bg-gold/5 px-4 py-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-gold">Breaking</span>
        </div>
      )}
      <div className="p-4">
        <button onClick={handleViewUser} className="mb-3 flex items-center gap-3 text-left w-full">
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            user.isVerified ? 'bg-gold text-black' : 'bg-surface text-white')}>
            {user.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              <BadgeStack role={user.role} isVerified={user.isVerified} size="xs" />
            </div>
            <span className="text-xs text-muted-foreground">{user.handle} · {formatTime(item.createdAt)}</span>
          </div>
        </button>

        <p className="mb-3 text-sm leading-relaxed text-foreground/90">{item.content}</p>

        {item.teamTag && (
          <span className="mb-3 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium border bg-gold/10 text-gold border-gold/20">
            {item.teamTag}
          </span>
        )}

        {item.postType === 'photo' && (
          <div className="mb-3 overflow-hidden rounded-xl bg-surface-elevated">
            {item.mediaUrls && item.mediaUrls.length > 0 ? (
              <img src={item.mediaUrls[0]} alt={item.content || 'Post image'} className="h-52 w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-52 bg-gradient-to-br from-gold via-orange-600 to-red-800 flex items-end p-3">
                <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {item.teamTag || 'Photo'}
                </span>
              </div>
            )}
          </div>
        )}

        {item.postType === 'video' && (
          <div className="mb-3 relative h-52 overflow-hidden rounded-xl bg-surface-elevated">
            {item.mediaUrls && item.mediaUrls.length > 0 ? (
              <video src={item.mediaUrls[0]} className="h-full w-full object-cover" controls playsInline preload="metadata" />
            ) : (
              <div className="h-full bg-gradient-to-br from-gold to-red-800 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {item.poll && item.poll.options && item.poll.options.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            <p className="text-sm font-bold text-white mb-1">{item.poll.question}</p>
            {item.poll.options.map((opt: string, i: number) => {
              const basePct = Math.round(100 / item.poll!.options.length);
              const pct = votedOption !== null
                ? (i === votedOption ? Math.round(100 / item.poll!.options.length) + 5 : Math.round((100 - Math.round(100 / item.poll!.options.length) - 5) / (item.poll!.options.length - 1 || 1)))
                : basePct;
              return (
                <button
                  key={i}
                  onClick={async () => {
                    if (!isAuthenticated) { setLoginModalOpen(true); return; }
                    if (votedOption !== null) return;
                    setVotedOption(i);
                    setPollVotes(v => v + 1);
                    try {
                      await fetch('/api/polls/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pollId: item.poll!.id, optionIndex: i }),
                      });
                    } catch { }
                  }}
                  disabled={votedOption !== null}
                  className={cn(
                    'relative overflow-hidden rounded-lg p-3 text-left transition-all',
                    votedOption === i ? 'bg-gold/20 border border-gold/40' : 'bg-surface border border-surface-border',
                    votedOption !== null && votedOption !== i && 'opacity-60'
                  )}
                >
                  {votedOption !== null && (
                    <div className="absolute inset-y-0 left-0 bg-gold/20 rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{opt}</span>
                    {votedOption === i && <Check className="h-3.5 w-3.5 text-gold" />}
                    {votedOption !== null && <span className="text-xs font-bold text-muted-foreground">{pct}%</span>}
                  </div>
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground">{pollVotes.toLocaleString()} votes{votedOption !== null && ' · You voted'}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-1">
          <button
            onClick={async () => {
              if (!isAuthenticated) { setLoginModalOpen(true); return; }
              setLiked(!liked);
              try {
                await fetch('/api/likes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ postId: item.id }),
                });
              } catch { }
            }}
            className={cn('flex items-center gap-1.5 transition-colors', liked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400')}>
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="text-xs">{formatCount(item.likeCount + (liked ? 1 : 0))}</span>
          </button>
          <button onClick={() => onComment(item.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.commentCount)}</span>
          </button>
          <button onClick={() => onShare(item.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors">
            <Share2 className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.shareCount)}</span>
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

function TrendingContent() {
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ApiPost[]>([]);
  const [communities, setCommunities] = useState<Array<{ id: string; name: string; memberCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesRes, feedRes, commRes] = await Promise.all([
          fetch('/api/matches?status=live'),
          fetch('/api/feed?type=trending'),
          fetch('/api/communities'),
        ]);
        if (matchesRes.ok) setLiveMatches(await matchesRes.json());
        if (feedRes.ok) {
          setTrendingPosts(await feedRes.json());
        }
        if (commRes.ok) setCommunities(await commRes.json());
      } catch (e) { }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleJoin = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
  };

  const toFeedUser = useCallback((user: ApiUser) => apiUserToViewing(user, false), []);

  return (
    <div className="p-4 flex flex-col gap-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" /> Live Now
        </h2>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 glass-card rounded-xl p-3 min-w-[175px]">
                <div className="h-3 w-16 rounded bg-surface animate-pulse mb-2" />
                <div className="h-4 w-full rounded bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {liveMatches.map((m) => (
              <div key={m.id} className="flex-shrink-0 glass-card rounded-xl p-3 min-w-[175px] glass-card-hover">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] font-bold uppercase text-gold">{m.league} · {m.status === 'ht' ? 'HT' : `${m.minute}'`}</span>
                </div>
                <p className="text-sm font-semibold text-white">{m.homeTeam.split(' ').pop()} {m.homeScore}–{m.awayScore} {m.awayTeam.split(' ').pop()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-gold" /> Trending
        </h2>
        
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : trendingPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No trending posts right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {trendingPosts.slice(0, 6).map((post) => {
              const fu = toFeedUser(post.user);
              return (
                <div key={post.id} className="flex items-center justify-between glass-card rounded-xl p-4 glass-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                      <Flame className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">#{post.content.split(' ').find(w => w.startsWith('#')) || 'Trending'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatCount(post.likeCount)} likes</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCount(post.commentCount)} comments</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!loading && trendingPosts.slice(0, 3).map((post) => {
        const fu = toFeedUser(post.user);
        return (
          <article key={post.id} className="glass-card rounded-2xl p-4 glass-card-hover">
            <button onClick={() => setViewingUser(fu)} className="mb-2 flex items-center gap-3 text-left w-full">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                fu.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                {fu.avatar}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-white">{fu.name}</span>
                  {fu.verified && <Shield className="h-3 w-3 text-gold" />}
                </div>
                <span className="text-xs text-muted-foreground">{fu.handle}</span>
              </div>
            </button>
            <p className="text-sm text-foreground/90 line-clamp-2">{post.content}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(post.likeCount)}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatCount(post.commentCount)}</span>
            </div>
          </article>
        );
      })}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Communities</h2>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between glass-card rounded-xl p-4">
                <div className="h-3 w-24 rounded bg-surface animate-pulse" />
                <div className="h-6 w-12 rounded bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {communities.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between glass-card rounded-xl p-4 glass-card-hover">
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCount(c.memberCount)} members</p>
                </div>
                <button onClick={handleJoin}
                  className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors">
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
        {!isAuthenticated && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <button onClick={() => setLoginModalOpen(true)} className="text-gold hover:underline">Sign in</button> to join communities
          </p>
        )}
      </section>
    </div>
  );
}

function SpotlightContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [spotlightItems, setSpotlightItems] = useState<ApiSpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/spotlight');
        if (res.ok) setSpotlightItems(await res.json());
      } catch (e) { }
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleLike = (id: string) => {
    setLikedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toFeedUser = useCallback((user: ApiUser) => apiUserToViewing(user, false), []);

  const gradients = [
    'from-green-700 to-emerald-900',
    'from-blue-700 to-indigo-900',
    'from-red-700 to-rose-900',
    'from-yellow-600 to-amber-900',
    'from-purple-700 to-violet-900',
    'from-orange-600 to-red-900',
    'from-teal-600 to-cyan-900',
    'from-pink-600 to-fuchsia-900',
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (spotlightItems.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <Crown className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No spotlight content yet</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-[calc(100vh-8rem)] overflow-y-auto snap-y snap-mandatory scrollbar-hide">
      {spotlightItems.map((item, index) => {
        const user = toFeedUser(item.user);
        const liked = likedItems.has(item.id);
        const gradient = gradients[index % gradients.length];
        return (
          <div key={item.id} className="relative h-[calc(100vh-8rem)] w-full snap-start snap-always flex-shrink-0 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <div className="ml-1.5 h-0 w-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white" />
              </div>
            </div>

            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
              <button onClick={() => setViewingUser(user)} className="flex flex-col items-center gap-1">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold text-sm font-bold',
                  user.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                  {user.avatar}
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold -mt-3">
                  <span className="text-[10px] font-bold text-black">+</span>
                </div>
              </button>

              <button onClick={() => toggleLike(item.id)} className="flex flex-col items-center gap-1">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', liked ? 'bg-pink-500/30' : 'bg-black/30 backdrop-blur-sm')}>
                  <Heart className={cn('h-6 w-6', liked ? 'text-pink-400 fill-current' : 'text-white')} />
                </div>
                <span className="text-xs font-semibold text-white">{formatCount(item.likeCount + (liked ? 1 : 0))}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-white">{formatCount(item.commentCount)}</span>
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
              <button onClick={() => setViewingUser(user)} className="mb-3 flex items-center gap-2">
                <span className="text-sm font-bold text-white">{user.handle}</span>
                {user.verified && <Shield className="h-3.5 w-3.5 text-gold" />}
              </button>
              <h3 className="text-base font-bold text-white leading-tight mb-1">{item.content}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">{formatCount(item.viewCount)} views</span>
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

function MatchDetailModal({ match, onClose, onTeamClick, onPlayerClick }: {
  match: ApiMatch;
  onClose: () => void;
  onTeamClick: (name: string) => void;
  onPlayerClick: (name: string) => void;
}) {
  const events = (match.events || []) as Array<{ minute: number; type: string; player: string; team: string }>;
  const homeGoals = events.filter(e => e.type === 'goal' && e.team === 'home');
  const awayGoals = events.filter(e => e.type === 'goal' && e.team === 'away');

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-elevated px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-bold text-white">Match Details</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="premium-glow-border">
            <div className="rounded-[14px] bg-gradient-to-br from-emerald-700 to-green-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-white/70 tracking-wider">{match.league}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', match.status === 'live' ? 'bg-red-500 text-white' : 'bg-surface text-muted-foreground')}>
                  {match.status === 'live' ? `Live · ${match.minute}'` : match.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => onTeamClick(match.homeTeam)} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sm font-black text-white group-hover:border-gold transition-colors">
                    {match.homeTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center group-hover:text-gold">{match.homeTeam}</p>
                </button>
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{match.homeScore} - {match.awayScore}</p>
                </div>
                <button onClick={() => onTeamClick(match.awayTeam)} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sm font-black text-white group-hover:border-gold transition-colors">
                    {match.awayTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center group-hover:text-gold">{match.awayTeam}</p>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface border border-surface-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Venue</p>
              <p className="text-sm font-semibold text-white">{match.venue || 'TBD'}</p>
            </div>
            <div className="rounded-xl bg-surface border border-surface-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Kick-off</p>
              <p className="text-sm font-semibold text-white">{new Date(match.kickoffAt).toLocaleString()}</p>
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
                <Goal className="h-3.5 w-3.5" /> Goal Scorers
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  {homeGoals.map((e, i) => (
                    <button key={i} onClick={() => onPlayerClick(e.player)} className="flex items-center gap-2 rounded-lg bg-surface p-2 text-left hover:bg-surface-elevated transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      <span className="text-xs font-semibold text-white">{e.player}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{e.minute}'</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {awayGoals.map((e, i) => (
                    <button key={i} onClick={() => onPlayerClick(e.player)} className="flex items-center gap-2 rounded-lg bg-surface p-2 text-right hover:bg-surface-elevated transition-colors justify-end">
                      <span className="text-[10px] text-muted-foreground">{e.minute}'</span>
                      <span className="text-xs font-semibold text-white">{e.player}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
              <BarChart3 className="h-3.5 w-3.5" /> Match Stats
            </h3>
            {events.length > 0 ? (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground text-center py-4">
                <p>Real-time stats are loading from the match API...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p>No match stats available yet.</p>
              </div>
            )}
          </div>

          {events.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" /> Timeline
              </h3>
              <div className="flex flex-col gap-1">
                {events.sort((a, b) => a.minute - b.minute).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-surface p-2">
                    <span className="text-[10px] font-bold text-gold w-8">{e.minute}'</span>
                    <span className="text-xs text-white">{e.type === 'goal' ? '⚽' : e.type} {e.player} ({e.team === 'home' ? match.homeTeam : match.awayTeam})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
