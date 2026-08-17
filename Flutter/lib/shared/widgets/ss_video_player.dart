import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../../theme/app_colors.dart';

// ─── SportSphere Video Player ─────────────────────────────────────────────────
// Gold-themed, full-featured video player using video_player + chewie.
// Used in feed cards, spotlights, and full-screen viewer.
//
// Features:
//   - Auto-plays when visible (via VisibilityDetector or manual trigger)
//   - Muted by default in feed, unmuted in full-screen
//   - Gold progress bar + controls
//   - Thumbnail (poster) shown before play
//   - Duration badge
//   - Tap to play/pause
//   - Full-screen mode
//   - Error state with retry

class SsVideoPlayer extends StatefulWidget {
  const SsVideoPlayer({
    super.key,
    required this.url,
    this.thumbnailUrl,
    this.autoPlay = false,
    this.muted = true,
    this.looping = false,
    this.showControls = true,
    this.aspectRatio = 16 / 9,
    this.borderRadius = 14.0,
  });

  final String url;
  final String? thumbnailUrl;
  final bool autoPlay;
  final bool muted;
  final bool looping;
  final bool showControls;
  final double aspectRatio;
  final double borderRadius;

  @override
  State<SsVideoPlayer> createState() => _SsVideoPlayerState();
}

class _SsVideoPlayerState extends State<SsVideoPlayer>
    with AutomaticKeepAliveClientMixin {
  VideoPlayerController? _controller;
  ChewieController? _chewieController;
  bool _initialized = false;
  bool _error = false;
  bool _started = false; // user tapped play at least once

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    if (widget.autoPlay) _init();
  }

  Future<void> _init() async {
    try {
      final uri = Uri.parse(widget.url);
      _controller = VideoPlayerController.networkUrl(uri);
      await _controller!.initialize();
      if (!mounted) return;

      _chewieController = ChewieController(
        videoPlayerController: _controller!,
        autoPlay: widget.autoPlay,
        looping: widget.looping,
        startAt: Duration.zero,
        showControls: widget.showControls,
        allowFullScreen: true,
        allowMuting: true,
        showOptions: false,
        aspectRatio: widget.aspectRatio,
        materialProgressColors: ChewieProgressColors(
          playedColor: AppColors.primary,
          handleColor: AppColors.primary,
          backgroundColor: Colors.white.withValues(alpha: 0.15),
          bufferedColor: AppColors.primary.withValues(alpha: 0.35),
        ),
        placeholder: widget.thumbnailUrl != null
            ? Image.network(widget.thumbnailUrl!, fit: BoxFit.cover)
            : const _VideoPlaceholder(),
        autoInitialize: true,
        errorBuilder: (context, errorMessage) => _ErrorView(
          onRetry: () { setState(() { _error = false; _initialized = false; }); _init(); },
        ),
      );

      if (widget.muted) _controller!.setVolume(0);

      setState(() { _initialized = true; _started = true; });
    } catch (e) {
      if (mounted) setState(() { _error = true; });
    }
  }

  void _onTapPlay() {
    if (!_started) {
      _init();
    } else if (_controller != null) {
      if (_controller!.value.isPlaying) {
        _controller!.pause();
      } else {
        _controller!.play();
      }
      setState(() {});
    }
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: AspectRatio(
        aspectRatio: widget.aspectRatio,
        child: _error
            ? _ErrorView(onRetry: () { setState(() => _error = false); _init(); })
            : _initialized && _chewieController != null
                ? Chewie(controller: _chewieController!)
                : _ThumbnailOverlay(
                    thumbnailUrl: widget.thumbnailUrl,
                    loading: _started && !_initialized,
                    onTap: _onTapPlay,
                  ),
      ),
    );
  }
}

// ─── Thumbnail + play button overlay (before initialized) ─────────────────────
class _ThumbnailOverlay extends StatelessWidget {
  const _ThumbnailOverlay({this.thumbnailUrl, required this.loading, required this.onTap});
  final String? thumbnailUrl;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Thumbnail / dark bg
          if (thumbnailUrl != null && thumbnailUrl!.isNotEmpty)
            Image.network(thumbnailUrl!, fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const _VideoPlaceholder())
          else
            const _VideoPlaceholder(),

          // Scrim
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black.withValues(alpha: 0.15), Colors.black.withValues(alpha: 0.5)],
              ),
            ),
          ),

          // Play button
          Center(
            child: loading
                ? const SizedBox(
                    width: 52, height: 52,
                    child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
                  )
                : Container(
                    width: 58, height: 58,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.45),
                          blurRadius: 20, spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.play_arrow_rounded,
                        size: 30, color: AppColors.primaryForeground),
                  ),
          ),

          // VIDEO badge
          Positioned(
            bottom: 8, right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.videocam_rounded, size: 11, color: Colors.white70),
                  const SizedBox(width: 3),
                  Text('VIDEO',
                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white70)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Dark placeholder when no thumbnail ───────────────────────────────────────
class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder();

  @override
  Widget build(BuildContext context) => Container(
    color: const Color(0xFF0A1628),
    child: Center(
      child: Icon(Icons.movie_outlined, size: 48,
          color: Colors.white.withValues(alpha: 0.15)),
    ),
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Container(
    color: const Color(0xFF0A1628),
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline_rounded, size: 32,
              color: Colors.white.withValues(alpha: 0.4)),
          const SizedBox(height: 8),
          Text('Could not load video',
              style: GoogleFonts.inter(fontSize: 13, color: Colors.white54)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
              ),
              child: Text('Retry',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700,
                      color: AppColors.primary)),
            ),
          ),
        ],
      ),
    ),
  );
}

// ─── Full-screen video page ───────────────────────────────────────────────────
class SsVideoPage extends StatefulWidget {
  const SsVideoPage({super.key, required this.url, this.thumbnailUrl});
  final String url;
  final String? thumbnailUrl;

  static Future<void> open(BuildContext context, String url, {String? thumbnailUrl}) {
    return Navigator.of(context).push(PageRouteBuilder(
      opaque: true,
      barrierColor: Colors.black,
      pageBuilder: (_, __, ___) => SsVideoPage(url: url, thumbnailUrl: thumbnailUrl),
      transitionsBuilder: (_, animation, __, child) => FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: child,
      ),
    ));
  }

  @override
  State<SsVideoPage> createState() => _SsVideoPageState();
}

class _SsVideoPageState extends State<SsVideoPage> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: SsVideoPlayer(
              url: widget.url,
              thumbnailUrl: widget.thumbnailUrl,
              autoPlay: true,
              muted: false,
              showControls: true,
              borderRadius: 0,
            ),
          ),
          Positioned(
            top: 48, left: 16,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 38, height: 38,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
