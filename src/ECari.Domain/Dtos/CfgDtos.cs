namespace ECari.Domain.Dtos;

public record CompanyProfileDto(
    long Id,
    string LegalName,
    string? TradeName,
    string TaxNumber,
    string TaxOffice,
    string? Address,
    long? CityId,
    long? DistrictId,
    string? Phone,
    string? Email,
    string? Website,
    long DefaultCurrencyId,
    byte FiscalYearStartMonth,
    bool IsEinvoiceUser,
    bool IsEarchiveUser,
    bool IsEwaybillUser);

public record UpdateCompanyProfileRequest(
    string LegalName,
    string? TradeName,
    string TaxNumber,
    string TaxOffice,
    string? Address,
    long? CityId,
    long? DistrictId,
    string? Phone,
    string? Email,
    string? Website,
    long DefaultCurrencyId,
    byte FiscalYearStartMonth,
    bool IsEinvoiceUser,
    bool IsEarchiveUser,
    bool IsEwaybillUser);

public record WarehouseDto(
    long Id,
    long BranchId,
    string Code,
    string Name,
    string? Address,
    bool IsDefault,
    bool IsActive);
