/**
 * v1 HTML sayfalarini NexLink shell ile root'a donusturur.
 * node tools/convert-pages.js
 */
const fs = require('fs');
const path = require('path');

const v1Dir = path.join(__dirname, '..', 'v1');
const outDir = path.join(__dirname, '..');
const skip = new Set(['login.html', 'index.html']);

const shellHead = (title, extraCss) => `<!doctype html>
<html lang="tr" data-bs-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="assets/css/nexlink/app.css">
  ${extraCss || ''}
</head>`;

const shellBodyStart = `<body>
  <div class="page-layout">
    <div id="nl-sidebar-host"></div>
    <div class="layout-overlay"></div>
    <div id="nl-header-host"></div>
    <main class="app-wrapper">
      <div class="container-fluid">
        <div class="app-page-content">`;

const shellBodyEnd = `        </div>
        <div id="nl-footer-host"></div>
      </div>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="assets/js/nexlink/main.js"></script>
</body>
</html>`;

function extractContent(html) {
  const m = html.match(/<div class="container-xxl flex-grow-1 container-p-y">([\s\S]*?)<\/div>\s*<div id="app-footer"/);
  if (m) return m[1].trim();
  const m2 = html.match(/<div class="container-xxl flex-grow-1 container-p-y">([\s\S]*?)<\/div>\s*<div class="content-backdrop/);
  return m2 ? m2[1].trim() : null;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1] : 'e-Cari';
}

function extractExtraCss(html) {
  const links = [];
  const re = /<link[^>]+href="(assets\/css\/[^"]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== 'assets/css/app.css' && m[1].indexOf('nexlink') === -1) {
      links.push(`  <link rel="stylesheet" href="${m[1]}">`);
    }
  }
  return links.join('\n  ');
}

function extractPageAttrs(html) {
  const attrs = [];
  if (html.includes('cari-liste.js')) attrs.push('data-page-script="assets/js/cari-liste.js"');
  if (html.includes('servis-liste.js')) attrs.push('data-page-script="assets/js/servis-liste.js"');
  if (html.includes('hizli-satis.js')) attrs.push('data-page-script="assets/js/hizli-satis.js"');
  if (html.includes('ayarlar-menu.js')) attrs.push('data-page-script="assets/js/ayarlar-menu.js"');
  if (html.includes('dashboard-shortcuts.js')) attrs.push('data-page-script="assets/js/dashboard-shortcuts.js" data-page-init="DashboardShortcutsInit"');
  return attrs.join(' ');
}

let converted = 0;
let failed = [];

fs.readdirSync(v1Dir).filter(f => f.endsWith('.html')).forEach(file => {
  if (skip.has(file)) return;
  const html = fs.readFileSync(path.join(v1Dir, file), 'utf8');
  const content = extractContent(html);
  if (!content) {
    failed.push(file);
    return;
  }
  const title = extractTitle(html);
  const extraCss = extractExtraCss(html);
  const pageAttrs = extractPageAttrs(html);
  const out = [
    shellHead(title, extraCss),
    pageAttrs ? `<body ${pageAttrs}>` : shellBodyStart.replace('<body>', '<body>').split('\n')[0],
  ];

  // fix body tag with attrs
  const bodyOpen = pageAttrs ? `<body ${pageAttrs}>` : '<body>';
  const full = shellHead(title, extraCss) + '\n' + bodyOpen + '\n' +
    shellBodyStart.split('\n').slice(1).join('\n') + '\n' +
    content + '\n' +
    shellBodyEnd;

  fs.writeFileSync(path.join(outDir, file), full, 'utf8');
  converted++;
});

console.log('Converted:', converted);
if (failed.length) console.log('Failed:', failed.join(', '));
