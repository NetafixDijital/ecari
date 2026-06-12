(function () {
  'use strict';

  /** UI ↔ stk_items / tsk_tasks / fin_financial_transactions / inv_invoices / dln_delivery_notes */

  var GOREV_STATUS_UI_TO_DB = {
    yapilacak: 'BEKLIYOR',
    devam_ediyor: 'DEVAM_EDIYOR',
    gecikti: 'GECIKTI',
    tamamlandi: 'TAMAMLANDI',
    iptal: 'IPTAL'
  };

  var GOREV_STATUS_DB_TO_UI = {
    BEKLIYOR: 'yapilacak',
    DEVAM_EDIYOR: 'devam_ediyor',
    GECIKTI: 'gecikti',
    TAMAMLANDI: 'tamamlandi',
    IPTAL: 'iptal'
  };

  var GOREV_PRIORITY_UI_TO_DB = {
    dusuk: 'DUSUK',
    normal: 'ORTA',
    yuksek: 'YUKSEK'
  };

  var GOREV_PRIORITY_DB_TO_UI = {
    DUSUK: 'dusuk',
    ORTA: 'normal',
    YUKSEK: 'yuksek',
    ACIL: 'yuksek'
  };

  var MASRAF_STATUS_UI_TO_DB = {
    onay_bekliyor: 'ONAY_BEKLIYOR',
    onaylandi: 'ONAYLANDI',
    reddedildi: 'REDDEDILDI',
    odendi: 'ODENDI'
  };

  var MASRAF_STATUS_DB_TO_UI = {
    ONAY_BEKLIYOR: 'onay_bekliyor',
    ONAYLANDI: 'onaylandi',
    REDDEDILDI: 'reddedildi',
    ODENDI: 'odendi'
  };

  var INVOICE_PAYMENT_UI_TO_DB = {
    odendi: 'ODENDI',
    bekliyor: 'BEKLIYOR',
    vadesi_gecmis: 'VADESI_GECMIS',
    kismi: 'KISMI'
  };

  var INVOICE_PAYMENT_DB_TO_UI = {
    ODENDI: 'odendi',
    BEKLIYOR: 'bekliyor',
    VADESI_GECMIS: 'vadesi_gecmis',
    KISMI: 'kismi'
  };

  var DELIVERY_STATUS_UI_TO_DB = {
    sevkte: 'SEVKTE',
    teslim: 'TESLIM',
    hazirlaniyor: 'HAZIRLANIYOR',
    bekliyor: 'BEKLIYOR',
    iptal: 'IPTAL'
  };

  var DELIVERY_STATUS_DB_TO_UI = {
    SEVKTE: 'sevkte',
    TESLIM: 'teslim',
    HAZIRLANIYOR: 'hazirlaniyor',
    BEKLIYOR: 'bekliyor',
    IPTAL: 'iptal'
  };

  function uiStatus(row) {
    return row.status || row.durum || '';
  }

  function parseStockStatus(row) {
    var d = uiStatus(row);
    if (d === 'kritik') return 'kritik';
    if (d === 'pasif' || row.is_active === false) return 'pasif';
    return 'aktif';
  }

  function stockStatusToActive(status) {
    return status !== 'pasif';
  }

  /* --- Stok --- */

  function normalizeItem(row) {
    if (!row || typeof row !== 'object') return row;
    if (row.code && row.name && row.quantity_on_hand != null) {
      var stockStatus = row.stock_status || parseStockStatus(row);
      return Object.assign({}, row, {
        stock_status: stockStatus,
        durum: row.durum || stockStatus,
        is_active: row.is_active != null ? row.is_active : stockStatusToActive(stockStatus)
      });
    }

    var stockStatus = parseStockStatus(row);
    var qty = row.quantity_on_hand != null ? row.quantity_on_hand : (row.miktar || '0');
    var purchase = row.purchase_gross != null ? row.purchase_gross : (row.alis || '0.00');
    var sales = row.sales_gross != null ? row.sales_gross : (row.satis || '0.00');

    return {
      id: row.id,
      code: row.code || row.stok_kod || '',
      name: row.name || row.urun || '',
      base_unit_name: row.base_unit_name || row.birim || 'Adet',
      quantity_on_hand: qty,
      purchase_gross: purchase,
      sales_gross: sales,
      price_category: row.price_category || 'MUHASEBE',
      currency_id: row.currency_id != null ? row.currency_id : 1,
      tracking_type: row.tracking_type || 'TAKIPSIZ',
      is_active: row.is_active != null ? row.is_active : stockStatusToActive(stockStatus),
      stock_status: stockStatus,
      durum: stockStatus
    };
  }

  function fromStokForm() {
    var miktar = parseFloat((document.getElementById('stokMiktar') || {}).value) || 0;
    var alis = parseFloat((document.getElementById('stokAlis') || {}).value) || 0;
    var satis = parseFloat((document.getElementById('stokSatis') || {}).value) || 0;

    return normalizeItem({
      code: (document.getElementById('stokKod') || {}).value.trim(),
      name: (document.getElementById('stokUrun') || {}).value.trim(),
      base_unit_name: (document.getElementById('stokBirim') || {}).value || 'Adet',
      quantity_on_hand: String(miktar),
      purchase_gross: alis.toFixed(2),
      sales_gross: satis.toFixed(2),
      stock_status: miktar <= 5 ? 'kritik' : 'aktif'
    });
  }

  function fromStokExcelRow(raw) {
    return normalizeItem({
      code: raw.code || raw.stok_kod || '',
      name: raw.name || raw.urun || '',
      base_unit_name: raw.base_unit_name || raw.birim || 'Adet',
      quantity_on_hand: raw.quantity_on_hand || raw.miktar || '0',
      purchase_gross: raw.purchase_gross || raw.alis || '0.00',
      sales_gross: raw.sales_gross || raw.satis || '0.00',
      durum: raw.durum || raw.stock_status || 'aktif'
    });
  }

  /* --- Görev --- */

  function gorevStatusToDb(uiVal) {
    return GOREV_STATUS_UI_TO_DB[uiVal] || 'BEKLIYOR';
  }

  function gorevStatusToUi(dbVal) {
    return GOREV_STATUS_DB_TO_UI[dbVal] || dbVal || 'yapilacak';
  }

  function gorevPriorityToDb(uiVal) {
    return GOREV_PRIORITY_UI_TO_DB[uiVal] || 'ORTA';
  }

  function gorevPriorityToUi(dbVal) {
    return GOREV_PRIORITY_DB_TO_UI[dbVal] || 'normal';
  }

  function normalizeTask(row) {
    if (!row || typeof row !== 'object') return row;
    if (row.task_code && row.title && row.task_status) {
      var uiSt = gorevStatusToUi(row.task_status);
      var uiPr = gorevPriorityToUi(row.priority);
      return Object.assign({}, row, {
        status: row.status || uiSt,
        durum: row.durum || uiSt,
        oncelik: row.oncelik || uiPr
      });
    }

    var uiStatusVal = uiStatus(row) || 'yapilacak';
    var uiPriority = row.oncelik || gorevPriorityToUi(row.priority);

    return {
      id: row.id,
      task_code: row.task_code || row.gorev_no || '',
      title: row.title || row.baslik || '',
      assignee_name: row.assignee_name || row.atanan || '—',
      priority: row.priority || gorevPriorityToDb(uiPriority),
      oncelik: uiPriority,
      end_date: row.end_date || row.son_tarih || '',
      start_date: row.start_date || row.olusturma || '',
      task_status: row.task_status || gorevStatusToDb(uiStatusVal),
      status: uiStatusVal,
      durum: uiStatusVal
    };
  }

  function fromGorevForm() {
    var durum = (document.getElementById('gorevDurum') || {}).value || 'yapilacak';
    var oncelik = (document.getElementById('gorevOncelik') || {}).value || 'normal';
    var sonTarih = (document.getElementById('gorevSonTarih') || {}).value || '';

    return normalizeTask({
      title: (document.getElementById('gorevBaslik') || {}).value.trim(),
      assignee_name: (document.getElementById('gorevAtanan') || {}).value.trim() || '—',
      priority: gorevPriorityToDb(oncelik),
      oncelik: oncelik,
      end_date: sonTarih ? formatDateTr(sonTarih) : '—',
      start_date: todayTr(),
      task_status: gorevStatusToDb(durum),
      status: durum,
      durum: durum
    });
  }

  function nextTaskCode(rows) {
    var max = (rows || []).reduce(function (m, r) {
      var n = parseInt(String(r.task_code || r.gorev_no || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return 'GRV-2026-' + String(max + 1).padStart(3, '0');
  }

  /* --- Masraf --- */

  function masrafStatusToDb(uiVal) {
    return MASRAF_STATUS_UI_TO_DB[uiVal] || 'ONAY_BEKLIYOR';
  }

  function masrafStatusToUi(dbVal) {
    return MASRAF_STATUS_DB_TO_UI[dbVal] || dbVal || 'onay_bekliyor';
  }

  function normalizeExpense(row) {
    if (!row || typeof row !== 'object') return row;
    if (row.reference_document_no && row.transaction_type === 'GIDER') {
      var uiSt = masrafStatusToUi(row.approval_status);
      return Object.assign({}, row, {
        masraf_no: row.masraf_no || row.reference_document_no,
        aciklama: row.aciklama || row.description || '',
        kategori: row.kategori || row.expense_category || 'diger',
        tutar: row.tutar != null ? row.tutar : row.amount,
        tarih: row.tarih || row.transaction_datetime || '',
        talep_eden: row.talep_eden || row.requester_name || '—',
        status: row.status || uiSt,
        durum: row.durum || uiSt
      });
    }

    var uiStatusVal = uiStatus(row) || 'onay_bekliyor';

    return {
      id: row.id,
      reference_document_no: row.reference_document_no || row.masraf_no || '',
      masraf_no: row.masraf_no || row.reference_document_no || '',
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
      approval_status: row.approval_status || masrafStatusToDb(uiStatusVal),
      status: uiStatusVal,
      durum: uiStatusVal
    };
  }

  function fromMasrafForm() {
    var tutar = parseFloat((document.getElementById('masrafTutar') || {}).value) || 0;
    var tarihIso = (document.getElementById('masrafTarih') || {}).value || '';

    return normalizeExpense({
      description: (document.getElementById('masrafAciklama') || {}).value.trim(),
      expense_category: (document.getElementById('masrafKategori') || {}).value,
      amount: tutar.toFixed(2),
      transaction_datetime: formatDateTr(tarihIso),
      requester_name: (document.getElementById('masrafTalepEden') || {}).value.trim() || '—',
      approval_status: 'ONAY_BEKLIYOR',
      status: 'onay_bekliyor',
      durum: 'onay_bekliyor'
    });
  }

  function nextExpenseNo(rows) {
    var max = (rows || []).reduce(function (m, r) {
      var n = parseInt(String(r.reference_document_no || r.masraf_no || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return 'MSF-2026-' + String(max + 1).padStart(3, '0');
  }

  /* --- Fatura --- */

  function invoicePaymentToDb(uiVal) {
    return INVOICE_PAYMENT_UI_TO_DB[uiVal] || 'BEKLIYOR';
  }

  function invoicePaymentToUi(dbVal) {
    return INVOICE_PAYMENT_DB_TO_UI[dbVal] || dbVal || 'bekliyor';
  }

  function normalizeInvoice(row, defaultType) {
    if (!row || typeof row !== 'object') return row;
    if (row.document_no && row.invoice_type) {
      var uiPay = invoicePaymentToUi(row.payment_status);
      return Object.assign({}, row, {
        fatura_no: row.fatura_no || row.document_no,
        cari: row.cari || row.account_title || '',
        tarih: row.tarih || row.document_date || '',
        vade: row.vade || row.due_date || '',
        tutar: row.tutar != null ? row.tutar : row.grand_total,
        kdv: row.kdv != null ? row.kdv : row.tax_total,
        status: row.status || uiPay,
        durum: row.durum || uiPay
      });
    }

    var uiPayStatus = uiStatus(row) || 'bekliyor';
    var invType = row.invoice_type || defaultType || 'SALES';

    return {
      id: row.id,
      document_no: row.document_no || row.fatura_no || '',
      fatura_no: row.fatura_no || row.document_no || '',
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
      payment_status: row.payment_status || invoicePaymentToDb(uiPayStatus),
      currency_id: row.currency_id != null ? row.currency_id : 1,
      status: uiPayStatus,
      durum: uiPayStatus,
      preview_url: row.preview_url || 'fatura-onizleme.html',
      tip: row.tip || (invType === 'PURCHASE' ? 'alis' : 'satis')
    };
  }

  /* --- İrsaliye --- */

  function deliveryStatusToDb(uiVal) {
    return DELIVERY_STATUS_UI_TO_DB[uiVal] || 'BEKLIYOR';
  }

  function deliveryStatusToUi(dbVal) {
    return DELIVERY_STATUS_DB_TO_UI[dbVal] || dbVal || 'bekliyor';
  }

  function normalizeDeliveryNote(row, defaultDirection) {
    if (!row || typeof row !== 'object') return row;
    if (row.document_no && row.delivery_status) {
      var uiSt = deliveryStatusToUi(row.delivery_status);
      return Object.assign({}, row, {
        irsaliye_no: row.irsaliye_no || row.document_no,
        cari: row.cari || row.account_title || '',
        tarih: row.tarih || row.document_date || '',
        durum: row.durum || uiSt,
        status: row.status || uiSt
      });
    }

    var uiStVal = uiStatus(row) || 'bekliyor';
    var direction = row.direction || defaultDirection || 'OUTBOUND';

    return {
      id: row.id,
      document_no: row.document_no || row.irsaliye_no || '',
      irsaliye_no: row.irsaliye_no || row.document_no || '',
      direction: direction,
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
      delivery_status: row.delivery_status || deliveryStatusToDb(uiStVal),
      status: uiStVal,
      durum: uiStVal
    };
  }

  /* --- Yardımcılar --- */

  function formatDateTr(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function todayTr() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '.' +
      String(d.getMonth() + 1).padStart(2, '0') + '.' +
      d.getFullYear();
  }

  function displayDurum(row) {
    return uiStatus(row);
  }

  function displayOncelik(row) {
    return row.oncelik || gorevPriorityToUi(row.priority);
  }

  window.EcariDbSim = {
    normalizeItem: normalizeItem,
    fromStokForm: fromStokForm,
    fromStokExcelRow: fromStokExcelRow,
    normalizeTask: normalizeTask,
    fromGorevForm: fromGorevForm,
    nextTaskCode: nextTaskCode,
    gorevStatusToUi: gorevStatusToUi,
    gorevPriorityToUi: gorevPriorityToUi,
    normalizeExpense: normalizeExpense,
    fromMasrafForm: fromMasrafForm,
    nextExpenseNo: nextExpenseNo,
    normalizeInvoice: normalizeInvoice,
    normalizeDeliveryNote: normalizeDeliveryNote,
    displayDurum: displayDurum,
    displayOncelik: displayOncelik,
    formatDateTr: formatDateTr,
    todayTr: todayTr
  };
})();
