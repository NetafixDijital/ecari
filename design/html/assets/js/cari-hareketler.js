(function () {
  'use strict';

  var selectedCari = { kod: '', unvan: '' };
  var modalCariSec = null;
  var Sim = window.CariDbSim;

  function accountCode(row) {
    return row.code || row.cari_kod || '';
  }

  function accountTitle(row) {
    return row.title || row.cari_unvan || '';
  }

  function getHareketTableEl() {
    return document.querySelector('[data-table="cari-hareketler"]');
  }

  function getHareketDt() {
    var el = getHareketTableEl();
    return el && el._ecariDt ? el._ecariDt : null;
  }

  function getCariRows() {
    var payload = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['cari-liste'];
    var rows = (payload && payload.data) ? payload.data.slice() : [];
    if (Sim) return rows.map(Sim.normalizeAccount);
    return rows;
  }

  function getHareketRows() {
    var payload = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['cari-hareketler'];
    var rows = (payload && payload.data) ? payload.data.slice() : [];
    if (Sim) return rows.map(Sim.normalizeMovement);
    return rows;
  }

  function formatMoney(val) {
    if (val === null || val === undefined || val === '') return '—';
    var n = parseFloat(String(val).replace(',', '.'));
    if (isNaN(n)) return '—';
    return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function bakiyeHtml(row) {
    var side = Sim ? Sim.balanceSide(row) : (row.balance_side || row.bakiye_tip || '');
    var val = row.balance != null ? row.balance : row.bakiye;
    var cls = side === 'A' ? 'text-success' : (side === 'B' ? 'text-danger' : '');
    var suffix = side ? ' (' + side + ')' : '';
    return '<span class="' + cls + ' amount">' + formatMoney(val) + suffix + '</span>';
  }

  function personBadge(row) {
    var pt = row.person_type || row.cari_tipi;
    if (pt === 'GERCEK_KISI' || pt === 'gercek') {
      return '<span class="badge bg-label-info">Gerçek</span>';
    }
    return '<span class="badge bg-label-primary">Tüzel</span>';
  }

  function renderCariPickerRows(filter) {
    var tbody = document.getElementById('cariSecBody');
    if (!tbody) return;

    var q = (filter || '').trim().toLowerCase();
    var rows = getCariRows().filter(function (row) {
      if (!q) return true;
      var taxId = Sim ? Sim.displayTaxId(row) : (row.vkn_tckn || '');
      var haystack = [
        accountCode(row),
        accountTitle(row),
        taxId,
        row.phone || row.telefon || ''
      ].join(' ').toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-body-secondary py-4">Cari bulunamadı.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (row) {
      var kod = accountCode(row);
      var unvan = accountTitle(row);
      var taxId = Sim ? Sim.displayTaxId(row) : (row.vkn_tckn || '—');
      return '<tr class="cari-sec-row" data-cari-kod="' + kod + '" data-cari-unvan="' + unvan + '" role="button" tabindex="0">' +
        '<td><span class="font-mono">' + kod + '</span></td>' +
        '<td>' + personBadge(row) + '</td>' +
        '<td><strong>' + unvan + '</strong></td>' +
        '<td class="font-mono">' + taxId + '</td>' +
        '<td class="text-end">' + bakiyeHtml(row) + '</td>' +
        '<td class="text-end"><button type="button" class="btn btn-sm btn-primary btn-cari-sec" data-cari-kod="' + kod + '" data-cari-unvan="' + unvan + '">Seç</button></td>' +
        '</tr>';
    }).join('');
  }

  function updateSeciliLabel() {
    var label = document.getElementById('seciliCariLabel');
    var badge = document.getElementById('seciliCariBadge');
    var btnTemizle = document.getElementById('btnCariTemizle');

    if (selectedCari.kod) {
      if (label) label.textContent = selectedCari.unvan;
      if (badge) {
        badge.textContent = selectedCari.kod;
        badge.classList.remove('d-none');
      }
      if (btnTemizle) btnTemizle.classList.remove('d-none');
    } else {
      if (label) label.textContent = 'Tüm cariler';
      if (badge) badge.classList.add('d-none');
      if (btnTemizle) btnTemizle.classList.add('d-none');
    }
  }

  function applyHareketFilter() {
    var dt = getHareketDt();
    if (!dt) return;

    var rows = getHareketRows();
    if (selectedCari.kod) {
      rows = rows.filter(function (row) {
        var code = row.account_code || row.cari_kod || '';
        return code === selectedCari.kod;
      });
    }

    dt.clear();
    dt.rows.add(rows);
    dt.draw(false);
  }

  function selectCari(kod, unvan) {
    selectedCari = { kod: kod || '', unvan: unvan || '' };
    updateSeciliLabel();
    applyHareketFilter();
    if (modalCariSec) modalCariSec.hide();
  }

  function clearCari() {
    selectedCari = { kod: '', unvan: '' };
    updateSeciliLabel();
    applyHareketFilter();
  }

  function openCariModal() {
    var search = document.getElementById('cariSecSearch');
    if (search) search.value = '';
    renderCariPickerRows('');
    if (!modalCariSec) {
      var el = document.getElementById('modalCariSec');
      if (el) modalCariSec = new bootstrap.Modal(el);
    }
    if (modalCariSec) modalCariSec.show();
    if (search) setTimeout(function () { search.focus(); }, 200);
  }

  function bindEvents() {
    var btnSec = document.getElementById('btnCariSec');
    if (btnSec) btnSec.addEventListener('click', openCariModal);

    var btnTemizle = document.getElementById('btnCariTemizle');
    if (btnTemizle) btnTemizle.addEventListener('click', clearCari);

    var search = document.getElementById('cariSecSearch');
    if (search) {
      search.addEventListener('input', function () {
        renderCariPickerRows(search.value);
      });
    }

    var tbody = document.getElementById('cariSecBody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn-cari-sec');
        if (btn) {
          selectCari(btn.getAttribute('data-cari-kod'), btn.getAttribute('data-cari-unvan'));
          return;
        }
        var row = e.target.closest('.cari-sec-row');
        if (row) {
          selectCari(row.getAttribute('data-cari-kod'), row.getAttribute('data-cari-unvan'));
        }
      });
      tbody.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var row = e.target.closest('.cari-sec-row');
        if (!row) return;
        e.preventDefault();
        selectCari(row.getAttribute('data-cari-kod'), row.getAttribute('data-cari-unvan'));
      });
    }

    var params = new URLSearchParams(window.location.search);
    var kod = params.get('cari');
    if (kod) {
      var cari = getCariRows().find(function (r) { return accountCode(r) === kod; });
      if (cari) selectCari(accountCode(cari), accountTitle(cari));
    }
  }

  function init() {
    bindEvents();
    updateSeciliLabel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
