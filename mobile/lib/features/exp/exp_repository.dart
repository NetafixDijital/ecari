import '../../core/api/api_client.dart';

class ExpExpense {
  ExpExpense({
    required this.id,
    required this.documentNo,
    required this.expenseDate,
    required this.category,
    required this.description,
    required this.amount,
    required this.statusKey,
    required this.statusLabel,
    this.requesterName,
  });

  final int id;
  final String documentNo;
  final String expenseDate;
  final String category;
  final String description;
  final double amount;
  final String? requesterName;
  final String statusKey;
  final String statusLabel;

  factory ExpExpense.fromJson(Map<String, dynamic> json) => ExpExpense(
        id: json['id'] as int,
        documentNo: json['documentNo'] as String? ?? '',
        expenseDate: json['expenseDate'] as String? ?? '',
        category: json['category'] as String? ?? '',
        description: json['description'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        requesterName: json['requesterName'] as String?,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class ExpRepository {
  ExpRepository(this._api);
  final ApiClient _api;

  Future<List<ExpExpense>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/exp/expenses',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => ExpExpense.fromJson(e as Map<String, dynamic>)).toList();
  }
}
