import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import 'auth_logo.dart';

/// Register — real POST /api/auth/register (JWT stored securely).
class RegisterSheet extends ConsumerStatefulWidget {
  const RegisterSheet({
    super.key,
    required this.onClose,
    required this.onSuccess,
    required this.onOpenLogin,
  });

  final VoidCallback onClose;
  final VoidCallback onSuccess;
  final VoidCallback onOpenLogin;

  @override
  ConsumerState<RegisterSheet> createState() => _RegisterSheetState();
}

class _RegisterSheetState extends ConsumerState<RegisterSheet> {
  final _nameCtrl = TextEditingController();
  final _handleCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _handleCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final handle = _handleCtrl.text.trim().replaceFirst(RegExp(r'^@'), '');
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;

    if (name.isEmpty || handle.isEmpty || email.isEmpty) {
      setState(() => _error = 'Name, handle, and email are required.');
      return;
    }
    if (password.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }

    setState(() {
      _error = null;
      _loading = true;
    });

    final ok = await ref.read(authProvider.notifier).register(
          name: name,
          email: email,
          handle: handle,
          password: password,
        );

    if (!mounted) return;

    if (ok) {
      setState(() => _loading = false);
      widget.onSuccess();
      return;
    }

    final err = ref.read(authProvider).error ?? 'Registration failed';
    setState(() {
      _loading = false;
      _error = err.replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.7),
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
                Text(
                  'Join SportSphere',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Create your fan account and start following your favorite sports. You can upgrade to other roles later.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                  ),
                ),
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerRight,
                  child: IconButton(
                    onPressed: widget.onClose,
                    icon: const Icon(Icons.close, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      foregroundColor: AppColors.mutedForeground,
                    ),
                  ),
                ),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
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
                ],
                TextField(
                  controller: _nameCtrl,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: const InputDecoration(
                    hintText: 'Full name',
                    prefixIcon: Icon(Icons.badge_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _handleCtrl,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: const InputDecoration(
                    hintText: 'Handle (e.g. @you)',
                    prefixIcon: Icon(Icons.alternate_email, size: 20),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: const InputDecoration(
                    hintText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: InputDecoration(
                    hintText: 'Password (min 6)',
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
                const SizedBox(height: 16),
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
                      : const Text('Create Account'),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.mutedForeground,
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onOpenLogin,
                      child: Text(
                        'Sign In',
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
