# 03B — HTML Tasarım (Statik Ekranlar)

Hazır HTML tasarımlarını projeye yerleştirme, doğrulama ve sonraki aşamalara hazırlık.

---

## Bu aşamada ne yapıyorsunuz?

Tasarımcıdan / sizden gelen **statik HTML** dosyalarını `design/html/` klasörüne koyuyorsunuz. Henüz API veya React yok — sadece görünüm ve form alan isimleri doğru olmalı.

---

## 1. Klasöre kopyala

Hedef konum:

```text
c:\ıvızr\design\html\
```

Yapı rehberi: [design/html/README.md](../design/html/README.md)

```powershell
# Örnek: dışarıdan kopyalama
Copy-Item -Recurse "D:\tasarim\ecari\*" "c:\ıvızr\design\html\"
```

---

## 2. Modül klasörlerini oluştur

Her modül için `pages/` altında klasör:

| Klasör | Ekranlar (Faz 1 öncelik) |
|--------|--------------------------|
| `pages/cari/` | yeni müşteri, liste, detay |
| `pages/stok/` | yeni ürün (4 sekme) |
| `pages/fatura/` | satış faturası |
| `pages/teklif/` | teklif listesi |
| `pages/kasa/` | kasa formu |
| `pages/cek/` | portföy, finans hareket |
| `pages/gorev/` | liste, yeni görev |
| `pages/kullanici/` | kullanıcı listesi, yetki ağacı |
| `pages/ayarlar/` | şirket kimlik kartı |
| `shared/` | login, layout, ortak modal |

---

## 3. Form alanlarını doğrula

Her ekran için [docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md) ile karşılaştırın.

### Cari örneği (`01-yeni-musteri.html`)

| HTML `name` | Olması gereken | ✓ |
|-------------|----------------|---|
| `person_type` | radio: TUZEL_KISI / GERCEK_KISI | |
| `title` | text, max 300 | |
| `tax_number` | text, 10 hane (tüzel) | |
| `identity_number` | text, 11 hane (gerçek) | |
| `tax_office` | text | |
| `address_line` | textarea | |
| `city_id` | select | |
| `district_id` | select | |
| `email` | email | |
| `phone` | tel | |

Eksik veya yanlış `name` varsa HTML'de düzeltin — API ve web bu isimleri kullanacak.

---

## 4. Liste ekranlarını doğrula

Tablo `<thead>` kolonları referansla eşleşmeli.

**Cari liste örneği:**

| Kolon (UI) | API/DB alanı |
|------------|--------------|
| Ünvan | `title` |
| Tip | `account_type` |
| Telefon | `phone` |
| Bakiye | `balance` (view) |

---

## 5. Ortak layout

`shared/layout.html` içinde olması gerekenler:

- Sol menü (modül linkleri)
- Üst bar (kullanıcı, şirket adı, çıkış)
- İçerik alanı (`<!-- content -->` veya iframe benzeri yapı)

Login ayrı: `shared/login.html`

---

## 6. Tarayıcıda test (API yok)

Statik dosyayı doğrudan açabilir veya basit sunucu:

```powershell
cd c:\ıvızr\design\html
python -m http.server 8080
# http://localhost:8080/pages/cari/02-liste.html
```

Kontrol:

- [ ] CSS/JS yolları kırık değil (`assets/` göreli path)
- [ ] Modal açılıyor
- [ ] Sekmeler (stok 4 sekme) çalışıyor
- [ ] Responsive (isteğe bağlı, mobil için ayrı akış var)

---

## 7. Git'e ekle

```powershell
cd c:\ıvızr
git add design/
git commit -m "design: statik HTML ekranlari eklendi"
```

---

## 8. HTML → sonraki aşamalar eşlemesi

| HTML dosyası | Sonraki adım | Rehber |
|--------------|--------------|--------|
| `shared/login.html` | Auth API | [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md) |
| `pages/cari/*.html` | Cari API + Web | [05-BACKEND-API.md](./05-BACKEND-API.md), [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) |
| `pages/stok/*.html` | Stok API | [09-MODUL-PLANI.md](./09-MODUL-PLANI.md) Faz 1 |
| Diğer modüller | Faz 2–7 | [09-MODUL-PLANI.md](./09-MODUL-PLANI.md) |

**Mobil:** Cari/görev ekranları HTML'den ilham alınır; Flutter ayrı kod — [06-MOBIL-UYGULAMA.md](./06-MOBIL-UYGULAMA.md)

---

## 9. Web'e dönüştürme (ileride — 07. aşama)

HTML hazır olduğunda web geliştirmede:

1. `layout.html` → React `Layout.tsx`
2. Her `pages/{modul}/*.html` → `{Modul}Page.tsx`
3. Form `name` → controlled input state
4. `fetch('/api/...')` ile API bağla

Detay: [07-WEB-UYGULAMA.md](./07-WEB-UYGULAMA.md) § "HTML'den dönüşüm"

---

## Sıradaki adım

Mimari: [04-MIMARI.md](./04-MIMARI.md) → API: [05-BACKEND-API.md](./05-BACKEND-API.md)

Tam liste: [TUM-ASAMALAR-SIRASI.md](./TUM-ASAMALAR-SIRASI.md)
