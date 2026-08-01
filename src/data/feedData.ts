// SportSphere — Feed Data
// Static UI data used in feed components.
// Real data comes from /api/v1/* endpoints (wired in a future sprint).

export interface FeedUser {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  coverGradient: string;
  bio: string;
  role: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
}

export const FEED_USERS: Record<string, FeedUser> = {
  '@manchesterunited': { name:'Manchester United', handle:'@manchesterunited', avatar:'MU', verified:true, coverGradient:'from-red-800 to-red-900', bio:'Official Manchester United FC. 20x Premier League champions.', role:'Team', location:'Manchester, UK', joined:'Jan 2024', followers:8900000, following:12, posts:1240, isFollowing:false },
  '@sportsphere':      { name:'SportSphere',        handle:'@sportsphere',      avatar:'SS', verified:true, coverGradient:'from-emerald-700 to-emerald-900', bio:'The official SportSphere account. Breaking sports news worldwide.', role:'Official', location:'London, UK', joined:'Dec 2023', followers:4580000, following:120, posts:2340, isFollowing:false },
  '@sarahchen':        { name:'Sarah Chen',          handle:'@sarahchen',        avatar:'SC', verified:true, coverGradient:'from-pink-700 to-purple-900', bio:'Arsenal season ticket holder. Football photographer.', role:'Creator', location:'London, UK', joined:'Mar 2024', followers:34500, following:412, posts:189, isFollowing:false },
  '@footballdaily':    { name:'Football Daily',      handle:'@footballdaily',    avatar:'FD', verified:true, coverGradient:'from-teal-700 to-teal-900', bio:'Daily football news, transfers, and analysis.', role:'Journalist', location:'Manchester, UK', joined:'Feb 2024', followers:1200000, following:89, posts:3450, isFollowing:false },
  '@marcusj':          { name:'Marcus Johnson',      handle:'@marcusj',          avatar:'MJ', verified:false, coverGradient:'from-blue-700 to-blue-900', bio:'Premier League obsessed. Stats nerd.', role:'Fan', location:'Lagos, Nigeria', joined:'Apr 2024', followers:8900, following:567, posts:234, isFollowing:true },
  '@goalsdaily':       { name:'Goal Highlights HD',  handle:'@goalsdaily',       avatar:'GH', verified:true, coverGradient:'from-yellow-600 to-orange-900', bio:'Every goal, every game. 4K quality.', role:'Creator', location:'Dubai, UAE', joined:'Jan 2024', followers:2100000, following:45, posts:3800, isFollowing:false },
  '@skillzhd':         { name:'Skillz HD',           handle:'@skillzhd',         avatar:'SH', verified:true, coverGradient:'from-purple-700 to-purple-900', bio:'Skills, dribbles, free kicks — 4K.', role:'Creator', location:'Madrid, Spain', joined:'Feb 2024', followers:890000, following:23, posts:1200, isFollowing:false },
  '@gkunion':          { name:'GK Union',            handle:'@gkunion',          avatar:'GU', verified:true, coverGradient:'from-lime-700 to-emerald-900', bio:'Goalkeeper community — saves, tips, drills.', role:'Community', location:'Global', joined:'Mar 2024', followers:67800, following:234, posts:890, isFollowing:false },
  '@techniqueking':    { name:'Technique King',      handle:'@techniqueking',    avatar:'TK', verified:true, coverGradient:'from-sky-700 to-blue-900', bio:'Football technique breakdowns and tutorials.', role:'Analyst', location:'Paris, France', joined:'Jun 2024', followers:234000, following:89, posts:567, isFollowing:false },
  '@laligahd':         { name:'LaLiga HD',           handle:'@laligahd',         avatar:'LH', verified:true, coverGradient:'from-orange-700 to-red-900', bio:'Official LaLiga highlights and match coverage.', role:'Creator', location:'Barcelona, Spain', joined:'Jan 2024', followers:3400000, following:34, posts:2100, isFollowing:false },
  '@davidmbaza':       { name:'David Mbaza',         handle:'@davidmbaza',       avatar:'DM', verified:false, coverGradient:'from-red-700 to-red-900', bio:'Football is life. Man Utd till I die.', role:'Fan', location:'Dar es Salaam, Tanzania', joined:'Jan 2024', followers:1200, following:345, posts:52, isFollowing:true },
  '@goonercam':        { name:'Gooner Cam',          handle:'@goonercam',        avatar:'GC', verified:false, coverGradient:'from-red-700 to-rose-900', bio:'Arsenal match reactions and fan POV.', role:'Creator', location:'London, UK', joined:'May 2024', followers:145000, following:67, posts:456, isFollowing:false },
};

