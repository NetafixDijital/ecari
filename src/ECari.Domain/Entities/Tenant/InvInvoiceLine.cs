namespace ECari.Domain.Entities.Tenant;

public class InvInvoiceLine
{
    public long Id { get; set; }
    public long InvoiceId { get; set; }
    public int LineNo { get; set; }
    public string LineType { get; set; } = "URUN";
    public long? ItemId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1m;
    public long UnitId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public long TaxRateId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public InvInvoice Invoice { get; set; } = null!;
}
