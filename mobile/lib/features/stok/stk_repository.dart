import '../../core/api/api_client.dart';

class StkItem {
  StkItem({
    required this.id,
    required this.code,
    required this.name,
    required this.stockQuantity,
    required this.stockStatus,
    required this.isActive,
    this.barcode,
    this.salesPrice,
    this.baseUnitName,
  });

  final int id;
  final String code;
  final String name;
  final double stockQuantity;
  final String stockStatus;
  final bool isActive;
  final String? barcode;
  final double? salesPrice;
  final String? baseUnitName;

  factory StkItem.fromJson(Map<String, dynamic> json) => StkItem(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        stockQuantity: (json['stockQuantity'] as num?)?.toDouble() ?? 0,
        stockStatus: json['stockStatus'] as String? ?? '',
        isActive: json['isActive'] as bool? ?? true,
        barcode: json['barcode'] as String?,
        salesPrice: (json['salesPrice'] as num?)?.toDouble(),
        baseUnitName: json['baseUnitName'] as String?,
      );
}

class StkRepository {
  StkRepository(this._api);
  final ApiClient _api;

  Future<List<StkItem>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/stk/items',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => StkItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> getById(int id) async {
    return _api.getJson<Map<String, dynamic>>('/api/stk/items/$id');
  }

  Future<StkItem?> getByBarcode(String barcode) async {
    try {
      final data = await _api.getJson<Map<String, dynamic>>('/api/stk/items/by-barcode/$barcode');
      return StkItem.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> create({
    required String name,
    String? barcode,
    String? brandName,
    double? purchasePrice,
    double? salesPrice,
    int? baseUnitId,
    int? taxRateId,
  }) async {
    return _api.postJson<Map<String, dynamic>>('/api/stk/items', data: {
      'name': name,
      'barcode': barcode,
      'brandName': brandName,
      'purchasePrice': purchasePrice,
      'salesPrice': salesPrice,
      'baseUnitId': baseUnitId,
      'taxRateId': taxRateId,
      'itemType': 'PRODUCT',
    });
  }

  Future<Map<String, dynamic>> update({
    required int id,
    required String name,
    String? barcode,
    String? brandName,
    double? purchasePrice,
    double? salesPrice,
    String? shelfNo,
    bool? isWeighable,
    String? description,
    required bool isActive,
  }) async {
    return _api.putJsonData<Map<String, dynamic>>('/api/stk/items/$id', data: {
      'name': name,
      'barcode': barcode,
      'brandName': brandName,
      'purchasePrice': purchasePrice,
      'salesPrice': salesPrice,
      'shelfNo': shelfNo,
      'isWeighable': isWeighable ?? false,
      'description': description,
      'isActive': isActive,
    });
  }

  Future<List<StkMovement>> movements({int? itemId, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/stk/movements',
      query: {
        if (itemId != null) 'itemId': itemId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => StkMovement.fromJson(e as Map<String, dynamic>)).toList();
  }
}

class StkMovement {
  StkMovement({
    required this.itemName,
    required this.itemCode,
    required this.warehouseName,
    required this.movementDate,
    required this.movementTypeLabel,
    required this.quantity,
    required this.unitName,
    this.description,
  });

  final String itemName;
  final String itemCode;
  final String warehouseName;
  final String movementDate;
  final String movementTypeLabel;
  final double quantity;
  final String unitName;
  final String? description;

  factory StkMovement.fromJson(Map<String, dynamic> json) => StkMovement(
        itemName: json['itemName'] as String? ?? '',
        itemCode: json['itemCode'] as String? ?? '',
        warehouseName: json['warehouseName'] as String? ?? '',
        movementDate: json['movementDate'] as String? ?? '',
        movementTypeLabel: json['movementTypeLabel'] as String? ?? '',
        quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
        unitName: json['unitName'] as String? ?? '',
        description: json['description'] as String?,
      );
}
