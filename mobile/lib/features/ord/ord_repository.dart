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

  Future<Map<String, dynamic>> getById(int id) async {
    return _api.getJson<Map<String, dynamic>>('/api/ord/orders/$id');
  }

  Future<Map<String, dynamic>> create({
    required String orderType,
    required int accountId,
    required String documentDate,
    String? deliveryDate,
    int? warehouseId,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) async {
    return _api.postJson<Map<String, dynamic>>('/api/ord/orders', data: {
      'orderType': orderType,
      'accountId': accountId,
      'documentDate': documentDate,
      'deliveryDate': deliveryDate,
      'warehouseId': warehouseId,
      'notes': notes,
      'lines': lines,
    });
  }

  Future<Map<String, dynamic>> convertToDeliveryNote(int id) async {
    return _api.postJson<Map<String, dynamic>>('/api/ord/orders/$id/convert-to-delivery-note');
  }

  Future<Map<String, dynamic>> convertToInvoice(int id) async {
    return _api.postJson<Map<String, dynamic>>('/api/ord/orders/$id/convert-to-invoice');
  }

  Future<void> delete(int id) async {
    await _api.delete('/api/ord/orders/$id');
  }
}
