using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class SvcDefinitionService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<SvcTechnicianDto>> ListTechniciansAsync(
        bool includeInactive = false,
        CancellationToken ct = default)
    {
        var query = Db.SvcTechnicians.AsNoTracking().Where(t => !t.IsDeleted);
        if (!includeInactive)
            query = query.Where(t => t.IsActive);

        return await query
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .Select(t => new SvcTechnicianDto(t.Id, t.Code, t.Name, t.Phone, t.IsActive, t.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<SvcTechnicianDto> CreateTechnicianAsync(
        UpsertSvcTechnicianRequest request,
        CancellationToken ct = default)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code))
            throw new InvalidOperationException("Teknisyen kodu zorunlu.");
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Teknisyen adı zorunlu.");

        var db = Db;
        if (await db.SvcTechnicians.AnyAsync(t => !t.IsDeleted && t.Code == code, ct))
            throw new InvalidOperationException("Bu teknisyen kodu zaten kayıtlı.");

        var entity = new SvcTechnician
        {
            Code = code,
            Name = request.Name.Trim(),
            Phone = request.Phone?.Trim(),
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow,
        };

        db.SvcTechnicians.Add(entity);
        await db.SaveChangesAsync(ct);
        return new SvcTechnicianDto(entity.Id, entity.Code, entity.Name, entity.Phone, entity.IsActive, entity.SortOrder);
    }

    public async Task<SvcTechnicianDto?> UpdateTechnicianAsync(
        long id,
        UpsertSvcTechnicianRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var entity = await db.SvcTechnicians.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (entity is null) return null;

        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Kod ve ad zorunlu.");

        if (await db.SvcTechnicians.AnyAsync(t => !t.IsDeleted && t.Id != id && t.Code == code, ct))
            throw new InvalidOperationException("Bu teknisyen kodu zaten kayıtlı.");

        entity.Code = code;
        entity.Name = request.Name.Trim();
        entity.Phone = request.Phone?.Trim();
        entity.IsActive = request.IsActive;
        entity.SortOrder = request.SortOrder;
        await db.SaveChangesAsync(ct);

        return new SvcTechnicianDto(entity.Id, entity.Code, entity.Name, entity.Phone, entity.IsActive, entity.SortOrder);
    }

    public async Task<bool> DeleteTechnicianAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var entity = await db.SvcTechnicians.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.IsActive = false;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<SvcServiceDefinitionDto>> ListServicesAsync(
        bool includeInactive = false,
        CancellationToken ct = default)
    {
        var query = Db.SvcServiceDefinitions.AsNoTracking().Where(s => !s.IsDeleted);
        if (!includeInactive)
            query = query.Where(s => s.IsActive);

        return await query
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .Select(s => new SvcServiceDefinitionDto(
                s.Id, s.Code, s.Name, s.DefaultTaxRateId, s.IsActive, s.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<SvcServiceDefinitionDto> CreateServiceAsync(
        UpsertSvcServiceDefinitionRequest request,
        CancellationToken ct = default)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Hizmet kodu ve adı zorunlu.");

        var db = Db;
        if (await db.SvcServiceDefinitions.AnyAsync(s => !s.IsDeleted && s.Code == code, ct))
            throw new InvalidOperationException("Bu hizmet kodu zaten kayıtlı.");

        if (request.DefaultTaxRateId.HasValue &&
            !await db.TaxRates.AnyAsync(t => t.Id == request.DefaultTaxRateId && t.IsActive, ct))
            throw new InvalidOperationException("Geçersiz KDV oranı.");

        var entity = new SvcServiceDefinition
        {
            Code = code,
            Name = request.Name.Trim(),
            DefaultTaxRateId = request.DefaultTaxRateId,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
        };

        db.SvcServiceDefinitions.Add(entity);
        await db.SaveChangesAsync(ct);

        return new SvcServiceDefinitionDto(
            entity.Id, entity.Code, entity.Name, entity.DefaultTaxRateId, entity.IsActive, entity.SortOrder);
    }

    public async Task<SvcServiceDefinitionDto?> UpdateServiceAsync(
        long id,
        UpsertSvcServiceDefinitionRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var entity = await db.SvcServiceDefinitions.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
        if (entity is null) return null;

        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Hizmet kodu ve adı zorunlu.");

        if (await db.SvcServiceDefinitions.AnyAsync(s => !s.IsDeleted && s.Id != id && s.Code == code, ct))
            throw new InvalidOperationException("Bu hizmet kodu zaten kayıtlı.");

        if (request.DefaultTaxRateId.HasValue &&
            !await db.TaxRates.AnyAsync(t => t.Id == request.DefaultTaxRateId && t.IsActive, ct))
            throw new InvalidOperationException("Geçersiz KDV oranı.");

        entity.Code = code;
        entity.Name = request.Name.Trim();
        entity.DefaultTaxRateId = request.DefaultTaxRateId;
        entity.IsActive = request.IsActive;
        entity.SortOrder = request.SortOrder;
        await db.SaveChangesAsync(ct);

        return new SvcServiceDefinitionDto(
            entity.Id, entity.Code, entity.Name, entity.DefaultTaxRateId, entity.IsActive, entity.SortOrder);
    }

    public async Task<bool> DeleteServiceAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var entity = await db.SvcServiceDefinitions.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
        if (entity is null) return false;

        var inUse = await db.SvcTicketLines.AnyAsync(l => !l.IsDeleted && l.ServiceDefinitionId == id, ct);
        if (inUse)
            throw new InvalidOperationException("Servis kayıtlarında kullanılan hizmet silinemez.");

        entity.IsDeleted = true;
        entity.IsActive = false;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
