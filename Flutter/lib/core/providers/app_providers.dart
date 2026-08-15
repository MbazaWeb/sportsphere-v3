import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import '../storage/token_storage.dart';
import '../../features/auth/data/auth_api.dart';
import '../../features/home/data/feed_api.dart';
import '../../features/social/data/social_api.dart';
import '../../features/communities/data/communities_api.dart';
import '../../features/messages/data/messages_api.dart';
import '../../features/profile/data/profile_api.dart';
import '../../features/profile/data/roles_api.dart';
import '../../features/profile/data/profile_data_api.dart';
import '../../features/media/data/upload_api.dart';
import '../../shared/models/user_profile.dart';
import '../../shared/models/post.dart';
import '../../shared/models/match.dart';

final tokenStorageProvider = Provider((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return ApiClient(
    tokenProvider: storage.readToken,
    onUnauthorized: () async {
      await storage.clear();
      // Avoid circular rebuild issues — auth hydrate next read will be guest
    },
  );
});

final authApiProvider = Provider((ref) => AuthApi(ref.watch(apiClientProvider)));
final feedApiProvider = Provider((ref) => FeedApi(ref.watch(apiClientProvider)));
final matchesApiProvider = Provider((ref) => MatchesApi(ref.watch(apiClientProvider)));
final standingsApiProvider = Provider((ref) => StandingsApi(ref.watch(apiClientProvider)));
final pollsApiProvider = Provider((ref) => PollsApi(ref.watch(apiClientProvider)));
final predictionsApiProvider = Provider((ref) => PredictionsApi(ref.watch(apiClientProvider)));
final socialApiProvider = Provider((ref) => SocialApi(ref.watch(apiClientProvider)));
final communitiesApiProvider = Provider((ref) => CommunitiesApi(ref.watch(apiClientProvider)));
final communitiesProvider = FutureProvider<List<CommunityItem>>((ref) {
  return ref.watch(communitiesApiProvider).list();
});
final messagesApiProvider = Provider((ref) => MessagesApi(ref.watch(apiClientProvider)));
final profileApiProvider = Provider((ref) => ProfileApi(ref.watch(apiClientProvider)));
final rolesApiProvider = Provider((ref) => RolesApi(ref.watch(apiClientProvider)));
final profileDataApiProvider = Provider((ref) => ProfileDataApi(ref.watch(apiClientProvider)));
final uploadApiProvider = Provider((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return UploadApi(tokenProvider: storage.readToken);
});

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.hydrated = false,
    this.error,
  });

  final UserProfile? user;
  final bool isLoading;
  final bool hydrated;
  final String? error;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserProfile? user,
    bool? isLoading,
    bool? hydrated,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      hydrated: hydrated ?? this.hydrated,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._authApi, this._storage) : super(const AuthState()) {
    hydrate();
  }

  final AuthApi _authApi;
  final TokenStorage _storage;

  Future<void> hydrate() async {
    final token = await _storage.readToken();
    if (token == null || token.isEmpty) {
      state = state.copyWith(hydrated: true);
      return;
    }
    try {
      final user = await _authApi.me();
      state = AuthState(user: user, hydrated: true);
    } catch (_) {
      await _storage.clear();
      state = const AuthState(hydrated: true);
    }
  }

  Future<bool> login({String? email, String? handle, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authApi.login(email: email, handle: handle, password: password);
      await _storage.saveToken(result.token, expiresAt: result.expiresAt);
      state = AuthState(user: result.user, hydrated: true);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _friendly(e));
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String handle,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authApi.register(
        name: name, email: email, handle: handle, password: password,
      );
      await _storage.saveToken(result.token, expiresAt: result.expiresAt);
      state = AuthState(user: result.user, hydrated: true);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _friendly(e));
      return false;
    }
  }

  String _friendly(Object e) {
    final s = e.toString();
    // Strip ApiException(401): prefix when present
    final m = RegExp(r'ApiException\(\d+\):\s*(.*)').firstMatch(s);
    if (m != null) return m.group(1) ?? s;
    return s;
  }

  Future<void> applyUser(UserProfile user) async {
    state = AuthState(user: user, hydrated: true);
  }

  Future<void> logout() async {
    await _authApi.logout();
    await _storage.clear();
    state = const AuthState(hydrated: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authApiProvider), ref.watch(tokenStorageProvider));
});

final feedProvider = FutureProvider.family<List<Post>, String?>((ref, type) async {
  try {
    return await ref.watch(feedApiProvider).getFeed(type: type, limit: 30);
  } catch (e) {
    // Flutter Web + localhost is blocked by CORS until the API allows the origin.
    // Surface the error so UI can show Retry + guidance; callers may use sampleFeedOnWeb.
    rethrow;
  }
});

/// True when the last failure looks like browser CORS / network block.
bool isLikelyCorsError(Object e) {
  final m = e.toString().toLowerCase();
  return m.contains('failed to fetch') ||
      m.contains('cors') ||
      m.contains('xmlhttprequest') ||
      m.contains('network error') ||
      m.contains('clientexception');
}

/// Minimal sample posts so web UI work can continue while CORS is unresolved.
List<Post> sampleFeedPosts() {
  const u = PostUser(
    id: 'demo',
    name: 'SportSphere',
    handle: '@sportsphere',
    isVerified: true,
  );
  return [
    Post(
      id: 'sample-1',
      userId: 'demo',
      content:
          'Welcome to SportSphere. Live feed is blocked in this browser by CORS — use Android, or run: flutter run -d chrome --web-browser-flag "--disable-web-security" --web-browser-flag "--user-data-dir=C:\\Temp\\flutter_chrome_dev"',
      postType: 'post',
      createdAt: DateTime.now().toUtc().toIso8601String(),
      user: u,
    ),
    Post(
      id: 'sample-2',
      userId: 'demo',
      content:
          'UI continues with this sample. When the API allows localhost (or you use the Chrome flags above), real posts load.',
      postType: 'post',
      createdAt: DateTime.now().toUtc().toIso8601String(),
      user: u,
    ),
  ];
}

final matchesProvider = FutureProvider.family<List<MatchItem>, String?>((ref, status) async {
  return ref.watch(matchesApiProvider).getMatches(status: status);
});

final standingsProvider = FutureProvider((ref) async {
  return ref.watch(standingsApiProvider).getStandings();
});
