(function () {
  'use strict';

  var dragId = null;

  function showToast(message) {
    var existing = document.querySelector('.menu-settings-toast');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.className = 'menu-settings-toast alert alert-success shadow-sm mb-0';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  function renderOrderList() {
    var list = document.getElementById('menuOrderList');
    if (!list || !window.MenuApp) return;

    var modules = MenuApp.getOrderedModules();
    list.innerHTML = modules.map(function (item, index) {
      return (
        '<li class="menu-sort-item" draggable="true" data-id="' + item.id + '">' +
        '<span class="menu-sort-handle"><i class="ti ti-grip-vertical"></i></span>' +
        '<span class="menu-sort-icon"><i class="ti ' + item.icon + '"></i></span>' +
        '<span class="menu-sort-label">' + item.label + '</span>' +
        '<div class="menu-sort-actions">' +
        '<button type="button" class="btn btn-sm btn-icon btn-text-secondary menu-move-up" data-id="' + item.id + '" title="Yukarı"' + (index === 0 ? ' disabled' : '') + '>' +
        '<i class="ti ti-chevron-up"></i></button>' +
        '<button type="button" class="btn btn-sm btn-icon btn-text-secondary menu-move-down" data-id="' + item.id + '" title="Aşağı"' + (index === modules.length - 1 ? ' disabled' : '') + '>' +
        '<i class="ti ti-chevron-down"></i></button>' +
        '</div></li>'
      );
    }).join('');

    bindDragEvents(list);
  }

  function renderShortcutList() {
    var list = document.getElementById('shortcutPickList');
    if (!list || !window.MenuApp) return;

    var modules = MenuApp.getDashboardModuleCandidates();
    var html = '';
    modules.forEach(function (item) {
      var checked = MenuApp.isModuleOnDashboard(item.id) ? ' checked' : '';
      html +=
        '<div class="shortcut-pick-item">' +
        '<div class="shortcut-pick-meta">' +
        '<span class="menu-sort-icon"><i class="ti ' + item.icon + '"></i></span>' +
        '<div><div class="fw-medium">' + item.label + '</div></div></div>' +
        '<div class="form-check form-switch mb-0">' +
        '<input class="form-check-input shortcut-toggle" type="checkbox" id="sc-' + item.id + '" data-id="' + item.id + '"' + checked + '>' +
        '<label class="form-check-label visually-hidden" for="sc-' + item.id + '">Dashboard</label></div></div>';
    });
    list.innerHTML = html;
  }

  function moveItem(id, direction) {
    var order = MenuApp.getOrder();
    var idx = order.indexOf(id);
    if (idx === -1) return;
    var next = idx + direction;
    if (next < 0 || next >= order.length) return;
    var temp = order[idx];
    order[idx] = order[next];
    order[next] = temp;
    MenuApp.saveOrder(order);
    renderOrderList();
    refreshSidebar();
    showToast('Menü sırası güncellendi.');
  }

  function bindDragEvents(list) {
    list.querySelectorAll('.menu-sort-item').forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        dragId = item.getAttribute('data-id');
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', function () {
        item.classList.remove('dragging');
        list.querySelectorAll('.drag-over').forEach(function (el) { el.classList.remove('drag-over'); });
        dragId = null;
      });
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', function () {
        item.classList.remove('drag-over');
      });
      item.addEventListener('drop', function (e) {
        e.preventDefault();
        item.classList.remove('drag-over');
        var targetId = item.getAttribute('data-id');
        if (!dragId || dragId === targetId) return;
        var order = MenuApp.getOrder();
        var from = order.indexOf(dragId);
        var to = order.indexOf(targetId);
        if (from === -1 || to === -1) return;
        order.splice(from, 1);
        order.splice(to, 0, dragId);
        MenuApp.saveOrder(order);
        renderOrderList();
        refreshSidebar();
        showToast('Menü sırası güncellendi.');
      });
    });
  }

  function refreshSidebar() {
    var menu = document.getElementById('layout-menu');
    if (!menu || !window.MenuApp) return;
    menu.outerHTML = MenuApp.renderSidebarHtml();
    if (window.__menuInit) window.__menuInit();
  }

  function init() {
    renderOrderList();
    renderShortcutList();

    document.getElementById('menuOrderList').addEventListener('click', function (e) {
      var up = e.target.closest('.menu-move-up');
      var down = e.target.closest('.menu-move-down');
      if (up) moveItem(up.getAttribute('data-id'), -1);
      if (down) moveItem(down.getAttribute('data-id'), 1);
    });

    document.getElementById('shortcutPickList').addEventListener('change', function (e) {
      var toggle = e.target.closest('.shortcut-toggle');
      if (!toggle) return;
      MenuApp.toggleModuleShortcut(toggle.getAttribute('data-id'), toggle.checked);
      showToast(toggle.checked ? 'Modül dashboard\'a eklendi.' : 'Modül dashboard\'dan kaldırıldı.');
    });

    document.getElementById('btnResetMenu').addEventListener('click', function () {
      if (!confirm('Menü sırası ve kısayollar varsayılana dönsün mü?')) return;
      MenuApp.resetToDefaults();
      renderOrderList();
      renderShortcutList();
      refreshSidebar();
      showToast('Varsayılan ayarlar yüklendi.');
    });

    document.addEventListener('menuConfigChanged', refreshSidebar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
