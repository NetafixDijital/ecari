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
    public async Task<ActionResult<IReadOnlyList<WarehouseDto>>> Warehouses(
        [FromQuery] bool activeOnly,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        return Ok(activeOnly
            ? await cfgService.GetActiveWarehousesAsync(ct)
            : await cfgService.GetWarehousesAsync(ct));
    }

    [HttpPost("warehouses")]
    public async Task<ActionResult<WarehouseDto>> CreateWarehouse(
        [FromBody] CreateWarehouseRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        try { return Ok(await cfgService.CreateWarehouseAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("warehouses/{id:long}")]
    public async Task<ActionResult<WarehouseDto>> UpdateWarehouse(
        long id,
        [FromBody] UpdateWarehouseRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        try
        {
            var updated = await cfgService.UpdateWarehouseAsync(id, request, ct);
            if (updated is null) return NotFound();
            return Ok(updated);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("warehouses/{id:long}")]
    public async Task<IActionResult> DeleteWarehouse(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return TenantRequired();
        try
        {
            if (!await cfgService.DeleteWarehouseAsync(id, ct)) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
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
