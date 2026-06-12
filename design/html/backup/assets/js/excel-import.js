(function () {
  'use strict';

  var xlsxPromise = null;

  function ensureXLSX() {
    if (window.XLSX) return Promise.resolve();
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Excel kütüphanesi yüklenemedi')); };
      document.head.appendChild(s);
    });
    return xlsxPromise;
  }

  function normalizeKey(key) {
    return String(key || '')
      .toLowerCase()
      .replace(/[ıİ]/g, 'i')
      .replace(/[şŞ]/g, 's')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function normalizeRow(raw) {
    var out = {};
    Object.keys(raw || {}).forEach(function (k) {
      out[normalizeKey(k)] = raw[k];
    });
    return out;
  }

  function pick(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var val = row[keys[i]];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return '';
  }

  function readCSV(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var text = String(e.target.result || '');
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
        if (!lines.length) {
          resolve([]);
          return;
        }
        var sep = lines[0].indexOf(';') >= 0 ? ';' : ',';
        var headers = lines[0].split(sep).map(function (h) {
          return h.trim().replace(/^"|"$/g, '');
        });
        var rows = lines.slice(1).map(function (line) {
          var vals = line.split(sep).map(function (v) {
            return v.trim().replace(/^"|"$/g, '');
          });
          var obj = {};
          headers.forEach(function (h, idx) {
            obj[h] = vals[idx] || '';
          });
          return obj;
        });
        resolve(rows);
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  function readExcel(file) {
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'csv') return readCSV(file);

    return ensureXLSX().then(function () {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var data = new Uint8Array(e.target.result);
            var wb = window.XLSX.read(data, { type: 'array' });
            var sheet = wb.Sheets[wb.SheetNames[0]];
            resolve(window.XLSX.utils.sheet_to_json(sheet, { defval: '' }));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });
  }

  function mapCariRows(rawRows) {
    return rawRows.map(function (raw) {
      var r = normalizeRow(raw);
      var tip = pick(r, ['cari_tipi', 'tip', 'musteri_tipi', 'musteri tipi']);
      if (tip === 'gercek' || tip === 'gerçek' || tip === 'gercek kisi' || tip === 'g') tip = 'gercek';
      else tip = 'tuzel';
      return {
        cari_kod: pick(r, ['cari_kod', 'kod', 'cari kodu']),
        cari_tipi: tip,
        cari_unvan: pick(r, ['cari_unvan', 'unvan', 'ad_soyad', 'ad soyad', 'firma']),
        vkn_tckn: pick(r, ['vkn_tckn', 'vkn', 'tckn', 'vergi_no', 'vergi no']),
        vergi_dairesi: pick(r, ['vergi_dairesi', 'vergi dairesi']),
        adres: pick(r, ['adres']),
        il: pick(r, ['il']),
        ilce: pick(r, ['ilce', 'ilçe']),
        eposta: pick(r, ['eposta', 'e_posta', 'email', 'e_posta']),
        telefon: pick(r, ['telefon', 'tel']),
        bakiye: pick(r, ['bakiye']) || '0.00',
        bakiye_tip: pick(r, ['bakiye_tip', 'bakiye tip']) || '',
        durum: pick(r, ['durum']) || 'aktif'
      };
    }).filter(function (row) {
      return row.cari_kod && row.cari_unvan;
    });
  }

  function mapStokRows(rawRows) {
    return rawRows.map(function (raw) {
      var r = normalizeRow(raw);
      return {
        stok_kod: pick(r, ['stok_kod', 'kod', 'stok kodu', 'barkod']),
        urun: pick(r, ['urun', 'urun_adi', 'urun adi', 'stok_adi', 'stok adi', 'ad']),
        birim: pick(r, ['birim']) || 'Adet',
        miktar: pick(r, ['miktar', 'stok', 'adet']) || '0',
        alis: pick(r, ['alis', 'alis_fiyati', 'alis fiyati', 'alış']) || '0.00',
        satis: pick(r, ['satis', 'satis_fiyati', 'satis fiyati', 'satış']) || '0.00',
        durum: pick(r, ['durum']) || 'aktif'
      };
    }).filter(function (row) {
      return row.stok_kod && row.urun;
    });
  }

  function setup(opts) {
    var modalEl = document.getElementById(opts.modalId);
    var fileInput = document.getElementById(opts.fileInputId);
    var dropzone = document.getElementById(opts.dropzoneId);
    var btnOpen = document.getElementById(opts.btnOpenId);
    var btnImport = document.getElementById(opts.btnImportId);
    var fileNameEl = document.getElementById(opts.fileNameId);
    var statusEl = document.getElementById(opts.statusId);
    var modal = null;
    var selectedFile = null;

    if (!modalEl || !fileInput || !btnOpen) return;

    function setStatus(msg, type) {
      if (!statusEl) return;
      statusEl.textContent = msg || '';
      statusEl.className = 'small mb-0 ' + (type === 'error' ? 'text-danger' : type === 'success' ? 'text-success' : 'text-body-secondary');
    }

    function reset() {
      selectedFile = null;
      fileInput.value = '';
      if (fileNameEl) fileNameEl.textContent = '';
      if (dropzone) dropzone.classList.remove('is-dragover', 'has-file');
      setStatus('');
      if (btnImport) btnImport.disabled = true;
    }

    function openModal() {
      reset();
      if (!modal) modal = new bootstrap.Modal(modalEl);
      modal.show();
    }

    function setFile(file) {
      if (!file) return;
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      if (['xlsx', 'xls', 'csv'].indexOf(ext) === -1) {
        setStatus('Yalnızca .xlsx, .xls veya .csv dosyaları desteklenir.', 'error');
        return;
      }
      selectedFile = file;
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (dropzone) dropzone.classList.add('has-file');
      if (btnImport) btnImport.disabled = false;
      setStatus('Dosya seçildi. Aktarmak için "İçe Aktar" butonuna tıklayın.');
    }

    function doImport() {
      if (!selectedFile) return;
      if (btnImport) {
        btnImport.disabled = true;
        btnImport.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Aktarılıyor...';
      }
      setStatus('Dosya okunuyor...');

      readExcel(selectedFile)
        .then(function (rawRows) {
          var mapped = opts.mapRows(rawRows);
          if (!mapped.length) {
            throw new Error('Geçerli kayıt bulunamadı. Sütun başlıklarını kontrol edin.');
          }
          var added = window.EcariDataTables && window.EcariDataTables.appendRows
            ? window.EcariDataTables.appendRows(opts.tableKey, mapped)
            : 0;
          setStatus(added + ' kayıt başarıyla aktarıldı.', 'success');
          setTimeout(function () {
            if (modal) modal.hide();
          }, 900);
        })
        .catch(function (err) {
          setStatus(err.message || 'Dosya okunamadı.', 'error');
        })
        .finally(function () {
          if (btnImport) {
            btnImport.disabled = !selectedFile;
            btnImport.innerHTML = '<i class="ti ti-upload me-1"></i> İçe Aktar';
          }
        });
    }

    btnOpen.addEventListener('click', openModal);
    modalEl.addEventListener('hidden.bs.modal', reset);

    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) setFile(fileInput.files[0]);
    });

    if (dropzone) {
      dropzone.addEventListener('click', function (e) {
        if (e.target.closest('button, a')) return;
        fileInput.click();
      });
      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
      });
      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('is-dragover');
      });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
      });
    }

    if (btnImport) btnImport.addEventListener('click', doImport);
  }

  window.EcariExcelImport = {
    setup: setup,
    mapCariRows: mapCariRows,
    mapStokRows: mapStokRows
  };
})();
