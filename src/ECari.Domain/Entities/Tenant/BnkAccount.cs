namespace ECari.Domain.Entities.Tenant;

public class BnkAccount
{
    public long Id { get; set; }
    public long BankId { get; set; }
    public long BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string? AccountNo { get; set; }
    public string Iban { get; set; } = string.Empty;
    public long CurrencyId { get; set; }
    public decimal OpeningBalance { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public BnkBank Bank { get; set; } = null!;
}
