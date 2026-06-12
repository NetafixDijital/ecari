using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/svc")]
[Authorize]
public class SvcController(SvcTicketService svcService, ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("tickets")]
    public async Task<ActionResult<IReadOnlyList<SvcTicketListItemDto>>> List(
        [FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await svcService.ListAsync(status, search, ct));
    }

    [HttpPost("tickets")]
    public async Task<ActionResult<SvcTicketListItemDto>> Create(
        [FromBody] CreateSvcTicketRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await svcService.CreateAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
