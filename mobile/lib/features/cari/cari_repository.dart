import '../../core/api/api_client.dart';
import 'cari_models.dart';

class CariRepository {
  CariRepository(this._api);
  final ApiClient _api;

  Future<List<CariAccount>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/cari/accounts',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => CariAccount.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> create(CreateCariRequest request) async {
    await _api.postJson('/api/cari/accounts', data: request.toJson());
  }

  Future<void> collect({
    required int accountId,
    required int cashAccountId,
    required double amount,
    required String transactionDate,
    String? description,
  }) async {
    await _api.postJson('/api/cari/collections', data: {
      'accountId': accountId,
      'paymentMethod': 'CASH',
      'amount': amount,
      'transactionDate': transactionDate,
      'description': description,
      'cashAccountId': cashAccountId,
    });
  }

  Future<void> transfer({
    required int sourceAccountId,
    required int targetAccountId,
    required double amount,
    required String transferDate,
    String? description,
  }) async {
    await _api.postJson('/api/cari/transfers', data: {
      'sourceAccountId': sourceAccountId,
      'targetAccountId': targetAccountId,
      'amount': amount,
      'transferDate': transferDate,
      'description': description,
    });
  }

  Future<List<CariMovement>> movements({int? accountId, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/cari/movements',
      query: {
        if (accountId != null) 'accountId': accountId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => CariMovement.fromJson(e as Map<String, dynamic>)).toList();
  }
}
