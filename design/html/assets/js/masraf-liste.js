(function () {
  'use strict';

  var modalYeniMasraf = null;

  function openModal() {
    if (!modalYeniMasraf) {
      var el = document.getElementById('modalYeniMasraf');
      if (el) modalYeniMasraf = new bootstrap.Modal(el);
    }
    if (modalYeniMasraf) modalYeniMasraf.show();
  }

  function resetForm() {
    var form = document.getElementById('formYeniMasraf');
    if (!form) return;
    form.reset();
    var tarih = document.getElementById('masrafTarih');
    if (tarih) {
      var d = new Date();
      tarih.value = d.toISOString().slice(0, 10);
    }
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

  function saveMasraf() {
    if (!validateRequired(['masrafAciklama', 'masrafKategori', 'masrafTutar'])) return;

    var tutar = parseFloat(document.getElementById('masrafTutar').value);
    if (isNaN(tutar) || tutar <= 0) {
      document.getElementById('masrafTutar').classList.add('is-invalid');
      return;
    }

    if (window.EcariDbSim && window.EcariDataTables) {
      var payload = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['masraf-liste'];
      var rows = (payload && payload.data) ? payload.data : [];
      var row = window.EcariDbSim.fromMasrafForm();
      var refNo = window.EcariDbSim.nextExpenseNo(rows);
      row.reference_document_no = refNo;
      row.masraf_no = refNo;
      window.EcariDataTables.appendRows('masraf-liste', [row]);
    }

    if (modalYeniMasraf) modalYeniMasraf.hide();
  }

  function bindEvents() {
    var btnYeni = document.getElementById('btnYeniMasraf');
    if (btnYeni) {
      btnYeni.addEventListener('click', function () {
        resetForm();
        openModal();
      });
    }

    var btnEkle = document.getElementById('btnMasrafEkle');
    if (btnEkle) btnEkle.addEventListener('click', saveMasraf);

    var modalEl = document.getElementById('modalYeniMasraf');
    if (modalEl) modalEl.addEventListener('hidden.bs.modal', resetForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
