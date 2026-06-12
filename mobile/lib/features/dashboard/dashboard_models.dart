class DashboardSummary {
  DashboardSummary({
    required this.totalIncome,
    required this.totalExpense,
    required this.netProfit,
    required this.pendingInvoiceCount,
    required this.salesInvoiceCount,
    required this.receivableAccountCount,
    required this.totalReceivable,
    required this.paidInvoicePercent,
    required this.overdueInvoicePercent,
    required this.monthIncome,
    required this.todayIncome,
    required this.recentTransactions,
    required this.dueItems,
    required this.recentTasks,
  });

  final double totalIncome;
  final double totalExpense;
  final double netProfit;
  final int pendingInvoiceCount;
  final int salesInvoiceCount;
  final int receivableAccountCount;
  final double totalReceivable;
  final double paidInvoicePercent;
  final double overdueInvoicePercent;
  final double monthIncome;
  final double todayIncome;
  final List<DashboardTransaction> recentTransactions;
  final List<DashboardDueItem> dueItems;
  final List<DashboardTaskItem> recentTasks;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) => DashboardSummary(
        totalIncome: (json['totalIncome'] as num?)?.toDouble() ?? 0,
        totalExpense: (json['totalExpense'] as num?)?.toDouble() ?? 0,
        netProfit: (json['netProfit'] as num?)?.toDouble() ?? 0,
        pendingInvoiceCount: json['pendingInvoiceCount'] as int? ?? 0,
        salesInvoiceCount: json['salesInvoiceCount'] as int? ?? 0,
        receivableAccountCount: json['receivableAccountCount'] as int? ?? 0,
        totalReceivable: (json['totalReceivable'] as num?)?.toDouble() ?? 0,
        paidInvoicePercent: (json['paidInvoicePercent'] as num?)?.toDouble() ?? 0,
        overdueInvoicePercent: (json['overdueInvoicePercent'] as num?)?.toDouble() ?? 0,
        monthIncome: (json['monthIncome'] as num?)?.toDouble() ?? 0,
        todayIncome: (json['todayIncome'] as num?)?.toDouble() ?? 0,
        recentTransactions: (json['recentTransactions'] as List<dynamic>? ?? [])
            .map((e) => DashboardTransaction.fromJson(e as Map<String, dynamic>))
            .toList(),
        dueItems: (json['dueItems'] as List<dynamic>? ?? [])
            .map((e) => DashboardDueItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        recentTasks: (json['recentTasks'] as List<dynamic>? ?? [])
            .map((e) => DashboardTaskItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class DashboardTransaction {
  DashboardTransaction({
    required this.accountTitle,
    required this.documentDate,
    required this.description,
    required this.amount,
    required this.statusLabel,
  });

  final String accountTitle;
  final String documentDate;
  final String description;
  final double amount;
  final String statusLabel;

  factory DashboardTransaction.fromJson(Map<String, dynamic> json) => DashboardTransaction(
        accountTitle: json['accountTitle'] as String? ?? '',
        documentDate: json['documentDate'] as String? ?? '',
        description: json['description'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        statusLabel: json['statusLabel'] as String? ?? '',
      );
}

class DashboardDueItem {
  DashboardDueItem({
    required this.documentNo,
    required this.accountTitle,
    required this.amount,
    required this.hint,
  });

  final String documentNo;
  final String accountTitle;
  final double amount;
  final String hint;

  factory DashboardDueItem.fromJson(Map<String, dynamic> json) => DashboardDueItem(
        documentNo: json['documentNo'] as String? ?? '',
        accountTitle: json['accountTitle'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        hint: json['hint'] as String? ?? '',
      );
}

class DashboardTaskItem {
  DashboardTaskItem({required this.title, required this.endDate});

  final String title;
  final String endDate;

  factory DashboardTaskItem.fromJson(Map<String, dynamic> json) => DashboardTaskItem(
        title: json['title'] as String? ?? '',
        endDate: json['endDate'] as String? ?? '',
      );
}
