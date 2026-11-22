/* Каменный цветок — «Новый год 2027» (макет) */
(function () {
  'use strict';

  /* ===================== НАСТРОЙКИ ===================== */

  // TravelLine: все кнопки бронирования собираются отсюда.
  // TODO (при интеграции): подставить реальные ID тарифов/категорий из личного кабинета TravelLine
  // и сверить имена параметров с документацией модуля бронирования.
  var BOOKING = {
    base: 'https://kamenniy-cvetok.ru/booking/',
    params: { date: 'date', nights: 'nights', adults: 'adults', rate: 'rate-plan', room: 'room-type' },
    tour: { date: '2026-12-31', nights: 2, adults: 2 },
    rates: {
      banquet: 'NY2027_BANQUET', // «Новогодний» с банкетом
      base: 'NY2027_BASE'        // «Новогодний» без банкета
    },
    rooms: {
      'studio': 'ROOM_STUDIO',
      'standard-family': 'ROOM_STANDARD_FAMILY',
      'standard-two-rooms': 'ROOM_STANDARD_TWO',
      'family-lux': 'ROOM_FAMILY_LUX',
      'apartment-2br': 'ROOM_APT_2BR',
      'apartment-3br': 'ROOM_APT_3BR'
    }
  };

  // Аналитика: ID счётчика Метрики и GA4 подставляются при внедрении.
  var ANALYTICS = { ymId: null /* например 12345678 */, debug: true };

  /* ===================== БРОНИРОВАНИЕ ===================== */
  function bookingUrl(kind) {
    var p = BOOKING.params, q = new URLSearchParams();
    q.set(p.date, BOOKING.tour.date);
    q.set(p.nights, BOOKING.tour.nights);
    q.set(p.adults, BOOKING.tour.adults);
    if (kind === 'banquet' || kind === 'base') {
      q.set(p.rate, BOOKING.rates[kind]);
    } else if (kind && kind.indexOf('room:') === 0) {
      var id = BOOKING.rooms[kind.slice(5)];
      if (id) q.set(p.room, id);
    }
    return BOOKING.base + '?' + q.toString();
  }
  document.querySelectorAll('[data-book]').forEach(function (a) {
    a.href = bookingUrl(a.getAttribute('data-book'));
  });

  /* ===================== ЦЕЛИ ===================== */
  function reachGoal(name, params) {
    try {
      if (ANALYTICS.ymId && typeof window.ym === 'function') window.ym(ANALYTICS.ymId, 'reachGoal', name, params);
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
    } catch (e) { /* аналитика не должна ломать переход */ }
    if (ANALYTICS.debug && window.console) console.info('[goal]', name, params || '');
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-goal]');
    if (!el) return;
    var params = {};
    var book = el.getAttribute('data-book');
    if (book) params.target = book;
    reachGoal(el.getAttribute('data-goal'), params);
  });

  /* ===================== ШАПКА + МЕНЮ ===================== */
  var hdr = document.getElementById('hdr');
  var burger = document.getElementById('burger');
  var hero = document.querySelector('.hero');
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-solid', y > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    hdr.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    burger.querySelector('use').setAttribute('href', '#i-menu');
  }
  burger.addEventListener('click', function () {
    var open = !hdr.classList.contains('is-open');
    hdr.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    burger.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  });
  document.querySelectorAll('#nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  // Подсветка активного раздела
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('#nav a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) { var s = document.querySelector(l.getAttribute('href')); if (s) secObs.observe(s); });
    if (hero) secObs.observe(hero); // на первом экране ничего не подсвечиваем
  }

  /* ===================== ПОЯВЛЕНИЕ БЛОКОВ ===================== */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      rObs.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ===================== СНЕГ (hero) ===================== */
  (function snow() {
    var cv = document.getElementById('snow');
    if (!cv || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = cv.getContext('2d'), flakes = [], w, h, dpr, running = true, raf;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(110, w / 12));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push(mk(true));
    }
    function mk(any) {
      return { x: Math.random() * w, y: any ? Math.random() * h : -10, r: Math.random() * 2.2 + .6, s: Math.random() * .6 + .25, d: Math.random() * Math.PI * 2, o: Math.random() * .5 + .35 };
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.d += .01; f.y += f.s * (f.r * .55 + .4); f.x += Math.sin(f.d) * .35;
        if (f.y > h + 5) flakes[i] = mk(false);
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + f.o + ')'; ctx.fill();
      }
      if (running) raf = requestAnimationFrame(tick);
    }
    size(); tick();
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        running = en[0].isIntersecting;
        if (running) { cancelAnimationFrame(raf); tick(); }
      }).observe(cv);
    }
  })();

  /* ===================== КАРУСЕЛЬ НОМЕРОВ ===================== */
  (function carousel() {
    var box = document.getElementById('roomsCarousel');
    if (!box) return;
    var track = box.querySelector('.carousel__track');
    var items = track.children;
    var prev = document.querySelector('[data-car="prev"]');
    var next = document.querySelector('[data-car="next"]');
    var dotsBox = document.getElementById('roomsDots');
    function step() { return items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24); }
    function perView() { return Math.max(1, Math.round(box.clientWidth / step())); }
    function pages() { return Math.max(1, items.length - perView() + 1); }
    function buildDots() {
      dotsBox.innerHTML = '';
      for (var i = 0; i < pages(); i++) dotsBox.appendChild(document.createElement('i'));
      update();
    }
    function update() {
      var idx = Math.round(box.scrollLeft / step());
      Array.prototype.forEach.call(dotsBox.children, function (d, i) { d.classList.toggle('is-on', i === idx); });
      prev.disabled = box.scrollLeft < 5;
      next.disabled = box.scrollLeft + box.clientWidth >= box.scrollWidth - 5;
    }
    prev.addEventListener('click', function () { box.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { box.scrollBy({ left: step(), behavior: 'smooth' }); });
    box.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
    window.addEventListener('resize', buildDots);
    buildDots();
  })();

  /* ===================== АФИША ===================== */
  // type: 'tour' — дни новогоднего тура, 'base' — продление по основному тарифу.
  // only: 'banquet' — только для тарифа с банкетом.
  var AFISHA = [
    { d: '2026-12-31', type: 'tour', events: [
      { t: 'День', title: 'Заезд в новогодний тур', desc: 'Размещение в номере выбранной категории.' },
      { t: 'Вечер', title: 'Новогодний банкет', desc: 'Праздничный ужин, два ведущих, живой вокал, Дед Мороз и Снегурочка.', only: 'banquet' },
      { t: 'Ночь', title: 'Бой курантов и новогодняя дискотека', desc: 'DJ и танцы до утра.', only: 'banquet' }
    ]},
    { d: '2027-01-01', type: 'tour', stop: true, events: [
      { t: 'Утро', title: 'Завтрак', desc: 'Входит в оба тарифа.' },
      { t: 'День', title: 'Уличные гулянья с фирменной ухой', desc: 'Горячая уха с костра, музыка и зимние забавы для всей семьи. Для гостей обоих тарифов.' },
      { t: 'Весь день', title: 'Катание на склонах', desc: 'Прокат лыж и сноубордов, шаттл до склона.' }
    ]},
    { d: '2027-01-02', type: 'tour', events: [
      { t: 'Утро', title: 'Завтрак и выезд', desc: 'Окончание тура. Хотите остаться — продлите проживание по основному тарифу.' },
      { t: 'День', title: 'Катание на склонах', desc: 'Горные лыжи, сноуборд, учебная трасса для детей.' }
    ]},
    { d: '2027-01-03', type: 'base', events: [
      { t: 'Весь день', title: 'Склоны и прокат', desc: 'Катание для взрослых и детей, детские инструкторы.' },
      { t: 'Вечер', title: 'Баня-бочка', desc: 'По предварительной записи.' }
    ]},
    { d: '2027-01-04', type: 'base', events: [
      { t: 'Весь день', title: 'Семейный день на учебной трассе', desc: 'Встаньте на лыжи всей семьёй с инструктором.' },
      { t: 'Вечер', title: 'Мануальная зона', desc: 'Оздоровительные процедуры после катания.' }
    ]},
    { d: '2027-01-05', type: 'base', events: [
      { t: 'Весь день', title: 'Склоны и прокат', desc: 'Горные лыжи и сноуборд.' },
      { t: 'Вечер', title: 'Баня-бочка', desc: 'По предварительной записи.' }
    ]},
    { d: '2027-01-06', type: 'base', events: [
      { t: 'Весь день', title: 'Склоны и прокат', desc: 'Горные лыжи и сноуборд.' },
      { t: 'Вечер', title: 'Сочельник', desc: 'Программа уточняется.' }
    ]},
    { d: '2027-01-07', type: 'base', events: [
      { t: 'Весь день', title: 'Рождество', desc: 'Праздничная программа уточняется.' },
      { t: 'Весь день', title: 'Склоны и прокат', desc: 'Горные лыжи и сноуборд.' }
    ]},
    { d: '2027-01-08', type: 'base', events: [
      { t: 'Весь день', title: 'Склоны и прокат', desc: 'Детские инструкторы на учебной трассе.' }
    ]},
    { d: '2027-01-09', type: 'base', events: [
      { t: 'Весь день', title: 'Склоны и прокат', desc: 'Горные лыжи и сноуборд.' },
      { t: 'Вечер', title: 'Баня-бочка', desc: 'По предварительной записи.' }
    ]},
    { d: '2027-01-10', type: 'base', events: [
      { t: 'Утро', title: 'Последний день каникул', desc: 'Завтрак и выезд.' }
    ]}
  ];
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MON_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var WD_FULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var daysBox = document.getElementById('days');
  var panel = document.getElementById('dayPanel');
  if (daysBox && panel) {
    AFISHA.forEach(function (day, i) {
      var dt = parse(day.d);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'day' + (day.type === 'tour' ? ' is-tour' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'dayPanel');
      b.id = 'day-' + i;
      b.innerHTML = '<span class="day__wd">' + WD[dt.getDay()] + '</span><span class="day__d">' + dt.getDate() + '</span><span class="day__m">' + MON_SHORT[dt.getMonth()] + '</span>' + (day.stop ? '<i class="day__flag" title="Заезд и выезд невозможны"></i>' : '');
      b.addEventListener('click', function () { select(i, true); });
      daysBox.appendChild(b);
    });
    daysBox.addEventListener('keydown', function (e) {
      var cur = AFISHA.findIndex(function (_, i) { return daysBox.children[i].classList.contains('is-selected'); });
      if (e.key === 'ArrowRight' && cur < AFISHA.length - 1) { select(cur + 1, true); daysBox.children[cur + 1].focus(); }
      if (e.key === 'ArrowLeft' && cur > 0) { select(cur - 1, true); daysBox.children[cur - 1].focus(); }
    });
    select(0, false);
  }
  function select(i, anim) {
    var day = AFISHA[i], dt = parse(day.d);
    Array.prototype.forEach.call(daysBox.children, function (b, j) {
      b.classList.toggle('is-selected', j === i);
      b.setAttribute('aria-selected', String(j === i));
      b.tabIndex = j === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'day-' + i);
    var tag = day.type === 'tour'
      ? '<span class="day-panel__tag day-panel__tag--tour">Новогодний тур</span>'
      : '<span class="day-panel__tag day-panel__tag--base">По основному тарифу</span>';
    var warn = day.stop ? '<p class="day-panel__warn"><svg><use href="#i-alert"/></svg>Заезд и выезд в этот день невозможны</p>' : '';
    var ev = day.events.map(function (e) {
      return '<li class="event"><span class="event__time">' + esc(e.t) + '</span><div><p class="event__title">' + esc(e.title) +
        (e.only === 'banquet' ? '<span class="event__tag">тариф с банкетом</span>' : '') + '</p><p class="event__desc">' + esc(e.desc) + '</p></div></li>';
    }).join('');
    panel.innerHTML = '<div><p class="day-panel__date">' + dt.getDate() + ' ' + MON[dt.getMonth()] + '</p><p style="color:var(--ink-3);margin-top:6px">' + WD_FULL[dt.getDay()] + '</p>' + tag + warn + '</div><ul class="events">' + ev + '</ul>';
    if (anim) { panel.classList.remove('is-anim'); void panel.offsetWidth; panel.classList.add('is-anim'); }
  }

  /* ===================== STICKY CTA (mobile) ===================== */
  var sticky = document.getElementById('stickyCta');
  var footer = document.querySelector('.final');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroVisible = true, finalVisible = false;
    function syncSticky() {
      var on = !heroVisible && !finalVisible;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', String(!on));
      sticky.querySelector('a').tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; syncSticky(); }, { threshold: 0.15 }).observe(hero);
    if (footer) new IntersectionObserver(function (en) { finalVisible = en[0].isIntersecting; syncSticky(); }).observe(footer);
  }

  /* ===================== МОДАЛКА ===================== */
  var lastFocus = null;
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.getElementById(btn.getAttribute('data-open'));
      if (!m) return;
      lastFocus = btn; m.hidden = false; document.body.style.overflow = 'hidden';
      var f = m.querySelector('[data-close]'); if (f) f.focus();
    });
  });
  function closeModal(m) { m.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    if (hdr.classList.contains('is-open')) closeMenu();
  });

  /* ===================== ПОМЕТКИ МАКЕТА ===================== */
  var nt = document.getElementById('notesToggle');
  if (nt) {
    if (/[?&]clean\b/.test(location.search)) { document.body.classList.add('no-notes'); nt.hidden = true; }
    nt.addEventListener('click', function () {
      var off = document.body.classList.toggle('no-notes');
      nt.setAttribute('aria-pressed', String(!off));
      nt.textContent = 'Пометки макета: ' + (off ? 'выкл' : 'вкл');
    });
  }
})();
