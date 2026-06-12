(function () {
  'use strict';

  var PRODUCTS = [
    { id: 1, name: 'Kablosuz Mouse', price: 149, kdv: 20, cat: 'elektronik', stock: 120, icon: 'ti-mouse' },
    { id: 2, name: 'USB-C Hub', price: 599, kdv: 20, cat: 'aksesuar', stock: 45, icon: 'ti-plug' },
    { id: 3, name: 'Laptop Stand', price: 450, kdv: 20, cat: 'aksesuar', stock: 28, icon: 'ti-device-laptop' },
    { id: 4, name: 'Klavye Mekanik', price: 890, kdv: 20, cat: 'elektronik', stock: 15, icon: 'ti-keyboard' },
    { id: 5, name: 'Kulaklık BT', price: 320, kdv: 20, cat: 'elektronik', stock: 62, icon: 'ti-headphones' },
    { id: 6, name: 'Webcam HD', price: 750, kdv: 20, cat: 'elektronik', stock: 22, icon: 'ti-camera' },
    { id: 7, name: 'Montaj Hizmeti', price: 250, kdv: 20, cat: 'hizmet', stock: 999, icon: 'ti-tool' },
    { id: 8, name: 'Teknik Destek (saat)', price: 180, kdv: 20, cat: 'hizmet', stock: 999, icon: 'ti-headset' },
    { id: 9, name: 'HDMI Kablo 2m', price: 85, kdv: 20, cat: 'aksesuar', stock: 200, icon: 'ti-cable' },
    { id: 10, name: 'Mouse Pad XL', price: 120, kdv: 20, cat: 'aksesuar', stock: 88, icon: 'ti-square' }
  ];

  var cart = [];
  var activeCat = 'all';
  var searchTerm = '';
  var isFullscreen = false;

  function formatMoney(n) {
    return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderProducts() {
    var grid = document.getElementById('hsProductGrid');
    if (!grid) return;

    var list = PRODUCTS.filter(function (p) {
      var matchCat = activeCat === 'all' || p.cat === activeCat;
      var matchSearch = !searchTerm || p.name.toLowerCase().indexOf(searchTerm) >= 0;
      return matchCat && matchSearch;
    });

    if (!list.length) {
      grid.innerHTML = '<div class="hs-empty-cart col-span-all"><i class="ti ti-search-off d-block"></i><p class="mb-0 small">Ürün bulunamadı</p></div>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      return '<div class="hs-product-card" data-id="' + p.id + '" role="button" tabindex="0">' +
        '<div class="hs-product-icon"><i class="ti ' + p.icon + '"></i></div>' +
        '<div class="hs-product-name">' + p.name + '</div>' +
        '<div class="hs-product-price">' + formatMoney(p.price) + '</div>' +
        '<div class="hs-product-stock">Stok: ' + p.stock + '</div>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('.hs-product-card').forEach(function (el) {
      el.addEventListener('click', function () {
        addToCart(parseInt(el.getAttribute('data-id'), 10));
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addToCart(parseInt(el.getAttribute('data-id'), 10));
        }
      });
    });
  }

  function addToCart(id) {
    var p = PRODUCTS.find(function (x) { return x.id === id; });
    if (!p) return;
    var line = cart.find(function (x) { return x.id === id; });
    if (line) {
      line.qty += 1;
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, kdv: p.kdv, qty: 1 });
    }
    renderCart();
  }

  function updateQty(id, qty) {
    var line = cart.find(function (x) { return x.id === id; });
    if (!line) return;
    line.qty = Math.max(1, qty);
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (x) { return x.id !== id; });
    renderCart();
  }

  function calcTotals() {
    var sub = 0;
    var kdv = 0;
    cart.forEach(function (line) {
      var lineNet = line.price * line.qty;
      sub += lineNet;
      kdv += lineNet * (line.kdv / 100);
    });
    return { sub: sub, kdv: kdv, total: sub + kdv };
  }

  function renderCart() {
    var container = document.getElementById('hsCartItems');
    var empty = document.getElementById('hsEmptyCart');
    var countEl = document.getElementById('hsCartCount');
    if (!container) return;

    if (countEl) countEl.textContent = cart.reduce(function (s, l) { return s + l.qty; }, 0);

    if (!cart.length) {
      if (empty) empty.style.display = '';
      container.querySelectorAll('.hs-cart-item').forEach(function (el) { el.remove(); });
      document.getElementById('hsSubtotal').textContent = '₺0,00';
      document.getElementById('hsKdv').textContent = '₺0,00';
      document.getElementById('hsTotal').textContent = '₺0,00';
      return;
    }

    if (empty) empty.style.display = 'none';

    container.querySelectorAll('.hs-cart-item').forEach(function (el) { el.remove(); });

    cart.forEach(function (line) {
      var div = document.createElement('div');
      div.className = 'hs-cart-item';
      div.innerHTML =
        '<div class="hs-cart-item-info">' +
          '<div class="name">' + line.name + '</div>' +
          '<div class="hs-cart-item-qty">' +
            '<button type="button" class="btn btn-sm btn-label-secondary hs-qty-minus" data-id="' + line.id + '"><i class="ti ti-minus"></i></button>' +
            '<input type="number" class="form-control form-control-sm hs-qty-input" value="' + line.qty + '" min="1" data-id="' + line.id + '">' +
            '<button type="button" class="btn btn-sm btn-label-secondary hs-qty-plus" data-id="' + line.id + '"><i class="ti ti-plus"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="text-end">' +
          '<div class="fw-semibold small amount">' + formatMoney(line.price * line.qty * (1 + line.kdv / 100)) + '</div>' +
          '<button type="button" class="btn btn-sm btn-icon btn-label-danger hs-remove" data-id="' + line.id + '"><i class="ti ti-x"></i></button>' +
        '</div>';
      container.appendChild(div);
    });

    container.querySelectorAll('.hs-qty-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        var line = cart.find(function (x) { return x.id === id; });
        if (line) updateQty(id, line.qty - 1);
      });
    });
    container.querySelectorAll('.hs-qty-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        var line = cart.find(function (x) { return x.id === id; });
        if (line) updateQty(id, line.qty + 1);
      });
    });
    container.querySelectorAll('.hs-qty-input').forEach(function (input) {
      input.addEventListener('change', function () {
        updateQty(parseInt(input.getAttribute('data-id'), 10), parseInt(input.value, 10) || 1);
      });
    });
    container.querySelectorAll('.hs-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFromCart(parseInt(btn.getAttribute('data-id'), 10));
      });
    });

    var t = calcTotals();
    document.getElementById('hsSubtotal').textContent = formatMoney(t.sub);
    document.getElementById('hsKdv').textContent = formatMoney(t.kdv);
    document.getElementById('hsTotal').textContent = formatMoney(t.total);
  }

  function completePayment(type) {
    if (!cart.length) return;
    var t = calcTotals();
    var labels = { nakit: 'Nakit ödeme', kart: 'Kredi / banka kartı', cari: 'Cari hesaba', fatura: 'Fatura kesilecek' };
    document.getElementById('modalOdemeTitle').textContent = 'Satış Tamamlandı';
    document.getElementById('modalOdemeTutar').textContent = formatMoney(t.total);
    document.getElementById('modalOdemeTip').textContent = labels[type] || type;
    var modal = new bootstrap.Modal(document.getElementById('modalOdeme'));
    modal.show();
    document.getElementById('modalOdeme').addEventListener('hidden.bs.modal', function onHide() {
      cart = [];
      renderCart();
      document.getElementById('modalOdeme').removeEventListener('hidden.bs.modal', onHide);
    }, { once: true });
  }

  function updateFullscreenButton() {
    var btn = document.getElementById('hsFullscreen');
    if (!btn) return;
    if (isFullscreen) {
      btn.innerHTML = '<i class="ti ti-minimize me-1"></i> Tam Ekrandan Çık';
      btn.classList.remove('btn-label-secondary');
      btn.classList.add('btn-label-primary');
    } else {
      btn.innerHTML = '<i class="ti ti-maximize me-1"></i> Tam Ekran';
      btn.classList.remove('btn-label-primary');
      btn.classList.add('btn-label-secondary');
    }
  }

  function setFullscreen(on) {
    isFullscreen = !!on;
    document.body.classList.toggle('hs-fullscreen', isFullscreen);
    updateFullscreenButton();

    var root = document.documentElement;
    if (isFullscreen) {
      var el = document.getElementById('hsPos') || root;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(function () { /* tarayıcı izni yoksa CSS modu yeterli */ });
      }
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function toggleFullscreen() {
    setFullscreen(!isFullscreen);
  }

  function syncFullscreenState() {
    var nativeOn = !!document.fullscreenElement;
    if (nativeOn !== isFullscreen) {
      isFullscreen = nativeOn;
      document.body.classList.toggle('hs-fullscreen', isFullscreen);
      updateFullscreenButton();
    }
  }

  function init() {
    renderProducts();
    renderCart();

    document.getElementById('hsSearch').addEventListener('input', function (e) {
      searchTerm = e.target.value.trim().toLowerCase();
      renderProducts();
    });

    document.querySelectorAll('#hsCategories [data-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#hsCategories .nav-link').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        activeCat = btn.getAttribute('data-cat');
        renderProducts();
      });
    });

    document.getElementById('hsClearCart').addEventListener('click', function () {
      cart = [];
      renderCart();
    });

    document.getElementById('hsFullscreen').addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', syncFullscreenState);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setFullscreen(false);
      }
    });

    document.querySelectorAll('[data-pay]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        completePayment(btn.getAttribute('data-pay'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