export function getFeedUser(handle: string): FeedUser | null {
  return FEED_USERS[handle] ?? null;
}

export const HOME_FEED = [
  { id: 1,  handle: '@manchesterunited', type: 'post',  time: '2m ago',  likes: 4521,  comments: 678,  shares: 234,  content: 'What a performance from the lads tonight. Rashford with the brace — absolute class. Old Trafford was rocking.', tag: { type: 'team', label: 'Manchester United', handle: '@manchesterunited' } },
  { id: 2,  handle: '@sportsphere',      type: 'post',  time: '15m ago', likes: 12430, comments: 1890, shares: 3456, content: 'BREAKING: Leny Yoro completes move to Manchester United for £58.9M. The 18-year-old signs a 5-year deal.', breaking: true },
  { id: 3,  handle: '@sarahchen',        type: 'photo', time: '32m ago', likes: 3456,  comments: 234,  shares: 89,   content: 'Match day at the Emirates. The atmosphere was electric tonight.' },
  { id: 4,  handle: '@footballdaily',    type: 'poll',  time: '1h ago',  likes: 890,   comments: 234,  shares: 56,   content: 'Who wins the Premier League this season?',
    poll: [{ label: 'Manchester City', pct: 42 }, { label: 'Arsenal', pct: 31 }, { label: 'Liverpool', pct: 18 }, { label: 'Chelsea', pct: 9 }], pollTotal: 12400 },
  { id: 5,  handle: '@marcusj',          type: 'post',  time: '2h ago',  likes: 890,   comments: 123,  shares: 67,   content: 'Haaland breaking records again. 30 goals before January is insane. The guy is on another level entirely.', tag: { type: 'player', label: 'Erling Haaland', handle: '@goalsdaily' } },
  { id: 6,  handle: '@goalsdaily',       type: 'video', time: '3h ago',  likes: 8934,  comments: 456,  shares: 1234, content: 'Every Rashford goal this season. Vol.1 — 12 goals, one video.' },
];

export const SPOTLIGHT_FEED = [
  { id: 1, handle: '@goalsdaily',    title: 'Rashford Goal vs Wolves',   views: '1.2M', duration: '0:45', gradient: 'from-green-700 to-emerald-900' },
  { id: 2, handle: '@skillzhd',      title: 'Mbappe Skills Compilation', views: '890K', duration: '1:20', gradient: 'from-blue-700 to-indigo-900' },
  { id: 3, handle: '@sarahchen',     title: 'Fan Reaction — Arsenal Win', views: '650K', duration: '0:30', gradient: 'from-red-700 to-rose-900' },
  { id: 4, handle: '@gkunion',       title: 'Best Saves This Week',      views: '430K', duration: '0:55', gradient: 'from-yellow-600 to-amber-900' },
  { id: 5, handle: '@techniqueking', title: 'Dribble Masterclass',       views: '320K', duration: '1:10', gradient: 'from-purple-700 to-violet-900' },
  { id: 6, handle: '@laligahd',      title: 'El Clasico Highlights',     views: '2.1M', duration: '0:50', gradient: 'from-orange-600 to-red-900' },
];
