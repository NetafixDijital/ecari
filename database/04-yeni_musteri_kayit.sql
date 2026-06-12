/*
================================================================================
  E-CARI — 04: YENİ MÜŞTERİ SİSTEM KAYDI
  Önce ecari_system kurulu olmalı (01 scripti).
  Sonra 02 scriptinin kopyasını şirket koduna göre çalıştırın.
  Detay: YENI-MUSTERI-KURULUM.md
================================================================================
*/

/* ===== BURAYI DOLDURUN ===== */
DECLARE @SirketKodu       NVARCHAR(30)  = N'acme';              -- küçük harf, benzersiz
DECLARE @SirketAdi        NVARCHAR(200) = N'Acme Ticaret A.Ş.';
DECLARE @PlanKodu         NVARCHAR(30)  = N'BASIC';             -- BASIC | PRO
DECLARE @AbonelikDurumu   NVARCHAR(20)  = N'TRIAL';            -- TRIAL | ACTIVE
DECLARE @DenemeGun        INT           = 30;
/* =========================== */

DECLARE @DbAdi NVARCHAR(128) = N'ecari_sirket_' + @SirketKodu;
DECLARE @PlanId BIGINT;

SET NOCOUNT ON;

IF DB_ID(N'ecari_system') IS NULL
BEGIN
    RAISERROR(N'HATA: ecari_system yok. Once 01-ecari_system.sql calistirin.', 16, 1);
    RETURN;
END

SELECT @PlanId = id FROM ecari_system.dbo.sys_subscription_plans WHERE code = @PlanKodu;
IF @PlanId IS NULL
BEGIN
    RAISERROR(N'HATA: Abonelik plani bulunamadi. Plan kodu: %s', 16, 1, @PlanKodu);
    RETURN;
END

-- Sirket kaydi
IF NOT EXISTS (SELECT 1 FROM ecari_system.dbo.sys_companies WHERE code = @SirketKodu)
BEGIN
    INSERT INTO ecari_system.dbo.sys_companies
        (code, name, database_name, subscription_plan_id, subscription_status, trial_ends_at, is_active)
    VALUES
        (@SirketKodu, @SirketAdi, @DbAdi, @PlanId, @AbonelikDurumu,
         CASE WHEN @AbonelikDurumu = N'TRIAL' THEN DATEADD(DAY, @DenemeGun, SYSUTCDATETIME()) ELSE NULL END,
         1);
    PRINT N'Sirket kaydi eklendi: ' + @SirketKodu;
END
ELSE
    PRINT N'Sirket zaten kayitli: ' + @SirketKodu;

-- Modul lisanslari (Faz 1)
INSERT INTO ecari_system.dbo.sys_company_modules (company_id, module_id)
SELECT c.id, m.id
FROM ecari_system.dbo.sys_companies c
CROSS JOIN ecari_system.dbo.sys_modules m
WHERE c.code = @SirketKodu
  AND m.code IN (N'CARI', N'STK', N'CFG')
  AND NOT EXISTS (
      SELECT 1 FROM ecari_system.dbo.sys_company_modules cm
      WHERE cm.company_id = c.id AND cm.module_id = m.id
  );

-- Bos veritabani olustur (tablolar icin 02 kopyasini calistirin)
IF DB_ID(@DbAdi) IS NULL
BEGIN
    DECLARE @Sql NVARCHAR(500) = N'CREATE DATABASE [' + @DbAdi + N'];';
    EXEC sp_executesql @Sql;
    PRINT N'Veritabani olusturuldu: ' + @DbAdi;
    PRINT N'';
    PRINT N'SONRAKI ADIM:';
    PRINT N'  1) 02-ecari_sirket_demo.sql dosyasini kopyalayin';
    PRINT N'  2) ecari_sirket_demo -> ' + @DbAdi + N' degistirin';
    PRINT N'  3) Kopyayi SSMS''te F5 ile calistirin';
    PRINT N'  4) Ilk kullaniciyi YENI-MUSTERI-KURULUM.md Bolum 3.3''e gore ekleyin';
END
ELSE
    PRINT N'Veritabani zaten var: ' + @DbAdi;

GO
