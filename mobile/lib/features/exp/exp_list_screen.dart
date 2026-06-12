import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'exp_repository.dart';

class ExpListScreen extends StatelessWidget {
  const ExpListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = ExpRepository(context.read<ApiClient>());
    return ModuleListPage<ExpExpense>(
      searchHint: 'Masraf ara…',
      emptyIcon: Icons.request_quote_outlined,
      emptyTitle: 'Masraf kaydı yok',
      loadItems: (s) => repo.list(search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.request_quote_outlined,
        title: item.documentNo,
        subtitle: '${item.category} · ${item.description}\n${item.expenseDate}',
        trailing: moduleCurrency.format(item.amount),
        badge: item.statusLabel,
        badgeTone: statusTone(item.statusKey),
      ),
    );
  }
}
