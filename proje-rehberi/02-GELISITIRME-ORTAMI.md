# 02 — Geliştirme Ortamı

Bilgisayarınıza kurulması gereken yazılımlar.

---

## Zorunlu (Faz 1)

| Yazılım | Sürüm | Ne için |
|---------|--------|---------|
| **SQL Server** | 2019+ veya Express | Veritabanı |
| **SSMS** | Güncel | SQL script çalıştırma |
| **.NET SDK** | 8.0 | Backend API |
| **Visual Studio 2022** veya **VS Code** | — | Kod editörü |
| **Git** | — | Versiyon kontrol |

### Kontrol komutları

```powershell
dotnet --version    # 8.0.x
git --version
```

SQL Server: SSMS'te `localhost` bağlantısı.

---

## Faz 2+ (mobil)

| Yazılım | Ne için |
|---------|---------|
| **Flutter SDK** | iOS + Android |
| **Android Studio** | Android emülatör |
| **Xcode** (Mac) | iOS derleme |

```powershell
flutter --version
flutter doctor
```

---

## Faz 2+ (web)

| Seçenek | Not |
|---------|-----|
| **Node.js 20 LTS** | React seçilirse |
| Vite + React | Önerilen web stack |

---

## IDE önerisi

| Rol | Araç |
|-----|------|
| Backend | Visual Studio 2022 (Community) |
| Mobil | VS Code + Flutter extension |
| SQL | SSMS |
| API test | Postman veya Swagger (API içinde) |

---

## Ortam değişkenleri (API — ileride)

`src/ECari.Api/appsettings.Development.json` (örnek):

```json
{
  "ConnectionStrings": {
    "SystemDb": "Server=localhost;Database=ecari_system;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Secret": "GELISTIRME-ICIN-UZUN-GIZLI-ANAHTAR",
    "Issuer": "ecari.local",
    "Audience": "ecari.local"
  }
}
```

**Canlı şifreleri repoya koymayın.** Production'da sunucu ortam değişkeni veya Azure Key Vault.

---

## Proje çalıştırma (API hazır olunca)

```powershell
cd c:\ıvızr\src\ECari.Api
dotnet run
```

Tarayıcı: `https://localhost:7xxx/swagger`

---

## Sıradaki adım

Veritabanı: [03-VERITABANI.md](./03-VERITABANI.md)
