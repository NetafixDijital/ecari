using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class SvcTicketService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    InvInvoiceService invInvoiceService)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<SvcServiceDefinitionDto>> ListServicesAsync(CancellationToken ct = default)
    {
        return await Db.SvcServiceDefinitions.AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new SvcServiceDefinitionDto(s.Id, s.Code, s.Name, s.DefaultTaxRateId))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<SvcTicketListItemDto>> ListAsync(
        string? status,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.SvcTickets.AsNoTracking().Include(t => t.Account).Where(t => !t.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(t =>
                t.TicketNo.Contains(term) ||
                t.Account.Title.Contains(term) ||
                t.ProblemDescription.Contains(term) ||
                (t.DeviceName != null && t.DeviceName.Contains(term)));
        }

        var items = await query.OrderByDescending(t => t.TicketDate).ThenByDescending(t => t.Id).ToListAsync(ct);
        return items.Select(MapListItem).ToList();
    }

    public async Task<SvcTicketDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var ticket = await LoadTicketWithLinesAsync(id, ct);
        return ticket is null ? null : MapDetail(ticket);
    }

    public async Task<SvcTicketDetailDto> CreateAsync(CreateSvcTicketRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ProblemDescription))
            throw new InvalidOperationException("Arıza açıklaması zorunludur.");

        var db = Db;
        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var entity = new SvcTicket
        {
            TicketNo = await GenerateTicketNoAsync(db, ct),
            TicketDate = DateTime.UtcNow,
            AccountId = account.Id,
            DeviceName = request.DeviceName?.Trim(),
            ProblemDescription = request.ProblemDescription.Trim(),
            TechnicianName = request.TechnicianName?.Trim(),
            Status = "WAITING",
            Priority = NormalizePriority(request.Priority),
            CreatedAt = DateTime.UtcNow,
        };

        db.SvcTickets.Add(entity);
        await db.SaveChangesAsync(ct);

        entity.Account = account;
        entity.Lines = [];
        return MapDetail(entity);
    }

    public async Task<SvcTicketDetailDto?> UpdateAsync(long id, UpdateSvcTicketRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ProblemDescription))
            throw new InvalidOperationException("Arıza açıklaması zorunludur.");

        var db = Db;
        var ticket = await db.SvcTickets
            .Include(t => t.Account)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);

        if (ticket is null) return null;

        ticket.DeviceName = request.DeviceName?.Trim();
        ticket.ProblemDescription = request.ProblemDescription.Trim();
        ticket.TechnicianName = request.TechnicianName?.Trim();
        ticket.Priority = NormalizePriority(request.Priority);
        ticket.Resolution = request.Resolution?.Trim();
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(id, ct);
    }

    public async Task<SvcTicketDetailDto?> SaveLinesAsync(
        long id,
        SaveSvcTicketLinesRequest request,
        CancellationToken ct = default)
    {
        if (request.Lines.Count == 0)
            throw new InvalidOperationException("En az bir kalem ekleyin.");

        var db = Db;
        var ticket = await db.SvcTickets
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct)
            ?? throw new InvalidOperationException("Servis kaydı bulunamadı.");

        if (ticket.InvoiceId.HasValue)
            throw new InvalidOperationException("Faturalandırılmış servis kaydına kalem eklenemez.");

        var services = await db.SvcServiceDefinitions.AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive)
            .ToDictionaryAsync(s => s.Id, ct);

        var taxRates = await db.TaxRates.AsNoTracking()
            .Where(t => t.IsActive)
            .ToDictionaryAsync(t => t.Id, ct);

        await db.SvcTicketLines.Where(l => l.TicketId == id).ExecuteDeleteAsync(ct);

        var lineNo = 1;
        foreach (var line in request.Lines)
        {
            if (string.IsNullOrWhiteSpace(line.Description))
                throw new InvalidOperationException($"Satır {lineNo}: açıklama zorunlu.");
            if (line.Quantity <= 0)
                throw new InvalidOperationException($"Satır {lineNo}: miktar sıfırdan büyük olmalı.");
            if (!taxRates.TryGetValue(line.TaxRateId, out var taxRate))
                throw new InvalidOperationException($"Satır {lineNo}: geçersiz KDV oranı.");

            var lineType = line.ItemId.HasValue ? "STOK" : "HIZMET";
            if (line.ServiceDefinitionId.HasValue && !services.ContainsKey(line.ServiceDefinitionId.Value))
                throw new InvalidOperationException($"Satır {lineNo}: geçersiz hizmet tanımı.");

            var net = Math.Round(line.Quantity * line.UnitPrice, 2, MidpointRounding.AwayFromZero);
            var taxAmount = Math.Round(net * taxRate.Rate / 100m, 2, MidpointRounding.AwayFromZero);

            db.SvcTicketLines.Add(new SvcTicketLine
            {
                TicketId = id,
                LineNo = lineNo++,
                LineType = lineType,
                ServiceDefinitionId = line.ServiceDefinitionId,
                ItemId = line.ItemId,
                Description = line.Description.Trim(),
                Quantity = line.Quantity,
                UnitId = line.UnitId,
                UnitPrice = line.UnitPrice,
                TaxRateId = line.TaxRateId,
                TaxAmount = taxAmount,
                LineTotal = net + taxAmount,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<SvcTicketDetailDto?> UpdateStatusAsync(long id, UpdateSvcTicketStatusRequest request, CancellationToken ct = default)
    {
        var status = NormalizeStatus(request.Status);

        var db = Db;
        var ticket = await db.SvcTickets
            .Include(t => t.Account)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);

        if (ticket is null) return null;

        ticket.Status = status;
        if (status is "COMPLETED" or "DELIVERED")
            ticket.ClosedAt ??= DateTime.UtcNow;
        else
            ticket.ClosedAt = null;

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var ticket = await db.SvcTickets
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);

        if (ticket is null) return false;

        ticket.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<ConvertSvcToInvoiceResultDto> ConvertToInvoiceAsync(
        long id,
        ConvertSvcToInvoiceRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var ticket = await LoadTicketWithLinesAsync(id, ct)
            ?? throw new InvalidOperationException("Servis kaydı bulunamadı.");

        if (ticket.InvoiceId.HasValue)
            throw new InvalidOperationException("Bu servis kaydı zaten faturalandırılmış.");

        if (ticket.Status is not ("COMPLETED" or "DELIVERED"))
            throw new InvalidOperationException("Faturalandırma için servis tamamlanmış veya teslim edilmiş olmalı.");

        var paymentMethod = NormalizeSvcPaymentMethod(request.PaymentMethod);
        var paymentStatus = paymentMethod == "NAKIT" ? "ODENDI" : "BEKLIYOR";

        List<ConvertSvcToInvoiceLineRequest> sourceLines;
        if (request.Lines is { Count: > 0 })
            sourceLines = request.Lines.ToList();
        else if (ticket.Lines.Count > 0)
            sourceLines = ticket.Lines.Select(l => new ConvertSvcToInvoiceLineRequest(
                l.ItemId,
                l.Description,
                l.Quantity,
                l.UnitId,
                l.UnitPrice,
                l.TaxRateId)).ToList();
        else
            throw new InvalidOperationException("Faturalandırma için en az bir kalem gerekli.");

        var dueDays = ticket.Account.DueDays ?? 30;
        var documentDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var dueDate = paymentStatus == "ODENDI" ? documentDate : documentDate.AddDays(dueDays);

        var invoice = await invInvoiceService.CreateAsync(new CreateInvInvoiceRequest(
            "SALES",
            ticket.AccountId,
            documentDate,
            dueDate,
            $"Servis: {ticket.TicketNo}" + (ticket.DeviceName is not null ? $" — {ticket.DeviceName}" : ""),
            sourceLines.Select(l => new CreateInvInvoiceLineRequest(
                l.ItemId,
                l.Description,
                l.Quantity,
                l.UnitId,
                l.UnitPrice,
                l.TaxRateId)).ToList(),
            paymentStatus), ct);

        ticket.InvoiceId = invoice.Id;
        await db.SaveChangesAsync(ct);

        return new ConvertSvcToInvoiceResultDto(ticket.Id, invoice.Id, invoice.DocumentNo);
    }

    private async Task<SvcTicket?> LoadTicketWithLinesAsync(long id, CancellationToken ct)
    {
        return await Db.SvcTickets.AsNoTracking()
            .Include(t => t.Account)
            .Include(t => t.Lines.Where(l => !l.IsDeleted))
                .ThenInclude(l => l.ServiceDefinition)
            .Include(t => t.Lines.Where(l => !l.IsDeleted))
                .ThenInclude(l => l.Item)
            .Include(t => t.Lines.Where(l => !l.IsDeleted))
                .ThenInclude(l => l.Unit)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
    }

    private static SvcTicketDetailDto MapDetail(SvcTicket t)
    {
        var lines = t.Lines
            .Where(l => !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .Select(MapLine)
            .ToList();

        var subtotal = lines.Sum(l => l.LineTotal - l.TaxAmount);
        var taxTotal = lines.Sum(l => l.TaxAmount);
        var (statusKey, statusLabel) = MapStatus(t.Status);
        var (priorityKey, priorityLabel) = MapPriority(t.Priority);

        return new SvcTicketDetailDto(
            t.Id,
            t.TicketNo,
            t.TicketDate,
            t.AccountId,
            t.Account.Title,
            t.DeviceName,
            t.ProblemDescription,
            t.TechnicianName,
            priorityKey,
            priorityLabel,
            statusKey,
            statusLabel,
            t.Resolution,
            t.ClosedAt,
            t.InvoiceId,
            subtotal,
            taxTotal,
            subtotal + taxTotal,
            lines);
    }

    private static SvcTicketLineDto MapLine(SvcTicketLine l) => new(
        l.LineNo,
        l.LineType,
        l.ServiceDefinitionId,
        l.ItemId,
        l.Description,
        l.ServiceDefinition?.Name,
        l.Item?.Name,
        l.Unit?.Name ?? "",
        l.Quantity,
        l.UnitPrice,
        l.TaxRateId,
        l.TaxAmount,
        l.LineTotal);

    private static SvcTicketListItemDto MapListItem(SvcTicket t)
    {
        var (key, label) = MapStatus(t.Status);
        return new SvcTicketListItemDto(
            t.Id,
            t.TicketNo,
            t.TicketDate,
            t.Account.Title,
            t.DeviceName,
            t.ProblemDescription,
            t.TechnicianName,
            key,
            label);
    }

    private static async Task<string> GenerateTicketNoAsync(TenantDbContext db, CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var pattern = $"SRV-{year}-";
        var lastNo = await db.SvcTickets.AsNoTracking()
            .Where(t => !t.IsDeleted && t.TicketNo.StartsWith(pattern))
            .OrderByDescending(t => t.TicketNo)
            .Select(t => t.TicketNo)
            .FirstOrDefaultAsync(ct);

        var seq = 1;
        if (lastNo is not null && int.TryParse(lastNo.Split('-')[^1], out var parsed))
            seq = parsed + 1;

        return $"{pattern}{seq:D4}";
    }

    private static string NormalizePriority(string priority) => priority.ToUpperInvariant() switch
    {
        "LOW" or "DUSUK" => "LOW",
        "HIGH" or "YUKSEK" => "HIGH",
        "URGENT" or "ACIL" => "URGENT",
        _ => "NORMAL",
    };

    private static string NormalizeStatus(string status) => status.ToUpperInvariant() switch
    {
        "WAITING" or "BEKLEMEDE" => "WAITING",
        "IN_PROGRESS" or "ISLEMDE" => "IN_PROGRESS",
        "COMPLETED" or "TAMAMLANDI" => "COMPLETED",
        "DELIVERED" or "TESLIM" => "DELIVERED",
        _ => throw new InvalidOperationException("Geçerli durum: WAITING, IN_PROGRESS, COMPLETED, DELIVERED"),
    };

    private static string NormalizeSvcPaymentMethod(string method) => method.ToUpperInvariant() switch
    {
        "NAKIT" or "CASH" => "NAKIT",
        "VERESIYE" or "CREDIT" or "ACIK" => "VERESIYE",
        _ => throw new InvalidOperationException("Geçerli ödeme yöntemi: NAKIT veya VERESIYE"),
    };

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "WAITING" => ("beklemede", "Beklemede"),
        "IN_PROGRESS" => ("islemde", "İşlemde"),
        "COMPLETED" => ("tamamlandi", "Tamamlandı"),
        "DELIVERED" => ("teslim", "Teslim Edildi"),
        _ => ("beklemede", status),
    };

    private static (string Key, string Label) MapPriority(string priority) => priority switch
    {
        "LOW" => ("dusuk", "Düşük"),
        "HIGH" => ("yuksek", "Yüksek"),
        "URGENT" => ("acil", "Acil"),
        _ => ("normal", "Normal"),
    };
}
