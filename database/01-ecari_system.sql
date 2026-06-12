/*
================================================================================
  E-CARI — 01: SİSTEM VERİTABANI (ecari_system)
  SQL Server Management Studio'da F5 ile çalıştırın.
================================================================================
*/
SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'ecari_system')
BEGIN
    CREATE DATABASE ecari_system;
    PRINT N'Veritabanı oluşturuldu: ecari_system';
END
ELSE
    PRINT N'Veritabanı zaten var: ecari_system';
GO

USE ecari_system;
GO

/* -------------------------------------------------------------------------- */
/* Abonelik planları                                                          */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.sys_subscription_plans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_subscription_plans (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(30)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        price_monthly   DECIMAL(18,2)   NOT NULL DEFAULT 0,
        price_yearly    DECIMAL(18,2)   NULL,
        billing_period  NVARCHAR(20)    NOT NULL DEFAULT N'MONTHLY',
        module_list_json NVARCHAR(MAX)  NULL,
        max_users       INT             NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_sys_subscription_plans PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sys_subscription_plans_code UNIQUE (code)
    );
    PRINT N'Tablo: sys_subscription_plans';
END
GO

/* -------------------------------------------------------------------------- */
/* Modül tanımları                                                            */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.sys_modules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_modules (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(30)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        description     NVARCHAR(500)   NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_sys_modules PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sys_modules_code UNIQUE (code)
    );
    PRINT N'Tablo: sys_modules';
END
GO

/* -------------------------------------------------------------------------- */
/* Abone şirketler                                                            */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.sys_companies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_companies (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        code                    NVARCHAR(30)    NOT NULL,
        name                    NVARCHAR(200)   NOT NULL,
        database_name           NVARCHAR(128)   NOT NULL,
        connection_string       NVARCHAR(500)   NULL,
        subscription_plan_id    BIGINT          NULL,
        subscription_status     NVARCHAR(20)    NOT NULL DEFAULT N'TRIAL',
        trial_ends_at           DATETIME2(3)    NULL,
        is_active               BIT             NOT NULL DEFAULT 1,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at              DATETIME2(3)    NULL,
        CONSTRAINT PK_sys_companies PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sys_companies_code UNIQUE (code),
        CONSTRAINT UQ_sys_companies_database_name UNIQUE (database_name),
        CONSTRAINT FK_sys_companies_plan FOREIGN KEY (subscription_plan_id)
            REFERENCES dbo.sys_subscription_plans (id)
    );
    PRINT N'Tablo: sys_companies';
END
GO

/* -------------------------------------------------------------------------- */
/* Global kullanıcılar                                                        */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.sys_users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_users (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        email                   NVARCHAR(254)   NOT NULL,
        password_hash           NVARCHAR(255)   NOT NULL,
        full_name               NVARCHAR(200)   NOT NULL,
        phone                   NVARCHAR(30)    NULL,
        is_active               BIT             NOT NULL DEFAULT 1,
        email_verified_at       DATETIME2(3)    NULL,
        last_login_at           DATETIME2(3)    NULL,
        password_changed_at     DATETIME2(3)    NULL,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at              DATETIME2(3)    NULL,
        CONSTRAINT PK_sys_users PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sys_users_email UNIQUE (email)
    );
    PRINT N'Tablo: sys_users';
END
GO

/* -------------------------------------------------------------------------- */
/* Kullanıcı ↔ Şirket                                                         */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.sys_user_companies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_user_companies (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        user_id                 BIGINT          NOT NULL,
        company_id              BIGINT          NOT NULL,
        org_user_id             BIGINT          NULL,
        is_default_company      BIT             NOT NULL DEFAULT 0,
        status                  NVARCHAR(20)    NOT NULL DEFAULT N'ACTIVE',
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_sys_user_companies PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sys_user_companies_user_company UNIQUE (user_id, company_id),
        CONSTRAINT FK_sys_user_companies_user FOREIGN KEY (user_id)
            REFERENCES dbo.sys_users (id),
        CONSTRAINT FK_sys_user_companies_company FOREIGN KEY (company_id)
            REFERENCES dbo.sys_companies (id)
    );
    PRINT N'Tablo: sys_user_companies';
END
GO

/* -------------------------------------------------------------------------- */
/* Şirket ↔ Modül lisansı                                                     */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.sys_company_modules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_company_modules (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        company_id      BIGINT          NOT NULL,
        module_id       BIGINT          NOT NULL,
        is_enabled      BIT             NOT NULL DEFAULT 1,
        enabled_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_sys_company_modules PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sys_company_modules UNIQUE (company_id, module_id),
        CONSTRAINT FK_sys_company_modules_company FOREIGN KEY (company_id)
            REFERENCES dbo.sys_companies (id),
        CONSTRAINT FK_sys_company_modules_module FOREIGN KEY (module_id)
            REFERENCES dbo.sys_modules (id)
    );
    PRINT N'Tablo: sys_company_modules';
