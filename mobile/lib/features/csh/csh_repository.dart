import '../../core/api/api_client.dart';

class CshAccount {
  CshAccount({
    required this.id,
    required this.code,
    required this.name,
    required this.balance,
    required this.isActive,
    this.cashType,
  });

  final int id;
  final String code;
  final String name;
  final double balance;
  final bool isActive;
  final String? cashType;

  factory CshAccount.fromJson(Map<String, dynamic> json) => CshAccount(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        balance: (json['balance'] as num?)?.toDouble() ?? 0,
        isActive: json['isActive'] as bool? ?? true,
        cashType: json['cashType'] as String?,
      );
}

class CshMovement {
  CshMovement({
    required this.id,
    required this.cashAccountId,
    required this.cashAccountName,
    required this.transactionDate,
    required this.transactionType,
    required this.transactionTypeLabel,
    required this.amount,
    this.description,
    this.referenceNo,
  });

  final int id;
  final int cashAccountId;
  final String cashAccountName;
  final String transactionDate;
  final String transactionType;
  final String transactionTypeLabel;
  final double amount;
  final String? description;
  final String? referenceNo;

  factory CshMovement.fromJson(Map<String, dynamic> json) => CshMovement(
        id: json['id'] as int,
        cashAccountId: json['cashAccountId'] as int,
        cashAccountName: json['cashAccountName'] as String? ?? '',
        transactionDate: json['transactionDate'] as String? ?? '',
        transactionType: json['transactionType'] as String? ?? '',
        transactionTypeLabel: json['transactionTypeLabel'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        description: json['description'] as String?,
        referenceNo: json['referenceNo'] as String?,
      );
}

class CshRepository {
  CshRepository(this._api);
  final ApiClient _api;

  Future<List<CshAccount>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/csh/accounts',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => CshAccount.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<CshMovement>> movements({int? cashAccountId, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/csh/movements',
      query: {
        if (cashAccountId != null) 'cashAccountId': cashAccountId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => CshMovement.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> collect({
    required int accountId,
    required int cashAccountId,
    required double amount,
    required String transactionDate,
    String? description,
  }) async {
    await _api.postJson('/api/csh/collections', data: {
      'accountId': accountId,
      'cashAccountId': cashAccountId,
      'amount': amount,
      'transactionDate': transactionDate,
      'description': description,
    });
  }

  Future<void> pay({
    required int accountId,
    required int cashAccountId,
    required double amount,
    required String transactionDate,
    String? description,
  }) async {
    await _api.postJson('/api/csh/payments', data: {
      'accountId': accountId,
      'cashAccountId': cashAccountId,
      'amount': amount,
      'transactionDate': transactionDate,
      'description': description,
    });
  }
}
