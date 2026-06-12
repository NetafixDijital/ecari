import '../../core/api/api_client.dart';

class DlnNote {
  DlnNote({
    required this.id,
    required this.documentNo,
    required this.accountTitle,
    required this.documentDate,
    required this.statusKey,
    required this.statusLabel,
  });

  final int id;
  final String documentNo;
  final String accountTitle;
  final String documentDate;
  final String statusKey;
  final String statusLabel;

  factory DlnNote.fromJson(Map<String, dynamic> json) => DlnNote(
        id: json['id'] as int,
        documentNo: json['documentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        documentDate: json['documentDate'] as String? ?? '',
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class DlnRepository {
  DlnRepository(this._api);
  final ApiClient _api;

  Future<List<DlnNote>> list({required String type, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/dln/delivery-notes',
      query: {'type': type, if (search != null && search.isNotEmpty) 'search': search},
    );
    return data.map((e) => DlnNote.fromJson(e as Map<String, dynamic>)).toList();
  }
}
