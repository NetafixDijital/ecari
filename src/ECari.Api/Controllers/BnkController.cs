using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/bnk")]
[Authorize]
public class BnkController(
    BnkAccountService bnkService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("accounts")]
    public async Task<ActionResult<IReadOnlyList<BnkAccountListItemDto>>> List(
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await bnkService.ListAsync(search, ct));
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<IReadOnlyList<BnkTransactionListItemDto>>> Transactions(
        [FromQuery] long? bankAccountId,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await bnkService.ListTransactionsAsync(bankAccountId, ct));
    }

    [HttpPost("collections")]
    public async Task<IActionResult> Collection(
        [FromBody] BnkPaymentRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            await bnkService.RecordIncomingAsync(request, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("payments")]
    public async Task<IActionResult> Payment(
        [FromBody] BnkPaymentRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            await bnkService.RecordOutgoingAsync(request, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
