/*
================================================================================
  E-CARI — Faz 7: Kullanıcı & Yetkilendirme (auth_)
  ecari_sirket_demo üzerinde çalıştırın.
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ── auth_permission_groups ──────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_permission_groups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_permission_groups (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(50)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        parent_id       BIGINT          NULL,
        sort_order      INT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_permission_groups PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_permission_groups_code UNIQUE (code),
        CONSTRAINT FK_auth_permission_groups_parent FOREIGN KEY (parent_id) REFERENCES dbo.auth_permission_groups (id)
    );
END
GO

/* ── auth_permissions ────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_permissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_permissions (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        group_id        BIGINT          NOT NULL,
        code            NVARCHAR(100)   NOT NULL,
        name            NVARCHAR(200)   NOT NULL,
        module_code     NVARCHAR(30)    NOT NULL,
        action_code     NVARCHAR(30)    NOT NULL,
        sort_order      INT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_permissions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_permissions_code UNIQUE (code),
        CONSTRAINT FK_auth_permissions_group FOREIGN KEY (group_id) REFERENCES dbo.auth_permission_groups (id)
    );
END
GO

/* ── auth_roles ──────────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_roles (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(50)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        is_system       BIT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_roles PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_roles_code UNIQUE (code)
    );
END
GO

/* ── auth_role_permissions ─────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_role_permissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_role_permissions (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        role_id         BIGINT          NOT NULL,
        permission_id   BIGINT          NOT NULL,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_role_permissions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_role_permissions UNIQUE (role_id, permission_id),
        CONSTRAINT FK_auth_role_permissions_role FOREIGN KEY (role_id) REFERENCES dbo.auth_roles (id),
        CONSTRAINT FK_auth_role_permissions_perm FOREIGN KEY (permission_id) REFERENCES dbo.auth_permissions (id)
    );
END
GO

/* ── auth_user_roles ─────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_user_roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_user_roles (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        org_user_id     BIGINT          NOT NULL,
        role_id         BIGINT          NOT NULL,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_user_roles PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_user_roles UNIQUE (org_user_id, role_id),
        CONSTRAINT FK_auth_user_roles_user FOREIGN KEY (org_user_id) REFERENCES dbo.org_users (id),
        CONSTRAINT FK_auth_user_roles_role FOREIGN KEY (role_id) REFERENCES dbo.auth_roles (id)
    );
END
GO

/* ── auth_user_permissions ───────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_user_permissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_user_permissions (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        org_user_id     BIGINT          NOT NULL,
        permission_id   BIGINT          NOT NULL,
        is_granted      BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_user_permissions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_user_permissions UNIQUE (org_user_id, permission_id),
        CONSTRAINT FK_auth_user_permissions_user FOREIGN KEY (org_user_id) REFERENCES dbo.org_users (id),
        CONSTRAINT FK_auth_user_permissions_perm FOREIGN KEY (permission_id) REFERENCES dbo.auth_permissions (id)
    );
END
GO

/* ── auth_user_branch_access ─────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_user_branch_access', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_user_branch_access (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        org_user_id     BIGINT          NOT NULL,
        branch_id       BIGINT          NOT NULL,
        access_rule     NVARCHAR(20)    NOT NULL DEFAULT N'DENY',
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_auth_user_branch_access PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_user_branch_access UNIQUE (org_user_id, branch_id),
        CONSTRAINT FK_auth_user_branch_access_user FOREIGN KEY (org_user_id) REFERENCES dbo.org_users (id),
        CONSTRAINT FK_auth_user_branch_access_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id)
    );
END
GO

/* ── auth_user_settings ──────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.auth_user_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_user_settings (
        id                              BIGINT          IDENTITY(1,1) NOT NULL,
        org_user_id                     BIGINT          NOT NULL,
        is_branch_restriction_enabled   BIT             NOT NULL DEFAULT 0,
        max_branch_access               INT             NOT NULL DEFAULT 3,
        permission_summary_cache        NVARCHAR(500)   NULL,
        created_at                      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at                      DATETIME2(3)    NULL,
        CONSTRAINT PK_auth_user_settings PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_auth_user_settings_user UNIQUE (org_user_id),
        CONSTRAINT FK_auth_user_settings_user FOREIGN KEY (org_user_id) REFERENCES dbo.org_users (id)
    );
END
GO

/* ── İzin grupları seed ──────────────────────────────────────────────────── */
MERGE dbo.auth_permission_groups AS t
USING (VALUES
    (N'SETTINGS', N'Ayarlar', NULL, 10),
    (N'HOME', N'Ana Sayfa', NULL, 20),
    (N'AUTH', N'Kullanıcı & Yetki', NULL, 30),
    (N'COMPANY', N'Firma Yönetimi', NULL, 40),
    (N'BRANCH', N'Şubeler', NULL, 50),
    (N'CARI', N'Cari', NULL, 60),
    (N'STOK', N'Stok', NULL, 70),
    (N'INV', N'Fatura', NULL, 80),
    (N'DLN', N'İrsaliye', NULL, 90),
    (N'ORD', N'Sipariş', NULL, 100),
    (N'QOT', N'Teklif', NULL, 110),
    (N'EXP', N'Masraf', NULL, 120),
    (N'SVC', N'Servis', NULL, 130),
    (N'TSK', N'Görev', NULL, 140),
    (N'CSH', N'Kasa', NULL, 150),
    (N'BNK', N'Banka', NULL, 160),
    (N'CHQ', N'Çek & Senet', NULL, 170),
    (N'RPT', N'Raporlar', NULL, 180)
) AS s(code, name, parent_id, sort_order)
ON t.code = s.code
WHEN NOT MATCHED THEN
    INSERT (code, name, parent_id, sort_order) VALUES (s.code, s.name, s.parent_id, s.sort_order);
