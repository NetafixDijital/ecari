/*
================================================================================
  E-CARI — FAZ 2: İrsaliye (dln_) — ecari_sirket_demo
================================================================================
  SSMS: USE ecari_sirket_demo; sonra F5
  sqlcmd: sqlcmd -S ... -U sa -P ... -d ecari_sirket_demo -i 04-faz2-dln.sql -f 65001
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ── dln_delivery_notes ───────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.dln_delivery_notes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.dln_delivery_notes (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        document_no         NVARCHAR(50)    NOT NULL,
        document_date       DATE            NOT NULL,
        shipment_date       DATETIME2(3)    NULL,
        document_type       NVARCHAR(20)    NOT NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT N'PREPARING',
        account_id          BIGINT          NOT NULL,
        branch_id           BIGINT          NULL,
        warehouse_id        BIGINT          NULL,
        shipping_address    NVARCHAR(500)   NULL,
        driver_name         NVARCHAR(100)   NULL,
        vehicle_plate       NVARCHAR(20)    NULL,
        transport_type      NVARCHAR(30)    NULL,
        carrier_name        NVARCHAR(200)   NULL,
        notes               NVARCHAR(MAX)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by          BIGINT          NULL,
        updated_at          DATETIME2(3)    NULL,
        updated_by          BIGINT          NULL,
        is_deleted          BIT             NOT NULL DEFAULT 0,
        deleted_at          DATETIME2(3)    NULL,
        deleted_by          BIGINT          NULL,
        row_version         ROWVERSION      NOT NULL,
        CONSTRAINT PK_dln_delivery_notes PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_dln_delivery_notes_document_no UNIQUE (document_no),
        CONSTRAINT FK_dln_delivery_notes_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id),
        CONSTRAINT FK_dln_delivery_notes_branch FOREIGN KEY (branch_id) REFERENCES dbo.org_branches (id),
        CONSTRAINT FK_dln_delivery_notes_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id)
    );
    CREATE INDEX IX_dln_delivery_notes_type_date ON dbo.dln_delivery_notes (document_type, document_date DESC);
END
GO

/* ── dln_delivery_note_lines ──────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.dln_delivery_note_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.dln_delivery_note_lines (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        delivery_note_id    BIGINT          NOT NULL,
        line_no             INT             NOT NULL,
        item_id             BIGINT          NULL,
        description         NVARCHAR(500)   NOT NULL,
        quantity            DECIMAL(18,4)   NOT NULL DEFAULT 1,
        unit_id             BIGINT          NOT NULL,
        warehouse_id        BIGINT          NULL,
        lot_no              NVARCHAR(50)    NULL,
        serial_no           NVARCHAR(50)    NULL,
        source_line_id      BIGINT          NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_dln_delivery_note_lines PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_dln_delivery_note_lines_note FOREIGN KEY (delivery_note_id) REFERENCES dbo.dln_delivery_notes (id),
        CONSTRAINT FK_dln_delivery_note_lines_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_dln_delivery_note_lines_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_dln_delivery_note_lines_wh FOREIGN KEY (warehouse_id) REFERENCES dbo.stk_warehouses (id)
    );
    CREATE INDEX IX_dln_delivery_note_lines_note ON dbo.dln_delivery_note_lines (delivery_note_id, line_no);
END
GO

/* ── Demo irsaliyeler ─────────────────────────────────────────────────────── */
IF NOT EXISTS (SELECT 1 FROM dbo.dln_delivery_notes WHERE document_no = N'SI-2026-0156')
BEGIN
    DECLARE @Br BIGINT = (SELECT TOP 1 id FROM dbo.org_branches WHERE code = N'MERKEZ');
    DECLARE @Wh BIGINT = (SELECT TOP 1 id FROM dbo.stk_warehouses WHERE is_deleted = 0 ORDER BY is_default DESC, id);
    DECLARE @Abc BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0), (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id));
    DECLARE @Xyz BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00003' AND is_deleted = 0), @Abc);
    DECLARE @Meh BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00004' AND is_deleted = 0), @Abc);
    DECLARE @Ted BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'T00001' AND is_deleted = 0), @Abc);
    DECLARE @Unit BIGINT = (SELECT TOP 1 id FROM dbo.stk_units ORDER BY id);
    DECLARE @Item BIGINT = (SELECT TOP 1 id FROM dbo.stk_items WHERE is_deleted = 0 ORDER BY id);

    INSERT INTO dbo.dln_delivery_notes (document_no, document_date, document_type, status, account_id, branch_id, warehouse_id, shipping_address)
    VALUES
        (N'SI-2026-0156', '2026-05-30', N'SALES', N'IN_TRANSIT', @Abc, @Br, @Wh, N'İstanbul / Kadıköy'),
        (N'SI-2026-0154', '2026-05-28', N'SALES', N'DELIVERED', @Xyz, @Br, @Wh, N'Ankara / Çankaya'),
        (N'SI-2026-0151', '2026-05-26', N'SALES', N'PREPARING', @Meh, @Br, @Wh, N'İzmir / Konak'),
        (N'AI-2026-0042', '2026-05-27', N'PURCHASE', N'DELIVERED', @Ted, @Br, @Wh, N'Kartal / Sanayi'),
        (N'AI-2026-0041', '2026-05-25', N'PURCHASE', N'PREPARING', @Ted, @Br, @Wh, N'Kartal / Depo');

    IF @Unit IS NOT NULL AND @Item IS NOT NULL
    BEGIN
        INSERT INTO dbo.dln_delivery_note_lines (delivery_note_id, line_no, item_id, description, quantity, unit_id, warehouse_id)
        SELECT n.id, 1, @Item, N'Demo ürün', 2, @Unit, @Wh
        FROM dbo.dln_delivery_notes n
        WHERE n.document_no IN (N'SI-2026-0156', N'SI-2026-0154');
    END
END
GO

PRINT N'04-faz2-dln.sql tamamlandı.';
GO
