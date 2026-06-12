/*
================================================================================
  E-CARI — FAZ 2: Sipariş (ord_) — ecari_sirket_demo
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.ord_orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ord_orders (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        document_no         NVARCHAR(50)    NOT NULL,
        document_date       DATE            NOT NULL,
        order_type          NVARCHAR(20)    NOT NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT N'APPROVED',
        account_id          BIGINT          NOT NULL,
        branch_id           BIGINT          NULL,
        warehouse_id        BIGINT          NULL,
        currency_id         BIGINT          NOT NULL,
        exchange_rate       DECIMAL(18,6)   NOT NULL DEFAULT 1,
        delivery_date       DATE            NULL,
        subtotal            DECIMAL(18,2)   NOT NULL DEFAULT 0,
        discount_total      DECIMAL(18,2)   NOT NULL DEFAULT 0,
        tax_total           DECIMAL(18,2)   NOT NULL DEFAULT 0,
        grand_total         DECIMAL(18,2)   NOT NULL DEFAULT 0,
        customer_po_no      NVARCHAR(50)    NULL,
        notes               NVARCHAR(MAX)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_ord_orders PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_ord_orders_document_no UNIQUE (document_no),
        CONSTRAINT FK_ord_orders_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_ord_orders_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id),
        CONSTRAINT FK_ord_orders_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id),
        CONSTRAINT FK_ord_orders_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
    CREATE INDEX IX_ord_orders_type_date ON dbo.ord_orders (order_type, document_date DESC);
END
GO

IF OBJECT_ID(N'dbo.ord_order_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ord_order_lines (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        order_id            BIGINT          NOT NULL,
        line_no             INT             NOT NULL,
        item_id             BIGINT          NULL,
        description         NVARCHAR(500)   NOT NULL,
        quantity            DECIMAL(18,4)   NOT NULL DEFAULT 1,
        delivered_quantity  DECIMAL(18,4)   NOT NULL DEFAULT 0,
        invoiced_quantity   DECIMAL(18,4)   NOT NULL DEFAULT 0,
        unit_id             BIGINT          NOT NULL,
        unit_price          DECIMAL(18,4)   NOT NULL DEFAULT 0,
        discount_rate       DECIMAL(5,2)    NOT NULL DEFAULT 0,
        tax_rate_id         BIGINT          NOT NULL,
        tax_amount          DECIMAL(18,2)   NOT NULL DEFAULT 0,
        line_total          DECIMAL(18,2)   NOT NULL DEFAULT 0,
        warehouse_id        BIGINT          NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_ord_order_lines PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_ord_order_lines_order FOREIGN KEY (order_id) REFERENCES dbo.ord_orders (id),
        CONSTRAINT FK_ord_order_lines_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_ord_order_lines_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_ord_order_lines_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id),
        CONSTRAINT FK_ord_order_lines_wh FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id)
    );
    CREATE INDEX IX_ord_order_lines_order ON dbo.ord_order_lines (order_id, line_no);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ord_orders WHERE document_no = N'SS-2026-0101')
BEGIN
    DECLARE @Cur BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    DECLARE @Br BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
    DECLARE @Wh BIGINT = (SELECT TOP 1 id FROM dbo.stk_warehouses WHERE is_deleted = 0 ORDER BY is_default DESC, id);
    DECLARE @Tax BIGINT = (SELECT TOP 1 id FROM dbo.core_tax_rates WHERE rate = 20 ORDER BY id);
    DECLARE @Unit BIGINT = (SELECT TOP 1 id FROM dbo.stk_units ORDER BY id);
    DECLARE @Item BIGINT = (SELECT TOP 1 id FROM dbo.stk_items WHERE is_deleted = 0 ORDER BY id);
    DECLARE @Abc BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0), (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id));
    DECLARE @Ted BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'T00001' AND is_deleted = 0), @Abc);
    DECLARE @Ord1 BIGINT;

    INSERT INTO dbo.ord_orders (document_no, document_date, order_type, status, account_id, branch_id, warehouse_id, currency_id, delivery_date, subtotal, tax_total, grand_total)
    VALUES (N'SS-2026-0101', '2026-05-29', N'SALES', N'APPROVED', @Abc, @Br, @Wh, @Cur, '2026-06-15', 1000.00, 200.00, 1200.00);
    SET @Ord1 = SCOPE_IDENTITY();

    INSERT INTO dbo.ord_orders (document_no, document_date, order_type, status, account_id, branch_id, warehouse_id, currency_id, delivery_date, subtotal, tax_total, grand_total)
    VALUES (N'AS-2026-0021', '2026-05-28', N'PURCHASE', N'PARTIAL', @Ted, @Br, @Wh, @Cur, '2026-06-10', 5000.00, 1000.00, 6000.00);

    IF @Tax IS NOT NULL AND @Unit IS NOT NULL AND @Item IS NOT NULL
    BEGIN
        INSERT INTO dbo.ord_order_lines (order_id, line_no, item_id, description, quantity, unit_id, unit_price, tax_rate_id, tax_amount, line_total, warehouse_id)
        VALUES (@Ord1, 1, @Item, N'Demo sipariş kalemi', 2, @Unit, 500, @Tax, 200.00, 1200.00, @Wh);
    END
END
GO

PRINT N'05-faz2-ord.sql tamamlandı.';
GO
