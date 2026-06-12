import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import 'app_surface.dart';
import 'label_badge.dart';

final moduleCurrency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

class ModuleListTile extends StatelessWidget {
  const ModuleListTile({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.badge,
    this.badgeTone = LabelBadgeTone.secondary,
    this.leadingIcon,
    this.leadingText,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final String? trailing;
  final String? badge;
  final LabelBadgeTone badgeTone;
  final IconData? leadingIcon;
  final String? leadingText;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.primarySubtle,
                borderRadius: BorderRadius.circular(11),
              ),
              child: leadingIcon != null
                  ? Icon(leadingIcon, color: AppColors.primary, size: 22)
                  : Text(
                      leadingText ?? '?',
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 16),
                    ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.heading),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(subtitle!, style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                  if (badge != null) ...[
                    const SizedBox(height: 6),
                    LabelBadge(label: badge!, tone: badgeTone),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: AppSpacing.sm),
              Text(
                trailing!,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.heading),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

LabelBadgeTone statusTone(String? key) {
  final k = (key ?? '').toUpperCase();
  if (k.contains('PAID') || k.contains('COMPLETED') || k.contains('APPROVED') || k.contains('ACTIVE')) {
    return LabelBadgeTone.success;
  }
  if (k.contains('OVERDUE') || k.contains('CANCEL') || k.contains('REJECT')) {
    return LabelBadgeTone.danger;
  }
  if (k.contains('PENDING') || k.contains('OPEN') || k.contains('DRAFT')) {
    return LabelBadgeTone.warning;
  }
  if (k.contains('PROGRESS')) return LabelBadgeTone.primary;
  return LabelBadgeTone.secondary;
}
