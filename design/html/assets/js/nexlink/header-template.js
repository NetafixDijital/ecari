(function () {
  'use strict';

  window.NexLinkHeaderTemplate = {
    render: function () {
      return (
        '<header class="app-header" id="nl-header">' +
          '<div class="app-header-inner">' +
            '<button class="app-toggler" type="button" id="nl-sidebar-toggle" aria-label="Menü">' +
              '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M7.66699 12.6668L3.66699 8.00016L7.66699 3.3335" stroke="#1C274C" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path opacity="0.5" d="M12.667 12.6668L8.66699 8.00016L12.667 3.3335" stroke="#1C274C" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg></button>' +
            '<div class="app-header-start d-none d-md-flex">' +
              '<form class="d-flex align-items-center h-100 w-lg-250px w-xxl-300px position-relative" action="#">' +
                '<button type="button" class="btn btn-sm border-0 position-absolute start-0 ms-3 p-0"><i class="ti ti-search"></i></button>' +
                '<input type="text" class="form-control form-control-fill ps-5" placeholder="Ara... (fatura, cari, ürün)" data-bs-toggle="modal" data-bs-target="#searchResultsModal" readonly>' +
              '</form>' +
              '<div class="badge-standard d-none d-lg-inline-block">Bugün Yeni Faturalar <span class="badge bg-primary-subtle text-primary">5</span></div>' +
            '</div>' +
            '<div class="app-header-end">' +
              '<div class="px-lg-4 px-2 ps-0 d-flex align-items-center">' +
                '<a href="javascript:void(0);" class="theme-btn" id="nl-theme-toggle" aria-label="Tema">' +
                  '<svg class="icon-light" width="20" height="21" viewBox="0 0 20 21" fill="none"><path d="M14.1663 10.5002C14.1663 12.8013 12.3008 14.6668 9.99967 14.6668C7.69849 14.6668 5.83301 12.8013 5.83301 10.5002C5.83301 8.19898 7.69849 6.3335 9.99967 6.3335C12.3008 6.3335 14.1663 8.19898 14.1663 10.5002Z" fill="var(--bs-heading-color)"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.0003 1.5415C10.3455 1.5415 10.6253 1.82133 10.6253 2.1665V3.83317C10.6253 4.17834 10.3455 4.45817 10.0003 4.45817C9.65516 4.45817 9.37532 4.17834 9.37532 3.83317V2.1665C9.37532 1.82133 9.65516 1.5415 10.0003 1.5415Z" fill="var(--bs-heading-color)"/></svg>' +
                  '<div class="theme-toggle"></div>' +
                  '<svg class="icon-dark" width="20" height="21" viewBox="0 0 20 21" fill="none"><path opacity="0.5" d="M10.0003 18.8332C14.6027 18.8332 18.3337 15.1022 18.3337 10.4998C18.3337 10.1143 17.7557 10.0505 17.5563 10.3805C16.6077 11.9503 14.8849 12.9998 12.917 12.9998C9.92541 12.9998 7.50032 10.5748 7.50032 7.58317C7.50032 5.61521 8.54982 3.89238 10.1197 2.9438C10.4497 2.7444 10.3859 2.1665 10.0003 2.1665C5.39795 2.1665 1.66699 5.89746 1.66699 10.4998C1.66699 15.1022 5.39795 18.8332 10.0003 18.8332Z" fill="var(--bs-heading-color)"/></svg>' +
                '</a></div>' +
              '<div class="vr my-3"></div>' +
              '<div class="d-flex align-items-center gap-sm-2 gap-0 px-lg-4 px-sm-2 px-1">' +
                '<a href="javascript:void(0);" class="btn btn-icon btn-action-gray rounded-circle position-relative">' +
                  '<svg width="24" height="25" viewBox="0 0 24 25" fill="none"><path opacity="0.5" d="M22 11V12.5C22 17.214 22 19.5711 20.5355 21.0355C19.0711 22.5 16.714 22.5 12 22.5C7.28595 22.5 4.92893 22.5 3.46447 21.0355C2 19.5711 2 17.214 2 12.5C2 7.78595 2 5.42893 3.46447 3.96447C4.92893 2.5 7.28595 2.5 12 2.5H13.5" stroke="var(--bs-heading-color)" stroke-width="2" stroke-linecap="round"/><path d="M19 8.5C20.6569 8.5 22 7.15685 22 5.5C22 3.84315 20.6569 2.5 19 2.5C17.3431 2.5 16 3.84315 16 5.5C16 7.15685 17.3431 8.5 19 8.5Z" stroke="var(--bs-heading-color)" stroke-width="2"/><path d="M7 14.5H16" stroke="var(--bs-heading-color)" stroke-width="2" stroke-linecap="round"/><path d="M7 18H13" stroke="var(--bs-heading-color)" stroke-width="2" stroke-linecap="round"/></svg>' +
                  '<span class="position-absolute top-0 end-0 p-1 mt-1 me-1 bg-primary border border-3 border-light rounded-circle"><span class="visually-hidden">Yeni mesaj</span></span></a>' +
                '<div class="dropdown text-end">' +
                  '<button type="button" class="btn btn-icon btn-action-gray rounded-circle" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">' +
                    '<svg width="24" height="25" viewBox="0 0 24 25" fill="none"><path d="M18.7491 10.2096V9.50497C18.7491 5.63623 15.7274 2.5 12 2.5C8.27256 2.5 5.25087 5.63623 5.25087 9.50497V10.2096C5.25087 11.0552 5.00972 11.8818 4.5578 12.5854L3.45036 14.3095C2.43882 15.8843 3.21105 18.0249 4.97036 18.5229C9.57274 19.8257 14.4273 19.8257 19.0296 18.5229C20.789 18.0249 21.5612 15.8843 20.5496 14.3095L19.4422 12.5854C18.9903 11.8818 18.7491 11.0552 18.7491 10.2096Z" stroke="var(--bs-heading-color)" stroke-width="2"/><path opacity="0.5" d="M7.5 19.5C8.15503 21.2478 9.92246 22.5 12 22.5C14.0775 22.5 15.845 21.2478 16.5 19.5" stroke="var(--bs-heading-color)" stroke-width="2" stroke-linecap="round"/></svg>' +
                    '<span class="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger d-none" data-notification-badge style="font-size:0.55rem;">0</span>' +
                  '</button>' +
                  '<div class="dropdown-menu dropdown-menu-lg-end p-0 w-300px mt-2">' +
                    '<div class="px-3 py-3 border-bottom d-flex justify-content-between align-items-center">' +
                      '<h6 class="mb-0">Bildirimler <span class="badge badge-sm rounded-pill bg-primary ms-2" data-notification-header-badge">0</span></h6>' +
                      '<button type="button" class="btn btn-sm btn-link p-0" id="ecari-notifications-mark-all">Tümünü oku</button></div>' +
                    '<div class="p-2 nl-notify-scroll"><ul class="list-group list-group-hover list-group-smooth list-group-unlined mb-0" id="ecari-notifications"></ul></div>' +
                    '<div class="p-2 border-top"><a href="javascript:void(0)" class="btn w-100 btn-primary">Tüm bildirimleri gör</a></div>' +
                  '</div></div>' +
                '<a href="javascript:void(0);" class="btn btn-icon btn-action-gray rounded-circle" title="Takvim">' +
                  '<svg width="24" height="25" viewBox="0 0 24 25" fill="none"><path d="M2 12.5C2 8.72876 2 6.84315 3.17157 5.67157C4.34315 4.5 6.22876 4.5 10 4.5H14C17.7712 4.5 19.6569 4.5 20.8284 5.67157C22 6.84315 22 8.72876 22 12.5V14.5C22 18.2712 22 20.1569 20.8284 21.3284C19.6569 22.5 17.7712 22.5 14 22.5H10C6.22876 22.5 4.34315 22.5 3.17157 21.3284C2 20.1569 2 18.2712 2 14.5V12.5Z" stroke="var(--bs-heading-color)" stroke-width="2"/></svg></a>' +
              '</div>' +
              '<div class="vr my-3"></div>' +
              '<div class="dropdown text-end ms-sm-3 ms-2 ms-lg-4">' +
                '<a href="javascript:void(0);" class="d-flex align-items-center py-2 text-decoration-none" data-bs-toggle="dropdown" data-bs-auto-close="outside">' +
                  '<div class="text-end me-2 d-none d-lg-inline-block">' +
                    '<div class="fw-bold text-dark">Admin Kullanıcı</div>' +
                    '<small class="text-body d-block lh-sm"><i class="ti ti-chevron-down me-1" style="font-size:0.65rem;"></i> Yönetici</small></div>' +
                  '<div class="avatar avatar-sm rounded-circle avatar-status-success">' +
                    '<span class="avatar-initial bg-label-primary">AY</span></div></a>' +
                '<ul class="dropdown-menu dropdown-menu-end w-225px mt-1">' +
                  '<li class="d-flex align-items-center p-2"><div class="avatar avatar-sm rounded-circle"><span class="avatar-initial bg-label-primary">AY</span></div><div class="ms-2"><div class="fw-bold text-dark">Admin Kullanıcı</div><small class="text-body d-block lh-sm">admin@e-cari.com</small></div></li>' +
                  '<li><div class="dropdown-divider my-1"></div></li>' +
                  '<li><a class="dropdown-item d-flex align-items-center gap-2" href="ayarlar-genel.html"><i class="ti ti-user"></i> Profil</a></li>' +
                  '<li><a class="dropdown-item d-flex align-items-center gap-2" href="fatura-satis.html"><i class="ti ti-notes"></i> Görevlerim</a></li>' +
                  '<li><a class="dropdown-item d-flex align-items-center gap-2" href="ayarlar-genel.html"><i class="ti ti-settings"></i> Hesap Ayarları</a></li>' +
                  '<li><a class="dropdown-item d-flex align-items-center gap-2" href="ayarlar-ozel.html"><i class="ti ti-crown"></i> Plan Yükselt</a></li>' +
                  '<li><div class="dropdown-divider my-1"></div></li>' +
                  '<li><a class="dropdown-item d-flex align-items-center gap-2 text-danger" href="login.html"><i class="ti ti-logout"></i> Çıkış</a></li>' +
                '</ul></div>' +
            '</div></div></header>'
      );
    },

    renderSearchModal: function () {
      return (
        '<div class="modal fade" id="searchResultsModal" tabindex="-1" aria-hidden="true">' +
          '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
            '<div class="modal-header py-1 px-3">' +
              '<form class="d-flex align-items-center position-relative w-100" action="#">' +
                '<button type="button" class="btn btn-sm border-0 position-absolute start-0 p-0"><i class="ti ti-search"></i></button>' +
                '<input type="text" class="form-control form-control-lg ps-4 border-0 shadow-none" id="searchInput" placeholder="Ara... (fatura, cari, ürün)">' +
              '</form>' +
              '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button></div>' +
            '<div class="modal-body pb-2 nl-notify-scroll">' +
              '<span class="text-uppercase text-2xs fw-semibold text-muted d-block mb-2">Son Aramalar:</span>' +
              '<ul class="list-inline search-list mb-0">' +
                '<li><a class="search-item" href="index.html"><i class="ti ti-smart-home"></i> Ana Sayfa</a></li>' +
                '<li><a class="search-item" href="fatura-satis.html"><i class="ti ti-file-invoice"></i> Satış Fatura</a></li>' +
                '<li><a class="search-item" href="cari-liste.html"><i class="ti ti-users"></i> Cari Listesi</a></li>' +
                '<li><a class="search-item" href="stok-liste.html"><i class="ti ti-packages"></i> Stok Listesi</a></li>' +
                '<li><a class="search-item" href="gorev-liste.html"><i class="ti ti-checklist"></i> Görev Listesi</a></li>' +
                '<li><a class="search-item" href="masraf-yonetimi.html"><i class="ti ti-receipt-2"></i> Masraf Yönetimi</a></li>' +
                '<li><a class="search-item" href="kasa.html"><i class="ti ti-cash"></i> Kasa</a></li>' +
                '<li><a class="search-item" href="gun-sonu-raporu.html"><i class="ti ti-report-money"></i> Gün Sonu Raporu</a></li>' +
              '</ul></div></div></div></div>'
      );
    }
  };
})();
