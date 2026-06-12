# E-Cari mobil web sunucusu — eski süreçleri kapatır, temiz başlatır.
# Sorun: 8080'de birden fazla flutter run kalırsa tarayıcı eski build'i gösterir veya donar.

$ErrorActionPreference = "Stop"
$Port = 8090
$ApiUrl = "http://localhost:5050"

Set-Location $PSScriptRoot\..\mobile

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "Flutter bulunamadi. PATH'e ekleyin: https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Red
    exit 1
}

# Eski dartvm web-server süreçlerini kapat (8080/8090)
Get-CimInstance Win32_Process -Filter "Name='dartvm.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'web-server' } |
    ForEach-Object {
        Write-Host "Eski sunucu kapatiliyor (PID $($_.ProcessId))..." -ForegroundColor Yellow
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

Start-Sleep -Seconds 2

Write-Host "`nMobil web baslatiliyor: http://localhost:$Port" -ForegroundColor Green
Write-Host "API: $ApiUrl`n" -ForegroundColor Cyan

flutter run -d web-server `
    --web-port=$Port `
    --web-hostname=0.0.0.0 `
    --dart-define=API_BASE_URL=$ApiUrl
