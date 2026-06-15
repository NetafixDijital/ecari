import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/core_repository.dart';
import '../../core/theme/app_colors.dart';
import 'cari_models.dart';
import 'cari_repository.dart';

class CariFormScreen extends StatefulWidget {
  const CariFormScreen({super.key, this.accountId});

  /// Düzenleme modu için cari id.
  final int? accountId;

  bool get isEdit => accountId != null;

  @override
  State<CariFormScreen> createState() => _CariFormScreenState();
}

class _CariFormScreenState extends State<CariFormScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  late final TabController _tabs;

  bool _loading = true;
  bool _saving = false;
  String? _error;
  bool _isTuzel = true;
  bool _isActive = true;
  String? _code;

  final _vknTckn = TextEditingController();
  final _title = TextEditingController();
  final _taxOffice = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _postalCode = TextEditingController();
  final _dueDays = TextEditingController();

  List<CoreLookup> _cities = [];
  List<CoreLookup> _districts = [];
  List<PaymentTerm> _paymentTerms = [];
  int? _cityId;
  int? _districtId;
  int? _paymentTermId;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _vknTckn.dispose();
    _title.dispose();
    _taxOffice.dispose();
    _phone.dispose();
    _email.dispose();
    _address.dispose();
    _postalCode.dispose();
    _dueDays.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = context.read<ApiClient>();
      final core = CoreRepository(api);
      final cities = await core.cities();
      final terms = await core.paymentTerms();
      CariAccountDetail? detail;
      if (widget.isEdit) {
        detail = await CariRepository(api).getById(widget.accountId!);
      }
      final savedDistrictId = detail?.districtId;
      if (!mounted) return;
      setState(() {
        _cities = cities;
        _paymentTerms = terms;
        if (detail != null) {
          _code = detail.code;
          _isTuzel = detail.isTuzel;
          _isActive = detail.isActive;
          _vknTckn.text = detail.taxId == '—' ? '' : detail.taxId;
          _title.text = detail.title;
          _taxOffice.text = detail.taxOffice ?? '';
          _phone.text = detail.phone ?? '';
          _email.text = detail.email ?? '';
          _address.text = detail.addressLine ?? '';
          _postalCode.text = detail.postalCode ?? '';
          _dueDays.text = detail.dueDays?.toString() ?? '';
          _cityId = detail.cityId;
          _districtId = detail.districtId;
          _paymentTermId = detail.paymentTermId;
        }
        _loading = false;
      });
      if (detail?.cityId != null) {
        await _loadDistricts(detail!.cityId!);
        if (mounted) setState(() => _districtId = savedDistrictId);
      }
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadDistricts(int cityId) async {
    final districts = await CoreRepository(context.read<ApiClient>()).districts(cityId);
    if (mounted) {
      setState(() {
        _districts = districts;
        if (_districtId != null && !districts.any((d) => d.id == _districtId)) {
          _districtId = null;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = CariRepository(context.read<ApiClient>());
      final dueDays = int.tryParse(_dueDays.text.trim());
      if (widget.isEdit) {
        await repo.update(
          widget.accountId!,
          UpdateCariRequest(
            title: _title.text.trim(),
            isActive: _isActive,
            taxNumber: _isTuzel ? _vknTckn.text.trim() : null,
            identityNumber: !_isTuzel ? _vknTckn.text.trim() : null,
            taxOffice: _isTuzel && _taxOffice.text.trim().isNotEmpty ? _taxOffice.text.trim() : null,
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
            email: _email.text.trim().isEmpty ? null : _email.text.trim(),
            addressLine: _address.text.trim().isEmpty ? null : _address.text.trim(),
            cityId: _cityId,
            districtId: _districtId,
            countryCode: 'TR',
            postalCode: _postalCode.text.trim().isEmpty ? null : _postalCode.text.trim(),
            paymentTermId: _paymentTermId,
            dueDays: dueDays,
          ),
        );
      } else {
        await repo.create(
          CreateCariRequest(
            personType: _isTuzel ? 'TUZEL_KISI' : 'GERCEK_KISI',
            title: _title.text.trim(),
            taxNumber: _isTuzel ? _vknTckn.text.trim() : null,
            identityNumber: !_isTuzel ? _vknTckn.text.trim() : null,
            taxOffice: _isTuzel && _taxOffice.text.trim().isNotEmpty ? _taxOffice.text.trim() : null,
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
            email: _email.text.trim().isEmpty ? null : _email.text.trim(),
            addressLine: _address.text.trim().isEmpty ? null : _address.text.trim(),
            cityId: _cityId,
            districtId: _districtId,
            countryCode: 'TR',
            postalCode: _postalCode.text.trim().isEmpty ? null : _postalCode.text.trim(),
            paymentTermId: _paymentTermId,
            dueDays: dueDays,
          ),
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _errorBox() {
    if (_error == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.dangerSubtle, borderRadius: BorderRadius.circular(8)),
      child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.isEdit ? 'Cari Düzenle' : 'Yeni Cari Kart')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final idLen = _isTuzel ? 10 : 11;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Cari Düzenle' : 'Yeni Cari Kart'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Genel'),
            Tab(text: 'Adres'),
            Tab(text: 'Ödeme'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: TabBarView(
          controller: _tabs,
          children: [
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _errorBox(),
                if (_code != null) ListTile(title: const Text('Cari Kodu'), subtitle: Text(_code!)),
                if (!widget.isEdit) ...[
                  SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment(value: true, label: Text('Tüzel'), icon: Icon(Icons.business_outlined)),
                      ButtonSegment(value: false, label: Text('Gerçek'), icon: Icon(Icons.person_outline)),
                    ],
                    selected: {_isTuzel},
                    onSelectionChanged: widget.isEdit
                        ? null
                        : (s) => setState(() {
                              _isTuzel = s.first;
                              _vknTckn.clear();
                            }),
                  ),
                  const SizedBox(height: 14),
                ],
                TextFormField(
                  controller: _vknTckn,
                  readOnly: widget.isEdit,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(idLen),
                  ],
                  decoration: InputDecoration(labelText: _isTuzel ? 'VKN' : 'TCKN'),
                  validator: widget.isEdit ? null : (v) => v == null || v.length != idLen ? '$idLen hane girin' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _title,
                  decoration: InputDecoration(labelText: _isTuzel ? 'Unvan' : 'Ad Soyad'),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
                ),
                if (_isTuzel) ...[
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _taxOffice,
                    decoration: const InputDecoration(labelText: 'Vergi Dairesi'),
                  ),
                ],
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
                if (widget.isEdit) ...[
                  const SizedBox(height: 14),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Aktif'),
                    value: _isActive,
                    onChanged: (v) => setState(() => _isActive = v),
                  ),
                ],
              ],
            ),
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _errorBox(),
                TextFormField(
                  controller: _address,
                  decoration: const InputDecoration(labelText: 'Adres'),
                  maxLines: 3,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<int>(
                  value: _cityId,
                  decoration: const InputDecoration(labelText: 'İl'),
                  items: _cities
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                      .toList(),
                  onChanged: (v) async {
                    setState(() {
                      _cityId = v;
                      _districtId = null;
                    });
                    if (v != null) await _loadDistricts(v);
                  },
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<int>(
                  value: _districtId,
                  decoration: const InputDecoration(labelText: 'İlçe'),
                  items: _districts
                      .map((d) => DropdownMenuItem(value: d.id, child: Text(d.name)))
                      .toList(),
                  onChanged: _cityId == null ? null : (v) => setState(() => _districtId = v),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _postalCode,
                  decoration: const InputDecoration(labelText: 'Posta Kodu'),
                ),
              ],
            ),
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _errorBox(),
                DropdownButtonFormField<int>(
                  value: _paymentTermId,
                  decoration: const InputDecoration(labelText: 'Ödeme Vadesi'),
                  items: _paymentTerms
                      .map((t) => DropdownMenuItem(value: t.id, child: Text('${t.name} (${t.dueDays} gün)')))
                      .toList(),
                  onChanged: (v) => setState(() => _paymentTermId = v),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _dueDays,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(labelText: 'Vade Günü'),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _saving ? null : _submit,
            child: Text(_saving ? 'Kaydediliyor…' : 'Kaydet'),
          ),
        ),
      ),
    );
  }
}
