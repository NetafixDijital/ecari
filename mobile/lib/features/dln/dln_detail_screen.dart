import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'dln_repository.dart';

class DlnDetailScreen extends StatelessWidget {
  const DlnDetailScreen({super.key, required this.id});

  final int id;

  @override
  Widget build(BuildContext context) {
    final repo = DlnRepository(context.read<ApiClient>());
    return ModuleDetailLoader(
      title: 'İrsaliye Detayı',
      load: () => repo.getById(id),
      buildFields: (data) => [
        DetailField('Belge No', data['documentNo'] as String? ?? ''),
        DetailField('Cari', data['accountTitle'] as String? ?? ''),
        DetailField('Tarih', data['documentDate'] as String? ?? ''),
        if (data['warehouseName'] != null) DetailField('Depo', data['warehouseName'] as String),
        DetailField(
          'Durum',
          '',
          badge: data['statusLabel'] as String? ?? '',
          badgeTone: statusTone(data['statusKey'] as String?),
        ),
        if (data['shippingAddress'] != null) DetailField('Sevk Adresi', data['shippingAddress'] as String),
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
            lineTotal: 0,
          );
        }).toList();
      },
      buildFooter: (data) => _DlnActions(id: id, data: data),
    );
  }
}

class _DlnActions extends StatefulWidget {
  const _DlnActions({required this.id, required this.data});
  final int id;
  final Map<String, dynamic> data;

  @override
  State<_DlnActions> createState() => _DlnActionsState();
}

class _DlnActionsState extends State<_DlnActions> {
  bool _busy = false;
  String? _error;

  String get _statusKey => widget.data['statusKey'] as String? ?? '';
  bool get _canConvert => _statusKey != 'iptal' && _statusKey != 'cancelled';
  bool get _canDelete => _statusKey != 'teslim' && _statusKey != 'delivered';

  Future<void> _convertToInv() async {
    await _run(
      () => DlnRepository(context.read<ApiClient>()).convertToInvoice(widget.id),
      (r) => 'Fatura: ${r['invoiceDocumentNo']}',
    );
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('İrsaliyeyi Sil'),
        content: const Text('Bu irsaliye silinsin mi?'),
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
    await _run(
      () async {
        await DlnRepository(context.read<ApiClient>()).delete(widget.id);
        return <String, dynamic>{};
      },
      (_) => 'İrsaliye silindi',
      pop: true,
    );
  }

  Future<void> _run(
    Future<Map<String, dynamic>> Function() action,
    String Function(Map<String, dynamic>) message, {
    bool pop = false,
  }) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await action();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message(result))));
      if (pop) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_canConvert && !_canDelete) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ),
        if (_canConvert)
          FilledButton(
            onPressed: _busy ? null : _convertToInv,
            child: Text(_busy ? 'Dönüştürülüyor…' : 'Faturaya Dönüştür'),
          ),
        if (_canDelete) ...[
          if (_canConvert) const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _busy ? null : _delete,
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Sil'),
          ),
        ],
      ],
    );
  }
}
