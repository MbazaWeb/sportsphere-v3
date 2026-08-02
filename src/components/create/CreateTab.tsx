'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigationStore } from '@/store/navigationStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Image as ImageIcon, Video, Zap, BarChart3, Target,
  X, Send, Camera, Tag, Hash, MapPin, ChevronDown,
  Plus, Minus, Lock, Globe, Users, Search, Check, XCircle,
} from 'lucide-react';
import { useState, useRef } from 'react';

const CREATE_TYPES = [
  { id: 'post',       label: 'Post',       icon: FileText,  color: 'bg-blue-500/10 text-blue-400',   desc: 'Share your thoughts' },
  { id: 'photo',      label: 'Photo',      icon: ImageIcon, color: 'bg-pink-500/10 text-pink-400',    desc: 'Share a moment' },
  { id: 'video',      label: 'Video',      icon: Video,     color: 'bg-purple-500/10 text-purple-400',desc: 'Upload a clip' },
  { id: 'spotlight',  label: 'Spotlight',  icon: Zap,       color: 'bg-gold/10 text-gold',            desc: 'Short video reel' },
  { id: 'poll',       label: 'Poll',       icon: BarChart3, color: 'bg-cyan-500/10 text-cyan-400',    desc: 'Ask your fans' },
  { id: 'prediction', label: 'Prediction', icon: Target,    color: 'bg-green-500/10 text-green-400',  desc: 'Predict a match' },
];

