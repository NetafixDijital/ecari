import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/auth/auth_state.dart';
import '../../core/config/app_menu.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/ecari_brand.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({
    super.key,
    required this.selectedId,
    required this.onSelect,
    required this.onLogout,
  });

  final String selectedId;
  final ValueChanged<String> onSelect;
  final VoidCallback onLogout;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();

    return Drawer(
      width: MediaQuery.sizeOf(context).width * 0.82,
      backgroundColor: AppColors.paper,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.xl, AppSpacing.xl, AppSpacing.lg),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary, AppColors.primaryLight],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const EcariBrand(showTagline: true, light: true),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: Colors.white24,
                        child: Text(
                          _initials(auth.user?.fullName ?? '?'),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              auth.user?.fullName ?? '',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                            ),
                            if (auth.companyName != null)
                              Text(
                                auth.companyName!,
                                style: const TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.sm),
                children: [
                  _MenuTile(
                    item: AppMenu.dashboard,
                    selected: selectedId == AppMenu.dashboard.id,
                    onTap: () => onSelect(AppMenu.dashboard.id),
                  ),
                  const _SectionLabel('Modüller'),
                  ...AppMenu.modules.map(
                    (item) => _MenuTile(
                      item: item,
                      selected: selectedId == item.id,
                      onTap: () => onSelect(item.id),
                    ),
                  ),
                  const _SectionLabel('Finans'),
                  ...AppMenu.finance.map(
                    (item) => _MenuTile(
                      item: item,
                      selected: selectedId == item.id,
                      onTap: () => onSelect(item.id),
                    ),
                  ),
                  const _SectionLabel('Raporlar'),
                  ...AppMenu.reports.map(
                    (item) => _MenuTile(
                      item: item,
                      selected: selectedId == item.id,
                      onTap: () => onSelect(item.id),
                    ),
                  ),
                  const _SectionLabel('Ayarlar'),
                  ...AppMenu.settings
                      .where((item) => item.id != 'ayarlar-kullanicilar' || auth.hasPermission('AUTH.USER.VIEW'))
                      .map(
                    (item) => _MenuTile(
                      item: item,
                      selected: selectedId == item.id,
                      onTap: () => onSelect(item.id),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.dangerSubtle,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
              ),
              title: const Text('Çıkış Yap', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600)),
              onTap: onLogout,
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.xs),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.bodyText,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.item, required this.selected, required this.onTap});

  final AppMenuItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: ListTile(
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: selected ? AppColors.primarySubtle : AppColors.bodyBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            item.icon,
            color: selected ? AppColors.primary : AppColors.bodyText,
            size: 20,
          ),
        ),
        title: Text(
          item.label,
          style: TextStyle(
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 14,
            color: selected ? AppColors.primary : AppColors.heading,
          ),
        ),
        trailing: selected
            ? const Icon(Icons.check_circle, color: AppColors.primary, size: 18)
            : null,
        selected: selected,
        selectedTileColor: AppColors.primarySubtle.withValues(alpha: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        onTap: onTap,
      ),
    );
  }
}
