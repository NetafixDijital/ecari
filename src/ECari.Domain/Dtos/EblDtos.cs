namespace ECari.Domain.Dtos;

public record EblIntegratorDto(
    long Id,
    string Code,
    string Name,
    string ApiBaseUrl,
    string? ApiEwaybillUrl,
    bool IsActive);

public record EblCredentialDto(
    long Id,
    long IntegratorId,
    string IntegratorCode,
    string Username,
    string Environment,
    long? BranchId,
    string? InvoiceSerialPrefix,
    bool IsActive,
    bool HasPassword);

public record SaveEblCredentialRequest(
    long IntegratorId,
    string Username,
    string? Password,
    string Environment,
    long? BranchId,
    string? InvoiceSerialPrefix,
    bool IsActive);

public record EblGibCheckResultDto(
    bool IsEinvoiceUser,
    string? Alias,
    string? Title,
    string Message,
    DateTime CheckedAt);

public record EblEinvoiceRecordDto(
    long Id,
    long InvoiceId,
    string Uuid,
    string Status,
    string? StatusMessage,
    string? ProfileId,
    DateTime? SentAt,
    DateTime? ResponseAt);

public record EblEwaybillRecordDto(
    long Id,
    long DeliveryNoteId,
    string Uuid,
    string Status,
    string? StatusMessage,
    DateTime? SentAt,
    DateTime? ResponseAt);

public record EblSendResultDto(
    bool Success,
    string Uuid,
    string Status,
    string Message);
