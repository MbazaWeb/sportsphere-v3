import '../../../core/network/api_client.dart';

class PerformanceSnapshot {
  PerformanceSnapshot({
    required this.totalPoints,
    required this.performanceScore,
    required this.tier,
    this.formScore,
    this.consistencyScore,
    this.improvementScore,
    this.rankGlobal,
    this.rankCountry,
    this.rankCategory,
    this.rankPosition,
    this.rankMovement,
    this.categoryBucket,
    this.position,
    this.playerType,
  });

  final int totalPoints;
  final num performanceScore;
  final String tier;
  final num? formScore;
  final num? consistencyScore;
  final num? improvementScore;
  final int? rankGlobal;
  final int? rankCountry;
  final int? rankCategory;
  final int? rankPosition;
  final int? rankMovement;
  final String? categoryBucket;
  final String? position;
  final String? playerType;

  factory PerformanceSnapshot.fromJson(Map<String, dynamic> j) => PerformanceSnapshot(
        totalPoints: (j['totalPoints'] as num?)?.toInt() ?? 0,
        performanceScore: (j['performanceScore'] as num?) ?? 0,
        tier: j['tier']?.toString() ?? 'Unranked',
        formScore: j['formScore'] as num?,
        consistencyScore: j['consistencyScore'] as num?,
        improvementScore: j['improvementScore'] as num?,
        rankGlobal: (j['rankGlobal'] as num?)?.toInt(),
        rankCountry: (j['rankCountry'] as num?)?.toInt(),
        rankCategory: (j['rankCategory'] as num?)?.toInt(),
        rankPosition: (j['rankPosition'] as num?)?.toInt(),
        rankMovement: (j['rankMovement'] as num?)?.toInt(),
        categoryBucket: j['categoryBucket']?.toString(),
        position: j['position']?.toString(),
        playerType: j['playerType']?.toString(),
      );
}

class PerformancePayload {
  PerformancePayload({this.profile, this.user, this.events = const [], this.percentile});
  final PerformanceSnapshot? profile;
  final Map<String, dynamic>? user;
  final List<Map<String, dynamic>> events;
  final num? percentile;
}

class PerformanceApi {
  PerformanceApi(this._client);
  final ApiClient _client;

  Future<PerformancePayload> getForUser(String userId) async {
    final data = await _client.getJson('/performance/$userId');
    if (data is! Map) return PerformancePayload();
    final map = Map<String, dynamic>.from(data);
    final rawProfile = map['profile'];
    return PerformancePayload(
      profile: rawProfile is Map
          ? PerformanceSnapshot.fromJson(Map<String, dynamic>.from(rawProfile))
          : null,
      user: map['user'] is Map ? Map<String, dynamic>.from(map['user'] as Map) : null,
      events: (map['events'] is List)
          ? (map['events'] as List)
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList()
          : const [],
      percentile: map['percentile'] as num?,
    );
  }
}
