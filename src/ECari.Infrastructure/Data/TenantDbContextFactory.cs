using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ECari.Infrastructure.Data;

public class TenantDbContextFactory(IConfiguration configuration)
{
    public TenantDbContext Create(string databaseName)
    {
        var template = configuration.GetConnectionString("TenantDbTemplate")
            ?? throw new InvalidOperationException("TenantDbTemplate connection string is not configured.");

        var connectionString = string.Format(template, databaseName);
        var options = new DbContextOptionsBuilder<TenantDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new TenantDbContext(options);
    }
}
