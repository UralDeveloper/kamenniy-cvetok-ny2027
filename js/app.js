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
    // ID категорий номеров в TravelLine (из модуля бронирования, 26.11.2026)
    rooms: {
      'standard': '373795',
      'standard-family': '348986',
      'studio': '348987',
      'lux': '375215',
      'family-lux': '352976',
      'apartment-2br': '348989',
      'apartment-3br': '348990'
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
    if (hdr.classList.contains('is-open')) closeMenu();
  });

  /* ===================== НОМЕРА: ОКНО С ПАРАМЕТРАМИ ===================== */
  // Источник — модуль бронирования TravelLine (kamenniy-cvetok-rooms/*/room.json, 26.11.2026).
  // Фото: img/rooms/<slug>/NN.webp (до 1600 px) и NN-s.webp (640 px — карточки и миниатюры).
  var ROOMS = {
    "standard": {
      "name": "Стандартный номер",
      "type": "Однокомнатный номер",
      "guests": 2,
      "area": "18",
      "rooms": "1",
      "roomsWord": "комната",
      "lead": "Однокомнатный номер для&nbsp;двоих: двуспальная кровать, полноценная мини-кухня и&nbsp;обеденная зона на&nbsp;двух гостей.",
      "tags": [
        "Двуспальная кровать",
        "Мини-кухня",
        "Wi-Fi",
        "Кондиционер",
        "Можно с питомцами"
      ],
      "photos": 7,
      "cover": 2,
      "specs": [
        [
          "Спальные места",
          "Двуспальная кровать."
        ],
        [
          "Кухня",
          "Варочная панель, мини-холодильник, микроволновая печь, чайник, посуда для&nbsp;готовки, столовая посуда и&nbsp;приборы. Обеденная зона на&nbsp;2&nbsp;гостей."
        ],
        [
          "В номере",
          "Телевизор, кондиционер, Wi-Fi, сейф."
        ],
        [
          "Ванная",
          "Душевая кабина, фен, банные полотенца."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": ""
    },
    "standard-family": {
      "name": "Стандартный семейный номер",
      "type": "Однокомнатный номер",
      "guests": 3,
      "area": "22",
      "rooms": "1",
      "roomsWord": "комната",
      "lead": "Уютный однокомнатный номер для&nbsp;пары или&nbsp;небольшой семьи. Диван&nbsp;— дополнительное спальное место.",
      "tags": [
        "Двуспальная кровать",
        "Диван-кровать",
        "Мини-кухня",
        "Кондиционер",
        "Телевизор"
      ],
      "photos": 11,
      "cover": 10,
      "specs": [
        [
          "Спальные места",
          "Двуспальная кровать и&nbsp;диван-кровать&nbsp;— дополнительное место."
        ],
        [
          "Кухня",
          "Варочная панель, мини-холодильник, микроволновая печь, чайник, посуда. Обеденная зона на&nbsp;3&nbsp;гостей."
        ],
        [
          "В номере",
          "Телевизор, кондиционер, Wi-Fi, внутренний телефон, сейф."
        ],
        [
          "Ванная",
          "Душевая кабина, фен, банные полотенца."
        ],
        [
          "Расположение",
          "1&nbsp;этаж, окна выходят на&nbsp;парковку."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": "В&nbsp;TravelLine у&nbsp;этого номера в&nbsp;характеристиках 22&nbsp;м², а&nbsp;в&nbsp;описании 29&nbsp;м². На&nbsp;макете стоит 22&nbsp;м², нужно сверить с&nbsp;отелем."
    },
    "studio": {
      "name": "Студия",
      "type": "Номер-студия",
      "guests": 4,
      "area": "29",
      "rooms": "1",
      "roomsWord": "комната",
      "lead": "Стильная и&nbsp;уютная студия: двуспальная кровать или&nbsp;две односпальные и&nbsp;диван, который раскладывается в&nbsp;место для&nbsp;ещё&nbsp;одного гостя.",
      "tags": [
        "Двуспальная кровать",
        "Диван-кровать",
        "Кухонная зона",
        "Кондиционер",
        "Телевизор"
      ],
      "photos": 4,
      "cover": 1,
      "specs": [
        [
          "Спальные места",
          "Двуспальная кровать или&nbsp;две односпальные, небольшой диван-кровать на&nbsp;1&nbsp;гостя."
        ],
        [
          "Кухня",
          "Холодильник, микроволновая печь, варочная поверхность, чайник, посуда. Обеденный стол на&nbsp;3&nbsp;гостей."
        ],
        [
          "В номере",
          "Телевизор, кондиционер, Wi-Fi, внутренний телефон, сейф. Вид во&nbsp;двор."
        ],
        [
          "Ванная",
          "Душевая кабина, фен, банные полотенца."
        ],
        [
          "Расположение",
          "1–4&nbsp;этаж. В&nbsp;корпусе нет лифта."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": ""
    },
    "lux": {
      "name": "Люкс",
      "type": "Двухкомнатный номер",
      "guests": 4,
      "area": "36",
      "rooms": "2",
      "roomsWord": "комнаты",
      "lead": "Двухкомнатный номер с&nbsp;кухней: изолированная спальня с&nbsp;двуспальной кроватью и&nbsp;гостиная-студия с&nbsp;раскладным диваном.",
      "tags": [
        "Две комнаты",
        "Мини-кухня",
        "Двуспальная кровать",
        "Диван-кровать",
        "Можно с питомцами"
      ],
      "photos": 8,
      "cover": 4,
      "specs": [
        [
          "Спальные места",
          "В&nbsp;спальне двуспальная кровать, в&nbsp;гостиной раскладной диван."
        ],
        [
          "Кухня",
          "Холодильник, микроволновая печь, варочная поверхность, чайник, посуда и&nbsp;приборы. Обеденный стол на&nbsp;4&nbsp;человек."
        ],
        [
          "В номере",
          "Телевизор, кондиционер, Wi-Fi."
        ],
        [
          "Ванная",
          "Душевая кабина, фен, банные полотенца."
        ],
        [
          "Расположение",
          "2 и&nbsp;3&nbsp;этаж. В&nbsp;корпусе нет лифта."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": ""
    },
    "family-lux": {
      "name": "Семейный люкс",
      "type": "Двухкомнатный номер",
      "guests": 6,
      "area": "38",
      "rooms": "2",
      "roomsWord": "комнаты",
      "lead": "Двухкомнатный номер для&nbsp;семейного отдыха: отдельная спальня и&nbsp;большая комната с&nbsp;кухней, обеденной, гостиной и&nbsp;спальной зонами.",
      "tags": [
        "Две комнаты",
        "Кухня с духовкой",
        "Двуспальная кровать",
        "Две односпальные кровати",
        "Кондиционер"
      ],
      "photos": 5,
      "cover": 1,
      "specs": [
        [
          "Спальные места",
          "В&nbsp;спальне двуспальная кровать. Во&nbsp;второй комнате две односпальные кровати и&nbsp;раскладной диван."
        ],
        [
          "Кухня",
          "Холодильник, микроволновая печь, варочная поверхность, духовой шкаф, электрический чайник, посуда. Стол на&nbsp;6&nbsp;человек."
        ],
        [
          "В номере",
          "Телевизор в&nbsp;спальне, кондиционер, Wi-Fi, внутренний телефон, сейф."
        ],
        [
          "Ванная",
          "Душевая кабина, фен."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": ""
    },
    "apartment-2br": {
      "name": "Семейный апартамент с&nbsp;2 спальнями",
      "type": "Трёхкомнатный апартамент",
      "guests": 6,
      "area": "64",
      "rooms": "3",
      "roomsWord": "комнаты",
      "lead": "Просторный апартамент для&nbsp;семьи или&nbsp;дружеской компании: две отдельные спальни, гостиная с&nbsp;обеденной зоной и&nbsp;оборудованная кухня.",
      "tags": [
        "Две спальни",
        "Кухня с духовкой",
        "Две двуспальные кровати",
        "Диван-кровать",
        "Кондиционер"
      ],
      "photos": 18,
      "cover": 16,
      "specs": [
        [
          "Спальные места",
          "В&nbsp;каждой спальне двуспальная кровать, в&nbsp;гостиной двуспальный раскладной диван."
        ],
        [
          "Кухня",
          "Холодильник, духовой шкаф, варочная панель, микроволновая печь, чайник, посуда. Стол на&nbsp;6&nbsp;человек."
        ],
        [
          "В номере",
          "Телевизор, кондиционеры в&nbsp;гостиной и&nbsp;спальнях, шкафы, утюг, сейф."
        ],
        [
          "Ванная",
          "Душевая кабина, фен, банные полотенца."
        ],
        [
          "Расположение",
          "4&nbsp;этаж. В&nbsp;корпусе нет лифта."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": ""
    },
    "apartment-3br": {
      "name": "Семейный апартамент с&nbsp;3 спальнями",
      "type": "Четырёхкомнатный апартамент",
      "guests": 9,
      "area": "64",
      "rooms": "4",
      "roomsWord": "комнаты",
      "lead": "Номер для&nbsp;большой семьи или&nbsp;компании: три отдельные спальни, большая гостиная с&nbsp;обеденной зоной и&nbsp;кухней, прихожая.",
      "tags": [
        "Три спальни",
        "Кухня с духовкой",
        "Три двуспальные кровати",
        "Диван-кровать",
        "Кондиционер"
      ],
      "photos": 26,
      "cover": 1,
      "specs": [
        [
          "Спальные места",
          "В&nbsp;каждой спальне двуспальная кровать, в&nbsp;одной из&nbsp;спален ещё&nbsp;диван. В&nbsp;гостиной диван."
        ],
        [
          "Кухня",
          "Холодильник, духовой шкаф, варочная панель, микроволновая печь, чайник, посуда и&nbsp;приборы. Стол на&nbsp;6&nbsp;персон."
        ],
        [
          "В номере",
          "Телевизор, кондиционеры, шкафы, туалетный столик, зеркало в&nbsp;полный рост, утюг и&nbsp;гладильная доска, сушилка для&nbsp;белья, сейф."
        ],
        [
          "Ванная",
          "Душевая кабина, фен, банные полотенца."
        ],
        [
          "Дети",
          "Один ребёнок до&nbsp;4 лет может жить без отдельного спального места."
        ],
        [
          "Питомцы",
          "Можно с&nbsp;одним питомцем по&nbsp;согласованию с&nbsp;отелем, за&nbsp;доплату."
        ]
      ],
      "note": "В&nbsp;TravelLine у&nbsp;этого номера в&nbsp;характеристиках до&nbsp;9&nbsp;мест, а&nbsp;в&nbsp;описании до&nbsp;10&nbsp;гостей. На&nbsp;макете стоит 9, нужно сверить с&nbsp;отелем."
    }
  };

  (function roomModal() {
    var m = document.getElementById('room-modal');
    if (!m) return;
    var $ = function (id) { return document.getElementById(id); };
    var bg = $('rmBg'), photo = $('rmPhoto'), thumbs = $('rmThumbs'), count = $('rmCount');
    var cur = { slug: null, i: 0, n: 0, name: '' };
    function src(slug, k, small) { return 'img/rooms/' + slug + '/' + (k < 10 ? '0' : '') + k + (small ? '-s' : '') + '.webp'; }

    function show(i) {
      cur.i = (i + cur.n) % cur.n;
      photo.src = src(cur.slug, cur.i + 1);
      bg.src = src(cur.slug, cur.i + 1, true);
      photo.alt = cur.name + ', фото ' + (cur.i + 1) + ' из ' + cur.n;
      count.textContent = (cur.i + 1) + ' / ' + cur.n;
      var on = null;
      thumbs.querySelectorAll('button').forEach(function (b, k) {
        if (k === cur.i) { b.setAttribute('aria-current', 'true'); on = b; } else b.removeAttribute('aria-current');
      });
      if (on) thumbs.scrollTo({ left: on.offsetLeft - (thumbs.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' });
      // подгружаем соседние фото заранее
      [cur.i + 2, cur.i].forEach(function (k) { var im = new Image(); im.src = src(cur.slug, (k % cur.n) + 1); });
    }

    function open(slug, trigger) {
      var r = ROOMS[slug]; if (!r) return;
      var tmp = document.createElement('span'); tmp.innerHTML = r.name;
      cur.slug = slug; cur.name = tmp.textContent; cur.n = r.photos;
      $('rmType').textContent = r.type;
      $('rmTitle').innerHTML = r.name;
      $('rmLead').innerHTML = r.lead;
      $('rmFacts').innerHTML =
        '<li><b>до&nbsp;' + r.guests + '</b><span>гостей</span></li>' +
        '<li><b>' + r.area + '</b><span>м²</span></li>' +
        '<li><b>' + r.rooms + '</b><span>' + r.roomsWord + '</span></li>';
      $('rmTags').innerHTML = r.tags.map(function (t) { return '<li><svg><use href="#i-check"/></svg>' + esc(t) + '</li>'; }).join('');
      $('rmSpecs').innerHTML = r.specs.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>'; }).join('');
      var note = $('rmNote');
      note.hidden = !r.note; note.innerHTML = r.note || '';
      var book = $('rmBook');
      book.setAttribute('data-book', 'room:' + slug);
      book.href = bookingUrl('room:' + slug);
      var t = '';
      for (var k = 1; k <= r.photos; k++) {
        t += '<button type="button" data-rm-i="' + (k - 1) + '" aria-label="Фото ' + k + ' из ' + r.photos + '"><img src="' + src(slug, k, true) + '" alt="" loading="lazy"></button>';
      }
      thumbs.innerHTML = t;
      openModal(m, trigger);
      m.querySelector('.rm__info').scrollTop = 0; m.querySelector('.rm').scrollTop = 0;
      show(r.cover - 1);
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
      if (m.hidden || e.target.closest('.rm__info')) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(cur.i + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    // свайп по фото на телефоне
    var x0 = null, stage = photo.parentNode;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
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
