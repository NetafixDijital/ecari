# E-Cari mobil kurulum
# Flutter SDK kurulu olmalı: https://docs.flutter.dev/get-started/install/windows

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..\mobile

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "Flutter bulunamadi. Once Flutter SDK kurun ve PATH'e ekleyin." -ForegroundColor Red
    Write-Host "https://docs.flutter.dev/get-started/install/windows"
    exit 1
}

Write-Host "Flutter doctor..." -ForegroundColor Cyan
flutter doctor

if (-not (Test-Path "android\app\build.gradle")) {
    Write-Host "Platform dosyalari olusturuluyor (flutter create)..." -ForegroundColor Cyan
    flutter create . --project-name ecari_mobile --org com.ecari
}

Write-Host "Paketler indiriliyor..." -ForegroundColor Cyan
flutter pub get

Write-Host "`nHazir. Ornek:" -ForegroundColor Green
Write-Host "  .\scripts\run-mobile-web.ps1"
Write-Host "  -> http://localhost:8090 (8080 kullanmayin; eski süreç kalintisi sorun cikarir)"
Write-Host "  flutter run -d windows --dart-define=API_BASE_URL=http://localhost:5050"
