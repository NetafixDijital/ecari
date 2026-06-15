import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'svc_detail_screen.dart';
import 'svc_repository.dart';

class SvcListScreen extends StatefulWidget {
  const SvcListScreen({super.key});

  @override
  State<SvcListScreen> createState() => _SvcListScreenState();
}

class _SvcListScreenState extends State<SvcListScreen> {
  int _statusIndex = 0;
  int _refreshKey = 0;

  static const _statusKeys = <String?>[null, 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];
  static const _statusLabels = ['Tümü', 'Beklemede', 'İşlemde', 'Tamamlandı', 'Teslim'];

  @override
  Widget build(BuildContext context) {
    final repo = SvcRepository(context.read<ApiClient>());
    final status = _statusKeys[_statusIndex];

    return ModuleListPage<SvcTicket>(
      key: ValueKey('$_refreshKey-$status'),
      searchHint: 'Servis kaydı ara…',
      emptyIcon: Icons.build_outlined,
      emptyTitle: 'Servis kaydı yok',
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
        leadingIcon: Icons.build_outlined,
        title: item.ticketNo,
        subtitle: '${item.accountTitle}\n${item.problemDescription}',
        badge: item.statusLabel,
        badgeTone: statusTone(item.statusKey),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => SvcDetailScreen(id: item.id)),
        ),
      ),
    );
  }
}
