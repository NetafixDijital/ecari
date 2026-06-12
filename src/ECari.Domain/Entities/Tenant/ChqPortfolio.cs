namespace ECari.Domain.Entities.Tenant;

public class ChqPortfolio
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PortfolioType { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
