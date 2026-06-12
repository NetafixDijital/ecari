# E-Cari API entegrasyon testi
# Kullanım: .\scripts\test-api.ps1 [-BaseUrl http://localhost:5050]

param(
    [string]$BaseUrl = "http://localhost:5050",
    [string]$Email = "admin@ecari.demo",
    [string]$Password = "Demo123!",
    [string]$CompanyCode = "demo"
)

$ErrorActionPreference = "Stop"

function Test-Step($Name, $ScriptBlock) {
    Write-Host "`n== $Name ==" -ForegroundColor Cyan
    try {
        & $ScriptBlock
        Write-Host "OK" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $_" -ForegroundColor Red
        throw
    }
}

Test-Step "Health" {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
    if (-not $r.status) { throw "health yanıtı beklenmiyor" }
}

Test-Step "Login" {
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    $script:login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json; charset=utf-8"
    if (-not $script:login.accessToken) { throw "token alınamadı" }
}

$script:headers = @{ Authorization = "Bearer $($script:login.accessToken)" }

Test-Step "Select company" {
    $companies = Invoke-RestMethod -Uri "$BaseUrl/api/auth/companies" -Headers $script:headers
    $company = $companies | Where-Object { $_.code -eq $CompanyCode } | Select-Object -First 1
    if (-not $company) { throw "sirket kodu bulunamadi: $CompanyCode" }
    $body = @{ companyId = $company.id } | ConvertTo-Json
    $selected = Invoke-RestMethod -Uri "$BaseUrl/api/auth/select-company" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    if (-not $selected.accessToken) { throw "tenant token alinamadi" }
    $script:login.accessToken = $selected.accessToken
    $script:headers = @{ Authorization = "Bearer $($script:login.accessToken)" }
}

Test-Step "Cari list" {
    $cari = Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers
    Write-Host "  Cari sayısı: $($cari.Count)"
}

Test-Step "Stok list" {
    $stk = Invoke-RestMethod -Uri "$BaseUrl/api/stk/items" -Headers $script:headers
    Write-Host "  Stok sayısı: $($stk.Count)"
}

Test-Step "Satış faturaları" {
    $inv = Invoke-RestMethod -Uri "$BaseUrl/api/inv/invoices?type=SALES" -Headers $script:headers
    Write-Host "  Satış fatura sayısı: $($inv.Count)"
    if ($inv.Count -lt 1) { throw "demo fatura bulunamadi (03-faz2-inv-csh.sql calistirin)" }
}

Test-Step "Alış faturaları" {
    $inv = Invoke-RestMethod -Uri "$BaseUrl/api/inv/invoices?type=PURCHASE" -Headers $script:headers
    Write-Host "  Alış fatura sayısı: $($inv.Count)"
}

Test-Step "Kasa" {
    $kasa = Invoke-RestMethod -Uri "$BaseUrl/api/csh/accounts" -Headers $script:headers
    Write-Host "  Kasa sayısı: $($kasa.Count)"
    if ($kasa.Count -lt 1) { throw "demo kasa bulunamadi (03-faz2-inv-csh.sql calistirin)" }
}

Test-Step "Depo" {
    $depo = Invoke-RestMethod -Uri "$BaseUrl/api/cfg/warehouses" -Headers $script:headers
    Write-Host "  Depo sayısı: $($depo.Count)"
}

Test-Step "Sirket profili" {
    $cfg = Invoke-RestMethod -Uri "$BaseUrl/api/cfg/company-profile" -Headers $script:headers
    Write-Host "  Firma: $($cfg.legalName)"
}

Test-Step "Cari hareketler" {
    $mov = Invoke-RestMethod -Uri "$BaseUrl/api/cari/movements" -Headers $script:headers
    Write-Host "  Hareket sayisi: $($mov.Count)"
}

