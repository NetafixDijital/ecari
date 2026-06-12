(function () {

  'use strict';



  function loadMenuApp(callback) {

    if (window.MenuApp) {

      callback();

      return;

    }

    var script = document.createElement('script');

    script.src = 'assets/js/menu-app.js';

    script.onload = callback;

    script.onerror = callback;

    document.head.appendChild(script);

  }



  function injectPartials() {

    if (!window.APP_PARTIALS) return false;



    var sidebarEl = document.getElementById('app-sidebar');

    if (sidebarEl && window.MenuApp) {

      sidebarEl.outerHTML = window.MenuApp.renderSidebarHtml();

    } else if (sidebarEl && window.APP_PARTIALS.sidebar) {

      sidebarEl.outerHTML = window.APP_PARTIALS.sidebar;

    }



    var navbarEl = document.getElementById('app-navbar');

    if (navbarEl && window.APP_PARTIALS.navbar) {

      navbarEl.innerHTML = window.APP_PARTIALS.navbar;

    }



    var footerEl = document.getElementById('app-footer');

    if (footerEl && window.APP_PARTIALS.footer) {

      footerEl.innerHTML = window.APP_PARTIALS.footer;

      var yearEl = footerEl.querySelector('.footer-year');

      if (yearEl) yearEl.textContent = new Date().getFullYear();

    }



    document.dispatchEvent(new Event('partialsLoaded'));

    return true;

  }



  function updateScrollbarWidth() {

    if (window.Helpers && window.Helpers.updateScrollbarWidth) {

      window.Helpers.updateScrollbarWidth();

    }

  }



  function initWindowScrolled() {

    var layoutPage = document.querySelector('.layout-page');

    if (!layoutPage || layoutPage.dataset.scrollBound) return;

    layoutPage.dataset.scrollBound = '1';



    function onScroll() {

      layoutPage.classList.toggle('window-scrolled', window.scrollY > 0);

    }



    window.addEventListener('scroll', onScroll, { passive: true });

    onScroll();

  }



  function loadScript(src, callback) {

    var existing = document.querySelector('script[src="' + src + '"]');

    if (existing) {

      if (callback) callback();

      return;

    }

    var script = document.createElement('script');

    script.src = src;

    script.onload = callback || null;

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



  function loadTableSearch() {

    if (document.querySelector('table.datatables-ajax')) return;



    if (window.TableSearch) {

      window.TableSearch.init();

      return;

    }

    var script = document.createElement('script');

    script.src = 'assets/js/table-search.js';

    script.onload = function () {

      if (window.TableSearch) window.TableSearch.init();

    };

    document.body.appendChild(script);

  }



  function boot() {

    loadMenuApp(function () {

      injectPartials();

      updateScrollbarWidth();

      initWindowScrolled();

      loadDataTables(function (hasDt) {

        if (!hasDt) loadTableSearch();

      });

      loadScript('assets/js/notifications.js');
      loadScript('assets/js/elf-assistant.js');

    });

  }



  window.addEventListener('resize', updateScrollbarWidth);



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }



  updateScrollbarWidth();

})();


