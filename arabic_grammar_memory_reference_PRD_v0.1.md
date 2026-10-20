# Arabic Grammar Memory Reference
## Product requirements document
**Version 0.1 · 28 September 2026 · Draft for product review**

### Product definition
A bilingual, curriculum-independent website for looking up, memorizing, and revisiting the bounded grammatical lists, paradigms, patterns, and compact rule packages that students encounter in their Arabic studies.

**The core job:** “Help me find the material my teacher or book expects me to remember, see exactly what that includes, and keep a personal record of what I am learning.”

The website is a reference with a personal checklist. It is not a curriculum, a general Arabic-learning application, or a sentence-analysis platform. A student should obtain value from a single lookup without signing in, following a course, or completing an exercise.

### Planning baseline
| Item | Baseline |
| --- | --- |
| Full content map | 100 proposed units grouped into 81 parent pages |
| Proposed public MVP | 32 units grouped into 29 parent pages |
| Supporting material | 12 short concepts/glossary entries; not tracked units |
| Languages | Canonical Arabic terminology; Arabic and English explanations |
| Main interaction | Find → read → optionally recall → record status → revisit |
| Content readiness | Taxonomy exists; teaching content is not yet approved |

Counts and content status come from the supplied taxonomy v0.1. These are editorial planning quantities, not a claim of comprehensive coverage of Arabic grammar. [S1]

### How to read this document
**Established intent** means a constraint expressed or accepted in the product discussion. **Proposed baseline** means a recommendation introduced here so the product can be specified coherently. **Open decision** means an owner must approve or replace the proposal before the relevant release gate.

“Must” requirements apply to the proposed baseline once adopted; they do not imply that the owner has already approved every implementation choice. No budget, launch date, commercial model, or technology vendor is assumed.

**Document owner:** Product owner, to be assigned. **Required reviewers:** Arabic editorial lead, bilingual editor, design lead, and engineering lead. Named assignments and approval are pending.

---

# 1. Problem, users, and desired outcomes
### Problem statement
The founding hypothesis is that students need a dependable way to retrieve compact grammatical material encountered elsewhere, without searching through a complete course or reconstructing lists from scattered notes. The product discussion establishes this intended problem; it does not establish market size, willingness to pay, or superiority over existing references.

A second hypothesis is that a consistent presentation and a lightweight checklist will make the reference useful enough to revisit. These hypotheses require testing with students and teachers; the PRD does not treat them as validated findings.

### Primary users
**Student studying through English.** Already learning Arabic through a teacher, textbook, or course. Needs English explanations, Arabic terminology, transliteration-tolerant search, and an explicit memorization target.

**Student studying through Arabic.** Needs concise Arabic reference material, clear conventions, and the same lookup/checklist functions. Arabic language preference must not be treated as evidence of advanced grammar proficiency.

**Secondary user: teacher or tutor.** Needs to inspect a source-labelled reference and share a specific unit. Does not need a classroom dashboard in the MVP.

**Internal user: content editor/reviewer.** Needs to author, check, revise, publish, and withdraw bounded reference material without silently changing a student's recorded memorization target.

### Jobs to be done
| Situation | Required outcome |
| --- | --- |
| “We studied this today.” | Find the named set and identify its scope immediately. |
| “I forgot one member or condition.” | Retrieve the exact information without an exercise gate. |
| “I need to memorize this.” | See the complete target; optionally hide and reveal it. |
| “What am I currently working on?” | Filter a personal checklist by status and topic. |
| “My teacher gives a different list.” | See the adopted convention and any relevant alternative. |

### Goals and boundaries
The MVP should make lookup fast, memorization targets unambiguous, status recording understandable, and content trustworthy. It should work independently of a particular curriculum and on both mobile and desktop.

It does not claim to verify retention, certify grammar competence, improve examination results, or replace practice applying rules. A short, successful lookup is a good outcome; long sessions, daily streaks, and high checkbox counts are not goals.

### Inclusion rule
An item belongs when it is a bounded grammatical list, paradigm, pattern, selected exception set, or compact rule package. A conceptual explanation belongs only as supporting material unless it has a separately defined recall target. General vocabulary and comprehensive lessons do not qualify merely because students study them.

---

# 2. Scope and proposed product decisions
### Established product constraints
Retain the narrow reference-and-checklist proposition, Arabic terminology as the shared foundation, bilingual usefulness, clear examples, a non-game presentation, and student-directed navigation. Approximate stages are browsing aids, not a required learning sequence. Progress belongs to a memorization unit, not to every page or index where it appears. [S1]

### Proposed MVP baseline — approval required
| Decision | Proposal | Consequence |
| --- | --- | --- |
| DEC-01 · Access and persistence | No accounts; save progress in the current browser. | No automatic cross-device synchronization. |
| DEC-02 · Recall support | Include optional hide/reveal and an explicit “Reviewed today” action. | No grading, timed test, exercise bank, or scheduling. |
| DEC-03 · Language | Fully support English and Arabic interface routes; offer English, Arabic, or both explanations. | Both-language content review is a launch dependency. |
| DEC-04 · Progress recovery | Provide local JSON backup and restore. | Data portability without an account system. |
| DEC-05 · Publishing | Use structured, version-controlled content with a reviewed publishing workflow. | No custom visual CMS required for launch. |
| DEC-06 · Access model | No payment or registration gate in the public pilot. | Long-term funding and pricing remain open. |
| DEC-07 · Measurement | Use a consented pilot; do not enable persistent behavioral tracking by default. | Return-use evaluation relies on pilot follow-up. |

### P0: required for the proposed public MVP
The 32-unit release; supporting definitions; search and filters; accessible reference pages; bilingual presentation; unit-level statuses; optional recall; local persistence and backup; stable sharing links; source/convention notes; correction reporting; publication validation; and the quality gates in this document.

Basic browser printing is included as a modest reference function. Bespoke PDF generation, print workbooks, and question sheets are not.

