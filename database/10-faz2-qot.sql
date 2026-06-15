/*
================================================================================
  E-CARI — FAZ 2: Teklif (qot_) — ecari_sirket_demo
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.qot_quotations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.qot_quotations (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        document_no         NVARCHAR(50)    NOT NULL,
        document_date       DATE            NOT NULL,
        valid_until         DATE            NULL,
        document_type       NVARCHAR(20)    NOT NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT N'DRAFT',
        account_id          BIGINT          NOT NULL,
        branch_id           BIGINT          NULL,
        warehouse_id        BIGINT          NULL,
        currency_id         BIGINT          NOT NULL,
        exchange_rate       DECIMAL(18,6)   NOT NULL DEFAULT 1,
        subtotal            DECIMAL(18,2)   NOT NULL DEFAULT 0,
        discount_total      DECIMAL(18,2)   NOT NULL DEFAULT 0,
        tax_total           DECIMAL(18,2)   NOT NULL DEFAULT 0,
        grand_total         DECIMAL(18,2)   NOT NULL DEFAULT 0,
        revision_no         INT             NOT NULL DEFAULT 1,
        parent_quotation_id BIGINT          NULL,
        probability         DECIMAL(5,2)    NULL,
        converted_order_id  BIGINT          NULL,
        converted_at        DATETIME2(3)    NULL,
        notes               NVARCHAR(MAX)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_qot_quotations PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_qot_quotations_document_no UNIQUE (document_no),
        CONSTRAINT FK_qot_quotations_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_qot_quotations_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id),
        CONSTRAINT FK_qot_quotations_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id),
        CONSTRAINT FK_qot_quotations_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id),
        CONSTRAINT FK_qot_quotations_parent FOREIGN KEY (parent_quotation_id) REFERENCES dbo.qot_quotations (id),
        CONSTRAINT FK_qot_quotations_order FOREIGN KEY (converted_order_id) REFERENCES dbo.ord_orders (id)
    );
    CREATE INDEX IX_qot_quotations_type_date ON dbo.qot_quotations (document_type, document_date DESC);
END
GO

IF OBJECT_ID(N'dbo.qot_quotation_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.qot_quotation_lines (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        quotation_id        BIGINT          NOT NULL,
        line_no             INT             NOT NULL,
        item_id             BIGINT          NULL,
        description         NVARCHAR(500)   NOT NULL,
        quantity            DECIMAL(18,4)   NOT NULL DEFAULT 1,
        unit_id             BIGINT          NOT NULL,
        unit_price          DECIMAL(18,4)   NOT NULL DEFAULT 0,
        discount_rate       DECIMAL(5,2)    NOT NULL DEFAULT 0,
        tax_rate_id         BIGINT          NOT NULL,
        tax_amount          DECIMAL(18,2)   NOT NULL DEFAULT 0,
        line_total          DECIMAL(18,2)   NOT NULL DEFAULT 0,
        warehouse_id        BIGINT          NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_qot_quotation_lines PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_qot_quotation_lines_quotation FOREIGN KEY (quotation_id) REFERENCES dbo.qot_quotations (id),
        CONSTRAINT FK_qot_quotation_lines_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_qot_quotation_lines_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_qot_quotation_lines_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id),
        CONSTRAINT FK_qot_quotation_lines_wh FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id)
    );
    CREATE INDEX IX_qot_quotation_lines_quotation ON dbo.qot_quotation_lines (quotation_id, line_no);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.qot_quotations WHERE document_no = N'TS-2026-0001')
BEGIN
    DECLARE @Cur BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    DECLARE @Br BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
    DECLARE @Wh BIGINT = (SELECT TOP 1 id FROM dbo.stk_warehouses WHERE is_deleted = 0 ORDER BY is_default DESC, id);
    DECLARE @Tax BIGINT = (SELECT TOP 1 id FROM dbo.core_tax_rates WHERE rate = 20 ORDER BY id);
    DECLARE @Unit BIGINT = (SELECT TOP 1 id FROM dbo.stk_units ORDER BY id);
    DECLARE @Item BIGINT = (SELECT TOP 1 id FROM dbo.stk_items WHERE is_deleted = 0 ORDER BY id);
    DECLARE @Abc BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0), (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id));
    DECLARE @Qot1 BIGINT;

    INSERT INTO dbo.qot_quotations (document_no, document_date, valid_until, document_type, status, account_id, branch_id, warehouse_id, currency_id, subtotal, tax_total, grand_total, notes)
    VALUES (N'TS-2026-0001', '2026-06-01', '2026-06-30', N'SALES', N'SENT', @Abc, @Br, @Wh, @Cur, 2500.00, 500.00, 3000.00, N'Demo satış teklifi');
    SET @Qot1 = SCOPE_IDENTITY();

    INSERT INTO dbo.qot_quotations (document_no, document_date, valid_until, document_type, status, account_id, branch_id, warehouse_id, currency_id, subtotal, tax_total, grand_total)
    VALUES (N'TA-2026-0001', '2026-06-02', '2026-07-02', N'PURCHASE', N'DRAFT', @Abc, @Br, @Wh, @Cur, 800.00, 160.00, 960.00);

    IF @Tax IS NOT NULL AND @Unit IS NOT NULL AND @Item IS NOT NULL
    BEGIN
        INSERT INTO dbo.qot_quotation_lines (quotation_id, line_no, item_id, description, quantity, unit_id, unit_price, tax_rate_id, tax_amount, line_total, warehouse_id)
        VALUES (@Qot1, 1, @Item, N'Demo teklif kalemi', 5, @Unit, 500, @Tax, 500.00, 3000.00, @Wh);
    END
END
GO

PRINT N'10-faz2-qot.sql tamamlandı.';
GO
