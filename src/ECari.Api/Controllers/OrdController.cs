using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/ord")]
[Authorize]
public class OrdController(
    OrdOrderService ordService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<OrdOrderListItemDto>>> List(
        [FromQuery] string? type,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        string? orderType = type?.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            null or "" => null,
            _ => null,
        };

        if (type is not null and not "" && orderType is null)
            return BadRequest(new { message = "Geçerli type: SALES veya PURCHASE" });

        return Ok(await ordService.ListAsync(orderType, search, ct));
    }

    [HttpGet("orders/{id:long}")]
    public async Task<ActionResult<OrdOrderDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await ordService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();

        return Ok(item);
    }

    [HttpPost("orders")]
    public async Task<ActionResult<OrdOrderDetailDto>> Create(
        [FromBody] CreateOrdOrderRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await ordService.CreateAsync(request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
