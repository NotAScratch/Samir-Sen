# Taste — v2, "Kinetic Lab"

## Read this before writing any UI

1. Read `design/tokens.css`. Every value used in `styles.css` comes from it.
2. Researched against current (Sep 2026) Awwwards portfolio winners and the
   Awwwards Portfolio category directory before building this. Recurring
   pattern across the top ~15 sites: bold accent + neutral dark/light base,
   one distinctive display typeface (never a default system font at scale),
   WebGL/Three.js + GSAP for motion, fullscreen single-page scrollytelling,
   unconventional navigation (rarely a plain top navbar).
3. This is a personal site for an R&D AI robotics & automation engineer.
   The visual language should read as a physical lab instrument crossed
   with a confident design portfolio — not a SaaS template, not the old
   "instrumentation card grid" pass.

## What this project looks like (v2)

- Warm near-black canvas, bone-white text, ONE molten-amber accent used for
  actions, the live-status dot, and the 3D gyroscope's emissive core. Never
  decoration elsewhere.
- Unbounded (display, huge, kinetic) + Inter (body) + IBM Plex Mono (labels).
  Hero and section heads are genuinely large — clamp scales in tokens.css
  go up to ~9.5rem. Big type is the personality; there is no gradient doing
  that job instead.
- No conventional top navbar. A fixed corner wordmark + a menu trigger that
  opens a fullscreen overlay nav. This is the "unusual navigation" pattern
  the research called out, not decoration for its own sake.
- A full-bleed Three.js scene sits behind the hero copy: three nested
  rotating rings (a gyroscope/gimbal — matches "automation") with a molten
  core, scroll-linked spin, mouse parallax. Desaturated enough that the
  headline stays legible over it. This is the one 3D moment; it is not
  repeated as decoration in every section.
- Work section is full-bleed alternating blocks (image/text), not a small
  card grid — matches the "scrollytelling" pattern, and gives the real
  project photography room to read.
- A subtle grain/noise overlay (SVG filter, no image asset) keeps the flat
  colour fields from feeling like a template.
- Custom cursor (dot + ring, grows over interactive elements) on
  pointer:fine devices only; falls back to the native cursor on touch.

## Banned by default

- Gradient text, gradient backgrounds, gradient buttons
- Drop shadows on cards or buttons
- More than one accent colour doing decorative work
- A plain top navbar as the primary nav (this project's whole point this
  pass is to not default to that)
- Small illustrative card grids for "selected work" — already tried that
  in v1, it read as a template. Full-bleed blocks instead.
- Motion that can't be turned off: everything respects
  `prefers-reduced-motion` — GSAP timelines get `duration: 0` fallbacks,
  the custom cursor and gyroscope both no-op.

## Rule of thumb

If a portfolio you researched does it because "that's just what portfolios
do" (top navbar, card grid, gradient hero), that's the thing to cut. Do it
because a specific reference does it well and it fits AI robotics — not
because it's the default.
