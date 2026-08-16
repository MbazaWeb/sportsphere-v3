/// SportSphere API configuration — shared backend for WebApp + Flutter.
///
/// All clients (WebApp, Admin, Flutter) use the same PostgreSQL database
/// and the same Next.js API surface so data stays in sync.
///
/// Production:
///   Web:  https://sportssphere.fun/sportsphere
///   API:  https://sportssphere.fun/sportsphere/api/...
///
/// Mobile auth: JWT is returned in the login JSON body and sent as
///   Authorization: Bearer <token>
/// (Web uses httpOnly cookie; backend accepts both.)
///
/// Override at build time:
///   flutter run --dart-define=API_BASE_URL=http://104.152.50.173:3002
///   flutter run --dart-define=API_BASE_PATH=/sportsphere
class ApiConfig {
  ApiConfig._();

  /// Origin only (no path). Default = production domain.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://sportssphere.fun',
  );

  /// Next.js basePath used by the fan web app.
  static const String basePath = String.fromEnvironment(
    'API_BASE_PATH',
    defaultValue: '/sportsphere',
  );

  /// Full API prefix, e.g. https://sportssphere.fun/sportsphere/api
  static String get apiRoot => '$baseUrl$basePath/api';

  /// Absolute URL for a path under /api
  /// Example: path('/feed') → https://sportssphere.fun/sportsphere/api/feed
  static String path(String endpoint) {
    final e = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$apiRoot$e';
  }

  /// Health check URL (used for connectivity diagnostics).
  static String get healthUrl => path('/health');

  /// True when pointing at production domain.
  static bool get isProduction =>
      baseUrl.contains('sportssphere.fun') || baseUrl.contains('sportsphere.app');
}
