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
    [HttpGet("expenses")]
    public async Task<ActionResult<IReadOnlyList<ExpExpenseListItemDto>>> List(
        [FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await expService.ListAsync(status, search, ct));
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ExpenseStatsDto>> Stats(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await expService.GetStatsAsync(ct));
    }

    [HttpPost("expenses")]
    public async Task<ActionResult<ExpExpenseListItemDto>> Create(
        [FromBody] CreateExpExpenseRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await expService.CreateAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
