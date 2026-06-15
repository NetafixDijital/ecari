import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/cari_picker_sheet.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import '../../core/widgets/stk_picker_sheet.dart';
import '../../features/cari/cari_models.dart';
import '../../features/finance/finance_utils.dart';
import '../stok/stk_repository.dart';
import 'qot_detail_screen.dart';
import 'qot_form_screen.dart';
import 'qot_repository.dart';

class QotListScreen extends StatefulWidget {
  const QotListScreen({super.key});

  @override
  State<QotListScreen> createState() => _QotListScreenState();
}

class _QotListScreenState extends State<QotListScreen> {
  int _typeIndex = 0;
  int _refreshKey = 0;

  Future<void> _openCreate() async {
    final type = _typeIndex == 0 ? 'SALES' : 'PURCHASE';
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => QotFormScreen(documentType: type)),
    );
    if (created == true && mounted) setState(() => _refreshKey++);
  }

  @override
  Widget build(BuildContext context) {
    final repo = QotRepository(context.read<ApiClient>());
    final type = _typeIndex == 0 ? 'SALES' : 'PURCHASE';

    return Scaffold(
      body: ModuleListPage<QotQuotation>(
        key: ValueKey('$type-$_refreshKey'),
        searchHint: 'Teklif no veya cari ara…',
        emptyIcon: Icons.description_outlined,
        emptyTitle: 'Teklif bulunamadı',
        filterBar: ModuleFilterBar(
          labels: const ['Satış', 'Alış'],
          selectedIndex: _typeIndex,
          onChanged: (i) => setState(() => _typeIndex = i),
        ),
        loadItems: (s) => repo.list(type: type, search: s),
        itemBuilder: (context, item) => ModuleListTile(
          leadingIcon: Icons.description_outlined,
          title: item.documentNo,
          subtitle: '${item.accountTitle} · ${item.documentDate}',
          trailing: moduleCurrency.format(item.grandTotal),
          badge: item.statusLabel,
          badgeTone: statusTone(item.statusKey),
          onTap: () async {
            final changed = await Navigator.of(context).push<bool>(
              MaterialPageRoute(builder: (_) => QotDetailScreen(id: item.id)),
            );
            if (changed == true && mounted) setState(() => _refreshKey++);
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        icon: const Icon(Icons.add),
        label: Text(_typeIndex == 0 ? 'Yeni Teklif' : 'Yeni Alış Teklifi'),
      ),
    );
  }
}
