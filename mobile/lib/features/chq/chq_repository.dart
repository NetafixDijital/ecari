import '../../core/api/api_client.dart';

class ChqInstrument {
  ChqInstrument({
    required this.id,
    required this.instrumentNo,
    required this.accountTitle,
    required this.dueDate,
    required this.amount,
    required this.statusKey,
    required this.statusLabel,
    this.bankName,
    this.instrumentType,
  });

  final int id;
  final String instrumentNo;
  final String accountTitle;
  final String? bankName;
  final String? instrumentType;
  final String dueDate;
  final double amount;
  final String statusKey;
  final String statusLabel;

  factory ChqInstrument.fromJson(Map<String, dynamic> json) => ChqInstrument(
        id: json['id'] as int,
        instrumentNo: json['instrumentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        bankName: json['bankName'] as String?,
        instrumentType: json['instrumentType'] as String?,
        dueDate: json['dueDate'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class ChqRepository {
  ChqRepository(this._api);
  final ApiClient _api;

  Future<List<ChqInstrument>> list({required String direction, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/chq/instruments',
      query: {
        'direction': direction,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => ChqInstrument.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ChqInstrument> create({
    required String instrumentType,
    required String direction,
    required int accountId,
    required String instrumentNo,
    required String issueDate,
    required String dueDate,
    required double amount,
    String? bankName,
    String? notes,
  }) async {
    final data = await _api.postJson<Map<String, dynamic>>('/api/chq/instruments', data: {
      'instrumentType': instrumentType,
      'direction': direction,
      'accountId': accountId,
      'bankName': bankName,
      'instrumentNo': instrumentNo,
      'issueDate': issueDate,
      'dueDate': dueDate,
      'amount': amount,
      'notes': notes,
    });
    return ChqInstrument.fromJson(data);
  }

  Future<ChqInstrument> updateStatus({required int id, required String status}) async {
    final data = await _api.patchJsonData<Map<String, dynamic>>(
      '/api/chq/instruments/$id/status',
      data: {'status': status},
    );
    return ChqInstrument.fromJson(data);
  }
}
