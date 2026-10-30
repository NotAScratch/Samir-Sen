# Taste — v5, "Field Edition"

## Read this before writing any UI

1. Read `design/tokens.css`. Every value in `styles.css` comes from it.
2. The spec is `docs/superpowers/specs/2026-10-30-v5-field-edition-design.md`.
   The Figma file (https://www.figma.com/design/1H3FimcUCNMbv5AZWmbG47) still
   shows an older version until it is synced; until then the repo is the source
   of truth. If code and this file disagree, fix the token, not the component.
3. This is the personal site of an R&D AI roboticist and automation engineer,
   set as **one issue of a printed magazine about his work**. Cover, contents,
   feature spreads, a photo essay, columns, a back page. Bold the way good
   editorial design is bold: huge type, confident crops, heavy rules, one
   colour used with restraint. Not a SaaS landing page, not a dark "tech" site,
   not a portfolio card grid.

## The issue, page by page

| Page | Section | What it is |
|---|---|---|
| Masthead | header | Name, issue line, contents links, live Kathmandu clock |
| Cover | `#top` | The headline, the humanoid standing in front of the type, cover lines |
| 01 Profile | `#about` | Standfirst, drop-cap essay, pull quote, the perception head |
| 02 Features | `#work` | Two feature spreads with giant numerals, then "Also in this issue" |
| Photo essay | interlude | Ink spread: the quadruped walks the track under a pull quote |
| Specimens | `#specimens` | 3D objects from NVIDIA SimReady (hidden until assets exist) |
| 03 Toolkit | `#services` | Four columns, lettered A–D, with the arm |
| 04 Career | `#experience` | Years set big on the left, entries on the right |
| 05 Columns | `#notes` | Three short opinion columns |
| Back page | `#contact` | Signal field: "Have a difficult problem?" and the hand |

## Colour

- **Newsprint** `--paper` is the page; `--paper-deep` marks alternating spreads.
- **Ink** carries type, rules and the two ink spreads (photo essay, footer).
- **Signal** `--signal` is the issue's one colour. It appears only as:
  feature numerals and toolkit letters, the single signal word in the cover
  headline, the back page field, status dots (and the callout anchor dots),
  and the one output each project diagram detects. Never body text,
  never decoration, never two signal elements fighting in one viewport
  (the back page field is the exception: it *is* the signal).
- On ink, type is `--on-ink` / `--on-ink-muted`; on signal, type is `--on-signal`.

## Type

- **Archivo**, condensed (`--display-width`) black caps, for everything that
  shouts: cover, feature heads, numerals, project titles, the masthead name,
  table titles. Tight leading. The footer wordmark uses the wide cut.
- **Newsreader** serif for reading: standfirsts (italic), body, pull quotes,
  columns. Editorial text should look like it was meant to be read.
- **JetBrains Mono** caps for data only: folios, dates, captions, specs,
  stack lists, the clock. Never for prose.
- `--text-cover` is used exactly twice: the cover headline and the back page.
- Headlines colour at most one word, with `<span class="hl">`, and only the
  cover's word is signal; others stay ink. Never `<em>` in headings.
- One drop cap, on the profile essay.

## Layout

- 12 columns in a 1440px container, with `--margin` outside it. One media
  breakpoint (48rem). Below it everything stacks in reading order.
- Every section opens with a **folio rule**: a 2px ink rule with the page
  number left, section name centre-left and running meta right
  (`02 — Features ………… Samir Sen · Field Edition`).
- Feature spreads alternate media left / right. The numeral is huge and in
  signal; the title is huge and in ink; the deck is serif italic.
- Secondary projects are an index table ("Also in this issue"), not cards.
- Square corners everywhere. Buttons are ink rectangles with mono caps.
- Let things be big. Crop the robot over the type on the cover; let numerals
  hang off the column.

## Robots and 3D

The cast from v3/v4 is unchanged (see `robots/`): humanoid on the cover,
perception head in the profile, quadruped in the photo essay, arm in the
toolkit, hand on the back page, waving robot in the footer.

1. **One live 3D canvas per viewport** (the lifecycle in `robots/index.js`
   enforces it). Posters cover reduced motion, data saver, no WebGL and
   failures.
2. Robots wear the porcelain shell (`--robot-shell`), ink joints and a signal
   status light. Canvases are transparent and `aria-hidden`.
3. **Robots stand in the layout like cut-out photography**: no boxes, no
   frames, overlapping type is allowed on the cover only.
4. **Specimens** are real third-party 3D objects (NVIDIA SimReady, via
   Hugging Face), converted to GLB with `tools/simready/`. They keep their own
   materials (they are objects, not cast members), sit on the same studio
   light, and are credited in the caption with their licence. The section
   stays hidden until `assets/simready/manifest.json` lists at least one
   specimen. Never fake a specimen.

## Project media

- Real captures replace diagrams when they exist.
- Until then, diagrams are SVG in ink and paper with signal for the one thing
  the system outputs. Labels name outputs (class, distance, bearing) without
  made-up numbers. Every figure has a mono `Fig. NN — …` caption.

## Motion

- **The cover sets itself (the one authored moment).** On load each cover
  line rises out of a mask, staggered, over `--dur-cover`.
- Content reveals fade up `--reveal-distance` over `--dur-reveal`.
- Index rows open in place; the photo-essay track walks with the quadruped.
- Everything respects `prefers-reduced-motion`.

## Accessibility

- Contrast floors are tested in `tests/unit/styles.test.mjs`.
- Focus is always visible: `--focus-ring`, or `--focus-ring-inverse` on ink.
- Hit targets are at least `--control-h` tall.

## Banned

- Shadows, gradients, glassmorphism, blur, grain, custom cursors
- Dark mode or a theme toggle (the ink spreads are pages, not a theme)
- Signal colour as body text or decoration
- Rounded corners, cards around content, card grids for work
- Stock photography and AI-generated robot images
- Marquees, tickers, decorative particles
- Invented numbers in diagrams or invented specs for robots
- Placeholder or fake 3D specimens
- Motion that ignores `prefers-reduced-motion`

## Rule of thumb

If it wouldn't survive being printed — if it only works because it glows,
blurs or bounces — cut it. What stays should read like a well-edited page:
one big idea per spread, everything else quiet.
