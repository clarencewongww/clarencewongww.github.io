# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General professional audience: recruiters, hiring managers, collaborators, and peers evaluating Clarence Wong's professional presence. Job: form an accurate, favorable impression of an educator turned data scientist / ML builder, and find a way to contact him.

## Product Purpose

A personal portfolio site for Clarence Wong (黄炜文), hosted on GitHub Pages, presenting his profile, resume, skills, and projects. Success = a polished, memorable presence that makes visitors understand the arc (education → data science/AI) and reach out.

## Positioning

An educator with chemistry roots who builds AI/ML tools and publishes research — the site must communicate both rigor (data, statistics, research) and craft (teaching, design, pedagogy) as one person.

## Operating Context

Visitors arrive from LinkedIn, GitHub, Google Scholar, resumes, or business cards, mostly on desktop and mobile browsers. The page is a single-scroll experience with WebGL 3D and scroll-triggered animation. Hosted statically on GitHub Pages (no server-side logic).

## Capabilities and Constraints

- Static site, GitHub Pages compatible (no backend).
- Full WebGL/Three.js 3D hero world + scroll-driven 3D transformation; project cards with real depth (user-confirmed direction).
- Contact via mailto:contact@clarencewongww.com (no server-side form — user chose this over form services).
- Content: all current sections kept (About, Resume, Skills, Projects, Hire Me, footer); archived wording preserved, with the original typos corrected once (user request); no new sections requested yet.
- Assets: reuse archived assets in old-web-resources/ (profile photo, 4 project thumbnails, hero background, loader.gif). Visual world is new; old look is not authority.
- Socials preserved: LinkedIn (linkedin.com/in/clarencewongww), GitHub (github.com/clarencewongww), Google Scholar (scholar.google.com/citations?user=C7ygBNAAAAAJ).
- Accessibility: content must remain visible and readable without WebGL; 3D is enhancement, not the content carrier.

## Brand Commitments

- Name: Clarence Wong (黄炜文)
- Email: contact@clarencewongww.com
- Website: www.clarencewongww.com (will be hosted on GitHub Pages)
- Tagline: Educator / Learning Designer / Data Analyst / Computer Science Student
- User-confirmed aesthetic direction: abstract "data × education" 3D world with name overlaid; scroll-driven 3D transformation; project cards with depth; full WebGL/Three.js.

## Evidence on Hand

- old-web-resources/site-content.md — full verbatim copy of all text
- old-web-resources/all-links.md — catalog of every link
- old-web-resources/images/ — profile-photo-clarence-wong.png, project-online-learning-prediction.jpg, project-chemapparatus.png (WebP content in .png container), project-agency-dash-dashboard.png, project-policy-book-chapter.png, hero-background-cover.jpg, loader.gif
- old-web-resources/assets-manifest.md — full inventory with source URLs

## Product Principles

1. One scroll, one arc: education → data → AI; every section advances the story.
2. 3D is material, not decoration: WebGL must dramatize real content (data, chemistry, projects), never obscure it.
3. Content first: all archived copy preserved; readability outranks effects.
4. Static and robust: zero backend, graceful fallback for reduced-motion and weak GPUs.

## Accessibility & Inclusion

Reduced-motion support required (prefers-reduced-motion); content readable without WebGL (fallback layer); keyboard navigable.
