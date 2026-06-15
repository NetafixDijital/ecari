import '../../core/api/api_client.dart';

class BnkAccount {
  BnkAccount({
    required this.id,
    required this.code,
    required this.bankName,
    required this.accountName,
    required this.iban,
    required this.balance,
    required this.isActive,
  });

  final int id;
  final String code;
  final String bankName;
  final String accountName;
  final String iban;
  final double balance;
  final bool isActive;

  factory BnkAccount.fromJson(Map<String, dynamic> json) => BnkAccount(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        bankName: json['bankName'] as String? ?? '',
        accountName: json['accountName'] as String? ?? '',
        iban: json['iban'] as String? ?? '',
        balance: (json['balance'] as num?)?.toDouble() ?? 0,
        isActive: json['isActive'] as bool? ?? true,
      );
}

class BnkTransaction {
  BnkTransaction({
    required this.id,
    required this.bankAccountId,
    required this.bankAccountName,
    required this.transactionDate,
    required this.transactionType,
    required this.transactionTypeLabel,
    required this.amount,
    this.cariTitle,
    this.referenceNo,
    this.description,
  });

  final int id;
  final int bankAccountId;
  final String bankAccountName;
  final String transactionDate;
  final String transactionType;
  final String transactionTypeLabel;
  final double amount;
  final String? cariTitle;
  final String? referenceNo;
  final String? description;

  factory BnkTransaction.fromJson(Map<String, dynamic> json) => BnkTransaction(
        id: json['id'] as int,
        bankAccountId: json['bankAccountId'] as int,
        bankAccountName: json['bankAccountName'] as String? ?? '',
        transactionDate: json['transactionDate'] as String? ?? '',
        transactionType: json['transactionType'] as String? ?? '',
        transactionTypeLabel: json['transactionTypeLabel'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        cariTitle: json['cariTitle'] as String?,
        referenceNo: json['referenceNo'] as String?,
        description: json['description'] as String?,
      );
}

class BnkRepository {
  BnkRepository(this._api);
  final ApiClient _api;

  Future<List<BnkAccount>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/bnk/accounts',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => BnkAccount.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<BnkTransaction>> transactions({int? bankAccountId}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/bnk/transactions',
      query: bankAccountId != null ? {'bankAccountId': bankAccountId} : null,
    );
    return data.map((e) => BnkTransaction.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> collect({
    required int bankAccountId,
    required int accountId,
    required double amount,
    required String transactionDate,
    String? description,
  }) async {
    await _api.postJson('/api/bnk/collections', data: {
      'bankAccountId': bankAccountId,
      'accountId': accountId,
      'amount': amount,
      'transactionDate': transactionDate,
      'description': description,
    });
  }

  Future<void> pay({
    required int bankAccountId,
    required int accountId,
    required double amount,
    required String transactionDate,
    String? description,
  }) async {
    await _api.postJson('/api/bnk/payments', data: {
      'bankAccountId': bankAccountId,
      'accountId': accountId,
      'amount': amount,
      'transactionDate': transactionDate,
      'description': description,
    });
  }
}
