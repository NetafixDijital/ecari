namespace ECari.Domain.Entities.Tenant;

public class EblIntegrator
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ApiBaseUrl { get; set; } = string.Empty;
    public string? ApiEwaybillUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public class EblIntegratorCredential
{
    public long Id { get; set; }
    public long IntegratorId { get; set; }
    public string Username { get; set; } = string.Empty;
    public byte[] PasswordEncrypted { get; set; } = Array.Empty<byte>();
    public byte[]? ApiKeyEncrypted { get; set; }
    public string Environment { get; set; } = "TEST";
    public long? BranchId { get; set; }
    public string? InvoiceSerialPrefix { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public EblIntegrator Integrator { get; set; } = null!;
}

public class EblEinvoiceRecord
{
    public long Id { get; set; }
    public long InvoiceId { get; set; }
    public long IntegratorId { get; set; }
    public string Uuid { get; set; } = string.Empty;
    public string? EnvelopeUuid { get; set; }
    public string? Ettn { get; set; }
    public string? Scenario { get; set; }
    public string? ProfileId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? StatusMessage { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ResponseAt { get; set; }
    public string? UblXmlPath { get; set; }
    public string? PdfPath { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public InvInvoice Invoice { get; set; } = null!;
    public EblIntegrator Integrator { get; set; } = null!;
}

public class EblEwaybillRecord
{
    public long Id { get; set; }
    public long DeliveryNoteId { get; set; }
    public long IntegratorId { get; set; }
    public string Uuid { get; set; } = string.Empty;
    public string Status { get; set; } = "DRAFT";
    public string? StatusMessage { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ResponseAt { get; set; }
    public string? UblXmlPath { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public DlnDeliveryNote DeliveryNote { get; set; } = null!;
    public EblIntegrator Integrator { get; set; } = null!;
}

public class EblIncomingDocument
{
    public long Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string Uuid { get; set; } = string.Empty;
    public string SenderVkn { get; set; } = string.Empty;
    public string SenderTitle { get; set; } = string.Empty;
    public DateOnly DocumentDate { get; set; }
    public decimal? Amount { get; set; }
    public string Status { get; set; } = "NEW";
    public long? MatchedInvoiceId { get; set; }
    public string? RawXmlPath { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class EblStatusHistory
{
    public long Id { get; set; }
    public string RecordModule { get; set; } = string.Empty;
    public long RecordId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? ResponsePayload { get; set; }
}
