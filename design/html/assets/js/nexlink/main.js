(function () {
  'use strict';

  function loadScript(src, callback) {
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (callback) callback();
      return;
    }
    var script = document.createElement('script');
    script.src = src;
    script.onload = callback || null;
    script.onerror = callback || null;
    document.body.appendChild(script);
  }

  function loadDataTables(callback) {
    var tables = document.querySelectorAll('table.datatables-ajax');
    if (!tables.length) {
      if (callback) callback(false);
      return;
    }

    document.querySelectorAll('table.datatables-ajax').forEach(function (table) {
      var card = table.closest('.card');
      if (card) card.classList.add('datatables-toolbar-hidden');
    });

    if (window.DataTable && window.EcariDataTables) {
      window.EcariDataTables.init();
      if (callback) callback(true);
      return;
    }

    loadScript('https://code.jquery.com/jquery-3.7.1.min.js', function () {
      loadScript('https://cdn.datatables.net/2.1.8/js/dataTables.min.js', function () {
        loadScript('https://cdn.datatables.net/2.1.8/js/dataTables.bootstrap5.min.js', function () {
          loadScript('assets/js/datatables-data.js', function () {
            loadScript('assets/js/datatables-app.js', function () {
              if (window.EcariDataTables) window.EcariDataTables.init();
              if (callback) callback(true);
            });
          });
        });
      });
    });
  }

  function boot() {
    loadScript('assets/js/helpers.js', function () {
      loadScript('assets/js/menu-app.js', function () {
        loadScript('assets/js/nexlink/header-template.js', function () {
          loadScript('assets/js/nexlink/layout.js', function () {
            if (window.NexLinkLayout) NexLinkLayout.inject();

            loadDataTables(function () {
              loadScript('assets/js/notifications.js');
              loadScript('assets/js/elf-assistant.js', function () {
                document.dispatchEvent(new Event('partialsLoaded'));
              });

              var pageScript = document.body.getAttribute('data-page-script');
              if (pageScript && pageScript.indexOf('dashboard-shortcuts') !== -1) {
                loadScript('assets/js/dashboard-text.js', function () {
                  loadScript(pageScript);
                });
              } else if (pageScript) {
                var extraScripts = (document.body.getAttribute('data-page-scripts') || '')
                  .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                function loadPageScripts(i) {
                  if (i >= extraScripts.length) {
                    loadScript(pageScript);
                    return;
                  }
                  loadScript(extraScripts[i], function () { loadPageScripts(i + 1); });
                }
                loadPageScripts(0);
              }

              var initName = document.body.getAttribute('data-page-init');
              if (initName && typeof window[initName] === 'function') window[initName]();
            });
          });
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
