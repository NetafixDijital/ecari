namespace ECari.Domain.Entities.Tenant;

public class CfgModuleSetting
{
    public long Id { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string DataType { get; set; } = "STRING";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
