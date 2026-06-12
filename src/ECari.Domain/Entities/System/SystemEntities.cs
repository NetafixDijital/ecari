namespace ECari.Domain.Entities.System;

public class SysUser
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<SysUserCompany> UserCompanies { get; set; } = new List<SysUserCompany>();
}

public class SysCompany
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string? ConnectionString { get; set; }
    public long? SubscriptionPlanId { get; set; }
    public string SubscriptionStatus { get; set; } = "ACTIVE";
    public DateTime? TrialEndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SysUserCompany> UserCompanies { get; set; } = new List<SysUserCompany>();
}

public class SysUserCompany
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long CompanyId { get; set; }
    public long OrgUserId { get; set; }
    public bool IsDefaultCompany { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SysUser User { get; set; } = null!;
    public SysCompany Company { get; set; } = null!;
}

public class SysSubscriptionPlan
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public string BillingPeriod { get; set; } = "MONTHLY";
    public bool IsActive { get; set; } = true;
}

public class SysModule
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class SysCompanyModule
{
    public long Id { get; set; }
    public long CompanyId { get; set; }
    public long ModuleId { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime? EnabledAt { get; set; }
}
