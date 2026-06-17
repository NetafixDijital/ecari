using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/inv")]
[Authorize]
public class InvController(
    InvInvoiceService invService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("invoices")]
    public async Task<ActionResult<IReadOnlyList<InvInvoiceListItemDto>>> List(
        [FromQuery] string type,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var invoiceType = type?.ToUpperInvariant() switch
        {
            "SALES" or "SATIS" => "SALES",
            "PURCHASE" or "ALIS" => "PURCHASE",
            "SALES_RETURN" or "SATIS_IADE" or "SATISIADE" => "SALES_RETURN",
            "PURCHASE_RETURN" or "ALIS_IADE" or "ALISIADE" => "PURCHASE_RETURN",
            _ => null,
        };

        if (invoiceType is null)
            return BadRequest(new { message = "Geçerli type: SALES, PURCHASE, SALES_RETURN, PURCHASE_RETURN" });

        return Ok(await invService.ListAsync(invoiceType, search, ct));
    }

    [HttpGet("invoices/{id:long}")]
    public async Task<ActionResult<InvInvoiceDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await invService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();

        return Ok(item);
    }

    [HttpGet("kdv-report")]
    public async Task<ActionResult<InvKdvReportDto>> KdvReport(CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await invService.GetKdvReportAsync(ct));
    }

    [HttpPost("invoices")]
    public async Task<ActionResult<InvInvoiceDetailDto>> Create(
        [FromBody] CreateInvInvoiceRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await invService.CreateAsync(request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("invoices/{id:long}/dates")]
    public async Task<ActionResult<InvInvoiceDetailDto>> UpdateDates(
        long id,
        [FromBody] UpdateInvInvoiceDatesRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var updated = await invService.UpdateDatesAsync(id, request, ct);
        if (updated is null) return NotFound();

        return Ok(updated);
    }

    [HttpDelete("invoices/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });
        try
        {
            if (!await invService.DeleteAsync(id, ct)) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
