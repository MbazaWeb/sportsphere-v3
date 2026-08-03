'use client';

import { useState } from 'react';
import { Send, Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostComposerProps {
  onPost: (content: string, audience: 'public' | 'followers' | 'private') => void;
  submitting: boolean;
}

export function PostComposer({ onPost, submitting }: PostComposerProps) {
  const [text, setText] = useState('');
  const [audience, setAudience] = useState<'public' | 'followers' | 'private'>('public');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onPost(text, audience);
    setText('');
  };

  const audienceOptions = [
    { id: 'public', label: 'Public', icon: Globe },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'private', label: 'Private', icon: Lock },
  ];

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full min-h-[120px] rounded-xl bg-surface border border-surface-border p-4 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-gold"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {audienceOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setAudience(opt.id as typeof audience)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  audience === opt.id
                    ? 'bg-gold text-black'
                    : 'bg-surface text-muted-foreground hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className={cn(
            'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-colors',
            text.trim() && !submitting
              ? 'bg-gold text-black hover:bg-gold/90'
              : 'bg-surface text-muted-foreground cursor-not-allowed'
          )}
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post
            </>
          )}
        </button>
      </div>
    </div>
  );
}
