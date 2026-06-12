namespace ECari.Domain.Entities.Tenant;

public class ExpExpense
{
    public long Id { get; set; }
    public string DocumentNo { get; set; } = string.Empty;
    public DateOnly ExpenseDate { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public long CurrencyId { get; set; }
    public string? RequesterName { get; set; }
    public string ApprovalStatus { get; set; } = "PENDING";
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
