'use client';

import { Info, Globe, MapPin, Award } from 'lucide-react';
import type { ApiUser, ViewingUser } from '@/types';

interface AboutTabProps {
  apiUser: ApiUser | null;
  user: ViewingUser;
  role: string;
}

export function AboutTab({ apiUser, user, role }: AboutTabProps) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, string>;
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider"><Info className="h-4 w-4" /> About</h3>
        {apiUser?.aboutMe ? <p className="text-sm text-foreground/80 leading-relaxed">{apiUser.aboutMe}</p> : <p className="text-sm text-muted-foreground">{user.bio || 'No about info yet.'}</p>}
        <div className="mt-3 flex flex-col gap-2">
          {apiUser?.countryOfOrigin && <div className="flex items-center gap-2 text-xs"><Globe className="h-3 w-3 text-gold" /><span className="text-muted-foreground">Country:</span><span className="text-white font-semibold">{apiUser.countryOfOrigin}</span></div>}
          {apiUser?.city && <div className="flex items-center gap-2 text-xs"><MapPin className="h-3 w-3 text-gold" /><span className="text-muted-foreground">City:</span><span className="text-white font-semibold">{apiUser.city}</span></div>}
        </div>
      </div>
      {Object.keys(rp).length > 0 && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider"><Award className="h-4 w-4" /> {role} Info</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(rp).slice(0, 6).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-surface p-3"><p className="text-[10px] text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' ').trim()}</p><p className="text-sm font-bold text-white">{String(value)}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
