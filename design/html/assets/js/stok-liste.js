(function () {
  'use strict';

  var modalYeniStok = null;

  function openModal() {
    if (!modalYeniStok) {
      var el = document.getElementById('modalYeniStok');
      if (el) modalYeniStok = new bootstrap.Modal(el);
    }
    if (modalYeniStok) modalYeniStok.show();
  }

  function resetForm() {
    var form = document.getElementById('formYeniStok');
    if (!form) return;
    form.reset();
    var miktar = document.getElementById('stokMiktar');
    if (miktar) miktar.value = '0';
    var birim = document.getElementById('stokBirim');
    if (birim) birim.value = 'Adet';
    form.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
  }

  function validateRequired(ids) {
    var valid = true;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var ok = el.value.trim() !== '';
      el.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    return valid;
  }

  function bindExcelImport() {
    if (!window.EcariExcelImport) return;
    window.EcariExcelImport.setup({
      modalId: 'modalExcelStok',
      fileInputId: 'excelStokFile',
      dropzoneId: 'excelStokDropzone',
      btnOpenId: 'btnExcelStok',
      btnImportId: 'btnExcelStokImport',
      fileNameId: 'excelStokFileName',
      statusId: 'excelStokStatus',
      tableKey: 'stok-liste',
      mapRows: window.EcariExcelImport.mapStokRows
    });
  }

  function bindEvents() {
    var btnYeni = document.getElementById('btnYeniStok');
    if (btnYeni) {
      btnYeni.addEventListener('click', function () {
        resetForm();
        openModal();
      });
    }

    var btnEkle = document.getElementById('btnStokEkle');
    if (btnEkle) {
      btnEkle.addEventListener('click', function () {
        if (!validateRequired(['stokKod', 'stokUrun'])) return;
        if (window.EcariDbSim && window.EcariDataTables) {
          var item = window.EcariDbSim.fromStokForm();
          window.EcariDataTables.appendRows('stok-liste', [item]);
        }
        if (modalYeniStok) modalYeniStok.hide();
      });
    }

    var modalEl = document.getElementById('modalYeniStok');
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', resetForm);
    }

    bindExcelImport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
