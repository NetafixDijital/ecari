using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class ExpExpenseService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<ExpExpenseListItemDto>> ListAsync(
        string? status,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.ExpExpenses.AsNoTracking().Where(e => !e.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(e => e.ApprovalStatus == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(e =>
                e.DocumentNo.Contains(term) ||
                e.Description.Contains(term) ||
                (e.RequesterName != null && e.RequesterName.Contains(term)));
        }

        var items = await query.OrderByDescending(e => e.ExpenseDate).ThenByDescending(e => e.Id).ToListAsync(ct);
        return items.Select(e =>
        {
            var (key, label) = MapStatus(e.ApprovalStatus);
            return new ExpExpenseListItemDto(e.Id, e.DocumentNo, e.ExpenseDate, e.Category, e.Description, e.Amount, e.RequesterName, key, label);
        }).ToList();
    }

    public async Task<ExpenseStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var items = await Db.ExpExpenses.AsNoTracking().Where(e => !e.IsDeleted).ToListAsync(ct);
        return new ExpenseStatsDto(
            items.Count,
            items.Sum(e => e.Amount),
            items.Count(e => e.ApprovalStatus == "PENDING"),
            items.Count(e => e.ApprovalStatus == "APPROVED"),
            items.Count(e => e.ApprovalStatus == "PAID"));
    }

    public async Task<ExpExpenseListItemDto> CreateAsync(CreateExpExpenseRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        var db = Db;
        var currencyId = await db.Currencies.AsNoTracking()
            .Where(c => c.IsActive && c.Code == "TRY")
            .Select(c => c.Id)
            .FirstOrDefaultAsync(ct);

        if (currencyId == 0)
            currencyId = await db.Currencies.AsNoTracking().Where(c => c.IsActive).Select(c => c.Id).FirstAsync(ct);

        var documentNo = await GenerateDocumentNoAsync(db, request.ExpenseDate, ct);

        var entity = new ExpExpense
        {
            DocumentNo = documentNo,
            ExpenseDate = request.ExpenseDate,
            Category = request.Category.Trim(),
            Description = request.Description.Trim(),
            Amount = request.Amount,
            CurrencyId = currencyId,
            RequesterName = request.RequesterName?.Trim(),
            ApprovalStatus = "PENDING",
            PaymentMethod = request.PaymentMethod,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        db.ExpExpenses.Add(entity);
        await db.SaveChangesAsync(ct);

        var (key, label) = MapStatus(entity.ApprovalStatus);
        return new ExpExpenseListItemDto(entity.Id, entity.DocumentNo, entity.ExpenseDate, entity.Category, entity.Description, entity.Amount, entity.RequesterName, key, label);
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

        return $"{pattern}{seq:D3}";
    }

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "PENDING" => ("onay_bekliyor", "Onay Bekliyor"),
        "APPROVED" => ("onaylandi", "Onaylandı"),
        "PAID" => ("odendi", "Ödendi"),
        "REJECTED" => ("reddedildi", "Reddedildi"),
        _ => ("onay_bekliyor", status),
    };
}
