import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/appearance_prefs.dart';

/// Prefer reduced motion from user prefs OR system accessibility.
bool prefersReducedMotion(BuildContext context, [WidgetRef? ref]) {
  final system = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
  if (system) return true;
  if (ref != null) {
    return ref.read(appearancePrefsProvider).reducedMotion;
  }
  return false;
}

Duration motionDuration(BuildContext context, Duration normal, [WidgetRef? ref]) {
  if (prefersReducedMotion(context, ref)) return Duration.zero;
  return normal;
}
