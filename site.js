(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hdrState() {
    var h = document.querySelector('.hdr--over'), hero = document.querySelector('.ahero'), d = document.getElementById('drawer');
    if (!h || !hero) return;
    h.classList.toggle('solid', window.scrollY > hero.offsetHeight - h.offsetHeight - 8 || (d && !d.hidden));
  }

  /* drawer */
  var burger = $('#burger'), drawer = $('#drawer');
  function setDrawer(open) {
    if (!burger || !drawer) return;
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    hdrState();
  }
  if (burger) {
    burger.addEventListener('click', function () { setDrawer(drawer.hidden); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) { setDrawer(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) setDrawer(false); });
  }

  /* AR note */
  var arBtn = $('#arBtn'), dlg = $('#arDlg');
  if (arBtn && dlg) arBtn.addEventListener('click', function () {
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });

  /* bottom bar and order button: hide on scroll down and over the footer */
  var bar = $('#bar'), fab = $('#fab'), footer = $('#footer'), footerSeen = false, lastY = window.scrollY, tick = false;
  function setOff(v) { if (bar) bar.classList.toggle('off', v); if (fab) fab.classList.toggle('off', v); }
  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { footerSeen = en[0].isIntersecting; if (footerSeen) setOff(true); }, { threshold: 0.05 }).observe(footer);
  }
  function onScroll() {
    tick = false;
    var y = window.scrollY, dy = y - lastY;
    if (Math.abs(dy) > 6) {
      if (dy > 0 && y > 80) setOff(true); else if (dy < 0 && !footerSeen && y > 120) setOff(false);
      lastY = y;
    }
    if (footerSeen || (document.body.classList.contains('pg-home') && y < 120)) setOff(true);
    updateChips(); hdrState();
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });

  if (document.body.classList.contains('pg-home') && window.scrollY < 120) setOff(true);

  /* reveal */
  var rv = $$('.rv');
  rv.forEach(function (el, i) { el.style.setProperty('--d', (i % 3) * 70 + 'ms'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 4000);
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* draggable strips: touch swipes natively, mouse drags, arrow keys scroll */
  function strip(el, step) {
    var down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 4) { moved = true; el.classList.add('drag'); }
      if (moved) el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) { el.classList.remove('drag'); if (step) step(); }
    });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    if (!step) el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); el.scrollBy({ left: el.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); el.scrollBy({ left: -el.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' }); }
    });
  }
  $$('.strip').forEach(function (s) { strip(s); });

  /* hero line-up */
  var arc = $('#arc');
  if (arc) {
    var items = $$('.sp', arc), cur = -1, raf = 0;
    var nameEl = $('#pickN');
    var centreOf = function (it) { return it.offsetLeft + it.offsetWidth / 2; };
    var goTo = function (i, smooth) {
      i = Math.max(0, Math.min(items.length - 1, i));
      arc.scrollTo({ left: centreOf(items[i]) - arc.clientWidth / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    };
    var update = function () {
      raf = 0;
      var mid = arc.scrollLeft + arc.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (it, i) {
        var d = (centreOf(it) - mid) / (it.offsetWidth * 0.88), ad = Math.abs(d);
        if (!reduce) {
          it.style.setProperty('--s', (1 - Math.min(ad, 2) * 0.14).toFixed(3));
          it.style.setProperty('--y', (Math.min(ad, 2.5) * Math.min(ad, 2.5) * 12).toFixed(1) + 'px');
        }
        if (ad < bd) { bd = ad; best = i; }
      });
      if (best !== cur) {
        cur = best; var it = items[best];
        nameEl.textContent = it.dataset.n;
      }
    };
    arc.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    items.forEach(function (it, i) { it.addEventListener('click', function () { goTo(i, true); }); });
    arc.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1, true); }
    });
    strip(arc, function () { goTo(cur, true); });
    arc.style.scrollBehavior = 'auto';
    var first = function () { goTo(3, false); update(); };
    first();
    window.addEventListener('load', first);
    window.addEventListener('resize', function () { goTo(cur < 0 ? 3 : cur, false); update(); });
  }

  /* menu: greeting, chips, bread picker */
  var greet = $('#greet');
  if (greet) {
    var h = new Date().getHours();
    greet.textContent = h >= 5 && h < 12 ? 'Good morning. Your perfect cup is waiting.' : h >= 12 && h < 17 ? 'Good afternoon. Time for a sweet escape.' : 'Good evening. We pour until 2am.';
  }
  var chips = $('#chips'), chipLinks = chips ? $$('a', chips) : [], secs = chipLinks.map(function (a) { return $(a.getAttribute('href')); }), activeChip = -1;
  function updateChips() {
    if (!chips) return;
    var idx = -1, line = chips.offsetHeight + 24;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) idx = i; });
    if (idx === activeChip) return;
    activeChip = idx;
    chipLinks.forEach(function (a, i) { a.classList.toggle('on', i === idx); if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (idx >= 0) { var a = chipLinks[idx]; chips.scrollTo({ left: a.offsetLeft - (chips.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); }
  }
  var breads = $('#breads');
  if (breads) {
    var prices = $$('#sandList .p');
    var setBread = function () {
      var r = $('input:checked', breads), i = r ? +r.value : 0;
      prices.forEach(function (p) { p.textContent = p.dataset.p.split(',')[i]; });
    };
    breads.addEventListener('change', setBread); setBread();
  }
  /* shared helpers for forms */
  var PHONE_RE = /^\+?[\d\s-]{7,}$/;
  function fieldErr(f, msg) {
    var err = $('#' + f.id + '-err');
    if (!err) return;
    err.textContent = msg || ''; err.hidden = !msg;
    if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
  }
  function check(f) {
    var v = (f.value || '').trim(), m = '';
    if (!v) m = f.type === 'select-one' ? 'Please choose one.' : 'Please fill this in.';
    else if (f.type === 'tel' && !PHONE_RE.test(v)) m = 'Enter a phone number we can call or message.';
    else if (f.type === 'number' && !(+v >= 1)) m = 'Enter at least 1 guest.';
    fieldErr(f, m); return !m;
  }
  function validate(form) {
    var first = null;
    $$('[required]', form).forEach(function (f) { if (!check(f) && !first) first = f; });
    if (first) first.focus();
    return !first;
  }
  function watch(form) {
    $$('[required]', form).forEach(function (f) {
      f.addEventListener('blur', function () { check(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid')) check(f); });
    });
  }
  var WA = 'https://wa.me/' + '201555566551' + '?text=';
  function openWA(text) { window.open(WA + encodeURIComponent(text), '_blank', 'noopener'); }

  /* catering enquiry */
  var enq = $('#enq');
  if (enq) {
    var dt = $('#e-date'); try { dt.min = new Date().toISOString().slice(0, 10); } catch (e) {}
    watch(enq);
    var enqText = function () {
      var g = function (n) { return enq.elements[n].value.trim(); };
      return 'Hello Rotto, I would like to enquire about catering.\n\nEvent: ' + g('type') + '\nDate: ' + g('date') + '\nGuests: ' + g('guests') + '\nVenue: ' + g('venue') + '\nName: ' + g('name') + '\nPhone: ' + g('phone');
    };
    enq.addEventListener('submit', function (e) { e.preventDefault(); if (validate(enq)) openWA(enqText()); });
    $('#enqMail').addEventListener('click', function () {
      if (!validate(enq)) return;
      window.location.href = 'mailto:info@rottocoffee.com?subject=' + encodeURIComponent('Catering enquiry') + '&body=' + encodeURIComponent(enqText());
    });
  }

  /* pickup basket (menu page) */
  var dlgO = $('#orderDlg');
  if (dlgO) {
    var KEY = 'rotto-basket', basket = {}, live = document.createElement('p');
    live.className = 'sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
    try { var s = localStorage.getItem(KEY); if (s) { var o = JSON.parse(s); if (o && typeof o === 'object') basket = o; } } catch (e) {}
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {} };
    var breadIdx = function () { var r = $('#breads input:checked'); return r ? +r.value : 0; };
    var breadName = function () { var r = $('#breads input:checked + span'); return r ? r.textContent : ''; };
    var keyOf = function (li) { return li.dataset.sand ? li.dataset.k + '-b' + breadIdx() : li.dataset.k; };
    var priceOf = function (li) { return parseInt($('.p', li).textContent, 10) || 0; };
    var stepper = function (q, name, attr) {
      return '<span class="step" role="group" aria-label="Quantity of ' + name + '"><button class="ic" type="button" data-act="dec" ' + attr + ' aria-label="Remove one ' + name + '"><span aria-hidden="true">&minus;</span></button><output aria-live="off">' + q + '</output><button class="ic" type="button" data-act="inc" ' + attr + ' aria-label="Add one ' + name + '"><span aria-hidden="true">+</span></button></span>';
    };
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    var count = function () { var n = 0; for (var k in basket) n += basket[k].q; return n; };
    var total = function () { var t = 0; for (var k in basket) t += basket[k].q * basket[k].p; return t; };
    var items = $$('.menu .item');
    items.forEach(function (li) { var c = document.createElement('div'); c.className = 'ctl'; li.appendChild(c); });
    function ctl(li) {
      var k = keyOf(li), q = basket[k] ? basket[k].q : 0, nm = esc(li.dataset.n + (li.dataset.sand ? ' on ' + breadName() : ''));
      $('.ctl', li).innerHTML = q ? stepper(q, nm, 'data-k="' + k + '" data-row="1"') : '<button class="add ic" type="button" data-act="add" aria-label="Add ' + nm + ' to pickup order"><span aria-hidden="true">+</span></button>';
    }
    function render() {
      items.forEach(ctl);
      $$('[data-count]').forEach(function (e) { var n = count(); e.textContent = n; e.setAttribute('data-n', n); });
      var keys = Object.keys(basket);
      $('#pempty').hidden = keys.length > 0; $('#plist').hidden = !keys.length; $('#ptotalRow').hidden = !keys.length;
      $('#plist').innerHTML = keys.map(function (k) { var b = basket[k], n = esc(b.n);
        return '<li><span class="pn">' + n + '</span><span class="pl">' + (b.q * b.p) + ' EGP</span>' + stepper(b.q, n, 'data-k="' + k + '"') + '</li>'; }).join('');
      $('#ptotal').textContent = total();
    }
    function change(k, d, li) {
      if (!basket[k]) { if (d < 0 || !li) return; basket[k] = { n: li.dataset.n + (li.dataset.sand ? ' on ' + breadName() : ''), p: priceOf(li), q: 0 }; }
      basket[k].q += d;
      var nm = basket[k].n;
      if (basket[k].q <= 0) { delete basket[k]; live.textContent = nm + ' removed'; } else live.textContent = nm + ', quantity ' + basket[k].q;
      save(); var fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.act : '';
      render();
      var sel = (li && $('.ctl button', li)); 
      if (li && sel) { var nb = $('.ctl [data-act="' + (basket[k] ? (fk === 'dec' ? 'dec' : 'inc') : 'add') + '"]', li) || sel; nb.focus(); }
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (t) {
        var li = t.closest('.item'), act = t.dataset.act;
        if (li) { change(keyOf(li), act === 'dec' ? -1 : 1, li); }
        else if (t.dataset.k) {
          change(t.dataset.k, act === 'dec' ? -1 : 1, null);
          var again = $('#plist [data-act="' + act + '"][data-k="' + t.dataset.k + '"]') || $('#plist [data-act]'); if (again) again.focus();
        }
        return;
      }
      if (e.target.closest && e.target.closest('.open-pickup')) { render(); if (dlgO.showModal) dlgO.showModal(); else dlgO.setAttribute('open', ''); }
      if (e.target.closest && e.target.closest('[data-close]')) dlgO.close();
    });
    dlgO.addEventListener('click', function (e) { if (e.target === dlgO) dlgO.close(); });
    var breadsEl = $('#breads'); if (breadsEl) breadsEl.addEventListener('change', function () { setTimeout(render, 0); });
    var pf = $('#pform'); watch(pf);
    $('#pclear').addEventListener('click', function () { basket = {}; save(); render(); });
    pf.addEventListener('submit', function (e) {
      e.preventDefault();
      var okF = validate(pf), em = $('#o-empty-err');
      if (!count()) { em.textContent = 'Add at least one item to send an order.'; em.hidden = false; return; } else em.hidden = true;
      if (!okF) return;
      var lines = Object.keys(basket).map(function (k) { var b = basket[k]; return b.q + ' x ' + b.n + ' (' + (b.q * b.p) + ' EGP)'; });
      openWA('Hello Rotto, I would like to place a pickup order.\nPickup at Rotto Zamalek, Baba Sharo, Mohammed Mazhar, Zamalek\nName: ' + pf.elements.name.value.trim() + '\nPickup time: ' + pf.elements.time.value + '\n\n' + lines.join('\n') + '\n\nTotal: ' + total() + ' EGP');
    });
    render();
  }

  updateChips(); hdrState();
})();
