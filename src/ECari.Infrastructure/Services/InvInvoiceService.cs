using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class InvInvoiceService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<InvInvoiceListItemDto>> ListAsync(
        string invoiceType,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.InvInvoices.AsNoTracking()
            .Include(i => i.Account)
            .Where(i => !i.IsDeleted && i.InvoiceType == invoiceType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i =>
                i.DocumentNo.Contains(term) ||
                i.Account.Title.Contains(term));
        }

        var items = await query
            .OrderByDescending(i => i.DocumentDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync(ct);

        return items.Select(i =>
        {
            var (key, label) = MapPaymentStatus(i.PaymentStatus, i.DueDate);
            return new InvInvoiceListItemDto(
                i.Id,
                i.DocumentNo,
                i.InvoiceType,
                i.Account.Title,
                i.DocumentDate,
                i.DueDate,
                i.GrandTotal,
                key,
                label);
        }).ToList();
    }

    public async Task<InvInvoiceDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var invoice = await db.InvInvoices.AsNoTracking()
            .Include(i => i.Account)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct);

        if (invoice is null) return null;

        var lines = await db.InvInvoiceLines.AsNoTracking()
            .Where(l => l.InvoiceId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var unitIds = lines.Select(l => l.UnitId).Distinct().ToList();
        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => unitIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        var profile = await db.CompanyProfiles.AsNoTracking().FirstOrDefaultAsync(ct);
        var (key, label) = MapPaymentStatus(invoice.PaymentStatus, invoice.DueDate);
        var account = invoice.Account;
        var taxId = account.TaxNumber ?? account.IdentityNumber;

        return new InvInvoiceDetailDto(
            invoice.Id,
            invoice.DocumentNo,
            invoice.InvoiceType,
            account.Id,
            account.Title,
            taxId,
            invoice.DocumentDate,
            invoice.DueDate,
            invoice.Subtotal,
            invoice.TaxTotal,
            invoice.GrandTotal,
            key,
            label,
            invoice.Notes,
            profile?.LegalName ?? "—",
            profile?.Address,
            lines.Select(l => new InvInvoiceLineDto(
                l.LineNo,
                l.Description,
                unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
                l.Quantity,
                l.UnitPrice,
                l.TaxAmount,
                l.LineTotal)).ToList());
    }

    public async Task<InvInvoiceDetailDto> CreateAsync(CreateInvInvoiceRequest request, CancellationToken ct = default)
    {
        if (request.Lines.Count == 0)
            throw new InvalidOperationException("En az bir fatura kalemi gerekli.");

        var invoiceType = request.InvoiceType.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            _ => throw new InvalidOperationException("Geçerli fatura tipi: SALES veya PURCHASE"),
        };

        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var taxRates = await db.TaxRates.AsNoTracking()
            .Where(t => t.IsActive)
            .ToDictionaryAsync(t => t.Id, ct);

        var branchId = await db.Warehouses.AsNoTracking()
            .Where(w => w.IsDefault && !w.IsDeleted)
            .Select(w => (long?)w.BranchId)
            .FirstOrDefaultAsync(ct);

        var lineEntities = new List<InvInvoiceLine>();
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

            lineEntities.Add(new InvInvoiceLine
            {
                LineNo = lineNo++,
                LineType = line.ItemId.HasValue ? "URUN" : "HIZMET",
                ItemId = line.ItemId,
                Description = line.Description.Trim(),
                Quantity = line.Quantity,
                UnitId = line.UnitId,
                UnitPrice = line.UnitPrice,
                DiscountAmount = 0,
                TaxRateId = line.TaxRateId,
                TaxAmount = taxAmount,
                LineTotal = lineTotal,
                CreatedAt = DateTime.UtcNow,
            });

            subtotal += net;
            taxTotal += taxAmount;
        }

        var grandTotal = subtotal + taxTotal;
        var documentNo = await GenerateDocumentNoAsync(db, invoiceType, request.DocumentDate, ct);

        var invoice = new InvInvoice
        {
            DocumentNo = documentNo,
            DocumentDate = request.DocumentDate,
            InvoiceType = invoiceType,
            Status = "APPROVED",
            AccountId = account.Id,
            BranchId = branchId,
            CurrencyId = account.CurrencyId,
            DueDate = request.PaymentStatus == "ODENDI" ? request.DocumentDate : request.DueDate,
            Subtotal = subtotal,
            TaxTotal = taxTotal,
            GrandTotal = grandTotal,
            PaymentStatus = request.PaymentStatus ?? "BEKLIYOR",
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        db.InvInvoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        foreach (var line in lineEntities)
            line.InvoiceId = invoice.Id;

        db.InvInvoiceLines.AddRange(lineEntities);

        var isSales = invoiceType == "SALES";
        db.CariMovements.Add(new CariMovement
        {
            AccountId = account.Id,
            MovementDate = request.DocumentDate,
            DueDate = request.DueDate,
            MovementType = "INVOICE",
            Debit = isSales ? grandTotal : 0,
            Credit = isSales ? 0 : grandTotal,
            CurrencyId = account.CurrencyId,
            DocumentModule = "INV",
            DocumentId = invoice.Id,
            DocumentNo = documentNo,
            Description = isSales ? "Satış faturası" : "Alış faturası",
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        var profile = await db.CompanyProfiles.AsNoTracking().FirstOrDefaultAsync(ct);
        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => lineEntities.Select(l => l.UnitId).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);
        var (key, label) = MapPaymentStatus(invoice.PaymentStatus, invoice.DueDate);
        var taxId = account.TaxNumber ?? account.IdentityNumber;

        return new InvInvoiceDetailDto(
            invoice.Id,
            invoice.DocumentNo,
            invoice.InvoiceType,
            account.Id,
            account.Title,
            taxId,
            invoice.DocumentDate,
            invoice.DueDate,
            invoice.Subtotal,
            invoice.TaxTotal,
            invoice.GrandTotal,
            key,
            label,
            invoice.Notes,
            profile?.LegalName ?? "—",
            profile?.Address,
            lineEntities.Select(l => new InvInvoiceLineDto(
                l.LineNo,
                l.Description,
                unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
                l.Quantity,
                l.UnitPrice,
                l.TaxAmount,
                l.LineTotal)).ToList());
    }

    public async Task<InvKdvReportDto> GetKdvReportAsync(CancellationToken ct = default)
    {
        var invoices = await Db.InvInvoices.AsNoTracking()
            .Include(i => i.Account)
            .Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.DocumentDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync(ct);

        var rows = invoices.Select(i => new InvKdvReportRowDto(
            i.Id,
            i.DocumentNo,
            i.InvoiceType,
            i.Account.Title,
            i.DocumentDate,
            i.Subtotal,
            i.TaxTotal)).ToList();

        var salesTax = rows.Where(r => r.InvoiceType == "SALES").Sum(r => r.TaxTotal);
        var purchaseTax = rows.Where(r => r.InvoiceType == "PURCHASE").Sum(r => r.TaxTotal);

        return new InvKdvReportDto(
            salesTax,
            purchaseTax,
            purchaseTax,
            salesTax - purchaseTax,
            rows);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var invoice = await db.InvInvoices.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct);
        if (invoice is null) return false;

        var linkedExpense = await db.ExpExpenses.AsNoTracking()
            .AnyAsync(e => !e.IsDeleted && e.PurchaseInvoiceId == id, ct);
        if (linkedExpense)
            throw new InvalidOperationException("Masrafa bağlı fatura silinemez.");

        invoice.IsDeleted = true;
        invoice.Status = "CANCELLED";
        invoice.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static async Task<string> GenerateDocumentNoAsync(
        TenantDbContext db,
        string invoiceType,
        DateOnly documentDate,
        CancellationToken ct)
    {
        var prefix = invoiceType == "SALES" ? "SF" : "AF";
        var year = documentDate.Year;
        var pattern = $"{prefix}-{year}-";

        var lastNo = await db.InvInvoices.AsNoTracking()
            .Where(i => !i.IsDeleted && i.DocumentNo.StartsWith(pattern))
            .OrderByDescending(i => i.DocumentNo)
            .Select(i => i.DocumentNo)
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

    private static (string Key, string Label) MapPaymentStatus(string? paymentStatus, DateOnly? dueDate)
    {
        if (paymentStatus == "ODENDI")
            return ("odendi", "Ödendi");
        if (paymentStatus == "KISMI")
            return ("kismi", "Kısmi ödeme");
        if (dueDate.HasValue && dueDate.Value < DateOnly.FromDateTime(DateTime.Today) && paymentStatus != "ODENDI")
            return ("vadesi_gecmis", "Vadesi Geçti");
        if (paymentStatus == "BEKLIYOR")
            return ("bekliyor", "Bekliyor");
        return ("bekliyor", "Bekliyor");
    }
}
