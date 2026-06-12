import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import '../stok/stk_repository.dart';

class StkMovementsScreen extends StatelessWidget {
  const StkMovementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = StkRepository(context.read<ApiClient>());
    return ModuleListPage<StkMovement>(
      searchHint: 'Stok veya depo ara…',
      emptyIcon: Icons.sync_alt_outlined,
      emptyTitle: 'Stok hareketi yok',
      loadItems: (s) => repo.movements(search: s),
      itemBuilder: (context, m) => ModuleListTile(
        leadingIcon: Icons.sync_alt_outlined,
        title: m.itemName,
        subtitle: '${m.itemCode} · ${m.warehouseName}\n${m.movementDate} · ${m.movementTypeLabel}',
        badge: '${m.quantity.toStringAsFixed(0)} ${m.unitName}',
        badgeTone: statusTone(m.movementTypeLabel),
      ),
    );
  }
}
