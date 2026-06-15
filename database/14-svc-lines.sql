/*
================================================================================
  E-CARI — Servis kalemleri (malzeme / hizmet) + satış hizmet tanımları
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ── svc_service_definitions ─────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.svc_service_definitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.svc_service_definitions (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(30)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        default_tax_rate_id BIGINT          NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        sort_order          INT             NOT NULL DEFAULT 0,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_svc_service_definitions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_svc_service_definitions_code UNIQUE (code),
        CONSTRAINT FK_svc_service_definitions_tax FOREIGN KEY (default_tax_rate_id) REFERENCES dbo.core_tax_rates (id)
    );
END
GO

/* ── svc_ticket_lines ────────────────────────────────────────────────────── */
IF OBJECT_ID(N'dbo.svc_ticket_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.svc_ticket_lines (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        ticket_id               BIGINT          NOT NULL,
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
        CONSTRAINT PK_svc_ticket_lines PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_svc_ticket_lines_ticket FOREIGN KEY (ticket_id) REFERENCES dbo.svc_tickets (id),
        CONSTRAINT FK_svc_ticket_lines_service FOREIGN KEY (service_definition_id) REFERENCES dbo.svc_service_definitions (id),
        CONSTRAINT FK_svc_ticket_lines_item FOREIGN KEY (item_id) REFERENCES dbo.stk_items (id),
        CONSTRAINT FK_svc_ticket_lines_unit FOREIGN KEY (unit_id) REFERENCES dbo.stk_units (id),
        CONSTRAINT FK_svc_ticket_lines_tax FOREIGN KEY (tax_rate_id) REFERENCES dbo.core_tax_rates (id)
    );
    CREATE INDEX IX_svc_ticket_lines_ticket ON dbo.svc_ticket_lines (ticket_id, line_no);
END
GO

/* ── Satış hizmet tanımı seed ────────────────────────────────────────────── */
DECLARE @Tax20 BIGINT = (SELECT TOP 1 id FROM dbo.core_tax_rates WHERE rate = 20 ORDER BY id);

IF NOT EXISTS (SELECT 1 FROM dbo.svc_service_definitions WHERE code = N'ISCILIK')
BEGIN
    INSERT INTO dbo.svc_service_definitions (code, name, default_tax_rate_id, sort_order) VALUES
        (N'ISCILIK',    N'İşçilik',           @Tax20, 10),
        (N'TESHIS',     N'Teşhis',            @Tax20, 20),
        (N'BAKIM',      N'Bakım',             @Tax20, 30),
        (N'MONTAJ',     N'Montaj',            @Tax20, 40),
        (N'YEDEK_PARCA',N'Yedek Parça',       @Tax20, 50),
        (N'NAKLIYE',    N'Nakliye',           @Tax20, 60),
        (N'DIGER',      N'Diğer Hizmet',      @Tax20, 999);
END
GO

PRINT N'14-svc-lines.sql tamamlandı.';
GO
