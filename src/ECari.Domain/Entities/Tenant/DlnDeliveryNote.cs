namespace ECari.Domain.Entities.Tenant;

public class DlnDeliveryNote
{
    public long Id { get; set; }
    public string DocumentNo { get; set; } = string.Empty;
    public DateOnly DocumentDate { get; set; }
    public DateTime? ShipmentDate { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string Status { get; set; } = "PREPARING";
    public long AccountId { get; set; }
    public long? BranchId { get; set; }
    public long? WarehouseId { get; set; }
    public string? ShippingAddress { get; set; }
    public string? DriverName { get; set; }
    public string? VehiclePlate { get; set; }
    public string? TransportType { get; set; }
    public string? CarrierName { get; set; }
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
