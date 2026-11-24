/* Переключатель макетов и цветовых тем — общий для всех вариантов (A–D).
   Подключается в <head> без defer: тема ставится до первой отрисовки, без мигания.
   Тема: ?theme=brand|native → localStorage «ny27-theme» → «native».
   Фирменные цвета каждого макета описаны в его css/styles.css под [data-theme="brand"]. */
(function () {
  'use strict';
  var KEY = 'ny27-theme';
  var root = document.documentElement;
  var script = document.currentScript;
  var base = script ? script.src.replace(/shared\/switcher\.js(\?.*)?$/, '') : '';

  var LAYOUTS = [
    { id: 'a', path: '',    name: 'Классика',       note: 'хвоя и золото',  native: ['#0f2a24', '#cfa957', '#f5f2eb'], brandMeta: '#3A1250' },
    { id: 'b', path: 'v2/', name: 'Постер',         note: 'синий и красный', native: ['#1E3FD0', '#EE4420', '#F3EEE6'], brandMeta: '#F7F5F8' },
    { id: 'c', path: 'v3/', name: 'Красная дверь',  note: 'дверь и латунь',  native: ['#8E0A20', '#162F3F', '#A28350'], brandMeta: '#3A1250' },
    { id: 'd', path: 'v4/', name: 'Santa-стиль',    note: 'красный на белом', native: ['#C8272B', '#FFFFFF', '#141010'], brandMeta: '#D11E46' }
  ];
  var BRAND = ['#D11E46', '#3A1250', '#0164E5', '#00BA88'];

  var params = new URLSearchParams(location.search);
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function valid(v) { return v === 'brand' || v === 'native' ? v : null; }

  var theme = valid(params.get('theme')) || valid(stored()) || 'native';
  if (valid(params.get('theme'))) store(theme);
  root.dataset.theme = theme;

  // какой макет открыт: сравниваем путь страницы с путями вариантов
  var rel = location.href.split(/[?#]/)[0].replace(/index\.html$/, '');
  var current = LAYOUTS[0];
  LAYOUTS.forEach(function (l) { if (l.path && rel.indexOf(base + l.path) === 0) current = l; });

  var metaNative = null;
  function setMeta() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) return;
    if (metaNative === null) metaNative = m.getAttribute('content');
    m.setAttribute('content', theme === 'brand' ? current.brandMeta : metaNative);
  }

  function href(l) {
    var p = new URLSearchParams(location.search);
    p.set('theme', theme);
    return base + l.path + '?' + p.toString().replace(/=(&|$)/g, '$1');
  }

  var CSS = '' +
    '.ny27sw{position:fixed;right:16px;bottom:16px;z-index:95;font:500 14px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}' +
    '.ny27sw *{box-sizing:border-box;margin:0;font:inherit;color:inherit;letter-spacing:normal;text-transform:none}' +
    '.ny27sw__btn{display:flex;align-items:center;gap:10px;height:48px;padding:0 18px 0 8px;border:0;border-radius:999px;background:#1d1a21;box-shadow:0 0 0 1px rgba(255,255,255,.14) inset,0 14px 30px -12px rgba(0,0,0,.55);cursor:pointer;font-weight:600}' +
    '.ny27sw__btn:hover{background:#2a2630}' +
    '.ny27sw__btn:focus-visible,.ny27sw a:focus-visible,.ny27sw button:focus-visible{outline:2px solid #94D4FA;outline-offset:2px}' +
    '.ny27sw__dots{display:grid;grid-template-columns:repeat(2,14px);gap:2px;padding:3px;border-radius:50%;background:#fff;width:34px;height:34px;place-content:center}' +
    '.ny27sw__dots i{width:12px;height:12px;border-radius:50%}' +
    '.ny27sw__btn b{font-weight:700}' +
    '.ny27sw__btn span{opacity:.72;font-weight:500}' +
    '.ny27sw__panel{position:absolute;right:0;bottom:58px;width:320px;max-height:calc(100dvh - 100px);overflow:auto;padding:16px;border-radius:20px;background:#1d1a21;box-shadow:0 0 0 1px rgba(255,255,255,.12) inset,0 24px 60px -20px rgba(0,0,0,.7)}' +
    '.ny27sw__panel[hidden]{display:none}' +
    '.ny27sw__h{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#c9c3d1;margin:0 0 8px 4px}' +
    '.ny27sw__h:not(:first-child){margin-top:16px}' +
    '.ny27sw__list{display:grid;gap:4px;list-style:none;padding:0}' +
    '.ny27sw__opt{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;border:0;border-radius:12px;background:transparent;text-align:left;text-decoration:none;cursor:pointer}' +
    '.ny27sw__opt:hover{background:rgba(255,255,255,.08)}' +
    '.ny27sw__opt[aria-current="page"],.ny27sw__opt[aria-pressed="true"]{background:rgba(255,255,255,.14);box-shadow:0 0 0 1px rgba(255,255,255,.28) inset}' +
    '.ny27sw__k{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.12);font-weight:800}' +
    '.ny27sw__opt[aria-current="page"] .ny27sw__k{background:#fff;color:#1d1a21}' +
    '.ny27sw__t{flex:1;min-width:0;display:grid}' +
    '.ny27sw__t b{font-weight:700}' +
    '.ny27sw__t small{font-size:12.5px;color:#c9c3d1}' +
    '.ny27sw__sw{flex:none;display:flex}' +
    '.ny27sw__sw i{width:16px;height:16px;border-radius:50%;box-shadow:0 0 0 2px #1d1a21;margin-left:-4px}' +
    '.ny27sw__check{flex:none;width:18px;height:18px;opacity:0}' +
    '.ny27sw__opt[aria-current="page"] .ny27sw__check,.ny27sw__opt[aria-pressed="true"] .ny27sw__check{opacity:1}' +
    'body:has(.hdr.is-open) .ny27sw,body.menu-open .ny27sw{display:none}' +
    '@media (max-width:1024px){.ny27sw{right:10px;bottom:calc(100px + env(safe-area-inset-bottom))}.ny27sw__btn{padding:0 7px;width:48px;justify-content:center}.ny27sw__btn b,.ny27sw__lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.ny27sw__panel{width:min(320px,calc(100vw - 20px))}}' +
    '@media print{.ny27sw{display:none}}';

  var CHECK = '<svg class="ny27sw__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function dots(c) { return '<span class="ny27sw__sw" aria-hidden="true">' + c.map(function (x) { return '<i style="background:' + x + '"></i>'; }).join('') + '</span>'; }

  function build() {
    if (document.querySelector('.ny27sw')) return;
    var st = document.createElement('style');
    st.id = 'ny27sw-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    var w = document.createElement('div');
    w.className = 'ny27sw';
    w.innerHTML =
      '<div class="ny27sw__panel" id="ny27swPanel" role="dialog" aria-label="Макет и цвета" hidden>' +
        '<p class="ny27sw__h">Макет</p><ul class="ny27sw__list">' +
        LAYOUTS.map(function (l) {
          return '<li><a class="ny27sw__opt" data-layout="' + l.id + '" href="' + href(l) + '"' + (l === current ? ' aria-current="page"' : '') + '>' +
            '<span class="ny27sw__k">' + l.id.toUpperCase() + '</span><span class="ny27sw__t"><b>' + l.name + '</b><small>' + l.note + '</small></span>' + CHECK + '</a></li>';
        }).join('') + '</ul>' +
        '<p class="ny27sw__h">Цвета</p><ul class="ny27sw__list">' +
          '<li><button class="ny27sw__opt" type="button" data-theme-set="native" aria-pressed="false">' + dots(current.native) + '<span class="ny27sw__t"><b>Родные</b><small>палитра макета</small></span>' + CHECK + '</button></li>' +
          '<li><button class="ny27sw__opt" type="button" data-theme-set="brand" aria-pressed="false">' + dots(BRAND) + '<span class="ny27sw__t"><b>Фирменные</b><small>цвета логотипа</small></span>' + CHECK + '</button></li>' +
        '</ul></div>' +
      '<button class="ny27sw__btn" type="button" aria-expanded="false" aria-controls="ny27swPanel" aria-label="Макет и цвета">' +
        '<span class="ny27sw__dots" aria-hidden="true"></span><b>Макет ' + current.id.toUpperCase() + '</b><span class="ny27sw__lbl"></span></button>';
    document.body.appendChild(w);

    var btn = w.querySelector('.ny27sw__btn');
    var panel = w.querySelector('.ny27sw__panel');
    var dotBox = w.querySelector('.ny27sw__dots');
    var lbl = w.querySelector('.ny27sw__lbl');

    function sync() {
      var c = theme === 'brand' ? BRAND : current.native.concat(['#ffffff']).slice(0, 4);
      dotBox.innerHTML = c.map(function (x) { return '<i style="background:' + x + ';box-shadow:0 0 0 1px rgba(0,0,0,.18) inset"></i>'; }).join('');
      lbl.textContent = '· ' + (theme === 'brand' ? 'фирменные' : 'родные');
      Array.prototype.forEach.call(w.querySelectorAll('[data-theme-set]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.themeSet === theme)); });
      Array.prototype.forEach.call(w.querySelectorAll('[data-layout]'), function (a) {
        LAYOUTS.forEach(function (l) { if (l.id === a.dataset.layout) a.href = href(l); });
      });
      setMeta();
    }

    function open(on) {
      panel.hidden = !on;
      btn.setAttribute('aria-expanded', String(on));
      if (on) (panel.querySelector('[aria-current="page"]') || panel.querySelector('a,button')).focus();
    }

    btn.addEventListener('click', function () { open(panel.hidden); });
    w.addEventListener('click', function (e) {
      var t = e.target.closest('[data-theme-set]');
      if (!t) return;
      theme = t.dataset.themeSet;
      root.dataset.theme = theme;
      store(theme);
      var p = new URLSearchParams(location.search);
      p.set('theme', theme);
      history.replaceState(null, '', location.pathname + '?' + p.toString().replace(/=(&|$)/g, '$1') + location.hash);
      sync();
    });
    document.addEventListener('click', function (e) { if (!panel.hidden && !w.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); open(false); btn.focus(); }
    }, true);
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
