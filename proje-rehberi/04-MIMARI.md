# 04 — Mimari

Katmanlar, klasör yapısı ve veri akışı.

---

## Katman diyagramı

```text
┌─────────────────────────────────────────────────────────┐
│  Presentation                                            │
│  ├── ECari.Mobile (Flutter)                             │
│  └── web/ (React — ileride)                             │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / JSON
┌───────────────────────────▼─────────────────────────────┐
│  ECari.Api                                               │
│  Controllers → Services → DTO                            │
│  JWT, tenant çözümleme, validation                       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  ECari.Infrastructure                                    │
│  EF Core, DbContext (system + tenant), BCrypt, JWT       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  ECari.Domain                                            │
│  Entity, enum, interface (iş kuralları arayüzü)          │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  SQL Server                                              │
│  ecari_system │ ecari_sirket_*                           │
└─────────────────────────────────────────────────────────┘
```

---

## Solution yapısı

```text
src/
├── ECari.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   └── CariController.cs
│   ├── Middleware/
│   │   └── TenantMiddleware.cs
│   ├── Program.cs
│   └── appsettings.json
├── ECari.Domain/
│   ├── Entities/
│   ├── Enums/
│   └── Dtos/
└── ECari.Infrastructure/
    ├── Data/
    │   ├── SystemDbContext.cs
    │   └── TenantDbContext.cs
    ├── Services/
    └── Auth/
```

---

## Database-per-customer (tenant)

| Kavram | Uygulama |
|--------|----------|
| Kimlik | `ecari_system.sys_users` |
| Şirket listesi | `sys_user_companies` + `sys_companies` |
| Operasyonel veri | `ecari_sirket_{kod}` — JWT'de `company_id` |
| DB seçimi | `sys_companies.database_name` → connection string |

**Yasak:** Tek DB'de `tenant_id` kolonu ile tüm müşterileri karıştırmak.

---

## Modül önekleri (tablo)

| Önek | Modül |
|------|--------|
| `core_` | Para birimi, KDV, il/ilçe |
| `org_` | Şube, kullanıcı profili |
| `cari_` | Cari |
| `stk_` | Stok |
| `inv_` | Fatura |
| `auth_` | Yetki (şirket DB) |
| `cfg_` | Ayarlar |

---

## Belge zinciri (Faz 2+)

```text
Teklif → Sipariş → İrsaliye → Fatura
  qot_     ord_       dln_        inv_
```

Satırlar `source_line_id` ile birbirine bağlanır.

---

## Genişletme kuralları

1. Yeni modül = yeni tablo öneki; mevcut tabloları ALTER etme  
2. Özel alan (Faz 2+): EAV — Faz 1'de yok  
3. Entegrasyon: `int_outbox_events` (outbox pattern)  
4. e-Fatura: `ebl_` + EDM adapter  

Kaynak: VERITABANI-TASARIM-DOKUMANI §2.5, §27A

---

## Sıradaki adım

Backend detay: [05-BACKEND-API.md](./05-BACKEND-API.md)
