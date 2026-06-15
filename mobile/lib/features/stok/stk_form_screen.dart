import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import 'stk_repository.dart';

class StkFormScreen extends StatefulWidget {
  const StkFormScreen({super.key, this.itemId});

  final int? itemId;
  bool get isEdit => itemId != null;

  @override
  State<StkFormScreen> createState() => _StkFormScreenState();
}

class _StkFormScreenState extends State<StkFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _barcode = TextEditingController();
  final _brand = TextEditingController();
  final _purchasePrice = TextEditingController();
  final _salesPrice = TextEditingController();
  final _shelfNo = TextEditingController();
  final _description = TextEditingController();

  List<CoreLookup> _units = [];
  List<TaxRate> _taxRates = [];
  int? _baseUnitId;
  int? _taxRateId;
  bool _isWeighable = false;
  bool _isActive = true;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _code;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _barcode.dispose();
    _brand.dispose();
    _purchasePrice.dispose();
    _salesPrice.dispose();
    _shelfNo.dispose();
    _description.dispose();
    super.dispose();
  }

  double? _parsePrice(String text) {
    if (text.trim().isEmpty) return null;
    return double.tryParse(text.trim().replaceAll(',', '.'));
  }

  Future<void> _load() async {
    try {
      final api = context.read<ApiClient>();
      final core = CoreRepository(api);
      final units = await core.units();
      final taxRates = await core.taxRates();
      Map<String, dynamic>? detail;
      if (widget.isEdit) {
        detail = await StkRepository(api).getById(widget.itemId!);
      }
      if (!mounted) return;
      setState(() {
        _units = units;
        _taxRates = taxRates;
        _baseUnitId = units.isNotEmpty ? units.first.id : null;
        _taxRateId = taxRates.cast<TaxRate?>().firstWhere(
              (t) => t!.rate == 20,
              orElse: () => taxRates.isNotEmpty ? taxRates.first : null,
            )?.id;
        if (detail != null) {
          _code = detail['code'] as String?;
          _name.text = detail['name'] as String? ?? '';
          _barcode.text = detail['barcode'] as String? ?? '';
          _brand.text = detail['brandName'] as String? ?? '';
          _purchasePrice.text = detail['purchasePrice']?.toString() ?? '';
          _salesPrice.text = detail['salesPrice']?.toString() ?? '';
          _shelfNo.text = detail['shelfNo'] as String? ?? '';
          _description.text = detail['description'] as String? ?? '';
          _baseUnitId = detail['baseUnitId'] as int? ?? _baseUnitId;
          _taxRateId = detail['taxRateId'] as int? ?? _taxRateId;
          _isWeighable = detail['isWeighable'] as bool? ?? false;
          _isActive = detail['isActive'] as bool? ?? true;
        } else if (units.isNotEmpty) {
          final adet = units.cast<CoreLookup?>().firstWhere(
                (u) => u!.code == 'ADET',
                orElse: () => units.first,
              );
          _baseUnitId = adet?.id;
        }
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = StkRepository(context.read<ApiClient>());
      if (widget.isEdit) {
        await repo.update(
          id: widget.itemId!,
          name: _name.text.trim(),
          barcode: _barcode.text.trim().isEmpty ? null : _barcode.text.trim(),
          brandName: _brand.text.trim().isEmpty ? null : _brand.text.trim(),
          purchasePrice: _parsePrice(_purchasePrice.text),
          salesPrice: _parsePrice(_salesPrice.text),
          shelfNo: _shelfNo.text.trim().isEmpty ? null : _shelfNo.text.trim(),
          isWeighable: _isWeighable,
          description: _description.text.trim().isEmpty ? null : _description.text.trim(),
          isActive: _isActive,
        );
      } else {
        await repo.create(
          name: _name.text.trim(),
          barcode: _barcode.text.trim().isEmpty ? null : _barcode.text.trim(),
          brandName: _brand.text.trim().isEmpty ? null : _brand.text.trim(),
          purchasePrice: _parsePrice(_purchasePrice.text),
          salesPrice: _parsePrice(_salesPrice.text),
          baseUnitId: _baseUnitId,
          taxRateId: _taxRateId,
        );
      }
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
        appBar: AppBar(title: Text(widget.isEdit ? 'Stok Düzenle' : 'Yeni Stok Tanımı')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(widget.isEdit ? 'Stok Düzenle' : 'Yeni Stok Tanımı')),
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
            if (_code != null) ListTile(title: const Text('Stok Kodu'), subtitle: Text(_code!)),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Ürün Adı'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _barcode,
              decoration: const InputDecoration(labelText: 'Barkod'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _brand,
              decoration: const InputDecoration(labelText: 'Marka'),
            ),
            if (!widget.isEdit) ...[
              const SizedBox(height: 14),
              DropdownButtonFormField<int>(
                value: _baseUnitId,
                decoration: const InputDecoration(labelText: 'Birim'),
                items: _units.map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))).toList(),
                onChanged: (v) => setState(() => _baseUnitId = v),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<int>(
                value: _taxRateId,
                decoration: const InputDecoration(labelText: 'KDV Oranı'),
                items: _taxRates
                    .map((t) => DropdownMenuItem(value: t.id, child: Text('${t.name} (%${t.rate.toStringAsFixed(0)})')))
                    .toList(),
                onChanged: (v) => setState(() => _taxRateId = v),
              ),
            ],
            const SizedBox(height: 14),
            TextFormField(
              controller: _purchasePrice,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
              decoration: const InputDecoration(labelText: 'Alış Fiyatı (₺)'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _salesPrice,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
              decoration: const InputDecoration(labelText: 'Satış Fiyatı (₺)'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _shelfNo,
              decoration: const InputDecoration(labelText: 'Raf No'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _description,
              decoration: const InputDecoration(labelText: 'Açıklama'),
              maxLines: 2,
            ),
            if (widget.isEdit) ...[
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Tartılabilir'),
                value: _isWeighable,
                onChanged: (v) => setState(() => _isWeighable = v),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Aktif'),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
            ],
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
