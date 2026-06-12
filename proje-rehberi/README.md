# E-Cari — Proje Geliştirme Rehberi

Bu klasör, **Git'ten canlı yayına** kadar tüm sürecin yol haritasıdır.  
Sırayla okuyun; her dosya bir aşamayı anlatır.

**Tek sayfada tüm checklist:** [TUM-ASAMALAR-SIRASI.md](./TUM-ASAMALAR-SIRASI.md)

---

## Nereden başlamalıyım?

```text
[Yeni başlıyorsanız]
    00-PROJE-OZETI.md          → Projeyi tanıyın (5 dk)
    01-GIT-BASLANGIC.md        → Repo oluştur, ilk commit
    02-GELISITIRME-ORTAMI.md   → Bilgisayara ne kurulacak
    03-VERITABANI.md           → SQL scriptleri (SSMS)
    03B-HTML-TASARIM.md        → Statik HTML'i design/html/ klasörüne koy
    04-MIMARI.md               → Katmanlar, tenant
         ↓
    05-BACKEND-API.md          → Sunucu programı
    07-WEB-UYGULAMA.md         → HTML → React + API bağlantısı
    06-MOBIL-UYGULAMA.md       → iOS + Android
         ↓
    11-YAYINLAMA-DEVOPS.md     → Canlıya alma
```

---

## Rehber dosyaları

| # | Dosya | Konu |
|---|--------|------|
| 00 | [PROJE-OZETI](./00-PROJE-OZETI.md) | Ne yapıyoruz, mimari özet |
| 01 | [GIT-BASLANGIC](./01-GIT-BASLANGIC.md) | Git, branch, commit, GitHub |
| 02 | [GELISITIRME-ORTAMI](./02-GELISITIRME-ORTAMI.md) | SQL Server, .NET, Flutter, VS Code |
| 03 | [VERITABANI](./03-VERITABANI.md) | DB kurulum, yeni müşteri |
| 03B | [HTML-TASARIM](./03B-HTML-TASARIM.md) | Statik HTML yerleştirme, alan doğrulama |
| — | [**TUM-ASAMALAR-SIRASI**](./TUM-ASAMALAR-SIRASI.md) | **Tüm adımlar tek checklist** |
| 04 | [MIMARI](./04-MIMARI.md) | Katmanlar, klasör yapısı, tenant |
| 05 | [BACKEND-API](./05-BACKEND-API.md) | ASP.NET Core, endpoint'ler, fazlar |
| 06 | [MOBIL-UYGULAMA](./06-MOBIL-UYGULAMA.md) | Flutter, ekranlar, API bağlantısı |
| 07 | [WEB-UYGULAMA](./07-WEB-UYGULAMA.md) | Admin web, modül kapsamı |
| 08 | [AUTH-VE-GUVENLIK](./08-AUTH-VE-GUVENLIK.md) | Giriş, JWT, izinler |
| 09 | [MODUL-PLANI](./09-MODUL-PLANI.md) | Faz 1–7, modül sırası |
| 10 | [TEST-VE-KALITE](./10-TEST-VE-KALITE.md) | Test, code review, CI |
| 11 | [YAYINLAMA-DEVOPS](./11-YAYINLAMA-DEVOPS.md) | Sunucu, domain, yedek |
| 12 | [GUNLUK-CALISMA-AKISI](./12-GUNLUK-CALISMA-AKISI.md) | Günlük rutin, PR akışı |
| — | [SOZLUK](./SOZLUK.md) | Terimler sözlüğü |

---

## Teknik referans dokümanları (ayrı klasörler)

| Doküman | Konum |
|---------|--------|
| Veritabanı tasarımı (tam şema) | [docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md) |
| HTML form alanları (UI ↔ DB) | [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md) |
| **Statik HTML tasarım dosyaları** | [design/html/](../design/html/) |
| UI ekran özeti | [docs/UI-MODUL-OZETI.md](../docs/UI-MODUL-OZETI.md) |
| Ekran görüntüleri | [docs/ekran-goruntuleri/](../docs/ekran-goruntuleri/) |
| SQL scriptleri | [database/](../database/) |

---

## Proje klasör yapısı (hedef)

```text
ecari/
├── proje-rehberi/       ← Bu rehber (siz buradan yürürsünüz)
├── design/html/         ← Statik HTML ekranlar (siz buraya koyacaksınız)
├── docs/                ← Teknik tasarım dokümanları
├── database/            ← SQL kurulum scriptleri
├── src/
│   ├── ECari.Api/       ← Backend REST API
│   ├── ECari.Domain/    ← İş modelleri
│   ├── ECari.Infrastructure/  ← Veritabanı, auth
│   └── ECari.Mobile/    ← Flutter (ileride)
├── web/                 ← Web admin (HTML'den dönüştürülecek)
├── ECari.sln
└── README.md
```

---

## Mevcut durum (2026-06)

| Aşama | Durum |
|-------|--------|
| Tasarım dokümanları | ✅ Tamam |
| SQL scriptleri (Faz 1) | ✅ Tamam |
| HTML tasarım (`design/html/`) | 🔲 Siz koyacaksınız |
| Backend API | 🔲 HTML sonrası |
| Web (HTML → React) | 🔲 API sonrası |
| Mobil (Flutter) | 🔲 API sonrası |
| Canlı yayın | 🔲 En son |

**Şu anki sıra:** HTML'i `design/html/` klasörüne koy → **03B-HTML-TASARIM.md** → **TUM-ASAMALAR-SIRASI.md**

---

*E-Cari Ön Muhasebe SaaS · Database-per-customer · SQL Server · .NET 8 · Flutter*
