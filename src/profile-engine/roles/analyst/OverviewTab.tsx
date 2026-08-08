'use client';

// ─── Analyst Overview Tab ─────────────────────────────────────
//
// Hero summary: analyst card (type, org, expertise), portfolio
// stats (reports, models, teams/players analyzed), accuracy preview.

import { BarChart3, Building2, Brain, Target, FileText, Boxes, Users, TrendingUp } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';
import { parsePredictions } from './PredictionsTab';

export function AnalystOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const analystType = rpString(rp, 'analystType');
  const organization = rpString(rp, 'organization');
  const expertise = rpArray(rp, 'expertise').map(String);

  const reports = rpNumber(rp, 'reportsPublished');
  const models = rpNumber(rp, 'modelsCreated');
  const teams = rpNumber(rp, 'teamsAnalyzed');
  const players = rpNumber(rp, 'playersAnalyzed');

  const predictions = parsePredictions(rpString(rp, 'predictions'));
  const correct = predictions.filter(p => p.result === 'Correct').length;
  const incorrect = predictions.filter(p => p.result === 'Incorrect').length;
  const settled = correct + incorrect;
  const accuracy = settled > 0 ? Math.round((correct / settled) * 100) : 0;
  const totalPredictions = predictions.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={BarChart3}>Analyst Card</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{analystType || 'Analyst type not set'}</p>
            {organization && <p className="text-xs text-gold truncate">{organization}</p>}
            {expertise.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{expertise.join(' · ')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Prediction accuracy hero (mini) */}
      {totalPredictions > 0 && (
        <Card hover className="border-blue-500/30">
          <SectionTitle icon={Target}>Prediction Accuracy</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-gold">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">{correct} correct · {incorrect} incorrect · {totalPredictions - settled} pending</p>
            </div>
            <div className="h-12 w-12 relative flex-shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#F5C518" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(accuracy / 100) * 97.4} 97.4`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="h-4 w-4 text-gold" />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Portfolio stats */}
      {(reports || models || teams || players) ? (
        <Card hover>
          <SectionTitle icon={Brain}>Portfolio</SectionTitle>
          <StatGrid cols={4}>
            {reports > 0 && <StatTile icon={FileText} label="Reports"   value={reports} />}
            {models > 0 &&  <StatTile icon={Boxes}    label="Models"    value={models} accent="gold" />}
            {teams > 0 &&   <StatTile icon={Building2} label="Teams"    value={teams} />}
            {players > 0 && <StatTile icon={Users}    label="Players"   value={players} />}
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
