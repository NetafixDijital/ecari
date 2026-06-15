import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'svc_form_screen.dart';
import 'svc_lines_screen.dart';
import 'svc_repository.dart';

class SvcDetailScreen extends StatefulWidget {
  const SvcDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<SvcDetailScreen> createState() => _SvcDetailScreenState();
}

class _SvcDetailScreenState extends State<SvcDetailScreen> {
  bool _loading = true;
  String? _error;
  SvcTicket? _ticket;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final ticket = await SvcRepository(context.read<ApiClient>()).getById(widget.id);
      if (!mounted) return;
      setState(() => _ticket = ticket);
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit() async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => SvcFormScreen(ticketId: widget.id)),
    );
    if (updated == true && mounted) _load();
  }

  Future<void> _delete() async {
    if (_ticket?.invoiceId != null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Servis Kaydını Sil'),
        content: const Text('Bu servis kaydı silinsin mi?'),
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
    try {
      await SvcRepository(context.read<ApiClient>()).delete(widget.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    }
  }

  Future<void> _changeStatus(String status) async {
    try {
      await SvcRepository(context.read<ApiClient>()).updateStatus(id: widget.id, status: status);
      if (!mounted) return;
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Durum güncellendi')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Servis Detayı')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (_error != null || _ticket == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Servis Detayı')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? 'Kayıt bulunamadı'),
              const SizedBox(height: 12),
              FilledButton(onPressed: _load, child: const Text('Tekrar Dene')),
            ],
          ),
        ),
      );
    }

    final ticket = _ticket!;
    return ModuleDetailScaffold(
      title: 'Servis Detayı',
      fields: [
        DetailField('Kayıt No', ticket.ticketNo),
        DetailField('Cari', ticket.accountTitle),
        if (ticket.ticketDate != null) DetailField('Tarih', ticket.ticketDate!),
        if (ticket.deviceName != null) DetailField('Cihaz', ticket.deviceName!),
        DetailField('Problem', ticket.problemDescription),
        if (ticket.technicianName != null) DetailField('Teknisyen', ticket.technicianName!),
        if (ticket.priorityLabel != null)
          DetailField(
            'Öncelik',
            '',
            badge: ticket.priorityLabel,
            badgeTone: LabelBadgeTone.primary,
          ),
        DetailField(
          'Durum',
          '',
          badge: ticket.statusLabel,
          badgeTone: statusTone(ticket.statusKey),
        ),
        if (ticket.resolution != null && ticket.resolution!.isNotEmpty)
          DetailField('Çözüm', ticket.resolution!),
        if (ticket.closedAt != null) DetailField('Kapanış', ticket.closedAt!),
        if (ticket.invoiceId != null) DetailField('Fatura', '#${ticket.invoiceId}'),
        if (ticket.grandTotal > 0)
          DetailField('Toplam', moduleCurrency.format(ticket.grandTotal)),
      ],
      lines: ticket.lines
          .map(
            (line) => DocumentLine(
              lineNo: line.lineNo,
              description: line.description,
              quantity: '${line.quantity}',
              unitName: line.unitName ?? '',
              lineTotal: line.lineTotal,
            ),
          )
          .toList(),
      footer: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          OutlinedButton.icon(
            onPressed: _edit,
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: const Text('Düzenle'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: ticket.invoiceId != null
                ? null
                : () async {
                    final updated = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(
                        builder: (_) => SvcLinesScreen(ticketId: widget.id, invoiced: ticket.invoiceId != null),
                      ),
                    );
                    if (updated == true && mounted) _load();
                  },
            icon: const Icon(Icons.build_circle_outlined, size: 18),
            label: Text(ticket.invoiceId != null ? 'Kalemler (faturalandı)' : 'Malzeme & Hizmet'),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (ticket.statusKey != 'islemde')
                ActionChip(label: const Text('İşlemde'), onPressed: () => _changeStatus('IN_PROGRESS')),
              if (ticket.statusKey != 'tamamlandi')
                ActionChip(label: const Text('Tamamlandı'), onPressed: () => _changeStatus('COMPLETED')),
              if (ticket.statusKey != 'teslim')
                ActionChip(label: const Text('Teslim'), onPressed: () => _changeStatus('DELIVERED')),
            ],
          ),
          if ((ticket.statusKey == 'tamamlandi' || ticket.statusKey == 'teslim') && ticket.invoiceId == null) ...[
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _convertToInvoice,
              child: const Text('Satış Faturasına Dönüştür'),
            ),
          ],
          if (ticket.invoiceId == null) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _delete,
              icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
              label: const Text('Sil', style: TextStyle(color: AppColors.danger)),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _convertToInvoice() async {
    var paymentMethod = 'NAKIT';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Faturaya Dönüştür'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Toplam: ${moduleCurrency.format(_ticket?.grandTotal ?? 0)}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              const Text('Ödeme yöntemi'),
              RadioListTile<String>(
                title: const Text('Nakit (Ödendi)'),
                value: 'NAKIT',
                groupValue: paymentMethod,
                onChanged: (v) => setDialogState(() => paymentMethod = v!),
              ),
              RadioListTile<String>(
                title: const Text('Veresiye (Açık fatura)'),
                value: 'VERESIYE',
                groupValue: paymentMethod,
                onChanged: (v) => setDialogState(() => paymentMethod = v!),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Oluştur')),
          ],
        ),
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      final result = await SvcRepository(context.read<ApiClient>()).convertToInvoice(
        id: widget.id,
        paymentMethod: paymentMethod,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fatura: ${result['invoiceDocumentNo']}')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    }
  }
}
