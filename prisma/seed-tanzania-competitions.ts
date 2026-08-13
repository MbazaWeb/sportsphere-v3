/**
 * seed-tanzania-competitions.ts
 *
 * SportSphere Tanzania — Competition Hierarchy Seed
 *
 * Seeds the complete competition structure for all 7 Tanzania sports:
 *   Leagues, Cups, Tournaments, Championships, National Teams
 *
 * Usage:
 *   npx tsx prisma/seed-tanzania-competitions.ts
 *
 * Idempotent — uses upsert by slug.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ─── Helper ──────────────────────────────────────────────────────

async function getSportId(sportSlug: string): Promise<string | null> {
  const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
  return sport?.id ?? null;
}

async function upsertCompetition(data: {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  type: string; // league | cup | tournament | championship
  sportId: string;
  season?: string | null;
  description: string;
  gender?: string;
  tier?: number;
  isActive: boolean;
}) {
  const existing = await db.league.findUnique({ where: { slug: data.slug } });
  if (existing) {
    await db.league.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        type: data.type,
        season: data.season ?? null,
        description: data.description,
        verified: true,
        source: "manual",
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });
    console.log(`  [UPD] ${data.name}`);
  } else {
    await db.league.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        country: data.country,
        countryCode: data.countryCode,
        type: data.type,
        sportId: data.sportId,
        season: data.season ?? null,
        description: data.description,
        verified: true,
        source: "manual",
        createdByAI: false,
        isActive: data.isActive,
        metadata: data.gender ? { gender: data.gender, tier: data.tier } : { tier: data.tier },
        updatedAt: new Date(),
      },
    });
    console.log(`  [+] ${data.name} (${data.type})`);
  }
}

// ─── Competition Data ────────────────────────────────────────────

interface Comp {
  id: string;
  name: string;
  slug: string;
  type: string;
  sportSlug: string;
  season?: string;
  gender?: string;
  tier?: number;
  description: string;
}

const TANZANIA_COMPETITIONS: Comp[] = [
  // ═══════════════════════════════════════════════════════════════
  // FOOTBALL
  // ═══════════════════════════════════════════════════════════════

  // --- Leagues ---
  {
    id: "comp-vpl",
    name: "Vodacom Premier League",
    slug: "vodacom-premier-league",
    type: "league",
    sportSlug: "football",
    season: "2025/2026",
    tier: 1,
    description:
      "Top-tier professional football league in Tanzania. 16 teams compete annually from August to May. Governed by TFF and sponsored by Vodacom Tanzania. The champion qualifies for the CAF Champions League.",
  },
  {
    id: "comp-nbc-premier",
    name: "NBC Premier League",
    slug: "nbc-premier-league",
    type: "league",
    sportSlug: "football",
    season: "2025/2026",
    tier: 2,
    description:
      "Second-tier football league in Tanzania, serving as the primary promotion pathway to the Vodacom Premier League. Clubs from all 31 regions compete in zone playoffs to reach this division.",
  },
  {
    id: "comp-first-division",
    name: "First Division League",
    slug: "first-division-league",
    type: "league",
    sportSlug: "football",
    season: "2025/2026",
    tier: 3,
    description:
      "Third-tier league organized by regional football associations. Acts as the grassroots foundation for professional football development across Tanzania.",
  },
  {
    id: "comp-u20-league",
    name: "U20 Youth League",
    slug: "u20-youth-league",
    type: "league",
    sportSlug: "football",
    season: "2025",
    tier: 1,
    gender: "male",
    description:
      "National youth football league for players under 20. Feeds players into the senior professional leagues and national team pipeline.",
  },
  {
    id: "comp-womens-league",
    name: "Seria A Women's League",
    slug: "seria-a-womens-league",
    type: "league",
    sportSlug: "football",
    season: "2025",
    tier: 1,
    gender: "female",
    description:
      "Top-tier women's football league in Tanzania. Governed by TFF and instrumental in developing the women's national team, Twiga Stars.",
  },
  {
    id: "comp-zanzibar-premier",
    name: "Zanzibar Premier League",
    slug: "zanzibar-premier-league",
    type: "league",
    sportSlug: "football",
    season: "2025/2026",
    tier: 1,
    description:
      "Top football league in Zanzibar. Teams compete independently before the champion faces the mainland champion in the Union Cup. Governed by ZFA.",
  },

  // --- Cups ---
  {
    id: "comp-federation-cup",
    name: "Azam Sports Federation Cup",
    slug: "azam-sports-federation-cup",
    type: "cup",
    sportSlug: "football",
    season: "2025/2026",
    description:
      "National knockout cup competition for Tanzanian football clubs. Open to teams from all divisions. The winner qualifies for the CAF Confederation Cup. Sponsored by Azam Media.",
  },
  {
    id: "comp-community-shield",
    name: "Community Shield",
    slug: "community-shield",
    type: "cup",
    sportSlug: "football",
    description:
      "Annual super cup match between the VPL champions and the Federation Cup winners. Marks the opening of the Tanzanian football season.",
  },
  {
    id: "comp-mapinduzi-cup",
    name: "Mapinduzi Cup",
    slug: "mapinduzi-cup",
    type: "cup",
    sportSlug: "football",
    description:
      "Annual tournament held in January to celebrate the Zanzibar Revolution (Mapinduzi). Features clubs from both mainland Tanzania and Zanzibar.",
  },
  {
    id: "comp-union-cup",
    name: "Union Cup",
    slug: "union-cup",
    type: "cup",
    sportSlug: "football",
    description:
      "Championship between the mainland VPL winner and the Zanzibar Premier League winner. Symbolizes the Tanzania Union.",
  },
  {
    id: "comp-nane-nane-cup",
    name: "Nane Nane Cup",
    slug: "nane-nane-cup",
    type: "cup",
    sportSlug: "football",
    description:
      "Annual football tournament held during the Nane Nane (August 8th) agricultural festival. Traditionally features top Tanzanian clubs.",
  },

  // --- Tournaments ---
  {
    id: "comp-kagame-interclub",
    name: "Kagame Interclub Cup",
    slug: "kagame-interclub-cup",
    type: "tournament",
    sportSlug: "football",
    description:
      "Regional East African club competition for champions from Tanzania, Kenya, Uganda, Rwanda, Burundi, South Sudan, and Ethiopia. Named after former Rwandan President Paul Kagame.",
  },
  {
    id: "comp-cecafa-club",
    name: "CECAFA Club Championship",
    slug: "cecafa-club-championship",
    type: "tournament",
    sportSlug: "football",
    description:
      "Council for East and Central Africa Football Associations club championship. Top Tanzanian clubs compete against the best teams from the CECAFA region.",
  },

  // --- National Teams ---
  {
    id: "comp-taifa-stars",
    name: "Taifa Stars",
    slug: "taifa-stars",
    type: "tournament",
    sportSlug: "football",
    tier: 1,
    gender: "male",
    description:
      "Tanzania senior men's national football team. Governed by TFF. Competes in AFCON qualifiers, COSAFA Cup, and CECAFA tournaments. Known as 'Taifa Stars' (Nation Stars).",
  },
  {
    id: "comp-twiga-stars",
    name: "Twiga Stars",
    slug: "twiga-stars",
    type: "tournament",
    sportSlug: "football",
    tier: 1,
    gender: "female",
    description:
      "Tanzania senior women's national football team. Competes in AWCON qualifiers and CECAFA women's championships. Known as 'Twiga Stars' (Giraffe Stars).",
  },
  {
    id: "comp-tanzania-u23",
    name: "Tanzania U23",
    slug: "tanzania-u23",
    type: "tournament",
    sportSlug: "football",
    tier: 2,
    gender: "male",
    description:
      "Tanzania men's under-23 national football team. Competes in Olympic qualifiers and U23 AFCON tournaments.",
  },
  {
    id: "comp-tanzania-u20",
    name: "Tanzania U20",
    slug: "tanzania-u20-national-team",
    type: "tournament",
    sportSlug: "football",
    tier: 3,
    gender: "male",
    description:
      "Tanzania men's under-20 national football team. Competes in U20 AFCON qualifiers and CECAFA U20 championships.",
  },
  {
    id: "comp-serengeti-boys",
    name: "Serengeti Boys U17",
    slug: "serengeti-boys-u17",
    type: "tournament",
    sportSlug: "football",
    tier: 4,
    gender: "male",
    description:
      "Tanzania men's under-17 national football team. Known as 'Serengeti Boys'. Competes in U17 AFCON qualifiers and COSAFA U17 tournaments.",
  },

  // ═══════════════════════════════════════════════════════════════
  // BASKETBALL
  // ═══════════════════════════════════════════════════════════════

  // --- Leagues ---
  {
    id: "comp-nbl",
    name: "National Basketball League",
    slug: "national-basketball-league",
    type: "league",
    sportSlug: "basketball",
    season: "2025",
    tier: 1,
    description:
      "Top-tier basketball league in Tanzania. Teams from Dar es Salaam, Mwanza, Arusha, and other major cities compete. Governed by the Tanzania Basketball Federation (TBF).",
  },
  {
    id: "comp-basketball-div1",
    name: "Basketball Division One",
    slug: "basketball-division-one",
    type: "league",
    sportSlug: "basketball",
    season: "2025",
    tier: 2,
    description:
      "Second-tier basketball league serving as the promotion pathway to the National Basketball League. Features teams from emerging basketball regions.",
  },
  {
    id: "comp-womens-basketball",
    name: "Women's Basketball League",
    slug: "womens-basketball-league",
    type: "league",
    sportSlug: "basketball",
    season: "2025",
    tier: 1,
    gender: "female",
    description:
      "Top-tier women's basketball league in Tanzania. Growing rapidly with teams from Dar es Salaam, Mwanza, and Arusha.",
  },
  {
    id: "comp-zanzibar-basketball",
    name: "Zanzibar Basketball League",
    slug: "zanzibar-basketball-league",
    type: "league",
    sportSlug: "basketball",
    season: "2025",
    tier: 1,
    description:
      "Premier basketball competition in Zanzibar, featuring local clubs from Unguja and Pemba islands.",
  },

  // --- Cups ---
  {
    id: "comp-basketball-cup",
    name: "National Basketball Cup",
    slug: "national-basketball-cup",
    type: "cup",
    sportSlug: "basketball",
    description:
      "Annual knockout basketball cup competition open to all registered basketball clubs in Tanzania.",
  },

  // --- Tournaments ---
  {
    id: "comp-inter-city-basketball",
    name: "Inter-City Basketball Tournament",
    slug: "inter-city-basketball-tournament",
    type: "tournament",
    sportSlug: "basketball",
    description:
      "Annual tournament featuring city-based All-Star teams from across Tanzania's major cities: Dar es Salaam, Mwanza, Arusha, Mbeya, Dodoma.",
  },
  {
    id: "comp-cecafa-basketball",
    name: "CECAFA Basketball Championship",
    slug: "cecafa-basketball-championship",
    type: "tournament",
    sportSlug: "basketball",
    description:
      "Regional East African basketball championship. Tanzania national team competes against Kenya, Uganda, Rwanda, Burundi, and other CECAFA nations.",
  },

  // --- National Teams ---
  {
    id: "comp-tanzania-basketball",
    name: "Tanzania National Basketball Team",
    slug: "tanzania-national-basketball-team",
    type: "tournament",
    sportSlug: "basketball",
    tier: 1,
    gender: "male",
    description:
      "Tanzania senior men's national basketball team. Competes in FIBA AfroBasket qualifiers and regional CECAFA championships.",
  },
  {
    id: "comp-tanzania-womens-basketball",
    name: "Tanzania Women's Basketball Team",
    slug: "tanzania-womens-basketball-team",
    type: "tournament",
    sportSlug: "basketball",
    tier: 1,
    gender: "female",
    description:
      "Tanzania senior women's national basketball team. Competes in FIBA AfroBasket Women qualifiers and regional championships.",
  },

  // ═══════════════════════════════════════════════════════════════
  // ATHLETICS
  // ═══════════════════════════════════════════════════════════════

  // --- Championships ---
  {
    id: "comp-national-athletics-champs",
    name: "Tanzania National Athletics Championships",
    slug: "tanzania-national-athletics-championships",
    type: "championship",
    sportSlug: "athletics",
    tier: 1,
    description:
      "Premier annual athletics championship in Tanzania. Track and field athletes compete across sprints, middle-distance, long-distance, jumps, and throws. Organized by Tanzania Athletics (TAA).",
  },
  {
    id: "comp-cross-country-champs",
    name: "Tanzania Cross Country Championships",
    slug: "tanzania-cross-country-championships",
    type: "championship",
    sportSlug: "athletics",
    tier: 1,
    description:
      "National cross country championship held annually. Key qualification event for World Cross Country Championships and African Cross Country Championships.",
  },
  {
    id: "comp-u18-athletics-champs",
    name: "U18 Athletics Championships",
    slug: "u18-athletics-championships",
    type: "championship",
    sportSlug: "athletics",
    tier: 2,
    description:
      "National youth athletics championship for athletes under 18. Critical talent identification event for Tanzania's athletics development pipeline.",
  },

  // --- Meets ---
  {
    id: "comp-dsm-international-meet",
    name: "Dar es Salaam International Meet",
    slug: "dar-es-salaam-international-meet",
    type: "tournament",
    sportSlug: "athletics",
    description:
      "Annual international athletics meeting held in Dar es Salaam. Attracts athletes from across East Africa and beyond. Features track and field events.",
  },
  {
    id: "comp-arusha-athletics-meet",
    name: "Arusha Athletics Meet",
    slug: "arusha-athletics-meet",
    type: "tournament",
    sportSlug: "athletics",
    description:
      "Annual athletics meeting held in Arusha. Features track events, long-distance running, and field events. Open to both local and international athletes.",
  },

  // --- Road Races ---
  {
    id: "comp-dsm-marathon",
    name: "Dar es Salaam Marathon",
    slug: "dar-es-salaam-marathon",
    type: "tournament",
    sportSlug: "athletics",
    description:
      "Annual marathon event in Dar es Salaam. Features full marathon, half marathon, and 10K races. One of the largest road racing events in East Africa.",
  },
  {
    id: "comp-kilimanjaro-marathon",
    name: "Kilimanjaro Marathon",
    slug: "kilimanjaro-marathon",
    type: "tournament",
    sportSlug: "athletics",
    description:
      "Annual marathon held near Mount Kilimanjaro in Moshi. Features full and half marathon distances. Attracts international runners for its scenic route.",
  },
  {
    id: "comp-serengeti-half",
    name: "Serengeti Half Marathon",
    slug: "serengeti-half-marathon",
    type: "tournament",
    sportSlug: "athletics",
    description:
      "Annual half marathon event in the Serengeti region. Unique race experience combining athletics with wildlife tourism.",
  },
  {
    id: "comp-mwanza-10k",
    name: "Mwanza 10K & Half Marathon",
    slug: "mwanza-10k-half-marathon",
    type: "tournament",
    sportSlug: "athletics",
    description:
      "Annual road race event in Mwanza. Features 10K and half marathon distances along Lake Victoria's shores.",
  },

  // --- National Teams ---
  {
    id: "comp-tanzania-athletics",
    name: "Tanzania National Athletics Team",
    slug: "tanzania-national-athletics-team",
    type: "tournament",
    sportSlug: "athletics",
    tier: 1,
    description:
      "Tanzania's national athletics team. Competes at World Athletics Championships, African Championships, Commonwealth Games, and Olympic Games. Tanzania is renowned for long-distance running.",
  },

  // ═══════════════════════════════════════════════════════════════
  // BOXING
  // ═══════════════════════════════════════════════════════════════

  // --- Championships ---
  {
    id: "comp-national-boxing-champs",
    name: "Tanzania National Boxing Championships",
    slug: "tanzania-national-boxing-championships",
    type: "championship",
    sportSlug: "boxing",
    tier: 1,
    description:
      "Premier annual boxing championship in Tanzania. Amateur and professional boxers compete across all weight classes. Organized by the Tanzania Boxing Federation (TBF).",
  },
  {
    id: "comp-military-boxing-champs",
    name: "Inter-Forces Boxing Championships",
    slug: "inter-forces-boxing-championships",
    type: "championship",
    sportSlug: "boxing",
    description:
      "Annual boxing championship between Tanzania's military, police, and security forces. A traditional talent pipeline for national boxing.",
  },
  {
    id: "comp-youth-boxing-champs",
    name: "Youth Boxing Championships",
    slug: "youth-boxing-championships",
    type: "championship",
    sportSlug: "boxing",
    tier: 2,
    description:
      "National youth boxing championship for boxers under 20. Critical for talent identification and development of Tanzania's next generation of boxers.",
  },

  // --- Tournaments ---
  {
    id: "comp-cecafa-boxing",
    name: "CECAFA Boxing Championship",
    slug: "cecafa-boxing-championship",
    type: "tournament",
    sportSlug: "boxing",
    description:
      "Regional East African boxing championship. Tanzania boxers compete against fighters from Kenya, Uganda, Rwanda, Burundi, Ethiopia, and other CECAFA nations.",
  },
  {
    id: "comp-dsm-boxing-night",
    name: "Dar es Salaam Boxing Night",
    slug: "dar-es-salaam-boxing-night",
    type: "tournament",
    sportSlug: "boxing",
    description:
      "Regular professional boxing event held in Dar es Salaam. Features local and international bouts. Premier boxing entertainment event in Tanzania.",
  },

  // --- National Teams ---
  {
    id: "comp-tanzania-boxing",
    name: "Tanzania National Boxing Team",
    slug: "tanzania-national-boxing-team",
    type: "tournament",
    sportSlug: "boxing",
    tier: 1,
    description:
      "Tanzania's national amateur boxing team. Competes at African Boxing Championships, Commonwealth Games, Olympic qualifiers, and World Boxing Championships.",
  },

  // ═══════════════════════════════════════════════════════════════
  // VOLLEYBALL
  // ═══════════════════════════════════════════════════════════════

  // --- Leagues ---
  {
    id: "comp-volleyball-league",
    name: "National Volleyball League",
    slug: "national-volleyball-league",
    type: "league",
    sportSlug: "volleyball",
    season: "2025",
    tier: 1,
    gender: "male",
    description:
      "Top-tier men's volleyball league in Tanzania. Teams compete in home-and-away format. Governed by the Tanzania Volleyball Association (TVA).",
  },
  {
    id: "comp-womens-volleyball-league",
    name: "Women's Volleyball League",
    slug: "womens-volleyball-league",
    type: "league",
    sportSlug: "volleyball",
    season: "2025",
    tier: 1,
    gender: "female",
    description:
      "Top-tier women's volleyball league in Tanzania. Strong following in Dar es Salaam, Mwanza, and Dodoma. Feed for the national women's team.",
  },
  {
    id: "comp-zanzibar-volleyball",
    name: "Zanzibar Volleyball League",
    slug: "zanzibar-volleyball-league",
    type: "league",
    sportSlug: "volleyball",
    season: "2025",
    description:
      "Premier volleyball league in Zanzibar. Features clubs from Unguja and Pemba islands for both men and women.",
  },

  // --- Championships ---
  {
    id: "comp-volleyball-champs",
    name: "Tanzania Volleyball Championship",
    slug: "tanzania-volleyball-championship",
    type: "championship",
    sportSlug: "volleyball",
    tier: 1,
    description:
      "Annual national volleyball championship determining the national club champion. Features the top teams from the league season in a knockout format.",
  },
  {
    id: "comp-beach-volleyball-champs",
    name: "Tanzania Beach Volleyball Championship",
    slug: "tanzania-beach-volleyball-championship",
    type: "championship",
    sportSlug: "volleyball",
    tier: 1,
    description:
      "National beach volleyball championship held annually on the coast of Dar es Salaam and Zanzibar. Growing sport in Tanzania with increasing international participation.",
  },

  // --- Tournaments ---
  {
    id: "comp-inter-club-volleyball",
    name: "Inter-Club Volleyball Tournament",
    slug: "inter-club-volleyball-tournament",
    type: "tournament",
    sportSlug: "volleyball",
    description:
      "Annual invitational volleyball tournament featuring top clubs from Tanzania and East Africa. Held in various cities across the country.",
  },
  {
    id: "comp-cecafa-volleyball",
    name: "CECAFA Volleyball Championship",
    slug: "cecafa-volleyball-championship",
    type: "tournament",
    sportSlug: "volleyball",
    description:
      "Regional East African volleyball championship. Tanzania national teams compete against CECAFA member nations.",
  },

  // --- National Teams ---
  {
    id: "comp-tanzania-volleyball-m",
    name: "Tanzania Men's Volleyball Team",
    slug: "tanzania-mens-volleyball-team",
    type: "tournament",
    sportSlug: "volleyball",
    tier: 1,
    gender: "male",
    description:
      "Tanzania senior men's national volleyball team. Competes in African Volleyball Championships and Zone V qualifiers.",
  },
  {
    id: "comp-tanzania-volleyball-w",
    name: "Tanzania Women's Volleyball Team",
    slug: "tanzania-womens-volleyball-team",
    type: "tournament",
    sportSlug: "volleyball",
    tier: 1,
    gender: "female",
    description:
      "Tanzania senior women's national volleyball team. Competes in African Women's Volleyball Championship and All-Africa Games.",
  },

  // ═══════════════════════════════════════════════════════════════
  // NETBALL
  // ═══════════════════════════════════════════════════════════════

  // --- Leagues ---
  {
    id: "comp-netball-league",
    name: "National Netball League",
    slug: "national-netball-league",
    type: "league",
    sportSlug: "netball",
    season: "2025",
    tier: 1,
    gender: "female",
    description:
      "Top-tier netball league in Tanzania. The primary competition feeding players into the national team, Taifa Queens. Teams from Dar es Salaam, Mwanza, and other regions.",
  },
  {
    id: "comp-netball-div1",
    name: "Netball Division One",
    slug: "netball-division-one",
    type: "league",
    sportSlug: "netball",
    season: "2025",
    tier: 2,
    gender: "female",
    description:
      "Second-tier netball league in Tanzania. Serves as the promotion pathway to the National Netball League.",
  },
  {
    id: "comp-zanzibar-netball",
    name: "Zanzibar Netball League",
    slug: "zanzibar-netball-league",
    type: "league",
    sportSlug: "netball",
    season: "2025",
    tier: 1,
    gender: "female",
    description:
      "Premier netball league in Zanzibar. Netball is very popular in Zanzibar with strong school and club programs.",
  },

  // --- Championships ---
  {
    id: "comp-netball-champs",
    name: "Tanzania Netball Championship",
    slug: "tanzania-netball-championship",
    type: "championship",
    sportSlug: "netball",
    tier: 1,
    gender: "female",
    description:
      "Annual national netball championship. Features the top clubs from the league season in a knockout format to determine the national club champion.",
  },
  {
    id: "comp-schools-netball",
    name: "National Schools Netball Championship",
    slug: "national-schools-netball-championship",
    type: "championship",
    sportSlug: "netball",
    tier: 2,
    gender: "female",
    description:
      "Annual national schools netball championship. A major talent identification event for young netball players across Tanzania's secondary schools.",
  },

  // --- Tournaments ---
  {
    id: "comp-inter-region-netball",
    name: "Inter-Region Netball Tournament",
    slug: "inter-region-netball-tournament",
    type: "tournament",
    sportSlug: "netball",
    description:
      "Annual tournament where regional teams from Tanzania's 31 regions compete. Major event in the national netball calendar.",
  },

  // --- National Teams ---
  {
    id: "comp-taifa-queens",
    name: "Taifa Queens",
    slug: "taifa-queens",
    type: "tournament",
    sportSlug: "netball",
    tier: 1,
    gender: "female",
    description:
      "Tanzania senior women's national netball team. Known as 'Taifa Queens'. Competes in Netball World Cup, African Netball Championship, and Commonwealth Games. Ranked among the top teams in Africa.",
  },
  {
    id: "comp-tanzania-u21-netball",
    name: "Tanzania U21 Netball Team",
    slug: "tanzania-u21-netball-team",
    type: "tournament",
    sportSlug: "netball",
    tier: 2,
    gender: "female",
    description:
      "Tanzania women's under-21 national netball team. Development team feeding into the senior Taifa Queens squad.",
  },

  // ═══════════════════════════════════════════════════════════════
  // RUGBY
  // ═══════════════════════════════════════════════════════════════

  // --- Leagues ---
  {
    id: "comp-rugby-league",
    name: "National Rugby League",
    slug: "national-rugby-league",
    type: "league",
    sportSlug: "rugby",
    season: "2025",
    tier: 1,
    gender: "male",
    description:
      "Top-tier rugby union league in Tanzania. Clubs compete in a league format from March to October. Governed by the Tanzania Rugby Union (TRU).",
  },
  {
    id: "comp-rugby-div1",
    name: "Rugby Division One",
    slug: "rugby-division-one",
    type: "league",
    sportSlug: "rugby",
    season: "2025",
    tier: 2,
    gender: "male",
    description:
      "Second-tier rugby league in Tanzania. Promotion pathway to the National Rugby League for emerging clubs.",
  },
  {
    id: "comp-rugby-sevens-series",
    name: "National Rugby Sevens Series",
    slug: "national-rugby-sevens-series",
    type: "league",
    sportSlug: "rugby",
    season: "2025",
    tier: 1,
    gender: "male",
    description:
      "National rugby sevens circuit with multiple rounds across Tanzania. Features fast-paced sevens rugby. Qualification pathway for Olympic and Commonwealth Games.",
  },
  {
    id: "comp-womens-rugby-league",
    name: "Women's Rugby League",
    slug: "womens-rugby-league",
    type: "league",
    sportSlug: "rugby",
    season: "2025",
    tier: 1,
    gender: "female",
    description:
      "Top-tier women's rugby league in Tanzania. Women's rugby is a rapidly growing sport in the country.",
  },

  // --- Championships ---
  {
    id: "comp-rugby-champs",
    name: "Tanzania Rugby Championship",
    slug: "tanzania-rugby-championship",
    type: "championship",
    sportSlug: "rugby",
    tier: 1,
    description:
      "Annual national rugby championship determining the champion club of Tanzania. Features top teams from the league in knockout format.",
  },
  {
    id: "comp-rugby-sevens-champs",
    name: "Tanzania Rugby Sevens Championship",
    slug: "tanzania-rugby-sevens-championship",
    type: "championship",
    sportSlug: "rugby",
    tier: 1,
    description:
      "Annual rugby sevens championship. Crowns the national sevens champion and serves as Olympic qualification pathway.",
  },

  // --- Tournaments ---
  {
    id: "comp-dsm-rugby-10s",
    name: "Dar es Salaam Rugby 10s",
    slug: "dar-es-salaam-rugby-10s",
    type: "tournament",
    sportSlug: "rugby",
    description:
      "Annual rugby tens tournament held in Dar es Salaam. Attracts teams from across East Africa and beyond. Popular social and competitive rugby event.",
  },
  {
    id: "comp-arusha-rugby-festival",
    name: "Arusha Rugby Festival",
    slug: "arusha-rugby-festival",
    type: "tournament",
    sportSlug: "rugby",
    description:
      "Annual rugby festival held in Arusha. Combines competitive rugby with cultural celebrations. Features both XVs and Sevens formats.",
  },
  {
    id: "comp-carthage-trophy",
    name: "CAR Trophy (Africa Rugby)",
    slug: "car-trophy-africa-rugby",
    type: "tournament",
    sportSlug: "rugby",
    description:
      "Africa Rugby Confederation (CAR) Trophy competition. Tanzania Twigas compete against other African nations for regional rugby supremacy.",
  },

  // --- National Teams ---
  {
    id: "comp-twigas-xv",
    name: "Twigas (Tanzania Rugby XV)",
    slug: "twigas-tanzania-rugby-xv",
    type: "tournament",
    sportSlug: "rugby",
    tier: 1,
    gender: "male",
    description:
      "Tanzania senior men's national rugby union team. Known as 'Twigas' (Giraffes). Competes in Africa Cup, CAR Trophy, and Commonwealth Games qualifiers.",
  },
  {
    id: "comp-twigas-sevens",
    name: "Twigas Sevens",
    slug: "twigas-sevens",
    type: "tournament",
    sportSlug: "rugby",
    tier: 1,
    gender: "male",
    description:
      "Tanzania national rugby sevens team. Competes in World Rugby Sevens Series qualifiers, African Sevens Championship, and Commonwealth Games.",
  },
  {
    id: "comp-tanzania-womens-rugby",
    name: "Tanzania Women's Rugby Team",
    slug: "tanzania-womens-rugby-team",
    type: "tournament",
    sportSlug: "rugby",
    tier: 1,
    gender: "female",
    description:
      "Tanzania senior women's national rugby team. Competes in African Women's Rugby Championship and regional tournaments.",
  },
];

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("=================================================");
  console.log("  SportSphere Tanzania — Competition Hierarchy Seed");
  console.log("=================================================");

  const results: Record<string, number> = {
    football: 0, basketball: 0, athletics: 0,
    boxing: 0, volleyball: 0, netball: 0, rugby: 0,
  };

  for (const comp of TANZANIA_COMPETITIONS) {
    const sportId = await getSportId(comp.sportSlug);
    if (!sportId) {
      console.log(`  [SKIP] ${comp.name} — sport ${comp.sportSlug} not found`);
      continue;
    }

    await upsertCompetition({
      id: comp.id,
      name: comp.name,
      slug: comp.slug,
      country: "Tanzania",
      countryCode: "TZ",
      type: comp.type,
      sportId,
      season: comp.season ?? null,
      description: comp.description,
      gender: comp.gender,
      tier: comp.tier,
      isActive: true,
    });

    results[comp.sportSlug] = (results[comp.sportSlug] || 0) + 1;
  }

  console.log("\n--- Summary by Sport ---");
  for (const [sport, count] of Object.entries(results)) {
    console.log(`  ${sport}: ${count} competitions`);
  }

  const totalLeagues = await db.league.count();
  console.log(`\n  Total competitions in DB: ${totalLeagues}`);
  console.log("  Tanzania Competition Hierarchy Complete!");
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
