import 'dart:io';
import 'cert_pinning.dart';

void installCertPinning() {
  HttpOverrides.global = SportSphereHttpOverrides();
}
