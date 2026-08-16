import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';

/// Create Post composer — text + attach + poll + prediction + sport tag + hashtags + location + breaking.
class CreateTab extends ConsumerStatefulWidget {
  const CreateTab({super.key, this.onNeedLogin});

  final VoidCallback? onNeedLogin;

  @override
  ConsumerState<CreateTab> createState() => _CreateTabState();
}

enum _Mode { post, poll, prediction }

/// Common sports for tagging
const _sports = [
  'Football', 'Basketball', 'Tennis', 'Cricket', 'Rugby',
  'Baseball', 'American Football', 'Hockey', 'Boxing', 'MMA',
  'Athletics', 'Swimming', 'Golf', 'F1', 'MotoGP',
  'Cycling', 'Volleyball', 'Handball', 'Esports', 'Other',
];

const _confidenceLevels = ['low', 'medium', 'high'];
const _pollDurations = [
  (1, '1 hour'),
  (6, '6 hours'),
  (12, '12 hours'),
  (24, '1 day'),
  (48, '2 days'),
  (72, '3 days'),
  (168, '1 week'),
];

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
  final _location = TextEditingController();
  final _tagSearch = TextEditingController();

  _Mode _mode = _Mode.post;
  final _picker = ImagePicker();
  final List<XFile> _files = [];
  final List<Uint8List> _previews = [];
  static const _max = 500;
  static const _maxFiles = 4;

  // Extra features
  String? _selectedSport;
  String? _selectedTag; // team or player tag
  bool _isBreaking = false;
  int _pollDurationHours = 24;
  String _confidence = 'medium';
  bool _showSportPicker = false;
  bool _showTagInput = false;
  bool _showLocation = false;
  List<String> _detectedHashtags = [];

  @override
  void initState() {
    super.initState();
    _text.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    final v = _text.text;
    final matches = RegExp(r'#(\w+)').allMatches(v);
    setState(() {
      _detectedHashtags = matches.map((m) => m.group(1)!).toSet().toList();
    });
  }

  @override
  void dispose() {
    _text.removeListener(_onTextChanged);
    _text.dispose();
    _pollQ.dispose();
    for (final c in _pollOpts) {
      c.dispose();
    }
    _home.dispose();
    _away.dispose();
    _hs.dispose();
    _as.dispose();
    _location.dispose();
    _tagSearch.dispose();
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

  void _removePollOpt(int i) {
    if (_pollOpts.length <= 2) return;
    setState(() {
      _pollOpts[i].dispose();
      _pollOpts.removeAt(i);
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
    List<String> hashtags = List.from(_detectedHashtags);

    if (_mode == _Mode.poll) {
      postType = 'poll';
      final opts = _pollOpts.map((c) => c.text.trim()).where((o) => o.isNotEmpty).toList();
      if (content.isEmpty || opts.length < 2) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Poll needs a question and at least 2 options')),
        );
        return;
      }
      poll = {
        'question': content,
        'options': opts,
        'durationHours': _pollDurationHours,
      };
    } else if (_mode == _Mode.prediction) {
      postType = 'prediction';
      final homeScore = int.tryParse(_hs.text);
      final awayScore = int.tryParse(_as.text);
      if (_home.text.trim().isEmpty || _away.text.trim().isEmpty || homeScore == null || awayScore == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter both teams and scores')),
        );
        return;
      }
      prediction = {
        'homeTeam': _home.text.trim(),
        'awayTeam': _away.text.trim(),
        'predictedHome': homeScore,
        'predictedAway': awayScore,
        'confidence': _confidence,
      };
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
            teamTag: _selectedSport == 'Other' ? null : _selectedSport?.toLowerCase(),
            playerTag: _showTagInput ? _tagSearch.text.trim().isEmpty ? null : _tagSearch.text.trim() : null,
            hashtags: hashtags,
            location: _showLocation ? _location.text.trim().isEmpty ? null : _location.text.trim() : null,
            isBreaking: _isBreaking,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Posted!')),
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
    final auth = ref.watch(authProvider);
    final avatarUrl = auth.user?.avatarUrl;
    final name = auth.user?.name ?? '';
    final handle = auth.user?.handle ?? '';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Column(
      children: [
        // Header
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
              // Composer card
              GlassCard(
                borderRadius: 22,
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // User avatar + text input
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.surfaceElevated,
                          backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                          child: avatarUrl == null || avatarUrl.isEmpty
                              ? Text(initial, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.primary))
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                              Text(
                                handle.startsWith('@') ? handle : '@$handle',
                                style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
                              ),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _mode == _Mode.poll ? _pollQ : _text,
                                maxLines: _mode == _Mode.prediction ? 2 : 5,
                                maxLength: _mode == _Mode.post ? _max : null,
                                style: GoogleFonts.inter(fontSize: 16.5, height: 1.45, letterSpacing: -0.2),
                                decoration: InputDecoration(
                                  hintText: _mode == _Mode.poll
                                      ? 'Ask a question\u2026'
                                      : _mode == _Mode.prediction
                                          ? 'Add a note (optional)\u2026'
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
                            ],
                          ),
                        ),
                      ],
                    ),

                    // Detected hashtags chips
                    if (_detectedHashtags.isNotEmpty && _mode == _Mode.post) ...[
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: _detectedHashtags.map((h) => Chip(
                          label: Text('#$h', style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary)),
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                          side: BorderSide.none,
                          padding: EdgeInsets.zero,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        )).toList(),
                      ),
                    ],

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

                    // Poll options
                    if (_mode == _Mode.poll) ...[
                      const Divider(color: AppColors.border, height: 20),
                      Text('Options', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
                      const SizedBox(height: 8),
                      ...List.generate(_pollOpts.length, (i) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              Expanded(
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
                              ),
                              if (_pollOpts.length > 2)
                                IconButton(
                                  onPressed: () => _removePollOpt(i),
                                  icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.mutedForeground),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                            ],
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
                      // Poll duration picker
                      const SizedBox(height: 4),
                      Text('Duration', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _pollDurations.map((d) {
                          final (hours, label) = d;
                          final selected = _pollDurationHours == hours;
                          return GestureDetector(
                            onTap: () => setState(() => _pollDurationHours = hours),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: selected ? AppColors.primary.withValues(alpha: 0.15) : AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: selected ? AppColors.primary : AppColors.border,
                                ),
                              ),
                              child: Text(
                                label,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: selected ? AppColors.primary : AppColors.mutedForeground,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],

                    // Prediction fields
                    if (_mode == _Mode.prediction) ...[
                      const Divider(color: AppColors.border, height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _home,
                              decoration: InputDecoration(
                                labelText: 'Home Team',
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
                            child: Text('vs', style: GoogleFonts.outfit(fontSize: 16, color: AppColors.mutedForeground, fontWeight: FontWeight.w700)),
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
                                labelText: 'Away Team',
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Confidence', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
                      const SizedBox(height: 6),
                      Row(
                        children: _confidenceLevels.map((level) {
                          final selected = _confidence == level;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _confidence = level),
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: selected
                                      ? (level == 'high'
                                          ? const Color(0xFF22C55E).withValues(alpha: 0.15)
                                          : level == 'medium'
                                              ? AppColors.primary.withValues(alpha: 0.15)
                                              : const Color(0xFFF59E0B).withValues(alpha: 0.15))
                                      : AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: selected
                                        ? (level == 'high'
                                            ? const Color(0xFF22C55E)
                                            : level == 'medium'
                                                ? AppColors.primary
                                                : const Color(0xFFF59E0B))
                                        : AppColors.border,
                                  ),
                                ),
                                child: Text(
                                  level.toUpperCase(),
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: selected
                                        ? (level == 'high'
                                            ? const Color(0xFF22C55E)
                                            : level == 'medium'
                                                ? AppColors.primary
                                                : const Color(0xFFF59E0B))
                                        : AppColors.mutedForeground,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],

                    const SizedBox(height: 12),

                    // Sport tag selector
                    if (_showSportPicker) ...[
                      const Divider(color: AppColors.border, height: 16),
                      Text('Sport', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _sports.map((sport) {
                          final selected = _selectedSport == sport;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedSport = selected ? null : sport),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: selected ? AppColors.primary.withValues(alpha: 0.15) : AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: selected ? AppColors.primary : AppColors.border,
                                ),
                              ),
                              child: Text(
                                sport,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: selected ? AppColors.primary : AppColors.mutedForeground,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],

                    // Player/team tag
                    if (_showTagInput) ...[
                      const Divider(color: AppColors.border, height: 16),
                      TextField(
                        controller: _tagSearch,
                        decoration: InputDecoration(
                          labelText: 'Tag a team or player',
                          hintText: 'e.g. Man United, LeBron James',
                          isDense: true,
                          prefixIcon: const Icon(Icons.tag, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],

                    // Location
                    if (_showLocation) ...[
                      const Divider(color: AppColors.border, height: 16),
                      TextField(
                        controller: _location,
                        decoration: InputDecoration(
                          labelText: 'Location',
                          hintText: 'e.g. Old Trafford, Manchester',
                          isDense: true,
                          prefixIcon: const Icon(Icons.location_on_outlined, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],

                    const SizedBox(height: 10),

                    // Breaking news toggle
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _isBreaking = !_isBreaking),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: _isBreaking ? const Color(0xFFEF4444).withValues(alpha: 0.15) : AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _isBreaking ? const Color(0xFFEF4444) : AppColors.border,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.bolt,
                                  size: 14,
                                  color: _isBreaking ? const Color(0xFFEF4444) : AppColors.mutedForeground,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Breaking',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: _isBreaking ? const Color(0xFFEF4444) : AppColors.mutedForeground,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (_selectedSport != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.sports, size: 12, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Text(_selectedSport!, style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                                GestureDetector(
                                  onTap: () => setState(() => _selectedSport = null),
                                  child: const Icon(Icons.close, size: 12, color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Tool bar: Attach · Poll · Predict · Sport · Tag · Location
                    Row(
                      children: [
                        _Tool(
                          icon: Icons.attach_file_rounded,
                          label: 'Attach',
                          active: _previews.isNotEmpty,
                          onTap: _attach,
                        ),
                        const SizedBox(width: 4),
                        _Tool(
                          icon: Icons.bar_chart_rounded,
                          label: 'Poll',
                          active: _mode == _Mode.poll,
                          onTap: () => setState(() {
                            _mode = _mode == _Mode.poll ? _Mode.post : _Mode.poll;
                          }),
                        ),
                        const SizedBox(width: 4),
                        _Tool(
                          icon: Icons.track_changes_rounded,
                          label: 'Predict',
                          active: _mode == _Mode.prediction,
                          onTap: () => setState(() {
                            _mode = _mode == _Mode.prediction ? _Mode.post : _Mode.prediction;
                          }),
                        ),
                        const SizedBox(width: 4),
                        _Tool(
                          icon: Icons.sports_soccer,
                          label: 'Sport',
                          active: _showSportPicker || _selectedSport != null,
                          onTap: () => setState(() => _showSportPicker = !_showSportPicker),
                        ),
                        const SizedBox(width: 4),
                        _Tool(
                          icon: Icons.tag_rounded,
                          label: 'Tag',
                          active: _showTagInput,
                          onTap: () => setState(() => _showTagInput = !_showTagInput),
                        ),
                        const SizedBox(width: 4),
                        _Tool(
                          icon: Icons.location_on_outlined,
                          label: 'Place',
                          active: _showLocation,
                          onTap: () => setState(() => _showLocation = !_showLocation),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Post button
                    SizedBox(
                      width: double.infinity,
                      child: Material(
                        color: _publishing ? AppColors.mutedForeground : AppColors.primary,
                        borderRadius: BorderRadius.circular(22),
                        child: InkWell(
                          onTap: _publishing ? null : _publish,
                          borderRadius: BorderRadius.circular(22),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if (_publishing)
                                  const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground),
                                  )
                                else
                                  const Icon(Icons.send_rounded, size: 16, color: AppColors.primaryForeground),
                                const SizedBox(width: 8),
                                Text(
                                  _publishing ? 'Posting...' : 'Post',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                    color: AppColors.primaryForeground,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
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
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: active ? AppColors.primary : AppColors.mutedForeground),
              const SizedBox(width: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11.5,
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
