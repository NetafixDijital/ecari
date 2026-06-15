import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'exp_repository.dart';

class ExpDetailScreen extends StatelessWidget {
  const ExpDetailScreen({super.key, required this.id});

  final int id;

  @override
  Widget build(BuildContext context) {
    final repo = ExpRepository(context.read<ApiClient>());
    return ModuleDetailLoader(
      title: 'Masraf Detayı',
      load: () => repo.getById(id),
      buildFields: (data) => [
        DetailField('Belge No', data['documentNo'] as String? ?? ''),
        DetailField('Cari', data['accountTitle'] as String? ?? ''),
        DetailField('Tarih', data['expenseDate'] as String? ?? ''),
        DetailField('Ödeme', data['paymentMethodLabel'] as String? ?? ''),
        DetailField('Ara Toplam', moduleCurrency.format((data['subtotal'] as num?)?.toDouble() ?? 0)),
        DetailField('KDV', moduleCurrency.format((data['taxTotal'] as num?)?.toDouble() ?? 0)),
        DetailField('Genel Toplam', moduleCurrency.format((data['grandTotal'] as num?)?.toDouble() ?? 0)),
        DetailField(
          'Durum',
          '',
          badge: data['statusLabel'] as String? ?? '',
          badgeTone: statusTone(data['statusKey'] as String?),
        ),
      ],
      buildLines: (data) {
        final lines = data['lines'] as List<dynamic>? ?? [];
        return lines.map((raw) {
          final line = raw as Map<String, dynamic>;
          return DocumentLine(
            lineNo: line['lineNo'] as int? ?? 0,
            description: '${line['serviceName'] ?? ''} ${line['description']}'.trim(),
            quantity: '${line['quantity']}',
            unitName: line['unitName'] as String? ?? '',
            lineTotal: (line['lineTotal'] as num?)?.toDouble() ?? 0,
          );
        }).toList();
      },
      buildFooter: (data) => _ExpActions(id: id, data: data),
    );
  }
}

class _ExpActions extends StatefulWidget {
  const _ExpActions({required this.id, required this.data});
  final int id;
  final Map<String, dynamic> data;

  @override
  State<_ExpActions> createState() => _ExpActionsState();
}

class _ExpActionsState extends State<_ExpActions> {
  bool _busy = false;
  String? _error;

  String get _statusKey => widget.data['statusKey'] as String? ?? '';
  bool get _hasInvoice => widget.data['purchaseInvoiceId'] != null;

  Future<void> _approve() async {
    await _run(() => ExpRepository(context.read<ApiClient>()).updateStatus(id: widget.id, action: 'approve'));
  }

  Future<void> _reject() async {
    await _run(() => ExpRepository(context.read<ApiClient>()).updateStatus(id: widget.id, action: 'reject'));
  }

  Future<void> _pay() async {
    await _run(() => ExpRepository(context.read<ApiClient>()).pay(id: widget.id));
  }

  Future<void> _run(Future<Map<String, dynamic>> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('İşlem tamamlandı')));
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = _statusKey.contains('bekliyor') || _statusKey.contains('pending');
    final approved = _statusKey.contains('onaylandi') || _statusKey.contains('approved');
    final rejected = _statusKey.contains('reddedildi') || _statusKey.contains('rejected');
    final paid = _statusKey.contains('odendi') || _hasInvoice;

    if (rejected || paid) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ),
        if (pending) ...[
          FilledButton(
            onPressed: _busy ? null : _approve,
            child: Text(_busy ? 'İşleniyor…' : 'Onayla'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _busy ? null : _reject,
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Reddet'),
          ),
        ],
        if (approved && !_hasInvoice) ...[
          if (pending) const SizedBox(height: 8),
          FilledButton(
            onPressed: _busy ? null : _pay,
            child: Text(_busy ? 'Ödeniyor…' : 'Öde (Alış Faturası Oluştur)'),
          ),
        ],
      ],
    );
  }
}
