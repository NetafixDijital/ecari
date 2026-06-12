namespace ECari.Domain.Dtos;

public record CshAccountListItemDto(
    long Id,
    string Code,
    string Name,
    string CashType,
    decimal Balance,
    bool IsActive);

public record CshPaymentRequest(
    long AccountId,
    long CashAccountId,
    decimal Amount,
    DateOnly TransactionDate,
    string? Description);
