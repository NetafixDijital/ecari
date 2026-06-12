# 11 — Yayınlama ve DevOps

Canlı ortam, sunucu ve bakım.

---

## Ortamlar

| Ortam | Amaç | URL örneği |
|-------|------|------------|
| **Development** | Geliştirici PC | localhost |
| **Staging** | Test / demo | staging.ecari.com |
| **Production** | Gerçek müşteriler | app.ecari.com |

---

## Production mimarisi (hedef)

```text
[Kullanıcılar]
      │
      ▼
[CDN / WAF] (opsiyonel)
      │
      ├── api.ecari.com     → API (IIS / Kestrel / Docker)
      ├── app.ecari.com     → Web static / SSR
      └──
[SQL Server]
      ├── ecari_system
      └── ecari_sirket_*
```

Mobil uygulama → doğrudan `api.ecari.com`

---

## Sunucu gereksinimleri (başlangıç)

| Bileşen | Minimum |
|---------|---------|
| API | 2 vCPU, 4 GB RAM |
| SQL Server | Ayrı makine önerilir, SSD |
| OS | Windows Server veya Linux (API için) |

---

## Deployment adımları (API)

1. `dotnet publish -c Release`  
2. Sunucuya kopyala  
3. `appsettings.Production.json` — connection string ortam değişkeni  
4. IIS veya systemd ile servis  
5. HTTPS sertifikası (Let's Encrypt)  

---

## Veritabanı bakım

| İş | Sıklık |
|----|--------|
| Full backup | Günlük |
| Transaction log backup | Saatlik (production) |
| Yeni müşteri DB | [YENI-MUSTERI-KURULUM.md](../database/YENI-MUSTERI-KURULUM.md) |
| Index bakımı | Haftalık |

---

## Mobil mağaza

| Platform | Gereksinim |
|----------|------------|
| Google Play | Developer hesabı, AAB imzalama |
| App Store | Apple Developer, Mac build |

API URL production: `https://api.ecari.com`

---

## Monitoring (ileride)

- Uptime: API `/health`  
- Log: Serilog → dosya veya Seq  
- Hata: Sentry (opsiyonel)  

---

## Rollback

- API: önceki publish klasörüne dön  
- DB: migration geri alma scripti (her migration için DOWN)  
- Git: `main` tag'leri ile sürüm işaretle  

---

## Sıradaki adım

Günlük akış: [12-GUNLUK-CALISMA-AKISI.md](./12-GUNLUK-CALISMA-AKISI.md)
