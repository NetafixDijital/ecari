import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'ord_detail_screen.dart';
import 'ord_repository.dart';

class OrdListScreen extends StatefulWidget {
  const OrdListScreen({super.key});

  @override
  State<OrdListScreen> createState() => _OrdListScreenState();
}

class _OrdListScreenState extends State<OrdListScreen> {
  int _typeIndex = 0;

  @override
  Widget build(BuildContext context) {
    final repo = OrdRepository(context.read<ApiClient>());
    final type = _typeIndex == 0 ? 'SALES' : 'PURCHASE';

    return ModuleListPage<OrdOrder>(
      key: ValueKey(type),
      searchHint: 'Sipariş no veya cari ara…',
      emptyIcon: Icons.shopping_cart_outlined,
      emptyTitle: 'Sipariş bulunamadı',
      filterBar: ModuleFilterBar(
        labels: const ['Satış', 'Alış'],
        selectedIndex: _typeIndex,
        onChanged: (i) => setState(() => _typeIndex = i),
      ),
      loadItems: (s) => repo.list(type: type, search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.shopping_cart_outlined,
        title: item.documentNo,
        subtitle: '${item.accountTitle} · ${item.documentDate}',
        trailing: moduleCurrency.format(item.grandTotal),
        badge: item.statusLabel,
        badgeTone: statusTone(item.statusKey),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => OrdDetailScreen(id: item.id)),
        ),
      ),
    );
  }
}
