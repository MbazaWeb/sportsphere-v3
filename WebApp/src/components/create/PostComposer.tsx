'use client';

import { Globe, Users, Lock, Send, Zap, MapPin, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PostComposerProps {
  onPost: (content: string, audience: 'public' | 'followers' | 'private') => void;
  content: string;
  submitting: boolean;
  /** Optional extra fields the user can toggle before posting */
  onToggleBreaking?: () => void;
  breaking?: boolean;
}

/**
 * PostComposer — bottom action bar for the "Post" type.
 *
 * Previously this component rendered its OWN textarea, which caused the
 * CreateTab to show TWO textareas (one from CreateTab, one from here).
 * The textarea now lives in CreateTab alone. This component is just the
 * audience selector + breaking-news toggle + submit button, designed to
 * sit at the bottom of the composer as a sticky action bar.
 */
export function PostComposer({ onPost, content, submitting, onToggleBreaking, breaking }: PostComposerProps) {
  const [audience, setAudience] = useState<'public' | 'followers' | 'private'>('public');

  const audienceOptions = [
    { id: 'public',    label: 'Public',    icon: Globe },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'private',   label: 'Private',   icon: Lock },
  ] as const;

  const canSubmit = content.trim().length > 0 && !submitting;

  return (
    <div className="space-y-3">
      {/* Audience + Breaking row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-surface p-1 border border-surface-border">
          {audienceOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setAudience(opt.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  audience === opt.id
                    ? 'bg-gold text-black'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {onToggleBreaking && (
          <button
            onClick={onToggleBreaking}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors border',
              breaking
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-surface text-muted-foreground border-surface-border hover:text-white'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Breaking</span>
          </button>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={() => canSubmit && onPost(content, audience)}
        disabled={!canSubmit}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
          canSubmit
            ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
            : 'bg-surface text-muted-foreground cursor-not-allowed'
        )}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Posting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Post
          </>
        )}
      </button>
    </div>
  );
}
