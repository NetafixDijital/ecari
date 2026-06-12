# 07 — Web Uygulama (Admin Panel)

Tarayıcıda çalışan **tam özellikli** yönetim arayüzü.

---

## Mobil vs Web

| | Mobil | Web |
|---|--------|-----|
| Kullanıcı | Saha, satış | Muhasebe, yönetici |
| Ekranlar | Cari, stok bak, görev | Fatura, e-belge, rapor, ayarlar |
| Karmaşıklık | Sade formlar | Çok satırlı grid, irsaliye bağlantı |

Aynı **REST API** kullanılır.

**Kaynak tasarım:** Statik HTML dosyaları [design/html/](../design/html/) klasöründedir. Web uygulaması bu HTML'den türetilir — sıfırdan çizilmez.

---

## HTML'den React'e dönüşüm (adım adım)

| Adım | HTML | Web (React) |
|------|------|---------------|
| 1 | `design/html/shared/layout.html` | `web/src/components/Layout.tsx` |
| 2 | `design/html/shared/login.html` | `web/src/pages/LoginPage.tsx` |
| 3 | `design/html/pages/cari/02-liste.html` | `web/src/pages/cari/CariListPage.tsx` |
| 4 | `design/html/pages/cari/01-yeni-musteri.html` | `web/src/pages/cari/CariFormModal.tsx` |
| 5 | CSS `assets/css/` | `web/src/styles/` veya Tailwind eşlemesi |

### Dönüşüm kuralları

1. **Form `name` değiştirme** — HTML'deki `name` = API JSON alanı ([HTML-ALAN-REFERANSI](../docs/HTML-ALAN-REFERANSI.md))
2. **Statik tablo satırları** → `map()` ile API'den gelen veri
3. **Modal / sekme JS** → React state (`useState`)
4. **Submit** → `axios.post('/api/cari/accounts', formData)`

### Modül sırası (web)

HTML dosyası hazır olan modülden başlayın:

```text
cari → stok → fatura → teklif → kasa → cek → gorev → kullanici → ayarlar
```

---

## Teknoloji seçenekleri

| Stack | Artı | Eksi |
|-------|------|------|
| **React + Vite + TypeScript** | Ekosistem geniş | Backend'den ayrı dil |
| **Blazor WebAssembly** | C# tek dil | Mobil kadar olgun değil |

**Öneri:** React + TypeScript (ekip web biliyorsa) veya Blazor (tam .NET ekibi).

---

## Proje konumu

```text
ecari/
└── web/
    ├── package.json
    ├── src/
    │   ├── api/
    │   ├── pages/
    │   │   ├── cari/
    │   │   ├── stok/
    │   │   ├── fatura/
    │   │   └── ayarlar/
    │   └── components/
    └── public/
```

---

## Faz planı (web)

| Faz | Ekranlar |
|-----|----------|
| W1 | Login, layout, Cari CRUD |
| W2 | Stok form (4 sekme — SS'ye uygun) |
| W3 | Satış faturası (başlık + satır grid) |
| W4 | Teklif listesi |
| W5 | Kasa, çek portföyü |
| W6 | Kullanıcı & yetkiler |
| W7 | e-Fatura (EDM) ayarları |

SS referans: [docs/ekran-goruntuleri/](../docs/ekran-goruntuleri/)

---

## UI ↔ DB

Form alanları birebir:

[docs/HTML-ALAN-REFERANSI.md](../docs/HTML-ALAN-REFERANSI.md)

Örnek: Fatura satır grid kolonları = `inv_invoice_lines` alanları.

---

## Auth (web)

- JWT `localStorage` veya `httpOnly cookie` (tercihen cookie + API SameSite)  
- Token süresi dolunca refresh veya login'e yönlendir  
- Şirket değiştirme: header menüden → select-company API  

Detay: [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md)

---

## Geliştirme (React örneği)

```powershell
cd c:\ıvızr
npm create vite@latest web -- --template react-ts
cd web
npm install axios react-router-dom
npm run dev
```

`.env.development`:

```text
VITE_API_URL=http://localhost:5000
```

---

## Sıradaki adım

Auth: [08-AUTH-VE-GUVENLIK.md](./08-AUTH-VE-GUVENLIK.md) · Modül sırası: [09-MODUL-PLANI.md](./09-MODUL-PLANI.md)
