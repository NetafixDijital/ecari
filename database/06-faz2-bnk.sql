/*
================================================================================
  E-CARI — FAZ 2: Banka (bnk_) — ecari_sirket_demo
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.bnk_banks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bnk_banks (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(10)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        CONSTRAINT PK_bnk_banks PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_bnk_banks_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.bnk_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bnk_accounts (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        bank_id             BIGINT          NOT NULL,
        branch_id           BIGINT          NOT NULL,
        code                NVARCHAR(20)    NOT NULL,
        account_name        NVARCHAR(100)   NOT NULL,
        account_no          NVARCHAR(30)    NULL,
        iban                NVARCHAR(34)    NOT NULL,
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
        CONSTRAINT PK_bnk_accounts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_bnk_accounts_code UNIQUE (code),
        CONSTRAINT FK_bnk_accounts_bank FOREIGN KEY (bank_id) REFERENCES dbo.bnk_banks (id),
        CONSTRAINT FK_bnk_accounts_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id),
        CONSTRAINT FK_bnk_accounts_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
END
GO

IF OBJECT_ID(N'dbo.bnk_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bnk_transactions (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        bank_account_id     BIGINT          NOT NULL,
        transaction_date    DATE            NOT NULL,
        value_date          DATE            NULL,
        transaction_type    NVARCHAR(30)    NOT NULL,
        account_id          BIGINT          NULL,
        amount              DECIMAL(18,2)   NOT NULL,
        currency_id         BIGINT          NOT NULL,
        exchange_rate       DECIMAL(18,6)   NOT NULL DEFAULT 1,
        reference_no        NVARCHAR(50)    NULL,
        description         NVARCHAR(500)   NULL,
        is_reconciled       BIT             NOT NULL DEFAULT 0,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_bnk_transactions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_bnk_transactions_account FOREIGN KEY (bank_account_id) REFERENCES dbo.bnk_accounts (id),
        CONSTRAINT FK_bnk_transactions_cari FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_bnk_transactions_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
    CREATE INDEX IX_bnk_transactions_account_date ON dbo.bnk_transactions (bank_account_id, transaction_date DESC);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.bnk_banks WHERE code = N'ZIRAAT')
    INSERT INTO dbo.bnk_banks (code, name) VALUES (N'ZIRAAT', N'Ziraat Bankası'), (N'GARANTI', N'Garanti BBVA');

IF NOT EXISTS (SELECT 1 FROM dbo.bnk_accounts WHERE code = N'BNK01')
BEGIN
    DECLARE @Cur BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    DECLARE @Br BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
    DECLARE @Bank BIGINT = (SELECT TOP 1 id FROM dbo.bnk_banks WHERE code = N'ZIRAAT');
    DECLARE @BnkMain BIGINT;
    DECLARE @Cari BIGINT = (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id);

    INSERT INTO dbo.bnk_accounts (bank_id, branch_id, code, account_name, account_no, iban, currency_id, opening_balance, is_active)
    VALUES (@Bank, @Br, N'BNK01', N'TL Vadesiz', N'12345678', N'TR330006100519786457841326', @Cur, 25000.00, 1);
    SET @BnkMain = SCOPE_IDENTITY();

    INSERT INTO dbo.bnk_accounts (bank_id, branch_id, code, account_name, account_no, iban, currency_id, opening_balance, is_active)
    VALUES ((SELECT TOP 1 id FROM dbo.bnk_banks WHERE code = N'GARANTI'), @Br, N'BNK02', N'İşletme Hesabı', N'98765432', N'TR620006200519786457841327', @Cur, 8500.00, 1);

    INSERT INTO dbo.bnk_transactions (bank_account_id, transaction_date, transaction_type, account_id, amount, currency_id, reference_no, description)
    VALUES
        (@BnkMain, '2026-05-28', N'INCOMING', @Cari, 4250.00, @Cur, N'HAVALE-001', N'SF-2026-0142 tahsilat'),
        (@BnkMain, '2026-05-27', N'OUTGOING', NULL, 1200.00, @Cur, N'EFT-002', N'Tedarikçi ödemesi');
END
GO

/* Demo stok hareketleri */
IF NOT EXISTS (SELECT 1 FROM dbo.stk_stock_movements WHERE description = N'Demo açılış stoku')
BEGIN
    DECLARE @Item2 BIGINT = (SELECT TOP 1 id FROM dbo.stk_items WHERE is_deleted = 0 ORDER BY id);
    DECLARE @Wh2 BIGINT = (SELECT TOP 1 id FROM dbo.stk_warehouses WHERE is_deleted = 0 ORDER BY is_default DESC, id);
    DECLARE @Unit2 BIGINT = (SELECT TOP 1 id FROM dbo.stk_units ORDER BY id);

    IF @Item2 IS NOT NULL AND @Wh2 IS NOT NULL AND @Unit2 IS NOT NULL
        INSERT INTO dbo.stk_stock_movements (item_id, warehouse_id, movement_type, quantity, unit_id, description)
        VALUES (@Item2, @Wh2, N'IN', 50, @Unit2, N'Demo açılış stoku');
END
GO

PRINT N'06-faz2-bnk.sql tamamlandı.';
GO
