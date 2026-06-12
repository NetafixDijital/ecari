import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'inv_repository.dart';

class InvListScreen extends StatelessWidget {
  const InvListScreen({super.key, required this.type, required this.title});

  final String type; // SALES | PURCHASE
  final String title;

  @override
  Widget build(BuildContext context) {
    final repo = InvRepository(context.read<ApiClient>());
    return ModuleListPage<InvInvoice>(
      searchHint: 'Fatura no veya cari ara…',
      emptyIcon: Icons.receipt_long_outlined,
      emptyTitle: 'Fatura bulunamadı',
      loadItems: (s) => repo.list(type: type, search: s),
      itemBuilder: (context, item) => ModuleListTile(
        leadingIcon: Icons.receipt_long_outlined,
        title: item.documentNo,
        subtitle: '${item.accountTitle}\n${item.documentDate}${item.dueDate != null ? ' · Vade: ${item.dueDate}' : ''}',
        trailing: moduleCurrency.format(item.grandTotal),
        badge: item.paymentStatusLabel,
        badgeTone: statusTone(item.paymentStatusKey),
      ),
    );
  }
}
