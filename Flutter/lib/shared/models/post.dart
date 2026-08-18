import 'dart:convert';

class PostUser {
  const PostUser({
    required this.id,
    required this.name,
    required this.handle,
    this.avatarUrl,
    this.isVerified = false,
    this.isPro = false,
    this.role = 'fan',
  });

  final String id;
  final String name;
  final String handle;
  final String? avatarUrl;
  final bool isVerified;
  final bool isPro;
  final String role;

  factory PostUser.fromJson(Map<String, dynamic> j) => PostUser(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        handle: j['handle']?.toString() ?? '',
        avatarUrl: j['avatarUrl']?.toString() ?? j['avatar']?.toString(),
        isVerified: j['isVerified'] == true,
        isPro: j['isPro'] == true,
        role: j['role']?.toString() ?? 'fan',
      );
}

class PollData {
  const PollData({
    required this.id,
    required this.question,
    required this.options,
    this.totalVotes = 0,
    this.optionCounts,
    this.userVotedOption,
    this.endsAt,
    this.optionImages,
  });

  final String id;
  final String question;
  final List<String> options;
  final int totalVotes;
  final List<int>? optionCounts;
  final int? userVotedOption;
  final String? endsAt;
  final List<String>? optionImages;

  factory PollData.fromJson(Map<String, dynamic> j) => PollData(
        id: j['id']?.toString() ?? '',
        question: j['question']?.toString() ?? '',
        options: (j['options'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        totalVotes: (j['totalVotes'] as num?)?.toInt() ?? 0,
        optionCounts: (j['optionCounts'] as List?)?.map((e) => (e as num).toInt()).toList(),
        userVotedOption: (j['userVotedOption'] as num?)?.toInt(),
        endsAt: j['endsAt']?.toString(),
        optionImages: (j['optionImages'] as List?)?.map((e) => e.toString()).toList(),
      );
}

class PredictionData {
  const PredictionData({
    required this.id,
    required this.homeTeam,
    required this.awayTeam,
    this.predictedHome,
    this.predictedAway,
    this.confidence,
    this.result,
    this.isCorrect,
    this.homeBadge,
    this.awayBadge,
  });

  final String id;
  final String homeTeam;
  final String awayTeam;
  final int? predictedHome;
  final int? predictedAway;
  final String? confidence;
  final String? result;
  final bool? isCorrect;
  final String? homeBadge;
  final String? awayBadge;

  factory PredictionData.fromJson(Map<String, dynamic> j) => PredictionData(
        id: j['id']?.toString() ?? '',
        homeTeam: j['homeTeam']?.toString() ?? '',
        awayTeam: j['awayTeam']?.toString() ?? '',
        predictedHome: (j['predictedHome'] as num?)?.toInt(),
        predictedAway: (j['predictedAway'] as num?)?.toInt(),
        confidence: j['confidence']?.toString(),
        result: j['result']?.toString(),
        isCorrect: j['isCorrect'] as bool?,
        homeBadge: j['homeBadge']?.toString() ?? j['homeLogo']?.toString(),
        awayBadge: j['awayBadge']?.toString() ?? j['awayLogo']?.toString(),
      );
}

/// Mirrors ApiPost from FeedCard / feed API.
class Post {
  const Post({
    required this.id,
    required this.userId,
    required this.content,
    required this.postType,
    required this.user,
    this.mediaUrls = const [],
    this.teamTag,
    this.playerTag,
    this.isBreaking = false,
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    this.viewCount = 0,
    this.createdAt = '',
    this.poll,
    this.prediction,
    this.likedByMe = false,
    this.repostData,
  });

  final String id;
  final String userId;
  final String content;
  final String postType;
  final List<String> mediaUrls;
  final String? teamTag;
  final String? playerTag;
  final bool isBreaking;
  final int likeCount;
  final int commentCount;
  final int shareCount;
  final int viewCount;
  final String createdAt;
  final PollData? poll;
  final PredictionData? prediction;
  final PostUser user;
  final bool likedByMe;
  final Map<String, dynamic>? repostData;

  factory Post.fromJson(Map<String, dynamic> j) {
    final userJson = j['user'] as Map<String, dynamic>? ?? {};
    final type = j['postType']?.toString() ?? 'post';
    Map<String, dynamic>? rData;
    if (type == 'repost') {
      try {
        final contentStr = j['content']?.toString() ?? '';
        rData = jsonDecode(contentStr);
      } catch (_) {}
    }

    return Post(
      id: j['id']?.toString() ?? '',
      userId: j['userId']?.toString() ?? '',
      content: j['content']?.toString() ?? '',
      postType: type,
      mediaUrls: (j['mediaUrls'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      teamTag: j['teamTag']?.toString(),
      playerTag: j['playerTag']?.toString(),
      isBreaking: j['isBreaking'] == true,
      likeCount: (j['likeCount'] as num?)?.toInt() ?? 0,
      commentCount: (j['commentCount'] as num?)?.toInt() ?? 0,
      shareCount: (j['shareCount'] as num?)?.toInt() ?? 0,
      viewCount: (j['viewCount'] as num?)?.toInt() ?? 0,
      createdAt: j['createdAt']?.toString() ?? '',
      poll: j['poll'] is Map ? PollData.fromJson(Map<String, dynamic>.from(j['poll'] as Map)) : null,
      prediction: j['prediction'] is Map
          ? PredictionData.fromJson(Map<String, dynamic>.from(j['prediction'] as Map))
          : null,
      user: PostUser.fromJson(userJson),
      likedByMe: j['likedByMe'] == true,
      repostData: rData,
    );
  }
}
