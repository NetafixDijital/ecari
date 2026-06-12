import '../../core/api/api_client.dart';

class Warehouse {
  Warehouse({
    required this.id,
    required this.code,
    required this.name,
    required this.isDefault,
    required this.isActive,
    this.address,
  });

  final int id;
  final String code;
  final String name;
  final String? address;
  final bool isDefault;
  final bool isActive;

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        address: json['address'] as String?,
        isDefault: json['isDefault'] as bool? ?? false,
        isActive: json['isActive'] as bool? ?? true,
      );
}

class CfgRepository {
  CfgRepository(this._api);
  final ApiClient _api;

  Future<List<Warehouse>> warehouses() async {
    final data = await _api.getJson<List<dynamic>>('/api/cfg/warehouses');
    return data.map((e) => Warehouse.fromJson(e as Map<String, dynamic>)).toList();
  }
}
