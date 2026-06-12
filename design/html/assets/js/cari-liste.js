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

  var DEMO_GIB = {
    '1234567890': { unvan: 'ABC Teknoloji Ltd.', vergi_dairesi: 'Kadıköy' },
    '9876543210': { unvan: 'XYZ Ticaret A.Ş.', vergi_dairesi: 'Ümraniye' },
    '1122334455': { unvan: 'Demir Sanayi Ltd.', vergi_dairesi: 'Osmangazi' },
    '12345678901': { unvan: 'Mehmet Yılmaz' }
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

  function isTuzel() {
    var el = document.getElementById('cariTipiTuzel');
    return el ? el.checked : true;
  }

  function updateCariTipiFields() {
    var tuzel = isTuzel();
    var labelUnvan = document.getElementById('labelCariUnvan');
    var labelVkn = document.getElementById('labelCariVknTckn');
    var inputUnvan = document.getElementById('cariUnvan');
    var inputVkn = document.getElementById('cariVknTckn');
    var helpVkn = document.getElementById('cariVknTcknHelp');
    var wrapVergi = document.getElementById('wrapVergiDairesi');

    if (labelUnvan) {
      labelUnvan.innerHTML = (tuzel ? 'Unvan' : 'Ad Soyad') + ' <span class="text-danger">*</span>';
    }
    if (labelVkn) {
      labelVkn.innerHTML = (tuzel ? 'VKN' : 'TCKN') + ' <span class="text-danger">*</span>';
    }
    if (inputUnvan) {
      inputUnvan.setAttribute('aria-label', tuzel ? 'Unvan' : 'Ad Soyad');
      inputUnvan.placeholder = tuzel ? 'Şirket unvanı' : 'Ad soyad';
    }
    if (inputVkn) {
      inputVkn.setAttribute('aria-label', tuzel ? 'VKN' : 'TCKN');
      inputVkn.placeholder = tuzel ? '10 haneli VKN' : '11 haneli TCKN';
      inputVkn.maxLength = tuzel ? 10 : 11;
      inputVkn.value = inputVkn.value.replace(/\D/g, '').slice(0, tuzel ? 10 : 11);
    }
    var iconUnvan = document.getElementById('iconCariUnvan');
    if (iconUnvan) {
      iconUnvan.innerHTML = tuzel ? '<i class="ti ti-building"></i>' : '<i class="ti ti-user"></i>';
    }
    if (helpVkn) {
      helpVkn.textContent = tuzel
        ? '10 hane girildiğinde GİB üzerinden unvan getirilir.'
        : '11 hane girildiğinde GİB üzerinden ad-soyad getirilir.';
    }
    if (wrapVergi) {
      wrapVergi.classList.toggle('d-none', !tuzel);
    }
  }

  function resetYeniCariForm() {
    var form = document.getElementById('formYeniCari');
    if (form) form.reset();
    var tuzelRadio = document.getElementById('cariTipiTuzel');
    if (tuzelRadio) tuzelRadio.checked = true;
    updateCariTipiFields();
    form.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
  }

  function lookupGib(vknTckn) {
    var data = DEMO_GIB[vknTckn];
    if (!data) return;
    var unvanEl = document.getElementById('cariUnvan');
    if (unvanEl && data.unvan) unvanEl.value = data.unvan;
    if (isTuzel() && data.vergi_dairesi) {
      var vdEl = document.getElementById('cariVergiDairesi');
      if (vdEl) vdEl.value = data.vergi_dairesi;
    }
  }

  function bindYeniCari() {
    var btnYeni = document.getElementById('btnYeniCari');
    if (btnYeni) {
      btnYeni.addEventListener('click', function () {
        resetYeniCariForm();
        openModal('modalYeniCari');
      });
    }

    document.querySelectorAll('input[name="cariTipi"]').forEach(function (radio) {
      radio.addEventListener('change', updateCariTipiFields);
    });

    var vknInput = document.getElementById('cariVknTckn');
    if (vknInput) {
      vknInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, isTuzel() ? 10 : 11);
        var len = isTuzel() ? 10 : 11;
        if (this.value.length === len) lookupGib(this.value);
      });
    }

    var btnEkle = document.getElementById('btnCariEkle');
    if (btnEkle) {
      btnEkle.addEventListener('click', function () {
        var unvanEl = document.getElementById('cariUnvan');
        var vknEl = document.getElementById('cariVknTckn');
        var valid = true;

        [unvanEl, vknEl].forEach(function (el) {
          if (!el) return;
          var ok = el.value.trim() !== '';
          el.classList.toggle('is-invalid', !ok);
          if (!ok) valid = false;
        });

        if (!valid) return;

        var expectedLen = isTuzel() ? 10 : 11;
        if (vknEl.value.length !== expectedLen) {
          vknEl.classList.add('is-invalid');
          return;
        }

        if (window.CariDbSim && window.EcariDataTables) {
          var payload = window.ECARI_TABLE_DATA && window.ECARI_TABLE_DATA['cari-liste'];
          var rows = (payload && payload.data) ? payload.data : [];
          var account = window.CariDbSim.fromForm();
          account.code = window.CariDbSim.nextCode(rows);
          window.EcariDataTables.appendRows('cari-liste', [account]);
        }

        if (modals.modalYeniCari) modals.modalYeniCari.hide();
      });
    }

    var modalEl = document.getElementById('modalYeniCari');
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', resetYeniCariForm);
    }
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

    var btnTahsilat = document.getElementById('btnTahsilatKaydet');
    if (btnTahsilat) {
      btnTahsilat.addEventListener('click', function () {
        if (modals.modalTahsilat) modals.modalTahsilat.hide();
      });
    }
    var btnTediye = document.getElementById('btnTediyeKaydet');
    if (btnTediye) {
      btnTediye.addEventListener('click', function () {
        if (modals.modalTediye) modals.modalTediye.hide();
      });
    }
    var btnVirman = document.getElementById('btnVirmanKaydet');
    if (btnVirman) {
      btnVirman.addEventListener('click', function () {
        if (modals.modalVirman) modals.modalVirman.hide();
      });
    }
  }

  function bindExcelImport() {
    if (!window.EcariExcelImport) return;
    window.EcariExcelImport.setup({
      modalId: 'modalExcelCari',
      fileInputId: 'excelCariFile',
      dropzoneId: 'excelCariDropzone',
      btnOpenId: 'btnExcelCari',
      btnImportId: 'btnExcelCariImport',
      fileNameId: 'excelCariFileName',
      statusId: 'excelCariStatus',
      tableKey: 'cari-liste',
      mapRows: window.EcariExcelImport.mapCariRows
    });
  }

  function init() {
    initTooltips();
    bindYeniCari();
    bindActions();
    bindExcelImport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
