import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/cari_picker_sheet.dart';
import '../../features/cari/cari_models.dart';
import '../../features/finance/finance_utils.dart';
import 'chq_repository.dart';

class ChqFormScreen extends StatefulWidget {
  const ChqFormScreen({super.key, this.direction = 'RECEIVED'});

  final String direction;

  @override
  State<ChqFormScreen> createState() => _ChqFormScreenState();
}

class _ChqFormScreenState extends State<ChqFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _instrumentNo = TextEditingController();
  final _bankName = TextEditingController();
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  CariAccount? _cari;
  String _instrumentType = 'CHECK';
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _instrumentNo.dispose();
    _bankName.dispose();
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickCari() async {
    final picked = await showCariPickerSheet(context);
    if (picked != null) setState(() => _cari = picked);
  }

  Future<void> _submit() async {
    if (_cari == null) {
      setState(() => _error = 'Cari seçin.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = ChqRepository(context.read<ApiClient>());
      await repo.create(
        instrumentType: _instrumentType,
        direction: widget.direction,
        accountId: _cari!.id,
        instrumentNo: _instrumentNo.text.trim(),
        issueDate: todayIso(),
        dueDate: todayIso(),
        amount: double.parse(_amount.text.trim().replaceAll(',', '.')),
        bankName: _bankName.text.trim().isEmpty ? null : _bankName.text.trim(),
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.direction == 'ISSUED' ? 'Yeni Verilen Çek' : 'Yeni Alınan Çek')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.dangerSubtle, borderRadius: BorderRadius.circular(8)),
                child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ),
              const SizedBox(height: 12),
            ],
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'CHECK', label: Text('Çek')),
                ButtonSegment(value: 'PROMISSORY', label: Text('Senet')),
              ],
              selected: {_instrumentType},
              onSelectionChanged: (s) => setState(() => _instrumentType = s.first),
            ),
            const SizedBox(height: 14),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Cari'),
              subtitle: Text(_cari?.title ?? 'Seçilmedi'),
              trailing: const Icon(Icons.chevron_right),
              onTap: _pickCari,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _instrumentNo,
              decoration: const InputDecoration(labelText: 'Çek / Senet No'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _bankName,
              decoration: const InputDecoration(labelText: 'Banka'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _amount,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
              decoration: const InputDecoration(labelText: 'Tutar (₺)'),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Zorunlu';
                final n = double.tryParse(v.replaceAll(',', '.'));
                if (n == null || n <= 0) return 'Geçerli tutar girin';
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _notes,
              decoration: const InputDecoration(labelText: 'Not'),
              maxLines: 2,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: Text(_saving ? 'Kaydediliyor…' : 'Kaydet'),
            ),
          ],
        ),
      ),
    );
  }
}