### Deferred, not prerequisites
Accounts and cloud sync; custom collections; scheduled or adaptive review; reminders; teacher assignment tools; advanced interactive diagrams; audio; expanded morphology; a complete 100-unit library; a custom CMS; and a full offline application.

### Explicit non-goals
A new curriculum, vocabulary trainer, unrestricted iʿrāb analyzer, generated answer checker, chat tutor, gamification, certificates, dialect course, social feed, public user-authored material, or an automated claim that a student has mastered a topic.

Scope changes must identify the user problem, new content burden, delivery impact, and what is removed or deferred. “Useful for Arabic students” is not sufficient justification on its own.

---

# 3. Information architecture and navigation
### Content hierarchy
**Category → reference page → memorization unit → structured content blocks.** A supporting concept is a separate untracked entity. A page may group several units; an index may reference the same unit in several ways without duplicating content or progress.

Use the taxonomy's ten categories: foundational maps; pronouns and closed noun sets; particles and operators; governing families; noun endings; verb conjugation and endings; word-formation patterns; weak/irregular models; compact construction rules; and numbers. Retain stable unit IDs and existing parent-page slugs. [S1]

Only published material appears in public counts, search, and checklist totals. Empty launch categories and unavailable stage options are hidden or clearly disabled. The internal 100-unit plan must not look like 100 available pages or 100 unfinished obligations.

### Main destinations
| Destination | Purpose and required elements |
| --- | --- |
| Home | One-line purpose; prominent search; Browse reference and My checklist; concise storage notice. No long onboarding gate. |
| Reference index | Published units; category, stage, and memory-type filters; published-item counts; clear reset. |
| Search results | Arabic title, English label where relevant, category, short scope description, and link to the specific unit. |
| Reference page | Unit content, sources, optional recall, statuses, and available related material. |
| My checklist | Status summary; filter/sort controls; review dates; content-update indicators; backup/settings link. |
| Glossary / supporting concepts | Brief explanations linked from reference material; no progress controls. |
| About / editorial policy | Scope, source conventions, review policy, correction process, and storage/privacy explanation. |

### Routes and link behavior
Proposed routes are `/en/reference/{page-slug}#unit-{ID}` and the corresponding `/ar/` route. A locale change preserves the page and unit anchor. The slug and unit ID do not change when titles or translations change.

Search/filter state is represented in the address where practical; personal progress is never included in shared URLs. Shared links open the relevant published unit in reference mode, not in another person's recall or checklist state.

Renamed slugs require redirects. A permanently withdrawn unit retains an explanatory destination rather than becoming a silent dead link. Related links to unpublished units are omitted or explicitly labelled unavailable, never rendered as working references.

### Navigation rules
No locked prerequisites, compulsory starting point, personalized course sequence, or proficiency test. “Helpful background” links are advisory. Foundation/Core/Further labels always have an accessible explanation that placement varies by curriculum.

---

# 4. Core user journeys
### Journey A · A single lookup
A student follows a teacher's link or searches for a term. The page opens with the Arabic heading and relevant memorization target visible. The student reads the list, table, or rule and leaves. No account, checklist action, or self-check is required. This is a complete successful journey.

### Journey B · Memorize a named set
The student opens a unit, reads “What this unit covers,” and studies the reference. They optionally choose “Test myself,” attempt recall privately, reveal the answer, and compare it with the source material. They explicitly choose Learning or Memorized. The interface confirms where the status is saved.

Neither opening the page nor revealing the answer changes the learning state automatically. “Memorized” describes the student's own assessment of the displayed target, not a result awarded by the system.

### Journey C · Return to current study
The student opens My checklist, filters to Learning, and chooses a unit. They can re-read it without affecting review history. An explicit “Reviewed today” action records a review date. They may change status in either direction without penalty.

No overdue count, retention prediction, required daily activity, or automatic demotion is shown. “Never recorded” is different from “never studied.”

### Journey D · Resolve a convention difference
The student notices that a teacher's list differs from the reference. They open the unit's scope and source-convention note. The note explains what the displayed target includes and points to any reviewed alternative. If the issue remains unresolved, the student can submit a correction report with the unit and revision attached.

The site does not silently merge different conventions into a supposedly universal list.

### Journey E · Use a shared device or move browsers
The student is told that progress belongs to the current browser profile. They can export a backup, clear site progress, or restore a valid backup in another browser. No automatic identity recognition or account recovery is promised.

### Journey F · Content changes after memorization
An editor changes a material part of the unit. The next visit shows “Content updated since your recorded status.” The previous status is retained and visibly qualified. The student inspects the change and explicitly confirms or updates their status for the new target.

A spelling correction that does not change the material to be remembered does not trigger the same process. Content versioning is defined in section 11.

---

# 5. Reference-page content contract
### Required structure for every published unit
| Block | Requirement |
| --- | --- |
| Identity | Stable ID; Arabic name; English name; category; approximate stage. |
| Memorization target | One explicit, bounded statement of what the status covers. |
| Scope label | Core list, extended list, selected patterns, paradigm, or conditions, as appropriate. |
| Canonical reference | Complete list/table/pattern/rule for the stated scope; readable without interaction. |
| Meaning and operation | Concise explanation in approved Arabic and English; essential conditions beside the rule. |
| Examples | At least two reviewed illustrative instances with English translations, unless a documented editorial exception is justified. |
| Caveats | Necessary restrictions, representative contrasts, and relevant convention differences. |
| Optional recall | One or more reviewed prompts that reference canonical answer blocks rather than separately copied answers. |
| Provenance | Source references, edition/location where available, review date, and content revision. |
| Connections | Published background/related units; correction-report link. |

Conditions essential to correctness must not be hidden in an advanced section. Secondary nuance may be collapsible. Longer explanation can be linked, but the bounded reference must remain complete on its own terms.

