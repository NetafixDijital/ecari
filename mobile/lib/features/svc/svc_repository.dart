import '../../core/api/api_client.dart';

class SvcTicket {
  SvcTicket({
    required this.id,
    required this.ticketNo,
    required this.accountTitle,
    required this.problemDescription,
    required this.statusKey,
    required this.statusLabel,
    this.deviceName,
    this.technicianName,
    this.ticketDate,
  });

  final int id;
  final String ticketNo;
  final String accountTitle;
  final String problemDescription;
  final String? deviceName;
  final String? technicianName;
  final String? ticketDate;
  final String statusKey;
  final String statusLabel;

  factory SvcTicket.fromJson(Map<String, dynamic> json) => SvcTicket(
        id: json['id'] as int,
        ticketNo: json['ticketNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        problemDescription: json['problemDescription'] as String? ?? '',
        deviceName: json['deviceName'] as String?,
        technicianName: json['technicianName'] as String?,
        ticketDate: json['ticketDate'] as String?,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class SvcRepository {
  SvcRepository(this._api);
  final ApiClient _api;

  Future<List<SvcTicket>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/svc/tickets',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => SvcTicket.fromJson(e as Map<String, dynamic>)).toList();
  }
}
