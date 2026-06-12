# E-Cari — UI Modül Özeti (Konuşmadaki Tüm SS’ler)

**Kaynak:** Kullanıcı tarafından paylaşılan ekran görüntüleri  
**İlişkili doküman:** [VERITABANI-TASARIM-DOKUMANI.md](./VERITABANI-TASARIM-DOKUMANI.md)  
**Versiyon:** 1.9 · Mimari kararlar onaylandı (SQL Server, database-per-customer)

Bu dosya, konuşmada paylaşılan tüm modülleri **tek yerde**, ekran → alan → veritabanı eşlemesiyle listeler.

---

## İçindekiler

1. [Cari](#1-cari)
2. [Stok](#2-stok)
3. [Fatura](#3-fatura)
4. [Kasa](#4-kasa)
5. [Teklif](#5-teklif)
6. [Görev](#6-görev)
7. [Çek & Finansal Hareket](#7-çek--finansal-hareket)
8. [Kullanıcı & Yetkiler](#8-kullanıcı--yetkiler)
9. [Modül → Tablo Hızlı Referans](#9-modül--tablo-hızlı-referans)

---

## 1. Cari

### 1.1 Yeni Müşteri Ekle (modal)

| UI Alanı | Z | DB Tablo.Sütun |
|----------|---|----------------|
| Müşteri Tipi (Tüzel / Gerçek) | E | `cari_accounts.person_type` |
| Unvan / Ad Soyad | E | `cari_accounts.title` |
| VKN / TCKN | E* | `tax_number` / `identity_number` |
| Vergi Dairesi | H | `tax_office` |
| Adres, İl, İlçe | H | `address_line`, `city_id`, `district_id` |
| E-posta, Telefon | H | `email`, `phone` |
| Cari Kodu | — | `code` (otomatik) |

### 1.2 Cari Liste

| Kolon | DB |
|-------|-----|
| Ünvan | `title` |
| Tip | `account_type` |
| Telefon | `phone` |
| Bakiye | `v_cari_account_balance` |

**Tablolar:** `cari_accounts`, `cari_addresses`, `cari_movements`

---

## 2. Stok

| Ekran | Öne çıkan alanlar | Tablolar |
|-------|-------------------|----------|
| Temel | Ürün adı, SKU, marka, barkod, tür, birim, tartılabilir, kategori, GTİP, menşe | `stk_items`, `stk_item_categories` |
| Konum | Raf, başlangıç stok, kritik seviye, HTML açıklama | `stk_stock_balances` |
| Fiyat | Muhasebe/perakende net-brüt, KDV | `stk_item_prices` |
| Varyasyon | Renk/beden, SKU | `stk_item_variants` |

---

## 3. Fatura

| Ekran | Öne çıkan alanlar | Tablolar |
|-------|-------------------|----------|
| Başlık | Müşteri, tür, tarih+saat, vade, irsaliye, indirim/vergi | `inv_invoices` |
| Satırlar | Ürün, miktar, fiyat, indirim, KDV, tutar | `inv_invoice_lines` |
| Açıklama | Not, sık kullanılanlar | `notes`, `inv_description_templates` |

---

## 4. Kasa

| Alan | DB |
|------|-----|
| Kasa adı, tip, bakiye yönü, tutar, para birimi, renk, aktif, resmi kasa, IBAN | `csh_accounts` |

---

## 5. Teklif

| Kolon | DB |
|-------|-----|
| Teklif no, müşteri, tutar, tarih, geçerlilik, yön, durum | `qot_quotations` |

---

## 6. Görev

| Ekran | Alanlar | Tablolar |
|-------|---------|----------|
| Liste | Durum, öncelik, atanan, ilerleme, özet kartlar | `tsk_tasks`, `v_tsk_task_stats` |
| Yeni | Başlık, tarih/saat, durum, öncelik, kullanıcılar, hatırlatma | `tsk_task_assignees` |

---

## 7. Çek & Finansal Hareket

| Ekran | Alanlar | Tablolar |
|-------|---------|----------|
| Portföy | Tahsilat/ödeme, toplam, bekleyen/gerçekleşen | `chq_instruments`, `v_chq_portfolio_stats` |
| Liste | Çek no, banka, müşteri, tutar, vade, durum | `v_chq_instrument_list` |
| Finansal hareket | Gelir/gider, kasa/banka, cari, ödeme yöntemi, vade | `fin_financial_transactions` |

---

## 8. Kullanıcı & Yetkiler

### 8.1 Kullanıcı Yönetimi (liste)

| UI Kolonu | DB |
|-----------|-----|
| Ad Soyad | `org_users.full_name` |
| E-posta | `org_users.email` |
| Telefon | `org_users.phone` |
| İzinler | `v_auth_user_list.permission_summary` |
| Oluşturulma Tarihi | `org_users.created_at` |
| Arama | `full_name`, `email` |

### 8.2 Yeni Kullanıcı (form)

| UI Alanı | Z | DB |
|----------|---|-----|
| Ad Soyad | E | `sys_users` + `org_users.full_name` |
| E-posta | E | `email` |
| Telefon | H | `phone` |
| Şifre | E | `sys_users.password_hash` |
| Şifre Tekrar | E | doğrulama |
| İzinler (ağaç) | H | `auth_user_permissions` |
| Şube kısıtı | H | `auth_user_branch_access` |

**Örnek izinler:**

| Grup | İzinler |
|------|---------|
| Ayarlar | Şirket Verilerini Sıfırla |
| Ana Sayfa | Ana Sayfayı Görüntüle |
| Firma Yönetimi | Görüntüle, Düzenle, Sil |
| Şubeler | Görüntüle, Oluştur |

**Şube kısıtı:**
- Seçim yok → max 3 şube (`default_branch_id` öncelikli)
- İşaretli şubeler → `DENY` (erişim yok)
- İşaretsiz şubeler → erişim var

### 8.3 Kayıt akışı

```text
sys_users → org_users → sys_user_companies
→ auth_user_permissions (checkbox)
→ auth_user_branch_access (şube)
→ auth_user_settings
```

**Tablolar:**

| Katman | Tablolar |
|--------|----------|
| Sistem DB | `sys_users`, `sys_user_companies` |
| Şirket DB | `org_users`, `auth_permissions`, `auth_user_permissions`, `auth_user_roles`, `auth_user_branch_access`, `auth_user_settings` |

---

## 9. Modül → Tablo Hızlı Referans

| Modül | Önek | Ana tablolar |
|-------|------|--------------|
| Cari | `cari_` | `cari_accounts`, `cari_movements` |
| Stok | `stk_` | `stk_items`, `stk_item_prices` |
| Fatura | `inv_` | `inv_invoices`, `inv_invoice_lines` |
| Kasa | `csh_` | `csh_accounts`, `csh_transactions` |
| Teklif | `qot_` | `qot_quotations` |
| Görev | `tsk_` | `tsk_tasks`, `tsk_task_assignees` |
| Çek | `chq_` | `chq_instruments` |
| Finans | `fin_` | `fin_financial_transactions` |
| Kullanıcı | `auth_` / `org_` | `org_users`, `auth_permissions`, `auth_user_permissions` |

---

## Uygulama Fazları

| Faz | Modüller |
|-----|----------|
| 1 | Cari, Stok, Ayarlar |
| 2 | Teklif, Sipariş, İrsaliye, Fatura |
| 3 | Kasa, Banka, Çek, Finans |
| 4 | E-Belge |
| 5 | Servis |
| 6 | Görev |
| 7 | Kullanıcı & Yetkiler |

---

*Tam şema: [VERITABANI-TASARIM-DOKUMANI.md](./VERITABANI-TASARIM-DOKUMANI.md) — Bölüm 4A, 27.19, 28.27–28.29*
