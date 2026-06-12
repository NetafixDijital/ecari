# HTML Tasarım Dosyaları

Buraya **hazır statik HTML** ekranlarını koyacaksınız. Web uygulaması bu dosyalardan türetilir.

---

## Klasör yapısı (böyle düzenleyin)

```text
design/html/
├── README.md                 ← Bu dosya
├── assets/                   ← CSS, JS, img (ortak)
│   ├── css/
│   ├── js/
│   └── img/
├── shared/                   ← Ortak parçalar
│   ├── layout.html           ← Üst menü + sidebar iskelet
│   ├── login.html
│   └── components/           ← Modal, tablo, form parçaları
└── pages/                    ← Modül ekranları
    ├── cari/
    │   ├── 01-yeni-musteri.html
    │   ├── 02-liste.html
    │   └── 03-detay.html
    ├── stok/
    ├── fatura/
    ├── teklif/
    ├── kasa/
    ├── cek/
    ├── gorev/
    ├── kullanici/
    └── ayarlar/
```

---

## Dosya adlandırma

| Kural | Örnek |
|-------|--------|
| Küçük harf, tire | `01-yeni-musteri.html` |
| Sıra numarası + kısa ad | `02-liste.html` |
| Modül klasörü = menü adı | `pages/cari/` |

Ekran görüntüleri ile eşleşme: [docs/ekran-goruntuleri/](../../docs/ekran-goruntuleri/)

---

## Form alanları (zorunlu)

Her input/select/textarea için `name` veya `id` **veritabanı sütun adı** olmalı.

Referans: [docs/HTML-ALAN-REFERANSI.md](../../docs/HTML-ALAN-REFERANSI.md)

Örnek (Cari):

```html
<input type="radio" name="person_type" value="TUZEL_KISI" />
<input type="text" name="title" maxlength="300" />
<input type="text" name="tax_number" pattern="[0-9]{10}" />
<select name="city_id">...</select>
```

---

## Kontrol listesi (HTML'i koyduktan sonra)

- [ ] Her modül `pages/{modul}/` altında
- [ ] `assets/` ortak CSS/JS ayrı
- [ ] Form `name` alanları HTML-ALAN-REFERANSI ile uyumlu
- [ ] Liste tablolarında kolon başlıkları referansla eşleşiyor
- [ ] Tarayıcıda `layout.html` + sayfa açılıyor (404 yok)
- [ ] Mobil responsive (en azından cari/görev ekranları)

Detaylı adımlar: [proje-rehberi/03B-HTML-TASARIM.md](../../proje-rehberi/03B-HTML-TASARIM.md)

---

## Sonraki adım

HTML yerleştirdikten sonra sırayla:

1. [03B-HTML-TASARIM.md](../../proje-rehberi/03B-HTML-TASARIM.md) — doğrulama
2. [05-BACKEND-API.md](../../proje-rehberi/05-BACKEND-API.md) — API
3. [07-WEB-UYGULAMA.md](../../proje-rehberi/07-WEB-UYGULAMA.md) — HTML → React dönüşümü

Tam sıra: [proje-rehberi/TUM-ASAMALAR-SIRASI.md](../../proje-rehberi/TUM-ASAMALAR-SIRASI.md)
