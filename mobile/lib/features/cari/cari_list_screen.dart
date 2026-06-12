import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_search_field.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/label_badge.dart';
import '../finance/tahsilat_screen.dart';
import '../finance/tediye_screen.dart';
import '../finance/virman_screen.dart';
import '../cari/cari_models.dart';
import '../cari/cari_repository.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

class CariListScreen extends StatefulWidget {
  const CariListScreen({super.key, this.onNewCari, this.onFinanceDone});

  final VoidCallback? onNewCari;
  final VoidCallback? onFinanceDone;

  @override
  State<CariListScreen> createState() => _CariListScreenState();
}

class _CariListScreenState extends State<CariListScreen> {
  final _search = TextEditingController();
  bool _loading = true;
  String? _error;
  List<CariAccount> _items = [];

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
      final repo = CariRepository(context.read<ApiClient>());
      final items = await repo.list(search: _search.text.trim());
      setState(() => _items = items);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _totalBalance => _items.fold(0.0, (sum, e) => sum + e.balance);

  Color? _balanceColor(CariAccount row) {
    if (row.balance > 0) return AppColors.success;
    if (row.balance < 0) return AppColors.danger;
    return null;
  }

  LabelBadgeTone? _balanceBadgeTone(CariAccount row) {
    if (row.balance > 0) return LabelBadgeTone.success;
    if (row.balance < 0) return LabelBadgeTone.danger;
    return null;
  }

  Future<void> _openFinance(Widget screen) async {
    final ok = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => screen),
    );
    if (ok == true) {
      await _load();
      widget.onFinanceDone?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, AppSpacing.md, AppSpacing.screenH, AppSpacing.sm),
          child: AppSearchField(
            controller: _search,
            hint: 'Cari adı veya kodu ara…',
            onSearch: _load,
          ),
        ),
        if (!_loading && _error == null && _items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, AppSpacing.sm),
            child: AppCard(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              child: Row(
                children: [
                  _SummaryChip(
                    icon: Icons.people_outline,
                    label: '${_items.length} cari',
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _SummaryChip(
                      icon: Icons.account_balance_wallet_outlined,
                      label: 'Net: ${_currency.format(_totalBalance)}',
                      color: _totalBalance >= 0 ? AppColors.success : AppColors.danger,
                    ),
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? AppEmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: 'Bağlantı hatası',
                      message: _error!,
                      actionLabel: 'Tekrar Dene',
                      onAction: _load,
                    )
                  : _items.isEmpty
                      ? AppEmptyState(
                          icon: Icons.person_search_outlined,
                          title: 'Cari bulunamadı',
                          message: _search.text.isEmpty
                              ? 'Henüz cari kaydı yok. İlk carinizi ekleyerek başlayın.'
                              : 'Aramanızla eşleşen kayıt yok. Farklı bir kelime deneyin.',
                          actionLabel: widget.onNewCari != null ? 'Yeni Cari Ekle' : null,
                          onAction: widget.onNewCari,
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 4, AppSpacing.screenH, 100),
                            itemCount: _items.length,
                            itemBuilder: (context, index) {
                              final row = _items[index];
                              final balanceColor = _balanceColor(row);
                              final badgeTone = _balanceBadgeTone(row);
                              return Padding(
                                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                                child: AppCard(
                                  padding: const EdgeInsets.all(AppSpacing.lg),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          Container(
                                            width: 48,
                                            height: 48,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                                colors: [
                                                  AppColors.primary.withValues(alpha: 0.15),
                                                  AppColors.primaryLight.withValues(alpha: 0.2),
                                                ],
                                              ),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              row.title.isNotEmpty ? row.title[0].toUpperCase() : '?',
                                              style: const TextStyle(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.w700,
                                                fontSize: 18,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: AppSpacing.md),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  row.title,
                                                  maxLines: 2,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 15,
                                                    color: AppColors.heading,
                                                    height: 1.3,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  row.code,
                                                  style: Theme.of(context).textTheme.bodySmall,
                                                ),
                                                if (row.isActive) ...[
                                                  const SizedBox(height: 6),
                                                  const LabelBadge(label: 'Aktif', tone: LabelBadgeTone.success),
                                                ],
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text(
                                                _currency.format(row.balance.abs()),
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 16,
                                                  color: balanceColor ?? AppColors.heading,
                                                ),
                                              ),
                                              if (row.balanceSide.isNotEmpty && badgeTone != null) ...[
                                                const SizedBox(height: 4),
                                                LabelBadge(label: row.balanceSide, tone: badgeTone),
                                              ],
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: AppSpacing.md),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () => _openFinance(TahsilatScreen(initialCari: row)),
                                              icon: const Icon(Icons.call_received, size: 16),
                                              label: const Text('Tahsilat', style: TextStyle(fontSize: 12)),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: AppColors.success,
                                                side: const BorderSide(color: AppColors.success),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () => _openFinance(TediyeScreen(initialCari: row)),
                                              icon: const Icon(Icons.call_made, size: 16),
                                              label: const Text('Tediye', style: TextStyle(fontSize: 12)),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: AppColors.danger,
                                                side: const BorderSide(color: AppColors.danger),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () => _openFinance(VirmanScreen(initialSource: row)),
                                              icon: const Icon(Icons.swap_horiz, size: 16),
                                              label: const Text('Virman', style: TextStyle(fontSize: 12)),
                                              style: OutlinedButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.icon, required this.label, required this.color});

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
          ),
        ),
      ],
    );
  }
}
