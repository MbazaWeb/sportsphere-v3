'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Diamond,
  Pencil,
  X,
  Check,
  Mail,
  Phone,
  Globe,
  CalendarDays,
  DollarSign,
  FileText,
  Building2,
  BarChart3,
  Eye,
  Megaphone,
  Trophy,
  Image,
  TrendingUp,
  MousePointerClick,
  Target,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  Star,
  Layers,
  Upload,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

// ─── Types ────────────────────────────────────────────────

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  status: 'active' | 'pending' | 'expired' | 'suspended';
  contractValue: number;
  contractStart: string;
  contractEnd: string;
  website?: string;
  industry?: string;
  currency?: string;
  description?: string;
  notes?: string;
  impressionCount?: number;
  clickCount?: number;
  conversionCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  partnerId: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  objectives?: string;
  targetAudience?: string;
  createdAt: string;
  updatedAt: string;
}

interface Sponsorship {
  id: string;
  partnerId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  entityLogo?: string;
  sponsorshipType: string;
  startDate: string;
  endDate: string;
  value: number;
  displayLabel?: string;
  notes?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BrandAsset {
  id: string;
  partnerId: string;
  assetType: string;
  url: string;
  altText?: string;
  description?: string;
  isPrimary: boolean;
  sortOrder: number;
  fileSize?: string;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

interface MetricSnapshot {
  id: string;
  partnerId: string;
  date: string;
  period: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  engagement: number;
  budget: number;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  platinum: 'bg-slate-100/10 border-slate-100/30 text-slate-100',
  gold: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
  silver: 'bg-slate-400/10 border-slate-400/30 text-slate-300',
  bronze: 'bg-orange-400/10 border-orange-400/30 text-orange-300',
};

const TIER_ICONS: Record<string, string> = {
  platinum: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  pending: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  expired: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  suspended: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
};

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  active: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  paused: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  completed: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  cancelled: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  brand_awareness: 'Brand Awareness',
  product_launch: 'Product Launch',
  seasonal: 'Seasonal',
  event_specific: 'Event Specific',
  content_series: 'Content Series',
};

const SPONSORSHIP_TYPE_STYLES: Record<string, string> = {
  title: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  kit: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  sleeve: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  stadium: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  broadcast: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
  digital: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  official_partner: 'bg-amber-400/15 border-amber-400/30 text-amber-200',
  supplier: 'bg-slate-400/15 border-slate-400/30 text-slate-300',
};

const ASSET_TYPE_STYLES: Record<string, string> = {
  logo: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  banner: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  brand_guidelines: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  sponsorship_mark: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  video: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  social_template: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  press_kit: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  team: 'Team',
  competition: 'Competition',
  athlete: 'Athlete',
  event: 'Event',
};

const TABS = [
  { id: 'profile', label: 'Profile', icon: Building2 },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'sponsorships', label: 'Sponsorships', icon: Trophy },
  { id: 'assets', label: 'Brand Assets', icon: Image },
  { id: 'metrics', label: 'Metrics & Analytics', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Shared Input Styles ──────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-400/50 placeholder-slate-600 transition-colors';
const selectCls =
  'w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-400/50 transition-colors appearance-none';
const labelCls = 'block text-[10px] font-semibold uppercase text-slate-500 mb-1.5 tracking-wider';
const btnPrimary =
  'flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-40 disabled:pointer-events-none';
const btnSecondary =
  'flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition disabled:opacity-40 disabled:pointer-events-none';
const btnDanger =
  'flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:pointer-events-none';

// ─── Format Helpers ───────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtCurrency(val?: number | null) {
  if (val == null) return '—';
  return val >= 1_000_000
    ? `$${(val / 1_000_000).toFixed(1)}M`
    : val >= 1_000
      ? `$${(val / 1_000).toFixed(0)}K`
      : `$${val.toLocaleString()}`;
}

function fmtNum(val?: number | null) {
  if (val == null) return '0';
  return val.toLocaleString();
}

// ─── Component ────────────────────────────────────────────

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');

