namespace ECari.Domain.Dtos;

public record BnkAccountListItemDto(
    long Id,
    string Code,
    string BankName,
    string AccountName,
    string Iban,
    decimal Balance,
    bool IsActive);

public record BnkTransactionListItemDto(
    long Id,
    long BankAccountId,
    string BankAccountName,
    DateOnly TransactionDate,
    string TransactionType,
    string TransactionTypeLabel,
    string? CariTitle,
    decimal Amount,
    string? ReferenceNo,
    string? Description);

public record BnkPaymentRequest(
    long BankAccountId,
    long AccountId,
    decimal Amount,
    DateOnly TransactionDate,
    string? Description);
