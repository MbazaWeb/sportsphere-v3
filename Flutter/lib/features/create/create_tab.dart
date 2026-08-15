import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';

/// Single Create composer popup — text + attach + poll + prediction.
class CreateTab extends ConsumerStatefulWidget {
  const CreateTab({super.key, this.onNeedLogin});

  final VoidCallback? onNeedLogin;

  @override
  ConsumerState<CreateTab> createState() => _CreateTabState();
}

enum _Mode { post, poll, prediction }

class _CreateTabState extends ConsumerState<CreateTab> {
  final _text = TextEditingController();
  final _pollQ = TextEditingController();
  final _pollOpts = <TextEditingController>[
    TextEditingController(),
    TextEditingController(),
  ];
  final _home = TextEditingController();
  final _away = TextEditingController();
  final _hs = TextEditingController();
  final _as = TextEditingController();

  _Mode _mode = _Mode.post;
  final _picker = ImagePicker();
  final List<XFile> _files = [];
  final List<Uint8List> _previews = [];
  static const _max = 500;
  static const _maxFiles = 4;

  @override
  void dispose() {
    _text.dispose();
    _pollQ.dispose();
    for (final c in _pollOpts) {
      c.dispose();
    }
    _home.dispose();
    _away.dispose();
    _hs.dispose();
    _as.dispose();
    super.dispose();
  }

