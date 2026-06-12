import '../../core/api/api_client.dart';

class InvInvoice {
  InvInvoice({
    required this.id,
    required this.documentNo,
    required this.accountTitle,
    required this.documentDate,
    required this.grandTotal,
    required this.paymentStatusKey,
    required this.paymentStatusLabel,
    this.dueDate,
  });

  final int id;
  final String documentNo;
  final String accountTitle;
  final String documentDate;
  final String? dueDate;
  final double grandTotal;
  final String paymentStatusKey;
  final String paymentStatusLabel;

  factory InvInvoice.fromJson(Map<String, dynamic> json) => InvInvoice(
        id: json['id'] as int,
        documentNo: json['documentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        documentDate: json['documentDate'] as String? ?? '',
        dueDate: json['dueDate'] as String?,
        grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0,
        paymentStatusKey: json['paymentStatusKey'] as String? ?? '',
        paymentStatusLabel: json['paymentStatusLabel'] as String? ?? '',
      );
}

class InvKdvReport {
  InvKdvReport({
    required this.salesTaxTotal,
    required this.purchaseTaxTotal,
    required this.deductibleTaxTotal,
    required this.netPayableTax,
    required this.rows,
  });

  final double salesTaxTotal;
  final double purchaseTaxTotal;
  final double deductibleTaxTotal;
  final double netPayableTax;
  final List<InvKdvRow> rows;

  factory InvKdvReport.fromJson(Map<String, dynamic> json) => InvKdvReport(
        salesTaxTotal: (json['salesTaxTotal'] as num?)?.toDouble() ?? 0,
        purchaseTaxTotal: (json['purchaseTaxTotal'] as num?)?.toDouble() ?? 0,
        deductibleTaxTotal: (json['deductibleTaxTotal'] as num?)?.toDouble() ?? 0,
        netPayableTax: (json['netPayableTax'] as num?)?.toDouble() ?? 0,
        rows: (json['rows'] as List<dynamic>? ?? [])
            .map((e) => InvKdvRow.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class InvKdvRow {
  InvKdvRow({
    required this.documentNo,
    required this.accountTitle,
    required this.documentDate,
    required this.taxTotal,
  });

  final String documentNo;
  final String accountTitle;
  final String documentDate;
  final double taxTotal;

  factory InvKdvRow.fromJson(Map<String, dynamic> json) => InvKdvRow(
        documentNo: json['documentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        documentDate: json['documentDate'] as String? ?? '',
        taxTotal: (json['taxTotal'] as num?)?.toDouble() ?? 0,
      );
}

class InvRepository {
  InvRepository(this._api);
  final ApiClient _api;

  Future<List<InvInvoice>> list({required String type, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/inv/invoices',
      query: {'type': type, if (search != null && search.isNotEmpty) 'search': search},
    );
    return data.map((e) => InvInvoice.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<InvKdvReport> kdvReport() async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/inv/kdv-report');
    return InvKdvReport.fromJson(data);
  }
}