### Four presentation templates
**Finite list:** members, short meanings/functions, and any membership restrictions. **Paradigm:** labelled rows and columns, including repeated forms in distinct grammatical slots. **Pattern:** the reusable template, model forms, and limits to predictable formation. **Rule package:** trigger, result, conditions, and a contrasting instance where useful.

Do not force every topic into a row of flashcards. Visual structure should express relationships through tables, grouping, labels, and limited highlighting. Decorative illustrations are not required. Reference material must remain understandable without color alone or an image of the Arabic text.

### Example page specification: D01
The inna-family page contains the Arabic and English titles, D01's exact core target, a member/function reference, its governing-effect explanation, reviewed examples, convention/source notes, and D01 status controls. A short recall prompt can ask for members or governing effect before revealing the corresponding content.

D02 is a separate later unit on the same parent page; it is not part of the launch target or D01 completion state. This is a structural specification, not approval of the final teaching copy. [S1]

### Content size discipline
Lead with the material being looked up. Supporting explanation should answer the immediate question rather than reproduce a textbook chapter. The editorial lead may split an overgrown target, but must preserve stable IDs or supply an explicit migration.

---

# 6. Discovery and reference requirements
**All requirements below are P0 under the proposed baseline.**

### FR-01 · Browse published content
Users must browse and combine category, stage, and memory-type filters. Counts must reflect the same published catalogue shown on the screen. Clearing filters restores the complete published list.

**Acceptance:** the release fixture exposes exactly 32 units on 29 parent pages; no unpublished unit can be opened through a public index. Foundation/Core/Further must not be described as official proficiency levels.

### FR-02 · Bilingual and alias-based search
Search must accept Arabic with or without diacritics, English names, and curated common transliterations. Search should normalize query variants without altering the canonical displayed Arabic. Remove diacritics and tatweel for matching; normalize common alif variants in a secondary search form. Do not globally equate Arabic letters that can change a word; handle ambiguous variants through reviewed aliases.

Rank exact title/alias matches above partial matches and broad supporting text. Results target units, including separately tracked units on a shared page. No generated grammatical answers or automatic lexical translation is required.

**Acceptance:** every MVP unit has a reviewed Arabic and English query fixture; priority aliases and spelling variants pass the search suite. Exact title/alias queries return their intended unit first. A broad query such as “accusative particles” distinguishes noun-case contexts from imperfect-verb mood references rather than assuming one meaning.

### FR-03 · Honest empty and error states
No-results screens must preserve the query, offer clear/reset and category browsing, and say that the item may be outside the current release. Search failure must not masquerade as a valid zero-result response. A navigable reference index remains available.

**Acceptance:** an unknown query, empty catalogue filter, and simulated search failure produce distinct readable states without fabricated content.

### FR-04 · Reference access and stable links
Published content must be readable without sign-in or personal state. Deep links must identify the correct unit and preserve its anchor when switching interface language. Baseline content remains available if enhancement scripts fail; progress and recall controls may explain their unavailability.

**Acceptance:** opening a link in a clean browser displays the target unit, not a home page or onboarding flow. The shared-page status test does not confuse B02 with B03 or F02 with F05.

### FR-05 · Readable print output
Browser printing must produce a clean reference with answers visible, meaningful table headings, sources, and no checklist data or interactive chrome. It must not depend on the current hidden-answer state.

**Acceptance:** print previews of a list, a paradigm, and a shared-unit page have no cropped Arabic, missing answers, or split row labels. Bespoke document generation is excluded.

---

# 7. Recall and checklist requirements
### FR-06 · Optional hide and reveal
Reference mode shows complete content by default. “Test myself” opens a focused prompt with its answer hidden until an explicit reveal. Answer blocks must also be hidden from assistive technology before reveal. Re-entering the mode starts hidden; closing it returns to the reference.

**Acceptance:** no navigation requirement depends on testing; reveal works by keyboard and touch; the action does not record a score, change status, or create a review timestamp. Where several prompts exist, each uses approved content-block references.

### FR-07 · Explicit unit-level status
Every published unit has Not started, Learning, or Memorized as its effective state. A missing local record is treated as Not started. All transitions are permitted. “Memorized” is explicitly labelled self-reported and tied to the target currently displayed.

**Acceptance:** changing one unit updates its checklist and all appearances without changing sibling units. Reverting to Not started does not erase recorded review history; deleting all personal data is a separate action.

### FR-08 · Review dates are explicit
“Reviewed today” records the current time and target version without changing the status. Opening a page, changing filters, revealing an answer, or choosing Memorized does not automatically count as a review. Display dates in the user's local convention; store unambiguous timestamps.

**Acceptance:** when no review is recorded, display “Never recorded”; an explicit review changes that label. A prior-version review remains distinguishable from a review of the current target. A review does not automatically confirm an old Memorized status for a revised target.

### FR-09 · My checklist
Show the published catalogue with filters for Not started, Learning, Memorized, and content updates. Default to Learning when such units exist, otherwise show all. Allow category and stage filters and sorting by reference order, recently updated status, or oldest recorded review; label missing dates explicitly.

**Acceptance:** totals use published units only and do not imply verified skill. If a unit is withdrawn, its saved record is preserved outside active totals. Adding new units does not silently alter past status records. Empty states point to reference browsing, not to mandatory goals.

### FR-10 · Non-coercive progress presentation
Show simple counts and dates, not XP, streaks, competition, retention percentages, or “mastery” claims. A compact checkbox-like control may be used, but its three-state behavior must remain clear and accessible.

**Acceptance:** users can explain what Memorized covers, where it is saved, and that the system has not tested their competence. No timer or overdue language appears in the MVP.

### Subtargets
Targets such as members, meanings, effects, and conditions may be shown as an untracked checklist within a unit. Independently saved subtarget states are deferred until their behavior is specified. Do not imply that such rows have persistent progress in the MVP.

---

