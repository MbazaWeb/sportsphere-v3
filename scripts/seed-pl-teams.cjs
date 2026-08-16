const { PrismaClient } = require('/var/www/sportsphere-nextjs/node_modules/@prisma/client');
const p = new PrismaClient();

const TEAM_ROLE_ID = '199d10b8-dbf5-49a5-8a18-b7821602f522';
const PRO_CLUB_TYPE_ID = '6001f9a1-d44d-4a21-8c2a-74119f3be119';
const FOOTBALL_SPORT_ID = '419e6158-1e3c-4879-b683-b66dd1975003';

const TEAMS = [
  { name:'Arsenal', handle:'@arsenal', nickname:'The Gunners', city:'London', country:'England', stadium:'Emirates Stadium', capacity:60704, foundedYear:'1886', league:'Premier League', division:'Tier 1', colors:'Red, White', bio:'One of the most successful clubs in English football. 13 league titles and a record 14 FA Cups. Based in North London.', location:'London, England', website:'https://arsenal.com', socialInstagram:'arsenal', socialX:'Arsenal', coverGradient:'from-red-700 to-red-900' },
  { name:'Aston Villa', handle:'@astonvilla', nickname:'The Villans', city:'Birmingham', country:'England', stadium:'Villa Park', capacity:42657, foundedYear:'1874', league:'Premier League', division:'Tier 1', colors:'Claret, Sky Blue', bio:'One of the oldest and most successful football clubs in England. Seven-time league champions and European Cup winners.', location:'Birmingham, England', website:'https://avfc.co.uk', socialInstagram:'avfc_official', socialX:'AVFCOfficial', coverGradient:'from-purple-800 to-purple-950' },
  { name:'AFC Bournemouth', handle:'@afcbournemouth', nickname:'The Cherries', city:'Bournemouth', country:'England', stadium:'Vitality Stadium', capacity:12342, foundedYear:'1899', league:'Premier League', division:'Tier 1', colors:'Red, Black', bio:'The Cherries. A Premier League club from the south coast of England known for attractive attacking football.', location:'Bournemouth, England', website:'https://afcb.co.uk', socialInstagram:'afcbournemouth', socialX:'afcbournemouth', coverGradient:'from-red-600 to-black' },
  { name:'Brighton & Hove Albion', handle:'@brighton', nickname:'The Seagulls', city:'Brighton', country:'England', stadium:'Amex Stadium', capacity:31876, foundedYear:'1901', league:'Premier League', division:'Tier 1', colors:'Blue, White', bio:'The Seagulls. Known for progressive football and world-class talent development.', location:'Brighton, England', website:'https://brightonandhovealbion.com', socialInstagram:'brightonofficial', socialX:'BHAFCofficial', coverGradient:'from-blue-600 to-blue-900' },
  { name:'Chelsea', handle:'@chelseafc', nickname:'The Blues', city:'London', country:'England', stadium:'Stamford Bridge', capacity:40341, foundedYear:'1905', league:'Premier League', division:'Tier 1', colors:'Royal Blue, White', bio:'The Blues. Six-time English champions and multiple UEFA Champions League winners. One of the biggest clubs in world football.', location:'London, England', website:'https://chelseafc.com', socialInstagram:'chelseafc', socialX:'ChelseaFC', coverGradient:'from-blue-700 to-blue-950' },
  { name:'Everton', handle:'@everton', nickname:'The Toffees', city:'Liverpool', country:'England', stadium:'Goodison Park', capacity:39414, foundedYear:'1878', league:'Premier League', division:'Tier 1', colors:'Royal Blue, White', bio:'The Toffees. One of the founding members of the Football League with a rich 140+ year history.', location:'Liverpool, England', website:'https://evertonfc.com', socialInstagram:'everton', socialX:'Everton', coverGradient:'from-blue-600 to-indigo-900' },
  { name:'Fulham', handle:'@fulhamfc', nickname:'The Cottagers', city:'London', country:'England', stadium:'Craven Cottage', capacity:25700, foundedYear:'1879', league:'Premier League', division:'Tier 1', colors:'White, Black', bio:'The Cottagers. Londons oldest professional football club, playing on the banks of the River Thames.', location:'London, England', website:'https://fulhamfc.com', socialInstagram:'fulhamfc', socialX:'FulhamFC', coverGradient:'from-gray-600 to-gray-900' },
  { name:'Hull City', handle:'@hullcity', nickname:'The Tigers', city:'Hull', country:'England', stadium:'MKM Stadium', capacity:25404, foundedYear:'1904', league:'Premier League', division:'Tier 1', colors:'Orange, Black', bio:'The Tigers. A club from East Yorkshire competing in the Premier League.', location:'Hull, England', coverGradient:'from-orange-600 to-orange-900' },
  { name:'Ipswich Town', handle:'@ipswichtown', nickname:'The Tractor Boys', city:'Ipswich', country:'England', stadium:'Portman Road', capacity:30311, foundedYear:'1878', league:'Premier League', division:'Tier 1', colors:'Blue, White', bio:'The Tractor Boys. Former English champions and UEFA Cup winners with a proud footballing tradition.', location:'Ipswich, England', website:'https://itfc.co.uk', socialInstagram:'ipswichtown', socialX:'IpswichTown', coverGradient:'from-blue-700 to-blue-950' },
  { name:'Leeds United', handle:'@leedsunited', nickname:'The Whites', city:'Leeds', country:'England', stadium:'Elland Road', capacity:37645, foundedYear:'1919', league:'Premier League', division:'Tier 1', colors:'White', bio:'The Whites. Three-time English champions with one of the most passionate fanbases in world football.', location:'Leeds, England', website:'https://leedsunited.com', socialInstagram:'leedsunited', socialX:'LUFC', coverGradient:'from-gray-500 to-gray-800' },
  { name:'Liverpool', handle:'@liverpoolfc', nickname:'The Reds', city:'Liverpool', country:'England', stadium:'Anfield', capacity:61276, foundedYear:'1892', league:'Premier League', division:'Tier 1', colors:'Red', bio:'The Reds. 19-time English champions and 6-time European Cup winners. One of the most supported clubs in the world.', location:'Liverpool, England', website:'https://liverpoolfc.com', socialInstagram:'liverpoolfc', socialX:'LFC', coverGradient:'from-red-700 to-red-950' },
  { name:'Manchester City', handle:'@mancity', nickname:'The Citizens', city:'Manchester', country:'England', stadium:'Etihad Stadium', capacity:53400, foundedYear:'1880', league:'Premier League', division:'Tier 1', colors:'Sky Blue, White', bio:'The Citizens. Multiple Premier League champions and one of the dominant forces in modern English and European football.', location:'Manchester, England', website:'https://manchestercity.com', socialInstagram:'mancity', socialX:'ManCity', coverGradient:'from-cyan-500 to-blue-700' },
  { name:'Manchester United', handle:'@manutd', nickname:'The Red Devils', city:'Manchester', country:'England', stadium:'Old Trafford', capacity:74310, foundedYear:'1878', league:'Premier League', division:'Tier 1', colors:'Red, White, Black', bio:'The Red Devils. Record 20-time English champions and 3-time European Cup winners. The biggest club in English football.', location:'Manchester, England', website:'https://manutd.com', socialInstagram:'manutd', socialX:'ManUtd', coverGradient:'from-red-700 to-red-950' },
  { name:'Newcastle United', handle:'@nufc', nickname:'The Magpies', city:'Newcastle upon Tyne', country:'England', stadium:'St James\' Park', capacity:52305, foundedYear:'1892', league:'Premier League', division:'Tier 1', colors:'Black, White', bio:'The Magpies. Four-time English champions with a fiercely passionate fanbase in the North East of England.', location:'Newcastle upon Tyne, England', website:'https://nufc.co.uk', socialInstagram:'nufc', socialX:'NUFC', coverGradient:'from-gray-800 to-black' },
  { name:'Nottingham Forest', handle:'@nottmforest', nickname:'The Tricky Trees', city:'Nottingham', country:'England', stadium:'City Ground', capacity:30602, foundedYear:'1865', league:'Premier League', division:'Tier 1', colors:'Red, White', bio:'The Tricky Trees. Two-time European Cup winners and one of the oldest football clubs in the world.', location:'Nottingham, England', website:'https://nottinghamforest.co.uk', socialInstagram:'nffc', socialX:'NFFC', coverGradient:'from-red-800 to-red-950' },
  { name:'Southampton', handle:'@southamptonfc', nickname:'The Saints', city:'Southampton', country:'England', stadium:'St Mary\'s Stadium', capacity:32384, foundedYear:'1885', league:'Premier League', division:'Tier 1', colors:'Red, White, Black', bio:'The Saints. A club with a rich history of developing world-class talent from their famed academy.', location:'Southampton, England', website:'https://southamptonfc.com', socialInstagram:'southamptonfc', socialX:'SouthamptonFC', coverGradient:'from-red-600 to-white/10' },
  { name:'Sunderland', handle:'@sunderlandafc', nickname:'The Black Cats', city:'Sunderland', country:'England', stadium:'Stadium of Light', capacity:49000, foundedYear:'1879', league:'Premier League', division:'Tier 1', colors:'Red, White, Black', bio:'The Black Cats. Six-time English champions with a massive and passionate following in the North East.', location:'Sunderland, England', website:'https://sunderlandafc.com', socialInstagram:'sunderlandafc', socialX:'SunderlandAFC', coverGradient:'from-red-700 to-black' },
  { name:'Tottenham Hotspur', handle:'@spurs', nickname:'The Spurs', city:'London', country:'England', stadium:'Tottenham Hotspur Stadium', capacity:62850, foundedYear:'1882', league:'Premier League', division:'Tier 1', colors:'White, Navy', bio:'The Spurs. Multiple league champions and FA Cup winners known for their attacking philosophy and world-class stadium.', location:'London, England', website:'https://tottenhamhotspur.com', socialInstagram:'spursofficial', socialX:'SpursOfficial', coverGradient:'from-indigo-700 to-blue-950' },
  { name:'West Ham United', handle:'@westham', nickname:'The Hammers', city:'London', country:'England', stadium:'London Stadium', capacity:62500, foundedYear:'1895', league:'Premier League', division:'Tier 1', colors:'Claret, Sky Blue', bio:'The Hammers. Known for their Academy of Football that has produced countless England internationals.', location:'London, England', website:'https://westhamunited.com', socialInstagram:'westham', socialX:'whufc_Official', coverGradient:'from-amber-700 to-amber-950' },
  { name:'Wolverhampton Wanderers', handle:'@wolves', nickname:'The Wolves', city:'Wolverhampton', country:'England', stadium:'Molineux Stadium', capacity:31750, foundedYear:'1877', league:'Premier League', division:'Tier 1', colors:'Old Gold, Black', bio:'The Wolves. Founding members of the Football League with a proud history of domestic and European success.', location:'Wolverhampton, England', website:'https://wolves.co.uk', socialInstagram:'wolves', socialX:'Wolves', coverGradient:'from-yellow-700 to-amber-900' },
];

