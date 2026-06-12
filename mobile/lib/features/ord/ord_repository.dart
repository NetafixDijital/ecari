import '../../core/api/api_client.dart';

class OrdOrder {
  OrdOrder({
    required this.id,
    required this.documentNo,
    required this.accountTitle,
    required this.documentDate,
    required this.grandTotal,
    required this.statusKey,
    required this.statusLabel,
    this.deliveryDate,
  });

  final int id;
  final String documentNo;
  final String accountTitle;
  final String documentDate;
  final String? deliveryDate;
  final double grandTotal;
  final String statusKey;
  final String statusLabel;

  factory OrdOrder.fromJson(Map<String, dynamic> json) => OrdOrder(
        id: json['id'] as int,
        documentNo: json['documentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        documentDate: json['documentDate'] as String? ?? '',
        deliveryDate: json['deliveryDate'] as String?,
        grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class OrdRepository {
  OrdRepository(this._api);
  final ApiClient _api;

  Future<List<OrdOrder>> list({String? type, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/ord/orders',
      query: {
        if (type != null) 'type': type,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => OrdOrder.fromJson(e as Map<String, dynamic>)).toList();
  }
}
