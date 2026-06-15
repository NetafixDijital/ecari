import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'chq_detail_screen.dart';
import 'chq_repository.dart';

const _chqStatusOptions = [
  ('PENDING', 'Beklemede'),
  ('PORTFOLIO', 'Portföyde'),
  ('COLLECTED', 'Tahsil edildi'),
  ('PAID', 'Ödendi'),
  ('BOUNCED', 'Karşılıksız'),
  ('ENDORSED', 'Ciro edildi'),
];

class ChqListScreen extends StatefulWidget {
  const ChqListScreen({super.key});

  @override
  State<ChqListScreen> createState() => _ChqListScreenState();
}

class _ChqListScreenState extends State<ChqListScreen> {
  int _dirIndex = 0;
  int _refreshKey = 0;

  Future<void> _updateStatus(ChqInstrument item, String status) async {
    try {
      await ChqRepository(context.read<ApiClient>()).updateStatus(id: item.id, status: status);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Durum güncellendi')));
      setState(() => _refreshKey++);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    }
  }

  Future<void> _showStatusSheet(ChqInstrument item) async {
    final status = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Text('Durum: ${item.instrumentNo}', style: Theme.of(ctx).textTheme.titleMedium),
            ),
            ..._chqStatusOptions.map(
              (opt) => ListTile(
                title: Text(opt.$2),
                trailing: item.statusKey == opt.$1.toLowerCase() ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () => Navigator.pop(ctx, opt.$1),
              ),
            ),
          ],
        ),
      ),
    );
    if (status != null && status != item.statusKey.toUpperCase()) {
      await _updateStatus(item, status);
    }
  }

  @override
  Widget build(BuildContext context) {
    final repo = ChqRepository(context.read<ApiClient>());
    final direction = _dirIndex == 0 ? 'RECEIVED' : 'ISSUED';

    return ModuleListPage<ChqInstrument>(
      key: ValueKey('$direction-$_refreshKey'),
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
        onTap: () async {
          final updated = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => ChqDetailScreen(instrument: item)),
          );
          if (updated == true && mounted) setState(() => _refreshKey++);
        },
        onLongPress: () => _showStatusSheet(item),
      ),
    );
  }
}
