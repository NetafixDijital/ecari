import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../../features/stok/stk_repository.dart';
import 'app_search_field.dart';
import 'module_list_tile.dart';

Future<StkItem?> showStkPickerSheet(BuildContext context, {String title = 'Ürün Seç'}) {
  return showModalBottomSheet<StkItem>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) => _StkPickerSheet(title: title),
  );
}

class _StkPickerSheet extends StatefulWidget {
  const _StkPickerSheet({required this.title});
  final String title;

  @override
  State<_StkPickerSheet> createState() => _StkPickerSheetState();
}

class _StkPickerSheetState extends State<_StkPickerSheet> {
  final _search = TextEditingController();
  bool _loading = true;
  String? _error;
  List<StkItem> _items = [];

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
      final repo = StkRepository(context.read<ApiClient>());
      final items = await repo.list(search: _search.text.trim());
      if (mounted) setState(() => _items = items.where((i) => i.isActive).toList());
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _searchBarcode() async {
    final barcode = _search.text.trim();
    if (barcode.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = StkRepository(context.read<ApiClient>());
      final item = await repo.getByBarcode(barcode);
      if (!mounted) return;
      if (item != null) {
        Navigator.pop(context, item);
      } else {
        setState(() => _error = 'Barkoda uygun ürün bulunamadı.');
      }
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
            child: Row(
              children: [
                Expanded(
                  child: AppSearchField(
                    controller: _search,
                    hint: 'Ürün adı, kod veya barkod…',
                    onSearch: _load,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: 'Barkod ara',
                  onPressed: _searchBarcode,
                  icon: const Icon(Icons.qr_code_scanner),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!, textAlign: TextAlign.center))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          return ModuleListTile(
                            title: item.name,
                            subtitle: '${item.code}${item.barcode != null ? ' · ${item.barcode}' : ''}',
                            trailing: item.salesPrice != null ? moduleCurrency.format(item.salesPrice) : null,
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
