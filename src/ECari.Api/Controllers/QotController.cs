using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/qot")]
[Authorize]
public class QotController(
    QotQuotationService qotService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("quotations")]
    public async Task<ActionResult<IReadOnlyList<QotQuotationListItemDto>>> List(
        [FromQuery] string? type,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        string? documentType = type?.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            null or "" => null,
            _ => null,
        };

        if (type is not null and not "" && documentType is null)
            return BadRequest(new { message = "Geçerli type: SALES veya PURCHASE" });

        return Ok(await qotService.ListAsync(documentType, search, ct));
    }

    [HttpGet("quotations/{id:long}")]
    public async Task<ActionResult<QotQuotationDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await qotService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();

        return Ok(item);
    }

    [HttpPost("quotations")]
    public async Task<ActionResult<QotQuotationDetailDto>> Create(
        [FromBody] CreateQotQuotationRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await qotService.CreateAsync(request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("quotations/{id:long}/convert-to-order")]
    public async Task<ActionResult<ConvertQotToOrderResultDto>> ConvertToOrder(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await qotService.ConvertToOrderAsync(id, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("quotations/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            if (!await qotService.DeleteAsync(id, ct))
                return NotFound();

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
