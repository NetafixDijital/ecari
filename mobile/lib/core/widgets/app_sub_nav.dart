import 'package:flutter/material.dart';

import '../config/bottom_nav_config.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Alt menü grubunun alt seçenekleri ve yeni kayıt butonu.
class AppSubNav extends StatelessWidget {
  const AppSubNav({
    super.key,
    required this.group,
    required this.selectedMenuId,
    required this.onSelect,
    this.actionLabel,
    this.onAction,
  });

  final BottomNavGroup group;
  final String selectedMenuId;
  final ValueChanged<String> onSelect;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final selectedChild = group.children.cast<BottomNavChild?>().firstWhere(
          (c) => c!.menuId == selectedMenuId,
          orElse: () => group.children.isNotEmpty ? group.children.first : null,
        );
    final title = selectedChild?.label ?? group.label;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, AppSpacing.sm, AppSpacing.screenH, AppSpacing.sm),
      decoration: const BoxDecoration(
        color: AppColors.paper,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: group.children.length <= 1
                ? Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: AppColors.primary,
                    ),
                  )
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: group.children.map((child) {
                        final selected = child.menuId == selectedMenuId;
                        return Padding(
                          padding: const EdgeInsets.only(right: AppSpacing.sm),
                          child: FilterChip(
                            label: Text(child.label),
                            selected: selected,
                            onSelected: (_) => onSelect(child.menuId),
                            selectedColor: AppColors.primarySubtle,
                            checkmarkColor: AppColors.primary,
                            labelStyle: TextStyle(
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                              color: selected ? AppColors.primary : AppColors.bodyText,
                              fontSize: 13,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: AppSpacing.sm),
            FilledButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: Text(actionLabel!, style: const TextStyle(fontSize: 12)),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                visualDensity: VisualDensity.compact,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
