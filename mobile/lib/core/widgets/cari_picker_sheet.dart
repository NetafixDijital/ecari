import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../../features/cari/cari_models.dart';
import '../../features/cari/cari_repository.dart';
import 'app_search_field.dart';

Future<CariAccount?> showCariPickerSheet(BuildContext context, {String title = 'Cari Seç'}) {
  return showModalBottomSheet<CariAccount>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) => _CariPickerSheet(title: title),
  );
}

class _CariPickerSheet extends StatefulWidget {
  const _CariPickerSheet({required this.title});
  final String title;

  @override
  State<_CariPickerSheet> createState() => _CariPickerSheetState();
}

class _CariPickerSheetState extends State<_CariPickerSheet> {
  final _search = TextEditingController();
  bool _loading = true;
  String? _error;
  List<CariAccount> _items = [];

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
      final repo = CariRepository(context.read<ApiClient>());
      final items = await repo.list(search: _search.text.trim());
      if (mounted) setState(() => _items = items.where((c) => c.isActive).toList());
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.75;
    return SizedBox(
      height: height,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(child: Text(widget.title, style: Theme.of(context).textTheme.titleMedium)),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: AppSearchField(controller: _search, hint: 'Cari ara…', onSearch: _load),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          return ListTile(
                            title: Text(item.title),
                            subtitle: Text('${item.code} · ${item.taxId}'),
                            onTap: () => Navigator.pop(context, item),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
