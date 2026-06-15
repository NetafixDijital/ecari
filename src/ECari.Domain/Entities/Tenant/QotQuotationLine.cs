namespace ECari.Domain.Entities.Tenant;

public class QotQuotationLine
{
    public long Id { get; set; }
    public long QuotationId { get; set; }
    public int LineNo { get; set; }
    public long? ItemId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1m;
    public long UnitId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountRate { get; set; }
    public long TaxRateId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public long? WarehouseId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public QotQuotation Quotation { get; set; } = null!;
}
