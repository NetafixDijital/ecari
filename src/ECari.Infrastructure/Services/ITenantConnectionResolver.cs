namespace ECari.Infrastructure.Services;

public interface ITenantConnectionResolver
{
    string? GetDatabaseName();
    long? GetOrgUserId();
    long? GetUserId();
    long? GetCompanyId();
    bool HasTenantContext();
}
