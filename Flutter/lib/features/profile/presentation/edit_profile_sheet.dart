import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';

class EditProfileSheet extends ConsumerStatefulWidget {
  const EditProfileSheet({super.key});

  @override
  ConsumerState<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<EditProfileSheet> {
  late final TextEditingController _name;
  late final TextEditingController _handle;
  late final TextEditingController _bio;
  late final TextEditingController _location;
  late final TextEditingController _website;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _name = TextEditingController(text: u?.name ?? '');
    _handle = TextEditingController(text: (u?.handle ?? '').replaceFirst('@', ''));
    _bio = TextEditingController(text: u?.bio ?? '');
    _location = TextEditingController(text: u?.location ?? '');
    _website = TextEditingController(text: u?.website ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _handle.dispose();
    _bio.dispose();
    _location.dispose();
    _website.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final updated = await ref.read(profileApiProvider).updateProfile(
            name: _name.text.trim(),
            handle: _handle.text.trim(),
            bio: _bio.text.trim(),
            location: _location.text.trim(),
            website: _website.text.trim(),
          );
      await ref.read(authProvider.notifier).applyUser(updated);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        height: MediaQuery.sizeOf(context).height * 0.85,
        decoration: const BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
              child: Row(
                children: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                  Expanded(
                    child: Text(
                      'Edit profile',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18),
                    ),
                  ),
                  TextButton(
                    onPressed: _saving ? null : _save,
                    child: Text(
                      'Save',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(_error!, style: GoogleFonts.inter(color: AppColors.destructive, fontSize: 13)),
              ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  GlassCard(
                    borderRadius: 16,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
                        const SizedBox(height: 10),
                        TextField(controller: _handle, decoration: const InputDecoration(labelText: 'Handle', prefixText: '@')),
                        const SizedBox(height: 10),
                        TextField(controller: _bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
                        const SizedBox(height: 10),
                        TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
                        const SizedBox(height: 10),
                        TextField(controller: _website, decoration: const InputDecoration(labelText: 'Website')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
