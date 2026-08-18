import '../../../core/network/api_client.dart';
import '../../../shared/models/post.dart';
import '../../../shared/models/match.dart';

class FeedApi {
  FeedApi(this._client);
  final ApiClient _client;

  Future<List<Post>> getFeed({String? type, String? userId, int? limit, int? offset}) async {
    final q = <String, String>{
      if (type != null) 'type': type,
      if (userId != null && userId.isNotEmpty) 'userId': userId,
      if (limit != null) 'limit': '$limit',
      if (offset != null) 'offset': '$offset',
    };
    final qs = q.isEmpty
        ? ''
        : '?${q.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    final data = await _client.getJson('/feed$qs');
    final list = data is List
        ? data
        : (data is Map && data['data'] is List)
            ? data['data'] as List
            : <dynamic>[];
    return list
        .whereType<Map>()
        .map((e) => Post.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }
}

class MatchesApi {
  MatchesApi(this._client);
  final ApiClient _client;

  Future<List<MatchItem>> getMatches({String? status, String? date}) async {
    final params = <String, String>{
      if (status != null) 'status': status,
      if (date != null) 'date': date,
    };
    final qs = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    final data = await _client.getJson('/matches$qs');
    final list = data is List
        ? data
        : (data is Map && data['data'] is List)
            ? data['data'] as List
            : <dynamic>[];
    return list
        .whereType<Map>()
        .map((e) => MatchItem.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }
}

class StandingsApi {
  StandingsApi(this._client);
  final ApiClient _client;

  Future<({String league, List<StandingRow> rows})> getStandings() async {
    final data = await _client.getJson('/standings');
    if (data is! Map) {
      return (league: 'League', rows: <StandingRow>[]);
    }
    final map = Map<String, dynamic>.from(data);
    final league = map['league']?.toString() ?? 'League';
    final raw = map['standings'];
    final list = raw is List ? raw : <dynamic>[];
    final rows = list
        .whereType<Map>()
        .map((e) => StandingRow.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    return (league: league, rows: rows);
  }
}

class PollsApi {
  PollsApi(this._client);
  final ApiClient _client;

  Future<List<Map<String, dynamic>>> getPolls() async {
    final data = await _client.getJson('/polls');
    final list = data is List ? data : <dynamic>[];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  /// POST /api/polls/vote — vote on a poll option.
  /// Returns updated poll data with new totals.
  Future<Map<String, dynamic>> vote({required String pollId, required int optionIndex}) async {
    final data = await _client.postJson('/polls/vote', body: {
      'pollId': pollId,
      'optionIndex': optionIndex,
    });
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }
}

class PredictionsApi {
  PredictionsApi(this._client);
  final ApiClient _client;

  Future<List<Map<String, dynamic>>> getPredictions() async {
    final data = await _client.getJson('/predictions');
    final list = data is List ? data : <dynamic>[];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
