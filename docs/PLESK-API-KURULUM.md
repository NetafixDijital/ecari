# E-Cari API — Plesk Kurulum Rehberi

Web arayüzü Vercel'de; API ve SQL Server Plesk sunucunuzda çalışmalıdır.

> **Güvenlik:** Şifreleri sohbet veya e-posta ile paylaşmayın. Yalnızca Plesk panelinde veya sunucudaki `appsettings.Production.json` dosyasında tutun.

---

## Gereksinimler (Plesk Windows)

| Bileşen | Sürüm |
|---------|--------|
| Windows Server + IIS | Plesk ile gelen |
| **ASP.NET Core 8 Hosting Bundle** | [Microsoft indir](https://dotnet.microsoft.com/download/dotnet/8.0) |
| SQL Server | 2019+ (uzak veya aynı sunucu) |
| Plesk | .NET / IIS desteği açık |

Linux Plesk için: Kestrel + reverse proxy (nginx) gerekir; bu rehber **Windows + IIS** içindir.

---

## 1. Veritabanı

SSMS veya Plesk SQL ile sırayla çalıştırın:

```text
database/01-ecari_system.sql
database/02-ecari_sirket_demo.sql
database/03-sistem-baglantisi.sql
... (README'deki tam script sırası)
```

---

## 2. Yayın paketi oluşturma (geliştirme PC)

```powershell
cd c:\ecari\ecari
.\scripts\publish-api.ps1
```

Çıktı: `publish/api/` klasörü.

---

## 3. Production ayarları

`publish/api/` içinde `appsettings.Production.json` oluşturun (`appsettings.Production.json.example` dosyasını kopyalayıp doldurun):

```json
{
  "ConnectionStrings": {
    "SystemDb": "Server=...;Database=ecari_system;User Id=...;Password=...;TrustServerCertificate=True;Encrypt=True",
    "TenantDbTemplate": "Server=...;Database={0};User Id=...;Password=...;TrustServerCertificate=True;Encrypt=True"
  },
  "Jwt": {
    "Secret": "en-az-32-karakter-rastgele-gizli-anahtar",
    "Issuer": "ecari",
    "Audience": "ecari",
    "AccessTokenMinutes": 480
  },
  "Cors": {
    "Origins": ["https://ecari.vercel.app", "https://www.sizin-domain.com"]
  }
}
```

Bu dosya `.gitignore` içindedir; repoya commit etmeyin.

---

## 4. Plesk'te alt alan adı

1. **Websites & Domains** → **Add Subdomain** → örn. `api.sizin-domain.com`
2. Document root: örn. `httpdocs/api` veya alt alanın kök klasörü
3. **ASP.NET Core** eklentisi varsa: sürüm **8.0**, mod **in-process**

---

## 5. Dosyaları yükleme

`publish/api/` içindeki **tüm dosyaları** (dll, web.config, appsettings.Production.json vb.) alt alan köküne yükleyin:

- Plesk **File Manager**, veya
- FTP/SFTP (FileZilla)

Klasörde `ECari.Api.dll` ve `web.config` olmalı.

---

## 6. IIS / Plesk kontrolleri

| Ayar | Değer |
|------|--------|
| Application pool | **No Managed Code** (.NET Core için) |
| `ASPNETCORE_ENVIRONMENT` | `Production` (web.config içinde tanımlı) |
| HTTPS | Let's Encrypt ile sertifika açın |

Hata olursa: `logs/stdout_*.log` dosyasına bakın (web.config stdout açık).

---

## 7. Test

```text
GET https://api.sizin-domain.com/swagger   (Production'da kapalı olabilir)
POST https://api.sizin-domain.com/api/auth/login
```

Demo: `admin@ecari.demo` / `Demo123!` / şirket `demo`

---

## 8. Vercel web bağlantısı

Vercel → **ecari** projesi → **Settings → Environment Variables**:

```text
VITE_API_BASE_URL = https://api.sizin-domain.com
```

**Redeploy** yapın.

---

## Sık hatalar

| Belirti | Çözüm |
|---------|--------|
| 502.5 | Hosting Bundle 8 kurulu değil veya yanlış app pool |
| SQL bağlantı hatası | Firewall, SQL kullanıcı izni, `TrustServerCertificate=True` |
| CORS hatası (Vercel) | `Cors:Origins` içine `https://ecari.vercel.app` ekleyin |
| 401 login | JWT Secret production'da en az 32 karakter |

---

## Benim yapamadığım / sizin yapmanız gereken

Uzak sunucuya doğrudan bağlanamıyorum. Şifreleri buraya yazmayın; Plesk FTP veya File Manager ile `appsettings.Production.json` dosyasını siz oluşturun.

Kurulumda takılırsanız: hata mesajı veya `logs/stdout` içeriğini (şifresiz) paylaşın.
