# ecariapi.netafix.com — 15 dakikalık kurulum

SQL aynı sunucuda → bağlantı `Server=localhost` kullanır.

> Şifreleri sohbete yazmayın. Yalnızca Plesk File Manager'da düzenleyin.

---

## Adım 1 — Sunucuda (Plesk → Tools & Settings veya uzak masaüstü)

1. [.NET 8 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0) kurulu olsun (Windows).
2. SQL Server'da veritabanları hazır olsun (`database/01`, `02`, `03` scriptleri).

İsteğe bağlı SQL kullanıcısı (SSMS):

```sql
CREATE LOGIN ecari_app WITH PASSWORD = 'GucluSifreniz';
USE ecari_system;
CREATE USER ecari_app FOR LOGIN ecari_app;
ALTER ROLE db_owner ADD MEMBER ecari_app;
-- ecari_sirket_demo için de aynısı
```

`sa` kullanacaksanız `appsettings.Production.json` içinde `User Id=sa` yapın.

---

## Adım 2 — Alt alan adı

Plesk → **ecariapi.netafix.com** (veya Subdomain oluştur)

- Document root: örn. `httpdocs` veya `api.netafix.com/httpdocs`
- SSL: Let's Encrypt → **Aç**

---

## Adım 3 — Dosya yükleme

Bilgisayarınızda hazır klasör:

```text
c:\ecari\ecari\publish\api\
```

**Tüm içeriği** (dll, web.config, appsettings.Production.json, …) alt alanın köküne yükleyin:

- Plesk → **Files** → File Manager → sürükle-bırak, veya
- FileZilla ile FTP (şifreyi yalnızca FileZilla'ya girin)

Kökte şunlar görünmeli: `ECari.Api.dll`, `web.config`, `appsettings.Production.json`

---

## Adım 4 — Şifreyi dosyada düzenle (Plesk File Manager)

`appsettings.Production.json` açın → `BURAYA_SQL_SIFRESI` yerine **gerçek SQL şifresini** yazın → Kaydet.

---

## Adım 5 — IIS / ASP.NET

Plesk → Domain → **ASP.NET Core** (varsa):

- Version: **8.0**
- Mode: **in-process**

Yoksa: **Websites & Domains** → **IIS Application Pool** → **No Managed Code**

---

## Adım 6 — Test

```text
https://ecariapi.netafix.com/api/auth/login
```

Postman veya tarayıcı eklentisi ile POST:

```json
{"email":"admin@ecari.demo","password":"Demo123!"}
```

Başarılıysa `accessToken` döner.

Hata: `publish/api/logs/` veya sunucuda `logs/stdout_*.log` kontrol edin.

---

## Adım 7 — Vercel web

https://vercel.com → proje **ecari** → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://ecariapi.netafix.com` |

Deployments → **Redeploy**.

---

## Kontrol listesi

- [ ] Hosting Bundle 8 kurulu
- [ ] SQL scriptleri çalıştı
- [ ] `publish/api` yüklendi
- [ ] `appsettings.Production.json` şifre güncellendi
- [ ] HTTPS açık
- [ ] Login API 200 OK
- [ ] Vercel `VITE_API_BASE_URL` güncellendi
