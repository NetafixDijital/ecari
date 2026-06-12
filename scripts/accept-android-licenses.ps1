# Android SDK lisanslarini etkilesimsiz kabul eder.
# Y/n sorusunda takilmamak icin Git'in yes.exe araci kullanilir.

$ErrorActionPreference = "Stop"
$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "$env:LOCALAPPDATA\Android\Sdk" }
$javaHome = "C:\Program Files\Android\Android Studio\jbr"
$yesExe = "C:\Program Files\Git\usr\bin\yes.exe"

if (-not (Test-Path $javaHome)) {
    Write-Host "Android Studio JBR bulunamadi. Once Android Studio kurun." -ForegroundColor Red
    exit 1
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$javaHome\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$sdkRoot\cmdline-tools\latest\bin;C:\flutter\bin;$env:Path"

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "Flutter bulunamadi. PATH'e C:\flutter\bin ekleyin." -ForegroundColor Red
    exit 1
}

flutter config --android-sdk $sdkRoot | Out-Null

if (Test-Path $yesExe) {
    Write-Host "Lisanslar kabul ediliyor (yes pipe)..." -ForegroundColor Cyan
    cmd /c "`"$yesExe`" | flutter doctor --android-licenses" | Out-Null
} else {
    Write-Host "Git yes.exe yok; statik lisans dosyalari yaziliyor..." -ForegroundColor Yellow
    $licDir = Join-Path $sdkRoot "licenses"
    New-Item -ItemType Directory -Force -Path $licDir | Out-Null
    @(
        "24333f8a63b6825ea9c5514f83c2829b004d1fee"
        "84831b9409646a918e305e642a3888868e7a1a3e"
        "504667f4c0de7af25198f5745384900d0d9648809"
    ) | Set-Content "$licDir\android-sdk-license" -Encoding ascii
}

Write-Host "Tamam. flutter doctor calistirin." -ForegroundColor Green
