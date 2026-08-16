'use client';

// ─── Journalist Overview Tab ──────────────────────────────────
//
// Hero summary: journalist card (publication, beat, location), top
// impact metrics (articles, exclusives, breaking news, total views),
// credibility preview.

import { Newspaper, MapPin, Building2, Eye, Sparkles, Zap, FileText, Mic, Languages } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';
import { parseArticles, formatCount } from './ArticlesTab';

export function JournalistOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'journalist');
  const publication = rpString(rp, 'publication');
  const beat = rpString(rp, 'beat');
  const location = rpString(rp, 'location');
  const yearsActive = rpNumber(rp, 'yearsActive');
  const languages = rpArray(rp, 'languages').map(String);
  const coverage = rpArray(rp, 'coverage').map(String);

  const articles = parseArticles(rpString(rp, 'articles'));
  const articleCount = articles.length || rpNumber(rp, 'articleCount');
  const exclusives = articles.length > 0
    ? articles.filter(a => a.type.toLowerCase() === 'exclusive').length
    : rpNumber(rp, 'exclusives');
  const breakingNews = articles.length > 0
    ? articles.filter(a => a.type.toLowerCase() === 'breaking').length
    : rpNumber(rp, 'breakingNews');
  const interviews = articles.length > 0
    ? articles.filter(a => a.type.toLowerCase() === 'interview').length
    : rpNumber(rp, 'interviews');
  const totalViews = articles.length > 0
    ? articles.reduce((s, a) => s + a.views, 0)
    : rpNumber(rp, 'totalViews');

  const credentials = rpString(rp, 'pressCredentials');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Newspaper}>Journalist Card</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 border border-gold/30 flex-shrink-0">
            <Newspaper className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{publication || 'Publication not set'}</p>
            {beat && <p className="text-xs text-gold truncate">Beat: {beat}</p>}
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{location}
              </p>
            )}
          </div>
          {yearsActive > 0 && <Badge color="gold">{yearsActive}y</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {coverage.length > 0 && <KeyValueRow label="Coverage" value={coverage.join(', ')} />}
          {languages.length > 0 && <KeyValueRow label="Languages" value={languages.join(', ')} />}
        </div>
      </Card>

      {/* Impact stats */}
      {(articleCount || exclusives || breakingNews || totalViews) ? (
        <Card hover>
          <SectionTitle icon={Sparkles}>Impact Stats</SectionTitle>
          <StatGrid cols={4}>
            {articleCount > 0 && <StatTile icon={FileText} label="Articles"   value={articleCount} />}
            {exclusives > 0 &&   <StatTile icon={Sparkles} label="Exclusives" value={exclusives} accent="gold" />}
            {breakingNews > 0 && <StatTile icon={Zap}      label="Breaking"   value={breakingNews} accent="red" />}
            {interviews > 0 &&   <StatTile icon={Mic}      label="Interviews" value={interviews} accent="blue" />}
          </StatGrid>
          {totalViews > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" />Total Readership
              </span>
              <span className="text-base font-black text-gold">{formatCount(totalViews)}</span>
            </div>
          )}
        </Card>
      ) : null}

      {/* Credibility preview */}
      {credentials && (
        <Card hover>
          <SectionTitle icon={Building2}>Press Credentials</SectionTitle>
          <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{credentials}</p>
        </Card>
      )}
    </div>
  );
}
