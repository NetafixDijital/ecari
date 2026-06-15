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
    this.priorityKey,
    this.priorityLabel,
    this.resolution,
    this.closedAt,
    this.accountId,
    this.invoiceId,
    this.subtotal = 0,
    this.taxTotal = 0,
    this.grandTotal = 0,
    this.lines = const [],
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
  final String? priorityKey;
  final String? priorityLabel;
  final String? resolution;
  final String? closedAt;
  final int? accountId;
  final int? invoiceId;
  final double subtotal;
  final double taxTotal;
  final double grandTotal;
  final List<SvcTicketLine> lines;

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
        priorityKey: json['priorityKey'] as String?,
        priorityLabel: json['priorityLabel'] as String?,
        resolution: json['resolution'] as String?,
        closedAt: json['closedAt'] as String?,
        accountId: json['accountId'] as int?,
        invoiceId: json['invoiceId'] as int?,
        subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
        taxTotal: (json['taxTotal'] as num?)?.toDouble() ?? 0,
        grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0,
        lines: (json['lines'] as List<dynamic>? ?? [])
            .map((e) => SvcTicketLine.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class SvcTicketLine {
  SvcTicketLine({
    required this.lineNo,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
    this.lineType = 'HIZMET',
    this.serviceName,
    this.itemName,
    this.unitName,
    this.serviceDefinitionId,
    this.itemId,
    this.unitId,
    this.taxRateId,
  });

  final int lineNo;
  final String lineType;
  final int? serviceDefinitionId;
  final int? itemId;
  final String description;
  final String? serviceName;
  final String? itemName;
  final String? unitName;
  final double quantity;
  final double unitPrice;
  final int? unitId;
  final int? taxRateId;
  final double lineTotal;

  factory SvcTicketLine.fromJson(Map<String, dynamic> json) => SvcTicketLine(
        lineNo: json['lineNo'] as int? ?? 0,
        lineType: json['lineType'] as String? ?? 'HIZMET',
        serviceDefinitionId: json['serviceDefinitionId'] as int?,
        itemId: json['itemId'] as int?,
        description: json['description'] as String? ?? '',
        serviceName: json['serviceName'] as String?,
        itemName: json['itemName'] as String?,
        unitName: json['unitName'] as String?,
        quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
        unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
        unitId: null,
        taxRateId: json['taxRateId'] as int?,
        lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0,
      );
}

class SvcService {
  SvcService({required this.id, required this.code, required this.name, this.defaultTaxRateId});

  final int id;
  final String code;
  final String name;
  final int? defaultTaxRateId;

  factory SvcService.fromJson(Map<String, dynamic> json) => SvcService(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        defaultTaxRateId: json['defaultTaxRateId'] as int?,
      );
}

class SvcRepository {
  SvcRepository(this._api);
  final ApiClient _api;

  Future<List<SvcService>> services() async {
    final data = await _api.getJson<List<dynamic>>('/api/svc/services');
    return data.map((e) => SvcService.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<SvcTicket>> list({String? status, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/svc/tickets',
      query: {
        if (status != null) 'status': status,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => SvcTicket.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SvcTicket> getById(int id) async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/svc/tickets/$id');
    return SvcTicket.fromJson(data);
  }

  Future<SvcTicket> create({
    required int accountId,
    required String problemDescription,
    String? deviceName,
    String? technicianName,
    String priority = 'NORMAL',
  }) async {
    final data = await _api.postJson<Map<String, dynamic>>('/api/svc/tickets', data: {
      'accountId': accountId,
      'deviceName': deviceName,
      'problemDescription': problemDescription,
      'technicianName': technicianName,
      'priority': priority,
    });
    return SvcTicket.fromJson(data);
  }

  Future<SvcTicket> update({
    required int id,
    required String problemDescription,
    String? deviceName,
    String? technicianName,
    String priority = 'NORMAL',
    String? resolution,
  }) async {
    final data = await _api.putJsonData<Map<String, dynamic>>('/api/svc/tickets/$id', data: {
      'deviceName': deviceName,
      'problemDescription': problemDescription,
      'technicianName': technicianName,
      'priority': priority,
      'resolution': resolution,
    });
    return SvcTicket.fromJson(data);
  }

  Future<SvcTicket> updateStatus({required int id, required String status}) async {
    final data = await _api.patchJsonData<Map<String, dynamic>>('/api/svc/tickets/$id/status', data: {
      'status': status,
    });
    return SvcTicket.fromJson(data);
  }

  Future<void> delete(int id) async {
    await _api.delete('/api/svc/tickets/$id');
  }

  Future<SvcTicket> saveLines({
    required int id,
    required List<Map<String, dynamic>> lines,
  }) async {
    final data = await _api.putJsonData<Map<String, dynamic>>('/api/svc/tickets/$id/lines', data: {'lines': lines});
    return SvcTicket.fromJson(data);
  }

  Future<Map<String, dynamic>> convertToInvoice({
    required int id,
    required String paymentMethod,
    List<Map<String, dynamic>>? lines,
  }) async {
    return _api.postJson<Map<String, dynamic>>('/api/svc/tickets/$id/convert-to-invoice', data: {
      'paymentMethod': paymentMethod,
      if (lines != null) 'lines': lines,
    });
  }
}