  Future<void> _attach() async {
    if (_files.length >= _maxFiles) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Max 4 attachments')),
      );
      return;
    }
    final choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.backgroundSecondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.primary),
                title: Text('Photo library', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: () => Navigator.pop(ctx, 'gallery'),
              ),
              if (!kIsWeb)
                ListTile(
                  leading: const Icon(Icons.photo_camera_outlined, color: AppColors.primary),
                  title: Text('Camera', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  onTap: () => Navigator.pop(ctx, 'camera'),
                ),
              ListTile(
                leading: const Icon(Icons.videocam_outlined, color: AppColors.primary),
                title: Text('Video', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: () => Navigator.pop(ctx, 'video'),
              ),
            ],
          ),
        ),
      ),
    );
    if (choice == null || !mounted) return;

    try {
      XFile? file;
      if (choice == 'gallery') {
        file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      } else if (choice == 'camera') {
        file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
      } else if (choice == 'video') {
        file = await _picker.pickVideo(source: ImageSource.gallery);
      }
      if (file == null) return;
      final bytes = await file.readAsBytes();
      if (!mounted) return;
      setState(() {
        _files.add(file!);
        _previews.add(bytes);
        if (_mode != _Mode.post) _mode = _Mode.post;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not attach: $e')),
      );
    }
  }

  void _removeAt(int i) {
    setState(() {
      _files.removeAt(i);
      _previews.removeAt(i);
    });
  }

  bool _publishing = false;

  Future<void> _publish() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      widget.onNeedLogin?.call();
      return;
    }

    final content = (_mode == _Mode.poll ? _pollQ.text : _text.text).trim();
    String postType = 'post';
    Map<String, dynamic>? poll;
    Map<String, dynamic>? prediction;

    if (_mode == _Mode.poll) {
      postType = 'poll';
      final opts = _pollOpts.map((c) => c.text.trim()).where((o) => o.isNotEmpty).toList();
      if (content.isEmpty || opts.length < 2) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Poll needs a question and at least 2 options')),
        );
        return;
      }
      poll = {'question': content, 'options': opts};
    } else if (_mode == _Mode.prediction) {
      postType = 'prediction';
      if (_home.text.trim().isEmpty || _away.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter both teams')),
        );
        return;
      }
      prediction = {
        'homeTeam': _home.text.trim(),
        'awayTeam': _away.text.trim(),
        'predictedHome': int.tryParse(_hs.text) ?? 0,
        'predictedAway': int.tryParse(_as.text) ?? 0,
        'confidence': 'medium',
      };
      if (content.isEmpty) {
        // API may require content for prediction
      }
    } else {
      if (content.isEmpty && _files.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Write something or attach media')),
        );
        return;
      }
      if (_files.isNotEmpty) postType = 'photo';
    }

    setState(() => _publishing = true);
    try {
      final mediaUrls = <String>[];
      for (var i = 0; i < _previews.length; i++) {
        final bytes = _previews[i];
        final name = _files[i].name.isNotEmpty ? _files[i].name : 'upload_$i.jpg';
        final lower = name.toLowerCase();
        final ct = lower.endsWith('.png')
            ? 'image/png'
            : lower.endsWith('.webp')
                ? 'image/webp'
                : lower.endsWith('.mp4') || lower.endsWith('.mov')
                    ? 'video/mp4'
                    : 'image/jpeg';
        final url = await ref.read(uploadApiProvider).uploadBytes(
              bytes: bytes,
              filename: name,
              contentType: ct,
            );
        mediaUrls.add(url);
      }
      if (mediaUrls.isNotEmpty && postType == 'post') {
        postType = 'photo';
      }
      await ref.read(socialApiProvider).createPost(
            content: content.isEmpty ? ' ' : content,
            postType: postType,
            mediaUrls: mediaUrls,
            poll: poll,
            prediction: prediction,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Posted')),
      );
      Navigator.of(context).maybePop();
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(8, 4, 12, 0),
          child: Row(
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).maybePop(),
                child: Text(
                  'Cancel',
                  style: GoogleFonts.inter(color: AppColors.mutedForeground, fontWeight: FontWeight.w600),
                ),
              ),
              Expanded(
                child: Text(
                  _mode == _Mode.poll
                      ? 'Create poll'
                      : _mode == _Mode.prediction
                          ? 'Prediction'
                          : 'Create',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.3),
                ),
              ),
              TextButton(
                onPressed: _publishing ? null : _publish,
                child: Text(
                  'Post',
                  style: GoogleFonts.inter(color: AppColors.primary, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              GlassCard(
                borderRadius: 22,
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.surfaceElevated,
                          child: Icon(Icons.person, color: AppColors.mutedForeground, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _mode == _Mode.poll ? _pollQ : _text,
                            maxLines: _mode == _Mode.prediction ? 2 : 5,
                            maxLength: _mode == _Mode.post ? _max : null,
                            style: GoogleFonts.inter(fontSize: 16.5, height: 1.45, letterSpacing: -0.2),
                            decoration: InputDecoration(
                              hintText: _mode == _Mode.poll
                                  ? 'Ask a question…'
                                  : _mode == _Mode.prediction
                                      ? 'Add a note (optional)…'
                                      : "What's happening in sports?",
                              border: InputBorder.none,
                              counterStyle: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground),
                              hintStyle: GoogleFonts.inter(
                                color: AppColors.mutedForeground,
                                fontSize: 16.5,
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Media previews
                    if (_previews.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 96,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _previews.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, i) {
                            return Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.memory(
                                    _previews[i],
                                    width: 96,
                                    height: 96,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: GestureDetector(
                                    onTap: () => _removeAt(i),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close, size: 14, color: Colors.white),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],

                    if (_mode == _Mode.poll) ...[
                      const Divider(color: AppColors.border, height: 20),
                      ...List.generate(_pollOpts.length, (i) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: TextField(
                            controller: _pollOpts[i],
                            decoration: InputDecoration(
                              labelText: 'Option ${String.fromCharCode(65 + i)}',
                              isDense: true,
                              filled: true,
                              fillColor: AppColors.surface,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: const BorderSide(color: AppColors.border),
                              ),
                            ),
                          ),
                        );
                      }),
                      TextButton.icon(
                        onPressed: () {
                          if (_pollOpts.length >= 6) return;
                          setState(() => _pollOpts.add(TextEditingController()));
                        },
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add option'),
                      ),
                    ],

                    if (_mode == _Mode.prediction) ...[
                      const Divider(color: AppColors.border, height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _home,
                              decoration: InputDecoration(
                                labelText: 'Home',
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 48,
                            child: TextField(
                              controller: _hs,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              decoration: InputDecoration(
                                hintText: '0',
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            child: Text('-', style: GoogleFonts.outfit(fontSize: 18, color: AppColors.mutedForeground)),
                          ),
                          SizedBox(
                            width: 48,
                            child: TextField(
                              controller: _as,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              decoration: InputDecoration(
                                hintText: '0',
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _away,
                              decoration: InputDecoration(
                                labelText: 'Away',
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 10),

                    // Tools: Attach · Poll · Predict
                    Row(
                      children: [
                        _Tool(
                          icon: Icons.attach_file_rounded,
                          label: 'Attach',
                          active: _previews.isNotEmpty,
                          onTap: _attach,
                        ),
                        const SizedBox(width: 6),
                        _Tool(
                          icon: Icons.bar_chart_rounded,
                          label: 'Poll',
                          active: _mode == _Mode.poll,
                          onTap: () => setState(() {
                            _mode = _mode == _Mode.poll ? _Mode.post : _Mode.poll;
                          }),
                        ),
                        const SizedBox(width: 6),
                        _Tool(
                          icon: Icons.track_changes_rounded,
                          label: 'Predict',
                          active: _mode == _Mode.prediction,
                          onTap: () => setState(() {
                            _mode = _mode == _Mode.prediction ? _Mode.post : _Mode.prediction;
                          }),
                        ),
                        const Spacer(),
                        Material(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(22),
                          child: InkWell(
                            onTap: _publish,
                            borderRadius: BorderRadius.circular(22),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                              child: Row(
                                children: [
                                  const Icon(Icons.send_rounded, size: 16, color: AppColors.primaryForeground),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Post',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13.5,
                                      color: AppColors.primaryForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Tool extends StatelessWidget {
  const _Tool({
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.primary.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.04),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: active ? AppColors.primary : AppColors.mutedForeground),
              const SizedBox(width: 5),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.1,
                  color: active ? AppColors.primary : AppColors.mutedForeground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
