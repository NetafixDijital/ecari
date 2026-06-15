import '../../core/api/api_client.dart';

class ExpenseStats {
  ExpenseStats({
    required this.totalCount,
    required this.totalAmount,
    required this.pendingCount,
    required this.approvedCount,
    required this.paidCount,
  });

  final int totalCount;
  final double totalAmount;
  final int pendingCount;
  final int approvedCount;
  final int paidCount;

  factory ExpenseStats.fromJson(Map<String, dynamic> json) => ExpenseStats(
        totalCount: json['totalCount'] as int? ?? 0,
        totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
        pendingCount: json['pendingCount'] as int? ?? 0,
        approvedCount: json['approvedCount'] as int? ?? 0,
        paidCount: json['paidCount'] as int? ?? 0,
      );
}

class ExpService {
  ExpService({required this.id, required this.code, required this.name, this.defaultTaxRateId});

  final int id;
  final String code;
  final String name;
  final int? defaultTaxRateId;

  factory ExpService.fromJson(Map<String, dynamic> json) => ExpService(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        defaultTaxRateId: json['defaultTaxRateId'] as int?,
      );
}

class ExpExpense {
  ExpExpense({
    required this.id,
    required this.documentNo,
    required this.accountTitle,
    required this.summary,
    required this.grandTotal,
    required this.paymentMethodLabel,
    required this.statusKey,
    required this.statusLabel,
    this.expenseDate,
    this.purchaseInvoiceId,
  });

  final int id;
  final String documentNo;
  final String accountTitle;
  final String summary;
  final double grandTotal;
  final String paymentMethodLabel;
  final String? expenseDate;
  final String statusKey;
  final String statusLabel;
  final int? purchaseInvoiceId;

  factory ExpExpense.fromJson(Map<String, dynamic> json) => ExpExpense(
        id: json['id'] as int,
        documentNo: json['documentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        summary: json['summary'] as String? ?? json['description'] as String? ?? '',
        grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? (json['amount'] as num?)?.toDouble() ?? 0,
        paymentMethodLabel: json['paymentMethodLabel'] as String? ?? '',
        expenseDate: json['expenseDate'] as String?,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
        purchaseInvoiceId: json['purchaseInvoiceId'] as int?,
      );
}

class ExpRepository {
  ExpRepository(this._api);
  final ApiClient _api;

  Future<List<ExpService>> services() async {
    final data = await _api.getJson<List<dynamic>>('/api/exp/services');
    return data.map((e) => ExpService.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ExpExpense>> list({String? status, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/exp/expenses',
      query: {
        if (status != null && status.isNotEmpty) 'status': status,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => ExpExpense.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ExpenseStats> stats() async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/exp/stats');
    return ExpenseStats.fromJson(data);
  }

  Future<Map<String, dynamic>> getById(int id) async {
    return _api.getJson<Map<String, dynamic>>('/api/exp/expenses/$id');
  }

  Future<Map<String, dynamic>> create({
    required int accountId,
    required String expenseDate,
    required String paymentMethod,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) async {
    return _api.postJson<Map<String, dynamic>>('/api/exp/expenses', data: {
      'accountId': accountId,
      'expenseDate': expenseDate,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'lines': lines,
    });
  }

  Future<Map<String, dynamic>> updateStatus({
    required int id,
    required String action,
    String? notes,
  }) async {
    return _api.patchJsonData<Map<String, dynamic>>('/api/exp/expenses/$id/status', data: {
      'action': action,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
  }

  Future<Map<String, dynamic>> pay({
    required int id,
    String? paymentMethod,
    String? transactionDate,
  }) async {
    return _api.postJson<Map<String, dynamic>>('/api/exp/expenses/$id/pay', data: {
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (transactionDate != null) 'transactionDate': transactionDate,
    });
  }
}
