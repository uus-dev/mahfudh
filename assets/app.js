// Rasikh client enhancements: explanation language, unit status, recall, search/filters, checklist, backup.
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

  function fmt(s) {
    var args = Array.prototype.slice.call(arguments, 1);
    return String(s).replace(/\{(\d)\}/g, function (_, i) { return args[i]; });
  }
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

  // ---------- storage ----------

  var store = (function () {
    var ok = false;
    try {
      var k = PREFIX + 'probe';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      ok = true;
    } catch (e) { ok = false; }
    function get(key) {
      if (!ok) return null;
      try {
        var v = localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
      } catch (e) { return null; }
    }
    function set(key, val) {
      if (!ok) return false;
      try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
    }
    function keys() {
      var out = [];
      if (!ok) return out;
      try { for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {}
      return out;
    }
    function remove(key) { try { localStorage.removeItem(key); return true; } catch (e) { return false; } }
    return { ok: ok, get: get, set: set, keys: keys, remove: remove };
  })();

  function prefs() {
    var p = store.get(PREFS_KEY);
    return p && typeof p === 'object' ? p : {};
  }
  function setPref(k, v) {
    var p = prefs();
    p[k] = v;
    return store.set(PREFS_KEY, p);
  }

  function validRecord(r) {
    return r && typeof r === 'object' && STATUSES.indexOf(r.status) >= 0;
  }
  function getUnit(id) {
    var r = store.get(UNIT_PREFIX + id);
    return validRecord(r) ? r : null;
  }
  function putUnit(id, patch) {
    var r = getUnit(id) || { status: 'not_started', status_target_version: null, status_updated_at: null, last_reviewed_at: null, last_reviewed_target_version: null };
    for (var k in patch) r[k] = patch[k];
    return store.set(UNIT_PREFIX + id, r) ? r : null;
  }
  function effective(rec, tv) {
    var status = rec ? rec.status : 'not_started';
    var outdated = !!(rec && status !== 'not_started' && rec.status_target_version && rec.status_target_version < tv);
    return { status: status, outdated: outdated };
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

  // ---------- explanation language ----------

  function initExplain() {
    var current = root.dataset.explain;
    var radios = doc.querySelectorAll('input[name="explain"]');
    doc.querySelectorAll('.explain-toggle').forEach(function (f) { f.hidden = false; });
    radios.forEach(function (r) {
      r.checked = r.value === current;
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

  // ---------- unit status ----------

  function renderStatus(box) {
    var id = box.dataset.statusFor;
    var section = box.closest('.unit');
    var tv = parseInt(section.dataset.tv, 10) || 1;
    box.textContent = '';
    if (!store.ok) {
      box.appendChild(el('p', { class: 'muted small', text: T.statusUnavailable }));
      return;
    }
    var rec = getUnit(id);
    var eff = effective(rec, tv);
    var wrap = el('div', { class: 'status' });
    var fs = el('fieldset', {}, [el('legend', { text: T.status + ' · ' + id })]);
    STATUSES.forEach(function (s) {
      var input = el('input', { type: 'radio', name: 'status-' + id, value: s });
      input.checked = eff.status === s;
      input.addEventListener('change', function () {
        var saved = putUnit(id, { status: s, status_target_version: tv, status_updated_at: new Date().toISOString() });
        renderAllStatus(id, saved ? 'ok' : 'err');
      });
      fs.appendChild(el('label', { class: 'seg' }, [input, el('span', { text: statusLabel[s] + (eff.outdated && eff.status === s ? ' — ' + T.earlierVersion : '') })]));
    });
    wrap.appendChild(fs);

    var reviewed = el('button', { type: 'button', class: 'btn', text: T.reviewedToday });
    reviewed.addEventListener('click', function () {
      var saved = putUnit(id, { last_reviewed_at: new Date().toISOString(), last_reviewed_target_version: tv });
      renderAllStatus(id, saved ? 'ok' : 'err');
    });
    wrap.appendChild(reviewed);

    var lastTxt = showDate(rec && rec.last_reviewed_at);
    if (rec && rec.last_reviewed_at && rec.last_reviewed_target_version && rec.last_reviewed_target_version < tv) lastTxt += ' (' + T.earlierVersion + ')';
    var meta = el('p', { class: 'status-meta' }, [
      el('span', { text: T.lastReviewed + ': ' + lastTxt }),
      el('span', { text: T.selfReported }),
      el('span', { class: 'status-msg', role: 'status', 'aria-live': 'polite' }),
    ]);
    wrap.appendChild(meta);

    if (eff.outdated) {
      var confirm = el('button', { type: 'button', class: 'btn', text: T.confirmStatus });
      confirm.addEventListener('click', function () {
        var saved = putUnit(id, { status_target_version: tv, status_updated_at: new Date().toISOString() });
        renderAllStatus(id, saved ? 'ok' : 'err');
      });
      wrap.appendChild(el('div', { class: 'status-update', role: 'note' }, [el('p', { text: T.contentUpdated }), confirm]));
    }
    box.appendChild(wrap);
  }

  function renderAllStatus(id, msg) {
    doc.querySelectorAll('[data-status-for="' + id + '"]').forEach(function (b) {
      // Re-rendering replaces the controls, so carry keyboard focus across.
      var active = doc.activeElement;
      var focusKind = b.contains(active) ? (active.tagName === 'INPUT' ? 'radio' : active.textContent) : null;
      renderStatus(b);
      if (msg) {
        var m = b.querySelector('.status-msg');
        m.className = 'status-msg ' + msg;
        m.textContent = msg === 'ok' ? T.saved : T.notSaved;
      }
      if (focusKind === 'radio') {
        var r = b.querySelector('input:checked');
        if (r) r.focus();
      } else if (focusKind) {
        var btn = Array.prototype.find.call(b.querySelectorAll('button'), function (x) { return x.textContent === focusKind; });
        (btn || b.querySelector('input:checked') || b.querySelector('button')).focus();
      }
    });
  }

  function initStatus() {
    doc.querySelectorAll('[data-status-for]').forEach(renderStatus);
  }

  // ---------- recall ----------

  function openRecall(btn) {
    var id = btn.dataset.recall;
    var section = doc.getElementById('unit-' + id);
    var tpl = doc.getElementById('recall-' + id);
    var prompts = tpl.content.cloneNode(true);
    var blockIds = [];
    prompts.querySelectorAll('[data-answers]').forEach(function (li) {
      li.dataset.answers.split(' ').forEach(function (b) { if (blockIds.indexOf(b) < 0) blockIds.push(b); });
    });
    var answer = el('div', { class: 'recall-answer', hidden: true });
    blockIds.forEach(function (b) {
      var src = section.querySelector('[data-block="' + b + '"]');
      if (src) answer.appendChild(src.cloneNode(true));
    });
    var title = section.querySelector('.unit-title');
    var heading = el('h2', { id: 'recall-title-' + id, text: T.testMyself + ' · ' + id });
    var closeBtn = el('button', { type: 'button', class: 'btn', text: T.close });
    var revealBtn = el('button', { type: 'button', class: 'btn btn-primary', 'aria-expanded': 'false', text: T.reveal });
    var dlg = el('dialog', { class: 'recall', 'aria-labelledby': heading.id }, [
      el('div', { class: 'recall-inner' }, [
        el('div', { class: 'recall-head' }, [heading, closeBtn]),
        title ? el('p', { class: 'muted', text: title.textContent.trim() }) : null,
        el('p', { class: 'muted small', text: T.recallHint }),
        prompts,
        el('div', { class: 'recall-actions' }, [revealBtn]),
        answer,
      ]),
    ]);
    revealBtn.addEventListener('click', function () {
      var show = answer.hidden;
      answer.hidden = !show;
      revealBtn.textContent = show ? T.hide : T.reveal;
      revealBtn.setAttribute('aria-expanded', String(show));
    });
    closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { dlg.remove(); btn.focus(); });
    body.appendChild(dlg);
    if (dlg.showModal) dlg.showModal();
    else dlg.setAttribute('open', '');
    revealBtn.focus();
  }

  function initRecall() {
    doc.querySelectorAll('[data-recall]').forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () { openRecall(btn); });
    });
  }

  // ---------- search ----------

  var HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
  function norm(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .normalize('NFC')
      .toLowerCase()
      .replace(HARAKAT, '')
      .replace(/[ʿʾ'’‘`]/g, '')
      .replace(/[-_.,،؛:;()«»"/?؟!]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Secondary form: also fold hamza-carrying alif variants and alif wasla.
  function norm2(s) { return norm(s).replace(/[أإآٱ]/g, 'ا'); }

  function prepare(units) {
    units.forEach(function (u) {
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
    var toks = q2.split(' ');
    var hits = 0;
    for (var j = 0; j < toks.length; j++) if (u._hay.indexOf(toks[j]) >= 0) hits++;
    return hits === toks.length ? 20 + hits : 0;
  }

  function initReference() {
    var form = doc.getElementById('ref-form');
    var list = doc.getElementById('unit-list');
    if (!form || !list || !CATALOG) return;
    var items = {};
    list.querySelectorAll('li[data-id]').forEach(function (li) { items[li.dataset.id] = li; });
    var units = CATALOG.units;
    try { prepare(units); } catch (e) {
      doc.getElementById('search-error').hidden = false;
      return;
    }
    var params = new URLSearchParams(location.search);
    ['q', 'category', 'stage', 'type'].forEach(function (k) {
      if (params.get(k) && form.elements[k]) form.elements[k].value = params.get(k);
    });

    function apply(push) {
      var q = norm(form.elements.q.value);
      var q2 = norm2(form.elements.q.value);
      var f = { category: form.elements.category.value, stage: form.elements.stage.value, type: form.elements.type.value };
      var shown = units
        .map(function (u) { return { u: u, s: score(u, q, q2) }; })
        .filter(function (x) {
          return x.s > 0 && (!f.category || x.u.category === f.category) && (!f.stage || x.u.stage === f.stage) && (!f.type || x.u.type === f.type);
        })
        .sort(function (a, b) { return b.s - a.s || a.u.order - b.u.order; });
      Object.keys(items).forEach(function (id) { items[id].hidden = true; });
      shown.forEach(function (x) { var li = items[x.u.id]; li.hidden = false; list.appendChild(li); });
      doc.getElementById('result-count').textContent = fmt(T.resultsCount, shown.length);
      doc.getElementById('no-results').hidden = shown.length > 0;
      if (push) {
        var p = new URLSearchParams();
        if (form.elements.q.value.trim()) p.set('q', form.elements.q.value.trim());
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

  // ---------- checklist ----------

  function initChecklist() {
    var wrap = doc.getElementById('checklist');
    if (!wrap || !CATALOG) return;
    wrap.hidden = false;
    var form = doc.getElementById('cl-form');
    var tbody = doc.querySelector('#cl-table tbody');
    var units = CATALOG.units;
    var anyLearning = units.some(function (u) { var r = getUnit(u.id); return r && r.status === 'learning'; });
    if (anyLearning && !location.search) form.elements.status.value = 'learning';

    function render() {
      var counts = { not_started: 0, learning: 0, memorized: 0 };
      var rows = units.map(function (u) {
        var rec = getUnit(u.id);
        var eff = effective(rec, u.tv);
        counts[eff.status]++;
        return { u: u, rec: rec, eff: eff };
      });
      doc.getElementById('cl-summary').textContent = fmt(T.summary, counts.not_started, counts.learning, counts.memorized);
      var f = { status: form.elements.status.value, category: form.elements.category.value, stage: form.elements.stage.value };
      var list = rows.filter(function (r) {
        if (f.status === 'updated' ? !r.eff.outdated : f.status && r.eff.status !== f.status) return false;
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
      tbody.textContent = '';
      list.forEach(function (r) {
        var sel = el('select', { 'aria-label': T.status + ' ' + r.u.id });
        STATUSES.forEach(function (s) {
          var o = el('option', { value: s, text: statusLabel[s] + (r.eff.outdated && r.eff.status === s ? ' — ' + T.earlierVersion : '') });
          o.selected = r.eff.status === s;
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () {
          var saved = putUnit(r.u.id, { status: sel.value, status_target_version: r.u.tv, status_updated_at: new Date().toISOString() });
          msg(saved ? T.saved : T.notSaved);
          render();
        });
        tbody.appendChild(el('tr', {}, [
          el('td', {}, [el('a', { href: r.u.url }, [el('span', { class: 'uid', text: r.u.id }), el('span', { class: 'cl-ar', lang: 'ar', dir: 'rtl', text: r.u.ar }), el('span', { class: 'muted', lang: 'en', text: r.u.en })]), r.eff.outdated ? el('span', { class: 'cl-flag', text: T.filterUpdated }) : null]),
          el('td', {}, [sel]),
          el('td', { text: showDate(r.rec && r.rec.last_reviewed_at) + (r.rec && r.rec.last_reviewed_target_version && r.rec.last_reviewed_target_version < r.u.tv ? ' (' + T.earlierVersion + ')' : '') }),
        ]));
      });
      doc.getElementById('cl-table').hidden = list.length === 0;
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
    var unitsOut = [];
    store.keys().forEach(function (k) {
      if (k && k.indexOf(UNIT_PREFIX) === 0) {
        var r = store.get(k);
        if (!validRecord(r)) return;
        unitsOut.push({
          unit_id: k.slice(UNIT_PREFIX.length),
          status: r.status,
          status_target_version: r.status_target_version || null,
          status_updated_at: r.status_updated_at || null,
          last_reviewed_at: r.last_reviewed_at || null,
          last_reviewed_target_version: r.last_reviewed_target_version || null,
        });
      }
    });
    unitsOut.sort(function (a, b) { return a.unit_id.localeCompare(b.unit_id); });
    var p = prefs();
    return { format: 'rasikh-progress', format_version: 1, schema_version: 1, exported_at: new Date().toISOString(), preferences: { locale: p.locale || null, explain: p.explain || null }, units: unitsOut };
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
    var out = data.units.map(function (u) {
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
      return {
        id: u.unit_id,
        rec: {
          status: u.status,
          status_target_version: u.status_target_version || null,
          status_updated_at: u.status_updated_at || null,
          last_reviewed_at: u.last_reviewed_at || null,
          last_reviewed_target_version: u.last_reviewed_target_version || null,
        },
      };
    });
    var p = data.preferences || {};
    var prefsOut = {};
    if (p.locale === 'en' || p.locale === 'ar') prefsOut.locale = p.locale;
    if (p.explain === 'en' || p.explain === 'ar' || p.explain === 'both') prefsOut.explain = p.explain;
    return { units: out, prefs: prefsOut };
  }

  function clearAll() {
    store.keys().forEach(function (k) { if (k && k.indexOf(PREFIX) === 0) store.remove(k); });
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
        msg(T.notSaved, true);
      } else {
        if (pending.prefs.explain) root.dataset.explain = pending.prefs.explain;
        msg(T.importDone);
      }
      pending = null;
      preview.hidden = true;
      render();
    });
    doc.getElementById('reset').addEventListener('click', function () {
      if (!window.confirm(T.resetConfirm)) return;
      clearAll();
      root.dataset.explain = lang;
      doc.querySelectorAll('input[name="explain"]').forEach(function (r) { r.checked = r.value === lang; });
      msg(T.resetDone);
      render();
    });
  }

  // ---------- misc ----------

  // Printing always shows the full reference, whatever was collapsed or hidden on screen.
  window.addEventListener('beforeprint', function () {
    doc.querySelectorAll('details').forEach(function (d) { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    doc.querySelectorAll('details[data-was-open]').forEach(function (d) { d.open = d.dataset.wasOpen === '1'; delete d.dataset.wasOpen; });
  });

  // Another tab changed progress: refresh the status controls on this page.
  window.addEventListener('storage', function (e) {
    if (!e.key) { initStatus(); return; }
    if (e.key.indexOf(UNIT_PREFIX) === 0) renderAllStatus(e.key.slice(UNIT_PREFIX.length));
  });

  initExplain();
  initLangSwitch();
  initStatus();
  initRecall();
  if (body.dataset.page === 'reference') initReference();
  if (body.dataset.page === 'checklist') initChecklist();
})();
