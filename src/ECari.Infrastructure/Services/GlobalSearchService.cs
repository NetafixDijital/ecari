using ECari.Domain.Dtos;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class GlobalSearchService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<GlobalSearchResponseDto> SearchAsync(string? query, int limit = 20, CancellationToken ct = default)
    {
        var term = query?.Trim() ?? string.Empty;
        if (term.Length < 2)
            return new GlobalSearchResponseDto(term, Array.Empty<GlobalSearchResultItemDto>());

        var perModule = Math.Max(3, limit / 7);
        var results = new List<GlobalSearchResultItemDto>();
        var db = Db;

        var cariler = await db.CariAccounts.AsNoTracking()
            .Where(a => !a.IsDeleted && (a.Title.Contains(term) || a.Code.Contains(term)))
            .OrderBy(a => a.Title)
            .Take(perModule)
            .Select(a => new GlobalSearchResultItemDto("cari", a.Id, a.Title, a.Code, a.Code))
            .ToListAsync(ct);
        results.AddRange(cariler);

        var stok = await db.StkItems.AsNoTracking()
            .Where(i => !i.IsDeleted && (i.Name.Contains(term) || i.Code.Contains(term) || (i.Barcode != null && i.Barcode.Contains(term))))
            .OrderBy(i => i.Name)
            .Take(perModule)
            .Select(i => new GlobalSearchResultItemDto("stok", i.Id, i.Name, i.Code, i.Code))
            .ToListAsync(ct);
        results.AddRange(stok);

        var faturalar = await db.InvInvoices.AsNoTracking()
            .Include(i => i.Account)
            .Where(i => !i.IsDeleted && (i.DocumentNo.Contains(term) || i.Account.Title.Contains(term)))
            .OrderByDescending(i => i.DocumentDate)
            .Take(perModule)
            .Select(i => new GlobalSearchResultItemDto("fatura", i.Id, i.DocumentNo, i.Account.Title, i.DocumentNo))
            .ToListAsync(ct);
        results.AddRange(faturalar);

        var siparisler = await db.OrdOrders.AsNoTracking()
            .Include(o => o.Account)
            .Where(o => !o.IsDeleted && (o.DocumentNo.Contains(term) || o.Account.Title.Contains(term)))
            .OrderByDescending(o => o.DocumentDate)
            .Take(perModule)
            .Select(o => new GlobalSearchResultItemDto("siparis", o.Id, o.DocumentNo, o.Account.Title, o.DocumentNo))
            .ToListAsync(ct);
        results.AddRange(siparisler);

        var irsaliyeler = await db.DlnDeliveryNotes.AsNoTracking()
            .Include(n => n.Account)
            .Where(n => !n.IsDeleted && (n.DocumentNo.Contains(term) || n.Account.Title.Contains(term)))
            .OrderByDescending(n => n.DocumentDate)
            .Take(perModule)
            .Select(n => new GlobalSearchResultItemDto("irsaliye", n.Id, n.DocumentNo, n.Account.Title, n.DocumentNo))
            .ToListAsync(ct);
        results.AddRange(irsaliyeler);

        var teklifler = await db.QotQuotations.AsNoTracking()
            .Include(q => q.Account)
            .Where(q => !q.IsDeleted && (q.DocumentNo.Contains(term) || q.Account.Title.Contains(term)))
            .OrderByDescending(q => q.DocumentDate)
            .Take(perModule)
            .Select(q => new GlobalSearchResultItemDto("teklif", q.Id, q.DocumentNo, q.Account.Title, q.DocumentNo))
            .ToListAsync(ct);
        results.AddRange(teklifler);

        var masraflar = await db.ExpExpenses.AsNoTracking()
            .Where(e => !e.IsDeleted && (e.DocumentNo.Contains(term) || e.Description.Contains(term)))
            .OrderByDescending(e => e.ExpenseDate)
            .Take(perModule)
            .Select(e => new GlobalSearchResultItemDto("masraf", e.Id, e.DocumentNo, e.Description, e.DocumentNo))
            .ToListAsync(ct);
        results.AddRange(masraflar);

        var gorevler = await db.TskTasks.AsNoTracking()
            .Where(t => !t.IsDeleted && (t.TaskNo.Contains(term) || t.Title.Contains(term)))
            .OrderByDescending(t => t.EndDate)
            .Take(perModule)
            .Select(t => new GlobalSearchResultItemDto("gorev", t.Id, t.Title, t.TaskNo, t.TaskNo))
            .ToListAsync(ct);
        results.AddRange(gorevler);

        return new GlobalSearchResponseDto(term, results.Take(limit).ToList());
    }
}
