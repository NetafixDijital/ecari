# Tüm Aşamalar — Sırayla Yapılacaklar

Git'ten canlı yayına kadar **tek tek** işaretleyerek ilerleyin.  
Her satırın detayı ilgili rehber dosyasında.

---

## Genel akış

```text
 HAZIRLIK          ALTYAPI           TASARIM           GELİŞTİRME              YAYIN
 ─────────         ─────────         ─────────         ─────────────           ─────
 00 Özet      →    02 Ortam     →    03B HTML     →    05 API            →    11 DevOps
 01 Git            03 DB             04 Mimari         06 Mobil
                                       08 Auth           07 Web
                                       09 Modül          10 Test
                                                         12 Günlük rutin
```

---

## AŞAMA 0 — Projeyi tanı

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 0.1 | E-Cari'nin ne olduğunu oku (5 dk) | [00-PROJE-OZETI.md](./00-PROJE-OZETI.md) | |
| 0.2 | Mimari: database-per-customer, API ortada | [00-PROJE-OZETI.md](./00-PROJE-OZETI.md) § Mimari | |
| 0.3 | Terimleri bil (tenant, JWT, cari…) | [SOZLUK.md](./SOZLUK.md) | |

---

## AŞAMA 1 — Git ve repo

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 1.1 | `git init`, ilk commit | [01-GIT-BASLANGIC.md](./01-GIT-BASLANGIC.md) §3 | |
| 1.2 | `.gitignore` kontrol (şifre commit etme) | [01-GIT-BASLANGIC.md](./01-GIT-BASLANGIC.md) §3 | |
| 1.3 | GitHub/GitLab remote + push | [01-GIT-BASLANGIC.md](./01-GIT-BASLANGIC.md) §4 | |
| 1.4 | `develop` branch oluştur | [01-GIT-BASLANGIC.md](./01-GIT-BASLANGIC.md) §5 | |

---

## AŞAMA 2 — Geliştirme ortamı

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 2.1 | SQL Server + SSMS kurulu | [02-GELISITIRME-ORTAMI.md](./02-GELISITIRME-ORTAMI.md) | |
| 2.2 | .NET 8 SDK — `dotnet --version` | [02-GELISITIRME-ORTAMI.md](./02-GELISITIRME-ORTAMI.md) | |
| 2.3 | VS Code / Visual Studio | [02-GELISITIRME-ORTAMI.md](./02-GELISITIRME-ORTAMI.md) | |
| 2.4 | (İleride) Flutter SDK — mobil için | [02-GELISITIRME-ORTAMI.md](./02-GELISITIRME-ORTAMI.md) | |
| 2.5 | (İleride) Node.js — web için | [02-GELISITIRME-ORTAMI.md](./02-GELISITIRME-ORTAMI.md) | |

---

## AŞAMA 3 — Veritabanı

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 3.1 | SSMS'te `01-ecari_system.sql` çalıştır | [03-VERITABANI.md](./03-VERITABANI.md) | |
| 3.2 | `02-ecari_sirket_demo.sql` çalıştır | [03-VERITABANI.md](./03-VERITABANI.md) | |
| 3.3 | `03-sistem-baglantisi.sql` çalıştır | [03-VERITABANI.md](./03-VERITABANI.md) | |
| 3.4 | Demo giriş doğrula: `admin@ecari.demo` / `Demo123!` | [03-VERITABANI.md](./03-VERITABANI.md) | |
| 3.5 | Tabloları SSMS'te gözden geçir (`cari_accounts`, `stk_items`…) | [docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md) | |

**Sıra önemli:** 01 → 02 → 03 (ters sıra hata verir)

---

## AŞAMA 4 — HTML tasarım (statik ekranlar)

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 4.1 | Hazır HTML dosyalarını `design/html/` altına kopyala | [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) §1 | |
| 4.2 | Klasör yapısı: `pages/`, `assets/`, `shared/` | [design/html/README.md](../design/html/README.md) | |
| 4.3 | Modül klasörleri: `cari/`, `stok/`, `fatura/`… | [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) §2 | |
| 4.4 | Form `name` alanları = DB sütun adları | [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md) | |
| 4.5 | Liste tablo kolonlarını referansla karşılaştır | [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) §4 | |
| 4.6 | `shared/layout.html` + `login.html` hazır | [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) §5 | |
| 4.7 | Tarayıcıda aç, CSS/JS kırık link yok | [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) §6 | |
| 4.8 | `git add design/` + commit | [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md) §7 | |

**Sizin HTML'i buraya koyduğunuz nokta budur.**

---

## AŞAMA 5 — Mimari ve kod yapısı

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 5.1 | Katmanları anla: Api / Domain / Infrastructure | [04-MIMARI.md](./04-MIMARI.md) | |
| 5.2 | Tenant akışı: login → company → DB seçimi | [04-MIMARI.md](./04-MIMARI.md) | |
| 5.3 | `src/` klasör yapısını kontrol et | [04-MIMARI.md](./04-MIMARI.md) | |
| 5.4 | `dotnet build` — solution derleniyor mu | [05-BACKEND-API.md](./05-BACKEND-API.md) | |

---

