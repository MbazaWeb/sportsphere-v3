'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigationStore } from '@/store/navigationStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Image, Video, Zap, BarChart3, Target,
  X, Send, Camera, Tag, Hash, MapPin, ChevronDown,
  Plus, Minus, Lock, Globe, Users,
} from 'lucide-react';
import { useState } from 'react';

const CREATE_TYPES = [
  { id: 'post',       label: 'Post',       icon: FileText,  color: 'bg-blue-500/10 text-blue-400',   desc: 'Share your thoughts' },
  { id: 'photo',      label: 'Photo',      icon: Image,     color: 'bg-pink-500/10 text-pink-400',    desc: 'Share a moment' },
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
  const [text, setText] = useState('');
  const [audience, setAudience] = useState<'public'|'followers'|'private'>('public');
  const [tag, setTag] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const typeConfig = CREATE_TYPES.find(t => t.id === type)!;

  const handleSubmit = () => {
    if (!text.trim() && type === 'post') return;
    setSubmitted(true);
    setTimeout(() => { onBack(); setActiveTab('home'); }, 1500);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-gold mb-4">
          <span className="text-3xl">✓</span>
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
          <button onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-gold/90 transition-colors">
            <Send className="h-3.5 w-3.5" />
            Post
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4">
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
        {type !== 'prediction' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === 'post' ? "What's on your mind?" :
              type === 'photo' ? 'Add a caption...' :
              type === 'video' ? 'Describe your video...' :
              type === 'spotlight' ? 'Add a caption for your reel...' :
              type === 'poll' ? "Ask a question..." : "Your prediction..."
            }
            rows={4}
            className="w-full resize-none rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
        )}

        {/* Photo/Video placeholder */}
        {(type === 'photo' || type === 'video' || type === 'spotlight') && (
          <button className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to add {type === 'photo' ? 'photo' : 'video'}</p>
          </button>
        )}

        {/* Poll options */}
        {type === 'poll' && (
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

        {/* Tag + Hashtag bar */}
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl bg-surface border border-surface-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
            <Tag className="h-3.5 w-3.5" /> Tag Team/Player
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-surface border border-surface-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
            <Hash className="h-3.5 w-3.5" /> Hashtag
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-surface border border-surface-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
            <MapPin className="h-3.5 w-3.5" /> Location
          </button>
        </div>

        {/* Char count */}
        {type !== 'prediction' && (
          <div className="text-right">
            <span className={cn('text-xs font-medium', text.length > 240 ? 'text-red-400' : text.length > 200 ? 'text-yellow-400' : 'text-muted-foreground')}>
              {text.length}/280
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
