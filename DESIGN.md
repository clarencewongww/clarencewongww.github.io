<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Clarence Wong — Personal Site
description: Chalkboard Cosmos — a teacher's chalkboard redrawn as a 3D universe of data and lessons.
---

# Design System: Clarence Wong — Personal Site

## Overview

**Creative North Star: "The Chalkboard Cosmos"**

Clarence Wong is a chemistry teacher turned data scientist and AI builder. The world he lives in is the classroom chalkboard — the surface where ideas become visible, where a lesson is drawn stroke by stroke — and the universe of data his work now lives in. The Chalkboard Cosmos fuses the two: a deep chalkboard-green void in which every data point is a chalk-drawn star, every connection a constellation bond, every section a new lesson drawn on the same board.

The surface is Experience mode: the artifact leads from the first viewport. The page is one scroll, one lesson plan — hero, about, resume, skills, projects, contact — each section revealed as if a teacher is drawing it in front of you. Motion is material: the WebGL cosmos rotates, orbits, and re-forms as the visitor scrolls; chalk dust drifts; reveals are strokes, not fades. The warmth of the classroom and the rigor of the data lab must feel like one person. The system refuses the portfolio default (photo hero + card grid) and the plain-resume opposite: the board is a world, not a background.

**Key Characteristics:**
- One material: chalk on chalkboard — every element reads as drawn, dashed, or dusted
- One accent: amber chalk — used only for data, highlights, and the signature
- The cosmos is the only depth: DOM content stays flat on the board
- Motion is authored as a lesson: strokes, orbits, and reveals, never scattered hover effects
- Data is always legible: every number is a chalk annotation in a mono face

**Build Notes:** Built with zero build step (plain HTML/CSS/JS + vendored Three.js r160), GitHub Pages ready. WebGL canvas fixed behind the board; reduced-motion and no-WebGL fall back to a static chalk rendering.

## Colors

Restrained strategy: chalkboard green carries the surface; chalk white is the voice; one amber accent is spent sparingly.

### Primary
- **Chalkboard Green** #16271d: the board itself — page background, hero void, section grounds, sitting on a #0f1b14 deep. A radial vignette (#1a2f23 center) draws the eye to the board's center. Dark enough for white chalk to glow.

### Secondary
- **Chalk White** #f3efe2: all body text, headings, drawn strokes. Warm, not pure white.

### Tertiary
- **Dust Gray** #8f9b93: secondary text, annotations, faded strokes, inactive elements.

### Accent
- **Amber Chalk** #e8a33d: data points, constellation highlights, the CTA, the signature seal. At most ~5% of any viewport — its rarity is the point.

### Named Rules
**The One Color Rule.** Amber appears only on data, active states, and the primary call-to-action. Everything else is green, white, or gray.
**The Board Rule.** Never use pure black or pure white; every tone is a board- or chalk-derived value.

## Typography

Pairing (as built): **Kalam 700** (Google Fonts) for the display hand; **Caveat** for chalk notes and pull words; **Newsreader** for body; **IBM Plex Mono** for data annotations and labels.

- **Display (Kalam 700):** the hero name and pull-words — drawn, not typeset; clamp(3.5rem, 12vw, 8.5rem), floor 3rem on narrow screens. Lesson numerals are set in mono (see Label).
- **Headline (Newsreader):** section titles, serif, clamp(2.2rem, 5vw, 3.4rem)
- **Body (Newsreader):** 1.0625–1.15rem, line-height 1.65, max 56–65ch
- **Label (IBM Plex Mono):** tracked uppercase or small captions for chalk annotations, dates, data values

### Named Rules
**The Annotation Rule.** Every data value and date is set in mono with a small chalk caption — numbers are always labeled, never bare.
**The Drawn-Not-Typeset Rule.** The display hand is reserved for the hero name and at most three pull-words per section; lesson numerals and everything else are serif or mono.

## Layout

One continuous vertical scroll; sections are "lessons" numbered 01–06 in chalk numerals. The grid is generous: 12-col grid, content max-width ~1100px, sections separated by the board's natural emptiness — whitespace is the chalkboard's quiet. One spacing rhythm (8px base; 24/48/96/160 steps); more space above headings than below. On mobile, the cosmos simplifies (fewer particles) and the grid collapses to one column without reflowing text.

## Elevation & Depth

**The Cosmos-Only Depth Rule.** Depth exists only in the WebGL scene. The DOM is flat — chalk on board; no shadows, no glass, no gradient cards. Depth is conveyed by the cosmos (parallax, orbit, camera motion) and by chalk strokes (dashed underlines, ellipses, orbits), never by elevation.

**The One Exception (user-confirmed).** Project cards carry real depth: CSS 3D tilt on pointer (rotateX/rotateY via CSS variables) with layered translateZ surfaces. Transform-only, no shadows; disabled for touch and reduced-motion.

## Shapes

Chalk-drawn geometry: circles and ellipses for constellation nodes; dashed, slightly irregular strokes for underlines, arrows, and the timeline path; corners are square (chalk has no radius); section dividers are drawn ruler lines, not borders. Subtle SVG roughness may roughen strokes in the build.

Chips and pill buttons are drawn chalk circles (border-radius 999px); cards, frames, and the profile ring keep square or circular chalk geometry — mixed radii are not used.

## Components

Implemented: chalk buttons (dashed pill → solid amber on hover, big variant for the CTA), chalk-socials row, profile ring, timeline with lit nodes, skill cards (dashed chalk frame, drawn SVG icons), 3D project cards, lesson rail dots, progress bar, back-to-top.

## Do's and Don'ts

### Do:
- **Do** keep the cosmos an enhancement: the full content must read with WebGL off and with reduced motion on (static chalk rendering).
- **Do** preserve the archived copy's wording and personal voice (the original typos were corrected once by user request — do not reintroduce or further rewrite).
- **Do** spend amber only on data, active states, and the CTA.

### Don't:
- **Don't** use school-cliché props (apples, rulers, mortarboards) or childish handwriting — the chalk must read adult and precise.
- **Don't** let particles or motion obscure text: readability beats spectacle at every breakpoint.
- **Don't** import the old template's look (photo hero, card grid, Kaushan Script) — the old site is evidence, not authority.
- **Don't** put shadows or gradients on DOM surfaces — depth belongs to the cosmos alone.
