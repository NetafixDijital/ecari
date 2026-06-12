namespace ECari.Domain.Entities.Tenant;

public class StkStockMovement
{
    public long Id { get; set; }
    public long ItemId { get; set; }
    public long WarehouseId { get; set; }
    public DateTime MovementDate { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public long UnitId { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? DocumentModule { get; set; }
    public long? DocumentId { get; set; }
    public long? DocumentLineId { get; set; }
    public string? LotNo { get; set; }
    public string? SerialNo { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public StkItem Item { get; set; } = null!;
    public StkWarehouse Warehouse { get; set; } = null!;
    public StkUnit Unit { get; set; } = null!;
}
