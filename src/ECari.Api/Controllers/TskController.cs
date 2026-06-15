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

    [HttpGet("tasks/{id:long}")]
    public async Task<ActionResult<TskTaskListItemDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        var item = await tskService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();
        return Ok(item);
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

    [HttpPut("tasks/{id:long}")]
    public async Task<ActionResult<TskTaskListItemDto>> Update(
        long id, [FromBody] UpdateTskTaskRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await tskService.UpdateAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("tasks/{id:long}/status")]
    public async Task<ActionResult<TskTaskListItemDto>> UpdateStatus(
        long id, [FromBody] UpdateTskTaskStatusRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await tskService.UpdateStatusAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("tasks/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        if (!await tskService.DeleteAsync(id, ct)) return NotFound();
        return NoContent();
    }
}
