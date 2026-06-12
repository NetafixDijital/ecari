namespace ECari.Domain.Dtos;

public record CariAccountListItemDto(
    long Id,
    string Code,
    string Title,
    string AccountType,
    string PersonType,
    string? TaxNumber,
    string? IdentityNumber,
    string? Phone,
    string? Email,
    decimal Balance,
    string BalanceSide,
    bool IsActive);

public record CariAccountDetailDto(
    long Id,
    string Code,
    string AccountType,
    string Title,
    string PersonType,
    string? AddressLine,
    long? CityId,
    long? DistrictId,
    string CountryCode,
    string? PostalCode,
    long? PaymentTermId,
    int? DueDays,
    string? TaxNumber,
    string? IdentityNumber,
    string? TaxOffice,
    string? Phone,
    string? Email,
    decimal Balance,
    bool IsActive);

public record CreateCariAccountRequest(
    string PersonType,
    string Title,
    string? TaxNumber,
    string? IdentityNumber,
    string? TaxOffice,
    string? Email,
    string? Phone,
    string? AddressLine,
    long? CityId,
    long? DistrictId,
    string? CountryCode,
    string? PostalCode,
    long? PaymentTermId,
    int? DueDays,
    string AccountType = "CUSTOMER");

public record UpdateCariAccountRequest(
    string Title,
    string? TaxNumber,
    string? IdentityNumber,
    string? TaxOffice,
    string? Email,
    string? Phone,
    string? AddressLine,
    long? CityId,
    long? DistrictId,
    string? CountryCode,
    string? PostalCode,
    long? PaymentTermId,
    int? DueDays,
    bool IsActive);

public record CariCollectionRequest(
    long AccountId,
    string PaymentMethod,
    decimal Amount,
    DateOnly TransactionDate,
    string? Description,
    long? CashAccountId,
    long? BankAccountId,
    string? CheckInstrumentNo,
    string? CheckBankName,
    DateOnly? CheckDueDate);

public record CariTransferRequest(
    long SourceAccountId,
    long TargetAccountId,
    decimal Amount,
    DateOnly TransferDate,
    string? Description);

public record CariMovementListItemDto(
    long Id,
    long AccountId,
    string AccountCode,
    string AccountTitle,
    DateOnly MovementDate,
    string MovementType,
    string MovementTypeLabel,
    string? DocumentNo,
    string? Description,
    decimal Debit,
    decimal Credit,
    decimal RunningBalance);
