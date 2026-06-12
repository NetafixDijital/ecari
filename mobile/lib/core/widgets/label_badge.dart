import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum LabelBadgeTone { primary, success, danger, warning, secondary }

class LabelBadge extends StatelessWidget {
  const LabelBadge({super.key, required this.label, this.tone = LabelBadgeTone.secondary});

  final String label;
  final LabelBadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      LabelBadgeTone.primary => (AppColors.primarySubtle, AppColors.primary),
      LabelBadgeTone.success => (AppColors.successSubtle, AppColors.success),
      LabelBadgeTone.danger => (AppColors.dangerSubtle, AppColors.danger),
      LabelBadgeTone.warning => (AppColors.warningSubtle, AppColors.warning),
      LabelBadgeTone.secondary => (AppColors.secondarySubtle, AppColors.bodyText),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
