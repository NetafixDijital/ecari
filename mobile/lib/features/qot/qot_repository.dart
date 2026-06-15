import '../../core/api/api_client.dart';

class QotQuotation {
  QotQuotation({
    required this.id,
    required this.documentNo,
    required this.documentType,
    required this.accountTitle,
    required this.documentDate,
    required this.grandTotal,
    required this.statusKey,
    required this.statusLabel,
    this.validUntil,
  });

  final int id;
  final String documentNo;
  final String documentType;
  final String accountTitle;
  final String documentDate;
  final String? validUntil;
  final double grandTotal;
  final String statusKey;
  final String statusLabel;

  factory QotQuotation.fromJson(Map<String, dynamic> json) => QotQuotation(
        id: json['id'] as int,
        documentNo: json['documentNo'] as String? ?? '',
        documentType: json['documentType'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        documentDate: json['documentDate'] as String? ?? '',
        validUntil: json['validUntil'] as String?,
        grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class QotRepository {
  QotRepository(this._api);
  final ApiClient _api;

  Future<List<QotQuotation>> list({String? type, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/qot/quotations',
      query: {
        if (type != null) 'type': type,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => QotQuotation.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> getById(int id) async {
    return _api.getJson<Map<String, dynamic>>('/api/qot/quotations/$id');
  }

  Future<Map<String, dynamic>> create({
    required String documentType,
    required int accountId,
    required String documentDate,
    String? validUntil,
    int? warehouseId,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) async {
    return _api.postJson<Map<String, dynamic>>('/api/qot/quotations', data: {
      'documentType': documentType,
      'accountId': accountId,
      'documentDate': documentDate,
      'validUntil': validUntil,
      'warehouseId': warehouseId,
      'notes': notes,
      'lines': lines,
    });
  }

  Future<Map<String, dynamic>> convertToOrder(int id) async {
    return _api.postJson<Map<String, dynamic>>('/api/qot/quotations/$id/convert-to-order');
  }

  Future<void> delete(int id) async {
    await _api.delete('/api/qot/quotations/$id');
  }
}
