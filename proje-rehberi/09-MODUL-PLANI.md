# 09 — Modül Planı (Faz 1–7)

Geliştirme sırası ve her fazın çıktısı.

---

## Genel yol haritası

```text
Faz 0  Doküman onayı          ✅
Faz 1  DB + Cari + Stok + API 🔲 ← şimdi
Faz 2  Belge zinciri          Teklif→Sipariş→İrsaliye→Fatura
Faz 3  Finans                 Kasa, Banka, Çek
Faz 4  E-Belge                EDM e-Fatura
Faz 5  Servis
Faz 6  Görev
Faz 7  Kullanıcı & Yetkiler   (temel auth Faz 1'de)
```

---

## Faz 1 — Çekirdek (mevcut hedef)

| Bileşen | DB | API | Mobil | Web |
|---------|----|----|-------|-----|
| Auth | sys_users | ✅ | ✅ | ✅ |
| Cari | cari_* | ✅ | ✅ | ✅ |
| Stok | stk_* | ✅ | kısmi | ✅ |
| Ayarlar | cfg_* | okuma | — | ✅ |

**DDL:** [database/01](../database/01-ecari_system.sql), [02](../database/02-ecari_sirket_demo.sql)

---

## Faz 2 — Belge zinciri

| Modül | Önek | UI SS |
|-------|------|-------|
| Teklif | qot_ | ekran-goruntuleri/teklif |
| Sipariş | ord_ | — |
| İrsaliye | dln_ | — |
| Fatura | inv_ | ekran-goruntuleri/fatura |

Web ağırlıklı; fatura satır grid karmaşık.

---

## Faz 3 — Finans

| Modül | Önek | UI SS |
|-------|------|-------|
| Kasa | csh_ | ekran-goruntuleri/kasa |
| Banka | bnk_ | — |
| Çek-Senet | chq_ | ekran-goruntuleri/cek |
| Finans hareket | fin_ | birleşik form |

Çek status DB: İngilizce (`PENDING`, `COLLECTED`…), UI Türkçe.

---

## Faz 4 — E-Belge

| Modül | Önek | Not |
|-------|------|-----|
| e-Fatura | ebl_ | EDM birincil |
| e-İrsaliye | ebl_ | |

---

## Faz 5 — Servis

`svc_` — servis kayıtları, cari bağlantısı.

---

## Faz 6 — Görev

| Önek | UI SS |
|------|-------|
| tsk_ | ekran-goruntuleri/gorev |

Mobil uygun: liste + yeni görev + hatırlatma.

---

## Faz 7 — Kullanıcı & Yetkiler (tam)

| Önek | UI SS |
|------|-------|
| auth_ | ekran-goruntuleri/kullanici |

Faz 1'de basit login; tam izin ağacı Faz 7.

---

## Modül bağımlılıkları

```text
core_, org_, cfg_  →  her şeyin temeli
cari_              →  fatura, çek, finans
stk_               →  fatura satırı, irsaliye
qot_ → ord_ → dln_ → inv_  (belge zinciri)
auth_              →  tüm ekranlar (Faz 7 tam)
```

---

## Her modül için standart iş listesi

1. DDL (varsa migration)  
2. Domain entity + DTO  
3. API CRUD + iş kuralları  
4. Swagger dokümantasyon  
5. Mobil ekran (saha uygunsa)  
6. Web ekran (ağır form varsa)  
7. SS ile görsel doğrulama  

---

## Sıradaki adım

Test: [10-TEST-VE-KALITE.md](./10-TEST-VE-KALITE.md)
