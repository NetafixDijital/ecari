import 'package:flutter/material.dart';

class BottomNavChild {
  const BottomNavChild({required this.menuId, required this.label});
  final String menuId;
  final String label;
}

class BottomNavGroup {
  const BottomNavGroup({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.children,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final List<BottomNavChild> children;

  String get defaultMenuId => children.first.menuId;
}

/// Alt menü: Cari · Fatura · Stok ve alt seçenekleri.
abstract final class BottomNavConfig {
  static const groups = [
    BottomNavGroup(
      label: 'Cari',
      icon: Icons.people_outline_rounded,
      activeIcon: Icons.people_rounded,
      children: [
        BottomNavChild(menuId: 'cari', label: 'Cari Tanımı'),
        BottomNavChild(menuId: 'cari-hareketler', label: 'Cari Hareketleri'),
      ],
    ),
    BottomNavGroup(
      label: 'Fatura',
      icon: Icons.receipt_long_outlined,
      activeIcon: Icons.receipt_long,
      children: [
        BottomNavChild(menuId: 'fatura-satis', label: 'Satış Faturası'),
        BottomNavChild(menuId: 'fatura-alis', label: 'Alış Faturası'),
      ],
    ),
    BottomNavGroup(
      label: 'Stok',
      icon: Icons.inventory_2_outlined,
      activeIcon: Icons.inventory_2,
      children: [
        BottomNavChild(menuId: 'stok', label: 'Stok Tanımı'),
        BottomNavChild(menuId: 'depo-hareketler', label: 'Stok Hareketleri'),
      ],
    ),
  ];

  static int? groupIndexForMenuId(String menuId) {
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].children.any((c) => c.menuId == menuId)) return i;
    }
    return null;
  }

  static String titleForMenuId(String menuId) {
    for (final group in groups) {
      for (final child in group.children) {
        if (child.menuId == menuId) return child.label;
      }
    }
    return menuId;
  }
}