# 8. Persistence, backup, and failure behavior
### FR-11 · Browser-local storage
Save unit progress and display preferences in browser storage after explicit actions. Display a concise notice: “Saved in this browser only. Clearing site data or using another browser can remove or hide your progress. Export a backup to keep a copy.” Explain that private-browsing storage may be temporary. Browser storage can be unavailable and is not an account backup. [E2]

**Acceptance:** progress survives reload and ordinary browser restart in the supported test environment. A storage write failure produces a visible “Not saved” state, never a false success. Reference access remains usable; a temporary session state may continue with an explicit warning.

### FR-12 · Backup export and restore
Export a versioned JSON snapshot of preferences and progress on user request. Exclude analytics identifiers and feedback messages. Import must validate format/version and permissible values before modifying anything. Reject files above 1 MiB and files with duplicate unit records; report the reason without changing existing data.

For MVP, restore **replaces** the current snapshot after a preview and explicit confirmation; it does not attempt a complicated merge. Show the number of incoming records and offer to export the current snapshot first.

**Acceptance:** export/import round-trip preserves statuses, target versions, and timestamps. Invalid files leave existing data untouched. Unknown but well-formed unit IDs are retained as unresolved records and excluded from visible completion counts; invalid IDs are rejected. Import content must never be executed or interpreted as page markup.

### FR-13 · Reset and shared-device handling
Provide “Clear my progress and preferences” with a confirmation that names the effect. Do not infer different people using a shared browser profile. Explain the limitation and point to backup/reset controls.

**Acceptance:** reset removes the site's personal state without deleting public content. No automatic recovery is promised. Search history is not persisted by default.

### FR-14 · Version-aware progress
Store the target version associated with each status separately from the version associated with the latest explicit review. Material target changes show an update indicator without overwriting prior status. A user can explicitly confirm the same status for the new version or choose another status.

**Acceptance:** a Memorized record for version 1 remains “Memorized — earlier version” after version 2 publishes and does not count as current-version memorization. “Reviewed today” alone does not remove that distinction. Cosmetic revisions do not flag a changed target.

### Engineering edge cases
Treat storage corruption and quota failures as recoverable product states. Validate stored data before use. Preserve unaffected records during migrations; do not silently clear everything. Use per-unit updates or an equivalent conflict-safe strategy so editing different units in two tabs does not overwrite unrelated changes. For the same unit, the last successful explicit local update wins.

No automatic synchronization, browser-eviction guarantee, or full offline availability is promised.

---

# 9. Bilingual presentation and accessibility
### FR-15 · Language behavior
Arabic terminology and Arabic example text remain canonical and visible in every mode. Explanations may be English, Arabic, or Both. Interface locale and explanation preference are separate settings, not proficiency indicators.

Use supported browser language for the initial interface choice, defaulting to English otherwise; a user's explicit choice takes precedence. English mode defaults to English explanations and Arabic mode to Arabic explanations on first use. Later locale changes preserve an explicit explanation preference.

**Acceptance:** locale switching preserves the selected unit, status, filters where applicable, and explanation choice. Both displays parallel approved explanations without duplicating progress. An incomplete required translation blocks publication rather than silently showing an unreviewed or misleading fallback.

### FR-16 · Arabic typography and direction
Apply correct language and direction metadata to pages, Arabic passages, English passages, and mixed-script tokens. Numbers, IDs, brackets, and punctuation must remain in logical order. Tables must preserve semantic row/column relationships on small screens.

**Acceptance:** representative fully vocalized Arabic, attached pronouns, mixed Arabic/English explanations, and morphology patterns remain legible at mobile widths and zoom. Diacritics do not collide with clipping bounds. Text can be selected/copied rather than existing solely as an image.

### FR-17 · Accessible operation
Adopt WCAG 2.2 Level AA as the proposed accessibility target, to be tested rather than claimed in advance. Include keyboard operation, visible focus, semantic headings/tables, language-of-parts markup, appropriate contrast, reflow, and accessible names/status messages. [E1]

**Acceptance:** all principal journeys work without a mouse; modal recall controls restore focus; hidden answers are not prematurely announced; feedback, save failures, and filter results are understandable to assistive technology. Automated checks are supplemented by manual keyboard and screen-reader review in both interface languages.

### Design constraints
Use a calm reference-book presentation. Put the target material ahead of commentary. Prefer meaningful tables and consistent visual grouping over decorative diagrams. Make primary actions usable on touchscreens; do not rely on hover, color, dragging, animation, or tiny diacritic buttons.

At 320 CSS pixels, general page content must reflow without whole-page horizontal scrolling. A genuinely two-dimensional paradigm may use a labelled, keyboard-operable scrolling region, provided headings remain understandable and a stacked alternative is supplied where feasible.

### Transliteration
Show a concise title transliteration only as an optional aid; curated transliteration search aliases are more important than transliterating every example. The editorial lead must choose a consistent display convention. Do not invent pronunciation or imply an audio feature.

---

# 10. Editorial requirements and trust
### FR-18 · Publication workflow
Every unit proceeds through Draft → Arabic review → Bilingual review → Ready → Published. Revisions return through the appropriate checks. A technical workflow using structured files is acceptable; a bespoke editor interface is not required.

**Acceptance:** publication is blocked without approved target, canonical content, explanations, examples, sources, scope/convention note, reviewed recall prompts, and required translations. Grammar approval must include a qualified reviewer other than the original author. Publication records preserve reviewer, date, and revision.

### FR-19 · Source and convention transparency
Each unit identifies the source basis for its list or rule and any editorial selection. References should include edition, chapter, page, or stable online section where possible. A source URL alone does not prove that every authored sentence has been checked.

**Acceptance:** “core,” “selected,” and “extended” have explicit meanings. Relevant disagreements are explained rather than silently standardized. The taxonomy's existing source links are research leads, not automatic publication approval. The four source-gated later candidates D07, D09, G16, and G17 remain unpublished until separately sourced. [S1]

