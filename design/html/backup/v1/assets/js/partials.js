/**
 * Navbar, footer — tüm sayfalarda ortak
 * Sidebar menu-app.js ile dinamik üretilir
 */
window.APP_PARTIALS = {
  navbar: `
<nav class="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme" id="layout-navbar">
  <div class="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
    <a class="nav-item nav-link px-0 me-xl-4" href="javascript:void(0)">
      <i class="ti ti-menu-2 icon-md"></i>
    </a>
  </div>
  <div class="navbar-nav-right d-flex align-items-center justify-content-end w-100">
    <div class="navbar-nav align-items-center flex-grow-1">
      <div class="nav-item px-2">
        <div class="input-group input-group-merge">
          <span class="input-group-text border-end-0"><i class="ti ti-search"></i></span>
          <input type="text" class="form-control border-start-0 ps-0" placeholder="Ara... (fatura, cari, ürün)">
        </div>
      </div>
    </div>
    <ul class="navbar-nav flex-row align-items-center ms-auto">
      <li class="nav-item dropdown me-2">
        <a class="nav-link btn btn-icon btn-text-secondary rounded-pill" href="javascript:void(0);" data-bs-toggle="dropdown">
          <i class="ti ti-sun icon-22px"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><button type="button" class="dropdown-item" data-bs-theme-value="light"><i class="ti ti-sun me-2"></i> Açık</button></li>
          <li><button type="button" class="dropdown-item" data-bs-theme-value="dark"><i class="ti ti-moon me-2"></i> Koyu</button></li>
        </ul>
      </li>
      <li class="nav-item dropdown me-2">
        <a class="nav-link btn btn-icon btn-text-secondary rounded-pill position-relative" href="javascript:void(0);" data-bs-toggle="dropdown" aria-label="Bildirimler">
          <i class="ti ti-bell icon-22px"></i>
          <span class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger" data-notification-badge style="font-size:0.6rem;">3</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end p-0 navbar-dropdown" style="width:22rem;">
          <li class="dropdown-menu-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
            <h6 class="mb-0">Bildirimler</h6>
            <button type="button" class="btn btn-sm btn-link text-primary p-0" id="ecari-notifications-mark-all">Tümünü oku</button>
          </li>
          <li class="dropdown-notifications-list scrollable-container">
            <ul class="list-group list-group-flush" id="ecari-notifications"></ul>
          </li>
          <li class="border-top p-3"><a href="javascript:void(0)" class="btn btn-primary btn-sm w-100">Tüm Bildirimleri Gör</a></li>
        </ul>
      </li>
      <li class="nav-item me-2">
        <a class="nav-link btn btn-icon btn-text-secondary rounded-pill" href="ayarlar-genel.html" title="Ayarlar">
          <i class="ti ti-settings icon-22px"></i>
        </a>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle hide-arrow p-0" href="javascript:void(0);" data-bs-toggle="dropdown">
          <div class="avatar avatar-online">
            <span class="avatar-initial rounded-circle bg-label-primary">AY</span>
          </div>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li class="px-3 py-2"><h6 class="mb-0">Admin Kullanıcı</h6><small class="text-body-secondary">Yönetici</small></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="ayarlar-genel.html"><i class="ti ti-settings me-2"></i> Genel Ayarlar</a></li>
          <li><a class="dropdown-item" href="ayarlar-ozel.html"><i class="ti ti-adjustments me-2"></i> Özel Ayarlar</a></li>
          <li><a class="dropdown-item text-danger" href="login.html"><i class="ti ti-logout me-2"></i> Çıkış</a></li>
        </ul>
      </li>
    </ul>
  </div>
</nav>`,

  footer: `
<footer class="content-footer footer bg-footer-theme">
  <div class="container-xxl">
    <div class="d-flex align-items-center justify-content-between py-3 flex-md-row flex-column gap-2">
      <div class="text-body-secondary small">
        &copy; <span class="footer-year"></span> <strong>e-Cari</strong> — Ön Muhasebe Programı
      </div>
      <div class="d-flex gap-3 small">
        <a href="ayarlar-genel.html" class="text-body-secondary">Ayarlar</a>
        <span class="text-body-secondary">v1.0.0</span>
      </div>
    </div>
  </div>
</footer>`
};

