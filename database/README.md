# E-Cari — Veritabanı Kurulumu (SQL Server Management Studio)

Faz 1 tablolarını oluşturur: **sistem veritabanı** + **demo şirket veritabanı**.

> **Yeni müşteri eklemek için:** [YENI-MUSTERI-KURULUM.md](./YENI-MUSTERI-KURULUM.md)

---

## Gereksinim

- SQL Server 2019 veya üzeri (Express de olur)
- SQL Server Management Studio (SSMS)

---

## İlk kurulum (3 adım)

### 1) SSMS’i açın

Sunucunuza bağlanın (genelde: `localhost` veya `(localdb)\MSSQLLocalDB`).

### 2) Scriptleri sırayla çalıştırın

| Sıra | Dosya | Ne yapar |
|------|--------|----------|
| **1** | `01-ecari_system.sql` | Sistem DB: kullanıcılar, şirketler, abonelik |
| **2** | `02-ecari_sirket_demo.sql` | Demo şirket DB: cari, stok, ayarlar |
| **3** | `03-sistem-baglantisi.sql` | İki DB arası kullanıcı bağlantısı |

**Önemli:** Mutlaka **önce 01, sonra 02, sonra 03**. Her dosyada: aç → **F5**.

### 3) Kontrol

Object Explorer’da:

- `ecari_system` → sys_companies, sys_users…
- `ecari_sirket_demo` → cari_accounts, stk_items…

```sql
SELECT * FROM ecari_sirket_demo.dbo.v_cari_account_balance;
```

---

## Demo giriş bilgisi

| Alan | Değer |
|------|--------|
| E-posta | `admin@ecari.demo` |
| Şifre | `Demo123!` |
| Şirket kodu | `demo` |
| Şirket DB | `ecari_sirket_demo` |

---

## Sıfırdan yeniden kurmak

```sql
USE master;
ALTER DATABASE ecari_sirket_demo SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE IF EXISTS ecari_sirket_demo;
DROP DATABASE IF EXISTS ecari_system;
```

Sonra 01 → 02 → 03 tekrar çalıştırın.

---

## Dosya yapısı

```
database/
├── README.md                   ← İlk kurulum (bu dosya)
├── YENI-MUSTERI-KURULUM.md     ← Yeni abone müşteri rehberi
├── 00-KURULUM-SIRASI.sql
├── 01-ecari_system.sql
├── 02-ecari_sirket_demo.sql
├── 03-sistem-baglantisi.sql
└── 04-yeni_musteri_kayit.sql
```

---

*Şema: [docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md)*
