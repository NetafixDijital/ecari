import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'exp_detail_screen.dart';
import 'exp_management_screen.dart';
import 'exp_repository.dart';

class ExpListScreen extends StatefulWidget {
  const ExpListScreen({super.key});

  @override
  State<ExpListScreen> createState() => _ExpListScreenState();
}

class _ExpListScreenState extends State<ExpListScreen> {
  int _statusIndex = 0;
  int _refreshKey = 0;

  static const _statusKeys = <String?>[null, 'PENDING', 'APPROVED', 'PAID', 'REJECTED'];
  static const _statusLabels = ['Tümü', 'Onay Bekliyor', 'Onaylandı', 'Ödendi', 'Reddedildi'];

  @override
  Widget build(BuildContext context) {
    final repo = ExpRepository(context.read<ApiClient>());
    final status = _statusKeys[_statusIndex];

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => Scaffold(
                      appBar: AppBar(title: const Text('Masraf Yönetimi')),
                      body: const ExpManagementScreen(),
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.insights_outlined, size: 18),
              label: const Text('Yönetim'),
            ),
          ),
        ),
        Expanded(
          child: ModuleListPage<ExpExpense>(
            key: ValueKey('$_refreshKey-$status'),
            searchHint: 'Masraf ara…',
            emptyIcon: Icons.request_quote_outlined,
            emptyTitle: 'Masraf kaydı yok',
            loadItems: (s) => repo.list(status: status, search: s),
            filterBar: ModuleFilterBar(
              labels: _statusLabels,
              selectedIndex: _statusIndex,
              onChanged: (i) => setState(() {
                _statusIndex = i;
                _refreshKey++;
              }),
            ),
            itemBuilder: (context, item) => ModuleListTile(
              leadingIcon: Icons.request_quote_outlined,
              title: item.documentNo,
              subtitle: '${item.accountTitle}\n${item.summary}',
              trailing: moduleCurrency.format(item.grandTotal),
              badge: item.statusLabel,
              badgeTone: statusTone(item.statusKey),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ExpDetailScreen(id: item.id)),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
