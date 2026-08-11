'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Image as ImageIcon, Video, Zap, BarChart3, Target,
  Plus, X, Hash, MapPin, WifiOff, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigationStore } from '@/store/navigationStore';
import { PostComposer } from './PostComposer';
import { PhotoUpload } from '@/components/uploads/PhotoUpload';
import { VideoUpload } from '@/components/uploads/VideoUpload';
import { PollCreator } from './PollCreator';
import { PredictionCreator } from './PredictionCreator';
import { queuePost, isOffline, getQueuedPosts } from '@/lib/offline-posts';

const CREATE_TYPES = [
  { id: 'post',       label: 'Post',       icon: FileText,   gradient: 'from-blue-500/20 to-blue-600/5',   border: 'border-blue-500/20',   iconColor: 'text-blue-400', desc: 'Share your thoughts' },
  { id: 'photo',      label: 'Photo',      icon: ImageIcon,  gradient: 'from-pink-500/20 to-pink-600/5',  border: 'border-pink-500/20',  iconColor: 'text-pink-400', desc: 'Share a moment' },
  { id: 'video',      label: 'Video',      icon: Video,      gradient: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20', iconColor: 'text-purple-400', desc: 'Upload a clip' },
  { id: 'spotlight',  label: 'Spotlight',  icon: Zap,        gradient: 'from-gold/20 to-amber-600/5',       border: 'border-gold/20',       iconColor: 'text-gold', desc: 'Short vertical reel' },
  { id: 'poll',       label: 'Poll',       icon: BarChart3,  gradient: 'from-cyan-500/20 to-cyan-600/5',   border: 'border-cyan-500/20',   iconColor: 'text-cyan-400', desc: 'Ask your fans' },
  { id: 'prediction', label: 'Prediction', icon: Target,     gradient: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20', iconColor: 'text-green-400', desc: 'Predict a match' },
] as const;

const MAX_CONTENT = 500;

export default function CreateTab() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { setPendingCount(getQueuedPosts().length); }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
          <Plus className="h-10 w-10 text-gold" />
        </div>
        <h2 className="mb-2 text-xl font-black text-white">Create Content</h2>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed max-w-xs">
          Sign in to post, share photos, videos, polls and predictions.
        </p>
        <button
          onClick={() => setLoginModalOpen(true)}
          className="w-full max-w-xs rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]"
        >
          Sign In to Create
        </button>
      </div>
    );
  }

  if (activeType) {
    return <Composer type={activeType} onBack={() => setActiveType(null)} />;
  }

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-14 items-center px-4 gap-3">
          <Sparkles className="h-5 w-5 text-gold" />
          <h1 className="text-lg font-extrabold text-foreground tracking-tight">Create</h1>
        </div>
      </header>

      <div className="p-4">
        {pendingCount > 0 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5">
            <WifiOff className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-400">
                {pendingCount} post{pendingCount === 1 ? '' : 's'} waiting to publish
              </p>
              <p className="text-[11px] text-amber-400/70 mt-0.5">
                Saved locally — will publish automatically when you reconnect.
              </p>
            </div>
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">What do you want to share?</p>
        <div className="grid grid-cols-2 gap-3">
          {CREATE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveType(type.id)}
                className={cn(
                  'group flex flex-col items-start gap-3 rounded-2xl border bg-gradient-to-br p-4 text-left transition-all duration-200',
                  type.border, type.gradient, 'hover:scale-[1.02]'
                )}
                style={{ touchAction: 'manipulation' }}
              >
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-surface/80', type.iconColor)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{type.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{type.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────
function Composer({ type, onBack }: { type: string; onBack: () => void }) {
  const showToast = useUIStore((s) => s.showToast);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [breaking, setBreaking] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [location, setLocation] = useState('');

  const handlePost = (content: string, _audience: 'public' | 'followers' | 'private') => {
    void _audience;
    submitPost(content);
  };

  const handlePollCreate = (question: string, options: string[], durationHours: number) => {
    submitPost(question, { question, options, durationHours });
  };

  const handlePredictionCreate = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, confidence: 'low' | 'medium' | 'high') => {
    submitPost(`${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, undefined, { homeTeam, awayTeam, predictedHome: homeScore, predictedAway: awayScore, confidence });
  };

  const submitPost = async (
    content: string,
    pollData?: { question: string; options: string[]; durationHours: number },
    predictionData?: { homeTeam: string; awayTeam: string; predictedHome: number; predictedAway: number; confidence: 'low' | 'medium' | 'high' }
  ) => {
    setSubmitting(true); setError('');
    const body: Record<string, unknown> = {
      content, postType: type, mediaUrls, hashtags,
      location: location.trim() || undefined, isBreaking: breaking,
    };
    if (type === 'poll' && pollData) body.poll = { question: pollData.question, options: pollData.options, durationHours: pollData.durationHours };
    if (type === 'prediction' && predictionData) body.prediction = predictionData;

    if (isOffline()) {
      queuePost(body);
      showToast('You\u2019re offline. Post saved \u2014 will publish when you reconnect.');
      setText(''); setMediaUrls([]); setHashtags([]); setLocation(''); setBreaking(false);
      setTimeout(() => { onBack(); setActiveTab('home'); }, 600);
      setSubmitting(false); return;
    }

    try {
      const res = await apiFetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || `Failed to create post (HTTP ${res.status}).`); setSubmitting(false); return; }
      showToast('Posted successfully! 🎉');
      setText(''); setMediaUrls([]); setHashtags([]); setLocation(''); setBreaking(false);
      setTimeout(() => { onBack(); setActiveTab('home'); }, 800);
    } catch (err) {
      console.error('Create post network error:', err);
      queuePost(body);
      showToast('Network error. Post saved \u2014 will publish automatically.');
      setText(''); setMediaUrls([]); setHashtags([]); setLocation(''); setBreaking(false);
      setTimeout(() => { onBack(); setActiveTab('home'); }, 600);
    }
    setSubmitting(false);
  };

  const typeLabels: Record<string, string> = { post: 'Post', photo: 'Photo', video: 'Video', spotlight: 'Spotlight', poll: 'Poll', prediction: 'Prediction' };

  const addHashtag = () => {
    const cleaned = hashtagInput.trim().replace(/^#/, '').replace(/\s+/g, '');
    if (cleaned && !hashtags.includes(cleaned) && hashtags.length < 8) { setHashtags([...hashtags, cleaned]); setHashtagInput(''); }
  };
  const removeHashtag = (tag: string) => setHashtags(hashtags.filter(t => t !== tag));
  const showTextField = type === 'post' || type === 'photo' || type === 'video' || type === 'spotlight';
  const showHashtagsAndLocation = type === 'post' || type === 'photo' || type === 'video' || type === 'spotlight';

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-14 items-center px-4 gap-3">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground tracking-tight">Create {typeLabels[type] || 'Post'}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 pb-40">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5">
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}

        {showTextField && (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CONTENT))}
              placeholder={
                type === 'post' ? "What's on your mind?" :
                type === 'photo' ? 'Add a caption...' :
                type === 'video' ? 'Describe your video...' : 'Add a caption for your reel...'
              }
              maxLength={MAX_CONTENT}
              className="w-full min-h-[120px] rounded-xl bg-surface/60 border border-surface-border p-4 text-[13px] text-white placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-gold/50 transition-shadow"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground/50 text-right tabular-nums">{text.length}/{MAX_CONTENT}</p>
          </div>
        )}

        {type === 'photo' && <PhotoUpload mediaUrls={mediaUrls} onChange={setMediaUrls} />}
        {(type === 'video' || type === 'spotlight') && <VideoUpload mediaUrls={mediaUrls} onChange={setMediaUrls} type={type as 'video' | 'spotlight'} />}

        {showHashtagsAndLocation && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Hash className="h-3.5 w-3.5" /> Hashtags
              </label>
              {hashtags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {hashtags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-gold/10 border border-gold/20 px-2 py-1 text-xs font-medium text-gold">
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} className="text-gold/70 hover:text-red-400 transition-colors" aria-label={`Remove #${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                  placeholder="Add hashtag (Enter)" maxLength={30}
                  className="flex-1 rounded-xl bg-surface/60 border border-surface-border px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                <button onClick={addHashtag} disabled={!hashtagInput.trim() || hashtags.length >= 8}
                  className="rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-xs font-semibold text-white hover:bg-surface-elevated disabled:opacity-50 transition-colors">
                  Add
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dar es Salaam, Tanzania" maxLength={60}
                className="w-full rounded-xl bg-surface/60 border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
          </div>
        )}

        {type === 'post' && (
          <PostComposer content={text} onPost={handlePost} submitting={submitting} breaking={breaking} onToggleBreaking={() => setBreaking(b => !b)} />
        )}
        {type === 'poll' && <PollCreator onCreate={handlePollCreate} submitting={submitting} />}
        {type === 'prediction' && <PredictionCreator onCreate={handlePredictionCreate} submitting={submitting} />}

        {(type === 'photo' || type === 'video' || type === 'spotlight') && (
          <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-surface-border/60 bg-background/95 backdrop-blur-xl p-3 sm:relative sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:bottom-auto">
            <button
              onClick={() => handlePost(text, 'public')}
              disabled={(!text.trim() && mediaUrls.length === 0) || submitting}
              className={cn(
                'w-full rounded-xl py-3 text-sm font-bold transition-all duration-200',
                (!text.trim() && mediaUrls.length === 0) || submitting
                  ? 'bg-surface text-muted-foreground cursor-not-allowed'
                  : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
              )}
            >
              {submitting ? 'Posting...' : `Post ${typeLabels[type]}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}