import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import 'auth_logo.dart';

/// Set new password with token from email — POST /api/auth/reset-password
class ResetPasswordSheet extends ConsumerStatefulWidget {
  const ResetPasswordSheet({
    super.key,
    required this.onClose,
    required this.onOpenLogin,
    this.initialToken,
  });

  final VoidCallback onClose;
  final VoidCallback onOpenLogin;
  final String? initialToken;

  @override
  ConsumerState<ResetPasswordSheet> createState() => _ResetPasswordSheetState();
}

class _ResetPasswordSheetState extends ConsumerState<ResetPasswordSheet> {
  late final TextEditingController _token;
  final _pass = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _token = TextEditingController(text: widget.initialToken ?? '');
  }

  @override
  void dispose() {
    _token.dispose();
    _pass.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final token = _token.text.trim();
    final password = _pass.text;
    if (token.isEmpty) {
      setState(() => _error = 'Paste the reset token from your email link.');
      return;
    }
    if (password.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }
    if (password != _confirm.text) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      await ref.read(authApiProvider).resetPassword(token: token, password: password);
      if (!mounted) return;
      setState(() {
        _loading = false;
        _success = 'Password updated. You can sign in now.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.65),
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
                Row(
                  children: [
                    const Expanded(child: AuthLogo(height: 36)),
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
                Text(
                  'Reset password',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  'Paste the token from your reset email, then choose a new password.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 13, height: 1.4, color: AppColors.mutedForeground),
                ),
                const SizedBox(height: 20),
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppColors.destructive.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.destructive)),
                  ),
                if (_success != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_success!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF22C55E))),
                  ),
                TextField(
                  controller: _token,
                  decoration: const InputDecoration(hintText: 'Reset token'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _pass,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    hintText: 'New password',
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _confirm,
                  obscureText: _obscure,
                  decoration: const InputDecoration(hintText: 'Confirm password'),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loading || _success != null ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground),
                        )
                      : const Text('Update password'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: widget.onOpenLogin,
                  child: Text(
                    'Back to sign in',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
