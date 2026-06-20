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

        var userNames = await AuditHelper.LoadUserNamesAsync(
            db, [order.CreatedBy, order.UpdatedBy], ct);

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
            lines.Select(l => MapLine(l, unitMap)).ToList(),
            AuditHelper.BuildAudit(order.CreatedAt, order.CreatedBy, order.UpdatedAt, order.UpdatedBy, userNames));
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
            Status = "WAITING",
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
            CreatedBy = tenant.GetOrgUserId(),
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

    public async Task<OrdOrderDetailDto> ApproveAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct)
            ?? throw new InvalidOperationException("Sipariş bulunamadı.");

        if (order.Status != "WAITING")
            throw new InvalidOperationException("Sadece beklemedeki siparişler onaylanabilir.");

        order.Status = "APPROVED";
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = tenant.GetOrgUserId();
        await db.SaveChangesAsync(ct);

        return (await GetByIdAsync(id, ct))!;
    }

    public async Task<IReadOnlyList<OrdDeliveryReportItemDto>> DeliveryReportAsync(
        long accountId,
        CancellationToken ct = default)
    {
        var db = Db;
        var orders = await db.OrdOrders.AsNoTracking()
            .Where(o => !o.IsDeleted && o.AccountId == accountId)
            .OrderByDescending(o => o.DocumentDate)
            .ThenByDescending(o => o.Id)
            .ToListAsync(ct);

        if (orders.Count == 0)
            return Array.Empty<OrdDeliveryReportItemDto>();

        var orderIds = orders.Select(o => o.Id).ToList();
        var lineTotals = await db.OrdOrderLines.AsNoTracking()
            .Where(l => orderIds.Contains(l.OrderId) && !l.IsDeleted)
            .GroupBy(l => l.OrderId)
            .Select(g => new
            {
                OrderId = g.Key,
                TotalQuantity = g.Sum(x => x.Quantity),
                DeliveredQuantity = g.Sum(x => x.DeliveredQuantity),
            })
            .ToDictionaryAsync(x => x.OrderId, ct);

        return orders.Select(o =>
        {
            var (key, label) = MapStatus(o.Status);
            lineTotals.TryGetValue(o.Id, out var totals);
            return new OrdDeliveryReportItemDto(
                o.Id,
                o.DocumentNo,
                o.OrderType,
                o.DocumentDate,
                o.DeliveryDate,
                o.GrandTotal,
                key,
                label,
                totals?.TotalQuantity ?? 0,
                totals?.DeliveredQuantity ?? 0);
        }).ToList();
    }

    public async Task<ConvertOrdToDlnResultDto> ConvertToDeliveryNoteAsync(
        long id,
        ConvertOrdRequest? request = null,
        CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct)
            ?? throw new InvalidOperationException("Sipariş bulunamadı.");

        EnsureConvertible(order);

        var lines = await db.OrdOrderLines
            .Where(l => l.OrderId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var quantities = ResolveLineQuantities(
            lines,
            request?.Lines,
            l => l.Quantity - l.DeliveredQuantity);

        var shipLines = BuildDeliveryNoteLines(lines, quantities);

        if (shipLines.Count == 0)
            throw new InvalidOperationException("Sevk edilecek kalem seçilmedi.");

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

        ApplyDeliveredQuantities(lines, quantities, dlnLineEntities);
        UpdateOrderStatusAfterDelivery(order, lines);
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = tenant.GetOrgUserId();
        await db.SaveChangesAsync(ct);

        return new ConvertOrdToDlnResultDto(order.Id, dln.Id, dln.DocumentNo);
    }

    public async Task<ConvertOrdToInvResultDto> ConvertToInvoiceAsync(
        long id,
        ConvertOrdRequest? request = null,
        CancellationToken ct = default)
    {
        var db = Db;
        var order = await db.OrdOrders.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct)
            ?? throw new InvalidOperationException("Sipariş bulunamadı.");

        EnsureConvertible(order);

        var lines = await db.OrdOrderLines
            .Where(l => l.OrderId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var quantities = ResolveLineQuantities(
            lines,
            request?.Lines,
            l => l.Quantity - l.InvoicedQuantity);

        var invLines = BuildInvoiceLines(lines, quantities);

        if (invLines.Count == 0)
            throw new InvalidOperationException("Faturalanacak kalem seçilmedi.");

        var invoiceType = order.OrderType == "PURCHASE" ? "PURCHASE" : "SALES";
        var invoice = await invService.CreateAsync(new CreateInvInvoiceRequest(
            invoiceType,
            order.AccountId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            order.DeliveryDate,
            order.Notes,
            invLines,
            "BEKLIYOR"), ct);

        foreach (var line in lines)
        {
            if (quantities.TryGetValue(line.Id, out var qty))
                line.InvoicedQuantity += qty;
        }

        UpdateOrderStatusAfterInvoice(order, lines);
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = tenant.GetOrgUserId();
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

    private static OrdOrderLineDto MapLine(OrdOrderLine l, IReadOnlyDictionary<long, string> unitMap) =>
        new(
            l.Id,
            l.LineNo,
            l.Description,
            unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
            l.Quantity,
            l.DeliveredQuantity,
            l.InvoicedQuantity,
            Math.Max(0, l.Quantity - l.DeliveredQuantity),
            Math.Max(0, l.Quantity - l.InvoicedQuantity),
            l.UnitPrice,
            l.TaxAmount,
            l.LineTotal);

    private static void EnsureConvertible(OrdOrder order)
    {
        if (order.Status == "CANCELLED")
            throw new InvalidOperationException("İptal edilmiş sipariş dönüştürülemez.");
        if (order.Status == "WAITING")
            throw new InvalidOperationException("Beklemedeki sipariş önce onaylanmalı.");
    }

    private static Dictionary<long, decimal> ResolveLineQuantities(
        IReadOnlyList<OrdOrderLine> lines,
        IReadOnlyList<ConvertOrdLineQuantityRequest>? selections,
        Func<OrdOrderLine, decimal> remainingFn)
    {
        var lineMap = lines.ToDictionary(l => l.Id);

        if (selections is null || selections.Count == 0)
        {
            return lines
                .Where(l => remainingFn(l) > 0)
                .ToDictionary(l => l.Id, remainingFn);
        }

        var result = new Dictionary<long, decimal>();
        foreach (var selection in selections)
        {
            if (!lineMap.TryGetValue(selection.LineId, out var line))
                throw new InvalidOperationException("Geçersiz sipariş kalemi.");

            var remaining = remainingFn(line);
            if (selection.Quantity <= 0)
                throw new InvalidOperationException($"{line.Description}: miktar sıfırdan büyük olmalı.");
            if (selection.Quantity > remaining)
                throw new InvalidOperationException($"{line.Description}: en fazla {remaining} birim seçilebilir.");

            result[line.Id] = selection.Quantity;
        }

        return result;
    }

    private static List<CreateDlnDeliveryNoteLineRequest> BuildDeliveryNoteLines(
        IReadOnlyList<OrdOrderLine> lines,
        IReadOnlyDictionary<long, decimal> quantities) =>
        lines
            .Where(l => quantities.ContainsKey(l.Id))
            .Select(l => new CreateDlnDeliveryNoteLineRequest(
                l.ItemId,
                l.Description,
                quantities[l.Id],
                l.UnitId))
            .ToList();

    private static List<CreateInvInvoiceLineRequest> BuildInvoiceLines(
        IReadOnlyList<OrdOrderLine> lines,
        IReadOnlyDictionary<long, decimal> quantities) =>
        lines
            .Where(l => quantities.ContainsKey(l.Id))
            .Select(l => new CreateInvInvoiceLineRequest(
                l.ItemId,
                l.Description,
                quantities[l.Id],
                l.UnitId,
                l.UnitPrice,
                l.TaxRateId))
            .ToList();

    private static void ApplyDeliveredQuantities(
        IReadOnlyList<OrdOrderLine> lines,
        IReadOnlyDictionary<long, decimal> quantities,
        IReadOnlyList<DlnDeliveryNoteLine> dlnLines)
    {
        var lineMap = lines.ToDictionary(l => l.Id);
        var idx = 0;
        foreach (var pair in quantities)
        {
            if (!lineMap.TryGetValue(pair.Key, out var ordLine))
                continue;

            if (idx < dlnLines.Count)
                dlnLines[idx].SourceLineId = ordLine.Id;

            ordLine.DeliveredQuantity += pair.Value;
            idx++;
        }
    }

    private static void UpdateOrderStatusAfterDelivery(OrdOrder order, IReadOnlyList<OrdOrderLine> lines)
    {
        var allDelivered = lines.All(l => l.DeliveredQuantity >= l.Quantity);
        order.Status = allDelivered ? "COMPLETED" : "PARTIAL";
    }

    private static void UpdateOrderStatusAfterInvoice(OrdOrder order, IReadOnlyList<OrdOrderLine> lines)
    {
        var allInvoiced = lines.All(l => l.InvoicedQuantity >= l.Quantity);
        order.Status = allInvoiced ? "COMPLETED" : "PARTIAL";
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
        "WAITING" => ("beklemede", "Beklemede"),
        "APPROVED" => ("onaylandi", "Onaylandı"),
        "PARTIAL" => ("kismi", "Kısmi Sevk"),
        "COMPLETED" => ("tamamlandi", "Tamamlandı"),
        "CANCELLED" => ("iptal", "İptal"),
        _ => ("beklemede", status),
    };
}
