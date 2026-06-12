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

  function formatDateTr(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function nextMasrafNo() {
    var data = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['masraf-liste'];
    var rows = (data && data.data) ? data.data : [];
    var max = rows.reduce(function (m, r) {
      var n = parseInt(String(r.masraf_no || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return 'MSF-2026-' + String(max + 1).padStart(3, '0');
  }

  function saveMasraf() {
    if (!validateRequired(['masrafAciklama', 'masrafKategori', 'masrafTutar'])) return;

    var tutar = parseFloat(document.getElementById('masrafTutar').value);
    if (isNaN(tutar) || tutar <= 0) {
      document.getElementById('masrafTutar').classList.add('is-invalid');
      return;
    }

    var row = {
      masraf_no: nextMasrafNo(),
      aciklama: document.getElementById('masrafAciklama').value.trim(),
      kategori: document.getElementById('masrafKategori').value,
      tutar: tutar.toFixed(2),
      tarih: formatDateTr(document.getElementById('masrafTarih').value),
      talep_eden: document.getElementById('masrafTalepEden').value.trim() || '—',
      status: 'onay_bekliyor',
      durum: 'onay_bekliyor'
    };

    if (window.EcariDataTables && window.EcariDataTables.appendRows) {
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
