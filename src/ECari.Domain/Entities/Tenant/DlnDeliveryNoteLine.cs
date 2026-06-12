namespace ECari.Domain.Entities.Tenant;

public class DlnDeliveryNoteLine
{
    public long Id { get; set; }
    public long DeliveryNoteId { get; set; }
    public int LineNo { get; set; }
    public long? ItemId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1m;
    public long UnitId { get; set; }
    public long? WarehouseId { get; set; }
    public string? LotNo { get; set; }
    public string? SerialNo { get; set; }
    public long? SourceLineId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public DlnDeliveryNote DeliveryNote { get; set; } = null!;
}
