using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public static class StkStockPostingService
{
    public static string ResolveMovementType(string invoiceType) => invoiceType switch
    {
        "SALES" or "PURCHASE_RETURN" => "OUT",
        "PURCHASE" or "SALES_RETURN" => "IN",
        _ => throw new InvalidOperationException($"Stok hareketi desteklenmeyen fatura tipi: {invoiceType}"),
    };

    public static async Task<long> ResolveDefaultWarehouseIdAsync(TenantDbContext db, CancellationToken ct) =>
        await db.Warehouses.AsNoTracking()
            .Where(w => !w.IsDeleted)
            .OrderByDescending(w => w.IsDefault)
            .ThenBy(w => w.Id)
            .Select(w => w.Id)
            .FirstOrDefaultAsync(ct);

    public static async Task PostForInvoiceAsync(
        TenantDbContext db,
        InvInvoice invoice,
        IReadOnlyList<InvInvoiceLine> lines,
        long warehouseId,
        CancellationToken ct)
    {
        var movementType = ResolveMovementType(invoice.InvoiceType);
        var isInbound = movementType == "IN";
        var movementDate = invoice.DocumentDate.ToDateTime(TimeOnly.MinValue);
        var description = ResolveDescription(invoice.InvoiceType, invoice.DocumentNo);

        foreach (var line in lines.Where(l => l.ItemId.HasValue))
        {
            db.StkStockMovements.Add(new StkStockMovement
            {
                ItemId = line.ItemId!.Value,
                WarehouseId = warehouseId,
                MovementDate = movementDate,
                MovementType = movementType,
                Quantity = line.Quantity,
                UnitId = line.UnitId,
                UnitPrice = line.UnitPrice,
                DocumentModule = "INV",
                DocumentId = invoice.Id,
                DocumentLineId = line.Id,
                Description = description,
                CreatedAt = DateTime.UtcNow,
            });

            await ApplyBalanceAsync(
                db,
                line.ItemId!.Value,
                warehouseId,
                isInbound ? line.Quantity : -line.Quantity,
                ct);
        }
    }

    public static async Task ReverseForInvoiceAsync(
        TenantDbContext db,
        long invoiceId,
        CancellationToken ct)
    {
        var movements = await db.StkStockMovements
            .Where(m => !m.IsDeleted && m.DocumentModule == "INV" && m.DocumentId == invoiceId)
            .ToListAsync(ct);

        foreach (var movement in movements)
        {
            var delta = movement.MovementType == "IN" ? -movement.Quantity : movement.Quantity;
            await ApplyBalanceAsync(db, movement.ItemId, movement.WarehouseId, delta, ct);
            movement.IsDeleted = true;
        }
    }

    private static async Task ApplyBalanceAsync(
        TenantDbContext db,
        long itemId,
        long warehouseId,
        decimal delta,
        CancellationToken ct)
    {
        var balance = await db.StkStockBalances
            .FirstOrDefaultAsync(b => b.ItemId == itemId && b.WarehouseId == warehouseId, ct);

        if (balance is null)
        {
            db.StkStockBalances.Add(new StkStockBalance
            {
                ItemId = itemId,
                WarehouseId = warehouseId,
                Quantity = delta,
                ReservedQuantity = 0,
            });
            return;
        }

        balance.Quantity += delta;
    }

    private static string ResolveDescription(string invoiceType, string documentNo) => invoiceType switch
    {
        "SALES" => $"Satış faturası {documentNo}",
        "PURCHASE" => $"Alış faturası {documentNo}",
        "SALES_RETURN" => $"Satıştan iade {documentNo}",
        "PURCHASE_RETURN" => $"Alıştan iade {documentNo}",
        _ => documentNo,
    };
}
