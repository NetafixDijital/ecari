namespace ECari.Domain.Dtos;

public record DlnDeliveryNoteListItemDto(
    long Id,
    string DocumentNo,
    string DocumentType,
    string AccountTitle,
    DateOnly DocumentDate,
    string? ShippingAddress,
    string StatusKey,
    string StatusLabel);

public record DlnDeliveryNoteLineDto(
    int LineNo,
    string Description,
    string UnitName,
    decimal Quantity);

public record DlnDeliveryNoteDetailDto(
    long Id,
    string DocumentNo,
    string DocumentType,
    long AccountId,
    string AccountTitle,
    DateOnly DocumentDate,
    string? ShippingAddress,
    string? WarehouseName,
    string StatusKey,
    string StatusLabel,
    string? Notes,
    IReadOnlyList<DlnDeliveryNoteLineDto> Lines);

public record CreateDlnDeliveryNoteLineRequest(
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId);

public record CreateDlnDeliveryNoteRequest(
    string DocumentType,
    long AccountId,
    DateOnly DocumentDate,
    long? WarehouseId,
    string? ShippingAddress,
    string? Notes,
    IReadOnlyList<CreateDlnDeliveryNoteLineRequest> Lines);

public record UpdateDlnDeliveryNoteDatesRequest(DateOnly DocumentDate);
