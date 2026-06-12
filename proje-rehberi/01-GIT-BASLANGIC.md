# 01 — Git ile Başlangıç

Bu rehber, projeyi **Git** ile versiyonlayıp GitHub/GitLab'a koymanız içindir.

---

## 1. Git nedir? (1 cümle)

Projenin **tüm değişiklik geçmişini** tutar; geri dönüş, ekip çalışması ve yedek için kullanılır.

---

## 2. İlk kurulum (bir kez)

### Git yüklü mü?

PowerShell:

```powershell
git --version
```

Yoksa: https://git-scm.com/download/win

### Proje klasörü

```powershell
cd c:\ıvızr
```

---

## 3. Repo başlatma

```powershell
git init
git add .
git commit -m "Initial commit: E-Cari tasarim, DB scriptleri, proje rehberi"
```

### `.gitignore`

Proje kökünde `.gitignore` dosyası vardır. Şunları **commit etmeyin**:

- `bin/`, `obj/` (.NET derleme çıktıları)
- `.env`, `appsettings.Development.json` içindeki şifreler
- `*.user`, `.vs/`

---

## 4. Uzak repo (GitHub)

1. GitHub'da yeni repo: `ecari` (private önerilir)
2. Bağlantı:

```powershell
git remote add origin https://github.com/KULLANICI/ecari.git
git branch -M main
git push -u origin main
```

---

## 5. Branch stratejisi (basit)

| Branch | Amaç |
|--------|------|
| `main` | Canlıya hazır, stabil kod |
| `develop` | Günlük geliştirme |
| `feature/cari-api` | Tek özellik (Cari API) |
| `feature/stok-api` | Tek özellik (Stok) |

### Yeni özellik akışı

```powershell
git checkout develop
git pull
git checkout -b feature/cari-api
# ... kod yaz ...
git add .
git commit -m "feat(cari): liste ve olusturma endpoint"
git push -u origin feature/cari-api
# GitHub'da Pull Request → develop'a merge
```

---

## 6. Commit mesajı formatı

```text
feat(cari): yeni musteri ekleme endpoint
fix(auth): token suresi duzeltildi
docs: yeni musteri kurulum rehberi
chore: paket guncellemesi
```

| Önek | Anlam |
|------|--------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltme |
| `docs` | Sadece doküman |
| `chore` | Bakım, paket |

---

## 7. Projede commit edilecek klasörler

```text
ecari/
├── proje-rehberi/     ✅
├── design/html/       ✅ (statik HTML ekranlar)
├── docs/              ✅
├── database/          ✅
├── src/               ✅ (API kodu geldikçe)
├── ECari.sln          ✅
├── README.md          ✅
├── .gitignore         ✅
└── akinsoft-*.js      ❌ (E-Cari ile ilgili değil — repo dışı bırakın veya silin)
```

---

## 8. Sıradaki adım

Ortam kurulumu: [02-GELISITIRME-ORTAMI.md](./02-GELISITIRME-ORTAMI.md)
