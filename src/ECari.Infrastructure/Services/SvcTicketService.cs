using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class SvcTicketService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

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
        return items.Select(t =>
        {
            var (key, label) = MapStatus(t.Status);
            return new SvcTicketListItemDto(t.Id, t.TicketNo, t.TicketDate, t.Account.Title, t.DeviceName, t.ProblemDescription, t.TechnicianName, key, label);
        }).ToList();
    }

    public async Task<SvcTicketListItemDto> CreateAsync(CreateSvcTicketRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ProblemDescription))
            throw new InvalidOperationException("Arıza açıklaması zorunlu.");

        var db = Db;
        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var ticketNo = await GenerateTicketNoAsync(db, ct);
        var priority = request.Priority.ToUpperInvariant() switch
        {
            "LOW" or "DUSUK" => "LOW",
            "HIGH" or "YUKSEK" => "HIGH",
            "URGENT" or "ACIL" => "URGENT",
            _ => "NORMAL",
        };

        var entity = new SvcTicket
        {
            TicketNo = ticketNo,
            TicketDate = DateTime.UtcNow,
            AccountId = account.Id,
            DeviceName = request.DeviceName?.Trim(),
            ProblemDescription = request.ProblemDescription.Trim(),
            TechnicianName = request.TechnicianName?.Trim(),
            Status = "WAITING",
            Priority = priority,
            CreatedAt = DateTime.UtcNow,
        };

        db.SvcTickets.Add(entity);
        await db.SaveChangesAsync(ct);

        var (key, label) = MapStatus(entity.Status);
        return new SvcTicketListItemDto(entity.Id, entity.TicketNo, entity.TicketDate, account.Title, entity.DeviceName, entity.ProblemDescription, entity.TechnicianName, key, label);
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

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "WAITING" => ("beklemede", "Beklemede"),
        "IN_PROGRESS" => ("islemde", "İşlemde"),
        "COMPLETED" => ("tamamlandi", "Tamamlandı"),
        "DELIVERED" => ("teslim", "Teslim Edildi"),
        _ => ("beklemede", status),
    };
}
