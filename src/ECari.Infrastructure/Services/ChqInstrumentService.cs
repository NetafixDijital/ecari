using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class ChqInstrumentService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<ChqInstrumentListItemDto>> ListAsync(
        string direction,
        string? search,
        CancellationToken ct = default)
    {
        var normalizedDirection = NormalizeDirection(direction)
            ?? throw new ArgumentException("Geçerli direction: RECEIVED veya ISSUED");

        var db = Db;
        var query = db.ChqInstruments.AsNoTracking()
            .Include(i => i.Account)
            .Where(i => !i.IsDeleted && i.Direction == normalizedDirection);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i =>
                i.InstrumentNo.Contains(term) ||
                i.Account.Title.Contains(term) ||
                (i.BankName != null && i.BankName.Contains(term)));
        }

        var items = await query
            .OrderBy(i => i.DueDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync(ct);

        return items.Select(MapItem).ToList();
    }

    public async Task<ChqInstrumentStatsDto> GetStatsAsync(
        string? direction,
        CancellationToken ct = default)
    {
        var query = Db.ChqInstruments.AsNoTracking().Where(i => !i.IsDeleted);
        if (!string.IsNullOrWhiteSpace(direction))
        {
            var normalized = NormalizeDirection(direction);
            if (normalized is not null)
                query = query.Where(i => i.Direction == normalized);
        }

        var items = await query.ToListAsync(ct);
        var pending = items.Where(i => i.Status is "PENDING" or "PORTFOLIO").ToList();
        var completed = items.Where(i => i.Status is "COLLECTED" or "PAID").ToList();

        return new ChqInstrumentStatsDto(
            items.Count,
            items.Sum(i => i.Amount),
            pending.Count,
            pending.Sum(i => i.Amount),
            completed.Count,
            completed.Sum(i => i.Amount));
    }

    public async Task<ChqInstrumentListItemDto> CreateAsync(
        CreateChqInstrumentRequest request,
        CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");
        if (string.IsNullOrWhiteSpace(request.InstrumentNo))
            throw new InvalidOperationException("Çek/senet numarası zorunlu.");

        var direction = NormalizeDirection(request.Direction)
            ?? throw new InvalidOperationException("Geçerli direction: RECEIVED veya ISSUED");

        var instrumentType = request.InstrumentType.ToUpperInvariant() switch
        {
            "CEK" or "CHECK" => "CEK",
            "SENET" or "NOTE" => "SENET",
            _ => throw new InvalidOperationException("Geçerli instrumentType: CEK veya SENET"),
        };

        var db = Db;
        var account = await db.CariAccounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var portfolioType = direction;
        var portfolio = await db.ChqPortfolios.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PortfolioType == portfolioType && p.IsActive, ct)
            ?? throw new InvalidOperationException("Çek portföyü tanımlı değil. 08-faz3-chq.sql çalıştırın.");

        var currencyId = await db.Currencies.AsNoTracking()
            .Where(c => c.Code == "TRY")
            .Select(c => c.Id)
            .FirstOrDefaultAsync(ct);
        if (currencyId == 0)
            currencyId = await db.Currencies.AsNoTracking().Select(c => c.Id).FirstAsync(ct);

        var entity = new ChqInstrument
        {
            InstrumentType = instrumentType,
            Direction = direction,
            PortfolioId = portfolio.Id,
            AccountId = account.Id,
            BankName = string.IsNullOrWhiteSpace(request.BankName) ? null : request.BankName.Trim(),
            InstrumentNo = request.InstrumentNo.Trim(),
            IssueDate = request.IssueDate,
            DueDate = request.DueDate,
            Amount = request.Amount,
            CurrencyId = currencyId,
            Status = "PENDING",
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        db.ChqInstruments.Add(entity);
        await db.SaveChangesAsync(ct);

        entity.Account = account;
        return MapItem(entity);
    }

    private static ChqInstrumentListItemDto MapItem(ChqInstrument i)
    {
        var (key, label) = MapStatus(i.Status);
        return new ChqInstrumentListItemDto(
            i.Id,
            i.InstrumentType,
            i.Direction,
            i.InstrumentNo,
            i.Account.Title,
            i.BankName,
            i.IssueDate,
            i.DueDate,
            i.Amount,
            key,
            label);
    }

    private static string? NormalizeDirection(string direction) =>
        direction.ToUpperInvariant() switch
        {
            "RECEIVED" or "TAHSILAT" => "RECEIVED",
            "ISSUED" or "ODEME" => "ISSUED",
            _ => null,
        };

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "PENDING" => ("pending", "Beklemede"),
        "PORTFOLIO" => ("portfolio", "Portföyde"),
        "COLLECTED" => ("collected", "Tahsil edildi"),
        "PAID" => ("paid", "Ödendi"),
        "BOUNCED" => ("bounced", "Karşılıksız"),
        "ENDORSED" => ("endorsed", "Ciro edildi"),
        _ => ("pending", "Beklemede"),
    };
}
