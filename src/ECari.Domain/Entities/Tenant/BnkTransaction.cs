namespace ECari.Domain.Entities.Tenant;

public class BnkTransaction
{
    public long Id { get; set; }
    public long BankAccountId { get; set; }
    public DateOnly TransactionDate { get; set; }
    public DateOnly? ValueDate { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public long? AccountId { get; set; }
    public decimal Amount { get; set; }
    public long CurrencyId { get; set; }
    public decimal ExchangeRate { get; set; } = 1m;
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
    public bool IsReconciled { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public BnkAccount BankAccount { get; set; } = null!;
    public CariAccount? Account { get; set; }
}
