(function () {
  'use strict';

  var inited = false;
  var isOpen = false;
  var isTyping = false;
  var isDockMode = false;
  var STORAGE_KEY = 'ecari-elf-panel-state';

  var QUICK_SUGGESTIONS = [
    'Vadesi geçen faturalar',
    'Satış faturası nasıl kesilir?',
    'E-fatura gönderilsin mi?',
    'Cari bakiye sorgula'
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatReply(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function isNexLinkLayout() {
    return !!document.querySelector('.page-layout .app-wrapper');
  }

  function getReply(input) {
    var t = String(input || '').toLowerCase().trim();

    if (!t) {
      return 'Size nasıl yardımcı olabilirim? Fatura, cari, e-fatura veya stok hakkında soru sorabilirsiniz.';
    }

    if (t.indexOf('e-fatura') !== -1 || t.indexOf('efatura') !== -1 || t.indexOf('gib') !== -1) {
      if (t.indexOf('gönder') !== -1 || t.indexOf('gonder') !== -1 || t.indexOf('?') !== -1) {
        return 'SF-2026-0143 numaralı faturanız e-fatura gönderimine hazır.\n\nGöndermek için:\n1. Fatura → Satış Fatura\n2. İlgili faturayı açın\n3. "E-Fatura Gönder" butonuna tıklayın\n\nİsterseniz bildirim panelinden de gönderebilirsiniz.';
      }
      return 'E-fatura modülü aktif. Son 24 saatte 3 e-fatura GİB\'e iletildi. Bekleyen 1 fatura var (SF-2026-0143).';
    }

    if (t.indexOf('cari') !== -1) {
      if (t.indexOf('bakiye') !== -1 || t.indexOf('sorgu') !== -1) {
        return 'ABC Teknoloji Ltd. — Borç: ₺12.450,00\nXYZ Ticaret A.Ş. — Alacak: ₺3.200,00\n\nDetay için Cari → Cari Listesi menüsünü kullanabilirsiniz.';
      }
      if (t.indexOf('ekle') !== -1 || t.indexOf('kaydet') !== -1 || t.indexOf('yeni') !== -1) {
        return 'Yeni cari eklemek için Cari → Yeni Cari Kayıt sayfasına gidin. Unvan, vergi no ve iletişim bilgilerini doldurup kaydedin.';
      }
      return 'Cari modülünde 128 aktif hesap var. 4 carinin vadesi geçmiş bakiyesi bulunuyor. Cari hareket raporu için Cari → Hareketler sayfasına bakın.';
    }

    if (t.indexOf('fatura') !== -1 || t.indexOf('satış') !== -1 || t.indexOf('satis') !== -1) {
      if (t.indexOf('vade') !== -1 || t.indexOf('geç') !== -1 || t.indexOf('gec') !== -1) {
        return 'Vadesi geçen 2 satış faturası var:\n• SF-2026-0140 — Mehmet Yılmaz — ₺850,00\n• SF-2026-0132 — Kaya İnşaat — ₺9.800,00\n\nTahsilat için Cari modülünden tahsilat fişi oluşturabilirsiniz.';
      }
      if (t.indexOf('nasıl') !== -1 || t.indexOf('nasil') !== -1 || t.indexOf('kes') !== -1 || t.indexOf('oluştur') !== -1 || t.indexOf('olustur') !== -1) {
        return 'Satış faturası kesmek için:\n1. Fatura → Yeni Satış Faturası\n2. Müşteri (cari) seçin\n3. Kalemleri ekleyin\n4. Kaydet → ardından e-fatura gönderebilirsiniz.';
      }
      return 'Bu ay 24 satış faturası kesildi. Toplam tutar: ₺186.420,00. Bekleyen tahsilat: ₺14.650,00.';
    }

    if (t.indexOf('stok') !== -1 || t.indexOf('ürün') !== -1 || t.indexOf('urun') !== -1) {
      return '2 ürün kritik stok seviyesinde:\n• USB-C Kablo — 3 adet\n• A4 Kağıt — 5 paket\n\nStok → Stok Listesi sayfasından detay görebilirsiniz.';
    }

    if (t.indexOf('kasa') !== -1 || t.indexOf('banka') !== -1 || t.indexOf('tahsilat') !== -1) {
      return 'Bugünkü kasa hareketi: ₺8.240,00 giriş, ₺2.100,00 çıkış. Net: ₺6.140,00. Banka modülünden hesap bakiyelerini kontrol edebilirsiniz.';
    }

    if (t.indexOf('merhaba') !== -1 || t.indexOf('selam') !== -1 || t.indexOf('hey') !== -1) {
      return 'Merhaba! Ben e-Cari Elf, ön muhasebe asistanınızım. Fatura, cari, e-fatura ve raporlar hakkında sorularınızı yanıtlayabilirim.';
    }

    if (t.indexOf('teşekkür') !== -1 || t.indexOf('tesekkur') !== -1 || t.indexOf('sağol') !== -1 || t.indexOf('sagol') !== -1) {
      return 'Rica ederim! Başka bir konuda yardıma ihtiyacınız olursa buradayım.';
    }

    return 'Bu konuda henüz net bir yanıtım yok. Şunları deneyebilirsiniz:\n• "Vadesi geçen faturalar"\n• "Satış faturası nasıl kesilir?"\n• "E-fatura gönder"\n• "Cari bakiye sorgula"';
  }

  function panelInnerHtml() {
    return (
      '<div class="ecari-elf-header">' +
        '<div class="ecari-elf-avatar"><i class="ti ti-sparkles"></i></div>' +
        '<div class="ecari-elf-header-text">' +
          '<h6>e-Cari Elf</h6>' +
          '<p>Yapay zeka muhasebe asistanı</p>' +
        '</div>' +
        '<div class="ecari-elf-header-actions">' +
          '<button type="button" class="btn btn-sm btn-icon" id="ecari-elf-minimize" aria-label="İkon moduna küçült" title="İkon moduna küçült"><i class="ti ti-chevrons-right"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="ecari-elf-messages" id="ecari-elf-messages"></div>' +
      '<div class="ecari-elf-suggestions" id="ecari-elf-suggestions"></div>' +
      '<div class="ecari-elf-input-wrap">' +
        '<input type="text" class="ecari-elf-input" id="ecari-elf-input" placeholder="Elf\'e bir soru sorun..." autocomplete="off" maxlength="500">' +
        '<button type="button" class="ecari-elf-send" id="ecari-elf-send" aria-label="Gönder"><i class="ti ti-send"></i></button>' +
      '</div>' +
      '<div class="ecari-elf-footer-note">Demo asistan — gerçek yapay zeka entegrasyonu için API bağlanabilir.</div>'
    );
  }

  function buildDockHtml() {
    return (
      '<div class="ecari-elf-dock is-collapsed" id="ecari-elf-root" data-elf-mode="dock" aria-live="polite">' +
        '<button type="button" class="ecari-elf-rail" id="ecari-elf-rail" aria-label="e-Cari Elf asistanını aç" title="Elf\'e Sor">' +
          '<span class="ecari-elf-rail-icon"><i class="ti ti-wand"></i></span>' +
          '<span class="ecari-elf-rail-label">Elf</span>' +
        '</button>' +
        '<aside class="ecari-elf-panel" id="ecari-elf-panel" role="dialog" aria-label="e-Cari Elf asistan">' +
          panelInnerHtml() +
        '</aside>' +
      '</div>'
    );
  }

  function buildFloatingHtml() {
    return (
      '<div class="ecari-elf-root" id="ecari-elf-root" data-elf-mode="float" aria-live="polite">' +
        '<div class="ecari-elf-panel" id="ecari-elf-panel" role="dialog" aria-label="e-Cari Elf asistan">' +
          '<div class="ecari-elf-header">' +
            '<div class="ecari-elf-avatar"><i class="ti ti-sparkles"></i></div>' +
            '<div class="ecari-elf-header-text">' +
              '<h6>e-Cari Elf</h6>' +
              '<p>Yapay zeka muhasebe asistanı</p>' +
            '</div>' +
            '<div class="ecari-elf-header-actions">' +
              '<button type="button" class="btn btn-sm btn-icon" id="ecari-elf-minimize" aria-label="Küçült"><i class="ti ti-minus"></i></button>' +
              '<button type="button" class="btn btn-sm btn-icon" id="ecari-elf-close" aria-label="Kapat"><i class="ti ti-x"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="ecari-elf-messages" id="ecari-elf-messages"></div>' +
          '<div class="ecari-elf-suggestions" id="ecari-elf-suggestions"></div>' +
          '<div class="ecari-elf-input-wrap">' +
            '<input type="text" class="ecari-elf-input" id="ecari-elf-input" placeholder="Elf\'e bir soru sorun..." autocomplete="off" maxlength="500">' +
            '<button type="button" class="ecari-elf-send" id="ecari-elf-send" aria-label="Gönder"><i class="ti ti-send"></i></button>' +
          '</div>' +
          '<div class="ecari-elf-footer-note">Demo asistan — gerçek yapay zeka entegrasyonu için API bağlanabilir.</div>' +
        '</div>' +
        '<button type="button" class="ecari-elf-launcher" id="ecari-elf-launcher" aria-expanded="false" aria-controls="ecari-elf-panel">' +
          '<span class="ecari-elf-launcher-icon"><i class="ti ti-wand"></i></span>' +
          '<span class="ecari-elf-launcher-text">Elf\'e Sor<small>Yapay zeka asistanı</small></span>' +
        '</button>' +
      '</div>'
    );
  }

  function scrollMessages() {
    var box = document.getElementById('ecari-elf-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function appendMessage(role, htmlContent) {
    var box = document.getElementById('ecari-elf-messages');
    if (!box) return null;

    var isUser = role === 'user';
    var el = document.createElement('div');
    el.className = 'ecari-elf-msg ' + (isUser ? 'ecari-elf-msg-user' : 'ecari-elf-msg-bot');
    el.innerHTML =
      '<div class="ecari-elf-msg-avatar"><i class="ti ' + (isUser ? 'ti-user' : 'ti-sparkles') + '"></i></div>' +
      '<div class="ecari-elf-bubble">' + htmlContent + '</div>';
    box.appendChild(el);
    scrollMessages();
    return el;
  }

  function showTyping() {
    var box = document.getElementById('ecari-elf-messages');
    if (!box) return null;
    var el = document.createElement('div');
    el.className = 'ecari-elf-msg ecari-elf-msg-bot ecari-elf-typing';
    el.id = 'ecari-elf-typing';
    el.innerHTML =
      '<div class="ecari-elf-msg-avatar"><i class="ti ti-sparkles"></i></div>' +
      '<div class="ecari-elf-bubble">' +
        '<span class="ecari-elf-typing-dot"></span>' +
        '<span class="ecari-elf-typing-dot"></span>' +
        '<span class="ecari-elf-typing-dot"></span>' +
      '</div>';
    box.appendChild(el);
    scrollMessages();
    return el;
  }

  function hideTyping() {
    var el = document.getElementById('ecari-elf-typing');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function renderSuggestions() {
    var wrap = document.getElementById('ecari-elf-suggestions');
    if (!wrap) return;
    wrap.innerHTML = QUICK_SUGGESTIONS.map(function (text) {
      return '<button type="button" class="ecari-elf-suggestion" data-elf-suggestion="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
    }).join('');
  }

  function setPanelState(state) {
    var root = document.getElementById('ecari-elf-root');
    var html = document.documentElement;
    if (!root || !isDockMode) return;

    var expanded = state === 'expanded';
    isOpen = expanded;
    root.classList.toggle('is-expanded', expanded);
    root.classList.toggle('is-collapsed', !expanded);
    html.setAttribute('data-elf-panel', state);

    try {
      localStorage.setItem(STORAGE_KEY, state);
    } catch (e) { /* ignore */ }

    var panel = document.getElementById('ecari-elf-panel');
    if (panel) panel.setAttribute('aria-hidden', expanded ? 'false' : 'true');

    if (expanded) {
      var input = document.getElementById('ecari-elf-input');
      if (input) setTimeout(function () { input.focus(); }, 220);
    }
  }

  function setOpen(open) {
    if (isDockMode) {
      setPanelState(open ? 'expanded' : 'collapsed');
      return;
    }

    var root = document.getElementById('ecari-elf-root');
    var launcher = document.getElementById('ecari-elf-launcher');
    if (!root) return;

    isOpen = open;
    root.classList.toggle('is-open', open);
    if (launcher) launcher.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
      var input = document.getElementById('ecari-elf-input');
      if (input) setTimeout(function () { input.focus(); }, 220);
    }
  }

  function respondToUser(text) {
    if (isTyping) return;
    isTyping = true;

    var sendBtn = document.getElementById('ecari-elf-send');
    if (sendBtn) sendBtn.disabled = true;

    showTyping();

    setTimeout(function () {
      hideTyping();
      appendMessage('bot', formatReply(getReply(text)));
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
    }, 900 + Math.random() * 500);
  }

  function sendMessage() {
    var input = document.getElementById('ecari-elf-input');
    if (!input || isTyping) return;

    var text = input.value.trim();
    if (!text) return;

    if (isDockMode && !isOpen) setPanelState('expanded');

    appendMessage('user', escapeHtml(text));
    input.value = '';
    respondToUser(text);
  }

  function bindEvents() {
    var launcher = document.getElementById('ecari-elf-launcher');
    var rail = document.getElementById('ecari-elf-rail');
    var closeBtn = document.getElementById('ecari-elf-close');
    var minBtn = document.getElementById('ecari-elf-minimize');
    var sendBtn = document.getElementById('ecari-elf-send');
    var input = document.getElementById('ecari-elf-input');
    var suggestions = document.getElementById('ecari-elf-suggestions');

    if (launcher) {
      launcher.addEventListener('click', function () { setOpen(true); });
    }

    if (rail) {
      rail.addEventListener('click', function () { setPanelState('expanded'); });
    }

    if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });
    if (minBtn) {
      minBtn.addEventListener('click', function () {
        if (isDockMode) setPanelState('collapsed');
        else setOpen(false);
      });
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    if (suggestions) {
      suggestions.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-elf-suggestion]');
        if (!btn) return;
        var text = btn.getAttribute('data-elf-suggestion');
        if (isDockMode && !isOpen) setPanelState('expanded');
        appendMessage('user', escapeHtml(text));
        respondToUser(text);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        if (isDockMode) setPanelState('collapsed');
        else setOpen(false);
      }
    });
  }

  function loadSavedState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'expanded' || saved === 'collapsed') return saved;
    } catch (e) { /* ignore */ }
    return 'collapsed';
  }

  function shouldMount() {
    return !!document.querySelector('.page-layout') || !!document.querySelector('.layout-wrapper.layout-content-navbar');
  }

  function init() {
    if (inited || !shouldMount() || document.getElementById('ecari-elf-root')) return;
    inited = true;
    isDockMode = isNexLinkLayout();

    document.body.insertAdjacentHTML('beforeend', isDockMode ? buildDockHtml() : buildFloatingHtml());
    renderSuggestions();
    bindEvents();

    if (isDockMode) {
      var saved = loadSavedState();
      document.documentElement.setAttribute('data-elf-panel', saved);
      setPanelState(saved);
    }

    appendMessage('bot',
      'Merhaba, ben <strong>e-Cari Elf</strong>! Fatura, cari, e-fatura, stok ve kasa konularında size yardımcı olabilirim.<br><br>Aşağıdaki önerilerden birini seçebilir veya sorunuzu yazabilirsiniz.'
    );
  }

  window.EcariElf = {
    open: function () { init(); setOpen(true); },
    close: function () { setOpen(false); },
    collapse: function () { init(); if (isDockMode) setPanelState('collapsed'); else setOpen(false); },
    ask: function (text) {
      init();
      setOpen(true);
      appendMessage('user', escapeHtml(text));
      respondToUser(text);
    }
  };

  document.addEventListener('partialsLoaded', init);

  /* v2: partialsLoaded genelde script yüklenmeden önce tetiklenir */
  function tryInit() {
    if (shouldMount()) init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
