using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/cari")]
[Authorize]
public class CariController(
    CariAccountService cariService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("accounts")]
    public async Task<ActionResult<IReadOnlyList<CariAccountListItemDto>>> List(
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var items = await cariService.ListAsync(search, ct);
        return Ok(items);
    }

    [HttpGet("accounts/{id:long}")]
    public async Task<ActionResult<CariAccountDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await cariService.GetByIdAsync(id, ct);
        if (item is null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost("accounts")]
    public async Task<ActionResult<CariAccountDetailDto>> Create(
        [FromBody] CreateCariAccountRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            var created = await cariService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("accounts/{id:long}")]
    public async Task<ActionResult<CariAccountDetailDto>> Update(
        long id,
        [FromBody] UpdateCariAccountRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var updated = await cariService.UpdateAsync(id, request, ct);
        if (updated is null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("accounts/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var deleted = await cariService.DeleteAsync(id, ct);
        if (!deleted)
            return NotFound();

        return NoContent();
    }

    [HttpGet("movements")]
    public async Task<ActionResult<IReadOnlyList<CariMovementListItemDto>>> Movements(
        [FromQuery] long? accountId,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await cariService.ListMovementsAsync(accountId, search, ct));
    }

    [HttpPost("collections")]
    public async Task<IActionResult> Collection(
        [FromBody] CariCollectionRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            await cariService.RecordCollectionAsync(request, ct);
            return Ok(new { message = "Tahsilat kaydedildi." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("transfers")]
    public async Task<IActionResult> Transfer(
        [FromBody] CariTransferRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            await cariService.RecordTransferAsync(request, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
