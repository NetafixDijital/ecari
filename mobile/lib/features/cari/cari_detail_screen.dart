import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'cari_form_screen.dart';
import 'cari_models.dart';
import 'cari_repository.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

class CariDetailScreen extends StatefulWidget {
  const CariDetailScreen({super.key, required this.accountId});

  final int accountId;

  @override
  State<CariDetailScreen> createState() => _CariDetailScreenState();
}

class _CariDetailScreenState extends State<CariDetailScreen> {
  bool _loading = true;
  String? _error;
  CariAccountDetail? _detail;
  List<CariMovement> _movements = [];
  Map<int, String> _cityNames = {};
  Map<int, String> _districtNames = {};

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
      final repo = CariRepository(api);
      final core = CoreRepository(api);
      final detail = await repo.getById(widget.accountId);
      final movements = await repo.movements(accountId: widget.accountId);
      final cities = await core.cities();
      var districts = <CoreLookup>[];
      if (detail.cityId != null) {
        districts = await core.districts(detail.cityId!);
      }
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _movements = movements.take(10).toList();
        _cityNames = {for (final c in cities) c.id: c.name};
        _districtNames = {for (final d in districts) d.id: d.name};
      });
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit() async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => CariFormScreen(accountId: widget.accountId)),
    );
    if (updated == true && mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cari Kart')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _detail == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cari Kart')),
        body: Center(child: Text(_error ?? 'Kayıt bulunamadı')),
      );
    }

    final d = _detail!;
    final city = d.cityId != null ? _cityNames[d.cityId] : null;
    final district = d.districtId != null ? _districtNames[d.districtId] : null;
    final fields = [
      DetailField('Kod', d.code),
      DetailField('Unvan / Ad', d.title),
      DetailField('Tip', d.isTuzel ? 'Tüzel Kişi' : 'Gerçek Kişi'),
      DetailField(d.isTuzel ? 'VKN' : 'TCKN', d.taxId),
      if (d.taxOffice != null) DetailField('Vergi Dairesi', d.taxOffice!),
      DetailField('Telefon', d.phone ?? '—'),
      DetailField('E-posta', d.email ?? '—'),
      DetailField('Adres', d.addressLine ?? '—'),
      if (city != null) DetailField('İl', city),
      if (district != null) DetailField('İlçe', district),
      if (d.postalCode != null) DetailField('Posta Kodu', d.postalCode!),
      if (d.dueDays != null) DetailField('Vade Günü', '${d.dueDays}'),
      DetailField('Bakiye', _currency.format(d.balance)),
      DetailField(
        'Durum',
        '',
        badge: d.isActive ? 'Aktif' : 'Pasif',
        badgeTone: d.isActive ? LabelBadgeTone.success : LabelBadgeTone.secondary,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(d.title),
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
          Text('Son Hareketler', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (_movements.isEmpty)
            const Text('Hareket kaydı yok', style: TextStyle(color: AppColors.bodyText))
          else
            ..._movements.map(
              (m) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ModuleListTile(
                  title: m.movementTypeLabel,
                  subtitle: '${m.movementDate}${m.description != null ? '\n${m.description}' : ''}',
                  trailing: m.debit > 0
                      ? _currency.format(m.debit)
                      : m.credit > 0
                          ? _currency.format(m.credit)
                          : null,
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
