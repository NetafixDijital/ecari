import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'qot_repository.dart';

class QotDetailScreen extends StatelessWidget {
  const QotDetailScreen({super.key, required this.id});

  final int id;

  @override
  Widget build(BuildContext context) {
    final repo = QotRepository(context.read<ApiClient>());
    return ModuleDetailLoader(
      title: 'Teklif Detayı',
      load: () => repo.getById(id),
      buildFields: (data) => [
        DetailField('Belge No', data['documentNo'] as String? ?? ''),
        DetailField('Cari', data['accountTitle'] as String? ?? ''),
        DetailField('Tarih', data['documentDate'] as String? ?? ''),
        if (data['validUntil'] != null) DetailField('Geçerlilik', data['validUntil'] as String),
        DetailField('Ara Toplam', moduleCurrency.format((data['subtotal'] as num?)?.toDouble() ?? 0)),
        DetailField('KDV', moduleCurrency.format((data['taxTotal'] as num?)?.toDouble() ?? 0)),
        DetailField('Genel Toplam', moduleCurrency.format((data['grandTotal'] as num?)?.toDouble() ?? 0)),
        DetailField(
          'Durum',
          '',
          badge: data['statusLabel'] as String? ?? '',
          badgeTone: statusTone(data['statusKey'] as String?),
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
      buildFooter: (data) {
        final statusKey = data['statusKey'] as String? ?? '';
        final convertedOrderId = data['convertedOrderId'] as int?;
        if (statusKey == 'donusturuldu' && convertedOrderId != null) {
          return LabelBadge(label: 'Sipariş #$convertedOrderId', tone: LabelBadgeTone.success);
        }
        if (statusKey == 'donusturuldu' || statusKey == 'iptal') return null;
        return _QotActions(id: id, data: data);
      },
    );
  }
}

class _QotActions extends StatefulWidget {
  const _QotActions({required this.id, required this.data});
  final int id;
  final Map<String, dynamic> data;

  @override
  State<_QotActions> createState() => _QotActionsState();
}

class _QotActionsState extends State<_QotActions> {
  bool _busy = false;
  String? _error;

  Future<void> _convert() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final repo = QotRepository(context.read<ApiClient>());
      final result = await repo.convertToOrder(widget.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sipariş oluşturuldu: ${result['orderDocumentNo']}')),
      );
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
            child: Text(_error!, style: const TextStyle(color: Colors.red)),
          ),
        FilledButton(
          onPressed: _busy ? null : _convert,
          child: Text(_busy ? 'Dönüştürülüyor…' : 'Siparişe Dönüştür'),
        ),
      ],
    );
  }
}
