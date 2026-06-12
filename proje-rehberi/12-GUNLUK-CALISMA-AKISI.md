# 12 — Günlük Çalışma Akışı

Ekip veya solo geliştirmede tekrarlanan rutin.

---

## Sabah (5 dk)

1. `git pull origin develop`  
2. SSMS / API / DB ayakta mı kontrol  
3. [09-MODUL-PLANI.md](./09-MODUL-PLANI.md) — bugün hangi modül/feature?  

---

## Özellik geliştirme döngüsü

```text
1. Git branch aç     feature/cari-list-api
2. DB gerekirse      database/ veya migration
3. API kod           src/ECari.*
4. Swagger test
5. (Varsa) mobil/web
6. Commit + push
7. Pull Request → develop
8. Merge
```

---

## Bug fix döngüsü

```text
1. branch: fix/cari-vkn-validation
2. Reproduce (Postman veya test)
3. Fix + unit test
4. PR → develop → main (hotfix ise)
```

---

## Doküman güncelleme

Kod değiştiyse ilgili MD güncellenir:

| Değişiklik | Güncelle |
|------------|----------|
| Yeni tablo | VERITABANI-TASARIM-DOKUMANI + SQL script |
| Yeni form alanı | HTML-ALAN-REFERANSI |
| Yeni endpoint | 05-BACKEND-API |
| Yeni ekran | UI-MODUL-OZETI + ekran-goruntuleri |

---

## Haftalık (30 dk)

- [ ] `develop` → `main` merge (stabil ise)  
- [ ] SQL backup kontrol  
- [ ] Açık PR'lar  
- [ ] Sonraki hafta modül hedefi  

---

## Yardım kaynakları

| Soru | Bak |
|------|-----|
| Terim ne demek? | [SOZLUK.md](./SOZLUK.md) |
| DB nasıl kurulur? | [03-VERITABANI.md](./03-VERITABANI.md) |
| Sıra ne? | [README.md](./README.md) |

---

## Şu an odak (2026-06)

```text
✅ Doküman + SQL
→  HTML tasarımı design/html/ klasörüne koy
→  Backend API (Auth + Cari)
→  Web: HTML → React + API
→  Mobil Cari ekranı
```

Tam checklist: [TUM-ASAMALAR-SIRASI.md](./TUM-ASAMALAR-SIRASI.md) · HTML: [03B-HTML-TASARIM.md](./03B-HTML-TASARIM.md)
