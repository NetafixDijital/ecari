import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'cari_models.dart';
import 'cari_repository.dart';

class CariFormScreen extends StatefulWidget {
  const CariFormScreen({super.key});

  @override
  State<CariFormScreen> createState() => _CariFormScreenState();
}

class _CariFormScreenState extends State<CariFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isTuzel = true;
  final _vknTckn = TextEditingController();
  final _title = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _vknTckn.dispose();
    _title.dispose();
    _phone.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = CariRepository(context.read<ApiClient>());
      await repo.create(
        CreateCariRequest(
          personType: _isTuzel ? 'TUZEL_KISI' : 'GERCEK_KISI',
          title: _title.text.trim(),
          taxNumber: _isTuzel ? _vknTckn.text.trim() : null,
          identityNumber: !_isTuzel ? _vknTckn.text.trim() : null,
          phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          email: _email.text.trim().isEmpty ? null : _email.text.trim(),
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final idLen = _isTuzel ? 10 : 11;
    return Scaffold(
      appBar: AppBar(title: const Text('Yeni Cari')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Cari Tipi', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment(value: true, label: Text('Tüzel'), icon: Icon(Icons.business_outlined)),
                        ButtonSegment(value: false, label: Text('Gerçek'), icon: Icon(Icons.person_outline)),
                      ],
                      selected: {_isTuzel},
                      onSelectionChanged: (s) => setState(() {
                        _isTuzel = s.first;
                        _vknTckn.clear();
                      }),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.dangerSubtle,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _error!,
                          style: const TextStyle(color: AppColors.danger, fontSize: 13),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _vknTckn,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(idLen),
                      ],
                      decoration: InputDecoration(labelText: _isTuzel ? 'VKN' : 'TCKN'),
                      validator: (v) => v == null || v.length != idLen ? '$idLen hane girin' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _title,
                      decoration: InputDecoration(labelText: _isTuzel ? 'Unvan' : 'Ad Soyad'),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu alan' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Telefon'),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'E-posta'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: Text(_saving ? 'Kaydediliyor…' : 'Kaydet'),
            ),
          ],
        ),
      ),
    );
  }
}
