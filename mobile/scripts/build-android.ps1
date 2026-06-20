# E-Cari Android APK — release build
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not $env:JAVA_HOME) {
    $jbr = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path $jbr) { $env:JAVA_HOME = $jbr }
}

Push-Location $root
try {
    flutter pub get
    flutter build apk --release --split-per-abi
    $dist = Join-Path $root "dist"
    New-Item -ItemType Directory -Force -Path $dist | Out-Null
    Copy-Item "build\app\outputs\flutter-apk\app-arm64-v8a-release.apk" (Join-Path $dist "E-Cari-android.apk") -Force
    Copy-Item "build\app\outputs\flutter-apk\app-armeabi-v7a-release.apk" (Join-Path $dist "E-Cari-android-eski-telefon.apk") -Force
    Write-Host ""
    Write-Host "Hazir:"
    Write-Host "  dist\E-Cari-android.apk            (cogu telefon — arm64)"
    Write-Host "  dist\E-Cari-android-eski-telefon.apk (32-bit eski telefonlar)"
} finally {
    Pop-Location
}
