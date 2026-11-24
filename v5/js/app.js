/* Каменный цветок — «Новый год 2027» (макет, вариант 3 — стиль референса, палитра «красная дверь») */
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
    var room = el.getAttribute('data-room');
    if (room) params.room = room;
    reachGoal(el.getAttribute('data-goal'), params);
  });

  /* ===================== ШАПКА + МЕНЮ ===================== */
  var hdr = document.getElementById('hdr');
  var burger = document.getElementById('burger');
  var hero = document.querySelector('.hero');

  function setMenu(open) {
    hdr.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    burger.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  function closeMenu() { if (hdr.classList.contains('is-open')) setMenu(false); }
  burger.addEventListener('click', function () { setMenu(!hdr.classList.contains('is-open')); });
  document.querySelectorAll('#nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100) closeMenu(); });
  // фокус не уходит из открытого мобильного меню
  hdr.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !hdr.classList.contains('is-open')) return;
    var f = Array.prototype.filter.call(hdr.querySelectorAll('a[href],button'), function (el) { return el.offsetParent !== null || el === burger; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ===================== HERO-СЛАЙДЕР ===================== */
  (function heroSlider() {
    var root = document.getElementById('heroSlider');
    if (!root) return;
    var slides = root.querySelectorAll('.slide');
    var dots = root.querySelectorAll('#heroDots button');
    var cur = 0;
    function go(i, focusDot) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === cur;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
        if ('inert' in s) s.inert = !on;
      });
      dots.forEach(function (d, k) {
        d.setAttribute('aria-selected', String(k === cur));
        d.tabIndex = k === cur ? 0 : -1;
      });
      if (focusDot) dots[cur].focus();
      // ленивые вырезки соседних слайдов — подгружаем заранее
      var nx = slides[(cur + 1) % slides.length].querySelector('img[loading="lazy"]');
      if (nx) nx.loading = 'eager';
    }
    root.querySelector('[data-slide="prev"]').addEventListener('click', function () { go(cur - 1); });
    root.querySelector('[data-slide="next"]').addEventListener('click', function () { go(cur + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    root.querySelector('#heroDots').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
    });
    // свайп
    var x0 = null, y0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    });
    go(0);
  })();

  /* ===================== ЧТО ЖДЁТ: ИКОНКИ ===================== */
  // scope: both — в обоих тарифах, banquet — только с банкетом, near — рядом с отелем (не входит в тур)
  var INCL = [
    { scope: 'both', text: 'Номер выбранной категории с&nbsp;31.12.2026 по&nbsp;02.01.2027, завтраки и&nbsp;шаттл.' },
    { scope: 'banquet', text: 'Новогодний банкет 31&nbsp;декабря в&nbsp;банкетном зале — до&nbsp;70&nbsp;гостей.' },
    { scope: 'banquet', text: 'Два ведущих: интерактивы, конкурсы и&nbsp;поздравления для взрослых и&nbsp;детей. Живой вокал.' },
    { scope: 'banquet', text: 'DJ весь вечер — от&nbsp;хитов до&nbsp;новогодней классики, дискотека после боя курантов.' },
    { scope: 'banquet', text: 'Дед Мороз и&nbsp;Снегурочка — главные гости праздника, с&nbsp;поздравлениями и&nbsp;сюрпризами.' },
    { scope: 'both', text: 'Уличные гулянья 1&nbsp;января с&nbsp;фирменной ухой с&nbsp;костра, музыкой и&nbsp;зимними забавами.' },
    { scope: 'near', text: 'Склоны Завьялихи, прокат лыж и&nbsp;сноубордов, детские инструкторы на&nbsp;учебной трассе.' },
    { scope: 'near', text: 'Баня-бочка после катания и&nbsp;мануальная зона с&nbsp;процедурами.' }
  ];
  var SCOPE = {
    both: '<span class="incl__tag incl__tag--both">В обоих тарифах</span>',
    banquet: '<span class="incl__tag">Тариф с банкетом</span>',
    near: '<span class="incl__tag incl__tag--near">Рядом с отелем</span>'
  };
  (function incl() {
    var row = document.getElementById('inclRow'), panel = document.getElementById('inclPanel');
    if (!row || !panel) return;
    var items = row.querySelectorAll('.incl__item');
    function sel(i, focus, anim) {
      items.forEach(function (b, k) {
        b.setAttribute('aria-selected', String(k === i));
        b.tabIndex = k === i ? 0 : -1;
        if (!b.id) b.id = 'inc-' + k;
      });
      panel.setAttribute('aria-labelledby', 'inc-' + i);
      panel.innerHTML = SCOPE[INCL[i].scope] + '<p>' + INCL[i].text + '</p>';
      if (anim) { panel.classList.remove('is-anim'); void panel.offsetWidth; panel.classList.add('is-anim'); }
      if (focus) items[i].focus();
    }
    items.forEach(function (b, k) { b.addEventListener('click', function () { sel(k, false, true); }); });
    row.addEventListener('keydown', function (e) {
      var i = Array.prototype.findIndex.call(items, function (b) { return b.getAttribute('aria-selected') === 'true'; });
      if (e.key === 'ArrowRight') { e.preventDefault(); sel((i + 1) % items.length, true, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); sel((i - 1 + items.length) % items.length, true, true); }
    });
    sel(0);
  })();

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
    panel.innerHTML = '<div><p class="day-panel__date">' + dt.getDate() + ' ' + MON[dt.getMonth()] + '</p><p class="day-panel__wd">' + WD_FULL[dt.getDay()] + '</p>' + tag + warn + '</div><ul class="events">' + ev + '</ul>';
    if (anim) { panel.classList.remove('is-anim'); void panel.offsetWidth; panel.classList.add('is-anim'); }
  }

  /* ===================== STICKY CTA (mobile) ===================== */
  var sticky = document.getElementById('stickyCta');
  var footer = document.querySelector('.final');
  // липкая кнопка: появляется после hero и прячется у финального блока
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
  function openModal(m, trigger) {
    lastFocus = trigger || document.activeElement;
    m.hidden = false; document.body.style.overflow = 'hidden';
    var f = m.querySelector('[data-close]'); if (f) f.focus();
  }
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.getElementById(btn.getAttribute('data-open'));
      if (m) openModal(m, btn);
    });
  });
  function closeModal(m) { m.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
  });
  document.addEventListener('keydown', function (e) {
    var open = document.querySelector('.modal:not([hidden])');
    if (e.key === 'Tab' && open) { // фокус не уходит из открытого окна
      var f = Array.prototype.filter.call(open.querySelectorAll('a[href],button:not([disabled])'), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      return;
    }
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    closeMenu();
  });

  /* ===================== НОМЕРА: ПАРАМЕТРЫ ===================== */
  // Источник — страницы kamenniy-cvetok.ru/rooms/<slug>/. В рабочей версии — из TravelLine/CMS.
  var ROOMS = {
    'studio': {
      name: 'Студия', type: 'Однокомнатная студия', guests: '2–4', guestsWord: 'гостя', area: '29', floor: '4 этаж',
      lead: 'Стильная и уютная студия на&nbsp;4&nbsp;этаже: хороший обзор и&nbsp;тишина.',
      specs: [
        ['Спальные места', 'Двуспальная кровать и&nbsp;небольшой диван — раскладывается в&nbsp;дополнительное место для 1&nbsp;гостя.'],
        ['Кухня', 'Холодильник, микроволновая печь, варочная поверхность, чайник, посуда для готовки, столовая посуда и&nbsp;приборы. Обеденный стол на&nbsp;3&nbsp;гостей.'],
        ['В номере', 'Телевизор, кондиционер.'],
        ['Ванная', 'Душевая кабина, фен.'],
        ['Расположение', '4&nbsp;этаж. В&nbsp;корпусе нет лифта.']
      ]
    },
    'standard-family': {
      name: 'Стандартный семейный номер', type: 'Однокомнатный номер', guests: '2–3', guestsWord: 'гостя', area: '22', floor: '1 этаж',
      lead: 'Уютный однокомнатный номер для пары или небольшой семьи.',
      specs: [
        ['Спальные места', 'Двуспальная кровать и&nbsp;диван — дополнительное спальное место.'],
        ['Кухня', 'Мини-кухня: варочная панель, мини-холодильник, микроволновая печь, чайник, посуда для готовки, столовая посуда и&nbsp;приборы. Обеденная зона на&nbsp;3&nbsp;гостей.'],
        ['В номере', 'Кондиционер.'],
        ['Ванная', 'Душевая кабина, фен.'],
        ['Расположение', '1&nbsp;этаж, окна выходят на&nbsp;парковку.']
      ]
    },
    'standard-two-rooms': {
      name: 'Стандартный двухкомнатный номер', type: 'Двухкомнатный номер', guests: '2–4', guestsWord: 'гостя', area: '26–29', floor: '1 этаж',
      lead: 'Отдельная спальня и&nbsp;гостиная с&nbsp;кухней и&nbsp;обеденной зоной — для семьи или небольшой компании.',
      specs: [
        ['Спальные места', 'В&nbsp;спальне две односпальные кровати или одна двуспальная. В&nbsp;гостиной диван — дополнительное место для <span class="nw">1–2</span>&nbsp;гостей.'],
        ['Кухня', 'Мини-холодильник, микроволновая печь, варочная поверхность, чайник, посуда для готовки, столовая посуда и&nbsp;приборы. Обеденный стол на&nbsp;4&nbsp;человек.'],
        ['В номере', 'Телевизор, кондиционер, шкаф для одежды.'],
        ['Ванная', 'Душевая кабина, фен.'],
        ['Расположение', '1&nbsp;этаж — быстрый выход на&nbsp;территорию отеля.']
      ]
    },
    'family-lux': {
      name: 'Семейный люкс', type: 'Двухкомнатный номер', guests: '2–6', guestsWord: 'гостей', area: '38', floor: '2 этаж',
      lead: 'Отдельная спальня для взрослых и&nbsp;большая гостиная с&nbsp;кухней, обеденной и&nbsp;спальной зонами.',
      specs: [
        ['Спальные места', 'В&nbsp;спальне большая двуспальная кровать. В&nbsp;гостиной две односпальные кровати и&nbsp;раскладной диван на&nbsp;<span class="nw">1–2</span>&nbsp;гостей. До&nbsp;4&nbsp;гостей на&nbsp;основных местах, с&nbsp;диваном — до&nbsp;6.'],
        ['Кухня', 'Холодильник, микроволновая печь, варочная поверхность, духовой шкаф, электрический чайник, посуда для готовки и&nbsp;сервировки. Стол на&nbsp;6&nbsp;человек.'],
        ['В номере', 'Телевизор в&nbsp;гостиной и&nbsp;в&nbsp;спальне, кондиционер.'],
        ['Ванная', 'Душевая кабина, фен.'],
        ['Расположение', '2&nbsp;этаж. В&nbsp;корпусе нет лифта.']
      ]
    },
    'apartment-2br': {
      name: 'Семейный апартамент с&nbsp;2&nbsp;спальнями', type: 'Трёхкомнатный апартамент', guests: '4–6', guestsWord: 'гостей', area: '64', floor: '4 этаж',
      lead: 'Две отдельные спальни, светлая гостиная с&nbsp;обеденной зоной и&nbsp;полностью оборудованная кухня.',
      specs: [
        ['Спальные места', 'В&nbsp;каждой спальне двуспальная кровать. В&nbsp;гостиной диван — дополнительное место для <span class="nw">1–2</span>&nbsp;гостей.'],
        ['Кухня', 'Холодильник, духовой шкаф, варочная панель, микроволновая печь, чайник, посуда для готовки, столовая посуда и&nbsp;приборы. Обеденный стол на&nbsp;6&nbsp;человек.'],
        ['В номере', 'Телевизор, кондиционеры в&nbsp;гостиной и&nbsp;спальнях, шкафы для одежды, прихожая с&nbsp;вместительным шкафом.'],
        ['Ванная', 'Душевая кабина, фен.'],
        ['Расположение', '4&nbsp;этаж. В&nbsp;корпусе нет лифта.']
      ]
    },
    'apartment-3br': {
      name: 'Семейный апартамент с&nbsp;3&nbsp;спальнями', type: 'Апартамент с&nbsp;тремя спальнями', guests: '6–9', guestsWord: 'гостей', area: '64', floor: '2–3 этаж',
      lead: 'Три отдельные спальни, большая гостиная с&nbsp;обеденной зоной и&nbsp;кухней — для большой семьи или компании.',
      specs: [
        ['Спальные места', 'В&nbsp;каждой спальне двуспальная кровать. Диван в&nbsp;гостиной и&nbsp;диван в&nbsp;одной из&nbsp;спален — дополнительные места для <span class="nw">1–2</span>&nbsp;гостей каждый.'],
        ['Кухня', 'Холодильник, духовой шкаф, варочная панель, микроволновая печь, чайник, посуда для готовки и&nbsp;хранения еды, столовая посуда и&nbsp;приборы. Стол на&nbsp;6&nbsp;персон.'],
        ['В номере', 'Телевизор, кондиционеры, шкафы для одежды, прихожая с&nbsp;вместительным шкафом.'],
        ['Ванная', 'Душевая кабина, фен.'],
        ['Расположение', '2 или 3&nbsp;этаж. В&nbsp;корпусе нет лифта.']
      ]
    }
  };
  var ROOM_PHOTOS = 4;
  var ROOM_IMG = '../v2/img/rooms/'; // фото номеров общие с вариантом B

  (function roomModal() {
    var m = document.getElementById('room-modal');
    if (!m) return;
    var $ = function (id) { return document.getElementById(id); };
    var bg = $('rmBg'), photo = $('rmPhoto'), thumbs = $('rmThumbs'), count = $('rmCount');
    var cur = { slug: null, i: 0, name: '' };

    function show(i) {
      cur.i = (i + ROOM_PHOTOS) % ROOM_PHOTOS;
      photo.src = bg.src = ROOM_IMG + cur.slug + '-' + (cur.i + 1) + '.webp';
      photo.alt = cur.name + ', фото ' + (cur.i + 1) + ' из ' + ROOM_PHOTOS;
      count.textContent = (cur.i + 1) + ' / ' + ROOM_PHOTOS;
      thumbs.querySelectorAll('button').forEach(function (b, k) {
        if (k === cur.i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }

    function open(slug, trigger) {
      var r = ROOMS[slug]; if (!r) return;
      var tmp = document.createElement('span'); tmp.innerHTML = r.name;
      cur.slug = slug; cur.name = tmp.textContent;
      $('rmType').innerHTML = r.type;
      $('rmTitle').innerHTML = r.name;
      $('rmLead').innerHTML = r.lead;
      $('rmFacts').innerHTML =
        '<li><b>' + r.guests + '</b><span>' + r.guestsWord + '</span></li>' +
        '<li><b>' + r.area + '</b><span>м²</span></li>' +
        '<li><b>' + r.floor.split(' ')[0] + '</b><span>этаж</span></li>';
      $('rmSpecs').innerHTML = r.specs.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>'; }).join('');
      var book = $('rmBook');
      book.setAttribute('data-book', 'room:' + slug);
      book.href = bookingUrl('room:' + slug);
      var t = '';
      for (var k = 1; k <= ROOM_PHOTOS; k++) {
        t += '<button type="button" data-rm-i="' + (k - 1) + '" aria-label="Фото ' + k + '"><img src="' + ROOM_IMG + slug + '-' + k + '.webp" alt=""></button>';
      }
      thumbs.innerHTML = t;
      show(0);
      m.querySelector('.rm__info').scrollTop = 0;
      openModal(m, trigger);
    }

    document.querySelectorAll('[data-room]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-room'), b); });
    });
    m.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-rm]');
      if (nav) { show(cur.i + (nav.getAttribute('data-rm') === 'next' ? 1 : -1)); return; }
      var th = e.target.closest('[data-rm-i]');
      if (th) show(+th.getAttribute('data-rm-i'));
    });
    m.addEventListener('keydown', function (e) {
      if (e.target.closest('.rm__gallery') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault(); show(cur.i + (e.key === 'ArrowRight' ? 1 : -1));
      }
    });
    // свайп по фото на телефоне
    var x0 = null;
    photo.parentNode.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    photo.parentNode.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(cur.i + (dx < 0 ? 1 : -1));
    });
  })();

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
