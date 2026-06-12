namespace ECari.Domain.Entities.Tenant;

public class CariMovement
{
    public long Id { get; set; }
    public long AccountId { get; set; }
    public DateOnly MovementDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public long CurrencyId { get; set; }
    public decimal ExchangeRate { get; set; } = 1m;
    public decimal? AmountForeign { get; set; }
    public string? DocumentModule { get; set; }
    public long? DocumentId { get; set; }
    public string? DocumentNo { get; set; }
    public string? Description { get; set; }
    public long? FiscalPeriodId { get; set; }
    public bool IsReconciled { get; set; }
    public DateTime? ReconciledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public CariAccount Account { get; set; } = null!;
}
