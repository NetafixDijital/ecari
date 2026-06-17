using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/dln")]
[Authorize]
public class DlnController(
    DlnDeliveryNoteService dlnService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("delivery-notes")]
    public async Task<ActionResult<IReadOnlyList<DlnDeliveryNoteListItemDto>>> List(
        [FromQuery] string type,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var documentType = type?.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            _ => null,
        };

        if (documentType is null)
            return BadRequest(new { message = "Geçerli type: SALES veya PURCHASE" });

        return Ok(await dlnService.ListAsync(documentType, search, ct));
    }

    [HttpGet("delivery-notes/{id:long}")]
    public async Task<ActionResult<DlnDeliveryNoteDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await dlnService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();

        return Ok(item);
    }

    [HttpPost("delivery-notes")]
    public async Task<ActionResult<DlnDeliveryNoteDetailDto>> Create(
        [FromBody] CreateDlnDeliveryNoteRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await dlnService.CreateAsync(request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("delivery-notes/{id:long}/dates")]
    public async Task<ActionResult<DlnDeliveryNoteDetailDto>> UpdateDates(
        long id,
        [FromBody] UpdateDlnDeliveryNoteDatesRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var updated = await dlnService.UpdateDatesAsync(id, request, ct);
        if (updated is null) return NotFound();

        return Ok(updated);
    }

    [HttpPost("delivery-notes/{id:long}/convert-to-invoice")]
    public async Task<ActionResult<ConvertDlnToInvResultDto>> ConvertToInvoice(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });
        try { return Ok(await dlnService.ConvertToInvoiceAsync(id, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("delivery-notes/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });
        try
        {
            if (!await dlnService.DeleteAsync(id, ct)) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
