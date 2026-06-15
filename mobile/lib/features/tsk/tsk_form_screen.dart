import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../features/finance/finance_utils.dart';
import 'tsk_repository.dart';

class TskFormScreen extends StatefulWidget {
  const TskFormScreen({super.key, this.taskId});

  final int? taskId;

  @override
  State<TskFormScreen> createState() => _TskFormScreenState();
}

class _TskFormScreenState extends State<TskFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _assignee = TextEditingController();
  String _priority = 'NORMAL';
  String _startDate = todayIso();
  String _endDate = todayIso();
  bool _loading = false;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.taskId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _loadTask();
  }

  Future<void> _loadTask() async {
    setState(() => _loading = true);
    try {
      final task = await TskRepository(context.read<ApiClient>()).getById(widget.taskId!);
      if (!mounted) return;
      _title.text = task.title;
      _assignee.text = task.assigneeName ?? '';
      _endDate = task.endDate;
      setState(() => _loading = false);
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = context.read<ApiClient>().messageFromError(e);
      });
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _assignee.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = TskRepository(context.read<ApiClient>());
      if (_isEdit) {
        await repo.update(
          id: widget.taskId!,
          title: _title.text.trim(),
          description: _description.text.trim().isEmpty ? null : _description.text.trim(),
          startDate: _startDate,
          endDate: _endDate,
          assigneeName: _assignee.text.trim().isEmpty ? null : _assignee.text.trim(),
          priority: _priority,
        );
      } else {
        await repo.create(
          title: _title.text.trim(),
          description: _description.text.trim().isEmpty ? null : _description.text.trim(),
          startDate: _startDate,
          endDate: _endDate,
          assigneeName: _assignee.text.trim().isEmpty ? null : _assignee.text.trim(),
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
        appBar: AppBar(title: Text(_isEdit ? 'Görev Düzenle' : 'Yeni Görev')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Görev Düzenle' : 'Yeni Görev')),
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
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Başlık'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _description,
              decoration: const InputDecoration(labelText: 'Açıklama'),
              maxLines: 3,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _assignee,
              decoration: const InputDecoration(labelText: 'Atanan Kişi'),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _priority,
              decoration: const InputDecoration(labelText: 'Öncelik'),
              items: const [
                DropdownMenuItem(value: 'LOW', child: Text('Düşük')),
                DropdownMenuItem(value: 'NORMAL', child: Text('Normal')),
                DropdownMenuItem(value: 'HIGH', child: Text('Yüksek')),
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
