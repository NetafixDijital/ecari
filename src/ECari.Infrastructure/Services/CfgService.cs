using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class CfgService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<CompanyProfileDto?> GetCompanyProfileAsync(CancellationToken ct = default)
    {
        var profile = await Db.CompanyProfiles.AsNoTracking().FirstOrDefaultAsync(ct);
        return profile is null ? null : MapProfile(profile);
    }

    public async Task<CompanyProfileDto> UpdateCompanyProfileAsync(
        UpdateCompanyProfileRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var profile = await db.CompanyProfiles.FirstOrDefaultAsync(ct);

        if (profile is null)
        {
            profile = new CfgCompanyProfile
            {
                CreatedAt = DateTime.UtcNow
            };
            db.CompanyProfiles.Add(profile);
        }

        profile.LegalName = request.LegalName.Trim();
        profile.TradeName = request.TradeName?.Trim();
        profile.TaxNumber = request.TaxNumber.Trim();
        profile.TaxOffice = request.TaxOffice.Trim();
        profile.Address = request.Address;
        profile.CityId = request.CityId;
        profile.DistrictId = request.DistrictId;
        profile.Phone = request.Phone;
        profile.Email = request.Email;
        profile.Website = request.Website;
        profile.DefaultCurrencyId = request.DefaultCurrencyId;
        profile.FiscalYearStartMonth = request.FiscalYearStartMonth;
        profile.IsEinvoiceUser = request.IsEinvoiceUser;
        profile.IsEarchiveUser = request.IsEarchiveUser;
        profile.IsEwaybillUser = request.IsEwaybillUser;
        profile.EinvoiceAlias = request.EinvoiceAlias?.Trim();
        profile.EwaybillAlias = request.EwaybillAlias?.Trim();
        profile.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return MapProfile(profile);
    }

    public async Task<IReadOnlyList<WarehouseDto>> GetWarehousesAsync(CancellationToken ct = default) =>
        await Db.Warehouses.AsNoTracking()
            .Where(w => !w.IsDeleted)
            .OrderByDescending(w => w.IsDefault)
            .ThenBy(w => w.Name)
            .Select(w => new WarehouseDto(w.Id, w.BranchId, w.Code, w.Name, w.Address, w.IsDefault, w.IsActive))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<WarehouseDto>> GetActiveWarehousesAsync(CancellationToken ct = default) =>
        await Db.Warehouses.AsNoTracking()
            .Where(w => !w.IsDeleted && w.IsActive)
            .OrderByDescending(w => w.IsDefault)
            .ThenBy(w => w.Name)
            .Select(w => new WarehouseDto(w.Id, w.BranchId, w.Code, w.Name, w.Address, w.IsDefault, w.IsActive))
            .ToListAsync(ct);

    public async Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseRequest request, CancellationToken ct = default)
    {
        var db = Db;
        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code))
            throw new InvalidOperationException("Depo kodu zorunlu.");

        var exists = await db.Warehouses.AnyAsync(w => !w.IsDeleted && w.Code == code, ct);
        if (exists)
            throw new InvalidOperationException("Bu depo kodu zaten kullanılıyor.");

        var branchId = await db.OrgBranches.AsNoTracking()
            .Where(b => !b.IsDeleted)
            .OrderBy(b => b.Id)
            .Select(b => b.Id)
            .FirstOrDefaultAsync(ct);

        if (branchId == 0)
            throw new InvalidOperationException("Şube tanımı bulunamadı.");

        if (request.IsDefault)
        {
            var defaults = await db.Warehouses.Where(w => !w.IsDeleted && w.IsDefault).ToListAsync(ct);
            foreach (var wh in defaults)
                wh.IsDefault = false;
        }

        var warehouse = new StkWarehouse
        {
            BranchId = branchId,
            Code = code,
            Name = request.Name.Trim(),
            Address = request.Address?.Trim(),
            IsDefault = request.IsDefault,
            IsActive = request.IsActive,
        };

        db.Warehouses.Add(warehouse);
        await db.SaveChangesAsync(ct);

        return new WarehouseDto(
            warehouse.Id,
            warehouse.BranchId,
            warehouse.Code,
            warehouse.Name,
            warehouse.Address,
            warehouse.IsDefault,
            warehouse.IsActive);
    }

    public async Task<WarehouseDto?> UpdateWarehouseAsync(
        long id,
        UpdateWarehouseRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var warehouse = await db.Warehouses.FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted, ct);
        if (warehouse is null)
            return null;

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await db.Warehouses.AnyAsync(
            w => !w.IsDeleted && w.Id != id && w.Code == code, ct);
        if (codeExists)
            throw new InvalidOperationException("Bu depo kodu zaten kullanılıyor.");

        if (request.IsDefault && !warehouse.IsDefault)
        {
            var defaults = await db.Warehouses.Where(w => !w.IsDeleted && w.IsDefault && w.Id != id).ToListAsync(ct);
            foreach (var wh in defaults)
                wh.IsDefault = false;
        }

        warehouse.Code = code;
        warehouse.Name = request.Name.Trim();
        warehouse.Address = request.Address?.Trim();
        warehouse.IsDefault = request.IsDefault;
        warehouse.IsActive = request.IsActive;

        await db.SaveChangesAsync(ct);

        return new WarehouseDto(
            warehouse.Id,
            warehouse.BranchId,
            warehouse.Code,
            warehouse.Name,
            warehouse.Address,
            warehouse.IsDefault,
            warehouse.IsActive);
    }

    public async Task<bool> DeleteWarehouseAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var warehouse = await db.Warehouses.FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted, ct);
        if (warehouse is null)
            return false;

        var hasMovements = await db.StkStockMovements.AnyAsync(
            m => m.WarehouseId == id && !m.IsDeleted, ct);
        if (hasMovements)
            throw new InvalidOperationException("Stok hareketi olan depo silinemez.");

        warehouse.IsDeleted = true;
        warehouse.IsActive = false;
        warehouse.IsDefault = false;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<ModuleSettingDto>> GetModuleSettingsAsync(CancellationToken ct = default) =>
        await Db.CfgModuleSettings.AsNoTracking()
            .OrderBy(s => s.ModuleCode).ThenBy(s => s.SettingKey)
            .Select(s => new ModuleSettingDto(s.ModuleCode, s.SettingKey, s.SettingValue, s.DataType))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ModuleSettingDto>> UpdateModuleSettingsAsync(
        UpdateModuleSettingsRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        foreach (var item in request.Settings)
        {
            var row = await db.CfgModuleSettings
                .FirstOrDefaultAsync(s => s.ModuleCode == item.ModuleCode && s.SettingKey == item.SettingKey, ct);
            if (row is null)
            {
                db.CfgModuleSettings.Add(new CfgModuleSetting
                {
                    ModuleCode = item.ModuleCode,
                    SettingKey = item.SettingKey,
                    SettingValue = item.SettingValue,
                    DataType = item.DataType,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                row.SettingValue = item.SettingValue;
                row.DataType = item.DataType;
                row.UpdatedAt = DateTime.UtcNow;
            }
        }
        await db.SaveChangesAsync(ct);
        return await GetModuleSettingsAsync(ct);
    }

    private static CompanyProfileDto MapProfile(CfgCompanyProfile p) =>
        new(
            p.Id,
            p.LegalName,
            p.TradeName,
            p.TaxNumber,
            p.TaxOffice,
            p.Address,
            p.CityId,
            p.DistrictId,
            p.Phone,
            p.Email,
            p.Website,
            p.DefaultCurrencyId,
            p.FiscalYearStartMonth,
            p.IsEinvoiceUser,
            p.IsEarchiveUser,
            p.IsEwaybillUser,
            p.EinvoiceAlias,
            p.EwaybillAlias);
}
