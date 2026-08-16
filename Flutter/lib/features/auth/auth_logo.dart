import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../theme/app_colors.dart';

/// Official SportSphere logo for auth screens (matches web AuthLogo).
class AuthLogo extends StatelessWidget {
  const AuthLogo({super.key, this.height = 36});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: SvgPicture.asset(
          'assets/images/logo.svg',
          height: height,
          fit: BoxFit.contain,
          placeholderBuilder: (_) => Text(
            'SportSphere',
            style: TextStyle(
              fontSize: height * 0.6,
              fontWeight: FontWeight.w800,
              color: AppColors.foreground,
            ),
          ),
        ),
      ),
    );
  }
}
