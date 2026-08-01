# HANDOFF — Chalkboard Cosmos Personal Site

_Last updated: Aug 2026 · Repo: `clarencewongww/clarencewongww.github.io` · Live: https://clarencewongww.github.io/ · Branch: `main`_

## 1. Where things live

| Path | Role |
|---|---|
| `index.html` | The whole page — 6 lessons + hero + rail + footer; copy lives here (single source of content) |
| `css/style.css` | Design tokens (`:root`), chalkboard system, all sections, reveal system, reduced-motion block |
| `js/cosmos.js` | WebGL scene (Three.js r160, vendored): chalk dust, 4 constellations, scroll-driven camera circuit |
| `js/main.js` | DOM motion: reveal-on-scroll, progress bar, lesson-rail scroll-spy, 3D project-card tilt |
| `js/vendor/three.min.js` | Vendored Three.js r160 (pinned — see §7) |
| `images/` | profile photo (560px) + 4 project thumbnails (book cover is a JPEG) |
| `PRODUCT.md`, `DESIGN.md` | Impeccable product truth + visual system (READ BEFORE EDITING UI) |
| `.impeccable/` | Skill artifacts: surface brief (`surfaces/index-html.md`), direction payload |
| `README.md` | Run/deploy basics |
| `favicon.svg`, `.nojekyll` | Chrome atom favicon; Pages hygiene |

## 2. Current state (all shipped)

- **Sections:** Hero (00) · About Me 01 · My Resume 02 · My Skills 03 · Publications 04 · My Projects 05 · Hire Me 06 — single scroll, lessons numbered in chalk mono numerals, right-side lesson rail (00–06) with hover tooltips (`data-label` + CSS `::before`), scroll-spy + aria labels.
- **Content:** preserved from the original site; typos corrected once (details, （黄炜文）, missing period); footer `© 2026`.
- **Publications (04):** static Google Scholar data (48 citations, h-index 2, i10-index 1; two J. Chem. Educ. 2019 papers, 40 + 8 citations), labeled "counts as of Aug 2026" — refresh method in §7.
- **WebGL cosmos:** transparent fixed canvas behind the board; dust particles (1600/700 desktop/mobile, central clearing zone), atom / scatter / chain / orbit constellation groups with per-section opacity boosts; camera circuit driven by global scroll progress; contact = finale (boost capped 0.95); reduced-motion renders ONE static frame; no-WebGL → `no-webgl` class hides canvas.
- **DOM motion:** `.reveal` → `.is-visible` (IntersectionObserver, gated on `html.js`); progress bar via `--p` scaleX (transform-only); project cards tilt with pointer (`--rx`/`--ry`, hover-only, disabled for touch/reduced-motion).

## 3. Design system (short version)

- `DESIGN.md` owns the world: **Chalkboard Cosmos** — chalkboard-green void, warm chalk white, dust gray, ONE amber accent.
- **Named rules:** The One Color Rule (amber only on data/active/CTA); The Cosmos-Only Depth Rule (+ the one user-confirmed exception: project-card 3D tilt); The Drawn-Not-Typeset Rule; The Annotation Rule (every number is mono + labeled).
- **Type:** Kalam 700 (display hand) · Caveat (chalk notes) · Newsreader (body) · IBM Plex Mono (labels/data) — Google Fonts.
- **Tokens (CSS vars):** `--board:#16271d; --board-deep:#0f1b14; --chalk:#f3efe2; --dust:#8f9b93; --amber:#e8a33d; --line:rgba(243,239,226,.28)`.

## 4. Animation architecture today (what the next task will touch)

- **`js/cosmos.js`:** boot → WebGL capability check (`webgl`/`no-webgl` classes); dust + 4 constellation groups; per-frame loop: dust tumble, electron orbits, camera `x = sin(progress·2π)·2.4 + mouse`, `y = cos(progress·3π)·1.2 + mouse`, `z = 16 + sin(progress·π)·1.5`; per-section opacity boosts (about→scatter, resume→chain, skills→atom, projects→orbit, contact→0.95 finale); `visibilitychange` pause; pixel ratio ≤ 2; reduced-motion = one static frame.
- **`js/main.js`:** reveal IO (threshold .15, rootMargin −8%); progress bar `--p` ratio (rAF-throttled scroll); scroll-spy over `section.lesson[data-lesson]` + hero → `.is-active` + `aria-current` on matching `.lesson-dot[data-target=…]`; card tilt (pointermove → CSS vars, hover-only).
- **`css/style.css`:** `.reveal` transitions under `html.js` only; `--d` stagger delays; reduced-motion block forces everything visible/instant; all motion is transform/opacity (detector-enforced — no layout-animating transitions).

## 5. NEXT TASK — 3D-style transitions between sections (zoom in / out)

**Goal.** Replace the current "fade-up reveal" between sections with a scroll-driven 3D transition: as the visitor scrolls, the departing lesson zooms OUT (scales down / recedes) while the incoming lesson zooms IN (scales up to settle) — a camera dolly through the chalk cosmos. User-described as "like a zoom in out animation".

**Design intent.** Sections should feel like planes floating in the cosmos, not cards sliding on a page. The zoom must feel chalk-native (slow, deliberate, slightly floaty) — NOT a generic 3D flip or swoosh. The WebGL cosmos should ideally recede/push in sympathy (camera `z` per section boundary).

