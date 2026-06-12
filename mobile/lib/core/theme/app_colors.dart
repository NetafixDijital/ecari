import 'package:flutter/material.dart';

/// Web (NexLink / design/html) ile ayni renk paleti.
abstract final class AppColors {
  static const primary = Color(0xFF5955D1);
  static const primaryLight = Color(0xFF8B87E8);
  static const primaryDark = Color(0xFF4A46B8);

  static const bodyBg = Color(0xFFF4F5FA);
  static const bodyText = Color(0xFF64656A);
  static const heading = Color(0xFF1C274C);
  static const border = Color(0xFFE9EAEF);
  static const paper = Color(0xFFFFFFFF);

  static const success = Color(0xFF28C76F);
  static const danger = Color(0xFFFF4C51);
  static const warning = Color(0xFFFF9F43);
  static const info = Color(0xFF00BAD1);

  static const primarySubtle = Color(0x1F5955D1);
  static const successSubtle = Color(0x1F28C76F);
  static const dangerSubtle = Color(0x1FFF4C51);
  static const warningSubtle = Color(0x1FFF9F43);
  static const infoSubtle = Color(0x1F00BAD1);
  static const secondarySubtle = Color(0xFFF4F5FA);

  /// auth-page.css — primary %12 + bodyBg karışımı
  static Color get authCoverBg => Color.lerp(primary, bodyBg, 0.88)!;

  static const blobPrimary = Color(0x2E5955D1);
  static const blobViolet = Color(0x268B87E8);
  static const blobSuccess = Color(0x1428C76F);

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: heading.withValues(alpha: 0.05),
          blurRadius: 14,
          offset: const Offset(0, 4),
        ),
      ];
}
