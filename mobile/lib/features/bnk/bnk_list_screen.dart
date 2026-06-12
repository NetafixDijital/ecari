import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'bnk_repository.dart';

class BnkListScreen extends StatelessWidget {
  const BnkListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = BnkRepository(context.read<ApiClient>());
    return ModuleListPage<BnkAccount>(
      searchHint: 'Banka veya hesap ara…',
      emptyIcon: Icons.account_balance_outlined,
      emptyTitle: 'Banka hesabı yok',
      loadItems: (s) => repo.list(search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.account_balance_outlined,
        title: item.bankName,
        subtitle: '${item.accountName}\n${item.iban}',
        trailing: moduleCurrency.format(item.balance),
        badge: item.isActive ? 'Aktif' : 'Pasif',
        badgeTone: item.isActive ? LabelBadgeTone.success : LabelBadgeTone.secondary,
      ),
    );
  }
}
