import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class AppSearchField extends StatelessWidget {
  const AppSearchField({
    super.key,
    required this.controller,
    required this.hint,
    required this.onSearch,
    this.onClear,
  });

  final TextEditingController controller;
  final String hint;
  final VoidCallback onSearch;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: controller,
      builder: (context, value, _) {
        return TextField(
          controller: controller,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: AppColors.paper,
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.bodyText, size: 22),
            suffixIcon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (controller.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    color: AppColors.bodyText,
                    onPressed: () {
                      controller.clear();
                      onClear?.call();
                      onSearch();
                    },
                  ),
                IconButton(
                  icon: const Icon(Icons.refresh_rounded, size: 20),
                  color: AppColors.primary,
                  tooltip: 'Yenile',
                  onPressed: onSearch,
                ),
              ],
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
          onSubmitted: (_) => onSearch(),
        );
      },
    );
  }
}
