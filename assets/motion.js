/* Subtle motion for the portfolio: count-up stats, charts that draw in, styled chart tooltips.
   Everything renders complete without JavaScript, and all motion is skipped when the visitor
   has asked their device to reduce motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function onVisible(el, fn, threshold) {
    if (!hasIO) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(); } });
    }, { threshold: threshold || 0.35 });
    io.observe(el);
  }

  /* ---------- 1. count-up numbers ---------- */
  var NUM = /^([^0-9]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/;
  function countUp(el) {
    var original = el.textContent.trim();
    var m = original.match(NUM);
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, ''));
    if (!target) return;
    var decimals = (m[2].split('.')[1] || '').length;
    var commas = m[2].indexOf(',') > -1 || target >= 10000;
    var pre = m[1], post = m[3];
    el.setAttribute('aria-label', original);
    var start = null, dur = Math.min(1600, 700 + Math.log10(target + 1) * 260);
    function fmt(v) {
      var s = v.toFixed(decimals);
      if (commas) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); }
      return pre + s + post;
    }
    function step(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e);
      if (k < 1) requestAnimationFrame(step); else el.textContent = original;
    }
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  }
  if (!reduce) {
    document.querySelectorAll('[data-count], .stat b, .case .big, .glance .stats b, .finding .n').forEach(function (el) {
      var target = el.querySelector(':scope > small') ? el.firstChild : null;
      if (target && target.nodeType === 3) {
        // .finding .n holds "number<small>label</small>": animate just the text node via a span
        var span = document.createElement('span');
        span.textContent = target.textContent;
        el.replaceChild(span, target);
        el = span;
      }
      onVisible(el, function () { countUp(el); }, 0.6);
    });
  }

  /* ---------- 2. charts that draw in ---------- */
  document.querySelectorAll('figure.chart svg').forEach(function (svg) {
    var lines = svg.querySelectorAll('polyline.ln');
    var dots = svg.querySelectorAll('.pt, .lbl');
    var bars = svg.querySelectorAll('rect.bar');
    var vals = svg.querySelectorAll('.val');
    if (reduce) return;
    lines.forEach(function (l) {
      var len = l.getTotalLength ? l.getTotalLength() : 1000;
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
    });
    dots.forEach(function (d) { d.style.opacity = 0; });
    vals.forEach(function (v) { v.style.opacity = 0; });
    bars.forEach(function (b) { b.style.transformBox = 'fill-box'; b.style.transformOrigin = 'left center'; b.style.transform = 'scaleX(0)'; });
    onVisible(svg, function () {
      lines.forEach(function (l) { l.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.25,.8,.25,1)'; l.style.strokeDashoffset = 0; });
      dots.forEach(function (d, i) { d.style.transition = 'opacity .4s ease ' + (0.25 + (i % 6) * 0.22) + 's'; d.style.opacity = 1; });
      bars.forEach(function (b, i) { b.style.transition = 'transform .9s cubic-bezier(.25,.8,.25,1) ' + (i * 0.08) + 's'; b.style.transform = 'scaleX(1)'; });
      vals.forEach(function (v, i) { v.style.transition = 'opacity .4s ease ' + (0.5 + i * 0.08) + 's'; v.style.opacity = 1; });
    });
  });

  /* ---------- 3. styled tooltips (hover and keyboard focus) ---------- */
  var tips = document.querySelectorAll('[data-tip]');
  if (tips.length) {
    var tip = document.createElement('div');
    tip.className = 'tip'; tip.setAttribute('aria-hidden', 'true'); // visual only: each point already has its own aria-label
    document.body.appendChild(tip);
    function show(el) {
      tip.textContent = el.getAttribute('data-tip');
      var r = el.getBoundingClientRect();
      tip.style.left = (r.left + r.width / 2 + window.scrollX) + 'px';
      tip.style.top = (r.top + window.scrollY - 10) + 'px';
      tip.classList.add('on');
    }
    function hide() { tip.classList.remove('on'); }
    tips.forEach(function (el) {
      el.addEventListener('mouseenter', function () { show(el); });
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
      el.addEventListener('touchstart', function () { show(el); }, { passive: true });
    });
    window.addEventListener('scroll', hide, { passive: true });
  }
})();
