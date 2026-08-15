/// SportSphere API configuration.
///
/// Web app: https://sportssphere.fun/sportsphere
/// API:     https://sportssphere.fun/sportsphere/api/...
///
/// Mobile receives JWT in JSON body (see api/auth/route.ts comments).
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://sportssphere.fun',
  );

  static const String basePath = String.fromEnvironment(
    'API_BASE_PATH',
    defaultValue: '/sportsphere',
  );

  /// Full API prefix: https://sportssphere.fun/sportsphere/api
  static String get apiRoot => '$baseUrl$basePath/api';

  /// Build absolute URL for a path under /api
  /// Example: path('/feed') → https://sportssphere.fun/sportsphere/api/feed
  static String path(String endpoint) {
    final e = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$apiRoot$e';
  }
}
