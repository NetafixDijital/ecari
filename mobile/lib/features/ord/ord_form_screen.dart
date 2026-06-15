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
import 'ord_repository.dart';

class OrdFormScreen extends StatefulWidget {
  const OrdFormScreen({super.key, this.orderType = 'SALES'});

  final String orderType;

  @override
  State<OrdFormScreen> createState() => _OrdFormScreenState();
}

class _OrdFormScreenState extends State<OrdFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _quantity = TextEditingController(text: '1');
  final _unitPrice = TextEditingController();
  final _notes = TextEditingController();
  CariAccount? _cari;
  StkItem? _item;
  List<CoreLookup> _units = [];
  List<TaxRate> _taxRates = [];
  int? _unitId;
  int? _taxRateId;
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
    _quantity.dispose();
    _unitPrice.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _loadLookups() async {
    try {
      final core = CoreRepository(context.read<ApiClient>());
      final units = await core.units();
      final taxRates = await core.taxRates();
      if (!mounted) return;
      setState(() {
        _units = units;
        _taxRates = taxRates;
        _unitId = units.isNotEmpty ? units.first.id : null;
        _taxRateId = taxRates.cast<TaxRate?>().firstWhere(
              (t) => t!.rate == 20,
              orElse: () => taxRates.isNotEmpty ? taxRates.first : null,
            )?.id;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _pickCari() async {
    final picked = await showCariPickerSheet(context);
    if (picked != null) setState(() => _cari = picked);
  }

  Future<void> _pickItem() async {
    final picked = await showStkPickerSheet(context);
    if (picked == null) return;
    setState(() {
      _item = picked;
      if (picked.salesPrice != null) {
        _unitPrice.text = picked.salesPrice!.toStringAsFixed(2);
      }
      final unit = _units.cast<CoreLookup?>().firstWhere(
            (u) => u!.name == picked.baseUnitName,
            orElse: () => _units.isNotEmpty ? _units.first : null,
          );
      if (unit != null) _unitId = unit.id;
    });
    try {
      final detail = await StkRepository(context.read<ApiClient>()).getById(picked.id);
      if (!mounted) return;
      setState(() => _taxRateId = detail['taxRateId'] as int? ?? _taxRateId);
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (_cari == null) {
      setState(() => _error = 'Cari seçin.');
      return;
    }
    if (_item == null) {
      setState(() => _error = 'Ürün seçin.');
      return;
    }
    if (!_formKey.currentState!.validate() || _unitId == null || _taxRateId == null) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = OrdRepository(context.read<ApiClient>());
      await repo.create(
        orderType: widget.orderType,
        accountId: _cari!.id,
        documentDate: todayIso(),
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        lines: [
          {
            'itemId': _item!.id,
            'description': _item!.name,
            'quantity': double.parse(_quantity.text.trim().replaceAll(',', '.')),
            'unitId': _unitId,
            'unitPrice': double.parse(_unitPrice.text.trim().replaceAll(',', '.')),
            'taxRateId': _taxRateId,
          },
        ],
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
        appBar: AppBar(title: const Text('Yeni Sipariş')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.orderType == 'PURCHASE' ? 'Yeni Alış Siparişi' : 'Yeni Satış Siparişi')),
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
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Cari'),
              subtitle: Text(_cari?.title ?? 'Seçilmedi'),
              trailing: const Icon(Icons.chevron_right),
              onTap: _pickCari,
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Ürün'),
              subtitle: Text(_item?.name ?? 'Seçilmedi'),
              trailing: const Icon(Icons.chevron_right),
              onTap: _pickItem,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _quantity,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
              decoration: const InputDecoration(labelText: 'Miktar'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _unitPrice,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
              decoration: const InputDecoration(labelText: 'Birim Fiyat (₺)'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
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
