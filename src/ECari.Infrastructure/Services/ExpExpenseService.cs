using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class ExpExpenseService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    InvInvoiceService invInvoiceService)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<ExpServiceDefinitionDto>> ListServicesAsync(CancellationToken ct = default)
    {
        var items = await Db.ExpServiceDefinitions.AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(ct);

        return items.Select(s => new ExpServiceDefinitionDto(
            s.Id, s.Code, s.Name, s.CategoryGroup, s.DefaultTaxRateId)).ToList();
    }

    public async Task<IReadOnlyList<ExpExpenseListItemDto>> ListAsync(
        string? status,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.ExpExpenses.AsNoTracking()
            .Include(e => e.Account)
            .Where(e => !e.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(e => e.ApprovalStatus == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(e =>
                e.DocumentNo.Contains(term) ||
                e.Description.Contains(term) ||
                (e.Account != null && e.Account.Title.Contains(term)));
        }

        var items = await query.OrderByDescending(e => e.ExpenseDate).ThenByDescending(e => e.Id).ToListAsync(ct);
        return items.Select(MapListItem).ToList();
    }

    public async Task<ExpExpenseDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var expense = await db.ExpExpenses.AsNoTracking()
            .Include(e => e.Account)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, ct);

        if (expense is null) return null;

        var lines = await db.ExpExpenseLines.AsNoTracking()
            .Include(l => l.ServiceDefinition)
            .Where(l => l.ExpenseId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var unitMap = await db.StkUnits.AsNoTracking()
            .Where(u => lines.Select(l => l.UnitId).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        var (statusKey, statusLabel) = MapStatus(expense.ApprovalStatus);
        var (payKey, payLabel) = MapPaymentMethod(expense.PaymentMethod);

        return new ExpExpenseDetailDto(
            expense.Id,
            expense.DocumentNo,
            expense.ExpenseDate,
            expense.AccountId ?? 0,
            expense.Account?.Title ?? "—",
            expense.Subtotal,
            expense.TaxTotal,
            expense.GrandTotal,
            payKey,
            payLabel,
            statusKey,
            statusLabel,
            expense.PurchaseInvoiceId,
            expense.Notes,
            lines.Select(l => new ExpExpenseLineDto(
                l.LineNo,
                l.LineType,
                l.Description,
                l.ServiceDefinition?.Name,
                unitMap.TryGetValue(l.UnitId, out var unitName) ? unitName : "—",
                l.Quantity,
                l.UnitPrice,
                l.TaxAmount,
                l.LineTotal)).ToList());
    }

    public async Task<ExpenseStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var items = await Db.ExpExpenses.AsNoTracking().Where(e => !e.IsDeleted).ToListAsync(ct);
        return new ExpenseStatsDto(
            items.Count,
            items.Sum(e => e.GrandTotal > 0 ? e.GrandTotal : e.Amount),
            items.Count(e => e.ApprovalStatus == "PENDING"),
            items.Count(e => e.ApprovalStatus == "APPROVED"),
            items.Count(e => e.ApprovalStatus == "PAID"));
    }

    public async Task<ExpExpenseDetailDto> CreateAsync(CreateExpExpenseRequest request, CancellationToken ct = default)
    {
        if (request.Lines.Count == 0)
            throw new InvalidOperationException("En az bir masraf kalemi gerekli.");

        var paymentMethod = NormalizePaymentMethod(request.PaymentMethod);

        var db = Db;
        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var services = await db.ExpServiceDefinitions.AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive)
            .ToDictionaryAsync(s => s.Id, ct);

        var taxRates = await db.TaxRates.AsNoTracking()
            .Where(t => t.IsActive)
            .ToDictionaryAsync(t => t.Id, ct);

        var invLines = new List<CreateInvInvoiceLineRequest>();
        var lineEntities = new List<ExpExpenseLine>();
        decimal subtotal = 0;
        decimal taxTotal = 0;
        var lineNo = 1;
        string? primaryCategory = null;

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
            var lineType = line.ItemId.HasValue ? "URUN" : "HIZMET";

            if (line.ServiceDefinitionId.HasValue && services.TryGetValue(line.ServiceDefinitionId.Value, out var svc))
                primaryCategory ??= svc.Code.ToLowerInvariant();

            lineEntities.Add(new ExpExpenseLine
            {
                LineNo = lineNo,
                LineType = lineType,
                ServiceDefinitionId = line.ServiceDefinitionId,
                ItemId = line.ItemId,
                Description = line.Description.Trim(),
                Quantity = line.Quantity,
                UnitId = line.UnitId,
                UnitPrice = line.UnitPrice,
                TaxRateId = line.TaxRateId,
                TaxAmount = taxAmount,
                LineTotal = lineTotal,
                CreatedAt = DateTime.UtcNow,
            });

            invLines.Add(new CreateInvInvoiceLineRequest(
                line.ItemId,
                line.Description.Trim(),
                line.Quantity,
                line.UnitId,
                line.UnitPrice,
                line.TaxRateId));

            subtotal += net;
            taxTotal += taxAmount;
            lineNo++;
        }

        var grandTotal = subtotal + taxTotal;
        var summary = lineEntities.Count == 1
            ? lineEntities[0].Description
            : $"{lineEntities.Count} kalem masraf";

        long? invoiceId = null;
        var approvalStatus = "PAID";
        var paymentStatus = "ODENDI";

        if (request.RequiresApproval)
        {
            approvalStatus = "PENDING";
            paymentStatus = "BEKLIYOR";
        }
        else
        {
            var invoice = await invInvoiceService.CreateAsync(new CreateInvInvoiceRequest(
                "PURCHASE",
                account.Id,
                request.ExpenseDate,
                request.ExpenseDate,
                request.Notes ?? $"Masraf: {summary}",
                invLines,
                "ODENDI"), ct);
            invoiceId = invoice.Id;
        }

        var documentNo = await GenerateDocumentNoAsync(db, request.ExpenseDate, ct);

        var entity = new ExpExpense
        {
            DocumentNo = documentNo,
            ExpenseDate = request.ExpenseDate,
            Category = primaryCategory ?? "diger",
            Description = summary,
            Amount = grandTotal,
            AccountId = account.Id,
            Subtotal = subtotal,
            TaxTotal = taxTotal,
            GrandTotal = grandTotal,
            PurchaseInvoiceId = invoiceId,
            CurrencyId = account.CurrencyId,
            ApprovalStatus = approvalStatus,
            PaymentStatus = paymentStatus,
            PaymentMethod = paymentMethod,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        db.ExpExpenses.Add(entity);
        await db.SaveChangesAsync(ct);

        foreach (var line in lineEntities)
            line.ExpenseId = entity.Id;

        db.ExpExpenseLines.AddRange(lineEntities);
        await db.SaveChangesAsync(ct);

        return (await GetByIdAsync(entity.Id, ct))!;
    }

    public async Task<ExpExpenseDetailDto?> UpdateStatusAsync(long id, UpdateExpExpenseStatusRequest request, CancellationToken ct = default)
    {
        var action = request.Action.ToLowerInvariant();
        var db = Db;
        var expense = await db.ExpExpenses.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, ct);
        if (expense is null) return null;

        switch (action)
        {
            case "approve":
                if (expense.ApprovalStatus != "PENDING")
                    throw new InvalidOperationException("Yalnızca onay bekleyen masraflar onaylanabilir.");
                expense.ApprovalStatus = "APPROVED";
                break;
            case "reject":
                if (expense.ApprovalStatus != "PENDING")
                    throw new InvalidOperationException("Yalnızca onay bekleyen masraflar reddedilebilir.");
                expense.ApprovalStatus = "REJECTED";
                expense.PaymentStatus = "IPTAL";
                break;
            default:
                throw new InvalidOperationException("Geçerli işlem: approve veya reject");
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
            expense.Notes = request.Notes.Trim();

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<ExpExpenseDetailDto?> PayAsync(long id, PayExpExpenseRequest request, CancellationToken ct = default)
    {
        var db = Db;
        var expense = await db.ExpExpenses
            .Include(e => e.Account)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, ct)
            ?? throw new InvalidOperationException("Masraf bulunamadı.");

        if (expense.ApprovalStatus != "APPROVED" && expense.ApprovalStatus != "PENDING")
            throw new InvalidOperationException("Ödeme için masraf onaylı olmalı.");

        if (expense.PurchaseInvoiceId.HasValue)
            throw new InvalidOperationException("Bu masraf zaten ödenmiş.");

        var lines = await db.ExpExpenseLines.AsNoTracking()
            .Where(l => l.ExpenseId == id && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);

        var invLines = lines.Select(l => new CreateInvInvoiceLineRequest(
            l.ItemId,
            l.Description,
            l.Quantity,
            l.UnitId,
            l.UnitPrice,
            l.TaxRateId)).ToList();

        var payDate = request.TransactionDate ?? expense.ExpenseDate;
        var invoice = await invInvoiceService.CreateAsync(new CreateInvInvoiceRequest(
            "PURCHASE",
            expense.AccountId ?? throw new InvalidOperationException("Cari hesap tanımsız."),
            payDate,
            payDate,
            expense.Notes ?? $"Masraf: {expense.DocumentNo}",
            invLines,
            "ODENDI"), ct);

        if (!string.IsNullOrWhiteSpace(request.PaymentMethod))
            expense.PaymentMethod = NormalizePaymentMethod(request.PaymentMethod);

        expense.PurchaseInvoiceId = invoice.Id;
        expense.ApprovalStatus = "PAID";
        expense.PaymentStatus = "ODENDI";
        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    private static ExpExpenseListItemDto MapListItem(ExpExpense e)
    {
        var (statusKey, statusLabel) = MapStatus(e.ApprovalStatus);
        var (payKey, payLabel) = MapPaymentMethod(e.PaymentMethod);
        var total = e.GrandTotal > 0 ? e.GrandTotal : e.Amount;
        return new ExpExpenseListItemDto(
            e.Id,
            e.DocumentNo,
            e.ExpenseDate,
            e.Account?.Title ?? "—",
            e.Description,
            total,
            payKey,
            payLabel,
            statusKey,
            statusLabel,
            e.PurchaseInvoiceId);
    }

    private static async Task<string> GenerateDocumentNoAsync(TenantDbContext db, DateOnly date, CancellationToken ct)
    {
        var pattern = $"MSF-{date.Year}-";
        var lastNo = await db.ExpExpenses.AsNoTracking()
            .Where(e => !e.IsDeleted && e.DocumentNo.StartsWith(pattern))
            .OrderByDescending(e => e.DocumentNo)
            .Select(e => e.DocumentNo)
            .FirstOrDefaultAsync(ct);

        var seq = 1;
        if (lastNo is not null && int.TryParse(lastNo.Split('-')[^1], out var parsed))
            seq = parsed + 1;

        return $"{pattern}{seq:D4}";
    }

    private static string NormalizePaymentMethod(string method) => method.ToUpperInvariant() switch
    {
        "NAKIT" or "CASH" => "NAKIT",
        "HAVALE" or "TRANSFER" or "EFT" => "HAVALE",
        "KREDI_KARTI" or "CARD" => "KREDI_KARTI",
        "CEK" or "CHECK" => "CEK",
        "SENET" => "SENET",
        _ => throw new InvalidOperationException("Geçerli ödeme şekli: NAKIT, HAVALE, KREDI_KARTI, CEK, SENET"),
    };

    private static (string Key, string Label) MapPaymentMethod(string? method) => (method ?? "NAKIT") switch
    {
        "NAKIT" or "CASH" => ("nakit", "Nakit"),
        "HAVALE" or "TRANSFER" => ("havale", "Havale/EFT"),
        "KREDI_KARTI" or "CARD" => ("kredi_karti", "Kredi Kartı"),
        "CEK" or "CHECK" => ("cek", "Çek"),
        "SENET" => ("senet", "Senet"),
        _ => ("nakit", method ?? "Nakit"),
    };

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "PENDING" => ("onay_bekliyor", "Onay Bekliyor"),
        "APPROVED" => ("onaylandi", "Onaylandı"),
        "PAID" => ("odendi", "Ödendi"),
        "REJECTED" => ("reddedildi", "Reddedildi"),
        _ => ("odendi", status),
    };
}
