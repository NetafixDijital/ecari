using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class CariAccountService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    CshAccountService cshService,
    BnkAccountService bnkService)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi. Önce /api/auth/select-company çağırın."));

    public async Task<IReadOnlyList<CariAccountListItemDto>> ListAsync(
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.CariAccounts.AsNoTracking().Where(a => !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a =>
                a.Title.Contains(term) ||
                a.Code.Contains(term) ||
                (a.Phone != null && a.Phone.Contains(term)) ||
                (a.Email != null && a.Email.Contains(term)));
        }

        var accounts = await query.OrderBy(a => a.Title).ToListAsync(ct);
        var accountIds = accounts.Select(a => a.Id).ToList();

        var balances = await db.CariAccountBalances.AsNoTracking()
            .Where(b => accountIds.Contains(b.AccountId))
            .ToDictionaryAsync(b => b.AccountId, b => b.Balance, ct);

        return accounts.Select(a =>
        {
            var balance = balances.TryGetValue(a.Id, out var b) ? b : 0m;
            var side = balance > 0 ? "A" : balance < 0 ? "B" : "";
            return new CariAccountListItemDto(
                a.Id,
                a.Code,
                a.Title,
                a.AccountType,
                a.PersonType,
                a.TaxNumber,
                a.IdentityNumber,
                a.Phone,
                a.Email,
                balance,
                side,
                a.IsActive);
        }).ToList();
    }

    public async Task<CariAccountDetailDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var account = await db.CariAccounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);

        if (account is null)
            return null;

        var balance = await db.CariAccountBalances.AsNoTracking()
            .Where(b => b.AccountId == id)
            .Select(b => b.Balance)
            .FirstOrDefaultAsync(ct);

        return MapDetail(account, balance);
    }

    public async Task<CariTaxIdCheckDto> CheckTaxIdAsync(
        string personType,
        string taxId,
        long? excludeAccountId = null,
        CancellationToken ct = default)
    {
        var normalized = CariTaxIdValidator.Normalize(taxId);
        var isTuzel = personType == "TUZEL_KISI";
        var label = isTuzel ? "VKN" : "TCKN";

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return new CariTaxIdCheckDto(
                false,
                false,
                null,
                null,
                null,
                $"{label} giriniz.");
        }

        var existing = await FindByTaxIdAsync(personType, normalized, excludeAccountId, ct);
        if (existing is null)
        {
            return new CariTaxIdCheckDto(
                false,
                true,
                null,
                null,
                null,
                $"Bu {label} ile kayıtlı cari hesap bulunmuyor.");
        }

        return new CariTaxIdCheckDto(
            true,
            true,
            existing.Id,
            existing.Code,
            existing.Title,
            $"Bu {label} zaten kayıtlı: {existing.Code} — {existing.Title}");
    }

    public async Task<CariAccountDetailDto> CreateAsync(
        CreateCariAccountRequest request,
        CancellationToken ct = default)
    {
        var taxNumber = request.PersonType == "TUZEL_KISI"
            ? CariTaxIdValidator.Normalize(request.TaxNumber)
            : null;
        var identityNumber = request.PersonType == "GERCEK_KISI"
            ? CariTaxIdValidator.Normalize(request.IdentityNumber)
            : null;

        ValidatePersonType(request.PersonType, taxNumber, identityNumber);
        await EnsureTaxIdAvailableAsync(request.PersonType, taxNumber, identityNumber, null, ct);
        await ValidateReferencesAsync(request.CityId, request.DistrictId, request.PaymentTermId, ct);

        var db = Db;
        var currencyId = await db.Currencies.AsNoTracking()
            .Where(c => c.IsActive && c.Code == "TRY")
            .Select(c => c.Id)
            .FirstOrDefaultAsync(ct);

        if (currencyId == 0)
        {
            currencyId = await db.Currencies.AsNoTracking()
                .Where(c => c.IsActive)
                .Select(c => c.Id)
                .FirstAsync(ct);
        }

        var code = await GenerateNextCodeAsync(db, ct);
        var orgUserId = tenant.GetOrgUserId();

        var account = new CariAccount
        {
            Code = code,
            AccountType = request.AccountType,
            Title = request.Title.Trim(),
            PersonType = request.PersonType,
            AddressLine = request.AddressLine,
            CityId = request.CityId,
            DistrictId = request.DistrictId,
            CountryCode = string.IsNullOrWhiteSpace(request.CountryCode) ? "TR" : request.CountryCode.Trim().ToUpperInvariant(),
            PostalCode = request.PostalCode?.Trim(),
            PaymentTermId = request.PaymentTermId,
            DueDays = await ResolveDueDaysAsync(db, request.PaymentTermId, request.DueDays, ct),
            TaxNumber = request.PersonType == "TUZEL_KISI" ? taxNumber : null,
            IdentityNumber = request.PersonType == "GERCEK_KISI" ? identityNumber : null,
            TaxOffice = request.TaxOffice,
            Phone = request.Phone,
            Email = request.Email,
            CurrencyId = currencyId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = orgUserId
        };

        db.CariAccounts.Add(account);
        await db.SaveChangesAsync(ct);

        return MapDetail(account, 0m);
    }

    public async Task<CariAccountDetailDto?> UpdateAsync(
        long id,
        UpdateCariAccountRequest request,
        CancellationToken ct = default)
    {
        var db = Db;
        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);

        if (account is null)
            return null;

        var taxNumber = account.PersonType == "TUZEL_KISI"
            ? CariTaxIdValidator.Normalize(request.TaxNumber)
            : null;
        var identityNumber = account.PersonType == "GERCEK_KISI"
            ? CariTaxIdValidator.Normalize(request.IdentityNumber)
            : null;

        ValidatePersonType(account.PersonType, taxNumber, identityNumber);
        await EnsureTaxIdAvailableAsync(account.PersonType, taxNumber, identityNumber, id, ct);
        await ValidateReferencesAsync(request.CityId, request.DistrictId, request.PaymentTermId, ct);

        account.Title = request.Title.Trim();
        account.TaxNumber = account.PersonType == "TUZEL_KISI" ? taxNumber : null;
        account.IdentityNumber = account.PersonType == "GERCEK_KISI" ? identityNumber : null;
        account.TaxOffice = request.TaxOffice;
        account.Phone = request.Phone;
        account.Email = request.Email;
        account.AddressLine = request.AddressLine;
        account.CityId = request.CityId;
        account.DistrictId = request.DistrictId;
        account.CountryCode = string.IsNullOrWhiteSpace(request.CountryCode) ? "TR" : request.CountryCode.Trim().ToUpperInvariant();
        account.PostalCode = request.PostalCode?.Trim();
        account.PaymentTermId = request.PaymentTermId;
        account.DueDays = await ResolveDueDaysAsync(db, request.PaymentTermId, request.DueDays, ct);
        account.IsActive = request.IsActive;
        account.UpdatedAt = DateTime.UtcNow;
        account.UpdatedBy = tenant.GetOrgUserId();

        await db.SaveChangesAsync(ct);

        var balance = await db.CariAccountBalances.AsNoTracking()
            .Where(b => b.AccountId == id)
            .Select(b => b.Balance)
            .FirstOrDefaultAsync(ct);

        return MapDetail(account, balance);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);

        if (account is null)
            return false;

        account.IsDeleted = true;
        account.DeletedAt = DateTime.UtcNow;
        account.DeletedBy = tenant.GetOrgUserId();
        account.IsActive = false;

        await db.SaveChangesAsync(ct);
        return true;
    }

    private static CariAccountDetailDto MapDetail(CariAccount account, decimal balance) =>
        new(
            account.Id,
            account.Code,
            account.AccountType,
            account.Title,
            account.PersonType,
            account.AddressLine,
            account.CityId,
            account.DistrictId,
            account.CountryCode,
            account.PostalCode,
            account.PaymentTermId,
            account.DueDays,
            account.TaxNumber,
            account.IdentityNumber,
            account.TaxOffice,
            account.Phone,
            account.Email,
            balance,
            account.IsActive);

    private static async Task<int?> ResolveDueDaysAsync(
        TenantDbContext db,
        long? paymentTermId,
        int? dueDays,
        CancellationToken ct)
    {
        if (dueDays.HasValue)
            return dueDays;

        if (!paymentTermId.HasValue)
            return null;

        return await db.PaymentTerms.AsNoTracking()
            .Where(p => p.Id == paymentTermId.Value)
            .Select(p => (int?)p.DueDays)
            .FirstOrDefaultAsync(ct);
    }

    private static void ValidatePersonType(string personType, string? taxNumber, string? identityNumber)
    {
        if (personType == "TUZEL_KISI")
        {
            if (string.IsNullOrWhiteSpace(taxNumber))
                throw new ArgumentException("Tüzel kişi için VKN zorunludur.");
            return;
        }

        if (personType == "GERCEK_KISI")
        {
            if (string.IsNullOrWhiteSpace(identityNumber))
                throw new ArgumentException("Gerçek kişi için TCKN zorunludur.");
            return;
        }

        throw new ArgumentException("Geçersiz müşteri tipi.");
    }

    private async Task<CariAccount?> FindByTaxIdAsync(
        string personType,
        string? taxNumber,
        string? identityNumber,
        long? excludeAccountId,
        CancellationToken ct)
    {
        var db = Db;
        var query = db.CariAccounts.AsNoTracking().Where(a => !a.IsDeleted);

        if (excludeAccountId.HasValue)
            query = query.Where(a => a.Id != excludeAccountId.Value);

        if (personType == "TUZEL_KISI" && !string.IsNullOrWhiteSpace(taxNumber))
            return await query.FirstOrDefaultAsync(a => a.TaxNumber == taxNumber, ct);

        if (personType == "GERCEK_KISI" && !string.IsNullOrWhiteSpace(identityNumber))
            return await query.FirstOrDefaultAsync(a => a.IdentityNumber == identityNumber, ct);

        return null;
    }

    private Task<CariAccount?> FindByTaxIdAsync(
        string personType,
        string normalizedTaxId,
        long? excludeAccountId,
        CancellationToken ct)
    {
        return personType == "TUZEL_KISI"
            ? FindByTaxIdAsync(personType, normalizedTaxId, null, excludeAccountId, ct)
            : FindByTaxIdAsync(personType, null, normalizedTaxId, excludeAccountId, ct);
    }

    private async Task EnsureTaxIdAvailableAsync(
        string personType,
        string? taxNumber,
        string? identityNumber,
        long? excludeAccountId,
        CancellationToken ct)
    {
        var existing = await FindByTaxIdAsync(personType, taxNumber, identityNumber, excludeAccountId, ct);
        if (existing is null)
            return;

        var label = personType == "TUZEL_KISI" ? "VKN" : "TCKN";
        throw new InvalidOperationException(
            $"Bu {label} zaten kayıtlı: {existing.Code} — {existing.Title}");
    }

    private async Task ValidateReferencesAsync(
        long? cityId,
        long? districtId,
        long? paymentTermId,
        CancellationToken ct)
    {
        var db = Db;

        if (cityId.HasValue)
        {
            var cityExists = await db.Cities.AsNoTracking()
                .AnyAsync(c => c.Id == cityId.Value, ct);
            if (!cityExists)
                throw new ArgumentException("Seçilen il geçersiz.");
        }

        if (districtId.HasValue)
        {
            var district = await db.Districts.AsNoTracking()
                .Where(d => d.Id == districtId.Value)
                .Select(d => new { d.Id, d.CityId })
                .FirstOrDefaultAsync(ct);

            if (district is null)
                throw new ArgumentException("Seçilen ilçe geçersiz.");

            if (cityId.HasValue && district.CityId != cityId.Value)
                throw new ArgumentException("İlçe, seçilen ile ait değil.");
        }

        if (paymentTermId.HasValue)
        {
            var termExists = await db.PaymentTerms.AsNoTracking()
                .AnyAsync(p => p.Id == paymentTermId.Value, ct);
            if (!termExists)
                throw new ArgumentException("Seçilen ödeme vadesi geçersiz.");
        }
    }

    private static async Task<string> GenerateNextCodeAsync(TenantDbContext db, CancellationToken ct)
    {
        var lastCode = await db.CariAccounts.AsNoTracking()
            .Where(a => a.Code.StartsWith("M"))
            .OrderByDescending(a => a.Code)
            .Select(a => a.Code)
            .FirstOrDefaultAsync(ct);

        if (lastCode is null || lastCode.Length < 2 || !int.TryParse(lastCode[1..], out var number))
            return "M00001";

        return $"M{(number + 1):D5}";
    }

    public async Task<IReadOnlyList<CariMovementListItemDto>> ListMovementsAsync(
        long? accountId,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.CariMovements.AsNoTracking()
            .Include(m => m.Account)
            .Where(m => !m.IsDeleted);

        if (accountId.HasValue)
            query = query.Where(m => m.AccountId == accountId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(m =>
                (m.DocumentNo != null && m.DocumentNo.Contains(term)) ||
                (m.Description != null && m.Description.Contains(term)) ||
                m.Account.Title.Contains(term) ||
                m.Account.Code.Contains(term));
        }

        var movements = await query
            .OrderBy(m => m.MovementDate)
            .ThenBy(m => m.Id)
            .ToListAsync(ct);

        var result = new List<CariMovementListItemDto>();
        var runningByAccount = new Dictionary<long, decimal>();

        foreach (var m in movements)
        {
            if (!runningByAccount.ContainsKey(m.AccountId))
                runningByAccount[m.AccountId] = 0;
            runningByAccount[m.AccountId] += m.Debit - m.Credit;

            result.Add(new CariMovementListItemDto(
                m.Id,
                m.AccountId,
                m.Account.Code,
                m.Account.Title,
                m.MovementDate,
                m.MovementType,
                MapMovementTypeLabel(m.MovementType),
                m.DocumentNo,
                m.Description,
                m.Debit,
                m.Credit,
                runningByAccount[m.AccountId]));
        }

        return result.OrderByDescending(m => m.MovementDate).ThenByDescending(m => m.Id).ToList();
    }

    public async Task RecordCollectionAsync(CariCollectionRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        var method = request.PaymentMethod.ToUpperInvariant() switch
        {
            "CASH" or "KASA" => "CASH",
            "BANK" or "BANKA" => "BANK",
            "CHECK" or "CEK" or "CEK_SENET" => "CHECK",
            _ => throw new InvalidOperationException("Geçerli ödeme yöntemi: CASH, BANK veya CHECK"),
        };

        if (method == "CASH")
        {
            if (!request.CashAccountId.HasValue)
                throw new InvalidOperationException("Kasa seçin.");

            await cshService.RecordCollectionAsync(new CshPaymentRequest(
                request.AccountId,
                request.CashAccountId.Value,
                request.Amount,
                request.TransactionDate,
                request.Description), ct);
            return;
        }

        if (method == "BANK")
        {
            if (!request.BankAccountId.HasValue)
                throw new InvalidOperationException("Banka hesabı seçin.");

            await bnkService.RecordIncomingAsync(new BnkPaymentRequest(
                request.BankAccountId.Value,
                request.AccountId,
                request.Amount,
                request.TransactionDate,
                request.Description), ct);
            return;
        }

        await RecordCheckCollectionAsync(request, ct);
    }

    private async Task RecordCheckCollectionAsync(CariCollectionRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CheckInstrumentNo))
            throw new InvalidOperationException("Çek/senet numarası zorunlu.");
        if (!request.CheckDueDate.HasValue)
            throw new InvalidOperationException("Çek/senet vade tarihi zorunlu.");

        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var portfolio = await db.ChqPortfolios.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PortfolioType == "RECEIVED" && p.IsActive, ct)
            ?? throw new InvalidOperationException("Tahsilat çek portföyü tanımlı değil.");

        var currencyId = account.CurrencyId;
        var refNo = request.CheckInstrumentNo.Trim();
        var description = request.Description?.Trim() ?? $"Çek tahsilat — {refNo}";

        db.ChqInstruments.Add(new ChqInstrument
        {
            InstrumentType = "CEK",
            Direction = "RECEIVED",
            PortfolioId = portfolio.Id,
            AccountId = account.Id,
            BankName = request.CheckBankName?.Trim(),
            InstrumentNo = refNo,
            IssueDate = request.TransactionDate,
            DueDate = request.CheckDueDate.Value,
            Amount = request.Amount,
            CurrencyId = currencyId,
            Status = "PORTFOLIO",
            Notes = description,
            CreatedAt = DateTime.UtcNow,
        });

        db.CariMovements.Add(new CariMovement
        {
            AccountId = account.Id,
            MovementDate = request.TransactionDate,
            MovementType = "COLLECTION",
            Debit = 0,
            Credit = request.Amount,
            CurrencyId = currencyId,
            DocumentModule = "CHQ",
            DocumentNo = refNo,
            Description = description,
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task RecordTransferAsync(CariTransferRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Tutar sıfırdan büyük olmalı.");

        if (request.SourceAccountId == request.TargetAccountId)
            throw new InvalidOperationException("Kaynak ve hedef cari aynı olamaz.");

        var db = Db;
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var source = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.SourceAccountId && !a.IsDeleted && a.IsActive, ct)
            ?? throw new InvalidOperationException("Kaynak cari hesap bulunamadı.");

        var target = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == request.TargetAccountId && !a.IsDeleted && a.IsActive, ct)
            ?? throw new InvalidOperationException("Hedef cari hesap bulunamadı.");

        var refNo = $"VRM-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var description = request.Description?.Trim()
            ?? $"Virman {source.Code} → {target.Code}";

        db.CariMovements.Add(new CariMovement
        {
            AccountId = source.Id,
            MovementDate = request.TransferDate,
            MovementType = "TRANSFER",
            Debit = 0,
            Credit = request.Amount,
            CurrencyId = source.CurrencyId,
            DocumentModule = "CARI",
            DocumentNo = refNo,
            Description = $"Virman → {target.Code}",
            CreatedAt = DateTime.UtcNow,
        });

        db.CariMovements.Add(new CariMovement
        {
            AccountId = target.Id,
            MovementDate = request.TransferDate,
            MovementType = "TRANSFER",
            Debit = request.Amount,
            Credit = 0,
            CurrencyId = target.CurrencyId,
            DocumentModule = "CARI",
            DocumentNo = refNo,
            Description = $"Virman — {source.Code}",
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    private static string MapMovementTypeLabel(string movementType) => movementType switch
    {
        "INVOICE" => "Fatura",
        "COLLECTION" => "Tahsilat",
        "PAYMENT" => "Tediye",
        "TRANSFER" => "Virman",
        _ => movementType,
    };
}
