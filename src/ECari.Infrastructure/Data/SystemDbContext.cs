using ECari.Domain.Entities.System;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Data;

public class SystemDbContext : DbContext
{
    public SystemDbContext(DbContextOptions<SystemDbContext> options) : base(options) { }

    public DbSet<SysUser> Users => Set<SysUser>();
    public DbSet<SysCompany> Companies => Set<SysCompany>();
    public DbSet<SysUserCompany> UserCompanies => Set<SysUserCompany>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SysUser>(e =>
        {
            e.ToTable("sys_users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(254);
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255);
            e.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200);
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30);
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.EmailVerifiedAt).HasColumnName("email_verified_at");
            e.Property(x => x.LastLoginAt).HasColumnName("last_login_at");
            e.Property(x => x.PasswordChangedAt).HasColumnName("password_changed_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<SysCompany>(e =>
        {
            e.ToTable("sys_companies");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(30);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
            e.Property(x => x.DatabaseName).HasColumnName("database_name").HasMaxLength(128);
            e.Property(x => x.ConnectionString).HasColumnName("connection_string").HasMaxLength(500);
            e.Property(x => x.SubscriptionPlanId).HasColumnName("subscription_plan_id");
            e.Property(x => x.SubscriptionStatus).HasColumnName("subscription_status").HasMaxLength(20);
            e.Property(x => x.TrialEndsAt).HasColumnName("trial_ends_at");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<SysUserCompany>(e =>
        {
            e.ToTable("sys_user_companies");
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.CompanyId).HasColumnName("company_id");
            e.Property(x => x.OrgUserId).HasColumnName("org_user_id");
            e.Property(x => x.IsDefaultCompany).HasColumnName("is_default_company");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasOne(x => x.User).WithMany(u => u.UserCompanies).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Company).WithMany(c => c.UserCompanies).HasForeignKey(x => x.CompanyId);
            e.HasIndex(x => new { x.UserId, x.CompanyId }).IsUnique();
        });
    }
}
