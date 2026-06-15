import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/cari_picker_sheet.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_tile.dart';
import '../cari/cari_models.dart';
import '../finance/finance_utils.dart';
import 'bnk_repository.dart';

class BnkListScreen extends StatefulWidget {
  const BnkListScreen({super.key});

  @override
  State<BnkListScreen> createState() => _BnkListScreenState();
}

class _BnkListScreenState extends State<BnkListScreen> {
  bool _loading = true;
  String? _error;
  List<BnkAccount> _accounts = [];
  List<BnkTransaction> _transactions = [];
  int _refreshKey = 0;

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
      final repo = BnkRepository(context.read<ApiClient>());
      final results = await Future.wait([repo.list(), repo.transactions()]);
      if (!mounted) return;
      setState(() {
        _accounts = results[0] as List<BnkAccount>;
        _transactions = results[1] as List<BnkTransaction>;
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

  Future<void> _openTxDialog({required bool collection}) async {
    if (_accounts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Banka hesabı yok')));
      return;
    }

    var bankAccountId = _accounts.first.id;
    CariAccount? cari;
    final amount = TextEditingController();
    final date = TextEditingController(text: todayIso());
    final description = TextEditingController();
    var saving = false;
    String? formError;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(collection ? 'Gelen (Tahsilat)' : 'Giden (Ödeme)'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (formError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(formError!, style: const TextStyle(color: AppColors.danger)),
                  ),
                DropdownButtonFormField<int>(
                  value: bankAccountId,
                  decoration: const InputDecoration(labelText: 'Banka Hesabı'),
                  items: _accounts
                      .map((a) => DropdownMenuItem(
                            value: a.id,
                            child: Text('${a.bankName} · ${a.accountName}'),
                          ))
                      .toList(),
                  onChanged: (v) => setDialogState(() => bankAccountId = v ?? bankAccountId),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () async {
                    final picked = await showCariPickerSheet(context);
                    if (picked != null) setDialogState(() => cari = picked);
                  },
                  child: Text(cari == null ? 'Cari Seç' : '${cari!.code} · ${cari!.title}'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amount,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Tutar (₺)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: date,
                  decoration: const InputDecoration(labelText: 'Tarih (YYYY-MM-DD)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: description,
                  decoration: const InputDecoration(labelText: 'Açıklama (opsiyonel)'),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: saving ? null : () => Navigator.pop(ctx), child: const Text('İptal')),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: collection ? AppColors.success : AppColors.danger,
              ),
              onPressed: saving
                  ? null
                  : () async {
                      final parsed = double.tryParse(amount.text.replaceAll(',', '.'));
                      if (parsed == null || parsed <= 0) {
                        setDialogState(() => formError = 'Geçerli tutar girin.');
                        return;
                      }
                      if (cari == null) {
                        setDialogState(() => formError = 'Cari seçin.');
                        return;
                      }
                      setDialogState(() {
                        saving = true;
                        formError = null;
                      });
                      try {
                        final repo = BnkRepository(context.read<ApiClient>());
                        final body = {
                          'bankAccountId': bankAccountId,
                          'accountId': cari!.id,
                          'amount': parsed,
                          'transactionDate': date.text.trim(),
                          'description': description.text.trim().isEmpty ? null : description.text.trim(),
                        };
                        if (collection) {
                          await repo.collect(
                            bankAccountId: bankAccountId,
                            accountId: cari!.id,
                            amount: parsed,
                            transactionDate: date.text.trim(),
                            description: body['description'] as String?,
                          );
                        } else {
                          await repo.pay(
                            bankAccountId: bankAccountId,
                            accountId: cari!.id,
                            amount: parsed,
                            transactionDate: date.text.trim(),
                            description: body['description'] as String?,
                          );
                        }
                        if (ctx.mounted) Navigator.pop(ctx);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(collection ? 'Tahsilat kaydedildi' : 'Ödeme kaydedildi')),
                          );
                          setState(() => _refreshKey++);
                          _load();
                        }
                      } catch (e) {
                        setDialogState(() {
                          saving = false;
                          formError = context.read<ApiClient>().messageFromError(e);
                        });
                      }
                    },
              child: Text(saving ? 'Kaydediliyor…' : 'Kaydet'),
            ),
          ],
        ),
      ),
    );

    amount.dispose();
    date.dispose();
    description.dispose();
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

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _openTxDialog(collection: true),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.success),
                  icon: const Icon(Icons.arrow_downward, size: 18),
                  label: const Text('Gelen'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _openTxDialog(collection: false),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
                  icon: const Icon(Icons.arrow_upward, size: 18),
                  label: const Text('Giden'),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            key: ValueKey(_refreshKey),
            padding: const EdgeInsets.all(AppSpacing.screenH),
            children: [
              Text('Banka Hesapları', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppSpacing.sm),
              ..._accounts.map(
                (item) => ModuleListTile(
                  leadingIcon: Icons.account_balance_outlined,
                  title: item.bankName,
                  subtitle: '${item.accountName}\n${item.iban}',
                  trailing: moduleCurrency.format(item.balance),
                  badge: item.isActive ? 'Aktif' : 'Pasif',
                  badgeTone: item.isActive ? LabelBadgeTone.success : LabelBadgeTone.secondary,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('Son Hareketler', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppSpacing.sm),
              if (_transactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('Hareket yok')),
                )
              else
                ..._transactions.take(30).map(
                      (tx) => ModuleListTile(
                        leadingIcon: Icons.swap_vert_outlined,
                        title: tx.transactionTypeLabel,
                        subtitle: '${tx.bankAccountName} · ${tx.transactionDate}${tx.cariTitle != null ? '\n${tx.cariTitle}' : ''}',
                        trailing: moduleCurrency.format(tx.amount),
                        badge: tx.description,
                        badgeTone: tx.transactionType == 'COLLECTION'
                            ? LabelBadgeTone.success
                            : LabelBadgeTone.danger,
                      ),
                    ),
            ],
          ),
        ),
      ],
    );
  }
}
