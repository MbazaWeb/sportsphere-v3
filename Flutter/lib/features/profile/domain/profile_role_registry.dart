// SportSphere Flutter — Profile Role Registry
// Mirrors web src/components/profiles/profileConfig.ts exactly.
//
// Fan tab structure (per web):
//   overview | spotlights (feed+posts+media+spotlight+predictions) | community (achievements+communities) | about (overview+about merged)
//
// Mapping applied per user request:
//   Feed + Post + Media + Spotlight + Prediction  →  Spotlights
//   Overview + Achievement + About                →  Overview
//   Shop + Community                              →  Community

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
    required this.statLabels,
  });

  final String role;
  final String label;
  final String emoji;
  final List<ProfileTabDef> tabs;
  final List<String> statLabels;
}

class ProfileRoleRegistry {
  ProfileRoleRegistry._();

  // ─── FAN ────────────────────────────────────────────────────────────────────
  // Web tabs: overview, feed, posts, media, spotlight, predictions,
  //           achievements, communities, shop, about
  //
  // Flutter merge per product brief:
  //   • Spotlights  = feed + posts + media + spotlight + predictions
  //   • Overview    = overview + achievements + about
  //   • Community   = communities + shop
  static const _fan = RoleProfileConfig(
    role: 'fan',
    label: 'Fan',
    emoji: '👤',
    tabs: [
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
      ProfileTabDef('overview',   'Overview'),
    ],
    statLabels: ['Posts', 'Fans', 'Following', 'Predictions'],
  );

  // ─── PLAYER ─────────────────────────────────────────────────────────────────
  // Web: overview, feed, career, statistics, matches, achievements, media, fans, shop, about
  static const _player = RoleProfileConfig(
    role: 'player',
    label: 'Player',
    emoji: '⚽',
    tabs: [
      ProfileTabDef('overview',    'Overview'),
      ProfileTabDef('spotlights',  'Spotlights'),
      ProfileTabDef('career',      'Career'),
      ProfileTabDef('statistics',  'Statistics'),
      ProfileTabDef('achievements','Achievements'),
      ProfileTabDef('community',   'Community'),
    ],
    statLabels: ['Matches', 'Goals', 'Assists', 'Fans'],
  );

  // ─── COACH ──────────────────────────────────────────────────────────────────
  static const _coach = RoleProfileConfig(
    role: 'coach',
    label: 'Coach',
    emoji: '👨‍🏫',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('career',     'Career'),
      ProfileTabDef('statistics', 'Statistics'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Trophies', 'Win Rate', 'Teams', 'Fans'],
  );

  // ─── TEAM ───────────────────────────────────────────────────────────────────
  static const _team = RoleProfileConfig(
    role: 'team',
    label: 'Team',
    emoji: '👥',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('squad',      'Squad'),
      ProfileTabDef('fixtures',   'Fixtures'),
      ProfileTabDef('standings',  'Standings'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Trophies', 'Fans', 'Founded', 'League'],
  );

  // ─── JOURNALIST ─────────────────────────────────────────────────────────────
  static const _journalist = RoleProfileConfig(
    role: 'journalist',
    label: 'Journalist',
    emoji: '📰',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Articles', 'Fans', 'Breaking', 'Accuracy'],
  );

  // ─── CREATOR ────────────────────────────────────────────────────────────────
  static const _creator = RoleProfileConfig(
    role: 'creator',
    label: 'Creator',
    emoji: '🎥',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Videos', 'Subscribers', 'Views', 'Spotlight'],
  );

  // ─── ANALYST ────────────────────────────────────────────────────────────────
  static const _analyst = RoleProfileConfig(
    role: 'analyst',
    label: 'Analyst',
    emoji: '📊',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('statistics', 'Statistics'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Reports', 'Fans', 'Data Points', 'Leagues'],
  );

  // ─── SCOUT ──────────────────────────────────────────────────────────────────
  static const _scout = RoleProfileConfig(
    role: 'scout',
    label: 'Scout',
    emoji: '🔍',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Reports', 'Watchlist', 'Recommendations', 'Fans'],
  );

  // ─── REFEREE ────────────────────────────────────────────────────────────────
  static const _referee = RoleProfileConfig(
    role: 'referee',
    label: 'Referee',
    emoji: '⚖️',
    tabs: [
      ProfileTabDef('overview',    'Overview'),
      ProfileTabDef('spotlights',  'Spotlights'),
      ProfileTabDef('statistics',  'Statistics'),
      ProfileTabDef('performance', 'Performance'),
    ],
    statLabels: ['Matches', 'Yellow', 'Red', 'Rating'],
  );

  // ─── COMMUNITY ──────────────────────────────────────────────────────────────
  static const _community = RoleProfileConfig(
    role: 'community',
    label: 'Community',
    emoji: '👥',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Members', 'Posts/Day', 'Online', 'Created'],
  );

  // ─── ORGANIZATION ───────────────────────────────────────────────────────────
  static const _organization = RoleProfileConfig(
    role: 'organization',
    label: 'Organization',
    emoji: '🏢',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Members', 'Tournaments', 'Fans', 'Founded'],
  );

  // ─── BUSINESS ───────────────────────────────────────────────────────────────
  static const _business = RoleProfileConfig(
    role: 'business',
    label: 'Business',
    emoji: '💼',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Products', 'Fans', 'Rating', 'Teams'],
  );

  // ─── COMPETITION ────────────────────────────────────────────────────────────
  static const _competition = RoleProfileConfig(
    role: 'competition',
    label: 'Competition',
    emoji: '🏆',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('fixtures',   'Fixtures'),
      ProfileTabDef('standings',  'Standings'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Season', 'Teams', 'Fans', 'Matchday'],
  );

  // ─── ACADEMY ────────────────────────────────────────────────────────────────
  static const _academy = RoleProfileConfig(
    role: 'academy',
    label: 'Academy',
    emoji: '🧒',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('squad',      'Players'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Players', 'Graduates', 'Teams', 'Founded'],
  );

  // ─── VENUE / STADIUM ────────────────────────────────────────────────────────
  static const _venue = RoleProfileConfig(
    role: 'venue',
    label: 'Venue',
    emoji: '📍',
    tabs: [
      ProfileTabDef('overview',   'Overview'),
      ProfileTabDef('spotlights', 'Spotlights'),
      ProfileTabDef('community',  'Community'),
    ],
    statLabels: ['Capacity', 'Events/Yr', 'Rating', 'Fans'],
  );

  // ─── Registry map ───────────────────────────────────────────────────────────
  static const Map<String, RoleProfileConfig> _registry = {
    'fan':                _fan,
    'player':             _player,
    'coach':              _coach,
    'team':               _team,
    'journalist':         _journalist,
    'creator':            _creator,
    'analyst':            _analyst,
    'scout':              _scout,
    'referee':            _referee,
    'community':          _community,
    'organization':       _organization,
    'business':           _business,
    'competition':        _competition,
    'academy':            _academy,
    'venue':              _venue,
    'stadium':            _venue,
    'commercial-partner': _business,
    'commentator':        _journalist,
    'agent':              _scout,
    'league':             _competition,
  };

  static RoleProfileConfig forRole(String role) =>
      _registry[role.toLowerCase()] ?? _fan;
}
