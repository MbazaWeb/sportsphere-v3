import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

// ─── SportSphere Unified Badge System ────────────────────────────────────────
//
// Badge priority order (left to right):
//   1. VERIFIED  — gold shield  (isVerified == true)
//   2. PRO       — gold star    (isPro == true, non-fan role)
//   3. ROLE      — role color   (always shown)
//   4. FAN       — muted        (role == 'fan', no PRO)
//
// Role badge config: emoji + label + color for every role.

class RoleBadgeConfig {
  const RoleBadgeConfig({
    required this.label,
    required this.emoji,
    required this.color,
    required this.icon,
  });
  final String label;
  final String emoji;
  final Color color;
  final IconData icon;
}

// ─── Master role config — covers ALL roles ────────────────────────────────────
const _roleConfig = <String, RoleBadgeConfig>{
  // Sports identity (Become a Fan roles)
  'player':        RoleBadgeConfig(label: 'Player',        emoji: '⚽', color: Color(0xFF3B82F6), icon: Icons.person),
  'team':          RoleBadgeConfig(label: 'Team',          emoji: '👥', color: Color(0xFF3B82F6), icon: Icons.shield),
  'coach':         RoleBadgeConfig(label: 'Coach',         emoji: '👨‍🏫', color: Color(0xFFF97316), icon: Icons.sports_soccer),
  'national_team': RoleBadgeConfig(label: 'National Team', emoji: '🏳️', color: Color(0xFF2563EB), icon: Icons.flag),
  'club':          RoleBadgeConfig(label: 'Club',          emoji: '🏟️', color: Color(0xFF3B82F6), icon: Icons.shield),

  // Institutions (Follow only)
  'academy':       RoleBadgeConfig(label: 'Academy',       emoji: '🧒', color: Color(0xFF10B981), icon: Icons.school),
  'league':        RoleBadgeConfig(label: 'League',        emoji: '🏆', color: Color(0xFF8B5CF6), icon: Icons.emoji_events),
  'competition':   RoleBadgeConfig(label: 'Competition',   emoji: '🏆', color: Color(0xFF8B5CF6), icon: Icons.emoji_events),
  'organization':  RoleBadgeConfig(label: 'Organization',  emoji: '🏢', color: Color(0xFF6366F1), icon: Icons.business),
  'referee':       RoleBadgeConfig(label: 'Referee',       emoji: '⚖️', color: Color(0xFF64748B), icon: Icons.gavel),

  // Media & Content
  'journalist':    RoleBadgeConfig(label: 'Journalist',    emoji: '📰', color: Color(0xFF0EA5E9), icon: Icons.article),
  'commentator':   RoleBadgeConfig(label: 'Commentator',   emoji: '🎙️', color: Color(0xFF0EA5E9), icon: Icons.mic),
  'creator':       RoleBadgeConfig(label: 'Creator',       emoji: '🎥', color: Color(0xFFEC4899), icon: Icons.videocam),
  'analyst':       RoleBadgeConfig(label: 'Analyst',       emoji: '📊', color: Color(0xFF14B8A6), icon: Icons.bar_chart),
  'media':         RoleBadgeConfig(label: 'Media',         emoji: '📺', color: Color(0xFF0EA5E9), icon: Icons.tv),

  // Business & Commercial
  'business':      RoleBadgeConfig(label: 'Business',      emoji: '💼', color: Color(0xFF84CC16), icon: Icons.business_center),
  'commercial-partner': RoleBadgeConfig(label: 'Partner',  emoji: '🤝', color: Color(0xFF84CC16), icon: Icons.handshake),
  'agent':         RoleBadgeConfig(label: 'Agent',         emoji: '🔍', color: Color(0xFF94A3B8), icon: Icons.manage_accounts),
  'scout':         RoleBadgeConfig(label: 'Scout',         emoji: '🔍', color: Color(0xFF94A3B8), icon: Icons.search),

  // Venue
  'stadium':       RoleBadgeConfig(label: 'Stadium',       emoji: '🏟️', color: Color(0xFFEAB308), icon: Icons.stadium),
  'venue':         RoleBadgeConfig(label: 'Venue',         emoji: '📍', color: Color(0xFFEAB308), icon: Icons.location_on),

  // Community
  'community':     RoleBadgeConfig(label: 'Community',     emoji: '👥', color: Color(0xFF8B5CF6), icon: Icons.groups),

  // Fan
  'fan':           RoleBadgeConfig(label: 'Fan',           emoji: '👤', color: Color(0xFF94A3B8), icon: Icons.person_outline),
};

RoleBadgeConfig roleConfig(String role) =>
    _roleConfig[role.toLowerCase()] ??
    _roleConfig['fan']!;

// ─── Single Badge Chip ────────────────────────────────────────────────────────
class RoleBadge extends StatelessWidget {
  const RoleBadge({
    super.key,
    required this.type,
    this.label,
    this.color,
    this.icon,
    this.size = BadgeSize.normal,
    this.emoji,
  });

