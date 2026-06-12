import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_surface.dart';
import '../../core/widgets/module_list_tile.dart';
import '../bnk/bnk_repository.dart';
import '../csh/csh_repository.dart';

class GunSonuScreen extends StatefulWidget {
  const GunSonuScreen({super.key});

  @override
  State<GunSonuScreen> createState() => _GunSonuScreenState();
}

class _GunSonuScreenState extends State<GunSonuScreen> {
  bool _loading = true;
  String? _error;
  double _kasaTotal = 0;
  double _bankaTotal = 0;
  int _kasaCount = 0;
  int _bankaCount = 0;

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
      final kasa = await CshRepository(api).list();
      final banka = await BnkRepository(api).list();
      if (mounted) {
        setState(() {
          _kasaTotal = kasa.fold(0.0, (s, a) => s + a.balance);
          _bankaTotal = banka.fold(0.0, (s, a) => s + a.balance);
          _kasaCount = kasa.where((a) => a.isActive).length;
          _bankaCount = banka.where((a) => a.isActive).length;
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

    final total = _kasaTotal + _bankaTotal;
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Toplam Nakit + Banka', style: TextStyle(fontSize: 13, color: AppColors.bodyText)),
                const SizedBox(height: 6),
                Text(
                  moduleCurrency.format(total),
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          ModuleListTile(
            leadingIcon: Icons.payments_outlined,
            title: 'Kasa Özeti',
            subtitle: '$_kasaCount aktif kasa',
            trailing: moduleCurrency.format(_kasaTotal),
          ),
          ModuleListTile(
            leadingIcon: Icons.account_balance_outlined,
            title: 'Banka Özeti',
            subtitle: '$_bankaCount aktif hesap',
            trailing: moduleCurrency.format(_bankaTotal),
          ),
        ],
      ),
    );
  }
}
