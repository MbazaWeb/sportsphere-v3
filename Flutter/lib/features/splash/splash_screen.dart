import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 1:1 port of SplashScreen.tsx — Stack layout (no Column overflow).
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.onDone});
  final VoidCallback onDone;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  static const _words = [
    'Player', 'Sport', 'Game', 'Team', 'Community',
    'Competition', 'Content', 'Reputation', 'Opportunities',
  ];

  late final AnimationController _progressCtrl;
  late final AnimationController _fadeOutCtrl;
  late final AnimationController _spinCtrl;
  late final AnimationController _shimmerCtrl;
  late final AnimationController _wordGlowCtrl;
  late final AnimationController _taglineCtrl;
  late final AnimationController _logoEnterCtrl;

  late final Animation<double> _progressAnim;
  late final Animation<double> _logoOpacity;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoDy;

  int _wordIndex = -1;
  bool _wordVisible = false;
  int _pct = 0;

  @override
  void initState() {
    super.initState();

    // 9 words × ~700ms readable = ~6.3s progress; total splash ~7.5s
    // LINEAR progress so % and words stay in sync (no ease skipping words).
    _progressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 6300),
    );
    _progressAnim = CurvedAnimation(
      parent: _progressCtrl,
      curve: Curves.linear, // sync with equal word slots
    )..addListener(_onProgressTick);

    _logoEnterCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _logoEnterCtrl, curve: const Interval(0, 0.75)),
    );
    // Premium entrance: scale up from depth + soft settle
    _logoScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.55, end: 1.06)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 70,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.06, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 30,
      ),
    ]).animate(_logoEnterCtrl);
    _logoDy = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 36.0, end: -4.0)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 70,
      ),
      TweenSequenceItem(
        tween: Tween(begin: -4.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 30,
      ),
    ]).animate(_logoEnterCtrl);

    _spinCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat();

    _shimmerCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _wordGlowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _taglineCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeOutCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    () async {
      final p = await SharedPreferences.getInstance();
      final reduce = p.getBool('ss_reducedMotion') ?? false;
      if (reduce && mounted) {
        _progressCtrl.value = 1.0;
        _pct = 100;
        _wordIndex = _words.length - 1;
        _wordVisible = true;
        // short settle then done
        await Future.delayed(const Duration(milliseconds: 400));
        if (mounted) _fadeOutCtrl.forward().then((_) => widget.onDone());
        return;
      }
      _progressCtrl.forward();
    }();
    _logoEnterCtrl.forward();
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _taglineCtrl.forward();
    });
    // Exit after progress reaches 100% and last word has been readable
    Future.delayed(const Duration(milliseconds: 6800), () {
      if (mounted) _fadeOutCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 7600), () {
      if (mounted) widget.onDone();
    });
  }


  /// Progress % and words share the same linear clock.
  /// AnimatedSwitcher handles smooth crossfade — no stacking delays.
  void _onProgressTick() {
    final p = _progressAnim.value * 100;
    final pct = p.round().clamp(0, 100);
    final idx = p >= 99.5
        ? _words.length - 1
        : (p / 100 * _words.length).floor().clamp(0, _words.length - 1);

    if (pct != _pct || idx != _wordIndex) {
      setState(() {
        _pct = pct;
        if (idx != _wordIndex) {
          _wordIndex = idx;
          _wordVisible = true;
        } else if (_wordIndex < 0 && p > 0.5) {
          _wordIndex = 0;
          _wordVisible = true;
        }
      });
    }
  }

  @override
  void dispose() {
    _progressCtrl.dispose();
    _fadeOutCtrl.dispose();
    _spinCtrl.dispose();
    _shimmerCtrl.dispose();
    _wordGlowCtrl.dispose();
    _taglineCtrl.dispose();
    _logoEnterCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final pad = MediaQuery.paddingOf(context);

    return AnimatedBuilder(
      animation: Listenable.merge([
        _progressAnim,
        _fadeOutCtrl,
        _logoEnterCtrl,
        _spinCtrl,
        _shimmerCtrl,
        _wordGlowCtrl,
        _taglineCtrl,
      ]),
      builder: (context, _) {
        final exitT = _fadeOutCtrl.value;

        // Full-screen Stack — mirrors fixed inset:0 on web. Never overflows.
        // Exit: fade + push into depth (subtle 3D)
        final exitMatrix = Matrix4.identity()
          ..setEntry(3, 2, 0.001) // perspective
          ..rotateX(-0.12 * exitT) // slight tilt away
          ..scale(1.0 + exitT * 0.08, 1.0 + exitT * 0.08);

        return Opacity(
          opacity: 1.0 - exitT,
          child: Transform(
            alignment: Alignment.center,
            transform: exitMatrix,
            child: SizedBox(
              width: size.width,
              height: size.height,
              child: DecoratedBox(
                decoration: const BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(0, -0.2),
                    radius: 1.15,
                    colors: [
                      Color(0xFF0F1D3A),
                      Color(0xFF0A1628),
                      Color(0xFF030812),
                    ],
                    stops: [0.0, 0.5, 1.0],
                  ),
                ),
                child: Stack(
                  clipBehavior: Clip.hardEdge,
                  children: [
                    // Ambient orbs
                    Positioned(
                      top: size.height * 0.15,
                      left: size.width * 0.10,
                      child: _Orb(
                        size: 200,
                        color: const Color(0xFFF5C518).withValues(alpha: 0.08),
                      ),
                    ),
                    Positioned(
                      bottom: size.height * 0.20,
                      right: size.width * 0.08,
                      child: _Orb(
                        size: 160,
                        color: const Color(0xFF38BDF8).withValues(alpha: 0.06),
                      ),
                    ),

                    // Watermark S
                    Positioned.fill(
                      child: IgnorePointer(
                        child: Center(
                          child: Text(
                            'S',
                            style: TextStyle(
                              fontSize: size.width * 0.35,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic,
                              color: const Color(0xFFF5C518)
                                  .withValues(alpha: 0.03),
                              height: 1,
                              letterSpacing: -20,
                              decoration: TextDecoration.none,
                            ),
                          ),
                        ),
                      ),
                    ),

                    // CENTER BLOCK: logo + word + progress (like web flex center)
                    Positioned.fill(
                      child: Padding(
                        padding: EdgeInsets.only(
                          top: pad.top,
                          bottom: pad.bottom + size.height * 0.12,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Logo — width 45% max 240 (source)
                              Opacity(
                                opacity: _logoOpacity.value,
                                child: Transform.translate(
                                  offset: Offset(0, _logoDy.value),
                                  child: Transform.scale(
                                    scale: _logoScale.value,
                                    child: SizedBox(
                                      width: math.min(size.width * 0.58, 300),
                                      height: math.min(size.height * 0.28, 200),
                                      child: SvgPicture.asset(
                                        'assets/images/logo.svg',
                                        fit: BoxFit.contain,
                                        alignment: Alignment.center,
                                        allowDrawingOutsideViewBox: false,
                                        placeholderBuilder: (_) =>
                                            const _FallbackS(),
                                      ),
                                    ),
                                  ),
                                ),
                              ),

                              // Word — height ~8% of screen
                              SizedBox(height: size.height * 0.02),
                              SizedBox(
                                height: size.height * 0.055,
                                child: Center(
                                  child: AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 420),
                                    switchInCurve: Curves.easeOutCubic,
                                    switchOutCurve: Curves.easeInCubic,
                                    transitionBuilder: (child, anim) {
                                      final fade = CurvedAnimation(
                                        parent: anim,
                                        curve: Curves.easeInOut,
                                      );
                                      final slide = Tween<Offset>(
                                        begin: const Offset(0, 0.25),
                                        end: Offset.zero,
                                      ).animate(fade);
                                      return FadeTransition(
                                        opacity: fade,
                                        child: SlideTransition(
                                          position: slide,
                                          child: child,
                                        ),
                                      );
                                    },
                                    child: _wordIndex < 0
                                        ? const SizedBox.shrink(key: ValueKey(-1))
                                        : Text(
                                            _words[_wordIndex].toUpperCase(),
                                            key: ValueKey(_wordIndex),
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.outfit(
                                              fontSize: (size.width * 0.038)
                                                  .clamp(16.0, 26.0),
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 3,
                                              color: Colors.white,
                                              decoration: TextDecoration.none,
                                              shadows: [
                                                Shadow(
                                                  color: Color.fromRGBO(
                                                    245,
                                                    197,
                                                    24,
                                                    0.25 +
                                                        0.25 *
                                                            _wordGlowCtrl
                                                                .value,
                                                  ),
                                                  blurRadius: 16 +
                                                      12 *
                                                          _wordGlowCtrl.value,
                                                ),
                                              ],
                                            ),
                                          ),
                                  ),
                                ),
                              ),

                              SizedBox(height: size.height * 0.02),

                              // Progress block max 280
                              SizedBox(
                                width: math.min(size.width * 0.75, 280),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SizedBox(
                                      width: 28,
                                      height: 28,
                                      child: RotationTransition(
                                        turns: _spinCtrl,
                                        child: CustomPaint(
                                          painter: _SpinnerPainter(),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: SizedBox(
                                        height: 4,
                                        width: double.infinity,
                                        child: Stack(
                                          fit: StackFit.expand,
                                          children: [
                                            ColoredBox(
                                              color: Colors.white
                                                  .withValues(alpha: 0.06),
                                            ),
                                            Align(
                                              alignment: Alignment.centerLeft,
                                              child: FractionallySizedBox(
                                                widthFactor: _progressAnim
                                                    .value
                                                    .clamp(0.0, 1.0),
                                                heightFactor: 1,
                                                child: AnimatedBuilder(
                                                  animation: _shimmerCtrl,
                                                  builder: (_, __) {
                                                    final t =
                                                        _shimmerCtrl.value;
                                                    return DecoratedBox(
                                                      decoration:
                                                          BoxDecoration(
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(4),
                                                        gradient:
                                                            LinearGradient(
                                                          begin: Alignment(
                                                              -1 + 2 * t, 0),
                                                          end: Alignment(
                                                              1 + 2 * t, 0),
                                                          colors: const [
                                                            Color(0xFFF5C518),
                                                            Color(0xFFFFD700),
                                                            Color(0xFFFFFFFF),
                                                            Color(0xFFFFD700),
                                                            Color(0xFFF5C518),
                                                          ],
                                                        ),
                                                      ),
                                                    );
                                                  },
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'LOADING',
                                          style: GoogleFonts.inter(
                                            fontSize: 11.2,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 2,
                                            color: Colors.white
                                                .withValues(alpha: 0.4),
                                            decoration: TextDecoration.none,
                                          ),
                                        ),
                                        Text(
                                          '$_pct%',
                                          style: GoogleFonts.inter(
                                            fontSize: 15.2,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 1,
                                            color: const Color(0xFFF5C518),
                                            decoration: TextDecoration.none,
                                            shadows: const [
                                              Shadow(
                                                color: Color(0x66F5C518),
                                                blurRadius: 12,
                                              ),
                                            ],
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
                      ),
                    ),

                    // Footer — absolute bottom (source)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: pad.bottom + size.height * 0.03,
                      child: FadeTransition(
                        opacity: _taglineCtrl,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text.rich(
                              TextSpan(
                                style: GoogleFonts.inter(
                                  fontSize: 17.6,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 5,
                                  color:
                                      Colors.white.withValues(alpha: 0.9),
                                  decoration: TextDecoration.none,
                                ),
                                children: const [
                                  TextSpan(text: 'LIVE. '),
                                  TextSpan(
                                    text: 'PLAY.',
                                    style:
                                        TextStyle(color: Color(0xFFF5C518)),
                                  ),
                                  TextSpan(text: ' CONNECT.'),
                                ],
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '© ${DateTime.now().year} MbazzaCodes Inc.',
                              style: GoogleFonts.inter(
                                fontSize: 10.4,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 1,
                                color:
                                    Colors.white.withValues(alpha: 0.35),
                                decoration: TextDecoration.none,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({required this.size, required this.color});
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color, Colors.transparent],
          stops: const [0.0, 0.7],
        ),
      ),
    );
  }
}

class _FallbackS extends StatelessWidget {
  const _FallbackS();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 80,
        height: 80,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: [Color(0xFFF5C518), Color(0xFFFFD700)],
          ),
        ),
        alignment: Alignment.center,
        child: const Text(
          'S',
          style: TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.w900,
            fontStyle: FontStyle.italic,
            color: Color(0xFF030812),
            decoration: TextDecoration.none,
          ),
        ),
      ),
    );
  }
}

class _SpinnerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 2.5;
    final c = Offset(size.width / 2, size.height / 2);
    final r = (size.shortestSide - stroke) / 2;
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.08)
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke,
    );
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      -math.pi / 2 - 0.2,
      math.pi * 0.55,
      false,
      Paint()
        ..color = const Color(0xFFF5C518)
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
