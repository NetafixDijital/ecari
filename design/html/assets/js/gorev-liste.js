(function () {
  'use strict';

  var modalYeniGorev = null;

  function openModal() {
    if (!modalYeniGorev) {
      var el = document.getElementById('modalYeniGorev');
      if (el) modalYeniGorev = new bootstrap.Modal(el);
    }
    if (modalYeniGorev) modalYeniGorev.show();
  }

  function resetForm() {
    var form = document.getElementById('formYeniGorev');
    if (!form) return;
    form.reset();
    var oncelik = document.getElementById('gorevOncelik');
    if (oncelik) oncelik.value = 'normal';
    var durum = document.getElementById('gorevDurum');
    if (durum) durum.value = 'yapilacak';
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

  function saveGorev() {
    if (!validateRequired(['gorevBaslik'])) return;

    if (window.EcariDbSim && window.EcariDataTables) {
      var payload = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['gorev-liste'];
      var rows = (payload && payload.data) ? payload.data : [];
      var row = window.EcariDbSim.fromGorevForm();
      row.task_code = window.EcariDbSim.nextTaskCode(rows);
      window.EcariDataTables.appendRows('gorev-liste', [row]);
    }

    if (modalYeniGorev) modalYeniGorev.hide();
  }

  function bindEvents() {
    var btnYeni = document.getElementById('btnYeniGorev');
    if (btnYeni) {
      btnYeni.addEventListener('click', function () {
        resetForm();
        openModal();
      });
    }

    var btnEkle = document.getElementById('btnGorevEkle');
    if (btnEkle) btnEkle.addEventListener('click', saveGorev);

    var modalEl = document.getElementById('modalYeniGorev');
    if (modalEl) modalEl.addEventListener('hidden.bs.modal', resetForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
