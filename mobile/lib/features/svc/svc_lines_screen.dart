import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/stk_picker_sheet.dart';
import '../stok/stk_repository.dart';
import 'svc_repository.dart';

class _LineDraft {
  _LineDraft({
    this.serviceDefinitionId,
    this.itemId,
    required this.description,
    required this.quantity,
    required this.unitId,
    required this.unitPrice,
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

class SvcLinesScreen extends StatefulWidget {
  const SvcLinesScreen({super.key, required this.ticketId, required this.invoiced});

  final int ticketId;
  final bool invoiced;

  @override
  State<SvcLinesScreen> createState() => _SvcLinesScreenState();
}

class _SvcLinesScreenState extends State<SvcLinesScreen> {
  final _lines = <_LineDraft>[];
  List<SvcService> _services = [];
  List<CoreLookup> _units = [];
  List<TaxRate> _taxRates = [];
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final line in _lines) {
      line.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = context.read<ApiClient>();
      final repo = SvcRepository(api);
      final core = CoreRepository(api);
      final ticket = await repo.getById(widget.ticketId);
      final services = await repo.services();
      final units = await core.units();
      final taxRates = await core.taxRates();
      if (!mounted) return;
      setState(() {
        _services = services;
        _units = units;
        _taxRates = taxRates;
        _lines.clear();
        if (ticket.lines.isEmpty) {
          _lines.add(_newLine(units, taxRates));
        } else {
          for (final line in ticket.lines) {
            final unitId = units.cast<CoreLookup?>().firstWhere(
                  (u) => u!.name == line.unitName,
                  orElse: () => units.isNotEmpty ? units.first : null,
                )?.id ?? units.first.id;
            _lines.add(_LineDraft(
              serviceDefinitionId: line.serviceDefinitionId,
              itemId: line.itemId,
              description: line.description,
              quantity: TextEditingController(text: line.quantity.toString()),
              unitId: unitId,
              unitPrice: TextEditingController(text: line.unitPrice.toStringAsFixed(2)),
              taxRateId: line.taxRateId ?? taxRates.first.id,
            ));
          }
        }
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = context.read<ApiClient>().messageFromError(e);
        });
      }
    }
  }

  _LineDraft _newLine(List<CoreLookup> units, List<TaxRate> taxRates) => _LineDraft(
        description: '',
        quantity: TextEditingController(text: '1'),
        unitId: units.first.id,
        unitPrice: TextEditingController(),
        taxRateId: taxRates.firstWhere((t) => t.rate == 20, orElse: () => taxRates.first).id,
      );

  Future<void> _pickStok(_LineDraft line) async {
    final picked = await showStkPickerSheet(context);
    if (picked == null) return;
    try {
      final detail = await StkRepository(context.read<ApiClient>()).getById(picked.id);
      if (!mounted) return;
      setState(() {
        line.itemId = picked.id;
        line.serviceDefinitionId = null;
        line.description = picked.name;
        line.unitPrice.text = (picked.salesPrice ?? 0).toStringAsFixed(2);
        line.taxRateId = detail['taxRateId'] as int? ?? line.taxRateId;
      });
    } catch (_) {}
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await SvcRepository(context.read<ApiClient>()).saveLines(
        id: widget.ticketId,
        lines: _lines.map((line) => {
          'serviceDefinitionId': line.serviceDefinitionId,
          'itemId': line.itemId,
          'description': line.description,
          'quantity': double.parse(line.quantity.text.replaceAll(',', '.')),
          'unitId': line.unitId,
          'unitPrice': double.parse(line.unitPrice.text.replaceAll(',', '.')),
          'taxRateId': line.taxRateId,
        }).toList(),
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
        appBar: AppBar(title: const Text('Malzeme & Hizmet')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Malzeme & Hizmet')),
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
          ..._lines.asMap().entries.map((entry) {
            final idx = entry.key;
            final line = entry.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Satır ${idx + 1}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<int?>(
                      value: line.serviceDefinitionId,
                      decoration: const InputDecoration(labelText: 'Hizmet'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('— Hizmet seç —')),
                        ..._services.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))),
                      ],
                      onChanged: widget.invoiced
                          ? null
                          : (v) {
                              if (v == null) return;
                              final svc = _services.firstWhere((s) => s.id == v);
                              setState(() {
                                line.serviceDefinitionId = svc.id;
                                line.itemId = null;
                                line.description = svc.name;
                                line.taxRateId = svc.defaultTaxRateId ?? line.taxRateId;
                              });
                            },
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: widget.invoiced ? null : () => _pickStok(line),
                      icon: const Icon(Icons.inventory_2_outlined, size: 18),
                      label: Text(line.itemId != null ? 'Stok: ${line.description}' : 'Stok / Malzeme Seç'),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      initialValue: line.description,
                      decoration: const InputDecoration(labelText: 'Açıklama'),
                      enabled: !widget.invoiced,
                      onChanged: (v) => line.description = v,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: line.quantity,
                            enabled: !widget.invoiced,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(labelText: 'Miktar'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: line.unitPrice,
                            enabled: !widget.invoiced,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(labelText: 'Birim Fiyat'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<int>(
                      value: line.taxRateId,
                      decoration: const InputDecoration(labelText: 'KDV'),
                      items: _taxRates.map((t) => DropdownMenuItem(value: t.id, child: Text('%${t.rate}'))).toList(),
                      onChanged: widget.invoiced ? null : (v) => setState(() => line.taxRateId = v ?? line.taxRateId),
                    ),
                    if (!widget.invoiced && _lines.length > 1)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => setState(() {
                            _lines[idx].dispose();
                            _lines.removeAt(idx);
                          }),
                          child: const Text('Satırı Sil', style: TextStyle(color: AppColors.danger)),
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
          if (!widget.invoiced) ...[
            OutlinedButton.icon(
              onPressed: () => setState(() => _lines.add(_newLine(_units, _taxRates))),
              icon: const Icon(Icons.add),
              label: const Text('Satır Ekle'),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Kaydediliyor...' : 'Kalemleri Kaydet'),
            ),
          ],
        ],
      ),
    );
  }
}
