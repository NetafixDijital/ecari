namespace ECari.Infrastructure.Integrations.Edm;

public class EdmOptions
{
    public const string SectionName = "Edm";

    public string ApplicationName { get; set; } = "ECARI";
    public string ChannelName { get; set; } = "ECARI";
    public string Hostname { get; set; } = "ecari.local";
    public string Reason { get; set; } = "EFATURA ENTEGRASYON";
}
