import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Optional biometric gate after a stored JWT is found.
class BiometricLock {
  BiometricLock({LocalAuthentication? auth}) : _auth = auth ?? LocalAuthentication();

  final LocalAuthentication _auth;
  static const _prefKey = 'ss_biometric_lock_enabled';

  Future<bool> isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_prefKey) ?? false;
  }

  Future<void> setEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, value);
  }

  Future<bool> canCheck() async {
    if (kIsWeb) return false;
    try {
      final supported = await _auth.isDeviceSupported();
      if (!supported) return false;
      return await _auth.canCheckBiometrics;
    } on PlatformException {
      return false;
    }
  }

  /// Returns true if unlocked (or biometrics unavailable / disabled).
  Future<bool> authenticate({String reason = 'Unlock SportSphere'}) async {
    if (kIsWeb) return true;
    final enabled = await isEnabled();
    if (!enabled) return true;
    final available = await canCheck();
    if (!available) return true;
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }
}
