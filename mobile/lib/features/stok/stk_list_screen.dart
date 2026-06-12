import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'stk_repository.dart';

class StkListScreen extends StatelessWidget {
  const StkListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = StkRepository(context.read<ApiClient>());
    return ModuleListPage<StkItem>(
      searchHint: 'Stok adı, kod veya barkod ara…',
      emptyIcon: Icons.inventory_2_outlined,
      emptyTitle: 'Stok kaydı yok',
      loadItems: (s) => repo.list(search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.inventory_2_outlined,
        title: item.name,
        subtitle: '${item.code}${item.barcode != null ? ' · ${item.barcode}' : ''}',
        trailing: item.salesPrice != null ? moduleCurrency.format(item.salesPrice) : null,
        badge: item.isActive ? '${item.stockQuantity.toStringAsFixed(0)} ${item.baseUnitName ?? 'adet'}' : 'Pasif',
        badgeTone: item.stockQuantity > 0 ? LabelBadgeTone.success : LabelBadgeTone.warning,
      ),
    );
  }
}
