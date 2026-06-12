'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TABLES_DIR = path.join(ROOT, 'assets', 'json', 'tables');
const DATA_JS = path.join(ROOT, 'assets', 'js', 'datatables-data.js');

const GOREV_STATUS_UI_TO_DB = { yapilacak: 'BEKLIYOR', devam_ediyor: 'DEVAM_EDIYOR', gecikti: 'GECIKTI', tamamlandi: 'TAMAMLANDI', iptal: 'IPTAL' };
const GOREV_STATUS_DB_TO_UI = { BEKLIYOR: 'yapilacak', DEVAM_EDIYOR: 'devam_ediyor', GECIKTI: 'gecikti', TAMAMLANDI: 'tamamlandi', IPTAL: 'iptal' };
const GOREV_PRIORITY_UI_TO_DB = { dusuk: 'DUSUK', normal: 'ORTA', yuksek: 'YUKSEK' };
const GOREV_PRIORITY_DB_TO_UI = { DUSUK: 'dusuk', ORTA: 'normal', YUKSEK: 'yuksek', ACIL: 'yuksek' };
const MASRAF_STATUS_UI_TO_DB = { onay_bekliyor: 'ONAY_BEKLIYOR', onaylandi: 'ONAYLANDI', reddedildi: 'REDDEDILDI', odendi: 'ODENDI' };
const MASRAF_STATUS_DB_TO_UI = { ONAY_BEKLIYOR: 'onay_bekliyor', ONAYLANDI: 'onaylandi', REDDEDILDI: 'reddedildi', ODENDI: 'odendi' };
const INVOICE_PAYMENT_UI_TO_DB = { odendi: 'ODENDI', bekliyor: 'BEKLIYOR', vadesi_gecmis: 'VADESI_GECMIS', kismi: 'KISMI' };
const INVOICE_PAYMENT_DB_TO_UI = { ODENDI: 'odendi', BEKLIYOR: 'bekliyor', VADESI_GECMIS: 'vadesi_gecmis', KISMI: 'kismi' };
const DELIVERY_STATUS_UI_TO_DB = { sevkte: 'SEVKTE', teslim: 'TESLIM', hazirlaniyor: 'HAZIRLANIYOR', bekliyor: 'BEKLIYOR', iptal: 'IPTAL' };
const DELIVERY_STATUS_DB_TO_UI = { SEVKTE: 'sevkte', TESLIM: 'teslim', HAZIRLANIYOR: 'hazirlaniyor', BEKLIYOR: 'bekliyor', IPTAL: 'iptal' };

function uiStatus(row) { return row.status || row.durum || ''; }

function normalizeItem(row) {
  const stockStatus = row.stock_status || (uiStatus(row) === 'kritik' ? 'kritik' : (uiStatus(row) === 'pasif' || row.is_active === false ? 'pasif' : 'aktif'));
  return {
    id: row.id,
    code: row.code || row.stok_kod || '',
    name: row.name || row.urun || '',
    base_unit_name: row.base_unit_name || row.birim || 'Adet',
    quantity_on_hand: row.quantity_on_hand != null ? row.quantity_on_hand : (row.miktar || '0'),
    purchase_gross: row.purchase_gross != null ? row.purchase_gross : (row.alis || '0.00'),
    sales_gross: row.sales_gross != null ? row.sales_gross : (row.satis || '0.00'),
    price_category: row.price_category || 'MUHASEBE',
    currency_id: row.currency_id != null ? row.currency_id : 1,
    tracking_type: row.tracking_type || 'TAKIPSIZ',
    is_active: row.is_active != null ? row.is_active : stockStatus !== 'pasif',
    stock_status: stockStatus,
    durum: stockStatus
  };
}

