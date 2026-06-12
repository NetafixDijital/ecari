namespace ECari.Domain.Dtos;

public record StkItemListItemDto(
    long Id,
    string Code,
    string? Barcode,
    string Name,
    string ItemType,
    string? BrandName,
    string BaseUnitName,
    decimal? PurchasePrice,
    decimal? SalesPrice,
    decimal StockQuantity,
    string StockStatus,
    bool IsActive);

public record StkItemDetailDto(
    long Id,
    string Code,
    string? Barcode,
    string Name,
    string? ShortName,
    string ItemType,
    string TrackingType,
    long? CategoryId,
    long? BrandId,
    string? BrandName,
    long BaseUnitId,
    long TaxRateId,
    decimal? PurchasePrice,
    decimal? SalesPrice,
    long CurrencyId,
    decimal? MinStockLevel,
    string? ShelfNo,
    bool IsWeighable,
    string? GtipCode,
    string? Description,
    decimal StockQuantity,
    bool IsActive);

public record CreateStkItemRequest(
    string Name,
    string? Barcode,
    string? BrandName,
    string ItemType = "PRODUCT",
    decimal? PurchasePrice = null,
    decimal? SalesPrice = null,
    long? TaxRateId = null,
    long? BaseUnitId = null,
    string? ShelfNo = null,
    bool IsWeighable = false,
    string? Description = null);

public record UpdateStkItemRequest(
    string Name,
    string? Barcode,
    string? BrandName,
    decimal? PurchasePrice,
    decimal? SalesPrice,
    long? TaxRateId,
    string? ShelfNo,
    bool IsWeighable,
    string? Description,
    bool IsActive);

public record StkStockMovementListItemDto(
    long Id,
    string ItemCode,
    string ItemName,
    string WarehouseName,
    DateTime MovementDate,
    string MovementType,
    string MovementTypeLabel,
    decimal Quantity,
    string UnitName,
    string? Description);
