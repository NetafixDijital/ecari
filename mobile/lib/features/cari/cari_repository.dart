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

  Future<CariAccountDetail> getById(int id) async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/cari/accounts/$id');
    return CariAccountDetail.fromJson(data);
  }

  Future<CariAccountDetail> create(CreateCariRequest request) async {
    final data = await _api.postJson<Map<String, dynamic>>('/api/cari/accounts', data: request.toJson());
    return CariAccountDetail.fromJson(data);
  }

  Future<CariAccountDetail> update(int id, UpdateCariRequest request) async {
    final data = await _api.putJsonData<Map<String, dynamic>>('/api/cari/accounts/$id', data: request.toJson());
    return CariAccountDetail.fromJson(data);
  }

  Future<void> collect({
    required int accountId,
    required String paymentMethod,
    required double amount,
    required String transactionDate,
    String? description,
    int? cashAccountId,
    int? bankAccountId,
    String? checkInstrumentNo,
    String? checkBankName,
    String? checkDueDate,
  }) async {
    await _api.postJson('/api/cari/collections', data: {
      'accountId': accountId,
      'paymentMethod': paymentMethod,
      'amount': amount,
      'transactionDate': transactionDate,
      'description': description,
      'cashAccountId': cashAccountId,
      'bankAccountId': bankAccountId,
      'checkInstrumentNo': checkInstrumentNo,
      'checkBankName': checkBankName,
      'checkDueDate': checkDueDate,
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
