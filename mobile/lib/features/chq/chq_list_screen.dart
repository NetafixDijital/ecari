import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'chq_repository.dart';

class ChqListScreen extends StatefulWidget {
  const ChqListScreen({super.key});

  @override
  State<ChqListScreen> createState() => _ChqListScreenState();
}

class _ChqListScreenState extends State<ChqListScreen> {
  int _dirIndex = 0;

  @override
  Widget build(BuildContext context) {
    final repo = ChqRepository(context.read<ApiClient>());
    final direction = _dirIndex == 0 ? 'RECEIVED' : 'ISSUED';

    return ModuleListPage<ChqInstrument>(
      key: ValueKey(direction),
      searchHint: 'Çek/senet no veya cari ara…',
      emptyIcon: Icons.fact_check_outlined,
      emptyTitle: 'Kayıt bulunamadı',
      filterBar: ModuleFilterBar(
        labels: const ['Alınan', 'Verilen'],
        selectedIndex: _dirIndex,
        onChanged: (i) => setState(() => _dirIndex = i),
      ),
      loadItems: (s) => repo.list(direction: direction, search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.fact_check_outlined,
        title: item.instrumentNo,
        subtitle: '${item.accountTitle}${item.bankName != null ? ' · ${item.bankName}' : ''}\nVade: ${item.dueDate}',
        trailing: moduleCurrency.format(item.amount),
        badge: item.statusLabel,
        badgeTone: statusTone(item.statusKey),
      ),
    );
  }
}
