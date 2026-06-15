using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class DlnDeliveryNoteService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    InvInvoiceService invService)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<DlnDeliveryNoteListItemDto>> ListAsync(
        string documentType,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.DlnDeliveryNotes.AsNoTracking()
            .Include(n => n.Account)
            .Where(n => !n.IsDeleted && n.DocumentType == documentType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(n =>
                n.DocumentNo.Contains(term) ||
                n.Account.Title.Contains(term) ||
                (n.ShippingAddress != null && n.ShippingAddress.Contains(term)));
        }

        var items = await query
            .OrderByDescending(n => n.DocumentDate)
            .ThenByDescending(n => n.Id)
            .ToListAsync(ct);

        return items.Select(n =>
        {
            var (key, label) = MapStatus(n.Status);
            return new DlnDeliveryNoteListItemDto(
                n.Id,
                n.DocumentNo,
                n.DocumentType,
                n.Account.Title,
                n.DocumentDate,
                n.ShippingAddress,
                key,
                label);
        }).ToList();
    }

    public async Task<DlnDeliveryNoteDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var note = await db.DlnDeliveryNotes.AsNoTracking()
            .Include(n => n.Account)
            .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted, ct);

        if (note is null) return null;

        var lines = await db.DlnDeliveryNoteLines.AsNoTracking()
            .Where(l => l.DeliveryNoteId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var unitIds = lines.Select(l => l.UnitId).Distinct().ToList();
        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => unitIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        string? warehouseName = null;
        if (note.WarehouseId.HasValue)
        {
            warehouseName = await db.Warehouses.AsNoTracking()
                .Where(w => w.Id == note.WarehouseId.Value)
                .Select(w => w.Name)
                .FirstOrDefaultAsync(ct);
        }

        var (key, label) = MapStatus(note.Status);

        return new DlnDeliveryNoteDetailDto(
            note.Id,
            note.DocumentNo,
            note.DocumentType,
            note.Account.Id,
            note.Account.Title,
            note.DocumentDate,
            note.ShippingAddress,
            warehouseName,
            key,
            label,
            note.Notes,
            lines.Select(l => new DlnDeliveryNoteLineDto(
                l.LineNo,
                l.Description,
                unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
                l.Quantity)).ToList());
    }

    public async Task<DlnDeliveryNoteDetailDto> CreateAsync(
        CreateDlnDeliveryNoteRequest request,
        CancellationToken ct = default)
    {
        if (request.Lines.Count == 0)
            throw new InvalidOperationException("En az bir irsaliye kalemi gerekli.");

        var documentType = request.DocumentType.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            _ => throw new InvalidOperationException("Geçerli irsaliye tipi: SALES veya PURCHASE"),
        };

        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

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

        var lineEntities = new List<DlnDeliveryNoteLine>();
        var lineNo = 1;

        foreach (var line in request.Lines)
        {
            if (string.IsNullOrWhiteSpace(line.Description))
                throw new InvalidOperationException($"Satır {lineNo}: açıklama zorunlu.");
            if (line.Quantity <= 0)
                throw new InvalidOperationException($"Satır {lineNo}: miktar sıfırdan büyük olmalı.");

            lineEntities.Add(new DlnDeliveryNoteLine
            {
                LineNo = lineNo++,
                ItemId = line.ItemId,
                Description = line.Description.Trim(),
                Quantity = line.Quantity,
                UnitId = line.UnitId,
                WarehouseId = warehouseId,
                CreatedAt = DateTime.UtcNow,
            });
        }

        var documentNo = await GenerateDocumentNoAsync(db, documentType, request.DocumentDate, ct);

        var note = new DlnDeliveryNote
        {
            DocumentNo = documentNo,
            DocumentDate = request.DocumentDate,
            DocumentType = documentType,
            Status = "PREPARING",
            AccountId = account.Id,
            BranchId = branchId,
            WarehouseId = warehouseId,
            ShippingAddress = request.ShippingAddress?.Trim(),
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        db.DlnDeliveryNotes.Add(note);
        await db.SaveChangesAsync(ct);

        foreach (var line in lineEntities)
            line.DeliveryNoteId = note.Id;

        db.DlnDeliveryNoteLines.AddRange(lineEntities);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return (await GetByIdAsync(note.Id, ct))!;
    }

    public async Task<ConvertDlnToInvResultDto> ConvertToInvoiceAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var note = await db.DlnDeliveryNotes.FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted, ct)
            ?? throw new InvalidOperationException("İrsaliye bulunamadı.");

        if (note.Status == "CANCELLED")
            throw new InvalidOperationException("İptal edilmiş irsaliye faturalandırılamaz.");

        var lines = await db.DlnDeliveryNoteLines
            .Where(l => l.DeliveryNoteId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        if (lines.Count == 0)
            throw new InvalidOperationException("İrsaliyede satır bulunamadı.");

        var sourceLineIds = lines.Where(l => l.SourceLineId.HasValue).Select(l => l.SourceLineId!.Value).ToList();
        var orderLines = sourceLineIds.Count > 0
            ? await db.OrdOrderLines.AsNoTracking()
                .Where(l => sourceLineIds.Contains(l.Id))
                .ToDictionaryAsync(l => l.Id, ct)
            : new Dictionary<long, OrdOrderLine>();

        var invLines = new List<CreateInvInvoiceLineRequest>();
        foreach (var line in lines)
        {
            decimal unitPrice = 0;
            long taxRateId = 1;

            if (line.SourceLineId.HasValue && orderLines.TryGetValue(line.SourceLineId.Value, out var ordLine))
            {
                unitPrice = ordLine.UnitPrice;
                taxRateId = ordLine.TaxRateId;
            }
            else
            {
                var defaultTax = await db.TaxRates.AsNoTracking()
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Rate)
                    .FirstOrDefaultAsync(ct);
                if (defaultTax is not null)
                    taxRateId = defaultTax.Id;
            }

            invLines.Add(new CreateInvInvoiceLineRequest(
                line.ItemId,
                line.Description,
                line.Quantity,
                line.UnitId,
                unitPrice,
                taxRateId));
        }

        var invoiceType = note.DocumentType == "PURCHASE" ? "PURCHASE" : "SALES";
        var invoice = await invService.CreateAsync(new CreateInvInvoiceRequest(
            invoiceType,
            note.AccountId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            null,
            note.Notes,
            invLines,
            "BEKLIYOR"), ct);

        note.Status = "DELIVERED";
        note.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new ConvertDlnToInvResultDto(note.Id, invoice.Id, invoice.DocumentNo);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var note = await db.DlnDeliveryNotes.FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted, ct);
        if (note is null) return false;

        if (note.Status == "DELIVERED")
            throw new InvalidOperationException("Teslim edilmiş irsaliye silinemez.");

        note.IsDeleted = true;
        note.Status = "CANCELLED";
        note.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static async Task<string> GenerateDocumentNoAsync(
        TenantDbContext db,
        string documentType,
        DateOnly documentDate,
        CancellationToken ct)
    {
        var prefix = documentType == "SALES" ? "SI" : "AI";
        var year = documentDate.Year;
        var pattern = $"{prefix}-{year}-";

        var lastNo = await db.DlnDeliveryNotes.AsNoTracking()
            .Where(n => !n.IsDeleted && n.DocumentNo.StartsWith(pattern))
            .OrderByDescending(n => n.DocumentNo)
            .Select(n => n.DocumentNo)
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
        "PREPARING" => ("hazirlaniyor", "Hazırlanıyor"),
        "IN_TRANSIT" => ("sevkte", "Sevkte"),
        "DELIVERED" => ("teslim", "Teslim"),
        "CANCELLED" => ("iptal", "İptal"),
        _ => ("hazirlaniyor", status),
    };
}
