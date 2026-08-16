import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Glass card — soft depth, NO full-section gold on hover/press.
class GlassCard extends StatefulWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.borderRadius = 18,
    this.onTap,
    this.enableHover = true,
    this.glow = false,
    this.borderColor,
    this.blur = 20,
    this.opacity = 0.06,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool enableHover;
  final bool glow;
  final Color? borderColor;
  final double blur;
  final double opacity;

  @override
  State<GlassCard> createState() => _GlassCardState();
}

class _GlassCardState extends State<GlassCard> {
  bool _hovered = false;
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final hover = widget.enableHover && _hovered;
    final pressed = _pressed;
    final reduce = MediaQuery.disableAnimationsOf(context);
    final anim = reduce ? Duration.zero : const Duration(milliseconds: 180);
    final animFast = reduce ? Duration.zero : const Duration(milliseconds: 140);

    // Subtle only — never flood the card with gold
    final border = widget.borderColor ??
        Colors.white.withValues(alpha: hover ? 0.14 : 0.08);

    return Padding(
      padding: widget.margin ?? EdgeInsets.zero,
      child: MouseRegion(
        onEnter: (_) {
          if (widget.enableHover) setState(() => _hovered = true);
        },
        onExit: (_) => setState(() => _hovered = false),
        cursor: widget.onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: widget.onTap != null ? (_) => setState(() => _pressed = true) : null,
          onTapUp: widget.onTap != null
              ? (_) {
                  setState(() => _pressed = false);
                  widget.onTap?.call();
                }
              : null,
          onTapCancel: () => setState(() => _pressed = false),
          child: AnimatedScale(
            scale: pressed ? 0.99 : 1.0,
            duration: animFast,
            curve: Curves.easeOut,
            child: AnimatedContainer(
              duration: anim,
              curve: Curves.easeOut,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(widget.borderRadius),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: hover ? 0.38 : 0.28),
                    blurRadius: hover ? 28 : 22,
                    offset: Offset(0, hover ? 10 : 8),
                    spreadRadius: -4,
                  ),
                  // Optional soft gold rim ONLY if glow=true (e.g. featured)
                  if (widget.glow)
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      blurRadius: 20,
                      spreadRadius: 0,
                    ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(widget.borderRadius),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: widget.blur, sigmaY: widget.blur),
                  child: AnimatedContainer(
                    duration: anim,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(widget.borderRadius),
                      // Stay glass/dark — slight white lift on hover, NOT gold fill
                      color: Colors.white.withValues(
                        alpha: hover ? widget.opacity + 0.025 : widget.opacity,
                      ),
                      border: Border.all(width: 1, color: border),
                    ),
                    child: Stack(
                      children: [
                        // Thin top specular line (iOS glass) — white, not gold
                        Positioned(
                          top: 0,
                          left: 12,
                          right: 12,
                          height: 1,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.white.withValues(alpha: 0),
                                  Colors.white.withValues(alpha: 0.18),
                                  Colors.white.withValues(alpha: 0),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: widget.padding,
                          child: widget.child,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Staggered entrance for feed posts.
class AnimatedGlassCard extends StatefulWidget {
  const AnimatedGlassCard({
    super.key,
    required this.child,
    this.index = 0,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 18,
    this.onTap,
    this.glow = false,
  });

  final Widget child;
  final int index;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool glow;

  @override
  State<AnimatedGlassCard> createState() => _AnimatedGlassCardState();
}

class _AnimatedGlassCardState extends State<AnimatedGlassCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _opacity;
  late final Animation<double> _scale;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    final delayMs = (widget.index * 55).clamp(0, 400);
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 520));
    // If reduced motion, snap to end on first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (MediaQuery.disableAnimationsOf(context)) {
        _c.value = 1.0;
      }
    });
    final curved = CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);
    _opacity = Tween<double>(begin: 0, end: 1).animate(curved);
    _scale = Tween<double>(begin: 0.96, end: 1.0).animate(curved);
    _slide = Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero).animate(curved);
    Future.delayed(Duration(milliseconds: delayMs), () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: ScaleTransition(
          scale: _scale,
          child: GlassCard(
            padding: widget.padding,
            borderRadius: widget.borderRadius,
            onTap: widget.onTap,
            glow: widget.glow,
            enableHover: true,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
