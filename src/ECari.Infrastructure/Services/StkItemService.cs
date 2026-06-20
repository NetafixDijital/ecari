using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class StkItemService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<StkItemListItemDto>> ListAsync(
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.StkItems.AsNoTracking().Where(i => !i.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i =>
                i.Name.Contains(term) ||
                i.Code.Contains(term) ||
                (i.Barcode != null && i.Barcode.Contains(term)) ||
                (i.BrandName != null && i.BrandName.Contains(term)));
        }

        var items = await query.OrderBy(i => i.Name).ToListAsync(ct);
        var itemIds = items.Select(i => i.Id).ToList();
        var stockMap = await GetStockQuantitiesAsync(db, itemIds, ct);

        var unitIds = items.Select(i => i.BaseUnitId).Distinct().ToList();
        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => unitIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        return items.Select(i =>
        {
            var qty = stockMap.TryGetValue(i.Id, out var q) ? q : 0m;
            return new StkItemListItemDto(
                i.Id,
                i.Code,
                i.Barcode,
                i.Name,
                i.ItemType,
                i.BrandName,
                unitMap.TryGetValue(i.BaseUnitId, out var unitName) ? unitName : "—",
                i.PurchasePrice,
                i.SalesPrice,
                qty,
                ResolveStockStatus(i.IsActive, qty, i.MinStockLevel),
                i.IsActive);
        }).ToList();
    }

    public async Task<StkItemDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var item = await db.StkItems.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct);

        if (item is null)
            return null;

        var stock = await GetStockQuantityAsync(db, item.Id, ct);
        var userNames = await AuditHelper.LoadUserNamesAsync(db, [item.CreatedBy, item.UpdatedBy], ct);
        return MapDetail(item, stock, AuditHelper.BuildAudit(
            item.CreatedAt, item.CreatedBy, item.UpdatedAt, item.UpdatedBy, userNames));
    }

    public async Task<StkItemDetailDto?> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
    {
        var db = Db;
        var item = await db.StkItems.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Barcode == barcode && !i.IsDeleted, ct);

        if (item is null)
            return null;

        var stock = await GetStockQuantityAsync(db, item.Id, ct);
        var userNames = await AuditHelper.LoadUserNamesAsync(db, [item.CreatedBy, item.UpdatedBy], ct);
        return MapDetail(item, stock, AuditHelper.BuildAudit(
            item.CreatedAt, item.CreatedBy, item.UpdatedAt, item.UpdatedBy, userNames));
    }

    public async Task<StkItemDetailDto> CreateAsync(
        CreateStkItemRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Ürün adı zorunludur.");

        var db = Db;
        var currencyId = await db.Currencies.AsNoTracking()
            .Where(c => c.IsActive && c.Code == "TRY")
            .Select(c => c.Id)
            .FirstOrDefaultAsync(ct);

        if (currencyId == 0)
            currencyId = await db.Currencies.AsNoTracking().Select(c => c.Id).FirstAsync(ct);

        var baseUnitId = request.BaseUnitId ?? await db.StkUnits.AsNoTracking()
            .Where(u => u.Code == "ADET")
            .Select(u => u.Id)
            .FirstAsync(ct);

        var taxRateId = request.TaxRateId ?? await db.TaxRates.AsNoTracking()
            .Where(t => t.Code == "KDV20")
            .Select(t => t.Id)
            .FirstAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.Barcode))
        {
            var exists = await db.StkItems.AnyAsync(
                i => i.Barcode == request.Barcode && !i.IsDeleted, ct);
            if (exists)
                throw new ArgumentException("Bu barkod zaten kayıtlı.");
        }

        var item = new StkItem
        {
            Code = await GenerateNextCodeAsync(db, ct),
            Name = request.Name.Trim(),
            Barcode = request.Barcode?.Trim(),
            BrandName = request.BrandName?.Trim(),
            ItemType = request.ItemType,
            BaseUnitId = baseUnitId,
            TaxRateId = taxRateId,
            CurrencyId = currencyId,
            PurchasePrice = request.PurchasePrice,
            SalesPrice = request.SalesPrice,
            ShelfNo = request.ShelfNo,
            IsWeighable = request.IsWeighable,
            Description = request.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = tenant.GetOrgUserId()
        };

        db.StkItems.Add(item);
        await db.SaveChangesAsync(ct);

        return MapDetail(item, 0m);
    }

    public async Task<StkItemDetailDto?> UpdateAsync(
        long id,
        UpdateStkItemRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var item = await db.StkItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct);
        if (item is null)
            return null;

        if (!string.IsNullOrWhiteSpace(request.Barcode) && request.Barcode != item.Barcode)
        {
            var exists = await db.StkItems.AnyAsync(
                i => i.Barcode == request.Barcode && i.Id != id && !i.IsDeleted, ct);
            if (exists)
                throw new ArgumentException("Bu barkod zaten kayıtlı.");
        }

        item.Name = request.Name.Trim();
        item.Barcode = request.Barcode?.Trim();
        item.BrandName = request.BrandName?.Trim();
        item.PurchasePrice = request.PurchasePrice;
        item.SalesPrice = request.SalesPrice;
        if (request.TaxRateId.HasValue)
            item.TaxRateId = request.TaxRateId.Value;
        item.ShelfNo = request.ShelfNo;
        item.IsWeighable = request.IsWeighable;
        item.Description = request.Description;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = tenant.GetOrgUserId();

        await db.SaveChangesAsync(ct);

        var stock = await GetStockQuantityAsync(db, item.Id, ct);
        return MapDetail(item, stock);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var item = await db.StkItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct);
        if (item is null)
            return false;

        var hasMovements = await db.StkStockMovements.AnyAsync(m => m.ItemId == id && !m.IsDeleted, ct);
        if (hasMovements)
            throw new InvalidOperationException("Stok hareketi olan kart silinemez.");

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        item.DeletedBy = tenant.GetOrgUserId();
        item.IsActive = false;

        await db.SaveChangesAsync(ct);
        return true;
    }

    private static StkItemDetailDto MapDetail(StkItem item, decimal stock, AuditInfoDto? audit = null) =>
        new(
            item.Id,
            item.Code,
            item.Barcode,
            item.Name,
            item.ShortName,
            item.ItemType,
            item.TrackingType,
            item.CategoryId,
            item.BrandId,
            item.BrandName,
            item.BaseUnitId,
            item.TaxRateId,
            item.PurchasePrice,
            item.SalesPrice,
            item.CurrencyId,
            item.MinStockLevel,
            item.ShelfNo,
            item.IsWeighable,
            item.GtipCode,
            item.Description,
            stock,
            item.IsActive,
            audit);

    private static async Task<Dictionary<long, decimal>> GetStockQuantitiesAsync(
        TenantDbContext db,
        IReadOnlyList<long> itemIds,
        CancellationToken ct)
    {
        if (itemIds.Count == 0)
            return new Dictionary<long, decimal>();

        return await db.StkStockBalances.AsNoTracking()
            .Where(b => itemIds.Contains(b.ItemId))
            .GroupBy(b => b.ItemId)
            .Select(g => new { ItemId = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Qty, ct);
    }

    private static async Task<decimal> GetStockQuantityAsync(
        TenantDbContext db,
        long itemId,
        CancellationToken ct) =>
        await db.StkStockBalances.AsNoTracking()
            .Where(b => b.ItemId == itemId)
            .SumAsync(b => b.Quantity, ct);

    private static string ResolveStockStatus(bool isActive, decimal quantity, decimal? minStockLevel)
    {
        if (!isActive)
            return "pasif";
        if (minStockLevel.HasValue && quantity <= minStockLevel.Value)
            return "kritik";
        return "aktif";
    }

    private static async Task<string> GenerateNextCodeAsync(TenantDbContext db, CancellationToken ct)
    {
        var lastCode = await db.StkItems.AsNoTracking()
            .Where(i => i.Code.StartsWith("S"))
            .OrderByDescending(i => i.Code)
            .Select(i => i.Code)
            .FirstOrDefaultAsync(ct);

        if (lastCode is null || lastCode.Length < 2 || !int.TryParse(lastCode[1..], out var number))
            return "S00001";

        return $"S{(number + 1):D5}";
    }
}
