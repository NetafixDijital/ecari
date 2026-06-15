using ECari.Domain.Dtos;
using ECari.Domain.Entities.Tenant;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public class TskTaskService(
    TenantDbContextFactory tenantDbFactory,
    ITenantConnectionResolver tenant)
{
    private TenantDbContext Db => tenantDbFactory.Create(
        tenant.GetDatabaseName() ?? throw new InvalidOperationException("Şirket seçilmedi."));

    public async Task<IReadOnlyList<TskTaskListItemDto>> ListAsync(
        string? status,
        string? search,
        CancellationToken ct = default)
    {
        var db = Db;
        var query = db.TskTasks.AsNoTracking().Where(t => !t.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(t =>
                t.TaskNo.Contains(term) ||
                t.Title.Contains(term) ||
                (t.AssigneeName != null && t.AssigneeName.Contains(term)));
        }

        var items = await query.OrderByDescending(t => t.EndDate).ThenByDescending(t => t.Id).ToListAsync(ct);
        return items.Select(MapItem).ToList();
    }

    public async Task<TskTaskStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var items = await Db.TskTasks.AsNoTracking().Where(t => !t.IsDeleted).ToListAsync(ct);
        return new TskTaskStatsDto(
            items.Count(t => t.Status == "PENDING"),
            items.Count(t => t.Status == "IN_PROGRESS"),
            items.Count(t => t.Status == "OVERDUE"),
            items.Count(t => t.Status == "COMPLETED"));
    }

    public async Task<TskTaskListItemDto> CreateAsync(CreateTskTaskRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new InvalidOperationException("Görev başlığı zorunlu.");

        var db = Db;
        var taskNo = await GenerateTaskNoAsync(db, ct);
        var priority = request.Priority.ToUpperInvariant() switch
        {
            "LOW" or "DUSUK" => "LOW",
            "HIGH" or "YUKSEK" => "HIGH",
            "URGENT" or "ACIL" => "URGENT",
            _ => "NORMAL",
        };

        var entity = new TskTask
        {
            TaskNo = taskNo,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Status = "PENDING",
            Priority = priority,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            AssigneeName = request.AssigneeName?.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        db.TskTasks.Add(entity);
        await db.SaveChangesAsync(ct);
        return MapItem(entity);
    }

    public async Task<TskTaskListItemDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var entity = await Db.TskTasks.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        return entity is null ? null : MapItem(entity);
    }

    public async Task<TskTaskListItemDto?> UpdateAsync(long id, UpdateTskTaskRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new InvalidOperationException("Görev başlığı zorunlu.");

        var db = Db;
        var entity = await db.TskTasks.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (entity is null) return null;

        var priority = request.Priority.ToUpperInvariant() switch
        {
            "LOW" or "DUSUK" => "LOW",
            "HIGH" or "YUKSEK" => "HIGH",
            "URGENT" or "ACIL" => "URGENT",
            _ => "NORMAL",
        };

        entity.Title = request.Title.Trim();
        entity.Description = request.Description?.Trim();
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.AssigneeName = request.AssigneeName?.Trim();
        entity.Priority = priority;
        if (request.ProgressPercent.HasValue)
            entity.ProgressPercent = request.ProgressPercent.Value;

        await db.SaveChangesAsync(ct);
        return MapItem(entity);
    }

    public async Task<TskTaskListItemDto?> UpdateStatusAsync(long id, UpdateTskTaskStatusRequest request, CancellationToken ct = default)
    {
        var status = request.Status.ToUpperInvariant() switch
        {
            "PENDING" or "YAPILACAK" => "PENDING",
            "IN_PROGRESS" or "DEVAM" => "IN_PROGRESS",
            "OVERDUE" or "GECIKTI" => "OVERDUE",
            "COMPLETED" or "TAMAMLANDI" => "COMPLETED",
            _ => throw new InvalidOperationException("Geçerli durum: PENDING, IN_PROGRESS, OVERDUE, COMPLETED"),
        };

        var db = Db;
        var entity = await db.TskTasks.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (entity is null) return null;

        entity.Status = status;
        if (request.ProgressPercent.HasValue)
            entity.ProgressPercent = request.ProgressPercent.Value;
        else if (status == "COMPLETED")
            entity.ProgressPercent = 100;

        entity.CompletedAt = status == "COMPLETED" ? DateTime.UtcNow : null;
        await db.SaveChangesAsync(ct);
        return MapItem(entity);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var db = Db;
        var entity = await db.TskTasks.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (entity is null) return false;

        entity.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static async Task<string> GenerateTaskNoAsync(TenantDbContext db, CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var pattern = $"GRV-{year}-";
        var lastNo = await db.TskTasks.AsNoTracking()
            .Where(t => !t.IsDeleted && t.TaskNo.StartsWith(pattern))
            .OrderByDescending(t => t.TaskNo)
            .Select(t => t.TaskNo)
            .FirstOrDefaultAsync(ct);

        var seq = 1;
        if (lastNo is not null && int.TryParse(lastNo.Split('-')[^1], out var parsed))
            seq = parsed + 1;

        return $"{pattern}{seq:D3}";
    }

    private static TskTaskListItemDto MapItem(TskTask t)
    {
        var (statusKey, statusLabel) = MapStatus(t.Status);
        var (priorityKey, priorityLabel) = MapPriority(t.Priority);
        return new TskTaskListItemDto(t.Id, t.TaskNo, t.Title, t.StartDate, t.EndDate, t.AssigneeName, priorityKey, priorityLabel, statusKey, statusLabel, t.ProgressPercent);
    }

    private static (string Key, string Label) MapStatus(string status) => status switch
    {
        "PENDING" => ("yapilacak", "Yapılacak"),
        "IN_PROGRESS" => ("devam_ediyor", "Devam Ediyor"),
        "OVERDUE" => ("gecikti", "Gecikmiş"),
        "COMPLETED" => ("tamamlandi", "Tamamlandı"),
        _ => ("yapilacak", status),
    };

    private static (string Key, string Label) MapPriority(string priority) => priority switch
    {
        "LOW" => ("dusuk", "Düşük"),
        "HIGH" => ("yuksek", "Yüksek"),
        "URGENT" => ("acil", "Acil"),
        _ => ("normal", "Orta"),
    };
}
