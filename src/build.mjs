// Static site generator: taxonomy + content/ -> dist/
//   node src/build.mjs            full build, fails on any validation error
//   node src/build.mjs --partial  skip units/concepts whose content is missing (local preview only)
// BASE (env) is the URL prefix the site is served under, e.g. "/mahfudh/". Defaults to "/".
import { mkdirSync, writeFileSync, rmSync, cpSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, loadContent, releaseUnits } from './validate.mjs';
import { UI, LOCALES, CATEGORY_AR, CATEGORY_TONE, STAGE, SCOPE_LABEL, SHARED_PAGE_TITLES, ABOUT, ROMAN, AR_DIGITS, memoryType, clientStrings } from './i18n.mjs';

const partial = process.argv.includes('--partial');
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');
// Repository links follow the repository the site is built from (GITHUB_REPOSITORY in CI).
const REPO = `https://github.com/${process.env.GITHUB_REPOSITORY || 'uus-dev/mahfudh'}`;
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
// The raw text is split first and each run escaped on its own, so entities are never touched.
function rich(s, lang) {
  const re = lang === 'ar' ? LATIN_RUN : AR_RUN;
  const wrap = lang === 'ar' ? (m) => `<span lang="en" dir="ltr">${esc(m)}</span>` : (m) => `<span lang="ar" dir="rtl">${esc(m)}</span>`;
  let out = '';
  let last = 0;
  for (const m of String(s).matchAll(re)) {
    out += esc(s.slice(last, m.index)) + wrap(m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(String(s).slice(last));
}
const ar = (s, cls = '') => `<span lang="ar" dir="rtl"${cls ? ` class="${cls}"` : ''}>${esc(s)}</span>`;
const L = (v, lang) => (lang === 'ar' ? v.ar : v.en);
const num = (n, lang) => (lang === 'ar' ? AR_DIGITS(n) : String(n));

// Bilingual content: both languages are emitted; CSS shows en / ar / both per preference.
function bi(v, tag = 'span') {
  return `<${tag} class="x-en" lang="en" dir="ltr">${rich(v.en, 'en')}</${tag}><${tag} class="x-ar" lang="ar" dir="rtl">${rich(v.ar, 'ar')}</${tag}>`;
}
function biParas(v) {
  return `<div class="x-en" lang="en" dir="ltr">${v.en.map((p) => `<p>${rich(p, 'en')}</p>`).join('')}</div><div class="x-ar" lang="ar" dir="rtl">${v.ar.map((p) => `<p>${rich(p, 'ar')}</p>`).join('')}</div>`;
}
const cat = (c, lang) => (lang === 'ar' ? CATEGORY_AR[c] : c);
const tone = (c) => CATEGORY_TONE[c] || 'umber';

const url = {
  home: (l) => `${BASE}${l}/`,
  reference: (l) => `${BASE}${l}/reference/`,
  page: (l, slug) => `${BASE}${l}/reference/${slug}/`,
  unit: (l, id) => `${BASE}${l}/reference/${taxById.get(id).page}/#unit-${id}`,
  checklist: (l) => `${BASE}${l}/checklist/`,
  glossary: (l, id) => `${BASE}${l}/glossary/${id ? `#${id}` : ''}`,
  about: (l) => `${BASE}${l}/about/`,
};

const STAR = '<rect x="6" y="6" width="12" height="12"></rect><rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)"></rect>';
const star = (cls, extra = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true">${STAR}${extra}</svg>`;
const corners = ['tl', 'tr', 'bl', 'br'].map((c) => star(`corner ${c}`)).join('');
const divider = `<div class="divider" aria-hidden="true"><span></span>${star('', '<circle cx="12" cy="12" r="2"></circle>')}<span></span></div>`;
const ICON = {
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>',
  moon: '<svg class="i-moon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path></svg>',
  sun: '<svg class="i-sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"></path></svg>',
  qalam: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19c4-1 6-4 7-8l1-4c.5-2 2.5-3 4.5-2.5S20 7 19.5 9L18 14c-1 3.5-4 6-8 6.5"></path><path d="M9 15l3 3"></path></svg>',
};

// ---------- assets ----------

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

// Self-hosted fonts: copy the needed @fontsource subsets and rewrite their @font-face rules.
function fonts(pkg, cssFiles, subsets) {
  const dir = join(ROOT, 'node_modules', '@fontsource', pkg);
  if (!existsSync(dir)) {
    console.warn(`warning: @fontsource/${pkg} not installed; falling back to system fonts`);
    return '';
  }
  let out = '';
  for (const f of cssFiles) {
    const css = readFileSync(join(dir, f), 'utf8');
    for (const block of css.match(/@font-face\s*{[^}]+}/g) || []) {
      const file = block.match(/url\(\.\/files\/([^)]+\.woff2)\)/)?.[1];
      if (!file || !subsets.some((s) => file.includes(`-${s}-`))) continue;
      cpSync(join(dir, 'files', file), join(DIST, 'assets', 'fonts', file));
      out += block.replace(/src:[^;]+;/, `src:url(${BASE}assets/fonts/${file}) format("woff2");`).replace(/\s+/g, ' ');
    }
  }
  return out;
}
const fontCss =
  fonts('scheherazade-new', ['400.css', '700.css'], ['arabic']) +
  fonts('eb-garamond', ['400.css', '400-italic.css', '500.css', '600.css'], ['latin', 'latin-ext']);

// ---------- layout ----------

function layout({ lang, title, path, body, pageType, alt, data, headSearch = true }) {
  const t = UI[lang];
  const other = lang === 'en' ? 'ar' : 'en';
  const altPath = alt ?? path.replace(`/${lang}/`, `/${other}/`);
  const nav = [
    ['reference', url.reference(lang), t.navReference],
    ['checklist', url.checklist(lang), t.navChecklist],
    ['glossary', url.glossary(lang), t.navGlossary],
    ['about', url.about(lang), t.navAbout],
  ];
  const current = pageType === 'unit' ? 'reference' : pageType;
  return `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" data-explain="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${esc(t.siteName)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${esc(t.siteTagline)}">
<meta name="color-scheme" content="light dark">
<link rel="alternate" hreflang="${other}" href="${altPath}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231F3E8C'/%3E%3Ctext x='16' y='24' font-size='22' text-anchor='middle' fill='%23FBF8F1' font-family='serif'%3E%D9%85%3C/text%3E%3C/svg%3E">
<script>(function(d){try{var p=JSON.parse(localStorage.getItem('mahfudh:v1:prefs')||'{}');if(p.explain&&/^(en|ar|both)$/.test(p.explain))d.dataset.explain=p.explain;if(p.theme==='dark')d.dataset.theme='dark';}catch(e){}d.classList.add('js');})(document.documentElement);</script>
${fontCss ? `<style>${fontCss}</style>` : ''}
<link rel="stylesheet" href="${CSS}">
</head>
<body data-page="${pageType}" data-lang="${lang}" data-base="${BASE}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="zellige" width="30" height="30" patternUnits="userSpaceOnUse"><g fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1"><rect x="9" y="9" width="12" height="12"></rect><rect x="9" y="9" width="12" height="12" transform="rotate(45 15 15)"></rect></g></pattern></defs></svg>
<a class="skip" href="#main">${esc(t.skip)}</a>
<header class="site">
  <div class="bar">
    <a class="brand" href="${url.home(lang)}"><span class="brand-ar" lang="ar">محفوظ</span><span class="brand-en" lang="en">Mahfudh</span></a>
    <nav class="mainnav" aria-label="${esc(t.navMain)}"><ul>${nav.map(([k, h, l]) => `<li><a href="${h}"${k === current ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`).join('')}</ul></nav>
    <div class="bar-end">
      ${headSearch ? `<form class="hsearch" action="${url.reference(lang)}" role="search"><label class="vh" for="hq">${esc(t.searchLabel)}</label>${ICON.search}<input id="hq" name="q" type="search" autocomplete="off" placeholder="${esc(t.searchPlaceholder)}" dir="auto"><kbd aria-hidden="true">/</kbd></form>` : ''}
      <a class="lang-switch" href="${altPath}" hreflang="${other}" lang="${other}" data-keep-hash>${esc(t.switchLang)}</a>
      <button class="iconbtn theme-toggle" type="button" hidden aria-label="${esc(t.themeToDark)}" data-label-dark="${esc(t.themeToDark)}" data-label-light="${esc(t.themeToLight)}">${ICON.moon}${ICON.sun}</button>
    </div>
  </div>
  <div class="rule2" aria-hidden="true"></div>
</header>
<p class="draft-note" role="note"><span>${esc(t.draftBanner)}</span></p>
<main id="main" class="page-${pageType}">
${body}
</main>
<footer class="site"><div class="wrap"><p>${esc(t.storageNotice)}</p><p><a href="${url.about(lang)}">${esc(t.navAbout)}</a> · <a href="${REPO}">GitHub</a></p></div></footer>
<div class="judge-bar" hidden role="group" aria-label="${esc(t.didYouKnow)}"><p class="jq"></p><div class="jbtns"><button type="button" class="jb k" data-judge="k">${esc(t.knewIt)}</button><button type="button" class="jb n" data-judge="n">${esc(t.notYet)}</button></div></div>
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
    categories: categories.map((c) => ({ id: c, label: cat(c, lang), tone: tone(c) })),
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
        tone: tone(u.category),
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

// Columns that become recitation tiles: the block's explicit `recite` list, otherwise the Arabic
// columns, keeping an Arabic row header visible as the cue.
function recallColumns(b) {
  if (b.recite) return b.recite;
  const arCols = b.columns.filter((c) => c.lang === 'ar').map((c) => c.key);
  if (b.row_header && arCols.includes(b.row_header) && arCols.length > 1) return arCols.filter((k) => k !== b.row_header);
  return arCols;
}

function renderBlock(u, b, i, lang, markers, prompts) {
  const id = `${u.id}-b-${b.id}`;
  // Recall prompts are shown above the block they ask about, only while reciting.
  const qs = prompts.map((r) => `<p class="recite-q">${bi(r.prompt)}</p>`).join('');
  const head = `<h3 class="secthead" id="${id}-h"><span class="num">${ROMAN[i] || i + 1}</span> ${bi(b.title)}${markers}</h3>${qs}`;
  const notes = b.notes && (b.notes.en.length || b.notes.ar.length) ? `<div class="block-notes">${bi({ en: b.notes.en.join(' '), ar: b.notes.ar.join(' ') }, 'p')}</div>` : '';
  if (b.kind === 'rules') {
    const items = b.items
      .map((it) => `<div class="rule"><dt>${bi(it.label)}</dt><dd data-recall>${bi(it.text, 'p')}${it.ar_example ? `<p class="rule-ex" lang="ar" dir="rtl">${esc(it.ar_example)}</p>` : ''}</dd></div>`)
      .join('');
    return `<div class="block block-rules" id="${id}" data-block="${b.id}" aria-labelledby="${id}-h">${head}<dl class="rules">${items}</dl>${notes}</div>`;
  }
  const cols = b.columns;
  const recall = new Set(recallColumns(b));
  const cell = (c, v, isHead) => {
    const label = `data-label="${esc(L(c.label, lang))}"`;
    const empty = v === undefined || v === null || v === '';
    const rc = recall.has(c.key) && !empty ? ' data-recall' : ''; // a dash is not something to recite
    const open = isHead ? `<th scope="row" ${label}${rc}` : `<td ${label}${rc}`;
    const close = isHead ? '</th>' : '</td>';
    if (empty) return `${open} class="empty"><span class="cv" aria-label="—">—</span>${close}`;
    if (c.lang === 'ar') return `${open} class="c-ar${recall.has(c.key) || c.key === b.row_header ? '' : ' c-ar-s'}"><span class="cv" lang="ar" dir="rtl">${esc(v)}</span>${close}`;
    return `${open} class="c-bi"><span class="cv">${bi(v)}</span>${close}`;
  };
  const thead = `<thead><tr>${cols.map((c) => `<th scope="col">${bi(c.label)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${b.rows.map((r) => `<tr>${cols.map((c) => cell(c, r[c.key], c.key === b.row_header)).join('')}</tr>`).join('')}</tbody>`;
  const wide = cols.length > 4 ? ' wide' : '';
  return `<div class="block block-table" id="${id}" data-block="${b.id}" aria-labelledby="${id}-h">${head}<div class="table-scroll${wide}" role="region" tabindex="0" aria-labelledby="${id}-h"><table>${thead}${tbody}</table></div>${notes}</div>`;
}

function linkItems(ids, lang) {
  return ids
    .map((id) => {
      if (publishedIds.has(id)) {
        const u = taxById.get(id);
        return `<li><a href="${url.unit(lang, id)}">${ar(u.arabic_name, 'l-ar')} <span class="uid">${id}</span></a></li>`;
      }
      if (conceptById.has(id) && concepts.has(id)) {
        const s = conceptById.get(id);
        return `<li><a href="${url.glossary(lang, id)}">${lang === 'ar' ? ar(s.arabic_name, 'l-ar') : esc(s.english_name)} <span class="uid">${id}</span></a></li>`;
      }
      return ''; // unpublished targets are omitted, never rendered as working links
    })
    .filter(Boolean)
    .join('');
}

function reportUrl(u, c) {
  const title = `[${u.id} r${c.revision}] `;
  const body = `Unit: ${u.id} — ${u.english_name} / ${u.arabic_name}\nContent revision: ${c.revision}\nTarget version: ${c.target_version}\n\nIssue type (wrong rule / missing item / example / translation / other):\n\nDescription:\n\nBook or teacher convention you are comparing with (optional):\n`;
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=content`;
}

function explainToggle(lang) {
  const t = UI[lang];
  return `<fieldset class="explain-toggle" hidden><legend>${esc(t.explainLang)}</legend>${[
    ['en', t.explainEn],
    ['ar', t.explainAr],
    ['both', t.explainBoth],
  ]
    .map(([v, l]) => `<label><input type="radio" name="explain" value="${v}"> <span>${esc(l)}</span></label>`)
    .join('')}</fieldset>`;
}

function renderUnit(u, lang, { single, first }) {
  const t = UI[lang];
  const c = units.get(u.id);
  const H = single ? 'h1' : 'h2';

  // Sharḥ: numbered commentary in the margin. 1 = meaning, 2 = convention, then each caveat.
  const notes = [
    { title: t.noteMeaning, body: biParas(c.explanation) },
    { title: t.noteConvention, body: biParas({ en: [c.convention.en], ar: [c.convention.ar] }) },
    ...c.caveats.en.map((en, i) => ({ title: t.noteCaveat, body: biParas({ en: [en], ar: [c.caveats.ar[i] ?? ''].filter(Boolean) }) })),
  ].map((n, i) => ({ ...n, n: i + 1, id: `${u.id}-n${i + 1}` }));
  const marker = (n) => `<a class="mk" href="#${n.id}" data-note="${n.id}" aria-label="${esc(t.noteMarker(num(n.n, lang), n.title))}">${num(n.n, lang)}</a>`;
  const caveatMarkers = notes.slice(2).map(marker).join('');
  const blocks = c.blocks
    .map((b, i) => {
      let m = '';
      if (i === 0) m += marker(notes[1]);
      if (i === c.blocks.length - 1) m += caveatMarkers;
      return renderBlock(u, b, i, lang, m ? `<span class="mks">${m}</span>` : '', c.recall.filter((r) => r.answer_blocks[0] === b.id));
    })
    .join('');

  const sources = c.sources
    .map((s) => {
      const src = tax.sources[s.id];
      return `<a href="${esc(src.url)}" rel="noopener">${rich(src.provider, 'en')}, “${rich(src.title, 'en')}”</a>`;
    })
    .join(' · ');
  const bg = linkItems(u.prerequisites, lang);
  const rel = linkItems(u.related, lang);
  const toc = c.blocks.map((b, i) => `<li><a href="#${u.id}-b-${b.id}"><span class="num">${ROMAN[i] || i + 1}</span> ${bi(b.title)}</a></li>`).join('') +
    `<li><a href="#${u.id}-ex"><span class="num">${ROMAN[c.blocks.length] || ''}</span> ${esc(t.examples)}</a></li>`;

  return `<section class="unit tone-${tone(u.category)}" id="unit-${u.id}" data-unit="${u.id}" data-tv="${c.target_version}" aria-labelledby="h-${u.id}">
<aside class="u-side" aria-label="${esc(t.status)} · ${u.id}">
  <div class="status-box" data-status-for="${u.id}" data-variant="seal"><noscript><p class="muted small">${esc(t.statusUnavailable)}</p></noscript></div>
  ${first ? explainToggle(lang) : ''}
  <nav class="u-toc" aria-label="${esc(t.onThisPage)} · ${u.id}"><h4>${esc(t.onThisPage)}</h4><ul>${toc}</ul></nav>
  ${bg ? `<h4>${esc(t.background)}</h4><ul class="links">${bg}</ul>` : ''}
  ${rel ? `<h4>${esc(t.related)}</h4><ul class="links">${rel}</ul>` : ''}
</aside>
<article class="sheet">
  ${corners}
  <div class="sheet-top">
    <p class="meta"><span class="uid">${u.id}</span> <span>${esc(STAGE[u.stage][lang])}</span> · <span>${esc(memoryType(u.memory_type, lang))}</span>${c.review_status !== 'published' ? ` <span class="badge-draft">${esc(t.draftBadge)}</span>` : ''}</p>
    <div class="sheet-actions">
      <div class="status-box" data-status-for="${u.id}" data-variant="mini"></div>
      <button class="btn-recite" type="button" data-recite="${u.id}" aria-pressed="false" hidden>${ICON.qalam}<span class="rl">${esc(t.recite)}</span>${t.reciteAr ? ` <span lang="ar" class="rl-ar">${esc(t.reciteAr)}</span>` : ''}</button>
    </div>
  </div>
  <${H} id="h-${u.id}" class="unit-title"><span class="t-ar" lang="ar" dir="rtl">${esc(u.arabic_name)}</span> <span class="t-en" lang="en" dir="ltr">${esc(u.english_name)}</span></${H}>
  <p class="translit" lang="ar-Latn">${esc(c.transliteration)}</p>
  ${divider}
  <div class="target"><p class="target-label"><span class="sc">${esc(t.toMemorize)}</span> · <span class="scope">${esc(SCOPE_LABEL[c.scope_label][lang])}</span></p>${bi(c.target, 'p')}<span class="mks">${marker(notes[0])}</span></div>
  <div class="recite-bar" hidden></div>
  <div class="blocks">${blocks}</div>
  <div class="round-done" hidden></div>
  <div class="examples" id="${u.id}-ex">
    <h3 class="secthead"><span class="num">${ROMAN[c.blocks.length] || ''}</span> ${esc(t.examples)}${t.examplesAr ? ` <span lang="ar" class="sh-ar">${esc(t.examplesAr)}</span>` : ''}</h3>
    ${c.examples.map((ex) => `<div class="ex"><p class="ex-ar" lang="ar" dir="rtl">${esc(ex.ar)}</p><p class="ex-en" lang="en" dir="ltr">${rich(ex.en, 'en')}</p>${ex.note ? `<p class="ex-note">${bi(ex.note)}</p>` : ''}</div>`).join('')}
  </div>
  <p class="veiled-note" hidden>${esc(t.veiled)}</p>
  <button class="sharh-open" type="button" aria-controls="sharh-${u.id}"><span class="sh-ar" lang="ar">شرح</span><span>${esc(t.sharhOpen(notes.length))}</span></button>
  <footer class="sheet-foot"><span>${esc(t.sources)}: ${sources}</span><span>${esc(t.revision(c.revision, c.target_version))} · <a href="${reportUrl(u, c)}" rel="noopener">${esc(t.report)}</a></span></footer>
</article>
<aside class="u-sharh" id="sharh-${u.id}" aria-label="${esc(t.sharh)} · ${u.id}">
  <div class="sharh-head"><p><span class="sc">${esc(t.sharh)}</span>${t.sharhAr ? ` <span lang="ar" class="sh-ar">${esc(t.sharhAr)}</span>` : ''}</p><button class="iconbtn sharh-close" type="button" aria-label="${esc(t.close)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>
  ${notes.map((n) => `<div class="note" id="${n.id}" tabindex="-1"><span class="mk" aria-hidden="true">${num(n.n, lang)}</span><div><p class="nt">${esc(n.title)}</p><div class="nx">${n.body}</div></div></div>`).join('')}
</aside>
</section>`;
}

// ---------- pages ----------

const fihrisRow = (u, lang) =>
  `<li data-id="${u.id}" class="tone-${tone(u.category)}"><a href="${url.unit(lang, u.id)}"><span class="uid">${u.id}</span><span class="f-ar" lang="ar" dir="rtl">${esc(u.arabic_name)}</span><span class="f-lead" aria-hidden="true"></span><span class="f-en" lang="en">${esc(u.english_name)}</span></a></li>`;

let count = 0;
for (const lang of LOCALES) {
  const t = UI[lang];
  const data = catalog(lang);
  const stages = Object.keys(STAGE).filter((s) => published.some((u) => u.stage === s));
  const types = [...new Set(published.map((u) => u.memory_type))];
  const opt = (vals) => vals.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');

  // Home
  write(`${lang}/index.html`, layout({
    lang, title: t.siteTagline, path: url.home(lang), pageType: 'home', data, headSearch: false,
    body: `<section class="hero wrap">
  <p class="hero-mark" lang="ar" aria-hidden="true">محفوظ</p>
  <h1 class="hero-title">${esc(t.siteTagline)}</h1>
  <p class="lead">${esc(t.homeLead)}</p>
  <form class="search big" action="${url.reference(lang)}" role="search">
    <label class="vh" for="q">${esc(t.searchLabel)}</label>
    <div class="search-row">${ICON.search}<input id="q" name="q" type="search" autocomplete="off" placeholder="${esc(t.searchPlaceholder)}" dir="auto"><button class="btn btn-primary">${esc(t.searchButton)}</button></div>
  </form>
  <p class="actions"><a class="btn" href="${url.reference(lang)}">${esc(t.browse)}</a> <a class="btn" href="${url.checklist(lang)}">${esc(t.openChecklist)}</a></p>
  ${divider}
</section>
<section class="fihris wrap" aria-labelledby="fh">
  <h2 id="fh" class="fihris-title"><span class="sc">${esc(t.contents)}</span>${lang === 'en' ? ' <span lang="ar">الفهرس</span>' : ''} <span class="muted small">${esc(t.unitsAvailable(num(published.length, lang), num(pages.length, lang)))}</span></h2>
  <div class="fihris-cols">${categories
      .map((c) => `<div class="f-cat tone-${tone(c)}"><h3><span class="swatch" aria-hidden="true"></span>${esc(cat(c, lang))}</h3><ol>${published.filter((u) => u.category === c).map((u) => fihrisRow(u, lang)).join('')}</ol></div>`)
      .join('')}</div>
</section>`,
  }));

  // Reference index
  write(`${lang}/reference/index.html`, layout({
    lang, title: t.referenceTitle, path: url.reference(lang), pageType: 'reference', data, headSearch: false,
    body: `<div class="wrap">
<h1 class="page-h">${esc(t.referenceTitle)}</h1>
<form class="search filters" role="search" id="ref-form">
  <label class="vh" for="q">${esc(t.searchLabel)}</label>
  <div class="search-row">${ICON.search}<input id="q" name="q" type="search" autocomplete="off" placeholder="${esc(t.searchPlaceholder)}" dir="auto"><button class="btn btn-primary">${esc(t.searchButton)}</button></div>
  <div class="filter-row">
    <label>${esc(t.filterCategory)} <select name="category"><option value="">${esc(t.filterAll)}</option>${opt(categories.map((c) => [c, cat(c, lang)]))}</select></label>
    <label>${esc(t.filterStage)} <select name="stage" aria-describedby="stage-help"><option value="">${esc(t.filterAll)}</option>${opt(stages.map((s) => [s, STAGE[s][lang]]))}</select></label>
    <label>${esc(t.filterType)} <select name="type"><option value="">${esc(t.filterAll)}</option>${opt(types.map((m) => [m, memoryType(m, lang)]))}</select></label>
    <button type="reset" class="btn btn-link" id="clear">${esc(t.clearFilters)}</button>
  </div>
  <p id="stage-help" class="muted small">${esc(t.stageHelp)}</p>
</form>
<p id="result-count" class="result-count" role="status" aria-live="polite">${esc(t.resultsCount(lang === 'ar' ? AR_DIGITS(published.length) : published.length))}</p>
<div id="no-results" class="empty-state" hidden><p><strong>${esc(t.noResults)}</strong></p><p>${esc(t.noResultsHelp)}</p></div>
<div id="search-error" class="empty-state" hidden><p>${esc(t.searchError)}</p></div>
<ol class="unit-list" id="unit-list">${published
      .map((u) => `<li data-id="${u.id}" class="tone-${tone(u.category)}"><a href="${url.unit(lang, u.id)}"><span class="uid">${u.id}</span><span class="f-ar" lang="ar" dir="rtl">${esc(u.arabic_name)}</span><span class="f-lead" aria-hidden="true"></span><span class="f-en" lang="en">${esc(u.english_name)}</span></a><p class="ul-sum">${rich(units.get(u.id).summary[lang], lang)}</p><p class="ul-meta"><span class="swatch" aria-hidden="true"></span>${esc(cat(u.category, lang))} · ${esc(STAGE[u.stage][lang])} · ${esc(memoryType(u.memory_type, lang))}</p></li>`)
      .join('')}</ol>
</div>`,
  }));

  // Reference pages
  pages.forEach((p, pi) => {
    const prev = pages[pi - 1];
    const next = pages[pi + 1];
    const pn = (q, label, cls) => (q ? `<a class="${cls}" href="${url.page(lang, q.slug)}"><small>${esc(label)} · ${q.units.map((x) => x.id).join(' · ')}</small><span lang="ar" dir="rtl">${esc(q.title.ar)}</span></a>` : '<span></span>');
    write(`${lang}/reference/${p.slug}/index.html`, layout({
      lang, title: L(p.title, lang), path: url.page(lang, p.slug), pageType: 'unit',
      body: `<div class="wrap-wide">
<nav class="crumbs" aria-label="breadcrumb"><a href="${url.reference(lang)}">${esc(t.referenceTitle)}</a> › ${esc(cat(p.category, lang))}</nav>
${p.units.length > 1 ? `<header class="page-head"><h1 class="page-title"><span lang="ar" dir="rtl">${esc(p.title.ar)}</span> <span lang="en" class="muted">${esc(p.title.en)}</span></h1><ul class="page-toc">${p.units.map((u) => `<li><a href="#unit-${u.id}"><span class="uid">${u.id}</span> ${ar(u.arabic_name)}</a></li>`).join('')}</ul></header>` : ''}
${p.units.map((u, i) => renderUnit(u, lang, { single: p.units.length === 1, first: i === 0 })).join('\n')}
<nav class="pn" aria-label="${esc(t.previous)} / ${esc(t.next)}">${pn(prev, t.previous, 'pn-prev')}${pn(next, t.next, 'pn-next')}</nav>
</div>`,
    }));
    count++;
  });

  // Checklist
  write(`${lang}/checklist/index.html`, layout({
    lang, title: t.checklistTitle, path: url.checklist(lang), pageType: 'checklist', data,
    body: `<div class="wrap-wide">
<h1 class="page-h">${esc(t.checklistTitle)}</h1>
<p class="lead-s">${esc(t.checklistIntro)}</p>
<noscript><p class="empty-state">${esc(t.statusUnavailable)}</p></noscript>
<div id="checklist" class="cl" hidden>
  <section class="cl-over sheet-lite">
    <div class="rosette" id="rosette"></div>
    <p id="cl-summary" class="cl-summary" role="status"></p>
    <p class="muted small">${esc(t.storageNotice)}</p>
  </section>
  <section class="cl-list">
    <form class="filter-row" id="cl-form">
      <label>${esc(t.filterStatus)} <select name="status"><option value="">${esc(t.filterAll)}</option><option value="not_started">${esc(t.statusNot)}</option><option value="learning">${esc(t.statusLearning)}</option><option value="memorized">${esc(t.statusMemorized)}</option><option value="updated">${esc(t.filterUpdated)}</option></select></label>
      <label>${esc(t.filterCategory)} <select name="category"><option value="">${esc(t.filterAll)}</option>${opt(categories.map((c) => [c, cat(c, lang)]))}</select></label>
      <label>${esc(t.filterStage)} <select name="stage"><option value="">${esc(t.filterAll)}</option>${opt(stages.map((s) => [s, STAGE[s][lang]]))}</select></label>
      <label>${esc(t.sortBy)} <select name="sort"><option value="reference">${esc(t.sortReference)}</option><option value="recent">${esc(t.sortRecent)}</option><option value="oldest">${esc(t.sortOldestReview)}</option></select></label>
    </form>
    <div id="cl-empty" class="empty-state" hidden><p>${esc(t.checklistEmpty)}</p><p><a class="btn" href="${url.reference(lang)}">${esc(t.browse)}</a></p></div>
    <div id="cl-groups"></div>
  </section>
  <section class="backup" id="backup">
    <h2>${esc(t.backupTitle)}</h2>
    ${explainToggle(lang)}
    <p class="backup-btns"><button type="button" class="btn" id="export">${esc(t.exportBackup)}</button> <label class="btn" for="import-file">${esc(t.importBackup)}</label><input type="file" id="import-file" accept="application/json,.json" class="vh"></p>
    <div id="import-preview" class="notice" hidden><p id="import-text"></p><p><button type="button" class="btn" id="import-export-first">${esc(t.importExportFirst)}</button> <button type="button" class="btn btn-primary" id="import-confirm">${esc(t.importConfirm)}</button> <button type="button" class="btn btn-link" id="import-cancel">${esc(t.importCancel)}</button></p></div>
    <p id="backup-msg" role="status" aria-live="polite"></p>
    <p><button type="button" class="btn btn-danger" id="reset">${esc(t.resetAll)}</button></p>
  </section>
</div>
</div>`,
  }));

  // Glossary
  write(`${lang}/glossary/index.html`, layout({
    lang, title: t.glossaryTitle, path: url.glossary(lang), pageType: 'glossary',
    body: `<div class="wrap">
<h1 class="page-h">${esc(t.glossaryTitle)}</h1><p class="lead-s">${esc(t.glossaryIntro)}</p>${explainToggle(lang)}
<ul class="page-toc">${conceptIds.map((id) => `<li><a href="#${id}"><span class="uid">${id}</span> ${lang === 'ar' ? ar(conceptById.get(id).arabic_name) : esc(conceptById.get(id).english_name)}</a></li>`).join('')}</ul>
${conceptIds
      .map((id) => {
        const s = conceptById.get(id);
        const c = concepts.get(id);
        const terms = c.terms?.length
          ? `<dl class="terms">${c.terms.map((x) => `<div><dt lang="ar" dir="rtl">${esc(x.ar)}</dt><dd>${bi(x.gloss)}</dd></div>`).join('')}</dl>`
          : '';
        return `<section class="concept sheet" id="${id}" tabindex="-1">${corners}<h2><span class="uid">${id}</span> <span lang="ar" dir="rtl" class="c-title-ar">${esc(s.arabic_name)}</span> <span lang="en" class="muted">${esc(s.english_name)}</span></h2>${biParas(c.body)}${terms}</section>`;
      })
      .join('')}
</div>`,
  }));

  // About
  write(`${lang}/about/index.html`, layout({
    lang, title: t.aboutTitle, path: url.about(lang), pageType: 'about',
    body: `<div class="wrap narrow"><article class="sheet prose">${corners}<h1 class="page-h">${esc(t.aboutTitle)}</h1>${divider}${ABOUT[lang].map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((p) => `<p>${rich(p, lang)}</p>`).join('')}`).join('')}</article></div>`,
  }));
}

// Root: pick a locale. Explicit choice (stored) wins, then browser language, then English.
write('index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Mahfudh · محفوظ</title>
<script>var l='en';try{var p=JSON.parse(localStorage.getItem('mahfudh:v1:prefs')||'{}');if(p.locale==='ar'||p.locale==='en')l=p.locale;else if((navigator.language||'').slice(0,2)==='ar')l='ar';}catch(e){if((navigator.language||'').slice(0,2)==='ar')l='ar';}location.replace('${BASE}'+l+'/');</script>
</head><body><p><a href="${BASE}en/">English</a> · <a href="${BASE}ar/" lang="ar">العربية</a></p></body></html>`);

write('404.html', layout({
  lang: 'en', title: UI.en.notFound, path: `${BASE}en/`, alt: `${BASE}ar/`, pageType: '404',
  body: `<div class="wrap narrow"><article class="sheet">${corners}<h1 class="page-h">${esc(UI.en.notFound)}</h1><p>${esc(UI.en.notFoundBody)}</p><p><a class="btn" href="${url.reference('en')}">${esc(UI.en.browse)}</a> <a class="btn" lang="ar" href="${url.reference('ar')}">${esc(UI.ar.browse)}</a></p></article></div>`,
}));
write('robots.txt', 'User-agent: *\nDisallow: /\n');
write('.nojekyll', '');

console.log(`Built ${published.length} units on ${pages.length} pages (${count} page renders), ${conceptIds.length} concepts → dist/${partial && errors.length ? `  [partial: ${errors.length} item(s) skipped]` : ''}`);
