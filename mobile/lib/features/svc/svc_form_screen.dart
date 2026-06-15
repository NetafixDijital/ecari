import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/cari_picker_sheet.dart';
import '../../features/cari/cari_models.dart';
import 'svc_repository.dart';

class SvcFormScreen extends StatefulWidget {
  const SvcFormScreen({super.key, this.ticketId});

  final int? ticketId;

  @override
  State<SvcFormScreen> createState() => _SvcFormScreenState();
}

class _SvcFormScreenState extends State<SvcFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _device = TextEditingController();
  final _problem = TextEditingController();
  final _technician = TextEditingController();
  final _resolution = TextEditingController();
  CariAccount? _cari;
  String _priority = 'NORMAL';
  bool _loading = false;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.ticketId != null;

  @override
  void initState() {
    super.initState();
    _loading = _isEdit;
    if (_isEdit) _loadTicket();
  }

  Future<void> _loadTicket() async {
    try {
      final ticket = await SvcRepository(context.read<ApiClient>()).getById(widget.ticketId!);
      if (!mounted) return;
      setState(() {
        _device.text = ticket.deviceName ?? '';
        _problem.text = ticket.problemDescription;
        _technician.text = ticket.technicianName ?? '';
        _resolution.text = ticket.resolution ?? '';
        _priority = _priorityFromKey(ticket.priorityKey);
        _cari = ticket.accountId != null
            ? CariAccount(
                id: ticket.accountId!,
                code: '',
                title: ticket.accountTitle,
                personType: 'TUZEL',
                balance: 0,
                balanceSide: '',
                isActive: true,
              )
            : null;
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

  String _priorityFromKey(String? key) => switch (key) {
        'dusuk' => 'LOW',
        'yuksek' => 'HIGH',
        'acil' => 'URGENT',
        _ => 'NORMAL',
      };

  @override
  void dispose() {
    _device.dispose();
    _problem.dispose();
    _technician.dispose();
    _resolution.dispose();
    super.dispose();
  }

  Future<void> _pickCari() async {
    if (_isEdit) return;
    final picked = await showCariPickerSheet(context);
    if (picked != null) setState(() => _cari = picked);
  }

  Future<void> _submit() async {
    if (!_isEdit && _cari == null) {
      setState(() => _error = 'Cari seçin.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = SvcRepository(context.read<ApiClient>());
      if (_isEdit) {
        await repo.update(
          id: widget.ticketId!,
          deviceName: _device.text.trim().isEmpty ? null : _device.text.trim(),
          problemDescription: _problem.text.trim(),
          technicianName: _technician.text.trim().isEmpty ? null : _technician.text.trim(),
          priority: _priority,
          resolution: _resolution.text.trim().isEmpty ? null : _resolution.text.trim(),
        );
      } else {
        await repo.create(
          accountId: _cari!.id,
          deviceName: _device.text.trim().isEmpty ? null : _device.text.trim(),
          problemDescription: _problem.text.trim(),
          technicianName: _technician.text.trim().isEmpty ? null : _technician.text.trim(),
          priority: _priority,
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

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(_isEdit ? 'Servis Düzenle' : 'Yeni Servis Kaydı')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Servis Düzenle' : 'Yeni Servis Kaydı')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.dangerSubtle, borderRadius: BorderRadius.circular(8)),
                child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ),
              const SizedBox(height: 12),
            ],
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Cari'),
              subtitle: Text(_cari?.title ?? 'Seçilmedi'),
              trailing: _isEdit ? null : const Icon(Icons.chevron_right),
              onTap: _isEdit ? null : _pickCari,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _device,
              decoration: const InputDecoration(labelText: 'Cihaz / Ürün'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _problem,
              decoration: const InputDecoration(labelText: 'Problem Açıklaması'),
              maxLines: 3,
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _technician,
              decoration: const InputDecoration(labelText: 'Teknisyen'),
            ),
            if (_isEdit) ...[
              const SizedBox(height: 14),
              TextFormField(
                controller: _resolution,
                decoration: const InputDecoration(labelText: 'Çözüm / Yapılan İşlem'),
                maxLines: 3,
              ),
            ],
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _priority,
              decoration: const InputDecoration(labelText: 'Öncelik'),
              items: const [
                DropdownMenuItem(value: 'LOW', child: Text('Düşük')),
                DropdownMenuItem(value: 'NORMAL', child: Text('Normal')),
                DropdownMenuItem(value: 'HIGH', child: Text('Yüksek')),
                DropdownMenuItem(value: 'URGENT', child: Text('Acil')),
              ],
              onChanged: (v) => setState(() => _priority = v ?? 'NORMAL'),
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
