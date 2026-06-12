using System.Security.Claims;
using ECari.Infrastructure.Services;

namespace ECari.Api.Services;

public class HttpTenantConnectionResolver(IHttpContextAccessor httpContextAccessor) : ITenantConnectionResolver
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public string? GetDatabaseName() => User?.FindFirstValue("database_name");

    public long? GetOrgUserId() => ParseLong(User?.FindFirstValue("org_user_id"));

    public long? GetUserId() => ParseLong(User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User?.FindFirstValue("sub"));

    public long? GetCompanyId() => ParseLong(User?.FindFirstValue("company_id"));

    public bool HasTenantContext() => !string.IsNullOrEmpty(GetDatabaseName());

    private static long? ParseLong(string? value) =>
        long.TryParse(value, out var id) ? id : null;
}
