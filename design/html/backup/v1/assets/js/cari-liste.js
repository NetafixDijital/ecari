(function () {
  'use strict';

  var DEMO_HAREKETLER = {
    'CR-001': [
      { tarih: '2026-05-28', islem: 'Fatura', aciklama: 'FT-2026/0142', borc: '₺4.250,00', alacak: '—', bakiye: '₺12.450,00 (A)' },
      { tarih: '2026-05-20', islem: 'Tahsilat', aciklama: 'Kasa — Merkez', borc: '—', alacak: '₺2.000,00', bakiye: '₺8.200,00 (A)' },
      { tarih: '2026-05-10', islem: 'Fatura', aciklama: 'FT-2026/0098', borc: '₺6.150,00', alacak: '—', bakiye: '₺10.200,00 (A)' }
    ],
    'CR-002': [
      { tarih: '2026-05-25', islem: 'Tediye', aciklama: 'Banka — Ziraat', borc: '—', alacak: '₺1.500,00', bakiye: '₺3.200,00 (B)' },
      { tarih: '2026-05-15', islem: 'Fatura', aciklama: 'FT-2026/0110', borc: '₺4.700,00', alacak: '—', bakiye: '₺4.700,00 (B)' }
    ],
    'CR-003': [
      { tarih: '2026-04-01', islem: 'Virman', aciklama: 'CR-001 → CR-003', borc: '—', alacak: '₺500,00', bakiye: '₺0,00' }
    ]
  };

  var currentCari = { kod: '', unvan: '' };
  var modals = {};

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function getRowData(btn) {
    var row = btn.closest('tr');
    if (!row) return { kod: '', unvan: '' };
    return {
      kod: row.getAttribute('data-cari-kod') || '',
      unvan: row.getAttribute('data-cari-unvan') || ''
    };
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function openModal(id) {
    if (!modals[id]) {
      var el = document.getElementById(id);
      if (el) modals[id] = new bootstrap.Modal(el);
    }
    if (modals[id]) modals[id].show();
  }

  function fillRaporTable(kod) {
    var tbody = document.getElementById('raporHareketBody');
    if (!tbody) return;
    var rows = DEMO_HAREKETLER[kod] || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-body-secondary py-4">Hareket kaydı bulunamadı.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td>' + r.tarih + '</td>' +
        '<td>' + r.islem + '</td>' +
        '<td>' + r.aciklama + '</td>' +
        '<td class="text-end">' + r.borc + '</td>' +
        '<td class="text-end">' + r.alacak + '</td>' +
        '<td class="text-end">' + r.bakiye + '</td>' +
        '</tr>';
    }).join('');
    var reportTable = document.querySelector('#modalHareketRaporu table.table');
    if (window.TableSearch && reportTable) {
      if (reportTable.dataset.searchBound !== '1') {
        window.TableSearch.initTable(reportTable);
      } else {
        window.TableSearch.refresh(reportTable);
      }
    }
  }

  function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
      new bootstrap.Tooltip(el);
    });
  }

  function getCariFromBtn(btn) {
    return {
      kod: btn.getAttribute('data-cari-kod') || getRowData(btn).kod,
      unvan: btn.getAttribute('data-cari-unvan') || getRowData(btn).unvan
    };
  }

  function bindActions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cari-action]');
      if (!btn) return;

      currentCari = getCariFromBtn(btn);
      var action = btn.getAttribute('data-cari-action');

        if (action === 'tahsilat') {
          setText('tahsilatCariKod', currentCari.kod);
          setText('tahsilatCariUnvan', currentCari.unvan);
          document.getElementById('tahsilatTarih').value = todayISO();
          document.getElementById('tahsilatTutar').value = '';
          openModal('modalTahsilat');
        }

        if (action === 'tediye') {
          setText('tediyeCariKod', currentCari.kod);
          setText('tediyeCariUnvan', currentCari.unvan);
          document.getElementById('tediyeTarih').value = todayISO();
          document.getElementById('tediyeTutar').value = '';
          openModal('modalTediye');
        }

        if (action === 'virman') {
          setText('virmanKaynakKod', currentCari.kod);
          setText('virmanKaynakUnvan', currentCari.unvan);
          var hedef = document.getElementById('virmanHedef');
          if (hedef) {
            Array.from(hedef.options).forEach(function (opt) {
              opt.hidden = opt.value === currentCari.kod;
            });
            var first = Array.from(hedef.options).find(function (o) { return o.value !== currentCari.kod; });
            if (first) hedef.value = first.value;
          }
          openModal('modalVirman');
        }

        if (action === 'rapor') {
          setText('raporCariKod', currentCari.kod);
          setText('raporCariUnvan', currentCari.unvan);
          fillRaporTable(currentCari.kod);
          openModal('modalHareketRaporu');
        }
    });

    document.getElementById('btnTahsilatKaydet').addEventListener('click', function () {
      if (modals.modalTahsilat) modals.modalTahsilat.hide();
    });
    document.getElementById('btnTediyeKaydet').addEventListener('click', function () {
      if (modals.modalTediye) modals.modalTediye.hide();
    });
    document.getElementById('btnVirmanKaydet').addEventListener('click', function () {
      if (modals.modalVirman) modals.modalVirman.hide();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initTooltips();
      bindActions();
    });
  } else {
    initTooltips();
    bindActions();
  }
})();
