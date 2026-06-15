import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'stk_form_screen.dart';
import 'stk_repository.dart';

class StkDetailScreen extends StatefulWidget {
  const StkDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<StkDetailScreen> createState() => _StkDetailScreenState();
}

class _StkDetailScreenState extends State<StkDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;
  List<StkMovement> _movements = [];
  Map<int, String> _unitNames = {};
  Map<int, String> _taxNames = {};

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
      final api = context.read<ApiClient>();
      final repo = StkRepository(api);
      final core = CoreRepository(api);
      final data = await repo.getById(widget.id);
      final movements = await repo.movements(itemId: widget.id);
      final units = await core.units();
      final taxRates = await core.taxRates();
      if (!mounted) return;
      setState(() {
        _data = data;
        _movements = movements.take(15).toList();
        _unitNames = {for (final u in units) u.id: u.name};
        _taxNames = {for (final t in taxRates) t.id: '${t.name} (%${t.rate.toStringAsFixed(0)})'};
      });
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit() async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => StkFormScreen(itemId: widget.id)),
    );
    if (updated == true && mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Stok Kart')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Stok Kart')),
        body: Center(child: Text(_error ?? 'Kayıt bulunamadı')),
      );
    }

    final data = _data!;
    final unitId = data['baseUnitId'] as int?;
    final taxId = data['taxRateId'] as int?;
    final fields = [
      DetailField('Kod', data['code'] as String? ?? ''),
      DetailField('Ürün Adı', data['name'] as String? ?? ''),
      if (data['barcode'] != null) DetailField('Barkod', data['barcode'] as String),
      if (data['brandName'] != null) DetailField('Marka', data['brandName'] as String),
      if (unitId != null) DetailField('Birim', _unitNames[unitId] ?? '$unitId'),
      if (taxId != null) DetailField('KDV', _taxNames[taxId] ?? '$taxId'),
      DetailField('Stok Miktarı', '${data['stockQuantity']}'),
      if (data['purchasePrice'] != null)
        DetailField('Alış Fiyatı', moduleCurrency.format((data['purchasePrice'] as num).toDouble())),
      if (data['salesPrice'] != null)
        DetailField('Satış Fiyatı', moduleCurrency.format((data['salesPrice'] as num).toDouble())),
      if (data['shelfNo'] != null) DetailField('Raf No', data['shelfNo'] as String),
      DetailField(
        'Durum',
        '',
        badge: (data['isActive'] as bool? ?? true) ? 'Aktif' : 'Pasif',
        badgeTone: (data['isActive'] as bool? ?? true) ? LabelBadgeTone.success : LabelBadgeTone.secondary,
      ),
      if (data['description'] != null && (data['description'] as String).isNotEmpty)
        DetailField('Açıklama', data['description'] as String),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(data['name'] as String? ?? 'Stok Kart'),
        actions: [
          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: _edit, tooltip: 'Düzenle'),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screenH),
        children: [
          AppCard(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (var i = 0; i < fields.length; i++) ...[
                  if (i > 0) const Divider(height: 20),
                  _DetailRow(field: fields[i]),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('Stok Hareketleri', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (_movements.isEmpty)
            const Text('Hareket kaydı yok', style: TextStyle(color: AppColors.bodyText))
          else
            ..._movements.map(
              (m) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ModuleListTile(
                  title: m.movementTypeLabel,
                  subtitle: '${m.movementDate} · ${m.warehouseName}',
                  badge: '${m.quantity.toStringAsFixed(0)} ${m.unitName}',
                  badgeTone: statusTone(m.movementTypeLabel),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.field});
  final DetailField field;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(field.label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.bodyText)),
        const SizedBox(height: 4),
        if (field.badge != null)
          LabelBadge(label: field.badge!, tone: field.badgeTone)
        else
          Text(field.value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      ],
    );
  }
}
