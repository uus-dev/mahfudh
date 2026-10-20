# Rasikh · راسخ

A bilingual (Arabic/English) reference for the bounded parts of Arabic grammar that students memorise — closed lists, paradigms, patterns and compact rules — with a private, browser-local checklist.

**Status:** all content is a first draft and has **not** been reviewed by an Arabic specialist. Every page shows a draft banner and the site is excluded from search engines (`noindex`, `robots.txt`) until review is done.

## Documents

- [`arabic_grammar_memory_reference_PRD_v0.1.md`](arabic_grammar_memory_reference_PRD_v0.1.md) — product requirements.
- [`arabic_grammar_memory_taxonomy.json`](arabic_grammar_memory_taxonomy.json) — **source of truth** for unit IDs, pages, stages, release flags, sources and search aliases (100 units; 32 in the first release).
- [`arabic_grammar_memory_taxonomy.md`](arabic_grammar_memory_taxonomy.md) — human-readable companion. Edit the JSON, not this.

## Layout

```
content/units/<ID>.json      teaching content for each first-release unit (A01 … I02)
content/concepts/<ID>.json   supporting concepts S01–S12 (glossary, no checklist status)
src/validate.mjs             schema + cross-reference checks
src/build.mjs                static site generator → dist/
src/i18n.mjs                 interface strings and label translations
src/serve.mjs                local preview server
assets/style.css, app.js     styling and browser enhancements (status, recall, search, backup)
```

The build reads the taxonomy and the content files and writes plain HTML for `/en/` and `/ar/`. Reference content is fully readable without JavaScript; the script adds search, filters, status, recall and backup. Progress is stored only in the browser's `localStorage`.

## Working locally

```sh
npm install
npm run validate                       # schema and link checks
BASE=/rasikh/ npm run build            # full build (fails on any missing or invalid content)
BASE=/rasikh/ npm run preview          # http://localhost:4321/rasikh/
node src/build.mjs --partial           # preview while some content files are still missing
```

## Editing content

Each unit file follows the structure of [`content/units/D01.json`](content/units/D01.json):

- `target` — exactly what the checklist status covers. Changing what a student must recall means bumping `target_version`; any other edit bumps `revision` only.
- `blocks` — the reference material: `table` blocks (columns are `ar` = Arabic string or `bi` = `{en, ar}`) and `rules` blocks.
- `explanation`, `examples` (≥ 2), `caveats`, `convention`, `recall` (prompts point to block IDs), `sources` (IDs from the taxonomy).
- `review_status` — `draft` → `arabic_review` → `bilingual_review` → `ready` → `published`.

Run `npm run validate` after editing. Corrections from readers arrive as GitHub issues labelled `content`, pre-filled with the unit ID and revision.

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`: validate, build with `BASE=/rasikh/`, and deploy to GitHub Pages (Settings → Pages → Source: GitHub Actions).
