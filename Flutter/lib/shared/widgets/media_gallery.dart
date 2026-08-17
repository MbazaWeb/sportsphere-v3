import 'package:flutter/material.dart';
import '../../core/constants/api_config.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import 'ss_video_player.dart';

/// Responsive media gallery for feed posts.
/// Layout adapts to image/video count:
/// 1 → full-width 16:10, 2 → side-by-side, 3 → 1 large + 2 stacked,
/// 4 → 2×2 grid, 5+ → 2×2 with "+N" overlay on 4th tile.
/// Supports inline video playback for single-media posts.
class MediaGallery extends StatelessWidget {
  const MediaGallery({super.key, required this.imageUrls, this.onTapImage, this.postType});

  final List<String> imageUrls;
  final void Function(int index, String url)? onTapImage;
  final String? postType;

  bool _isVideo(String url) {
    if (postType == 'video' || postType == 'spotlight') return true;
    final lower = url.toLowerCase();
    return lower.contains('.mp4') || lower.contains('.mov') ||
           lower.contains('.avi') || lower.contains('/video');
  }

  @override
  Widget build(BuildContext context) {
    if (imageUrls.isEmpty) return const SizedBox.shrink();
    return switch (imageUrls.length) {
      1 => _buildSingle(context),
      2 => _buildRow(context),
      3 => _buildLargeLeft(context),
      _ => _buildGrid(context),
    };
  }

  // ── Layout builders ────────────────────────────────────────────────

  Widget _buildSingle(BuildContext context) {
    final url = ApiConfig.resolveUrl(imageUrls[0]);
    if (_isVideo(url)) {
      return SsVideoPlayer(
        url: url,
        autoPlay: false,
        muted: true,
        showControls: false,
        borderRadius: 14,
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: AspectRatio(aspectRatio: 16 / 10, child: _imageTile(0, context)),
    );
  }

  Widget _buildRow(BuildContext context) => Row(
        children: List.generate(2, (i) => Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 1.5, right: i == 1 ? 0 : 1.5),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: AspectRatio(aspectRatio: 1, child: _imageTile(i, context)),
            ),
          ),
        )),
      );

  Widget _buildLargeLeft(BuildContext context) => Row(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 1.5),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: AspectRatio(aspectRatio: 1, child: _imageTile(0, context)),
              ),
            ),
          ),
          Expanded(
            child: Column(
              children: List.generate(2, (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(left: 1.5, bottom: i == 0 ? 1.5 : 0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: _imageTile(i + 1, context),
                  ),
                ),
              )),
            ),
          ),
        ],
      );

  Widget _buildGrid(BuildContext context) {
    final hasMore = imageUrls.length > 4;
    final remaining = imageUrls.length - 4;
    return Column(
      children: List.generate(2, (row) => Expanded(
        child: Row(
          children: List.generate(2, (col) {
            final idx = row * 2 + col;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(left: col == 0 ? 0 : 3, top: row == 0 ? 0 : 3),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Stack(fit: StackFit.expand, children: [
                    _imageTile(idx, context),
                    if (hasMore && idx == 3)
                      Container(
                        color: AppColors.background.withValues(alpha: 0.7),
                        child: Center(
                          child: Text('+$remaining',
                              style: GoogleFonts.inter(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.foreground)),
                        ),
                      ),
                  ]),
                ),
              ),
            );
          }),
        ),
      )),
    );
  }

  // ── Image tile ──────────────────────────────────────────────────────

  Widget _imageTile(int index, BuildContext context) {
    if (index >= imageUrls.length) return Container(color: AppColors.surface);
    final url = ApiConfig.resolveUrl(imageUrls[index]);

    // For grid tiles, we show a play icon if it's a video but not the player itself
    final isVid = _isVideo(url);

    return GestureDetector(
      onTap: () {
        if (isVid) {
          SsVideoPage.open(context, url);
        } else {
          onTapImage?.call(index, url);
          showViewer(context, imageUrls, initialIndex: index);
        }
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(url, fit: BoxFit.cover,
              loadingBuilder: (_, child, progress) =>
                  progress == null ? child : Container(color: AppColors.surface),
              errorBuilder: (_, __, ___) => Container(
                  color: AppColors.surface,
                  child: Icon(isVid ? Icons.videocam_rounded : Icons.broken_image_rounded,
                      color: AppColors.mutedForeground, size: 32))),
          if (isVid)
            Center(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 24),
              ),
            ),
        ],
      ),
    );
  }

  // ── Full-screen viewer ────────────────────────────────────────────

  static void showViewer(BuildContext context, List<String> urls, {int initialIndex = 0}) {
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierDismissible: true,
      pageBuilder: (_, __, ___) => _FullScreenViewer(urls: urls, initialIndex: initialIndex),
      transitionsBuilder: (_, animation, __, child) => FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: child,
      ),
    ));
  }
}

// ── Full-screen page viewer ─────────────────────────────────────────

class _FullScreenViewer extends StatefulWidget {
  const _FullScreenViewer({required this.urls, this.initialIndex = 0});
  final List<String> urls;
  final int initialIndex;

  @override
  State<_FullScreenViewer> createState() => _FullScreenViewerState();
}

class _FullScreenViewerState extends State<_FullScreenViewer> {
  late final PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  bool _isVideo(String url) {
    final lower = url.toLowerCase();
    return lower.contains('.mp4') || lower.contains('.mov') ||
           lower.contains('.avi') || lower.contains('/video');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background.withValues(alpha: 0.97),
      body: Stack(children: [
        PageView.builder(
          controller: _pageController,
          onPageChanged: (i) => setState(() => _currentIndex = i),
          itemCount: widget.urls.length,
          itemBuilder: (_, index) {
            final url = ApiConfig.resolveUrl(widget.urls[index]);
            if (_isVideo(url)) {
              return Center(
                child: SsVideoPlayer(
                  url: url,
                  autoPlay: true,
                  muted: false,
                  showControls: true,
                ),
              );
            }
            return Center(
              child: Image.network(
                    url,
                    fit: BoxFit.contain,
                  loadingBuilder: (_, child, progress) => progress == null
                      ? child
                      : const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                  errorBuilder: (_, __, ___) => Icon(Icons.broken_image_rounded,
                      color: AppColors.mutedForeground, size: 48)),
            );
          },
        ),
        // Close button
        Positioned(
          top: 48,
          right: 16,
          child: GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.foreground.withValues(alpha: 0.15)),
              padding: const EdgeInsets.all(8),
              child: const Icon(Icons.close_rounded, color: AppColors.foreground, size: 24),
            ),
          ),
        ),
        // Page indicator dots
        if (widget.urls.length > 1)
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.urls.length, (i) {
                final active = i == _currentIndex;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: active ? 8 : 6,
                  height: active ? 8 : 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: active
                        ? AppColors.primary
                        : AppColors.foreground.withValues(alpha: 0.4),
                  ),
                );
              }),
            ),
          ),
      ]),
    );
  }
}
