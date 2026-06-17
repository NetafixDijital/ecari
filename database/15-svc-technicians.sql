/*
================================================================================
  E-CARI — Teknisyen tanımları + servis kaydı FK
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.svc_technicians', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.svc_technicians (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(30)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        phone               NVARCHAR(30)    NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        sort_order          INT             NOT NULL DEFAULT 0,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_svc_technicians PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_svc_technicians_code UNIQUE (code)
    );
END
GO

IF COL_LENGTH(N'dbo.svc_tickets', N'technician_id') IS NULL
BEGIN
    ALTER TABLE dbo.svc_tickets ADD technician_id BIGINT NULL;
    ALTER TABLE dbo.svc_tickets ADD CONSTRAINT FK_svc_tickets_technician
        FOREIGN KEY (technician_id) REFERENCES dbo.svc_technicians (id);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.svc_technicians WHERE code = N'T001')
BEGIN
    INSERT INTO dbo.svc_technicians (code, name, phone, sort_order) VALUES
        (N'T001', N'Ali Kaya', N'0532 000 00 01', 10),
        (N'T002', N'Can Öztürk', N'0533 000 00 02', 20);
END
GO

PRINT N'15-svc-technicians.sql tamamlandı.';
GO