### FR-20 · Correction reporting
Every unit must provide a report action carrying its ID and published revision. The user supplies an issue category and description; contact details are optional. Reports are private to maintainers and do not publish user text directly.

**Acceptance:** successful receipt is acknowledged; submission failure preserves the entered text and provides a fallback contact route. The receiving channel must be configured and tested before launch. The product must not claim a report was delivered when it was not.

### FR-21 · Corrections and withdrawal
The editorial lead can correct or withdraw misleading material. A serious grammatical error may require immediate withdrawal pending review. Publish a concise change note; preserve stable IDs and history. Students whose saved target is materially affected receive an in-product update indicator on a later visit, not an unsolicited notification.

**Acceptance:** withdrawn content leaves a useful explanatory destination and exits active search/counts. A rollback never hides that a student previously recorded status against a different target.

### Content quality checklist
Check grammatical accuracy; completeness within scope; Arabic vocalization; natural English meaning; distinctions between noun case and verb mood; conditions and exceptions; consistency between examples and rules; accessibility of tables; and content reuse rights. New examples should be original or appropriately permissioned/attributed. Source permission and operating privacy notices require review, not assumed legal clearance.

Do not publish unreviewed generated lists, examples, translations, or answers. AI tooling is neither required nor a substitute for editorial approval.

---

# 11. Data model and version semantics
### Core content entities
| Entity | Required fields and behavior |
| --- | --- |
| Category | Stable ID; Arabic/English labels; display order. |
| ReferencePage | Stable page ID/slug; translated titles; ordered unit IDs; redirect aliases. |
| MemoryUnit | Existing unit ID; page/category; stage; type; bilingual target; scope label; content blocks; example IDs; sources; convention; aliases; prerequisite and related IDs. |
| ContentBlock | Stable block ID; list/table/pattern/rule type; language-aware content; optional reveal grouping. |
| RecallPrompt | Prompt text in both languages; answer-block references; reviewed revision. No independent generated answer key. |
| SupportingConcept | S-ID; bilingual title and concise explanation; source/review metadata. No progress state. |
| SourceReference | Existing or new source ID; bibliographic details; locator; rights/reuse note where needed. |
| PublicationRecord | Workflow state; content revision; target version; approvals; published/reviewed dates; change note. |

Taxonomy fields are imported from the supplied JSON, not manually re-entered as a second competing inventory. Publication payloads extend it with reviewed content and metadata. Prerequisite and related IDs must resolve; public rendering filters unpublished targets. [S1]

### Personal data
| Field | Meaning |
| --- | --- |
| unit_id | Stable unit key; independent of route and locale. |
| status | not_started, learning, or memorized. |
| status_target_version | Target against which the status was explicitly recorded. |
| status_updated_at | Timestamp of the latest explicit status selection/confirmation. |
| last_reviewed_at | Nullable timestamp of an explicit review. |
| last_reviewed_target_version | Nullable target version explicitly reviewed. |
| preferences | Interface locale, explanation language, and display options. |
| schema_version | Personal-data format version for validation/migration. |

A backup also includes format_version and exported_at. No name, email, account password, or inferred proficiency is needed for checklist operation.

### Three different versions
**Content revision** changes for any published edit. **Target version** changes when the knowledge a student must recall changes, including material corrections to a rule or example. **Schema version** changes when the storage format changes. Do not use a page's modified date as a proxy for all three.

Split/merge changes require a migration map. Never automatically award Memorized to a newly created or expanded unit. Preserve the prior record and ask for explicit confirmation where necessary.

---

# 12. Content import and release manifest
### Single source of truth
Use the supplied taxonomy v0.1 as the initial scope manifest. The JSON is the proposed machine-readable source; the workbook is a human review companion. Future edits should be made in one controlled source and reflected in derived views, not independently maintained in both files.

The import must validate unique unit IDs, page references, stage/type values, source references, prerequisite/related links, and the release flag. Retain existing aliases and editorial caveats. Store content publication state separately from the original “First release” planning flag: a planned item is not automatically publishable.

### Release assertions
The long-term map contains 100 proposed units and 81 parent-page slugs. The First release flag selects 32 units and 29 parent-page slugs. These counts were checked against the supplied JSON for this PRD. [S1]

MVP shared pages with multiple published units are B02/B03, C07/C08, and F02/F05. Other parent pages may contain only their core unit at launch even when additional units exist in the full plan. An unpublished extension must not inflate a page's target or completion requirements.

### Supporting concepts
Include S01–S12 as concise untracked material. S01–S09 are direct prerequisites in the current release graph; S10–S12 supply interpretation, convention, and search guidance. They may be grouped into glossary pages and are not counted among the 29 reference pages. [S1]

### Content boundary checks
A required condition cannot be postponed merely because a related advanced unit is outside MVP. For example, if a launch unit refers to a broader inflection category, its bounded target and immediate examples must still be coherent and accurate. The editorial lead must resolve such overlap before publication rather than relying on a future page.

No planned-but-unreviewed material appears in public search. A linked prerequisite is helpful context, not an access lock. The existing prerequisite graph is a navigation aid; it is not evidence that the reference constitutes a complete teaching sequence.

### Import acceptance
Rebuilding the content catalogue must produce the same stable IDs, slugs, counts, and cross-links without duplicating personal progress. The build must fail on unresolved required IDs or missing approved translations. Public indexes derive from publication state; authoring previews remain separate and non-indexable.

The exact 32-unit manifest is included in Appendix A so product, content, design, and engineering can refer to the same release boundary.

---

# 13. Non-functional and operational requirements
### NFR-01 · Performance
Proposed laboratory targets: primary reference content visible within 2.5 seconds on the agreed mobile/network test profile; in-page search/filter response within 200 milliseconds at the 95th percentile after the catalogue is loaded; visible status feedback within 200 milliseconds, with failure reporting when persistence does not succeed.

