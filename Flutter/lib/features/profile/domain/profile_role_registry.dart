/// Mirrors web profileConfig.ts + profile-engine registry — tabs per role.
class ProfileTabDef {
  const ProfileTabDef(this.id, this.label);
  final String id;
  final String label;
}

class RoleProfileConfig {
  const RoleProfileConfig({
    required this.role,
    required this.label,
    required this.emoji,
    required this.tabs,
    this.statLabels = const ['Posts', 'Followers', 'Following'],
  });
  final String role;
  final String label;
  final String emoji;
  final List<ProfileTabDef> tabs;
  final List<String> statLabels;
}

class ProfileRoleRegistry {
  ProfileRoleRegistry._();

  static final Map<String, RoleProfileConfig> roles = {
    'team': RoleProfileConfig(
      role: 'team',
      label: 'Team',
      emoji: '👥',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('squad', 'Squad'), ProfileTabDef('fixtures', 'Fixtures'), ProfileTabDef('results', 'Results'), ProfileTabDef('standings', 'Standings'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('transfers', 'Transfers'), ProfileTabDef('media', 'Media'), ProfileTabDef('fans', 'Fans'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('tickets', 'Tickets'), ProfileTabDef('about', 'About')],
      statLabels: ['Squad', 'Points', 'Fans', 'Rank'],
    ),
    'competition': RoleProfileConfig(
      role: 'competition',
      label: 'Competition',
      emoji: '🏆',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('fixtures', 'Fixtures'), ProfileTabDef('results', 'Results'), ProfileTabDef('standings', 'Standings'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('teams', 'Teams'), ProfileTabDef('players', 'Players'), ProfileTabDef('awards', 'Awards'), ProfileTabDef('media', 'Media'), ProfileTabDef('fans', 'Fans'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('tickets', 'Tickets'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'match': RoleProfileConfig(
      role: 'match',
      label: 'Match',
      emoji: '⚽',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('timeline', 'Timeline'), ProfileTabDef('commentary', 'Commentary'), ProfileTabDef('lineups', 'Lineups'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('highlights', 'Highlights'), ProfileTabDef('polls', 'Polls'), ProfileTabDef('predictions', 'Predictions'), ProfileTabDef('fan-chat', 'Fan Chat'), ProfileTabDef('media', 'Media'), ProfileTabDef('tickets', 'Tickets'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'player': RoleProfileConfig(
      role: 'player',
      label: 'Player',
      emoji: '👤',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('career', 'Career'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('matches', 'Matches'), ProfileTabDef('achievements', 'Achievements'), ProfileTabDef('media', 'Media'), ProfileTabDef('fans', 'Fans'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('about', 'About')],
      statLabels: ['Apps', 'Goals', 'Assists', 'Fans'],
    ),
    'coach': RoleProfileConfig(
      role: 'coach',
      label: 'Coach',
      emoji: '👨‍🏫',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('career', 'Career'), ProfileTabDef('teams', 'Teams'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('tactics', 'Tactics'), ProfileTabDef('media', 'Media'), ProfileTabDef('fans', 'Fans'), ProfileTabDef('about', 'About')],
      statLabels: ['Wins', 'Matches', 'Trophies', 'Fans'],
    ),
    'stadium': RoleProfileConfig(
      role: 'stadium',
      label: 'Stadium',
      emoji: '🏟',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('events', 'Events'), ProfileTabDef('matches', 'Matches'), ProfileTabDef('gallery', 'Gallery'), ProfileTabDef('map', 'Map'), ProfileTabDef('facilities', 'Facilities'), ProfileTabDef('reviews', 'Reviews'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('tickets', 'Tickets'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'venue': RoleProfileConfig(
      role: 'venue',
      label: 'Venue',
      emoji: '📍',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('events', 'Events'), ProfileTabDef('gallery', 'Gallery'), ProfileTabDef('map', 'Map'), ProfileTabDef('reviews', 'Reviews'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('tickets', 'Tickets'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'academy': RoleProfileConfig(
      role: 'academy',
      label: 'Academy',
      emoji: '🧒',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('players', 'Players'), ProfileTabDef('coaches', 'Coaches'), ProfileTabDef('fixtures', 'Fixtures'), ProfileTabDef('results', 'Results'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('programs', 'Programs'), ProfileTabDef('gallery', 'Gallery'), ProfileTabDef('media', 'Media'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('registration', 'Registration'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'community': RoleProfileConfig(
      role: 'community',
      label: 'Community',
      emoji: '👥',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('members', 'Members'), ProfileTabDef('events', 'Events'), ProfileTabDef('polls', 'Polls'), ProfileTabDef('media', 'Media'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'organization': RoleProfileConfig(
      role: 'organization',
      label: 'Organization',
      emoji: '🏢',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('competitions', 'Competitions'), ProfileTabDef('rankings', 'Rankings'), ProfileTabDef('officials', 'Officials'), ProfileTabDef('news', 'News'), ProfileTabDef('documents', 'Documents'), ProfileTabDef('events', 'Events'), ProfileTabDef('media', 'Media'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('tickets', 'Tickets'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'business': RoleProfileConfig(
      role: 'business',
      label: 'Business',
      emoji: '💼',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('products', 'Products'), ProfileTabDef('services', 'Services'), ProfileTabDef('offers', 'Offers'), ProfileTabDef('reviews', 'Reviews'), ProfileTabDef('events', 'Events'), ProfileTabDef('media', 'Media'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'journalist': RoleProfileConfig(
      role: 'journalist',
      label: 'Journalist',
      emoji: '📰',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('articles', 'Articles'), ProfileTabDef('news', 'News'), ProfileTabDef('videos', 'Videos'), ProfileTabDef('podcasts', 'Podcasts'), ProfileTabDef('media', 'Media'), ProfileTabDef('followers', 'Fans'), ProfileTabDef('about', 'About')],
      statLabels: ['Articles', 'Views', 'Followers', 'Fans'],
    ),
    'analyst': RoleProfileConfig(
      role: 'analyst',
      label: 'Analyst',
      emoji: '📊',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('analysis', 'Analysis'), ProfileTabDef('predictions', 'Predictions'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('tactical-boards', 'Tactical Boards'), ProfileTabDef('videos', 'Videos'), ProfileTabDef('media', 'Media'), ProfileTabDef('followers', 'Fans'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Followers', 'Following'],
    ),
    'creator': RoleProfileConfig(
      role: 'creator',
      label: 'Creator',
      emoji: '🎥',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('videos', 'Videos'), ProfileTabDef('spotlight', 'Spotlight'), ProfileTabDef('live', 'Live'), ProfileTabDef('media', 'Media'), ProfileTabDef('followers', 'Fans'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Views', 'Spotlight', 'Fans'],
    ),
    'scout': RoleProfileConfig(
      role: 'scout',
      label: 'Scout',
      emoji: '🔍',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('reports', 'Reports'), ProfileTabDef('watchlist', 'Watchlist'), ProfileTabDef('players', 'Players'), ProfileTabDef('recommendations', 'Recommendations'), ProfileTabDef('media', 'Media'), ProfileTabDef('about', 'About')],
      statLabels: ['Reports', 'Watchlist', 'Recs', 'Fans'],
    ),
    'referee': RoleProfileConfig(
      role: 'referee',
      label: 'Referee',
      emoji: '⚖️',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('matches', 'Matches'), ProfileTabDef('statistics', 'Statistics'), ProfileTabDef('performance', 'Performance'), ProfileTabDef('history', 'History'), ProfileTabDef('media', 'Media'), ProfileTabDef('about', 'About')],
      statLabels: ['Matches', 'Yellow', 'Red', 'Rating'],
    ),
    'fan': RoleProfileConfig(
      role: 'fan',
      label: 'Fan',
      emoji: '👤',
      tabs: [ProfileTabDef('overview', 'Overview'), ProfileTabDef('feed', 'Feed'), ProfileTabDef('posts', 'Posts'), ProfileTabDef('media', 'Media'), ProfileTabDef('spotlight', 'Spotlight'), ProfileTabDef('predictions', 'Predictions'), ProfileTabDef('achievements', 'Achievements'), ProfileTabDef('communities', 'Communities'), ProfileTabDef('shop', 'Shop'), ProfileTabDef('about', 'About')],
      statLabels: ['Posts', 'Fans', 'Following'],
    ),
  };

  static RoleProfileConfig forRole(String? role) {
    final key = (role ?? 'fan').toLowerCase().trim();
    return roles[key] ?? roles['fan']!;
  }
}