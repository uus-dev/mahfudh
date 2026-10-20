// Static site generator: taxonomy + content/ -> dist/
//   node src/build.mjs            full build, fails on any validation error
//   node src/build.mjs --partial  skip units/concepts whose content is missing (local preview only)
// BASE (env) is the URL prefix the site is served under, e.g. "/rasikh/". Defaults to "/".
import { mkdirSync, writeFileSync, rmSync, cpSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, loadContent, releaseUnits } from './validate.mjs';
import { UI, LOCALES, CATEGORY_AR, STAGE, SCOPE_LABEL, SHARED_PAGE_TITLES, ABOUT, memoryType, clientStrings } from './i18n.mjs';

const partial = process.argv.includes('--partial');
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');
const REPO = 'https://github.com/uus-dev/rasikh';
const DIST = join(ROOT, 'dist');

const { tax, units, concepts, errors } = loadContent();
const fatal = partial ? errors.filter((e) => !/: missing content\//.test(e)) : errors;
if (fatal.length) {
  console.error(fatal.join('\n'));
  console.error(`\nBuild failed: ${fatal.length} problem(s).`);
  process.exit(1);
}

// ---------- catalogue ----------

const taxById = new Map(tax.units.map((u) => [u.id, u]));
const conceptById = new Map(tax.supporting_concepts.map((s) => [s.id, s]));
const published = releaseUnits(tax).filter((u) => units.has(u.id));
const publishedIds = new Set(published.map((u) => u.id));

const pages = [];
const pageBySlug = new Map();
for (const u of published) {
  let p = pageBySlug.get(u.page);
  if (!p) {
    p = { slug: u.page, units: [], category: u.category };
    pageBySlug.set(u.page, p);
    pages.push(p);
  }
  p.units.push(u);
}
for (const p of pages) {
  p.title = p.units.length > 1 ? SHARED_PAGE_TITLES[p.slug] : { en: p.units[0].english_name, ar: p.units[0].arabic_name };
  if (!p.title) throw new Error(`No title for shared page ${p.slug}`);
}
const categories = [...new Set(published.map((u) => u.category))];
const conceptIds = tax.supporting_concepts.map((s) => s.id).filter((id) => concepts.has(id));

// ---------- html helpers ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const AR_RUN = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+(?:[\s\u00A0،؛/()«»\-–]*[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+)*/g;
const LATIN_RUN = /[A-Za-z][A-Za-z0-9ʿʾāīūḥṣḍṭẓĀĪŪḤṢḌṬẒ'’.\- ]*[A-Za-z0-9ʿʾāīūḥṣḍṭẓ.]|[A-Za-z]/g;

// Escape text and mark embedded runs of the other script so bidi and fonts behave.
function rich(s, lang) {
  const t = esc(s);
  if (lang === 'ar') return t.replace(LATIN_RUN, (m) => `<span lang="en" dir="ltr">${m}</span>`);
  return t.replace(AR_RUN, (m) => `<span lang="ar" dir="rtl">${m}</span>`);
}
const ar = (s, tag = 'span', cls = '') => `<${tag} lang="ar" dir="rtl"${cls ? ` class="${cls}"` : ''}>${esc(s)}</${tag}>`;

// Bilingual content: both languages are emitted; CSS shows en / ar / both per preference.
function bi(v, tag = 'span') {
  return `<${tag} class="x-en" lang="en" dir="ltr">${rich(v.en, 'en')}</${tag}><${tag} class="x-ar" lang="ar" dir="rtl">${rich(v.ar, 'ar')}</${tag}>`;
}
function biParas(v) {
  return `<div class="x-en" lang="en" dir="ltr">${v.en.map((p) => `<p>${rich(p, 'en')}</p>`).join('')}</div><div class="x-ar" lang="ar" dir="rtl">${v.ar.map((p) => `<p>${rich(p, 'ar')}</p>`).join('')}</div>`;
}
function biList(v) {
  if (!v.en.length && !v.ar.length) return '';
  return `<ul class="x-en" lang="en" dir="ltr">${v.en.map((p) => `<li>${rich(p, 'en')}</li>`).join('')}</ul><ul class="x-ar" lang="ar" dir="rtl">${v.ar.map((p) => `<li>${rich(p, 'ar')}</li>`).join('')}</ul>`;
}
// Interface-language label (not an explanation, so it follows the page locale only).
const L = (v, lang) => (lang === 'ar' ? ar(v.ar) : `<span lang="en">${esc(v.en)}</span>`);
const cat = (c, lang) => (lang === 'ar' ? CATEGORY_AR[c] : c);

const url = {
  home: (l) => `${BASE}${l}/`,
  reference: (l) => `${BASE}${l}/reference/`,
  page: (l, slug) => `${BASE}${l}/reference/${slug}/`,
  unit: (l, id) => `${BASE}${l}/reference/${taxById.get(id).page}/#unit-${id}`,
  checklist: (l) => `${BASE}${l}/checklist/`,
  glossary: (l, id) => `${BASE}${l}/glossary/${id ? `#${id}` : ''}`,
  about: (l) => `${BASE}${l}/about/`,
};

// ---------- assets (fingerprinted) ----------

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets', 'fonts'), { recursive: true });

function asset(name) {
  const src = readFileSync(join(ROOT, 'assets', name));
  const h = createHash('sha256').update(src).digest('hex').slice(0, 10);
  const out = name.replace(/(\.\w+)$/, `.${h}$1`);
  writeFileSync(join(DIST, 'assets', out), src);
  return `${BASE}assets/${out}`;
}
const CSS = asset('style.css');
const JS = asset('app.js');

const FONT_DIR = join(ROOT, 'node_modules', '@fontsource', 'noto-naskh-arabic', 'files');
const fontFiles = ['noto-naskh-arabic-arabic-400-normal.woff2', 'noto-naskh-arabic-arabic-700-normal.woff2'];
let fontCss = '';
if (fontFiles.every((f) => existsSync(join(FONT_DIR, f)))) {
  for (const f of fontFiles) cpSync(join(FONT_DIR, f), join(DIST, 'assets', 'fonts', f));
  fontCss = [400, 700]
    .map((w) => `@font-face{font-family:"Noto Naskh Arabic";font-style:normal;font-display:swap;font-weight:${w};src:url(${BASE}assets/fonts/noto-naskh-arabic-arabic-${w}-normal.woff2) format("woff2");unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC;}`)
    .join('');
} else console.warn('warning: @fontsource/noto-naskh-arabic not installed; Arabic falls back to system fonts');

// ---------- layout ----------

function layout({ lang, title, path, body, pageType, alt, data }) {
  const t = UI[lang];
  const other = lang === 'en' ? 'ar' : 'en';
  const altPath = alt ?? path.replace(`/${lang}/`, `/${other}/`);
  const nav = [
    ['home', url.home(lang), t.navHome],
    ['reference', url.reference(lang), t.navReference],
    ['checklist', url.checklist(lang), t.navChecklist],
    ['glossary', url.glossary(lang), t.navGlossary],
    ['about', url.about(lang), t.navAbout],
  ];
  return `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" data-explain="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${esc(t.siteName)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${esc(t.siteTagline)}">
<link rel="alternate" hreflang="${other}" href="${altPath}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231d5c4d'/%3E%3Ctext x='16' y='23' font-size='20' text-anchor='middle' fill='white' font-family='serif'%3E%D8%B1%3C/text%3E%3C/svg%3E">
<script>try{var p=JSON.parse(localStorage.getItem('rasikh:v1:prefs')||'{}');if(p.explain&&/^(en|ar|both)$/.test(p.explain))document.documentElement.dataset.explain=p.explain;}catch(e){}document.documentElement.classList.add('js');</script>
${fontCss ? `<style>${fontCss}</style>` : ''}
<link rel="stylesheet" href="${CSS}">
</head>
<body data-page="${pageType}" data-lang="${lang}" data-base="${BASE}">
<a class="skip" href="#main">${esc(t.skip)}</a>
<header class="site">
  <div class="wrap bar">
    <a class="brand" href="${url.home(lang)}"><span class="brand-ar" lang="ar">راسخ</span><span class="brand-en" lang="en">Rasikh</span></a>
    <nav aria-label="${esc(t.navHome)}"><ul>${nav.map(([k, h, l]) => `<li><a href="${h}"${k === pageType ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`).join('')}</ul></nav>
    <a class="lang-switch" href="${altPath}" hreflang="${other}" lang="${other}" data-keep-hash>${esc(t.switchLang)}</a>
  </div>
</header>
<div class="draft-banner" role="note"><div class="wrap">${esc(t.draftBanner)}</div></div>
<main id="main" class="wrap">
${body}
</main>
<footer class="site"><div class="wrap"><p>${esc(t.storageNotice)}</p><p><a href="${url.about(lang)}">${esc(t.navAbout)}</a> · <a href="${REPO}">GitHub</a></p></div></footer>
<script type="application/json" id="i18n">${JSON.stringify(clientStrings(lang)).replace(/</g, '\\u003c')}</script>
${data ? `<script type="application/json" id="catalog">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>` : ''}
<script src="${JS}" defer></script>
</body>
</html>`;
}

function write(rel, html) {
  const p = join(DIST, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, html);
}

// ---------- catalogue data for the browser (search, filters, checklist) ----------

function catalog(lang) {
  return {
    units: published.map((u, i) => {
      const c = units.get(u.id);
      return {
        id: u.id,
        order: i,
        page: u.page,
        url: url.unit(lang, u.id),
        ar: u.arabic_name,
        en: u.english_name,
        tr: c.transliteration,
        summary: c.summary[lang],
        category: u.category,
        categoryLabel: cat(u.category, lang),
        stage: u.stage,
        stageLabel: STAGE[u.stage][lang],
        type: u.memory_type,
        typeLabel: memoryType(u.memory_type, lang),
        tv: c.target_version,
        aliases: [...new Set([...u.search_aliases, ...(c.extra_aliases || []), c.transliteration])],
        text: [c.summary.en, c.summary.ar, c.target.en, c.target.ar, u.category, CATEGORY_AR[u.category]].join(' '),
      };
    }),
  };
}

// ---------- unit rendering ----------

function renderBlock(b, lang) {
  const head = `<h3 class="block-title">${bi(b.title)}</h3>`;
  const notes = b.notes && (b.notes.en.length || b.notes.ar.length) ? `<div class="block-notes">${biList(b.notes)}</div>` : '';
  if (b.kind === 'rules') {
    const items = b.items
      .map((it) => `<div class="rule"><dt>${bi(it.label)}</dt><dd>${bi(it.text, 'p')}${it.ar_example ? `<p class="rule-ex">${ar(it.ar_example)}</p>` : ''}</dd></div>`)
      .join('');
    return `<div class="block block-rules" data-block="${b.id}">${head}<dl class="rules">${items}</dl>${notes}</div>`;
  }
  const cols = b.columns;
  const cell = (c, v, isHead) => {
    const tag = isHead ? 'th scope="row"' : 'td';
    const end = isHead ? 'th' : 'td';
    const label = `data-label="${esc(lang === 'ar' ? c.label.ar : c.label.en)}"`;
    if (v === undefined || v === null || v === '') return `<${tag} ${label} class="empty"><span aria-label="—">—</span></${end}>`;
    if (c.lang === 'ar') return `<${tag} ${label} class="c-ar" lang="ar" dir="rtl">${esc(v)}</${end}>`;
    return `<${tag} ${label} class="c-bi">${bi(v)}</${end}>`;
  };
  const thead = `<thead><tr>${cols.map((c) => `<th scope="col">${bi(c.label)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${b.rows.map((r) => `<tr>${cols.map((c) => cell(c, r[c.key], c.key === b.row_header)).join('')}</tr>`).join('')}</tbody>`;
  const wide = cols.length > 4 ? ' wide' : '';
  return `<div class="block block-table" data-block="${b.id}">${head}<div class="table-scroll${wide}" role="region" tabindex="0" aria-label="${esc(lang === 'ar' ? b.title.ar : b.title.en)}"><table>${thead}${tbody}</table></div>${notes}</div>`;
}

function linkList(ids, lang) {
  const items = ids
    .map((id) => {
      if (publishedIds.has(id)) {
        const u = taxById.get(id);
        return `<li><a href="${url.unit(lang, id)}"><span class="uid">${id}</span> ${ar(u.arabic_name)} <span class="muted" lang="en">${esc(u.english_name)}</span></a></li>`;
      }
      if (conceptById.has(id) && concepts.has(id)) {
        const s = conceptById.get(id);
        return `<li><a href="${url.glossary(lang, id)}"><span class="uid">${id}</span> ${ar(s.arabic_name)} <span class="muted" lang="en">${esc(s.english_name)}</span></a></li>`;
      }
      return ''; // unpublished targets are omitted, never rendered as working links
    })
    .filter(Boolean);
  return items.length ? `<ul class="links">${items.join('')}</ul>` : '';
}

function reportUrl(u, c) {
  const title = `[${u.id} r${c.revision}] `;
  const body = `Unit: ${u.id} — ${u.english_name} / ${u.arabic_name}\nContent revision: ${c.revision}\nTarget version: ${c.target_version}\n\nIssue type (wrong rule / missing item / example / translation / other):\n\nDescription:\n\nBook or teacher convention you are comparing with (optional):\n`;
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=content`;
}

function renderUnit(u, lang, single) {
  const t = UI[lang];
  const c = units.get(u.id);
  const H = single ? 'h1' : 'h2';
  const sources = c.sources
    .map((s) => {
      const src = tax.sources[s.id];
      return `<li><a href="${esc(src.url)}" rel="noopener">${esc(src.provider)} — ${rich(src.title, 'en')}</a>${s.locator ? ` <span class="muted">(${rich(s.locator, 'en')})</span>` : ''}</li>`;
    })
    .join('');
  const recall = c.recall
    .map((r) => `<li data-answers="${esc(r.answer_blocks.join(' '))}">${bi(r.prompt)}</li>`)
    .join('');
  const bg = linkList(u.prerequisites, lang);
  const rel = linkList(u.related, lang);
  return `<section class="unit" id="unit-${u.id}" data-unit="${u.id}" data-tv="${c.target_version}" aria-labelledby="h-${u.id}">
<header class="unit-head">
  <p class="unit-meta"><span class="uid">${u.id}</span> <span>${esc(cat(u.category, lang))}</span> · <span>${esc(STAGE[u.stage][lang])}</span> · <span>${esc(memoryType(u.memory_type, lang))}</span>${c.review_status !== 'published' ? ` <span class="badge-draft">${esc(t.draftBadge)}</span>` : ''}</p>
  <${H} id="h-${u.id}" class="unit-title"><span lang="ar" dir="rtl" class="t-ar">${esc(u.arabic_name)}</span> <span lang="en" dir="ltr" class="t-en">${esc(u.english_name)}</span></${H}>
  <p class="translit" lang="ar-Latn">${esc(c.transliteration)}</p>
</header>
<div class="status-box" data-status-for="${u.id}">
  <noscript><p class="muted">${esc(t.statusUnavailable)}</p></noscript>
</div>
<div class="target">
  <h3>${esc(t.target)} <span class="scope-label">${esc(t.scope)}: ${esc(SCOPE_LABEL[c.scope_label][lang])}</span></h3>
  ${biParas({ en: [c.target.en], ar: [c.target.ar] })}
  <button type="button" class="btn btn-recall" data-recall="${u.id}" hidden>${esc(t.testMyself)}</button>
  <template id="recall-${u.id}"><ol class="recall-prompts">${recall}</ol></template>
</div>
<div class="blocks">${c.blocks.map((b) => renderBlock(b, lang)).join('')}</div>
<details class="sec" open><summary><h3>${esc(t.explanation)}</h3></summary>${biParas(c.explanation)}</details>
<details class="sec" open><summary><h3>${esc(t.examples)}</h3></summary><ul class="examples">${c.examples
    .map((ex) => `<li><p class="ex-ar" lang="ar" dir="rtl">${esc(ex.ar)}</p><p class="ex-en" lang="en" dir="ltr">${rich(ex.en, 'en')}</p>${ex.note ? `<p class="ex-note">${bi(ex.note)}</p>` : ''}</li>`)
    .join('')}</ul></details>
${c.caveats.en.length || c.caveats.ar.length ? `<details class="sec" open><summary><h3>${esc(t.caveats)}</h3></summary>${biList(c.caveats)}</details>` : ''}
<details class="sec" open><summary><h3>${esc(t.convention)}</h3></summary>${biParas({ en: [c.convention.en], ar: [c.convention.ar] })}<h4>${esc(t.sources)}</h4><ul class="sources">${sources}</ul><p class="muted small">${esc(t.revision(c.revision, c.target_version))}</p></details>
${bg ? `<div class="sec-links"><h3>${esc(t.background)}</h3>${bg}</div>` : ''}
${rel ? `<div class="sec-links"><h3>${esc(t.related)}</h3>${rel}</div>` : ''}
<p class="report"><a href="${reportUrl(u, c)}" rel="noopener">${esc(t.report)}</a></p>
</section>`;
}

function explainToggle(lang) {
  const t = UI[lang];
  return `<fieldset class="explain-toggle" hidden><legend>${esc(t.explainLang)}</legend>${[
    ['en', t.explainEn],
    ['ar', t.explainAr],
    ['both', t.explainBoth],
  ]
    .map(([v, l]) => `<label><input type="radio" name="explain" value="${v}"> ${esc(l)}</label>`)
    .join('')}</fieldset>`;
}

// ---------- pages ----------

let count = 0;
for (const lang of LOCALES) {
  const t = UI[lang];
  const data = catalog(lang);

  // Home
  write(`${lang}/index.html`, layout({
    lang, title: t.siteTagline, path: url.home(lang), pageType: 'home', data,
    body: `<section class="hero">
<h1><span class="hero-ar" lang="ar">راسخ</span> <span class="hero-sub">${esc(t.siteTagline)}</span></h1>
<p class="lead">${esc(t.homeLead)}</p>
<form class="search" action="${url.reference(lang)}" role="search">
  <label for="q">${esc(t.searchLabel)}</label>
  <div class="search-row"><input id="q" name="q" type="search" autocomplete="off" placeholder="${esc(t.searchPlaceholder)}" dir="auto"><button class="btn btn-primary">${esc(t.searchButton)}</button></div>
</form>
<p class="actions"><a class="btn" href="${url.reference(lang)}">${esc(t.browse)}</a> <a class="btn" href="${url.checklist(lang)}">${esc(t.openChecklist)}</a></p>
<p class="muted">${esc(t.unitsAvailable(published.length, pages.length))}</p>
</section>
<section class="home-cats">${categories
      .map((c) => `<div class="home-cat"><h2>${esc(cat(c, lang))}</h2><ul>${published
        .filter((u) => u.category === c)
        .map((u) => `<li><a href="${url.unit(lang, u.id)}"><span lang="ar" dir="rtl">${esc(u.arabic_name)}</span> <span class="muted" lang="en">${esc(u.english_name)}</span></a></li>`)
        .join('')}</ul></div>`)
      .join('')}</section>`,
  }));

  // Reference index (server-rendered list; script adds search and filters)
  const opt = (vals, label) => vals.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const stages = Object.keys(STAGE).filter((s) => published.some((u) => u.stage === s));
  const types = [...new Set(published.map((u) => u.memory_type))];
  write(`${lang}/reference/index.html`, layout({
    lang, title: t.referenceTitle, path: url.reference(lang), pageType: 'reference', data,
    body: `<h1>${esc(t.referenceTitle)}</h1>
<form class="search filters" role="search" id="ref-form">
  <label for="q">${esc(t.searchLabel)}</label>
  <div class="search-row"><input id="q" name="q" type="search" autocomplete="off" placeholder="${esc(t.searchPlaceholder)}" dir="auto"><button class="btn btn-primary">${esc(t.searchButton)}</button></div>
  <div class="filter-row">
    <label>${esc(t.filterCategory)} <select name="category"><option value="">${esc(t.filterAll)}</option>${opt(categories.map((c) => [c, cat(c, lang)]))}</select></label>
    <label>${esc(t.filterStage)} <select name="stage" aria-describedby="stage-help"><option value="">${esc(t.filterAll)}</option>${opt(stages.map((s) => [s, STAGE[s][lang]]))}</select></label>
    <label>${esc(t.filterType)} <select name="type"><option value="">${esc(t.filterAll)}</option>${opt(types.map((m) => [m, memoryType(m, lang)]))}</select></label>
    <button type="reset" class="btn btn-link" id="clear">${esc(t.clearFilters)}</button>
  </div>
  <p id="stage-help" class="muted small">${esc(t.stageHelp)}</p>
</form>
<p id="result-count" class="result-count" role="status" aria-live="polite">${esc(t.resultsCount(published.length))}</p>
<div id="no-results" class="empty-state" hidden><p><strong>${esc(t.noResults)}</strong></p><p>${esc(t.noResultsHelp)}</p></div>
<div id="search-error" class="empty-state" hidden><p>${esc(t.searchError)}</p></div>
<ol class="unit-list" id="unit-list">${published
      .map((u) => `<li data-id="${u.id}"><a href="${url.unit(lang, u.id)}"><span class="uid">${u.id}</span> <span class="ul-ar" lang="ar" dir="rtl">${esc(u.arabic_name)}</span> <span class="ul-en" lang="en">${esc(u.english_name)}</span></a><p class="ul-sum">${rich(units.get(u.id).summary[lang], lang)}</p><p class="ul-meta muted small">${esc(cat(u.category, lang))} · ${esc(STAGE[u.stage][lang])} · ${esc(memoryType(u.memory_type, lang))}</p></li>`)
      .join('')}</ol>`,
  }));

  // Reference pages
  for (const p of pages) {
    write(`${lang}/reference/${p.slug}/index.html`, layout({
      lang, title: lang === 'ar' ? p.title.ar : p.title.en, path: url.page(lang, p.slug), pageType: 'unit',
      body: `<nav class="crumbs" aria-label="breadcrumb"><a href="${url.reference(lang)}">${esc(t.referenceTitle)}</a> › ${esc(cat(p.category, lang))}</nav>
${p.units.length > 1 ? `<h1 class="page-title"><span lang="ar" dir="rtl">${esc(p.title.ar)}</span> <span lang="en" class="muted">${esc(p.title.en)}</span></h1><ul class="page-toc">${p.units.map((u) => `<li><a href="#unit-${u.id}"><span class="uid">${u.id}</span> ${ar(u.arabic_name)} <span lang="en" class="muted">${esc(u.english_name)}</span></a></li>`).join('')}</ul>` : ''}
${explainToggle(lang)}
${p.units.map((u) => renderUnit(u, lang, p.units.length === 1)).join('\n')}`,
    }));
    count++;
  }

  // Checklist (rendered by script from the catalogue)
  write(`${lang}/checklist/index.html`, layout({
    lang, title: t.checklistTitle, path: url.checklist(lang), pageType: 'checklist', data,
    body: `<h1>${esc(t.checklistTitle)}</h1>
<p>${esc(t.checklistIntro)}</p>
<p class="muted">${esc(t.storageNotice)}</p>
<noscript><p class="empty-state">${esc(t.statusUnavailable)}</p></noscript>
<div id="checklist" hidden>
  <p id="cl-summary" class="cl-summary" role="status"></p>
  <form class="filter-row" id="cl-form">
    <label>${esc(t.filterStatus)} <select name="status"><option value="">${esc(t.filterAll)}</option><option value="not_started">${esc(t.statusNot)}</option><option value="learning">${esc(t.statusLearning)}</option><option value="memorized">${esc(t.statusMemorized)}</option><option value="updated">${esc(t.filterUpdated)}</option></select></label>
    <label>${esc(t.filterCategory)} <select name="category"><option value="">${esc(t.filterAll)}</option>${opt(categories.map((c) => [c, cat(c, lang)]))}</select></label>
    <label>${esc(t.filterStage)} <select name="stage"><option value="">${esc(t.filterAll)}</option>${opt(stages.map((s) => [s, STAGE[s][lang]]))}</select></label>
    <label>${esc(t.sortBy)} <select name="sort"><option value="reference">${esc(t.sortReference)}</option><option value="recent">${esc(t.sortRecent)}</option><option value="oldest">${esc(t.sortOldestReview)}</option></select></label>
  </form>
  <div id="cl-empty" class="empty-state" hidden><p>${esc(t.checklistEmpty)}</p><p><a class="btn" href="${url.reference(lang)}">${esc(t.browse)}</a></p></div>
  <table class="cl-table" id="cl-table"><thead><tr><th scope="col">${esc(t.unitLink)}</th><th scope="col">${esc(t.status)}</th><th scope="col">${esc(t.lastReviewed)}</th></tr></thead><tbody></tbody></table>
  <section class="backup" id="backup">
    <h2>${esc(t.backupTitle)}</h2>
    ${explainToggle(lang)}
    <p><button type="button" class="btn" id="export">${esc(t.exportBackup)}</button> <label class="btn" for="import-file">${esc(t.importBackup)}</label><input type="file" id="import-file" accept="application/json,.json" class="visually-hidden"></p>
    <div id="import-preview" class="notice" hidden role="alertdialog" aria-live="assertive"><p id="import-text"></p><p><button type="button" class="btn" id="import-export-first">${esc(t.importExportFirst)}</button> <button type="button" class="btn btn-primary" id="import-confirm">${esc(t.importConfirm)}</button> <button type="button" class="btn btn-link" id="import-cancel">${esc(t.importCancel)}</button></p></div>
    <p id="backup-msg" role="status" aria-live="polite"></p>
    <p><button type="button" class="btn btn-danger" id="reset">${esc(t.resetAll)}</button></p>
  </section>
</div>`,
  }));

  // Glossary
  write(`${lang}/glossary/index.html`, layout({
    lang, title: t.glossaryTitle, path: url.glossary(lang), pageType: 'glossary',
    body: `<h1>${esc(t.glossaryTitle)}</h1><p>${esc(t.glossaryIntro)}</p>${explainToggle(lang)}
<ul class="page-toc">${conceptIds.map((id) => `<li><a href="#${id}"><span class="uid">${id}</span> ${ar(conceptById.get(id).arabic_name)} <span lang="en" class="muted">${esc(conceptById.get(id).english_name)}</span></a></li>`).join('')}</ul>
${conceptIds
      .map((id) => {
        const s = conceptById.get(id);
        const c = concepts.get(id);
        const terms = c.terms?.length
          ? `<dl class="terms">${c.terms.map((x) => `<div><dt lang="ar" dir="rtl">${esc(x.ar)}</dt><dd>${bi(x.gloss)}</dd></div>`).join('')}</dl>`
          : '';
        return `<section class="concept" id="${id}"><h2><span class="uid">${id}</span> <span lang="ar" dir="rtl">${esc(s.arabic_name)}</span> <span lang="en" class="muted">${esc(s.english_name)}</span></h2>${biParas(c.body)}${terms}</section>`;
      })
      .join('')}`,
  }));

  // About
  write(`${lang}/about/index.html`, layout({
    lang, title: t.aboutTitle, path: url.about(lang), pageType: 'about',
    body: `<h1>${esc(t.aboutTitle)}</h1>${ABOUT[lang].map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((p) => `<p>${esc(p)}</p>`).join('')}`).join('')}`,
  }));

  // 404 content per locale is in the root 404 page below.
}

// Root: pick a locale. Explicit choice (stored) wins, then browser language, then English.
write('index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Rasikh · راسخ</title>
<script>var l='en';try{var p=JSON.parse(localStorage.getItem('rasikh:v1:prefs')||'{}');if(p.locale==='ar'||p.locale==='en')l=p.locale;else if((navigator.language||'').slice(0,2)==='ar')l='ar';}catch(e){if((navigator.language||'').slice(0,2)==='ar')l='ar';}location.replace('${BASE}'+l+'/');</script>
</head><body><p><a href="${BASE}en/">English</a> · <a href="${BASE}ar/" lang="ar">العربية</a></p></body></html>`);

write('404.html', layout({
  lang: 'en', title: UI.en.notFound, path: `${BASE}en/`, alt: `${BASE}ar/`, pageType: '404',
  body: `<h1>${esc(UI.en.notFound)}</h1><p>${esc(UI.en.notFoundBody)}</p><p><a class="btn" href="${url.reference('en')}">${esc(UI.en.browse)}</a> <a class="btn" lang="ar" href="${url.reference('ar')}">${esc(UI.ar.browse)}</a></p>`,
}));
write('robots.txt', 'User-agent: *\nDisallow: /\n');
write('.nojekyll', '');

console.log(`Built ${published.length} units on ${pages.length} pages (${count} page renders), ${conceptIds.length} concepts → dist/${partial && errors.length ? `  [partial: ${errors.length} item(s) skipped]` : ''}`);
