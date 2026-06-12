using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class BnkAccountService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<BnkAccountListItemDto>> ListAsync(
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.BnkAccounts.AsNoTracking()
            .Include(a => a.Bank)
            .Where(a => !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a =>
                a.AccountName.Contains(term) ||
                a.Code.Contains(term) ||
                a.Iban.Contains(term) ||
                a.Bank.Name.Contains(term));
        }

        var accounts = await query.OrderBy(a => a.Code).ToListAsync(ct);
        var accountIds = accounts.Select(a => a.Id).ToList();

        var txSums = await db.BnkTransactions.AsNoTracking()
            .Where(t => !t.IsDeleted && accountIds.Contains(t.BankAccountId))
            .GroupBy(t => t.BankAccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Net = g.Sum(t => t.TransactionType == "INCOMING" ? t.Amount : -t.Amount),
            })
            .ToDictionaryAsync(x => x.AccountId, x => x.Net, ct);

        return accounts.Select(a =>
        {
            var net = txSums.TryGetValue(a.Id, out var n) ? n : 0m;
            return new BnkAccountListItemDto(
                a.Id,
                a.Code,
                a.Bank.Name,
                a.AccountName,
                a.Iban,
                a.OpeningBalance + net,
                a.IsActive);
        }).ToList();
    }

    public async Task<IReadOnlyList<BnkTransactionListItemDto>> ListTransactionsAsync(
        long? bankAccountId,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.BnkTransactions.AsNoTracking()
            .Include(t => t.BankAccount)
            .Include(t => t.Account)
            .Where(t => !t.IsDeleted);

        if (bankAccountId.HasValue)
            query = query.Where(t => t.BankAccountId == bankAccountId.Value);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .Take(200)
            .ToListAsync(ct);

        return items.Select(t => new BnkTransactionListItemDto(
            t.Id,
            t.BankAccountId,
            t.BankAccount.AccountName,
            t.TransactionDate,
            t.TransactionType,
            MapTransactionTypeLabel(t.TransactionType),
            t.Account?.Title,
            t.Amount,
            t.ReferenceNo,
            t.Description)).ToList();
    }

    public async Task RecordIncomingAsync(BnkPaymentRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        await RecordPaymentCoreAsync(request, isIncoming: true, ct);
    }

    public async Task RecordOutgoingAsync(BnkPaymentRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        await RecordPaymentCoreAsync(request, isIncoming: false, ct);
    }

    private async Task RecordPaymentCoreAsync(BnkPaymentRequest request, bool isIncoming, CancellationToken ct)
    {
        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var bankAccount = await db.BnkAccounts
            .FirstOrDefaultAsync(a => a.Id == request.BankAccountId && !a.IsDeleted && a.IsActive, ct)
            ?? throw new InvalidOperationException("Banka hesabı bulunamadı.");

        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var refNo = $"BNK-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var description = request.Description?.Trim()
            ?? (isIncoming ? "Banka tahsilat" : "Banka ödeme");

        db.BnkTransactions.Add(new BnkTransaction
        {
            BankAccountId = bankAccount.Id,
            TransactionDate = request.TransactionDate,
            TransactionType = isIncoming ? "INCOMING" : "OUTGOING",
            AccountId = account.Id,
            Amount = request.Amount,
            CurrencyId = bankAccount.CurrencyId,
            ReferenceNo = refNo,
            Description = description,
            CreatedAt = DateTime.UtcNow,
        });

        db.CariMovements.Add(new CariMovement
        {
            AccountId = account.Id,
            MovementDate = request.TransactionDate,
            MovementType = isIncoming ? "COLLECTION" : "PAYMENT",
            Debit = isIncoming ? 0 : request.Amount,
            Credit = isIncoming ? request.Amount : 0,
            CurrencyId = account.CurrencyId,
            DocumentModule = "BNK",
            DocumentNo = refNo,
            Description = description,
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    private static string MapTransactionTypeLabel(string type) => type switch
    {
        "INCOMING" => "Gelen",
        "OUTGOING" => "Giden",
        "TRANSFER" => "Virman",
        _ => type,
    };
}
