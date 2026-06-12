import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'csh_repository.dart';

class CshListScreen extends StatelessWidget {
  const CshListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = CshRepository(context.read<ApiClient>());
    return ModuleListPage<CshAccount>(
      searchHint: 'Kasa adı veya kodu ara…',
      emptyIcon: Icons.payments_outlined,
      emptyTitle: 'Kasa hesabı yok',
      loadItems: (s) => repo.list(search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.payments_outlined,
        title: item.name,
        subtitle: item.code,
        trailing: moduleCurrency.format(item.balance),
        badge: item.isActive ? 'Aktif' : 'Pasif',
        badgeTone: item.isActive ? LabelBadgeTone.success : LabelBadgeTone.secondary,
      ),
    );
  }
}