Engineering must document the device, network, dataset, cache state, and sampling procedure. These are product targets, not claims about an existing implementation. A heavy diagram library, account system, or external search service must not become necessary for basic lookup.

### NFR-02 · Compatibility and resilience
Test current and previous major desktop Chrome, Firefox, Safari, and Edge releases available at test time, plus current iOS Safari and Android Chrome. Document actual versions in the release record. Test direct links, reloads, blocked storage, script failure, slow loading, and failed feedback delivery.

Core published reference text must be server-rendered or pre-rendered and indexable. Search and progress may use client-side enhancement. Do not present network caching as guaranteed offline operation.

### NFR-03 · Privacy and security
Keep progress local under DEC-01. Do not send raw search text, full personal snapshots, or individual status histories to analytics by default. User-provided feedback is an explicitly submitted separate data flow. Avoid advertising trackers and unnecessary third-party scripts in the pilot.

Use HTTPS, restrict publishing permissions, validate imports and stored data, prevent user text from becoming executable markup, and keep private report destinations/secrets out of public bundles. The operating owner must approve a data inventory, retention policy, and appropriate notices before public collection begins. This PRD does not establish legal compliance.

### NFR-04 · Maintainability
Separate content, presentation, and personal state. Preserve IDs through page-title changes. Automated checks must validate publication fields, links, language coverage, count manifests, and version migrations. Do not hardcode a unit's pedagogical answers inside interface components.

### NFR-05 · Operational ownership
A named maintainer must own content corrections, a named technical owner must own defects and deployments, and a monitored route must receive reports. Publish a support route without promising response times that are not staffed.

### Architecture boundaries
No framework, hosting vendor, database provider, or CMS is mandated here. Prefer the least complex design that meets the requirements. A static/pre-rendered content application with client-side search and local progress is the proposed starting shape, not an implementation contract. Correction delivery may need a small service or existing support channel; accounts and a learner database do not.

---

# 14. Validation, measurement, and success criteria
### Primary outcome: successful retrieval
Measure whether a student can locate the intended published unit and retrieve the required information without help. Search-result clicks are a proxy, not proof of successful lookup; checklist activity is a separate behavior, not a substitute for reference usefulness.

### Proposed pilot
Recruit 12 adult students: six preferring English explanation and six preferring Arabic explanation, all currently studying formal Arabic. Recruit three teachers/reviewers from relevant instructional contexts. These are proposed exploratory sample sizes, not representative market research.

Each student performs five realistic lookup tasks, records a status, explains what that status means, and revisits/restores a saved record. Use both mobile and desktop across the sample. Include a paradigm, a condition-dependent rule, and a shared-page unit. Conduct a follow-up over approximately three weeks of actual study; this is an evaluation design, not a promised delivery schedule.

| Measure | Proposed pilot threshold / interpretation |
| --- | --- |
| Correct lookup | At least 54/60 tasks completed unaided within 45 seconds; at least 27/30 in each language group. |
| Status comprehension | At least 10/12 explain the bounded target, self-report meaning, and local-storage limitation. |
| Status/recovery usability | At least 10/12 complete save, revisit, and backup/restore tasks without moderator intervention. |
| Serious content errors | Zero known unresolved errors that make a published target or example materially misleading. |
| Repeat usefulness | Record actual coursework-related returns and reasons for non-use; establish a baseline rather than inventing a universal retention target. |
| Teacher fit | Document whether each teacher can inspect and share a relevant unit, and which content/convention issues remain. |

Thresholds are product proposals and must be agreed before the pilot, not adjusted after seeing the results. Report failures by language, device, content type, and cause. A small sample cannot establish educational effectiveness or commercial viability.

### Measurement boundaries
The core product must work without tracking consent. Under DEC-07, use consented pilot observation and participant follow-up for return-use evidence. Optional aggregate instrumentation, if later approved, may count search completion, result selection, recall opening, status-save success, and feedback failures without raw queries or personal progress payloads.

Event schemas, consent handling, retention, and provider selection require an explicit review before remote collection. Session-level events cannot establish cross-session retention; do not report them as such.

### Non-goal metrics
Do not optimize for time on site, daily streaks, an artificially high Memorized percentage, or the number of words read. No learning-efficacy claim is authorized by the MVP checklist or this usability pilot.

---

# 15. Acceptance tests and launch gates
### End-to-end acceptance matrix
| Test | Expected result | Requirements |
| --- | --- | --- |
| AT-01 · Clean-browser link | Correct published unit readable with no signup. | FR-04 |
| AT-02 · Arabic spelling variants | Reviewed diacritic/alif variants find the same intended unit. | FR-02 |
| AT-03 · English/transliteration | Priority aliases reach their reviewed target. | FR-02 |
| AT-04 · Ambiguous query | Distinct relevant contexts remain distinguishable. | FR-02–03 |
| AT-05 · Shared page | B02 update does not alter B03; counts remain unit-based. | FR-07, FR-09 |
| AT-06 · Locale switch | Same anchor and progress; approved explanation choice preserved. | FR-15–16 |
| AT-07 · Recall | Hidden answer unavailable until reveal; no automatic status/review. | FR-06, FR-08 |
| AT-08 · Storage unavailable | Reference works; status shows unsaved warning. | FR-11 |
| AT-09 · Backup round-trip | Valid snapshot restores; invalid import changes nothing. | FR-12 |
| AT-10 · Target revision | Old status qualified; explicit confirmation needed. | FR-14 |
| AT-11 · Cosmetic edit | No false target-change prompt. | FR-14 |
| AT-12 · Two tabs | Unrelated unit updates are not lost. | FR-11 |
| AT-13 · Accessibility | Main journeys pass keyboard/screen-reader checks in both locales. | FR-16–17 |
| AT-14 · Editorial block | Missing review/source/translation prevents publication. | FR-18–19 |
| AT-15 · Report failure | Text retained; no false delivery confirmation. | FR-20 |
| AT-16 · Withdrawal | Search/counts update; old link explains; saved record retained. | FR-21 |
| AT-17 · Print | Answers visible; Arabic and tables readable; no personal data. | FR-05 |
| AT-18 · Reset | Site personal state removed after explicit confirmation. | FR-13 |

