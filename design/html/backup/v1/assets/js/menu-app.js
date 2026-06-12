(function () {
  'use strict';

  var STORAGE_ORDER = 'MenuOrder';
  var STORAGE_SHORTCUTS = 'DashboardShortcuts';

  var MODULE_ITEMS = [
    {
      id: 'fatura',
      label: 'Fatura',
      icon: 'ti-file-invoice',
      children: [
        { id: 'fatura-alis', label: 'Alış Fatura', href: 'fatura-alis.html' },
        { id: 'fatura-alis-rapor', label: 'Fatura Raporu', href: 'fatura-alis-rapor.html' },
        { id: 'fatura-satis', label: 'Satış Fatura', href: 'fatura-satis.html' },
        { id: 'fatura-satis-rapor', label: 'Fatura Raporu', href: 'fatura-satis-rapor.html' }
      ]
    },
    {
      id: 'irsaliye',
      label: 'İrsaliye',
      icon: 'ti-truck-delivery',
      children: [
        { id: 'irsaliye-alis', label: 'Alış İrsaliye', href: 'irsaliye-alis.html' },
        { id: 'irsaliye-alis-rapor', label: 'İrsaliye Raporu', href: 'irsaliye-alis-rapor.html' },
        { id: 'irsaliye-satis', label: 'Satış İrsaliye', href: 'irsaliye-satis.html' },
        { id: 'irsaliye-satis-rapor', label: 'İrsaliye Raporu', href: 'irsaliye-satis-rapor.html' }
      ]
    },
    {
      id: 'siparis',
      label: 'Sipariş',
      icon: 'ti-shopping-cart',
      children: [
        { id: 'siparis-liste', label: 'Sipariş Listesi', href: 'siparis-liste.html' },
        { id: 'siparis-yeni', label: 'Yeni Sipariş', href: 'siparis-yeni.html' }
      ]
    },
    {
      id: 'depo',
      label: 'Depo',
      icon: 'ti-building-warehouse',
      children: [
        { id: 'depo-liste', label: 'Depo Listesi', href: 'depo-liste.html' },
        { id: 'depo-hareketler', label: 'Stok Hareketleri', href: 'depo-hareketler.html' }
      ]
    },
    {
      id: 'cari',
      label: 'Cari',
      icon: 'ti-users',
      children: [
        { id: 'cari-liste', label: 'Cari Listesi', href: 'cari-liste.html' },
        { id: 'cari-hareketler', label: 'Cari Hareketler', href: 'cari-hareketler.html' }
      ]
    },
    {
      id: 'stok',
      label: 'Stok',
      icon: 'ti-packages',
      children: [
        { id: 'stok-liste', label: 'Ürün Listesi', href: 'stok-liste.html' }
      ]
    },
    {
      id: 'hizli-satis',
      label: 'Hızlı Satış',
      icon: 'ti-bolt',
      href: 'hizli-satis.html'
    },
    {
      id: 'servis',
      label: 'Servis',
      icon: 'ti-tool',
      children: [
        { id: 'servis-liste', label: 'Servis Listesi', href: 'servis-liste.html' },
        { id: 'servis-yeni', label: 'Yeni Servis Kaydı', href: 'servis-yeni.html' }
      ]
    },
    {
      id: 'kasa',
      label: 'Kasa',
      icon: 'ti-cash',
      href: 'kasa.html'
    },
    {
      id: 'banka',
      label: 'Banka',
      icon: 'ti-building-bank',
      href: 'banka.html'
    }
  ];

  var SETTINGS_ITEMS = [
    { id: 'ayarlar-genel', label: 'Genel Ayarlar', icon: 'ti-settings', href: 'ayarlar-genel.html' },
    { id: 'ayarlar-menu', label: 'Menü Düzeni', icon: 'ti-layout-sidebar', href: 'ayarlar-menu.html' },
    { id: 'ayarlar-ozel', label: 'Özel Ayarlar', icon: 'ti-adjustments', href: 'ayarlar-ozel.html' }
  ];

  var DASHBOARD_ITEM = {
    id: 'dashboard',
    label: 'Ana Sayfa',
    icon: 'ti-smart-home',
    href: 'index.html'
  };

  var DEFAULT_ORDER = MODULE_ITEMS.map(function (item) { return item.id; });
  var DEFAULT_SHORTCUTS = DEFAULT_ORDER.slice();

  function getSetting(key) {
    return window.Helpers ? window.Helpers.getSetting(key) : null;
  }

  function setSetting(key, value) {
    if (window.Helpers) window.Helpers.setSetting(key, value);
  }

  function parseJson(raw, fallback) {
    if (!raw) return fallback.slice ? fallback.slice() : fallback;
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback.slice();
    } catch (e) {
      return fallback.slice();
    }
  }

  function getModuleById(id) {
    for (var i = 0; i < MODULE_ITEMS.length; i++) {
      if (MODULE_ITEMS[i].id === id) return MODULE_ITEMS[i];
    }
    return null;
  }

  function getSettingsById(id) {
    for (var i = 0; i < SETTINGS_ITEMS.length; i++) {
      if (SETTINGS_ITEMS[i].id === id) return SETTINGS_ITEMS[i];
    }
    return null;
  }

  function findNavigableItem(id) {
    if (id === 'dashboard') return DASHBOARD_ITEM;
    var mod = getModuleById(id);
    if (mod) return mod;
    var set = getSettingsById(id);
    if (set) return set;

    var i, j, child;
    for (i = 0; i < MODULE_ITEMS.length; i++) {
      if (MODULE_ITEMS[i].children) {
        for (j = 0; j < MODULE_ITEMS[i].children.length; j++) {
          child = MODULE_ITEMS[i].children[j];
          if (child.id === id) {
            return {
              id: child.id,
              label: MODULE_ITEMS[i].label + ' — ' + child.label,
              shortLabel: child.label,
              icon: MODULE_ITEMS[i].icon,
              href: child.href,
              parentId: MODULE_ITEMS[i].id
            };
          }
        }
      }
    }
    return null;
  }

  function resolveHref(item) {
    if (item.href) return item.href;
    if (item.children && item.children.length) return item.children[0].href;
    return 'javascript:void(0);';
  }

  function getOrderedModules() {
    var order = parseJson(getSetting(STORAGE_ORDER), DEFAULT_ORDER);
    var map = {};
    MODULE_ITEMS.forEach(function (item) { map[item.id] = item; });
    var result = [];
    order.forEach(function (id) {
      if (map[id]) {
        result.push(map[id]);
        delete map[id];
      }
    });
    Object.keys(map).forEach(function (id) { result.push(map[id]); });
    return result;
  }

  function saveOrder(ids) {
    setSetting(STORAGE_ORDER, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent('menuConfigChanged'));
  }

  function getShortcuts() {
    var raw = parseJson(getSetting(STORAGE_SHORTCUTS), DEFAULT_SHORTCUTS);
    return raw.filter(function (id) { return !!findNavigableItem(id); });
  }

  function saveShortcuts(ids) {
    setSetting(STORAGE_SHORTCUTS, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent('menuConfigChanged'));
  }

  function toggleShortcut(id, enabled) {
    var list = getShortcuts();
    var idx = list.indexOf(id);
    if (enabled && idx === -1) list.push(id);
    if (!enabled && idx !== -1) list.splice(idx, 1);
    saveShortcuts(list);
  }

  function isShortcut(id) {
    return getShortcuts().indexOf(id) !== -1;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMenuItem(item) {
    if (item.children && item.children.length) {
      var sub = item.children.map(function (child) {
        return (
          '<li class="menu-item" data-menu-id="' + child.id + '">' +
          '<a href="' + child.href + '" class="menu-link"><div>' + escapeHtml(child.label) + '</div></a>' +
          '</li>'
        );
      }).join('');
      return (
        '<li class="menu-item" data-menu-id="' + item.id + '">' +
        '<a href="javascript:void(0);" class="menu-link menu-toggle">' +
        '<i class="menu-icon ti ' + item.icon + '"></i><div>' + escapeHtml(item.label) + '</div></a>' +
        '<ul class="menu-sub">' + sub + '</ul></li>'
      );
    }
    return (
      '<li class="menu-item" data-menu-id="' + item.id + '">' +
      '<a href="' + resolveHref(item) + '" class="menu-link">' +
      '<i class="menu-icon ti ' + item.icon + '"></i><div>' + escapeHtml(item.label) + '</div></a></li>'
    );
  }

  function renderSidebarHtml() {
    var modulesHtml = getOrderedModules().map(renderMenuItem).join('');
    var settingsHtml = SETTINGS_ITEMS.map(function (item) {
      return (
        '<li class="menu-item" data-menu-id="' + item.id + '">' +
        '<a href="' + item.href + '" class="menu-link">' +
        '<i class="menu-icon ti ' + item.icon + '"></i><div>' + escapeHtml(item.label) + '</div></a></li>'
      );
    }).join('');

    return (
      '<aside id="layout-menu" class="layout-menu menu-vertical menu">' +
      '<div class="app-brand demo">' +
      '<a href="index.html" class="app-brand-link">' +
      '<span class="app-brand-logo demo"><span class="text-primary">' +
      '<svg width="32" height="22" viewBox="0 0 32 22" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M0.00172773 0V6.85398C0.00172773 6.85398 -0.133178 9.01207 1.98192 10.8388L13.6912 21.9964L19.7809 21.9181L18.8042 9.88248L16.4951 7.17289L9.23799 0H0.00172773Z" fill="currentColor"/>' +
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M7.77295 16.3566L23.6563 0H32V6.88383C32 6.88383 31.8262 9.17836 30.6591 10.4057L19.7824 22H13.6938L7.77295 16.3566Z" fill="currentColor"/>' +
      '</svg></span></span>' +
      '<span class="app-brand-text demo menu-text fw-bold ms-3">e-Cari</span></a>' +
      '<a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large ms-auto">' +
      '<i class="menu-toggle-icon d-none d-xl-block"></i><i class="ti ti-x d-block d-xl-none"></i></a></div>' +
      '<div class="menu-inner-shadow"></div>' +
      '<ul class="menu-inner py-1">' +
      '<li class="menu-header small"><span class="menu-header-text">Genel</span></li>' +
      '<li class="menu-item" data-menu-id="dashboard">' +
      '<a href="index.html" class="menu-link">' +
      '<i class="menu-icon ti ti-smart-home"></i><div>Ana Sayfa</div></a></li>' +
      '<li class="menu-header small"><span class="menu-header-text">Modüller</span></li>' +
      modulesHtml +
      '<li class="menu-header small"><span class="menu-header-text">Ayarlar</span></li>' +
      settingsHtml +
      '</ul></aside>' +
      '<div class="menu-mobile-toggler d-xl-none rounded-1">' +
      '<a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large text-bg-secondary p-2 rounded-1">' +
      '<i class="ti ti-menu-2 icon-md"></i><i class="ti ti-chevron-right icon-md"></i></a></div>'
    );
  }

  function getAllShortcutCandidates() {
    var list = [{ id: 'dashboard', label: 'Ana Sayfa', icon: 'ti-smart-home', group: 'Genel' }];
    MODULE_ITEMS.forEach(function (item) {
      if (item.href) {
        list.push({ id: item.id, label: item.label, icon: item.icon, group: 'Modüller' });
      }
      if (item.children) {
        item.children.forEach(function (child) {
          list.push({
            id: child.id,
            label: child.label,
            icon: item.icon,
            group: item.label
          });
        });
      }
    });
    return list;
  }

  function getShortcutSortIndex(id) {
    var order = getOrder();
    var item = findNavigableItem(id);
    if (!item) return 9999;
    if (item.parentId) {
      var parentIdx = order.indexOf(item.parentId);
      var childIdx = 0;
      var mod = getModuleById(item.parentId);
      if (mod && mod.children) {
        for (var i = 0; i < mod.children.length; i++) {
          if (mod.children[i].id === id) {
            childIdx = i;
            break;
          }
        }
      }
      return parentIdx >= 0 ? parentIdx * 100 + childIdx + 1 : 9999;
    }
    var idx = order.indexOf(id);
    return idx >= 0 ? idx * 100 : 9999;
  }

  function getOrder() {
    return getOrderedModules().map(function (item) { return item.id; });
  }

  function isModuleOnDashboard(moduleId) {
    var list = getShortcuts();
    if (list.indexOf(moduleId) !== -1) return true;
    var mod = getModuleById(moduleId);
    if (!mod || !mod.children) return false;
    for (var i = 0; i < mod.children.length; i++) {
      if (list.indexOf(mod.children[i].id) !== -1) return true;
    }
    return false;
  }

  function toggleModuleShortcut(moduleId, enabled) {
    var list = getShortcuts().filter(function (id) {
      if (id === moduleId) return false;
      var item = findNavigableItem(id);
      return !item || item.parentId !== moduleId;
    });
    if (enabled) list.push(moduleId);
    saveShortcuts(list);
  }

  function getDashboardModuleCandidates() {
    return getOrderedModules().map(function (item) {
      return { id: item.id, label: item.label, icon: item.icon };
    });
  }

  function getShortcutCards() {
    var shortcuts = getShortcuts().slice();
    shortcuts.sort(function (a, b) {
      return getShortcutSortIndex(a) - getShortcutSortIndex(b);
    });
    return shortcuts.map(function (id) {
      var item = findNavigableItem(id);
      if (!item) return null;
      return {
        id: item.id,
        label: item.shortLabel || item.label,
        href: resolveHref(item),
        icon: item.icon || 'ti-link'
      };
    }).filter(Boolean);
  }

  window.MenuApp = {
    MODULE_ITEMS: MODULE_ITEMS,
    SETTINGS_ITEMS: SETTINGS_ITEMS,
    DEFAULT_ORDER: DEFAULT_ORDER,
    DEFAULT_SHORTCUTS: DEFAULT_SHORTCUTS,
    getOrderedModules: getOrderedModules,
    getOrder: getOrder,
    saveOrder: saveOrder,
    getShortcuts: getShortcuts,
    saveShortcuts: saveShortcuts,
    toggleShortcut: toggleShortcut,
    toggleModuleShortcut: toggleModuleShortcut,
    isShortcut: isShortcut,
    isModuleOnDashboard: isModuleOnDashboard,
    findNavigableItem: findNavigableItem,
    resolveHref: resolveHref,
    getAllShortcutCandidates: getAllShortcutCandidates,
    getDashboardModuleCandidates: getDashboardModuleCandidates,
    getShortcutCards: getShortcutCards,
    renderSidebarHtml: renderSidebarHtml,
    resetToDefaults: function () {
      saveOrder(DEFAULT_ORDER.slice());
      saveShortcuts(DEFAULT_SHORTCUTS.slice());
    }
  };
})();
