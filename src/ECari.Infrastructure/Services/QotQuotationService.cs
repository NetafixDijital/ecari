using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class QotQuotationService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    OrdOrderService ordOrderService)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<QotQuotationListItemDto>> ListAsync(
        string? documentType,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.QotQuotations.AsNoTracking()
            .Include(q => q.Account)
            .Where(q => !q.IsDeleted);

        if (!string.IsNullOrWhiteSpace(documentType))
            query = query.Where(q => q.DocumentType == documentType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(q =>
                q.DocumentNo.Contains(term) ||
                q.Account.Title.Contains(term));
        }

        var items = await query
            .OrderByDescending(q => q.DocumentDate)
            .ThenByDescending(q => q.Id)
            .ToListAsync(ct);

        return items.Select(q =>
        {
            var (key, label) = MapStatus(q.Status);
            return new QotQuotationListItemDto(
                q.Id,
                q.DocumentNo,
                q.DocumentType,
                q.Account.Title,
                q.DocumentDate,
                q.ValidUntil,
                q.GrandTotal,
                key,
                label);
        }).ToList();
    }

    public async Task<QotQuotationDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var quotation = await db.QotQuotations.AsNoTracking()
            .Include(q => q.Account)
            .FirstOrDefaultAsync(q => q.Id == id && !q.IsDeleted, ct);

        if (quotation is null) return null;

        var lines = await db.QotQuotationLines.AsNoTracking()
            .Where(l => l.QuotationId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => lines.Select(l => l.UnitId).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        var (key, label) = MapStatus(quotation.Status);

        return new QotQuotationDetailDto(
            quotation.Id,
            quotation.DocumentNo,
            quotation.DocumentType,
            quotation.Account.Id,
            quotation.Account.Title,
            quotation.DocumentDate,
            quotation.ValidUntil,
            quotation.Subtotal,
            quotation.TaxTotal,
            quotation.GrandTotal,
            key,
            label,
            quotation.ConvertedOrderId,
            quotation.Notes,
            lines.Select(l => new QotQuotationLineDto(
                l.LineNo,
                l.Description,
                unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
                l.Quantity,
                l.UnitPrice,
                l.TaxAmount,
                l.LineTotal)).ToList());
    }

    public async Task<QotQuotationDetailDto> CreateAsync(CreateQotQuotationRequest request, CancellationToken ct = default)
    {
        if (request.Lines.Count == 0)
            throw new InvalidOperationException("En az bir teklif kalemi gerekli.");

        var documentType = request.DocumentType.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            _ => throw new InvalidOperationException("Geçerli teklif tipi: SALES veya PURCHASE"),
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

        var lineEntities = new List<QotQuotationLine>();
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

            lineEntities.Add(new QotQuotationLine
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

        var documentNo = await GenerateDocumentNoAsync(db, documentType, request.DocumentDate, ct);

        var quotation = new QotQuotation
        {
            DocumentNo = documentNo,
            DocumentDate = request.DocumentDate,
            ValidUntil = request.ValidUntil,
            DocumentType = documentType,
            Status = "DRAFT",
            AccountId = account.Id,
            BranchId = branchId,
            WarehouseId = warehouseId,
            CurrencyId = account.CurrencyId,
            Subtotal = subtotal,
            TaxTotal = taxTotal,
            GrandTotal = subtotal + taxTotal,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        db.QotQuotations.Add(quotation);
        await db.SaveChangesAsync(ct);

        foreach (var line in lineEntities)
            line.QuotationId = quotation.Id;

        db.QotQuotationLines.AddRange(lineEntities);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return (await GetByIdAsync(quotation.Id, ct))!;
    }

    public async Task<ConvertQotToOrderResultDto> ConvertToOrderAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var quotation = await db.QotQuotations
            .FirstOrDefaultAsync(q => q.Id == id && !q.IsDeleted, ct)
            ?? throw new InvalidOperationException("Teklif bulunamadı.");

        if (quotation.Status == "CONVERTED")
            throw new InvalidOperationException("Bu teklif zaten siparişe dönüştürülmüş.");
        if (quotation.Status == "CANCELLED")
            throw new InvalidOperationException("İptal edilmiş teklif siparişe dönüştürülemez.");

        var lines = await db.QotQuotationLines.AsNoTracking()
            .Where(l => l.QuotationId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        if (lines.Count == 0)
            throw new InvalidOperationException("Teklifte satır bulunamadı.");

        var orderType = quotation.DocumentType == "PURCHASE" ? "PURCHASE" : "SALES";
        var order = await ordOrderService.CreateAsync(new CreateOrdOrderRequest(
            orderType,
            quotation.AccountId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            quotation.ValidUntil,
            quotation.WarehouseId,
            quotation.Notes,
            lines.Select(l => new CreateOrdOrderLineRequest(
                l.ItemId,
                l.Description,
                l.Quantity,
                l.UnitId,
                l.UnitPrice,
                l.TaxRateId)).ToList()), ct);

        quotation.Status = "CONVERTED";
        quotation.ConvertedOrderId = order.Id;
        quotation.ConvertedAt = DateTime.UtcNow;
        quotation.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new ConvertQotToOrderResultDto(quotation.Id, order.Id, order.DocumentNo);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var quotation = await db.QotQuotations
            .FirstOrDefaultAsync(q => q.Id == id && !q.IsDeleted, ct);

        if (quotation is null) return false;

        if (quotation.Status == "CONVERTED")
            throw new InvalidOperationException("Siparişe dönüştürülmüş teklif silinemez.");

        quotation.IsDeleted = true;
        quotation.DeletedAt = DateTime.UtcNow;
        quotation.Status = "CANCELLED";
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static async Task<string> GenerateDocumentNoAsync(
        TenantDbContext db,
        string documentType,
        DateOnly documentDate,
        CancellationToken ct)
    {
        var prefix = documentType == "SALES" ? "TS" : "TA";
        var year = documentDate.Year;
        var pattern = $"{prefix}-{year}-";

        var lastNo = await db.QotQuotations.AsNoTracking()
            .Where(q => !q.IsDeleted && q.DocumentNo.StartsWith(pattern))
            .OrderByDescending(q => q.DocumentNo)
            .Select(q => q.DocumentNo)
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
        "SENT" => ("gonderildi", "Gönderildi"),
        "ACCEPTED" => ("kabul", "Kabul"),
        "REJECTED" => ("red", "Red"),
        "EXPIRED" => ("suresi_doldu", "Süresi Doldu"),
        "CANCELLED" => ("iptal", "İptal"),
        "CONVERTED" => ("donusturuldu", "Siparişe Dönüştü"),
        _ => ("taslak", status),
    };
}