async function seed() {
  console.log('Seeding ' + TEAMS.length + ' Premier League teams...');
  let created = 0;
  let skipped = 0;

  for (const t of TEAMS) {
    // Check if already exists by handle
    const existing = await p.user.findUnique({ where: { handle: t.handle } });
    if (existing) {
      console.log('SKIP (exists): ' + t.name);
      skipped++;
      continue;
    }

    // Generate a fake email (unclaimed account)
    const emailLocal = t.handle.replace('@', '') + '.pl2026';
    const email = emailLocal + '@sportssphere.fun';

    const initials = t.name.split(/\s+|&/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const user = await p.user.create({
      data: {
        name: t.name,
        email: email,
        handle: t.handle,
        passwordHash: null, // No password — team must claim
        emailVerified: false,
        role: 'team',
        roleId: TEAM_ROLE_ID,
        roleTypeId: PRO_CLUB_TYPE_ID,
        isPro: true,
        proSince: new Date(),
        avatarInitials: initials,
        bio: t.bio || null,
        location: t.location || t.city + ', ' + t.country,
        city: t.city,
        countryOfOrigin: t.country,
        currentCountry: t.country,
        coverGradient: t.coverGradient || 'from-emerald-600 to-emerald-900',
        website: t.website || null,
        socialInstagram: t.socialInstagram || null,
        socialX: t.socialX || null,
        isVerified: false,
        verificationStatus: 'none',
        sportsFollowing: JSON.stringify(['football']),
        roleData: JSON.stringify({
          sport: 'football',
          league: 'Premier League',
          claimed: false,
          seeded: true,
        }),
        roleProfile: JSON.stringify({
          sport: 'football',
          league: 'Premier League',
          nickname: t.nickname,
        }),
        teamProfile: {
          create: {
            nickname: t.nickname,
            foundedYear: t.foundedYear,
            country: t.country,
            city: t.city,
            stadium: t.stadium,
            capacity: t.capacity,
            league: 'Premier League',
            division: t.division,
            colors: t.colors,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
            position: null,
            form: null,
          },
        },
        userSports: {
          create: {
            sportId: FOOTBALL_SPORT_ID,
          },
        },
      },
    });

    console.log('CREATED: ' + t.name + ' (' + t.handle + ')');
    created++;
  }

  console.log('\nDone! Created: ' + created + ', Skipped: ' + skipped + ', Total: ' + TEAMS.length);
  await p.$disconnect();
}

seed().catch(e => {
  console.error('SEED ERROR:', e);
  process.exit(1);
});
