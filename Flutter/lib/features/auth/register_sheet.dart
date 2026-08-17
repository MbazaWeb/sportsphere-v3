import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';

// ─── Registration Sheet — 3 Steps (matches web RegistrationModal) ─────────────
// Step 1: Choose role (Fan / Player / Coach / Scout / Journalist)
// Step 2: Basic info (name, email, handle, password)
// Step 3: Sports interests (optional)

const _roles = [
  _RoleDef('fan',        '⚽', 'Fan',                'Follow sports, join communities and share highlights.'),
  _RoleDef('player',     '🏃', 'Player / Athlete',   'Build your sports career profile, stats, and connect with scouts.'),
  _RoleDef('coach',      '📋', 'Coach / Manager',    'Manage teams, post tactics, and discover talent.'),
  _RoleDef('scout',      '🔍', 'Scout / Agent',      'Track player statistics and identify rising talent.'),
  _RoleDef('journalist', '🎙️', 'Journalist / Creator','Publish sports news, media content, and match analysis.'),
  _RoleDef('team',       '👥', 'Team / Club',        'Official team account — share news, results and engage fans.'),
  _RoleDef('media',      '📺', 'Media / Press',      'Official media outlet — publish breaking sports news.'),
];

const _sports = ['Football', 'Basketball', 'Tennis', 'Rugby', 'Athletics', 'Cricket', 'F1', 'Boxing', 'Cycling', 'Swimming'];

class _RoleDef {
  const _RoleDef(this.id, this.emoji, this.title, this.desc);
  final String id, emoji, title, desc;
}

class RegisterSheet extends ConsumerStatefulWidget {
  const RegisterSheet({
    super.key,
    required this.onClose,
    required this.onSuccess,
    required this.onOpenLogin,
    this.initialRole,
  });

  final VoidCallback onClose;
  final VoidCallback onSuccess;
  final VoidCallback onOpenLogin;
  final String? initialRole;

  @override
  ConsumerState<RegisterSheet> createState() => _RegisterSheetState();
}

class _RegisterSheetState extends ConsumerState<RegisterSheet> {
  int _step = 0;
  String _role = 'fan';

  // Step 2 fields
  final _name     = TextEditingController();
  final _email    = TextEditingController();
  final _handle   = TextEditingController();
  final _password = TextEditingController();
  bool _obscure   = true;
  String? _error;
  bool _loading   = false;

  // Step 3
  final Set<String> _sports = {};

  @override
  void initState() {
    super.initState();
    if (widget.initialRole != null) _role = widget.initialRole!;
  }

  @override
  void dispose() {
    _name.dispose(); _email.dispose(); _handle.dispose(); _password.dispose();
    super.dispose();
  }

  void _nextStep() => setState(() { _step++; _error = null; });
  void _prevStep() => setState(() { _step--; _error = null; });

