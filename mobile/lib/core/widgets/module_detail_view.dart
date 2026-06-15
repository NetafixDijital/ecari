import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import 'app_surface.dart';
import 'label_badge.dart';
import 'module_list_tile.dart';

class DetailField {
  const DetailField(this.label, this.value, {this.badge, this.badgeTone = LabelBadgeTone.secondary});
  final String label;
  final String value;
  final String? badge;
  final LabelBadgeTone badgeTone;
}

class DocumentLine {
  const DocumentLine({
    required this.lineNo,
    required this.description,
    required this.quantity,
    required this.unitName,
    required this.lineTotal,
  });

  final int lineNo;
  final String description;
  final String quantity;
  final String unitName;
  final double lineTotal;
}

/// API'den yüklenen veya statik kayıt detayı için ortak iskelet.
class ModuleDetailScaffold extends StatelessWidget {
  const ModuleDetailScaffold({
    super.key,
    required this.title,
    required this.fields,
    this.lines,
    this.linesTitle = 'Satırlar',
    this.footer,
  });

  final String title;
  final List<DetailField> fields;
  final List<DocumentLine>? lines;
  final String linesTitle;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screenH),
        children: [
          AppCard(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (var i = 0; i < fields.length; i++) ...[
                  if (i > 0) const Divider(height: 20),
                  _DetailRow(field: fields[i]),
                ],
              ],
            ),
          ),
          if (lines != null && lines!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(linesTitle, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),
            ...lines!.map(
              (line) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: AppCard(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: AppColors.primarySubtle,
                        child: Text(
                          '${line.lineNo}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(line.description, style: const TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(
                              '${line.quantity} ${line.unitName}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Text(
                        moduleCurrency.format(line.lineTotal),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          if (footer != null) ...[
            const SizedBox(height: AppSpacing.md),
            footer!,
          ],
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.field});
  final DetailField field;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(field.label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.bodyText)),
        const SizedBox(height: 4),
        if (field.badge != null)
          LabelBadge(label: field.badge!, tone: field.badgeTone)
        else
          Text(field.value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      ],
    );
  }
}

/// API detay yükleyici.
class ModuleDetailLoader extends StatefulWidget {
  const ModuleDetailLoader({
    super.key,
    required this.title,
    required this.load,
    required this.buildFields,
    this.buildLines,
    this.buildFooter,
  });

  final String title;
  final Future<Map<String, dynamic>> Function() load;
  final List<DetailField> Function(Map<String, dynamic> data) buildFields;
  final List<DocumentLine>? Function(Map<String, dynamic> data)? buildLines;
  final Widget? Function(Map<String, dynamic> data)? buildFooter;

  @override
  State<ModuleDetailLoader> createState() => _ModuleDetailLoaderState();
}

class _ModuleDetailLoaderState extends State<ModuleDetailLoader> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.load();
  }

  Future<void> _reload() async {
    setState(() => _future = widget.load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          );
        }
        if (snap.hasError) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(snap.error.toString(), textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: _reload, child: const Text('Tekrar Dene')),
                ],
              ),
            ),
          );
        }
        final data = snap.data!;
        return ModuleDetailScaffold(
          title: widget.title,
          fields: widget.buildFields(data),
          lines: widget.buildLines?.call(data),
          footer: widget.buildFooter?.call(data),
        );
      },
    );
  }
}
