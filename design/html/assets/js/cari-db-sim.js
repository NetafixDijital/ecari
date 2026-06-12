(function () {
  'use strict';

  /** UI ↔ cari_accounts / cari_movements / fin_financial_transactions simülasyon katmanı */

  var PERSON_UI_TO_DB = {
    tuzel: 'TUZEL_KISI',
    gercek: 'GERCEK_KISI'
  };

  var PERSON_DB_TO_UI = {
    TUZEL_KISI: 'tuzel',
    GERCEK_KISI: 'gercek'
  };

  function parseIsActive(val, fallbackDurum) {
    if (val === true || val === 1 || val === '1' || val === 'aktif' || val === 'true') return true;
    if (val === false || val === 0 || val === '0' || val === 'pasif' || val === 'false') return false;
    return (fallbackDurum || 'aktif') !== 'pasif';
  }

  function parsePersonType(val) {
    var v = String(val || '').toUpperCase();
    if (v === 'GERCEK' || v === 'GERCEK_KISI') return 'GERCEK_KISI';
    return 'TUZEL_KISI';
  }

  function personTypeToDb(uiVal) {
    return PERSON_UI_TO_DB[uiVal] || 'TUZEL_KISI';
  }

  function personTypeToUi(dbVal) {
    return PERSON_DB_TO_UI[dbVal] || 'tuzel';
  }

  function isTuzelPerson(dbVal) {
    return dbVal !== 'GERCEK_KISI';
  }

  function displayTaxId(row) {
    if (!row) return '—';
    if (row.identity_number) return row.identity_number;
    if (row.tax_number) return row.tax_number;
    return '—';
  }

  function balanceSide(row) {
    return row.balance_side || row.bakiye_tip || '';
  }

  function isActive(row) {
    if (!row) return true;
    return parseIsActive(row.is_active, row.durum);
  }

  function nextCode(rows) {
    var max = (rows || []).reduce(function (m, r) {
      var n = parseInt(String(r.code || r.cari_kod || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return 'CR-' + String(max + 1).padStart(3, '0');
  }

  /** Eski demo kayıtlarını DB şekline normalize et */
  function normalizeAccount(row) {
    if (!row || typeof row !== 'object') return row;
    if (row.code && row.person_type) return row;

    var personType = row.person_type || personTypeToDb(row.cari_tipi);
    var tuzel = isTuzelPerson(personType);
    var taxId = row.vkn_tckn || row.tax_number || row.identity_number || '';

    return {
      id: row.id,
      code: row.code || row.cari_kod || '',
      account_type: row.account_type || 'CUSTOMER',
      person_type: personType,
      title: row.title || row.cari_unvan || '',
      tax_number: row.tax_number != null ? row.tax_number : (tuzel ? taxId : ''),
      identity_number: row.identity_number != null ? row.identity_number : (!tuzel ? taxId : ''),
      tax_office: row.tax_office || row.vergi_dairesi || '',
      address_line: row.address_line || row.adres || '',
      city_id: row.city_id != null ? row.city_id : null,
      district_id: row.district_id != null ? row.district_id : null,
      email: row.email || row.eposta || '',
      phone: row.phone || row.telefon || '',
      is_active: row.is_active != null ? row.is_active : (row.durum !== 'pasif'),
      is_einvoice_user: row.is_einvoice_user != null ? row.is_einvoice_user : false,
      balance: row.balance != null ? row.balance : (row.bakiye || '0.00'),
      balance_side: balanceSide(row)
    };
  }

  /** HTML form → cari_accounts (+ adres simülasyonu) */
  function fromForm() {
    var tuzelRadio = document.getElementById('cariTipiTuzel');
    var tuzel = tuzelRadio ? tuzelRadio.checked : true;
    var personType = tuzel ? 'TUZEL_KISI' : 'GERCEK_KISI';
    var taxIdEl = document.getElementById('cariVknTckn');
    var taxId = taxIdEl ? taxIdEl.value.replace(/\D/g, '') : '';

    return {
      account_type: 'CUSTOMER',
      person_type: personType,
      title: (document.getElementById('cariUnvan') || {}).value || '',
      tax_number: tuzel ? taxId : '',
      identity_number: tuzel ? '' : taxId,
      tax_office: (document.getElementById('cariVergiDairesi') || {}).value || '',
      address_line: (document.getElementById('cariAdres') || {}).value || '',
      city_id: null,
      district_id: null,
      email: (document.getElementById('cariEposta') || {}).value || '',
      phone: (document.getElementById('cariTelefon') || {}).value || '',
      is_active: true,
      is_einvoice_user: false,
      balance: '0.00',
      balance_side: ''
    };
  }

  /** Excel satırı → cari_accounts */
  function fromExcelRow(raw) {
    var personType = parsePersonType(raw.person_type || raw.cari_tipi);
    var tuzel = personType === 'TUZEL_KISI';
    var taxId = raw.vkn_tckn || raw.tax_number || raw.identity_number || '';

    return normalizeAccount({
      code: raw.code || raw.cari_kod || '',
      account_type: 'CUSTOMER',
      person_type: personType,
      title: raw.title || raw.cari_unvan || '',
      tax_number: raw.tax_number || (tuzel ? taxId : ''),
      identity_number: raw.identity_number || (!tuzel ? taxId : ''),
      tax_office: raw.tax_office || raw.vergi_dairesi || '',
      address_line: raw.address_line || raw.adres || '',
      email: raw.email || raw.eposta || '',
      phone: raw.phone || raw.telefon || '',
      is_active: parseIsActive(raw.is_active, raw.durum),
      balance: raw.balance || raw.bakiye || '0.00',
      balance_side: raw.balance_side || raw.bakiye_tip || ''
    });
  }

  function normalizeMovement(row) {
    if (!row || typeof row !== 'object') return row;
    if (row.movement_date && row.account_code !== undefined) return row;

    return {
      id: row.id,
      movement_date: row.movement_date || row.tarih || '',
      account_code: row.account_code || row.cari_kod || '',
      account_title: row.account_title || row.cari || '',
      description: row.description || row.islem || '',
      debit_amount: row.debit_amount != null ? row.debit_amount : (row.borc || ''),
      credit_amount: row.credit_amount != null ? row.credit_amount : (row.alacak || ''),
      balance: row.balance != null ? row.balance : (row.bakiye || '')
    };
  }

  /** Tahsilat/tediye form → fin_financial_transactions (simülasyon) */
  function fromFinForm(prefix, accountCode, transactionType) {
    var amountEl = document.getElementById(prefix + 'Tutar');
    var amount = amountEl ? parseFloat(amountEl.value) : 0;
    if (isNaN(amount) || amount <= 0) return null;

    return {
      transaction_type: transactionType,
      transaction_datetime: (document.getElementById(prefix + 'Tarih') || {}).value || '',
      account_code: accountCode,
      amount: amount.toFixed(2),
      description: (document.getElementById(prefix + 'Aciklama') || {}).value || '',
      payment_method: 'NAKIT',
      currency_id: 1
    };
  }

  window.CariDbSim = {
    personTypeToDb: personTypeToDb,
    personTypeToUi: personTypeToUi,
    isTuzelPerson: isTuzelPerson,
    displayTaxId: displayTaxId,
    balanceSide: balanceSide,
    isActive: isActive,
    nextCode: nextCode,
    normalizeAccount: normalizeAccount,
    normalizeMovement: normalizeMovement,
    fromForm: fromForm,
    fromExcelRow: fromExcelRow,
    fromFinForm: fromFinForm
  };
})();
