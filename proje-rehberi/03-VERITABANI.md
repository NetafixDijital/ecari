# 03 — Veritabanı

SQL Server kurulumu ve yeni müşteri ekleme. Detaylı SQL dosyaları `database/` klasöründedir.

---

## İki veritabanı türü

| Veritabanı | Ad | Ne zaman |
|------------|-----|----------|
| Sistem | `ecari_system` | Sunucuda **bir kez** |
| Müşteri | `ecari_sirket_{kod}` | **Her abone** için |

---

## İlk kurulum (SSMS)

| Sıra | Script |
|------|--------|
| 1 | [database/01-ecari_system.sql](../database/01-ecari_system.sql) |
| 2 | [database/02-ecari_sirket_demo.sql](../database/02-ecari_sirket_demo.sql) |
| 3 | [database/03-sistem-baglantisi.sql](../database/03-sistem-baglantisi.sql) |

Kısa rehber: [database/README.md](../database/README.md)

---

## Yeni abone müşteri

Tam süreç: [database/YENI-MUSTERI-KURULUM.md](../database/YENI-MUSTERI-KURULUM.md)

Özet:

1. `04-yeni_musteri_kayit.sql` — üstteki değişkenleri doldur → F5  
2. `02-ecari_sirket_demo.sql` kopyala → `ecari_sirket_{kod}` olarak değiştir → F5  
3. İlk kullanıcıyı bağla (rehberdeki SQL veya `03` benzeri)

---

## Şema referansı

Tüm tablo ve alan tanımları:

[docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md)

Form ↔ DB eşlemesi:

[docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md)

---

## API bağlantı dizesi

Backend, giriş sonrası `sys_companies.database_name` okuyarak doğru DB'ye geçer.

```text
1. Kullanıcı login → ecari_system
2. Şirket seç → database_name = ecari_sirket_demo
3. Cari isteği → ecari_sirket_demo.cari_accounts
```

Detay: [04-MIMARI.md](./04-MIMARI.md), [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md)

---

## Kontrol sorgusu

```sql
SELECT name FROM sys.databases WHERE name LIKE 'ecari%';
SELECT code, database_name FROM ecari_system.dbo.sys_companies;
```

---

## Sıradaki adım

HTML tasarım: [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) · Tam sıra: [TUM-ASAMALAR-SIRASI.md](./TUM-ASAMALAR-SIRASI.md)
