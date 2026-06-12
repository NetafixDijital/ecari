using ECari.Domain.Dtos;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class CoreLookupService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<LookupItemDto>> GetCurrenciesAsync(CancellationToken ct = default) =>
        await Db.Currencies.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Code)
            .Select(c => new LookupItemDto(c.Id, c.Code, c.Name))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<TaxRateDto>> GetTaxRatesAsync(CancellationToken ct = default) =>
        await Db.TaxRates.AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.Rate)
            .Select(t => new TaxRateDto(t.Id, t.Code, t.Name, t.Rate))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<LookupItemDto>> GetUnitsAsync(CancellationToken ct = default) =>
        await Db.StkUnits.AsNoTracking()
            .Where(u => u.IsActive)
            .OrderBy(u => u.Name)
            .Select(u => new LookupItemDto(u.Id, u.Code, u.Name))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<CityDto>> GetCitiesAsync(CancellationToken ct = default) =>
        await Db.Cities.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CityDto(c.Id, c.PlateCode, c.Name))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DistrictDto>> GetDistrictsAsync(long cityId, CancellationToken ct = default) =>
        await Db.Districts.AsNoTracking()
            .Where(d => d.CityId == cityId && d.IsActive)
            .OrderBy(d => d.Name)
            .Select(d => new DistrictDto(d.Id, d.CityId, d.Name))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<PaymentTermDto>> GetPaymentTermsAsync(CancellationToken ct = default) =>
        await Db.PaymentTerms.AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.DueDays)
            .Select(p => new PaymentTermDto(p.Id, p.Code, p.Name, p.DueDays))
            .ToListAsync(ct);
}
