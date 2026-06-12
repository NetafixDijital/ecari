using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ECari.Domain.Entities.System;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ECari.Infrastructure.Auth;

public class JwtTokenService(IOptions<JwtSettings> options)
{
    private readonly JwtSettings _settings = options.Value;

    public (string Token, int ExpiresIn) CreateUserToken(SysUser user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("full_name", user.FullName)
        };

        return CreateToken(claims);
    }

    public (string Token, int ExpiresIn) CreateTenantToken(
        SysUser user,
        SysCompany company,
        long orgUserId)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("full_name", user.FullName),
            new("company_id", company.Id.ToString()),
            new("company_code", company.Code),
            new("database_name", company.DatabaseName),
            new("org_user_id", orgUserId.ToString())
        };

        return CreateToken(claims);
    }

    private (string Token, int ExpiresIn) CreateToken(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresIn = _settings.AccessTokenMinutes * 60;
        var expires = DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresIn);
    }
}
