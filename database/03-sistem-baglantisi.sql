/*
================================================================================
  E-CARI — 03: SİSTEM BAĞLANTISINI TAMAMLA
  01 scripti atlandıysa veya hata aldıysanız:
    1) Önce 01-ecari_system.sql çalıştırın
    2) Sonra bu dosyayı F5 ile çalıştırın
================================================================================
*/
SET NOCOUNT ON;

IF DB_ID(N'ecari_system') IS NULL
BEGIN
    RAISERROR(N'HATA: ecari_system veritabanı yok. Önce 01-ecari_system.sql çalıştırın.', 16, 1);
    RETURN;
END

IF DB_ID(N'ecari_sirket_demo') IS NULL
BEGIN
    RAISERROR(N'HATA: ecari_sirket_demo veritabanı yok. Önce 02-ecari_sirket_demo.sql çalıştırın.', 16, 1);
    RETURN;
END

USE ecari_sirket_demo;
GO

DECLARE @BranchId BIGINT = (SELECT id FROM dbo.org_branches WHERE code = N'MERKEZ');
DECLARE @SysUserId BIGINT = (SELECT id FROM ecari_system.dbo.sys_users WHERE email = N'admin@ecari.demo');

IF @SysUserId IS NULL
BEGIN
    PRINT N'UYARI: ecari_system içinde admin@ecari.demo kullanıcısı yok. 01 scriptini tekrar çalıştırın.';
    RETURN;
END

-- org_users yoksa ekle, varsa system_user_id düzelt
IF NOT EXISTS (SELECT 1 FROM dbo.org_users WHERE email = N'admin@ecari.demo')
BEGIN
    INSERT INTO dbo.org_users (system_user_id, full_name, email, phone, default_branch_id, is_active, joined_at)
    VALUES (@SysUserId, N'Demo Yönetici', N'admin@ecari.demo', N'+905551234567', @BranchId, 1, SYSUTCDATETIME());
    PRINT N'org_users kaydı eklendi.';
END
ELSE
BEGIN
    UPDATE dbo.org_users
    SET system_user_id = @SysUserId
    WHERE email = N'admin@ecari.demo' AND system_user_id <> @SysUserId;
    PRINT N'org_users system_user_id güncellendi.';
END

-- sys_user_companies bağlantısı
UPDATE uc
SET org_user_id = ou.id
FROM ecari_system.dbo.sys_user_companies uc
INNER JOIN ecari_system.dbo.sys_users su ON su.id = uc.user_id
INNER JOIN ecari_system.dbo.sys_companies sc ON sc.id = uc.company_id
INNER JOIN dbo.org_users ou ON ou.email = N'admin@ecari.demo'
WHERE su.email = N'admin@ecari.demo'
  AND sc.code = N'demo';

PRINT N'';
PRINT N'Sistem ↔ demo şirket bağlantısı tamamlandı.';
PRINT N'Kontrol:';
PRINT N'  SELECT * FROM ecari_system.dbo.sys_users;';
PRINT N'  SELECT * FROM ecari_system.dbo.sys_user_companies;';
PRINT N'  SELECT * FROM ecari_sirket_demo.dbo.org_users;';
GO
