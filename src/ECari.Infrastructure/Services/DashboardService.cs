using ECari.Domain.Dtos;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class DashboardService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var db = Db;
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var invoices = await db.InvInvoices.AsNoTracking()
            .Include(i => i.Account)
            .Where(i => !i.IsDeleted)
            .ToListAsync(ct);

        var sales = invoices.Where(i => i.InvoiceType == "SALES").ToList();
        var purchases = invoices.Where(i => i.InvoiceType == "PURCHASE").ToList();

        var totalIncome = sales.Sum(i => i.GrandTotal);
        var totalExpense = purchases.Sum(i => i.GrandTotal);
        var pendingCount = sales.Count(i => i.PaymentStatus != "ODENDI");
        var paidCount = sales.Count(i => i.PaymentStatus == "ODENDI");
        var overdueCount = sales.Count(i =>
            i.PaymentStatus != "ODENDI" &&
            i.DueDate.HasValue &&
            i.DueDate.Value < today);

        var salesTotal = sales.Count;
        var paidPercent = salesTotal == 0 ? 0m : Math.Round(paidCount * 100m / salesTotal, 1);
        var overduePercent = salesTotal == 0 ? 0m : Math.Round(overdueCount * 100m / salesTotal, 1);

        var monthIncome = sales
            .Where(i => i.DocumentDate >= monthStart && i.DocumentDate <= today)
            .Sum(i => i.GrandTotal);
        var todayIncome = sales
            .Where(i => i.DocumentDate == today)
            .Sum(i => i.GrandTotal);

        var balances = await db.CariAccountBalances.AsNoTracking().ToListAsync(ct);
        var receivableAccounts = balances.Count(b => b.Balance > 0);
        var totalReceivable = balances.Where(b => b.Balance > 0).Sum(b => b.Balance);

        var recentTransactions = invoices
            .OrderByDescending(i => i.DocumentDate)
            .ThenByDescending(i => i.Id)
            .Take(8)
            .Select(i =>
            {
                var (key, label) = MapPaymentStatus(i.PaymentStatus, i.DueDate);
                return new DashboardRecentTransactionDto(
                    i.Id,
                    i.Account.Title,
                    i.DocumentDate.ToString("yyyy-MM-dd"),
                    $"{(i.InvoiceType == "SALES" ? "Satış" : "Alış")} Faturası {i.DocumentNo}",
                    i.InvoiceType == "SALES" ? "gelir" : "gider",
                    i.GrandTotal,
                    key,
                    label);
            })
            .ToList();

        var dueItems = sales
            .Where(i => i.PaymentStatus != "ODENDI" && i.DueDate.HasValue)
            .OrderBy(i => i.DueDate)
            .Take(5)
            .Select(i =>
            {
                var (key, label) = MapPaymentStatus(i.PaymentStatus, i.DueDate);
                var hint = key switch
                {
                    "vadesi_gecmis" => "Vadesi geçti",
                    "bekliyor" when i.DueDate!.Value <= today.AddDays(3) =>
                        $"{(i.DueDate.Value.DayNumber - today.DayNumber)} gün kaldı",
                    "bekliyor" => label,
                    _ => label
                };
                return new DashboardDueItemDto(
                    i.Id,
                    i.DocumentNo,
                    i.Account.Title,
                    i.DueDate?.ToString("yyyy-MM-dd"),
                    i.GrandTotal,
                    key,
                    hint);
            })
            .ToList();

        var recentTasks = await db.TskTasks.AsNoTracking()
            .Where(t => !t.IsDeleted && t.Status != "COMPLETED")
            .OrderBy(t => t.EndDate)
            .ThenByDescending(t => t.Id)
            .Take(3)
            .Select(t => new DashboardTaskItemDto(
                t.Id,
                t.Title,
                t.Status,
                t.EndDate.ToString("yyyy-MM-dd")))
            .ToListAsync(ct);

        return new DashboardSummaryDto(
            totalIncome,
            totalExpense,
            totalIncome - totalExpense,
            pendingCount,
            salesTotal,
            receivableAccounts,
            totalReceivable,
            paidPercent,
            overduePercent,
            monthIncome,
            todayIncome,
            recentTransactions,
            dueItems,
            recentTasks);
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
