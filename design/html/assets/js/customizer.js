(function () {
  'use strict';

  var COLORS = ['#7367f0', '#28c76f', '#ff4c51', '#ff9f43', '#00bad1', '#2092EC'];

  function syncUI(panel) {
    var html = document.documentElement;
    panel.querySelectorAll('[data-bs-theme-value]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-bs-theme-value') === (window.Helpers.getSetting('Theme') || 'light'));
    });
    panel.querySelectorAll('[data-skin-value]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-skin-value') === (html.getAttribute('data-skin') || 'default'));
    });
    panel.querySelectorAll('[data-content-layout]').forEach(function (btn) {
      var wide = html.classList.contains('layout-wide');
      btn.classList.toggle('active', (btn.getAttribute('data-content-layout') === 'wide') === wide);
    });
    panel.querySelectorAll('[data-navbar-type]').forEach(function (btn) {
      var type = 'sticky';
      if (html.classList.contains('layout-navbar-hidden')) type = 'hidden';
      if (html.classList.contains('layout-navbar-static')) type = 'static';
      btn.classList.toggle('active', btn.getAttribute('data-navbar-type') === type);
    });
    var color = window.Helpers.getSetting('Color');
    panel.querySelectorAll('.color-option').forEach(function (el) {
      el.classList.toggle('active', el.dataset.color === color);
    });
    var collapsed = document.getElementById('customizer-collapsed');
    if (collapsed) collapsed.checked = html.classList.contains('layout-menu-collapsed');
    var semiDark = document.getElementById('customizer-semidark');
    if (semiDark) semiDark.checked = html.getAttribute('data-semidark-menu') === 'true';
  }

  function buildCustomizer() {
    if (document.documentElement.classList.contains('customizer-hide')) return;
    if (document.getElementById('template-customizer')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'template-customizer-open-btn';
    btn.title = 'Tema Özelleştirici';
    btn.innerHTML = '<i class="ti ti-settings icon-md"></i>';

    var panel = document.createElement('div');
    panel.id = 'template-customizer';
    panel.className = 'template-customizer';
    panel.innerHTML =
      '<div class="template-customizer-header">' +
        '<div><h5 class="mb-0">Tema Özelleştirici</h5><small class="text-body-secondary">Canlı önizleme</small></div>' +
        '<button type="button" class="btn btn-sm btn-icon btn-text-secondary" id="customizer-close"><i class="ti ti-x"></i></button>' +
      '</div>' +
      '<div class="template-customizer-body">' +
        '<div class="customizer-section"><h6>Ana Renk</h6><div class="color-options" id="color-options"></div></div>' +
        '<div class="customizer-section"><h6>Tema</h6>' +
          '<div class="d-flex gap-2 flex-wrap">' +
            '<button type="button" class="btn btn-sm btn-outline-primary flex-fill" data-bs-theme-value="light"><i class="ti ti-sun me-1"></i>Açık</button>' +
            '<button type="button" class="btn btn-sm btn-outline-primary flex-fill" data-bs-theme-value="dark"><i class="ti ti-moon me-1"></i>Koyu</button>' +
          '</div></div>' +
        '<div class="customizer-section"><h6>Stil (Skin)</h6>' +
          '<div class="d-flex gap-2">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary flex-fill" data-skin-value="default">Default</button>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary flex-fill" data-skin-value="bordered">Bordered</button>' +
          '</div></div>' +
        '<div class="customizer-section"><h6>Menü</h6>' +
          '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="customizer-collapsed"><label class="form-check-label" for="customizer-collapsed">Daraltılmış menü</label></div>' +
          '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="customizer-semidark"><label class="form-check-label" for="customizer-semidark">Yarı koyu menü</label></div>' +
        '</div>' +
        '<div class="customizer-section"><h6>İçerik Genişliği</h6>' +
          '<div class="d-flex gap-2">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary flex-fill" data-content-layout="compact">Compact</button>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary flex-fill" data-content-layout="wide">Wide</button>' +
          '</div></div>' +
        '<div class="customizer-section"><h6>Navbar</h6>' +
          '<div class="d-flex gap-2 flex-wrap">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-navbar-type="sticky">Sticky</button>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-navbar-type="static">Static</button>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-navbar-type="hidden">Hidden</button>' +
          '</div></div>' +
        '<button type="button" class="btn btn-label-danger w-100" id="customizer-reset"><i class="ti ti-refresh me-1"></i> Sıfırla</button>' +
      '</div>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var colorWrap = panel.querySelector('#color-options');
    COLORS.forEach(function (color) {
      var swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'color-option';
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      colorWrap.appendChild(swatch);
    });

    btn.addEventListener('click', function () {
      panel.classList.add('open');
      syncUI(panel);
      if (window.PerfectScrollbar && !panel.querySelector('.template-customizer-body.ps')) {
        var body = panel.querySelector('.template-customizer-body');
        if (body) {
          new window.PerfectScrollbar(body, { suppressScrollX: true, wheelPropagation: false });
        }
      }
    });
    panel.querySelector('#customizer-close').addEventListener('click', function () { panel.classList.remove('open'); });

    panel.addEventListener('click', function (e) {
      var themeBtn = e.target.closest('[data-bs-theme-value]');
      if (themeBtn) {
        window.Helpers.setTheme(themeBtn.getAttribute('data-bs-theme-value'));
        syncUI(panel);
      }
      var skinBtn = e.target.closest('[data-skin-value]');
      if (skinBtn) {
        window.Helpers.setSkin(skinBtn.getAttribute('data-skin-value'));
        syncUI(panel);
      }
      var layoutBtn = e.target.closest('[data-content-layout]');
      if (layoutBtn) {
        window.Helpers.setContentLayout(layoutBtn.getAttribute('data-content-layout'));
        syncUI(panel);
      }
      var navBtn = e.target.closest('[data-navbar-type]');
      if (navBtn) {
        window.Helpers.setNavbar(navBtn.getAttribute('data-navbar-type'));
        syncUI(panel);
      }
      var colorBtn = e.target.closest('.color-option');
      if (colorBtn) {
        window.Helpers.setColor(colorBtn.dataset.color);
        syncUI(panel);
      }
    });

    document.getElementById('customizer-collapsed').addEventListener('change', function (e) {
      window.Helpers.setCollapsed(e.target.checked);
    });
    document.getElementById('customizer-semidark').addEventListener('change', function (e) {
      window.Helpers.setSemiDarkMenu(e.target.checked);
    });
    document.getElementById('customizer-reset').addEventListener('click', function () {
      window.Helpers.clearSettings();
    });

    syncUI(panel);
  }

  document.addEventListener('partialsLoaded', function () {
    if (window.Helpers.getSetting('SemiDark') === 'true') {
      window.Helpers.setSemiDarkMenu(true);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCustomizer);
  } else {
    buildCustomizer();
  }
})();
