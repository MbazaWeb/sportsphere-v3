import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';
import '../../../theme/app_colors.dart';

// ─── Video Trimmer Sheet ───────────────────────────────────────────────────────
// Drag start/end handles to trim video before posting.
// Matches web VideoTrimmer.tsx feature set.
class VideoTrimmerSheet extends StatefulWidget {
  const VideoTrimmerSheet({super.key, required this.file, required this.onSave, this.onCancel});
  final File file;
  final ValueChanged<File> onSave; // returns original file (trimming is server-side)
  final VoidCallback? onCancel;

  static Future<File?> open(BuildContext context, File file) async {
    File? result;
    await showModalBottomSheet(
      context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
      builder: (_) => VideoTrimmerSheet(file: file,
        onSave: (f) { result = f; Navigator.pop(context); },
        onCancel: () => Navigator.pop(context)),
    );
    return result;
  }

  @override
  State<VideoTrimmerSheet> createState() => _VideoTrimmerSheetState();
}

class _VideoTrimmerSheetState extends State<VideoTrimmerSheet> {
  VideoPlayerController? _ctrl;
  bool _initialized = false;
  double _start = 0.0; // 0.0 to 1.0
  double _end = 1.0;
  bool _playing = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    _ctrl = VideoPlayerController.file(widget.file);
    await _ctrl!.initialize();
    _ctrl!.addListener(_onVideoUpdate);
    if (mounted) setState(() => _initialized = true);
  }

  void _onVideoUpdate() {
    if (!mounted || !_initialized) return;
    final pos = _ctrl!.value.position.inMilliseconds;
    final dur = _ctrl!.value.duration.inMilliseconds;
    if (dur == 0) return;
    final pct = pos / dur;
    if (pct >= _end) {
      _ctrl!.pause();
      _ctrl!.seekTo(Duration(milliseconds: (_start * dur).round()));
      setState(() => _playing = false);
    }
    setState(() {});
  }

  @override
  void dispose() {
    _ctrl?.removeListener(_onVideoUpdate);
    _ctrl?.dispose();
    super.dispose();
  }

  Duration get _duration => _ctrl?.value.duration ?? Duration.zero;
  Duration get _startDur => Duration(milliseconds: (_start * _duration.inMilliseconds).round());
  Duration get _endDur => Duration(milliseconds: (_end * _duration.inMilliseconds).round());
  Duration get _trimDur => _endDur - _startDur;

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  void _togglePlay() {
    if (!_initialized) return;
    if (_playing) {
      _ctrl!.pause();
    } else {
      final pos = _ctrl!.value.position.inMilliseconds / _duration.inMilliseconds;
      if (pos >= _end || pos < _start) {
        _ctrl!.seekTo(_startDur);
      }
      _ctrl!.play();
    }
    setState(() => _playing = !_playing);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(color: const Color(0xFF080F1A), borderRadius: const BorderRadius.vertical(top: Radius.circular(24)), border: Border.all(color: Colors.white12)),
      child: Column(children: [
        Padding(padding: const EdgeInsets.fromLTRB(16,12,16,0), child: Column(children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
          const SizedBox(height: 12),
          Row(children: [
            GestureDetector(onTap: widget.onCancel, child: Text('Cancel', style: GoogleFonts.inter(fontSize: 14, color: AppColors.mutedForeground))),
            const Spacer(),
            Text('Trim Video', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800)),
            const Spacer(),
            GestureDetector(
              onTap: () => widget.onSave(widget.file),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
                child: Text('Use Clip', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.black)),
              ),
            ),
          ]),
        ])),
        const SizedBox(height: 12),

        // Video preview
        Expanded(
          child: _initialized
            ? AspectRatio(aspectRatio: _ctrl!.value.aspectRatio, child: VideoPlayer(_ctrl!))
            : const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
        ),
        const SizedBox(height: 16),

        // Play / pause + time
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          GestureDetector(
            onTap: _togglePlay,
            child: Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: Icon(_playing ? Icons.pause_rounded : Icons.play_arrow_rounded, color: Colors.black, size: 24)),
          ),
          const SizedBox(width: 16),
          Text('${_fmt(_startDur)} – ${_fmt(_endDur)}  (${_fmt(_trimDur)})',
            style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 16),

        // Trim rail
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(children: [
            Text('Drag handles to trim', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
            const SizedBox(height: 8),
            _TrimRail(
              start: _start, end: _end,
              progress: _initialized ? (_ctrl!.value.position.inMilliseconds / _duration.inMilliseconds).clamp(0.0, 1.0) : 0.0,
              onStartChanged: (v) => setState(() => _start = v.clamp(0.0, _end - 0.05)),
              onEndChanged: (v) => setState(() => _end = v.clamp(_start + 0.05, 1.0)),
            ),
          ]),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }
}

// ─── Trim rail with draggable handles ─────────────────────────────────────────
class _TrimRail extends StatelessWidget {
  const _TrimRail({required this.start, required this.end, required this.progress, required this.onStartChanged, required this.onEndChanged});
  final double start, end, progress;
  final ValueChanged<double> onStartChanged, onEndChanged;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final w = constraints.maxWidth;
      return SizedBox(
        height: 48,
        child: Stack(children: [
          // Track background
          Positioned(top: 16, left: 0, right: 0, height: 16,
            child: Container(decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8)))),
          // Selected region
          Positioned(top: 16, left: start * w, width: (end - start) * w, height: 16,
            child: Container(color: AppColors.primary.withValues(alpha: 0.35))),
          // Playhead
          Positioned(top: 10, left: (progress * w) - 1, width: 2, height: 28,
            child: Container(color: Colors.white, decoration: BoxDecoration(borderRadius: BorderRadius.circular(1)))),
          // Start handle
          Positioned(top: 4, left: start * w - 12, width: 24, height: 40,
            child: GestureDetector(
              onHorizontalDragUpdate: (d) => onStartChanged(start + d.delta.dx / w),
              child: Container(decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(6)),
                child: const Icon(Icons.chevron_right, size: 18, color: Colors.black)),
            )),
          // End handle
          Positioned(top: 4, left: end * w - 12, width: 24, height: 40,
            child: GestureDetector(
              onHorizontalDragUpdate: (d) => onEndChanged(end + d.delta.dx / w),
              child: Container(decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(6)),
                child: const Icon(Icons.chevron_left, size: 18, color: Colors.black)),
            )),
        ]),
      );
    });
  }
}
