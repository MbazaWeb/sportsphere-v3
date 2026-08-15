import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../data/roles_api.dart';

/// Fan → role upgrade — POST /api/roles/upgrade (from web upgrade flow).
class RoleUpgradeSheet extends ConsumerStatefulWidget {
  const RoleUpgradeSheet({super.key});

  @override
  ConsumerState<RoleUpgradeSheet> createState() => _RoleUpgradeSheetState();
}

class _RoleUpgradeSheetState extends ConsumerState<RoleUpgradeSheet> {
  List<AppRole> _roles = [];
  AppRole? _selectedRole;
  AppRoleType? _selectedType;
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ref.read(rolesApiProvider).listRoles();
      if (!mounted) return;
      setState(() {
        _roles = list.where((r) => r.slug.toLowerCase() != 'fan').toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedRole == null || _selectedType == null) {
      setState(() => _error = 'Select a role and type');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
      _success = null;
    });
    try {
      final res = await ref.read(rolesApiProvider).upgrade(
            roleId: _selectedRole!.id,
            roleTypeId: _selectedType!.id,
          );
      // Refresh me
      try {
        final me = await ref.read(authApiProvider).me();
        await ref.read(authProvider.notifier).applyUser(me);
      } catch (_) {}
      if (!mounted) return;
      final status = res['verificationStatus']?.toString() ??
          res['status']?.toString() ??
          'submitted';
      setState(() {
        _submitting = false;
        _success = status == 'verified' || status == 'approved'
            ? 'Role upgraded and verified.'
            : 'Upgrade submitted — verification pending.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.88,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
            child: Row(
              children: [
                Text('Upgrade role', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
                const Spacer(),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_error!, style: GoogleFonts.inter(color: AppColors.destructive, fontSize: 13)),
            ),
          if (_success != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_success!, style: GoogleFonts.inter(color: const Color(0xFF22C55E), fontSize: 13)),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    children: [
                      Text(
                        'Choose the role that matches how you use SportSphere. Some roles need verification.',
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground, height: 1.4),
                      ),
                      const SizedBox(height: 16),
                      Text('Role', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _roles.map((r) {
                          final active = _selectedRole?.id == r.id;
                          return GestureDetector(
                            onTap: () => setState(() {
                              _selectedRole = r;
                              _selectedType = r.types.isNotEmpty ? r.types.first : null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: active ? AppColors.primary : AppColors.border),
                              ),
                              child: Text(
                                r.name,
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: active ? AppColors.primaryForeground : AppColors.foreground,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      if (_selectedRole != null && _selectedRole!.types.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        Text('Type', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
                        const SizedBox(height: 8),
                        ..._selectedRole!.types.map((t) {
                          final active = _selectedType?.id == t.id;
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(t.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                            leading: Icon(
                              active ? Icons.radio_button_checked : Icons.radio_button_off,
                              color: active ? AppColors.primary : AppColors.mutedForeground,
                            ),
                            onTap: () => setState(() => _selectedType = t),
                          );
                        }),
                      ],
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _submitting || _success != null ? null : _submit,
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground),
                              )
                            : const Text('Submit upgrade'),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
