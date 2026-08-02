'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, User, MapPin, Phone, Globe, Heart, Bell, Palette,
  ChevronRight, ChevronLeft, Search, Plus, Tag, Save, Loader2,
  Camera, Shield, BarChart3, Trophy, Users, Briefcase, Building,
  Star, Award, Clock, Target, FileText, Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

// ─── Constants ────────────────────────────────────────────────
const SPORTS = ['Football', 'Basketball', 'Volleyball', 'Rugby', 'Athletics', 'Cricket', 'Tennis', 'Golf', 'Swimming', 'Cycling', 'Boxing', 'MMA', 'Esports', 'Formula One', 'MotoGP', 'Baseball', 'Hockey', 'Netball', 'Handball', 'Other'];

const INTERESTS = ['Transfers', 'Statistics', 'Fantasy', 'Highlights', 'Live Scores', 'Sports Business', 'Coaching', 'Fitness', 'Betting News', 'Analysis', 'Youth Academy', "Women's Sports", 'Local Football', 'International Football'];

const COUNTRIES = ['All', 'England', 'Spain', 'Germany', 'France', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Brazil', 'Argentina', 'Nigeria', 'Kenya', 'Tanzania', 'South Africa', 'Egypt', 'Morocco', 'Ghana', 'Cameroon', 'Senegal', 'Ivory Coast', 'USA', 'Canada', 'Mexico', 'Japan', 'South Korea', 'China', 'India', 'Australia', 'Saudi Arabia', 'Qatar', 'UAE'];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Arabic', 'Swahili', 'Hausa', 'Yoruba', 'Chinese', 'Japanese', 'Korean', 'Hindi'];

const TIMEZONES = ['UTC', 'UTC+1', 'UTC+2', 'UTC+3 (East Africa)', 'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC-5 (EST)', 'UTC-6 (CST)', 'UTC-7 (MST)', 'UTC-8 (PST)'];

