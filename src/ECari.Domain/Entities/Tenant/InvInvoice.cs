namespace ECari.Domain.Entities.Tenant;

public class InvInvoice
{
    public long Id { get; set; }
    public string DocumentNo { get; set; } = string.Empty;
    public DateOnly DocumentDate { get; set; }
    public TimeOnly? DocumentTime { get; set; }
    public string InvoiceType { get; set; } = string.Empty;
    public string? InvoiceScenario { get; set; }
    public string Status { get; set; } = "APPROVED";
    public long AccountId { get; set; }
    public long? BranchId { get; set; }
    public long? WarehouseId { get; set; }
    public long CurrencyId { get; set; }
    public decimal ExchangeRate { get; set; } = 1m;
    public DateOnly? DueDate { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public string? PaymentStatus { get; set; }
    public string? EInvoiceType { get; set; }
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
