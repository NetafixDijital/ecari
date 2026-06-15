# E-Cari Mobil (Flutter)

iOS ve Android için E-Cari mobil uygulaması. Web paneli ile aynı modülleri destekler.

## Gereksinimler

1. [Flutter SDK](https://docs.flutter.dev/get-started/install/windows) (3.24+)
2. Android Studio emülatör **veya** fiziksel cihaz
3. Çalışan API: `http://localhost:5050` ([../README.md](../README.md))

```powershell
flutter doctor
```

## İlk kurulum

```powershell
cd c:\ecari\ecari\mobile
flutter pub get
```

Platform dosyaları yoksa:

```powershell
flutter create . --project-name ecari_mobile --org com.ecari
```

## API adresi

| Ortam | `API_BASE_URL` |
|--------|----------------|
| Android emülatör (varsayılan) | `http://10.0.2.2:5050` |
| Windows desktop / iOS simülatör | `http://localhost:5050` |
| Fiziksel telefon (aynı Wi‑Fi) | `http://{PC-IP}:5050` |

```powershell
flutter run -d windows --dart-define=API_BASE_URL=http://localhost:5050
```

## Demo giriş

| Alan | Değer |
|------|--------|
| E-posta | `admin@ecari.demo` |
| Şifre | `Demo123!` |
| Şirket | `demo` |

## Modüller

| Modül | Durum |
|-------|--------|
| Giriş / şirket seçimi | ✅ |
| Cari (liste, form, tahsilat BANK/ÇEK) | ✅ |
| Stok | ✅ |
| Fatura (satış + alış oluşturma) | ✅ |
| Sipariş / İrsaliye / Teklif | ✅ (dönüşüm + sil) |
| Hızlı Satış | ✅ |
| Servis | ✅ |
| Masraf (onay/ödeme) | ✅ |
| Görev (düzenle/tamamla/sil) | ✅ |
| Kasa / Banka / Çek | ✅ |
| Raporlar | ✅ |

## Klasör yapısı

```text
lib/
├── main.dart
├── core/           # API, auth, tema, menü
└── features/       # auth, cari, stk, inv, ord, dln, qot, svc, exp, tsk, chq, csh, bnk, finance, shell
```

Rehber: [../proje-rehberi/06-MOBIL-UYGULAMA.md](../proje-rehberi/06-MOBIL-UYGULAMA.md)
