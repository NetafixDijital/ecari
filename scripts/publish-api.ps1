# E-Cari API — Plesk / IIS yayın paketi
# Çıktı: publish/api/ klasörünü Plesk'e yükleyin

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "$root\ECari.sln")) {
    $root = Split-Path -Parent $PSScriptRoot
}

$outDir = Join-Path $root "publish\api"
Write-Host "Publish: $outDir"

dotnet publish "$root\src\ECari.Api\ECari.Api.csproj" `
    -c Release `
    -o $outDir `
    --self-contained false

$prodExample = Join-Path $root "src\ECari.Api\appsettings.Production.json.example"
$prodTarget = Join-Path $outDir "appsettings.Production.json.example"
Copy-Item $prodExample $prodTarget -Force

Write-Host ""
Write-Host "Tamam. Sonraki adimlar:"
Write-Host "  1. publish\api\appsettings.Production.json olusturun (ornek dosyadan)"
Write-Host "  2. publish\api\ icerigini Plesk alt alan adi klasorune yukleyin"
Write-Host "  3. Vercel'de VITE_API_BASE_URL = https://api.sizin-domain.com"
