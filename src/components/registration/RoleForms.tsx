'use client';

import { type ProfileTypeId } from '@/store/useAppStore';

interface RoleFormsProps {
  role: ProfileTypeId;
  data: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}

function FormField({ label, placeholder, value, onChange, type = 'text', optional = false }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} {optional && <span className="text-muted-foreground/50">(optional)</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
      />
    </div>
  );
}

function SelectField({ label, placeholder, value, onChange, options }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors appearance-none"
      >
        <option value="" className="bg-surface text-muted-foreground">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-white">{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

const SPORTS_OPTIONS = [
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'rugby', label: 'Rugby' },
  { value: 'boxing', label: 'Boxing / MMA' },
  { value: 'f1', label: 'Formula 1' },
  { value: 'athletics', label: 'Athletics' },
  { value: 'golf', label: 'Golf' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'other', label: 'Other' },
];

export default function RoleForms({ role, data, onChange }: RoleFormsProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  switch (role) {
    case 'team':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sport"
            placeholder="Select primary sport"
            value={data.sport || ''}
            onChange={(v) => update('sport', v)}
            options={SPORTS_OPTIONS}
          />
          <FormField label="Country" placeholder="e.g. England" value={data.country || ''} onChange={(v) => update('country', v)} />
          <FormField label="City" placeholder="e.g. Manchester" value={data.city || ''} onChange={(v) => update('city', v)} />
          <FormField label="Founded Year" placeholder="e.g. 1878" value={data.founded || ''} onChange={(v) => update('founded', v)} type="number" />
          <FormField label="League / Competition" placeholder="e.g. Premier League" value={data.league || ''} onChange={(v) => update('league', v)} />
          <FormField label="Home Stadium" placeholder="e.g. Old Trafford" value={data.stadium || ''} onChange={(v) => update('stadium', v)} />
          <FormField label="Team Website" placeholder="https://" value={data.website || ''} onChange={(v) => update('website', v)} optional />
          <FormField label="Team Colors" placeholder="e.g. Red, White, Black" value={data.colors || ''} onChange={(v) => update('colors', v)} optional />
        </div>
      );

    case 'player':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sport"
            placeholder="Select your sport"
            value={data.sport || ''}
            onChange={(v) => update('sport', v)}
            options={SPORTS_OPTIONS}
          />
          <FormField label="Position" placeholder="e.g. Forward, Midfielder, Goalkeeper" value={data.position || ''} onChange={(v) => update('position', v)} />
          <FormField label="Current Team" placeholder="e.g. Manchester United" value={data.currentTeam || ''} onChange={(v) => update('currentTeam', v)} />
          <FormField label="Jersey Number" placeholder="e.g. 10" value={data.jerseyNumber || ''} onChange={(v) => update('jerseyNumber', v)} type="number" optional />
          <FormField label="Nationality" placeholder="e.g. England" value={data.nationality || ''} onChange={(v) => update('nationality', v)} />
          <FormField label="Date of Birth" placeholder="YYYY-MM-DD" value={data.dob || ''} onChange={(v) => update('dob', v)} type="date" />
          <FormField label="Height" placeholder="e.g. 5ft 11in / 180cm" value={data.height || ''} onChange={(v) => update('height', v)} optional />
          <FormField label="Preferred Foot" placeholder="e.g. Right, Left, Both" value={data.foot || ''} onChange={(v) => update('foot', v)} optional />
        </div>
      );

    case 'coach':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sport"
            placeholder="Select your sport"
            value={data.sport || ''}
            onChange={(v) => update('sport', v)}
            options={SPORTS_OPTIONS}
          />
          <FormField label="Current Team" placeholder="e.g. Manchester City" value={data.currentTeam || ''} onChange={(v) => update('currentTeam', v)} />
          <FormField label="Specialization" placeholder="e.g. Head Coach, Assistant, GK Coach" value={data.specialization || ''} onChange={(v) => update('specialization', v)} />
          <FormField label="Coaching License / Badge" placeholder="e.g. UEFA Pro, AFC Pro" value={data.license || ''} onChange={(v) => update('license', v)} />
          <FormField label="Years of Experience" placeholder="e.g. 15" value={data.experience || ''} onChange={(v) => update('experience', v)} type="number" optional />
          <FormField label="Previous Teams" placeholder="e.g. Barcelona, Bayern Munich" value={data.previousTeams || ''} onChange={(v) => update('previousTeams', v)} optional />
          <FormField label="Nationality" placeholder="e.g. Spain" value={data.nationality || ''} onChange={(v) => update('nationality', v)} />
        </div>
      );

    case 'referee':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sport"
            placeholder="Select your sport"
            value={data.sport || ''}
            onChange={(v) => update('sport', v)}
            options={SPORTS_OPTIONS}
          />
          <FormField label="Referee Level" placeholder="e.g. FIFA Listed, Premier League, National" value={data.level || ''} onChange={(v) => update('level', v)} />
          <FormField label="Years of Experience" placeholder="e.g. 12" value={data.experience || ''} onChange={(v) => update('experience', v)} type="number" optional />
          <FormField label="Matches Officiated" placeholder="e.g. 500" value={data.matches || ''} onChange={(v) => update('matches', v)} type="number" optional />
          <FormField label="Nationality" placeholder="e.g. England" value={data.nationality || ''} onChange={(v) => update('nationality', v)} />
          <FormField label="Association / Federation" placeholder="e.g. The FA, FIFA" value={data.association || ''} onChange={(v) => update('association', v)} optional />
        </div>
      );

    case 'journalist':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Primary Beat"
            placeholder="Select your coverage area"
            value={data.beat || ''}
            onChange={(v) => update('beat', v)}
            options={[
              { value: 'transfers', label: 'Transfer News' },
              { value: 'match-reporting', label: 'Match Reporting' },
              { value: 'analysis', label: 'Analysis & Opinion' },
              { value: 'investigative', label: 'Investigative' },
              { value: 'general', label: 'General Sports News' },
            ]}
          />
          <FormField label="Publication / Outlet" placeholder="e.g. BBC Sport, The Athletic" value={data.publication || ''} onChange={(v) => update('publication', v)} />
          <FormField label="Years of Experience" placeholder="e.g. 8" value={data.experience || ''} onChange={(v) => update('experience', v)} type="number" optional />
          <FormField label="Portfolio / Website" placeholder="https://" value={data.portfolio || ''} onChange={(v) => update('portfolio', v)} optional />
          <FormField label="Specialization" placeholder="e.g. Football Transfers, F1" value={data.specialization || ''} onChange={(v) => update('specialization', v)} optional />
        </div>
      );

    case 'analyst':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Analysis Type"
            placeholder="Select your focus"
            value={data.analysisType || ''}
            onChange={(v) => update('analysisType', v)}
            options={[
              { value: 'data-stats', label: 'Data & Statistics' },
              { value: 'tactical', label: 'Tactical Analysis' },
              { value: 'performance', label: 'Performance Analysis' },
              { value: 'predictive', label: 'Predictive Modeling' },
            ]}
          />
          <FormField label="Tools / Software Used" placeholder="e.g. Opta, Wyscout, StatsBomb" value={data.tools || ''} onChange={(v) => update('tools', v)} />
          <FormField label="Affiliation" placeholder="e.g. Stats Perform, Independent" value={data.affiliation || ''} onChange={(v) => update('affiliation', v)} optional />
          <FormField label="Years of Experience" placeholder="e.g. 6" value={data.experience || ''} onChange={(v) => update('experience', v)} type="number" optional />
          <FormField label="Qualifications" placeholder="e.g. Data Science Degree, UEFA License" value={data.qualifications || ''} onChange={(v) => update('qualifications', v)} optional />
        </div>
      );

    case 'creator':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Content Type"
            placeholder="Select your primary content"
            value={data.contentType || ''}
            onChange={(v) => update('contentType', v)}
            options={[
              { value: 'highlights', label: 'Match Highlights' },
              { value: 'analysis', label: 'Analysis & Breakdown' },
              { value: 'comedy', label: 'Comedy & Entertainment' },
              { value: 'news', label: 'News & Updates' },
              { value: 'vlogs', label: 'Vlogs & Behind the Scenes' },
              { value: 'podcasts', label: 'Podcasts' },
            ]}
          />
          <FormField label="Platform" placeholder="e.g. YouTube, TikTok, Instagram" value={data.platform || ''} onChange={(v) => update('platform', v)} optional />
          <FormField label="Subscriber / Follower Count" placeholder="e.g. 500K" value={data.followers || ''} onChange={(v) => update('followers', v)} optional />
          <FormField label="Channel URL" placeholder="https://" value={data.channelUrl || ''} onChange={(v) => update('channelUrl', v)} optional />
          <FormField label="Content Languages" placeholder="e.g. English, French" value={data.languages || ''} onChange={(v) => update('languages', v)} optional />
        </div>
      );

    case 'scout':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Scouting Type"
            placeholder="Select your specialization"
            value={data.scoutType || ''}
            onChange={(v) => update('scoutType', v)}
            options={[
              { value: 'youth', label: 'Youth Talent' },
              { value: 'first-team', label: 'First Team Recruitment' },
              { value: 'opposition', label: 'Opposition Analysis' },
              { value: 'free-agents', label: 'Free Agent Monitoring' },
            ]}
          />
          <FormField label="Current Club / Agency" placeholder="e.g. Chelsea FC, Sportwave" value={data.club || ''} onChange={(v) => update('club', v)} />
          <FormField label="Region / Territory" placeholder="e.g. Africa, Europe, South America" value={data.region || ''} onChange={(v) => update('region', v)} />
          <FormField label="Years of Experience" placeholder="e.g. 10" value={data.experience || ''} onChange={(v) => update('experience', v)} type="number" optional />
          <FormField label="Notable Discoveries" placeholder="e.g. Player A, Player B" value={data.discoveries || ''} onChange={(v) => update('discoveries', v)} optional />
          <FormField label="Qualifications" placeholder="e.g. UEFA Scout License" value={data.qualifications || ''} onChange={(v) => update('qualifications', v)} optional />
        </div>
      );

    case 'stadium':
      return (
        <div className="flex flex-col gap-4">
          <FormField label="Stadium Name" placeholder="e.g. Old Trafford" value={data.stadiumName || ''} onChange={(v) => update('stadiumName', v)} />
          <FormField label="Capacity" placeholder="e.g. 74,000" value={data.capacity || ''} onChange={(v) => update('capacity', v)} type="number" />
          <FormField label="Country" placeholder="e.g. England" value={data.country || ''} onChange={(v) => update('country', v)} />
          <FormField label="City" placeholder="e.g. Manchester" value={data.city || ''} onChange={(v) => update('city', v)} />
          <FormField label="Home Team" placeholder="e.g. Manchester United" value={data.homeTeam || ''} onChange={(v) => update('homeTeam', v)} />
          <FormField label="Year Built" placeholder="e.g. 1910" value={data.yearBuilt || ''} onChange={(v) => update('yearBuilt', v)} type="number" optional />
          <FormField label="Website" placeholder="https://" value={data.website || ''} onChange={(v) => update('website', v)} optional />
        </div>
      );

    case 'academy':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sport"
            placeholder="Select primary sport"
            value={data.sport || ''}
            onChange={(v) => update('sport', v)}
            options={SPORTS_OPTIONS}
          />
          <FormField label="Parent Club / Organization" placeholder="e.g. FC Barcelona" value={data.parentClub || ''} onChange={(v) => update('parentClub', v)} optional />
          <FormField label="Country" placeholder="e.g. Spain" value={data.country || ''} onChange={(v) => update('country', v)} />
          <FormField label="City" placeholder="e.g. Barcelona" value={data.city || ''} onChange={(v) => update('city', v)} />
          <FormField label="Age Groups" placeholder="e.g. U8 to U18" value={data.ageGroups || ''} onChange={(v) => update('ageGroups', v)} />
          <FormField label="Number of Students" placeholder="e.g. 240" value={data.students || ''} onChange={(v) => update('students', v)} type="number" optional />
          <FormField label="Notable Alumni" placeholder="e.g. Messi, Xavi, Iniesta" value={data.alumni || ''} onChange={(v) => update('alumni', v)} optional />
          <FormField label="Programs Offered" placeholder="e.g. Residential, Day, Holiday Camps" value={data.programs || ''} onChange={(v) => update('programs', v)} optional />
        </div>
      );

    case 'community':
      return (
        <div className="flex flex-col gap-4">
          <FormField label="Community Type" placeholder="e.g. Fan Club, Supporters Group, Discussion Forum" value={data.communityType || ''} onChange={(v) => update('communityType', v)} />
          <FormField label="Associated Team / Club" placeholder="e.g. Arsenal FC" value={data.associatedTeam || ''} onChange={(v) => update('associatedTeam', v)} optional />
          <FormField label="Country" placeholder="e.g. Uganda" value={data.country || ''} onChange={(v) => update('country', v)} />
          <FormField label="Estimated Members" placeholder="e.g. 5,000" value={data.members || ''} onChange={(v) => update('members', v)} type="number" optional />
          <FormField label="Community Description" placeholder="What is your community about?" value={data.description || ''} onChange={(v) => update('description', v)} optional />
          <FormField label="Social Media Link" placeholder="https://" value={data.socialLink || ''} onChange={(v) => update('socialLink', v)} optional />
        </div>
      );

    case 'organization':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Organization Type"
            placeholder="Select type"
            value={data.orgType || ''}
            onChange={(v) => update('orgType', v)}
            options={[
              { value: 'federation', label: 'Sports Federation' },
              { value: 'governing-body', label: 'Governing Body' },
              { value: 'association', label: 'Sports Association' },
              { value: 'ngo', label: 'NGO / Charity' },
              { value: 'league', label: 'League Operator' },
            ]}
          />
          <FormField label="Country" placeholder="e.g. Switzerland" value={data.country || ''} onChange={(v) => update('country', v)} />
          <FormField label="Headquarters" placeholder="e.g. Zurich" value={data.headquarters || ''} onChange={(v) => update('headquarters', v)} optional />
          <FormField label="Member Count" placeholder="e.g. 211" value={data.memberCount || ''} onChange={(v) => update('memberCount', v)} type="number" optional />
          <FormField label="Website" placeholder="https://" value={data.website || ''} onChange={(v) => update('website', v)} optional />
          <FormField label="Founded Year" placeholder="e.g. 1904" value={data.founded || ''} onChange={(v) => update('founded', v)} type="number" optional />
        </div>
      );

    case 'business':
      return (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Business Type"
            placeholder="Select type"
            value={data.businessType || ''}
            onChange={(v) => update('businessType', v)}
            options={[
              { value: 'sportswear', label: 'Sportswear / Equipment' },
              { value: 'media', label: 'Sports Media' },
              { value: 'agency', label: 'Sports Agency' },
              { value: 'nutrition', label: 'Sports Nutrition' },
              { value: 'tech', label: 'Sports Technology' },
              { value: 'merchandise', label: 'Merchandise / Memorabilia' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <FormField label="Country" placeholder="e.g. USA" value={data.country || ''} onChange={(v) => update('country', v)} />
          <FormField label="City" placeholder="e.g. Portland" value={data.city || ''} onChange={(v) => update('city', v)} optional />
          <FormField label="Website" placeholder="https://" value={data.website || ''} onChange={(v) => update('website', v)} optional />
          <FormField label="Number of Employees" placeholder="e.g. 500" value={data.employees || ''} onChange={(v) => update('employees', v)} type="number" optional />
          <FormField label="Partnerships" placeholder="e.g. Nike, Premier League" value={data.partnerships || ''} onChange={(v) => update('partnerships', v)} optional />
        </div>
      );

    default:
      return (
        <div className="rounded-xl bg-surface border border-surface-border p-4 text-center">
          <p className="text-sm text-muted-foreground">No additional fields required for this role.</p>
        </div>
      );
  }
}
