// Rasikh client enhancements: theme, explanation language, status seal, sharḥ drawer,
// recitation tiles, search and filters, checklist rosette, backup.
// Reference content is fully readable without this script.
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var lang = body.dataset.lang || 'en';
  var T = JSON.parse((doc.getElementById('i18n') || {}).textContent || '{}');
  var catEl = doc.getElementById('catalog');
  var CATALOG = catEl ? JSON.parse(catEl.textContent) : null;

  var PREFIX = 'rasikh:v1:';
  var PREFS_KEY = PREFIX + 'prefs';
  var UNIT_PREFIX = PREFIX + 'u:';
  var STATUSES = ['not_started', 'learning', 'memorized'];
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 1080px)') : { matches: false };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(s) {
    var args = Array.prototype.slice.call(arguments, 1);
    return String(s).replace(/\{(\d)\}/g, function (_, i) { return args[i]; });
  }
  function digits(n) { return lang === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : String(n); }
  function el(tag, attrs, children) {
    var e = doc.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (attrs[k] === true) e.setAttribute(k, '');
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return e;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, children) {
    var e = doc.createElementNS(SVGNS, tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function star(cls) {
    return svg('svg', { class: cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3', 'aria-hidden': 'true' }, [
      svg('rect', { x: 6, y: 6, width: 12, height: 12 }),
      svg('rect', { x: 6, y: 6, width: 12, height: 12, transform: 'rotate(45 12 12)' }),
      svg('circle', { cx: 12, cy: 12, r: 2.2 }),
    ]);
  }
  // The text a learner reads in the current interface language from a bilingual element.
  function visibleText(node) {
    if (!node) return '';
    var x = node.querySelector('.x-' + lang);
    return (x || node).textContent.replace(/\s+/g, ' ').trim();
  }

  // ---------- storage ----------

  var store = (function () {
    var ok = false;
    try {
      var k = PREFIX + 'probe';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      ok = true;
    } catch (e) { ok = false; }
    return {
      ok: ok,
      get: function (key) {
        if (!ok) return null;
        try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
      },
      set: function (key, val) {
        if (!ok) return false;
        try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
      },
      keys: function () {
        var out = [];
        if (!ok) return out;
        try { for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {}
        return out;
      },
      remove: function (key) { try { localStorage.removeItem(key); return true; } catch (e) { return false; } },
    };
  })();

  function prefs() { var p = store.get(PREFS_KEY); return p && typeof p === 'object' ? p : {}; }
  function setPref(k, v) { var p = prefs(); p[k] = v; return store.set(PREFS_KEY, p); }
  function validRecord(r) { return r && typeof r === 'object' && STATUSES.indexOf(r.status) >= 0; }
  function getUnit(id) { var r = store.get(UNIT_PREFIX + id); return validRecord(r) ? r : null; }
  function putUnit(id, patch) {
    var r = getUnit(id) || { status: 'not_started', status_target_version: null, status_updated_at: null, last_reviewed_at: null, last_reviewed_target_version: null };
    for (var k in patch) r[k] = patch[k];
    return store.set(UNIT_PREFIX + id, r) ? r : null;
  }
  function effective(rec, tv) {
    var status = rec ? rec.status : 'not_started';
    return { status: status, outdated: !!(rec && status !== 'not_started' && rec.status_target_version && rec.status_target_version < tv) };
  }

  var dateFmt;
  try { dateFmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : (navigator.language || 'en'), { dateStyle: 'medium' }); } catch (e) { dateFmt = null; }
  function showDate(iso) {
    if (!iso) return T.neverRecorded;
    var d = new Date(iso);
    if (isNaN(d)) return T.neverRecorded;
    return dateFmt ? dateFmt.format(d) : d.toDateString();
  }
  var statusLabel = { not_started: T.statusNot, learning: T.statusLearning, memorized: T.statusMemorized };
  var sealText = { not_started: T.sealNot, learning: T.sealLearning, memorized: T.sealMemorized };

  // ---------- theme ----------

  function initTheme() {
    var btn = doc.querySelector('.theme-toggle');
    if (!btn) return;
    btn.hidden = false;
    function label() { btn.setAttribute('aria-label', root.dataset.theme === 'dark' ? btn.dataset.labelLight : btn.dataset.labelDark); }
    label();
    btn.addEventListener('click', function () {
      if (root.dataset.theme === 'dark') { delete root.dataset.theme; setPref('theme', 'light'); }
      else { root.dataset.theme = 'dark'; setPref('theme', 'dark'); }
      label();
    });
  }

  // ---------- explanation language ----------

  function initExplain() {
    var radios = doc.querySelectorAll('input[name="explain"]');
    doc.querySelectorAll('.explain-toggle').forEach(function (f) { f.hidden = false; });
    radios.forEach(function (r) {
      r.checked = r.value === root.dataset.explain;
      r.addEventListener('change', function () {
        if (!r.checked) return;
        root.dataset.explain = r.value;
        setPref('explain', r.value);
        radios.forEach(function (o) { o.checked = o.value === r.value; });
      });
    });
  }

  // Locale switch keeps the unit anchor and remembers the explicit choice.
  function initLangSwitch() {
    doc.querySelectorAll('a[data-keep-hash]').forEach(function (a) {
      a.addEventListener('click', function () {
        setPref('locale', a.getAttribute('hreflang'));
        if (location.hash && a.href.indexOf('#') < 0) a.href = a.href + location.hash;
        if (location.search && body.dataset.page === 'reference') a.href = a.href.replace(/(#|$)/, location.search + '$1');
      });
    });
  }

  // "/" jumps to search from anywhere outside a text field.
  function initSlash() {
    doc.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      var q = doc.getElementById('q') || doc.getElementById('hq');
      if (q && q.offsetParent !== null) { e.preventDefault(); q.focus(); }
    });
  }

  // ---------- status: the seal ----------

  function tvOf(id) {
    var s = doc.getElementById('unit-' + id);
    return s ? parseInt(s.dataset.tv, 10) || 1 : 1;
  }

  function closeMenus(except) {
    doc.querySelectorAll('.status-menu').forEach(function (m) {
      if (m === except) return;
      m.remove();
    });
    doc.querySelectorAll('.seal[aria-expanded="true"]').forEach(function (b) { if (!except || !b.parentNode.contains(except)) b.setAttribute('aria-expanded', 'false'); });
  }

  function setStatus(id, s, stamp) {
    var saved = putUnit(id, { status: s, status_target_version: tvOf(id), status_updated_at: new Date().toISOString() });
    renderAllStatus(id, saved ? 'ok' : 'err', stamp && s === 'memorized');
    return saved;
  }
  function markReviewed(id) {
    var saved = putUnit(id, { last_reviewed_at: new Date().toISOString(), last_reviewed_target_version: tvOf(id) });
    renderAllStatus(id, saved ? 'ok' : 'err');
  }

  function openMenu(box, id, seal) {
    closeMenus();
    var rec = getUnit(id);
    var eff = effective(rec, tvOf(id));
    var menu = el('div', { class: 'status-menu', role: 'menu', 'aria-label': T.status + ' · ' + id });
    STATUSES.forEach(function (s) {
      var b = el('button', { type: 'button', role: 'menuitemradio', 'aria-checked': String(eff.status === s) }, [el('span', { class: 'ring ' + s, 'aria-hidden': 'true' }), statusLabel[s]]);
      b.addEventListener('click', function () { closeMenus(); setStatus(id, s, true); focusSeal(id, box.dataset.variant); });
      menu.appendChild(b);
    });
    if (box.dataset.variant === 'mini') {
      menu.appendChild(el('p', { class: 'status-meta', text: T.lastReviewed + ': ' + showDate(rec && rec.last_reviewed_at) }));
      var rv = el('button', { type: 'button', role: 'menuitem' }, [T.reviewedToday]);
      rv.addEventListener('click', function () { closeMenus(); markReviewed(id); focusSeal(id, 'mini'); });
      menu.appendChild(rv);
    }
    box.querySelector('.status').appendChild(menu);
    seal.setAttribute('aria-expanded', 'true');
    var first = menu.querySelector('[aria-checked="true"]') || menu.querySelector('button');
    if (first) first.focus();
    menu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('button'));
      var i = items.indexOf(doc.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closeMenus(); seal.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
  }
  function focusSeal(id, variant) {
    var b = doc.querySelector('[data-status-for="' + id + '"][data-variant="' + variant + '"] .seal');
    if (b) b.focus();
  }

  function renderStatus(box, msg, stamp) {
    var id = box.dataset.statusFor;
    var variant = box.dataset.variant;
    var tv = tvOf(id);
    box.textContent = '';
    if (!store.ok) {
      if (variant === 'seal') box.appendChild(el('p', { class: 'muted small', text: T.statusUnavailable }));
      return;
    }
    var rec = getUnit(id);
    var eff = effective(rec, tv);
    var label = statusLabel[eff.status] + (eff.outdated ? ' (' + T.earlierVersion + ')' : '');
    var seal = el('button', { type: 'button', class: 'seal ' + eff.status + (stamp ? ' stamped' : ''), 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': T.status + ': ' + label + '. ' + T.changeStatus }, [
      el('span', { class: 'sar', lang: 'ar', 'aria-hidden': 'true', text: sealText[eff.status] }),
      el('span', { class: 'sen', 'aria-hidden': 'true', text: statusLabel[eff.status] }),
    ]);
    seal.addEventListener('click', function (e) {
      e.stopPropagation();
      if (seal.getAttribute('aria-expanded') === 'true') closeMenus();
      else openMenu(box, id, seal);
    });
    var wrap = el('div', { class: 'status', 'data-variant': variant }, [seal]);
    box.appendChild(wrap);
    if (variant === 'seal') {
      var last = showDate(rec && rec.last_reviewed_at);
      if (rec && rec.last_reviewed_at && rec.last_reviewed_target_version && rec.last_reviewed_target_version < tv) last += ' (' + T.earlierVersion + ')';
      var rv = el('button', { type: 'button', class: 'textbtn', text: T.reviewedToday });
      rv.addEventListener('click', function () { markReviewed(id); });
      box.appendChild(el('div', { class: 'status-meta' }, [
        el('p', { text: label + ' · ' + T.selfReported }),
        el('p', { text: T.lastReviewed + ': ' + last }),
        rv,
        el('p', { class: 'status-msg' + (msg ? ' ' + msg : ''), role: 'status', 'aria-live': 'polite', text: msg === 'ok' ? T.saved : (msg === 'err' ? T.notSaved : '') }),
      ]));
      if (eff.outdated) {
        var confirm = el('button', { type: 'button', class: 'pill', text: T.confirmStatus });
        confirm.addEventListener('click', function () { setStatus(id, eff.status); });
        box.appendChild(el('div', { class: 'status-update', role: 'note' }, [el('p', { text: T.contentUpdated }), confirm]));
      }
    }
  }
  function renderAllStatus(id, msg, stamp) {
    doc.querySelectorAll('[data-status-for="' + id + '"]').forEach(function (b) { renderStatus(b, msg, stamp); });
  }
  function initStatus() {
    doc.querySelectorAll('[data-status-for]').forEach(function (b) { renderStatus(b); });
    doc.addEventListener('click', function (e) { if (!e.target.closest('.status-menu')) closeMenus(); });
  }

  // ---------- sharḥ: margin commentary (a bottom sheet on narrow screens) ----------

  var scrim = null;
  var sheetReturn = null;
  function openSharh(unitEl, note) {
    var aside = unitEl.querySelector('.u-sharh');
    if (!aside) return;
    sheetReturn = doc.activeElement;
    aside.classList.add('open');
    aside.setAttribute('role', 'dialog');
    aside.setAttribute('aria-modal', 'true');
    if (!scrim) {
      scrim = el('div', { class: 'scrim' });
      scrim.addEventListener('click', closeSharh);
      body.appendChild(scrim);
    }
    var target = note || aside.querySelector('.note');
    setTimeout(function () { if (note) note.scrollIntoView({ block: 'nearest' }); (target || aside).focus(); }, reduceMotion ? 0 : 60);
  }
  function closeSharh() {
    doc.querySelectorAll('.u-sharh.open').forEach(function (a) { a.classList.remove('open'); a.removeAttribute('role'); a.removeAttribute('aria-modal'); });
    if (scrim) { scrim.remove(); scrim = null; }
    if (sheetReturn && sheetReturn.focus) sheetReturn.focus();
    sheetReturn = null;
  }
  function highlight(note) {
    doc.querySelectorAll('.note.on, .mk.on').forEach(function (n) { n.classList.remove('on'); });
    if (!note) return;
    note.classList.add('on');
    doc.querySelectorAll('a.mk[data-note="' + note.id + '"]').forEach(function (m) { m.classList.add('on'); });
  }
  function initSharh() {
    doc.querySelectorAll('a.mk[data-note]').forEach(function (m) {
      m.addEventListener('click', function (e) {
        var note = doc.getElementById(m.dataset.note);
        if (!note) return;
        e.preventDefault();
        highlight(note);
        if (narrow.matches) openSharh(m.closest('.unit'), note);
        else { note.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); note.focus({ preventScroll: true }); }
      });
    });
    doc.querySelectorAll('.sharh-open').forEach(function (b) { b.addEventListener('click', function () { highlight(null); openSharh(b.closest('.unit')); }); });
    doc.querySelectorAll('.sharh-close').forEach(function (b) { b.addEventListener('click', closeSharh); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.querySelector('.u-sharh.open')) closeSharh(); });
    if (narrow.addEventListener) narrow.addEventListener('change', function () { if (!narrow.matches) closeSharh(); });
  }

  // ---------- recite: turn the tile ----------

  var R = null; // { unit, id, tiles: [...], pending }
  var judgeBar = doc.querySelector('.judge-bar');

  function tileContext(cell) {
    if (cell.tagName === 'DD') return visibleText(cell.previousElementSibling ? cell.previousElementSibling : cell.parentNode.querySelector('dt'));
    var row = cell.closest('tr');
    var table = cell.closest('table');
    var idx = Array.prototype.indexOf.call(row.children, cell);
    var head = table.querySelectorAll('thead th')[idx];
    var parts = [];
    Array.prototype.forEach.call(row.children, function (c) { if (!c.hasAttribute('data-recall')) { var t = visibleText(c); if (t && t !== '—') parts.push(t); } });
    var col = visibleText(head);
    return parts.length ? parts.join(' · ') + (col && parts.indexOf(col) < 0 ? ' — ' + col : '') : col;
  }

  function makeTile(cell) {
    var back = el('span', { class: 'tile-back', 'aria-hidden': 'true' });
    if (cell.tagName === 'DD') Array.prototype.forEach.call(cell.children, function (c) { if (!c.classList.contains('tile')) back.appendChild(c.cloneNode(true)); });
    else { var cv = cell.querySelector('.cv'); if (cv) back.appendChild(cv.cloneNode(true)); }
    var front = el('span', { class: 'tile-front', 'aria-hidden': 'true' }, [
      svg('svg', { class: 'pat' }, [svg('rect', { width: '100%', height: '100%', fill: 'url(#zellige)' })]),
      star('boss'),
    ]);
    var btn = el('button', { type: 'button', class: 'tile' }, [el('span', { class: 'tile-in' }, [front, back])]);
    var t = { el: btn, cell: cell, back: back, context: tileContext(cell), answer: (cell.tagName === 'DD' ? visibleText(cell) : (cell.querySelector('.cv') || cell).textContent.trim()), turned: false, judged: null, out: false };
    btn.addEventListener('click', function () { onTile(t); });
    cell.appendChild(btn);
    labelTile(t);
    return t;
  }
  function labelTile(t) {
    var label = t.turned ? fmt(T.tileShown, t.context, t.answer) : fmt(T.tileHidden, t.context);
    if (t.judged) label += ' · ' + (t.judged === 'k' ? T.tileKnew : T.tileMissed);
    t.el.setAttribute('aria-label', label);
    t.el.classList.toggle('turned', t.turned);
    t.el.classList.toggle('k', t.judged === 'k');
    t.el.classList.toggle('n', t.judged === 'n');
    t.el.classList.toggle('out', t.out);
    t.el.setAttribute('aria-disabled', t.out ? 'true' : 'false');
    var stamp = t.back.querySelector('.tile-stamp');
    if (t.judged && !stamp) t.back.appendChild(el('span', { class: 'tile-stamp', 'aria-hidden': 'true', text: t.judged === 'k' ? '✓' : '↺' }));
    if (!t.judged && stamp) stamp.remove();
  }
  function inRound() { return R.tiles.filter(function (t) { return !t.out; }); }

  function onTile(t) {
    if (!R || t.out) return;
    if (!t.turned) { t.turned = true; labelTile(t); }
    if (!t.judged) { R.pending = t; showJudge(t); }
    renderBar();
  }
  function showJudge(t) {
    judgeBar.querySelector('.jq').textContent = t.context + ' — ' + T.didYouKnow;
    judgeBar.hidden = false;
    setTimeout(function () { judgeBar.querySelector('.jb.k').focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
  }
  function judge(v) {
    if (!R || !R.pending) return;
    var t = R.pending;
    t.judged = v;
    R.pending = null;
    judgeBar.hidden = true;
    labelTile(t);
    renderBar();
    var round = inRound();
    var next = round.filter(function (x) { return !x.turned; })[0] || round.filter(function (x) { return !x.judged; })[0];
    if (round.every(function (x) { return x.judged; })) roundDone();
    else if (next) next.el.focus();
  }

  function renderBar() {
    var bar = R.unit.querySelector('.recite-bar');
    var round = inRound();
    var turned = round.filter(function (t) { return t.turned; }).length;
    var knew = round.filter(function (t) { return t.judged === 'k'; }).length;
    bar.textContent = '';
    var tally = el('span', { class: 'tally', 'aria-hidden': 'true' });
    round.forEach(function (t) { tally.appendChild(el('i', { class: t.judged || (t.turned ? 't' : '') })); });
    var all = el('button', { type: 'button', class: 'pill', text: T.turnAll });
    all.addEventListener('click', function () { inRound().forEach(function (x) { x.turned = true; labelTile(x); }); renderBar(); });
    var again = el('button', { type: 'button', class: 'pill', text: T.startAgain });
    again.addEventListener('click', function () { resetRound(R.tiles); });
    bar.appendChild(el('span', { text: T.reciteHint }));
    bar.appendChild(tally);
    bar.appendChild(el('span', { role: 'status', 'aria-live': 'polite', text: fmt(T.reciteProgress, digits(turned), digits(round.length), digits(knew)) }));
    bar.appendChild(el('span', { class: 'rb-btns' }, [all, again]));
  }

  function resetRound(tiles) {
    R.tiles.forEach(function (t) {
      var inIt = tiles.indexOf(t) >= 0;
      t.out = !inIt;
      if (inIt) { t.turned = false; t.judged = null; }
      labelTile(t);
    });
    R.pending = null;
    judgeBar.hidden = true;
    R.unit.querySelector('.round-done').hidden = true;
    renderBar();
    var first = inRound()[0];
    if (first) first.el.focus();
  }

  function roundDone() {
    var panel = R.unit.querySelector('.round-done');
    var round = inRound();
    var knew = round.filter(function (t) { return t.judged === 'k'; }).length;
    var missed = round.filter(function (t) { return t.judged === 'n'; });
    panel.textContent = '';
    panel.appendChild(svg('svg', { width: 88, height: 88, viewBox: '0 0 100 100', 'aria-hidden': 'true' }, [
      svg('circle', { class: 'draw', cx: 50, cy: 50, r: 44, pathLength: 100 }),
      svg('rect', { class: 'draw d2', x: 25, y: 25, width: 50, height: 50, pathLength: 100 }),
      svg('rect', { class: 'draw d3', x: 25, y: 25, width: 50, height: 50, pathLength: 100, transform: 'rotate(45 50 50)' }),
      svg('circle', { class: 'draw d4', cx: 50, cy: 50, r: 9, pathLength: 100 }),
    ]));
    var btns = el('div', { class: 'rd-btns' });
    var again = el('button', { type: 'button', class: 'pill primary', text: T.again });
    again.addEventListener('click', function () { resetRound(R.tiles); });
    btns.appendChild(again);
    if (missed.length) {
      var only = el('button', { type: 'button', class: 'pill', text: fmt(T.onlyMissed, digits(missed.length)) });
      only.addEventListener('click', function () { resetRound(missed); });
      btns.appendChild(only);
    } else {
      var ready = el('button', { type: 'button', class: 'pill', text: T.feelReady });
      ready.addEventListener('click', function () { setStatus(R.id, 'memorized', true); ready.disabled = true; });
      btns.appendChild(ready);
    }
    var h = el('h4', { tabindex: '-1', text: T.roundDone });
    panel.appendChild(el('div', {}, [h, el('p', { text: fmt(T.roundSummary, digits(knew), digits(missed.length)) }), btns, el('p', { class: 'rd-note', text: T.roundNote })]));
    panel.hidden = false;
    h.focus();
  }

  function enterRecite(unit) {
    if (R) exitRecite();
    var id = unit.dataset.unit;
    var cells = unit.querySelectorAll('.blocks [data-recall]');
    R = { unit: unit, id: id, tiles: [], pending: null };
    unit.classList.add('reciting');
    var btn = unit.querySelector('.btn-recite');
    btn.setAttribute('aria-pressed', 'true');
    btn.querySelector('.rl').textContent = T.reciteExit;
    unit.querySelector('.veiled-note').hidden = false;
    unit.querySelector('.recite-bar').hidden = false;
    unit.querySelector('.u-sharh').setAttribute('aria-hidden', 'true');
    unit.querySelector('.examples').setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(cells, function (c) { R.tiles.push(makeTile(c)); });
    closeSharh();
    renderBar();
    fitTables();
    var first = R.tiles[0];
    if (first) first.el.focus();
  }
  function exitRecite() {
    if (!R) return;
    var unit = R.unit;
    R.tiles.forEach(function (t) { t.el.remove(); });
    unit.classList.remove('reciting');
    var btn = unit.querySelector('.btn-recite');
    btn.setAttribute('aria-pressed', 'false');
    btn.querySelector('.rl').textContent = T.recite;
    unit.querySelector('.veiled-note').hidden = true;
    unit.querySelector('.recite-bar').hidden = true;
    unit.querySelector('.round-done').hidden = true;
    unit.querySelector('.u-sharh').removeAttribute('aria-hidden');
    unit.querySelector('.examples').removeAttribute('aria-hidden');
    judgeBar.hidden = true;
    R = null;
    fitTables();
    btn.focus();
  }
  function initRecite() {
    doc.querySelectorAll('.btn-recite').forEach(function (btn) {
      var unit = btn.closest('.unit');
      if (!unit.querySelector('.blocks [data-recall]')) return;
      btn.hidden = false;
      btn.addEventListener('click', function () { if (R && R.unit === unit) exitRecite(); else enterRecite(unit); });
    });
    if (judgeBar) {
      judgeBar.querySelectorAll('[data-judge]').forEach(function (b) { b.addEventListener('click', function () { judge(b.dataset.judge); }); });
      judgeBar.addEventListener('keydown', function (e) { if (e.key === 'Escape') { judgeBar.hidden = true; if (R && R.pending) R.pending.el.focus(); } });
    }
  }

  // ---------- tables: stack a table into labelled cards only when it does not fit ----------

  function fitTables() {
    doc.querySelectorAll('.table-scroll').forEach(function (box) {
      box.classList.remove('stack');
      if (box.scrollWidth > box.clientWidth + 1) box.classList.add('stack');
    });
  }
  function initTables() {
    if (!doc.querySelector('.table-scroll')) return;
    var timer = null;
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(fitTables, 120); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitTables);
    fitTables();
  }

  // ---------- search ----------

  var HARAKAT = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g; // vowel marks, Quranic marks and tatweel
  function norm(s) {
    return String(s || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
      .toLowerCase()
      .replace(HARAKAT, '')
      .replace(/[ʿʾ'’‘`]/g, '')
      .replace(/[-_.,،؛:;()«»"/?؟!]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Secondary form: also fold hamza-carrying alif variants and alif wasla.
  function norm2(s) { return norm(s).replace(/[أإآٱ]/g, 'ا'); }
  function prepare(list) {
    list.forEach(function (u) {
      var names = [u.ar, u.en, u.tr].concat(u.aliases || []);
      u._n = names.map(norm);
      u._n2 = names.map(norm2);
      u._hay = norm2(names.join(' ') + ' ' + u.text + ' ' + u.summary);
    });
  }
  function score(u, q, q2) {
    if (!q) return 1;
    var best = 0;
    for (var i = 0; i < u._n.length; i++) {
      var a = u._n[i], b = u._n2[i];
      if (a === q) return 100;
      if (b === q2) best = Math.max(best, 95);
      else if (b.indexOf(q2) === 0) best = Math.max(best, 70);
      else if (b.indexOf(q2) > 0) best = Math.max(best, 50);
    }
    if (best) return best;
    var toks = q2.split(' '), hits = 0;
    for (var j = 0; j < toks.length; j++) if (u._hay.indexOf(toks[j]) >= 0) hits++;
    return hits === toks.length ? 20 + hits : 0;
  }
  function initReference() {
    var form = doc.getElementById('ref-form');
    var list = doc.getElementById('unit-list');
    if (!form || !list || !CATALOG) return;
    var items = {};
    list.querySelectorAll('li[data-id]').forEach(function (li) { items[li.dataset.id] = li; });
    var all = CATALOG.units;
    try { prepare(all); } catch (e) { doc.getElementById('search-error').hidden = false; return; }
    var params = new URLSearchParams(location.search);
    ['q', 'category', 'stage', 'type'].forEach(function (k) { if (params.get(k) && form.elements[k]) form.elements[k].value = params.get(k); });
    function apply(push) {
      var raw = form.elements.q.value;
      var q = norm(raw), q2 = norm2(raw);
      var f = { category: form.elements.category.value, stage: form.elements.stage.value, type: form.elements.type.value };
      var shown = all
        .map(function (u) { return { u: u, s: score(u, q, q2) }; })
        .filter(function (x) { return x.s > 0 && (!f.category || x.u.category === f.category) && (!f.stage || x.u.stage === f.stage) && (!f.type || x.u.type === f.type); })
        .sort(function (a, b) { return b.s - a.s || a.u.order - b.u.order; });
      Object.keys(items).forEach(function (id) { items[id].hidden = true; });
      shown.forEach(function (x) { var li = items[x.u.id]; li.hidden = false; list.appendChild(li); });
      doc.getElementById('result-count').textContent = shown.length === 1 ? T.resultsOne : fmt(T.resultsCount, digits(shown.length));
      doc.getElementById('no-results').hidden = shown.length > 0;
      if (push) {
        var p = new URLSearchParams();
        if (raw.trim()) p.set('q', raw.trim());
        Object.keys(f).forEach(function (k) { if (f[k]) p.set(k, f[k]); });
        var qs = p.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); apply(true); });
    form.elements.q.addEventListener('input', function () { apply(true); });
    ['category', 'stage', 'type'].forEach(function (k) { form.elements[k].addEventListener('change', function () { apply(true); }); });
    form.addEventListener('reset', function () { setTimeout(function () { apply(true); form.elements.q.focus(); }, 0); });
    apply(false);
  }

  // ---------- checklist: rosette and tiles ----------

  function rosette(rows) {
    var n = rows.length, cx = 160, cy = 160, r1 = 66, r2 = 154, gap = 0.012;
    var pt = function (r, a) { return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); };
    var mem = rows.filter(function (r) { return r.eff.status === 'memorized'; }).length;
    var learning = rows.filter(function (r) { return r.eff.status === 'learning'; }).length;
    var s = svg('svg', { viewBox: '0 0 320 320', role: 'img', 'aria-label': fmt(T.summary, digits(n - mem - learning), digits(learning), digits(mem)) });
    var dir = lang === 'ar' ? -1 : 1;
    rows.forEach(function (row, i) {
      var a0 = -Math.PI / 2 + dir * (i / n) * 2 * Math.PI, a1 = -Math.PI / 2 + dir * ((i + 1) / n) * 2 * Math.PI;
      if (dir < 0) { var tmp = a0; a0 = a1; a1 = tmp; }
      a0 += gap; a1 -= gap;
      var st = row.eff.status;
      var rr = st === 'learning' ? r1 + (r2 - r1) * 0.6 : r2;
      var d = 'M ' + pt(r1, a0) + ' L ' + pt(rr, a0) + ' A ' + rr + ' ' + rr + ' 0 0 1 ' + pt(rr, a1) + ' L ' + pt(r1, a1) + ' A ' + r1 + ' ' + r1 + ' 0 0 0 ' + pt(r1, a0) + ' Z';
      var color = 'var(--p-' + row.u.tone + ')';
      s.appendChild(svg('path', { class: 'wedge', d: d, style: 'fill:' + color + ';stroke:' + color, 'fill-opacity': st === 'memorized' ? 1 : (st === 'learning' ? 0.5 : 0), 'stroke-opacity': st === 'not_started' ? 0.45 : 0, 'stroke-width': 1 }));
    });
    s.appendChild(svg('circle', { cx: cx, cy: cy, r: 56, style: 'fill:var(--sheet)' }));
    var t1 = svg('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', style: 'fill:var(--ink);font:500 40px var(--font-latin)' });
    t1.textContent = digits(mem);
    var t2 = svg('text', { x: cx, y: cy + 28, 'text-anchor': 'middle', style: 'fill:var(--ink2);font:13px var(--font-latin)' });
    t2.textContent = fmt(T.rosetteOf, digits(n));
    s.appendChild(t1);
    s.appendChild(t2);
    return s;
  }

  function initChecklist() {
    var wrap = doc.getElementById('checklist');
    if (!wrap || !CATALOG) return;
    wrap.hidden = false;
    var form = doc.getElementById('cl-form');
    var groups = doc.getElementById('cl-groups');
    var all = CATALOG.units;
    var anyLearning = all.some(function (u) { var r = getUnit(u.id); return r && r.status === 'learning'; });
    if (anyLearning && !location.search) form.elements.status.value = 'learning';

    function render() {
      var rows = all.map(function (u) { var rec = getUnit(u.id); return { u: u, rec: rec, eff: effective(rec, u.tv) }; });
      var counts = { not_started: 0, learning: 0, memorized: 0 };
      rows.forEach(function (r) { counts[r.eff.status]++; });
      var ros = doc.getElementById('rosette');
      ros.textContent = '';
      ros.appendChild(rosette(rows));
      doc.getElementById('cl-summary').textContent = fmt(T.summary, digits(counts.not_started), digits(counts.learning), digits(counts.memorized));

      var f = { status: form.elements.status.value, category: form.elements.category.value, stage: form.elements.stage.value };
      var list = rows.filter(function (r) {
        if (f.status === 'updated' ? !r.eff.outdated : (f.status && r.eff.status !== f.status)) return false;
        return (!f.category || r.u.category === f.category) && (!f.stage || r.u.stage === f.stage);
      });
      var sort = form.elements.sort.value;
      list.sort(function (a, b) {
        if (sort === 'recent') return String((b.rec && b.rec.status_updated_at) || '').localeCompare(String((a.rec && a.rec.status_updated_at) || ''));
        if (sort === 'oldest') {
          var da = a.rec && a.rec.last_reviewed_at, dbb = b.rec && b.rec.last_reviewed_at;
          if (!da && !dbb) return a.u.order - b.u.order;
          if (!da) return -1;
          if (!dbb) return 1;
          return da.localeCompare(dbb);
        }
        return a.u.order - b.u.order;
      });
      groups.textContent = '';
      var byCat = sort === 'reference';
      var sections = byCat
        ? CATALOG.categories.map(function (c) { return { c: c, rows: list.filter(function (r) { return r.u.category === c.id; }) }; }).filter(function (g) { return g.rows.length; })
        : [{ c: null, rows: list }];
      sections.forEach(function (g) {
        var sec = el('section', { class: 'cl-cat' + (g.c ? ' tone-' + g.c.tone : '') });
        if (g.c) {
          var total = rows.filter(function (r) { return r.u.category === g.c.id; });
          var done = total.filter(function (r) { return r.eff.status === 'memorized'; }).length;
          sec.appendChild(el('h3', {}, [el('span', { class: 'swatch', 'aria-hidden': 'true' }), g.c.label, el('small', { text: digits(done) + ' / ' + digits(total.length) })]));
        }
        var grid = el('div', { class: 'cl-tiles' });
        g.rows.forEach(function (r) {
          var sel = el('select', { 'aria-label': T.status + ' · ' + r.u.id + ' ' + r.u.en });
          STATUSES.forEach(function (s) {
            var o = el('option', { value: s, text: statusLabel[s] + (r.eff.outdated && r.eff.status === s ? ' (' + T.earlierVersion + ')' : '') });
            o.selected = r.eff.status === s;
            sel.appendChild(o);
          });
          sel.addEventListener('change', function () {
            var saved = putUnit(r.u.id, { status: sel.value, status_target_version: r.u.tv, status_updated_at: new Date().toISOString() });
            msg(saved ? T.saved : T.notSaved, !saved);
            render();
          });
          var last = showDate(r.rec && r.rec.last_reviewed_at);
          grid.appendChild(el('div', { class: 'ct tone-' + r.u.tone + ' ' + r.eff.status }, [
            el('a', { href: r.u.url }, [
              el('span', { class: 'ct-meta' }, [el('span', { class: 'uid', text: r.u.id }), r.eff.outdated ? el('span', { class: 'ct-flag', text: T.filterUpdated }) : null]),
              el('span', { class: 'ct-ar', lang: 'ar', text: r.u.ar }),
              el('span', { class: 'ct-en', lang: 'en', text: r.u.en }),
            ]),
            el('span', { class: 'ct-meta', text: T.lastReviewed + ': ' + last }),
            sel,
          ]));
        });
        sec.appendChild(grid);
        groups.appendChild(sec);
      });
      doc.getElementById('cl-empty').hidden = list.length > 0;
    }
    form.addEventListener('change', render);
    window.addEventListener('storage', function (e) { if (!e.key || e.key.indexOf(PREFIX) === 0) render(); });
    render();
    initBackup(render);
  }

  function msg(text, isErr) {
    var m = doc.getElementById('backup-msg');
    if (!m) return;
    m.textContent = text;
    m.className = isErr ? 'status-msg err' : 'status-msg ok';
  }

  // ---------- backup / restore / reset ----------

  function snapshot() {
    var out = [];
    store.keys().forEach(function (k) {
      if (k && k.indexOf(UNIT_PREFIX) === 0) {
        var r = store.get(k);
        if (!validRecord(r)) return;
        out.push({
          unit_id: k.slice(UNIT_PREFIX.length),
          status: r.status,
          status_target_version: r.status_target_version || null,
          status_updated_at: r.status_updated_at || null,
          last_reviewed_at: r.last_reviewed_at || null,
          last_reviewed_target_version: r.last_reviewed_target_version || null,
        });
      }
    });
    out.sort(function (a, b) { return a.unit_id.localeCompare(b.unit_id); });
    var p = prefs();
    return { format: 'rasikh-progress', format_version: 1, schema_version: 1, exported_at: new Date().toISOString(), preferences: { locale: p.locale || null, explain: p.explain || null, theme: p.theme || null }, units: out };
  }
  function download() {
    var blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'rasikh-progress-' + new Date().toISOString().slice(0, 10) + '.json' });
    body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }
  var ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
  function parseBackup(text) {
    var data = JSON.parse(text);
    if (!data || data.format !== 'rasikh-progress' || data.format_version !== 1 || !Array.isArray(data.units)) throw new Error('format');
    var seen = {};
    var units = data.units.map(function (u) {
      if (!u || typeof u.unit_id !== 'string' || !/^[A-Z]\d{2}$/.test(u.unit_id)) throw new Error('id');
      if (seen[u.unit_id]) throw new Error('duplicate');
      seen[u.unit_id] = true;
      if (STATUSES.indexOf(u.status) < 0) throw new Error('status');
      ['status_target_version', 'last_reviewed_target_version'].forEach(function (k) {
        if (u[k] !== null && u[k] !== undefined && !(Number.isInteger(u[k]) && u[k] > 0)) throw new Error(k);
      });
      ['status_updated_at', 'last_reviewed_at'].forEach(function (k) {
        if (u[k] !== null && u[k] !== undefined && !(typeof u[k] === 'string' && ISO.test(u[k]))) throw new Error(k);
      });
      return { id: u.unit_id, rec: { status: u.status, status_target_version: u.status_target_version || null, status_updated_at: u.status_updated_at || null, last_reviewed_at: u.last_reviewed_at || null, last_reviewed_target_version: u.last_reviewed_target_version || null } };
    });
    var p = data.preferences || {};
    var po = {};
    if (p.locale === 'en' || p.locale === 'ar') po.locale = p.locale;
    if (p.explain === 'en' || p.explain === 'ar' || p.explain === 'both') po.explain = p.explain;
    if (p.theme === 'dark' || p.theme === 'light') po.theme = p.theme;
    return { units: units, prefs: po };
  }
  function clearAll() { store.keys().forEach(function (k) { if (k && k.indexOf(PREFIX) === 0) store.remove(k); }); }
  function applyPrefs(p) {
    root.dataset.explain = p.explain || lang;
    if (p.theme === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
    doc.querySelectorAll('input[name="explain"]').forEach(function (r) { r.checked = r.value === root.dataset.explain; });
  }
  function initBackup(render) {
    var file = doc.getElementById('import-file');
    var preview = doc.getElementById('import-preview');
    var pending = null;
    doc.getElementById('export').addEventListener('click', download);
    doc.getElementById('import-export-first').addEventListener('click', download);
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      file.value = '';
      preview.hidden = true;
      pending = null;
      if (!f) return;
      if (f.size > 1024 * 1024) { msg(T.importInvalid, true); return; }
      var reader = new FileReader();
      reader.onload = function () {
        try { pending = parseBackup(String(reader.result)); } catch (e) { msg(T.importInvalid, true); return; }
        doc.getElementById('import-text').textContent = fmt(T.importPreview, pending.units.length);
        preview.hidden = false;
        msg('');
        doc.getElementById('import-confirm').focus();
      };
      reader.onerror = function () { msg(T.importInvalid, true); };
      reader.readAsText(f);
    });
    doc.getElementById('import-cancel').addEventListener('click', function () { pending = null; preview.hidden = true; });
    doc.getElementById('import-confirm').addEventListener('click', function () {
      if (!pending) return;
      var before = snapshot();
      clearAll();
      var ok = pending.units.every(function (u) { return store.set(UNIT_PREFIX + u.id, u.rec); }) && store.set(PREFS_KEY, pending.prefs);
      if (!ok) {
        // Put the previous state back rather than leave a half-written snapshot.
        clearAll();
        before.units.forEach(function (u) { store.set(UNIT_PREFIX + u.unit_id, { status: u.status, status_target_version: u.status_target_version, status_updated_at: u.status_updated_at, last_reviewed_at: u.last_reviewed_at, last_reviewed_target_version: u.last_reviewed_target_version }); });
        var bp = {};
        Object.keys(before.preferences).forEach(function (k) { if (before.preferences[k]) bp[k] = before.preferences[k]; });
        store.set(PREFS_KEY, bp);
        msg(T.notSaved, true);
      } else {
        applyPrefs(pending.prefs);
        msg(T.importDone);
      }
      pending = null;
      preview.hidden = true;
      render();
    });
    doc.getElementById('reset').addEventListener('click', function () {
      if (!window.confirm(T.resetConfirm)) return;
      clearAll();
      applyPrefs({});
      msg(T.resetDone);
      render();
    });
  }

  // Another tab changed progress: refresh the status controls on this page.
  window.addEventListener('storage', function (e) {
    if (!e.key) { doc.querySelectorAll('[data-status-for]').forEach(function (b) { renderStatus(b); }); return; }
    if (e.key.indexOf(UNIT_PREFIX) === 0) renderAllStatus(e.key.slice(UNIT_PREFIX.length));
  });

  initTheme();
  initExplain();
  initLangSwitch();
  initSlash();
  initStatus();
  initSharh();
  initRecite();
  initTables();
  if (body.dataset.page === 'reference') initReference();
  if (body.dataset.page === 'checklist') initChecklist();
})();