function normalizeTask(row) {
  const uiStatusVal = uiStatus(row) || 'yapilacak';
  const uiPriority = row.oncelik || GOREV_PRIORITY_DB_TO_UI[row.priority] || 'normal';
  return {
    id: row.id,
    task_code: row.task_code || row.gorev_no || '',
    title: row.title || row.baslik || '',
    assignee_name: row.assignee_name || row.atanan || '—',
    priority: row.priority || GOREV_PRIORITY_UI_TO_DB[uiPriority] || 'ORTA',
    oncelik: uiPriority,
    end_date: row.end_date || row.son_tarih || '',
    start_date: row.start_date || row.olusturma || '',
    task_status: row.task_status || GOREV_STATUS_UI_TO_DB[uiStatusVal] || 'BEKLIYOR',
    status: uiStatusVal,
    durum: uiStatusVal
  };
}

function normalizeExpense(row) {
  const uiStatusVal = uiStatus(row) || 'onay_bekliyor';
  const refNo = row.reference_document_no || row.masraf_no || '';
  return {
    id: row.id,
    reference_document_no: refNo,
    masraf_no: refNo,
    transaction_type: 'GIDER',
    description: row.description || row.aciklama || '',
    aciklama: row.aciklama || row.description || '',
    expense_category: row.expense_category || row.kategori || 'diger',
    kategori: row.kategori || row.expense_category || 'diger',
    amount: row.amount != null ? row.amount : (row.tutar || '0.00'),
    tutar: row.tutar != null ? row.tutar : (row.amount || '0.00'),
    transaction_datetime: row.transaction_datetime || row.tarih || '',
    tarih: row.tarih || row.transaction_datetime || '',
    requester_name: row.requester_name || row.talep_eden || '—',
    talep_eden: row.talep_eden || row.requester_name || '—',
    payment_method: row.payment_method || 'NAKIT',
    currency_id: row.currency_id != null ? row.currency_id : 1,
    approval_status: row.approval_status || MASRAF_STATUS_UI_TO_DB[uiStatusVal] || 'ONAY_BEKLIYOR',
    status: uiStatusVal,
    durum: uiStatusVal
  };
}

function normalizeInvoice(row, defaultType) {
  const uiPayStatus = uiStatus(row) || 'bekliyor';
  const invType = row.invoice_type || defaultType || 'SALES';
  const docNo = row.document_no || row.fatura_no || '';
  return {
    id: row.id,
    document_no: docNo,
    fatura_no: docNo,
    invoice_type: invType,
    account_title: row.account_title || row.cari || '',
    cari: row.cari || row.account_title || '',
    document_date: row.document_date || row.tarih || '',
    tarih: row.tarih || row.document_date || '',
    due_date: row.due_date || row.vade || '',
    vade: row.vade || row.due_date || '',
    grand_total: row.grand_total != null ? row.grand_total : (row.tutar || '0.00'),
    tutar: row.tutar != null ? row.tutar : (row.grand_total || '0.00'),
    tax_total: row.tax_total != null ? row.tax_total : (row.kdv || ''),
    kdv: row.kdv != null ? row.kdv : (row.tax_total || ''),
    tax_rate_percent: row.tax_rate_percent || row.oran || '',
    oran: row.oran || row.tax_rate_percent || '',
    payment_status: row.payment_status || INVOICE_PAYMENT_UI_TO_DB[uiPayStatus] || 'BEKLIYOR',
    currency_id: row.currency_id != null ? row.currency_id : 1,
    status: uiPayStatus,
    durum: uiPayStatus,
    preview_url: row.preview_url,
    tip: row.tip || (invType === 'PURCHASE' ? 'alis' : 'satis')
  };
}