Test-Step "Tax rates + fatura olustur" {
    $tax = Invoke-RestMethod -Uri "$BaseUrl/api/core/tax-rates" -Headers $script:headers
    if ($tax.Count -lt 1) { throw "KDV orani bulunamadi" }
    $cariId = (Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers)[0].id
    $unitId = (Invoke-RestMethod -Uri "$BaseUrl/api/core/units" -Headers $script:headers)[0].id
    $body = @{
        invoiceType = "SALES"
        accountId = $cariId
        documentDate = (Get-Date).ToString("yyyy-MM-dd")
        dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
        notes = "API test faturasi"
        lines = @(@{
            description = "Test hizmet"
            quantity = 1
            unitId = $unitId
            unitPrice = 1000
            taxRateId = $tax[0].id
        })
    } | ConvertTo-Json -Depth 5
    $inv = Invoke-RestMethod -Uri "$BaseUrl/api/inv/invoices" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Olusturulan: $($inv.documentNo)"
    $script:lastInvoiceId = $inv.id
}

Test-Step "Fatura detay" {
    if (-not $script:lastInvoiceId) { throw "once fatura olusturulmali" }
    $detail = Invoke-RestMethod -Uri "$BaseUrl/api/inv/invoices/$($script:lastInvoiceId)" -Headers $script:headers
    Write-Host "  Detay: $($detail.documentNo) / $($detail.lines.Count) kalem"
}

Test-Step "Satis irsaliyeleri" {
    $dln = Invoke-RestMethod -Uri "$BaseUrl/api/dln/delivery-notes?type=SALES" -Headers $script:headers
    Write-Host "  Satis irsaliye sayisi: $($dln.Count)"
}

Test-Step "Irsaliye olustur" {
    $cariId = (Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers)[0].id
    $unitId = (Invoke-RestMethod -Uri "$BaseUrl/api/core/units" -Headers $script:headers)[0].id
    $body = @{
        documentType = "SALES"
        accountId = $cariId
        documentDate = (Get-Date).ToString("yyyy-MM-dd")
        shippingAddress = "API test adresi"
        lines = @(@{
            description = "Test urun"
            quantity = 1
            unitId = $unitId
        })
    } | ConvertTo-Json -Depth 5
    $dln = Invoke-RestMethod -Uri "$BaseUrl/api/dln/delivery-notes" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Olusturulan: $($dln.documentNo)"
}

