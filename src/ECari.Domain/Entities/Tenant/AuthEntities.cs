namespace ECari.Domain.Entities.Tenant;

public class OrgUser
{
    public long Id { get; set; }
    public long SystemUserId { get; set; }
    public string? Username { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public long? DepartmentId { get; set; }
    public long? DefaultBranchId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? InvitedAt { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
}

public class OrgBranch
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsHeadquarters { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
}

public class AuthPermissionGroup
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long? ParentId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<AuthPermission> Permissions { get; set; } = new List<AuthPermission>();
}

public class AuthPermission
{
    public long Id { get; set; }
    public long GroupId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ModuleCode { get; set; } = string.Empty;
    public string ActionCode { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public AuthPermissionGroup Group { get; set; } = null!;
}

public class AuthUserPermission
{
    public long Id { get; set; }
    public long OrgUserId { get; set; }
    public long PermissionId { get; set; }
    public bool IsGranted { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public AuthPermission Permission { get; set; } = null!;
}

public class AuthUserBranchAccess
{
    public long Id { get; set; }
    public long OrgUserId { get; set; }
    public long BranchId { get; set; }
    public string AccessRule { get; set; } = "DENY";
    public DateTime CreatedAt { get; set; }

    public OrgBranch Branch { get; set; } = null!;
}

public class AuthUserSettings
{
    public long Id { get; set; }
    public long OrgUserId { get; set; }
    public bool IsBranchRestrictionEnabled { get; set; }
    public int MaxBranchAccess { get; set; } = 3;
    public string? PermissionSummaryCache { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class AuthUserListView
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string PermissionSummary { get; set; } = string.Empty;
}
