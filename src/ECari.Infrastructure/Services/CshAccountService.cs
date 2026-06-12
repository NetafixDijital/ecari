using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class CshAccountService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<CshAccountListItemDto>> ListAsync(
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.CshAccounts.AsNoTracking().Where(a => !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a => a.Name.Contains(term) || a.Code.Contains(term));
        }

        var accounts = await query.OrderBy(a => a.Code).ToListAsync(ct);
        var accountIds = accounts.Select(a => a.Id).ToList();

        var txSums = await db.CshTransactions.AsNoTracking()
            .Where(t => !t.IsDeleted && accountIds.Contains(t.CashAccountId))
            .GroupBy(t => t.CashAccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Net = g.Sum(t => t.TransactionType == "IN" ? t.Amount : -t.Amount),
            })
            .ToDictionaryAsync(x => x.AccountId, x => x.Net, ct);

        return accounts.Select(a =>
        {
            var net = txSums.TryGetValue(a.Id, out var n) ? n : 0m;
            return new CshAccountListItemDto(
                a.Id,
                a.Code,
                a.Name,
                a.CashType,
                a.OpeningBalance + net,
                a.IsActive);
        }).ToList();
    }

    public async Task RecordCollectionAsync(CshPaymentRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        await RecordPaymentCoreAsync(request, isCollection: true, ct);
    }

    public async Task RecordPaymentAsync(CshPaymentRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        await RecordPaymentCoreAsync(request, isCollection: false, ct);
    }

    private async Task RecordPaymentCoreAsync(CshPaymentRequest request, bool isCollection, CancellationToken ct)
    {
        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var cashAccount = await db.CshAccounts
            .FirstOrDefaultAsync(a => a.Id == request.CashAccountId && !a.IsDeleted && a.IsActive, ct)
            ?? throw new InvalidOperationException("Kasa hesabı bulunamadı.");

        var refNo = $"CSH-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var description = request.Description?.Trim()
            ?? (isCollection ? "Tahsilat" : "Tediye");

        db.CshTransactions.Add(new CshTransaction
        {
            CashAccountId = cashAccount.Id,
            TransactionDate = request.TransactionDate,
            TransactionType = isCollection ? "IN" : "OUT",
            Amount = request.Amount,
            Description = description,
            ReferenceNo = refNo,
            CreatedAt = DateTime.UtcNow,
        });

        db.CariMovements.Add(new CariMovement
        {
            AccountId = account.Id,
            MovementDate = request.TransactionDate,
            MovementType = isCollection ? "COLLECTION" : "PAYMENT",
            Debit = isCollection ? 0 : request.Amount,
            Credit = isCollection ? request.Amount : 0,
            CurrencyId = account.CurrencyId,
            DocumentModule = "CSH",
            DocumentNo = refNo,
            Description = description,
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
}
