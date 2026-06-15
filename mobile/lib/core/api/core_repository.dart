import '../../core/api/api_client.dart';

class CoreLookup {
  CoreLookup({required this.id, required this.name, this.code});
  final int id;
  final String name;
  final String? code;

  factory CoreLookup.fromJson(Map<String, dynamic> json) => CoreLookup(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        code: json['code'] as String?,
      );
}

class TaxRate {
  TaxRate({required this.id, required this.code, required this.name, required this.rate});
  final int id;
  final String code;
  final String name;
  final double rate;

  factory TaxRate.fromJson(Map<String, dynamic> json) => TaxRate(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        rate: (json['rate'] as num?)?.toDouble() ?? 0,
      );
}

class PaymentTerm {
  PaymentTerm({required this.id, required this.name, required this.dueDays});
  final int id;
  final String name;
  final int dueDays;

  factory PaymentTerm.fromJson(Map<String, dynamic> json) => PaymentTerm(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        dueDays: json['dueDays'] as int? ?? 0,
      );
}

class GlobalSearchResult {
  GlobalSearchResult({
    required this.module,
    required this.id,
    required this.label,
    this.sublabel,
    this.documentNo,
  });

  final String module;
  final int id;
  final String label;
  final String? sublabel;
  final String? documentNo;

  factory GlobalSearchResult.fromJson(Map<String, dynamic> json) => GlobalSearchResult(
        module: json['module'] as String? ?? '',
        id: json['id'] as int,
        label: json['label'] as String? ?? '',
        sublabel: json['sublabel'] as String?,
        documentNo: json['documentNo'] as String?,
      );
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

  Future<List<CoreLookup>> cities() async {
    final data = await _api.getJson<List<dynamic>>('/api/core/cities');
    return data.map((e) => CoreLookup.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<CoreLookup>> districts(int cityId) async {
    final data = await _api.getJson<List<dynamic>>('/api/core/cities/$cityId/districts');
    return data.map((e) => CoreLookup.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<PaymentTerm>> paymentTerms() async {
    final data = await _api.getJson<List<dynamic>>('/api/core/payment-terms');
    return data.map((e) => PaymentTerm.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<GlobalSearchResult>> search(String query, {int limit = 20}) async {
    final data = await _api.getJson<Map<String, dynamic>>(
      '/api/core/search',
      query: {'q': query, 'limit': limit},
    );
    final results = data['results'] as List<dynamic>? ?? [];
    return results.map((e) => GlobalSearchResult.fromJson(e as Map<String, dynamic>)).toList();
  }
}
