import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../../core/constants/api_config.dart';


String _resolveUrl(String url) => ApiConfig.resolveUrl(url);


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
  late final TextEditingController _aboutMe;
  bool _saving = false;
  bool _uploadingAvatar = false;
  String? _error;
  String? _avatarUrl;
  String? _coverUrl;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _name = TextEditingController(text: u?.name ?? '');
    _handle = TextEditingController(text: (u?.handle ?? '').replaceFirst('@', ''));
    _bio = TextEditingController(text: u?.bio ?? '');
    _location = TextEditingController(text: u?.location ?? '');
    _website = TextEditingController(text: u?.website ?? '');
    _aboutMe = TextEditingController(text: u?.aboutMe ?? '');
    _avatarUrl = u?.avatarUrl;
    _coverUrl = u?.coverUrl;
  }

  @override
  void dispose() {
    _name.dispose();
    _handle.dispose();
    _bio.dispose();
    _location.dispose();
    _website.dispose();
    _aboutMe.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    if (kIsWeb) return;
    setState(() => _uploadingAvatar = true);
    try {
      final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (file == null) { if (mounted) setState(() => _uploadingAvatar = false); return; }
      final bytes = await file.readAsBytes();
      final url = await ref.read(uploadApiProvider).uploadBytes(
        bytes: bytes,
        filename: 'avatar_${DateTime.now().millisecondsSinceEpoch}.jpg',
        contentType: 'image/jpeg',
      );
      if (!mounted) return;
      setState(() { _avatarUrl = url; _uploadingAvatar = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    }
  }

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; });
    try {
      final updated = await ref.read(profileApiProvider).updateProfile(
        name: _name.text.trim(),
        handle: _handle.text.trim(),
        bio: _bio.text.trim(),
        location: _location.text.trim(),
        website: _website.text.trim(),
        aboutMe: _aboutMe.text.trim(),
        avatarUrl: _avatarUrl,
        coverUrl: _coverUrl,
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
    final currentAvatar = ref.watch(authProvider).user?.avatarUrl;
    final displayAvatar = _avatarUrl ?? currentAvatar;
    final name = _name.text.trim();
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        height: MediaQuery.sizeOf(context).height * 0.9,
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
                    child: Text('Edit profile', textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
                  ),
                  TextButton(
                    onPressed: _saving ? null : _save,
                    child: Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.primary)),
                  ),
                ],
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(_error!, style: GoogleFonts.inter(color: AppColors.destructive, fontSize: 13)),
              ),
            // Avatar section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 48,
                      backgroundImage: displayAvatar != null && displayAvatar.isNotEmpty ? NetworkImage(_resolveUrl(displayAvatar)) : null,
                      backgroundColor: AppColors.surfaceElevated,
                      child: displayAvatar == null || displayAvatar.isEmpty
                          ? Text(initial, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 24, color: AppColors.primary))
                          : null,
                    ),
                    if (!kIsWeb)
                      Positioned(
                        right: 0, bottom: 0,
                        child: GestureDetector(
                          onTap: _uploadingAvatar ? null : _pickAvatar,
                          child: Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle, border: Border.all(color: AppColors.backgroundSecondary, width: 3)),
                            child: _uploadingAvatar
                                ? const Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground))
                                : const Icon(Icons.camera_alt_rounded, size: 16, color: AppColors.primaryForeground),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  GlassCard(
                    borderRadius: 16,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        TextField(controller: _name, decoration: InputDecoration(labelText: 'Name', counterStyle: GoogleFonts.inter(color: AppColors.mutedForeground)),),
                        const SizedBox(height: 10),
                        TextField(controller: _handle, decoration: const InputDecoration(labelText: 'Handle', prefixText: '@')),
                        const SizedBox(height: 10),
                        TextField(controller: _bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio', alignLabelWithHint: true)),
                        const SizedBox(height: 10),
                        TextField(controller: _aboutMe, maxLines: 4, decoration: const InputDecoration(labelText: 'About Me', alignLabelWithHint: true)),
                        const SizedBox(height: 10),
                        TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location', prefixIcon: Icon(Icons.location_on_outlined, size: 18))),
                        const SizedBox(height: 10),
                        TextField(controller: _website, decoration: const InputDecoration(labelText: 'Website', prefixIcon: Icon(Icons.language, size: 18))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
