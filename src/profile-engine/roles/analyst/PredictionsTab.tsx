'use client';

// ─── Analyst Predictions Tab (signature feature) ─────────────
//
// Parses the `predictions` textarea into a record of predictions
// with outcome tracking and an accuracy hero.
//
// Format: Match | Prediction | Actual | Result | Confidence %
// Result drives the row accent: Correct=green, Incorrect=red, Pending=gold
//
// Accuracy = Correct / (Correct + Incorrect) × 100

import { BarChart3, Target, CheckCircle2, XCircle, Clock, TrendingUp, Brain, FileText } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, ProgressBar, rpString, rpNumber } from '../../shared/ui';

interface Prediction {
  match: string;
  prediction: string;
  actual: string;
  result: 'Correct' | 'Incorrect' | 'Pending';
  confidence: number; // 0-100
}

export function parsePredictions(raw: string): Prediction[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      const rawResult = (p[3] || 'Pending').toLowerCase();
      const result: Prediction['result'] =
        rawResult.startsWith('correct') ? 'Correct' :
        rawResult.startsWith('incorr') || rawResult.startsWith('wrong') || rawResult === 'loss' ? 'Incorrect' :
        'Pending';
      const conf = Math.max(0, Math.min(100, parseInt(p[4] || '0', 10) || 0));
      return {
        match: p[0] || 'Unknown match',
        prediction: p[1] || '',
        actual: p[2] || '',
        result,
        confidence: conf,
      };
    })
    .filter(p => p.match !== 'Unknown match' || p.prediction);
}

function ResultIcon({ result }: { result: Prediction['result'] }) {
  if (result === 'Correct')   return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (result === 'Incorrect') return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  return <Clock className="h-3.5 w-3.5 text-gold" />;
}

function PredictionRow({ p }: { p: Prediction }) {
  const accentClass =
    p.result === 'Correct'   ? 'border-l-emerald-500' :
    p.result === 'Incorrect' ? 'border-l-red-500' :
    'border-l-gold';
  return (
    <div className={`rounded-lg bg-surface border border-surface-border/40 border-l-2 ${accentClass} p-2.5 mb-2`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-bold text-white leading-tight flex-1 min-w-0">{p.match}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
          <ResultIcon result={p.result} />
          <span className={p.result === 'Correct' ? 'text-emerald-400' : p.result === 'Incorrect' ? 'text-red-400' : 'text-gold'}>
            {p.result}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Predicted</p>
          <p className="text-white font-semibold truncate">{p.prediction || '—'}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Actual</p>
          <p className="text-white font-semibold truncate">{p.actual || '—'}</p>
        </div>
      </div>
      {p.confidence > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
            <span>Confidence</span>
            <span className="text-gold font-bold">{p.confidence}%</span>
          </div>
          <ProgressBar value={p.confidence} max={100} color={p.result === 'Correct' ? 'green' : p.result === 'Incorrect' ? 'red' : 'gold'} />
        </div>
      )}
    </div>
  );
}

export function AnalystPredictionsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'analyst');
  const predictions = parsePredictions(rpString(rp, 'predictions'));

  if (predictions.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title="No predictions logged yet"
        message="Add your predictions from Edit Profile → Prediction Record. Format: Match | Prediction | Actual | Result | Confidence %"
      />
    );
  }

  const correct = predictions.filter(p => p.result === 'Correct').length;
  const incorrect = predictions.filter(p => p.result === 'Incorrect').length;
  const pending = predictions.filter(p => p.result === 'Pending').length;
  const settled = correct + incorrect;
  const accuracy = settled > 0 ? Math.round((correct / settled) * 100) : 0;

  // Average confidence on settled predictions
  const settledWithConf = predictions.filter(p => p.result !== 'Pending' && p.confidence > 0);
  const avgConfidence = settledWithConf.length > 0
    ? Math.round(settledWithConf.reduce((s, p) => s + p.confidence, 0) / settledWithConf.length)
    : 0;

  // Calibration: how close confidence was to actual hit rate
  const calibration = avgConfidence > 0 ? Math.abs(avgConfidence - accuracy) : 0;

  // Sort: pending first (actionable), then by date-ish (most recent at top — assume input order is reverse-chronological)
  const sorted = [...predictions];

  return (
    <div className="flex flex-col gap-3">
      {/* Accuracy hero */}
      <Card hover className="border-blue-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Prediction Record</p>
            <p className="text-3xl font-black text-gold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Overall accuracy · {settled} settled</p>
          </div>
          <div className="h-16 w-16 relative flex-shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="#F5C518" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(accuracy / 100) * 97.4} 97.4`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="h-5 w-5 text-gold" />
            </div>
          </div>
        </div>
        <StatGrid cols={3}>
          <StatTile icon={CheckCircle2} label="Correct"   value={correct}   accent="green" />
          <StatTile icon={XCircle}      label="Incorrect" value={incorrect} accent="red" />
          <StatTile icon={Clock}        label="Pending"   value={pending}   accent="gold" />
        </StatGrid>
        {avgConfidence > 0 && (
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Avg Confidence: <span className="text-white font-semibold">{avgConfidence}%</span></span>
            <span className="text-muted-foreground">
              Calibration: <span className={calibration <= 10 ? 'text-emerald-400' : calibration <= 20 ? 'text-gold' : 'text-red-400'}>
                {calibration <= 10 ? 'Well-calibrated' : calibration <= 20 ? 'Slightly off' : 'Poorly calibrated'}
              </span>
            </span>
          </div>
        )}
      </Card>

      {/* Predictions list */}
      <Card hover>
        <SectionTitle icon={FileText} action={<Badge color="muted">{predictions.length} predictions</Badge>}>
          Recent Predictions
        </SectionTitle>
        <div className="flex flex-col">
          {sorted.map((p, i) => <PredictionRow key={i} p={p} />)}
        </div>
      </Card>
    </div>
  );
}
