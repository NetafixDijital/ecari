using ECari.Domain.Dtos;
using ECari.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Services;

public static class AuditHelper
{
    public static async Task<Dictionary<long, string>> LoadUserNamesAsync(
        TenantDbContext db,
        IEnumerable<long?> userIds,
        CancellationToken ct)
    {
        var ids = userIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<long, string>();

        return await db.OrgUsers.AsNoTracking()
            .Where(u => ids.Contains(u.Id) && !u.IsDeleted)
            .ToDictionaryAsync(u => u.Id, u => u.FullName, ct);
    }

    public static AuditInfoDto? BuildAudit(
        DateTime createdAt,
        long? createdBy,
        DateTime? updatedAt,
        long? updatedBy,
        IReadOnlyDictionary<long, string> userNames)
    {
        userNames.TryGetValue(createdBy ?? 0, out var createdByName);
        userNames.TryGetValue(updatedBy ?? 0, out var updatedByName);

        return new AuditInfoDto(
            createdAt,
            createdBy.HasValue ? createdByName : null,
            updatedAt,
            updatedBy.HasValue ? updatedByName : null);
    }
}
