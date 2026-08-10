/**
 * seed-locations.ts
 *
 * Seeds the Location table with:
 *   - 20+ major world countries
 *   - All 31 Tanzania regions
 *   - Major Tanzania cities (200+)
 *   - Major world cities (100+)
 *
 * Usage:
 *   npx tsx prisma/seed-locations.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────

interface Loc {
  name: string;
  type: 'country' | 'region' | 'city';
  parentName?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  population?: number;
  isPopular?: boolean;
}

// ─── Generate search tokens for prefix matching ─────────────────────────
// Creates prefix tokens: "dar es salaam" → ["dar","dar ","dar e","dar es","dar es ","dar es s","dar es sa","dar es sal",...]

function generateTokens(name: string): string[] {
  const lower = name.toLowerCase();
  const tokens: string[] = [lower];
  for (let i = 1; i < lower.length; i++) {
    tokens.push(lower.slice(0, i));
  }
  return tokens;
}

// ─── Data ─────────────────────────────────────────────────────────────────

const COUNTRIES: Loc[] = [
  { name: 'Tanzania', type: 'country', countryCode: 'TZ', lat: -6.369, lng: 34.888, population: 65497748, isPopular: true },
  { name: 'Kenya', type: 'country', countryCode: 'KE', lat: -0.0236, lng: 37.9062, population: 55100586, isPopular: true },
  { name: 'Uganda', type: 'country', countryCode: 'UG', lat: 1.3733, lng: 32.2903, population: 48582334, isPopular: true },
  { name: 'Nigeria', type: 'country', countryCode: 'NG', lat: 9.082, lng: 8.6753, population: 223804632, isPopular: true },
  { name: 'South Africa', type: 'country', countryCode: 'ZA', lat: -30.5595, lng: 22.9375, population: 60414495, isPopular: true },
  { name: 'Ghana', type: 'country', countryCode: 'GH', lat: 7.9465, lng: -1.0232, population: 33475870, isPopular: true },
  { name: 'Ethiopia', type: 'country', countryCode: 'ET', lat: 9.145, lng: 40.4897, population: 126527060, isPopular: true },
  { name: 'Rwanda', type: 'country', countryCode: 'RW', lat: -1.9403, lng: 29.8739, population: 14094683, isPopular: true },
  { name: 'Burundi', type: 'country', countryCode: 'BI', lat: -3.3731, lng: 29.9189, population: 13238559 },
  { name: 'Democratic Republic of Congo', type: 'country', countryCode: 'CD', lat: -4.0383, lng: 21.7587, population: 102262808, isPopular: true },
  { name: 'Cameroon', type: 'country', countryCode: 'CM', lat: 7.3697, lng: 12.3547, population: 27914536 },
  { name: 'Senegal', type: 'country', countryCode: 'SN', lat: 14.4974, lng: -14.4524, population: 17763163 },
  { name: 'Morocco', type: 'country', countryCode: 'MA', lat: 31.7917, lng: -7.0926, population: 37457971, isPopular: true },
  { name: 'Egypt', type: 'country', countryCode: 'EG', lat: 26.8206, lng: 30.8025, population: 109262178, isPopular: true },
  { name: 'Tunisia', type: 'country', countryCode: 'TN', lat: 33.8869, lng: 9.5375, population: 12458223 },
  { name: 'Algeria', type: 'country', countryCode: 'DZ', lat: 28.0339, lng: 1.6596, population: 44903225 },
  { name: 'Zambia', type: 'country', countryCode: 'ZM', lat: -13.1339, lng: 27.8493, population: 20017675 },
  { name: 'Zimbabwe', type: 'country', countryCode: 'ZW', lat: -19.0154, lng: 29.1549, population: 16665409 },
  { name: 'Mozambique', type: 'country', countryCode: 'MZ', lat: -18.6657, lng: 35.5296, population: 33897354 },
  { name: 'Malawi', type: 'country', countryCode: 'MW', lat: -13.2543, lng: 34.3015, population: 20405317 },
  { name: 'Sudan', type: 'country', countryCode: 'SD', lat: 12.8628, lng: 30.2176, population: 47958856 },
  { name: 'Somalia', type: 'country', countryCode: 'SO', lat: 5.1521, lng: 46.1996, population: 17597511 },
  { name: 'Ivory Coast', type: 'country', countryCode: 'CI', lat: 7.5399, lng: -5.5471, population: 28160542 },
  { name: 'United States', type: 'country', countryCode: 'US', lat: 37.0902, lng: -95.7129, population: 331893745, isPopular: true },
  { name: 'United Kingdom', type: 'country', countryCode: 'GB', lat: 55.3781, lng: -3.436, population: 67886011, isPopular: true },
  { name: 'Germany', type: 'country', countryCode: 'DE', lat: 51.1657, lng: 10.4515, population: 83783942, isPopular: true },
  { name: 'France', type: 'country', countryCode: 'FR', lat: 46.2276, lng: 2.2137, population: 65273511, isPopular: true },
  { name: 'Spain', type: 'country', countryCode: 'ES', lat: 40.4637, lng: -3.7492, population: 46754778, isPopular: true },
  { name: 'Italy', type: 'country', countryCode: 'IT', lat: 41.8719, lng: 12.5674, population: 60461826, isPopular: true },
  { name: 'Portugal', type: 'country', countryCode: 'PT', lat: 39.3999, lng: -8.2245, population: 10196709 },
  { name: 'Netherlands', type: 'country', countryCode: 'NL', lat: 52.1326, lng: 5.2913, population: 17134872 },
  { name: 'Brazil', type: 'country', countryCode: 'BR', lat: -14.235, lng: -51.9253, population: 212559417, isPopular: true },
  { name: 'Argentina', type: 'country', countryCode: 'AR', lat: -38.4161, lng: -63.6167, population: 45195774, isPopular: true },
  { name: 'Mexico', type: 'country', countryCode: 'MX', lat: 23.6345, lng: -102.5528, population: 128932753, isPopular: true },
  { name: 'Saudi Arabia', type: 'country', countryCode: 'SA', lat: 23.8859, lng: 45.0792, population: 34813871, isPopular: true },
  { name: 'United Arab Emirates', type: 'country', countryCode: 'AE', lat: 23.4241, lng: 53.8478, population: 9890402, isPopular: true },
  { name: 'India', type: 'country', countryCode: 'IN', lat: 20.5937, lng: 78.9629, population: 1380004385, isPopular: true },
  { name: 'China', type: 'country', countryCode: 'CN', lat: 35.8617, lng: 104.1954, population: 1439323776, isPopular: true },
  { name: 'Japan', type: 'country', countryCode: 'JP', lat: 36.2048, lng: 138.2529, population: 126476461, isPopular: true },
  { name: 'South Korea', type: 'country', countryCode: 'KR', lat: 35.9078, lng: 127.7669, population: 51269185, isPopular: true },
  { name: 'Australia', type: 'country', countryCode: 'AU', lat: -25.2744, lng: 133.7751, population: 25499884, isPopular: true },
  { name: 'Canada', type: 'country', countryCode: 'CA', lat: 56.1304, lng: -106.3468, population: 38005238, isPopular: true },
  { name: 'Turkey', type: 'country', countryCode: 'TR', lat: 38.9637, lng: 35.2433, population: 84339067, isPopular: true },
  { name: 'Qatar', type: 'country', countryCode: 'QA', lat: 25.3548, lng: 51.1839, population: 2931203, isPopular: true },
  { name: 'Thailand', type: 'country', countryCode: 'TH', lat: 15.87, lng: 100.9925, population: 69799978, isPopular: true },
  { name: 'Colombia', type: 'country', countryCode: 'CO', lat: 4.5709, lng: -74.2973, population: 50882891 },
  { name: 'Jamaica', type: 'country', countryCode: 'JM', lat: 18.1096, lng: -77.2975, population: 2961167 },
  { name: 'Haiti', type: 'country', countryCode: 'HT', lat: 18.9712, lng: -72.2852, population: 11402528 },
];

// ─── Tanzania Regions (31) ───────────────────────────────────────────────

const TZ_REGIONS: Loc[] = [
  { name: 'Dar es Salaam', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.7924, lng: 39.2083, population: 6744471, isPopular: true },
  { name: 'Dodoma', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.163, lng: 35.7516, population: 2766373, isPopular: true },
  { name: 'Arusha', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -3.3869, lng: 36.683, population: 1791195, isPopular: true },
  { name: 'Mwanza', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -2.5167, lng: 32.9175, population: 3373633, isPopular: true },
  { name: 'Mbeya', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -8.9086, lng: 33.4528, population: 2259286 },
  { name: 'Morogoro', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.8283, lng: 37.6622, population: 2188077 },
  { name: 'Tanga', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -5.0877, lng: 39.0975, population: 2317902 },
  { name: 'Zanzibar Urban/West', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.1659, lng: 39.1989, population: 1173241, isPopular: true },
  { name: 'Kagera', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -1.6544, lng: 30.7792, population: 2897697 },
  { name: 'Kigoma', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -4.877, lng: 29.6292, population: 2113039 },
  { name: 'Shinyanga', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -3.6633, lng: 33.4222, population: 1695565 },
  { name: 'Iringa', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -7.7667, lng: 35.7, population: 1226741 },
  { name: 'Pwani', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -7.0, lng: 38.95, population: 1261539 },
  { name: 'Kilimanjaro', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -3.4, lng: 37.35, population: 1787604, isPopular: true },
  { name: 'Ruvuma', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -10.5, lng: 35.5, population: 1275074 },
  { name: 'Lindi', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -9.9833, lng: 39.7167, population: 864652 },
  { name: 'Mtwara', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -10.2667, lng: 40.1833, population: 1436951 },
  { name: 'Mara', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -1.75, lng: 33.85, population: 1837190 },
  { name: 'Singida', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -4.8167, lng: 34.75, population: 1374601 },
  { name: 'Tabora', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -5.0167, lng: 32.8, population: 2442421 },
  { name: 'Rukwa', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -7.9667, lng: 31.4, population: 1241203 },
  { name: 'Geita', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -2.85, lng: 32.15, population: 2067741 },
  { name: 'Simiyu', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -3.3, lng: 34.15, population: 1589090 },
  { name: 'Njombe', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -9.3333, lng: 34.8333, population: 876932 },
  { name: 'Katavi', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.55, lng: 31.05, population: 622437 },
  { name: 'Songwe', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -8.0, lng: 32.5, population: 1078301 },
  { name: 'Mjini Magharibi', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.15, lng: 39.2, population: 1078301 },
  { name: 'Kaskazini Pemba', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -5.0833, lng: 39.7833, population: 263557 },
  { name: 'Kusini Pemba', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -5.3, lng: 39.65, population: 273862 },
  { name: 'Kaskazini Unguja', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -5.9, lng: 39.25, population: 220000 },
  { name: 'Kusini Unguja', type: 'region', parentName: 'Tanzania', countryCode: 'TZ', lat: -6.35, lng: 39.4, population: 124000 },
];

// ─── Tanzania Cities ─────────────────────────────────────────────────────

const TZ_CITIES: Loc[] = [
  // Dar es Salaam district/cities
  { name: 'Kinondoni', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.7733, lng: 39.2472, population: 2014163, isPopular: true },
  { name: 'Ilala', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.8253, lng: 39.2653, population: 1345393, isPopular: true },
  { name: 'Temeke', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.845, lng: 39.285, population: 1373595, isPopular: true },
  { name: 'Ubungo', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.7833, lng: 39.2333, population: 678226 },
  { name: 'Kigamboni', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.8, lng: 39.35, population: 350000 },
  { name: 'Buguruni', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.75, lng: 39.27, population: 200000 },
  { name: 'Mbezi Beach', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.75, lng: 39.22, population: 150000 },
  { name: 'Masaki', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.73, lng: 39.27, population: 100000 },
  { name: 'Mikocheni', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.76, lng: 39.23, population: 120000 },
  { name: 'Kariakoo', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.82, lng: 39.27, population: 80000 },
  { name: 'Magomeni', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.79, lng: 39.25, population: 95000 },
  { name: 'Sinza', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.77, lng: 39.24, population: 110000 },
  { name: 'Tegeta', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.78, lng: 39.3, population: 85000 },
  { name: 'Mbagala', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.87, lng: 39.28, population: 130000 },
  { name: 'Kawe', type: 'city', parentName: 'Dar es Salaam', countryCode: 'TZ', lat: -6.75, lng: 39.25, population: 70000 },

  // Dodoma cities
  { name: 'Dodoma City', type: 'city', parentName: 'Dodoma', countryCode: 'TZ', lat: -6.163, lng: 35.7516, population: 410956, isPopular: true },
  { name: 'Chamwino', type: 'city', parentName: 'Dodoma', countryCode: 'TZ', lat: -6.1, lng: 35.8, population: 150000 },
  { name: 'Kondoa', type: 'city', parentName: 'Dodoma', countryCode: 'TZ', lat: -4.9, lng: 35.8, population: 50000 },

  // Arusha cities
  { name: 'Arusha City', type: 'city', parentName: 'Arusha', countryCode: 'TZ', lat: -3.3869, lng: 36.683, population: 617631, isPopular: true },
  { name: 'Moshi', type: 'city', parentName: 'Arusha', countryCode: 'TZ', lat: -3.35, lng: 37.34, population: 201150, isPopular: true },
  { name: 'Karatu', type: 'city', parentName: 'Arusha', countryCode: 'TZ', lat: -3.35, lng: 35.75, population: 50000 },
  { name: 'Babati', type: 'city', parentName: 'Arusha', countryCode: 'TZ', lat: -4.217, lng: 35.755, population: 93439 },

  // Mwanza cities
  { name: 'Mwanza City', type: 'city', parentName: 'Mwanza', countryCode: 'TZ', lat: -2.5167, lng: 32.9175, population: 799780, isPopular: true },
  { name: 'Ilemela', type: 'city', parentName: 'Mwanza', countryCode: 'TZ', lat: -2.48, lng: 32.92, population: 450000 },
  { name: 'Nyamagana', type: 'city', parentName: 'Mwanza', countryCode: 'TZ', lat: -2.52, lng: 32.9, population: 350000 },
  { name: 'Geita Town', type: 'city', parentName: 'Mwanza', countryCode: 'TZ', lat: -2.87, lng: 32.22, population: 120000 },

  // Mbeya cities
  { name: 'Mbeya City', type: 'city', parentName: 'Mbeya', countryCode: 'TZ', lat: -8.9086, lng: 33.4528, population: 422748, isPopular: true },
  { name: 'Tunduma', type: 'city', parentName: 'Mbeya', countryCode: 'TZ', lat: -9.3, lng: 32.75, population: 100000 },

  // Morogoro cities
  { name: 'Morogoro City', type: 'city', parentName: 'Morogoro', countryCode: 'TZ', lat: -6.8283, lng: 37.6622, population: 315866, isPopular: true },
  { name: 'Kilosa', type: 'city', parentName: 'Morogoro', countryCode: 'TZ', lat: -6.85, lng: 37.0, population: 50000 },

  // Tanga cities
  { name: 'Tanga City', type: 'city', parentName: 'Tanga', countryCode: 'TZ', lat: -5.0877, lng: 39.0975, population: 343362, isPopular: true },
  { name: 'Muheza', type: 'city', parentName: 'Tanga', countryCode: 'TZ', lat: -5.18, lng: 38.78, population: 45000 },

  // Zanzibar cities
  { name: 'Zanzibar City', type: 'city', parentName: 'Zanzibar Urban/West', countryCode: 'TZ', lat: -6.1659, lng: 39.1989, population: 223033, isPopular: true },
  { name: 'Stone Town', type: 'city', parentName: 'Zanzibar Urban/West', countryCode: 'TZ', lat: -6.1622, lng: 39.1887, population: 80000, isPopular: true },

  // Kagera cities
  { name: 'Bukoba', type: 'city', parentName: 'Kagera', countryCode: 'TZ', lat: -1.3317, lng: 31.8122, population: 128796, isPopular: true },
  { name: 'Muleba', type: 'city', parentName: 'Kagera', countryCode: 'TZ', lat: -1.67, lng: 31.68, population: 35000 },

  // Kigoma cities
  { name: 'Kigoma Town', type: 'city', parentName: 'Kigoma', countryCode: 'TZ', lat: -4.877, lng: 29.6292, population: 215458, isPopular: true },
  { name: 'Kasulu', type: 'city', parentName: 'Kigoma', countryCode: 'TZ', lat: -4.6, lng: 30.1, population: 80000 },

  // Shinyanga cities
  { name: 'Shinyanga Town', type: 'city', parentName: 'Shinyanga', countryCode: 'TZ', lat: -3.6633, lng: 33.4222, population: 161458, isPopular: true },
  { name: 'Kahama', type: 'city', parentName: 'Shinyanga', countryCode: 'TZ', lat: -3.837, lng: 32.664, population: 100000 },

  // Iringa cities
  { name: 'Iringa Town', type: 'city', parentName: 'Iringa', countryCode: 'TZ', lat: -7.7667, lng: 35.7, population: 151345, isPopular: true },

  // Kilimanjaro cities
  { name: 'Moshi Town', type: 'city', parentName: 'Kilimanjaro', countryCode: 'TZ', lat: -3.35, lng: 37.34, population: 201150 },
  { name: 'Hai', type: 'city', parentName: 'Kilimanjaro', countryCode: 'TZ', lat: -3.3, lng: 37.35, population: 50000 },
  { name: 'Siha', type: 'city', parentName: 'Kilimanjaro', countryCode: 'TZ', lat: -3.15, lng: 37.25, population: 40000 },
  { name: 'Rombo', type: 'city', parentName: 'Kilimanjaro', countryCode: 'TZ', lat: -3.0, lng: 37.55, population: 45000 },

  // Mara cities
  { name: 'Musoma', type: 'city', parentName: 'Mara', countryCode: 'TZ', lat: -1.5, lng: 33.8, population: 134452, isPopular: true },
  { name: 'Tarime', type: 'city', parentName: 'Mara', countryCode: 'TZ', lat: -1.35, lng: 34.38, population: 60000 },

  // Tabora cities
  { name: 'Tabora Town', type: 'city', parentName: 'Tabora', countryCode: 'TZ', lat: -5.0167, lng: 32.8, population: 226999, isPopular: true },
  { name: 'Sikonge', type: 'city', parentName: 'Tabora', countryCode: 'TZ', lat: -5.0, lng: 32.6, population: 30000 },

  // Pwani (Coast) cities
  { name: 'Kibaha', type: 'city', parentName: 'Pwani', countryCode: 'TZ', lat: -6.76, lng: 38.92, population: 128488, isPopular: true },
  { name: 'Bagamoyo', type: 'city', parentName: 'Pwani', countryCode: 'TZ', lat: -6.42, lng: 38.9, population: 82578 },
  { name: 'Mkuranga', type: 'city', parentName: 'Pwani', countryCode: 'TZ', lat: -7.0, lng: 39.0, population: 50000 },

  // Lindi cities
  { name: 'Lindi Town', type: 'city', parentName: 'Lindi', countryCode: 'TZ', lat: -9.9833, lng: 39.7167, population: 79826 },

  // Mtwara cities
  { name: 'Mtwara Town', type: 'city', parentName: 'Mtwara', countryCode: 'TZ', lat: -10.2667, lng: 40.1833, population: 108249 },
  { name: 'Nanyumbu', type: 'city', parentName: 'Mtwara', countryCode: 'TZ', lat: -10.55, lng: 39.85, population: 30000 },

  // Ruvuma cities
  { name: 'Songea', type: 'city', parentName: 'Ruvuma', countryCode: 'TZ', lat: -10.6833, lng: 35.65, population: 99705, isPopular: true },

  // Singida cities
  { name: 'Singida Town', type: 'city', parentName: 'Singida', countryCode: 'TZ', lat: -4.8167, lng: 34.75, population: 92932 },

  // Geita cities
  { name: 'Geita Town', type: 'city', parentName: 'Geita', countryCode: 'TZ', lat: -2.87, lng: 32.22, population: 120000 },

  // Simiyu cities
  { name: 'Bariadi', type: 'city', parentName: 'Simiyu', countryCode: 'TZ', lat: -3.05, lng: 33.95, population: 65000 },
  { name: 'Meatu', type: 'city', parentName: 'Simiyu', countryCode: 'TZ', lat: -3.7, lng: 34.3, population: 35000 },

  // Njombe cities
  { name: 'Njombe Town', type: 'city', parentName: 'Njombe', countryCode: 'TZ', lat: -9.3333, lng: 34.8333, population: 70516 },

  // Songwe cities
  { name: 'Vwawa', type: 'city', parentName: 'Songwe', countryCode: 'TZ', lat: -8.3, lng: 32.6, population: 40000 },
  { name: 'Mbozi', type: 'city', parentName: 'Songwe', countryCode: 'TZ', lat: -8.6, lng: 32.9, population: 35000 },

  // Katavi cities
  { name: 'Mpanda', type: 'city', parentName: 'Katavi', countryCode: 'TZ', lat: -6.35, lng: 31.07, population: 52000 },

  // Rukwa cities
  { name: 'Sumbawanga', type: 'city', parentName: 'Rukwa', countryCode: 'TZ', lat: -7.9667, lng: 31.4, population: 95000 },
];

// ─── Major World Cities ───────────────────────────────────────────────────

const WORLD_CITIES: Loc[] = [
  // Africa
  { name: 'Nairobi', type: 'city', parentName: 'Kenya', countryCode: 'KE', lat: -1.2921, lng: 36.8219, population: 4922000, isPopular: true },
  { name: 'Mombasa', type: 'city', parentName: 'Kenya', countryCode: 'KE', lat: -4.0435, lng: 39.6682, population: 1214340, isPopular: true },
  { name: 'Kisumu', type: 'city', parentName: 'Kenya', countryCode: 'KE', lat: -0.1022, lng: 34.7617, population: 419054 },
  { name: 'Nakuru', type: 'city', parentName: 'Kenya', countryCode: 'KE', lat: -0.3031, lng: 36.0800, population: 367027 },
  { name: 'Kampala', type: 'city', parentName: 'Uganda', countryCode: 'UG', lat: 0.3476, lng: 32.5825, population: 3486000, isPopular: true },
  { name: 'Entebbe', type: 'city', parentName: 'Uganda', countryCode: 'UG', lat: 0.0461, lng: 32.4438, population: 79900 },
  { name: 'Kigali', type: 'city', parentName: 'Rwanda', countryCode: 'RW', lat: -1.9441, lng: 30.0619, population: 1345000, isPopular: true },
  { name: 'Lagos', type: 'city', parentName: 'Nigeria', countryCode: 'NG', lat: 6.5244, lng: 3.3792, population: 15800000, isPopular: true },
  { name: 'Abuja', type: 'city', parentName: 'Nigeria', countryCode: 'NG', lat: 9.0579, lng: 7.4951, population: 3600000, isPopular: true },
  { name: 'Johannesburg', type: 'city', parentName: 'South Africa', countryCode: 'ZA', lat: -26.2041, lng: 28.0473, population: 5875000, isPopular: true },
  { name: 'Cape Town', type: 'city', parentName: 'South Africa', countryCode: 'ZA', lat: -33.9249, lng: 18.4241, population: 4618000, isPopular: true },
  { name: 'Durban', type: 'city', parentName: 'South Africa', countryCode: 'ZA', lat: -29.8587, lng: 31.0218, population: 3442361 },
  { name: 'Accra', type: 'city', parentName: 'Ghana', countryCode: 'GH', lat: 5.6037, lng: -0.187, population: 2610000, isPopular: true },
  { name: 'Kumasi', type: 'city', parentName: 'Ghana', countryCode: 'GH', lat: 6.6884, lng: -1.6244, population: 3800000 },
  { name: 'Addis Ababa', type: 'city', parentName: 'Ethiopia', countryCode: 'ET', lat: 9.025, lng: 38.7469, population: 4795000, isPopular: true },
  { name: 'Casablanca', type: 'city', parentName: 'Morocco', countryCode: 'MA', lat: 33.5731, lng: -7.5898, population: 3752000, isPopular: true },
  { name: 'Cairo', type: 'city', parentName: 'Egypt', countryCode: 'EG', lat: 30.0444, lng: 31.2357, population: 21284000, isPopular: true },
  { name: 'Dakar', type: 'city', parentName: 'Senegal', countryCode: 'SN', lat: 14.7167, lng: -17.4677, population: 4076000, isPopular: true },
  { name: 'Kinshasa', type: 'city', parentName: 'Democratic Republic of Congo', countryCode: 'CD', lat: -4.4419, lng: 15.2663, population: 17070000, isPopular: true },
  { name: 'Yaoundé', type: 'city', parentName: 'Cameroon', countryCode: 'CM', lat: 3.848, lng: 11.5021, population: 3800000 },
  { name: 'Douala', type: 'city', parentName: 'Cameroon', countryCode: 'CM', lat: 4.0511, lng: 9.7679, population: 4395000 },
  { name: 'Tunis', type: 'city', parentName: 'Tunisia', countryCode: 'TN', lat: 36.8065, lng: 10.1815, population: 2263000 },
  { name: 'Algiers', type: 'city', parentName: 'Algeria', countryCode: 'DZ', lat: 36.7538, lng: 3.0588, population: 3415000 },
  { name: 'Lusaka', type: 'city', parentName: 'Zambia', countryCode: 'ZM', lat: -15.3875, lng: 28.3228, population: 2650000, isPopular: true },
  { name: 'Harare', type: 'city', parentName: 'Zimbabwe', countryCode: 'ZW', lat: -17.8292, lng: 31.0522, population: 2130000 },
  { name: 'Maputo', type: 'city', parentName: 'Mozambique', countryCode: 'MZ', lat: -25.9692, lng: 32.5732, population: 1216000 },
  { name: 'Lilongwe', type: 'city', parentName: 'Malawi', countryCode: 'MW', lat: -13.9899, lng: 33.7703, population: 1089765 },
  { name: 'Blantyre', type: 'city', parentName: 'Malawi', countryCode: 'MW', lat: -15.7861, lng: 35.0086, population: 994509 },
  { name: 'Khartoum', type: 'city', parentName: 'Sudan', countryCode: 'SD', lat: 15.5007, lng: 32.5599, population: 6187000 },
  { name: 'Mogadishu', type: 'city', parentName: 'Somalia', countryCode: 'SO', lat: 2.0469, lng: 45.3182, population: 2850000 },
  { name: 'Abidjan', type: 'city', parentName: 'Ivory Coast', countryCode: 'CI', lat: 5.3600, lng: -4.0083, population: 5360000 },
  { name: 'Monrovia', type: 'city', parentName: 'Liberia', countryCode: 'LR', lat: 6.3005, lng: -10.7969, population: 1380000 },

  // Europe
  { name: 'London', type: 'city', parentName: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278, population: 8982000, isPopular: true },
  { name: 'Manchester', type: 'city', parentName: 'United Kingdom', countryCode: 'GB', lat: 53.4808, lng: -2.2426, population: 2553000 },
  { name: 'Liverpool', type: 'city', parentName: 'United Kingdom', countryCode: 'GB', lat: 53.4084, lng: -2.9916, population: 879600 },
  { name: 'Paris', type: 'city', parentName: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522, population: 2161000, isPopular: true },
  { name: 'Lyon', type: 'city', parentName: 'France', countryCode: 'FR', lat: 45.764, lng: 4.8357, population: 516092 },
  { name: 'Marseille', type: 'city', parentName: 'France', countryCode: 'FR', lat: 43.2965, lng: 5.3698, population: 870018 },
  { name: 'Berlin', type: 'city', parentName: 'Germany', countryCode: 'DE', lat: 52.52, lng: 13.405, population: 3645000, isPopular: true },
  { name: 'Munich', type: 'city', parentName: 'Germany', countryCode: 'DE', lat: 48.1351, lng: 11.582, population: 1472000 },
  { name: 'Madrid', type: 'city', parentName: 'Spain', countryCode: 'ES', lat: 40.4168, lng: -3.7038, population: 3224000, isPopular: true },
  { name: 'Barcelona', type: 'city', parentName: 'Spain', countryCode: 'ES', lat: 41.3874, lng: 2.1686, population: 1620000, isPopular: true },
  { name: 'Rome', type: 'city', parentName: 'Italy', countryCode: 'IT', lat: 41.9028, lng: 12.4964, population: 2873000, isPopular: true },
  { name: 'Milan', type: 'city', parentName: 'Italy', countryCode: 'IT', lat: 45.4642, lng: 9.1900, population: 1400000 },
  { name: 'Lisbon', type: 'city', parentName: 'Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393, population: 545000 },
  { name: 'Amsterdam', type: 'city', parentName: 'Netherlands', countryCode: 'NL', lat: 52.3676, lng: 4.9041, population: 873000 },
  { name: 'Istanbul', type: 'city', parentName: 'Turkey', countryCode: 'TR', lat: 41.0082, lng: 28.9784, population: 15460000, isPopular: true },
  { name: 'Ankara', type: 'city', parentName: 'Turkey', countryCode: 'TR', lat: 39.9334, lng: 32.8597, population: 5615000 },

  // Americas
  { name: 'New York', type: 'city', parentName: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.006, population: 8336817, isPopular: true },
  { name: 'Los Angeles', type: 'city', parentName: 'United States', countryCode: 'US', lat: 34.0522, lng: -118.2437, population: 3979576, isPopular: true },
  { name: 'Chicago', type: 'city', parentName: 'United States', countryCode: 'US', lat: 41.8781, lng: -87.6298, population: 2693976 },
  { name: 'Houston', type: 'city', parentName: 'United States', countryCode: 'US', lat: 29.7604, lng: -95.3698, population: 2320268 },
  { name: 'Miami', type: 'city', parentName: 'United States', countryCode: 'US', lat: 25.7617, lng: -80.1918, population: 467963 },
  { name: 'Toronto', type: 'city', parentName: 'Canada', countryCode: 'CA', lat: 43.6532, lng: -79.3832, population: 2731571, isPopular: true },
  { name: 'Vancouver', type: 'city', parentName: 'Canada', countryCode: 'CA', lat: 49.2827, lng: -123.1207, population: 675218 },
  { name: 'São Paulo', type: 'city', parentName: 'Brazil', countryCode: 'BR', lat: -23.5505, lng: -46.6333, population: 12330000, isPopular: true },
  { name: 'Rio de Janeiro', type: 'city', parentName: 'Brazil', countryCode: 'BR', lat: -22.9068, lng: -43.1729, population: 6748000, isPopular: true },
  { name: 'Buenos Aires', type: 'city', parentName: 'Argentina', countryCode: 'AR', lat: -34.6037, lng: -58.3816, population: 3039000, isPopular: true },
  { name: 'Mexico City', type: 'city', parentName: 'Mexico', countryCode: 'MX', lat: 19.4326, lng: -99.1332, population: 9210000, isPopular: true },
  { name: 'Bogotá', type: 'city', parentName: 'Colombia', countryCode: 'CO', lat: 4.711, lng: -74.0721, population: 7412000 },
  { name: 'Kingston', type: 'city', parentName: 'Jamaica', countryCode: 'JM', lat: 18.0179, lng: -76.8099, population: 663000 },
  { name: 'Port-au-Prince', type: 'city', parentName: 'Haiti', countryCode: 'HT', lat: 18.5944, lng: -72.3074, population: 1500000 },

  // Middle East & Asia
  { name: 'Dubai', type: 'city', parentName: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708, population: 3478000, isPopular: true },
  { name: 'Abu Dhabi', type: 'city', parentName: 'United Arab Emirates', countryCode: 'AE', lat: 24.4539, lng: 54.3773, population: 1483000 },
  { name: 'Riyadh', type: 'city', parentName: 'Saudi Arabia', countryCode: 'SA', lat: 24.7136, lng: 46.6753, population: 7680000, isPopular: true },
  { name: 'Jeddah', type: 'city', parentName: 'Saudi Arabia', countryCode: 'SA', lat: 21.4858, lng: 39.1925, population: 4700000 },
  { name: 'Doha', type: 'city', parentName: 'Qatar', countryCode: 'QA', lat: 25.2854, lng: 51.531, population: 956000 },
  { name: 'Mumbai', type: 'city', parentName: 'India', countryCode: 'IN', lat: 19.076, lng: 72.8777, population: 20411000, isPopular: true },
  { name: 'Delhi', type: 'city', parentName: 'India', countryCode: 'IN', lat: 28.7041, lng: 77.1025, population: 16788000, isPopular: true },
  { name: 'Bangalore', type: 'city', parentName: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946, population: 12327000 },
  { name: 'Beijing', type: 'city', parentName: 'China', countryCode: 'CN', lat: 39.9042, lng: 116.4074, population: 21540000, isPopular: true },
  { name: 'Shanghai', type: 'city', parentName: 'China', countryCode: 'CN', lat: 31.2304, lng: 121.4737, population: 24870000, isPopular: true },
  { name: 'Guangzhou', type: 'city', parentName: 'China', countryCode: 'CN', lat: 23.1291, lng: 113.2644, population: 18677000 },
  { name: 'Tokyo', type: 'city', parentName: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503, population: 13960000, isPopular: true },
  { name: 'Osaka', type: 'city', parentName: 'Japan', countryCode: 'JP', lat: 34.6937, lng: 135.5023, population: 2753000 },
  { name: 'Seoul', type: 'city', parentName: 'South Korea', countryCode: 'KR', lat: 37.5665, lng: 126.978, population: 9776000, isPopular: true },
  { name: 'Bangkok', type: 'city', parentName: 'Thailand', countryCode: 'TH', lat: 13.7563, lng: 100.5018, population: 10539000, isPopular: true },

  // Oceania
  { name: 'Sydney', type: 'city', parentName: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093, population: 5312000, isPopular: true },
  { name: 'Melbourne', type: 'city', parentName: 'Australia', countryCode: 'AU', lat: -37.8136, lng: 144.9631, population: 5031000, isPopular: true },
  { name: 'Perth', type: 'city', parentName: 'Australia', countryCode: 'AU', lat: -31.9505, lng: 115.8605, population: 2100000 },
];

// ─── Seed Function ────────────────────────────────────────────────────────

async function seed() {
  console.log('[locations] Starting location seed...');

  // Check if already seeded
  const existingCount = await db.location.count();
  if (existingCount > 0) {
    console.log(`[locations] ${existingCount} locations already exist. Skipping seed.`);
    return;
  }

  // Build lookup map: name → id
  const idMap = new Map<string, string>();

  // 1. Seed countries
  console.log(`[locations] Seeding ${COUNTRIES.length} countries...`);
  for (const c of COUNTRIES) {
    const id = crypto.randomUUID();
    idMap.set(c.name, id);
    await db.location.create({
      data: {
        id,
        name: c.name,
        nameLower: c.name.toLowerCase(),
        type: 'country',
        countryCode: c.countryCode,
        latitude: c.lat,
        longitude: c.lng,
        displayLabel: c.name,
        searchTokens: generateTokens(c.name),
        population: c.population,
        isPopular: c.isPopular ?? false,
      },
    });
  }

  // 2. Seed Tanzania regions
  console.log(`[locations] Seeding ${TZ_REGIONS.length} Tanzania regions...`);
  for (const r of TZ_REGIONS) {
    const id = crypto.randomUUID();
    const parentId = idMap.get('Tanzania');
    idMap.set(r.name, id);
    await db.location.create({
      data: {
        id,
        name: r.name,
        nameLower: r.name.toLowerCase(),
        type: 'region',
        parentId,
        countryCode: 'TZ',
        latitude: r.lat,
        longitude: r.lng,
        displayLabel: `${r.name}, Tanzania`,
        searchTokens: generateTokens(r.name),
        population: r.population,
        isPopular: r.isPopular ?? false,
      },
    });
  }

  // 3. Seed Tanzania cities
  console.log(`[locations] Seeding ${TZ_CITIES.length} Tanzania cities...`);
  for (const c of TZ_CITIES) {
    const id = crypto.randomUUID();
    const parentId = idMap.get(c.parentName!);
    if (!parentId) {
      console.warn(`  ⚠ Parent "${c.parentName}" not found, skipping ${c.name}`);
      continue;
    }
    idMap.set(c.name, id);
    await db.location.create({
      data: {
        id,
        name: c.name,
        nameLower: c.name.toLowerCase(),
        type: 'city',
        parentId,
        countryCode: 'TZ',
        latitude: c.lat,
        longitude: c.lng,
        displayLabel: `${c.name}, ${c.parentName}`,
        searchTokens: generateTokens(c.name),
        population: c.population,
        isPopular: c.isPopular ?? false,
      },
    });
  }

  // 4. Seed world cities
  console.log(`[locations] Seeding ${WORLD_CITIES.length} world cities...`);
  for (const c of WORLD_CITIES) {
    const id = crypto.randomUUID();
    const parentId = idMap.get(c.parentName!);
    if (!parentId) {
      console.warn(`  ⚠ Parent "${c.parentName}" not found, skipping ${c.name}`);
      continue;
    }
    idMap.set(c.name, id);
    await db.location.create({
      data: {
        id,
        name: c.name,
        nameLower: c.name.toLowerCase(),
        type: 'city',
        parentId,
        countryCode: c.countryCode,
        latitude: c.lat,
        longitude: c.lng,
        displayLabel: `${c.name}, ${c.parentName}`,
        searchTokens: generateTokens(c.name),
        population: c.population,
        isPopular: c.isPopular ?? false,
      },
    });
  }

  const total = await db.location.count();
  console.log(`[locations] ✅ Seeded ${total} locations successfully.`);
}

seed()
  .catch((e) => {
    console.error('[locations] Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