function normalizeDelivery(row, defaultDirection) {
  const uiStVal = uiStatus(row) || 'bekliyor';
  const docNo = row.document_no || row.irsaliye_no || '';
  const direction = row.direction || defaultDirection || 'OUTBOUND';
  return {
    id: row.id,
    document_no: docNo,
    irsaliye_no: docNo,
    direction,
    account_title: row.account_title || row.cari || '',
    cari: row.cari || row.account_title || '',
    document_date: row.document_date || row.tarih || '',
    tarih: row.tarih || row.document_date || '',
    shipping_address: row.shipping_address || row.adres || '',
    adres: row.adres || row.shipping_address || '',
    warehouse_name: row.warehouse_name || row.depo || '',
    depo: row.depo || row.warehouse_name || '',
    grand_total: row.grand_total != null ? row.grand_total : (row.tutar || ''),
    tutar: row.tutar != null ? row.tutar : (row.grand_total || ''),
    tax_total: row.tax_total != null ? row.tax_total : (row.kdv || ''),
    kdv: row.kdv != null ? row.kdv : (row.tax_total || ''),
    delivery_status: row.delivery_status || DELIVERY_STATUS_UI_TO_DB[uiStVal] || 'BEKLIYOR',
    status: uiStVal,
    durum: uiStVal
  };
}

const TRANSFORMS = {
  'stok-liste': (rows) => rows.map(normalizeItem),
  'gorev-liste': (rows) => rows.map(normalizeTask),
  'masraf-liste': (rows) => rows.map(normalizeExpense),
  'fatura-satis': (rows) => rows.map((r) => normalizeInvoice(r, 'SALES')),
  'fatura-alis': (rows) => rows.map((r) => normalizeInvoice(r, 'PURCHASE')),
  'fatura-rapor-satis': (rows) => rows.map((r) => normalizeInvoice(r, 'SALES')),
  'fatura-rapor-alis': (rows) => rows.map((r) => normalizeInvoice(r, 'PURCHASE')),
  'irsaliye-satis': (rows) => rows.map((r) => normalizeDelivery(r, 'OUTBOUND')),
  'irsaliye-alis': (rows) => rows.map((r) => normalizeDelivery(r, 'INBOUND')),
  'irsaliye-rapor-satis': (rows) => rows.map((r) => normalizeDelivery(r, 'OUTBOUND')),
  'irsaliye-rapor-alis': (rows) => rows.map((r) => normalizeDelivery(r, 'INBOUND')),
  'dashboard-faturalar': (rows) => rows.map((r) => normalizeInvoice(r, 'SALES')),
  'rapor-kdv': (rows) => rows.map((r) => {
    const inv = normalizeInvoice(r, r.tip === 'alis' ? 'PURCHASE' : 'SALES');
    return inv;
  })
};

function patchDataJs(tableKey, data) {
  let content = fs.readFileSync(DATA_JS, 'utf8');
  const escaped = tableKey.replace(/-/g, '\\-');
  const blockRe = new RegExp('(["\']?' + escaped + '["\']?:\\s*\\{\\s*"data":\\s*)\\[[\\s\\S]*?\\](\\s*\\})', 'm');
  const jsonBlock = JSON.stringify(data, null, 2).replace(/^/gm, '    ');
  if (!blockRe.test(content)) {
    console.warn('Skip datatables-data.js patch (not found):', tableKey);
    return;
  }
  content = content.replace(blockRe, '$1' + jsonBlock + '$2');
  fs.writeFileSync(DATA_JS, content, 'utf8');
}

function extractRaporKdvJson() {
  const outPath = path.join(TABLES_DIR, 'rapor-kdv.json');
  if (fs.existsSync(outPath)) return;
  const content = fs.readFileSync(DATA_JS, 'utf8');
  const m = content.match(/"rapor-kdv":\s*\{\s*"data":\s*(\[[\s\S]*?\])\s*\}/);
  if (!m) return;
  const rows = JSON.parse(m[1]);
  fs.writeFileSync(outPath, JSON.stringify({ data: rows }, null, 2) + '\n', 'utf8');
  console.log('Created rapor-kdv.json from datatables-data.js');
}

extractRaporKdvJson();

Object.keys(TRANSFORMS).forEach((key) => {
  const filePath = path.join(TABLES_DIR, key + '.json');
  if (!fs.existsSync(filePath)) {
    console.warn('Missing JSON:', key);
    return;
  }
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const transformed = TRANSFORMS[key](payload.data || []);
  const out = { data: transformed };
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  patchDataJs(key, transformed);
  console.log('Synced:', key, '(' + transformed.length + ' rows)');
});

console.log('Done.');
