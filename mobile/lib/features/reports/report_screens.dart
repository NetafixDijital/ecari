import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/module_list_tile.dart';
import '../inv/inv_repository.dart';

class GelirGiderReportScreen extends StatefulWidget {
  const GelirGiderReportScreen({super.key});

  @override
  State<GelirGiderReportScreen> createState() => _GelirGiderReportScreenState();
}

class _GelirGiderReportScreenState extends State<GelirGiderReportScreen> {
  bool _loading = true;
  String? _error;
  double _sales = 0;
  double _purchase = 0;

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
      final repo = InvRepository(context.read<ApiClient>());
      final sales = await repo.list(type: 'SALES');
      final purchase = await repo.list(type: 'PURCHASE');
      if (mounted) {
        setState(() {
          _sales = sales.fold(0.0, (s, e) => s + e.grandTotal);
          _purchase = purchase.fold(0.0, (s, e) => s + e.grandTotal);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    if (_error != null) {
      return AppEmptyState(
        icon: Icons.cloud_off_outlined,
        title: 'Rapor yüklenemedi',
        message: _error!,
        actionLabel: 'Tekrar Dene',
        onAction: _load,
      );
    }

    final net = _sales - _purchase;
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _ReportCard(label: 'Satış (Gelir)', value: _sales, color: AppColors.success),
          const SizedBox(height: AppSpacing.md),
          _ReportCard(label: 'Alış (Gider)', value: _purchase, color: AppColors.danger),
          const SizedBox(height: AppSpacing.md),
          _ReportCard(label: 'Net Fark', value: net, color: net >= 0 ? AppColors.success : AppColors.danger),
        ],
      ),
    );
  }
}

class KdvReportScreen extends StatefulWidget {
  const KdvReportScreen({super.key});

  @override
  State<KdvReportScreen> createState() => _KdvReportScreenState();
}

class _KdvReportScreenState extends State<KdvReportScreen> {
  bool _loading = true;
  String? _error;
  InvKdvReport? _data;

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
      final repo = InvRepository(context.read<ApiClient>());
      final data = await repo.kdvReport();
      if (mounted) setState(() => _data = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    if (_error != null) {
      return AppEmptyState(
        icon: Icons.cloud_off_outlined,
        title: 'KDV raporu yüklenemedi',
        message: _error!,
        actionLabel: 'Tekrar Dene',
        onAction: _load,
      );
    }

    final data = _data!;
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _ReportCard(label: 'Satış KDV', value: data.salesTaxTotal, color: AppColors.success),
          const SizedBox(height: AppSpacing.md),
          _ReportCard(label: 'Alış KDV', value: data.purchaseTaxTotal, color: AppColors.danger),
          const SizedBox(height: AppSpacing.md),
          _ReportCard(label: 'İndirilecek KDV', value: data.deductibleTaxTotal, color: AppColors.info),
          const SizedBox(height: AppSpacing.md),
          _ReportCard(label: 'Ödenecek Net KDV', value: data.netPayableTax, color: AppColors.primary),
          if (data.rows.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.lg),
            const Text('Detay', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: AppSpacing.sm),
            ...data.rows.take(20).map(
                  (r) => ModuleListTile(
                    leadingIcon: Icons.receipt_outlined,
                    title: r.documentNo,
                    subtitle: '${r.accountTitle} · ${r.documentDate}',
                    trailing: moduleCurrency.format(r.taxTotal),
                  ),
                ),
          ],
        ],
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.label, required this.value, required this.color});

  final String label;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            width: 8,
            height: 48,
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(
                  moduleCurrency.format(value),
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: color),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
