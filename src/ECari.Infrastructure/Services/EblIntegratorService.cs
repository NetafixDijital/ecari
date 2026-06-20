using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using ECari.Infrastructure.Integrations.Edm;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class EblIntegratorService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    CredentialProtector credentialProtector)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<EblIntegratorDto>> ListIntegratorsAsync(CancellationToken ct = default) =>
        await Db.EblIntegrators.AsNoTracking()
            .Where(i => i.IsActive)
            .OrderBy(i => i.Name)
            .Select(i => new EblIntegratorDto(
                i.Id, i.Code, i.Name, i.ApiBaseUrl, i.ApiEwaybillUrl, i.IsActive))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<EblCredentialDto>> ListCredentialsAsync(CancellationToken ct = default) =>
        await Db.EblIntegratorCredentials.AsNoTracking()
            .Include(c => c.Integrator)
            .OrderByDescending(c => c.IsActive)
            .ThenBy(c => c.Environment)
            .Select(c => new EblCredentialDto(
                c.Id,
                c.IntegratorId,
                c.Integrator.Code,
                c.Username,
                c.Environment,
                c.BranchId,
                c.InvoiceSerialPrefix,
                c.IsActive,
                c.PasswordEncrypted.Length > 0))
            .ToListAsync(ct);

    public async Task<EblCredentialDto> SaveCredentialAsync(
        SaveEblCredentialRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var integrator = await db.EblIntegrators
            .FirstOrDefaultAsync(i => i.Id == request.IntegratorId && i.IsActive, ct)
            ?? throw new InvalidOperationException("Entegratör bulunamadı.");

        var environment = request.Environment.ToUpperInvariant() switch
        {
            "TEST" => "TEST",
            "PRODUCTION" or "CANLI" or "LIVE" => "PRODUCTION",
            _ => throw new InvalidOperationException("Ortam TEST veya PRODUCTION olmalı."),
        };

        if (string.IsNullOrWhiteSpace(request.Username))
            throw new InvalidOperationException("Kullanıcı adı zorunlu.");

        var existing = await db.EblIntegratorCredentials
            .FirstOrDefaultAsync(c =>
                c.IntegratorId == request.IntegratorId &&
                c.Environment == environment &&
                c.BranchId == request.BranchId, ct);

        if (existing is null)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
                throw new InvalidOperationException("Yeni kayıt için şifre zorunlu.");

            existing = new EblIntegratorCredential
            {
                IntegratorId = request.IntegratorId,
                CreatedAt = DateTime.UtcNow
            };
            db.EblIntegratorCredentials.Add(existing);
        }
        else if (!string.IsNullOrWhiteSpace(request.Password))
        {
            existing.PasswordEncrypted = credentialProtector.Protect(request.Password);
        }
        else if (existing.PasswordEncrypted.Length == 0)
        {
            throw new InvalidOperationException("Şifre zorunlu.");
        }

        existing.Username = request.Username.Trim();
        existing.Environment = environment;
        existing.BranchId = request.BranchId;
        existing.InvoiceSerialPrefix = request.InvoiceSerialPrefix?.Trim();
        existing.IsActive = request.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        if (existing.PasswordEncrypted.Length == 0 && !string.IsNullOrWhiteSpace(request.Password))
            existing.PasswordEncrypted = credentialProtector.Protect(request.Password);

        await db.SaveChangesAsync(ct);

        return new EblCredentialDto(
            existing.Id,
            existing.IntegratorId,
            integrator.Code,
            existing.Username,
            existing.Environment,
            existing.BranchId,
            existing.InvoiceSerialPrefix,
            existing.IsActive,
            existing.PasswordEncrypted.Length > 0);
    }

    internal async Task<(EblIntegrator Integrator, EblIntegratorCredential Credential, string Password)> ResolveActiveCredentialAsync(
        CancellationToken ct)
    {
        var credential = await Db.EblIntegratorCredentials
            .Include(c => c.Integrator)
            .Where(c => c.IsActive && c.Integrator.IsActive)
            .OrderByDescending(c => c.Environment == "PRODUCTION")
            .ThenByDescending(c => c.UpdatedAt ?? c.CreatedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Aktif EDM kimlik bilgisi bulunamadı. Ayarlar > E-Belge bölümünden tanımlayın.");

        var password = credentialProtector.Unprotect(credential.PasswordEncrypted);
        if (string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("EDM şifresi çözülemedi.");

        return (credential.Integrator, credential, password);
    }
}