export default function CreateTab() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [activeType, setActiveType] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20">
          <Plus className="h-10 w-10 text-gold" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Create Content</h2>
        <p className="mb-8 text-sm text-muted-foreground">Sign in to post, share photos, videos, polls and predictions.</p>
        <button onClick={() => setLoginModalOpen(true)}
          className="w-full max-w-xs rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors">
          Sign In to Create
        </button>
      </div>
    );
  }

  if (activeType) {
    return <Composer type={activeType} onBack={() => setActiveType(null)} />;
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold text-white">Create</h1>
        </div>
      </header>

      <div className="p-4">
        <p className="mb-4 text-sm text-muted-foreground">What do you want to share?</p>
        <div className="grid grid-cols-2 gap-3">
          {CREATE_TYPES.map((type) => (
            <motion.button key={type.id} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveType(type.id)}
              className="flex flex-col items-start gap-3 rounded-2xl glass-card border border-surface-border p-4 text-left hover:border-gold/30 transition-colors glass-card-hover">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', type.color)}>
                <type.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────
function Composer({ type, onBack }: { type: string; onBack: () => void }) {
  const userProfile = useAuthStore((s) => s.userProfile);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const showToast = useUIStore((s) => s.showToast);
  const [text, setText] = useState('');
  const [audience, setAudience] = useState<'public'|'followers'|'private'>('public');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollQuestion, setPollQuestion] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tag / Hashtag / Location state
  const [teamTag, setTeamTag] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [location, setLocation] = useState('');

  // Modal state for tag/hashtag/location pickers
  const [activePicker, setActivePicker] = useState<'tag'|'hashtag'|'location'|null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const typeConfig = CREATE_TYPES.find(t => t.id === type)!;

  const handleSubmit = async () => {
    setError('');
    // Validate per type
    if (type === 'post' && !text.trim()) {
      setError('Please write something to post.');
      return;
    }
    if (type === 'poll') {
      if (!pollQuestion.trim()) { setError('Please enter a poll question.'); return; }
      if (pollOptions.filter(o => o.trim()).length < 2) { setError('Please provide at least 2 poll options.'); return; }
    }
    if (type === 'prediction') {
      if (!homeTeam.trim() || !awayTeam.trim()) { setError('Please enter both team names.'); return; }
    }
    if ((type === 'photo' || type === 'video' || type === 'spotlight') && !text.trim() && mediaUrls.length === 0) {
      setError('Please add a caption or media.'); return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        content: text || (type === 'poll' ? pollQuestion : type === 'prediction' ? `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}` : ''),
        postType: type,
        mediaUrls,
        teamTag: teamTag || undefined,
        playerTag: playerTag || undefined,
        hashtags,
        location: location || undefined,
      };

      if (type === 'poll') {
        body.poll = { question: pollQuestion, options: pollOptions.filter(o => o.trim()) };
      }
      if (type === 'prediction') {
        body.prediction = {
          homeTeam, awayTeam,
          predictedHome: parseInt(homeScore) || 0,
          predictedAway: parseInt(awayScore) || 0,
        };
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create post.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setTimeout(() => { onBack(); setActiveTab('home'); }, 1500);
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-gold mb-4">
          <Check className="h-10 w-10 text-black" strokeWidth={3} />
        </motion.div>
        <p className="text-lg font-bold text-white">Posted!</p>
        <p className="text-sm text-muted-foreground mt-1">Your {typeConfig.label.toLowerCase()} is live</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg', typeConfig.color)}>
              <typeConfig.icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-white">{typeConfig.label}</span>
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* User + audience */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-black text-black flex-shrink-0">
            {userProfile?.avatar || 'ME'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{userProfile?.name || 'You'}</p>
            <button onClick={() => setAudience(a => a === 'public' ? 'followers' : a === 'followers' ? 'private' : 'public')}
              className="flex items-center gap-1 rounded-lg bg-surface border border-surface-border px-2 py-0.5">
              {audience === 'public' ? <Globe className="h-3 w-3 text-gold" /> : audience === 'followers' ? <Users className="h-3 w-3 text-blue-400" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
              <span className="text-[10px] font-semibold text-muted-foreground capitalize">{audience}</span>
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Main text */}
        {type !== 'prediction' && type !== 'poll' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === 'post' ? "What's on your mind?" :
              type === 'photo' ? 'Add a caption...' :
              type === 'video' ? 'Describe your video...' :
              type === 'spotlight' ? 'Add a caption for your reel...' : "Your prediction..."
            }
            rows={4}
            className="w-full resize-none rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
        )}

        {/* Poll question + options */}
        {type === 'poll' && (
          <div className="flex flex-col gap-3">
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <div className="flex flex-col gap-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={opt} onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(p => p.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions(p => [...p, ''])}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-surface-border px-4 py-2.5 text-sm text-muted-foreground hover:text-white transition-colors">
                  <Plus className="h-4 w-4" /> Add option
                </button>
              )}
            </div>
          </div>
        )}

        {/* Photo/Video upload (now functional — accepts URL input as placeholder for real upload) */}
        {(type === 'photo' || type === 'video' || type === 'spotlight') && (
          <MediaUpload type={type} mediaUrls={mediaUrls} onChange={setMediaUrls} />
        )}

        {/* Prediction */}
        {type === 'prediction' && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="mb-4 text-sm font-bold text-gold">Match Prediction</h3>
            <div className="flex items-center gap-3 mb-4">
              <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="Home Team"
                className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
              <span className="text-sm font-bold text-muted-foreground">vs</span>
              <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="Away Team"
                className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
            </div>
            <div className="flex items-center gap-3">
              <input value={homeScore} onChange={(e) => setHomeScore(e.target.value)} placeholder="0" type="number"
                className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-3 text-center text-2xl font-black text-gold focus:outline-none focus:ring-1 focus:ring-gold" />
              <span className="text-xl font-black text-muted-foreground">–</span>
              <input value={awayScore} onChange={(e) => setAwayScore(e.target.value)} placeholder="0" type="number"
                className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-3 text-center text-2xl font-black text-gold focus:outline-none focus:ring-1 focus:ring-gold" />
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add your reasoning..."
              rows={2} className="mt-3 w-full resize-none rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
          </div>
        )}

        {/* Active tags display */}
        {(teamTag || playerTag || hashtags.length > 0 || location) && (
          <div className="flex flex-wrap gap-2">
            {teamTag && (
              <span className="flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-xs text-blue-400">
                <Tag className="h-3 w-3" /> {teamTag}
                <button onClick={() => setTeamTag('')}><XCircle className="h-3 w-3" /></button>
              </span>
            )}
            {playerTag && (
              <span className="flex items-center gap-1 rounded-lg bg-green-500/10 border border-green-500/20 px-2 py-1 text-xs text-green-400">
                <Tag className="h-3 w-3" /> {playerTag}
                <button onClick={() => setPlayerTag('')}><XCircle className="h-3 w-3" /></button>
              </span>
            )}
            {hashtags.map((h, i) => (
              <span key={i} className="flex items-center gap-1 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-xs text-purple-400">
                <Hash className="h-3 w-3" /> {h}
                <button onClick={() => setHashtags(hs => hs.filter((_, j) => j !== i))}><XCircle className="h-3 w-3" /></button>
              </span>
            ))}
            {location && (
              <span className="flex items-center gap-1 rounded-lg bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-xs text-orange-400">
                <MapPin className="h-3 w-3" /> {location}
                <button onClick={() => setLocation('')}><XCircle className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Tag + Hashtag + Location bar — now functional */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActivePicker('tag')}
            className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
              (teamTag || playerTag) ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-surface border-surface-border text-muted-foreground hover:text-white')}>
            <Tag className="h-3.5 w-3.5" /> Tag Team/Player
          </button>
          <button onClick={() => setActivePicker('hashtag')}
            className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
              hashtags.length > 0 ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-surface border-surface-border text-muted-foreground hover:text-white')}>
            <Hash className="h-3.5 w-3.5" /> Hashtag
          </button>
          <button onClick={() => setActivePicker('location')}
            className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
              location ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-surface border-surface-border text-muted-foreground hover:text-white')}>
            <MapPin className="h-3.5 w-3.5" /> Location
          </button>
        </div>

        {/* Char count */}
        {type !== 'prediction' && type !== 'poll' && (
          <div className="text-right">
            <span className={cn('text-xs font-medium', text.length > 240 ? 'text-red-400' : text.length > 200 ? 'text-yellow-400' : 'text-muted-foreground')}>
              {text.length}/280
            </span>
          </div>
        )}
      </div>

      {/* Tag/Hashtag/Location pickers */}
      <AnimatePresence>
        {activePicker === 'tag' && (
          <TagPicker
            onClose={() => setActivePicker(null)}
            onPick={(team, player) => { if (team) setTeamTag(team); if (player) setPlayerTag(player); setActivePicker(null); }}
          />
        )}
        {activePicker === 'hashtag' && (
          <HashtagPicker
            onClose={() => setActivePicker(null)}
            onAdd={(tag) => { if (!hashtags.includes(tag)) setHashtags(hs => [...hs, tag]); }}
            existing={hashtags}
          />
        )}
        {activePicker === 'location' && (
          <LocationPicker
            onClose={() => setActivePicker(null)}
            onPick={(loc) => { setLocation(loc); setActivePicker(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Media Upload (functional — accepts URL or file selection placeholder) ──
function MediaUpload({ type, mediaUrls, onChange }: { type: string; mediaUrls: string[]; onChange: (urls: string[]) => void }) {
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...mediaUrls, urlInput.trim()]);
    setUrlInput('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    onChange([...mediaUrls, ...urls]);
    // Cleanup: revoke object URLs when component unmounts
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  };

  return (
    <div className="flex flex-col gap-3">
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-surface-border">
              {type === 'video' || type === 'spotlight' ? (
                <video src={url} className="h-full w-full object-cover" controls />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                onClick={() => onChange(mediaUrls.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File upload button */}
      <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors">
        <Camera className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Tap to upload {type === 'photo' ? 'photos' : 'videos'}</p>
        <p className="text-[10px] text-muted-foreground/70">or paste a URL below</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={type === 'photo' ? 'image/*' : 'video/*'}
          multiple
          onChange={handleFile}
          className="hidden"
        />
      </label>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          placeholder="Paste image/video URL..."
          className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <button onClick={addUrl} className="rounded-xl bg-surface border border-surface-border px-4 text-sm font-semibold text-white hover:bg-surface-elevated">
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Tag Picker (search teams/players) ─────────────────────────
function TagPicker({ onClose, onPick }: { onClose: () => void; onPick: (team?: string, player?: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; handle: string; role: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ team?: string; player?: string }>({});

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users`);
      const users = await res.json();
      const filtered = users.filter((u: { name: string; role: string }) =>
        u.name.toLowerCase().includes(q.toLowerCase()) &&
        (u.role === 'team' || u.role === 'player')
      ).slice(0, 10);
      setResults(filtered);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Tag Team or Player</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search teams or players..."
            autoFocus
            className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {loading && <p className="text-center text-xs text-muted-foreground py-4">Searching...</p>}

        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  if (u.role === 'team') setSelected(s => ({ ...s, team: u.name }));
                  else setSelected(s => ({ ...s, player: u.name }));
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-left transition-colors",
                  (selected.team === u.name || selected.player === u.name)
                    ? 'bg-gold/10 border border-gold/30'
                    : 'bg-surface border border-surface-border hover:bg-surface-elevated'
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role} · {u.handle}</p>
                </div>
                {(selected.team === u.name || selected.player === u.name) && (
                  <Check className="h-4 w-4 text-gold" />
                )}
              </button>
            ))}
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">No teams or players found.</p>
        )}

        <button
          onClick={() => onPick(selected.team, selected.player)}
          disabled={!selected.team && !selected.player}
          className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 disabled:opacity-50"
        >
          {selected.team || selected.player ? 'Add Tag' : 'Select a team or player'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Hashtag Picker ────────────────────────────────────────────
function HashtagPicker({ onClose, onAdd, existing }: { onClose: () => void; onAdd: (tag: string) => void; existing: string[] }) {
  const [input, setInput] = useState('');
  const suggestions = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Rugby', 'Athletics', 'MatchDay', 'Goal', 'Transfer', 'SportNews', 'WorldCup', 'AFCON'];

  const addTag = (tag: string) => {
    const clean = tag.replace(/^#/, '').replace(/\s+/g, '');
    if (clean && !existing.includes(clean)) onAdd(clean);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Hashtag</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="relative mb-4">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && addTag(input)}
            placeholder="Type a hashtag..."
            autoFocus
            className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <p className="mb-2 text-xs font-medium text-muted-foreground">Suggestions</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.filter(s => !existing.includes(s)).map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-white hover:border-gold/30 transition-colors"
            >
              #{s}
            </button>
          ))}
        </div>

        {input.trim() && (
          <button
            onClick={() => addTag(input)}
            className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90"
          >
            Add #{input.replace(/^#/, '').replace(/\s+/g, '')}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Location Picker ───────────────────────────────────────────
function LocationPicker({ onClose, onPick }: { onClose: () => void; onPick: (loc: string) => void }) {
  const [input, setInput] = useState('');
  const suggestions = ['Dar es Salaam, Tanzania', 'Nairobi, Kenya', 'Lagos, Nigeria', 'Cairo, Egypt', 'Johannesburg, South Africa', 'London, UK', 'Madrid, Spain', 'Paris, France', 'New York, USA', 'Dubai, UAE', 'Mumbai, India', 'São Paulo, Brazil'];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Location</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="relative mb-4">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search location..."
            autoFocus
            className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {input.trim() ? (
          <button
            onClick={() => onPick(input)}
            className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 mb-4"
          >
            Use "{input}"
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            {suggestions.map((loc) => (
              <button
                key={loc}
                onClick={() => onPick(loc)}
                className="flex items-center gap-3 rounded-xl p-3 text-left hover:bg-surface transition-colors"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-white">{loc}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
