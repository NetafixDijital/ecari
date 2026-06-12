(function () {
  'use strict';

  var JSON_BASE = 'assets/json/tables/';
  var tableCache = {};

  function resolveJsonUrl(tableKey) {
    var base = 'assets/json/tables/';
    try {
      var path = window.location.pathname || '';
      if (path.indexOf('/') !== -1) {
        var dir = path.substring(0, path.lastIndexOf('/') + 1);
        return dir + base + tableKey + '.json';
      }
    } catch (e) { /* ignore */ }
    return base + tableKey + '.json';
  }

  function loadTableData(tableKey) {
    if (tableCache[tableKey]) {
      return Promise.resolve(tableCache[tableKey].slice());
    }

    if (window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA[tableKey]) {
      var embedded = (window.ECARI_TABLE_DATA[tableKey].data || []).slice();
      tableCache[tableKey] = embedded;
      return Promise.resolve(embedded.slice());
    }

    return fetch(resolveJsonUrl(tableKey), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Veri yüklenemedi: ' + tableKey);
        return res.json();
      })
      .then(function (payload) {
        var rows = (payload && payload.data) ? payload.data.slice() : [];
        tableCache[tableKey] = rows;
        return rows.slice();
      })
      .catch(function (err) {
        if (window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA[tableKey]) {
          var fallback = (window.ECARI_TABLE_DATA[tableKey].data || []).slice();
          tableCache[tableKey] = fallback;
          return fallback.slice();
        }
        console.error('[e-Cari DataTables]', err);
        return [];
      });
  }

  function processServerSide(allRows, params, statusFilter) {
    var rows = allRows.slice();
    var draw = parseInt(params.draw, 10) || 1;
    var start = parseInt(params.start, 10) || 0;
    var length = parseInt(params.length, 10);
    var search = (params.search && params.search.value) ? String(params.search.value).trim().toLowerCase() : '';

    if (statusFilter && statusFilter !== 'all') {
      rows = rows.filter(function (row) {
        return String(row.status || row.durum || '') === statusFilter;
      });
    }

    if (search) {
      rows = rows.filter(function (row) {
        return Object.keys(row).some(function (key) {
          var val = row[key];
          return val !== null && val !== undefined && String(val).toLowerCase().indexOf(search) !== -1;
        });
      });
    }

    var orderColIndex = parseInt(params.order && params.order[0] ? params.order[0].column : 0, 10);
    var orderDir = (params.order && params.order[0] && params.order[0].dir === 'desc') ? 'desc' : 'asc';
    var colData = params.columns && params.columns[orderColIndex] ? params.columns[orderColIndex].data : null;

    if (colData && colData !== 'actions') {
      rows.sort(function (a, b) {
        var left = a[colData] || '';
        var right = b[colData] || '';
        var cmp = String(left).localeCompare(String(right), 'tr', { numeric: true, sensitivity: 'base' });
        return orderDir === 'desc' ? -cmp : cmp;
      });
    }

    var recordsFiltered = rows.length;
    var page = length === -1 ? rows : rows.slice(start, start + Math.max(0, length));

    return {
      draw: draw,
      recordsTotal: allRows.length,
      recordsFiltered: recordsFiltered,
      data: page
    };
  }

  var TR_LANG = {
    processing: 'Yükleniyor...',
    search: 'Ara:',
    lengthMenu: '_MENU_ kayıt göster',
    info: '_TOTAL_ kayıttan _START_ - _END_ arası',
    infoEmpty: 'Kayıt yok',
    infoFiltered: '(_MAX_ kayıt içinden filtrelendi)',
    loadingRecords: 'Yükleniyor...',
    zeroRecords: 'Eşleşen kayıt bulunamadı',
    emptyTable: 'Tabloda veri yok',
    paginate: {
      first: 'İlk',
      previous: '<i class="ti ti-chevron-left"></i>',
      next: '<i class="ti ti-chevron-right"></i>',
      last: 'Son'
    }
  };

  var DURUM_MAP = {
    odendi: { label: 'Ödendi', class: 'success' },
    bekliyor: { label: 'Bekliyor', class: 'warning' },
    vadesi_gecmis: { label: 'Vadesi Geçti', class: 'danger' },
    kismi: { label: 'Kısmi ödeme', class: 'info' },
    aktif: { label: 'Aktif', class: 'success' },
    pasif: { label: 'Pasif', class: 'secondary' },
    kritik: { label: 'Kritik', class: 'warning' },
    sevkte: { label: 'Sevkte', class: 'info' },
    teslim: { label: 'Teslim', class: 'success' },
    hazirlaniyor: { label: 'Hazırlanıyor', class: 'warning' },
    iptal: { label: 'İptal', class: 'danger' },
    islemde: { label: 'İşlemde', class: 'info' },
    beklemede: { label: 'Beklemede', class: 'warning' },
    tamamlandi: { label: 'Tamamlandı', class: 'success' },
    yapilacak: { label: 'Yapılacak', class: 'warning' },
    devam_ediyor: { label: 'Devam Ediyor', class: 'info' },
    gecikti: { label: 'Gecikmiş', class: 'danger' },
    onay_bekliyor: { label: 'Onay Bekliyor', class: 'warning' },
    onaylandi: { label: 'Onaylandı', class: 'success' },
    reddedildi: { label: 'Reddedildi', class: 'danger' }
  };

  var ONCELIK_MAP = {
    dusuk: { label: 'Düşük', class: 'badge-oncelik-dusuk' },
    normal: { label: 'Normal', class: 'badge-oncelik-normal' },
    yuksek: { label: 'Yüksek', class: 'badge-oncelik-yuksek' }
  };

  var MASRAF_KAT_MAP = {
    yakit: { label: 'Yakıt', class: 'badge-kat-yakit' },
    yemek: { label: 'Yemek', class: 'badge-kat-yemek' },
    kirtasiye: { label: 'Kırtasiye', class: 'badge-kat-kirtasiye' },
    ulasim: { label: 'Ulaşım', class: 'badge-kat-ulasim' },
    diger: { label: 'Diğer', class: 'badge-kat-diger' }
  };

  var SERVIS_STATUS_CLASS = {
    islemde: 'servis-status-islemde',
    beklemede: 'servis-status-beklemede',
    tamamlandi: 'servis-status-tamamlandi',
    teslim: 'servis-status-teslim'
  };

  function money(val) {
    if (val === null || val === undefined || val === '') return '—';
    var num = parseFloat(val);
    if (isNaN(num)) return val;
    return '₺' + num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function badgeDurum(key) {
    var item = DURUM_MAP[key] || { label: key, class: 'secondary' };
    return '<span class="badge bg-label-' + item.class + '">' + item.label + '</span>';
  }

  function actionBtn(icon, color, title, attrs) {
    attrs = attrs || '';
    return '<button type="button" class="btn btn-sm btn-icon btn-label-' + color + ' rounded-pill" title="' + title + '" data-bs-toggle="tooltip" ' + attrs + '>' +
      '<i class="ti ' + icon + '"></i></button>';
  }

  function actionLink(href, icon, color, title) {
    return '<a href="' + href + '" class="btn btn-sm btn-icon btn-label-' + color + ' rounded-pill" title="' + title + '" data-bs-toggle="tooltip">' +
      '<i class="ti ' + icon + '"></i></a>';
  }

  function standardActions(row, opts) {
    opts = opts || {};
    var viewUrl = row.preview_url || opts.viewUrl || 'javascript:void(0)';
    var html = '<div class="d-flex justify-content-center gap-1 dt-actions">';
    html += actionLink(viewUrl, 'ti-eye', 'info', 'Görüntüle');
    html += actionBtn('ti-edit', 'primary', 'Düzenle', opts.editAttrs || '');
    html += actionBtn('ti-printer', 'warning', 'Yazdır', '');
    html += actionBtn('ti-trash', 'danger', 'Sil', 'data-dt-action="delete"');
    html += '</div>';
    return html;
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function cariPersonBadge(personType) {
    if (personType === 'GERCEK_KISI') {
      return '<span class="badge bg-label-info">Gerçek Kişi</span>';
    }
    return '<span class="badge bg-label-primary">Tüzel Kişi</span>';
  }

  function cariActiveBadge(row) {
    var active = window.CariDbSim ? window.CariDbSim.isActive(row) : (row.durum !== 'pasif');
    if (active) return '<span class="badge bg-label-success">Aktif</span>';
    return '<span class="badge bg-label-secondary">Pasif</span>';
  }

  function cariTaxIdCell(row) {
    if (window.CariDbSim) return window.CariDbSim.displayTaxId(row);
    return row.vkn_tckn || row.tax_number || row.identity_number || '—';
  }

  function cariBalanceCell(row) {
    var side = window.CariDbSim ? window.CariDbSim.balanceSide(row) : (row.bakiye_tip || row.balance_side || '');
    var val = row.balance != null ? row.balance : row.bakiye;
    var cls = side === 'A' ? 'text-success' : (side === 'B' ? 'text-danger' : '');
    var suffix = side ? ' (' + side + ')' : '';
    return '<span class="' + cls + '">' + money(val) + suffix + '</span>';
  }

  function cariActions(row) {
    var kod = row.code || row.cari_kod || '';
    var unvan = row.title || row.cari_unvan || '';
    return '<div class="d-flex justify-content-center gap-1 cari-actions">' +
      actionBtn('ti-cash', 'success', 'Tahsilat', 'data-cari-action="tahsilat" data-cari-kod="' + escapeAttr(kod) + '" data-cari-unvan="' + escapeAttr(unvan) + '"') +
      actionBtn('ti-cash-off', 'danger', 'Tediye', 'data-cari-action="tediye" data-cari-kod="' + escapeAttr(kod) + '" data-cari-unvan="' + escapeAttr(unvan) + '"') +
      actionBtn('ti-arrows-exchange', 'primary', 'Virman', 'data-cari-action="virman" data-cari-kod="' + escapeAttr(kod) + '" data-cari-unvan="' + escapeAttr(unvan) + '"') +
      actionBtn('ti-report-analytics', 'info', 'Hareket Raporu', 'data-cari-action="rapor" data-cari-kod="' + escapeAttr(kod) + '" data-cari-unvan="' + escapeAttr(unvan) + '"') +
      '</div>';
  }

  function servisDurumBadge(key) {
    var item = DURUM_MAP[key] || { label: key, class: 'secondary' };
    var cls = SERVIS_STATUS_CLASS[key] || '';
    return '<span class="badge ' + cls + ' servis-status-' + key + '">' + item.label + '</span>';
  }

  function gorevDurumBadge(key) {
    var item = DURUM_MAP[key] || { label: key, class: 'secondary' };
    return '<span class="badge gorev-status-' + key + '">' + item.label + '</span>';
  }

  function gorevOncelikBadge(key) {
    var item = ONCELIK_MAP[key] || { label: key, class: 'badge-oncelik-dusuk' };
    return '<span class="badge ' + item.class + '">' + item.label + '</span>';
  }

  function masrafDurumBadge(key) {
    var item = DURUM_MAP[key] || { label: key, class: 'secondary' };
    return '<span class="badge masraf-status-' + key + '">' + item.label + '</span>';
  }

  function masrafKategoriBadge(key) {
    var item = MASRAF_KAT_MAP[key] || { label: key, class: 'badge-kat-diger' };
    return '<span class="badge ' + item.class + '">' + item.label + '</span>';
  }

  var TABLE_CONFIGS = {
    'fatura-satis': {
      columns: [
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.fatura_no || '') + '</strong>'; } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'due_date', defaultContent: '', render: function (d, t, row) { return d || row.vade || ''; } },
        { data: 'grand_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', defaultContent: '', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']],
      pageLength: 10
    },
    'fatura-alis': {
      columns: [
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.fatura_no || '') + '</strong>'; } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'due_date', defaultContent: '', render: function (d, t, row) { return d || row.vade || ''; } },
        { data: 'grand_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']],
      pageLength: 10
    },
    'rapor-kdv': {
      columns: [
        { data: 'tip', orderable: false, render: function (d, t, row) {
          var tip = d || (row.invoice_type === 'PURCHASE' ? 'alis' : 'satis');
          if (tip === 'satis') return '<span class="badge bg-label-success">Satış</span>';
          return '<span class="badge bg-label-danger">Alış</span>';
        } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.fatura_no || '') + '</strong>'; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'grand_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'tax_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.kdv); } },
        { data: 'tax_rate_percent', className: 'text-center', render: function (d, t, row) { return '%' + (d || row.oran || ''); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } }
      ],
      order: [[3, 'desc']],
      pageLength: 10
    },
    'fatura-rapor-satis': {
      columns: [
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return d || row.fatura_no || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'grand_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'tax_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.kdv); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'fatura-rapor-alis': {
      columns: [
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return d || row.fatura_no || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'grand_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'tax_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.kdv); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-satis': {
      columns: [
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.irsaliye_no || '') + '</strong>'; } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'shipping_address', defaultContent: '', render: function (d, t, row) { return d || row.adres || ''; } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-alis': {
      columns: [
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.irsaliye_no || '') + '</strong>'; } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'warehouse_name', defaultContent: '', render: function (d, t, row) { return d || row.depo || ''; } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-rapor-satis': {
      columns: [
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return d || row.irsaliye_no || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'grand_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'tax_total', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.kdv); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-rapor-alis': {
      columns: [
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_no', defaultContent: '', render: function (d, t, row) { return d || row.irsaliye_no || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'warehouse_name', defaultContent: '', render: function (d, t, row) { return d || row.depo || ''; } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'cari-liste': {
      columns: [
        { data: 'code', defaultContent: '', render: function (d, t, row) { return d || row.cari_kod || ''; } },
        {
          data: 'person_type',
          orderable: false,
          render: function (d, t, row) {
            return cariPersonBadge(d || row.cari_tipi);
          }
        },
        { data: 'title', defaultContent: '', render: function (d, t, row) { return d || row.cari_unvan || ''; } },
        { data: null, orderable: false, render: function (d, t, row) { return cariTaxIdCell(row); } },
        { data: 'phone', defaultContent: '', render: function (d, t, row) { return d || row.telefon || '—'; } },
        { data: 'balance', className: 'text-end', render: function (d, t, row) { return cariBalanceCell(row); } },
        { data: 'is_active', orderable: false, render: function (d, t, row) { return cariActiveBadge(row); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return cariActions(row); } }
      ],
      order: [[0, 'asc']],
      rowCallback: function (row, data) {
        row.setAttribute('data-cari-kod', data.code || data.cari_kod || '');
        row.setAttribute('data-cari-unvan', data.title || data.cari_unvan || '');
      }
    },
    'cari-hareketler': {
      columns: [
        { data: 'movement_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'description', defaultContent: '', render: function (d, t, row) { return d || row.islem || ''; } },
        { data: 'debit_amount', className: 'text-end amount', render: money },
        { data: 'credit_amount', className: 'text-end amount', render: money },
        { data: 'balance', className: 'text-end amount', render: money },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function () {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionBtn('ti-eye', 'info', 'Detay', '') +
            actionBtn('ti-printer', 'warning', 'Yazdır', '') +
            '</div>';
        } }
      ],
      order: [[0, 'desc']]
    },
    'stok-liste': {
      columns: [
        { data: 'code', defaultContent: '', render: function (d, t, row) { return d || row.stok_kod || ''; } },
        { data: 'name', defaultContent: '', render: function (d, t, row) { return d || row.urun || ''; } },
        { data: 'base_unit_name', defaultContent: '', render: function (d, t, row) { return d || row.birim || ''; } },
        { data: 'quantity_on_hand', defaultContent: '', render: function (d, t, row) { return d != null && d !== '' ? d : (row.miktar || ''); } },
        { data: 'purchase_gross', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.alis); } },
        { data: 'sales_gross', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.satis); } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.stock_status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function () {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionBtn('ti-edit', 'primary', 'Düzenle', '') +
            actionBtn('ti-history', 'info', 'Hareketler', '') +
            actionBtn('ti-trash', 'danger', 'Sil', '') +
            '</div>';
        } }
      ],
      order: [[0, 'asc']]
    },
    'servis-liste': {
      columns: [
        { data: 'servis_no', render: function (d) { return '<strong>' + d + '</strong>'; } },
        { data: null, render: function (d, t, row) {
          return '<div>' + row.musteri + '</div><small class="text-body-secondary">' + row.cihaz + '</small>';
        } },
        { data: 'ariza', className: 'text-truncate', render: function (d) {
          return '<span class="d-inline-block text-truncate" style="max-width:12rem;">' + d + '</span>';
        } },
        { data: 'teknisyen' },
        { data: 'giris' },
        { data: 'durum', orderable: false, render: servisDurumBadge },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function () {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionBtn('ti-eye', 'info', 'Detay', 'data-bs-toggle="modal" data-bs-target="#modalServisDetay"') +
            actionBtn('ti-edit', 'primary', 'Düzenle', '') +
            actionBtn('ti-check', 'success', 'Tamamla', '') +
            '</div>';
        } }
      ],
      order: [[4, 'desc']],
      statusFilter: true
    },
    'gorev-liste': {
      columns: [
        { data: 'task_code', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.gorev_no || '') + '</strong>'; } },
        { data: 'title', defaultContent: '', render: function (d, t, row) {
          var val = d || row.baslik || '';
          return '<span class="d-inline-block text-truncate" style="max-width:14rem;" title="' + escapeAttr(val) + '">' + val + '</span>';
        } },
        { data: 'assignee_name', defaultContent: '', render: function (d, t, row) { return d || row.atanan || ''; } },
        { data: 'oncelik', orderable: false, render: function (d, t, row) {
          return gorevOncelikBadge(d || (window.EcariDbSim ? window.EcariDbSim.displayOncelik(row) : row.priority));
        } },
        { data: 'end_date', defaultContent: '', render: function (d, t, row) { return d || row.son_tarih || ''; } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return gorevDurumBadge(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function () {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionBtn('ti-eye', 'info', 'Detay', '') +
            actionBtn('ti-edit', 'primary', 'Düzenle', '') +
            actionBtn('ti-check', 'success', 'Tamamla', '') +
            '</div>';
        } }
      ],
      order: [[4, 'asc']],
      statusFilter: true
    },
    'masraf-liste': {
      columns: [
        { data: 'reference_document_no', defaultContent: '', render: function (d, t, row) { return '<strong>' + (d || row.masraf_no || '') + '</strong>'; } },
        { data: 'description', defaultContent: '', render: function (d, t, row) {
          var val = d || row.aciklama || '';
          return '<span class="d-inline-block text-truncate" style="max-width:14rem;" title="' + escapeAttr(val) + '">' + val + '</span>';
        } },
        { data: 'expense_category', orderable: false, render: function (d, t, row) { return masrafKategoriBadge(d || row.kategori); } },
        { data: 'amount', className: 'text-end amount', render: function (d, t, row) { return money(d != null && d !== '' ? d : row.tutar); } },
        { data: 'transaction_datetime', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'requester_name', defaultContent: '', render: function (d, t, row) { return d || row.talep_eden || ''; } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return masrafDurumBadge(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function () {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionBtn('ti-circle-check', 'success', 'Onayla', '') +
            actionBtn('ti-x', 'danger', 'Reddet', '') +
            actionBtn('ti-edit', 'primary', 'Düzenle', '') +
            '</div>';
        } }
      ],
      order: [[4, 'desc']],
      statusFilter: true
    },
    'dashboard-faturalar': {
      columns: [
        { data: 'document_no', defaultContent: '', render: function (d, t, row) {
          var no = d || row.fatura_no || '';
          return '<a href="' + (row.preview_url || '#') + '" class="fw-medium">' + no + '</a>';
        } },
        { data: 'account_title', defaultContent: '', render: function (d, t, row) { return d || row.cari || ''; } },
        { data: 'document_date', defaultContent: '', render: function (d, t, row) { return d || row.tarih || ''; } },
        { data: 'durum', orderable: false, render: function (d, t, row) { return badgeDurum(d || row.status); } },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', defaultContent: '', render: function (d, t, row) {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionLink(row.preview_url || 'fatura-satis.html', 'ti-eye', 'info', 'Görüntüle') +
            actionBtn('ti-edit', 'primary', 'Düzenle', '') +
            '</div>';
        } }
      ],
      order: [[2, 'desc']],
      pageLength: 5,
      compact: true
    },
    'dashboard-islemler': {
      columns: [
        { data: 'cari', render: function (d, t, row) {
          return '<div class="dt-name-cell">' +
            '<span class="avatar-initial bg-label-primary">' + (row.initials || d.substring(0, 2).toUpperCase()) + '</span>' +
            '<span class="fw-medium text-truncate">' + d + '</span></div>';
        } },
        { data: 'tarih' },
        { data: 'aciklama', render: function (d) {
          return '<span class="text-body-secondary">' + d + '</span>';
        } },
        { data: 'kategori', orderable: false, render: function (d) {
          if (d === 'gelir') return '<span class="badge bg-label-success">Gelir</span>';
          if (d === 'gider') return '<span class="badge bg-label-danger">Gider</span>';
          return '<span class="badge bg-label-secondary">' + d + '</span>';
        } },
        { data: 'tutar', className: 'text-end', render: function (d, t, row) {
          var cls = row.kategori === 'gider' ? 'amount-negative' : 'amount-positive';
          var prefix = row.kategori === 'gider' ? '−' : '+';
          return '<span class="' + cls + ' amount">' + prefix + money(d).replace('₺', '₺') + '</span>';
        } },
        { data: 'durum', orderable: false, render: badgeDurum }
      ],
      order: [[1, 'desc']],
      pageLength: 8
    }
  };

  function initTooltips(root) {
    if (!window.bootstrap) return;
    (root || document).querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
      if (!bootstrap.Tooltip.getInstance(el)) {
        new bootstrap.Tooltip(el);
      }
    });
  }

  function getTableRows(tableKey, statusFilter) {
    var payload = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA[tableKey];
    var rows = (payload && payload.data) ? payload.data.slice() : [];
    if (statusFilter && statusFilter !== 'all') {
      rows = rows.filter(function (row) {
        return String(row.status || row.durum || '') === statusFilter;
      });
    }
    return rows;
  }

  function renderCellValue(col, row) {
    var val = col.data && col.data !== 'actions' ? row[col.data] : null;
    if (typeof col.render === 'function') {
      return col.render(val, 'display', row);
    }
    if (val === null || val === undefined || val === '') return '';
    return String(val);
  }

  function buildRowHtml(row, config) {
    return '<tr>' + config.columns.map(function (col) {
      var cls = col.className ? ' class="' + col.className + '"' : '';
      return '<td' + cls + '>' + renderCellValue(col, row) + '</td>';
    }).join('') + '</tr>';
  }

  function ensureTbodyRows(tableEl, tableKey, config, statusFilter) {
    var tbody = tableEl.querySelector('tbody');
    if (!tbody) return;
    if (tbody.rows.length > 0) return;
    var rows = getTableRows(tableKey, statusFilter);
    tbody.innerHTML = rows.map(function (row) {
      return buildRowHtml(row, config);
    }).join('');
  }

  function buildLayout(placeholder) {
    return {
      topStart: 'pageLength',
      topEnd: {
        search: {
          placeholder: placeholder || 'Ara...'
        }
      },
      bottomStart: 'info',
      bottomEnd: 'paging'
    };
  }

  function initTable(tableEl) {
    if (!tableEl || tableEl.getAttribute('data-dt-bound') === '1') return null;
    if (typeof DataTable === 'undefined') return null;

    var tableKey = tableEl.getAttribute('data-table');
    var config = TABLE_CONFIGS[tableKey];
    if (!config) {
      console.warn('[e-Cari DataTables] Tanımsız tablo:', tableKey);
      return null;
    }

    var placeholder = tableEl.getAttribute('data-search-placeholder') || 'Ara...';
    var pageLength = parseInt(tableEl.getAttribute('data-page-length') || config.pageLength || 10, 10);
    var statusFilter = tableEl.getAttribute('data-status-filter') || 'all';
    var rows = getTableRows(tableKey, statusFilter);
    var dtOptions = {
      data: rows,
      columns: config.columns,
      order: config.order || [[0, 'asc']],
      pageLength: pageLength,
      lengthMenu: [5, 10, 25, 50, 100],
      language: TR_LANG,
      layout: buildLayout(placeholder),
      drawCallback: function () {
        initTooltips(tableEl.closest('.card') || tableEl.parentElement);
      }
    };
    if (config.rowCallback) dtOptions.rowCallback = config.rowCallback;

    try {
      var dt = new DataTable(tableEl, dtOptions);

      tableEl.setAttribute('data-dt-bound', '1');
      tableEl._ecariDt = dt;

      if (config.statusFilter) {
        document.querySelectorAll('[data-filter]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            document.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            statusFilter = btn.getAttribute('data-filter') || 'all';
            tableEl.setAttribute('data-status-filter', statusFilter);
            var filtered = getTableRows(tableKey, statusFilter);
            dt.clear();
            dt.rows.add(filtered);
            dt.draw(false);
            initTooltips(tableEl.closest('.card') || tableEl.parentElement);
          });
        });
      }

      return dt;
    } catch (err) {
      console.error('[e-Cari DataTables] Başlatılamadı:', tableKey, err);
      return null;
    }
  }

  function refreshTable(tableKey) {
    var tableEl = document.querySelector('table.datatables-ajax[data-table="' + tableKey + '"]');
    if (!tableEl || !tableEl._ecariDt) return;
    var statusFilter = tableEl.getAttribute('data-status-filter') || 'all';
    var rows = getTableRows(tableKey, statusFilter);
    tableEl._ecariDt.clear();
    tableEl._ecariDt.rows.add(rows);
    tableEl._ecariDt.draw(false);
    initTooltips(tableEl.closest('.card') || tableEl.parentElement);
  }

  function appendRows(tableKey, newRows) {
    if (!window.ECARI_TABLE_DATA || !window.ECARI_TABLE_DATA[tableKey]) return 0;
    if (!Array.isArray(newRows) || !newRows.length) return 0;
    var data = window.ECARI_TABLE_DATA[tableKey].data;
    var maxId = data.reduce(function (m, r) { return Math.max(m, r.id || 0); }, 0);
    var added = 0;
    newRows.forEach(function (row) {
      if (!row || typeof row !== 'object') return;
      maxId += 1;
      row.id = maxId;
      data.push(row);
      added += 1;
    });
    tableCache[tableKey] = data.slice();
    refreshTable(tableKey);
    return added;
  }

  function initAll() {
    document.querySelectorAll('table.datatables-ajax:not([data-dt-bound])').forEach(initTable);
  }

  window.EcariDataTables = {
    init: initAll,
    initTable: initTable,
    refresh: refreshTable,
    appendRows: appendRows,
    TABLE_CONFIGS: TABLE_CONFIGS
  };
})();
