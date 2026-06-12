(function () {
  'use strict';

  var TAB_ROUTES = {
    dashboardTab: ['index.html', 'rapor-gelir-gider.html', 'rapor-kdv.html'],
    modulesTab: null,
    financeTab: ['kasa.html', 'banka.html', 'hizli-satis.html', 'gun-sonu-raporu.html'],
    reportsTab: ['fatura-satis-rapor.html', 'fatura-alis-rapor.html', 'irsaliye-satis-rapor.html', 'irsaliye-alis-rapor.html'],
    settingsTab: ['ayarlar-genel.html', 'ayarlar-menu.html', 'ayarlar-ozel.html']
  };

  function currentPage() {
    var p = window.location.pathname.split('/').pop();
    return p || 'index.html';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function detectActiveTab(path) {
    var keys = Object.keys(TAB_ROUTES);
    var i, tab, routes;
    for (i = 0; i < keys.length; i++) {
      tab = keys[i];
      routes = TAB_ROUTES[tab];
      if (routes && routes.indexOf(path) !== -1) return tab;
    }
    if (window.MenuApp) {
      var mod = MenuApp.getOrderedModules();
      var j, k, child;
      for (j = 0; j < mod.length; j++) {
        if (mod[j].href === path) return 'modulesTab';
        if (mod[j].children) {
          for (k = 0; k < mod[j].children.length; k++) {
            child = mod[j].children[k];
            if (child.href === path) return 'modulesTab';
          }
        }
      }
    }
    return 'dashboardTab';
  }

  function menuLink(href, icon, label, path, opts) {
    opts = opts || {};
    var active = href === path ? ' active' : '';
    var iconTone = opts.tone || 'default';
    var badge = opts.badge
      ? '<span class="menu-badge' + (opts.badgeType ? ' menu-badge-' + opts.badgeType : '') + '">' + escapeHtml(opts.badge) + '</span>'
      : '';
    return (
      '<li class="menu-item' + active + '">' +
      '<a class="menu-link" href="' + href + '">' +
      '<span class="menu-icon menu-icon-' + iconTone + '"><i class="ti ' + icon + '"></i></span>' +
      '<span class="menu-label">' + escapeHtml(label) + '</span>' +
      badge +
      '</a></li>'
    );
  }

  function menuHeading(label) {
    return '<li class="menu-heading"><span class="menu-label">' + escapeHtml(label) + '</span></li>';
  }

  var MODULE_TONES = ['primary', 'success', 'warning', 'info', 'danger', 'purple'];

  function renderModulesPanel(path) {
    if (!window.MenuApp) return '';
    var html = menuHeading('Modüller');
    MenuApp.getOrderedModules().forEach(function (item, idx) {
      var tone = MODULE_TONES[idx % MODULE_TONES.length];
      if (item.children && item.children.length) {
        html += menuHeading(item.label);
        item.children.forEach(function (child) {
          html += menuLink(child.href, item.icon, child.label, path, { tone: tone });
        });
        html += '<li><div class="menu-divider"></div></li>';
      } else if (item.href) {
        html += menuLink(item.href, item.icon, item.label, path, { tone: tone });
      }
    });
    return html;
  }

  function renderTabPane(id, linksHtml, active) {
    var show = active ? ' show active' : '';
    return (
      '<div class="tab-pane fade' + show + '" id="' + id + '" role="tabpanel">' +
      '<nav class="app-navbar"><ul class="side-menubar">' +
      linksHtml +
      '</ul></nav></div>'
    );
  }

  function renderSidebar() {
    var path = currentPage();
    var activeTab = detectActiveTab(path);

    var dashboardLinks =
      menuHeading('Dashboard') +
      menuLink('index.html', 'ti-smart-home', 'Ana Panel', path, { tone: 'primary' }) +
      menuLink('rapor-gelir-gider.html', 'ti-chart-bar', 'Gelir / Gider', path, { tone: 'success' }) +
      menuLink('rapor-kdv.html', 'ti-receipt-tax', 'KDV Raporu', path, { tone: 'warning' }) +
      menuHeading('Hızlı Erişim') +
      menuLink('fatura-satis.html', 'ti-file-invoice', 'Satış Faturaları', path, { tone: 'info', badge: '24', badgeType: 'soft' }) +
      menuLink('cari-liste.html', 'ti-users', 'Cari Hesaplar', path, { tone: 'purple' }) +
      menuLink('stok-liste.html', 'ti-packages', 'Stok & Ürünler', path, { tone: 'danger' }) +
      menuHeading('Özet') +
      menuLink('fatura-satis.html', 'ti-clock-hour-4', 'Bekleyen Faturalar', path, { tone: 'warning', badge: '12', badgeType: 'success' });

    var financeLinks =
      menuHeading('Finans') +
      menuLink('kasa.html', 'ti-cash', 'Kasa', path, { tone: 'success' }) +
      menuLink('banka.html', 'ti-building-bank', 'Banka', path, { tone: 'primary' }) +
      menuLink('hizli-satis.html', 'ti-bolt', 'Hızlı Satış', path, { tone: 'warning' }) +
      menuHeading('Tahsilat') +
      menuLink('cari-hareketler.html', 'ti-arrows-exchange', 'Cari Hareketler', path, { tone: 'info' }) +
      menuLink('gun-sonu-raporu.html', 'ti-report-money', 'Gün Sonu Raporu', path, { tone: 'purple' });

    var reportsLinks =
      menuHeading('Fatura') +
      menuLink('fatura-satis-rapor.html', 'ti-file-invoice', 'Satış Fatura Raporu', path, { tone: 'primary' }) +
      menuLink('fatura-alis-rapor.html', 'ti-file-invoice', 'Alış Fatura Raporu', path, { tone: 'info' }) +
      menuHeading('İrsaliye') +
      menuLink('irsaliye-satis-rapor.html', 'ti-truck-delivery', 'Satış İrsaliye', path, { tone: 'success' }) +
      menuLink('irsaliye-alis-rapor.html', 'ti-truck-delivery', 'Alış İrsaliye', path, { tone: 'warning' }) +
      menuHeading('Mali') +
      menuLink('rapor-gelir-gider.html', 'ti-chart-bar', 'Gelir / Gider', path, { tone: 'success' }) +
      menuLink('rapor-kdv.html', 'ti-receipt-tax', 'KDV Raporu', path, { tone: 'danger' });

    var settingsLinks =
      menuHeading('Sistem') +
      menuLink('ayarlar-genel.html', 'ti-settings', 'Genel Ayarlar', path, { tone: 'primary' }) +
      menuLink('ayarlar-menu.html', 'ti-layout-sidebar', 'Menü Düzeni', path, { tone: 'info' }) +
      menuLink('ayarlar-ozel.html', 'ti-adjustments', 'Özel Ayarlar', path, { tone: 'warning' }) +
      '<li><div class="menu-divider"></div></li>' +
      menuLink('v1/index.html', 'ti-versions', 'Klasik Arayüz (v1)', path, { tone: 'default' });

    function railTab(tabId, icon, title, tabKey) {
      var active = tabKey === activeTab ? ' active' : '';
      return (
        '<li class="nav-item" title="' + escapeHtml(title) + '">' +
        '<a class="menu-link' + active + '" href="#' + tabId + '" data-bs-toggle="tab" role="tab" aria-controls="' + tabId + '">' +
        '<i class="ti ' + icon + '"></i></a></li>'
      );
    }

    return (
      '<aside class="app-menubar-tabs" id="appMenubar">' +
        '<div class="app-navbar-brand"><a class="navbar-brand-logo" href="index.html">eC</a></div>' +
        '<div class="app-navbar-tabs">' +
          '<ul class="nav" role="tablist">' +
            railTab('dashboardTab', 'ti-smart-home', 'Dashboard', 'dashboardTab') +
            railTab('modulesTab', 'ti-apps', 'Modüller', 'modulesTab') +
            railTab('financeTab', 'ti-chart-pie', 'Finans', 'financeTab') +
            railTab('reportsTab', 'ti-report-analytics', 'Raporlar', 'reportsTab') +
            '<li class="nav-item-hr"></li>' +
            railTab('settingsTab', 'ti-settings', 'Ayarlar', 'settingsTab') +
            '<li class="nav-item mb-auto"></li>' +
            '<li class="nav-item" title="Yeni Satış Faturası">' +
              '<a href="fatura-yeni.html" class="btn-add-module"><i class="ti ti-plus"></i></a></li>' +
            '<li class="nav-item-hr"></li>' +
            '<li class="nav-item" title="Çıkış">' +
              '<a class="menu-link" href="login.html"><i class="ti ti-logout"></i></a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="app-tab-content">' +
          '<div class="app-side-brands"><a class="navbar-brand-text" href="index.html">e-Cari</a></div>' +
          '<div class="app-content-inner">' +
            '<div class="tab-content" id="appMenubarTabsContent">' +
              renderTabPane('dashboardTab', dashboardLinks, activeTab === 'dashboardTab') +
              '<div class="tab-pane fade' + (activeTab === 'modulesTab' ? ' show active' : '') + '" id="modulesTab" role="tabpanel">' +
                '<nav class="app-navbar"><ul class="side-menubar">' + renderModulesPanel(path) + '</ul></nav></div>' +
              renderTabPane('financeTab', financeLinks, activeTab === 'financeTab') +
              renderTabPane('reportsTab', reportsLinks, activeTab === 'reportsTab') +
              renderTabPane('settingsTab', settingsLinks, activeTab === 'settingsTab') +
            '</div>' +
            '<div class="card-gradient d-none d-xl-block">' +
              '<h6>e-Cari Pro</h6>' +
              '<p>Gelişmiş raporlar, e-fatura entegrasyonu ve çoklu kullanıcı desteği.</p>' +
              '<a href="ayarlar-ozel.html" class="btn btn-light btn-sm">Detaylar</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</aside>'
    );
  }

  function renderHeader() {
    if (window.NexLinkHeaderTemplate) return NexLinkHeaderTemplate.render();
    return '';
  }

  function renderFooter() {
    return (
      '<footer class="app-content-footer">' +
        '<div class="d-flex flex-wrap justify-content-between gap-2">' +
          '<span>&copy; <span class="footer-year"></span> <strong>e-Cari</strong> — Ön Muhasebe</span>' +
          '<div class="d-flex gap-3"><a href="ayarlar-genel.html" class="text-body-secondary text-decoration-none">Ayarlar</a><span>v2.0 NexLink</span></div>' +
        '</div></footer>'
    );
  }

  function syncSidebarOverlay() {
    var layout = document.querySelector('.page-layout');
    var menubar = document.getElementById('appMenubar');
    if (!layout || !menubar) return;
    var w = window.innerWidth;
    var panelOpen = menubar.classList.contains('open');
    if (w < 1200 && panelOpen) layout.classList.add('sidebar-open');
    else if (w < 1480 && w >= 1200 && panelOpen) layout.classList.add('sidebar-open');
    else layout.classList.remove('sidebar-open');
  }

  function closeSidebarPanel() {
    var layout = document.querySelector('.page-layout');
    var menubar = document.getElementById('appMenubar');
    if (menubar) menubar.classList.remove('open');
    if (layout) layout.classList.remove('sidebar-open');
    document.querySelectorAll('.app-toggler.active').forEach(function (el) {
      el.classList.remove('active');
    });
  }

  function bindSidebar() {
    var docEl = document.documentElement;
    var menubar = document.getElementById('appMenubar');
    var togglers = document.querySelectorAll('.app-toggler');
    var overlay = document.querySelector('.layout-overlay');

    if (!docEl.getAttribute('data-app-sidebar')) {
      docEl.setAttribute('data-app-sidebar', 'full');
    }

    togglers.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('active');
        if (menubar) menubar.classList.toggle('open');

        if (window.innerWidth >= 1280) {
          var current = docEl.getAttribute('data-app-sidebar');
          if (current === 'mini' || current === 'mini-hover') {
            docEl.setAttribute('data-app-sidebar', 'full');
          } else {
            docEl.setAttribute('data-app-sidebar', 'mini');
          }
        }

        syncSidebarOverlay();
      });
    });

    if (menubar) {
      menubar.addEventListener('mouseenter', function () {
        if (docEl.getAttribute('data-app-sidebar') === 'mini') {
          docEl.setAttribute('data-app-sidebar', 'mini-hover');
        }
      });
      menubar.addEventListener('mouseleave', function () {
        if (docEl.getAttribute('data-app-sidebar') === 'mini-hover') {
          docEl.setAttribute('data-app-sidebar', 'mini');
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', closeSidebarPanel);
    }

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1480) closeSidebarPanel();
      else if (window.innerWidth >= 1200) {
        if (menubar) menubar.classList.remove('open');
        syncSidebarOverlay();
      }
    });

    document.querySelectorAll('#appMenubar [data-bs-toggle="tab"]').forEach(function (tab) {
      tab.addEventListener('shown.bs.tab', function () {
        document.querySelectorAll('#appMenubar .app-navbar-tabs .menu-link[data-bs-toggle="tab"]').forEach(function (l) {
          l.classList.remove('active');
        });
        tab.classList.add('active');
      });
    });
  }

  function bindTheme() {
    var btn = document.getElementById('nl-theme-toggle');
    if (!btn) return;
    var current = document.documentElement.getAttribute('data-bs-theme');
    btn.classList.toggle('is-dark', current === 'dark');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var html = document.documentElement;
      var next = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-bs-theme', next);
      btn.classList.toggle('is-dark', next === 'dark');
    });
  }

  function injectLayout() {
    var sh = document.getElementById('nl-sidebar-host');
    var hh = document.getElementById('nl-header-host');
    var fh = document.getElementById('nl-footer-host');
    if (sh) sh.outerHTML = renderSidebar();
    if (hh) hh.outerHTML = renderHeader();
    if (!document.getElementById('searchResultsModal') && window.NexLinkHeaderTemplate) {
      document.body.insertAdjacentHTML('beforeend', NexLinkHeaderTemplate.renderSearchModal());
    }
    if (fh) fh.innerHTML = renderFooter();
    var y = document.querySelector('.footer-year');
    if (y) y.textContent = new Date().getFullYear();
    bindSidebar();
    bindTheme();
    if (window.bootstrap) {
      document.querySelectorAll('#appMenubar [title]').forEach(function (el) {
        new bootstrap.Tooltip(el);
      });
    }
    document.dispatchEvent(new Event('partialsLoaded'));
  }

  window.NexLinkLayout = { inject: injectLayout };
})();
