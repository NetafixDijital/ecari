/*
================================================================================
  E-CARI — Cari kartı ek alanları (ülke, posta kodu) — ecari_sirket_demo
  Not: payment_term_id ve due_days zaten cari_accounts tablosunda mevcut.
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ecari_sirket_demo;
GO

IF COL_LENGTH(N'dbo.cari_accounts', N'country_code') IS NULL
    ALTER TABLE dbo.cari_accounts ADD country_code CHAR(2) NOT NULL CONSTRAINT DF_cari_accounts_country DEFAULT 'TR';
GO

IF COL_LENGTH(N'dbo.cari_accounts', N'postal_code') IS NULL
    ALTER TABLE dbo.cari_accounts ADD postal_code NVARCHAR(10) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.core_payment_terms WHERE code = N'NET7')
    INSERT INTO dbo.core_payment_terms (code, name, due_days) VALUES (N'NET7', N'Net 7 Gün', 7);
IF NOT EXISTS (SELECT 1 FROM dbo.core_payment_terms WHERE code = N'NET15')
    INSERT INTO dbo.core_payment_terms (code, name, due_days) VALUES (N'NET15', N'Net 15 Gün', 15);
IF NOT EXISTS (SELECT 1 FROM dbo.core_payment_terms WHERE code = N'NET45')
    INSERT INTO dbo.core_payment_terms (code, name, due_days) VALUES (N'NET45', N'Net 45 Gün', 45);
GO

PRINT N'09-cari-kart-alanlari.sql tamamlandı.';
GO
