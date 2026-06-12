(function () {
  'use strict';

  var SKIP_TABLE_IDS = { servisTable: true };

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isSearchableTable(table) {
    if (!table || !table.classList.contains('table')) return false;
    if (table.classList.contains('table-no-search')) return false;
    if (table.dataset.tableSearch === 'off') return false;
    if (SKIP_TABLE_IDS[table.id]) return false;
    if (table.closest('[data-table-no-search]')) return false;

    var thead = table.querySelector('thead');
    var tbody = table.querySelector('tbody');
    if (!thead || !tbody) return false;

    var rows = tbody.querySelectorAll('tr');
    if (!rows.length) return false;

    var first = rows[0];
    if (!first.querySelector('td')) return false;

    var inputs = first.querySelectorAll('td input.form-control, td select.form-control, td textarea.form-control');
    if (inputs.length >= 2) return false;

    if (table.classList.contains('table-borderless')) return false;

    return true;
  }

  function findExistingInput(table) {
    var card = table.closest('.card');
    if (!card) return null;
    var input = card.querySelector('.card-header input[type="text"], .card-header input[type="search"]');
    if (input && !input.dataset.tableSearchSkip) return input;
    return null;
  }

  function ensureEmptyRow(table, tbody) {
    var colCount = table.querySelectorAll('thead th').length || 1;
    var row = tbody.querySelector('tr.table-search-empty-row');
    if (!row) {
      row = document.createElement('tr');
      row.className = 'table-search-empty-row d-none';
      row.innerHTML = '<td colspan="' + colCount + '" class="table-search-empty">Arama kriterine uygun kayıt bulunamadı.</td>';
      tbody.appendChild(row);
    } else {
      row.querySelector('td').setAttribute('colspan', colCount);
    }
    return row;
  }

  function bindSearch(table, input) {
    if (table.dataset.searchBound === '1') return;
    table.dataset.searchBound = '1';

    var tbody = table.querySelector('tbody');
    if (!tbody) return;

    var emptyRow = ensureEmptyRow(table, tbody);
    var countEl = input.closest('.table-search-toolbar') &&
      input.closest('.table-search-toolbar').querySelector('.table-search-count');

    function runFilter() {
      var q = norm(input.value);
      var visible = 0;
      var total = 0;

      tbody.querySelectorAll('tr').forEach(function (row) {
        if (row.classList.contains('table-search-empty-row')) return;
        if (!row.querySelector('td')) return;
        total += 1;
        var show = !q || norm(row.textContent).indexOf(q) !== -1;
        row.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });

      emptyRow.classList.toggle('d-none', visible > 0 || !q);
      table.classList.toggle('table-search-active', !!q);

      if (countEl) {
        if (q) {
          countEl.classList.remove('d-none');
          countEl.textContent = visible + ' / ' + total;
        } else {
          countEl.classList.add('d-none');
          countEl.textContent = '';
        }
      }
    }

    input.classList.add('table-search-input');
    if (!input.placeholder) input.placeholder = 'Tabloda ara...';
    input.setAttribute('autocomplete', 'off');

    input.addEventListener('input', runFilter);
    input.addEventListener('search', runFilter);

    table._tableSearchRefresh = runFilter;
  }

  function createToolbar(table) {
    var responsive = table.closest('.table-responsive');
    var host = responsive ? responsive.parentElement : table.parentElement;
    if (!host) return null;

    if (host.querySelector(':scope > .table-search-toolbar')) {
      return host.querySelector('.table-search-toolbar .table-search-input');
    }

    var toolbar = document.createElement('div');
    toolbar.className = 'table-search-toolbar';
    toolbar.innerHTML =
      '<div class="input-group input-group-merge table-search-group">' +
      '<span class="input-group-text"><i class="ti ti-search"></i></span>' +
      '<input type="search" class="form-control table-search-input" placeholder="Tabloda ara..." autocomplete="off">' +
      '<span class="input-group-text table-search-count d-none"></span></div>';

    if (responsive) {
      host.insertBefore(toolbar, responsive);
    } else {
      host.insertBefore(toolbar, table);
    }

    return toolbar.querySelector('.table-search-input');
  }

  function initTable(table) {
    if (!isSearchableTable(table)) return;

    var input = findExistingInput(table) || createToolbar(table);
    if (!input) return;

    bindSearch(table, input);
  }

  function initAll(root) {
    var scope = root || document;
    scope.querySelectorAll('table.table').forEach(initTable);
  }

  window.TableSearch = {
    init: initAll,
    initTable: initTable,
    refresh: function (table) {
      if (table && typeof table._tableSearchRefresh === 'function') {
        table._tableSearchRefresh();
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    initAll();
  });

  document.addEventListener('partialsLoaded', function () {
    initAll();
  });

  document.addEventListener('shown.bs.modal', function (e) {
    initAll(e.target);
    e.target.querySelectorAll('table.table').forEach(function (table) {
      if (table._tableSearchRefresh) table._tableSearchRefresh();
    });
  });
})();
