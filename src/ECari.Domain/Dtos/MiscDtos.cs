namespace ECari.Domain.Dtos;

public record SvcTicketListItemDto(
    long Id,
    string TicketNo,
    DateTime TicketDate,
    string AccountTitle,
    string? DeviceName,
    string ProblemDescription,
    string? TechnicianName,
    string StatusKey,
    string StatusLabel);

public record SvcTicketDetailDto(
    long Id,
    string TicketNo,
    DateTime TicketDate,
    long AccountId,
    string AccountTitle,
    string? DeviceName,
    string ProblemDescription,
    string? TechnicianName,
    string PriorityKey,
    string PriorityLabel,
    string StatusKey,
    string StatusLabel,
    string? Resolution,
    DateTime? ClosedAt,
    long? InvoiceId,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    IReadOnlyList<SvcTicketLineDto> Lines);

public record SvcTicketLineDto(
    int LineNo,
    string LineType,
    long? ServiceDefinitionId,
    long? ItemId,
    string Description,
    string? ServiceName,
    string? ItemName,
    string UnitName,
    decimal Quantity,
    decimal UnitPrice,
    long TaxRateId,
    decimal TaxAmount,
    decimal LineTotal);

public record SvcServiceDefinitionDto(
    long Id,
    string Code,
    string Name,
    long? DefaultTaxRateId);

public record SaveSvcTicketLineRequest(
    long? ServiceDefinitionId,
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId,
    decimal UnitPrice,
    long TaxRateId);

public record SaveSvcTicketLinesRequest(
    IReadOnlyList<SaveSvcTicketLineRequest> Lines);

public record ConvertSvcToInvoiceLineRequest(
    long? ItemId,
    string Description,
    decimal Quantity,
    long UnitId,
    decimal UnitPrice,
    long TaxRateId);

public record ConvertSvcToInvoiceRequest(
    string PaymentMethod,
    IReadOnlyList<ConvertSvcToInvoiceLineRequest>? Lines = null);

public record ConvertSvcToInvoiceResultDto(
    long TicketId,
    long InvoiceId,
    string InvoiceDocumentNo);

public record CreateSvcTicketRequest(
    long AccountId,
    string? DeviceName,
    string ProblemDescription,
    string? TechnicianName,
    string Priority);

public record UpdateSvcTicketRequest(
    string? DeviceName,
    string ProblemDescription,
    string? TechnicianName,
    string Priority,
    string? Resolution);

public record UpdateSvcTicketStatusRequest(string Status);

public record TskTaskListItemDto(
    long Id,
    string TaskNo,
    string Title,
    DateOnly StartDate,
    DateOnly EndDate,
    string? AssigneeName,
    string PriorityKey,
    string PriorityLabel,
    string StatusKey,
    string StatusLabel,
    byte ProgressPercent);

public record TskTaskStatsDto(
    int Pending,
    int InProgress,
    int Overdue,
    int Completed);

public record CreateTskTaskRequest(
    string Title,
    string? Description,
    DateOnly StartDate,
    DateOnly EndDate,
    string? AssigneeName,
    string Priority);

public record UpdateTskTaskRequest(
    string Title,
    string? Description,
    DateOnly StartDate,
    DateOnly EndDate,
    string? AssigneeName,
    string Priority,
    byte? ProgressPercent);

public record UpdateTskTaskStatusRequest(string Status, byte? ProgressPercent);

public record UpdateExpExpenseStatusRequest(string Action, string? Notes);

public record PayExpExpenseRequest(
    string? PaymentMethod,
    DateOnly? TransactionDate);

public record GlobalSearchResultItemDto(
    string Module,
    long Id,
    string Label,
    string? Sublabel,
    string? DocumentNo);

public record GlobalSearchResponseDto(
    string Query,
    IReadOnlyList<GlobalSearchResultItemDto> Results);

public record ModuleSettingDto(string ModuleCode, string SettingKey, string SettingValue, string DataType);

public record UpdateModuleSettingsRequest(IReadOnlyList<ModuleSettingDto> Settings);
