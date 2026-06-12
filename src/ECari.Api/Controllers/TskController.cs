using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/tsk")]
[Authorize]
public class TskController(TskTaskService tskService, ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("tasks")]
    public async Task<ActionResult<IReadOnlyList<TskTaskListItemDto>>> List(
        [FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await tskService.ListAsync(status, search, ct));
    }

    [HttpGet("stats")]
    public async Task<ActionResult<TskTaskStatsDto>> Stats(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await tskService.GetStatsAsync(ct));
    }

    [HttpPost("tasks")]
    public async Task<ActionResult<TskTaskListItemDto>> Create(
        [FromBody] CreateTskTaskRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await tskService.CreateAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
