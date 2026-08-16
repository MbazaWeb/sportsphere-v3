'use client';

import { useState } from 'react';
import { Plus, X, Send, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PollCreatorProps {
  onCreate: (question: string, options: string[], durationHours: number) => void;
  submitting: boolean;
}

const DURATIONS = [
  { hours: 1,  label: '1 hour'  },
  { hours: 6,  label: '6 hours' },
  { hours: 24, label: '1 day'   },
  { hours: 72, label: '3 days'  },
  { hours: 168, label: '7 days' },
] as const;

export function PollCreator({ onCreate, submitting }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationHours, setDurationHours] = useState<number>(24);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const validOptions = options.map(o => o.trim()).filter(Boolean);
  const isValid = question.trim().length > 0 && validOptions.length >= 2;

  const handleSubmit = () => {
    if (!isValid) return;
    onCreate(question.trim(), validOptions, durationHours);
    setQuestion('');
    setOptions(['', '']);
    setDurationHours(24);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Question */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Question</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          maxLength={140}
          className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <p className="mt-1 text-[11px] text-muted-foreground/70 text-right">{question.length}/140</p>
      </div>

      {/* Options */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Options ({validOptions.length} valid)
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-elevated text-xs font-bold text-gold">
                {String.fromCharCode(65 + index)}
              </span>
              <input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={60}
                className="flex-1 rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-red-400 hover:bg-surface-elevated transition-colors"
                  aria-label={`Remove option ${String.fromCharCode(65 + index)}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button
            onClick={addOption}
            className="mt-2 flex items-center gap-2 text-sm text-gold hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add option
          </button>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Poll duration
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map(d => (
            <button
              key={d.hours}
              onClick={() => setDurationHours(d.hours)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
                durationHours === d.hours
                  ? 'bg-gold text-black border-gold'
                  : 'bg-surface text-muted-foreground border-surface-border hover:text-white'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      {isValid && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gold/80 flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" /> Preview
          </p>
          <p className="mb-2 text-sm font-semibold text-white">{question}</p>
          <div className="space-y-1.5">
            {validOptions.map((opt, i) => (
              <div
                key={i}
                className="rounded-lg bg-surface border border-surface-border px-3 py-2 text-xs text-white"
              >
                <span className="mr-2 font-bold text-gold">{String.fromCharCode(65 + i)}</span>
                {opt}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Closes in {DURATIONS.find(d => d.hours === durationHours)?.label}
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
          isValid && !submitting
            ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
            : 'bg-surface text-muted-foreground cursor-not-allowed'
        )}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Create Poll
          </>
        )}
      </button>
    </div>
  );
}
