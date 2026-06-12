import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import '../cfg/cfg_repository.dart';

class DepoListScreen extends StatelessWidget {
  const DepoListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = CfgRepository(context.read<ApiClient>());
    return ModuleListPage<Warehouse>(
      searchHint: 'Depo adı veya kodu ara…',
      emptyIcon: Icons.warehouse_outlined,
      emptyTitle: 'Depo kaydı yok',
      loadItems: (s) async {
        final items = await repo.warehouses();
        if (s.isEmpty) return items;
        final q = s.toLowerCase();
        return items
            .where((w) => '${w.code} ${w.name} ${w.address ?? ''}'.toLowerCase().contains(q))
            .toList();
      },
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.warehouse_outlined,
        title: item.name,
        subtitle: '${item.code}${item.address != null ? '\n${item.address}' : ''}',
        badge: item.isDefault ? 'Varsayılan' : (item.isActive ? 'Aktif' : 'Pasif'),
        badgeTone: item.isActive ? LabelBadgeTone.success : LabelBadgeTone.secondary,
      ),
    );
  }
}