### Public-launch definition of done
All 32 planned units and required supporting material are authored and approved; all 29 parent pages render correctly in both interface locales; necessary source/convention details are visible; the release manifest and search fixtures pass; no critical or high-severity correctness, data-loss, or access defect remains unresolved.

Complete the acceptance matrix, manual accessibility review, recorded performance/compatibility tests, backup/revision tests, and correction-channel test. Assign product, editorial, and technical owners. Approve storage and privacy wording. Record pilot findings and resolve any launch-blocking failures.

A smaller private prototype may use a limited approved subset and clearly labelled fixtures. It must not be marketed as the completed 32-unit public MVP. Reducing public content scope requires a recorded PRD/manifest change, not an undocumented partial launch.

---

# 16. Delivery sequence, risks, and dependencies
### Gate-based delivery, not a promised timeline
| Gate | Deliverable | Exit condition |
| --- | --- | --- |
| G0 · Scope adoption | Approved baseline decisions, named owners, release manifest. | DEC-01–DEC-07 resolved or explicitly replaced. |
| G1 · Content/design prototype | Six representative parent pages: D01, B01, E05, F02/F05, G01, and I01. | Templates handle list, paradigm, pattern, conditions, and shared-unit behavior. |
| G2 · Functional alpha | Search/browse, reference rendering, recall, checklist, local backup, localization, publishing checks. | Critical automated and manual journeys pass on approved sample content. |
| G3 · Content-complete pilot | Full 32-unit release with approved supporting material. | All content gates pass; pilot can test the real catalogue. |
| G4 · Public MVP | Pilot fixes, operational ownership, launch checks. | Definition of done signed off. |

### Principal risks
| Risk | Mitigation / trigger |
| --- | --- |
| Reference expands into a course | Apply the inclusion rule and require a scope trade-off for new feature classes. |
| Repetition reinforces an error | Independent grammar review, source convention, withdrawal, and target-version updates. |
| Students expect synced accounts | Persistent local-storage explanation plus backup; reassess DEC-01 if pilot confusion persists. |
| Arabic and English diverge | Paired content revisions; block incomplete translations. |
| Search misses familiar terms | Curated aliases and real query fixtures; do not rely only on literal titles. |
| Checklist overstates knowledge | Explicit targets, self-report wording, and no automatic mastery or retention claims. |
| Content production dominates effort | Prototype four content shapes before authoring the whole release; track approval throughput separately from software. |
| Empty taxonomy overwhelms users | Publish only available material; keep the 100-unit roadmap internal. |

### Critical dependencies
A qualified Arabic editorial lead, bilingual review capacity, approved source conventions, authored launch material, a tested report destination, and a technical maintainer are dependencies. The taxonomy is not a substitute for those resources. A budget, staffing plan, and release date remain unset.

### Expansion rule
After launch, prioritize evidenced lookup gaps and editorial capacity. Expand the bounded reference before adding platform features by default. Accounts, scheduling, class tools, and an iʿrāb practice product each require a separate decision and specification; none is implied by adding more content units.

---

# 17. Open decisions and approval register
| Item | Decision required | Owner / gate |
| --- | --- | --- |
| DEC-01 | Adopt local-only progress or fund accounts/sync. The current specification assumes local-only. | Product + engineering / G0 |
| DEC-02 | Adopt simple optional recall and explicit review dates; reject automatic scheduling for MVP. | Product / G0 |
| DEC-03 | Confirm full Arabic/English launch coverage and explanation modes. | Product + editorial / G0 |
| DEC-04 | Confirm backup/replace-restore as P0 rather than deferring portability. | Product + engineering / G0 |
| DEC-05 | Select an authoring/publishing toolchain that supports independent review without requiring a custom CMS. | Editorial + engineering / G1 |
| DEC-06 | Approve ungated public pilot; set operating budget. Long-term monetization remains separate. | Product / G0; finance before G4 |
| DEC-07 | Approve pilot-only behavioral measurement by default; separately approve any telemetry. | Product + operating owner / before collection |
| O01 | Name source convention and display-transliteration convention for the launch content. | Editorial / before content approval |
| O02 | Assign named reviewers, correction owner, and a monitored support channel. | Product / before G3 |
| O03 | Select brand/domain and final visual identity. No new brand is assumed here. | Product + design / before G4 |
| O04 | Confirm rights/reuse policy, feedback retention, privacy wording, and public-audience requirements. | Operating owner / before G4 |
| O05 | Set budget, delivery estimate, team responsibilities, and maintenance capacity. | Product + engineering / after G1 sizing |

Unresolved choices must not be concealed by interface copy. In particular, do not offer sign-in, sync, scheduled reminders, or delivery guarantees while those capabilities are absent.

### Readiness assessment
This PRD is ready for product review, content-template design, and technical sizing. It is not a claim that the content is approved or that the design is implementation-complete. Product adoption of the proposed defaults is needed before engineering treats them as binding scope.

### Change control
Record the decision, rationale, affected requirement IDs, release impact, and approver whenever scope changes. Update the manifest and relevant acceptance tests together. Content additions within an existing template still require editorial approval; new exercise or account capabilities require explicit scope approval.

### Approval record
| Role | Required approval | Status |
| --- | --- | --- |
| Product owner | Proposition, DEC-01–DEC-07, MVP scope, pilot thresholds. | Pending |
| Editorial lead | Unit boundaries, conventions, review/withdrawal process. | Pending |
| Design lead | Journeys, bilingual presentation, accessibility approach. | Pending |
| Engineering lead | Data/version model, persistence, build/test feasibility. | Pending |

