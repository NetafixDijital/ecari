using ECari.Infrastructure.Auth;
using ECari.Infrastructure.Data;
using ECari.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECari.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        var systemConnection = configuration.GetConnectionString("SystemDb")
            ?? throw new InvalidOperationException("SystemDb connection string is not configured.");

        services.AddDbContext<SystemDbContext>(options =>
            options.UseSqlServer(systemConnection));

        services.AddSingleton<TenantDbContextFactory>();
        services.AddScoped<AuthService>();
        services.AddScoped<AuthUserService>();
        services.AddScoped<CariAccountService>();
        services.AddScoped<StkItemService>();
        services.AddScoped<CoreLookupService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<CfgService>();
        services.AddScoped<InvInvoiceService>();
        services.AddScoped<DlnDeliveryNoteService>();
        services.AddScoped<OrdOrderService>();
        services.AddScoped<QotQuotationService>();
        services.AddScoped<BnkAccountService>();
        services.AddScoped<ChqInstrumentService>();
        services.AddScoped<StkMovementService>();
        services.AddScoped<ExpExpenseService>();
        services.AddScoped<SvcDefinitionService>();
        services.AddScoped<SvcTicketService>();
        services.AddScoped<TskTaskService>();
        services.AddScoped<CshAccountService>();
        services.AddScoped<GlobalSearchService>();
        services.AddScoped<JwtTokenService>();

        return services;
    }
}
