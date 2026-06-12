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

    var existing = container.querySelectorAll('.hs-cart-item');
    existing.forEach(function (el) { el.remove(); });

    cart.forEach(function (line) {
      var div = document.createElement('div');
      div.className = 'hs-cart-item';
      div.innerHTML =
        '<div class="hs-cart-item-info">' +
          '<div class="name">' + line.name + '</div>' +
          '<div class="hs-cart-item-qty">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary hs-qty-minus" data-id="' + line.id + '"><i class="ti ti-minus"></i></button>' +
            '<input type="number" class="form-control form-control-sm hs-qty-input" value="' + line.qty + '" min="1" data-id="' + line.id + '">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary hs-qty-plus" data-id="' + line.id + '"><i class="ti ti-plus"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="text-end">' +
          '<div class="fw-semibold small">' + formatMoney(line.price * line.qty * (1 + line.kdv / 100)) + '</div>' +
          '<button type="button" class="btn btn-sm btn-icon btn-text-danger hs-remove" data-id="' + line.id + '"><i class="ti ti-x"></i></button>' +
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

  function init() {
    renderProducts();

    document.getElementById('hsSearch').addEventListener('input', function (e) {
      searchTerm = e.target.value.trim().toLowerCase();
      renderProducts();
    });

    document.querySelectorAll('#hsCategories [data-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#hsCategories .btn').forEach(function (b) {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-outline-primary');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-outline-primary');
        activeCat = btn.getAttribute('data-cat');
        renderProducts();
      });
    });

    document.getElementById('hsClearCart').addEventListener('click', function () {
      cart = [];
      renderCart();
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
