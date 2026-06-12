using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/chq")]
[Authorize]
public class ChqController(
    ChqInstrumentService chqService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("instruments")]
    public async Task<ActionResult<IReadOnlyList<ChqInstrumentListItemDto>>> List(
        [FromQuery] string direction,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await chqService.ListAsync(direction, search, ct));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ChqInstrumentStatsDto>> Stats(
        [FromQuery] string? direction,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await chqService.GetStatsAsync(direction, ct));
    }

    [HttpPost("instruments")]
    public async Task<ActionResult<ChqInstrumentListItemDto>> Create(
        [FromBody] CreateChqInstrumentRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await chqService.CreateAsync(request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
