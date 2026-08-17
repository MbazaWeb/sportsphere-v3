import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import '../../core/constants/api_config.dart';
import '../profile/domain/profile_role_registry.dart';
import 'auth_logo.dart';

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
  final _pageCtrl = PageController();
  final _nameCtrl = TextEditingController();
  final _handleCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  String _selectedRole = 'fan';
  int _step = 0;
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  final List<Map<String, String>> _roles = [
    {'id': 'fan', 'label': 'Fan', 'emoji': '👤', 'desc': 'Follow teams and join the conversation.'},
    {'id': 'player', 'label': 'Player', 'emoji': '⚽', 'desc': 'Showcase your career and stats.'},
    {'id': 'coach', 'label': 'Coach', 'emoji': '👨‍🏫', 'desc': 'Manage teams and share tactics.'},
    {'id': 'journalist', 'label': 'Journalist', 'emoji': '📰', 'desc': 'Report breaking news and articles.'},
    {'id': 'creator', 'label': 'Creator', 'emoji': '🎥', 'desc': 'Share videos and original content.'},
    {'id': 'analyst', 'label': 'Analyst', 'emoji': '📊', 'desc': 'Provide deep match insights.'},
  ];

  @override
  void dispose() {
    _pageCtrl.dispose();
    _nameCtrl.dispose();
    _handleCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _next() {
    if (_step == 0) {
      if (_nameCtrl.text.isEmpty || _handleCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _passCtrl.text.length < 8) {
        setState(() => _error = 'Please fill all fields correctly (Password min 8 chars).');
        return;
      }
      setState(() { _error = null; _step = 1; });
      _pageCtrl.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submit();
    }
  }

  Future<void> _submit() async {
    setState(() { _error = null; _loading = true; });

    final ok = await ref.read(authProvider.notifier).register(
          name: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          handle: _handleCtrl.text.trim().replaceFirst(RegExp(r'^@'), ''),
          password: _passCtrl.text,
          roleId: _selectedRole,
        );

    if (!mounted) return;
    if (ok) {
      setState(() => _loading = false);
      widget.onSuccess();
    } else {
      final err = ref.read(authProvider).error ?? 'Registration failed';
      setState(() {
        _loading = false;
        _error = err.replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  Future<void> _loginWithGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      final googleSignIn = GoogleSignIn(serverClientId: ApiConfig.googleClientId.isNotEmpty ? ApiConfig.googleClientId : null);
      final account = await googleSignIn.signIn();
      if (account == null) { setState(() => _loading = false); return; }
      final auth = await account.authentication;
      final idToken = auth.idToken;
      if (idToken == null) throw Exception('Could not get Google ID token');
      final ok = await ref.read(authProvider.notifier).socialLogin(provider: 'google', idToken: idToken);
      if (!mounted) return;
      if (ok) { setState(() => _loading = false); widget.onSuccess(); }
      else { setState(() { _loading = false; _error = ref.read(authProvider).error ?? 'Google Sign-In failed'; }); }
    } catch (e) { if (mounted) setState(() { _loading = false; _error = 'Google login failed: $e'; }); }
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
                Row(
                  children: [
                    if (_step > 0) IconButton(onPressed: () { setState(() => _step = 0); _pageCtrl.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut); }, icon: const Icon(Icons.arrow_back, size: 18))
                    else const SizedBox(width: 40),
                    const Expanded(child: AuthLogo(height: 32)),
                    IconButton(onPressed: widget.onClose, icon: const Icon(Icons.close, size: 18)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  _step == 0 ? 'Join SportSphere' : 'Choose Your Identity',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.foreground),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.destructive.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.destructive.withValues(alpha: 0.2))),
                    child: Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.destructive)),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  height: 340,
                  child: PageView(
                    controller: _pageCtrl,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _buildBasicInfo(),
                      _buildRoleSelection(),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loading ? null : _next,
                  style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                  child: _loading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground))
                      : Text(_step == 0 ? 'Next' : 'Complete Registration', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
                ),
                if (_step == 0) ...[
                  const SizedBox(height: 14),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Already have an account? ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
                    GestureDetector(onTap: widget.onOpenLogin, child: Text('Sign In', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary))),
                  ]),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfo() {
    return Column(
      children: [
        OutlinedButton(
          onPressed: _loading ? null : _loginWithGoogle,
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48), side: const BorderSide(color: AppColors.border)),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.g_mobiledata_rounded, size: 28), const SizedBox(width: 8), Text('Continue with Google', style: GoogleFonts.inter(fontWeight: FontWeight.w600))]),
        ),
        const SizedBox(height: 16),
        Row(children: [const Expanded(child: Divider(color: AppColors.border)), Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('OR', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground, fontWeight: FontWeight.w700))), const Expanded(child: Divider(color: AppColors.border))]),
        const SizedBox(height: 16),
        TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'Full name', prefixIcon: Icon(Icons.badge_outlined, size: 20))),
        const SizedBox(height: 10),
        TextField(controller: _handleCtrl, decoration: const InputDecoration(hintText: 'Handle (e.g. @you)', prefixIcon: Icon(Icons.alternate_email, size: 20))),
        const SizedBox(height: 10),
        TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(hintText: 'Email', prefixIcon: Icon(Icons.email_outlined, size: 20))),
        const SizedBox(height: 10),
        TextField(controller: _passCtrl, obscureText: _obscure, decoration: InputDecoration(hintText: 'Password (min 8)', prefixIcon: const Icon(Icons.lock_outline, size: 20), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 20), onPressed: () => setState(() => _obscure = !_obscure)))),
      ],
    );
  }

  Widget _buildRoleSelection() {
    return ListView.separated(
      itemCount: _roles.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final r = _roles[i];
        final sel = _selectedRole == r['id'];
        return GestureDetector(
          onTap: () => setState(() => _selectedRole = r['id']!),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: sel ? AppColors.primary.withValues(alpha: 0.12) : AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: sel ? AppColors.primary : AppColors.border, width: sel ? 2 : 1),
            ),
            child: Row(
              children: [
                Text(r['emoji']!, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(r['label']!, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: sel ? AppColors.primary : AppColors.foreground)),
                    Text(r['desc']!, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                  ]),
                ),
                if (sel) const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
              ],
            ),
          ),
        );
      },
    );
  }
}
