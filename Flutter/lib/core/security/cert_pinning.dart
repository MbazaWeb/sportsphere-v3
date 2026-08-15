import 'dart:io';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';

/// TLS pins for sportssphere.fun (leaf SHA-256 of cert DER).
/// Rotate when the server certificate is renewed.
class CertPins {
  CertPins._();

  static const pinnedHosts = {'sportssphere.fun', 'www.sportssphere.fun'};

  /// SHA-256 of leaf certificate DER, lowercase hex without colons (2026-08-15)
  static const leafSha256Hex = {
    '97533992d6be2a30563909261f3a88fb26cde9704252279d0c9dcd23d44259e4',
  };

  static bool isPinnedHost(String host) =>
      pinnedHosts.contains(host.toLowerCase());

  static String fingerprintHex(List<int> der) => sha256.convert(der).toString();

  static bool matchesCertificate(X509Certificate cert) {
    final fp = fingerprintHex(cert.der);
    return leafSha256Hex.contains(fp);
  }
}

/// Install via HttpOverrides.global in main() on non-web platforms.
class SportSphereHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.badCertificateCallback =
        (X509Certificate cert, String host, int port) {
      if (!CertPins.isPinnedHost(host)) return false;
      final ok = CertPins.matchesCertificate(cert);
      if (kDebugMode && !ok) {
        debugPrint(
          'Cert pin mismatch for $host fp=${CertPins.fingerprintHex(cert.der)}',
        );
      }
      return ok;
    };
    return client;
  }
}
