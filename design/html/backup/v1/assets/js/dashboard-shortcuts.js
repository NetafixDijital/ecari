(function () {
  'use strict';

  var T = window.DASHBOARD_TEXT || {};

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildShortcutsShell() {
    var root = document.getElementById('dashboardShortcuts');
    if (!root || root.dataset.built === '1') return;
    root.dataset.built = '1';
    root.className = 'card dashboard-shortcuts';
    root.innerHTML =
      '<div class="card-header">' +
      '<div><h5 class="mb-0">' + escapeHtml(T.quickAccess || 'Modüller') + '</h5>' +
      '<small class="text-body-secondary">' + escapeHtml(T.quickAccessDesc || '') + '</small></div>' +
      '<a href="ayarlar-menu.html" class="btn btn-sm btn-label-primary">' +
      '<i class="ti ti-settings me-1"></i> ' + escapeHtml(T.edit || 'Düzenle') + '</a></div>' +
      '<div class="card-body">' +
      '<div class="dashboard-shortcuts-empty d-none">' +
      '<p class="mb-2">' + escapeHtml(T.noShortcuts || '') + '</p>' +
      '<a href="ayarlar-menu.html" class="btn btn-sm btn-primary">' + escapeHtml(T.addShortcut || 'Kısayol Ekle') + '</a></div>' +
      '<div class="dashboard-shortcuts-grid"></div></div>';
  }

  function renderCards() {
    var root = document.getElementById('dashboardShortcuts');
    if (!root || !window.MenuApp) return;

    var grid = root.querySelector('.dashboard-shortcuts-grid');
    var empty = root.querySelector('.dashboard-shortcuts-empty');
    if (!grid) return;

    var cards = MenuApp.getShortcutCards();
    if (!cards.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('d-none');
      return;
    }

    if (empty) empty.classList.add('d-none');
    grid.innerHTML = cards.map(function (card) {
      return (
        '<a href="' + escapeHtml(card.href) + '" class="dashboard-shortcut-card">' +
        '<span class="dashboard-shortcut-icon"><i class="ti ' + escapeHtml(card.icon) + '"></i></span>' +
        '<span class="dashboard-shortcut-label">' + escapeHtml(card.label) + '</span></a>'
      );
    }).join('');
  }

  function render() {
    buildShortcutsShell();
    renderCards();
  }

  function boot() {
    if (window.MenuApp && window.DASHBOARD_TEXT) {
      render();
      return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if ((window.MenuApp && window.DASHBOARD_TEXT) || tries > 50) {
        clearInterval(timer);
        render();
      }
    }, 50);
  }

  document.addEventListener('menuConfigChanged', renderCards);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
