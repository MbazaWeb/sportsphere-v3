#!/usr/bin/env python3
"""Add searchable location dropdown to CreateTab.tsx — replace plain text input."""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
FILE = '/var/www/sportsphere-nextjs/src/components/create/CreateTab.tsx'

def ssh_cmd(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    return out, err

out, err = ssh_cmd(f'cat {FILE}')
if err:
    print(f"Error: {err}")
    exit(1)

content = out

# ─────────────────────────────────────────────────
# 1) Add Search + ChevronDown to imports
# ─────────────────────────────────────────────────
old_import = "{ FileText, Image as ImageIcon, Video, Zap, BarChart3, Target, Plus, X, Hash, MapPin, WifiOff, Sparkles, ChevronLeft }"
new_import = "{ FileText, Image as ImageIcon, Video, Zap, BarChart3, Target, Plus, X, Hash, MapPin, WifiOff, Sparkles, ChevronLeft, Search, ChevronDown }"
content = content.replace(old_import, new_import)

# ─────────────────────────────────────────────────
# 2) Add location data constant after MAX_CONTENT
# ─────────────────────────────────────────────────
location_data = """
/** Searchable location data — countries + Tanzania regions & districts */
const LOCATION_DATA: { country: string; region?: string; district?: string; label: string }[] = (() => {
  const countries = ['Tanzania','Kenya','Uganda','Rwanda','Burundi','DRC','Mozambique','Zambia','Malawi','Nigeria','South Africa','Egypt','Morocco','Ghana','Cameroon','Senegal','Ivory Coast','Ethiopia','Somalia','Sudan','England','Spain','Germany','France','Italy','Portugal','Netherlands','USA','Canada','Brazil','Argentina','Japan','South Korea','China','India','Australia','Saudi Arabia','Qatar','UAE'];
  const tz: Record<string, string[]> = {
    'Dar es Salaam': ['Ilala','Kinondoni','Temeke','Kigamboni','Ubungo'],
    'Dodoma': ['Dodoma Mjini','Kondoa','Kondoa Mjini','Mpwapwa','Chamwino'],
    'Arusha': ['Arusha Mjini','Meru','Karatu','Longido','Ngorongoro'],
    'Mwanza': ['Mwanza Mjini','Ilemela','Kwimba','Magu','Nyamagana'],
    'Mbeya': ['Mbeya Mjini','Rungwe','Kyela','Mbarali','Chunya'],
    'Morogoro': ['Morogoro Mjini','Mvomero','Gairo','Kilosa','Ulanga'],
    'Tanga': ['Tanga Mjini','Muheza','Pangani','Korogwe','Lushoto'],
    'Zanzibar': ['Zanzibar Mjini','West Unguja','Central Unguja','North Unguja','South Unguja','Micheweni','Wete','Chake Chake','Mkoani'],
    'Kilimanjaro': ['Moshi Mjini','Hai','Rombo','Siha','Mwanga'],
    'Iringa': ['Iringa Mjini','Mafinga','Makete','Kilolo','Ludewa'],
    'Kagera': ['Bukoba Mjini','Muleba','Karagwe','Ngara','Missenyi'],
    'Kigoma': ['Kigoma Mjini','Kasulu','Kibondo','Buhigwe','Uvinza'],
    'Shinyanga': ['Shinyanga Mjini','Kahama','Kishapu','Maswa','Meatu'],
    'Pwani': ['Bagamoyo','Kibaha','Rufiji','Mkuranga','Mafia'],
    'Simiyu': ['Bariadi','Maswa Mjini','Meatu','Itilima','Busega'],
    'Singida': ['Singida Mjini','Iramba','Mkalama','Manyoni'],
    'Tabora': ['Tabora Mjini','Sikonge','Urambo','Nzega','Igunga'],
    'Rukwa': ['Sumbawanga Mjini','Nkasi','Kalambo'],
    'Mtwara': ['Mtwara Mjini','Nanyumbu','Masasi','Newala','Tandahimba'],
    'Lindi': ['Lindi Mjini','Nachingwea','Ruangwa','Liwale','Kilwa'],
    'Mara': ['Musoma Mjini','Tarime','Rorya','Bunda','Butiama'],
    'Ruvuma': ['Songea Mjini','Tunduru','Namtumbo','Mbinga'],
    'Njombe': ['Njombe Mjini','Makete','Ludewa',"Wanging'ombe"],
    'Katavi': ['Mpanda Mjini','Mlele','Mpanda'],
    'Songwe': ['Vwawa Mjini','Mbozi','Ileje','Mbarali'],
  };
  const items: { country: string; region?: string; district?: string; label: string }[] = [];
  // Tanzania: country + regions + districts
  items.push({ country: 'Tanzania', label: 'Tanzania' });
  for (const [region, districts] of Object.entries(tz)) {
    items.push({ country: 'Tanzania', region, label: region + ', Tanzania' });
    for (const d of districts) {
      items.push({ country: 'Tanzania', region, district: d, label: d + ', ' + region + ', Tanzania' });
    }
  }
  // Other countries
  for (const c of countries.slice(1)) {
    items.push({ country: c, label: c });
  }
  return items;
})();
"""

old_max = "const MAX_CONTENT = 500;"
content = content.replace(old_max, old_max + "\n" + location_data)

# ─────────────────────────────────────────────────
# 3) Add location dropdown state to Composer
# ─────────────────────────────────────────────────
old_location_state = "  const [location, setLocation] = useState('');"
new_location_state = """  const [location, setLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = { current: null as HTMLDivElement | null };
  const filteredLocations = locationSearch.length >= 1
    ? LOCATION_DATA.filter(l => l.label.toLowerCase().includes(locationSearch.toLowerCase())).slice(0, 8)
    : LOCATION_DATA.slice(0, 8);"""
content = content.replace(old_location_state, new_location_state)

# ─────────────────────────────────────────────────
# 4) Replace the plain location input with searchable dropdown
# ─────────────────────────────────────────────────
old_location_input = """            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dar es Salaam, Tanzania" maxLength={60}
                className="w-full rounded-xl bg-surface/60 border border-surface-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>"""

new_location_input = """            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <div className="relative" ref={locationRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input
                      value={location ? location : locationSearch}
                      onChange={(e) => { if (location) { setLocation(''); } setLocationSearch(e.target.value); setLocationOpen(true); }}
                      onFocus={() => setLocationOpen(true)}
                      placeholder="Search location..."
                      maxLength={80}
                      className="w-full rounded-xl bg-surface/60 border border-surface-border pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                  </div>
                  {location && (
                    <button onClick={() => setLocation('')}
                      className="rounded-xl bg-surface/60 border border-surface-border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-white hover:bg-surface-elevated transition-colors">
                      Clear
                    </button>
                  )}
                </div>
                {locationOpen && !location && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-surface-border bg-surface/95 backdrop-blur-xl shadow-xl shadow-black/40">
                    {filteredLocations.length === 0 && (
                      <div className="px-4 py-3 text-xs text-muted-foreground">No locations found. Type to search or press Enter to use custom.</div>
                    )}
                    {filteredLocations.map((loc) => (
                      <button key={loc.label}
                        onClick={() => { setLocation(loc.label); setLocationSearch(''); setLocationOpen(false); }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm hover:bg-surface-elevated transition-colors flex items-center gap-2",
                          loc.district ? 'text-muted-foreground pl-8' : loc.region ? 'text-white/90 pl-6' : 'text-white font-medium'
                        )}
                      >
                        <MapPin className="h-3 w-3 flex-shrink-0 opacity-50" />
                        <span>{loc.label}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setLocation(locationSearch.trim()); setLocationOpen(false); }}
                      className="w-full border-t border-surface-border px-4 py-2.5 text-left text-xs text-gold font-medium hover:bg-surface-elevated transition-colors"
                    >
                      Use &quot;{locationSearch.trim()}&quot; as custom location
                    </button>
                  </div>
                )}
              </div>
            </div>"""

content = content.replace(old_location_input, new_location_input)

# ─────────────────────────────────────────────────
# 5) Add click-outside handler for location dropdown (close on outside click)
#    We need to add a useEffect after the Composer states
# ─────────────────────────────────────────────────
old_use_effect = "  const filteredLocations = locationSearch"
new_use_effect = """  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false);
    };
    if (locationOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [locationOpen]);

  const filteredLocations = locationSearch"""

content = content.replace(new_use_effect, old_use_effect)  # undo
# Actually let me insert it properly - after the locationOpen state but before filteredLocations
# Let me find the right insertion point
insert_after = """  const locationRef = { current: null as HTMLDivElement | null };"""
insert_before = "  const filteredLocations"

pos_after = content.find(insert_after)
if pos_after == -1:
    print("ERROR: Could not find locationRef insertion point")
    exit(1)

pos_before = content.find(insert_before, pos_after)
if pos_before == -1:
    print("ERROR: Could not find filteredLocations insertion point")
    exit(1)

click_outside_effect = """
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false);
    };
    if (locationOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [locationOpen]);

"""

content = content[:pos_before] + click_outside_effect + content[pos_before:]

# Verify replacements
if "placeholder=\"e.g. Dar es Salaam, Tanzania\"" in content:
    print("ERROR: Old plain location input still present!")
    exit(1)
if "LOCATION_DATA" not in content:
    print("ERROR: LOCATION_DATA constant missing!")
    exit(1)
if "filteredLocations" not in content:
    print("ERROR: filteredLocations missing!")
    exit(1)
if "Search" not in content.split("lucide-react")[1].split(";")[0] if "lucide-react" in content else "":
    print("ERROR: Search icon not imported!")
    # check more carefully
    import_line = [l for l in content.split('\n') if 'lucide-react' in l][0]
    if 'Search' not in import_line:
        print(f"  Import line: {import_line}")
        exit(1)

print("All checks passed!")

# Write back to server
# Use a heredoc approach via ssh to avoid shell escaping issues
import json
encoded = content.encode('utf-8').hex()

ssh_cmd(f"echo '{encoded}' | xxd -r -p > {FILE}")
print(f"File written: {len(content)} chars")

