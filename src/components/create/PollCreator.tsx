'use client';

import { useState } from 'react';
import { Plus, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PollCreatorProps {
  onCreate: (question: string, options: string[]) => void;
  submitting: boolean;
}

export function PollCreator({ onCreate, submitting }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    onCreate(question, validOptions);
    setQuestion('');
    setOptions(['', '']);
  };

  const isValid = question.trim() && options.filter(o => o.trim()).length >= 2;

  return (
    <div className="flex flex-col gap-3">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
      />

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-6">
              {String.fromCharCode(65 + index)}
            </span>
            <input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(index)}
                className="p-2 hover:bg-surface rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 6 && (
        <button
          onClick={addOption}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add option
        </button>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
          isValid && !submitting
            ? 'bg-gold text-black hover:bg-gold/90'
            : 'bg-surface text-muted-foreground cursor-not-allowed'
        )}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Creating...
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
