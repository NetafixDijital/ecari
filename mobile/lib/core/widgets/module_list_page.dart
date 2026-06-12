import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import 'app_empty_state.dart';
import 'app_search_field.dart';

typedef ModuleListLoader<T> = Future<List<T>> Function(String search);

/// Modül listeleri için ortak arama + yenile + boş durum iskeleti.
class ModuleListPage<T> extends StatefulWidget {
  const ModuleListPage({
    super.key,
    required this.searchHint,
    required this.loadItems,
    required this.itemBuilder,
    this.header,
    this.filterBar,
    this.emptyTitle = 'Kayıt bulunamadı',
    this.emptyMessage = 'Arama kriterlerinize uygun kayıt yok.',
    this.emptyIcon = Icons.inbox_outlined,
  });

  final String searchHint;
  final ModuleListLoader<T> loadItems;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final Widget? header;
  final Widget? filterBar;
  final String emptyTitle;
  final String emptyMessage;
  final IconData emptyIcon;

  @override
  State<ModuleListPage<T>> createState() => _ModuleListPageState<T>();
}

class _ModuleListPageState<T> extends State<ModuleListPage<T>> {
  final _search = TextEditingController();
  bool _loading = true;
  String? _error;
  List<T> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await widget.loadItems(_search.text.trim());
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, AppSpacing.md, AppSpacing.screenH, AppSpacing.sm),
          child: AppSearchField(
            controller: _search,
            hint: widget.searchHint,
            onSearch: _load,
          ),
        ),
        if (widget.filterBar != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, AppSpacing.sm),
            child: widget.filterBar,
          ),
        if (widget.header != null && !_loading && _error == null)
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, AppSpacing.sm),
            child: widget.header,
          ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : _error != null
                  ? AppEmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: 'Yüklenemedi',
                      message: _error!,
                      actionLabel: 'Tekrar Dene',
                      onAction: _load,
                    )
                  : _items.isEmpty
                      ? AppEmptyState(
                          icon: widget.emptyIcon,
                          title: widget.emptyTitle,
                          message: widget.emptyMessage,
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 4, AppSpacing.screenH, 100),
                            itemCount: _items.length,
                            itemBuilder: (context, index) => widget.itemBuilder(context, _items[index]),
                          ),
                        ),
        ),
      ],
    );
  }
}

/// Segmented filtre (Satış/Alış, Alınan/Verilen vb.)
class ModuleFilterBar extends StatelessWidget {
  const ModuleFilterBar({
    super.key,
    required this.labels,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<int>(
      segments: List.generate(
        labels.length,
        (i) => ButtonSegment(value: i, label: Text(labels[i], style: const TextStyle(fontSize: 12))),
      ),
      selected: {selectedIndex},
      onSelectionChanged: (s) => onChanged(s.first),
      style: const ButtonStyle(visualDensity: VisualDensity.compact),
    );
  }
}
