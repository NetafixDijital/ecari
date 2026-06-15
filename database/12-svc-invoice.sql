/*
================================================================================
  E-CARI — Servis fatura bağlantısı
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF COL_LENGTH(N'dbo.svc_tickets', N'invoice_id') IS NULL
    ALTER TABLE dbo.svc_tickets ADD invoice_id BIGINT NULL;
GO

IF OBJECT_ID(N'dbo.FK_svc_tickets_invoice', N'F') IS NULL
    ALTER TABLE dbo.svc_tickets
        ADD CONSTRAINT FK_svc_tickets_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.inv_invoices (id);
GO

PRINT N'12-svc-invoice.sql tamamlandı.';
GO
