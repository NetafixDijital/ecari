namespace ECari.Domain.Dtos;

public record OrdOrderListItemDto(
    long Id,
    string DocumentNo,
    string OrderType,
    string AccountTitle,
    DateOnly DocumentDate,
    DateOnly? DeliveryDate,
    decimal GrandTotal,
    string StatusKey,
    string StatusLabel);

public record CreateOrdOrderLineRequest(
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId,
    decimal UnitPrice,
    long TaxRateId);

public record CreateOrdOrderRequest(
    string OrderType,
    long AccountId,
    DateOnly DocumentDate,
    DateOnly? DeliveryDate,
    long? WarehouseId,
    string? Notes,
    IReadOnlyList<CreateOrdOrderLineRequest> Lines);

public record OrdOrderDetailDto(
    long Id,
    string DocumentNo,
    string OrderType,
    long AccountId,
    string AccountTitle,
    DateOnly DocumentDate,
    DateOnly? DeliveryDate,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    string StatusKey,
    string StatusLabel,
    string? Notes,
    IReadOnlyList<OrdOrderLineDto> Lines,
    AuditInfoDto? Audit = null);

public record OrdOrderLineDto(
    long Id,
    int LineNo,
    string Description,
    string UnitName,
    decimal Quantity,
    decimal DeliveredQuantity,
    decimal InvoicedQuantity,
    decimal RemainingDeliveryQuantity,
    decimal RemainingInvoiceQuantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal LineTotal);

public record ConvertOrdLineQuantityRequest(long LineId, decimal Quantity);

public record ConvertOrdRequest(IReadOnlyList<ConvertOrdLineQuantityRequest>? Lines);

public record OrdDeliveryReportItemDto(
    long Id,
    string DocumentNo,
    string OrderType,
    DateOnly DocumentDate,
    DateOnly? DeliveryDate,
    decimal GrandTotal,
    string StatusKey,
    string StatusLabel,
    decimal TotalQuantity,
    decimal DeliveredQuantity);

public record ConvertOrdToDlnResultDto(long OrderId, long DeliveryNoteId, string DeliveryNoteDocumentNo);

public record ConvertOrdToInvResultDto(long OrderId, long InvoiceId, string InvoiceDocumentNo);

public record ConvertDlnToInvResultDto(long DeliveryNoteId, long InvoiceId, string InvoiceDocumentNo);
