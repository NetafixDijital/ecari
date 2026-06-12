namespace ECari.Domain.Dtos;

public record DashboardSummaryDto(
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetProfit,
    int PendingInvoiceCount,
    int SalesInvoiceCount,
    int ReceivableAccountCount,
    decimal TotalReceivable,
    decimal PaidInvoicePercent,
    decimal OverdueInvoicePercent,
    decimal MonthIncome,
    decimal TodayIncome,
    IReadOnlyList<DashboardRecentTransactionDto> RecentTransactions,
    IReadOnlyList<DashboardDueItemDto> DueItems,
    IReadOnlyList<DashboardTaskItemDto> RecentTasks);

public record DashboardRecentTransactionDto(
    long Id,
    string AccountTitle,
    string DocumentDate,
    string Description,
    string Category,
    decimal Amount,
    string StatusKey,
    string StatusLabel);

public record DashboardDueItemDto(
    long Id,
    string DocumentNo,
    string AccountTitle,
    string? DueDate,
    decimal Amount,
    string StatusKey,
    string Hint);

public record DashboardTaskItemDto(
    long Id,
    string Title,
    string StatusKey,
    string EndDate);