**Candidate approaches (in recommended order).**
1. **Per-section scroll-linked scale (RECOMMENDED):** each `.lesson` gets a scroll-linked `scale` computed in a rAF-throttled scroll handler (per-section progress 0→1: departing scale 1→0.94 + opacity 1→0.55 + slight translateY; entering scale 1.06→1 + opacity 0→1). Transform-origin center; `will-change: transform` on active lessons only; sync the cosmos camera `z` with the same progress so canvas and DOM zoom together (the "dolly"). Minimal new code, maximal control, works everywhere.
2. **CSS scroll-driven animations (`animation-timeline: view()`):** declarative, no JS — but Chrome-only today; needs the JS approach as fallback. Use only if you want progressive enhancement; keep approach 1 as the base.
3. **Pure Three.js section cameras:** move ALL transition into WebGL (DOM sections as textured planes) — biggest visual payoff, highest risk/complexity, loses DOM semantics. Not recommended for this pass.

**Guardrails (HARD — do not violate).**
- `prefers-reduced-motion: reduce` → zero zoom; current static behavior (everything visible).
- Scale bounds 0.94–1.06 (never < 0.85): content must remain readable mid-transition.
- Transform/opacity ONLY — no width/height/margin/top animation (detector rule `layout-transition`).
- Keep scroll-spy, rail tooltips, reveals, card tilt working; no-JS (`html.js` gating) safe.
- Performance: one rAF-throttled scroll listener (share with existing progress code), avoid per-frame layout reads, cap `will-change` to 1–2 lessons, test 60fps on mobile.
- On-brand: transitions must feel like chalk drifting in space — ease `cubic-bezier(.2,.7,.3,1)`, duration ~600–900ms of scroll distance, no bounce, no rotation gimmicks.
- The cosmos camera zoom and DOM zoom should move in sympathy (same progress variable) or the effect will feel disconnected.

**Acceptance criteria.**
1. Zoom-out/zoom-in transition between ALL adjacent sections, both directions.
2. Seamless at 60fps on desktop and mobile (DevTools FPS meter; no jank on scroll).
3. Reduced-motion and no-WebGL: unchanged current behavior.
4. Content readable at all times; no layout shift; scroll-spy/rail still correct.
5. Cosmos camera + DOM zoom visibly in sympathy.
6. Visual QA (browser screenshots + vision review) and `detect.mjs` clean; code-review pass done.

**Verification flow (used successfully all session).**
1. `python3 -m http.server 8000` (or open file://) → Chrome: console clean, scroll through all sections.
2. Screenshots mid-transition → vision review against the world.
3. `node /Users/clarencewong/.config/opencode/skills/impeccable/scripts/detect.mjs --json index.html css/style.css js/main.js js/cosmos.js` (ONE run).
4. Code review pass (a11y, perf, contract).
5. `git add … && git commit -m "…" && git push origin main` → poll `curl -s -o /dev/null -w "%{http_code}" https://clarencewongww.github.io/` until 200 (Pages takes ~20–60s).

## 6. Deploy & QA workflow

- Local preview: `python3 -m http.server 8000` → http://localhost:8000
- Ship: `git add … && git commit -m "…" && git push origin main` — Pages redeploys in ~20–60s (poll the URL).
- QA stack: chrome-devtools browser tests + vision subagent screenshot reviews + the skill's `detect.mjs` + a code-review finish pass (this session's pattern — replicate it).

## 7. Known constraints & open items

- **Three.js pinned to r160 UMD** (`js/vendor/three.min.js`): the r150+ UMD build prints a deprecation warning and will disappear in future releases — upgrade = switch to ES-module build (see README note).
- **Publications stats are STATIC** (Aug 2026). Refresh: fetch `https://scholar.google.com/citations?user=C7ygBNAAAAAJ&hl=en`, update the three numbers in `#publications` + the two citation counts + the "counts as of …" label. Google Scholar has NO public API — do not attempt live scraping on the site.
- **Repo name = URL constraint:** repo must stay `clarencewongww.github.io` for the free URL to work; custom-domain mapping (`clarencewongww.com`) is the escape hatch if a rename is ever wanted.
- **Archive deleted:** `old-web-resources/` is gone (per user request); the copy lives in the site + git history only.
- Impeccable skill context: PRODUCT.md / DESIGN.md / surface brief are the source of truth; run the skill's `context.mjs` at session start.

## Appendix — Verified anchors (Aug 2026)

| Anchor | File:line |
|---|---|
| initial camera position | js/cosmos.js:70 |
| scroll camera base `cz = 16` | js/cosmos.js:449 |
| contact finale boost 0.95 | js/cosmos.js:378 |
| dust clearing zone | js/cosmos.js:154 |
| constellation positions (atom/scatter/chain/orbit) | js/cosmos.js:201, js/cosmos.js:242, js/cosmos.js:275, js/cosmos.js:300 |
| progress bar `--p` (JS) | js/main.js:104, js/main.js:107 |
| IntersectionObserver instances (main.js) | js/main.js:58, js/main.js:59, js/main.js:66, js/main.js:217, js/main.js:220 |
| sections with `data-lesson` (index.html) | index.html:60, index.html:92, index.html:155, index.html:194, index.html:234, index.html:275 |
| lesson rail dots (index.html) | index.html:297, index.html:298, index.html:299, index.html:300, index.html:301, index.html:302, index.html:303 |
| progress bar scaleX (CSS) | css/style.css:703 |
| reduced-motion block (CSS) | css/style.css:735 |
| publications styles (CSS) | css/style.css:839, css/style.css:845, css/style.css:853, css/style.css:859 |
