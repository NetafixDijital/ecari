namespace ECari.Domain.Dtos;

public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string AccessToken,
    int ExpiresIn,
    UserSummaryDto User);

public record UserSummaryDto(long Id, string FullName, string Email);

public record CompanyDto(
    long Id,
    string Code,
    string Name,
    string DatabaseName,
    bool IsDefault);

public record SelectCompanyRequest(long CompanyId);

public record SelectCompanyResponse(
    string AccessToken,
    int ExpiresIn,
    long CompanyId,
    string CompanyCode,
    string DatabaseName,
    long OrgUserId);
