import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'inv_repository.dart';

class InvDetailScreen extends StatelessWidget {
  const InvDetailScreen({super.key, required this.id});

  final int id;

  @override
  Widget build(BuildContext context) {
    final repo = InvRepository(context.read<ApiClient>());
    return ModuleDetailLoader(
      title: 'Fatura Detayı',
      load: () => repo.getById(id),
      buildFields: (data) => [
        DetailField('Belge No', data['documentNo'] as String? ?? ''),
        DetailField('Cari', data['accountTitle'] as String? ?? ''),
        DetailField('Tarih', data['documentDate'] as String? ?? ''),
        if (data['dueDate'] != null) DetailField('Vade', data['dueDate'] as String),
        DetailField('Ara Toplam', moduleCurrency.format((data['subtotal'] as num?)?.toDouble() ?? 0)),
        DetailField('KDV', moduleCurrency.format((data['taxTotal'] as num?)?.toDouble() ?? 0)),
        DetailField('Genel Toplam', moduleCurrency.format((data['grandTotal'] as num?)?.toDouble() ?? 0)),
        DetailField(
          'Ödeme Durumu',
          '',
          badge: data['paymentStatusLabel'] as String? ?? '',
          badgeTone: statusTone(data['paymentStatusKey'] as String?),
        ),
        if (data['notes'] != null && (data['notes'] as String).isNotEmpty)
          DetailField('Not', data['notes'] as String),
      ],
      buildLines: (data) {
        final lines = data['lines'] as List<dynamic>? ?? [];
        return lines.map((raw) {
          final line = raw as Map<String, dynamic>;
          return DocumentLine(
            lineNo: line['lineNo'] as int? ?? 0,
            description: line['description'] as String? ?? '',
            quantity: '${line['quantity']}',
            unitName: line['unitName'] as String? ?? '',
            lineTotal: (line['lineTotal'] as num?)?.toDouble() ?? 0,
          );
        }).toList();
      },
      buildFooter: (_) => _InvDeleteAction(id: id),
    );
  }
}

class _InvDeleteAction extends StatefulWidget {
  const _InvDeleteAction({required this.id});
  final int id;

  @override
  State<_InvDeleteAction> createState() => _InvDeleteActionState();
}

class _InvDeleteActionState extends State<_InvDeleteAction> {
  bool _busy = false;
  String? _error;

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Faturayı Sil'),
        content: const Text('Bu fatura silinsin mi?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await InvRepository(context.read<ApiClient>()).delete(widget.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fatura silindi')));
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ),
        OutlinedButton(
          onPressed: _busy ? null : _delete,
          style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
          child: Text(_busy ? 'Siliniyor…' : 'Sil'),
        ),
      ],
    );
  }
}
