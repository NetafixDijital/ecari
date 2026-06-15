using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class OrdOrderService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    DlnDeliveryNoteService dlnService,
    InvInvoiceService invService)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<OrdOrderListItemDto>> ListAsync(
        string? orderType,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.OrdOrders.AsNoTracking()
            .Include(o => o.Account)
            .Where(o => !o.IsDeleted);

        if (!string.IsNullOrWhiteSpace(orderType))
            query = query.Where(o => o.OrderType == orderType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(o =>
                o.DocumentNo.Contains(term) ||
                o.Account.Title.Contains(term));
        }

        var items = await query
            .OrderByDescending(o => o.DocumentDate)
            .ThenByDescending(o => o.Id)
            .ToListAsync(ct);

        return items.Select(o =>
        {
            var (key, label) = MapStatus(o.Status);
            return new OrdOrderListItemDto(
                o.Id,
                o.DocumentNo,
                o.OrderType,
                o.Account.Title,
                o.DocumentDate,
                o.DeliveryDate,
                o.GrandTotal,
                key,
                label);
        }).ToList();
    }

    public async Task<OrdOrderDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.AsNoTracking()
            .Include(o => o.Account)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct);

        if (order is null) return null;

        var lines = await db.OrdOrderLines.AsNoTracking()
            .Where(l => l.OrderId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => lines.Select(l => l.UnitId).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        var (key, label) = MapStatus(order.Status);

        return new OrdOrderDetailDto(
            order.Id,
            order.DocumentNo,
            order.OrderType,
            order.Account.Id,
            order.Account.Title,
            order.DocumentDate,
            order.DeliveryDate,
            order.Subtotal,
            order.TaxTotal,
            order.GrandTotal,
            key,
            label,
            order.Notes,
            lines.Select(l => new OrdOrderLineDto(
                l.LineNo,
                l.Description,
                unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
                l.Quantity,
                l.UnitPrice,
                l.TaxAmount,
                l.LineTotal)).ToList());
    }

    public async Task<OrdOrderDetailDto> CreateAsync(CreateOrdOrderRequest request, CancellationToken ct = default)
    {
        if (request.Lines.Count == 0)
            throw new InvalidOperationException("En az bir sipariş kalemi gerekli.");

        var orderType = request.OrderType.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            _ => throw new InvalidOperationException("Geçerli sipariş tipi: SALES veya PURCHASE"),
        };

        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var taxRates = await db.TaxRates.AsNoTracking()
            .Where(t => t.IsActive)
            .ToDictionaryAsync(t => t.Id, ct);

        long? warehouseId = request.WarehouseId;
        if (warehouseId.HasValue)
        {
            var whExists = await db.Warehouses.AsNoTracking()
                .AnyAsync(w => w.Id == warehouseId.Value && !w.IsDeleted && w.IsActive, ct);
            if (!whExists)
                throw new InvalidOperationException("Depo bulunamadı.");
        }
        else
        {
            warehouseId = await db.Warehouses.AsNoTracking()
                .Where(w => w.IsDefault && !w.IsDeleted && w.IsActive)
                .Select(w => (long?)w.Id)
                .FirstOrDefaultAsync(ct);
        }

        var branchId = await db.Warehouses.AsNoTracking()
            .Where(w => w.Id == warehouseId)
            .Select(w => (long?)w.BranchId)
            .FirstOrDefaultAsync(ct);

        var lineEntities = new List<OrdOrderLine>();
        decimal subtotal = 0;
        decimal taxTotal = 0;
        var lineNo = 1;

        foreach (var line in request.Lines)
        {
            if (string.IsNullOrWhiteSpace(line.Description))
                throw new InvalidOperationException($"Satır {lineNo}: açıklama zorunlu.");
            if (line.Quantity <= 0)
                throw new InvalidOperationException($"Satır {lineNo}: miktar sıfırdan büyük olmalı.");
            if (!taxRates.TryGetValue(line.TaxRateId, out var taxRate))
                throw new InvalidOperationException($"Satır {lineNo}: geçersiz KDV oranı.");

            var net = Math.Round(line.Quantity * line.UnitPrice, 2, MidpointRounding.AwayFromZero);
            var taxAmount = Math.Round(net * taxRate.Rate / 100m, 2, MidpointRounding.AwayFromZero);
            var lineTotal = net + taxAmount;

            lineEntities.Add(new OrdOrderLine
            {
                LineNo = lineNo++,
                ItemId = line.ItemId,
                Description = line.Description.Trim(),
                Quantity = line.Quantity,
                UnitId = line.UnitId,
                UnitPrice = line.UnitPrice,
                TaxRateId = line.TaxRateId,
                TaxAmount = taxAmount,
                LineTotal = lineTotal,
                WarehouseId = warehouseId,
                CreatedAt = DateTime.UtcNow,
            });

            subtotal += net;
            taxTotal += taxAmount;
        }

        var documentNo = await GenerateDocumentNoAsync(db, orderType, request.DocumentDate, ct);

        var order = new OrdOrder
        {
            DocumentNo = documentNo,
            DocumentDate = request.DocumentDate,
            OrderType = orderType,
            Status = "APPROVED",
            AccountId = account.Id,
            BranchId = branchId,
            WarehouseId = warehouseId,
            CurrencyId = account.CurrencyId,
            DeliveryDate = request.DeliveryDate,
            Subtotal = subtotal,
            TaxTotal = taxTotal,
            GrandTotal = subtotal + taxTotal,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        db.OrdOrders.Add(order);
        await db.SaveChangesAsync(ct);

        foreach (var line in lineEntities)
            line.OrderId = order.Id;

        db.OrdOrderLines.AddRange(lineEntities);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return (await GetByIdAsync(order.Id, ct))!;
    }

    public async Task<ConvertOrdToDlnResultDto> ConvertToDeliveryNoteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct)
            ?? throw new InvalidOperationException("Sipariş bulunamadı.");

        if (order.Status == "CANCELLED")
            throw new InvalidOperationException("İptal edilmiş sipariş irsaliyeye dönüştürülemez.");

        var lines = await db.OrdOrderLines
            .Where(l => l.OrderId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var shipLines = lines
            .Where(l => l.Quantity > l.DeliveredQuantity)
            .Select(l => new CreateDlnDeliveryNoteLineRequest(
                l.ItemId,
                l.Description,
                l.Quantity - l.DeliveredQuantity,
                l.UnitId))
            .ToList();

        if (shipLines.Count == 0)
            throw new InvalidOperationException("Sevk edilecek kalem kalmadı.");

        var dln = await dlnService.CreateAsync(new CreateDlnDeliveryNoteRequest(
            order.OrderType,
            order.AccountId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            order.WarehouseId,
            null,
            order.Notes,
            shipLines), ct);

        var dlnLineEntities = await db.DlnDeliveryNoteLines
            .Where(l => l.DeliveryNoteId == dln.Id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var ordLineIdx = 0;
        foreach (var dlnLine in dlnLineEntities)
        {
            while (ordLineIdx < lines.Count && lines[ordLineIdx].Quantity <= lines[ordLineIdx].DeliveredQuantity)
                ordLineIdx++;

            if (ordLineIdx >= lines.Count) break;

            var ordLine = lines[ordLineIdx];
            dlnLine.SourceLineId = ordLine.Id;
            ordLine.DeliveredQuantity += dlnLine.Quantity;
            ordLineIdx++;
        }

        var allDelivered = lines.All(l => l.DeliveredQuantity >= l.Quantity);
        order.Status = allDelivered ? "COMPLETED" : "PARTIAL";
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new ConvertOrdToDlnResultDto(order.Id, dln.Id, dln.DocumentNo);
    }

    public async Task<ConvertOrdToInvResultDto> ConvertToInvoiceAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct)
            ?? throw new InvalidOperationException("Sipariş bulunamadı.");

        if (order.Status == "CANCELLED")
            throw new InvalidOperationException("İptal edilmiş sipariş faturalandırılamaz.");

        var lines = await db.OrdOrderLines
            .Where(l => l.OrderId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var invLines = lines
            .Where(l => l.Quantity > l.InvoicedQuantity)
            .Select(l => new CreateInvInvoiceLineRequest(
                l.ItemId,
                l.Description,
                l.Quantity - l.InvoicedQuantity,
                l.UnitId,
                l.UnitPrice,
                l.TaxRateId))
            .ToList();

        if (invLines.Count == 0)
            throw new InvalidOperationException("Faturalanacak kalem kalmadı.");

        var invoiceType = order.OrderType == "PURCHASE" ? "PURCHASE" : "SALES";
        var invoice = await invService.CreateAsync(new CreateInvInvoiceRequest(
            invoiceType,
            order.AccountId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            order.DeliveryDate,
            order.Notes,
            invLines,
            "BEKLIYOR"), ct);

        foreach (var line in lines.Where(l => l.Quantity > l.InvoicedQuantity))
            line.InvoicedQuantity = line.Quantity;

        var allInvoiced = lines.All(l => l.InvoicedQuantity >= l.Quantity);
        if (allInvoiced && order.Status != "CANCELLED")
            order.Status = "COMPLETED";

        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new ConvertOrdToInvResultDto(order.Id, invoice.Id, invoice.DocumentNo);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct);
        if (order is null) return false;

        if (order.Status is "PARTIAL" or "COMPLETED")
            throw new InvalidOperationException("Sevk veya fatura oluşmuş sipariş silinemez.");

        order.IsDeleted = true;
        order.Status = "CANCELLED";
        order.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static async Task<string> GenerateDocumentNoAsync(
        TenantDbContext db,
        string orderType,
        DateOnly documentDate,
        CancellationToken ct)
    {
        var prefix = orderType == "SALES" ? "SS" : "AS";
        var year = documentDate.Year;
        var pattern = $"{prefix}-{year}-";

        var lastNo = await db.OrdOrders.AsNoTracking()
            .Where(o => !o.IsDeleted && o.DocumentNo.StartsWith(pattern))
            .OrderByDescending(o => o.DocumentNo)
            .Select(o => o.DocumentNo)
            .FirstOrDefaultAsync(ct);

        var seq = 1;
        if (lastNo is not null)
        {
            var parts = lastNo.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var parsed))
                seq = parsed + 1;
        }

        return $"{prefix}-{year}-{seq:D4}";
    }

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "DRAFT" => ("taslak", "Taslak"),
        "APPROVED" => ("onayli", "Onaylı"),
        "PARTIAL" => ("kismi", "Kısmi Sevk"),
        "COMPLETED" => ("tamamlandi", "Tamamlandı"),
        "CANCELLED" => ("iptal", "İptal"),
        _ => ("onayli", status),
    };
}
