namespace ECari.Domain.Entities.Tenant;

public class ChqInstrument
{
    public long Id { get; set; }
    public string InstrumentType { get; set; } = "CEK";
    public string Direction { get; set; } = string.Empty;
    public long PortfolioId { get; set; }
    public long AccountId { get; set; }
    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public string? AccountNo { get; set; }
    public string InstrumentNo { get; set; } = string.Empty;
    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public decimal Amount { get; set; }
    public long CurrencyId { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public ChqPortfolio Portfolio { get; set; } = null!;
    public CariAccount Account { get; set; } = null!;
}
