'use client';

// ─── Journalist Articles Tab (signature feature) ──────────────
//
// Parses the `articles` textarea into a portfolio grid of article
// cards with engagement metrics (views, likes, comments).
//
// Format: Title | Publication | Date | URL | Views | Likes | Comments | Type
// Type drives the badge color:
//   Exclusive → gold
//   Breaking  → red
//   Interview → blue
//   Feature   → muted
//   Opinion   → green

import { Newspaper, Eye, Heart, MessageCircle, ExternalLink, FileText, Sparkles, Zap } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, ProgressBar, rpString, rpNumber } from '../../shared/ui';

export interface ArticleEntry {
  title: string;
  publication: string;
  date: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  type: string; // Exclusive | Breaking | Interview | Feature | Opinion
}

const TYPE_BADGE: Record<string, 'gold' | 'red' | 'blue' | 'muted' | 'green'> = {
  exclusive: 'gold',
  breaking:  'red',
  interview: 'blue',
  feature:   'muted',
  opinion:   'green',
};

function parseCount(v: string): number {
  if (!v) return 0;
  const s = v.trim().toLowerCase().replace(/,/g, '');
  const m = s.match(/^([\d.]+)\s*([km])?$/);
  if (!m) return parseInt(s, 10) || 0;
  const n = parseFloat(m[1]);
  if (m[2] === 'k') return Math.round(n * 1000);
  if (m[2] === 'm') return Math.round(n * 1_000_000);
  return Math.round(n);
}

export function parseArticles(raw: string): ArticleEntry[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        title:       parts[0] || 'Untitled',
        publication: parts[1] || '',
        date:        parts[2] || '',
        url:         parts[3] || '',
        views:       parseCount(parts[4] || ''),
        likes:       parseCount(parts[5] || ''),
        comments:    parseCount(parts[6] || ''),
        type:        parts[7] || 'Feature',
      };
    })
    .filter(a => a.title !== 'Untitled' || a.url);
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ArticleCard({ article }: { article: ArticleEntry }) {
  const badgeColor = TYPE_BADGE[article.type.toLowerCase()] || 'muted';
  const maxEng = Math.max(article.views, 1);
  return (
    <div className="rounded-lg bg-surface border border-surface-border/60 p-3 hover:border-gold/40 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <Badge color={badgeColor}>{article.type}</Badge>
        {article.date && <span className="text-[10px] text-muted-foreground">{article.date}</span>}
      </div>
      <p className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2">{article.title}</p>
      {article.publication && <p className="text-[11px] text-gold mb-2">{article.publication}</p>}

      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span className="text-[10px] font-semibold text-white">{formatCount(article.views)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Heart className="h-3 w-3" />
          <span className="text-[10px] font-semibold text-white">{formatCount(article.likes)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageCircle className="h-3 w-3" />
          <span className="text-[10px] font-semibold text-white">{formatCount(article.comments)}</span>
        </div>
      </div>

      <ProgressBar value={article.views} max={maxEng} color="gold" />

      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-gold hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Read article
        </a>
      )}
    </div>
  );
}

export function JournalistArticlesTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'journalist');
  const articles = parseArticles(rpString(rp, 'articles'));

  // Aggregate metrics from the article list (fallback to declared aggregates if list is empty)
  const totalViews  = articles.length > 0 ? articles.reduce((s, a) => s + a.views, 0)  : parseCount(rpString(rp, 'totalViews'));
  const totalLikes  = articles.reduce((s, a) => s + a.likes, 0);
  const totalComments = articles.reduce((s, a) => s + a.comments, 0);

  const breakingCount = articles.filter(a => a.type.toLowerCase() === 'breaking').length;
  const exclusiveCount = articles.filter(a => a.type.toLowerCase() === 'exclusive').length;
  const interviewCount = articles.filter(a => a.type.toLowerCase() === 'interview').length;

  if (articles.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No articles published yet"
        message="Add your articles from Edit Profile → Article Portfolio. Format: Title | Publication | Date | URL | Views | Likes | Comments | Type"
      />
    );
  }

  // Sort by views descending
  const sorted = [...articles].sort((a, b) => b.views - a.views);

  return (
    <div className="flex flex-col gap-3">
      {/* Aggregate stats */}
      <Card hover>
        <SectionTitle icon={Newspaper} action={<Badge color="muted">{articles.length} articles</Badge>}>
          Portfolio Metrics
        </SectionTitle>
        <StatGrid cols={4}>
          <StatTile icon={Eye}            label="Total Views"    value={formatCount(totalViews)} accent="gold" />
          <StatTile icon={Heart}          label="Total Likes"    value={formatCount(totalLikes)} />
          <StatTile icon={MessageCircle}  label="Comments"       value={formatCount(totalComments)} />
          <StatTile icon={Zap}            label="Breaking"       value={breakingCount} accent="red" />
        </StatGrid>
        {(exclusiveCount > 0 || interviewCount > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {exclusiveCount > 0 && <Badge color="gold"><Sparkles className="h-3 w-3" />{exclusiveCount} Exclusive</Badge>}
            {interviewCount > 0 && <Badge color="blue"><MessageCircle className="h-3 w-3" />{interviewCount} Interview</Badge>}
          </div>
        )}
      </Card>

      {/* Article grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map((a, i) => <ArticleCard key={i} article={a} />)}
      </div>
    </div>
  );
}
