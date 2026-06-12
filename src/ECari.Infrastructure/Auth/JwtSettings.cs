namespace ECari.Infrastructure.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ecari.local";
    public string Audience { get; set; } = "ecari.local";
    public int AccessTokenMinutes { get; set; } = 60;
}
