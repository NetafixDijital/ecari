using ECari.Domain.Dtos;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class StkMovementService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

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
        "ADJUSTMENT" => "Sayım",
        "OPENING" => "Açılış",
        _ => type,
    };
}
