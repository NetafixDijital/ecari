namespace ECari.Domain.Entities.Tenant;

public class ExpServiceDefinition
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryGroup { get; set; } = "genel";
    public long? DefaultTaxRateId { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
