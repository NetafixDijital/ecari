namespace ECari.Domain.Dtos;

public record AuditInfoDto(
    DateTime CreatedAt,
    string? CreatedByName,
    DateTime? UpdatedAt,
    string? UpdatedByName);
