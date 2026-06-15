import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_detail_view.dart';
import '../../core/widgets/module_list_tile.dart';
import 'tsk_form_screen.dart';
import 'tsk_repository.dart';

class TskDetailScreen extends StatefulWidget {
  const TskDetailScreen({super.key, required this.taskId});

  final int taskId;

  @override
  State<TskDetailScreen> createState() => _TskDetailScreenState();
}

class _TskDetailScreenState extends State<TskDetailScreen> {
  bool _loading = true;
  String? _error;
  TskTask? _task;

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
      final task = await TskRepository(context.read<ApiClient>()).getById(widget.taskId);
      if (!mounted) return;
      setState(() => _task = task);
    } catch (e) {
      if (mounted) setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit() async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => TskFormScreen(taskId: widget.taskId)),
    );
    if (updated == true && mounted) _load();
  }

  Future<void> _complete() async {
    try {
      await TskRepository(context.read<ApiClient>()).updateStatus(
        id: widget.taskId,
        status: 'COMPLETED',
        progressPercent: 100,
      );
      if (!mounted) return;
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Görev tamamlandı')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Görevi Sil'),
        content: const Text('Bu görev silinsin mi?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await TskRepository(context.read<ApiClient>()).delete(widget.taskId);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<ApiClient>().messageFromError(e))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Görev Detayı')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (_error != null || _task == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Görev Detayı')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? 'Kayıt bulunamadı'),
              const SizedBox(height: 12),
              FilledButton(onPressed: _load, child: const Text('Tekrar Dene')),
            ],
          ),
        ),
      );
    }

    final task = _task!;
    return ModuleDetailScaffold(
      title: 'Görev Detayı',
      fields: [
        DetailField('Görev No', task.taskNo),
        DetailField('Başlık', task.title),
        DetailField('Bitiş', task.endDate),
        if (task.assigneeName != null) DetailField('Atanan', task.assigneeName!),
        if (task.priorityLabel != null) DetailField('Öncelik', task.priorityLabel!),
        DetailField('İlerleme', '%${task.progressPercent}'),
        DetailField(
          'Durum',
          '',
          badge: task.statusLabel,
          badgeTone: statusTone(task.statusKey),
        ),
      ],
      footer: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          OutlinedButton.icon(
            onPressed: _edit,
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: const Text('Düzenle'),
          ),
          if (task.statusKey != 'tamamlandi') ...[
            const SizedBox(height: 8),
            FilledButton(onPressed: _complete, child: const Text('Tamamla')),
          ],
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _delete,
            icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
            label: const Text('Sil', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}
