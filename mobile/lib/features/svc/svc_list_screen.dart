import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'svc_repository.dart';

class SvcListScreen extends StatelessWidget {
  const SvcListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = SvcRepository(context.read<ApiClient>());
    return ModuleListPage<SvcTicket>(
      searchHint: 'Servis kaydı ara…',
      emptyIcon: Icons.build_outlined,
      emptyTitle: 'Servis kaydı yok',
      loadItems: (s) => repo.list(search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.build_outlined,
        title: item.ticketNo,
        subtitle: '${item.accountTitle}\n${item.problemDescription}',
        badge: item.statusLabel,
        badgeTone: statusTone(item.statusKey),
      ),
    );
  }
}
