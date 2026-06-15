namespace ECari.Domain.Entities.Tenant;

public class QotQuotation
{
    public long Id { get; set; }
    public string DocumentNo { get; set; } = string.Empty;
    public DateOnly DocumentDate { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string Status { get; set; } = "DRAFT";
    public long AccountId { get; set; }
    public long? BranchId { get; set; }
    public long? WarehouseId { get; set; }
    public long CurrencyId { get; set; }
    public decimal ExchangeRate { get; set; } = 1m;
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public int RevisionNo { get; set; } = 1;
    public long? ParentQuotationId { get; set; }
    public decimal? Probability { get; set; }
    public long? ConvertedOrderId { get; set; }
    public DateTime? ConvertedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public CariAccount Account { get; set; } = null!;
}
