namespace ECari.Domain.Entities.Tenant;

public class CariAccount
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string AccountType { get; set; } = "CUSTOMER";
    public string Title { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string PersonType { get; set; } = "TUZEL_KISI";
    public string? AddressLine { get; set; }
    public long? CityId { get; set; }
    public long? DistrictId { get; set; }
    public string CountryCode { get; set; } = "TR";
    public string? PostalCode { get; set; }
    public long? PaymentTermId { get; set; }
    public int? DueDays { get; set; }
    public string? TaxNumber { get; set; }
    public string? IdentityNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public long CurrencyId { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

public class CariAccountBalanceView
{
    public long AccountId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal Balance { get; set; }
}

public class CoreCurrency
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
