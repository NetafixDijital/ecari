namespace ECari.Domain.Entities.Tenant;

public class SvcServiceDefinition
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long? DefaultTaxRateId { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public bool IsDeleted { get; set; }
}

public class SvcTicketLine
{
    public long Id { get; set; }
    public long TicketId { get; set; }
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

    public SvcTicket Ticket { get; set; } = null!;
    public SvcServiceDefinition? ServiceDefinition { get; set; }
    public StkItem? Item { get; set; }
    public StkUnit? Unit { get; set; }
    public CoreTaxRate? TaxRate { get; set; }
}