  Future<void> _register() async {
    final name = _name.text.trim();
    final email = _email.text.trim();
    final handle = _handle.text.trim().replaceAll('@', '');
    final pw = _password.text;

    if (name.isEmpty || email.isEmpty || handle.isEmpty || pw.isEmpty) {
      setState(() => _error = 'All fields are required'); return;
    }
    if (pw.length < 8) { setState(() => _error = 'Password must be at least 8 characters'); return; }

    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authApiProvider).register(
        name: name, email: email, handle: handle, password: pw,
        roleId: _role, sports: _sports.toList(),
      );
      if (!mounted) return;
      widget.onSuccess();
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          // Handle + header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
                const SizedBox(height: 14),
                Row(
                  children: [
                    if (_step > 0)
                      GestureDetector(
                        onTap: _prevStep,
                        child: Container(width: 36, height: 36,
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
                          child: const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: Colors.white)),
                      )
                    else
                      GestureDetector(
                        onTap: widget.onClose,
                        child: Container(width: 36, height: 36,
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
                          child: const Icon(Icons.close, size: 16, color: Colors.white)),
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_stepTitle(), style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800)),
                          Text('Step ${_step + 1} of 3', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Progress bar
                Row(
                  children: List.generate(3, (i) => Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: i < 2 ? 6 : 0),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        height: 3,
                        decoration: BoxDecoration(
                          color: i <= _step ? AppColors.primary : Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  )),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Step content
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: _buildStep(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _stepTitle() => switch (_step) {
    0 => 'Choose your role',
    1 => 'Create your account',
    _ => 'Your sports interests',
  };

  Widget _buildStep() => switch (_step) {
    0 => _StepRole(selected: _role, onSelect: (r) { setState(() => _role = r); _nextStep(); }),
    1 => _StepInfo(name: _name, email: _email, handle: _handle, password: _password,
          obscure: _obscure, error: _error, loading: _loading,
          role: _role,
          onObscure: () => setState(() => _obscure = !_obscure),
          onNext: () {
            if (_name.text.trim().isEmpty || _email.text.trim().isEmpty ||
                _handle.text.trim().isEmpty || _password.text.isEmpty) {
              setState(() => _error = 'All fields are required'); return;
            }
            if (_password.text.length < 8) {
              setState(() => _error = 'Password must be at least 8 characters'); return;
            }
            _nextStep();
          }),
    _ => _StepSports(selected: _sports, loading: _loading, error: _error,
          onToggle: (s) => setState(() { if (_sports.contains(s)) _sports.remove(s); else _sports.add(s); }),
          onRegister: _register,
          onOpenLogin: widget.onOpenLogin),
  };
}

// ─── Step 1: Role picker ──────────────────────────────────────────────────────
class _StepRole extends StatelessWidget {
  const _StepRole({required this.selected, required this.onSelect});
  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
      children: _roles.map((r) {
        final isSelected = r.id == selected;
        return GestureDetector(
          onTap: () => onSelect(r.id),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppColors.primary.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.07),
                width: isSelected ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(child: Text(r.emoji, style: const TextStyle(fontSize: 22))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.title, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14,
                          color: isSelected ? AppColors.primary : Colors.white)),
                      const SizedBox(height: 2),
                      Text(r.desc, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground, height: 1.3)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_forward_ios_rounded, size: 14,
                    color: isSelected ? AppColors.primary : AppColors.mutedForeground.withValues(alpha: 0.5)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ─── Step 2: Account info ─────────────────────────────────────────────────────
class _StepInfo extends StatelessWidget {
  const _StepInfo({required this.name, required this.email, required this.handle, required this.password,
      required this.obscure, required this.error, required this.loading, required this.role,
      required this.onObscure, required this.onNext});
  final TextEditingController name, email, handle, password;
  final bool obscure, loading;
  final String? error;
  final String role;
  final VoidCallback onObscure, onNext;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      children: [
        // Role reminder
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
          ),
          child: Text('Registering as: ${_roles.firstWhere((r) => r.id == role, orElse: () => _roles.first).title}',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 16),
        _Field('Full name', Icons.person_outline, name),
        _Field('Email address', Icons.mail_outline, email, keyboard: TextInputType.emailAddress),
        _Field('@handle', Icons.alternate_email, handle),
        _Field('Password (8+ chars)', Icons.lock_outline, password, obscure: obscure, onObscure: onObscure),
        if (error != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3))),
            child: Text(error!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFEF4444))),
          ),
        ],
        const SizedBox(height: 20),
        _GoldBtn(label: 'Continue →', loading: loading, onTap: onNext),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  const _Field(this.hint, this.icon, this.ctrl, {this.keyboard, this.obscure = false, this.onObscure});
  final String hint;
  final IconData icon;
  final TextEditingController ctrl;
  final TextInputType? keyboard;
  final bool obscure;
  final VoidCallback? onObscure;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Container(
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
      child: TextField(
        controller: ctrl,
        obscureText: obscure,
        keyboardType: keyboard,
        style: GoogleFonts.inter(fontSize: 14, color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 14),
          prefixIcon: Icon(icon, size: 18, color: AppColors.mutedForeground),
          suffixIcon: onObscure != null ? IconButton(icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18, color: AppColors.mutedForeground), onPressed: onObscure) : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
        ),
      ),
    ),
  );
}

// ─── Step 3: Sports interests ─────────────────────────────────────────────────
class _StepSports extends StatelessWidget {
  const _StepSports({required this.selected, required this.onToggle, required this.onRegister, required this.loading, required this.error, required this.onOpenLogin});
  final Set<String> selected;
  final ValueChanged<String> onToggle;
  final VoidCallback onRegister, onOpenLogin;
  final bool loading;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      children: [
        Text('Select your favourite sports (optional)',
            style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: _sports.map((s) {
            final sel = selected.contains(s);
            return GestureDetector(
              onTap: () => onToggle(s),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? AppColors.primary.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.04),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? AppColors.primary.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.08), width: sel ? 1.5 : 1),
                ),
                child: Text(s, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600,
                    color: sel ? AppColors.primary : AppColors.mutedForeground)),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        if (error != null) ...[
          Container(
            padding: const EdgeInsets.all(10),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3))),
            child: Text(error!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFEF4444))),
          ),
        ],
        _GoldBtn(label: 'Create Account', loading: loading, onTap: onRegister),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Already have an account? ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
            GestureDetector(
              onTap: onOpenLogin,
              child: Text('Login', style: GoogleFonts.inter(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Center(child: Text('You can skip and add sports later',
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground))),
      ],
    );
  }
}

class _GoldBtn extends StatelessWidget {
  const _GoldBtn({required this.label, required this.loading, required this.onTap});
  final String label;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: loading ? null : onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFF5C518), Color(0xFFFFD700)]),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      alignment: Alignment.center,
      child: loading
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
          : Text(label, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.black)),
    ),
  );
}
