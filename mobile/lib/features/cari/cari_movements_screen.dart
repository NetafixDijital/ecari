import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'cari_models.dart';
import 'cari_repository.dart';

class CariMovementsScreen extends StatefulWidget {
  const CariMovementsScreen({super.key});

  @override
  State<CariMovementsScreen> createState() => _CariMovementsScreenState();
}

class _CariMovementsScreenState extends State<CariMovementsScreen> {
  CariAccount? _selected;
  List<CariAccount> _cariler = [];

  @override
  void initState() {
    super.initState();
    _loadCariler();
  }

  Future<void> _loadCariler() async {
    try {
      final items = await CariRepository(context.read<ApiClient>()).list();
      if (mounted) setState(() => _cariler = items.where((c) => c.isActive).toList());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final repo = CariRepository(context.read<ApiClient>());

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: DropdownButtonFormField<CariAccount?>(
            value: _selected,
            decoration: const InputDecoration(labelText: 'Cari filtresi'),
            items: [
              const DropdownMenuItem<CariAccount?>(value: null, child: Text('Tüm cariler (cari seçin)')),
              ..._cariler.map((c) => DropdownMenuItem(value: c, child: Text('${c.code} · ${c.title}'))),
            ],
            onChanged: (v) => setState(() => _selected = v),
          ),
        ),
        Expanded(
          child: _selected == null
              ? const Center(child: Text('Hareketleri görmek için cari seçin'))
              : ModuleListPage<CariMovement>(
                  key: ValueKey(_selected!.id),
                  searchHint: 'Hareket ara…',
                  emptyIcon: Icons.swap_vert_outlined,
                  emptyTitle: 'Hareket yok',
                  loadItems: (s) => repo.movements(accountId: _selected!.id, search: s),
                  itemBuilder: (context, m) => ModuleListTile(
                    leadingIcon: Icons.swap_vert_outlined,
                    title: m.movementTypeLabel,
                    subtitle: '${m.movementDate}${m.description != null ? ' · ${m.description}' : ''}',
                    trailing: m.debit > 0
                        ? moduleCurrency.format(m.debit)
                        : (m.credit > 0 ? moduleCurrency.format(m.credit) : null),
                    badge: moduleCurrency.format(m.runningBalance),
                    badgeTone: LabelBadgeTone.primary,
                  ),
                ),
        ),
      ],
    );
  }
}
