import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'chq_repository.dart';

class ChqDetailScreen extends StatefulWidget {
  const ChqDetailScreen({super.key, required this.instrument});

  final ChqInstrument instrument;

  @override
  State<ChqDetailScreen> createState() => _ChqDetailScreenState();
}

class _ChqDetailScreenState extends State<ChqDetailScreen> {
  late ChqInstrument _instrument;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _instrument = widget.instrument;
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _busy = true);
    try {
      final updated = await ChqRepository(context.read<ApiClient>()).updateStatus(
        id: _instrument.id,
        status: status,
      );
      if (!mounted) return;
      setState(() => _instrument = updated);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Durum güncellendi')));
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModuleDetailScaffold(
      title: 'Çek / Senet Detayı',
      fields: [
        DetailField('No', _instrument.instrumentNo),
        DetailField('Cari', _instrument.accountTitle),
        if (_instrument.bankName != null) DetailField('Banka', _instrument.bankName!),
        if (_instrument.instrumentType != null) DetailField('Tür', _instrument.instrumentType!),
        DetailField('Vade', _instrument.dueDate),
        DetailField('Tutar', moduleCurrency.format(_instrument.amount)),
        DetailField(
          'Durum',
          '',
          badge: _instrument.statusLabel,
          badgeTone: statusTone(_instrument.statusKey),
        ),
      ],
      footer: _busy
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (_instrument.statusKey != 'collected')
                  ActionChip(label: const Text('Tahsil'), onPressed: () => _updateStatus('COLLECTED')),
                if (_instrument.statusKey != 'paid')
                  ActionChip(label: const Text('Ödendi'), onPressed: () => _updateStatus('PAID')),
                if (_instrument.statusKey != 'portfolio')
                  ActionChip(label: const Text('Portföy'), onPressed: () => _updateStatus('PORTFOLIO')),
                if (_instrument.statusKey != 'bounced')
                  ActionChip(label: const Text('Karşılıksız'), onPressed: () => _updateStatus('BOUNCED')),
              ],
            ),
    );
  }
}
