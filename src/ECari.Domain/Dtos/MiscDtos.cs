namespace ECari.Domain.Dtos;

public record ExpExpenseListItemDto(
    long Id,
    string DocumentNo,
    DateOnly ExpenseDate,
    string Category,
    string Description,
    decimal Amount,
    string? RequesterName,
    string StatusKey,
    string StatusLabel);

public record CreateExpExpenseRequest(
    DateOnly ExpenseDate,
    string Category,
    string Description,
    decimal Amount,
    string? RequesterName,
    string? PaymentMethod,
    string? Notes);

public record ExpenseStatsDto(
    int TotalCount,
    decimal TotalAmount,
    int PendingCount,
    int ApprovedCount,
    int PaidCount);

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

public record CreateSvcTicketRequest(
    long AccountId,
    string? DeviceName,
    string ProblemDescription,
    string? TechnicianName,
    string Priority);

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

public record ModuleSettingDto(string ModuleCode, string SettingKey, string SettingValue, string DataType);

public record UpdateModuleSettingsRequest(IReadOnlyList<ModuleSettingDto> Settings);
