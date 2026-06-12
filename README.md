# E-Cari — Ön Muhasebe SaaS

Türkiye odaklı **ön muhasebe ERP** projesi. Cari, stok, fatura, kasa, e-belge ve görev modülleri; mobil (Flutter) ve web admin arayüzü ile sunulacak.

---

## Nereden başlamalıyım?

Tüm geliştirme süreci (Git → veritabanı → API → mobil → web → yayın) şu klasörde adım adım anlatılır:

**→ [proje-rehberi/TUM-ASAMALAR-SIRASI.md](./proje-rehberi/TUM-ASAMALAR-SIRASI.md)** (tüm adımlar tek checklist)

Kısa yol:

```text
proje-rehberi/00-PROJE-OZETI.md     → Projeyi tanı
proje-rehberi/01-GIT-BASLANGIC.md   → Repo ve branch
proje-rehberi/03-VERITABANI.md      → SQL Server kurulum
design/html/                        → Statik HTML tasarım (siz koyacaksınız)
proje-rehberi/05-BACKEND-API.md     → API geliştirme
proje-rehberi/07-WEB-UYGULAMA.md     → HTML → React + API
```

---

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Veritabanı | SQL Server 2019+ (database-per-customer) |
| Backend | ASP.NET Core 8 Web API |
| Mobil | Flutter (iOS + Android) |
| Web | React veya Blazor (Faz 2+) |

---

## Klasör yapısı

```text
ecari/
├── proje-rehberi/          ← Geliştirme yol haritası (buradan yürüyün)
├── design/html/            ← Statik HTML ekranlar
├── docs/                   ← Tasarım dokümanları, ekran görüntüleri
├── database/               ← SQL kurulum scriptleri
├── src/
│   ├── ECari.Api/          ← REST API (Swagger)
│   ├── ECari.Domain/
│   └── ECari.Infrastructure/
├── ECari.sln
└── README.md
```

---

## Teknik referanslar

| Doküman | Açıklama |
|---------|----------|
| [VERITABANI-TASARIM-DOKUMANI.md](./docs/VERITABANI-TASARIM-DOKUMANI.md) | Tam şema ve iş kuralları |
| [HTML-ALAN-REFERANSI.md](./docs/HTML-ALAN-REFERANSI.md) | UI form alanları ↔ DB |
| [database/README.md](./database/README.md) | İlk DB kurulumu (SSMS) |
| [database/YENI-MUSTERI-KURULUM.md](./database/YENI-MUSTERI-KURULUM.md) | Yeni müşteri kaydı |

---

## Demo ortam

| | |
|--|--|
| Sistem DB | `ecari_system` |
| Şirket DB | `ecari_sirket_demo` |
| Giriş | `admin@ecari.demo` / `Demo123!` |
| Şirket kodu | `demo` |

Script sırası: `01` → `02` → `03` ([database/](./database/))

---

## Mevcut durum

| Aşama | Durum |
|-------|--------|
| Tasarım dokümanları | ✅ |
| SQL scriptleri (`01`–`09`) | ✅ |
| HTML tasarım (`design/html/`) | ✅ |
| Backend API (Cari, Stok, Fatura, İrsaliye, Sipariş, Kasa, Banka, Çek-Senet, Servis, Görev) | ✅ |
| Backend API Masraf (`/api/exp`) | 🔲 Son faz (API hazır, UI bekliyor) |
| Web React uygulaması | ✅ (Ana panel canlı API; Masraf UI son fazda) |
| API entegrasyon testi (`scripts/test-api.ps1`) | ✅ |
| Mobil Flutter (`mobile/`) | 🔲 Faz 1 iskelet (login + cari) — Flutter SDK gerekli |

### Çalıştırma

```bash
# API (Development)
cd src/ECari.Api
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --urls http://localhost:5050

# Web
cd web
npm run dev
# http://localhost:5173

# API testleri
.\scripts\test-api.ps1
```

Script sırası: `01` → `02` → `03` → `03-faz2-inv-csh` → `04-faz2-dln` → `05-faz2-ord` → `06-faz2-bnk` → `07-faz3-misc` → `08-faz3-chq` → `09-cari-kart-alanlari`

### Mobil

```powershell
# Flutter kurulumu sonrası
.\scripts\setup-mobile.ps1
cd mobile
flutter run
```

Detay: [mobile/README.md](./mobile/README.md)

---

*E-Cari · Ön muhasebe · Database-per-customer · .NET 8 · Flutter*
