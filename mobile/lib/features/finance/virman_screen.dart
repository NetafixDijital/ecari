import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_surface.dart';
import '../cari/cari_models.dart';
import '../cari/cari_repository.dart';
import 'finance_utils.dart';

class VirmanScreen extends StatefulWidget {
  const VirmanScreen({super.key, this.initialSource, this.onSuccess});

  final CariAccount? initialSource;
  final VoidCallback? onSuccess;

  @override
  State<VirmanScreen> createState() => _VirmanScreenState();
}

class _VirmanScreenState extends State<VirmanScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _description = TextEditingController();
  final _date = TextEditingController(text: todayIso());

  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<CariAccount> _cariler = [];
  CariAccount? _source;
  CariAccount? _target;

  @override
  void initState() {
    super.initState();
    _source = widget.initialSource;
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
      final cariler = await CariRepository(context.read<ApiClient>()).list();
      if (mounted) {
        setState(() {
          _cariler = cariler.where((c) => c.isActive).toList();
          _source ??= _cariler.isNotEmpty ? _cariler.first : null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<CariAccount> get _targetOptions =>
      _cariler.where((c) => _source == null || c.id != _source!.id).toList();

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_source == null || _target == null) {
      setState(() => _error = 'Kaynak ve hedef cari seçin.');
      return;
    }
    if (_source!.id == _target!.id) {
      setState(() => _error = 'Kaynak ve hedef cari farklı olmalı.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await CariRepository(context.read<ApiClient>()).transfer(
        sourceAccountId: _source!.id,
        targetAccountId: _target!.id,
        amount: double.parse(_amount.text.replaceAll(',', '.')),
        transferDate: _date.text.trim(),
        description: _description.text.trim().isEmpty ? null : _description.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Virman kaydedildi'), backgroundColor: AppColors.success),
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
                const Text('Virman', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.primary)),
                const SizedBox(height: 4),
                const Text('Cari hesaplar arası bakiye transferi', style: TextStyle(fontSize: 13, color: AppColors.bodyText)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
            const SizedBox(height: AppSpacing.md),
          ],
          DropdownButtonFormField<CariAccount>(
            value: _source,
            decoration: const InputDecoration(labelText: 'Kaynak Cari'),
            items: _cariler
                .map((c) => DropdownMenuItem(value: c, child: Text('${c.code} · ${c.title}')))
                .toList(),
            onChanged: (v) => setState(() {
              _source = v;
              if (_target?.id == v?.id) _target = null;
            }),
            validator: (v) => v == null ? 'Kaynak cari seçin' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<CariAccount>(
            value: _target,
            decoration: const InputDecoration(labelText: 'Hedef Cari'),
            items: _targetOptions
                .map((c) => DropdownMenuItem(value: c, child: Text('${c.code} · ${c.title}')))
                .toList(),
            onChanged: (v) => setState(() => _target = v),
            validator: (v) => v == null ? 'Hedef cari seçin' : null,
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
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
            child: Text(_saving ? 'Kaydediliyor…' : 'Virman Yap'),
          ),
        ],
      ),
    );
  }
}
