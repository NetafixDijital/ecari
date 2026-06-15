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
    [HttpGet("services")]
    public async Task<ActionResult<IReadOnlyList<SvcServiceDefinitionDto>>> ListServices(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await svcService.ListServicesAsync(ct));
    }

    [HttpGet("tickets")]
    public async Task<ActionResult<IReadOnlyList<SvcTicketListItemDto>>> List(
        [FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await svcService.ListAsync(status, search, ct));
    }

    [HttpGet("tickets/{id:long}")]
    public async Task<ActionResult<SvcTicketDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        var item = await svcService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost("tickets")]
    public async Task<ActionResult<SvcTicketDetailDto>> Create(
        [FromBody] CreateSvcTicketRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await svcService.CreateAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("tickets/{id:long}")]
    public async Task<ActionResult<SvcTicketDetailDto>> Update(
        long id, [FromBody] UpdateSvcTicketRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await svcService.UpdateAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("tickets/{id:long}/status")]
    public async Task<ActionResult<SvcTicketDetailDto>> UpdateStatus(
        long id, [FromBody] UpdateSvcTicketStatusRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await svcService.UpdateStatusAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("tickets/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        if (!await svcService.DeleteAsync(id, ct)) return NotFound();
        return NoContent();
    }

    [HttpPut("tickets/{id:long}/lines")]
    public async Task<ActionResult<SvcTicketDetailDto>> SaveLines(
        long id, [FromBody] SaveSvcTicketLinesRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await svcService.SaveLinesAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("tickets/{id:long}/convert-to-invoice")]
    public async Task<ActionResult<ConvertSvcToInvoiceResultDto>> ConvertToInvoice(
        long id, [FromBody] ConvertSvcToInvoiceRequest request, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await svcService.ConvertToInvoiceAsync(id, request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
