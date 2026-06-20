/*
================================================================================
  E-CARI — E-Belge (EDM e-Fatura / e-İrsaliye) tabloları
  ecari_sirket_demo veritabanında çalıştırın.
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.ebl_integrators', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ebl_integrators (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(30)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        api_base_url        NVARCHAR(500)   NOT NULL,
        api_ewaybill_url    NVARCHAR(500)   NULL,
        is_active           BIT             NOT NULL DEFAULT 1,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ebl_integrators PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_ebl_integrators_code UNIQUE (code)
    );
END
GO

IF OBJECT_ID(N'dbo.ebl_integrator_credentials', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ebl_integrator_credentials (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        integrator_id           BIGINT          NOT NULL,
        username                NVARCHAR(200)   NOT NULL,
        password_encrypted      VARBINARY(MAX)  NOT NULL,
        api_key_encrypted       VARBINARY(MAX)  NULL,
        environment             NVARCHAR(20)    NOT NULL DEFAULT N'TEST',
        branch_id               BIGINT          NULL,
        invoice_serial_prefix   NVARCHAR(20)    NULL,
        is_active               BIT             NOT NULL DEFAULT 1,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at              DATETIME2(3)    NULL,
        CONSTRAINT PK_ebl_integrator_credentials PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_ebl_credentials_integrator FOREIGN KEY (integrator_id)
            REFERENCES dbo.ebl_integrators (id),
        CONSTRAINT FK_ebl_credentials_branch FOREIGN KEY (branch_id)
            REFERENCES dbo.org_branches (id)
    );
    CREATE INDEX IX_ebl_credentials_active ON dbo.ebl_integrator_credentials (integrator_id, environment)
        WHERE is_active = 1;
END
GO

IF OBJECT_ID(N'dbo.ebl_einvoice_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ebl_einvoice_records (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        invoice_id          BIGINT          NOT NULL,
        integrator_id       BIGINT          NOT NULL,
        uuid                NVARCHAR(50)    NOT NULL,
        envelope_uuid       NVARCHAR(50)    NULL,
        ettn                NVARCHAR(50)    NULL,
        scenario            NVARCHAR(30)    NULL,
        profile_id          NVARCHAR(30)    NULL,
        status              NVARCHAR(30)    NOT NULL DEFAULT N'DRAFT',
        status_message      NVARCHAR(500)   NULL,
        sent_at             DATETIME2(3)    NULL,
        response_at         DATETIME2(3)    NULL,
        ubl_xml_path        NVARCHAR(500)   NULL,
        pdf_path            NVARCHAR(500)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2(3)    NULL,
        CONSTRAINT PK_ebl_einvoice_records PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_ebl_einvoice_records_uuid UNIQUE (uuid),
        CONSTRAINT FK_ebl_einvoice_invoice FOREIGN KEY (invoice_id)
            REFERENCES dbo.inv_invoices (id),
        CONSTRAINT FK_ebl_einvoice_integrator FOREIGN KEY (integrator_id)
            REFERENCES dbo.ebl_integrators (id)
    );
    CREATE INDEX IX_ebl_einvoice_invoice ON dbo.ebl_einvoice_records (invoice_id);
END
GO

IF OBJECT_ID(N'dbo.ebl_ewaybill_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ebl_ewaybill_records (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        delivery_note_id    BIGINT          NOT NULL,
        integrator_id       BIGINT          NOT NULL,
        uuid                NVARCHAR(50)    NOT NULL,
        status              NVARCHAR(30)    NOT NULL DEFAULT N'DRAFT',
        status_message      NVARCHAR(500)   NULL,
        sent_at             DATETIME2(3)    NULL,
        response_at         DATETIME2(3)    NULL,
        ubl_xml_path        NVARCHAR(500)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2(3)    NULL,
        CONSTRAINT PK_ebl_ewaybill_records PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_ebl_ewaybill_records_uuid UNIQUE (uuid),
        CONSTRAINT FK_ebl_ewaybill_note FOREIGN KEY (delivery_note_id)
            REFERENCES dbo.dln_delivery_notes (id),
        CONSTRAINT FK_ebl_ewaybill_integrator FOREIGN KEY (integrator_id)
            REFERENCES dbo.ebl_integrators (id)
    );
    CREATE INDEX IX_ebl_ewaybill_note ON dbo.ebl_ewaybill_records (delivery_note_id);
END
GO

IF OBJECT_ID(N'dbo.ebl_incoming_documents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ebl_incoming_documents (
        id                      BIGINT          IDENTITY(1,1) NOT NULL,
        document_type           NVARCHAR(30)    NOT NULL,
        uuid                    NVARCHAR(50)    NOT NULL,
        sender_vkn              NVARCHAR(11)    NOT NULL,
        sender_title            NVARCHAR(300)   NOT NULL,
        document_date           DATE            NOT NULL,
        amount                  DECIMAL(18,2)   NULL,
        status                  NVARCHAR(30)    NOT NULL DEFAULT N'NEW',
        matched_invoice_id      BIGINT          NULL,
        raw_xml_path            NVARCHAR(500)   NULL,
        created_at              DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at              DATETIME2(3)    NULL,
        CONSTRAINT PK_ebl_incoming_documents PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_ebl_incoming_uuid UNIQUE (uuid),
        CONSTRAINT FK_ebl_incoming_invoice FOREIGN KEY (matched_invoice_id)
            REFERENCES dbo.inv_invoices (id)
    );
END
GO

IF OBJECT_ID(N'dbo.ebl_status_history', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ebl_status_history (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        record_module       NVARCHAR(30)    NOT NULL,
        record_id           BIGINT          NOT NULL,
        old_status          NVARCHAR(30)    NULL,
        new_status          NVARCHAR(30)    NOT NULL,
        changed_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        response_payload    NVARCHAR(MAX)   NULL,
        CONSTRAINT PK_ebl_status_history PRIMARY KEY CLUSTERED (id)
    );
    CREATE INDEX IX_ebl_status_history_record ON dbo.ebl_status_history (record_module, record_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ebl_integrators WHERE code = N'EDM')
BEGIN
    INSERT INTO dbo.ebl_integrators (code, name, api_base_url, api_ewaybill_url, is_active)
    VALUES (
        N'EDM',
        N'EDM Bilişim',
        N'https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc',
        N'https://test.edmbilisim.com.tr/EIrsaliyeEDM21ea/EIrsaliyeEDM.svc',
        1
    );
END
GO

PRINT N'16-ebl-edm.sql tamamlandı.';
GO
