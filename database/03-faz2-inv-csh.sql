/*
================================================================================
  E-CARI — FAZ 2: Fatura (inv_) + Kasa (csh_) — ecari_sirket_demo
================================================================================
  SSMS: USE ecari_sirket_demo; sonra F5
  sqlcmd: sqlcmd -S ... -U sa -P ... -d ecari_sirket_demo -i 03-faz2-inv-csh.sql -f 65001
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ── inv_invoices ─────────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.inv_invoices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inv_invoices (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        document_no         NVARCHAR(50)    NOT NULL,
        document_date       DATE            NOT NULL,
        document_time       TIME(0)         NULL,
        invoice_type        NVARCHAR(30)    NOT NULL,
        invoice_scenario    NVARCHAR(30)    NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT N'APPROVED',
        account_id          BIGINT          NOT NULL,
        branch_id           BIGINT          NULL,
        warehouse_id        BIGINT          NULL,
        currency_id         BIGINT          NOT NULL,
        exchange_rate       DECIMAL(18,6)   NOT NULL DEFAULT 1,
        due_date            DATE            NULL,
        subtotal            DECIMAL(18,2)   NOT NULL DEFAULT 0,
        discount_total      DECIMAL(18,2)   NOT NULL DEFAULT 0,
        tax_total           DECIMAL(18,2)   NOT NULL DEFAULT 0,
        grand_total         DECIMAL(18,2)   NOT NULL DEFAULT 0,
        payment_status      NVARCHAR(20)    NULL,
        e_invoice_type      NVARCHAR(30)    NULL,
        notes               NVARCHAR(MAX)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_inv_invoices PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_inv_invoices_document_no UNIQUE (document_no),
        CONSTRAINT FK_inv_invoices_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_inv_invoices_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id),
        CONSTRAINT FK_inv_invoices_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id),
        CONSTRAINT FK_inv_invoices_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
    CREATE INDEX IX_inv_invoices_type_date ON dbo.inv_invoices (invoice_type, document_date DESC);
END
GO

/* ── inv_invoice_lines ────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.inv_invoice_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inv_invoice_lines (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        invoice_id          BIGINT          NOT NULL,
        line_no             INT             NOT NULL,
        line_type           NVARCHAR(20)    NOT NULL DEFAULT N'URUN',
        item_id             BIGINT          NULL,
        description         NVARCHAR(500)   NOT NULL,
        quantity            DECIMAL(18,4)   NOT NULL DEFAULT 1,
        unit_id             BIGINT          NOT NULL,
        unit_price          DECIMAL(18,4)   NOT NULL DEFAULT 0,
        discount_amount     DECIMAL(18,2)   NOT NULL DEFAULT 0,
        tax_rate_id         BIGINT          NOT NULL,
        tax_amount          DECIMAL(18,2)   NOT NULL DEFAULT 0,
        line_total          DECIMAL(18,2)   NOT NULL DEFAULT 0,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_inv_invoice_lines PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_inv_invoice_lines_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.inv_invoices (id),
        CONSTRAINT FK_inv_invoice_lines_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_inv_invoice_lines_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_inv_invoice_lines_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id)
    );
    CREATE INDEX IX_inv_invoice_lines_invoice ON dbo.inv_invoice_lines (invoice_id, line_no);
END
GO

/* ── csh_accounts ─────────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.csh_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.csh_accounts (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(20)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        cash_type           NVARCHAR(30)    NOT NULL DEFAULT N'CASH',
        branch_id           BIGINT          NOT NULL,
        currency_id         BIGINT          NOT NULL,
        opening_balance     DECIMAL(18,2)   NOT NULL DEFAULT 0,
        is_active           BIT             NOT NULL DEFAULT 1,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_csh_accounts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_csh_accounts_code UNIQUE (code),
        CONSTRAINT FK_csh_accounts_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id),
        CONSTRAINT FK_csh_accounts_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
END
GO

/* ── csh_transactions ─────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.csh_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.csh_transactions (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        cash_account_id     BIGINT          NOT NULL,
        transaction_date    DATE            NOT NULL,
        transaction_type    NVARCHAR(30)    NOT NULL,
        amount              DECIMAL(18,2)   NOT NULL,
        description         NVARCHAR(500)   NULL,
        reference_no        NVARCHAR(50)    NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_csh_transactions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_csh_transactions_account FOREIGN KEY (cash_account_id) REFERENCES dbo.csh_accounts (id)
    );
    CREATE INDEX IX_csh_transactions_account ON dbo.csh_transactions (cash_account_id, transaction_date DESC);
END
GO

/* ── Demo cari (fatura listesi için) ────────────────────────────────────────── */
DECLARE @CurrencyId BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
DECLARE @BranchId BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
DECLARE @CityId BIGINT = (SELECT TOP 1 id FROM dbo.core_cities WHERE plate_code = N'34');

