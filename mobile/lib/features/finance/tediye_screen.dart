import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../cari/cari_models.dart';
import '../cari/cari_repository.dart';
import '../csh/csh_repository.dart';
import 'finance_utils.dart';

class TediyeScreen extends StatefulWidget {
  const TediyeScreen({super.key, this.initialCari, this.onSuccess});

  final CariAccount? initialCari;
  final VoidCallback? onSuccess;

  @override
  State<TediyeScreen> createState() => _TediyeScreenState();
}

class _TediyeScreenState extends State<TediyeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _description = TextEditingController();
  final _date = TextEditingController(text: todayIso());

  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<CariAccount> _cariler = [];
  List<CshAccount> _kasalar = [];
  CariAccount? _selectedCari;
  int? _cashAccountId;

  @override
  void initState() {
    super.initState();
    _selectedCari = widget.initialCari;
    _load();
  }

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    _date.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiClient>();
      final cariler = await CariRepository(api).list();
      final kasalar = await CshRepository(api).list();
      if (mounted) {
        setState(() {
          _cariler = cariler.where((c) => c.isActive).toList();
          _kasalar = kasalar.where((k) => k.isActive).toList();
          _selectedCari ??= _cariler.isNotEmpty ? _cariler.first : null;
          _cashAccountId = _kasalar.isNotEmpty ? _kasalar.first.id : null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _fillCredit() {
    if (_selectedCari == null) return;
    final credit = cariCreditAmount(_selectedCari!);
    if (credit > 0) _amount.text = credit.toStringAsFixed(2);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCari == null || _cashAccountId == null) {
      setState(() => _error = 'Cari ve kasa seçin.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await CshRepository(context.read<ApiClient>()).pay(
        accountId: _selectedCari!.id,
        cashAccountId: _cashAccountId!,
        amount: double.parse(_amount.text.replaceAll(',', '.')),
        transactionDate: _date.text.trim(),
        description: _description.text.trim().isEmpty ? null : _description.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tediye kaydedildi'), backgroundColor: AppColors.success),
      );
      if (Navigator.canPop(context)) {
        Navigator.of(context).pop(true);
      } else {
        widget.onSuccess?.call();
        _amount.clear();
        _description.clear();
      }
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Tediye', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.danger)),
                const SizedBox(height: 4),
                const Text('Kasadan cari hesaba ödeme kaydı', style: TextStyle(fontSize: 13, color: AppColors.bodyText)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
            const SizedBox(height: AppSpacing.md),
          ],
          DropdownButtonFormField<CariAccount>(
            value: _selectedCari,
            decoration: const InputDecoration(labelText: 'Cari Hesap'),
            items: _cariler
                .map((c) => DropdownMenuItem(value: c, child: Text('${c.code} · ${c.title}')))
                .toList(),
            onChanged: (v) => setState(() => _selectedCari = v),
            validator: (v) => v == null ? 'Cari seçin' : null,
          ),
          if (_selectedCari != null && cariCreditAmount(_selectedCari!) > 0)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.sm),
              child: Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _fillCredit,
                  icon: const Icon(Icons.auto_fix_high, size: 18),
                  label: Text('Alacak tutarını doldur (${financeCurrency.format(cariCreditAmount(_selectedCari!))})'),
                ),
              ),
            ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _amount,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Tutar (₺)'),
            validator: (v) {
              final n = double.tryParse((v ?? '').replaceAll(',', '.'));
              if (n == null || n <= 0) return 'Geçerli tutar girin';
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<int>(
            value: _cashAccountId,
            decoration: const InputDecoration(labelText: 'Kasa'),
            items: _kasalar.map((k) => DropdownMenuItem(value: k.id, child: Text(k.name))).toList(),
            onChanged: (v) => setState(() => _cashAccountId = v),
            validator: (v) => v == null ? 'Kasa seçin' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _date,
            decoration: const InputDecoration(labelText: 'Tarih (YYYY-MM-DD)'),
            validator: (v) => v == null || v.isEmpty ? 'Tarih gerekli' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _description,
            decoration: const InputDecoration(labelText: 'Açıklama (opsiyonel)'),
            maxLines: 2,
          ),
          const SizedBox(height: AppSpacing.xl),
          FilledButton(
            onPressed: _saving ? null : _submit,
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger, minimumSize: const Size.fromHeight(50)),
            child: Text(_saving ? 'Kaydediliyor…' : 'Tediye Kaydet'),
          ),
        ],
      ),
    );
  }
}
