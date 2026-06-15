import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/cari_picker_sheet.dart';
import '../../core/widgets/stk_picker_sheet.dart';
import '../../features/cari/cari_models.dart';
import '../../features/finance/finance_utils.dart';
import '../stok/stk_repository.dart';
import 'exp_repository.dart';

class _LineDraft {
  _LineDraft({
    this.serviceDefinitionId,
    this.itemId,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.unitId,
    required this.taxRateId,
  });

  int? serviceDefinitionId;
  int? itemId;
  String description;
  final TextEditingController quantity;
  final TextEditingController unitPrice;
  int unitId;
  int taxRateId;

  void dispose() {
    quantity.dispose();
    unitPrice.dispose();
  }
}

class ExpFormScreen extends StatefulWidget {
  const ExpFormScreen({super.key});

  @override
  State<ExpFormScreen> createState() => _ExpFormScreenState();
}

class _ExpFormScreenState extends State<ExpFormScreen> {
  final _notes = TextEditingController();
  final _lines = <_LineDraft>[];
  CariAccount? _cari;
  List<ExpService> _services = [];
  List<CoreLookup> _units = [];
  List<TaxRate> _taxRates = [];
  String _expenseDate = todayIso();
  String _paymentMethod = 'NAKIT';
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLookups();
  }

  @override
  void dispose() {
    _notes.dispose();
    for (final line in _lines) {
      line.dispose();
    }
    super.dispose();
  }

  _LineDraft _newLine(List<CoreLookup> units, List<TaxRate> taxRates) => _LineDraft(
        description: '',
        quantity: TextEditingController(text: '1'),
        unitId: units.first.id,
        unitPrice: TextEditingController(),
        taxRateId: taxRates.firstWhere((t) => t.rate == 20, orElse: () => taxRates.first).id,
      );

  Future<void> _loadLookups() async {
    try {
      final api = context.read<ApiClient>();
      final core = CoreRepository(api);
      final exp = ExpRepository(api);
      final units = await core.units();
      final taxRates = await core.taxRates();
      final services = await exp.services();
      if (!mounted) return;
      setState(() {
        _units = units;
        _taxRates = taxRates;
        _services = services;
        _lines.add(_newLine(units, taxRates));
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickCari() async {
    final picked = await showCariPickerSheet(context);
    if (picked != null) setState(() => _cari = picked);
  }

  Future<void> _pickDate() async {
    final initial = DateTime.tryParse(_expenseDate) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _expenseDate = picked.toIso8601String().substring(0, 10));
    }
  }

  Future<void> _pickItem(int index) async {
    final picked = await showStkPickerSheet(context);
    if (picked == null) return;
    final line = _lines[index];
    setState(() {
      line.itemId = picked.id;
      line.serviceDefinitionId = null;
      line.description = picked.name;
      if (picked.salesPrice != null) {
        line.unitPrice.text = picked.salesPrice!.toStringAsFixed(2);
      }
    });
    try {
      final detail = await StkRepository(context.read<ApiClient>()).getById(picked.id);
      if (!mounted) return;
      setState(() {
        line.taxRateId = detail['taxRateId'] as int? ?? line.taxRateId;
        final unit = _units.cast<CoreLookup?>().firstWhere(
              (u) => u!.name == picked.baseUnitName,
              orElse: () => _units.isNotEmpty ? _units.first : null,
            );
        if (unit != null) line.unitId = unit.id;
      });
    } catch (_) {}
  }

  double _lineTotal(_LineDraft line) {
    final qty = double.tryParse(line.quantity.text.replaceAll(',', '.')) ?? 0;
    final price = double.tryParse(line.unitPrice.text.replaceAll(',', '.')) ?? 0;
    final net = qty * price;
    final rate = _taxRates.cast<TaxRate?>().firstWhere((t) => t!.id == line.taxRateId, orElse: () => null)?.rate ?? 0;
    return net + (net * rate / 100);
  }

  double get _grandTotal => _lines.fold(0.0, (sum, line) => sum + _lineTotal(line));

  Future<void> _submit() async {
    if (_cari == null) {
      setState(() => _error = 'Cari seçin.');
      return;
    }
    if (_lines.isEmpty) {
      setState(() => _error = 'En az bir kalem ekleyin.');
      return;
    }
    final payloadLines = <Map<String, dynamic>>[];
    for (final line in _lines) {
      final desc = line.description.trim();
      if (desc.isEmpty) {
        setState(() => _error = 'Tüm kalemlerde açıklama zorunludur.');
        return;
      }
      final price = double.tryParse(line.unitPrice.text.replaceAll(',', '.'));
      if (price == null || price <= 0) {
        setState(() => _error = 'Geçerli birim fiyat girin.');
        return;
      }
      payloadLines.add({
        'serviceDefinitionId': line.serviceDefinitionId,
        'itemId': line.itemId,
        'description': desc,
        'quantity': double.parse(line.quantity.text.replaceAll(',', '.')),
        'unitId': line.unitId,
        'unitPrice': price,
        'taxRateId': line.taxRateId,
      });
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ExpRepository(context.read<ApiClient>()).create(
        accountId: _cari!.id,
        expenseDate: _expenseDate,
        paymentMethod: _paymentMethod,
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        lines: payloadLines,
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
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Yeni Masraf')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Yeni Masraf (Kapalı)')),
      body: ListView(
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
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Cari / Tedarikçi'),
            subtitle: Text(_cari?.title ?? 'Seçilmedi'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _pickCari,
          ),
          const SizedBox(height: 14),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Masraf Tarihi'),
            subtitle: Text(_expenseDate),
            trailing: const Icon(Icons.calendar_today_outlined),
            onTap: _pickDate,
          ),
          const SizedBox(height: 14),
          const Text('Ödeme Şekli', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final pm in const [
                ('NAKIT', 'Nakit'),
                ('HAVALE', 'Havale'),
                ('KREDI_KARTI', 'K. Kartı'),
                ('CEK', 'Çek'),
                ('SENET', 'Senet'),
              ])
                ChoiceChip(
                  label: Text(pm.$2),
                  selected: _paymentMethod == pm.$1,
                  onSelected: (_) => setState(() => _paymentMethod = pm.$1),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Expanded(child: Text('Kalemler', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
              TextButton.icon(
                onPressed: () => setState(() => _lines.add(_newLine(_units, _taxRates))),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Satır Ekle'),
              ),
            ],
          ),
          ...List.generate(_lines.length, (index) {
            final line = _lines[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Text('Kalem ${index + 1}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        if (_lines.length > 1)
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                            onPressed: () {
                              setState(() {
                                line.dispose();
                                _lines.removeAt(index);
                              });
                            },
                          ),
                      ],
                    ),
                    DropdownButtonFormField<int>(
                      value: line.serviceDefinitionId,
                      decoration: const InputDecoration(labelText: 'Hizmet Tanımı'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Hizmet seç...')),
                        ..._services.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))),
                      ],
                      onChanged: (v) {
                        final svc = _services.cast<ExpService?>().firstWhere((s) => s?.id == v, orElse: () => null);
                        setState(() {
                          line.serviceDefinitionId = v;
                          line.itemId = null;
                          if (svc != null) {
                            line.description = svc.name;
                            if (svc.defaultTaxRateId != null) line.taxRateId = svc.defaultTaxRateId!;
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('veya Stok Ürünü'),
                      subtitle: Text(line.itemId != null ? line.description : 'Seçilmedi'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _pickItem(index),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      initialValue: line.description,
                      decoration: const InputDecoration(labelText: 'Açıklama'),
                      onChanged: (v) => line.description = v,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: line.quantity,
                            decoration: const InputDecoration(labelText: 'Miktar'),
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: line.unitPrice,
                            decoration: const InputDecoration(labelText: 'Birim Fiyat'),
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<int>(
                      value: line.unitId,
                      decoration: const InputDecoration(labelText: 'Birim'),
                      items: _units.map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))).toList(),
                      onChanged: (v) => setState(() => line.unitId = v!),
                    ),
                  ],
                ),
              ),
            );
          }),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              'Toplam: ${financeCurrency.format(_grandTotal)}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
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
            child: Text(_saving ? 'Kaydediliyor…' : 'Kaydet (Kapalı Fatura)'),
          ),
        ],
      ),
    );
  }
}
