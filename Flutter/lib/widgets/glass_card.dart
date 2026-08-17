import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

// ─── Ultra-HD Glass Card — iPhone 17 feel ────────────────────────────────────
// Layered frosted glass with specular top rim, micro spring on press,
// optional gold glow for featured/hero cards.
class GlassCard extends StatefulWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.borderRadius = 20,
    this.onTap,
    this.enableHover = true,
    this.glow = false,
    this.borderColor,
    this.blur = 24,
    this.opacity = 0.07,
    this.goldAccent = false,
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
  final bool goldAccent; // thin gold top rim for hero cards

  @override
  State<GlassCard> createState() => _GlassCardState();
}

class _GlassCardState extends State<GlassCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _spring;
  late final Animation<double> _scale;
  bool _pressed = false;
  bool _hovered = false;

  @override
  void initState() {
    super.initState();
    _spring = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      reverseDuration: const Duration(milliseconds: 300),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.975).animate(
      CurvedAnimation(parent: _spring, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _spring.dispose();
    super.dispose();
  }

  void _onTapDown(_) {
    if (widget.onTap == null) return;
    setState(() => _pressed = true);
    _spring.forward();
  }

  void _onTapUp(_) {
    _spring.reverse();
    setState(() => _pressed = false);
    widget.onTap?.call();
  }

  void _onTapCancel() {
    _spring.reverse();
    setState(() => _pressed = false);
  }

  @override
  Widget build(BuildContext context) {
    final reduced = MediaQuery.disableAnimationsOf(context);
    final hover = widget.enableHover && _hovered;
    final border = widget.borderColor ??
        (widget.goldAccent
            ? AppColors.primary.withValues(alpha: 0.25)
            : Colors.white.withValues(alpha: hover ? 0.13 : 0.08));

    Widget card = AnimatedContainer(
      duration: reduced ? Duration.zero : const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(widget.borderRadius),
        boxShadow: [
          // Deep shadow
          BoxShadow(
            color: Colors.black.withValues(alpha: hover ? 0.50 : 0.38),
            blurRadius: hover ? 36 : 24,
            offset: Offset(0, hover ? 14 : 8),
            spreadRadius: -6,
          ),
          // Soft ambient
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
          if (widget.glow || hover)
            BoxShadow(
              color: AppColors.primary.withValues(alpha: hover ? 0.12 : 0.07),
              blurRadius: 28,
              spreadRadius: -2,
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(widget.borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: widget.blur,
            sigmaY: widget.blur,
          ),
          child: AnimatedContainer(
            duration: reduced ? Duration.zero : const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(widget.borderRadius),
              color: Colors.white.withValues(
                alpha: hover ? widget.opacity + 0.03 : widget.opacity,
              ),
              border: Border.all(width: 0.75, color: border),
            ),
            child: Stack(
              children: [
                // Top specular line — iOS liquid glass effect
                Positioned(
                  top: 0,
                  left: 16,
                  right: 16,
                  height: 0.75,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.white.withValues(alpha: 0),
                          Colors.white.withValues(
                              alpha: widget.goldAccent ? 0.35 : 0.22),
                          Colors.white.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ),
                // Gold top accent strip for hero cards
                if (widget.goldAccent)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(widget.borderRadius),
                          topRight: Radius.circular(widget.borderRadius),
                        ),
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFFF5C518),
                            Color(0xFFFF6B35),
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
    );

    if (widget.margin != null) {
      card = Padding(padding: widget.margin!, child: card);
    }

    return MouseRegion(
      onEnter: (_) { if (widget.enableHover) setState(() => _hovered = true); },
      onExit: (_) => setState(() => _hovered = false),
      cursor: widget.onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        child: reduced
            ? card
            : ScaleTransition(scale: _scale, child: card),
      ),
    );
  }
}

/// Staggered entrance — slide + fade + scale from below.
class AnimatedGlassCard extends StatefulWidget {
  const AnimatedGlassCard({
    super.key,
    required this.child,
    this.index = 0,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 20,
    this.onTap,
    this.glow = false,
    this.goldAccent = false,
  });

  final Widget child;
  final int index;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool glow;
  final bool goldAccent;

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
    final delayMs = (widget.index * 45).clamp(0, 320);
    _c = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 480));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (MediaQuery.disableAnimationsOf(context)) { _c.value = 1.0; return; }
    });
    final curved = CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);
    _opacity = Tween<double>(begin: 0, end: 1).animate(curved);
    _scale = Tween<double>(begin: 0.97, end: 1.0).animate(curved);
    _slide = Tween<Offset>(
            begin: const Offset(0, 0.03), end: Offset.zero)
        .animate(curved);
    Future.delayed(Duration(milliseconds: delayMs), () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() { _c.dispose(); super.dispose(); }

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
            goldAccent: widget.goldAccent,
            enableHover: true,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

/// Ultra-HD gold pill button with spring press + glow
class GoldButton extends StatefulWidget {
  const GoldButton({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.small = false,
    this.outlined = false,
    this.loading = false,
  });
  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final bool small;
  final bool outlined;
  final bool loading;

  @override
  State<GoldButton> createState() => _GoldButtonState();
}

class _GoldButtonState extends State<GoldButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 100),
        reverseDuration: const Duration(milliseconds: 250));
    _scale = Tween<double>(begin: 1.0, end: 0.96)
        .animate(CurvedAnimation(parent: _c, curve: Curves.easeIn));
  }

  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final h = widget.small ? 36.0 : 44.0;
    final fs = widget.small ? 12.0 : 14.0;
    final px = widget.small ? 14.0 : 20.0;

    return GestureDetector(
      onTapDown: (_) => _c.forward(),
      onTapUp: (_) { _c.reverse(); widget.onTap(); },
      onTapCancel: () => _c.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          height: h,
          padding: EdgeInsets.symmetric(horizontal: px),
          decoration: BoxDecoration(
            gradient: widget.outlined
                ? null
                : const LinearGradient(
                    colors: [Color(0xFFF5C518), Color(0xFFFFD700)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
            borderRadius: BorderRadius.circular(h / 2),
            border: widget.outlined
                ? Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 1.5)
                : null,
            boxShadow: widget.outlined
                ? null
                : [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.loading)
                SizedBox(width: fs, height: fs, child: const CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground))
              else ...[
                if (widget.icon != null) ...[
                  Icon(widget.icon, size: fs + 2, color: widget.outlined ? AppColors.primary : AppColors.primaryForeground),
                  const SizedBox(width: 6),
                ],
                Text(widget.label, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w800, color: widget.outlined ? AppColors.primary : AppColors.primaryForeground, letterSpacing: -0.2)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Sport tag chip — gold on dark glass
class SportChip extends StatelessWidget {
  const SportChip({super.key, required this.label, this.selected = false, this.onTap, this.emoji});
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final String? emoji;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: 0.18) : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.08),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (emoji != null) ...[Text(emoji!, style: const TextStyle(fontSize: 12)), const SizedBox(width: 4)],
            Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? AppColors.primary : AppColors.mutedForeground)),
          ],
        ),
      ),
    );
  }
}
