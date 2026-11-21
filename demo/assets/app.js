/* 모든 페이지 공통 동작 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARROW = '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  window.ARROW = ARROW;

  /* 부드러운 스크롤 (Lenis). 인터넷이 없으면 그냥 기본 스크롤로 동작 */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -64 }); }
      });
    });
  }

  /* 로딩 화면: 같은 창에서는 처음 한 번만 */
  var loader = document.querySelector('.loader');
  if (loader) {
    var seen = false;
    try { seen = sessionStorage.getItem('seen-loader'); sessionStorage.setItem('seen-loader', '1'); } catch (e) {}
    setTimeout(function () { loader.classList.add('done'); start(); }, seen || reduce ? 0 : 900);
  } else { start(); }

  function start() {
    var hero = document.querySelector('[data-hero]');
    if (hero) requestAnimationFrame(function () { hero.classList.add('in'); });
  }

  /* 헤더: 내리면 숨고, 올리면 나타남 */
  var header = document.querySelector('.header');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      header.classList.toggle('hide', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    }
    lastY = y;
    statement(); process();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* 모바일 메뉴 */
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', false); });
    });
  }

  /* 화면에 들어오면 살짝 떠오르기 (그룹 안에서 순서대로) */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('rise'); }) : [];
      var i = Math.min(sibs.indexOf(el), 5);
      el.style.transitionDelay = (i > 0 ? i * 50 : 0) + 'ms';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  window.observeRise = function (root) { (root || document).querySelectorAll('.rise:not(.in)').forEach(function (el) { io.observe(el); }); };
  window.observeRise();

  /* 철학 문장: 스크롤에 맞춰 단어가 하나씩 켜짐 */
  var stmt = document.querySelector('[data-statement]');
  var words = [];
  if (stmt) {
    var html = '';
    stmt.textContent.trim().split(/\s+/).forEach(function (w) {
      var hl = w.indexOf('*') === 0;
      w = w.replace(/\*/g, '');
      html += '<span class="w' + (hl ? ' hl' : '') + '">' + w + '</span> ';
    });
    stmt.innerHTML = html;
    words = stmt.querySelectorAll('.w');
  }
  function statement() {
    if (!words.length) return;
    var r = stmt.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * .85 - r.top) / (r.height + vh * .35);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  }

  /* 진행절차: 세로 스크롤을 가로 이동으로 */
  var proc = document.querySelector('.process');
  var track = proc && proc.querySelector('.process-track');
  var bar = proc && proc.querySelector('.process-bar i');
  var steps = proc ? proc.querySelectorAll('.step') : [];
  function process() {
    if (!track || window.innerWidth <= 760) return;
    var r = proc.getBoundingClientRect();
    var total = proc.offsetHeight - window.innerHeight;
    var p = Math.max(0, Math.min(1, -r.top / total));
    var max = track.scrollWidth - window.innerWidth;
    track.style.transform = 'translate3d(' + (-max * p) + 'px,0,0)';
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    steps.forEach(function (s, i) { s.classList.toggle('done', p >= i / steps.length + .02); });
  }

  /* 업무분야: 가운데에 온 업무에 맞춰 서류를 다시 타이핑하고 도장 찍기 */
  var fsheet = document.querySelector('.fsheet');
  if (fsheet) {
    var fTitle = fsheet.querySelector('[data-title]'), fFields = fsheet.querySelector('[data-fields]');
    var fStamp = fsheet.querySelector('[data-stamp]'), fNo = fsheet.querySelector('[data-no]');
    var typingId = 0, current = null;
    function typeInto(el, text, delay, id) {
      return new Promise(function (res) {
        el.textContent = ''; el.classList.add('caret');
        var i = 0;
        setTimeout(function tick() {
          if (id !== typingId) return res();
          el.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(tick, reduce ? 0 : 38); else { el.classList.remove('caret'); res(); }
        }, delay);
      });
    }
    function fill(step, idx) {
      if (current === step) return;
      current = step;
      var id = ++typingId;
      document.querySelectorAll('.fstep').forEach(function (s) { s.classList.toggle('active', s === step); });
      fStamp.classList.remove('hit'); fStamp.textContent = step.dataset.stamp;
      fNo.textContent = '접수번호 2026-' + String(1121 + idx * 7).padStart(4, '0');
      var pairs = step.dataset.fields.split('|').map(function (p) { return p.split('='); });
      fFields.innerHTML = pairs.map(function (p) { return '<dt>' + p[0] + '</dt><dd></dd>'; }).join('');
      var dds = fFields.querySelectorAll('dd');
      var chain = typeInto(fTitle, step.dataset.doc, 0, id);
      pairs.forEach(function (p, i) { chain = chain.then(function () { return typeInto(dds[i], p[1], 60, id); }); });
      chain.then(function () {
        if (id !== typingId) return;
        void fStamp.offsetWidth; fStamp.classList.add('hit');
        fsheet.classList.remove('shake'); void fsheet.offsetWidth;
        setTimeout(function () { fsheet.classList.add('shake'); }, 180);
      });
    }
    var fsteps = Array.prototype.slice.call(document.querySelectorAll('.fstep'));
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) fill(en.target, fsteps.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    fsteps.forEach(function (s) { fio.observe(s); });

  }

  /* 상담: 화면에 들어오면 큰 도장 */
  var cta = document.querySelector('[data-cta]');
  if (cta) {
    new IntersectionObserver(function (en, o) {
      if (en[0].isIntersecting) { cta.classList.add('in'); o.disconnect(); }
    }, { threshold: .35 }).observe(cta);
  }

  /* 자주 묻는 질문 */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement;
      var open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open);
    });
  });

  /* 첫 화면 서류: 마우스를 따라 살짝 기울기 */
  var desk = document.querySelector('.desk');
  if (desk && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var sheet = desk.querySelector('.sheet:not(.under)');
    desk.addEventListener('mousemove', function (e) {
      var b = desk.getBoundingClientRect();
      var x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      sheet.style.transform = 'rotateX(' + (18 - y * 8) + 'deg) rotateY(' + (x * 10) + 'deg) rotateZ(-6deg)';
    });
    desk.addEventListener('mouseleave', function () { sheet.style.transform = ''; });
  }

  /* 메인의 최근 소식 3개 */
  var latest = document.querySelector('[data-latest]');
  if (latest && window.PostStore) {
    var list = PostStore.all().slice(0, 3);
    latest.innerHTML = list.length ? list.map(function (p) {
      return '<a class="post-card rise" href="post.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="post-meta"><span class="cat">' + PostStore.esc(p.category) + '</span><time>' + PostStore.fmt(p.date) + '</time></div>' +
        '<h3>' + PostStore.esc(p.title) + '</h3><p>' + PostStore.esc(p.body) + '</p>' +
        '<span class="more">읽기 ' + ARROW + '</span></a>';
    }).join('') : '<div class="empty">아직 올라온 글이 없습니다</div>';
    window.observeRise(latest);
  }

  onScroll();
  window.addEventListener('resize', onScroll);
})();
