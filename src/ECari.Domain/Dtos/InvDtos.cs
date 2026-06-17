namespace ECari.Domain.Dtos;

public record InvInvoiceListItemDto(
    long Id,
    string DocumentNo,
    string InvoiceType,
    string AccountTitle,
    DateOnly DocumentDate,
    DateOnly? DueDate,
    decimal GrandTotal,
    string PaymentStatusKey,
    string PaymentStatusLabel);

public record CreateInvInvoiceLineRequest(
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId,
    decimal UnitPrice,
    long TaxRateId);

public record CreateInvInvoiceRequest(
    string InvoiceType,
    long AccountId,
    DateOnly DocumentDate,
    DateOnly? DueDate,
    string? Notes,
    IReadOnlyList<CreateInvInvoiceLineRequest> Lines,
    string? PaymentStatus = null);

public record UpdateInvInvoiceDatesRequest(
    DateOnly DocumentDate,
    DateOnly? DueDate);

public record InvInvoiceDetailDto(
    long Id,
    string DocumentNo,
    string InvoiceType,
    long AccountId,
    string AccountTitle,
    string? AccountTaxNumber,
    DateOnly DocumentDate,
    DateOnly? DueDate,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    string PaymentStatusKey,
    string PaymentStatusLabel,
    string? Notes,
    string SellerLegalName,
    string? SellerAddress,
    IReadOnlyList<InvInvoiceLineDto> Lines);

public record InvInvoiceLineDto(
    int LineNo,
    string Description,
    string UnitName,
    decimal Quantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal LineTotal);

public record InvKdvReportRowDto(
    long Id,
    string DocumentNo,
    string InvoiceType,
    string AccountTitle,
    DateOnly DocumentDate,
    decimal Subtotal,
    decimal TaxTotal);

public record InvKdvReportDto(
    decimal SalesTaxTotal,
    decimal PurchaseTaxTotal,
    decimal DeductibleTaxTotal,
    decimal NetPayableTax,
    IReadOnlyList<InvKdvReportRowDto> Rows,
    IReadOnlyList<InvKdvRateGroupDto> RateGroups);

public record InvKdvRateGroupDto(
    decimal TaxRate,
    string TaxRateLabel,
    decimal SalesBase,
    decimal SalesTax,
    decimal PurchaseBase,
    decimal PurchaseTax);