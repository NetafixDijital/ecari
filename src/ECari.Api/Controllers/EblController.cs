using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/ebl")]
[Authorize]
public class EblController(
    EblIntegratorService integratorService,
    EblDocumentService documentService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("integrators")]
    public async Task<ActionResult<IReadOnlyList<EblIntegratorDto>>> ListIntegrators(CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await integratorService.ListIntegratorsAsync(ct));
    }

    [HttpGet("credentials")]
    public async Task<ActionResult<IReadOnlyList<EblCredentialDto>>> ListCredentials(CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await integratorService.ListCredentialsAsync(ct));
    }

    [HttpPost("credentials")]
    public async Task<ActionResult<EblCredentialDto>> SaveCredential(
        [FromBody] SaveEblCredentialRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await integratorService.SaveCredentialAsync(request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("cari/{accountId:long}/check-gib")]
    public async Task<ActionResult<EblGibCheckResultDto>> CheckGibUser(long accountId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await documentService.CheckCariGibUserAsync(accountId, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("invoices/{invoiceId:long}/record")]
    public async Task<ActionResult<EblEinvoiceRecordDto>> GetInvoiceRecord(long invoiceId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var record = await documentService.GetInvoiceRecordAsync(invoiceId, ct);
        if (record is null) return NotFound();
        return Ok(record);
    }

    [HttpPost("invoices/{invoiceId:long}/send")]
    public async Task<ActionResult<EblSendResultDto>> SendInvoice(long invoiceId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await documentService.SendInvoiceAsync(invoiceId, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("invoices/{invoiceId:long}/refresh-status")]
    public async Task<ActionResult<EblEinvoiceRecordDto>> RefreshInvoiceStatus(long invoiceId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await documentService.RefreshInvoiceStatusAsync(invoiceId, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("delivery-notes/{deliveryNoteId:long}/record")]
    public async Task<ActionResult<EblEwaybillRecordDto>> GetDeliveryNoteRecord(long deliveryNoteId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var record = await documentService.GetDeliveryNoteRecordAsync(deliveryNoteId, ct);
        if (record is null) return NotFound();
        return Ok(record);
    }

    [HttpPost("delivery-notes/{deliveryNoteId:long}/send")]
    public async Task<ActionResult<EblSendResultDto>> SendDeliveryNote(long deliveryNoteId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await documentService.SendDeliveryNoteAsync(deliveryNoteId, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("delivery-notes/{deliveryNoteId:long}/refresh-status")]
    public async Task<ActionResult<EblEwaybillRecordDto>> RefreshDeliveryNoteStatus(long deliveryNoteId, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            return Ok(await documentService.RefreshDeliveryNoteStatusAsync(deliveryNoteId, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
