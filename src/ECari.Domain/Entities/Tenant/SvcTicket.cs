namespace ECari.Domain.Entities.Tenant;

public class SvcTicket
{
    public long Id { get; set; }
    public string TicketNo { get; set; } = string.Empty;
    public DateTime TicketDate { get; set; }
    public long AccountId { get; set; }
    public string? DeviceName { get; set; }
    public string ProblemDescription { get; set; } = string.Empty;
    public string? TechnicianName { get; set; }
    public string Status { get; set; } = "WAITING";
    public string Priority { get; set; } = "NORMAL";
    public string? Resolution { get; set; }
    public DateTime? ClosedAt { get; set; }
    public long? InvoiceId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public CariAccount Account { get; set; } = null!;
    public ICollection<SvcTicketLine> Lines { get; set; } = new List<SvcTicketLine>();
}