GO

/* ── İzin tanımları seed ─────────────────────────────────────────────────── */
DECLARE @G_SETTINGS BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'SETTINGS');
DECLARE @G_HOME BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'HOME');
DECLARE @G_AUTH BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'AUTH');
DECLARE @G_COMPANY BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'COMPANY');
DECLARE @G_BRANCH BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'BRANCH');
DECLARE @G_CARI BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'CARI');
DECLARE @G_STOK BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'STOK');
DECLARE @G_INV BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'INV');
DECLARE @G_DLN BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'DLN');
DECLARE @G_ORD BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'ORD');
DECLARE @G_QOT BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'QOT');
DECLARE @G_EXP BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'EXP');
DECLARE @G_SVC BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'SVC');
DECLARE @G_TSK BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'TSK');
DECLARE @G_CSH BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'CSH');
DECLARE @G_BNK BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'BNK');
DECLARE @G_CHQ BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'CHQ');
DECLARE @G_RPT BIGINT = (SELECT id FROM dbo.auth_permission_groups WHERE code = N'RPT');

MERGE dbo.auth_permissions AS t
USING (VALUES
    (@G_SETTINGS, N'SETTINGS.RESET_COMPANY', N'Şirket Verilerini Sıfırla', N'CFG', N'RESET', 10),
    (@G_HOME, N'HOME.VIEW', N'Ana Sayfayı Görüntüle', N'HOME', N'VIEW', 10),
    (@G_AUTH, N'AUTH.USER.VIEW', N'Kullanıcıları Görüntüle', N'AUTH', N'VIEW', 10),
    (@G_AUTH, N'AUTH.USER.CREATE', N'Kullanıcı Oluştur', N'AUTH', N'CREATE', 20),
    (@G_AUTH, N'AUTH.USER.EDIT', N'Kullanıcı Düzenle', N'AUTH', N'EDIT', 30),
    (@G_AUTH, N'AUTH.USER.DELETE', N'Kullanıcı Sil', N'AUTH', N'DELETE', 40),
    (@G_COMPANY, N'COMPANY.VIEW', N'Firma Bilgilerini Görüntüle', N'CFG', N'VIEW', 10),
    (@G_COMPANY, N'COMPANY.EDIT', N'Firma Bilgileri Düzenle', N'CFG', N'EDIT', 20),
    (@G_COMPANY, N'COMPANY.DELETE', N'Firma Bilgileri Sil', N'CFG', N'DELETE', 30),
    (@G_BRANCH, N'BRANCH.VIEW', N'Şubeleri Görüntüle', N'ORG', N'VIEW', 10),
    (@G_BRANCH, N'BRANCH.CREATE', N'Şube Oluştur', N'ORG', N'CREATE', 20),
    (@G_CARI, N'CARI.VIEW', N'Cari Görüntüle', N'CARI', N'VIEW', 10),
    (@G_CARI, N'CARI.CREATE', N'Cari Oluştur', N'CARI', N'CREATE', 20),
    (@G_CARI, N'CARI.EDIT', N'Cari Düzenle', N'CARI', N'EDIT', 30),
    (@G_STOK, N'STK.VIEW', N'Stok Görüntüle', N'STK', N'VIEW', 10),
    (@G_STOK, N'STK.CREATE', N'Stok Oluştur', N'STK', N'CREATE', 20),
    (@G_STOK, N'STK.EDIT', N'Stok Düzenle', N'STK', N'EDIT', 30),
    (@G_INV, N'INV.VIEW', N'Fatura Görüntüle', N'INV', N'VIEW', 10),
    (@G_INV, N'INV.CREATE', N'Fatura Oluştur', N'INV', N'CREATE', 20),
    (@G_INV, N'INV.EDIT', N'Fatura Düzenle', N'INV', N'EDIT', 30),
    (@G_DLN, N'DLN.VIEW', N'İrsaliye Görüntüle', N'DLN', N'VIEW', 10),
    (@G_DLN, N'DLN.CREATE', N'İrsaliye Oluştur', N'DLN', N'CREATE', 20),
    (@G_ORD, N'ORD.VIEW', N'Sipariş Görüntüle', N'ORD', N'VIEW', 10),
    (@G_ORD, N'ORD.CREATE', N'Sipariş Oluştur', N'ORD', N'CREATE', 20),
    (@G_QOT, N'QOT.VIEW', N'Teklif Görüntüle', N'QOT', N'VIEW', 10),
    (@G_QOT, N'QOT.CREATE', N'Teklif Oluştur', N'QOT', N'CREATE', 20),
    (@G_EXP, N'EXP.VIEW', N'Masraf Görüntüle', N'EXP', N'VIEW', 10),
    (@G_EXP, N'EXP.CREATE', N'Masraf Oluştur', N'EXP', N'CREATE', 20),
    (@G_SVC, N'SVC.VIEW', N'Servis Görüntüle', N'SVC', N'VIEW', 10),
    (@G_SVC, N'SVC.CREATE', N'Servis Oluştur', N'SVC', N'CREATE', 20),
    (@G_SVC, N'SVC.EDIT', N'Servis Düzenle', N'SVC', N'EDIT', 30),
    (@G_TSK, N'TSK.VIEW', N'Görev Görüntüle', N'TSK', N'VIEW', 10),
    (@G_TSK, N'TSK.CREATE', N'Görev Oluştur', N'TSK', N'CREATE', 20),
    (@G_CSH, N'CSH.VIEW', N'Kasa Görüntüle', N'CSH', N'VIEW', 10),
    (@G_CSH, N'CSH.CREATE', N'Kasa İşlemi Oluştur', N'CSH', N'CREATE', 20),
    (@G_BNK, N'BNK.VIEW', N'Banka Görüntüle', N'BNK', N'VIEW', 10),
    (@G_BNK, N'BNK.CREATE', N'Banka İşlemi Oluştur', N'BNK', N'CREATE', 20),
    (@G_CHQ, N'CHQ.VIEW', N'Çek/Senet Görüntüle', N'CHQ', N'VIEW', 10),
    (@G_CHQ, N'CHQ.CREATE', N'Çek/Senet Oluştur', N'CHQ', N'CREATE', 20),
    (@G_RPT, N'RPT.VIEW', N'Raporları Görüntüle', N'RPT', N'VIEW', 10)
) AS s(group_id, code, name, module_code, action_code, sort_order)
ON t.code = s.code
WHEN NOT MATCHED THEN
    INSERT (group_id, code, name, module_code, action_code, sort_order)
    VALUES (s.group_id, s.code, s.name, s.module_code, s.action_code, s.sort_order);
