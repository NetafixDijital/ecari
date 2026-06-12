(function () {
  'use strict';

  var DEMO_DATA = {
    '2026-06-09': {
      toplam_satis: 28450.00,
      toplam_tahsilat: 31200.00,
      kasa_toplam: 18650.00,
      banka_toplam: 12550.00,
      pos_satis: 12480.00,
      pos_adet: 18,
      nakit_satis: 9850.00,
      nakit_adet: 24,
      veresiye_satis: 6120.00,
      veresiye_adet: 7,
      kredi_karti: 12480.00,
      kredi_karti_adet: 18,
      nakit_tahsilat: 8200.00,
      havale_tahsilat: 15800.00,
      pos_tahsilat: 7200.00,
      cek_tahsilat: 0,
      hareketler: [
        { saat: '09:15', tip: 'nakit_satis', aciklama: 'Perakende satış — STK-002', tutar: 149.00 },
        { saat: '09:42', tip: 'pos_satis', aciklama: 'POS satış — STK-001', tutar: 450.00 },
        { saat: '10:05', tip: 'tahsilat', aciklama: 'Tahsilat — ABC Ltd. (Havale)', tutar: 5000.00 },
        { saat: '11:20', tip: 'veresiye', aciklama: 'Veresiye satış — DEF Ticaret', tutar: 2180.00 },
        { saat: '12:30', tip: 'nakit_satis', aciklama: 'Hızlı satış — 3 kalem', tutar: 890.00 },
        { saat: '14:00', tip: 'pos_satis', aciklama: 'POS satış — STK-005', tutar: 5490.00 },
        { saat: '15:45', tip: 'tahsilat', aciklama: 'Tahsilat — GHI A.Ş. (Nakit)', tutar: 3200.00 },
        { saat: '16:10', tip: 'veresiye', aciklama: 'Veresiye satış — JKL Market', tutar: 1540.00 },
        { saat: '17:30', tip: 'pos_satis', aciklama: 'POS satış — toplu alım', tutar: 6540.00 },
        { saat: '18:00', tip: 'tahsilat', aciklama: 'Tahsilat — MNO Ltd. (POS)', tutar: 7200.00 }
      ]
    },
    '2026-06-08': {
      toplam_satis: 22100.00,
      toplam_tahsilat: 19800.00,
      kasa_toplam: 14200.00,
      banka_toplam: 5600.00,
      pos_satis: 9800.00,
      pos_adet: 14,
      nakit_satis: 8200.00,
      nakit_adet: 19,
      veresiye_satis: 4100.00,
      veresiye_adet: 5,
      kredi_karti: 9800.00,
      kredi_karti_adet: 14,
      nakit_tahsilat: 6400.00,
      havale_tahsilat: 9200.00,
      pos_tahsilat: 4200.00,
      cek_tahsilat: 0,
      hareketler: [
        { saat: '10:00', tip: 'pos_satis', aciklama: 'POS satış — STK-003', tutar: 599.00 },
        { saat: '11:30', tip: 'nakit_satis', aciklama: 'Perakende satış', tutar: 320.00 },
        { saat: '13:00', tip: 'tahsilat', aciklama: 'Tahsilat — PQR Ltd. (Havale)', tutar: 9200.00 },
        { saat: '15:00', tip: 'veresiye', aciklama: 'Veresiye satış — STU Ticaret', tutar: 2100.00 }
      ]
    }
  };

  function money(val) {
    var num = parseFloat(val);
    if (isNaN(num)) return '—';
    return '₺' + num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDateTr(iso) {
    if (!iso) return '—';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + '.' + p[1] + '.' + p[0];
  }

  function todayIso() {
    var d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function tipBadge(tip) {
    var map = {
      nakit_satis: { label: 'Nakit Satış', cls: 'success' },
      pos_satis: { label: 'POS Satış', cls: 'primary' },
      veresiye: { label: 'Veresiye', cls: 'warning' },
      tahsilat: { label: 'Tahsilat', cls: 'info' }
    };
    var item = map[tip] || { label: tip, cls: 'secondary' };
    return '<span class="badge bg-label-' + item.cls + '">' + item.label + '</span>';
  }

  function renderHareketler(rows) {
    var tbody = document.getElementById('gunSonuHareketler');
    if (!tbody) return;
    if (!rows || !rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-body-secondary py-4">Bu tarihte hareket bulunamadı.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td>' + r.saat + '</td>' +
        '<td>' + tipBadge(r.tip) + '</td>' +
        '<td>' + r.aciklama + '</td>' +
        '<td class="text-end amount">' + money(r.tutar) + '</td>' +
        '</tr>';
    }).join('');
  }

  function updatePage(iso) {
    var data = DEMO_DATA[iso] || DEMO_DATA[todayIso()] || DEMO_DATA['2026-06-09'];
    var tarihTr = formatDateTr(iso);

    setText('gsTarihBadge', tarihTr);
    setText('gsTarihPrint', tarihTr);
    setText('gsToplamSatis', money(data.toplam_satis));
    setText('gsToplamTahsilat', money(data.toplam_tahsilat));
    setText('gsKasaToplam', money(data.kasa_toplam));
    setText('gsBankaToplam', money(data.banka_toplam));

    setText('gsPosSatis', money(data.pos_satis));
    setText('gsPosAdet', data.pos_adet + ' işlem');
    setText('gsNakitSatis', money(data.nakit_satis));
    setText('gsNakitAdet', data.nakit_adet + ' işlem');
    setText('gsVeresiyeSatis', money(data.veresiye_satis));
    setText('gsVeresiyeAdet', data.veresiye_adet + ' işlem');

    setText('gsSumPos', money(data.pos_satis));
    setText('gsSumNakit', money(data.nakit_satis));
    setText('gsSumVeresiye', money(data.veresiye_satis));
    setText('gsSumSatisToplam', money(data.toplam_satis));

    setText('gsTahNakit', money(data.nakit_tahsilat));
    setText('gsTahHavale', money(data.havale_tahsilat));
    setText('gsTahPos', money(data.pos_tahsilat));
    setText('gsTahCek', money(data.cek_tahsilat || 0));
    setText('gsTahToplam', money(data.toplam_tahsilat));

    setText('gsKasaDetay', money(data.kasa_toplam));
    setText('gsBankaDetay', money(data.banka_toplam));
    setText('gsGenelToplam', money(data.kasa_toplam + data.banka_toplam));

    setText('gsTargetSatis', money(data.toplam_satis));
    setText('gsTargetTahsilat', money(data.toplam_tahsilat));
    setText('gsTargetKasa', money(data.kasa_toplam));
    setText('gsTargetBanka', money(data.banka_toplam));

    var islemSayisi = (data.pos_adet || 0) + (data.nakit_adet || 0) + (data.veresiye_adet || 0);
    setText('gsIslemSayisi', islemSayisi + ' satış');

    renderHareketler(data.hareketler);
  }

  function bindEvents() {
    var tarihInput = document.getElementById('gsTarih');
    if (tarihInput) {
      if (!tarihInput.value) tarihInput.value = todayIso();
      tarihInput.addEventListener('change', function () {
        updatePage(tarihInput.value);
      });
      updatePage(tarihInput.value);
    }

    var btnPrint = document.getElementById('btnGunSonuYazdir');
    if (btnPrint) {
      btnPrint.addEventListener('click', function () {
        window.print();
      });
    }

    var btnOnceki = document.getElementById('btnGunOnceki');
    if (btnOnceki && tarihInput) {
      btnOnceki.addEventListener('click', function () {
        var d = new Date(tarihInput.value || todayIso());
        d.setDate(d.getDate() - 1);
        tarihInput.value = d.toISOString().slice(0, 10);
        updatePage(tarihInput.value);
      });
    }

    var btnSonraki = document.getElementById('btnGunSonraki');
    if (btnSonraki && tarihInput) {
      btnSonraki.addEventListener('click', function () {
        var d = new Date(tarihInput.value || todayIso());
        d.setDate(d.getDate() + 1);
        var today = new Date(todayIso());
        if (d > today) return;
        tarihInput.value = d.toISOString().slice(0, 10);
        updatePage(tarihInput.value);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
