using ECari.Domain.Dtos;
using ECari.Domain.Entities.System;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class AuthUserService(
    SystemDbContext systemDb,
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<AuthUserListItemDto>> ListAsync(string? search, CancellationToken ct = default)
    {
        var query = Db.AuthUserList.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                u.FullName.Contains(term) ||
                u.Email.Contains(term) ||
                (u.Phone != null && u.Phone.Contains(term)));
        }

        return await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AuthUserListItemDto(
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.PermissionSummary,
                u.IsActive,
                u.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<AuthUserDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var user = await Db.OrgUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (user is null) return null;

        var settings = await Db.AuthUserSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrgUserId == id, ct);

        var permissionIds = await Db.AuthUserPermissions.AsNoTracking()
            .Where(p => p.OrgUserId == id && p.IsGranted)
            .Select(p => p.PermissionId)
            .ToListAsync(ct);

        var deniedBranchIds = await Db.AuthUserBranchAccess.AsNoTracking()
            .Where(b => b.OrgUserId == id && b.AccessRule == "DENY")
            .Select(b => b.BranchId)
            .ToListAsync(ct);

        return new AuthUserDetailDto(
            user.Id,
            user.SystemUserId,
            user.FullName,
            user.Email,
            user.Phone,
            user.IsActive,
            settings?.IsBranchRestrictionEnabled ?? false,
            settings?.MaxBranchAccess ?? 3,
            permissionIds,
            deniedBranchIds,
            user.CreatedAt);
    }

    public async Task<IReadOnlyList<AuthPermissionGroupDto>> GetPermissionTreeAsync(CancellationToken ct = default)
    {
        var groups = await Db.AuthPermissionGroups.AsNoTracking()
            .Where(g => g.IsActive)
            .Include(g => g.Permissions.Where(p => p.IsActive))
            .OrderBy(g => g.SortOrder)
            .ToListAsync(ct);

        return groups.Select(g => new AuthPermissionGroupDto(
            g.Id,
            g.Code,
            g.Name,
            g.Permissions
                .OrderBy(p => p.SortOrder)
                .Select(p => new AuthPermissionDto(p.Id, p.Code, p.Name, p.ModuleCode, p.ActionCode))
                .ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<AuthBranchDto>> GetBranchesAsync(CancellationToken ct = default)
    {
        return await Db.OrgBranches.AsNoTracking()
            .Where(b => b.IsActive && !b.IsDeleted)
            .OrderByDescending(b => b.IsHeadquarters)
            .ThenBy(b => b.Name)
            .Select(b => new AuthBranchDto(b.Id, b.Code, b.Name, b.IsHeadquarters))
            .ToListAsync(ct);
    }

    public async Task<MeResponseDto?> GetMeAsync(long orgUserId, long systemUserId, CancellationToken ct = default)
    {
        var user = await Db.OrgUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == orgUserId && !u.IsDeleted, ct);
        if (user is null) return null;

        var permissions = await Db.AuthUserPermissions.AsNoTracking()
            .Where(p => p.OrgUserId == orgUserId && p.IsGranted)
            .Include(p => p.Permission)
            .Select(p => p.Permission.Code)
            .ToListAsync(ct);

        return new MeResponseDto(
            orgUserId,
            systemUserId,
            user.FullName,
            user.Email,
            user.Phone,
            permissions);
    }

    public async Task<bool> HasPermissionAsync(long orgUserId, string permissionCode, CancellationToken ct = default)
    {
        return await Db.AuthUserPermissions.AsNoTracking()
            .AnyAsync(p =>
                p.OrgUserId == orgUserId &&
                p.IsGranted &&
                p.Permission.Code == permissionCode &&
                p.Permission.IsActive, ct);
    }

    public async Task<AuthUserDetailDto> CreateAsync(CreateAuthUserRequest request, CancellationToken ct = default)
    {
        var companyId = tenant.GetCompanyId()
            ?? throw new InvalidOperationException("Şirket bağlamı bulunamadı.");

        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new InvalidOperationException("Ad soyad zorunludur.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new InvalidOperationException("Şifre en az 6 karakter olmalıdır.");

        if (await systemDb.Users.AnyAsync(u => u.Email == email, ct))
            throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");

        var sysUser = new SysUser
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            PasswordChangedAt = DateTime.UtcNow,
        };

        systemDb.Users.Add(sysUser);
        await systemDb.SaveChangesAsync(ct);

        try
        {
            var orgUser = new OrgUser
            {
                SystemUserId = sysUser.Id,
                FullName = sysUser.FullName,
                Email = sysUser.Email,
                Phone = sysUser.Phone,
                IsActive = request.IsActive,
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = tenant.GetOrgUserId(),
            };

            Db.OrgUsers.Add(orgUser);
            await Db.SaveChangesAsync(ct);

            var link = new SysUserCompany
            {
                UserId = sysUser.Id,
                CompanyId = companyId,
                OrgUserId = orgUser.Id,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow,
            };
            systemDb.UserCompanies.Add(link);
            await systemDb.SaveChangesAsync(ct);

            await SavePermissionsAndSettingsAsync(Db, orgUser.Id, request, ct);

            return (await GetByIdAsync(orgUser.Id, ct))!;
        }
        catch
        {
            systemDb.Users.Remove(sysUser);
            await systemDb.SaveChangesAsync(ct);
            throw;
        }
    }

    public async Task<AuthUserDetailDto?> UpdateAsync(long id, UpdateAuthUserRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        await using var db = tenantDbFactory.Create(
            tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));
        var orgUser = await db.OrgUsers.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (orgUser is null) return null;

        if (await systemDb.Users.AnyAsync(u => u.Email == email && u.Id != orgUser.SystemUserId, ct))
            throw new InvalidOperationException("Bu e-posta adresi başka bir kullanıcıda kayıtlı.");

        var sysUser = await systemDb.Users.FirstOrDefaultAsync(u => u.Id == orgUser.SystemUserId, ct);
        if (sysUser is null)
            throw new InvalidOperationException("Sistem kullanıcısı bulunamadı.");

        sysUser.FullName = request.FullName.Trim();
        sysUser.Email = email;
        sysUser.Phone = request.Phone?.Trim();
        sysUser.IsActive = request.IsActive;
        sysUser.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 6)
                throw new InvalidOperationException("Şifre en az 6 karakter olmalıdır.");
            sysUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            sysUser.PasswordChangedAt = DateTime.UtcNow;
        }

        orgUser.FullName = sysUser.FullName;
        orgUser.Email = sysUser.Email;
        orgUser.Phone = sysUser.Phone;
        orgUser.IsActive = request.IsActive;
        orgUser.UpdatedAt = DateTime.UtcNow;
        orgUser.UpdatedBy = tenant.GetOrgUserId();

        await systemDb.SaveChangesAsync(ct);
        await db.SaveChangesAsync(ct);

        await SavePermissionsAndSettingsAsync(db, id, request, ct);

        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        await using var db = tenantDbFactory.Create(
            tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));
        var orgUser = await db.OrgUsers.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (orgUser is null) return false;

        orgUser.IsDeleted = true;
        orgUser.IsActive = false;
        orgUser.DeletedAt = DateTime.UtcNow;
        orgUser.DeletedBy = tenant.GetOrgUserId();

        var sysUser = await systemDb.Users.FirstOrDefaultAsync(u => u.Id == orgUser.SystemUserId, ct);
        if (sysUser is not null)
        {
            sysUser.IsActive = false;
            sysUser.UpdatedAt = DateTime.UtcNow;
        }

        var companyId = tenant.GetCompanyId();
        if (companyId.HasValue)
        {
            await systemDb.UserCompanies
                .Where(uc => uc.UserId == orgUser.SystemUserId && uc.CompanyId == companyId.Value)
                .ExecuteUpdateAsync(s => s.SetProperty(uc => uc.Status, "INACTIVE"), ct);
        }

        await db.SaveChangesAsync(ct);
        await systemDb.SaveChangesAsync(ct);
        return true;
    }

    private static async Task SavePermissionsAndSettingsAsync(
        TenantDbContext db,
        long orgUserId,
        CreateAuthUserRequest request,
        CancellationToken ct)
    {
        await db.AuthUserPermissions.Where(p => p.OrgUserId == orgUserId).ExecuteDeleteAsync(ct);
        await db.AuthUserBranchAccess.Where(b => b.OrgUserId == orgUserId).ExecuteDeleteAsync(ct);

        var permissionIds = request.PermissionIds.Distinct().ToList();
        if (permissionIds.Count > 0)
        {
            db.AuthUserPermissions.AddRange(permissionIds.Select(pid => new AuthUserPermission
            {
                OrgUserId = orgUserId,
                PermissionId = pid,
                IsGranted = true,
                CreatedAt = DateTime.UtcNow,
            }));
        }

        if (request.IsBranchRestrictionEnabled && request.DeniedBranchIds.Count > 0)
        {
            db.AuthUserBranchAccess.AddRange(request.DeniedBranchIds.Distinct().Select(bid => new AuthUserBranchAccess
            {
                OrgUserId = orgUserId,
                BranchId = bid,
                AccessRule = "DENY",
                CreatedAt = DateTime.UtcNow,
            }));
        }

        var summary = await BuildPermissionSummaryAsync(db, permissionIds, ct);
        var settings = await db.AuthUserSettings.FirstOrDefaultAsync(s => s.OrgUserId == orgUserId, ct);
        if (settings is null)
        {
            db.AuthUserSettings.Add(new AuthUserSettings
            {
                OrgUserId = orgUserId,
                IsBranchRestrictionEnabled = request.IsBranchRestrictionEnabled,
                MaxBranchAccess = request.MaxBranchAccess > 0 ? request.MaxBranchAccess : 3,
                PermissionSummaryCache = summary,
            });
        }
        else
        {
            settings.IsBranchRestrictionEnabled = request.IsBranchRestrictionEnabled;
            settings.MaxBranchAccess = request.MaxBranchAccess > 0 ? request.MaxBranchAccess : 3;
            settings.PermissionSummaryCache = summary;
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task SavePermissionsAndSettingsAsync(
        TenantDbContext db,
        long orgUserId,
        UpdateAuthUserRequest request,
        CancellationToken ct)
    {
        await SavePermissionsAndSettingsAsync(db, orgUserId, new CreateAuthUserRequest(
            request.FullName,
            request.Email,
            request.Phone,
            string.Empty,
            request.IsActive,
            request.IsBranchRestrictionEnabled,
            request.MaxBranchAccess,
            request.PermissionIds,
            request.DeniedBranchIds), ct);
    }

    private static async Task<string> BuildPermissionSummaryAsync(
        TenantDbContext db,
        IReadOnlyList<long> permissionIds,
        CancellationToken ct)
    {
        if (permissionIds.Count == 0) return "İzin yok";

        var total = await db.AuthPermissions.CountAsync(p => p.IsActive, ct);
        if (permissionIds.Count >= total) return "Tüm izinler";

        var names = await db.AuthPermissions.AsNoTracking()
            .Where(p => permissionIds.Contains(p.Id))
            .OrderBy(p => p.SortOrder)
            .Select(p => p.Name)
            .Take(3)
            .ToListAsync(ct);

        var summary = string.Join(", ", names);
        if (permissionIds.Count > 3)
            summary += $" (+{permissionIds.Count - 3})";
        return summary;
    }
}
