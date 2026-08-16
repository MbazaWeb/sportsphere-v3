// ─── Creator Role Config ──────────────────────────────────────
//
// Creator's signature feature is the **Media Kit** — a polished
// portfolio card with audience demographics, top platforms, top
// content, and monetization info.
//
// Top content is entered in the edit form as a textarea, one per line:
//   "Title | Platform | Type | URL | Views | Likes"
//
// Brand collabs are entered as a textarea, one per line:
//   "Brand | Campaign | Year | Value"

import { Camera } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const CREATOR_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'spotlight', label: 'Media Kit' },
  { id: 'career',    label: 'Career'    },
  { id: 'about',     label: 'About'     },
];

export const CREATOR_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'creatorType',      label: 'Creator Type',       type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Podcaster', 'Streamer', 'Influencer', 'YouTuber', 'Graphic Designer', 'Photographer', 'Videographer'] },
  { key: 'platforms',        label: 'Platforms',          type: 'chips',  section: 'identity', group: 'Identity', hint: 'YouTube, TikTok, Instagram...' },
  { key: 'niche',            label: 'Niche',              type: 'text',   section: 'identity', group: 'Identity', placeholder: 'Match analysis, highlights, comedy...' },
  { key: 'audienceLocation', label: 'Audience Location',  type: 'text',   section: 'identity', group: 'Identity', placeholder: 'Tanzania, Kenya...' },
  { key: 'audienceAgeRange', label: 'Audience Age Range', type: 'text',   section: 'identity', group: 'Identity', placeholder: '18-34' },
  { key: 'audienceGender',   label: 'Audience Gender Split', type: 'text', section: 'identity', group: 'Identity', placeholder: '60% M / 40% F' },
  { key: 'languages',        label: 'Languages',          type: 'chips',  section: 'identity', group: 'Identity' },

  // ── Analytics ──
  { key: 'followers',      label: 'Total Followers',   type: 'text',   section: 'performance', group: 'Analytics', placeholder: '450K' },
  { key: 'engagementRate', label: 'Engagement Rate %', type: 'number', section: 'performance', group: 'Analytics', placeholder: '8.4' },
  { key: 'avgViews',       label: 'Average Views',     type: 'text',   section: 'performance', group: 'Analytics', placeholder: '120K' },
  { key: 'reach',          label: 'Monthly Reach',     type: 'text',   section: 'performance', group: 'Analytics' },
  { key: 'postsPerWeek',   label: 'Posts per Week',    type: 'number', section: 'performance', group: 'Analytics' },

  // ── Portfolio (top content) ──
  { key: 'topContent',     label: 'Top Content',       type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One per line: Title | Platform | Type | URL | Views | Likes' },

  // ── Monetization ──
  { key: 'brandCollabs',   label: 'Brand Collaborations', type: 'textarea', section: 'performance', group: 'Monetization',
    hint: 'One per line: Brand | Campaign | Year | Value' },
  { key: 'bookingEmail',   label: 'Booking Email',     type: 'text',   section: 'performance', group: 'Monetization', placeholder: 'bookings@example.com' },
];

export const creatorConfig: RoleConfig = {
  role: 'creator',
  label: 'Creator',
  icon: Camera,
  accent: '#FF6B35',
  tagline: 'Creator portfolio: content, analytics, media kit.',
  tabs: CREATOR_TABS,
  fields: CREATOR_FIELDS,
};