Test-Step "Cari virman" {
    $caris = Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers
    if ($caris.Count -lt 2) { throw "virman icin en az 2 cari gerekli" }
    $body = @{
        sourceAccountId = $caris[0].id
        targetAccountId = $caris[1].id
        amount = 100
        transferDate = (Get-Date).ToString("yyyy-MM-dd")
        description = "API test virmani"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BaseUrl/api/cari/transfers" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Virman: $($caris[0].code) -> $($caris[1].code) / 100 TL"
}

Test-Step "Siparis listesi" {
    $ord = Invoke-RestMethod -Uri "$BaseUrl/api/ord/orders" -Headers $script:headers
    Write-Host "  Siparis sayisi: $($ord.Count)"
}

Test-Step "Siparis olustur" {
    $cariId = (Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers)[0].id
    $unitId = (Invoke-RestMethod -Uri "$BaseUrl/api/core/units" -Headers $script:headers)[0].id
    $taxId = (Invoke-RestMethod -Uri "$BaseUrl/api/core/tax-rates" -Headers $script:headers)[0].id
    $body = @{
        orderType = "SALES"
        accountId = $cariId
        documentDate = (Get-Date).ToString("yyyy-MM-dd")
        deliveryDate = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
        lines = @(@{
            description = "Test siparis kalemi"
            quantity = 2
            unitId = $unitId
            unitPrice = 500
            taxRateId = $taxId
        })
    } | ConvertTo-Json -Depth 5
    $ord = Invoke-RestMethod -Uri "$BaseUrl/api/ord/orders" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Olusturulan: $($ord.documentNo)"
}

Test-Step "Banka hesaplari" {
    $bnk = Invoke-RestMethod -Uri "$BaseUrl/api/bnk/accounts" -Headers $script:headers
    Write-Host "  Banka hesap sayisi: $($bnk.Count)"
    if ($bnk.Count -lt 1) { throw "demo banka bulunamadi (06-faz2-bnk.sql calistirin)" }
    $script:bankAccountId = $bnk[0].id
}

Test-Step "Banka hareketleri" {
    $tx = Invoke-RestMethod -Uri "$BaseUrl/api/bnk/transactions" -Headers $script:headers
    Write-Host "  Hareket sayisi: $($tx.Count)"
}

Test-Step "Stok hareketleri" {
    $mov = Invoke-RestMethod -Uri "$BaseUrl/api/stk/movements" -Headers $script:headers
    Write-Host "  Stok hareket sayisi: $($mov.Count)"
}

Test-Step "Servis listesi" {
    $svc = Invoke-RestMethod -Uri "$BaseUrl/api/svc/tickets" -Headers $script:headers
    Write-Host "  Servis kaydi sayisi: $($svc.Count)"
}

Test-Step "Servis olustur" {
    $cariId = (Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers)[0].id
    $body = @{
        accountId = $cariId
        deviceName = "Test Laptop"
        problemDescription = "API test servis kaydi"
        technicianName = "Teknisyen"
        priority = "NORMAL"
    } | ConvertTo-Json
    $svc = Invoke-RestMethod -Uri "$BaseUrl/api/svc/tickets" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Olusturulan: $($svc.ticketNo)"
}

Test-Step "Gorev listesi" {
    $tsk = Invoke-RestMethod -Uri "$BaseUrl/api/tsk/tasks" -Headers $script:headers
    Write-Host "  Gorev sayisi: $($tsk.Count)"
}

Test-Step "Gorev olustur" {
    $body = @{
        title = "API test gorevi"
        startDate = (Get-Date).ToString("yyyy-MM-dd")
        endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
        assigneeName = "Test Kullanici"
        priority = "NORMAL"
    } | ConvertTo-Json
    $tsk = Invoke-RestMethod -Uri "$BaseUrl/api/tsk/tasks" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Olusturulan: $($tsk.taskNo)"
}

Test-Step "Modul ayarlari" {
    $settings = Invoke-RestMethod -Uri "$BaseUrl/api/cfg/module-settings" -Headers $script:headers
    Write-Host "  Ayar sayisi: $($settings.Count)"
}

Test-Step "KDV raporu" {
    $kdv = Invoke-RestMethod -Uri "$BaseUrl/api/inv/kdv-report" -Headers $script:headers
    if ($null -eq $kdv.salesTaxTotal) { throw "kdv raporu beklenmiyor" }
    Write-Host "  Satis KDV: $($kdv.salesTaxTotal) | Net: $($kdv.netPayableTax)"
}

Test-Step "Cek listesi" {
    $cek = Invoke-RestMethod -Uri "$BaseUrl/api/chq/instruments?direction=RECEIVED" -Headers $script:headers
    Write-Host "  Tahsilat cek sayisi: $($cek.Count)"
}

Test-Step "Cek olustur" {
    $cariId = (Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers)[0].id
    $body = @{
        instrumentType = "CEK"
        direction = "RECEIVED"
        accountId = $cariId
        bankName = "Test Bank"
        instrumentNo = "CHK-TEST-$(Get-Random -Maximum 9999)"
        issueDate = (Get-Date).ToString("yyyy-MM-dd")
        dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
        amount = 1500
    } | ConvertTo-Json
    $cek = Invoke-RestMethod -Uri "$BaseUrl/api/chq/instruments" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers
    Write-Host "  Olusturulan: $($cek.instrumentNo)"
}

Test-Step "Cari tahsilat (kasa)" {
    $cariId = (Invoke-RestMethod -Uri "$BaseUrl/api/cari/accounts" -Headers $script:headers)[0].id
    $kasaId = (Invoke-RestMethod -Uri "$BaseUrl/api/csh/accounts" -Headers $script:headers)[0].id
    $body = @{
        accountId = $cariId
        paymentMethod = "CASH"
        amount = 50
        transactionDate = (Get-Date).ToString("yyyy-MM-dd")
        cashAccountId = $kasaId
        description = "API test tahsilat"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BaseUrl/api/cari/collections" -Method Post -Body $body -ContentType "application/json; charset=utf-8" -Headers $script:headers | Out-Null
    Write-Host "  Tahsilat (kasa) OK"
}

Test-Step "Dashboard ozeti" {
    $dash = Invoke-RestMethod -Uri "$BaseUrl/api/core/dashboard" -Headers $script:headers
    if ($null -eq $dash.totalIncome) { throw "dashboard ozeti beklenmiyor" }
    Write-Host "  Gelir: $($dash.totalIncome) | Gider: $($dash.totalExpense)"
}

Write-Host "`nTum API testleri basarili." -ForegroundColor Green