GO

/* ── ADMIN rolü ─────────────────────────────────────────────────────────── */
IF NOT EXISTS (SELECT 1 FROM dbo.auth_roles WHERE code = N'ADMIN')
    INSERT INTO dbo.auth_roles (code, name, is_system) VALUES (N'ADMIN', N'Yönetici', 1);

DECLARE @AdminRoleId BIGINT = (SELECT id FROM dbo.auth_roles WHERE code = N'ADMIN');

INSERT INTO dbo.auth_role_permissions (role_id, permission_id)
SELECT @AdminRoleId, p.id
FROM dbo.auth_permissions p
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.auth_role_permissions rp
    WHERE rp.role_id = @AdminRoleId AND rp.permission_id = p.id
);
GO

/* ── Mevcut kullanıcılara tüm izinler (demo admin) ───────────────────────── */
INSERT INTO dbo.auth_user_permissions (org_user_id, permission_id, is_granted)
SELECT u.id, p.id, 1
FROM dbo.org_users u
CROSS JOIN dbo.auth_permissions p
WHERE u.is_deleted = 0 AND p.is_active = 1
  AND NOT EXISTS (
      SELECT 1 FROM dbo.auth_user_permissions up
      WHERE up.org_user_id = u.id AND up.permission_id = p.id
  );

INSERT INTO dbo.auth_user_settings (org_user_id, is_branch_restriction_enabled, max_branch_access, permission_summary_cache)
SELECT u.id, 0, 3, N'Tüm izinler'
FROM dbo.org_users u
WHERE u.is_deleted = 0
  AND NOT EXISTS (SELECT 1 FROM dbo.auth_user_settings s WHERE s.org_user_id = u.id);
GO

/* ── Views ───────────────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.v_auth_user_list', N'V') IS NOT NULL
    DROP VIEW dbo.v_auth_user_list;
GO
CREATE VIEW dbo.v_auth_user_list AS
SELECT
    u.id,
    u.full_name,
    u.email,
    u.phone,
    u.is_active,
    u.created_at,
    ISNULL(s.permission_summary_cache, N'') AS permission_summary
FROM dbo.org_users u
LEFT JOIN dbo.auth_user_settings s ON s.org_user_id = u.id
WHERE u.is_deleted = 0;
GO

IF OBJECT_ID(N'dbo.v_auth_user_effective_permissions', N'V') IS NOT NULL
    DROP VIEW dbo.v_auth_user_effective_permissions;
GO
CREATE VIEW dbo.v_auth_user_effective_permissions AS
SELECT
    up.org_user_id,
    p.id AS permission_id,
    p.code AS permission_code
FROM dbo.auth_user_permissions up
INNER JOIN dbo.auth_permissions p ON p.id = up.permission_id
WHERE up.is_granted = 1 AND p.is_active = 1;
GO

PRINT N'Faz 7 auth tabloları ve izin seed tamamlandı.';
GO
