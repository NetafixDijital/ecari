# E-Cari — HTML Alan Referansı (UI ↔ Veritabanı)

**Versiyon:** 1.0 · **Kaynak şema:** [VERITABANI-TASARIM-DOKUMANI.md](./VERITABANI-TASARIM-DOKUMANI.md) v1.9  
**Amaç:** HTML formları ve listeleri tasarlarken alanları **birebir** eşlemek.

> **Ekran görüntüleri:** [ekran-goruntuleri/](./ekran-goruntuleri/)

---

## Nasıl Kullanılır

| Sütun | Anlam |
|-------|-------|
| **UI Etiketi** | Kullanıcıya gösterilen Türkçe metin (`<label>`) |
| **HTML** | Önerilen input tipi / bileşen |
| **name / id** | Form alanı adı = DB sütun adı (camelCase veya snake_case proje standardına göre) |
| **Tablo** | SQL tablo adı |
| **Tip** | SQL Server veri tipi |
| **Z** | E = Zorunlu, H = İsteğe bağlı, — = Otomatik / gizli |
| **Doğrulama / Değerler** | maxlength, pattern, enum |

**Ortak sütunlar** (tüm ana tablolarda; formlarda genelde gizli):  
`id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `is_deleted`, `row_version`

**Zorunluluk kuralı:** Koşullu zorunluluklar parantez içinde belirtilmiştir.

---

## Modül İndeksi

| # | Modül | Önek | Ekranlar |
|---|-------|------|----------|
| 1 | [Cari](#1-cari-cari_) | `cari_` | Yeni müşteri, Liste, Detay kart |
| 2 | [Stok](#2-stok-stk_) | `stk_` | Yeni ürün (4 sekme), Varyasyon |
| 3 | [Fatura](#3-fatura-inv_) | `inv_` | Satış faturası, Satırlar, Açıklama |
| 4 | [Teklif](#4-teklif-qot_) | `qot_` | Satış teklifleri listesi |
| 5 | [Sipariş](#5-sipariş-ord_) | `ord_` | Başlık + satır |
| 6 | [İrsaliye](#6-irsaliye-dln_) | `dln_` | Başlık + satır |
| 7 | [Talep](#7-talep-req_) | `req_` | Başlık + satır |
| 8 | [Kasa](#8-kasa-csh_) | `csh_` | Yeni kasa |
| 9 | [Banka](#9-banka-bnk_) | `bnk_` | Hesap + hareket |
| 10 | [Çek & Finans](#10-çek--finans-chq__fin_) | `chq_`, `fin_` | Portföy, Liste, Finansal hareket |
| 11 | [Görev](#11-görev-tsk_) | `tsk_` | Liste, Yeni görev |
| 12 | [Kullanıcı & Yetki](#12-kullanıcı--yetki-auth_) | `auth_`, `org_` | Liste, Yeni kullanıcı |
| 13 | [Şirket Ayarları](#13-şirket-ayarları-cfg_) | `cfg_` | Firma kimlik kartı |
| 14 | [Enum Sözlüğü](#14-enum-sözlüğü) | — | Tüm sabit değerler |

---

## 1. Cari (`cari_`)

### 1.1 Yeni Müşteri Ekle (modal)

**Tablo:** `cari_accounts` (+ kayıtta `cari_addresses` varsayılan adres)

| # | UI Etiketi | HTML | name | Tablo | Tip | Z | Doğrulama / Değerler |
|---|------------|------|------|-------|-----|---|----------------------|
| 1 | Müşteri Tipi | radio | `person_type` | cari_accounts | NVARCHAR(20) | E | `TUZEL_KISI` · `GERCEK_KISI` |
| 2 | Unvan / Ad Soyad | text | `title` | cari_accounts | NVARCHAR(300) | E | max 300 |
| 3 | VKN | text | `tax_number` | cari_accounts | NVARCHAR(11) | E* | *Tüzel: 10 hane, pattern `[0-9]{10}` |
| 4 | TCKN | text | `identity_number` | cari_accounts | NVARCHAR(11) | E* | *Gerçek: 11 hane, pattern `[0-9]{11}` |
| 5 | Vergi Dairesi | text | `tax_office` | cari_accounts | NVARCHAR(100) | H | GİB sorgusundan doldurulabilir |
| 6 | Adres | textarea | `address_line` | cari_accounts | NVARCHAR(500) | H | Kayıtta `cari_addresses`'e kopyala |
| 7 | İl | select | `city_id` | cari_accounts | BIGINT FK | H | `core_cities` |
| 8 | İlçe | select | `district_id` | cari_accounts | BIGINT FK | H | `core_districts`, city_id'ye bağlı |
| 9 | E-posta | email | `email` | cari_accounts | NVARCHAR(254) | H | |
| 10 | Telefon | tel | `phone` | cari_accounts | NVARCHAR(30) | H | +90 format |
| — | Cari Kodu | hidden | `code` | cari_accounts | NVARCHAR(30) | — | Otomatik seri (M00001) |
| — | Cari Tipi | hidden | `account_type` | cari_accounts | NVARCHAR(20) | — | Varsayılan `CUSTOMER` |
| — | e-Fatura mükellefi | readonly | `is_einvoice_user` | cari_accounts | BIT | — | Kayıt sonrası async GİB |

**GİB akışı:** VKN/TCKN 10/11 hane → unvan sorgusu → `gib_title_fetched_at`. Kayıt sonrası → e-Fatura kontrolü → `gib_einvoice_checked_at`.

### 1.2 Cari Liste

| UI Kolonu | HTML | Veri kaynağı |
|-----------|------|--------------|
| Ad Soyad / Ticari Ünvan | text (readonly) | `cari_accounts.title` |
| Tip | badge | `account_type` → Müşteri, Tedarikçi… |
| Telefon | text | `phone` veya `mobile` |
| Bakiye | text (readonly) | `v_cari_account_balance.balance` |
| Arama | search input | `title`, `phone`, `email` LIKE |

### 1.3 Cari Detay Kartı (tam form — `cari_accounts`)

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Cari Kodu | text (readonly) | `code` | NVARCHAR(30) | E |
| Cari Tipi | select | `account_type` | NVARCHAR(20) | E |
| Cari Ünvanı | text | `title` | NVARCHAR(300) | E |
| Kısa Ad | text | `short_name` | NVARCHAR(100) | H |
| Kişi Tipi | radio | `person_type` | NVARCHAR(20) | E |
| Vergi Numarası | text | `tax_number` | NVARCHAR(11) | H |
| TC Kimlik No | text | `identity_number` | NVARCHAR(11) | H |
| Vergi Dairesi | text | `tax_office` | NVARCHAR(100) | H |
| Telefon | tel | `phone` | NVARCHAR(30) | H |
| Cep Telefonu | tel | `mobile` | NVARCHAR(30) | H |
| E-posta | email | `email` | NVARCHAR(254) | H |
| Cari Grubu | select | `account_group_id` | BIGINT FK | H |
| Para Birimi | select | `currency_id` | BIGINT FK | E |
| Ödeme Vadesi | select | `payment_term_id` | BIGINT FK | H |
| Kredi Limiti | number | `credit_limit` | DECIMAL(18,2) | H |
| Risk Limiti | number | `risk_limit` | DECIMAL(18,2) | H |
| İskonto Oranı (%) | number | `discount_rate` | DECIMAL(5,2) | H |
| Fiyat Listesi | select | `price_list_id` | BIGINT FK | H |
| e-Fatura Mükellefi | toggle | `is_einvoice_user` | BIT | E |
| e-Fatura Posta Kutusu | text | `einvoice_alias` | NVARCHAR(200) | H |
| Aktif | toggle | `is_active` | BIT | E |
| Notlar | textarea | `notes` | NVARCHAR(MAX) | H |

**Alt sekmeler:**

| Sekme | Tablo | Ana alanlar |
|-------|-------|-------------|
| Adresler | `cari_addresses` | address_type, title, address_line1/2, city_id, district_id, is_default |
| Yetkililer | `cari_contacts` | full_name, job_title, phone, mobile, email, is_primary |
| Banka | `cari_bank_accounts` | bank_name, iban, currency_id, is_default |

---

## 2. Stok (`stk_`)

### 2.1 Yeni Ürün — Sekme 1: Temel Bilgiler

**Tablo:** `stk_items`

| # | UI Etiketi | HTML | name | Tip | Z | Doğrulama |
|---|------------|------|------|-----|---|-----------|
| 1 | Ürün Adı | text | `name` | NVARCHAR(300) | E | max 300 |
| 2 | SKU | text | `code` | NVARCHAR(50) | H | Boşsa otomatik |
| 3 | Marka | text | `brand_name` | NVARCHAR(100) | H | |
| 4 | Barkod | text | `barcode` | NVARCHAR(50) | H | |
| 5 | Ürün Türü | select | `tracking_type` | NVARCHAR(20) | E | Takipli · Takipsiz · Hizmet |
| 6 | Birim | select | `base_unit_id` | BIGINT FK | E | `stk_units` |
| 7 | Tartılabilir Ürün | toggle | `is_weighable` | BIT | E | |
| 8 | Aktif | toggle | `is_active` | BIT | E | varsayılan true |
| 9 | Kategoriler | multi-select | — | — | H | `stk_item_categories` (category_id) |
| 10 | GTİP Kodu | text | `gtip_code` | CHAR(12) | H | 12 rakam |
| 11 | Menşe | text | `origin_country` | NVARCHAR(100) | H | varsayılan Türkiye |

**tracking_type → bayraklar:**

| UI | track_serial | track_lot |
|----|--------------|-----------|
| Takipli | 1 | 0 veya 1 |
| Takipsiz | 0 | 0 |
| Hizmet | 0 | 0 (`item_type=SERVICE`) |

### 2.2 Sekme 2: Stok ve Konum

| # | UI Etiketi | HTML | name | Tip | Z |
|---|------------|------|------|-----|---|
| 1 | Raf Numarası | text | `shelf_no` | NVARCHAR(50) | H |
| 2 | Başlangıç Stok Miktarı | number | `opening_quantity` | DECIMAL(18,4) | H | → `stk_stock_balances` |
| 3 | Kritik Stok Seviyesi | number | `min_stock_level` | DECIMAL(18,4) | H |
| 4 | Kritik stok uyarısı | toggle | `critical_alert_enabled` | BIT | E |
| 5 | Ürün Açıklaması | rich-text | `description_html` | NVARCHAR(MAX) | H | HTML editör |

### 2.3 Sekme 3–4: Fiyat Bilgileri

**Tablo:** `stk_item_prices` — her sekme ayrı satır (`price_category`)

| UI Etiketi | HTML | name | Tip | Z | Not |
|------------|------|------|-----|---|-----|
| — (sekme) | tab | `price_category` | NVARCHAR(20) | E | `MUHASEBE` veya `PERAKENDE` |
| Alış Net Fiyat | number | `purchase_net` | DECIMAL(18,4) | H | |
| Alış Brüt Fiyat | number | `purchase_gross` | DECIMAL(18,4) | H | |
| Satış Net Fiyat | number | `sales_net` | DECIMAL(18,4) | H | |
| Satış Brüt Fiyat | number | `sales_gross` | DECIMAL(18,4) | H | |
| KDV Oranı | select | `tax_rate_id` | BIGINT FK | E | KDV20, KDV10… |
| Para Birimi | select | `currency_id` | BIGINT FK | E | |

### 2.4 Ürün Varyasyonları

**Tablo:** `stk_item_variants`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Varyasyon Adı | text | `name` | NVARCHAR(200) | E |
| SKU | text | `sku` | NVARCHAR(50) | H |
| Barkod | text | `barcode` | NVARCHAR(50) | H |
| Renk / Beden | key-value | `attributes_json` | NVARCHAR(MAX) | H |
| Alış Fiyatı | number | `purchase_price` | DECIMAL(18,4) | H |
| Satış Fiyatı | number | `sales_price` | DECIMAL(18,4) | H |

---

## 3. Fatura (`inv_`)

### 3.1 Satış Faturası — Başlık

**Tablo:** `inv_invoices`

| # | UI Etiketi | HTML | name | Tip | Z |
|---|------------|------|------|-----|---|
| 1 | Müşteri Seç | autocomplete | `account_id` | BIGINT FK | E |
| 2 | Fatura Türü | select | `invoice_type` | NVARCHAR(30) | E | `SALES` |
| 3 | Para Birimi | select | `currency_id` | BIGINT FK | E |
| 4 | Fatura Tarihi | date | `document_date` | DATE | E |
| 5 | Fatura Saati | time | `document_time` | TIME(0) | E |
| 6 | Vade Tarihi | date | `due_date` | DATE | H |
| 7 | Sipariş Bilgileri | toggle | `is_order_info_enabled` | BIT | E |
| 8 | + İrsaliye Ekle | modal multi | — | — | H | `inv_invoice_delivery_links` |
| 9 | + İndirim/Vergi | modal | — | — | H | `inv_invoice_adjustments` |
| — | Fatura No | readonly | `document_no` | NVARCHAR(50) | — | Otomatik |
| — | Kalem | readonly | `line_count` | INT | — | Hesaplanan |
| — | Ara Toplam | readonly | `subtotal` | DECIMAL(18,2) | — | |
| — | KDV | readonly | `tax_total` | DECIMAL(18,2) | — | |
| — | Genel Toplam | readonly | `grand_total` | DECIMAL(18,2) | — | |

### 3.2 Fatura Satırları

**Tablo:** `inv_invoice_lines` (grid / tekrarlayan satır)

| # | UI Kolonu | HTML | name | Tip | Z |
|---|-----------|------|------|-----|---|
| 1 | Ürün/Hizmet | autocomplete | `item_id` | BIGINT FK | E |
| 2 | Açıklama | text | `description` | NVARCHAR(500) | E |
| 3 | Miktar | number | `quantity` | DECIMAL(18,4) | E | min 0.0001 |
| 4 | Birim | select | `unit_id` | BIGINT FK | E |
| 5 | Birim Fiyat | number | `unit_price` | DECIMAL(18,4) | E |
| 6 | İndirim (tip) | select | `discount_type` | NVARCHAR(20) | E | YOK · ORAN · TUTAR |
| 7 | İndirim (değer) | number | `discount_value` | DECIMAL(18,4) | H |
| 8 | KDV (%) | select | `tax_rate_id` | BIGINT FK | E | %0 · %1 · %10 · %20 |
| 9 | Tutar | readonly | `line_total` | DECIMAL(18,2) | — | Hesaplanan |
| 10 | Seri No | text | `serial_no` | — | H* | *track_serial=1 ise zorunlu |
| 11 | Lot No | text | `lot_no` | — | H* | *track_lot=1 ise zorunlu |

### 3.3 Belge Açıklaması

| UI Etiketi | HTML | name | Tablo | Tip | Z |
|------------|------|------|-------|-----|---|
| Fatura açıklaması | textarea | `notes` | inv_invoices | NVARCHAR(MAX) | H |
| Sık Kullanılanlar | dropdown | — | inv_description_templates | — | H | Seçilince notes'a kopyala |

---

## 4. Teklif (`qot_`)

### 4.1 Satış Teklifleri — Liste

**Filtre:** `document_type = 'SALES'`

| UI Kolonu | Veri kaynağı |
|-----------|--------------|
| Teklif No | `qot_quotations.document_no` |
| Müşteri | `cari_accounts.title` |
| Tutar | `grand_total` |
| Tarih | `document_date` |
| Geçerlilik | `valid_until` |
| Yön | `document_type` |
| Durum | `status` |
| Arama | `document_no`, müşteri adı |

### 4.2 Teklif Başlık (form)

**Tablo:** `qot_quotations`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Teklif No | readonly | `document_no` | NVARCHAR(50) | — |
| Teklif Tarihi | date | `document_date` | DATE | E |
| Geçerlilik Tarihi | date | `valid_until` | DATE | H |
| Yön | select | `document_type` | NVARCHAR(20) | E |
| Durum | select | `status` | NVARCHAR(20) | E |
| Müşteri | autocomplete | `account_id` | BIGINT FK | E |
| Para Birimi | select | `currency_id` | BIGINT FK | E |
| Genel Toplam | readonly | `grand_total` | DECIMAL(18,2) | — |

### 4.3 Teklif Satırı

**Tablo:** `qot_quotation_lines` — fatura satırı ile aynı yapı (`line_no`, `item_id`, `quantity`, `unit_id`, `unit_price`, `tax_rate_id`, `line_total`)

---

## 5. Sipariş (`ord_`)

**Tablo:** `ord_orders` + `ord_order_lines`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Sipariş No | readonly | `document_no` | NVARCHAR(50) | — |
| Sipariş Tarihi | date | `document_date` | DATE | E |
| Yön | select | `document_type` | NVARCHAR(20) | E | SALES · PURCHASE |
| Durum | select | `status` | NVARCHAR(20) | E |
| Cari | autocomplete | `account_id` | BIGINT FK | E |
| Teslim Tarihi | date | `delivery_date` | DATE | H |
| Depo | select | `warehouse_id` | BIGINT FK | H |
| Genel Toplam | readonly | `grand_total` | DECIMAL(18,2) | — |

**Satır:** `line_no`, `item_id`, `description`, `quantity`, `unit_id`, `unit_price`, `tax_rate_id`, `line_total`, `warehouse_id`

---

## 6. İrsaliye (`dln_`)

**Tablo:** `dln_delivery_notes` + `dln_delivery_note_lines`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| İrsaliye No | readonly | `document_no` | NVARCHAR(50) | — |
| İrsaliye Tarihi | date | `document_date` | DATE | E |
| Cari | autocomplete | `account_id` | BIGINT FK | E |
| Sevk Adresi | select | `shipping_address_id` | BIGINT FK | H |
| Depo | select | `warehouse_id` | BIGINT FK | E |
| Durum | select | `status` | NVARCHAR(20) | E |

**Satır:** `item_id`, `quantity`, `unit_id`, `serial_no`*, `lot_no`* (*takipli üründe zorunlu)

---

## 7. Talep (`req_`)

**Tablo:** `req_requisitions` + `req_requisition_lines`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Talep No | readonly | `document_no` | NVARCHAR(50) | — |
| Talep Tarihi | date | `request_date` | DATE | E |
| İhtiyaç Tarihi | date | `required_date` | DATE | H |
| Durum | select | `status` | NVARCHAR(20) | E |
| Talep Eden | select | `requester_id` | BIGINT FK | E |
| Departman | select | `department_id` | BIGINT FK | E |
| Öncelik | select | `priority` | NVARCHAR(20) | E |

---

## 8. Kasa (`csh_`)

### 8.1 Yeni Kasa Ekle

**Tablo:** `csh_accounts`

| # | UI Etiketi | HTML | name | Tip | Z | Doğrulama |
|---|------------|------|------|-----|---|-----------|
| 1 | Kasa Adı | text | `name` | NVARCHAR(100) | E | |
| 2 | Kasa Tipi | select | `cash_type` | NVARCHAR(30) | E | FIZIKI_KASA · POS · BANKA_BAGLI · DIGITAL |
| 3 | Bakiye Yönü | radio | `opening_balance_direction` | NVARCHAR(10) | H | GELIR · GIDER |
| 4 | Tutar | number | `opening_balance` | DECIMAL(18,2) | H | varsayılan 0 |
| 5 | Para Birimi | select | `currency_id` | BIGINT FK | E | TRY |
| 6 | Renk | color | `color_hex` | CHAR(7) | H | #RRGGBB |
| 7 | Aktif | toggle | `is_active` | BIT | E | |
| 8 | Resmi Kasa | toggle | `is_official` | BIT | E | |
| 9 | IBAN | text | `iban` | NVARCHAR(34) | H* | *BANKA_BAGLI zorunlu |
| — | Şube | hidden | `branch_id` | BIGINT FK | E | Sayfa bağlamı |
| — | Kasa Kodu | hidden | `code` | NVARCHAR(20) | — | Otomatik |

---

## 9. Banka (`bnk_`)

**Tablo:** `bnk_accounts`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Banka | select | `bank_id` | BIGINT FK | E |
| Hesap Adı | text | `account_name` | NVARCHAR(100) | E |
| IBAN | text | `iban` | NVARCHAR(34) | E | TR + 24 hane |
| Para Birimi | select | `currency_id` | BIGINT FK | E |
| Açılış Bakiyesi | number | `opening_balance` | DECIMAL(18,2) | H |
| Aktif | toggle | `is_active` | BIT | E |

---

## 10. Çek & Finans (`chq_`, `fin_`)

### 10.1 Çek Portföyü (özet ekran)

| UI | Veri |
|----|------|
| Tahsilatlar sekmesi | `direction = RECEIVED` |
| Ödemeler sekmesi | `direction = ISSUED` |
| Toplam Çek | `v_chq_portfolio_stats.check_count` |
| Toplam Tutar | SUM(`amount`) |
| Gerçekleşen | `status IN (COLLECTED, PAID)` |
| Bekleyen | `status IN (PENDING, PORTFOLIO)` |

### 10.2 Çek Listesi

| UI Kolonu | name | Tablo |
|-----------|------|-------|
| Çek No | `instrument_no` | chq_instruments |
| Banka | `bank_name` | chq_instruments |
| Müşteri | `account_id` → title | chq_instruments |
| Tutar | `amount` | chq_instruments |
| Vade Tarihi | `due_date` | chq_instruments |
| Durum | `status` | chq_instruments → UI etiket (§14) |

### 10.3 Yeni Finansal Hareket

**Tablo:** `fin_financial_transactions`

| # | UI Etiketi | HTML | name | Tip | Z |
|---|------------|------|------|-----|---|
| 1 | İşlem Tipi | radio | `transaction_type` | NVARCHAR(20) | E | GELIR · GIDER |
| 2 | İşlem Tarihi | datetime-local | `transaction_datetime` | DATETIME2 | E |
| 3 | Kasa/Banka | select | `cash_account_id` / `bank_account_id` | BIGINT FK | H* |
| 4 | Tutar | number | `amount` | DECIMAL(18,2) | E |
| 5 | Vade Tarihi | date | `due_date` | DATETIME2 | H | çek/senet |
| 6 | Müşteri/Tedarikçi | autocomplete | `account_id` | BIGINT FK | H |
| 7 | Ödeme Yöntemi | select | `payment_method` | NVARCHAR(30) | E | NAKIT · CEK · SENET · HAVALE · KREDI_KARTI |
| 8 | Para Birimi | select | `currency_id` | BIGINT FK | E |
| 9 | Referans Belge No | text | `reference_document_no` | NVARCHAR(50) | H |
| 10 | Açıklama | textarea | `description` | NVARCHAR(MAX) | H |

### 10.4 Çek/Senet Kaydı

**Tablo:** `chq_instruments`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Belge Tipi | select | `instrument_type` | NVARCHAR(20) | E | CEK · SENET |
| Yön | hidden/select | `direction` | NVARCHAR(20) | E | RECEIVED · ISSUED |
| Cari | autocomplete | `account_id` | BIGINT FK | E |
| Banka Adı | text | `bank_name` | NVARCHAR(100) | H |
| Çek No | text | `instrument_no` | NVARCHAR(30) | E |
| Keşide Tarihi | date | `issue_date` | DATE | E |
| Vade Tarihi | date | `due_date` | DATE | E |
| Tutar | number | `amount` | DECIMAL(18,2) | E |
| Durum | select (readonly) | `status` | NVARCHAR(30) | E | DB: EN kod |

---

## 11. Görev (`tsk_`)

### 11.1 Görev Listesi

| UI Kolonu | Veri kaynağı |
|-----------|--------------|
| Görev | `tsk_tasks.title` |
| Durum | `status` |
| Öncelik | `priority` |
| Atanan | `tsk_task_assignees` → full_name |
| Tarih | `start_date` / `end_date` |
| İlerleme | `progress_percent` |
| Arama | `title`, `description` |

**Özet kartları:** Toplam · Devam Eden · Tamamlanan · Gecikmiş (`v_tsk_task_stats`)

### 11.2 Yeni Görev

**Tablo:** `tsk_tasks` + `tsk_task_assignees`

| # | UI Etiketi | HTML | name | Tip | Z |
|---|------------|------|------|-----|---|
| 1 | Görev Başlığı | text | `title` | NVARCHAR(200) | E |
| 2 | Açıklama | textarea | `description` | NVARCHAR(MAX) | H |
| 3 | Notlar | textarea | `notes` | NVARCHAR(MAX) | H |
| 4 | Tüm Gün | toggle | `is_all_day` | BIT | E |
| 5 | Başlangıç Tarihi | date | `start_date` | DATE | E |
| 6 | Bitiş Tarihi | date | `end_date` | DATE | E |
| 7 | Başlangıç Saati | time | `start_time` | TIME | H* | *is_all_day=0 |
| 8 | Bitiş Saati | time | `end_time` | TIME | H* | |
| 9 | Durum | select | `status` | NVARCHAR(20) | E | varsayılan BEKLIYOR |
| 10 | Öncelik | select | `priority` | NVARCHAR(20) | E | varsayılan ORTA |
| 11 | Kullanıcılar | multi-select | — | tsk_task_assignees | H | org_user_id |
| 12 | Hatırlatma | select | `reminder_minutes_before` | INT | H | 0 · 15 · 30 · 60 · 1440 |

---

## 12. Kullanıcı & Yetki (`auth_`, `org_`)

### 12.1 Kullanıcı Listesi

| UI Kolonu | Veri kaynağı |
|-----------|--------------|
| Ad Soyad | `org_users.full_name` |
| E-posta | `org_users.email` |
| Telefon | `org_users.phone` |
| İzinler | `v_auth_user_list.permission_summary` |
| Oluşturulma Tarihi | `org_users.created_at` |
| Arama | `full_name`, `email` |

### 12.2 Yeni Kullanıcı

| # | UI Etiketi | HTML | name | Tablo | Tip | Z |
|---|------------|------|------|-------|-----|---|
| 1 | Ad Soyad | text | `full_name` | sys_users + org_users | NVARCHAR(200) | E |
| 2 | E-posta | email | `email` | sys_users + org_users | NVARCHAR(254) | E |
| 3 | Telefon | tel | `phone` | sys_users + org_users | NVARCHAR(30) | H |
| 4 | Şifre | password | `password` | — | — | E | hash → sys_users.password_hash |
| 5 | Şifre Tekrar | password | `password_confirm` | — | — | E | DB'ye yazılmaz |
| 6 | İzinler | checkbox-tree | — | auth_user_permissions | — | H | permission_id, is_granted=1 |
| 7 | Şube Erişim Kısıtlamaları | checkbox-list | — | auth_user_branch_access | — | H | branch_id, access_rule=DENY |

**İzin ağacı (örnek):**

| Grup | İzin kodu |
|------|-----------|
| Ayarlar | SETTINGS.RESET_COMPANY |
| Ana Sayfa | HOME.VIEW |
| Firma Yönetimi | COMPANY.VIEW · COMPANY.EDIT · COMPANY.DELETE |
| Şubeler | BRANCH.VIEW · BRANCH.CREATE |

---

## 13. Şirket Ayarları (`cfg_`)

**Tablo:** `cfg_company_profile`

| UI Etiketi | HTML | name | Tip | Z |
|------------|------|------|-----|---|
| Ticari Unvan | text | `legal_name` | NVARCHAR(300) | E |
| Kısa Ticari Ad | text | `trade_name` | NVARCHAR(300) | H |
| Vergi Numarası (VKN) | text | `tax_number` | NVARCHAR(11) | E |
| Vergi Dairesi | text | `tax_office` | NVARCHAR(100) | E |
| Adres | textarea | `address` | NVARCHAR(500) | E |
| İl / İlçe | select | `city_id`, `district_id` | BIGINT FK | E |
| Telefon | tel | `phone` | NVARCHAR(30) | H |
| E-posta | email | `email` | NVARCHAR(254) | H |
| Varsayılan Para Birimi | select | `default_currency_id` | BIGINT FK | E |
| e-Fatura Mükellefi | toggle | `is_einvoice_user` | BIT | E |
| e-Fatura Posta Kutusu | text | `einvoice_alias` | NVARCHAR(200) | H |

---

## 14. Enum Sözlüğü

### Cari

| Alan | DB değeri | UI etiketi |
|------|-----------|------------|
| person_type | TUZEL_KISI | Tüzel Kişi |
| person_type | GERCEK_KISI | Gerçek Kişi |
| account_type | CUSTOMER | Müşteri |
| account_type | SUPPLIER | Tedarikçi |
| account_type | BOTH | Her İkisi |

### Stok

| Alan | DB değeri | UI etiketi |
|------|-----------|------------|
| tracking_type | TAKIPLI | Takipli |
| tracking_type | TAKIPSIZ | Takipsiz |
| tracking_type | HIZMET | Hizmet |
| price_category | MUHASEBE | Muhasebe Fiyatları |
| price_category | PERAKENDE | Perakende Fiyatları |

### KDV (seed)

| Kod | Oran |
|-----|------|
| KDV20 | %20 (ana) |
| KDV10 | %10 |
| KDV1 | %1 |
| KDV0 | %0 |

### Teklif

| status | UI |
|--------|-----|
| DRAFT | Taslak |
| SENT | Gönderildi |
| ACCEPTED | Kabul |
| REJECTED | Red |
| EXPIRED | Süresi Doldu |
| CANCELLED | İptal |
| CONVERTED | Siparişe Dönüştü |

### Görev

| status | UI | priority | UI |
|--------|-----|----------|-----|
| BEKLIYOR | Bekliyor | DUSUK | Düşük |
| DEVAM_EDIYOR | Devam Ediyor | ORTA | Orta |
| TAMAMLANDI | Tamamlandı | YUKSEK | Yüksek |
| IPTAL | İptal | ACIL | Acil |

### Çek (DB → UI)

| DB status | UI etiketi |
|-----------|------------|
| PENDING | Beklemede |
| PORTFOLIO | Portföyde |
| COLLECTED | Tahsil edildi |
| PAID | Ödendi |
| BOUNCED | Karşılıksız |
| ENDORSED | Ciro edildi |

| instrument_type | UI |
|-----------------|-----|
| CEK | Çek |
| SENET | Senet |

### Kasa

| cash_type | UI |
|-----------|-----|
| FIZIKI_KASA | Fiziki Kasa |
| POS | POS |
| BANKA_BAGLI | Banka Bağlantılı |
| DIGITAL | Dijital Kasa |

| opening_balance_direction | UI |
|---------------------------|-----|
| GELIR | Gelir (giriş) |
| GIDER | Gider (çıkış) |

### Finans

| transaction_type | UI |
|------------------|-----|
| GELIR | Gelir |
| GIDER | Gider |

| payment_method | UI |
|----------------|-----|
| NAKIT | Nakit |
| CEK | Çek |
| SENET | Senet |
| HAVALE | Havale/EFT |
| KREDI_KARTI | Kredi Kartı |

---

## HTML Form Şablonu (örnek)

```html
<!-- Cari: Yeni Müşteri -->
<form id="frmCariAccount" data-table="cari_accounts">
  <fieldset>
    <legend>Müşteri Tipi</legend>
    <label><input type="radio" name="person_type" value="TUZEL_KISI" required> Tüzel Kişi</label>
    <label><input type="radio" name="person_type" value="GERCEK_KISI"> Gerçek Kişi</label>
  </fieldset>

  <label for="title">Unvan / Ad Soyad *</label>
  <input type="text" id="title" name="title" maxlength="300" required>

  <label for="tax_number">VKN</label>
  <input type="text" id="tax_number" name="tax_number" pattern="[0-9]{10}" maxlength="11">

  <label for="identity_number">TCKN</label>
  <input type="text" id="identity_number" name="identity_number" pattern="[0-9]{11}" maxlength="11">

  <label for="email">E-posta</label>
  <input type="email" id="email" name="email" maxlength="254">

  <label for="phone">Telefon</label>
  <input type="tel" id="phone" name="phone" maxlength="30">

  <input type="hidden" name="account_type" value="CUSTOMER">
  <!-- code: sunucu tarafında otomatik -->
