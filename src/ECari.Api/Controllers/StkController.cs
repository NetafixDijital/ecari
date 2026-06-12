using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/stk")]
[Authorize]
public class StkController(
    StkItemService stkService,
    StkMovementService movementService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet("movements")]
    public async Task<ActionResult<IReadOnlyList<StkStockMovementListItemDto>>> Movements(
        [FromQuery] long? warehouseId,
        [FromQuery] long? itemId,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await movementService.ListAsync(warehouseId, itemId, search, ct));
    }

    [HttpGet("items")]
    public async Task<ActionResult<IReadOnlyList<StkItemListItemDto>>> List(
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        return Ok(await stkService.ListAsync(search, ct));
    }

    [HttpGet("items/{id:long}")]
    public async Task<ActionResult<StkItemDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await stkService.GetByIdAsync(id, ct);
        if (item is null)
            return NotFound();

        return Ok(item);
    }

    [HttpGet("items/by-barcode/{barcode}")]
    public async Task<ActionResult<StkItemDetailDto>> GetByBarcode(string barcode, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        var item = await stkService.GetByBarcodeAsync(barcode, ct);
        if (item is null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost("items")]
    public async Task<ActionResult<StkItemDetailDto>> Create(
        [FromBody] CreateStkItemRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            var created = await stkService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("items/{id:long}")]
    public async Task<ActionResult<StkItemDetailDto>> Update(
        long id,
        [FromBody] UpdateStkItemRequest request,
        CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        try
        {
            var updated = await stkService.UpdateAsync(id, request, ct);
            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("items/{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin: POST /api/auth/select-company" });

        if (!await stkService.DeleteAsync(id, ct))
            return NotFound();

        return NoContent();
    }
}
