/// Supabase configuration for SportSphere Flutter app.
///
/// Supabase is used for:
///   - Auth (Google Sign-In, Apple Sign-In, email OTP)
///   - Realtime (live scores, notifications, messages)
///   - Storage (avatar/cover/media uploads)
///
/// The WebApp API is still used for business logic endpoints.
/// Supabase handles auth tokens which are passed to the WebApp API.

class SupabaseConfig {
  SupabaseConfig._();

  static const String url = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://vqyfybuloyqahgoagmzd.supabase.co',
  );

  static const String anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZ5YnVsb3lxYWhnb2FnbXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMjE3OTgsImV4cCI6MjEwMjU5Nzc5OH0.oddZU-z2x_svFeWgSA-bvCLncCsxRF3r1LCC4Xiexx8',
  );
}