IF @CurrencyId IS NULL OR @BranchId IS NULL
BEGIN
    RAISERROR(N'Önce 02-ecari_sirket_demo.sql çalıştırılmalı.', 16, 1);
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0)
    INSERT INTO dbo.cari_accounts (code, account_type, title, person_type, tax_number, tax_office, currency_id, is_active)
    VALUES (N'M00002', N'CUSTOMER', N'ABC Teknoloji Ltd.', N'TUZEL_KISI', N'1111111111', N'Kadıköy', @CurrencyId, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.cari_accounts WHERE code = N'M00003' AND is_deleted = 0)
    INSERT INTO dbo.cari_accounts (code, account_type, title, person_type, tax_number, tax_office, currency_id, is_active)
    VALUES (N'M00003', N'CUSTOMER', N'XYZ Ticaret A.Ş.', N'TUZEL_KISI', N'2222222222', N'Ümraniye', @CurrencyId, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.cari_accounts WHERE code = N'M00004' AND is_deleted = 0)
    INSERT INTO dbo.cari_accounts (code, account_type, title, person_type, identity_number, currency_id, is_active)
    VALUES (N'M00004', N'CUSTOMER', N'Mehmet Yılmaz', N'GERCEK_KISI', N'12345678901', @CurrencyId, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.cari_accounts WHERE code = N'T00001' AND is_deleted = 0)
    INSERT INTO dbo.cari_accounts (code, account_type, title, person_type, tax_number, tax_office, currency_id, is_active)
    VALUES (N'T00001', N'SUPPLIER', N'Tedarikçi A.Ş.', N'TUZEL_KISI', N'3333333333', N'Kartal', @CurrencyId, 1);
GO

/* ── Demo faturalar ───────────────────────────────────────────────────────── */
IF NOT EXISTS (SELECT 1 FROM dbo.inv_invoices WHERE document_no = N'SF-2026-0142')
BEGIN
    DECLARE @Cur BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    DECLARE @Br BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
    DECLARE @Abc BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0), (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id));
    DECLARE @Xyz BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00003' AND is_deleted = 0), @Abc);
    DECLARE @Meh BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00004' AND is_deleted = 0), @Abc);
    DECLARE @Ted BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'T00001' AND is_deleted = 0), @Abc);

    INSERT INTO dbo.inv_invoices (document_no, document_date, invoice_type, status, account_id, branch_id, currency_id, due_date, subtotal, tax_total, grand_total, payment_status)
    VALUES
        (N'SF-2026-0142', '2026-05-28', N'SALES', N'APPROVED', @Abc, @Br, @Cur, '2026-06-28', 3541.67, 708.33, 4250.00, N'ODENDI'),
        (N'SF-2026-0141', '2026-05-27', N'SALES', N'APPROVED', @Xyz, @Br, @Cur, '2026-06-27', 10666.67, 2133.33, 12800.00, N'BEKLIYOR'),
        (N'SF-2026-0140', '2026-05-25', N'SALES', N'APPROVED', @Meh, @Br, @Cur, '2026-05-25', 2083.33, 416.67, 2500.00, N'ODENDI'),
        (N'AF-2026-0088', '2026-05-26', N'PURCHASE', N'APPROVED', @Ted, @Br, @Cur, '2026-06-26', 5000.00, 1000.00, 6000.00, N'BEKLIYOR'),
        (N'AF-2026-0087', '2026-05-24', N'PURCHASE', N'APPROVED', @Ted, @Br, @Cur, '2026-06-24', 8333.33, 1666.67, 10000.00, N'ODENDI');
END
GO

/* ── Demo kasa ────────────────────────────────────────────────────────────── */
IF NOT EXISTS (SELECT 1 FROM dbo.csh_accounts WHERE code = N'KASA01')
BEGIN
    DECLARE @Cur2 BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    DECLARE @Br2 BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
    DECLARE @KasaMain BIGINT;

    INSERT INTO dbo.csh_accounts (code, name, cash_type, branch_id, currency_id, opening_balance, is_active)
    VALUES (N'KASA01', N'Ana Kasa', N'CASH', @Br2, @Cur2, 5000.00, 1);
    SET @KasaMain = SCOPE_IDENTITY();

    INSERT INTO dbo.csh_accounts (code, name, cash_type, branch_id, currency_id, opening_balance, is_active)
    VALUES (N'KASA02', N'Şube Kasa', N'CASH', @Br2, @Cur2, 1200.00, 1);

    INSERT INTO dbo.csh_transactions (cash_account_id, transaction_date, transaction_type, amount, description, reference_no)
    VALUES
        (@KasaMain, '2026-05-28', N'IN', 4250.00, N'SF-2026-0142 tahsilat', N'SF-2026-0142'),
        (@KasaMain, '2026-05-27', N'OUT', 850.00, N'Masraf ödemesi', N'MSF-001'),
        (@KasaMain, '2026-05-25', N'IN', 2500.00, N'SF-2026-0140 tahsilat', N'SF-2026-0140');
END
GO

PRINT N'03-faz2-inv-csh.sql tamamlandı.';
GO
