using System.Security.Claims;
using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AuthService authService,
    AuthUserService authUserService,
    ITenantConnectionResolver tenant) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "E-posta ve şifre zorunludur." });

        var result = await authService.LoginAsync(request, ct);
        if (result is null)
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });

        return Ok(result);
    }

    [HttpGet("companies")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<CompanyDto>>> GetCompanies(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized();

        var companies = await authService.GetCompaniesAsync(userId.Value, ct);
        return Ok(companies);
    }

    [HttpPost("select-company")]
    [Authorize]
    public async Task<ActionResult<SelectCompanyResponse>> SelectCompany(
        [FromBody] SelectCompanyRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized();

        var result = await authService.SelectCompanyAsync(userId.Value, request.CompanyId, ct);
        if (result is null)
            return NotFound(new { message = "Şirket bulunamadı veya erişim yok." });

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<MeResponseDto>> GetMe(CancellationToken ct)
    {
        var userId = GetUserId();
        var orgUserId = tenant.GetOrgUserId();
        if (userId is null || orgUserId is null || !tenant.HasTenantContext())
            return BadRequest(new { message = "Önce şirket seçin." });

        var me = await authUserService.GetMeAsync(orgUserId.Value, userId.Value, ct);
        if (me is null) return NotFound();
        return Ok(me);
    }

    [HttpGet("permissions/tree")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<AuthPermissionGroupDto>>> GetPermissionTree(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await authUserService.GetPermissionTreeAsync(ct));
    }

    [HttpGet("branches")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<AuthBranchDto>>> GetBranches(CancellationToken ct)
    {
        if (!tenant.HasTenantContext()) return BadRequest(new { message = "Önce şirket seçin." });
        return Ok(await authUserService.GetBranchesAsync(ct));
    }

    private long? GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(value, out var id) ? id : null;
    }
}
