import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'dln_repository.dart';

class DlnListScreen extends StatefulWidget {
  const DlnListScreen({super.key, this.fixedType, this.reportMode = false});

  /// SALES | PURCHASE — verilirse filtre gizlenir.
  final String? fixedType;
  final bool reportMode;

  @override
  State<DlnListScreen> createState() => _DlnListScreenState();
}

class _DlnListScreenState extends State<DlnListScreen> {
  late int _typeIndex;

  @override
  void initState() {
    super.initState();
    _typeIndex = widget.fixedType == 'PURCHASE' ? 1 : 0;
  }

  String get _type => _typeIndex == 0 ? 'SALES' : 'PURCHASE';

  @override
  Widget build(BuildContext context) {
    final repo = DlnRepository(context.read<ApiClient>());

    return ModuleListPage<DlnNote>(
      key: ValueKey(_type),
      searchHint: 'İrsaliye no veya cari ara…',
      emptyIcon: Icons.local_shipping_outlined,
      emptyTitle: widget.reportMode ? 'Rapor kaydı yok' : 'İrsaliye bulunamadı',
      filterBar: widget.fixedType == null
          ? ModuleFilterBar(
              labels: const ['Satış', 'Alış'],
              selectedIndex: _typeIndex,
              onChanged: (i) => setState(() => _typeIndex = i),
            )
          : null,
      loadItems: (s) => repo.list(type: _type, search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.local_shipping_outlined,
        title: item.documentNo,
        subtitle: '${item.accountTitle} · ${item.documentDate}',
        badge: item.statusLabel,
        badgeTone: statusTone(item.statusKey),
      ),
    );
  }
}
