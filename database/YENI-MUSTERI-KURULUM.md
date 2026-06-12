# E-Cari — Yeni Müşteri Veritabanı Kurulum Rehberi

Bu doküman, E-Cari SaaS ortamında **yeni abone müşteri** (veya ilk kurulum) için veritabanının nasıl oluşturulacağını adım adım anlatır.

**Hedef kitle:** Operasyon / teknik ekip (SSMS kullanan)  
**SQL Server:** 2019 veya üzeri  
**Mimari:** Her müşteri = ayrı veritabanı (`database-per-customer`)

---

## 1. Genel mantık (kısa)

```text
┌─────────────────────────────────────────────────────────┐
│  ecari_system          ← TEK KEZ kurulur                 │
│  • Tüm kullanıcılar (sys_users)                          │
│  • Tüm şirket kayıtları (sys_companies)                  │
│  • Hangi şirket hangi DB'de (database_name)              │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ecari_sirket_demo  ecari_sirket_abc  ecari_sirket_xyz
   (müşteri 1)        (müşteri 2)       (müşteri 3)
   • cari, stok       • cari, stok      • cari, stok
   • ayarlar          • ayarlar         • ayarlar
```

| Veritabanı | Ne zaman oluşturulur | Kim kullanır |
|------------|----------------------|--------------|
| `ecari_system` | Sunucuda **bir kez** | Platform (giriş, abonelik) |
| `ecari_sirket_{kod}` | **Her yeni müşteride** | O müşterinin operasyonel verisi |

**Kural:** Şirket kodu küçük harf, Türkçe karakter yok, boşluk yok.  
Örnek kod `acme` → veritabanı adı: `ecari_sirket_acme`

---

## 2. İlk kurulum (sunucu boş — sadece bir kez)

Sunucuda hiç E-Cari veritabanı yoksa:

| Sıra | Dosya | Açıklama |
|------|--------|----------|
| 1 | `01-ecari_system.sql` | Sistem veritabanı + demo kayıtları |
| 2 | `02-ecari_sirket_demo.sql` | İlk demo müşteri veritabanı |
| 3 | `03-sistem-baglantisi.sql` | Demo kullanıcı ↔ demo şirket bağlantısı |

**SSMS:** Her dosyayı aç → **F5** (Execute).  
**Sıra önemli:** 01 → 02 → 03

Detaylı notlar: [README.md](./README.md)

---

## 3. Yeni müşteri ekleme (standart süreç)

Yeni bir abone müşteri geldiğinde aşağıdaki bilgileri toplayın:

| Bilgi | Örnek | Not |
|-------|--------|-----|
| Şirket kodu | `acme` | URL/API'de kullanılır, benzersiz |
| Ticari unvan | Acme Ticaret A.Ş. | |
| Veritabanı adı | `ecari_sirket_acme` | Otomatik: `ecari_sirket_` + kod |
| Abonelik planı | BASIC / PRO | `sys_subscription_plans` |
| İlk admin e-posta | admin@acme.com | Giriş için |
| İlk admin adı | Ahmet Yılmaz | |

### Adım 3.1 — Şirket veritabanını oluştur

**Yöntem A (önerilen):** Demo scriptini kopyalayın

1. `02-ecari_sirket_demo.sql` dosyasını kopyalayın → `02-ecari_sirket_acme.sql` gibi adlandırın
2. Dosyada **tüm** `ecari_sirket_demo` ifadelerini `ecari_sirket_acme` ile değiştirin (Ctrl+H)
3. İsteğe bağlı: dosya sonundaki **örnek cari** (M00001) bloğunu silin veya müşteriye özel düzenleyin
4. SSMS'te yeni dosyayı **F5** ile çalıştırın

**Yöntem B:** Hazır kayıt scripti + şema

1. `04-yeni_musteri_kayit.sql` içindeki değişkenleri doldurup çalıştırın (sistem kaydı + boş DB)
2. Ardından şema için kopyalanmış `02-ecari_sirket_{kod}.sql` çalıştırın

### Adım 3.2 — Sistem veritabanına şirket kaydı

`ecari_system` içinde şirket tanımlı olmalı. `04-yeni_musteri_kayit.sql` bunu otomatik yapar.

Elle eklemek isterseniz:

```sql
USE ecari_system;

DECLARE @PlanId BIGINT = (SELECT id FROM sys_subscription_plans WHERE code = N'BASIC');

INSERT INTO sys_companies (code, name, database_name, subscription_plan_id, subscription_status, trial_ends_at, is_active)
VALUES (
    N'acme',                          -- şirket kodu
    N'Acme Ticaret A.Ş.',             -- görünen ad
    N'ecari_sirket_acme',             -- veritabanı adı
    @PlanId,
    N'ACTIVE',                        -- TRIAL | ACTIVE | SUSPENDED | CANCELLED
    DATEADD(DAY, 30, SYSUTCDATETIME()),
    1
);

-- Modül lisansları (Faz 1: cari, stok, ayarlar)
INSERT INTO sys_company_modules (company_id, module_id)
SELECT c.id, m.id
FROM sys_companies c
CROSS JOIN sys_modules m
WHERE c.code = N'acme'
  AND m.code IN (N'CARI', N'STK', N'CFG');
```

### Adım 3.3 — İlk kullanıcıyı oluştur ve bağla

Yeni müşterinin ilk yöneticisi için:

```sql
USE ecari_system;

-- 1) Global kullanıcı (şifre hash API tarafından üretilir; geçici demo hash örneği)
INSERT INTO sys_users (email, password_hash, full_name, is_active, email_verified_at)
VALUES (
    N'admin@acme.com',
    N'$2a$11$...',  -- BCrypt hash — uygulama/API ile üretin
    N'Ahmet Yılmaz',
    1,
    SYSUTCDATETIME()
);

-- 2) Şirket DB'de org_users kaydı
USE ecari_sirket_acme;

DECLARE @SysUserId BIGINT = (SELECT id FROM ecari_system.dbo.sys_users WHERE email = N'admin@acme.com');
DECLARE @BranchId BIGINT = (SELECT id FROM org_branches WHERE code = N'MERKEZ');

INSERT INTO org_users (system_user_id, full_name, email, default_branch_id, is_active, joined_at)
VALUES (@SysUserId, N'Ahmet Yılmaz', N'admin@acme.com', @BranchId, 1, SYSUTCDATETIME());

-- 3) Sistem ↔ şirket bağlantısı
USE ecari_system;

INSERT INTO sys_user_companies (user_id, company_id, org_user_id, is_default_company, status)
SELECT su.id, sc.id, ou.id, 1, N'ACTIVE'
FROM sys_users su
CROSS JOIN sys_companies sc
CROSS JOIN ecari_sirket_acme.dbo.org_users ou
WHERE su.email = N'admin@acme.com'
  AND sc.code = N'acme'
  AND ou.email = N'admin@acme.com';
```

> **Pratik:** `03-sistem-baglantisi.sql` dosyasını kopyalayıp e-posta ve şirket kodunu değiştirerek de kullanabilirsiniz.

---

## 4. Mevcut kullanıcıyı ikinci şirkete ekleme

Bir kişi birden fazla şirkette çalışabilir (ör. muhasebeci):

```sql
USE ecari_system;

-- Yeni şirkette org_users oluştur (ecari_sirket_xyz içinde)
-- Sonra:
INSERT INTO sys_user_companies (user_id, company_id, org_user_id, is_default_company, status)
VALUES (
    (SELECT id FROM sys_users WHERE email = N'kullanici@mail.com'),
    (SELECT id FROM sys_companies WHERE code = N'xyz'),
    @OrgUserId,   -- ecari_sirket_xyz.dbo.org_users.id
    0,            -- varsayılan şirket değilse 0
    N'ACTIVE'
);
```

---

## 5. Kontrol listesi (checklist)

Yeni müşteri kurulumu bittiğinde:

- [ ] `ecari_sirket_{kod}` veritabanı Object Explorer'da görünüyor
- [ ] `cari_accounts`, `stk_items`, `org_users` tabloları var
- [ ] `ecari_system.sys_companies` içinde şirket kaydı var
- [ ] `database_name` doğru (`ecari_sirket_{kod}`)
- [ ] `sys_company_modules` aktif modüller tanımlı
- [ ] `sys_users` + `org_users` + `sys_user_companies` üçlüsü eşleşiyor
- [ ] `cfg_company_profile` müşteri unvan/VKN ile dolu
- [ ] `org_branches` en az bir şube (MERKEZ) var

### Hızlı kontrol sorguları

