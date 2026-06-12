using ECari.Domain.Dtos;
using ECari.Domain.Entities.System;
using ECari.Infrastructure.Auth;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class AuthService(
    SystemDbContext systemDb,
    JwtTokenService jwtTokenService)
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await systemDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        await systemDb.Users
            .Where(u => u.Id == user.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastLoginAt, DateTime.UtcNow), ct);

        var (token, expiresIn) = jwtTokenService.CreateUserToken(user);

        return new LoginResponse(
            token,
            expiresIn,
            new UserSummaryDto(user.Id, user.FullName, user.Email));
    }

    public async Task<IReadOnlyList<CompanyDto>> GetCompaniesAsync(long userId, CancellationToken ct = default)
    {
        return await systemDb.UserCompanies
            .AsNoTracking()
            .Where(uc => uc.UserId == userId && uc.Status == "ACTIVE")
            .Include(uc => uc.Company)
            .Where(uc => uc.Company.IsActive)
            .OrderByDescending(uc => uc.IsDefaultCompany)
            .ThenBy(uc => uc.Company.Name)
            .Select(uc => new CompanyDto(
                uc.Company.Id,
                uc.Company.Code,
                uc.Company.Name,
                uc.Company.DatabaseName,
                uc.IsDefaultCompany))
            .ToListAsync(ct);
    }

    public async Task<SelectCompanyResponse?> SelectCompanyAsync(
        long userId,
        long companyId,
        CancellationToken ct = default)
    {
        var link = await systemDb.UserCompanies
            .AsNoTracking()
            .Include(uc => uc.Company)
            .Include(uc => uc.User)
            .FirstOrDefaultAsync(uc =>
                uc.UserId == userId &&
                uc.CompanyId == companyId &&
                uc.Status == "ACTIVE" &&
                uc.Company.IsActive, ct);

        if (link is null)
            return null;

        var (token, expiresIn) = jwtTokenService.CreateTenantToken(
            link.User,
            link.Company,
            link.OrgUserId);

        return new SelectCompanyResponse(
            token,
            expiresIn,
            link.Company.Id,
            link.Company.Code,
            link.Company.DatabaseName,
            link.OrgUserId);
    }
}
