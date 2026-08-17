import 'package:flutter/material.dart';
import '../../core/constants/api_config.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

/// Responsive media gallery for feed posts.
/// Layout adapts to image count:
/// 1 → full-width 16:10, 2 → side-by-side, 3 → 1 large + 2 stacked,
/// 4 → 2×2 grid, 5+ → 2×2 with "+N" overlay on 4th tile.
class MediaGallery extends StatelessWidget {
  const MediaGallery({super.key, required this.imageUrls, this.onTapImage});

  final List<String> imageUrls;
  final void Function(int index, String url)? onTapImage;

  @override
  Widget build(BuildContext context) {
    if (imageUrls.isEmpty) return const SizedBox.shrink();
    return switch (imageUrls.length) {
      1 => _buildSingle(),
      2 => _buildRow(),
      3 => _buildLargeLeft(),
      _ => _buildGrid(),
    };
  }

  // ── Layout builders ────────────────────────────────────────────────

  Widget _buildSingle() => ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(aspectRatio: 16 / 10, child: _imageTile(0)),
      );

  Widget _buildRow() => Row(
        children: List.generate(2, (i) => Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 1.5, right: i == 1 ? 0 : 1.5),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: AspectRatio(aspectRatio: 1, child: _imageTile(i)),
            ),
          ),
        )),
      );

  Widget _buildLargeLeft() => Row(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 1.5),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: AspectRatio(aspectRatio: 1, child: _imageTile(0)),
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
                    child: _imageTile(i + 1),
                  ),
                ),
              )),
            ),
          ),
        ],
      );

  Widget _buildGrid() {
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
                    _imageTile(idx),
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

  Widget _imageTile(int index) {
    if (index >= imageUrls.length) return Container(color: AppColors.surface);
    final raw = imageUrls[index];
    // Resolve relative URLs using the configured base URL
    final url = (raw.startsWith('http://') || raw.startsWith('https://'))
        ? raw
        : '${ApiConfig.baseUrl}$raw';
    return GestureDetector(
      onTap: () {
        onTapImage?.call(index, url);
        showViewer(context, imageUrls, initialIndex: index);
      },
      child: Image.network(url, fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) =>
              progress == null ? child : Container(color: AppColors.surface),
          errorBuilder: (_, __, ___) => Container(
              color: AppColors.surface,
              child:
                  Icon(Icons.broken_image_rounded, color: AppColors.mutedForeground, size: 32))),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background.withValues(alpha: 0.97),
      body: Stack(children: [
        PageView.builder(
          controller: _pageController,
          onPageChanged: (i) => setState(() => _currentIndex = i),
          itemCount: widget.urls.length,
          itemBuilder: (_, index) => Center(
            child: Image.network(
                  (widget.urls[index].startsWith('http://') || widget.urls[index].startsWith('https://'))
                      ? widget.urls[index]
                      : '${ApiConfig.baseUrl}${widget.urls[index]}',
                  fit: BoxFit.contain,
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                errorBuilder: (_, __, ___) => Icon(Icons.broken_image_rounded,
                    color: AppColors.mutedForeground, size: 48)),
          ),
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