</form>
```

---

## Modül → Tablo Hızlı Referans

| Modül | Ana tablolar |
|-------|--------------|
| Cari | `cari_accounts`, `cari_addresses`, `cari_movements` |
| Stok | `stk_items`, `stk_item_prices`, `stk_item_variants`, `stk_stock_movements` |
| Fatura | `inv_invoices`, `inv_invoice_lines`, `inv_invoice_adjustments` |
| Teklif | `qot_quotations`, `qot_quotation_lines` |
| Sipariş | `ord_orders`, `ord_order_lines` |
| İrsaliye | `dln_delivery_notes`, `dln_delivery_note_lines` |
| Talep | `req_requisitions`, `req_requisition_lines` |
| Kasa | `csh_accounts`, `csh_transactions` |
| Banka | `bnk_accounts`, `bnk_transactions` |
| Çek | `chq_instruments`, `chq_portfolios` |
| Finans | `fin_financial_transactions` |
| Görev | `tsk_tasks`, `tsk_task_assignees` |
| Kullanıcı | `org_users`, `auth_user_permissions`, `auth_user_branch_access` |
| Ayarlar | `cfg_company_profile`, `cfg_module_settings` |

---

*Tam teknik şema, ilişkiler ve kayıt akışları: [VERITABANI-TASARIM-DOKUMANI.md](./VERITABANI-TASARIM-DOKUMANI.md)*
