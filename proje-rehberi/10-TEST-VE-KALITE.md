# 10 — Test ve Kalite

Kod kalitesi, test türleri ve CI.

---

## Test piramidi

```text
        ┌─────────┐
        │  E2E    │  Az (kritik akışlar)
        ├─────────┤
        │ Integr. │  API + gerçek/test DB
        ├─────────┤
        │  Unit   │  İş kuralları, validation
        └─────────┘
```

---

## Backend test

| Tür | Araç | Ne test edilir |
|-----|------|----------------|
| Unit | xUnit | VKN/TCKN validation, KDV hesap |
| Integration | WebApplicationFactory | Login, Cari CRUD |
| API manuel | Swagger / Postman | Hızlı doğrulama |

### Örnek kritik test senaryoları

- Tüzel kişi: 10 haneli VKN zorunlu  
- Gerçek kişi: 11 haneli TCKN zorunlu  
- Yanlış şifre → 401  
- Token olmadan Cari → 401  
- Yanlış company → 403  

---

## Mobil test

```powershell
flutter test
flutter analyze
```

Manuel: emülatörde login → cari ekle → listede gör.

---

## Web test

- Vitest / React Testing Library (birim)  
- Playwright (E2E — ileride)  

---

## Code review checklist

- [ ] API breaking change yok (veya versiyonlandı)  
- [ ] SQL migration geri alınabilir mi?  
- [ ] Hassas veri loglanmıyor  
- [ ] HTML-ALAN-REFERANSI ile alan adları uyumlu  
- [ ] Soft delete (`is_deleted`) kullanıldı  

---

## CI (GitHub Actions — ileride)

```yaml
# .github/workflows/build.yml (taslak)
# - dotnet restore / build / test
# - flutter analyze (mobil eklendiğinde)
```

Her PR'da otomatik build.

---

## Test veritabanı

Geliştirme: `ecari_sirket_demo`  
CI: Docker SQL Server veya LocalDB + migration script

**Canlı DB'de test yapmayın.**

---

## Sıradaki adım

Yayınlama: [11-YAYINLAMA-DEVOPS.md](./11-YAYINLAMA-DEVOPS.md)
