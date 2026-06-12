# 05 — Backend API

ASP.NET Core 8 Web API geliştirme planı ve endpoint taslağı.

---

## Amaç

Mobil ve web uygulamalarının konuştuğu **tek aracı katman**. Doğrudan SQL Server'a client bağlanmaz.

---

## Faz 1 API kapsamı

| Öncelik | Modül | Endpoint grubu |
|---------|--------|----------------|
| P0 | Auth | login, refresh, companies, select-company |
| P0 | Health | GET /health |
| P1 | Cari | CRUD + liste + arama |
| P2 | Stok | CRUD + barkod arama |
| P3 | Ayarlar | company profile read/update |

Fatura, kasa vb. → Faz 2–3 ([09-MODUL-PLANI.md](./09-MODUL-PLANI.md))

---

## Auth endpoint'leri

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/auth/login` | email + password → JWT |
| POST | `/api/auth/refresh` | refresh token |
| GET | `/api/auth/companies` | Kullanıcının şirketleri |
| POST | `/api/auth/select-company` | company_id → yeni JWT (tenant) |

### Login istek (örnek)

```json
{
  "email": "admin@ecari.demo",
  "password": "Demo123!"
}
```

### Login cevap (örnek)

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "user": { "id": 1, "fullName": "Demo Yönetici", "email": "admin@ecari.demo" }
}
```

---

## Cari endpoint'leri (Faz 1)

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/cari/accounts` | Liste (sayfa, arama) |
| GET | `/api/cari/accounts/{id}` | Detay |
| POST | `/api/cari/accounts` | Yeni müşteri |
| PUT | `/api/cari/accounts/{id}` | Güncelle |
| DELETE | `/api/cari/accounts/{id}` | Soft delete |

**Header (tenant sonrası):** `Authorization: Bearer {token}`

Alan listesi: [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md) §1

### Yeni müşteri body (örnek)

```json
{
  "personType": "TUZEL_KISI",
  "title": "Acme Ltd.",
  "taxNumber": "1234567890",
  "taxOffice": "Kadıköy",
  "email": "info@acme.com",
  "phone": "+905551112233",
  "addressLine": "Örnek Mah. No:1",
  "cityId": 1,
  "districtId": 1
}
```

---

## Stok endpoint'leri (Faz 1 — sonraki)

| Method | Path |
|--------|------|
| GET | `/api/stk/items` |
| GET | `/api/stk/items/{id}` |
| POST | `/api/stk/items` |
| PUT | `/api/stk/items/{id}` |
| GET | `/api/stk/items/by-barcode/{barcode}` |

---

## Teknik kararlar

| Konu | Karar |
|------|--------|
| ORM | Entity Framework Core 8 |
| Auth | JWT Bearer |
| Şifre | BCrypt |
| API doc | Swagger / OpenAPI |
| Validation | FluentValidation veya DataAnnotations |
| Hata formatı | RFC 7807 ProblemDetails |

---

## Geliştirme sırası (checklist)

- [ ] Solution build (`dotnet build`)
- [ ] SystemDbContext + TenantDbContext
- [ ] Login + JWT
- [ ] Tenant middleware (company_id → DB)
- [ ] Cari GET liste
- [ ] Cari POST (validation: person_type, VKN/TCKN)
- [ ] Swagger'da test
- [ ] Postman collection export

---

## appsettings yapısı

```json
{
  "ConnectionStrings": {
    "SystemDb": "Server=localhost;Database=ecari_system;Trusted_Connection=True;TrustServerCertificate=True",
    "TenantDbTemplate": "Server=localhost;Database={0};Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

`{0}` → `sys_companies.database_name` ile doldurulur.

---

## İlk çalıştırma

```powershell
cd c:\ıvızr
dotnet restore
dotnet build
cd src\ECari.Api
dotnet run
```

---

## Sıradaki adım

Mobil: [06-MOBIL-UYGULAMA.md](./06-MOBIL-UYGULAMA.md) · Auth detay: [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md)
