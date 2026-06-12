# E-Cari Mobil (Flutter)

iOS ve Android için E-Cari mobil uygulaması. **Faz 1:** giriş, şirket seçimi, cari liste, yeni cari.

## Gereksinimler

1. [Flutter SDK](https://docs.flutter.dev/get-started/install/windows) (3.24+)
2. Android Studio emülatör **veya** fiziksel cihaz
3. Çalışan API: `http://localhost:5050` ([../README.md](../README.md))

```powershell
flutter doctor
```

## İlk kurulum

Proje klasöründe platform dosyaları henüz yoksa:

```powershell
cd c:\ecari\ecari\mobile
flutter create . --project-name ecari_mobile --org com.ecari
flutter pub get
```

## API adresi

| Ortam | `API_BASE_URL` |
|--------|----------------|
| Android emülatör (varsayılan) | `http://10.0.2.2:5050` |
| Windows desktop / iOS simülatör | `http://localhost:5050` |
| Fiziksel telefon (aynı Wi‑Fi) | `http://{PC-IP}:5050` |

Örnek çalıştırma:

```powershell
# Android emülatör (varsayılan)
flutter run

# Windows masaüstü + localhost API
flutter run -d windows --dart-define=API_BASE_URL=http://localhost:5050

# Fiziksel cihaz
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5050
```

API'nin `Development` modunda CORS açık olduğundan emülatör/cihaz erişimi sorunsuz olmalıdır.

## Demo giriş

| Alan | Değer |
|------|--------|
| E-posta | `admin@ecari.demo` |
| Şifre | `Demo123!` |
| Şirket | `demo` |

## Klasör yapısı

```text
lib/
├── main.dart
├── core/           # API, auth, tema
└── features/
    ├── auth/       # Login, şirket seç
    └── cari/       # Liste + yeni cari
```

## Faz 2 (plan)

- Stok arama / barkod
- Görev listesi
- Kasa / tahsilat (basit)
- Fatura (web ağırlıklı)

Rehber: [../proje-rehberi/06-MOBIL-UYGULAMA.md](../proje-rehberi/06-MOBIL-UYGULAMA.md)
