class MatchItem {
  const MatchItem({
    required this.id,
    required this.homeTeam,
    required this.awayTeam,
    this.homeScore,
    this.awayScore,
    this.status = 'scheduled',
    this.league,
    this.minute,
    this.homeBadge,
    this.awayBadge,
    this.kickoff,
    this.events = const [],
  });

  final String id;
  final String homeTeam;
  final String awayTeam;
  final int? homeScore;
  final int? awayScore;
  final String status;
  final String? league;
  final int? minute;
  final String? homeBadge;
  final String? awayBadge;
  final String? kickoff;
  final List<MatchEvent> events;

  factory MatchItem.fromJson(Map<String, dynamic> j) {
    final rawEvents = j['events'];
    final events = <MatchEvent>[];
    if (rawEvents is List) {
      for (final e in rawEvents) {
        if (e is Map) events.add(MatchEvent.fromJson(Map<String, dynamic>.from(e)));
      }
    }
    return MatchItem(
      id: j['id']?.toString() ?? '',
      homeTeam: j['homeTeam']?.toString() ?? j['Team_MatchProfile_homeTeamIdToTeam']?['name']?.toString() ?? '',
      awayTeam: j['awayTeam']?.toString() ?? j['Team_MatchProfile_awayTeamIdToTeam']?['name']?.toString() ?? '',
      homeScore: (j['homeScore'] as num?)?.toInt(),
      awayScore: (j['awayScore'] as num?)?.toInt(),
      status: j['status']?.toString() ?? 'scheduled',
      league: j['league']?.toString() ??
          j['competition']?.toString() ??
          j['League']?['name']?.toString(),
      minute: (j['minute'] as num?)?.toInt(),
      homeBadge: j['homeBadge']?.toString() ?? j['Team_MatchProfile_homeTeamIdToTeam']?['logoUrl']?.toString(),
      awayBadge: j['awayBadge']?.toString() ?? j['Team_MatchProfile_awayTeamIdToTeam']?['logoUrl']?.toString(),
      kickoff: j['kickoff']?.toString() ?? j['startTime']?.toString() ?? j['kickoffAt']?.toString(),
      events: events,
    );
  }

  bool get isLive => status == 'live' || status == 'ht' || status == '1h' || status == '2h';
  bool get isFinished => status == 'ft' || status == 'finished';
}

class MatchEvent {
  const MatchEvent({
    this.type,
    this.minute,
    this.player,
    this.team,
    this.detail,
  });

  final String? type;
  final int? minute;
  final String? player;
  final String? team;
  final String? detail;

  factory MatchEvent.fromJson(Map<String, dynamic> j) => MatchEvent(
        type: j['type']?.toString() ?? j['eventType']?.toString(),
        minute: (j['minute'] as num?)?.toInt() ?? (j['time'] as num?)?.toInt(),
        player: j['player']?.toString() ?? j['playerName']?.toString(),
        team: j['team']?.toString() ?? j['teamName']?.toString(),
        detail: j['detail']?.toString() ?? j['description']?.toString(),
      );
}

class StandingRow {
  const StandingRow({
    required this.pos,
    required this.team,
    this.badge,
    this.played = 0,
    this.won = 0,
    this.drawn = 0,
    this.lost = 0,
    this.gf = 0,
    this.ga = 0,
    this.gd = 0,
    this.pts = 0,
  });

  final int pos;
  final String team;
  final String? badge;
  final int played, won, drawn, lost, gf, ga, gd, pts;

  factory StandingRow.fromJson(Map<String, dynamic> j) => StandingRow(
        pos: (j['pos'] as num?)?.toInt() ?? (j['position'] as num?)?.toInt() ?? 0,
        team: j['team']?.toString() ?? j['teamName']?.toString() ?? '',
        badge: j['badge']?.toString() ?? j['logoUrl']?.toString(),
        played: (j['played'] as num?)?.toInt() ?? (j['p'] as num?)?.toInt() ?? 0,
        won: (j['won'] as num?)?.toInt() ?? (j['w'] as num?)?.toInt() ?? 0,
        drawn: (j['drawn'] as num?)?.toInt() ?? (j['d'] as num?)?.toInt() ?? 0,
        lost: (j['lost'] as num?)?.toInt() ?? (j['l'] as num?)?.toInt() ?? 0,
        gf: (j['gf'] as num?)?.toInt() ?? (j['goalsFor'] as num?)?.toInt() ?? 0,
        ga: (j['ga'] as num?)?.toInt() ?? (j['goalsAgainst'] as num?)?.toInt() ?? 0,
        gd: (j['gd'] as num?)?.toInt() ?? 0,
        pts: (j['pts'] as num?)?.toInt() ?? (j['points'] as num?)?.toInt() ?? 0,
      );
}
