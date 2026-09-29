# Clarence Wong — Personal Site

Editorial portfolio for Clarence Wong (黄炜文): learning designer & data analyst.
Dark near-black canvas, off-white type, one electric-purple accent. Instrument
Serif display, Inter body, JetBrains Mono for tags/dates/metrics.

- **Stack:** single-file `index.html` (inline CSS + JS). Zero build step —
  GitHub Pages ready. CDN: GSAP + ScrollTrigger, Lenis, Lucide; Three.js is
  lazy-loaded at the contact section only.
- **Themes:** dark / light / system selector in the nav, persisted in
  localStorage, applied pre-paint from a tiny head script. All colors are CSS
  variables with a `[data-theme="light"]` override.
- **Motion:** one master scrubbed GSAP timeline (progress hairline, hero
  parallax, skills ribbon), CSS sticky pinning, `ScrollTrigger.batch` for all
  entrances (3D card tilt-ins, timeline depth slides, counters, cuboid bars).
  Transform + opacity only. The full architecture is documented in the comment
  block at the top of `index.html`.
- **Accessibility:** `prefers-reduced-motion` (or missing CDNs, or <768px
  screens) degrades every effect to opacity-only fade-ins; skip link, ARIA
  labels on canvas/chart, keyboard-navigable links.
- **Content:** real projects, publications (48 citations, h-2, i10-1, two
  J. Chem. Educ. papers), timeline and links preserved from the previous site.
- **Contact:** mailto:contact@clarencewongww.com

## Run locally

python3 -m http.server 8000   # then open http://localhost:8000

## Deploy to GitHub Pages

Push the repo root of `clarencewongww.github.io` (or any GitHub Pages-enabled
repo). GitHub Pages serves index.html at the root automatically. No build step.

## Legacy files

`DESIGN.md`, `HANDOFF.md`, `PRODUCT.md`, `css/`, `js/`, `images/` are artifacts
of the previous "Chalkboard Cosmos" concept and are no longer referenced by
`index.html`. They can be removed in a future cleanup.
