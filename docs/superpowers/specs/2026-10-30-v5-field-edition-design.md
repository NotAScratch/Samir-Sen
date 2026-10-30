# v5 "Field Edition" — design

Date: 2026-10-30 · Branch: `claude/gallant-feynman-e7i37x` · Status: direction
chosen in chat ("New v5 system", "Editorial bold", "add SimReady assets").

## Goal

Replace v4 "Bauhaus Kinematics" with an editorial-bold system: the homepage
reads as one issue of a printed magazine about Samir's work. Cover, profile,
feature spreads, photo essay, specimens, toolkit, career, columns, back page.

Success means:
- Same real copy, same six robots (live + posters), same behaviour: menu,
  index disclosure, case-study dialog, reveal, attend (email → hand, back to
  top → waver), quadruped walk.
- A specimens section ready for NVIDIA SimReady 3D assets from Hugging Face,
  rendered through the existing one-canvas-per-viewport lifecycle, hidden
  until real assets exist.
- No horizontal scroll at 390px; focus visible on every surface; body text
  ≥ 4.5:1; reduced motion gets a still page.

## Constraints

- Static site, no build step, no npm dependencies; Three.js on the pinned
  jsDelivr import map.
- Every CSS value comes from `design/tokens.css` (tested).
- One media breakpoint, 48rem.
- GitHub Pages deploys `main`; this work stays on the feature branch.

## Palette and contrast

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F1EDE4` | page (newsprint) |
| `--paper-deep` | `#E6E0D3` | alternating spreads |
| `--ink` | `#0F0E0C` | type, rules, ink spreads |
| `--ink-muted` | `#45423C` | body · 8.6:1 on paper |
| `--ink-faint` | `#625E55` | captions · 5.5:1 on paper, 4.9:1 on deep |
| `--signal` | `#E8380C` | numerals, cover word, back page field, dots · 3.6:1 (display only) |
| `--on-ink-muted` | `#B9B3A6` | secondary type on ink · 9.2:1 |

Ink on signal is 4.6:1, so the back page sets its body in ink.

## Type

Archivo (variable width, condensed black caps) for display; Newsreader for
reading; JetBrains Mono for data. Loaded from Google Fonts.

## SimReady specimens

- Hugging Face was unreachable from the build session (network policy), so
  no assets are committed. `tools/simready/README.md` documents the download
  (`hf download`) and USD → GLB conversion; converted files go in
  `assets/simready/` and are listed in `assets/simready/manifest.json`.
- `lib/specimens.js` reads the manifest. Empty → the section stays `hidden`.
  Otherwise it builds a list of specimen buttons and one `data-robot="specimen"`
  stage whose `data-model` swaps on selection. `robots/registry.js` builds it
  with `buildSpecimen` (keeps the asset's own materials, slow turntable).
- Each specimen carries its name, category and licence/credit from the
  manifest. Nothing is invented.

## Out of scope

Figma sync; re-rendering posters (the robot shell token keeps its v4 value so
the existing posters still match).