  final BadgeType type;
  final String? label;
  final Color? color;
  final IconData? icon;
  final String? emoji;
  final BadgeSize size;

  @override
  Widget build(BuildContext context) {
    final cfg = _badgeCfg();
    final fs = size == BadgeSize.small ? 8.0 : 10.0;
    final iconSz = size == BadgeSize.small ? 10.0 : 12.0;
    final px = size == BadgeSize.small ? 5.0 : 7.0;
    final py = size == BadgeSize.small ? 2.0 : 3.0;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: px, vertical: py),
      decoration: BoxDecoration(
        color: cfg.color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: cfg.color.withValues(alpha: 0.4), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (cfg.emoji != null) ...[
            Text(cfg.emoji!, style: TextStyle(fontSize: iconSz - 1)),
            SizedBox(width: size == BadgeSize.small ? 2 : 3),
          ] else if (cfg.iconData != null) ...[
            Icon(cfg.iconData!, size: iconSz, color: cfg.color),
            SizedBox(width: size == BadgeSize.small ? 2 : 3),
          ],
          Text(
            cfg.text,
            style: GoogleFonts.inter(
              fontSize: fs,
              fontWeight: FontWeight.w700,
              color: cfg.color,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  _BadgeRenderCfg _badgeCfg() {
    switch (type) {
      case BadgeType.verified:
        return _BadgeRenderCfg(
          text: 'VERIFIED',
          color: AppColors.primary,
          iconData: Icons.verified,
          emoji: null,
        );
      case BadgeType.pro:
        return _BadgeRenderCfg(
          text: 'PRO',
          color: AppColors.primary,
          iconData: Icons.star_rounded,
          emoji: null,
        );
      case BadgeType.role:
        final rc = roleConfig(label ?? 'fan');
        return _BadgeRenderCfg(
          text: (label != null ? roleConfig(label!).label : 'Fan').toUpperCase(),
          color: color ?? rc.color,
          iconData: null,
          emoji: rc.emoji,
        );
      case BadgeType.custom:
        return _BadgeRenderCfg(
          text: (label ?? '').toUpperCase(),
          color: color ?? AppColors.mutedForeground,
          iconData: icon,
          emoji: emoji,
        );
    }
  }
}

class _BadgeRenderCfg {
  const _BadgeRenderCfg({required this.text, required this.color, this.iconData, this.emoji});
  final String text;
  final Color color;
  final IconData? iconData;
  final String? emoji;
}

enum BadgeType { verified, pro, role, custom }
enum BadgeSize { small, normal }

// ─── Badge Stack — shows all applicable badges for a user ────────────────────
// Usage: BadgeStack(role: 'player', isVerified: true, isPro: true)
class BadgeStack extends StatelessWidget {
  const BadgeStack({
    super.key,
    required this.role,
    this.isVerified = false,
    this.isPro = false,
    this.size = BadgeSize.normal,
    this.typeName,
  });

  final String role;
  final bool isVerified;
  final bool isPro;
  final String? typeName;
  final BadgeSize size;

  @override
  Widget build(BuildContext context) {
    final badges = <Widget>[];

    // 1. Verified badge — gold, always first
    if (isVerified) {
      badges.add(RoleBadge(type: BadgeType.verified, size: size));
      badges.add(const SizedBox(width: 4));
    }

    // 2. PRO badge — only for non-fan pro roles
    if (isPro && role.toLowerCase() != 'fan') {
      badges.add(RoleBadge(type: BadgeType.pro, size: size));
      badges.add(const SizedBox(width: 4));
    }

    // 3. Role badge — always shown
    badges.add(RoleBadge(type: BadgeType.role, label: role, size: size));

    // 4. Type/specialty badge — if different from role (e.g. "Forward" under "player")
    if (typeName != null && typeName!.isNotEmpty &&
        typeName!.toLowerCase() != role.toLowerCase()) {
      badges.add(const SizedBox(width: 4));
      badges.add(RoleBadge(
        type: BadgeType.custom,
        label: typeName!,
        color: AppColors.mutedForeground,
        size: size,
      ));
    }

    return Row(mainAxisSize: MainAxisSize.min, children: badges);
  }
}

// ─── Inline post card badge (compact) ────────────────────────────────────────
class PostBadge extends StatelessWidget {
  const PostBadge({super.key, required this.role, this.isVerified = false});
  final String role;
  final bool isVerified;

  @override
  Widget build(BuildContext context) {
    if (!isVerified && role.toLowerCase() == 'fan') return const SizedBox.shrink();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isVerified) ...[
          RoleBadge(type: BadgeType.verified, size: BadgeSize.small),
          const SizedBox(width: 3),
        ],
        if (role.toLowerCase() != 'fan')
          RoleBadge(type: BadgeType.role, label: role, size: BadgeSize.small),
      ],
    );
  }
}
