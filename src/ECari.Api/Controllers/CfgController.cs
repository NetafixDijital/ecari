using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/cfg")]
[Authorize]
public class CfgController(
    CfgService cfgService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("company-profile")]
    public async Task<ActionResult<CompanyProfileDto>> GetCompanyProfile(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();

        var profile = await cfgService.GetCompanyProfileAsync(ct);
        if (profile is null)
            return NotFound(new { message = "Şirket profili bulunamadı." });

        return Ok(profile);
    }

    [HttpPut("company-profile")]
    public async Task<ActionResult<CompanyProfileDto>> UpdateCompanyProfile(
        [FromBody] UpdateCompanyProfileRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await cfgService.UpdateCompanyProfileAsync(request, ct));
    }

    [HttpGet("warehouses")]
    public async Task<ActionResult<IReadOnlyList<WarehouseDto>>> Warehouses(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await cfgService.GetWarehousesAsync(ct));
    }

    [HttpGet("module-settings")]
    public async Task<ActionResult<IReadOnlyList<ModuleSettingDto>>> ModuleSettings(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await cfgService.GetModuleSettingsAsync(ct));
    }

    [HttpPut("module-settings")]
    public async Task<ActionResult<IReadOnlyList<ModuleSettingDto>>> UpdateModuleSettings(
        [FromBody] UpdateModuleSettingsRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(await cfgService.UpdateModuleSettingsAsync(request, ct));
    }

    private BadRequestObjectResult TenantRequired() =>
        BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });
}
