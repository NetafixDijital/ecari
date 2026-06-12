namespace ECari.Domain.Entities.Tenant;

public class CoreCity
{
    public long Id { get; set; }
    public string? PlateCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class CoreDistrict
{
    public long Id { get; set; }
    public long CityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class CorePaymentTerm
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int DueDays { get; set; }
    public bool IsActive { get; set; } = true;
}