const SECTIONS = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'personal', label: 'Personal', icon: MapPin },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'sports', label: 'Sports & Interests', icon: Heart },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'role', label: 'Role Profile', icon: Award },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ─── Main Edit Profile Modal ──────────────────────────────────
export default function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const userProfile = useAuthStore((s) => s.userProfile);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const showToast = useUIStore((s) => s.showToast);

  const [activeSection, setActiveSection] = useState<SectionId>('identity');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [completion, setCompletion] = useState(0);

  // Load profile data
  useEffect(() => {
    if (!open) return;
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setFormData(data);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    loadProfile();
  }, [open]);

  // Calculate completion %
  useEffect(() => {
    if (!formData || Object.keys(formData).length === 0) { setCompletion(0); return; }
    const fields = [
      'name', 'bio', 'aboutMe', 'location', 'countryOfOrigin', 'city',
      'phone', 'website', 'dateOfBirth', 'gender', 'nationality',
    ];
    const filled = fields.filter(f => {
      const v = formData[f];
      return v && String(v).trim().length > 0;
    }).length;
    setCompletion(Math.round((filled / fields.length) * 100));
  }, [formData]);

  const update = useCallback((key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local auth store with key fields
        setUserProfile({
          ...userProfile!,
          name: data.name,
          handle: data.handle,
          bio: data.bio || '',
          location: data.location || '',
        });
        setDirty(false);
        showToast('Profile saved');
      } else {
        showToast(data.error || 'Failed to save');
      }
    } catch {
      showToast('Network error');
    }
    setSaving(false);
  };

  const handleClose = () => {
    if (dirty && !saving) {
      if (!confirm('You have unsaved changes. Leave anyway?')) return;
    }
    onClose();
    setDirty(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="w-full max-w-2xl h-[92vh] sm:h-[88vh] bg-surface-elevated border border-surface-border rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Profile</h2>
              <p className="text-[10px] text-muted-foreground">{completion}% complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Unsaved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors',
                dirty ? 'bg-gold text-black hover:bg-gold/90' : 'bg-surface text-muted-foreground cursor-not-allowed'
              )}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Completion bar */}
        <div className="flex-shrink-0 h-0.5 bg-surface">
          <div
            className="h-full bg-gradient-to-r from-gold to-emerald-400 transition-all duration-300"
            style={{ width: `${completion}%` }}
          />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Section sidebar */}
            <div className="w-44 flex-shrink-0 border-r border-surface-border overflow-y-auto scrollbar-hide">
              {SECTIONS.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-3 text-left text-xs font-medium transition-colors border-l-2',
                      isActive
                        ? 'bg-gold/10 text-gold border-gold'
                        : 'text-muted-foreground hover:text-white border-transparent hover:bg-surface'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Section content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeSection === 'identity' && <IdentitySection data={formData} update={update} />}
                  {activeSection === 'personal' && <PersonalSection data={formData} update={update} />}
                  {activeSection === 'contact' && <ContactSection data={formData} update={update} />}
                  {activeSection === 'sports' && <SportsInterestsSection data={formData} update={update} />}
                  {activeSection === 'favorites' && <FavoritesSection data={formData} />}
                  {activeSection === 'privacy' && <PrivacySection data={formData} update={update} />}
                  {activeSection === 'notifications' && <NotificationsSection data={formData} update={update} />}
                  {activeSection === 'appearance' && <AppearanceSection data={formData} update={update} />}
                  {activeSection === 'role' && <RoleProfileSection data={formData} update={update} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Reusable field components ────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string | null | undefined; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3, maxLength }: {
  value: string | null | undefined; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number;
}) {
  return (
    <div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-none rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
      />
      {maxLength && (
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {(value || '').length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string | null | undefined; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ChipSelector({ selected, onChange, options, color = 'gold' }: {
  selected: string[]; onChange: (v: string[]) => void; options: string[]; color?: 'gold' | 'blue' | 'purple';
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter(i => i !== item));
    else onChange([...selected, item]);
  };
  const colorClasses = {
    gold: 'bg-gold text-black',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(item => (
        <button
          key={item}
          onClick={() => toggle(item)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border',
            selected.includes(item)
              ? `${colorClasses[color]} border-transparent`
              : 'bg-surface border-surface-border text-muted-foreground hover:text-white'
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-gold' : 'bg-surface-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

// ─── Identity Section ─────────────────────────────────────────
function IdentitySection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Identity</h3>

      {/* Avatar + Cover */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-emerald-700 to-green-900 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-xl font-black text-black">
              {(data.avatarInitials as string) || (data.name as string)?.slice(0, 2).toUpperCase() || 'ME'}
            </div>
            <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <Camera className="h-3 w-3 text-black" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{data.name as string}</p>
            <p className="text-xs text-white/70">{data.handle as string}</p>
            <button className="mt-1 text-[10px] text-gold underline">Change Photo</button>
          </div>
        </div>
      </div>

      <Field label="Display Name">
        <TextInput value={data.name as string} onChange={(v) => update('name', v)} placeholder="Your name" />
      </Field>

      <Field label="Username / Handle">
        <TextInput value={data.handle as string} onChange={(v) => update('handle', v)} placeholder="@yourhandle" />
      </Field>

      <Field label="Short Bio" hint="A brief one-liner shown on your profile card">
        <TextArea value={data.bio as string} onChange={(v) => update('bio', v)} placeholder="Football is life. Man Utd till I die." rows={2} maxLength={160} />
      </Field>

      <Field label="About Me" hint="Tell people more about yourself">
        <TextArea value={data.aboutMe as string} onChange={(v) => update('aboutMe', v)} placeholder="I'm a passionate football fan from Dar es Salaam..." rows={4} maxLength={500} />
      </Field>

      <Field label="Pronouns">
        <Select value={data.pronouns as string} onChange={(v) => update('pronouns', v)} options={['he/him', 'she/her', 'they/them', 'he/they', 'she/they']} placeholder="Select pronouns" />
      </Field>

      <Field label="Location">
        <TextInput value={data.location as string} onChange={(v) => update('location', v)} placeholder="e.g. Dar es Salaam, Tanzania" />
      </Field>

      <Field label="Cover Gradient" hint="Choose a color theme for your profile header">
        <div className="flex flex-wrap gap-2">
          {[
            'from-emerald-600 to-emerald-900',
            'from-red-600 via-red-500 to-red-800',
            'from-blue-600 via-indigo-500 to-blue-900',
            'from-gold via-orange-500 to-red-800',
            'from-purple-600 to-purple-900',
            'from-cyan-500 to-blue-900',
          ].map(g => (
            <button
              key={g}
              onClick={() => update('coverGradient', g)}
              className={cn(
                'h-10 w-16 rounded-lg bg-gradient-to-br border-2',
                g,
                data.coverGradient === g ? 'border-white' : 'border-transparent'
              )}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Personal Section ─────────────────────────────────────────
function PersonalSection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Personal Information</h3>

      <Field label="Date of Birth">
        <input
          type="date"
          value={data.dateOfBirth ? (data.dateOfBirth as string).split('T')[0] : ''}
          onChange={(e) => update('dateOfBirth', e.target.value)}
          className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </Field>

      <Field label="Gender">
        <Select value={data.gender as string} onChange={(v) => update('gender', v)} options={['Male', 'Female', 'Non-binary', 'Prefer not to say']} placeholder="Select gender" />
      </Field>

      <Field label="Nationality">
        <Select value={data.nationality as string} onChange={(v) => update('nationality', v)} options={COUNTRIES.filter(c => c !== 'All')} placeholder="Select nationality" />
      </Field>

      <Field label="Country of Origin">
        <Select value={data.countryOfOrigin as string} onChange={(v) => update('countryOfOrigin', v)} options={COUNTRIES.filter(c => c !== 'All')} placeholder="Select country" />
      </Field>

      <Field label="Current Country">
        <Select value={data.currentCountry as string} onChange={(v) => update('currentCountry', v)} options={COUNTRIES.filter(c => c !== 'All')} placeholder="Select country" />
      </Field>

      <Field label="Region / State">
        <TextInput value={data.region as string} onChange={(v) => update('region', v)} placeholder="e.g. Dar es Salaam Region" />
      </Field>

      <Field label="City">
        <TextInput value={data.city as string} onChange={(v) => update('city', v)} placeholder="e.g. Dar es Salaam" />
      </Field>

      <Field label="Preferred Language">
        <Select value={data.preferredLanguage as string} onChange={(v) => update('preferredLanguage', v)} options={LANGUAGES} placeholder="Select language" />
      </Field>

      <Field label="Timezone">
        <Select value={data.timezone as string} onChange={(v) => update('timezone', v)} options={TIMEZONES} placeholder="Select timezone" />
      </Field>
    </div>
  );
}

// ─── Contact Section ──────────────────────────────────────────
function ContactSection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const socials = [
    { key: 'socialInstagram', label: 'Instagram', placeholder: '@username' },
    { key: 'socialX', label: 'X (Twitter)', placeholder: '@username' },
    { key: 'socialTikTok', label: 'TikTok', placeholder: '@username' },
    { key: 'socialFacebook', label: 'Facebook', placeholder: 'profile name' },
    { key: 'socialLinkedIn', label: 'LinkedIn', placeholder: 'profile name' },
    { key: 'socialYouTube', label: 'YouTube', placeholder: '@channel' },
    { key: 'socialThreads', label: 'Threads', placeholder: '@username' },
  ];

  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Contact & Social</h3>

      <Field label="Email">
        <TextInput value={data.email as string} onChange={() => {}} placeholder="email@example.com" type="email" />
      </Field>

      <Field label="Phone">
        <TextInput value={data.phone as string} onChange={(v) => update('phone', v)} placeholder="+255 7XX XXX XXX" type="tel" />
      </Field>

      <Field label="Website">
        <TextInput value={data.website as string} onChange={(v) => update('website', v)} placeholder="https://yoursite.com" type="url" />
      </Field>

      <Field label="WhatsApp">
        <TextInput value={data.whatsapp as string} onChange={(v) => update('whatsapp', v)} placeholder="+255 7XX XXX XXX" type="tel" />
      </Field>

      <div className="mt-6 mb-2">
        <p className="text-xs font-bold text-gold uppercase tracking-wider">Social Links</p>
      </div>

      {socials.map(s => (
        <Field key={s.key} label={s.label}>
          <TextInput value={data[s.key] as string} onChange={(v) => update(s.key, v)} placeholder={s.placeholder} />
        </Field>
      ))}
    </div>
  );
}

// ─── Sports & Interests Section ───────────────────────────────
function SportsInterestsSection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const sports = (data.sportsFollowing as string[]) || [];

  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Sports & Interests</h3>

      <Field label="Sports You Follow" hint="Select all that apply">
        <ChipSelector
          selected={sports}
          onChange={(v) => update('sportsFollowing', v)}
          options={SPORTS}
          color="gold"
        />
      </Field>

      <div className="mt-6">
        <Field label="Interests" hint="What topics interest you?">
          <ChipSelector
            selected={(data.interests as string[]) || []}
            onChange={(v) => update('interests', v)}
            options={INTERESTS}
            color="purple"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Favorites Section ────────────────────────────────────────
function FavoritesSection({ data }: { data: Record<string, unknown> }) {
  const favorites = (data.favorites as Array<{ id: string; targetType: string; targetName: string; targetHandle: string | null }>) || [];
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState('team');
  const [newName, setNewName] = useState('');
  const showToast = useUIStore((s) => s.showToast);

  const types = [
    { id: 'team', label: 'Team', icon: Users },
    { id: 'player', label: 'Player', icon: User },
    { id: 'coach', label: 'Coach', icon: Briefcase },
    { id: 'stadium', label: 'Stadium', icon: Building },
    { id: 'league', label: 'League', icon: Trophy },
    { id: 'national_team', label: 'National Team', icon: Globe },
    { id: 'competition', label: 'Competition', icon: Award },
  ];

  const addFavorite = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/profile/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: newType, targetName: newName.trim() }),
      });
      if (res.ok) {
        showToast('Favorite added');
        setNewName('');
        setAdding(false);
        // Reload data
        window.location.reload();
      }
    } catch { showToast('Failed to add'); }
  };

  const removeFavorite = async (id: string) => {
    try {
      await fetch(`/api/profile/favorites?id=${id}`, { method: 'DELETE' });
      showToast('Removed');
      window.location.reload();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Favorites</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-black"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-xl bg-surface border border-surface-border p-3">
          <Field label="Type">
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t.id}
                  onClick={() => setNewType(t.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold',
                    newType === t.id ? 'bg-gold text-black' : 'bg-surface-elevated text-muted-foreground'
                  )}
                >
                  <t.icon className="h-3 w-3" /> {t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Name">
            <TextInput value={newName} onChange={setNewName} placeholder="e.g. Manchester United" />
          </Field>
          <button
            onClick={addFavorite}
            disabled={!newName.trim()}
            className="w-full rounded-xl bg-gold py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            Add Favorite
          </button>
        </div>
      )}

      {favorites.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">No favorites yet. Add teams, players, coaches and more!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {types.map(type => {
            const items = favorites.filter(f => f.targetType === type.id);
            if (items.length === 0) return null;
            const Icon = type.icon;
            return (
              <div key={type.id} className="rounded-xl bg-surface border border-surface-border p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                  <Icon className="h-3 w-3" /> {type.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(item => (
                    <span
                      key={item.id}
                      className="flex items-center gap-1 rounded-lg bg-surface-elevated px-2 py-1 text-xs text-white"
                    >
                      {item.targetName}
                      <button onClick={() => removeFavorite(item.id)} className="text-muted-foreground hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Privacy Section ──────────────────────────────────────────
function PrivacySection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const privacy = (data.privacySettings as Record<string, boolean>) || {};

  const setPrivacy = (key: string, value: boolean) => {
    update('privacySettings', { ...privacy, [key]: value });
  };

  const items = [
    { key: 'showProfile', label: 'Public Profile', desc: 'Anyone can view your profile' },
    { key: 'showPhone', label: 'Show Phone', desc: 'Display phone number on profile' },
    { key: 'showEmail', label: 'Show Email', desc: 'Display email on profile' },
    { key: 'allowMessages', label: 'Allow Messages', desc: 'Anyone can send you DMs' },
    { key: 'allowFollow', label: 'Allow Follow', desc: 'Anyone can follow you' },
    { key: 'allowMention', label: 'Allow Mentions', desc: 'Anyone can mention you in posts' },
    { key: 'allowTag', label: 'Allow Tags', desc: 'Anyone can tag you in photos' },
    { key: 'showActivity', label: 'Show Activity', desc: 'Display your activity feed' },
    { key: 'showOnline', label: 'Show Online Status', desc: 'Display when you are online' },
    { key: 'showLocation', label: 'Location Visibility', desc: 'Show your city/region' },
  ];

  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Privacy Settings</h3>
      <div className="divide-y divide-surface-border">
        {items.map(item => (
          <Toggle
            key={item.key}
            checked={privacy[item.key] !== false}
            onChange={(v) => setPrivacy(item.key, v)}
            label={item.label}
            description={item.desc}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────
function NotificationsSection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const prefs = (data.notifPrefs as Record<string, boolean>) || {};

  const setPref = (key: string, value: boolean) => {
    update('notifPrefs', { ...prefs, [key]: value });
  };

  const groups = [
    { title: 'Channels', items: [
      { key: 'push', label: 'Push Notifications', desc: 'Browser/device push' },
      { key: 'email', label: 'Email', desc: 'Send to your email' },
      { key: 'sms', label: 'SMS', desc: 'Text messages' },
      { key: 'inApp', label: 'In-App', desc: 'Show inside the app' },
    ]},
    { title: 'Alerts', items: [
      { key: 'matchAlerts', label: 'Match Alerts', desc: 'Match start/goal/full-time' },
      { key: 'transferAlerts', label: 'Transfer Alerts', desc: 'Breaking transfer news' },
      { key: 'breakingNews', label: 'Breaking News', desc: 'Major sports news' },
      { key: 'liveScoreAlerts', label: 'Live Score Alerts', desc: 'Goals from followed teams' },
      { key: 'teamUpdates', label: 'Team Updates', desc: 'Posts from followed teams' },
      { key: 'leagueUpdates', label: 'League Updates', desc: 'Standings/fixtures' },
      { key: 'playerUpdates', label: 'Player Updates', desc: 'Posts from followed players' },
    ]},
  ];

  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Notification Preferences</h3>
      {groups.map(group => (
        <div key={group.title} className="mb-6">
          <p className="mb-2 text-[10px] font-bold text-gold uppercase tracking-wider">{group.title}</p>
          <div className="divide-y divide-surface-border">
            {group.items.map(item => (
              <Toggle
                key={item.key}
                checked={prefs[item.key] !== false}
                onChange={(v) => setPref(item.key, v)}
                label={item.label}
                description={item.desc}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Appearance Section ───────────────────────────────────────
function AppearanceSection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">Appearance</h3>

      <Field label="Theme">
        <div className="flex gap-2">
          {['dark', 'light', 'system'].map(t => (
            <button
              key={t}
              onClick={() => update('theme', t)}
              className={cn(
                'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors',
                (data.theme as string) === t
                  ? 'bg-gold text-black border-gold'
                  : 'bg-surface border-surface-border text-muted-foreground hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Font Size">
        <div className="flex gap-2">
          {['small', 'medium', 'large'].map(s => (
            <button
              key={s}
              onClick={() => update('fontSize', s)}
              className={cn(
                'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors',
                (data.fontSize as string) === s
                  ? 'bg-gold text-black border-gold'
                  : 'bg-surface border-surface-border text-muted-foreground hover:text-white'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <div className="mt-6 divide-y divide-surface-border">
        <Toggle
          checked={data.reducedMotion as boolean}
          onChange={(v) => update('reducedMotion', v)}
          label="Reduced Motion"
          description="Minimize animations and transitions"
        />
        <Toggle
          checked={data.highContrast as boolean}
          onChange={(v) => update('highContrast', v)}
          label="High Contrast"
          description="Increase text/background contrast for readability"
        />
      </div>
    </div>
  );
}

// ─── Role Profile Section (role-specific) ─────────────────────
function RoleProfileSection({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const role = (data.role as string) || 'fan';
  const roleProfile = (data.roleProfile as Record<string, unknown>) || {};

  const updateRole = (key: string, value: unknown) => {
    update('roleProfile', { ...roleProfile, [key]: value });
  };

  // Role-specific fields
  const roleConfigs: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'select' | 'chips'; options?: string[]; placeholder?: string }>> = {
    fan: [
      { key: 'fanType', label: 'Fan Type', type: 'select', options: ['Ultra', 'Casual', 'Family', 'Collector', 'Content Creator', 'Fantasy Player', 'Analyst', 'Scout'] },
      { key: 'supporterSince', label: 'Supporter Since (Year)', type: 'text', placeholder: '2005' },
      { key: 'dreamStadium', label: 'Dream Stadium', type: 'text', placeholder: 'Old Trafford' },
      { key: 'favoriteMatch', label: 'Favorite Match Attended', type: 'text', placeholder: 'Man Utd vs Arsenal 2008' },
      { key: 'matchesAttended', label: 'Matches Attended', type: 'text', placeholder: '50+' },
      { key: 'favoriteJersey', label: 'Favorite Jersey', type: 'text', placeholder: 'Home 23/24' },
      { key: 'collectionCount', label: 'Jersey Collection Count', type: 'text', placeholder: '12' },
      { key: 'favoriteBrand', label: 'Favorite Brand', type: 'text', placeholder: 'Nike' },
      { key: 'fantasyPlatform', label: 'Fantasy Platform', type: 'text', placeholder: 'FPL' },
    ],
    player: [
      { key: 'position', label: 'Playing Position', type: 'select', options: ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CF'] },
      { key: 'secondaryPosition', label: 'Secondary Position', type: 'select', options: ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CF'] },
      { key: 'height', label: 'Height (cm)', type: 'text', placeholder: '180' },
      { key: 'weight', label: 'Weight (kg)', type: 'text', placeholder: '75' },
      { key: 'preferredFoot', label: 'Preferred Foot', type: 'select', options: ['Left', 'Right', 'Both'] },
      { key: 'currentClub', label: 'Current Club', type: 'text', placeholder: 'Manchester United' },
      { key: 'contractUntil', label: 'Contract Until', type: 'text', placeholder: '2027' },
      { key: 'agent', label: 'Agent', type: 'text', placeholder: 'Agency name' },
      { key: 'transferValue', label: 'Transfer Value', type: 'text', placeholder: '£80M' },
      { key: 'nationalTeam', label: 'National Team', type: 'text', placeholder: 'England' },
      { key: 'goals', label: 'Career Goals', type: 'text', placeholder: '150' },
      { key: 'assists', label: 'Career Assists', type: 'text', placeholder: '80' },
      { key: 'appearances', label: 'Career Appearances', type: 'text', placeholder: '400' },
    ],
    team: [
      { key: 'foundedYear', label: 'Foundation Year', type: 'text', placeholder: '1878' },
      { key: 'president', label: 'President', type: 'text', placeholder: 'Name' },
      { key: 'owner', label: 'Owner', type: 'text', placeholder: 'Name' },
      { key: 'coach', label: 'Head Coach', type: 'text', placeholder: 'Pep Guardiola' },
      { key: 'captain', label: 'Captain', type: 'text', placeholder: 'Bruno Fernandes' },
      { key: 'league', label: 'League', type: 'text', placeholder: 'Premier League' },
      { key: 'division', label: 'Division', type: 'text', placeholder: '1st' },
      { key: 'stadium', label: 'Stadium', type: 'text', placeholder: 'Old Trafford' },
      { key: 'capacity', label: 'Stadium Capacity', type: 'text', placeholder: '74310' },
      { key: 'clubColors', label: 'Club Colors', type: 'text', placeholder: 'Red, White, Black' },
      { key: 'website', label: 'Official Website', type: 'text', placeholder: 'https://...' },
      { key: 'trophies', label: 'Total Trophies', type: 'text', placeholder: '66' },
    ],
    coach: [
      { key: 'license', label: 'License', type: 'text', placeholder: 'UEFA Pro License' },
      { key: 'experience', label: 'Experience (years)', type: 'text', placeholder: '15' },
      { key: 'formation', label: 'Preferred Formation', type: 'select', options: ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2'] },
      { key: 'currentTeam', label: 'Current Team', type: 'text', placeholder: 'Manchester City' },
      { key: 'winRate', label: 'Win Rate', type: 'text', placeholder: '72%' },
    ],
    referee: [
      { key: 'level', label: 'Level', type: 'text', placeholder: 'FIFA Elite' },
      { key: 'association', label: 'Association', type: 'text', placeholder: 'PGMOL' },
      { key: 'years', label: 'Years Officiating', type: 'text', placeholder: '15' },
      { key: 'matchesOfficiated', label: 'Matches Officiated', type: 'text', placeholder: '520+' },
    ],
    journalist: [
      { key: 'mediaHouse', label: 'Media House', type: 'text', placeholder: 'Guardian' },
      { key: 'topicsCovered', label: 'Topics Covered', type: 'text', placeholder: 'Transfers, Tactics' },
      { key: 'articles', label: 'Articles Published', type: 'text', placeholder: '1200+' },
    ],
    analyst: [
      { key: 'specialization', label: 'Specialization', type: 'text', placeholder: 'Tactical Analysis' },
      { key: 'dataModels', label: 'Data Models', type: 'text', placeholder: 'xG, PPDA' },
      { key: 'reports', label: 'Reports Published', type: 'text', placeholder: '450+' },
    ],
    creator: [
      { key: 'contentCategories', label: 'Content Categories', type: 'text', placeholder: 'Highlights, Vlogs' },
      { key: 'followers', label: 'Total Followers', type: 'text', placeholder: '2.1M' },
      { key: 'platforms', label: 'Platforms', type: 'text', placeholder: 'YouTube, TikTok, IG' },
      { key: 'equipment', label: 'Equipment', type: 'text', placeholder: 'Sony A7IV' },
    ],
    scout: [
      { key: 'coverageCountries', label: 'Coverage Countries', type: 'text', placeholder: 'Kenya, Tanzania, Nigeria' },
      { key: 'specialization', label: 'Specialization', type: 'select', options: ['Youth', 'Professional', 'Women', 'Goalkeepers'] },
      { key: 'reports', label: 'Reports Filed', type: 'text', placeholder: '230+' },
    ],
    stadium: [
      { key: 'capacity', label: 'Capacity', type: 'text', placeholder: '74310' },
      { key: 'surface', label: 'Surface', type: 'text', placeholder: 'Grass' },
      { key: 'address', label: 'Address', type: 'text', placeholder: 'Sir Matt Busby Way, Manchester' },
      { key: 'parking', label: 'Parking', type: 'text', placeholder: 'Yes - 3000 spaces' },
    ],
    academy: [
      { key: 'programs', label: 'Programs', type: 'text', placeholder: 'U9-U18' },
      { key: 'graduates', label: 'Notable Graduates', type: 'text', placeholder: 'Messi, Xavi, Iniesta' },
    ],
    community: [
      { key: 'topic', label: 'Community Topic', type: 'text', placeholder: 'Arsenal' },
      { key: 'memberCount', label: 'Member Count', type: 'text', placeholder: '125000' },
      { key: 'rules', label: 'Community Rules', type: 'textarea', placeholder: 'Be respectful...' },
    ],
    organization: [
      { key: 'orgType', label: 'Organization Type', type: 'text', placeholder: 'Governing Body' },
      { key: 'mission', label: 'Mission', type: 'textarea', placeholder: 'Develop football worldwide' },
      { key: 'programs', label: 'Programs', type: 'text', placeholder: 'World Cup, Club WC' },
    ],
    business: [
      { key: 'industry', label: 'Industry', type: 'text', placeholder: 'Sportswear' },
      { key: 'products', label: 'Products', type: 'text', placeholder: 'Boots, Kits, Balls' },
      { key: 'branches', label: 'Branches', type: 'text', placeholder: 'Worldwide' },
      { key: 'businessHours', label: 'Business Hours', type: 'text', placeholder: '9-5' },
    ],
    venue: [
      { key: 'venueType', label: 'Venue Type', type: 'text', placeholder: 'Multi-purpose' },
      { key: 'capacity', label: 'Capacity', type: 'text', placeholder: '90000' },
      { key: 'events', label: 'Events Held', type: 'text', placeholder: 'FA Cup Finals, Concerts' },
    ],
  };

  const fields = roleConfigs[role] || [];

  if (fields.length === 0) {
    return (
      <div>
        <h3 className="mb-4 text-sm font-bold text-white">Role Profile</h3>
        <p className="text-center text-xs text-muted-foreground py-8">No role-specific fields for this role yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-1 text-sm font-bold text-white capitalize">{role} Profile</h3>
      <p className="mb-4 text-[10px] text-muted-foreground">Fields specific to your role: {role}</p>

      {fields.map(field => (
        <Field key={field.key} label={field.label}>
          {field.type === 'text' && (
            <TextInput
              value={roleProfile[field.key] as string}
              onChange={(v) => updateRole(field.key, v)}
              placeholder={field.placeholder}
            />
          )}
          {field.type === 'textarea' && (
            <TextArea
              value={roleProfile[field.key] as string}
              onChange={(v) => updateRole(field.key, v)}
              placeholder={field.placeholder}
              rows={3}
            />
          )}
          {field.type === 'select' && (
            <Select
              value={roleProfile[field.key] as string}
              onChange={(v) => updateRole(field.key, v)}
              options={field.options || []}
              placeholder="Select..."
            />
          )}
        </Field>
      ))}
    </div>
  );
}
