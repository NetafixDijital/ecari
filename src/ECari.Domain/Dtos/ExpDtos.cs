namespace ECari.Domain.Dtos;

public record ExpServiceDefinitionDto(
    long Id,
    string Code,
    string Name,
    string CategoryGroup,
    long? DefaultTaxRateId);

public record ExpExpenseListItemDto(
    long Id,
    string DocumentNo,
    DateOnly ExpenseDate,
    string AccountTitle,
    string Summary,
    decimal GrandTotal,
    string PaymentMethodKey,
    string PaymentMethodLabel,
    string StatusKey,
    string StatusLabel,
    long? PurchaseInvoiceId);

public record CreateExpExpenseLineRequest(
    long? ServiceDefinitionId,
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId,
    decimal UnitPrice,
    long TaxRateId);

public record CreateExpExpenseRequest(
    long AccountId,
    DateOnly ExpenseDate,
    string PaymentMethod,
    string? Notes,
    IReadOnlyList<CreateExpExpenseLineRequest> Lines,
    bool RequiresApproval = false);

public record ExpExpenseDetailDto(
    long Id,
    string DocumentNo,
    DateOnly ExpenseDate,
    long AccountId,
    string AccountTitle,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    string PaymentMethodKey,
    string PaymentMethodLabel,
    string StatusKey,
    string StatusLabel,
    long? PurchaseInvoiceId,
    string? Notes,
    IReadOnlyList<ExpExpenseLineDto> Lines);

public record ExpExpenseLineDto(
    int LineNo,
    string LineType,
    string Description,
    string? ServiceName,
    string UnitName,
    decimal Quantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal LineTotal);

public record ExpenseStatsDto(
    int TotalCount,
    decimal TotalAmount,
    int PendingCount,
    int ApprovedCount,
    int PaidCount);
