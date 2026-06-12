# 08 — Auth ve Güvenlik

Giriş, token, yetki ve şube kısıtı.

---

## Kimlik nerede?

| Veri | Veritabanı | Tablo |
|------|------------|--------|
| E-posta, şifre hash | `ecari_system` | `sys_users` |
| Şirket profili | `ecari_sirket_{kod}` | `org_users` |
| Kullanıcı ↔ şirket | `ecari_system` | `sys_user_companies` |
| İzinler | `ecari_sirket_{kod}` | `auth_user_permissions` |
| Şube kısıtı | `ecari_sirket_{kod}` | `auth_user_branch_access` |

---

## Giriş akışı

```text
1. POST /auth/login
   → ecari_system.sys_users (BCrypt verify)

2. GET /auth/companies
   → sys_user_companies + sys_companies

3. POST /auth/select-company { companyId }
   → JWT içine: user_id, company_id, database_name, org_user_id

4. Sonraki istekler
   → TenantMiddleware database_name ile TenantDbContext açar
```

---

## JWT içeriği (örnek claim)

```json
{
  "sub": "1",
  "email": "admin@ecari.demo",
  "company_id": "1",
  "company_code": "demo",
  "database_name": "ecari_sirket_demo",
  "org_user_id": "1"
}
```

---

## Yetki kontrolü

Efektif izin:

```text
(rol izinleri ∪ doğrudan verilen) − doğrudan reddedilen
```

Tablolar: `auth_user_roles`, `auth_role_permissions`, `auth_user_permissions`

UI checkbox ağacı → `auth_user_permissions.is_granted`

Örnek kodlar: `COMPANY.VIEW`, `COMPANY.EDIT`, `BRANCH.CREATE`

Kaynak: VERITABANI-TASARIM-DOKUMANI §4A, §28.28

---

## Şube kısıtı

| Durum | Davranış |
|-------|----------|
| Kısıt kapalı, şube seçili değil | Max 3 şube (`default_branch_id` öncelikli) |
| Kısıt açık, şubeler işaretli | İşaretli = DENY (erişim yok) |

API: liste/rapor sorgularına `branch_id` filtresi uygulanır.

---

## Güvenlik checklist

- [ ] HTTPS zorunlu (production)
- [ ] Şifre: BCrypt, minimum 8 karakter
- [ ] JWT secret: güçlü, ortam değişkeninde
- [ ] Refresh token: veritabanı veya Redis'te revoke
- [ ] Rate limit login endpoint
- [ ] SQL injection: parametreli sorgu / EF Core
- [ ] CORS: yalnızca bilinen web/mobil origin
- [ ] Connection string repoda yok

---

## Demo kullanıcı

| | |
|--|--|
| E-posta | admin@ecari.demo |
| Şifre | Demo123! |
| Şirket | demo |

---

## Sıradaki adım

Modül planı: [09-MODUL-PLANI.md](./09-MODUL-PLANI.md)
