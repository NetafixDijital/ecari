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
}
