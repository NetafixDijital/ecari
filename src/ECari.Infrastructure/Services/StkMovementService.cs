using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class StkMovementService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<StkStockMovementListItemDto> CreateManualAsync(
        CreateStkManualMovementRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var movementType = request.MovementType.Trim().ToUpperInvariant() switch
        {
            "IN" or "GIRIS" => "IN",
            "OUT" or "CIKIS" => "OUT",
            "ADJUSTMENT" or "DUZELTME" => "ADJUSTMENT",
            _ => throw new InvalidOperationException("Geçerli hareket tipi: IN, OUT veya ADJUSTMENT"),
        };

        if (request.Quantity <= 0 && movementType != "ADJUSTMENT")
            throw new InvalidOperationException("Miktar sıfırdan büyük olmalı.");
        if (movementType == "ADJUSTMENT" && request.Quantity == 0)
            throw new InvalidOperationException("Düzeltme miktarı sıfır olamaz.");

        var item = await db.StkItems.FirstOrDefaultAsync(i => i.Id == request.ItemId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Stok kartı bulunamadı.");

        var warehouse = await db.Warehouses.FirstOrDefaultAsync(
            w => w.Id == request.WarehouseId && !w.IsDeleted && w.IsActive, ct)
            ?? throw new InvalidOperationException("Depo bulunamadı.");

        var movementDate = (request.MovementDate ?? DateOnly.FromDateTime(DateTime.UtcNow))
            .ToDateTime(TimeOnly.MinValue);

        decimal delta = movementType switch
        {
            "IN" => request.Quantity,
            "OUT" => -request.Quantity,
            "ADJUSTMENT" => request.Quantity,
            _ => request.Quantity,
        };

        if (movementType == "OUT")
        {
            var currentQty = await db.StkStockBalances.AsNoTracking()
                .Where(b => b.ItemId == item.Id && b.WarehouseId == warehouse.Id)
                .Select(b => b.Quantity)
                .FirstOrDefaultAsync(ct);
            if (currentQty < request.Quantity)
                throw new InvalidOperationException("Yetersiz stok miktarı.");
        }

        var movement = new StkStockMovement
        {
            ItemId = item.Id,
            WarehouseId = warehouse.Id,
            MovementDate = movementDate,
            MovementType = movementType,
            Quantity = Math.Abs(request.Quantity),
            UnitId = item.BaseUnitId,
            UnitPrice = item.PurchasePrice,
            DocumentModule = "MANUAL",
            Description = request.Description?.Trim() ?? ResolveDefaultDescription(movementType),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = tenant.GetOrgUserId(),
        };

        db.StkStockMovements.Add(movement);
        await db.SaveChangesAsync(ct);

        await StkStockPostingService.ApplyManualBalanceAsync(db, item.Id, warehouse.Id, delta, ct);
        await db.SaveChangesAsync(ct);

        var unitName = await db.StkUnits.AsNoTracking()
            .Where(u => u.Id == item.BaseUnitId)
            .Select(u => u.Name)
            .FirstOrDefaultAsync(ct) ?? "—";

        return new StkStockMovementListItemDto(
            movement.Id,
            item.Code,
            item.Name,
            warehouse.Name,
            movement.MovementDate,
            movement.MovementType,
            MapMovementTypeLabel(movement.MovementType),
            movement.Quantity,
            unitName,
            movement.Description);
    }

    public async Task<IReadOnlyList<StkStockMovementListItemDto>> ListAsync(
        long? warehouseId,
        long? itemId,
        string? search,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? movementType,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.StkStockMovements.AsNoTracking()
            .Include(m => m.Item)
            .Include(m => m.Warehouse)
            .Include(m => m.Unit)
            .Where(m => !m.IsDeleted);

        if (warehouseId.HasValue)
            query = query.Where(m => m.WarehouseId == warehouseId.Value);

        if (itemId.HasValue)
            query = query.Where(m => m.ItemId == itemId.Value);

        if (dateFrom.HasValue)
        {
            var from = dateFrom.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(m => m.MovementDate >= from);
        }

        if (dateTo.HasValue)
        {
            var to = dateTo.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(m => m.MovementDate <= to);
        }

        if (!string.IsNullOrWhiteSpace(movementType))
        {
            var type = movementType.Trim().ToUpperInvariant();
            query = query.Where(m => m.MovementType == type);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(m =>
                m.Item.Name.Contains(term) ||
                m.Item.Code.Contains(term) ||
                (m.Description != null && m.Description.Contains(term)));
        }

        var items = await query
            .OrderByDescending(m => m.MovementDate)
            .ThenByDescending(m => m.Id)
            .Take(2000)
            .ToListAsync(ct);

        return items.Select(m => new StkStockMovementListItemDto(
            m.Id,
            m.Item.Code,
            m.Item.Name,
            m.Warehouse.Name,
            m.MovementDate,
            m.MovementType,
            MapMovementTypeLabel(m.MovementType),
            m.Quantity,
            m.Unit.Name,
            m.Description)).ToList();
    }

    private static string MapMovementTypeLabel(string type) => type switch
    {
        "IN" => "Giriş",
        "OUT" => "Çıkış",
        "TRANSFER" => "Transfer",
        "ADJUSTMENT" => "Düzeltme",
        "OPENING" => "Açılış",
        _ => type,
    };

    private static string ResolveDefaultDescription(string movementType) => movementType switch
    {
        "IN" => "Manuel stok girişi",
        "OUT" => "Manuel stok çıkışı",
        "ADJUSTMENT" => "Manuel stok düzeltme",
        _ => "Manuel stok hareketi",
    };
}
