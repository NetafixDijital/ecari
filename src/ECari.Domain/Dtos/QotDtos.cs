namespace ECari.Domain.Dtos;

public record QotQuotationListItemDto(
    long Id,
    string DocumentNo,
    string DocumentType,
    string AccountTitle,
    DateOnly DocumentDate,
    DateOnly? ValidUntil,
    decimal GrandTotal,
    string StatusKey,
    string StatusLabel);

public record CreateQotQuotationLineRequest(
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId,
    decimal UnitPrice,
    long TaxRateId);

public record CreateQotQuotationRequest(
    string DocumentType,
    long AccountId,
    DateOnly DocumentDate,
    DateOnly? ValidUntil,
    long? WarehouseId,
    string? Notes,
    IReadOnlyList<CreateQotQuotationLineRequest> Lines);

public record QotQuotationDetailDto(
    long Id,
    string DocumentNo,
    string DocumentType,
    long AccountId,
    string AccountTitle,
    DateOnly DocumentDate,
    DateOnly? ValidUntil,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    string StatusKey,
    string StatusLabel,
    long? ConvertedOrderId,
    string? Notes,
    IReadOnlyList<QotQuotationLineDto> Lines);

public record QotQuotationLineDto(
    int LineNo,
    string Description,
    string UnitName,
    decimal Quantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal LineTotal);

public record ConvertQotToOrderResultDto(
    long QuotationId,
    long OrderId,
    string OrderDocumentNo);
