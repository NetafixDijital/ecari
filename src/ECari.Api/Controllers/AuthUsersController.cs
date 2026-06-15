using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/auth/users")]
[Authorize]
public class AuthUsersController(AuthUserService authUserService, ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AuthUserListItemDto>>> List(
        [FromQuery] string? search, CancellationToken ct)
    {
        if (!await EnsureUserManageAsync(ct)) return Forbid();
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await authUserService.ListAsync(search, ct));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AuthUserDetailDto>> GetById(long id, CancellationToken ct)
    {
        if (!await EnsureUserManageAsync(ct)) return Forbid();
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        var item = await authUserService.GetByIdAsync(id, ct);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<AuthUserDetailDto>> Create(
        [FromBody] CreateAuthUserRequest request, CancellationToken ct)
    {
        if (!await EnsureUserManageAsync(ct)) return Forbid();
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try { return Ok(await authUserService.CreateAsync(request, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<AuthUserDetailDto>> Update(
        long id, [FromBody] UpdateAuthUserRequest request, CancellationToken ct)
    {
        if (!await EnsureUserManageAsync(ct)) return Forbid();
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        try
        {
            var item = await authUserService.UpdateAsync(id, request, ct);
            if (item is null) return NotFound();
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        if (!await EnsureUserManageAsync(ct)) return Forbid();
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        if (!await authUserService.DeleteAsync(id, ct)) return NotFound();
        return NoContent();
    }

    private async Task<bool> EnsureUserManageAsync(CancellationToken ct)
    {
        var orgUserId = tenant.GetOrgUserId();
        if (orgUserId is null) return false;
        return await authUserService.HasPermissionAsync(orgUserId.Value, "AUTH.USER.VIEW", ct);
    }
}
