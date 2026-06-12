(function () {
  'use strict';

  var STORAGE_KEY = 'templateCustomizer-fatura';

  function getSetting(key) {
    try { return localStorage.getItem(STORAGE_KEY + '--' + key); } catch (e) { return null; }
  }

  function setSetting(key, value) {
    try { localStorage.setItem(STORAGE_KEY + '--' + key, String(value)); } catch (e) {}
  }

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  window.Helpers = {
    getSetting: getSetting,
    setSetting: setSetting,
    getCssVar: function (name) {
      return getComputedStyle(document.documentElement).getPropertyValue('--bs-' + name).trim();
    },
    setCollapsed: function (collapsed, persist) {
      document.documentElement.classList.toggle('layout-menu-collapsed', collapsed);
      if (persist !== false) setSetting('LayoutCollapsed', collapsed);
    },
    setTheme: function (theme) {
      var resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-bs-theme', resolved);
      setSetting('Theme', theme);
      localStorage.setItem('theme', theme === 'system' ? resolved : theme);
      this.syncMenuTheme(resolved);
    },
    syncMenuTheme: function (resolved) {
      var menu = document.getElementById('layout-menu');
      if (!menu) return;
      var isDark = resolved === 'dark' || (resolved !== 'light' && document.documentElement.getAttribute('data-bs-theme') === 'dark');
      if (this.getSetting('SemiDark') === 'true' || isDark) {
        menu.setAttribute('data-bs-theme', 'dark');
      } else {
        menu.removeAttribute('data-bs-theme');
      }
    },
    setColor: function (color) {
      document.documentElement.style.setProperty('--bs-primary', color);
      document.documentElement.style.setProperty('--bs-link-color', color);
      var rgb = hexToRgb(color);
      if (rgb) document.documentElement.style.setProperty('--bs-primary-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
      setSetting('Color', color);
    },
    setSkin: function (skin) {
      document.documentElement.setAttribute('data-skin', skin);
      setSetting('Skin', skin);
    },
    setSemiDarkMenu: function (enabled) {
      var menu = document.getElementById('layout-menu');
      if (enabled) {
        document.documentElement.setAttribute('data-semidark-menu', 'true');
        if (menu) menu.setAttribute('data-bs-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-semidark-menu');
        if (menu) menu.removeAttribute('data-bs-theme');
        this.syncMenuTheme(document.documentElement.getAttribute('data-bs-theme') || 'light');
      }
      setSetting('SemiDark', enabled);
    },
    setContentLayout: function (layout) {
      document.documentElement.classList.toggle('layout-wide', layout === 'wide');
      document.documentElement.classList.toggle('layout-compact', layout !== 'wide');
      setSetting('contentLayout', layout);
    },
    setNavbar: function (type) {
      var html = document.documentElement;
      html.classList.remove('layout-navbar-fixed', 'layout-navbar-hidden', 'layout-navbar-static');
      if (type === 'sticky') html.classList.add('layout-navbar-fixed');
      if (type === 'static') html.classList.add('layout-navbar-static');
      if (type === 'hidden') html.classList.add('layout-navbar-hidden');
      setSetting('NavbarType', type);
    },
    clearSettings: function () {
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf(STORAGE_KEY) === 0 || key === 'theme' || key === 'menuCollapsed') {
          localStorage.removeItem(key);
        }
      });
      location.reload();
    },
    updateScrollbarWidth: function () {
      var w = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--bs-scrollbar-width', w + 'px');
    },
    initNavbarDropdownScrollbar: function () {
      if (!window.PerfectScrollbar) return;
      document.querySelectorAll('.navbar-dropdown .scrollable-container').forEach(function (el) {
        if (el.classList.contains('ps')) return;
        new window.PerfectScrollbar(el, {
          wheelPropagation: false,
          suppressScrollX: true
        });
      });
    },
    loadSettings: function () {
      var color = getSetting('Color');
      if (color) this.setColor(color);
      var theme = getSetting('Theme') || localStorage.getItem('theme') || 'light';
      this.setTheme(theme);
      var skin = getSetting('Skin') || 'default';
      this.setSkin(skin);
      if (getSetting('SemiDark') === 'true') this.setSemiDarkMenu(true);
      if (getSetting('LayoutCollapsed') === 'true') this.setCollapsed(true, false);
      var content = getSetting('contentLayout') || 'compact';
      this.setContentLayout(content);
      var navbar = getSetting('NavbarType') || 'sticky';
      this.setNavbar(navbar);
    }
  };

  window.Helpers.loadSettings();
})();
