import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_search_field.dart';
import '../../core/widgets/cari_picker_sheet.dart';
import '../../core/widgets/module_list_tile.dart';
import '../../features/cari/cari_models.dart';
import '../../features/cari/cari_repository.dart';
import '../../features/finance/finance_utils.dart';
import '../inv/inv_repository.dart';
import '../stok/stk_repository.dart';

class _CartLine {
  _CartLine({
    required this.item,
    required this.quantity,
    required this.unitId,
    required this.unitPrice,
    required this.taxRateId,
  });

  final StkItem item;
  double quantity;
  final int unitId;
  final double unitPrice;
  final int taxRateId;
}

class HizliSatisScreen extends StatefulWidget {
  const HizliSatisScreen({super.key});

  @override
  State<HizliSatisScreen> createState() => _HizliSatisScreenState();
}

class _HizliSatisScreenState extends State<HizliSatisScreen> {
  final _search = TextEditingController();
  List<StkItem> _items = [];
  List<CoreLookup> _units = [];
  List<TaxRate> _taxRates = [];
  final List<_CartLine> _cart = [];
  CariAccount? _cari;
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
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<ApiClient>();
      final stkRepo = StkRepository(api);
      final cariRepo = CariRepository(api);
      final coreRepo = CoreRepository(api);
      final results = await Future.wait([
        stkRepo.list(),
        cariRepo.list(),
        coreRepo.units(),
        coreRepo.taxRates(),
      ]);
      final items = results[0] as List<StkItem>;
      final cariler = results[1] as List<CariAccount>;
      final units = results[2] as List<CoreLookup>;
      final taxRates = results[3] as List<TaxRate>;
      if (!mounted) return;
      setState(() {
        _items = items.where((i) => i.isActive).toList();
        _units = units;
        _taxRates = taxRates;
        _cari = cariler.cast<CariAccount?>().firstWhere(
              (c) => c!.code == 'M00001',
              orElse: () => cariler.cast<CariAccount?>().firstWhere(
                    (c) => c!.title.toLowerCase().contains('perakende'),
                    orElse: () => cariler.isNotEmpty ? cariler.first : null,
                  ),
            );
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  List<StkItem> get _filtered {
    final q = _search.text.trim().toLowerCase();
    if (q.isEmpty) return _items;
    return _items.where((i) {
      return [i.code, i.barcode, i.name].whereType<String>().join(' ').toLowerCase().contains(q);
    }).toList();
  }

  void _addToCart(StkItem item) {
    final unit = _units.cast<CoreLookup?>().firstWhere(
          (u) => u!.name == item.baseUnitName,
          orElse: () => _units.isNotEmpty ? _units.first : null,
        );
    final tax = _taxRates.cast<TaxRate?>().firstWhere(
          (t) => t!.rate == 20,
          orElse: () => _taxRates.isNotEmpty ? _taxRates.first : null,
        );
    if (unit == null || tax == null) return;
    setState(() {
      final existing = _cart.cast<_CartLine?>().firstWhere(
            (l) => l!.item.id == item.id,
            orElse: () => null,
          );
      if (existing != null) {
        existing.quantity += 1;
      } else {
        _cart.add(_CartLine(
          item: item,
          quantity: 1,
          unitId: unit.id,
          unitPrice: item.salesPrice ?? 0,
          taxRateId: tax.id,
        ));
      }
    });
  }

  double _lineTotal(_CartLine line) {
    final net = line.quantity * line.unitPrice;
    final rate = _taxRates.cast<TaxRate?>().firstWhere(
          (t) => t!.id == line.taxRateId,
          orElse: () => null,
        )?.rate ?? 0;
    return net + (net * rate / 100);
  }

  double get _grandTotal => _cart.fold(0.0, (sum, line) => sum + _lineTotal(line));

  Future<void> _pickCari() async {
    final picked = await showCariPickerSheet(context, title: 'Müşteri Seç');
    if (picked != null) setState(() => _cari = picked);
  }

  Future<void> _checkout() async {
    if (_cari == null) {
      setState(() => _error = 'Müşteri seçin.');
      return;
    }
    if (_cart.isEmpty) {
      setState(() => _error = 'Sepete ürün ekleyin.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = InvRepository(context.read<ApiClient>());
      await repo.create(
        invoiceType: 'SALES',
        accountId: _cari!.id,
        documentDate: todayIso(),
        lines: _cart
            .map((line) => {
                  'itemId': line.item.id,
                  'description': line.item.name,
                  'quantity': line.quantity,
                  'unitId': line.unitId,
                  'unitPrice': line.unitPrice,
                  'taxRateId': line.taxRateId,
                })
            .toList(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Satış faturası oluşturuldu.')),
      );
      setState(() => _cart.clear());
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, AppSpacing.md, AppSpacing.screenH, AppSpacing.sm),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Müşteri'),
            subtitle: Text(_cari?.title ?? 'Seçilmedi'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _pickCari,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
          child: AppSearchField(controller: _search, hint: 'Ürün ara…', onSearch: () => setState(() {})),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.all(AppSpacing.screenH),
            child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ),
        Expanded(
          flex: 2,
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 8, AppSpacing.screenH, 8),
            itemCount: _filtered.length,
            itemBuilder: (context, index) {
              final item = _filtered[index];
              return ModuleListTile(
                title: item.name,
                subtitle: item.code,
                trailing: item.salesPrice != null ? moduleCurrency.format(item.salesPrice) : null,
                onTap: () => _addToCart(item),
              );
            },
          ),
        ),
        const Divider(height: 1),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 8, AppSpacing.screenH, 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Sepet (${_cart.length})', style: Theme.of(context).textTheme.titleSmall),
              Text(moduleCurrency.format(_grandTotal), style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
        ),
        Expanded(
          child: _cart.isEmpty
              ? const Center(child: Text('Sepet boş'))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
                  itemCount: _cart.length,
                  itemBuilder: (context, index) {
                    final line = _cart[index];
                    return ListTile(
                      title: Text(line.item.name),
                      subtitle: Text('${line.quantity.toStringAsFixed(0)} x ${moduleCurrency.format(line.unitPrice)}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: () => setState(() {
                              if (line.quantity <= 1) {
                                _cart.removeAt(index);
                              } else {
                                line.quantity -= 1;
                              }
                            }),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setState(() => line.quantity += 1),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, 100),
          child: FilledButton(
            onPressed: _saving || _cart.isEmpty ? null : _checkout,
            child: Text(_saving ? 'Fatura oluşturuluyor…' : 'Satışı Tamamla'),
          ),
        ),
      ],
    );
  }
}
