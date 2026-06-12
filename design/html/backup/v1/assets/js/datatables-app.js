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
    tamamlandi: { label: 'Tamamlandı', class: 'success' }
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

  function cariActions(row) {
    var kod = row.cari_kod || '';
    var unvan = row.cari_unvan || '';
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

  var TABLE_CONFIGS = {
    'fatura-satis': {
      columns: [
        { data: 'fatura_no', render: function (d) { return '<strong>' + d + '</strong>'; } },
        { data: 'cari' },
        { data: 'tarih' },
        { data: 'vade' },
        { data: 'tutar', className: 'text-end amount', render: money },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', defaultContent: '', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']],
      pageLength: 10
    },
    'fatura-alis': {
      columns: [
        { data: 'fatura_no', render: function (d) { return '<strong>' + d + '</strong>'; } },
        { data: 'cari' },
        { data: 'tarih' },
        { data: 'vade' },
        { data: 'tutar', className: 'text-end amount', render: money },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']],
      pageLength: 10
    },
    'fatura-rapor-satis': {
      columns: [
        { data: 'cari' },
        { data: 'fatura_no' },
        { data: 'tarih' },
        { data: 'tutar', className: 'text-end amount', render: money },
        { data: 'kdv', className: 'text-end amount', render: money },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'fatura-rapor-alis': {
      columns: [
        { data: 'cari' },
        { data: 'fatura_no' },
        { data: 'tarih' },
        { data: 'tutar', className: 'text-end amount', render: money },
        { data: 'kdv', className: 'text-end amount', render: money },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-satis': {
      columns: [
        { data: 'irsaliye_no', render: function (d) { return '<strong>' + d + '</strong>'; } },
        { data: 'cari' },
        { data: 'tarih' },
        { data: 'adres' },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-alis': {
      columns: [
        { data: 'irsaliye_no', render: function (d) { return '<strong>' + d + '</strong>'; } },
        { data: 'cari' },
        { data: 'tarih' },
        { data: 'depo' },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-rapor-satis': {
      columns: [
        { data: 'cari' },
        { data: 'irsaliye_no' },
        { data: 'tarih' },
        { data: 'tutar', className: 'text-end amount', render: money },
        { data: 'kdv', className: 'text-end amount', render: money },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'irsaliye-rapor-alis': {
      columns: [
        { data: 'cari' },
        { data: 'irsaliye_no' },
        { data: 'tarih' },
        { data: 'depo' },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return standardActions(row); } }
      ],
      order: [[2, 'desc']]
    },
    'cari-liste': {
      columns: [
        { data: 'cari_kod' },
        { data: 'cari_unvan' },
        { data: 'telefon' },
        {
          data: 'bakiye',
          render: function (d, t, row) {
            var cls = row.bakiye_tip === 'A' ? 'text-success' : (row.bakiye_tip === 'B' ? 'text-danger' : '');
            var suffix = row.bakiye_tip ? ' (' + row.bakiye_tip + ')' : '';
            return '<span class="' + cls + '">' + money(d) + suffix + '</span>';
          }
        },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) { return cariActions(row); } }
      ],
      order: [[0, 'asc']],
      rowCallback: function (row, data) {
        row.setAttribute('data-cari-kod', data.cari_kod || '');
        row.setAttribute('data-cari-unvan', data.cari_unvan || '');
      }
    },
    'cari-hareketler': {
      columns: [
        { data: 'tarih' },
        { data: 'cari' },
        { data: 'islem' },
        { data: 'borc', className: 'text-end amount', render: money },
        { data: 'alacak', className: 'text-end amount', render: money },
        { data: 'bakiye', className: 'text-end amount', render: money },
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
        { data: 'stok_kod' },
        { data: 'urun' },
        { data: 'birim' },
        { data: 'miktar' },
        { data: 'alis', className: 'text-end amount', render: money },
        { data: 'satis', className: 'text-end amount', render: money },
        { data: 'durum', orderable: false, render: badgeDurum },
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
    'dashboard-faturalar': {
      columns: [
        { data: 'fatura_no', render: function (d, t, row) {
          return '<a href="' + (row.preview_url || '#') + '" class="fw-medium">' + d + '</a>';
        } },
        { data: 'cari' },
        { data: 'tarih' },
        { data: 'durum', orderable: false, render: badgeDurum },
        { data: 'actions', orderable: false, searchable: false, className: 'text-center', render: function (d, t, row) {
          return '<div class="d-flex justify-content-center gap-1">' +
            actionLink(row.preview_url || 'fatura-satis.html', 'ti-eye', 'info', 'Görüntüle') +
            actionBtn('ti-edit', 'primary', 'Düzenle', '') +
            '</div>';
        } }
      ],
      order: [[2, 'desc']],
      pageLength: 5,
      compact: true
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

    ensureTbodyRows(tableEl, tableKey, config, statusFilter);

    try {
      var dt = new DataTable(tableEl, {
        order: config.order || [[0, 'asc']],
        pageLength: pageLength,
        lengthMenu: [5, 10, 25, 50, 100],
        language: TR_LANG,
        layout: buildLayout(placeholder),
        drawCallback: function () {
          initTooltips(tableEl.closest('.card') || tableEl.parentElement);
        }
      });

      tableEl.setAttribute('data-dt-bound', '1');
      tableEl._ecariDt = dt;

      if (config.statusFilter) {
        document.querySelectorAll('[data-filter]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            document.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            statusFilter = btn.getAttribute('data-filter') || 'all';
            tableEl.setAttribute('data-status-filter', statusFilter);
            var tbody = tableEl.querySelector('tbody');
            if (tbody) {
              var rows = getTableRows(tableKey, statusFilter);
              tbody.innerHTML = rows.map(function (row) {
                return buildRowHtml(row, config);
              }).join('');
            }
            dt.rows().invalidate().draw(false);
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

  function initAll() {
    document.querySelectorAll('table.datatables-ajax:not([data-dt-bound])').forEach(initTable);
  }

  window.EcariDataTables = {
    init: initAll,
    initTable: initTable,
    TABLE_CONFIGS: TABLE_CONFIGS
  };
})();
