# Clarence Wong — Personal Site (Chalkboard Cosmos)

A single-page portfolio for Clarence Wong (黄炜文): educator, learning designer, data analyst, and computer science student.

- **World:** The Chalkboard Cosmos — a classroom chalkboard redrawn as a 3D universe (WebGL/Three.js), scroll-driven.
- **Tech:** Plain HTML/CSS/JS + Three.js (vendored). Zero build step — GitHub Pages ready.
- **Vendored Three.js:** pinned to r160 (js/vendor/three.min.js). The r150+ UMD build emits a deprecation warning and will disappear in future releases — if upgrading, move to the ES-module build.
- **Content:** Preserved from the original site; typos corrected.
- **Contact:** mailto:contact@clarencewongww.com

## Run locally

python3 -m http.server 8000   # then open http://localhost:8000

## Deploy to GitHub Pages

Push the repo root of `clarencewongww.github.io` (or any GitHub Pages-enabled repo). GitHub Pages serves index.html at the root automatically. No build step.
