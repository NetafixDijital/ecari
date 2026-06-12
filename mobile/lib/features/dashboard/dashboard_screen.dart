import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/label_badge.dart';
import 'dashboard_models.dart';
import 'dashboard_repository.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');
final _dateFmt = DateFormat('d MMMM yyyy, EEEE', 'tr_TR');

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    this.onOpenCari,
    this.onOpenTahsilat,
  });

  final VoidCallback? onOpenCari;
  final VoidCallback? onOpenTahsilat;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  DashboardSummary? _data;

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
      final repo = DashboardRepository(context.read<ApiClient>());
      final data = await repo.fetchSummary();
      if (mounted) setState(() => _data = data);
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _data == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, AppSpacing.md, AppSpacing.screenH, 100),
        children: [
          if (_error != null) ...[
            _ErrorBanner(message: _error!, onRetry: _load),
            const SizedBox(height: AppSpacing.md),
          ],
          _QuickActions(
            onOpenCari: widget.onOpenCari,
            onOpenTahsilat: widget.onOpenTahsilat,
          ),
          const SizedBox(height: AppSpacing.lg),
          _StatGrid(data: _data),
          const SizedBox(height: AppSpacing.lg),
          _TargetCard(data: _data),
          const SizedBox(height: AppSpacing.lg),
          AppCard(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppSectionHeader(title: 'Fatura Özeti'),
                _MetricRow(
                  icon: Icons.receipt_long_outlined,
                  label: 'Satış faturası',
                  value: '${_data?.salesInvoiceCount ?? 0}',
                  color: AppColors.success,
                ),
                _MetricRow(
                  icon: Icons.hourglass_top_outlined,
                  label: 'Ödeme bekleyen',
                  value: '${_data?.pendingInvoiceCount ?? 0}',
                  color: AppColors.warning,
                ),
                _MetricRow(
                  icon: Icons.check_circle_outline,
                  label: 'Ödenen oranı',
                  value: '%${_data?.paidInvoicePercent.toStringAsFixed(0) ?? '0'}',
                  color: AppColors.primary,
                ),
                _MetricRow(
                  icon: Icons.warning_amber_outlined,
                  label: 'Vadesi geçen',
                  value: '%${_data?.overdueInvoicePercent.toStringAsFixed(0) ?? '0'}',
                  color: AppColors.danger,
                  showDivider: false,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          AppCard(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppSectionHeader(title: 'Son İşlemler'),
                if (_data?.recentTransactions.isEmpty ?? true)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    child: Text('Henüz işlem kaydı yok'),
                  )
                else
                  ..._data!.recentTransactions.take(5).map((tx) => _TransactionTile(tx: tx)),
              ],
            ),
          ),
          if (_data?.recentTasks.isNotEmpty ?? false) ...[
            const SizedBox(height: AppSpacing.lg),
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AppSectionHeader(title: 'Görevler'),
                  ..._data!.recentTasks.take(4).map((task) => _TaskTile(task: task)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({this.onOpenCari, this.onOpenTahsilat});

  final VoidCallback? onOpenCari;
  final VoidCallback? onOpenTahsilat;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickAction(
            icon: Icons.people_alt_outlined,
            label: 'Cari',
            color: AppColors.primary,
            onTap: onOpenCari,
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _QuickAction(
            icon: Icons.call_received_outlined,
            label: 'Tahsilat',
            color: AppColors.success,
            onTap: onOpenTahsilat,
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.lg),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: AppColors.heading,
              ),
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: AppColors.bodyText.withValues(alpha: 0.6)),
        ],
      ),
    );
  }
}

class _StatGrid extends StatelessWidget {
  const _StatGrid({required this.data});
  final DashboardSummary? data;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.md,
      crossAxisSpacing: AppSpacing.md,
      childAspectRatio: 1.15,
      children: [
        _StatCard(
          label: 'Toplam Gelir',
          value: _currency.format(data?.totalIncome ?? 0),
          icon: Icons.savings_outlined,
          color: AppColors.success,
          bg: AppColors.successSubtle,
        ),
        _StatCard(
          label: 'Toplam Gider',
          value: _currency.format(data?.totalExpense ?? 0),
          icon: Icons.credit_card_outlined,
          color: AppColors.danger,
          bg: AppColors.dangerSubtle,
        ),
        _StatCard(
          label: 'Net Kar',
          value: _currency.format(data?.netProfit ?? 0),
          icon: Icons.show_chart_outlined,
          color: AppColors.info,
          bg: AppColors.infoSubtle,
        ),
        _StatCard(
          label: 'Bekleyen',
          value: '${data?.pendingInvoiceCount ?? 0}',
          icon: Icons.schedule_outlined,
          color: AppColors.warning,
          bg: AppColors.warningSubtle,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.bg,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color bg;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const Spacer(),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 17,
              color: AppColors.heading,
            ),
          ),
        ],
      ),
    );
  }
}

class _TargetCard extends StatelessWidget {
  const _TargetCard({required this.data});
  final DashboardSummary? data;

  @override
  Widget build(BuildContext context) {
    final monthIncome = data?.monthIncome ?? 0;
    final percent = monthIncome > 0 ? (monthIncome / 75000 * 100).clamp(0, 100).round() : 0;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Aylık Hedef',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '%$percent',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text('Bu ay satış geliri hedefi', style: TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: AppSpacing.lg),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: percent / 100,
              minHeight: 6,
              backgroundColor: Colors.white24,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.sm),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(child: _TargetStat(label: 'Hedef', value: '₺75K')),
                Container(width: 1, height: 36, color: AppColors.border),
                Expanded(child: _TargetStat(label: 'Bu Ay', value: _compactTry(monthIncome))),
                Container(width: 1, height: 36, color: AppColors.border),
                Expanded(child: _TargetStat(label: 'Bugün', value: _compactTry(data?.todayIncome ?? 0))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _compactTry(double amount) {
    if (amount >= 1000000) return '₺${(amount / 1000000).toStringAsFixed(1)}M';
    if (amount >= 1000) return '₺${(amount / 1000).round()}K';
    return _currency.format(amount);
  }
}

class _TargetStat extends StatelessWidget {
  const _TargetStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.heading, fontSize: 14)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.showDivider = true,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(child: Text(label, style: const TextStyle(fontSize: 14, color: AppColors.heading))),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 1),
      ],
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.tx});
  final DashboardTransaction tx;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primarySubtle,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.receipt_outlined, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.accountTitle, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(
                  '${tx.documentDate} · ${tx.description}',
                  style: Theme.of(context).textTheme.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _currency.format(tx.amount),
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 14),
              ),
              const SizedBox(height: 2),
              LabelBadge(label: tx.statusLabel, tone: LabelBadgeTone.secondary),
            ],
          ),
        ],
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile({required this.task});
  final DashboardTaskItem task;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          const Icon(Icons.checklist_rounded, color: AppColors.primary, size: 22),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(task.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(task.endDate, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: AppColors.warning),
          const SizedBox(width: AppSpacing.md),
          Expanded(child: Text(message, style: const TextStyle(color: AppColors.warning, fontSize: 13))),
          TextButton(onPressed: onRetry, child: const Text('Tekrar')),
        ],
      ),
    );
  }
}

/// Header alt başlığı için bugünün tarihi.
String dashboardDateSubtitle() {
  try {
    return _dateFmt.format(DateTime.now());
  } catch (_) {
    return DateFormat('d MMMM yyyy').format(DateTime.now());
  }
}
