(function () {
  'use strict';

  function markActiveMenu() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    if (!current) current = 'index.html';

    document.querySelectorAll('.menu-item.active').forEach(function (el) {
      el.classList.remove('active');
    });

    document.querySelectorAll('.menu-link[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.indexOf('javascript') === 0) return;

      var linkFile = href.split('/').pop();
      var item = link.closest('.menu-item');

      if (linkFile === current) {
        if (item) item.classList.add('active');
        var parent = item ? item.parentElement.closest('.menu-item') : null;
        while (parent) {
          parent.classList.add('open');
          parent = parent.parentElement ? parent.parentElement.closest('.menu-item') : null;
        }
      }
    });
  }

  function initThemeSwitcher() {
    var saved = localStorage.getItem('theme') || 'light';
    document.querySelectorAll('[data-bs-theme-value]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-bs-theme-value') === saved);
    });
  }

  if (!window.__menuDelegationBound) {
    window.__menuDelegationBound = true;
    var html = document.documentElement;

    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('.layout-menu-toggle');
      if (toggle) {
        e.preventDefault();
        if (window.innerWidth >= 1200) {
          window.Helpers.setCollapsed(!html.classList.contains('layout-menu-collapsed'));
        } else {
          html.classList.toggle('layout-menu-expanded');
        }
        return;
      }

      if (e.target.closest('.layout-overlay')) {
        html.classList.remove('layout-menu-expanded');
        return;
      }

      var menuToggle = e.target.closest('.menu-link.menu-toggle');
      if (menuToggle) {
        e.preventDefault();
        var item = menuToggle.closest('.menu-item');
        if (!item) return;
        var isOpen = item.classList.contains('open');
        var parent = item.parentElement;
        if (parent) {
          parent.querySelectorAll(':scope > .menu-item.open').forEach(function (sibling) {
            if (sibling !== item) sibling.classList.remove('open');
          });
        }
        item.classList.toggle('open', !isOpen);
      }

      var themeBtn = e.target.closest('[data-bs-theme-value]');
      if (themeBtn && window.Helpers.setTheme) {
        var theme = themeBtn.getAttribute('data-bs-theme-value');
        window.Helpers.setTheme(theme);
        document.querySelectorAll('[data-bs-theme-value]').forEach(function (b) { b.classList.remove('active'); });
        themeBtn.classList.add('active');
      }
    });
  }

  window.__menuInit = function () {
    markActiveMenu();
    initThemeSwitcher();
    initMenuScrollbar();
  };

  var menuPs = null;

  function destroyMenuScrollbar() {
    if (menuPs) {
      menuPs.destroy();
      menuPs = null;
    }
  }

  function initMenuScrollbar() {
    var menuInner = document.querySelector('#layout-menu .menu-inner');
    if (!menuInner) return;

    destroyMenuScrollbar();

    if (window.innerWidth >= 1200 && window.PerfectScrollbar) {
      menuInner.classList.remove('overflow-auto');
      menuPs = new window.PerfectScrollbar(menuInner, {
        suppressScrollX: true,
        wheelPropagation: false
      });

      var shadow = document.querySelector('.menu-inner-shadow');
      if (shadow && !menuInner.dataset.psShadowBound) {
        menuInner.dataset.psShadowBound = '1';
        menuInner.addEventListener('ps-scroll-y', function () {
          var thumb = menuInner.querySelector('.ps__thumb-y');
          shadow.style.display = thumb && thumb.offsetTop ? 'block' : 'none';
        });
      }
    } else {
      menuInner.classList.add('overflow-auto');
    }
  }

  document.addEventListener('partialsLoaded', function () {
    window.__menuInit();
    var theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    if (window.Helpers.syncMenuTheme) {
      window.Helpers.syncMenuTheme(theme);
    }
    if (window.Helpers.getSetting('SemiDark') === 'true') {
      window.Helpers.setSemiDarkMenu(true);
    }
    if (window.Helpers.initNavbarDropdownScrollbar) {
      window.Helpers.initNavbarDropdownScrollbar();
    }
  });

  window.addEventListener('resize', function () {
    initMenuScrollbar();
  });
})();

