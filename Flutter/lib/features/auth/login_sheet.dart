import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import '../../core/constants/api_config.dart';
import 'auth_logo.dart';

/// Login sheet — real POST /api/auth (email OR handle + password).
class LoginSheet extends ConsumerStatefulWidget {
  const LoginSheet({
    super.key,
    required this.onClose,
    required this.onSuccess,
    required this.onOpenRegister,
    this.onOpenForgot,
  });

  final VoidCallback onClose;
  final VoidCallback onSuccess;
  final VoidCallback onOpenRegister;
  final VoidCallback? onOpenForgot;

  @override
  ConsumerState<LoginSheet> createState() => _LoginSheetState();
}

class _LoginSheetState extends ConsumerState<LoginSheet> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  bool _notFound = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final id = _emailCtrl.text.trim();
    final password = _passCtrl.text;
    if (id.isEmpty || password.isEmpty) {
      setState(() {
        _error = 'Please enter email/handle and password';
        _notFound = false;
      });
      return;
    }

    setState(() {
      _error = null;
      _notFound = false;
      _loading = true;
    });

    final looksEmail = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(id);
    final ok = await ref.read(authProvider.notifier).login(
          email: looksEmail ? id : null,
          handle: looksEmail ? null : id.replaceFirst(RegExp(r'^@'), ''),
          password: password,
        );

    if (!mounted) return;

    if (ok) {
      setState(() => _loading = false);
      widget.onSuccess();
      return;
    }

    final err = ref.read(authProvider).error ?? 'Login failed';
    final lower = err.toLowerCase();
    setState(() {
      _loading = false;
      _notFound = lower.contains('invalid') || lower.contains('not found') || lower.contains('401');
      _error = err.replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
    });
  }

  Future<void> _loginWithGoogle() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final googleSignIn = GoogleSignIn(
        serverClientId: ApiConfig.googleClientId.isNotEmpty ? ApiConfig.googleClientId : null,
      );
      final account = await googleSignIn.signIn();
      if (account == null) {
        setState(() => _loading = false);
        return;
      }

      final auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null) {
        throw Exception('Could not get Google ID token');
      }

      final ok = await ref.read(authProvider.notifier).socialLogin(
        provider: 'google',
        idToken: idToken,
      );

      if (!mounted) return;

      if (ok) {
        setState(() => _loading = false);
        widget.onSuccess();
      } else {
        final err = ref.read(authProvider).error ?? 'Google Sign-In failed';
        setState(() {
          _loading = false;
          _error = err;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Google login failed: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.6),
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: GlassCard(
            borderRadius: 24,
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AuthLogo(height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Sign In',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.foreground,
                      ),
                    ),
                    IconButton(
                      onPressed: widget.onClose,
                      icon: const Icon(Icons.close, size: 18),
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.surface,
                        foregroundColor: AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (_notFound) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0x1A3B82F6),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0x333B82F6)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'No account found with that email or handle.',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF93C5FD),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: widget.onOpenRegister,
                          child: const Text('Create an Account'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.destructive.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.destructive.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Text(
                      _error!,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.destructive,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: const InputDecoration(
                    hintText: 'Email or handle',
                    prefixIcon: Icon(Icons.person_outline, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: InputDecoration(
                    hintText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscure ? Icons.visibility_off : Icons.visibility,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: widget.onOpenForgot,
                    child: Text(
                      'Forgot password?',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primaryForeground,
                          ),
                        )
                      : const Text('Sign In'),
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    const Expanded(child: Divider(color: AppColors.border)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('OR', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground, fontWeight: FontWeight.w700)),
                    ),
                    const Expanded(child: Divider(color: AppColors.border)),
                  ],
                ),
                const SizedBox(height: 16),

                OutlinedButton(
                  onPressed: _loading ? null : _loginWithGoogle,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.g_mobiledata_rounded, size: 28),
                      const SizedBox(width: 8),
                      Text('Continue with Google', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.mutedForeground,
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onOpenRegister,
                      child: Text(
                        'Sign Up',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
