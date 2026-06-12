# 06 — Mobil Uygulama (Flutter)

iOS ve Android için **tek kod tabanı**.

---

## Ne zaman başlanır?

**Backend API** en azından şunlar hazır olunca:

- Login + şirket seçimi  
- Cari liste + yeni müşteri  

API olmadan mobil ekran yapmak zaman kaybıdır.

---

## Kurulum

1. Flutter SDK: https://docs.flutter.dev/get-started/install/windows  
2. `flutter doctor` — tüm ✓ olana kadar düzelt  
3. Android Studio (emülatör) veya fiziksel telefon  

---

## Proje oluşturma

```powershell
cd c:\ıvızr\src
flutter create ecari_mobile
cd ecari_mobile
flutter run
```

Solution'a eklemek zorunlu değil; ayrı klasör olarak kalabilir.

---

## Klasör yapısı (önerilen)

```text
lib/
├── main.dart
├── core/
│   ├── api/           # Dio client, interceptors
│   ├── auth/          # token storage
│   ├── config/        # base URL
│   └── theme/         # renkler, tipografi
├── features/
│   ├── auth/
│   │   ├── login_page.dart
│   │   └── company_select_page.dart
│   └── cari/
│       ├── cari_list_page.dart
│       ├── cari_form_page.dart
│       └── cari_repository.dart
└── shared/
    ├── widgets/
    └── enums/         # person_type, status UI eşlemesi
```

---

## Faz 1 ekranlar

| Ekran | SS referans | API |
|-------|-------------|-----|
| Giriş | — | POST /auth/login |
| Şirket seç | — | GET /auth/companies |
| Cari liste | `docs/ekran-goruntuleri/cari/02-liste.png` | GET /cari/accounts |
| Yeni müşteri | `docs/ekran-goruntuleri/cari/01-yeni-musteri.png` | POST /cari/accounts |

Alan eşlemesi: [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md)

---

## API bağlantısı

```dart
// Geliştirme
const baseUrl = 'https://10.0.2.2:5001';  // Android emülatör → localhost
// veya
const baseUrl = 'http://localhost:5000';
```

Her istekte header:

```text
Authorization: Bearer {accessToken}
```

Token `flutter_secure_storage` ile saklanır.

---

## Faz 2+ mobil ekranlar

| Modül | Öncelik |
|-------|---------|
| Stok arama / barkod | Yüksek |
| Görev listesi | Orta |
| Kasa / finans hareket (basit) | Orta |
| Fatura (tam form) | Düşük → web'de |

---

## Test

- Android emülatör veya gerçek cihaz  
- iOS: Mac + Xcode gerekir  

```powershell
flutter test
flutter analyze
```

---

## Sıradaki adım

Web: [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md)
