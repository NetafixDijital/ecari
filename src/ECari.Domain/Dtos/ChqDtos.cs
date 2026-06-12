namespace ECari.Domain.Dtos;

public record ChqInstrumentListItemDto(
    long Id,
    string InstrumentType,
    string Direction,
    string InstrumentNo,
    string AccountTitle,
    string? BankName,
    DateOnly IssueDate,
    DateOnly DueDate,
    decimal Amount,
    string StatusKey,
    string StatusLabel);

public record ChqInstrumentStatsDto(
    int TotalCount,
    decimal TotalAmount,
    int PendingCount,
    decimal PendingAmount,
    int CompletedCount,
    decimal CompletedAmount);

public record CreateChqInstrumentRequest(
    string InstrumentType,
    string Direction,
    long AccountId,
    string? BankName,
    string InstrumentNo,
    DateOnly IssueDate,
    DateOnly DueDate,
    decimal Amount,
    string? Notes);
