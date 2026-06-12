namespace ECari.Domain.Entities.Tenant;

public class StkItem
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string ItemType { get; set; } = "PRODUCT";
    public string TrackingType { get; set; } = "TAKIPSIZ";
    public long? CategoryId { get; set; }
    public long? BrandId { get; set; }
    public string? BrandName { get; set; }
    public long BaseUnitId { get; set; }
    public long TaxRateId { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? SalesPrice { get; set; }
    public long CurrencyId { get; set; }
    public decimal? MinStockLevel { get; set; }
    public string? ShelfNo { get; set; }
    public bool IsWeighable { get; set; }
    public string? GtipCode { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

public class StkUnit
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class CoreTaxRate
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class StkStockBalance
{
    public long Id { get; set; }
    public long ItemId { get; set; }
    public long WarehouseId { get; set; }
    public decimal Quantity { get; set; }
    public decimal ReservedQuantity { get; set; }
}
