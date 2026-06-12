namespace ECari.Domain.Entities.Tenant;

public class TskTask
{
    public long Id { get; set; }
    public string TaskNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "PENDING";
    public string Priority { get; set; } = "NORMAL";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? AssigneeName { get; set; }
    public byte ProgressPercent { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
