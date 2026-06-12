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

  function formatDateTr(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function todayTr() {
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '.' + mm + '.' + d.getFullYear();
  }

  function nextGorevNo() {
    var data = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['gorev-liste'];
    var rows = (data && data.data) ? data.data : [];
    var max = rows.reduce(function (m, r) {
      var n = parseInt(String(r.gorev_no || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return 'GRV-2026-' + String(max + 1).padStart(3, '0');
  }

  function saveGorev() {
    if (!validateRequired(['gorevBaslik'])) return;

    var durum = document.getElementById('gorevDurum').value || 'yapilacak';
    var row = {
      gorev_no: nextGorevNo(),
      baslik: document.getElementById('gorevBaslik').value.trim(),
      atanan: document.getElementById('gorevAtanan').value.trim() || '—',
      oncelik: document.getElementById('gorevOncelik').value || 'normal',
      son_tarih: formatDateTr(document.getElementById('gorevSonTarih').value),
      olusturma: todayTr(),
      status: durum,
      durum: durum
    };

    if (window.EcariDataTables && window.EcariDataTables.appendRows) {
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
