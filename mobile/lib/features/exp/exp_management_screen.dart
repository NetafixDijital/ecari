import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/module_list_tile.dart';
import 'exp_repository.dart';

class ExpManagementScreen extends StatefulWidget {
  const ExpManagementScreen({super.key});

  @override
  State<ExpManagementScreen> createState() => _ExpManagementScreenState();
}

class _ExpManagementScreenState extends State<ExpManagementScreen> {
  bool _loading = true;
  String? _error;
  ExpenseStats? _stats;
  List<ExpExpense> _items = [];

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
      final repo = ExpRepository(context.read<ApiClient>());
      final results = await Future.wait([repo.stats(), repo.list()]);
      if (!mounted) return;
      setState(() {
        _stats = results[0] as ExpenseStats;
        _items = results[1] as List<ExpExpense>;
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

  List<({String label, int count, double total})> get _paymentBreakdown {
    final map = <String, ({int count, double total})>{};
    for (final row in _items) {
      final prev = map[row.paymentMethodLabel] ?? (count: 0, total: 0.0);
      map[row.paymentMethodLabel] = (count: prev.count + 1, total: prev.total + row.grandTotal);
    }
    return map.entries
        .map((e) => (label: e.key, count: e.value.count, total: e.value.total))
        .toList()
      ..sort((a, b) => b.total.compareTo(a.total));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 12),
            FilledButton(onPressed: _load, child: const Text('Tekrar Dene')),
          ],
        ),
      );
    }

    final stats = _stats!;
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Row(
            children: [
              Expanded(child: _StatCard('Toplam', moduleCurrency.format(stats.totalAmount), '${stats.totalCount} kayıt')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: _StatCard('Onay Bekliyor', '${stats.pendingCount}', null, tone: AppColors.warning)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: _StatCard('Onaylandı', '${stats.approvedCount}', null, tone: AppColors.info)),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: _StatCard('Ödendi', '${stats.paidCount}', null, tone: AppColors.success)),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const Text('Ödeme Dağılımı', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: AppSpacing.sm),
          if (_paymentBreakdown.isEmpty)
            const Text('Henüz masraf kaydı yok.', style: TextStyle(color: AppColors.bodyText))
          else
            ..._paymentBreakdown.map(
              (row) => AppCard(
                margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(row.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text('${row.count} kayıt', style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                    Text(moduleCurrency.format(row.total), style: const TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(this.label, this.value, this.subtitle, {this.tone});

  final String label;
  final String value;
  final String? subtitle;
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: tone ?? AppColors.heading),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}
