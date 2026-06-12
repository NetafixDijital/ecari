/*
================================================================================
  E-CARI — FAZ 3: Çek-Senet (chq_) — ecari_sirket_demo
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.chq_portfolios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.chq_portfolios (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(20)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        portfolio_type      NVARCHAR(30)    NOT NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        CONSTRAINT PK_chq_portfolios PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_chq_portfolios_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.chq_instruments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.chq_instruments (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        instrument_type     NVARCHAR(20)    NOT NULL,
        direction           NVARCHAR(20)    NOT NULL,
        portfolio_id        BIGINT          NOT NULL,
        account_id          BIGINT          NOT NULL,
        bank_name           NVARCHAR(100)   NULL,
        branch_name         NVARCHAR(100)   NULL,
        account_no          NVARCHAR(30)    NULL,
        instrument_no       NVARCHAR(30)    NOT NULL,
        issue_date          DATE            NOT NULL,
        due_date            DATE            NOT NULL,
        amount              DECIMAL(18,2)   NOT NULL,
        currency_id         BIGINT          NOT NULL,
        status              NVARCHAR(30)    NOT NULL DEFAULT N'PENDING',
        notes               NVARCHAR(500)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_chq_instruments PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_chq_instruments_portfolio FOREIGN KEY (portfolio_id) REFERENCES dbo.chq_portfolios (id),
        CONSTRAINT FK_chq_instruments_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_chq_instruments_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
    CREATE INDEX IX_chq_instruments_direction_due ON dbo.chq_instruments (direction, due_date);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.chq_portfolios WHERE code = N'TAHSILAT')
BEGIN
    INSERT INTO dbo.chq_portfolios (code, name, portfolio_type)
    VALUES (N'TAHSILAT', N'Tahsilat Portföyü', N'RECEIVED'),
           (N'ODEME', N'Ödeme Portföyü', N'ISSUED');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.chq_instruments WHERE instrument_no = N'CHK-2026-0001')
BEGIN
    DECLARE @Cur BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    DECLARE @PortRecv BIGINT = (SELECT id FROM dbo.chq_portfolios WHERE code = N'TAHSILAT');
    DECLARE @PortIss BIGINT = (SELECT id FROM dbo.chq_portfolios WHERE code = N'ODEME');
    DECLARE @Cari1 BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0), (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id));
    DECLARE @Cari2 BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00003' AND is_deleted = 0), @Cari1);

    INSERT INTO dbo.chq_instruments (instrument_type, direction, portfolio_id, account_id, bank_name, instrument_no, issue_date, due_date, amount, currency_id, status)
    VALUES
        (N'CEK', N'RECEIVED', @PortRecv, @Cari1, N'Ziraat Bankası', N'CHK-2026-0001', '2026-05-15', '2026-06-15', 12500.00, @Cur, N'PORTFOLIO'),
        (N'CEK', N'RECEIVED', @PortRecv, @Cari2, N'İş Bankası', N'CHK-2026-0002', '2026-05-20', '2026-06-20', 4800.00, @Cur, N'PENDING'),
        (N'SENET', N'ISSUED', @PortIss, @Cari1, NULL, N'SNT-2026-0001', '2026-05-10', '2026-07-10', 9200.00, @Cur, N'PORTFOLIO');
END
GO

PRINT N'08-faz3-chq.sql tamamlandı.';
GO