```sql
-- Tüm E-Cari veritabanları
SELECT name, create_date FROM sys.databases WHERE name LIKE 'ecari%' ORDER BY name;

-- Kayıtlı şirketler
SELECT code, name, database_name, subscription_status
FROM ecari_system.dbo.sys_companies
WHERE is_active = 1;

-- Kullanıcı ↔ şirket eşleşmesi
SELECT su.email, sc.code AS sirket_kodu, sc.database_name, uc.org_user_id, uc.status
FROM ecari_system.dbo.sys_user_companies uc
JOIN ecari_system.dbo.sys_users su ON su.id = uc.user_id
JOIN ecari_system.dbo.sys_companies sc ON sc.id = uc.company_id;

-- Müşteri DB sağlık (örnek: acme)
USE ecari_sirket_acme;
SELECT COUNT(*) AS cari_sayisi FROM cari_accounts WHERE is_deleted = 0;
SELECT COUNT(*) AS stok_sayisi FROM stk_items WHERE is_deleted = 0;
SELECT * FROM cfg_company_profile;
```

---

## 6. İsimlendirme kuralları

| Alan | Kural | İyi | Kötü |
|------|--------|-----|------|
| Şirket kodu | a-z, 0-9, tire | `acme`, `netasoft-01` | `Acme`, `a ş`, `a.b` |
| DB adı | `ecari_sirket_{kod}` | `ecari_sirket_acme` | `AcmeDB`, `ecari_acme` |
| E-posta | Benzersiz (sys_users) | `admin@acme.com` | Aynı e-posta iki kez |

---

## 7. Abonelik durumları

| Durum | Anlam | Ne yapılır |
|-------|--------|------------|
| `TRIAL` | Deneme süresi | `trial_ends_at` doldurulur |
| `ACTIVE` | Aktif abone | Normal kullanım |
| `SUSPENDED` | Askıya alındı | Giriş engeli (uygulama katmanı) |
| `CANCELLED` | İptal | Veri saklanır, erişim kapalı |

Durum güncelleme:

```sql
UPDATE ecari_system.dbo.sys_companies
SET subscription_status = N'SUSPENDED', updated_at = SYSUTCDATETIME()
WHERE code = N'acme';
```

---

## 8. Müşteri veritabanını kaldırma (dikkat)

**Geri alınamaz.** Önce sistem kaydını pasifleştirin, yedek alın.

```sql
USE ecari_system;
UPDATE sys_companies SET is_active = 0, subscription_status = N'CANCELLED' WHERE code = N'acme';

-- Yedek aldıktan sonra (SSMS: Tasks → Back Up veya):
-- USE master;
-- ALTER DATABASE ecari_sirket_acme SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
-- DROP DATABASE ecari_sirket_acme;
```

---

## 9. Sık karşılaşılan hatalar

| Hata | Sebep | Çözüm |
|------|--------|--------|
| `Invalid object name 'ecari_system.dbo.sys_users'` | 01 scripti çalışmamış | Önce `01-ecari_system.sql` |
| `Veritabanı zaten var` | Tekrar kurulum | Normal; script devam eder |
| `@CariId` / sözdizimi hatası | Eski script sürümü | Güncel `02-ecari_sirket_demo.sql` kullanın |
| Script 2000+ satır hata | Aynı script pencerede birleşmiş | Yeni sorgu penceresi, tek dosya |

---

## 10. Script dosyaları özeti

```
database/
├── README.md                    ← İlk kurulum (kısa)
├── YENI-MUSTERI-KURULUM.md      ← Bu rehber (yeni müşteri)
├── 00-KURULUM-SIRASI.sql          ← Sıra hatırlatıcı
├── 01-ecari_system.sql            ← Sistem DB (bir kez)
├── 02-ecari_sirket_demo.sql       ← Demo müşteri şablonu
├── 03-sistem-baglantisi.sql       ← Kullanıcı bağlantısı
└── 04-yeni_musteri_kayit.sql       ← Yeni müşteri sistem kaydı
```

---

## 11. İleride otomasyon (not)

Manuel SSMS süreci Faz 1 içindir. İleride:

- API üzerinden `POST /admin/companies` → otomatik DB oluşturma
- Migration aracı (Flyway / EF Migrations)
- Şema tek kaynak: `02` scriptinin parametreli versiyonu

Şema detayları: [docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md)

---

*Son güncelleme: 2026-06 · E-Cari Faz 1*
