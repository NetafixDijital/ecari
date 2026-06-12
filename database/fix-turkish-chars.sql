/* Türkçe karakter düzeltmesi — UTF-8 dosya olarak çalıştırın */
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

USE ecari_system;
GO
UPDATE dbo.sys_users SET full_name = N'Demo Yönetici' WHERE email = N'admin@ecari.demo';
UPDATE dbo.sys_companies SET name = N'Demo Şirket A.Ş.' WHERE code = N'demo';
GO

USE ecari_sirket_demo;
GO
UPDATE dbo.org_users SET full_name = N'Demo Yönetici' WHERE email = N'admin@ecari.demo';
UPDATE dbo.cfg_company_profile SET legal_name = N'Demo Şirket A.Ş.', trade_name = N'Demo Şirket';
UPDATE dbo.core_cities SET name = N'İstanbul' WHERE plate_code = N'34';
UPDATE dbo.core_cities SET name = N'Ankara' WHERE plate_code = N'06';
UPDATE dbo.core_districts SET name = N'Kadıköy' WHERE name LIKE N'Kad%';
UPDATE dbo.core_districts SET name = N'Beşiktaş' WHERE name LIKE N'Be%';
UPDATE dbo.core_districts SET name = N'Çankaya' WHERE name LIKE N'%ankaya%';
UPDATE dbo.org_branches SET name = N'Merkez Şube', address = N'Örnek Mah. Demo Cad. No:1' WHERE code = N'MERKEZ';
UPDATE dbo.cari_accounts SET title = N'Perakende Müşteri', tax_office = N'Kadıköy' WHERE code = N'M00001';
GO

PRINT N'Türkçe karakterler güncellendi.';
