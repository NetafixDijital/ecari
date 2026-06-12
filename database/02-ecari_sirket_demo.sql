/*
================================================================================
  E-CARI — 02: DEMO ŞİRKET VERİTABANI (ecari_sirket_demo)
  Önce 01-ecari_system.sql çalıştırılmış olmalı.
  SQL Server Management Studio'da F5 ile çalıştırın.
================================================================================
*/
SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'ecari_sirket_demo')
BEGIN
    CREATE DATABASE ecari_sirket_demo;
    PRINT N'Veritabanı oluşturuldu: ecari_sirket_demo';
END
ELSE
    PRINT N'Veritabanı zaten var: ecari_sirket_demo';
GO

USE ecari_sirket_demo;
GO

/* ========================================================================== */
/* ÇEKİRDEK (core_)                                                           */
/* ========================================================================== */

IF OBJECT_ID(N'dbo.core_currencies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.core_currencies (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            CHAR(3)         NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        symbol          NVARCHAR(10)    NULL,
        decimal_places  TINYINT         NOT NULL DEFAULT 2,
        is_default      BIT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_core_currencies PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_core_currencies_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.core_tax_rates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.core_tax_rates (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(20)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        rate            DECIMAL(5,2)    NOT NULL,
        tax_type        NVARCHAR(20)    NOT NULL DEFAULT N'KDV',
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_core_tax_rates PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_core_tax_rates_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.core_cities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.core_cities (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        plate_code      NVARCHAR(3)     NULL,
        name            NVARCHAR(100)   NOT NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        CONSTRAINT PK_core_cities PRIMARY KEY CLUSTERED (id)
    );
END
GO

IF OBJECT_ID(N'dbo.core_districts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.core_districts (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        city_id         BIGINT          NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        CONSTRAINT PK_core_districts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_core_districts_city FOREIGN KEY (city_id) REFERENCES dbo.core_cities (id)
    );
END
GO

IF OBJECT_ID(N'dbo.core_payment_terms', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.core_payment_terms (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(20)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        due_days        INT             NOT NULL DEFAULT 0,
        discount_days   INT             NULL,
        discount_rate   DECIMAL(5,2)    NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_core_payment_terms PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_core_payment_terms_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.core_document_series', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.core_document_series (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        module_code     NVARCHAR(30)    NOT NULL,
        document_type   NVARCHAR(30)    NOT NULL DEFAULT N'SALES',
        prefix          NVARCHAR(20)    NOT NULL,
        suffix          NVARCHAR(20)    NULL,
        next_number     BIGINT          NOT NULL DEFAULT 1,
        padding         TINYINT         NOT NULL DEFAULT 6,
        fiscal_year     SMALLINT        NULL,
        branch_id       BIGINT          NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_core_document_series PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* ========================================================================== */
/* ORGANİZASYON (org_)                                                        */
/* ========================================================================== */

IF OBJECT_ID(N'dbo.org_branches', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.org_branches (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(20)    NOT NULL,
        name                NVARCHAR(200)   NOT NULL,
        address             NVARCHAR(500)   NULL,
        city_id             BIGINT          NULL,
        tax_office          NVARCHAR(100)   NULL,
        tax_number          NVARCHAR(20)    NULL,
        is_headquarters     BIT             NOT NULL DEFAULT 0,
        is_active           BIT             NOT NULL DEFAULT 1,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_org_branches PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_org_branches_code UNIQUE (code),
        CONSTRAINT FK_org_branches_city FOREIGN KEY (city_id) REFERENCES dbo.core_cities (id)
    );
END
GO

IF OBJECT_ID(N'dbo.org_departments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.org_departments (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        branch_id       BIGINT          NOT NULL,
        parent_id       BIGINT          NULL,
        code            NVARCHAR(20)    NOT NULL,
        name            NVARCHAR(200)   NOT NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_org_departments PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_org_departments_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id)
    );
END
GO

IF OBJECT_ID(N'dbo.org_users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.org_users (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        system_user_id      BIGINT          NOT NULL,
        username            NVARCHAR(100)   NULL,
        full_name           NVARCHAR(200)   NOT NULL,
        email               NVARCHAR(254)   NOT NULL,
        phone               NVARCHAR(30)    NULL,
        department_id       BIGINT          NULL,
        default_branch_id   BIGINT          NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        invited_at          DATETIME2(3)    NULL,
        joined_at           DATETIME2(3)    NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_org_users PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_org_users_department FOREIGN KEY (department_id) REFERENCES dbo.org_departments (id),
        CONSTRAINT FK_org_users_branch FOREIGN KEY (default_branch_id) REFERENCES dbo.org_branches (id)
    );
END
GO

/* ========================================================================== */
/* AYARLAR (cfg_)                                                             */
/* ========================================================================== */

IF OBJECT_ID(N'dbo.cfg_company_profile', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cfg_company_profile (
        id                          BIGINT          IDENTITY(1,1) NOT NULL,
        legal_name                  NVARCHAR(300)   NOT NULL,
        trade_name                  NVARCHAR(300)   NULL,
        tax_number                  NVARCHAR(11)    NOT NULL,
        tax_office                  NVARCHAR(100)   NOT NULL,
        mersis_no                   NVARCHAR(20)    NULL,
        trade_registry_no           NVARCHAR(50)    NULL,
        address                     NVARCHAR(500)   NULL,
        city_id                     BIGINT          NULL,
        district_id                 BIGINT          NULL,
        country_code                CHAR(2)         NOT NULL DEFAULT 'TR',
        phone                       NVARCHAR(30)    NULL,
        fax                         NVARCHAR(30)    NULL,
        email                       NVARCHAR(254)   NULL,
        website                     NVARCHAR(200)   NULL,
        kep_address                 NVARCHAR(254)   NULL,
        logo_path                   NVARCHAR(500)   NULL,
        default_currency_id         BIGINT          NOT NULL,
        fiscal_year_start_month     TINYINT         NOT NULL DEFAULT 1,
        is_einvoice_user            BIT             NOT NULL DEFAULT 0,
        is_earchive_user            BIT             NOT NULL DEFAULT 0,
        is_ewaybill_user            BIT             NOT NULL DEFAULT 0,
        einvoice_alias              NVARCHAR(200)   NULL,
        ewaybill_alias              NVARCHAR(200)   NULL,
        created_at                  DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at                  DATETIME2(3)    NULL,
        row_version                 ROWVERSION      NOT NULL,
        CONSTRAINT PK_cfg_company_profile PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_cfg_profile_currency FOREIGN KEY (default_currency_id) REFERENCES dbo.core_currencies (id),
        CONSTRAINT FK_cfg_profile_city FOREIGN KEY (city_id) REFERENCES dbo.core_cities (id),
        CONSTRAINT FK_cfg_profile_district FOREIGN KEY (district_id) REFERENCES dbo.core_districts (id)
    );
END
GO

IF OBJECT_ID(N'dbo.cfg_fiscal_periods', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cfg_fiscal_periods (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        year            SMALLINT        NOT NULL,
        period_no       TINYINT         NOT NULL,
        start_date      DATE            NOT NULL,
        end_date        DATE            NOT NULL,
        is_closed       BIT             NOT NULL DEFAULT 0,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_cfg_fiscal_periods PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_cfg_fiscal_periods UNIQUE (year, period_no)
    );
END
GO

IF OBJECT_ID(N'dbo.cfg_module_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cfg_module_settings (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        module_code     NVARCHAR(30)    NOT NULL,
        setting_key     NVARCHAR(100)   NOT NULL,
        setting_value   NVARCHAR(MAX)   NOT NULL,
        data_type       NVARCHAR(20)    NOT NULL DEFAULT N'STRING',
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2(3)    NULL,
        CONSTRAINT PK_cfg_module_settings PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_cfg_module_settings UNIQUE (module_code, setting_key)
    );
END
GO

/* ========================================================================== */
/* CARİ (cari_)                                                               */
/* ========================================================================== */

IF OBJECT_ID(N'dbo.cari_account_groups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cari_account_groups (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        code                    NVARCHAR(20)    NOT NULL,
        name                    NVARCHAR(100)   NOT NULL,
        parent_id               BIGINT          NULL,
        default_discount_rate   DECIMAL(5,2)    NULL,
        is_active               BIT             NOT NULL DEFAULT 1,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted              BIT             NOT NULL DEFAULT 0,
        row_version             ROWVERSION      NOT NULL,
        CONSTRAINT PK_cari_account_groups PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_cari_account_groups_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.cari_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cari_accounts (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        code                    NVARCHAR(30)    NOT NULL,
        account_type            NVARCHAR(20)    NOT NULL DEFAULT N'CUSTOMER',
        title                   NVARCHAR(300)   NOT NULL,
        short_name              NVARCHAR(100)   NULL,
        person_type             NVARCHAR(20)    NOT NULL DEFAULT N'TUZEL_KISI',
        address_line            NVARCHAR(500)   NULL,
        city_id                 BIGINT          NULL,
        district_id             BIGINT          NULL,
        gib_title_fetched_at    DATETIME2(3)    NULL,
        gib_einvoice_checked_at DATETIME2(3)    NULL,
        tax_number              NVARCHAR(11)    NULL,
        identity_number         NVARCHAR(11)    NULL,
        tax_office              NVARCHAR(100)   NULL,
        tax_office_city_id      BIGINT          NULL,
        phone                   NVARCHAR(30)    NULL,
        mobile                  NVARCHAR(30)    NULL,
        fax                     NVARCHAR(30)    NULL,
        email                   NVARCHAR(254)   NULL,
        website                 NVARCHAR(200)   NULL,
        kep_address             NVARCHAR(254)   NULL,
        account_group_id        BIGINT          NULL,
        account_class           NVARCHAR(30)    NULL,
        payment_term_id         BIGINT          NULL,
        payment_method          NVARCHAR(30)    NULL,
        due_days                INT             NULL,
        currency_id             BIGINT          NOT NULL,
        credit_limit            DECIMAL(18,2)   NULL,
        risk_limit              DECIMAL(18,2)   NULL,
        discount_rate           DECIMAL(5,2)    NULL,
        price_list_id           BIGINT          NULL,
        sales_rep_id            BIGINT          NULL,
        branch_id               BIGINT          NULL,
        is_einvoice_user        BIT             NOT NULL DEFAULT 0,
        einvoice_alias          NVARCHAR(200)   NULL,
        is_earchive_customer    BIT             NOT NULL DEFAULT 0,
        ewaybill_alias          NVARCHAR(200)   NULL,
        is_foreign              BIT             NOT NULL DEFAULT 0,
        foreign_tax_no          NVARCHAR(50)    NULL,
        passport_no             NVARCHAR(30)    NULL,
        accounting_code         NVARCHAR(30)    NULL,
        is_blacklisted          BIT             NOT NULL DEFAULT 0,
        blacklist_reason        NVARCHAR(500)   NULL,
        opening_debit           DECIMAL(18,2)   NULL,
        opening_credit          DECIMAL(18,2)   NULL,
        opening_date            DATE            NULL,
        is_active               BIT             NOT NULL DEFAULT 1,
        notes                   NVARCHAR(MAX)   NULL,
        external_ref            NVARCHAR(50)    NULL,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by              BIGINT          NULL,
        updated_at              DATETIME2(3)    NULL,
        updated_by              BIGINT          NULL,
        is_deleted              BIT             NOT NULL DEFAULT 0,
        deleted_at              DATETIME2(3)    NULL,
        deleted_by              BIGINT          NULL,
        row_version             ROWVERSION      NOT NULL,
        CONSTRAINT PK_cari_accounts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_cari_accounts_code UNIQUE (code),
        CONSTRAINT FK_cari_accounts_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id),
        CONSTRAINT FK_cari_accounts_city FOREIGN KEY (city_id) REFERENCES dbo.core_cities (id),
        CONSTRAINT FK_cari_accounts_district FOREIGN KEY (district_id) REFERENCES dbo.core_districts (id),
        CONSTRAINT FK_cari_accounts_payment_term FOREIGN KEY (payment_term_id) REFERENCES dbo.core_payment_terms (id),
        CONSTRAINT FK_cari_accounts_group FOREIGN KEY (account_group_id) REFERENCES dbo.cari_account_groups (id),
        CONSTRAINT FK_cari_accounts_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id)
    );
    CREATE INDEX IX_cari_accounts_title ON dbo.cari_accounts (title) WHERE is_deleted = 0;
    CREATE INDEX IX_cari_accounts_phone ON dbo.cari_accounts (phone) WHERE is_deleted = 0;
    CREATE INDEX IX_cari_accounts_email ON dbo.cari_accounts (email) WHERE is_deleted = 0;
END
GO

IF OBJECT_ID(N'dbo.cari_addresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cari_addresses (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        account_id          BIGINT          NOT NULL,
        address_type        NVARCHAR(20)    NOT NULL DEFAULT N'BILLING',
        title               NVARCHAR(100)   NULL,
        address_line1       NVARCHAR(300)   NOT NULL,
        address_line2       NVARCHAR(300)   NULL,
        city_id             BIGINT          NOT NULL,
        district_id         BIGINT          NOT NULL,
        postal_code         NVARCHAR(10)    NULL,
        country_code        CHAR(2)         NOT NULL DEFAULT 'TR',
        phone               NVARCHAR(30)    NULL,
        is_default          BIT             NOT NULL DEFAULT 0,
        is_ewaybill_address BIT             NOT NULL DEFAULT 0,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_cari_addresses PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_cari_addresses_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_cari_addresses_city FOREIGN KEY (city_id) REFERENCES dbo.core_cities (id),
        CONSTRAINT FK_cari_addresses_district FOREIGN KEY (district_id) REFERENCES dbo.core_districts (id)
    );
END
GO

IF OBJECT_ID(N'dbo.cari_contacts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cari_contacts (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        account_id      BIGINT          NOT NULL,
        full_name       NVARCHAR(200)   NOT NULL,
        job_title       NVARCHAR(100)   NULL,
        department      NVARCHAR(100)   NULL,
        phone           NVARCHAR(30)    NULL,
        extension       NVARCHAR(10)    NULL,
        mobile          NVARCHAR(30)    NULL,
        email           NVARCHAR(254)   NULL,
        is_primary      BIT             NOT NULL DEFAULT 0,
        notes           NVARCHAR(500)   NULL,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_cari_contacts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_cari_contacts_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id)
    );
END
GO

IF OBJECT_ID(N'dbo.cari_bank_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cari_bank_accounts (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        account_id      BIGINT          NOT NULL,
        bank_name       NVARCHAR(100)   NOT NULL,
        branch_name     NVARCHAR(100)   NULL,
        branch_code     NVARCHAR(20)    NULL,
        account_no      NVARCHAR(30)    NULL,
        iban            NVARCHAR(34)    NULL,
        currency_id     BIGINT          NOT NULL,
        swift_code      NVARCHAR(11)    NULL,
        is_default      BIT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_cari_bank_accounts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_cari_bank_accounts_cari FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_cari_bank_accounts_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
END
GO

IF OBJECT_ID(N'dbo.cari_movements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cari_movements (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        account_id          BIGINT          NOT NULL,
        movement_date       DATE            NOT NULL,
        due_date            DATE            NULL,
        movement_type       NVARCHAR(30)    NOT NULL,
        debit               DECIMAL(18,2)   NOT NULL DEFAULT 0,
        credit              DECIMAL(18,2)   NOT NULL DEFAULT 0,
        currency_id         BIGINT          NOT NULL,
        exchange_rate       DECIMAL(18,6)   NOT NULL DEFAULT 1,
        amount_foreign      DECIMAL(18,2)   NULL,
        document_module     NVARCHAR(30)    NULL,
        document_id         BIGINT          NULL,
        document_no         NVARCHAR(50)    NULL,
        description         NVARCHAR(500)   NULL,
        fiscal_period_id    BIGINT          NULL,
        is_reconciled       BIT             NOT NULL DEFAULT 0,
        reconciled_at       DATETIME2(3)    NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_cari_movements PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_cari_movements_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_cari_movements_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
    CREATE INDEX IX_cari_movements_account_date ON dbo.cari_movements (account_id, movement_date);
END
GO

/* Cari bakiye görünümü */
CREATE OR ALTER VIEW dbo.v_cari_account_balance
AS
SELECT
    a.id            AS account_id,
    a.code,
    a.title,
    a.account_type,
    a.phone,
    a.email,
    ISNULL(SUM(m.debit), 0) - ISNULL(SUM(m.credit), 0) AS balance
FROM dbo.cari_accounts a
LEFT JOIN dbo.cari_movements m ON m.account_id = a.id AND m.is_deleted = 0
WHERE a.is_deleted = 0
GROUP BY a.id, a.code, a.title, a.account_type, a.phone, a.email;
GO

/* ========================================================================== */
/* STOK (stk_)                                                                */
/* ========================================================================== */

IF OBJECT_ID(N'dbo.stk_units', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_units (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(10)    NOT NULL,
        name            NVARCHAR(50)    NOT NULL,
        is_base         BIT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        CONSTRAINT PK_stk_units PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_units_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_categories (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        parent_id       BIGINT          NULL,
        code            NVARCHAR(30)    NOT NULL,
        name            NVARCHAR(200)   NOT NULL,
        path            NVARCHAR(500)   NULL,
        sort_order      INT             NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_categories PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_categories_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_brands', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_brands (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(30)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        CONSTRAINT PK_stk_brands PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_brands_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_price_lists', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_price_lists (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        code            NVARCHAR(20)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        currency_id     BIGINT          NOT NULL,
        start_date      DATE            NOT NULL,
        end_date        DATE            NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_price_lists PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_price_lists_code UNIQUE (code),
        CONSTRAINT FK_stk_price_lists_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_items (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        code                    NVARCHAR(50)    NOT NULL,
        barcode                 NVARCHAR(50)    NULL,
        name                    NVARCHAR(300)   NOT NULL,
        short_name              NVARCHAR(100)   NULL,
        item_type               NVARCHAR(20)    NOT NULL DEFAULT N'PRODUCT',
        tracking_type           NVARCHAR(20)    NOT NULL DEFAULT N'TAKIPSIZ',
        category_id             BIGINT          NULL,
        brand_id                BIGINT          NULL,
        brand_name              NVARCHAR(100)   NULL,
        base_unit_id            BIGINT          NOT NULL,
        purchase_unit_id        BIGINT          NULL,
        sales_unit_id           BIGINT          NULL,
        tax_rate_id             BIGINT          NOT NULL,
        purchase_price          DECIMAL(18,4)   NULL,
        sales_price             DECIMAL(18,4)   NULL,
        currency_id             BIGINT          NOT NULL,
        min_stock_level         DECIMAL(18,4)   NULL,
        max_stock_level         DECIMAL(18,4)   NULL,
        reorder_point           DECIMAL(18,4)   NULL,
        reorder_quantity        DECIMAL(18,4)   NULL,
        track_serial            BIT             NOT NULL DEFAULT 0,
        track_lot               BIT             NOT NULL DEFAULT 0,
        track_expiry            BIT             NOT NULL DEFAULT 0,
        is_weighable            BIT             NOT NULL DEFAULT 0,
        origin_country          NVARCHAR(100)   NULL DEFAULT N'Türkiye',
        gtip_code               CHAR(12)        NULL,
        shelf_no                NVARCHAR(50)    NULL,
        opening_quantity        DECIMAL(18,4)   NULL,
        critical_alert_enabled  BIT             NOT NULL DEFAULT 0,
        description             NVARCHAR(MAX)   NULL,
        description_html        NVARCHAR(MAX)   NULL,
        model                   NVARCHAR(100)   NULL,
        weight                  DECIMAL(18,4)   NULL,
        volume                  DECIMAL(18,4)   NULL,
        otv_code                NVARCHAR(20)    NULL,
        shelf_life_days         INT             NULL,
        warranty_months         INT             NULL,
        default_warehouse_id    BIGINT          NULL,
        default_supplier_id     BIGINT          NULL,
        accounting_code         NVARCHAR(30)    NULL,
        image_path              NVARCHAR(500)   NULL,
        external_ref            NVARCHAR(50)    NULL,
        is_active               BIT             NOT NULL DEFAULT 1,
        is_sales_blocked        BIT             NOT NULL DEFAULT 0,
        is_purchase_blocked     BIT             NOT NULL DEFAULT 0,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by              BIGINT          NULL,
        updated_at              DATETIME2(3)    NULL,
        updated_by              BIGINT          NULL,
        is_deleted              BIT             NOT NULL DEFAULT 0,
        deleted_at              DATETIME2(3)    NULL,
        deleted_by              BIGINT          NULL,
        row_version             ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_items PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_items_code UNIQUE (code),
        CONSTRAINT FK_stk_items_category FOREIGN KEY (category_id) REFERENCES dbo.stk_categories (id),
        CONSTRAINT FK_stk_items_brand FOREIGN KEY (brand_id) REFERENCES dbo.stk_brands (id),
        CONSTRAINT FK_stk_items_base_unit FOREIGN KEY (base_unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_stk_items_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id),
        CONSTRAINT FK_stk_items_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
    CREATE INDEX IX_stk_items_barcode ON dbo.stk_items (barcode) WHERE barcode IS NOT NULL;
    CREATE INDEX IX_stk_items_name ON dbo.stk_items (name) WHERE is_deleted = 0;
END
GO

IF OBJECT_ID(N'dbo.stk_item_categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_item_categories (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        item_id         BIGINT          NOT NULL,
        category_id     BIGINT          NOT NULL,
        CONSTRAINT PK_stk_item_categories PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_item_categories UNIQUE (item_id, category_id),
        CONSTRAINT FK_stk_item_categories_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_stk_item_categories_cat FOREIGN KEY (category_id) REFERENCES dbo.stk_categories (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_item_prices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_item_prices (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        item_id         BIGINT          NOT NULL,
        price_category  NVARCHAR(20)    NOT NULL,
        purchase_net    DECIMAL(18,4)   NULL,
        purchase_gross  DECIMAL(18,4)   NULL,
        sales_net       DECIMAL(18,4)   NULL,
        sales_gross     DECIMAL(18,4)   NULL,
        tax_rate_id     BIGINT          NOT NULL,
        currency_id     BIGINT          NOT NULL,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2(3)    NULL,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_item_prices PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_item_prices UNIQUE (item_id, price_category),
        CONSTRAINT FK_stk_item_prices_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_stk_item_prices_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id),
        CONSTRAINT FK_stk_item_prices_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_item_variants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_item_variants (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        parent_item_id  BIGINT          NOT NULL,
        name            NVARCHAR(200)   NOT NULL,
        sku             NVARCHAR(50)    NULL,
        barcode         NVARCHAR(50)    NULL,
        attributes_json NVARCHAR(MAX)   NULL,
        purchase_price  DECIMAL(18,4)   NULL,
        sales_price     DECIMAL(18,4)   NULL,
        quantity        DECIMAL(18,4)   NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_item_variants PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_stk_item_variants_item FOREIGN KEY (parent_item_id) REFERENCES dbo.stk_items (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_warehouses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_warehouses (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        branch_id       BIGINT          NOT NULL,
        code            NVARCHAR(20)    NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        address         NVARCHAR(500)   NULL,
        is_default      BIT             NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted      BIT             NOT NULL DEFAULT 0,
        row_version     ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_warehouses PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_warehouses_code UNIQUE (code),
        CONSTRAINT FK_stk_warehouses_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_stock_balances', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_stock_balances (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        item_id             BIGINT          NOT NULL,
        warehouse_id        BIGINT          NOT NULL,
        quantity            DECIMAL(18,4)   NOT NULL DEFAULT 0,
        reserved_quantity   DECIMAL(18,4)   NOT NULL DEFAULT 0,
        updated_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_stk_stock_balances PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_stk_stock_balances UNIQUE (item_id, warehouse_id),
        CONSTRAINT FK_stk_stock_balances_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_stk_stock_balances_wh FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_stock_movements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_stock_movements (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        item_id             BIGINT          NOT NULL,
        warehouse_id        BIGINT          NOT NULL,
        movement_date       DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        movement_type       NVARCHAR(30)    NOT NULL,
        quantity            DECIMAL(18,4)   NOT NULL,
        unit_id             BIGINT          NOT NULL,
        unit_price          DECIMAL(18,4)   NULL,
        document_module     NVARCHAR(30)    NULL,
        document_id         BIGINT          NULL,
        document_line_id    BIGINT          NULL,
        lot_no              NVARCHAR(50)    NULL,
        serial_no           NVARCHAR(50)    NULL,
        expiry_date         DATE            NULL,
        description         NVARCHAR(500)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_stk_stock_movements PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_stk_stock_movements_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_stk_stock_movements_wh FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id),
        CONSTRAINT FK_stk_stock_movements_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id)
    );
END
GO

IF OBJECT_ID(N'dbo.stk_price_list_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stk_price_list_items (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        price_list_id   BIGINT          NOT NULL,
        item_id         BIGINT          NOT NULL,
        unit_id         BIGINT          NOT NULL,
        price           DECIMAL(18,4)   NOT NULL,
        min_quantity    DECIMAL(18,4)   NULL,
        CONSTRAINT PK_stk_price_list_items PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_stk_pli_list FOREIGN KEY (price_list_id) REFERENCES dbo.stk_price_lists (id),
        CONSTRAINT FK_stk_pli_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_stk_pli_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id)
    );
END
GO

/* ========================================================================== */
/* SEED — Başlangıç verileri                                                  */
/* ========================================================================== */

-- Para birimleri
IF NOT EXISTS (SELECT 1 FROM dbo.core_currencies WHERE code = 'TRY')
    INSERT INTO dbo.core_currencies (code, name, symbol, is_default) VALUES ('TRY', N'Türk Lirası', N'₺', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.core_currencies WHERE code = 'USD')
    INSERT INTO dbo.core_currencies (code, name, symbol, is_default) VALUES ('USD', N'Amerikan Doları', N'$', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.core_currencies WHERE code = 'EUR')
    INSERT INTO dbo.core_currencies (code, name, symbol, is_default) VALUES ('EUR', N'Euro', N'€', 0);
GO

-- KDV oranları
MERGE dbo.core_tax_rates AS t
USING (VALUES
    (N'KDV20', N'KDV %20', 20.00),
    (N'KDV10', N'KDV %10', 10.00),
    (N'KDV1',  N'KDV %1',   1.00),
    (N'KDV0',  N'KDV %0',   0.00)
) AS s (code, name, rate) ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, name, rate) VALUES (s.code, s.name, s.rate);
GO

-- İl / ilçe (örnek)
DECLARE @IstanbulId BIGINT, @AnkaraId BIGINT;

IF NOT EXISTS (SELECT 1 FROM dbo.core_cities WHERE name = N'İstanbul')
    INSERT INTO dbo.core_cities (plate_code, name) VALUES (N'34', N'İstanbul');
SET @IstanbulId = (SELECT id FROM dbo.core_cities WHERE name = N'İstanbul');

IF NOT EXISTS (SELECT 1 FROM dbo.core_cities WHERE name = N'Ankara')
    INSERT INTO dbo.core_cities (plate_code, name) VALUES (N'06', N'Ankara');
SET @AnkaraId = (SELECT id FROM dbo.core_cities WHERE name = N'Ankara');

IF NOT EXISTS (SELECT 1 FROM dbo.core_districts WHERE name = N'Kadıköy' AND city_id = @IstanbulId)
    INSERT INTO dbo.core_districts (city_id, name) VALUES (@IstanbulId, N'Kadıköy');
IF NOT EXISTS (SELECT 1 FROM dbo.core_districts WHERE name = N'Beşiktaş' AND city_id = @IstanbulId)
    INSERT INTO dbo.core_districts (city_id, name) VALUES (@IstanbulId, N'Beşiktaş');
IF NOT EXISTS (SELECT 1 FROM dbo.core_districts WHERE name = N'Çankaya' AND city_id = @AnkaraId)
    INSERT INTO dbo.core_districts (city_id, name) VALUES (@AnkaraId, N'Çankaya');
GO

-- Ödeme vadeleri
IF NOT EXISTS (SELECT 1 FROM dbo.core_payment_terms WHERE code = N'PESIN')
    INSERT INTO dbo.core_payment_terms (code, name, due_days) VALUES (N'PESIN', N'Peşin', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.core_payment_terms WHERE code = N'NET30')
    INSERT INTO dbo.core_payment_terms (code, name, due_days) VALUES (N'NET30', N'Net 30 Gün', 30);
GO

-- Numara serileri
IF NOT EXISTS (SELECT 1 FROM dbo.core_document_series WHERE module_code = N'CARI' AND prefix = N'M')
    INSERT INTO dbo.core_document_series (module_code, document_type, prefix, next_number, padding, fiscal_year)
    VALUES (N'CARI', N'SALES', N'M', 1, 5, YEAR(GETDATE()));
IF NOT EXISTS (SELECT 1 FROM dbo.core_document_series WHERE module_code = N'STK' AND prefix = N'S')
    INSERT INTO dbo.core_document_series (module_code, document_type, prefix, next_number, padding, fiscal_year)
    VALUES (N'STK', N'SALES', N'S', 1, 5, YEAR(GETDATE()));
GO

-- Birimler
MERGE dbo.stk_units AS t
USING (VALUES (N'ADET', N'Adet', 1), (N'KG', N'Kilogram', 0), (N'LT', N'Litre', 0), (N'MT', N'Metre', 0))
AS s (code, name, is_base) ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, name, is_base) VALUES (s.code, s.name, s.is_base);
GO

-- Merkez şube
DECLARE @CityId BIGINT = (SELECT TOP 1 id FROM dbo.core_cities WHERE name = N'İstanbul');

IF NOT EXISTS (SELECT 1 FROM dbo.org_branches WHERE code = N'MERKEZ')
    INSERT INTO dbo.org_branches (code, name, address, city_id, is_headquarters, is_active)
    VALUES (N'MERKEZ', N'Merkez Şube', N'Örnek Mah. Demo Cad. No:1', @CityId, 1, 1);
GO

-- Demo org kullanıcı (şirket DB — sistem bağlantısı için 03-sistem-baglantisi.sql çalıştırın)
DECLARE @BranchId BIGINT = (SELECT id FROM dbo.org_branches WHERE code = N'MERKEZ');

IF NOT EXISTS (SELECT 1 FROM dbo.org_users WHERE email = N'admin@ecari.demo')
BEGIN
    INSERT INTO dbo.org_users (system_user_id, full_name, email, phone, default_branch_id, is_active, joined_at)
    VALUES (1, N'Demo Yönetici', N'admin@ecari.demo', N'+905551234567', @BranchId, 1, SYSUTCDATETIME());
    PRINT N'Demo org_users eklendi. Sistem DB için: 01 ve 03 scriptlerini çalıştırın.';
END
GO

-- Şirket profili
DECLARE @TryId BIGINT = (SELECT id FROM dbo.core_currencies WHERE code = 'TRY');
DECLARE @ProfileCityId BIGINT = (SELECT TOP 1 id FROM dbo.core_cities WHERE name = N'İstanbul');
DECLARE @DistId BIGINT = (SELECT TOP 1 id FROM dbo.core_districts);

IF NOT EXISTS (SELECT 1 FROM dbo.cfg_company_profile)
    INSERT INTO dbo.cfg_company_profile (legal_name, trade_name, tax_number, tax_office, address, city_id, district_id, phone, email, default_currency_id)
    VALUES (N'Demo Şirket A.Ş.', N'Demo Şirket', N'1234567890', N'Kadıköy', N'Örnek Mah. Demo Cad. No:1', @ProfileCityId, @DistId, N'+902121234567', N'info@demo.com', @TryId);
GO

-- Modül ayarları
MERGE dbo.cfg_module_settings AS t
USING (VALUES
    (N'STK', N'stk.allow_negative_stock', N'false', N'BOOL'),
    (N'INV', N'inv.default_tax_rate_id', N'1', N'INT'),
    (N'INV', N'inv.auto_post_cari', N'true', N'BOOL'),
    (N'CHQ', N'chq.due_date_alert_days', N'7', N'INT')
) AS s (module_code, setting_key, setting_value, data_type) ON t.module_code = s.module_code AND t.setting_key = s.setting_key
WHEN NOT MATCHED THEN INSERT (module_code, setting_key, setting_value, data_type) VALUES (s.module_code, s.setting_key, s.setting_value, s.data_type);
GO

-- Varsayılan depo
DECLARE @WhBranchId BIGINT = (SELECT id FROM dbo.org_branches WHERE code = N'MERKEZ');

IF NOT EXISTS (SELECT 1 FROM dbo.stk_warehouses WHERE code = N'ANA')
    INSERT INTO dbo.stk_warehouses (branch_id, code, name, is_default, is_active)
    VALUES (@WhBranchId, N'ANA', N'Ana Depo', 1, 1);
GO

-- Örnek cari müşteri
DECLARE @CurrencyId BIGINT = (SELECT id FROM dbo.core_currencies WHERE code = 'TRY');
DECLARE @CariCityId BIGINT = (SELECT TOP 1 id FROM dbo.core_cities WHERE name = N'İstanbul');
DECLARE @KadikoyId BIGINT = (SELECT TOP 1 id FROM dbo.core_districts WHERE name = N'Kadıköy');
DECLARE @CariId BIGINT;

IF NOT EXISTS (SELECT 1 FROM dbo.cari_accounts WHERE code = N'M00001')
BEGIN
    INSERT INTO dbo.cari_accounts (code, account_type, title, person_type, tax_number, tax_office, phone, email, city_id, district_id, currency_id, is_active)
    VALUES (N'M00001', N'CUSTOMER', N'Perakende Müşteri', N'TUZEL_KISI', N'1234567890', N'Kadıköy', N'+905551112233', N'musteri@ornek.com', @CariCityId, @KadikoyId, @CurrencyId, 1);

    SET @CariId = SCOPE_IDENTITY();

    INSERT INTO dbo.cari_addresses (account_id, address_type, title, address_line1, city_id, district_id, is_default)
    VALUES (@CariId, N'BILLING', N'Merkez', N'Örnek Mah. No:5', @CariCityId, @KadikoyId, 1);

    PRINT N'Ornek cari eklendi: M00001';
END
GO

PRINT N'';
PRINT N'========================================';
PRINT N' ecari_sirket_demo kurulumu tamamlandi.';
PRINT N' Sonraki adim: 01-ecari_system.sql sonra 03-sistem-baglantisi.sql';
PRINT N'========================================';
GO
