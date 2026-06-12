# 00 — Proje Özeti

## E-Cari nedir?

**E-Cari**, Türkiye odaklı **ön muhasebe SaaS** uygulamasıdır. İnternet üzerinden aylık abonelikle kullanılır.

| Yapılabilir | Yapılamaz (şimdilik) |
|-------------|----------------------|
| Cari (müşteri/tedarikçi) | Tam muhasebe / yevmiye |
| Stok, fatura, teklif | |
| Kasa, banka, çek | |
| e-Fatura (EDM) | |
| Görev, kullanıcı yetkileri | |

---

## Kim kullanacak?

| Kullanıcı | Platform | Ne yapar |
|-----------|----------|----------|
| Saha satış / depo | **Mobil** (iOS + Android) | Cari ekle, stok bak, görev |
| Muhasebe / yönetici | **Web** | Fatura, rapor, ayarlar, e-belge |
| Platform siz | **Sunucu + DB** | Abonelik, yeni müşteri DB |

---

## Mimari (basit)

```text
  [Mobil App]     [Web App]
       \              /
        \            /
         [ REST API ]  ← ASP.NET Core
              |
    ┌─────────┴─────────┐
    │  ecari_system     │  kullanıcılar, şirketler
    │  ecari_sirket_A   │  müşteri A verisi
    │  ecari_sirket_B   │  müşteri B verisi
    └───────────────────┘
         SQL Server
```

Her abone müşterinin **ayrı veritabanı** vardır. Tek tabloda `tenant_id` kullanılmaz.

---

## Teknoloji seçimleri (onaylı)

| Katman | Teknoloji |
|--------|-----------|
| Veritabanı | SQL Server 2019+ |
| Backend | ASP.NET Core 8 Web API |
| Mobil | Flutter (tek kod → iOS + Android) |
| Web | React veya Blazor (Faz 2+) |
| Auth | JWT + refresh token |
| e-Fatura | EDM (Faz 4 birincil entegratör) |

---

## Modüller (kısa liste)

`cari_` Cari · `stk_` Stok · `inv_` Fatura · `qot_` Teklif · `ord_` Sipariş · `dln_` İrsaliye · `csh_` Kasa · `bnk_` Banka · `chq_` Çek · `tsk_` Görev · `auth_` Yetki

Detay: [09-MODUL-PLANI.md](./09-MODUL-PLANI.md)

---

## Geliştirme sırası (özet)

1. Git repo + ortam kurulumu  
2. Veritabanı (SSMS scriptleri)  
3. API: giriş → Cari → Stok → …  
4. Mobil: Cari ekranları  
5. Web: fatura ve ağır ekranlar  
6. Test + canlıya alma  

---

## İlgili dokümanlar

- Tam DB şeması: [docs/VERITABANI-TASARIM-DOKUMANI.md](../docs/VERITABANI-TASARIM-DOKUMANI.md)
- Form alanları: [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md)
- Sonraki adım: [01-GIT-BASLANGIC.md](./01-GIT-BASLANGIC.md)
