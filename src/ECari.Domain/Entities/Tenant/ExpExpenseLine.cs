namespace ECari.Domain.Entities.Tenant;

public class ExpExpenseLine
{
    public long Id { get; set; }
    public long ExpenseId { get; set; }
    public int LineNo { get; set; }
    public string LineType { get; set; } = "HIZMET";
    public long? ServiceDefinitionId { get; set; }
    public long? ItemId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1m;
    public long UnitId { get; set; }
    public decimal UnitPrice { get; set; }
    public long TaxRateId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public ExpExpense Expense { get; set; } = null!;
    public ExpServiceDefinition? ServiceDefinition { get; set; }
}
