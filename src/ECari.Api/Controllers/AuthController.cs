using System.Security.Claims;
using ECari.Domain.Dtos;
using ECari.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECari.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
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

    private long? GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(value, out var id) ? id : null;
    }
}
