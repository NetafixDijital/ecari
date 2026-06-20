namespace ECari.Domain.Entities.Tenant;

public class CfgCompanyProfile
{
    public long Id { get; set; }
    public string LegalName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string TaxNumber { get; set; } = string.Empty;
    public string TaxOffice { get; set; } = string.Empty;
    public string? Address { get; set; }
    public long? CityId { get; set; }
    public long? DistrictId { get; set; }
    public string CountryCode { get; set; } = "TR";
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public long DefaultCurrencyId { get; set; }
    public byte FiscalYearStartMonth { get; set; } = 1;
    public bool IsEinvoiceUser { get; set; }
    public bool IsEarchiveUser { get; set; }
    public bool IsEwaybillUser { get; set; }
    public string? EinvoiceAlias { get; set; }
    public string? EwaybillAlias { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

public class StkWarehouse
{
    public long Id { get; set; }
    public long BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
}
