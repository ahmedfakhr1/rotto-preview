(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* drawer */
  var burger = $('#burger'), drawer = $('#drawer');
  function setDrawer(open) {
    if (!burger || !drawer) return;
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
      if (dy > 0 && y > 80) setOff(true); else if (dy < 0 && !footerSeen) setOff(false);
      lastY = y;
    }
    if (footerSeen) setOff(true);
    updateChips();
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });

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
    var nameEl = $('#pickN'), priceEl = $('#pickP'), noteEl = $('#pickNote');
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
        nameEl.textContent = it.dataset.n; priceEl.textContent = it.dataset.p; noteEl.textContent = it.dataset.note || '';
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
  updateChips();
})();
