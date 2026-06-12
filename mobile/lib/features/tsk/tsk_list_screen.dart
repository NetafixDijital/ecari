import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'tsk_repository.dart';

class TskListScreen extends StatelessWidget {
  const TskListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = TskRepository(context.read<ApiClient>());
    return ModuleListPage<TskTask>(
      searchHint: 'Görev ara…',
      emptyIcon: Icons.checklist_outlined,
      emptyTitle: 'Görev bulunamadı',
      loadItems: (s) => repo.list(search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.checklist_outlined,
        title: item.title,
        subtitle: '${item.taskNo} · ${item.endDate}${item.assigneeName != null ? ' · ${item.assigneeName}' : ''}',
        badge: '${item.statusLabel} · %${item.progressPercent}',
        badgeTone: statusTone(item.statusKey),
      ),
    );
  }
}