END
GO

/* ========================================================================== */
/* SEED — Başlangıç verileri                                                  */
/* ========================================================================== */

-- Abonelik planları
IF NOT EXISTS (SELECT 1 FROM dbo.sys_subscription_plans WHERE code = N'BASIC')
    INSERT INTO dbo.sys_subscription_plans (code, name, price_monthly, billing_period, module_list_json, max_users)
    VALUES (N'BASIC', N'Temel Plan', 299.00, N'MONTHLY', N'["CARI","STK","CFG"]', 5);

IF NOT EXISTS (SELECT 1 FROM dbo.sys_subscription_plans WHERE code = N'PRO')
    INSERT INTO dbo.sys_subscription_plans (code, name, price_monthly, billing_period, module_list_json, max_users)
    VALUES (N'PRO', N'Profesyonel Plan', 599.00, N'MONTHLY', N'["CARI","STK","CFG","INV","QOT"]', 20);
GO

-- Modüller
MERGE dbo.sys_modules AS t
USING (VALUES
    (N'CARI', N'Cari'),
    (N'STK',  N'Stok'),
    (N'CFG',  N'Ayarlar'),
    (N'INV',  N'Fatura'),
    (N'QOT',  N'Teklif'),
    (N'ORD',  N'Sipariş'),
    (N'DLN',  N'İrsaliye'),
    (N'CSH',  N'Kasa'),
    (N'BNK',  N'Banka'),
    (N'CHQ',  N'Çek-Senet'),
    (N'TSK',  N'Görev'),
    (N'AUTH', N'Kullanıcı & Yetki')
) AS s (code, name) ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, name) VALUES (s.code, s.name);
GO

-- Demo şirket
DECLARE @PlanId BIGINT = (SELECT id FROM dbo.sys_subscription_plans WHERE code = N'BASIC');

IF NOT EXISTS (SELECT 1 FROM dbo.sys_companies WHERE code = N'demo')
    INSERT INTO dbo.sys_companies (code, name, database_name, subscription_plan_id, subscription_status, trial_ends_at)
    VALUES (N'demo', N'Demo Şirket A.Ş.', N'ecari_sirket_demo', @PlanId, N'ACTIVE', DATEADD(DAY, 30, SYSUTCDATETIME()));
GO

-- Demo kullanıcı — şifre: Demo123!  (BCrypt hash)
IF NOT EXISTS (SELECT 1 FROM dbo.sys_users WHERE email = N'admin@ecari.demo')
BEGIN
    INSERT INTO dbo.sys_users (email, password_hash, full_name, phone, is_active, email_verified_at)
    VALUES (
        N'admin@ecari.demo',
        N'$2a$11$jxrdtKIdgW2pvAK2x7dr/uiWasZGRBfmo./Q6HRRCiht9vEiRLLiy',
        N'Demo Yönetici',
        N'+905551234567',
        1,
        SYSUTCDATETIME()
    );
    PRINT N'Demo kullanıcı eklendi: admin@ecari.demo / Demo123!';
END
GO

-- Kullanıcı ↔ Demo şirket bağlantısı (org_user_id 02 script sonrası güncellenir)
DECLARE @UserId BIGINT = (SELECT id FROM dbo.sys_users WHERE email = N'admin@ecari.demo');
DECLARE @CompanyId BIGINT = (SELECT id FROM dbo.sys_companies WHERE code = N'demo');

IF @UserId IS NOT NULL AND @CompanyId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.sys_user_companies WHERE user_id = @UserId AND company_id = @CompanyId)
    INSERT INTO dbo.sys_user_companies (user_id, company_id, org_user_id, is_default_company, status)
    VALUES (@UserId, @CompanyId, 1, 1, N'ACTIVE');
GO

-- Demo şirket modülleri (Faz 1)
DECLARE @DemoCompanyId BIGINT = (SELECT id FROM dbo.sys_companies WHERE code = N'demo');

INSERT INTO dbo.sys_company_modules (company_id, module_id)
SELECT @DemoCompanyId, m.id
FROM dbo.sys_modules m
WHERE m.code IN (N'CARI', N'STK', N'CFG')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.sys_company_modules cm
      WHERE cm.company_id = @DemoCompanyId AND cm.module_id = m.id
  );
GO

PRINT N'';
PRINT N'========================================';
PRINT N' ecari_system kurulumu tamamlandı.';
PRINT N' Sıradaki adım: 02-ecari_sirket_demo.sql';
PRINT N'========================================';
GO
