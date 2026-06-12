(function () {
  'use strict';

  var DEMO_KEY = 'ecari_notify_demo_shown';
  var inited = false;

  var SAMPLES = [
    {
      id: 'n1',
      type: 'success',
      icon: 'ti-user-check',
      title: 'Cari kaydı başarılı',
      message: 'ABC Teknoloji Ltd. cari hesabı oluşturuldu.',
      time: '5 dakika önce',
      unread: true
    },
    {
      id: 'n2',
      type: 'success',
      icon: 'ti-file-invoice',
      title: 'Fatura başarılı şekilde kaydedildi',
      message: 'SF-2026-0143 satış faturası taslak olarak kaydedildi.',
      time: 'Az önce',
      unread: true
    },
    {
      id: 'n3',
      type: 'action',
      icon: 'ti-send',
      title: 'E-fatura gönderilsin mi?',
      message: 'SF-2026-0143 numaralı fatura GİB\'e gönderilmeye hazır.',
      time: 'Az önce',
      unread: true,
      actions: [
        { label: 'Evet, Gönder', style: 'primary', action: 'efatura-send', invoice: 'SF-2026-0143' },
        { label: 'Daha Sonra', style: 'secondary', action: 'efatura-later' }
      ]
    },
    {
      id: 'n4',
      type: 'warning',
      icon: 'ti-alert-triangle',
      title: 'Vadesi geçen fatura',
      message: '2 adet satış faturasının vadesi geçmiş durumda.',
      time: '2 saat önce',
      unread: false,
      link: 'fatura-satis.html'
    },
    {
      id: 'n5',
      type: 'info',
      icon: 'ti-cloud-upload',
      title: 'E-fatura gönderildi',
      message: 'SF-2026-0140 e-fatura olarak GİB\'e başarıyla iletildi.',
      time: '3 saat önce',
      unread: false
    },
    {
      id: 'n6',
      type: 'warning',
      icon: 'ti-package',
      title: 'Stok uyarısı',
      message: '2 ürün kritik stok seviyesinin altında.',
      time: '1 gün önce',
      unread: false,
      link: 'stok-liste.html'
    }
  ];

  var ICON_BG = {
    success: 'bg-label-success',
    info: 'bg-label-info',
    warning: 'bg-label-warning',
    danger: 'bg-label-danger',
    action: 'bg-label-primary'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getUnreadCount() {
    return SAMPLES.filter(function (n) { return n.unread; }).length;
  }

  function updateBadge() {
    var badge = document.querySelector('[data-notification-badge]');
    if (!badge) return;
    var count = getUnreadCount();
    badge.textContent = count;
    badge.classList.toggle('d-none', count === 0);
  }

  function renderItem(item) {
    var bg = ICON_BG[item.type] || 'bg-label-secondary';
    var unreadCls = item.unread ? ' dropdown-notifications-item-unread' : '';
    var html = '<li class="list-group-item dropdown-notifications-item' + unreadCls + '" data-notification-id="' + item.id + '">';
    html += '<div class="d-flex align-items-start gap-3">';
    html += '<div class="notification-icon ' + bg + '"><i class="ti ' + item.icon + '"></i></div>';
    html += '<div class="flex-grow-1 min-w-0">';
    html += '<div class="d-flex align-items-start justify-content-between gap-2">';
    html += '<h6 class="mb-1 small fw-semibold notification-title">' + escapeHtml(item.title) + '</h6>';
    if (item.unread) html += '<span class="notification-dot" title="Okunmadı"></span>';
    html += '</div>';
    html += '<p class="mb-1 small text-body-secondary notification-message">' + escapeHtml(item.message) + '</p>';
    html += '<small class="text-body-secondary">' + escapeHtml(item.time) + '</small>';

    if (item.actions && item.actions.length) {
      html += '<div class="d-flex flex-wrap gap-2 mt-2 notification-actions">';
      item.actions.forEach(function (act) {
        var btnCls = act.style === 'primary' ? 'btn-primary' : 'btn-label-secondary';
        html += '<button type="button" class="btn btn-sm ' + btnCls + '" data-notification-action="' + escapeHtml(act.action) + '"';
        if (act.invoice) html += ' data-invoice="' + escapeHtml(act.invoice) + '"';
        html += '>' + escapeHtml(act.label) + '</button>';
      });
      html += '</div>';
    }

    html += '</div></div></li>';
    return html;
  }

  function renderNavbarNotifications() {
    var list = document.getElementById('ecari-notifications');
    if (!list) return;
    list.innerHTML = SAMPLES.map(renderItem).join('');
    updateBadge();
  }

  function markRead(id) {
    SAMPLES.forEach(function (n) {
      if (n.id === id) n.unread = false;
    });
    var el = document.querySelector('[data-notification-id="' + id + '"]');
    if (el) {
      el.classList.remove('dropdown-notifications-item-unread');
      var dot = el.querySelector('.notification-dot');
      if (dot) dot.remove();
    }
    updateBadge();
  }

  function getToastContainer() {
    var el = document.getElementById('ecari-toast-container');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'ecari-toast-container';
    el.className = 'ecari-toast-container';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
    return el;
  }

  function removeToast(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;
    toastEl.classList.add('ecari-toast-hiding');
    setTimeout(function () {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }, 280);
  }

  function showToast(options) {
    options = options || {};
    var type = options.type || 'success';
    var title = options.title || '';
    var message = options.message || '';
    var duration = options.duration !== undefined ? options.duration : (options.actions ? 0 : 4200);
    var iconMap = {
      success: 'ti-circle-check',
      info: 'ti-info-circle',
      warning: 'ti-alert-triangle',
      danger: 'ti-alert-circle',
      action: 'ti-send'
    };

    var container = getToastContainer();
    var toast = document.createElement('div');
    toast.className = 'ecari-toast ecari-toast-' + type;
    toast.setAttribute('role', 'alert');

    var html = '<div class="ecari-toast-inner">';
    html += '<div class="ecari-toast-icon ' + (ICON_BG[type] || 'bg-label-success') + '">';
    html += '<i class="ti ' + (options.icon || iconMap[type] || 'ti-bell') + '"></i></div>';
    html += '<div class="ecari-toast-body flex-grow-1">';
    if (title) html += '<div class="ecari-toast-title">' + escapeHtml(title) + '</div>';
    if (message) html += '<div class="ecari-toast-message">' + escapeHtml(message) + '</div>';

    if (options.actions && options.actions.length) {
      html += '<div class="ecari-toast-actions d-flex flex-wrap gap-2 mt-2">';
      options.actions.forEach(function (act, idx) {
        var btnCls = act.style === 'primary' ? 'btn-primary' : 'btn-label-secondary';
        html += '<button type="button" class="btn btn-sm ' + btnCls + '" data-toast-action="' + idx + '">' + escapeHtml(act.label) + '</button>';
      });
      html += '</div>';
    }

    html += '</div>';
    html += '<button type="button" class="ecari-toast-close btn btn-sm btn-icon btn-text-secondary" aria-label="Kapat"><i class="ti ti-x"></i></button>';
    html += '</div>';

    toast.innerHTML = html;
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('ecari-toast-visible');
    });

    toast.querySelector('.ecari-toast-close').addEventListener('click', function () {
      removeToast(toast);
    });

    if (options.actions) {
      toast.querySelectorAll('[data-toast-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-toast-action'), 10);
          var act = options.actions[idx];
          if (act && typeof act.onClick === 'function') act.onClick();
          removeToast(toast);
        });
      });
    }

    if (duration > 0) {
      setTimeout(function () { removeToast(toast); }, duration);
    }

    return toast;
  }

  function handleNotificationAction(action, invoice) {
    if (action === 'efatura-send') {
      markRead('n3');
      showToast({
        type: 'info',
        icon: 'ti-loader',
        title: 'E-fatura gönderiliyor',
        message: (invoice || 'Fatura') + ' GİB\'e iletiliyor, lütfen bekleyin...',
        duration: 2200
      });
      setTimeout(function () {
        showToast({
          type: 'success',
          icon: 'ti-cloud-upload',
          title: 'E-fatura gönderildi',
          message: (invoice || 'Fatura') + ' başarıyla GİB\'e iletildi.'
        });
      }, 2400);
      return;
    }

    if (action === 'efatura-later') {
      markRead('n3');
      showToast({
        type: 'info',
        title: 'E-fatura bekletildi',
        message: 'Faturayı daha sonra Fatura listesinden gönderebilirsiniz.',
        duration: 3500
      });
    }
  }

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var actionBtn = e.target.closest('[data-notification-action]');
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleNotificationAction(
          actionBtn.getAttribute('data-notification-action'),
          actionBtn.getAttribute('data-invoice')
        );
        return;
      }

      var item = e.target.closest('[data-notification-id]');
      if (item && !e.target.closest('.notification-actions')) {
        markRead(item.getAttribute('data-notification-id'));
      }
    });

    var markAll = document.getElementById('ecari-notifications-mark-all');
    if (markAll) {
      markAll.addEventListener('click', function (e) {
        e.preventDefault();
        SAMPLES.forEach(function (n) { n.unread = false; });
        renderNavbarNotifications();
        showToast({
          type: 'info',
          title: 'Bildirimler okundu',
          message: 'Tüm bildirimler okundu olarak işaretlendi.',
          duration: 2800
        });
      });
    }
  }

  function runDemoToasts() {
    if (sessionStorage.getItem(DEMO_KEY)) return;
    var path = window.location.pathname || '';
    if (path.indexOf('index.html') === -1 && !path.endsWith('/fatura/') && !path.endsWith('/fatura')) return;

    sessionStorage.setItem(DEMO_KEY, '1');

    setTimeout(function () {
      showToast({
        type: 'success',
        icon: 'ti-user-check',
        title: 'Cari kaydı başarılı',
        message: 'ABC Teknoloji Ltd. cari hesabı kaydedildi.'
      });
    }, 1800);

    setTimeout(function () {
      showToast({
        type: 'success',
        icon: 'ti-file-invoice',
        title: 'Fatura başarılı şekilde kaydedildi',
        message: 'SF-2026-0143 numaralı satış faturası oluşturuldu.'
      });
    }, 4500);

    setTimeout(function () {
      showToast({
        type: 'action',
        icon: 'ti-send',
        title: 'E-fatura gönderilsin mi?',
        message: 'SF-2026-0143 numaralı fatura GİB\'e gönderilmeye hazır.',
        actions: [
          {
            label: 'Evet, Gönder',
            style: 'primary',
            onClick: function () { handleNotificationAction('efatura-send', 'SF-2026-0143'); }
          },
          {
            label: 'Hayır',
            style: 'secondary',
            onClick: function () { handleNotificationAction('efatura-later'); }
          }
        ]
      });
    }, 7500);
  }

  function init() {
    if (inited || !document.getElementById('ecari-notifications')) return;
    inited = true;
    renderNavbarNotifications();
    bindEvents();
    runDemoToasts();
  }

  window.EcariNotify = {
    toast: showToast,
    success: function (title, message) {
      return showToast({ type: 'success', title: title, message: message });
    },
    info: function (title, message) {
      return showToast({ type: 'info', title: title, message: message });
    },
    warning: function (title, message) {
      return showToast({ type: 'warning', title: title, message: message });
    },
    confirm: function (title, message, actions) {
      return showToast({ type: 'action', title: title, message: message, actions: actions || [] });
    },
    refresh: renderNavbarNotifications,
    samples: SAMPLES
  };

  document.addEventListener('partialsLoaded', init);

  if (document.getElementById('ecari-notifications')) init();
})();
