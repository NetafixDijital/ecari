using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/exp")]
[Authorize]
public class ExpController(ExpExpenseService expService, ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("services")]
    public async Task<ActionResult<IReadOnlyList<ExpServiceDefinitionDto>>> ListServices(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await expService.ListServicesAsync(ct));
    }

    [HttpGet("expenses")]
    public async Task<ActionResult<IReadOnlyList<ExpExpenseListItemDto>>> List(
        [FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await expService.ListAsync(status, search, ct));
    }

    [HttpGet("expenses/{id:long}")]
    public async Task<ActionResult<ExpExpenseDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        var item = await expService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ExpenseStatsDto>> Stats(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await expService.GetStatsAsync(ct));
    }

    [HttpPost("expenses")]
    public async Task<ActionResult<ExpExpenseDetailDto>> Create(
        [FromBody] CreateExpExpenseRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await expService.CreateAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("expenses/{id:long}/status")]
    public async Task<ActionResult<ExpExpenseDetailDto>> UpdateStatus(
        long id, [FromBody] UpdateExpExpenseStatusRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await expService.UpdateStatusAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("expenses/{id:long}/pay")]
    public async Task<ActionResult<ExpExpenseDetailDto>> Pay(
        long id, [FromBody] PayExpExpenseRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await expService.PayAsync(id, request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
