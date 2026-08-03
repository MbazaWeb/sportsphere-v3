'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Image as ImageIcon, Video, Zap, BarChart3, Target,
  Plus, X 
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

const CREATE_TYPES = [
  { id: 'post', label: 'Post', icon: FileText, color: 'bg-blue-500/10 text-blue-400', desc: 'Share your thoughts' },
  { id: 'photo', label: 'Photo', icon: ImageIcon, color: 'bg-pink-500/10 text-pink-400', desc: 'Share a moment' },
  { id: 'video', label: 'Video', icon: Video, color: 'bg-purple-500/10 text-purple-400', desc: 'Upload a clip' },
  { id: 'spotlight', label: 'Spotlight', icon: Zap, color: 'bg-gold/10 text-gold', desc: 'Short video reel' },
  { id: 'poll', label: 'Poll', icon: BarChart3, color: 'bg-cyan-500/10 text-cyan-400', desc: 'Ask your fans' },
  { id: 'prediction', label: 'Prediction', icon: Target, color: 'bg-green-500/10 text-green-400', desc: 'Predict a match' },
];

export default function CreateTab() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const showToast = useUIStore((s) => s.showToast);
  
  const [activeType, setActiveType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20">
          <Plus className="h-10 w-10 text-gold" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Create Content</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Sign in to post, share photos, videos, polls and predictions.
        </p>
        <button 
          onClick={() => setLoginModalOpen(true)}
          className="w-full max-w-xs rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors"
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
            <motion.button
              key={type.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveType(type.id)}
              className="flex flex-col items-start gap-3 rounded-2xl glass-card border border-surface-border p-4 text-left hover:border-gold/30 transition-colors glass-card-hover"
            >
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
  const showToast = useUIStore((s) => s.showToast);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async (content: string, audience: 'public' | 'followers' | 'private') => {
    await submitPost(content);
  };

  const handlePollCreate = async (question: string, options: string[]) => {
    await submitPost(question, { question, options });
  };

  const handlePredictionCreate = async (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) => {
    await submitPost(
      `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
      undefined,
      { homeTeam, awayTeam, predictedHome: homeScore, predictedAway: awayScore }
    );
  };

  const submitPost = async (
    content: string, 
    pollData?: { question: string; options: string[] },
    predictionData?: { homeTeam: string; awayTeam: string; predictedHome: number; predictedAway: number }
  ) => {
    setSubmitting(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        content,
        postType: type,
        mediaUrls,
      };

      if (type === 'poll' && pollData) {
        body.poll = pollData;
      }

      if (type === 'prediction' && predictionData) {
        body.prediction = predictionData;
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

      showToast('Post created successfully! 🎉');
      setTimeout(() => {
        onBack();
        setActiveTab('home');
      }, 1000);
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const typeLabels: Record<string, string> = {
    post: 'Post',
    photo: 'Photo',
    video: 'Video',
    spotlight: 'Spotlight',
    poll: 'Poll',
    prediction: 'Prediction',
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4 gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Create {typeLabels[type] || 'Post'}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Text input for all types except poll and prediction */}
        {(type === 'post' || type === 'photo' || type === 'video' || type === 'spotlight') && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === 'post' ? "What's on your mind?" :
              type === 'photo' ? 'Add a caption...' :
              type === 'video' ? 'Describe your video...' :
              'Add a caption for your reel...'
            }
            className="w-full min-h-[100px] rounded-xl bg-surface border border-surface-border p-4 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-gold"
          />
        )}

        {/* Media Upload */}
        {(type === 'photo') && (
          <PhotoUpload mediaUrls={mediaUrls} onChange={setMediaUrls} />
        )}

        {(type === 'video' || type === 'spotlight') && (
          <VideoUpload mediaUrls={mediaUrls} onChange={setMediaUrls} type={type as 'video' | 'spotlight'} />
        )}

        {/* Post Composer */}
        {type === 'post' && (
          <PostComposer onPost={handlePost} submitting={submitting} />
        )}

        {/* Poll Creator */}
        {type === 'poll' && (
          <PollCreator onCreate={handlePollCreate} submitting={submitting} />
        )}

        {/* Prediction Creator */}
        {type === 'prediction' && (
          <PredictionCreator onCreate={handlePredictionCreate} submitting={submitting} />
        )}

        {/* Submit button for photo/video/spotlight */}
        {(type === 'photo' || type === 'video' || type === 'spotlight') && (
          <button
            onClick={() => handlePost(text, 'public')}
            disabled={(!text.trim() && mediaUrls.length === 0) || submitting}
            className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