---

# Appendix A. Exact MVP content manifest
The following units carry the First release flag in taxonomy v0.1. Arabic names, English labels, and IDs are preserved. They are scope records, not approved teaching content. [S1]

### Foundational maps, pronouns, and particles
| ID | Arabic title | English label |
| --- | --- | --- |
| A01 | علامات الاسم والفعل والحرف | Word-class recognition signs |
| A02 | أقسام الإعراب | Grammatical states: nouns versus verbs |
| A03 | أنواع المعارف | Categories of definite nouns |
| B01 | ضمائر الرفع المنفصلة | Independent subject-series pronouns |
| B02 | ضمائر الرفع المتصلة | Attached subject pronouns |
| B03 | ضمائر النصب والجر المتصلة | Attached object and genitive pronouns |
| B05 | أسماء الإشارة | Demonstratives |
| B06 | الأسماء الموصولة الخاصة | Specific relative pronouns |
| B08 | أسماء الاستفهام | Interrogative nouns |
| C01 | حروف الجر الأساسية | Core prepositions |
| C04 | حروف العطف | Coordinating particles |
| C05 | نواصب المضارع الصريحة | Explicit imperfect-subjunctive governors |
| C07 | جوازم فعل واحد | Single-verb jussive governors |
| C08 | أدوات الشرط الجازمة | Jussive conditional tools |
| C11 | أدوات النفي | Negation contrast table |
| C12 | حروف النداء | Vocative particles |

### Shared-page behavior
B02 and B03 share `attached-pronouns`; C07 and C08 share `jussive-governors`. Their targets, statuses, and deep links remain separate. All other entries on this page have one published unit per parent page at launch. Later units on those pages remain outside the active scope.

---

# Appendix A. Exact MVP content manifest — continued
### Governing families, endings, patterns, and compact rules
| ID | Arabic title | English label |
| --- | --- | --- |
| D01 | إن وأخواتها | Inna and its sisters |
| D03 | كان وأخواتها | Kana and its sisters |
| E01 | إعراب الاسم المنصرف | Regular noun case endings |
| E02 | المثنى | The dual |
| E03 | جمع المذكر السالم | Sound masculine plural |
| E04 | جمع المؤنث السالم | Sound feminine plural |
| E05 | الأسماء الخمسة | The five special nouns |
| F01 | تصريف الماضي الصحيح | Regular past-tense conjugation |
| F02 | تصريف المضارع الصحيح | Regular imperfect conjugation |
| F03 | تصريف الأمر الصحيح | Regular imperative conjugation |
| F05 | علامات إعراب المضارع | Imperfect mood endings |
| F06 | الأفعال الخمسة | The five imperfect templates |
| G01 | الميزان الصرفي | Morphological pattern notation |
| H01 | الصحيح والمعتل | Sound and weak verb classes |
| I01 | أحكام الإضافة الأساسية | Annexation rule card |
| I02 | مطابقة النعت | Adjective-agreement table |

F02 and F05 share `imperfect-verb`, completing the three shared-page pairs in the MVP. The complete manifest therefore contains **32 units across 29 parent pages**. [S1]

### Supporting concepts, not additional achievements
S01 parts of speech; S02 inflecting/fixed forms; S03 sentence/role glossary; S04 definiteness; S05 person/gender/number; S06 annexation/attachment; S07 relative/embedded clauses; S08 condition/response; S09 root/pattern; S10 role/state/sign; S11 reference conventions; S12 terminology/search guide.

These entries explain how to read the reference. They do not receive separate memorization status, inflate completion totals, or establish a compulsory introductory course.

---

# Appendix B. Search fixtures and source notes
### Minimum search-fixture examples
| Query family | Expected destination / behavior |
| --- | --- |
| إن وأخواتها / إِنَّ وَأَخَوَاتُهَا / inna sisters / inna wa akhawatuha | D01; same core target. |
| حروف الجر / huruf al jarr / prepositions | C01; label the published core scope. |
| نصب المضارع / nasb al mudari / subjunctive particles | C05; distinguish governors from F05 endings. |
| الأسماء الخمسة / five nouns / al asma al khamsa | E05. |
| الأفعال الخمسة / five verbs | F06; preserve the correct target label. |
| accusative particles | Present distinct relevant published contexts with meaningful descriptions. |
| A valid topic outside the public release | Do not fabricate a page or silently count a planned unit as available. |

These are proposed acceptance fixtures, not a guarantee that every possible transliteration will match. Add curated examples for every launch unit and test aliases in both interface locales.

### Evidence and provenance
**[S1] Supplied product inventory.** Arabic Grammar Memory Reference — Master Taxonomy, version 0.1, prepared 27 September 2026. Files: `arabic_grammar_memory_taxonomy.json` and companion `arabic_grammar_memory_taxonomy.xlsx`. The JSON was inspected for scope counts, unit fields, release flags, page groupings, supporting concepts, source limitations, and tracking semantics. This PRD does not revalidate all grammar sources or upgrade draft content to approved status.

**[E1] W3C.** Web Content Accessibility Guidelines (WCAG) 2.2, Recommendation dated 12 December 2024; consulted 28 September 2026. Used as the proposed accessibility acceptance target, not as evidence that any implementation currently conforms.
https://www.w3.org/TR/WCAG22/

**[E2] MDN Web Docs.** Window: localStorage property; consulted 28 September 2026. Supports the distinction between browser-local persistence, temporary private-browsing storage, and storage-access failures. The chosen backup behavior is a product proposal.
https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

### Interpretation limits
Audience descriptions and problem statements derive from the product discussion. Proposed feature priorities, performance thresholds, pilot sample sizes, and success thresholds are planning choices rather than external benchmarks or observed findings. No market forecast, commercial validation, educational-effectiveness claim, or legal-compliance conclusion is supplied.

**Version 0.1 closes the product-definition stage, not the editorial review or implementation stages.**
