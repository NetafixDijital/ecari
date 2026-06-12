using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/core")]
[Authorize]
public class CoreController(
    CoreLookupService coreService,
    DashboardService dashboardService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryDto>> Dashboard(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await dashboardService.GetSummaryAsync(ct));
    }

    [HttpGet("currencies")]
    public async Task<ActionResult<IReadOnlyList<LookupItemDto>>> Currencies(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await coreService.GetCurrenciesAsync(ct));
    }

    [HttpGet("tax-rates")]
    public async Task<ActionResult<IReadOnlyList<TaxRateDto>>> TaxRates(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await coreService.GetTaxRatesAsync(ct));
    }

    [HttpGet("units")]
    public async Task<ActionResult<IReadOnlyList<LookupItemDto>>> Units(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await coreService.GetUnitsAsync(ct));
    }

    [HttpGet("cities")]
    public async Task<ActionResult<IReadOnlyList<CityDto>>> Cities(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await coreService.GetCitiesAsync(ct));
    }

    [HttpGet("cities/{cityId:long}/districts")]
    public async Task<ActionResult<IReadOnlyList<DistrictDto>>> Districts(long cityId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await coreService.GetDistrictsAsync(cityId, ct));
    }

    [HttpGet("payment-terms")]
    public async Task<ActionResult<IReadOnlyList<PaymentTermDto>>> PaymentTerms(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await coreService.GetPaymentTermsAsync(ct));
    }

    private BadRequestObjectResult TenantRequired() =>
        BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });
}
