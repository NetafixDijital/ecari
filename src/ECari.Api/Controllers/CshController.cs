using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/csh")]
[Authorize]
public class CshController(
    CshAccountService cshService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("accounts")]
    public async Task<ActionResult<IReadOnlyList<CshAccountListItemDto>>> List(
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await cshService.ListAsync(search, ct));
    }

    [HttpGet("movements")]
    public async Task<ActionResult<IReadOnlyList<CshTransactionListItemDto>>> Movements(
        [FromQuery] long? cashAccountId,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await cshService.ListMovementsAsync(cashAccountId, search, ct));
    }

    [HttpPost("collections")]
    public async Task<IActionResult> Collection([FromBody] CshPaymentRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            await cshService.RecordCollectionAsync(request, ct);
            return Ok(new { message = "Tahsilat kaydedildi." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("payments")]
    public async Task<IActionResult> Payment([FromBody] CshPaymentRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            await cshService.RecordPaymentAsync(request, ct);
            return Ok(new { message = "Tediye kaydedildi." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
