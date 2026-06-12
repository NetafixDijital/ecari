import '../../core/api/api_client.dart';

class CoreLookup {
  CoreLookup({required this.id, required this.name});
  final int id;
  final String name;

  factory CoreLookup.fromJson(Map<String, dynamic> json) =>
      CoreLookup(id: json['id'] as int, name: json['name'] as String? ?? '');
}

class TaxRate {
  TaxRate({required this.id, required this.rate});
  final int id;
  final double rate;

  factory TaxRate.fromJson(Map<String, dynamic> json) =>
      TaxRate(id: json['id'] as int, rate: (json['rate'] as num?)?.toDouble() ?? 0);
}

class CoreRepository {
  CoreRepository(this._api);
  final ApiClient _api;

  Future<List<CoreLookup>> units() async {
    final data = await _api.getJson<List<dynamic>>('/api/core/units');
    return data.map((e) => CoreLookup.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<TaxRate>> taxRates() async {
    final data = await _api.getJson<List<dynamic>>('/api/core/tax-rates');
    return data.map((e) => TaxRate.fromJson(e as Map<String, dynamic>)).toList();
  }
}
