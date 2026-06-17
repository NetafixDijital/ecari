using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/svc")]
[Authorize]
public class SvcController(
    SvcTicketService svcService,
    SvcDefinitionService definitionService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("services")]
    public async Task<ActionResult<IReadOnlyList<SvcServiceDefinitionDto>>> ListServices(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await definitionService.ListServicesAsync(includeInactive, ct));
    }

    [HttpPost("services")]
    public async Task<ActionResult<SvcServiceDefinitionDto>> CreateService(
        [FromBody] UpsertSvcServiceDefinitionRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await definitionService.CreateServiceAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("services/{id:long}")]
    public async Task<ActionResult<SvcServiceDefinitionDto>> UpdateService(
        long id,
        [FromBody] UpsertSvcServiceDefinitionRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await definitionService.UpdateServiceAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("services/{id:long}")]
    public async Task<IActionResult> DeleteService(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            if (!await definitionService.DeleteServiceAsync(id, ct)) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("technicians")]
    public async Task<ActionResult<IReadOnlyList<SvcTechnicianDto>>> ListTechnicians(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await definitionService.ListTechniciansAsync(includeInactive, ct));
    }

    [HttpPost("technicians")]
    public async Task<ActionResult<SvcTechnicianDto>> CreateTechnician(
        [FromBody] UpsertSvcTechnicianRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await definitionService.CreateTechnicianAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("technicians/{id:long}")]
    public async Task<ActionResult<SvcTechnicianDto>> UpdateTechnician(
        long id,
        [FromBody] UpsertSvcTechnicianRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await definitionService.UpdateTechnicianAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("technicians/{id:long}")]
    public async Task<IActionResult> DeleteTechnician(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            if (!await definitionService.DeleteTechnicianAsync(id, ct)) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
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
