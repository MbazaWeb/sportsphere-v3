'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

type Confidence = 'low' | 'medium' | 'high';

interface EditPredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    predictedHome: number | null;
    predictedAway: number | null;
    confidence: string | null;
  };
  onUpdated?: (data: {
    homeTeam: string;
    awayTeam: string;
    predictedHome: number;
    predictedAway: number;
    confidence: Confidence;
    content: string;
  }) => void;
  onDeleted?: () => void;
}

const CONFIDENCE_OPTIONS: { id: Confidence; label: string; pct: string; color: string }[] = [
  { id: 'low',    label: 'Low',    pct: '25%',  color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { id: 'medium', label: 'Medium', pct: '50%',  color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  { id: 'high',   label: 'High',   pct: '85%',  color: 'text-green-400 border-green-500/30 bg-green-500/10' },
];

export function EditPredictionModal({
  open,
  onOpenChange,
  prediction,
  onUpdated,
  onDeleted,
}: EditPredictionModalProps) {
  const showToast = useUIStore((s) => s.showToast);

  const [homeTeam, setHomeTeam] = useState(prediction.homeTeam);
  const [awayTeam, setAwayTeam] = useState(prediction.awayTeam);
  const [homeScore, setHomeScore] = useState(
    prediction.predictedHome !== null ? String(prediction.predictedHome) : ''
  );
  const [awayScore, setAwayScore] = useState(
    prediction.predictedAway !== null ? String(prediction.predictedAway) : ''
  );
  const [confidence, setConfidence] = useState<Confidence>(
    (prediction.confidence as Confidence) ?? 'medium'
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hScore = parseInt(homeScore, 10);
  const aScore = parseInt(awayScore, 10);
  const isValid =
    homeTeam.trim() !== '' &&
    awayTeam.trim() !== '' &&
    homeScore !== '' &&
    awayScore !== '' &&
    !isNaN(hScore) &&
    !isNaN(aScore);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/predictions/${prediction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          predictedHome: hScore,
          predictedAway: aScore,
          confidence,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || 'Failed to update prediction.');
        return;
      }
      showToast('Prediction updated.');
      onUpdated?.({
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        predictedHome: hScore,
        predictedAway: aScore,
        confidence,
        content: data.content,
      });
      onOpenChange(false);
    } catch {
      showToast('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/predictions/${prediction.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data?.error || 'Failed to delete prediction.');
        return;
      }
      showToast('Prediction deleted.');
      onDeleted?.();
      onOpenChange(false);
    } catch {
      showToast('Network error — please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface-elevated border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit your prediction</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Teams */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Home team</Label>
              <Input
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                maxLength={50}
                className="mt-1 bg-surface border-surface-border text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Away team</Label>
              <Input
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                maxLength={50}
                className="mt-1 bg-surface border-surface-border text-white"
              />
            </div>
          </div>

          {/* Scores */}
          <div>
            <Label className="text-xs text-muted-foreground">Predicted score</Label>
            <div className="mt-1 grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <Input
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="0"
                inputMode="numeric"
                className="bg-surface border-surface-border text-white text-center text-2xl font-black"
              />
              <span className="text-xl font-black text-muted-foreground">-</span>
              <Input
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="0"
                inputMode="numeric"
                className="bg-surface border-surface-border text-white text-center text-2xl font-black"
              />
            </div>
          </div>

          {/* Confidence */}
          <div>
            <Label className="text-xs text-muted-foreground">Confidence</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {CONFIDENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfidence(opt.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-xs font-bold transition-all',
                    confidence === opt.id
                      ? opt.color + ' scale-[1.02]'
                      : 'bg-surface border-surface-border text-muted-foreground hover:text-white'
                  )}
                >
                  {opt.label}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">{opt.pct}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-row items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="ml-1.5 text-xs font-semibold">Delete</span>
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={saving || deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={!isValid || saving || deleting}
              className="bg-gold text-black hover:bg-gold/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