  // ── Core state ──
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // ── Edit mode ──
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    tier: 'silver' as Partner['tier'],
    status: 'pending' as Partner['status'],
    contractValue: '',
    contractStart: '',
    contractEnd: '',
    website: '',
    industry: '',
    currency: 'USD',
    description: '',
    notes: '',
  });

  // ── Sub-resources ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // ── Forms visibility ──
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showSponsorshipForm, setShowSponsorshipForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showMetricForm, setShowMetricForm] = useState(false);

  // ── Form submitting states ──
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);
  const [sponsorshipSubmitting, setSponsorshipSubmitting] = useState(false);
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [metricSubmitting, setMetricSubmitting] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Campaign form ──
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'brand_awareness',
    status: 'draft',
    startDate: '',
    endDate: '',
    budget: '',
    objectives: '',
    targetAudience: '',
  });

  // ── Sponsorship form ──
  const [sponsorshipForm, setSponsorshipForm] = useState({
    entityType: 'team',
    entityId: '',
    sponsorshipType: 'title',
    startDate: '',
    endDate: '',
    value: '',
    displayLabel: '',
    notes: '',
    isVisible: true,
  });

  // ── Asset form ──
  const [assetForm, setAssetForm] = useState({
    assetType: 'logo',
    url: '',
    altText: '',
    description: '',
    isPrimary: false,
    sortOrder: '0',
  });

  // ── Metric form ──
  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().split('T')[0],
    period: 'daily',
    impressions: '',
    clicks: '',
    conversions: '',
    budget: '',
  });

  // ── Period filter ──
  const [metricPeriod, setMetricPeriod] = useState('daily');

  // ─── Load Partner ───────────────────────────────────

  const loadPartner = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/partners/${id}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load partner');
        return;
      }
      setPartner(data);
      setEditForm({
        companyName: data.companyName || '',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        tier: data.tier || 'silver',
        status: data.status || 'pending',
        contractValue: data.contractValue != null ? String(data.contractValue) : '',
        contractStart: data.contractStart ? data.contractStart.split('T')[0] : '',
        contractEnd: data.contractEnd ? data.contractEnd.split('T')[0] : '',
        website: data.website || '',
        industry: data.industry || '',
        currency: data.currency || 'USD',
        description: data.description || '',
        notes: data.notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ─── Load Sub-resources ─────────────────────────────

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/campaigns`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
    } catch { /* ignore */ }
  }, [id]);

  const loadSponsorships = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/sponsorships`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setSponsorships(Array.isArray(data) ? data : data.sponsorships || []);
    } catch { /* ignore */ }
  }, [id]);

  const loadAssets = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/assets`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setAssets(Array.isArray(data) ? data : data.assets || []);
    } catch { /* ignore */ }
  }, [id]);

  const loadMetrics = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/metrics?period=${metricPeriod}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setMetrics(Array.isArray(data) ? data : data.metrics || []);
    } catch { /* ignore */ }
  }, [id, metricPeriod]);

  const loadSubResources = useCallback(async () => {
    setSubLoading(true);
    await Promise.all([loadCampaigns(), loadSponsorships(), loadAssets(), loadMetrics()]);
    setSubLoading(false);
  }, [loadCampaigns, loadSponsorships, loadAssets, loadMetrics]);

  useEffect(() => {
    loadPartner();
  }, [loadPartner]);

  useEffect(() => {
    if (partner) loadSubResources();
  }, [partner, loadSubResources]);

  useEffect(() => {
    if (partner) loadMetrics();
  }, [metricPeriod, partner, loadMetrics]);

  // ─── Toast Helper ────────────────────────────────────

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Save Partner (Edit) ───────────────────────────

  const handleSaveEdit = async () => {
    if (!partner) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        companyName: editForm.companyName.trim(),
        contactName: editForm.contactName.trim(),
        contactEmail: editForm.contactEmail.trim(),
        contactPhone: editForm.contactPhone.trim() || null,
        tier: editForm.tier,
        status: editForm.status,
        contractValue: parseFloat(editForm.contractValue) || 0,
        contractStart: editForm.contractStart || null,
        contractEnd: editForm.contractEnd || null,
        website: editForm.website.trim() || null,
        industry: editForm.industry.trim() || null,
        currency: editForm.currency || 'USD',
        description: editForm.description.trim() || null,
        notes: editForm.notes.trim() || null,
      };
      const res = await adminFetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data?.error || 'Failed to save changes');
      } else {
        showToast('success', 'Partner updated successfully');
        setIsEditing(false);
        await loadPartner();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Create Campaign ────────────────────────────────

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignForm.name.trim(),
          type: campaignForm.type,
          status: campaignForm.status,
          startDate: campaignForm.startDate || null,
          endDate: campaignForm.endDate || null,
          budget: parseFloat(campaignForm.budget) || 0,
          objectives: campaignForm.objectives.trim() || null,
          targetAudience: campaignForm.targetAudience.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data?.error || 'Failed to create campaign');
      } else {
        showToast('success', `Campaign "${campaignForm.name}" created`);
        setCampaignForm({ name: '', type: 'brand_awareness', status: 'draft', startDate: '', endDate: '', budget: '', objectives: '', targetAudience: '' });
        setShowCampaignForm(false);
        await loadCampaigns();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    } finally {
      setCampaignSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign? This action cannot be undone.')) return;
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/campaigns`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
      if (res.ok) {
        showToast('success', 'Campaign deleted');
        await loadCampaigns();
      } else {
        const data = await res.json();
        showToast('error', data?.error || 'Failed to delete');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    }
  };

  // ─── Create Sponsorship ─────────────────────────────

  const handleCreateSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    setSponsorshipSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/sponsorships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: sponsorshipForm.entityType,
          entityId: sponsorshipForm.entityId.trim(),
          sponsorshipType: sponsorshipForm.sponsorshipType,
          startDate: sponsorshipForm.startDate || null,
          endDate: sponsorshipForm.endDate || null,
          value: parseFloat(sponsorshipForm.value) || 0,
          displayLabel: sponsorshipForm.displayLabel.trim() || null,
          notes: sponsorshipForm.notes.trim() || null,
          isVisible: sponsorshipForm.isVisible,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data?.error || 'Failed to create sponsorship');
      } else {
        showToast('success', 'Sponsorship added');
        setSponsorshipForm({ entityType: 'team', entityId: '', sponsorshipType: 'title', startDate: '', endDate: '', value: '', displayLabel: '', notes: '', isVisible: true });
        setShowSponsorshipForm(false);
        await loadSponsorships();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    } finally {
      setSponsorshipSubmitting(false);
    }
  };

  const handleDeleteSponsorship = async (sponsorshipId: string) => {
    if (!confirm('Delete this sponsorship? This action cannot be undone.')) return;
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/sponsorships`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorshipId }),
      });
      if (res.ok) {
        showToast('success', 'Sponsorship deleted');
        await loadSponsorships();
      } else {
        const data = await res.json();
        showToast('error', data?.error || 'Failed to delete');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    }
  };

  // ─── Create Asset ───────────────────────────────────

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssetSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: assetForm.assetType,
          url: assetForm.url.trim(),
          altText: assetForm.altText.trim() || null,
          description: assetForm.description.trim() || null,
          isPrimary: assetForm.isPrimary,
          sortOrder: parseInt(assetForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data?.error || 'Failed to upload asset');
      } else {
        showToast('success', 'Asset added');
        setAssetForm({ assetType: 'logo', url: '', altText: '', description: '', isPrimary: false, sortOrder: '0' });
        setShowAssetForm(false);
        await loadAssets();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Delete this asset? This action cannot be undone.')) return;
    try {
      const res = await adminFetch(`/api/admin/partners/${id}/assets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });
      if (res.ok) {
        showToast('success', 'Asset deleted');
        await loadAssets();
      } else {
        const data = await res.json();
        showToast('error', data?.error || 'Failed to delete');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    }
  };

  // ─── Create Metric ──────────────────────────────────

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetricSubmitting(true);
    try {
      const impressions = parseInt(metricForm.impressions) || 0;
      const clicks = parseInt(metricForm.clicks) || 0;
      const conversions = parseInt(metricForm.conversions) || 0;
      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;

      const res = await adminFetch(`/api/admin/partners/${id}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: metricForm.date,
          period: metricForm.period,
          impressions,
          clicks,
          conversions,
          ctr,
          engagement: Math.round((conversions / Math.max(impressions, 1)) * 10000) / 100,
          budget: parseFloat(metricForm.budget) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data?.error || 'Failed to record metric');
      } else {
        showToast('success', 'Metric snapshot recorded');
        setMetricForm({ date: new Date().toISOString().split('T')[0], period: 'daily', impressions: '', clicks: '', conversions: '', budget: '' });
        setShowMetricForm(false);
        await loadMetrics();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Network error');
    } finally {
      setMetricSubmitting(false);
    }
  };

  // ─── Loading / Error ────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading partner&hellip;</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
        <p className="text-rose-300 text-sm">{error || 'Partner not found'}</p>
        <button onClick={() => router.push('/dashboard/partners')} className="text-amber-400 text-sm hover:underline mt-2">
          &larr; Back to Partners
        </button>
      </div>
    );
  }

  // ─── Computed ────────────────────────────────────────

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalSponsorships = sponsorships.length;
  const totalImpressions = partner.impressionCount || metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);

  const metricSummary = {
    impressions: metrics.reduce((s, m) => s + (m.impressions || 0), 0),
    clicks: metrics.reduce((s, m) => s + (m.clicks || 0), 0),
    conversions: metrics.reduce((s, m) => s + (m.conversions || 0), 0),
    ctr: metrics.length > 0 ? metrics.reduce((s, m) => s + (m.ctr || 0), 0) / metrics.length : 0,
    engagement: metrics.length > 0 ? metrics.reduce((s, m) => s + (m.engagement || 0), 0) / metrics.length : 0,
    budget: metrics.reduce((s, m) => s + (m.budget || 0), 0),
  };

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Toast ─────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-md rounded-xl border px-4 py-3 text-sm flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 1: HEADER BAR
          ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3 w-full">
          <button
            onClick={() => router.push('/dashboard/partners')}
            className="mt-1 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition shrink-0"
            title="Back to Partners"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight truncate">
                {partner.companyName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[partner.tier]}`}
              >
                <span>{TIER_ICONS[partner.tier]}</span>
                {partner.tier}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[partner.status]}`}
              >
                {partner.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                {partner.status === 'pending' && <Clock className="w-3 h-3" />}
                {partner.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                {partner.status === 'suspended' && <XCircle className="w-3 h-3" />}
                {partner.status}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {partner.industry && <span>{partner.industry} &middot; </span>}
              <span className="flex items-center gap-1 text-xs">
                <Mail className="w-3 h-3" />
                {partner.contactEmail}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} disabled={saving} className={btnSecondary}>
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className={btnPrimary}>
                <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className={btnSecondary}>
              <Pencil className="w-4 h-4" /> Edit Partner
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: OVERVIEW CARDS
          ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Contract Value */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400/70 uppercase tracking-wider font-semibold">
            <DollarSign className="w-3.5 h-3.5" /> Contract Value
          </div>
          <div className="text-2xl font-black text-amber-300 tabular-nums">
            {fmtCurrency(partner.contractValue)}
          </div>
          <div className="text-[10px] text-slate-500 uppercase">{partner.currency || 'USD'}</div>
        </div>

        {/* Active Campaigns */}
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-blue-400/70 uppercase tracking-wider font-semibold">
            <Megaphone className="w-3.5 h-3.5" /> Active Campaigns
          </div>
          <div className="text-2xl font-black text-blue-300 tabular-nums">
            {activeCampaigns}
          </div>
          <div className="text-[10px] text-slate-500 uppercase">{campaigns.length} total</div>
        </div>

        {/* Sponsorships */}
        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-purple-400/70 uppercase tracking-wider font-semibold">
            <Trophy className="w-3.5 h-3.5" /> Sponsorships
          </div>
          <div className="text-2xl font-black text-purple-300 tabular-nums">
            {totalSponsorships}
          </div>
          <div className="text-[10px] text-slate-500 uppercase">active deals</div>
        </div>

        {/* Total Impressions */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400/70 uppercase tracking-wider font-semibold">
            <Eye className="w-3.5 h-3.5" /> Impressions
          </div>
          <div className="text-2xl font-black text-emerald-300 tabular-nums">
            {totalImpressions >= 1_000_000
              ? `${(totalImpressions / 1_000_000).toFixed(1)}M`
              : totalImpressions >= 1_000
                ? `${(totalImpressions / 1_000).toFixed(0)}K`
                : fmtNum(totalImpressions)}
          </div>
          <div className="text-[10px] text-slate-500 uppercase">lifetime</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: TABS
          ═══════════════════════════════════════════════════ */}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 -mb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab A: Profile ──────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {isEditing ? (
            /* ── Edit Form ── */
            <div className="rounded-2xl border border-amber-400/20 bg-[#111118] p-6 space-y-5">
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Edit Partner Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelCls}>Company Name</span>
                  <input value={editForm.companyName} onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Industry</span>
                  <input value={editForm.industry} onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))} className={inputCls} placeholder="e.g. Technology, Sports Apparel" />
                </label>
                <label className="block">
                  <span className={labelCls}>Contact Name</span>
                  <input value={editForm.contactName} onChange={(e) => setEditForm((f) => ({ ...f, contactName: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Contact Email</span>
                  <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Contact Phone</span>
                  <input value={editForm.contactPhone} onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))} className={inputCls} placeholder="+1 (555) 000-0000" />
                </label>
                <label className="block">
                  <span className={labelCls}>Website</span>
                  <input value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} className={inputCls} placeholder="https://..." />
                </label>
                <label className="block">
                  <span className={labelCls}>Tier</span>
                  <select value={editForm.tier} onChange={(e) => setEditForm((f) => ({ ...f, tier: e.target.value as Partner['tier'] }))} className={selectCls}>
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Status</span>
                  <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Partner['status'] }))} className={selectCls}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Contract Value ($)</span>
                  <input type="number" min={0} value={editForm.contractValue} onChange={(e) => setEditForm((f) => ({ ...f, contractValue: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Currency</span>
                  <select value={editForm.currency} onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))} className={selectCls}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Contract Start</span>
                  <input type="date" value={editForm.contractStart} onChange={(e) => setEditForm((f) => ({ ...f, contractStart: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Contract End</span>
                  <input type="date" value={editForm.contractEnd} onChange={(e) => setEditForm((f) => ({ ...f, contractEnd: e.target.value }))} className={inputCls} />
                </label>
              </div>

              <label className="block">
                <span className={labelCls}>Description</span>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputCls + ' min-h-[80px] resize-y'}
                  rows={3}
                  placeholder="Brief description of the partnership..."
                />
              </label>

              <label className="block">
                <span className={labelCls}>Internal Notes</span>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputCls + ' min-h-[60px] resize-y'}
                  rows={2}
                  placeholder="Internal notes (not visible to partner)..."
                />
              </label>
            </div>
          ) : (
            /* ── Read-only Profile ── */
            <>
              {/* Contact Info Card */}
              <div className="rounded-2xl border border-white/5 bg-[#111118] p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoItem icon={Building2} label="Company" value={partner.companyName} />
                  <InfoItem icon={Mail} label="Email" value={partner.contactEmail} />
                  <InfoItem icon={Phone} label="Phone" value={partner.contactPhone} />
                  <InfoItem icon={Globe} label="Website" value={partner.website} isLink />
                </div>
              </div>

              {/* Contract Details Card */}
              <div className="rounded-2xl border border-white/5 bg-[#111118] p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> Contract Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoItem icon={DollarSign} label="Contract Value" value={`${fmtCurrency(partner.contractValue)} ${partner.currency || 'USD'}`} />
                  <InfoItem icon={CalendarDays} label="Start Date" value={fmtDate(partner.contractStart)} />
                  <InfoItem icon={CalendarDays} label="End Date" value={fmtDate(partner.contractEnd)} />
                  <InfoItem icon={Layers} label="Industry" value={partner.industry} />
                </div>
              </div>

              {/* Description Card */}
              {partner.description && (
                <div className="rounded-2xl border border-white/5 bg-[#111118] p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Description
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{partner.description}</p>
                </div>
              )}

              {/* Notes Card */}
              {partner.notes && (
                <div className="rounded-2xl border border-white/5 bg-[#111118] p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Internal Notes
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{partner.notes}</p>
                </div>
              )}

              {/* System Info Card */}
              <div className="rounded-2xl border border-white/5 bg-[#111118] p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> System Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoItem icon={Clock} label="Created" value={fmtDate(partner.createdAt)} />
                  <InfoItem icon={RefreshCw} label="Last Updated" value={fmtDate(partner.updatedAt)} />
                  <InfoItem icon={Star} label="Partner ID" value={partner.id} mono />
                  <InfoItem icon={Eye} label="Impressions" value={fmtNum(partner.impressionCount)} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Tab B: Campaigns ────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Campaigns ({campaigns.length})
            </h3>
            <button onClick={() => setShowCampaignForm(!showCampaignForm)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> New Campaign
            </button>
          </div>

          {/* New Campaign Form */}
          {showCampaignForm && (
            <div className="rounded-2xl border border-amber-400/20 bg-[#111118] p-5 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Create Campaign</h4>
              <form onSubmit={handleCreateCampaign}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block">
                    <span className={labelCls}>Campaign Name</span>
                    <input value={campaignForm.name} onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Summer 2025 Launch" required />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Type</span>
                    <select value={campaignForm.type} onChange={(e) => setCampaignForm((f) => ({ ...f, type: e.target.value }))} className={selectCls}>
                      <option value="brand_awareness">Brand Awareness</option>
                      <option value="product_launch">Product Launch</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="event_specific">Event Specific</option>
                      <option value="content_series">Content Series</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Status</span>
                    <select value={campaignForm.status} onChange={(e) => setCampaignForm((f) => ({ ...f, status: e.target.value }))} className={selectCls}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Start Date</span>
                    <input type="date" value={campaignForm.startDate} onChange={(e) => setCampaignForm((f) => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>End Date</span>
                    <input type="date" value={campaignForm.endDate} onChange={(e) => setCampaignForm((f) => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Budget ($)</span>
                    <input type="number" min={0} value={campaignForm.budget} onChange={(e) => setCampaignForm((f) => ({ ...f, budget: e.target.value }))} className={inputCls} placeholder="0.00" />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <label className="block">
                    <span className={labelCls}>Objectives</span>
                    <input value={campaignForm.objectives} onChange={(e) => setCampaignForm((f) => ({ ...f, objectives: e.target.value }))} className={inputCls} placeholder="Campaign objectives..." />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Target Audience</span>
                    <input value={campaignForm.targetAudience} onChange={(e) => setCampaignForm((f) => ({ ...f, targetAudience: e.target.value }))} className={inputCls} placeholder="e.g. 18-35 sports fans" />
                  </label>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button type="submit" disabled={campaignSubmitting} className={btnPrimary}>
                    {campaignSubmitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                  <button type="button" onClick={() => setShowCampaignForm(false)} className={btnSecondary}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns List */}
          {subLoading && campaigns.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#111118] p-12 flex flex-col items-center gap-3">
              <Megaphone className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-sm font-medium">No campaigns yet</p>
              <p className="text-slate-600 text-xs">Create your first campaign to get started.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-xl border border-white/5 bg-[#111118] p-4 space-y-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">{campaign.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${CAMPAIGN_STATUS_STYLES[campaign.status] || CAMPAIGN_STATUS_STYLES.draft}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {CAMPAIGN_TYPE_LABELS[campaign.type] || campaign.type}
                        {campaign.startDate && ` · ${fmtDate(campaign.startDate)}`}
                        {campaign.endDate && ` → ${fmtDate(campaign.endDate)}`}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0" title="Delete campaign">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniStat icon={DollarSign} label="Budget" value={fmtCurrency(campaign.budget)} color="text-amber-300" />
                    <MiniStat icon={Eye} label="Impressions" value={fmtNum(campaign.impressions)} color="text-emerald-300" />
                    <MiniStat icon={MousePointerClick} label="Clicks" value={fmtNum(campaign.clicks)} color="text-blue-300" />
                    <MiniStat icon={Target} label="Conversions" value={fmtNum(campaign.conversions)} color="text-purple-300" />
                  </div>
                  {(campaign.objectives || campaign.targetAudience) && (
                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-white/5">
                      {campaign.objectives && <p><span className="text-slate-600 font-semibold">Objectives:</span> {campaign.objectives}</p>}
                      {campaign.targetAudience && <p><span className="text-slate-600 font-semibold">Audience:</span> {campaign.targetAudience}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab C: Sponsorships ──────────────────────────── */}
      {activeTab === 'sponsorships' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Sponsorships ({sponsorships.length})
            </h3>
            <button onClick={() => setShowSponsorshipForm(!showSponsorshipForm)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Add Sponsorship
            </button>
          </div>

          {/* New Sponsorship Form */}
          {showSponsorshipForm && (
            <div className="rounded-2xl border border-amber-400/20 bg-[#111118] p-5 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Add Sponsorship</h4>
              <form onSubmit={handleCreateSponsorship}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block">
                    <span className={labelCls}>Entity Type</span>
                    <select value={sponsorshipForm.entityType} onChange={(e) => setSponsorshipForm((f) => ({ ...f, entityType: e.target.value }))} className={selectCls}>
                      <option value="team">Team</option>
                      <option value="competition">Competition</option>
                      <option value="athlete">Athlete</option>
                      <option value="event">Event</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Entity ID</span>
                    <input value={sponsorshipForm.entityId} onChange={(e) => setSponsorshipForm((f) => ({ ...f, entityId: e.target.value }))} className={inputCls} placeholder="Enter entity ID..." required />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Sponsorship Type</span>
                    <select value={sponsorshipForm.sponsorshipType} onChange={(e) => setSponsorshipForm((f) => ({ ...f, sponsorshipType: e.target.value }))} className={selectCls}>
                      <option value="title">Title Sponsor</option>
                      <option value="kit">Kit Sponsor</option>
                      <option value="sleeve">Sleeve Sponsor</option>
                      <option value="stadium">Stadium Naming</option>
                      <option value="broadcast">Broadcast Partner</option>
                      <option value="digital">Digital Partner</option>
                      <option value="official_partner">Official Partner</option>
                      <option value="supplier">Official Supplier</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Start Date</span>
                    <input type="date" value={sponsorshipForm.startDate} onChange={(e) => setSponsorshipForm((f) => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>End Date</span>
                    <input type="date" value={sponsorshipForm.endDate} onChange={(e) => setSponsorshipForm((f) => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Value ($)</span>
                    <input type="number" min={0} value={sponsorshipForm.value} onChange={(e) => setSponsorshipForm((f) => ({ ...f, value: e.target.value }))} className={inputCls} placeholder="0.00" />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <label className="block">
                    <span className={labelCls}>Display Label</span>
                    <input value={sponsorshipForm.displayLabel} onChange={(e) => setSponsorshipForm((f) => ({ ...f, displayLabel: e.target.value }))} className={inputCls} placeholder="e.g. Presented by Acme Corp" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Notes</span>
                    <input value={sponsorshipForm.notes} onChange={(e) => setSponsorshipForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Internal notes..." />
                  </label>
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sponsorshipForm.isVisible}
                    onChange={(e) => setSponsorshipForm((f) => ({ ...f, isVisible: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 bg-[#0a0a0f] text-amber-400 focus:ring-amber-400 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-300">Visible to public / fan app</span>
                </label>
                <div className="flex items-center gap-3 mt-4">
                  <button type="submit" disabled={sponsorshipSubmitting} className={btnPrimary}>
                    {sponsorshipSubmitting ? 'Adding...' : 'Add Sponsorship'}
                  </button>
                  <button type="button" onClick={() => setShowSponsorshipForm(false)} className={btnSecondary}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sponsorships List */}
          {subLoading && sponsorships.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sponsorships.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#111118] p-12 flex flex-col items-center gap-3">
              <Trophy className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-sm font-medium">No sponsorships yet</p>
              <p className="text-slate-600 text-xs">Add a sponsorship to link this partner to an entity.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {sponsorships.map((sp) => (
                <div key={sp.id} className="rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Entity avatar */}
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {sp.entityLogo ? (
                          <img src={sp.entityLogo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-400">
                            {(sp.entityName || sp.entityType || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-100">{sp.entityName || ENTITY_TYPE_LABELS[sp.entityType] || sp.entityType}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${SPONSORSHIP_TYPE_STYLES[sp.sponsorshipType] || SPONSORSHIP_TYPE_STYLES.title}`}>
                            {sp.sponsorshipType.replace(/_/g, ' ')}
                          </span>
                          {/* Visibility indicator */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sp.isVisible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-500'}`}>
                            {sp.isVisible ? <Eye className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5 opacity-50" />}
                            {sp.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {ENTITY_TYPE_LABELS[sp.entityType] || sp.entityType}
                          {sp.entityId && <span className="ml-1 text-slate-600">({sp.entityId})</span>}
                          {sp.startDate && ` · ${fmtDate(sp.startDate)}`}
                          {sp.endDate && ` → ${fmtDate(sp.endDate)}`}
                        </p>
                        {sp.displayLabel && (
                          <p className="text-xs text-amber-400/70 mt-0.5 italic">&ldquo;{sp.displayLabel}&rdquo;</p>
                        )}
                        {sp.notes && (
                          <p className="text-xs text-slate-600 mt-0.5">{sp.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button onClick={() => handleDeleteSponsorship(sp.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Delete sponsorship">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-amber-300">{fmtCurrency(sp.value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab D: Brand Assets ─────────────────────────── */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Brand Assets ({assets.length})
            </h3>
            <button onClick={() => setShowAssetForm(!showAssetForm)} className={btnPrimary}>
              <Upload className="w-4 h-4" /> Upload Asset
            </button>
          </div>

          {/* New Asset Form */}
          {showAssetForm && (
            <div className="rounded-2xl border border-amber-400/20 bg-[#111118] p-5 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Upload Brand Asset</h4>
              <form onSubmit={handleCreateAsset}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block">
                    <span className={labelCls}>Asset Type</span>
                    <select value={assetForm.assetType} onChange={(e) => setAssetForm((f) => ({ ...f, assetType: e.target.value }))} className={selectCls}>
                      <option value="logo">Logo</option>
                      <option value="banner">Banner</option>
                      <option value="brand_guidelines">Brand Guidelines</option>
                      <option value="sponsorship_mark">Sponsorship Mark</option>
                      <option value="video">Video</option>
                      <option value="social_template">Social Template</option>
                      <option value="press_kit">Press Kit</option>
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelCls}>Asset URL</span>
                    <input value={assetForm.url} onChange={(e) => setAssetForm((f) => ({ ...f, url: e.target.value }))} className={inputCls} placeholder="https://cdn.example.com/asset.png" required />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Alt Text</span>
                    <input value={assetForm.altText} onChange={(e) => setAssetForm((f) => ({ ...f, altText: e.target.value }))} className={inputCls} placeholder="Descriptive alt text" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Sort Order</span>
                    <input type="number" min={0} value={assetForm.sortOrder} onChange={(e) => setAssetForm((f) => ({ ...f, sortOrder: e.target.value }))} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Description</span>
                    <input value={assetForm.description} onChange={(e) => setAssetForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Brief description..." />
                  </label>
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assetForm.isPrimary}
                    onChange={(e) => setAssetForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 bg-[#0a0a0f] text-amber-400 focus:ring-amber-400 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-300">Set as primary asset</span>
                </label>
                <div className="flex items-center gap-3 mt-4">
                  <button type="submit" disabled={assetSubmitting} className={btnPrimary}>
                    {assetSubmitting ? 'Uploading...' : 'Add Asset'}
                  </button>
                  <button type="button" onClick={() => setShowAssetForm(false)} className={btnSecondary}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assets Grid */}
          {subLoading && assets.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#111118] p-12 flex flex-col items-center gap-3">
              <Image className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-sm font-medium">No assets uploaded</p>
              <p className="text-slate-600 text-xs">Upload logos, banners, brand guidelines, and more.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {assets.map((asset) => (
                <div key={asset.id} className="rounded-xl border border-white/5 bg-[#111118] overflow-hidden hover:border-slate-700 transition-colors group">
                  {/* Thumbnail / Preview */}
                  <div className="relative aspect-video bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                    {asset.url && (asset.assetType === 'logo' || asset.assetType === 'banner' || asset.assetType === 'sponsorship_mark' || asset.assetType === 'social_template') ? (
                      <img src={asset.url} alt={asset.altText || ''} className="max-w-full max-h-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4">
                        <FileText className="w-8 h-8 text-slate-700" />
                        <span className="text-[10px] text-slate-600 uppercase">{asset.assetType.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {/* Primary badge */}
                    {asset.isPrimary && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" /> Primary
                      </div>
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${ASSET_TYPE_STYLES[asset.assetType] || ASSET_TYPE_STYLES.logo}`}>
                        {asset.assetType.replace(/_/g, ' ')}
                      </span>
                      <button onClick={() => handleDeleteAsset(asset.id)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100" title="Delete asset">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {asset.altText && (
                      <p className="text-xs text-slate-400 truncate" title={asset.altText}>{asset.altText}</p>
                    )}
                    {asset.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{asset.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      {asset.fileSize && <span>{asset.fileSize}</span>}
                      {asset.mimeType && <span>{asset.mimeType}</span>}
                      <span>Order: {asset.sortOrder}</span>
                    </div>
                    {asset.url && (
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-amber-400/70 hover:text-amber-300 transition">
                        <Link2 className="w-2.5 h-2.5" /> View Asset
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab E: Metrics & Analytics ──────────────────── */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Metrics & Analytics
            </h3>
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-1 bg-[#111118] border border-slate-800 rounded-lg p-0.5">
                {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setMetricPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                      metricPeriod === p
                        ? 'bg-amber-400/20 text-amber-300'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowMetricForm(!showMetricForm)} className={btnPrimary}>
                <Plus className="w-4 h-4" /> Record Snapshot
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <SummaryCard icon={Eye} label="Impressions" value={fmtNum(metricSummary.impressions)} color="text-emerald-300" bg="bg-emerald-500/5" border="border-emerald-500/20" iconColor="text-emerald-400/70" />
            <SummaryCard icon={MousePointerClick} label="Clicks" value={fmtNum(metricSummary.clicks)} color="text-blue-300" bg="bg-blue-500/5" border="border-blue-500/20" iconColor="text-blue-400/70" />
            <SummaryCard icon={Target} label="Conversions" value={fmtNum(metricSummary.conversions)} color="text-purple-300" bg="bg-purple-500/5" border="border-purple-500/20" iconColor="text-purple-400/70" />
            <SummaryCard icon={TrendingUp} label="Avg CTR" value={`${metricSummary.ctr.toFixed(2)}%`} color="text-amber-300" bg="bg-amber-500/5" border="border-amber-500/20" iconColor="text-amber-400/70" />
            <SummaryCard icon={BarChart3} label="Engagement" value={`${metricSummary.engagement.toFixed(2)}%`} color="text-cyan-300" bg="bg-cyan-500/5" border="border-cyan-500/20" iconColor="text-cyan-400/70" />
            <SummaryCard icon={DollarSign} label="Budget" value={fmtCurrency(metricSummary.budget)} color="text-rose-300" bg="bg-rose-500/5" border="border-rose-500/20" iconColor="text-rose-400/70" />
          </div>

          {/* Record Metric Form */}
          {showMetricForm && (
            <div className="rounded-2xl border border-amber-400/20 bg-[#111118] p-5 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Record Metric Snapshot</h4>
              <form onSubmit={handleCreateMetric}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="block">
                    <span className={labelCls}>Date</span>
                    <input type="date" value={metricForm.date} onChange={(e) => setMetricForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} required />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Period</span>
                    <select value={metricForm.period} onChange={(e) => setMetricForm((f) => ({ ...f, period: e.target.value }))} className={selectCls}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Impressions</span>
                    <input type="number" min={0} value={metricForm.impressions} onChange={(e) => setMetricForm((f) => ({ ...f, impressions: e.target.value }))} className={inputCls} placeholder="0" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Clicks</span>
                    <input type="number" min={0} value={metricForm.clicks} onChange={(e) => setMetricForm((f) => ({ ...f, clicks: e.target.value }))} className={inputCls} placeholder="0" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Conversions</span>
                    <input type="number" min={0} value={metricForm.conversions} onChange={(e) => setMetricForm((f) => ({ ...f, conversions: e.target.value }))} className={inputCls} placeholder="0" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Budget Spent ($)</span>
                    <input type="number" min={0} step="0.01" value={metricForm.budget} onChange={(e) => setMetricForm((f) => ({ ...f, budget: e.target.value }))} className={inputCls} placeholder="0.00" />
                  </label>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button type="submit" disabled={metricSubmitting} className={btnPrimary}>
                    {metricSubmitting ? 'Recording...' : 'Record Snapshot'}
                  </button>
                  <button type="button" onClick={() => setShowMetricForm(false)} className={btnSecondary}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Metrics Table */}
          {subLoading && metrics.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#111118] p-12 flex flex-col items-center gap-3">
              <BarChart3 className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-sm font-medium">No metric snapshots</p>
              <p className="text-slate-600 text-xs">Record your first metric snapshot to start tracking performance.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[#0f141c] overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#141b26] border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Period</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Impressions</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Clicks</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Conversions</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">CTR</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Engagement</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...metrics].reverse().map((m) => (
                      <tr key={m.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-200 tabular-nums">{fmtDate(m.date)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {m.period}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-300 tabular-nums">{fmtNum(m.impressions)}</td>
                        <td className="px-4 py-3 text-right text-blue-300 tabular-nums">{fmtNum(m.clicks)}</td>
                        <td className="px-4 py-3 text-right text-purple-300 tabular-nums">{fmtNum(m.conversions)}</td>
                        <td className="px-4 py-3 text-right text-amber-300 tabular-nums font-semibold">{m.ctr?.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-cyan-300 tabular-nums">{m.engagement?.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-rose-300 tabular-nums">{fmtCurrency(m.budget)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Simple Text-based Bar Chart for Impressions */}
              <div className="border-t border-slate-800 p-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Impressions Trend (last 12 entries)</h4>
                <div className="flex items-end gap-1.5 h-20 overflow-x-auto">
                  {[...metrics].slice(-12).map((m, idx) => {
                    const maxImp = Math.max(...metrics.map((x) => x.impressions || 0), 1);
                    const height = Math.max(4, ((m.impressions || 0) / maxImp) * 100);
                    return (
                      <div key={m.id || idx} className="flex flex-col items-center gap-1 min-w-[40px] flex-1">
                        <span className="text-[9px] text-slate-500 tabular-nums">{fmtNum(m.impressions)}</span>
                        <div
                          className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/60 to-emerald-400/20 transition-all duration-300"
                          style={{ height: `${height}%` }}
                          title={`${fmtDate(m.date)}: ${fmtNum(m.impressions)} impressions`}
                        />
                        <span className="text-[8px] text-slate-600 tabular-nums">
                          {m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────

function InfoItem({
  icon: Icon,
  label,
  value,
  isLink,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  isLink?: boolean;
  mono?: boolean;
}) {
  if (!value) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          <Icon className="w-3 h-3" /> {label}
        </div>
        <p className="text-sm text-slate-600">&mdash;</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
        <Icon className="w-3 h-3" /> {label}
      </div>
      {isLink ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-400 hover:text-amber-300 transition flex items-center gap-1 truncate"
        >
          <span className="truncate">{value}</span>
          <span className="text-[10px] shrink-0">&#8599;</span>
        </a>
      ) : (
        <p className={`text-sm text-slate-300 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div>
        <div className="text-[10px] text-slate-600 uppercase font-semibold">{label}</div>
        <div className={`text-sm font-semibold tabular-nums ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  border,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  iconColor: string;
}) {
  return (
    <div className={`p-3 rounded-xl ${bg} border ${border} space-y-1`}>
      <div className={`flex items-center gap-1.5 text-[10px] ${iconColor} uppercase tracking-wider font-semibold`}>
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`text-lg font-black ${color} tabular-nums`}>{value}</div>
    </div>
  );
}
