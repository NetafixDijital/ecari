(function () {
  'use strict';

  /** Menü modülü → dashboard sanal içerik (Türkçe demo veriler) */
  var MODULE_WIDGETS = {
    fatura: {
      subtitle: 'Kesilen ve bekleyen faturalar',
      stats: [
        { label: 'Bu ay fatura', value: '124' },
        { label: 'Bekleyen tutar', value: '₺18.450' },
        { label: 'Tahsil oranı', value: '%72' }
      ]
    },
    irsaliye: {
      subtitle: 'Sevk ve teslim irsaliyeleri',
      stats: [
        { label: 'Açık irsaliye', value: '38' },
        { label: 'Bu hafta sevk', value: '56' },
        { label: 'Bekleyen teslim', value: '12' }
      ]
    },
    siparis: {
      subtitle: 'Müşteri sipariş takibi',
      stats: [
        { label: 'Açık sipariş', value: '47' },
        { label: 'Hazırlanan', value: '23' },
        { label: 'Bu ay tutar', value: '₺64.200' }
      ]
    },
    depo: {
      subtitle: 'Depo ve stok hareketleri',
      stats: [
        { label: 'Giriş hareketi', value: '89' },
        { label: 'Çıkış hareketi', value: '112' },
        { label: 'Aktif depo', value: '3' }
      ]
    },
    cari: {
      subtitle: 'Cari hesap bakiyeleri',
      stats: [
        { label: 'Toplam alacak', value: '₺245.800' },
        { label: 'Toplam borç', value: '₺98.400' },
        { label: 'Aktif cari', value: '186' }
      ]
    },
    stok: {
      subtitle: 'Ürün ve stok durumu',
      stats: [
        { label: 'Ürün sayısı', value: '842' },
        { label: 'Kritik stok', value: '14' },
        { label: 'Stok değeri', value: '₺1,2M' }
      ]
    },
    'hizli-satis': {
      subtitle: 'Perakende ve hızlı satış',
      stats: [
        { label: 'Bugün satış', value: '₺12.840' },
        { label: 'Fiş adedi', value: '67' },
        { label: 'Ortalama sepet', value: '₺192' }
      ]
    },
    servis: {
      subtitle: 'Teknik servis kayıtları',
      stats: [
        { label: 'Açık kayıt', value: '19' },
        { label: 'Tamamlanan', value: '41' },
        { label: 'Bekleyen parça', value: '8' }
      ]
    },
    kasa: {
      subtitle: 'Nakit kasa hareketleri',
      stats: [
        { label: 'Kasa bakiyesi', value: '₺34.560' },
        { label: 'Bugün giriş', value: '₺8.200' },
        { label: 'Bugün çıkış', value: '₺2.150' }
      ]
    },
    banka: {
      subtitle: 'Banka hesap özeti',
      stats: [
        { label: 'Toplam bakiye', value: '₺892.400' },
        { label: 'Hesap sayısı', value: '4' },
        { label: 'Bekleyen havale', value: '7' }
      ]
    }
  };

  var OVERVIEW_SLIDES = [
    {
      moduleId: 'cari',
      title: 'Cari Özeti',
      desc: 'Alacak ve borç dengesi',
      items: [
        { v: '₺245.800', l: 'Alacak' },
        { v: '₺98.400', l: 'Borç' },
        { v: '186', l: 'Aktif cari' },
        { v: '12', l: 'Vadesi geçen' }
      ]
    },
    {
      moduleId: 'kasa',
      title: 'Kasa & Banka',
      desc: 'Nakit ve banka pozisyonu',
      items: [
        { v: '₺34.560', l: 'Kasa' },
        { v: '₺892.400', l: 'Banka' },
        { v: '₺8.200', l: 'Bugün giriş' },
        { v: '₺2.150', l: 'Bugün çıkış' }
      ]
    },
    {
      moduleId: 'fatura',
      title: 'Fatura Özeti',
      desc: 'Bu ay kesilen faturalar',
      items: [
        { v: '124', l: 'Fatura adedi' },
        { v: '₺128.450', l: 'Toplam tutar' },
        { v: '₺18.450', l: 'Bekleyen' },
        { v: '%72', l: 'Tahsil' }
      ]
    }
  ];

  var RECENT_ROWS = [
    { mod: 'fatura', modLabel: 'Fatura', text: 'FT-2026-0142 — ABC Ltd.', tutar: '₺4.250', durum: 'Ödendi', durumClass: 'success' },
    { mod: 'cari', modLabel: 'Cari', text: 'Tahsilat — XYZ Ticaret', tutar: '₺12.000', durum: 'Onaylandı', durumClass: 'success' },
    { mod: 'siparis', modLabel: 'Sipariş', text: 'SP-8841 — Yeni sipariş', tutar: '₺8.920', durum: 'Hazırlanıyor', durumClass: 'warning' },
    { mod: 'stok', modLabel: 'Stok', text: 'Stok çıkışı — Depo 1', tutar: '48 adet', durum: 'Tamamlandı', durumClass: 'info' },
    { mod: 'hizli-satis', modLabel: 'Hızlı Satış', text: 'Perakende fiş #4521', tutar: '₺385', durum: 'Kapalı', durumClass: 'secondary' },
    { mod: 'servis', modLabel: 'Servis', text: 'SRV-102 — Arıza kaydı', tutar: '—', durum: 'Açık', durumClass: 'primary' }
  ];

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getVisibleModules() {
    if (!window.MenuApp) return [];
    return MenuApp.getOrderedModules().filter(function (m) {
      return MenuApp.isModuleOnDashboard(m.id);
    });
  }

  function renderOverview() {
    var el = document.getElementById('dashboardOverview');
    if (!el) return;

    var slidesHtml = OVERVIEW_SLIDES.map(function (slide) {
      var mod = window.MenuApp && MenuApp.findNavigableItem(slide.moduleId);
      var href = mod ? MenuApp.resolveHref(mod) : '#';
      var half = Math.ceil(slide.items.length / 2);
      var col1 = slide.items.slice(0, half);
      var col2 = slide.items.slice(half);
      function colHtml(arr) {
        return arr.map(function (it) {
          return '<li class="d-flex mb-3 align-items-center"><p class="mb-0 fw-medium me-2 website-analytics-text-bg">' +
            esc(it.v) + '</p><p class="mb-0 small">' + esc(it.l) + '</p></li>';
        }).join('');
      }
      return (
        '<div class="swiper-slide"><div class="row p-4 p-lg-5 align-items-center">' +
        '<div class="col-lg-8"><div class="row"><div class="col-6"><ul class="list-unstyled mb-0">' + colHtml(col1) +
        '</ul></div><div class="col-6"><ul class="list-unstyled mb-0">' + colHtml(col2) +
        '</ul></div></div></div>' +
        '<div class="col-lg-4"><h5 class="text-white mb-1">' + esc(slide.title) + '</h5>' +
        '<p class="text-white opacity-75 small mb-3">' + esc(slide.desc) + '</p>' +
        '<a href="' + esc(href) + '" class="btn btn-sm btn-light">Modüle git</a></div></div></div>'
      );
    }).join('');

    el.innerHTML =
      '<div class="dashboard-overview swiper" id="dashboardOverviewSwiper">' +
      '<div class="swiper-wrapper">' + slidesHtml + '</div>' +
      '<div class="swiper-pagination pb-3"></div></div>';

    if (window.Swiper) {
      new Swiper('#dashboardOverviewSwiper', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { clickable: true, el: '#dashboardOverviewSwiper .swiper-pagination' }
      });
    }
  }

  function renderModuleCard(module) {
    var w = MODULE_WIDGETS[module.id] || {
      subtitle: 'Modül özeti',
      stats: [
        { label: 'Kayıt', value: '—' },
        { label: 'Bu ay', value: '—' },
        { label: 'Durum', value: 'Aktif' }
      ]
    };
    var href = MenuApp.resolveHref(module);
    var linksHtml = '';
    if (module.children && module.children.length) {
      linksHtml = module.children.slice(0, 3).map(function (ch) {
        return '<a href="' + esc(ch.href) + '" class="btn btn-sm btn-label-secondary">' + esc(ch.label) + '</a>';
      }).join('');
    } else {
      linksHtml = '<a href="' + esc(href) + '" class="btn btn-sm btn-label-primary">Modüle git</a>';
    }

    var statsHtml = w.stats.map(function (s) {
      return (
        '<div class="dw-stat-item">' +
        '<div class="dw-stat-label">' + esc(s.label) + '</div>' +
        '<div class="dw-stat-value">' + esc(s.value) + '</div></div>'
      );
    }).join('');

    return (
      '<div class="col-xl-4 col-md-6" data-module-id="' + esc(module.id) + '">' +
      '<div class="card dw-module-card h-100">' +
      '<div class="card-header">' +
      '<div class="d-flex align-items-center gap-3">' +
      '<span class="dw-module-icon"><i class="ti ' + esc(module.icon) + '"></i></span>' +
      '<div><h5 class="mb-0"><a href="' + esc(href) + '" class="text-heading">' + esc(module.label) + '</a></h5>' +
      '<small class="text-body-secondary">' + esc(w.subtitle) + '</small></div></div></div>' +
      '<div class="card-body pt-0">' +
      '<div class="dw-stat-row">' + statsHtml + '</div>' +
      '<div class="dw-module-links">' + linksHtml + '</div></div></div></div>'
    );
  }

  function renderWidgets() {
    var root = document.getElementById('dashboardWidgets');
    if (!root || !window.MenuApp) return;
    var modules = getVisibleModules();
    if (!modules.length) {
      modules = MenuApp.getOrderedModules();
    }
    root.innerHTML = modules.map(renderModuleCard).join('');
  }

  function renderRecent() {
    var el = document.getElementById('dashboardRecent');
    if (!el) return;
    var rows = RECENT_ROWS.map(function (r) {
      var mod = MenuApp && MenuApp.findNavigableItem(r.mod);
      var icon = mod && mod.icon ? mod.icon : 'ti-file';
      return (
        '<tr><td><span class="badge bg-label-primary rounded p-1"><i class="ti ' + icon + '"></i></span> ' + esc(r.modLabel) + '</td>' +
        '<td>' + esc(r.text) + '</td>' +
        '<td class="text-end amount">' + esc(r.tutar) + '</td>' +
        '<td><span class="badge bg-label-' + r.durumClass + '">' + esc(r.durum) + '</span></td></tr>'
      );
    }).join('');

    el.innerHTML =
      '<div class="card"><div class="card-header d-flex justify-content-between align-items-center">' +
      '<div><h5 class="mb-0">Son İşlemler</h5><small class="text-body-secondary">Modüllere göre son kayıtlar (örnek)</small></div>' +
      '<a href="fatura-liste.html" class="btn btn-sm btn-label-primary">Tümünü gör</a></div>' +
      '<div class="table-responsive"><table class="table table-hover mb-0">' +
      '<thead class="border-top"><tr>' +
      '<th>Modül</th><th>Açıklama</th><th class="text-end">Tutar</th><th>Durum</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function renderSummaryRow() {
    var el = document.getElementById('dashboardSummary');
    if (!el) return;
    el.innerHTML =
      '<div class="col-sm-6 col-xl-3">' +
      '<div class="card dw-summary-card h-100"><div class="card-body">' +
      '<p class="text-body-secondary small mb-1">Bu ay satış</p>' +
      '<h4 class="display-6 mb-0">₺128.450</h4>' +
      '<small class="text-success"><i class="ti ti-trending-up"></i> %18,2 artış</small></div></div></div>' +
      '<div class="col-sm-6 col-xl-3">' +
      '<div class="card dw-summary-card h-100"><div class="card-body">' +
      '<p class="text-body-secondary small mb-1">Tahsilat</p>' +
      '<h4 class="display-6 mb-0">₺92.300</h4>' +
      '<small class="text-body-secondary">Cari modülü</small></div></div></div>' +
      '<div class="col-sm-6 col-xl-3">' +
      '<div class="card dw-summary-card h-100"><div class="card-body">' +
      '<p class="text-body-secondary small mb-1">Açık fatura</p>' +
      '<h4 class="display-6 mb-0">32</h4>' +
      '<small class="text-body-secondary">Fatura modülü</small></div></div></div>' +
      '<div class="col-sm-6 col-xl-3">' +
      '<div class="card dw-summary-card h-100"><div class="card-body">' +
      '<p class="text-body-secondary small mb-1">Kasa + banka</p>' +
      '<h4 class="display-6 mb-0">₺926.960</h4>' +
      '<small class="text-body-secondary">Kasa & Banka</small></div></div></div>';
  }

  function render() {
    renderSummaryRow();
    renderOverview();
    renderWidgets();
    renderRecent();
  }

  function boot() {
    if (window.MenuApp) {
      render();
      return;
    }
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (window.MenuApp || n > 50) {
        clearInterval(t);
        render();
      }
    }, 50);
  }

  document.addEventListener('menuConfigChanged', function () {
    renderWidgets();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
