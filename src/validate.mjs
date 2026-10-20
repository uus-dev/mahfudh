// Validates taxonomy + authored content. Used by the build and runnable on its own:
//   node src/validate.mjs [UNIT_ID ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const TEMPLATES = ['list', 'paradigm', 'pattern', 'rule'];
export const SCOPE_LABELS = ['core_list', 'extended_list', 'selected_list', 'selected_patterns', 'paradigm', 'conditions', 'rule_package'];
export const REVIEW_STATES = ['draft', 'arabic_review', 'bilingual_review', 'ready', 'published'];

export function loadTaxonomy() {
  return JSON.parse(readFileSync(join(ROOT, 'arabic_grammar_memory_taxonomy.json'), 'utf8'));
}

export function releaseUnits(tax) {
  return tax.units.filter((u) => u.release === 'First release');
}

function readJson(path, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${path}: ${e.message}`);
    return null;
  }
}

const ARABIC = /[؀-ۿ]/;

function bi(v, where, errors, { arabicInAr = true } = {}) {
  if (!v || typeof v !== 'object' || typeof v.en !== 'string' || typeof v.ar !== 'string' || !v.en.trim() || !v.ar.trim()) {
    errors.push(`${where}: needs non-empty {en, ar}`);
    return;
  }
  if (arabicInAr && !ARABIC.test(v.ar)) errors.push(`${where}.ar: contains no Arabic`);
}

function biList(v, where, errors, { allowEmpty = false } = {}) {
  if (!v || !Array.isArray(v.en) || !Array.isArray(v.ar)) {
    errors.push(`${where}: needs {en: [...], ar: [...]}`);
    return;
  }
  if (!allowEmpty && (!v.en.length || !v.ar.length)) errors.push(`${where}: must not be empty`);
  for (const s of [...v.en, ...v.ar]) if (typeof s !== 'string' || !s.trim()) errors.push(`${where}: entries must be non-empty strings`);
}

function arStr(v, where, errors) {
  if (typeof v !== 'string' || !v.trim()) errors.push(`${where}: needs non-empty Arabic string`);
  else if (!ARABIC.test(v)) errors.push(`${where}: contains no Arabic`);
}

export function validateUnit(u, taxUnit, tax, errors) {
  const w = u?.id ?? '?';
  if (!u) return;
  if (u.id !== taxUnit.id) errors.push(`${w}: id does not match file name (${taxUnit.id})`);
  for (const k of ['target_version', 'revision']) if (!Number.isInteger(u[k]) || u[k] < 1) errors.push(`${w}.${k}: positive integer required`);
  if (!REVIEW_STATES.includes(u.review_status)) errors.push(`${w}.review_status: one of ${REVIEW_STATES}`);
  if (!TEMPLATES.includes(u.template)) errors.push(`${w}.template: one of ${TEMPLATES}`);
  if (!SCOPE_LABELS.includes(u.scope_label)) errors.push(`${w}.scope_label: one of ${SCOPE_LABELS}`);
  if (typeof u.transliteration !== 'string' || !u.transliteration.trim()) errors.push(`${w}.transliteration: required`);
  bi(u.summary, `${w}.summary`, errors);
  bi(u.target, `${w}.target`, errors);

  const blockIds = new Set();
  if (!Array.isArray(u.blocks) || !u.blocks.length) errors.push(`${w}.blocks: at least one block`);
  for (const [i, b] of (u.blocks || []).entries()) {
    const bw = `${w}.blocks[${b?.id ?? i}]`;
    if (!b?.id || !/^[a-z0-9-]+$/.test(b.id)) errors.push(`${bw}.id: lowercase slug required`);
    if (blockIds.has(b.id)) errors.push(`${bw}: duplicate block id`);
    blockIds.add(b.id);
    bi(b.title, `${bw}.title`, errors);
    if (b.notes) biList(b.notes, `${bw}.notes`, errors, { allowEmpty: true });
    if (b.kind === 'table') {
      if (!Array.isArray(b.columns) || !b.columns.length) errors.push(`${bw}.columns: required`);
      const keys = new Set();
      for (const c of b.columns || []) {
        if (!c.key) errors.push(`${bw}: column without key`);
        keys.add(c.key);
        if (!['ar', 'bi'].includes(c.lang)) errors.push(`${bw}.columns[${c.key}].lang: 'ar' or 'bi'`);
        bi(c.label, `${bw}.columns[${c.key}].label`, errors);
      }
      if (b.row_header && !keys.has(b.row_header)) errors.push(`${bw}.row_header: unknown column`);
      if (!Array.isArray(b.rows) || !b.rows.length) errors.push(`${bw}.rows: required`);
      for (const [ri, r] of (b.rows || []).entries()) {
        for (const k of Object.keys(r)) if (!keys.has(k)) errors.push(`${bw}.rows[${ri}]: unknown key ${k}`);
        for (const c of b.columns || []) {
          const v = r[c.key];
          if (v === undefined || v === null || v === '') continue; // empty cell renders as a dash
          if (c.lang === 'ar') {
            if (typeof v !== 'string') errors.push(`${bw}.rows[${ri}].${c.key}: Arabic column takes a string`);
          } else bi(v, `${bw}.rows[${ri}].${c.key}`, errors, { arabicInAr: false });
        }
      }
    } else if (b.kind === 'rules') {
      if (!Array.isArray(b.items) || !b.items.length) errors.push(`${bw}.items: required`);
      for (const [ii, it] of (b.items || []).entries()) {
        bi(it.label, `${bw}.items[${ii}].label`, errors, { arabicInAr: false });
        bi(it.text, `${bw}.items[${ii}].text`, errors);
        if (it.ar_example !== undefined) arStr(it.ar_example, `${bw}.items[${ii}].ar_example`, errors);
      }
    } else errors.push(`${bw}.kind: 'table' or 'rules'`);
  }

  biList(u.explanation, `${w}.explanation`, errors);
  if (!Array.isArray(u.examples) || u.examples.length < 2) errors.push(`${w}.examples: at least two`);
  for (const [i, ex] of (u.examples || []).entries()) {
    arStr(ex.ar, `${w}.examples[${i}].ar`, errors);
    if (typeof ex.en !== 'string' || !ex.en.trim()) errors.push(`${w}.examples[${i}].en: translation required`);
    if (ex.note) bi(ex.note, `${w}.examples[${i}].note`, errors, { arabicInAr: false });
  }
  biList(u.caveats, `${w}.caveats`, errors, { allowEmpty: true });
  bi(u.convention, `${w}.convention`, errors);

  if (!Array.isArray(u.recall) || !u.recall.length) errors.push(`${w}.recall: at least one prompt`);
  for (const [i, r] of (u.recall || []).entries()) {
    bi(r.prompt, `${w}.recall[${i}].prompt`, errors);
    if (!Array.isArray(r.answer_blocks) || !r.answer_blocks.length) errors.push(`${w}.recall[${i}].answer_blocks: required`);
    for (const id of r.answer_blocks || []) if (!blockIds.has(id)) errors.push(`${w}.recall[${i}]: unknown block ${id}`);
  }

  if (!Array.isArray(u.sources) || !u.sources.length) errors.push(`${w}.sources: at least one`);
  for (const s of u.sources || []) if (!tax.sources[s.id]) errors.push(`${w}.sources: unknown source ${s.id}`);
  if (u.extra_aliases && !Array.isArray(u.extra_aliases)) errors.push(`${w}.extra_aliases: array`);
}

export function validateConcept(c, id, errors) {
  if (!c) return;
  if (c.id !== id) errors.push(`${id}: id mismatch`);
  if (!REVIEW_STATES.includes(c.review_status)) errors.push(`${id}.review_status: one of ${REVIEW_STATES}`);
  biList(c.body, `${id}.body`, errors);
  if (c.terms) {
    for (const [i, t] of c.terms.entries()) {
      arStr(t.ar, `${id}.terms[${i}].ar`, errors);
      bi(t.gloss, `${id}.terms[${i}].gloss`, errors, { arabicInAr: false });
    }
  }
}

// Returns { units: Map(id -> content), concepts: Map(id -> content), errors: [] }.
export function loadContent({ only } = {}) {
  const tax = loadTaxonomy();
  const errors = [];
  const units = new Map();
  const concepts = new Map();

  const ids = new Set(tax.units.map((u) => u.id));
  if (ids.size !== tax.units.length) errors.push('taxonomy: duplicate unit ids');
  for (const u of tax.units) {
    for (const r of [...u.prerequisites, ...u.related]) {
      if (!ids.has(r) && !tax.supporting_concepts.some((s) => s.id === r)) errors.push(`taxonomy ${u.id}: unresolved link ${r}`);
    }
    for (const s of u.source_ids) if (!tax.sources[s]) errors.push(`taxonomy ${u.id}: unknown source ${s}`);
  }

  for (const tu of releaseUnits(tax)) {
    if (only && !only.includes(tu.id)) continue;
    const p = join(ROOT, 'content', 'units', `${tu.id}.json`);
    if (!existsSync(p)) {
      errors.push(`${tu.id}: missing content/units/${tu.id}.json`);
      continue;
    }
    const c = readJson(p, errors);
    validateUnit(c, tu, tax, errors);
    if (c) units.set(tu.id, c);
  }
  for (const s of tax.supporting_concepts) {
    if (only && !only.includes(s.id)) continue;
    const p = join(ROOT, 'content', 'concepts', `${s.id}.json`);
    if (!existsSync(p)) {
      errors.push(`${s.id}: missing content/concepts/${s.id}.json`);
      continue;
    }
    const c = readJson(p, errors);
    validateConcept(c, s.id, errors);
    if (c) concepts.set(s.id, c);
  }
  const stray = readdirSync(join(ROOT, 'content', 'units')).filter((f) => !releaseUnits(tax).some((u) => `${u.id}.json` === f));
  for (const f of stray) errors.push(`content/units/${f}: not a first-release unit`);

  return { tax, units, concepts, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2);
  const { units, concepts, errors } = loadContent({ only: only.length ? only : undefined });
  if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`\n${errors.length} problem(s).`);
    process.exit(1);
  }
  console.log(`OK: ${units.size} units, ${concepts.size} concepts.`);
}
