import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import 'ecari_logo.dart';

/// HTML NexLink `app-header` — selamlama, menü, avatar.
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({
    super.key,
    required this.title,
    this.subtitle,
    required this.onMenuTap,
    this.userInitials,
  });

  final String title;
  final String? subtitle;
  final VoidCallback onMenuTap;
  final String? userInitials;

  @override
  Size get preferredSize => Size.fromHeight(subtitle != null ? 72 : 60);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.paper,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: preferredSize.height,
          decoration: BoxDecoration(
            color: AppColors.paper,
            border: const Border(bottom: BorderSide(color: AppColors.border)),
            boxShadow: [
              BoxShadow(
                color: AppColors.heading.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.lg, AppSpacing.sm),
          child: Row(
            children: [
              _MenuToggler(onTap: onMenuTap),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.heading,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                        letterSpacing: -0.2,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.bodyText, fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),
              if (userInitials != null) ...[
                const SizedBox(width: AppSpacing.sm),
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primarySubtle,
                  child: Text(
                    userInitials!,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ] else
                const EcariLogo(size: 36),
            ],
          ),
        ),
      ),
    );
  }
}

class _MenuToggler extends StatelessWidget {
  const _MenuToggler({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.bodyBg,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: const SizedBox(
          width: 44,
          height: 44,
          child: Icon(Icons.menu_rounded, color: AppColors.heading, size: 24),
        ),
      ),
    );
  }
}
