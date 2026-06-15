/*
================================================================================
  E-CARI — Masraf (exp_) yeniden yapı + Hizmet tanımları
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ── exp_service_definitions ─────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.exp_service_definitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exp_service_definitions (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(30)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        category_group      NVARCHAR(50)    NOT NULL DEFAULT N'genel',
        default_tax_rate_id BIGINT          NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        sort_order          INT             NOT NULL DEFAULT 0,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_exp_service_definitions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_exp_service_definitions_code UNIQUE (code),
        CONSTRAINT FK_exp_service_definitions_tax FOREIGN KEY (default_tax_rate_id) REFERENCES dbo.core_tax_rates (id)
    );
END
GO

/* ── exp_expenses genişletme ─────────────────────────────────────────────── */
IF COL_LENGTH(N'dbo.exp_expenses', N'account_id') IS NULL
    ALTER TABLE dbo.exp_expenses ADD account_id BIGINT NULL;
GO
IF COL_LENGTH(N'dbo.exp_expenses', N'subtotal') IS NULL
    ALTER TABLE dbo.exp_expenses ADD subtotal DECIMAL(18,2) NOT NULL DEFAULT 0;
GO
IF COL_LENGTH(N'dbo.exp_expenses', N'tax_total') IS NULL
    ALTER TABLE dbo.exp_expenses ADD tax_total DECIMAL(18,2) NOT NULL DEFAULT 0;
GO
IF COL_LENGTH(N'dbo.exp_expenses', N'grand_total') IS NULL
    ALTER TABLE dbo.exp_expenses ADD grand_total DECIMAL(18,2) NOT NULL DEFAULT 0;
GO
IF COL_LENGTH(N'dbo.exp_expenses', N'purchase_invoice_id') IS NULL
    ALTER TABLE dbo.exp_expenses ADD purchase_invoice_id BIGINT NULL;
GO
IF COL_LENGTH(N'dbo.exp_expenses', N'payment_status') IS NULL
    ALTER TABLE dbo.exp_expenses ADD payment_status NVARCHAR(20) NOT NULL DEFAULT N'ODENDI';
GO

IF OBJECT_ID(N'dbo.FK_exp_expenses_account', N'F') IS NULL
    ALTER TABLE dbo.exp_expenses
        ADD CONSTRAINT FK_exp_expenses_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id);
GO
IF OBJECT_ID(N'dbo.FK_exp_expenses_invoice', N'F') IS NULL
    ALTER TABLE dbo.exp_expenses
        ADD CONSTRAINT FK_exp_expenses_invoice FOREIGN KEY (purchase_invoice_id) REFERENCES dbo.inv_invoices (id);
GO

/* ── exp_expense_lines ───────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.exp_expense_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exp_expense_lines (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        expense_id              BIGINT          NOT NULL,
        line_no                 INT             NOT NULL,
        line_type               NVARCHAR(20)    NOT NULL DEFAULT N'HIZMET',
        service_definition_id   BIGINT          NULL,
        item_id                 BIGINT          NULL,
        description             NVARCHAR(500)   NOT NULL,
        quantity                DECIMAL(18,4)   NOT NULL DEFAULT 1,
        unit_id                 BIGINT          NOT NULL,
        unit_price              DECIMAL(18,4)   NOT NULL DEFAULT 0,
        tax_rate_id             BIGINT          NOT NULL,
        tax_amount              DECIMAL(18,2)   NOT NULL DEFAULT 0,
        line_total              DECIMAL(18,2)   NOT NULL DEFAULT 0,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted              BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_exp_expense_lines PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_exp_expense_lines_expense FOREIGN KEY (expense_id) REFERENCES dbo.exp_expenses (id),
        CONSTRAINT FK_exp_expense_lines_service FOREIGN KEY (service_definition_id) REFERENCES dbo.exp_service_definitions (id),
        CONSTRAINT FK_exp_expense_lines_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_exp_expense_lines_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_exp_expense_lines_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id)
    );
    CREATE INDEX IX_exp_expense_lines_expense ON dbo.exp_expense_lines (expense_id, line_no);
END
GO

/* ── Hizmet tanımı seed ──────────────────────────────────────────────────── */
DECLARE @Tax20 BIGINT = (SELECT TOP 1 id FROM dbo.core_tax_rates WHERE rate = 20 ORDER BY id);
DECLARE @Tax0 BIGINT = (SELECT TOP 1 id FROM dbo.core_tax_rates WHERE rate = 0 ORDER BY id);

IF NOT EXISTS (SELECT 1 FROM dbo.exp_service_definitions WHERE code = N'KIRA')
BEGIN
    INSERT INTO dbo.exp_service_definitions (code, name, category_group, default_tax_rate_id, sort_order) VALUES
        (N'KIRA',       N'Kira Gideri',           N'genel',      @Tax20, 10),
        (N'ELEKTRIK',   N'Elektrik',              N'genel',      @Tax20, 20),
        (N'SU',         N'Su',                    N'genel',      @Tax20, 30),
        (N'VERGI',      N'Vergi / Resmi Harç',    N'genel',      @Tax0,  40),
        (N'STOPPAJ',    N'Stoppaj',               N'genel',      @Tax0,  50),
        (N'INTERNET',   N'İnternet',              N'genel',      @Tax20, 60),
        (N'TELEFON',    N'Telefon',               N'genel',      @Tax20, 70),
        (N'YAKIT',      N'Yakıt',                 N'ulasim',     @Tax20, 80),
        (N'KIRTASIYE',  N'Kırtasiye',             N'ofis',       @Tax20, 90),
        (N'YEMEK',      N'Yemek / İkram',         N'ofis',       @Tax20, 100),
        (N'KONAKLAMA',  N'Konaklama',             N'ulasim',     @Tax20, 110),
        (N'DIGER',      N'Diğer Gider',           N'genel',      @Tax20, 999);
END
GO

/* Eski kayıtları grand_total ile hizala */
UPDATE dbo.exp_expenses
SET grand_total = amount, subtotal = amount
WHERE grand_total = 0 AND amount > 0;
GO

PRINT N'11-exp-masraf-refactor.sql tamamlandı.';
GO
