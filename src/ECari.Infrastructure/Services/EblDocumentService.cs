using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using ECari.Infrastructure.Integrations.Edm;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class EblDocumentService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant,
    EblIntegratorService integratorService,
    EdmSoapClient edmSoapClient,
    EdmSessionManager sessionManager)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<EblGibCheckResultDto> CheckCariGibUserAsync(long accountId, CancellationToken ct = default)
    {
        var db = Db;
        var account = await db.CariAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && !a.IsDeleted, ct)
            ?? throw new InvalidOperationException("Cari hesap bulunamadı.");

        var taxId = account.TaxNumber ?? account.IdentityNumber;
        if (string.IsNullOrWhiteSpace(taxId))
            throw new InvalidOperationException("Cari için VKN/TCKN tanımlı değil.");

        var (integrator, credential, password) = await integratorService.ResolveActiveCredentialAsync(ct);
        var cacheKey = BuildSessionKey(integrator.Id, credential.Environment);
        var sessionId = await sessionManager.GetSessionAsync(
            cacheKey, integrator.ApiBaseUrl, credential.Username, password, ct);

        IReadOnlyList<EdmGibUser> users;
        try
        {
            users = await edmSoapClient.CheckUserAsync(integrator.ApiBaseUrl, sessionId, taxId, ct);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("session", StringComparison.OrdinalIgnoreCase))
        {
            sessionManager.Invalidate(cacheKey);
            sessionId = await sessionManager.GetSessionAsync(
                cacheKey, integrator.ApiBaseUrl, credential.Username, password, ct);
            users = await edmSoapClient.CheckUserAsync(integrator.ApiBaseUrl, sessionId, taxId, ct);
        }

        var match = users.FirstOrDefault(u =>
            string.Equals(u.Identifier, taxId, StringComparison.OrdinalIgnoreCase))
            ?? users.FirstOrDefault();

        var isEinvoiceUser = match is not null && !string.IsNullOrWhiteSpace(match.Alias);
        account.IsEinvoiceUser = isEinvoiceUser;
        account.EinvoiceAlias = match?.Alias;
        account.GibEinvoiceCheckedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(match?.Title))
            account.GibTitleFetchedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return new EblGibCheckResultDto(
            isEinvoiceUser,
            match?.Alias,
            match?.Title,
            isEinvoiceUser
                ? $"GİB e-Fatura kullanıcısı: {match?.Alias}"
                : "GİB e-Fatura kaydı bulunamadı.",
            account.GibEinvoiceCheckedAt.Value);
    }

    public async Task<EblEinvoiceRecordDto?> GetInvoiceRecordAsync(long invoiceId, CancellationToken ct = default)
    {
        var record = await Db.EblEinvoiceRecords.AsNoTracking()
            .Where(r => r.InvoiceId == invoiceId)
            .OrderByDescending(r => r.Id)
            .FirstOrDefaultAsync(ct);

        return record is null ? null : MapEinvoice(record);
    }

    public async Task<EblSendResultDto> SendInvoiceAsync(long invoiceId, CancellationToken ct = default)
    {
        var db = Db;
        var invoice = await db.InvInvoices
            .Include(i => i.Account)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Fatura bulunamadı.");

        if (invoice.InvoiceType is not ("SALES" or "SALES_RETURN"))
            throw new InvalidOperationException("Yalnızca satış faturaları e-Fatura olarak gönderilebilir.");

        var existing = await db.EblEinvoiceRecords
            .Where(r => r.InvoiceId == invoiceId &&
                (r.Status == "SENT" || r.Status == "ACCEPTED" || r.Status == "PENDING"))
            .FirstOrDefaultAsync(ct);
        if (existing is not null)
            throw new InvalidOperationException($"Bu fatura zaten gönderilmiş: {existing.Status}");

        var profile = await db.CompanyProfiles.FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Firma profili tanımlı değil.");

        if (string.IsNullOrWhiteSpace(profile.EinvoiceAlias))
            throw new InvalidOperationException("Firma e-Fatura GB etiketi (alias) tanımlı değil.");

        var account = invoice.Account;
        if (!account.IsEinvoiceUser || string.IsNullOrWhiteSpace(account.EinvoiceAlias))
        {
            await CheckCariGibUserAsync(account.Id, ct);
            account = await db.CariAccounts.FirstAsync(a => a.Id == account.Id, ct);
            if (!account.IsEinvoiceUser || string.IsNullOrWhiteSpace(account.EinvoiceAlias))
                throw new InvalidOperationException("Cari GİB e-Fatura kullanıcısı değil veya alias bulunamadı.");
        }

        var lines = await db.InvInvoiceLines.AsNoTracking()
            .Where(l => l.InvoiceId == invoiceId && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);
        if (lines.Count == 0)
            throw new InvalidOperationException("Fatura kalemi bulunamadı.");

        var taxRates = await db.TaxRates.AsNoTracking()
            .ToDictionaryAsync(t => t.Id, ct);
        var unitMap = await db.StkUnits.AsNoTracking()
            .ToDictionaryAsync(u => u.Id, u => u.Code, ct);

        var (integrator, credential, password) = await integratorService.ResolveActiveCredentialAsync(ct);
        var uuid = Guid.NewGuid().ToString();
        var ublLines = lines.Select(l =>
        {
            var taxPercent = taxRates.TryGetValue(l.TaxRateId, out var tax) ? tax.Rate : 0m;
            var unitCode = unitMap.TryGetValue(l.UnitId, out var code) ? MapUnitCode(code) : "C62";
            return new UblInvoiceLine(
                l.LineNo,
                l.Description,
                l.Quantity,
                unitCode,
                l.UnitPrice,
                taxPercent,
                l.LineTotal,
                l.TaxAmount);
        }).ToList();

        var supplierTaxId = profile.TaxNumber;
        var customerTaxId = account.TaxNumber ?? account.IdentityNumber
            ?? throw new InvalidOperationException("Cari VKN/TCKN eksik.");

        var ublContext = new UblInvoiceContext(
            uuid,
            invoice.DocumentNo,
            invoice.DocumentDate,
            invoice.DueDate,
            invoice.EInvoiceType ?? "TEMELFATURA",
            invoice.InvoiceType == "SALES_RETURN" ? "IADE" : "SATIS",
            new UblParty(supplierTaxId, profile.LegalName, profile.TaxOffice, profile.Address, null, null, profile.Email, profile.Phone),
            new UblParty(customerTaxId, account.Title, account.TaxOffice, account.AddressLine, null, null, account.Email, account.Phone),
            ublLines,
            invoice.Subtotal,
            invoice.TaxTotal,
            invoice.GrandTotal);

        var ublXml = UblTrInvoiceBuilder.BuildXml(ublContext);
        var ublBase64 = UblTrInvoiceBuilder.ToBase64(ublXml);

        var record = new EblEinvoiceRecord
        {
            InvoiceId = invoiceId,
            IntegratorId = integrator.Id,
            Uuid = uuid,
            Ettn = uuid,
            Scenario = invoice.InvoiceScenario ?? "TICARIFATURA",
            ProfileId = ublContext.ProfileId,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };
        db.EblEinvoiceRecords.Add(record);
        await db.SaveChangesAsync(ct);

        var cacheKey = BuildSessionKey(integrator.Id, credential.Environment);
        var sessionId = await sessionManager.GetSessionAsync(
            cacheKey, integrator.ApiBaseUrl, credential.Username, password, ct);

        EdmSendResult sendResult;
        try
        {
            sendResult = await edmSoapClient.SendInvoiceAsync(
                integrator.ApiBaseUrl,
                sessionId,
                new EdmInvoicePayload(
                    uuid,
                    supplierTaxId,
                    profile.EinvoiceAlias!,
                    customerTaxId,
                    account.EinvoiceAlias!,
                    ublBase64),
                ct);
        }
        catch (Exception ex)
        {
            await UpdateEinvoiceStatusAsync(db, record, "ERROR", ex.Message, ct);
            throw;
        }

        await UpdateEinvoiceStatusAsync(db, record, NormalizeStatus(sendResult.Status), sendResult.Message, ct);
        record.SentAt = DateTime.UtcNow;
        record.ResponseAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new EblSendResultDto(true, uuid, record.Status, sendResult.Message);
    }

    public async Task<EblEinvoiceRecordDto> RefreshInvoiceStatusAsync(long invoiceId, CancellationToken ct = default)
    {
        var db = Db;
        var record = await db.EblEinvoiceRecords
            .Include(r => r.Integrator)
            .Where(r => r.InvoiceId == invoiceId)
            .OrderByDescending(r => r.Id)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("e-Fatura kaydı bulunamadı.");

        var (integrator, credential, password) = await integratorService.ResolveActiveCredentialAsync(ct);
        var cacheKey = BuildSessionKey(integrator.Id, credential.Environment);
        var sessionId = await sessionManager.GetSessionAsync(
            cacheKey, integrator.ApiBaseUrl, credential.Username, password, ct);

        var status = await edmSoapClient.GetInvoiceStatusAsync(
            integrator.ApiBaseUrl, sessionId, record.Uuid, ct);

        await UpdateEinvoiceStatusAsync(db, record, NormalizeStatus(status.Status), status.Message, ct);
        record.ResponseAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return MapEinvoice(record);
    }

    public async Task<EblEwaybillRecordDto?> GetDeliveryNoteRecordAsync(long deliveryNoteId, CancellationToken ct = default)
    {
        var record = await Db.EblEwaybillRecords.AsNoTracking()
            .Where(r => r.DeliveryNoteId == deliveryNoteId)
            .OrderByDescending(r => r.Id)
            .FirstOrDefaultAsync(ct);

        return record is null ? null : MapEwaybill(record);
    }

    public async Task<EblSendResultDto> SendDeliveryNoteAsync(long deliveryNoteId, CancellationToken ct = default)
    {
        var db = Db;
        var note = await db.DlnDeliveryNotes
            .Include(n => n.Account)
            .FirstOrDefaultAsync(n => n.Id == deliveryNoteId && !n.IsDeleted, ct)
            ?? throw new InvalidOperationException("İrsaliye bulunamadı.");

        if (note.DocumentType is not ("SALES" or "SATIS"))
            throw new InvalidOperationException("Yalnızca satış irsaliyeleri e-İrsaliye olarak gönderilebilir.");

        var existing = await db.EblEwaybillRecords
            .Where(r => r.DeliveryNoteId == deliveryNoteId &&
                (r.Status == "SENT" || r.Status == "ACCEPTED" || r.Status == "PENDING"))
            .FirstOrDefaultAsync(ct);
        if (existing is not null)
            throw new InvalidOperationException($"Bu irsaliye zaten gönderilmiş: {existing.Status}");

        var profile = await db.CompanyProfiles.FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Firma profili tanımlı değil.");

        if (string.IsNullOrWhiteSpace(profile.EwaybillAlias))
            throw new InvalidOperationException("Firma e-İrsaliye GB etiketi (alias) tanımlı değil.");

        var account = note.Account;
        if (string.IsNullOrWhiteSpace(account.EwaybillAlias))
        {
            if (string.IsNullOrWhiteSpace(account.EinvoiceAlias))
                await CheckCariGibUserAsync(account.Id, ct);
            account = await db.CariAccounts.FirstAsync(a => a.Id == account.Id, ct);
        }

        var receiverAlias = account.EwaybillAlias ?? account.EinvoiceAlias
            ?? throw new InvalidOperationException("Cari e-İrsaliye/e-Fatura alias bulunamadı.");

        var lines = await db.DlnDeliveryNoteLines.AsNoTracking()
            .Where(l => l.DeliveryNoteId == deliveryNoteId && !l.IsDeleted)
            .OrderBy(l => l.LineNo)
            .ToListAsync(ct);
        if (lines.Count == 0)
            throw new InvalidOperationException("İrsaliye kalemi bulunamadı.");

        var unitMap = await db.StkUnits.AsNoTracking()
            .ToDictionaryAsync(u => u.Id, u => u.Code, ct);

        var (integrator, credential, password) = await integratorService.ResolveActiveCredentialAsync(ct);
        var ewaybillUrl = integrator.ApiEwaybillUrl
            ?? integrator.ApiBaseUrl.Replace("EFaturaEDM", "EIrsaliyeEDM", StringComparison.OrdinalIgnoreCase);

        var uuid = Guid.NewGuid().ToString();
        var ublLines = lines.Select(l => new UblDespatchLine(
            l.LineNo,
            l.Description,
            l.Quantity,
            unitMap.TryGetValue(l.UnitId, out var code) ? MapUnitCode(code) : "C62")).ToList();

        var supplierTaxId = profile.TaxNumber;
        var customerTaxId = account.TaxNumber ?? account.IdentityNumber
            ?? throw new InvalidOperationException("Cari VKN/TCKN eksik.");

        var ublContext = new UblDespatchContext(
            uuid,
            note.DocumentNo,
            note.DocumentDate,
            new UblParty(supplierTaxId, profile.LegalName, profile.TaxOffice, profile.Address, null, null, profile.Email, profile.Phone),
            new UblParty(customerTaxId, account.Title, account.TaxOffice, account.AddressLine, null, null, account.Email, account.Phone),
            ublLines,
            note.DriverName,
            note.VehiclePlate);

        var ublBase64 = UblTrDespatchBuilder.ToBase64(UblTrDespatchBuilder.BuildXml(ublContext));

        var record = new EblEwaybillRecord
        {
            DeliveryNoteId = deliveryNoteId,
            IntegratorId = integrator.Id,
            Uuid = uuid,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };
        db.EblEwaybillRecords.Add(record);
        await db.SaveChangesAsync(ct);

        var cacheKey = BuildSessionKey(integrator.Id, credential.Environment) + ":ewaybill";
        var sessionId = await sessionManager.GetSessionAsync(
            cacheKey, ewaybillUrl, credential.Username, password, ct, "IEIrsaliyeEDM");

        EdmSendResult sendResult;
        try
        {
            sendResult = await edmSoapClient.SendDespatchAsync(
                ewaybillUrl,
                sessionId,
                new EdmDespatchPayload(
                    uuid,
                    supplierTaxId,
                    profile.EwaybillAlias!,
                    customerTaxId,
                    receiverAlias,
                    ublBase64),
                ct);
        }
        catch (Exception ex)
        {
            await UpdateEwaybillStatusAsync(db, record, "ERROR", ex.Message, ct);
            throw;
        }

        await UpdateEwaybillStatusAsync(db, record, NormalizeStatus(sendResult.Status), sendResult.Message, ct);
        record.SentAt = DateTime.UtcNow;
        record.ResponseAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new EblSendResultDto(true, uuid, record.Status, sendResult.Message);
    }

    public async Task<EblEwaybillRecordDto> RefreshDeliveryNoteStatusAsync(long deliveryNoteId, CancellationToken ct = default)
    {
        var db = Db;
        var record = await db.EblEwaybillRecords
            .Include(r => r.Integrator)
            .Where(r => r.DeliveryNoteId == deliveryNoteId)
            .OrderByDescending(r => r.Id)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("e-İrsaliye kaydı bulunamadı.");

        var (integrator, credential, password) = await integratorService.ResolveActiveCredentialAsync(ct);
        var ewaybillUrl = integrator.ApiEwaybillUrl
            ?? integrator.ApiBaseUrl.Replace("EFaturaEDM", "EIrsaliyeEDM", StringComparison.OrdinalIgnoreCase);
        var cacheKey = BuildSessionKey(integrator.Id, credential.Environment) + ":ewaybill";
        var sessionId = await sessionManager.GetSessionAsync(
            cacheKey, ewaybillUrl, credential.Username, password, ct, "IEIrsaliyeEDM");

        var status = await edmSoapClient.GetDespatchStatusAsync(
            ewaybillUrl, sessionId, record.Uuid, ct);

        await UpdateEwaybillStatusAsync(db, record, NormalizeStatus(status.Status), status.Message, ct);
        record.ResponseAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return MapEwaybill(record);
    }

    private static string BuildSessionKey(long integratorId, string environment) =>
        $"{integratorId}:{environment}";

    private static string MapUnitCode(string? code) =>
        code?.ToUpperInvariant() switch
        {
            "ADET" or "ADT" or "PCS" => "C62",
            "KG" or "KGM" => "KGM",
            "LT" or "LTR" => "LTR",
            "M" or "MTR" => "MTR",
            _ => "C62"
        };

    private static string NormalizeStatus(string status)
    {
        var upper = status.ToUpperInvariant();
        if (upper.Contains("ACCEPT", StringComparison.Ordinal) || upper.Contains("KABUL", StringComparison.Ordinal))
            return "ACCEPTED";
        if (upper.Contains("REJECT", StringComparison.Ordinal) || upper.Contains("RED", StringComparison.Ordinal))
            return "REJECTED";
        if (upper.Contains("ERROR", StringComparison.Ordinal) || upper.Contains("FAIL", StringComparison.Ordinal))
            return "ERROR";
        if (upper.Contains("WAIT", StringComparison.Ordinal) || upper.Contains("PEND", StringComparison.Ordinal))
            return "PENDING";
        return "SENT";
    }

    private static async Task UpdateEinvoiceStatusAsync(
        TenantDbContext db,
        EblEinvoiceRecord record,
        string newStatus,
        string message,
        CancellationToken ct)
    {
        var oldStatus = record.Status;
        record.Status = newStatus;
        record.StatusMessage = message.Length > 500 ? message[..500] : message;
        record.UpdatedAt = DateTime.UtcNow;
        db.EblStatusHistories.Add(new EblStatusHistory
        {
            RecordModule = "EINVOICE",
            RecordId = record.Id,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            ChangedAt = DateTime.UtcNow,
            ResponsePayload = message
        });
        await db.SaveChangesAsync(ct);
    }

    private static async Task UpdateEwaybillStatusAsync(
        TenantDbContext db,
        EblEwaybillRecord record,
        string newStatus,
        string message,
        CancellationToken ct)
    {
        var oldStatus = record.Status;
        record.Status = newStatus;
        record.StatusMessage = message.Length > 500 ? message[..500] : message;
        record.UpdatedAt = DateTime.UtcNow;
        db.EblStatusHistories.Add(new EblStatusHistory
        {
            RecordModule = "EWAYBILL",
            RecordId = record.Id,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            ChangedAt = DateTime.UtcNow,
            ResponsePayload = message
        });
        await db.SaveChangesAsync(ct);
    }

    private static EblEinvoiceRecordDto MapEinvoice(EblEinvoiceRecord record) =>
        new(record.Id, record.InvoiceId, record.Uuid, record.Status, record.StatusMessage,
            record.ProfileId, record.SentAt, record.ResponseAt);

    private static EblEwaybillRecordDto MapEwaybill(EblEwaybillRecord record) =>
        new(record.Id, record.DeliveryNoteId, record.Uuid, record.Status, record.StatusMessage,
            record.SentAt, record.ResponseAt);
}
