# Sözlük — Teknik Terimler

E-Cari projesinde sık geçen kelimeler, sade Türkçe.

---

## A–C

| Terim | Anlam |
|-------|--------|
| **API** | Mobil ve web'in veritabanıyla konuştuğu sunucu programı. Doğrudan SQL'e bağlanmazsınız. |
| **Backend** | Sunucu tarafı kod (API + iş kuralları). |
| **Branch** | Git'te paralel geliştirme dalı (`feature/cari-api`). |
| **BCrypt** | Şifrelerin güvenli saklanma yöntemi (hash). |
| **Cari** | Müşteri veya tedarikçi kartı. |
| **Commit** | Git'te kaydedilen değişiklik paketi. |
| **CRUD** | Create, Read, Update, Delete — ekle, oku, güncelle, sil. |

---

## D–J

| Terim | Anlam |
|-------|--------|
| **Database-per-customer** | Her müşterinin ayrı veritabanı (`ecari_sirket_acme`). |
| **DDL** | Veritabanı tablo oluşturma SQL scriptleri. |
| **DTO** | API'den giden/gelen veri paketi (JSON). |
| **Endpoint** | API adresi (`POST /api/cari/accounts`). |
| **Entity** | Veritabanı tablosunun kod karşılığı. |
| **ERP** | Kurumsal kaynak planlama; E-Cari ön muhasebe ERP'sidir. |
| **Flutter** | Tek kodla iOS + Android uygulaması yazma aracı. |
| **JWT** | Giriş sonrası verilen dijital anahtar (token). |

---

## K–M

| Terim | Anlam |
|-------|--------|
| **KDV** | Katma değer vergisi. Ana oran KDV20 (%20). |
| **Migration** | Veritabanı şema değişikliği scripti. |
| **Middleware** | API'de her istekten önce çalışan ara katman (tenant seçimi gibi). |
| **Modül öneki** | Tablo adı başı: `cari_`, `stk_`, `inv_`. |
| **MSSQL / SQL Server** | Microsoft veritabanı sunucusu. |

---

## O–S

| Terim | Anlam |
|-------|--------|
| **ORM** | Entity Framework — tabloları C# sınıfı gibi kullanma. |
| **Ön muhasebe** | Cari, fatura, kasa; tam yevmiye defteri değil. |
| **PR (Pull Request)** | Kod incelemesi için merge isteği. |
| **REST** | API tasarım stili (HTTP + JSON). |
| **SaaS** | İnternetten abonelikle yazılım (E-Cari modeli). |
| **Seed** | Veritabanına ilk örnek veri (KDV oranları, demo kullanıcı). |
| **Soft delete** | Kayıt silinmez; `is_deleted = 1` işaretlenir. |
| **SSMS** | SQL Server Management Studio — SQL çalıştırma aracı. |
| **Swagger** | API'yi tarayıcıda test etme arayüzü. |

---

## T–Z

| Terim | Anlam |
|-------|--------|
| **Tenant** | Abone müşteri / kiracı. Bizde = ayrı DB. |
| **Token** | Giriş belgesi; her API isteğinde gönderilir. |
| **UI** | Kullanıcı arayüzü — ekranlar, formlar. |
| **View** | Veritabanında hesaplanan sanal tablo (`v_cari_account_balance`). |
| **VKN / TCKN** | Vergi no (10 hane) / TC kimlik no (11 hane). |

---

## Kısaltmalar

| Kısalt | Açılım |
|--------|--------|
| EDM | e-Fatura entegratör firması (Faz 1 birincil) |
| GTİP | Gümrük tarife istatistik pozisyonu (12 hane) |
| SS | Ekran görüntüsü (screenshot) |
| FK | Foreign key — tablolar arası bağ |

---

[← Rehber ana sayfa](./README.md)
