import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../bnk/bnk_repository.dart';
import '../cari/cari_models.dart';
import '../cari/cari_repository.dart';
import '../csh/csh_repository.dart';
import 'finance_utils.dart';

enum TahsilatPaymentMethod { cash, bank, check }

class TahsilatScreen extends StatefulWidget {
  const TahsilatScreen({super.key, this.initialCari, this.onSuccess});

  final CariAccount? initialCari;
  final VoidCallback? onSuccess;

  @override
  State<TahsilatScreen> createState() => _TahsilatScreenState();
}

class _TahsilatScreenState extends State<TahsilatScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _description = TextEditingController();
  final _date = TextEditingController(text: todayIso());
  final _checkNo = TextEditingController();
  final _checkBank = TextEditingController();
  final _checkDueDate = TextEditingController(text: todayIso());

  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<CariAccount> _cariler = [];
  List<CshAccount> _kasalar = [];
  List<BnkAccount> _bankalar = [];
  CariAccount? _selectedCari;
  TahsilatPaymentMethod _paymentMethod = TahsilatPaymentMethod.cash;
  int? _cashAccountId;
  int? _bankAccountId;

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
    _checkNo.dispose();
    _checkBank.dispose();
    _checkDueDate.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiClient>();
      final cariler = await CariRepository(api).list();
      final kasalar = await CshRepository(api).list();
      final bankalar = await BnkRepository(api).list();
      if (mounted) {
        setState(() {
          _cariler = cariler.where((c) => c.isActive).toList();
          _kasalar = kasalar.where((k) => k.isActive).toList();
          _bankalar = bankalar.where((b) => b.isActive).toList();
          _selectedCari ??= _cariler.isNotEmpty ? _cariler.first : null;
          _cashAccountId = _kasalar.isNotEmpty ? _kasalar.first.id : null;
          _bankAccountId = _bankalar.isNotEmpty ? _bankalar.first.id : null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _fillDebt() {
    if (_selectedCari == null) return;
    final debt = cariDebtAmount(_selectedCari!);
    if (debt > 0) _amount.text = debt.toStringAsFixed(2);
  }

  String _paymentMethodApi() {
    return switch (_paymentMethod) {
      TahsilatPaymentMethod.cash => 'CASH',
      TahsilatPaymentMethod.bank => 'BANK',
      TahsilatPaymentMethod.check => 'CHECK',
    };
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCari == null) {
      setState(() => _error = 'Cari seçin.');
      return;
    }
    if (_paymentMethod == TahsilatPaymentMethod.cash && _cashAccountId == null) {
      setState(() => _error = 'Kasa seçin.');
      return;
    }
    if (_paymentMethod == TahsilatPaymentMethod.bank && _bankAccountId == null) {
      setState(() => _error = 'Banka hesabı seçin.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await CariRepository(context.read<ApiClient>()).collect(
        accountId: _selectedCari!.id,
        paymentMethod: _paymentMethodApi(),
        amount: double.parse(_amount.text.replaceAll(',', '.')),
        transactionDate: _date.text.trim(),
        description: _description.text.trim().isEmpty ? null : _description.text.trim(),
        cashAccountId: _paymentMethod == TahsilatPaymentMethod.cash ? _cashAccountId : null,
        bankAccountId: _paymentMethod == TahsilatPaymentMethod.bank ? _bankAccountId : null,
        checkInstrumentNo: _paymentMethod == TahsilatPaymentMethod.check ? _checkNo.text.trim() : null,
        checkBankName: _paymentMethod == TahsilatPaymentMethod.check && _checkBank.text.trim().isNotEmpty
            ? _checkBank.text.trim()
            : null,
        checkDueDate: _paymentMethod == TahsilatPaymentMethod.check ? _checkDueDate.text.trim() : null,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tahsilat kaydedildi'), backgroundColor: AppColors.success),
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
                const Text('Tahsilat', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.success)),
                const SizedBox(height: 4),
                const Text('Cariden tahsilat kaydı (kasa, banka veya çek/senet)', style: TextStyle(fontSize: 13, color: AppColors.bodyText)),
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
          if (_selectedCari != null && cariDebtAmount(_selectedCari!) > 0)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.sm),
              child: Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _fillDebt,
                  icon: const Icon(Icons.auto_fix_high, size: 18),
                  label: Text('Borç tutarını doldur (${financeCurrency.format(cariDebtAmount(_selectedCari!))})'),
                ),
              ),
            ),
          const SizedBox(height: AppSpacing.md),
          const Text('Ödeme Yöntemi', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpacing.sm),
          SegmentedButton<TahsilatPaymentMethod>(
            segments: const [
              ButtonSegment(value: TahsilatPaymentMethod.cash, label: Text('Kasa'), icon: Icon(Icons.payments_outlined, size: 18)),
              ButtonSegment(value: TahsilatPaymentMethod.bank, label: Text('Banka'), icon: Icon(Icons.account_balance_outlined, size: 18)),
              ButtonSegment(value: TahsilatPaymentMethod.check, label: Text('Çek'), icon: Icon(Icons.fact_check_outlined, size: 18)),
            ],
            selected: {_paymentMethod},
            onSelectionChanged: (v) => setState(() => _paymentMethod = v.first),
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
          if (_paymentMethod == TahsilatPaymentMethod.cash)
            DropdownButtonFormField<int>(
              value: _cashAccountId,
              decoration: const InputDecoration(labelText: 'Kasa'),
              items: _kasalar.map((k) => DropdownMenuItem(value: k.id, child: Text(k.name))).toList(),
              onChanged: (v) => setState(() => _cashAccountId = v),
              validator: (v) => v == null ? 'Kasa seçin' : null,
            ),
          if (_paymentMethod == TahsilatPaymentMethod.bank)
            DropdownButtonFormField<int>(
              value: _bankAccountId,
              decoration: const InputDecoration(labelText: 'Banka Hesabı'),
              items: _bankalar
                  .map((b) => DropdownMenuItem(
                        value: b.id,
                        child: Text('${b.bankName} · ${b.accountName}'),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _bankAccountId = v),
              validator: (v) => v == null ? 'Banka seçin' : null,
            ),
          if (_paymentMethod == TahsilatPaymentMethod.check) ...[
            TextFormField(
              controller: _checkNo,
              decoration: const InputDecoration(labelText: 'Çek / Senet No'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Çek/senet no gerekli' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _checkBank,
              decoration: const InputDecoration(labelText: 'Banka (opsiyonel)'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _checkDueDate,
              decoration: const InputDecoration(labelText: 'Vade Tarihi (YYYY-MM-DD)'),
              validator: (v) => v == null || v.isEmpty ? 'Vade tarihi gerekli' : null,
            ),
          ],
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
            style: FilledButton.styleFrom(backgroundColor: AppColors.success, minimumSize: const Size.fromHeight(50)),
            child: Text(_saving ? 'Kaydediliyor…' : 'Tahsilat Kaydet'),
          ),
        ],
      ),
    );
  }
}
