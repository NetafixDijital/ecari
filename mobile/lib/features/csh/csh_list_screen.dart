import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'csh_repository.dart';

class CshListScreen extends StatefulWidget {
  const CshListScreen({super.key});

  @override
  State<CshListScreen> createState() => _CshListScreenState();
}

class _CshListScreenState extends State<CshListScreen> {
  CshAccount? _selected;
  List<CshAccount> _accounts = [];

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  Future<void> _loadAccounts() async {
    try {
      final items = await CshRepository(context.read<ApiClient>()).list();
      if (mounted) setState(() => _accounts = items.where((a) => a.isActive).toList());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final repo = CshRepository(context.read<ApiClient>());

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: DropdownButtonFormField<CshAccount?>(
            value: _selected,
            decoration: const InputDecoration(labelText: 'Kasa filtresi'),
            items: [
              const DropdownMenuItem<CshAccount?>(value: null, child: Text('Tüm kasalar')),
              ..._accounts.map((a) => DropdownMenuItem(value: a, child: Text('${a.code} · ${a.name}'))),
            ],
            onChanged: (v) => setState(() => _selected = v),
          ),
        ),
        Expanded(
          child: ModuleListPage<CshMovement>(
            key: ValueKey(_selected?.id ?? 0),
            searchHint: 'Hareket ara…',
            emptyIcon: Icons.payments_outlined,
            emptyTitle: 'Kasa hareketi yok',
            loadItems: (s) => repo.movements(cashAccountId: _selected?.id, search: s),
            itemBuilder: (context, m) => ModuleListTile(
              leadingIcon: Icons.payments_outlined,
              title: m.transactionTypeLabel,
              subtitle: '${m.cashAccountName} · ${m.transactionDate}${m.description != null ? '\n${m.description}' : ''}',
              trailing: moduleCurrency.format(m.amount),
              badge: m.referenceNo,
              badgeTone: m.transactionType == 'COLLECTION' ? LabelBadgeTone.success : LabelBadgeTone.danger,
            ),
          ),
        ),
      ],
    );
  }
}
