import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/security/biometric_lock.dart';
import 'core/security/http_overrides_stub.dart'
    if (dart.library.io) 'core/security/http_overrides_io.dart' as pinning;
import 'core/storage/token_storage.dart';
import 'theme/app_theme.dart';
import 'core/providers/appearance_prefs.dart';
import 'theme/app_colors.dart';
import 'features/splash/splash_screen.dart';
import 'features/shell/app_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  pinning.installCertPinning();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.background,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const ProviderScope(child: SportsphereApp()));
}

class SportsphereApp extends ConsumerWidget {
  const SportsphereApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(appearancePrefsProvider);
    return MaterialApp(
      title: 'Sportsphere',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: prefs.themeMode,
      builder: (context, child) {
        final media = MediaQuery.of(context);
        Widget content = MediaQuery(
          data: media.copyWith(
            textScaler: TextScaler.linear(prefs.textScale * media.textScaler.scale(1.0)),
            highContrast: prefs.highContrast || media.highContrast,
            disableAnimations: prefs.reducedMotion || media.disableAnimations,
          ),
          child: child ?? const SizedBox.shrink(),
        );
        // High-contrast boost: slightly stronger borders via IconTheme/DefaultTextStyle
        if (prefs.highContrast) {
          content = IconTheme.merge(
            data: const IconThemeData(weight: 700),
            child: DefaultTextStyle.merge(
              style: const TextStyle(fontWeight: FontWeight.w600),
              child: content,
            ),
          );
        }
        return content;
      },
      home: const _Root(),
    );
  }
}

class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  bool _showSplash = true;
  bool _locked = false;
  bool _checkingLock = false;

  Future<void> _afterSplash() async {
    setState(() => _showSplash = false);
    await _maybeBiometricGate();
  }

  Future<void> _maybeBiometricGate() async {
    if (kIsWeb) return;
    final token = await TokenStorage().readToken();
    if (token == null || token.isEmpty) return;

    final lock = BiometricLock();
    if (!await lock.isEnabled()) return;

    setState(() {
      _locked = true;
      _checkingLock = true;
    });
    final ok = await lock.authenticate(reason: 'Unlock SportSphere');
    if (!mounted) return;
    setState(() {
      _checkingLock = false;
      _locked = !ok;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(onDone: _afterSplash);
    }
    if (_locked) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock_outline, size: 48, color: AppColors.primary),
              const SizedBox(height: 16),
              Text(
                _checkingLock ? 'Authenticating…' : 'App locked',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 20),
              if (!_checkingLock)
                ElevatedButton(
                  onPressed: () async {
                    setState(() => _checkingLock = true);
                    final ok = await BiometricLock().authenticate();
                    if (!mounted) return;
                    setState(() {
                      _checkingLock = false;
                      _locked = !ok;
                    });
                  },
                  child: const Text('Unlock'),
                ),
            ],
          ),
        ),
      );
    }
    return const AppShell();
  }
}