## AŞAMA 6 — Backend API (Faz 1)

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 6.1 | SystemDbContext + TenantDbContext | [05-BACKEND-API.md](./05-BACKEND-API.md) | |
| 6.2 | POST `/api/auth/login` | [05-BACKEND-API.md](./05-BACKEND-API.md), [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md) | |
| 6.3 | GET `/api/auth/companies` | [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md) | |
| 6.4 | POST `/api/auth/select-company` + tenant middleware | [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md) | |
| 6.5 | GET `/api/cari/accounts` (liste) | [05-BACKEND-API.md](./05-BACKEND-API.md) | |
| 6.6 | POST `/api/cari/accounts` (yeni müşteri) | [05-BACKEND-API.md](./05-BACKEND-API.md) | |
| 6.7 | PUT / DELETE cari | [05-BACKEND-API.md](./05-BACKEND-API.md) | |
| 6.8 | Swagger'da tüm endpoint test | [05-BACKEND-API.md](./05-BACKEND-API.md) | |
| 6.9 | Stok CRUD (Faz 1 devam) | [09-MODUL-PLANI.md](./09-MODUL-PLANI.md) | |

**HTML'deki `name` alanları = API JSON property adları**

---

## AŞAMA 7 — Web uygulama (HTML → canlı)

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 7.1 | `web/` projesi oluştur (Vite + React) | [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) | |
| 7.2 | `design/html/shared/layout.html` → Layout bileşeni | [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) | |
| 7.3 | Login sayfası + API bağlantısı | [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) | |
| 7.4 | Cari liste — HTML tablo → API verisi | [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) | |
| 7.5 | Yeni müşteri modal — HTML form → POST API | [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) | |
| 7.6 | Stok form (4 sekme) | [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) | |
| 7.7 | Diğer modüller (Faz 2–7 sırasıyla) | [09-MODUL-PLANI.md](./09-MODUL-PLANI.md) | |

---

## AŞAMA 8 — Mobil uygulama (Flutter)

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 8.1 | Flutter kur, `flutter doctor` | [06-MOBIL-UYGULAMA.md](./06-MOBIL-UYGULAMA.md) | |
| 8.2 | `ecari_mobile` projesi | [06-MOBIL-UYGULAMA.md](./06-MOBIL-UYGULAMA.md) | |
| 8.3 | Login + şirket seçimi | [06-MOBIL-UYGULAMA.md](./06-MOBIL-UYGULAMA.md) | |
| 8.4 | Cari liste + yeni müşteri (HTML/cariden ilham) | [06-MOBIL-UYGULAMA.md](./06-MOBIL-UYGULAMA.md) | |
| 8.5 | Stok arama, görev (Faz 2+) | [09-MODUL-PLANI.md](./09-MODUL-PLANI.md) | |

---

## AŞAMA 9 — Test ve kalite

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 9.1 | API unit test (VKN/TCKN validation) | [10-TEST-VE-KALITE.md](./10-TEST-VE-KALITE.md) | |
| 9.2 | Login + Cari integration test | [10-TEST-VE-KALITE.md](./10-TEST-VE-KALITE.md) | |
| 9.3 | Web: cari ekle → listede gör | [10-TEST-VE-KALITE.md](./10-TEST-VE-KALITE.md) | |
| 9.4 | HTML alan adları hâlâ referansla uyumlu mu | [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md) | |

---

## AŞAMA 10 — Yayınlama

| # | Yapılacak | Rehber | ✓ |
|---|-----------|--------|---|
| 10.1 | Staging sunucu + SQL | [11-YAYINLAMA-DEVOPS.md](./11-YAYINLAMA-DEVOPS.md) | |
| 10.2 | API publish + HTTPS | [11-YAYINLAMA-DEVOPS.md](./11-YAYINLAMA-DEVOPS.md) | |
| 10.3 | Web static deploy | [11-YAYINLAMA-DEVOPS.md](./11-YAYINLAMA-DEVOPS.md) | |
| 10.4 | Günlük DB yedek | [11-YAYINLAMA-DEVOPS.md](./11-YAYINLAMA-DEVOPS.md) | |
| 10.5 | Yeni müşteri DB prosedürü | [database/YENI-MUSTERI-KURULUM.md](../database/YENI-MUSTERI-KURULUM.md) | |
| 10.6 | Mobil mağaza (opsiyonel) | [11-YAYINLAMA-DEVOPS.md](./11-YAYINLAMA-DEVOPS.md) | |

---

## Modül sırası (Faz 1–7 özeti)

Her modül: **HTML var mı? → API → Web/Mobil → Test**

| Sıra | Modül | HTML klasörü | Faz |
|------|-------|--------------|-----|
| 1 | Cari | `pages/cari/` | 1 |
| 2 | Stok | `pages/stok/` | 1 |
| 3 | Auth / Kullanıcı | `shared/login`, `pages/kullanici/` | 1 / 7 |
| 4 | Teklif | `pages/teklif/` | 2 |
| 5 | Sipariş / İrsaliye | — | 2 |
| 6 | Fatura | `pages/fatura/` | 2 |
| 7 | Kasa / Banka / Çek | `pages/kasa/`, `pages/cek/` | 3 |
| 8 | e-Belge | `pages/ayarlar/` | 4 |
| 9 | Görev | `pages/gorev/` | 6 |

Detay: [09-MODUL-PLANI.md](./09-MODUL-PLANI.md)

---

## Günlük çalışma

Her gün: [12-GUNLUK-CALISMA-AKISI.md](./12-GUNLUK-CALISMA-AKISI.md)

---

## Şu an neredesiniz? (2026-06)

```text
✅ 0–3  Doküman + DB scriptleri hazır
→  4    HTML tasarımı design/html/ klasörüne koy
→  6    Backend API (Auth + Cari)
→  7    Web (HTML'i React'e çevir + API bağla)
```

**İlk adım:** HTML dosyalarını `design/html/` altına kopyalayın → [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md)

---

## Hızlı linkler

| Konu | Dosya |
|------|--------|
| HTML klasörü | [design/html/](../design/html/) |
| Alan referansı | [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md) |
| DB şema | [docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md) |
| SQL script | [database/](../database/) |
| Rehber indeks | [README.md](./README.md) |
