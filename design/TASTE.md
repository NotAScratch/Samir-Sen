# Taste — v4, "Bauhaus Kinematics"

## Read this before writing any UI

1. Read `design/tokens.css`. Every value in `styles.css` comes from it.
2. The spec is `docs/superpowers/specs/2026-10-08-v4-bauhaus-kinematics-design.md`.
   The Figma file (https://www.figma.com/design/1H3FimcUCNMbv5AZWmbG47) still
   shows v3 until it is synced; until then the repo is the source of truth.
   If code and this file disagree, fix the token, not the component.
3. This is the personal site of an R&D AI roboticist & automation engineer.
   It reads as a robot taken apart into Bauhaus primitives: shapes for what
   each part does, primaries for which skill it is, ink for structure. Playful
   in form, strict in rules. Not a SaaS landing page, not a dark "tech" site,
   not a beige poster.

## The system: one shape and one colour per skill

| Skill | Shape | Token | Colour |
|---|---|---|---|
| Perception — sensing, vision, detection | circle ● | `--perception` | red |
| Edge compute — processing, backend, embedded logic | square ■ | `--compute` | blue |
| Actuation — hardware, motion, physical output | triangle ▲ | `--actuation` | yellow |
| Data — analysis, ML on datasets | half-disc ◖ | `--data` | ink |

- The mapping never bends. A red circle always means perception; if a block
  isn't about perception it doesn't get red. Pick the shape from what the
  thing *does*, not from which colour would look nice there.
- Shapes are the page's only icons: in the wordmark, hero callouts, the hero
  legend, the capabilities strip, facts, project kickers, the index table,
  service tiles, timeline nodes and the footer legend. Always `aria-hidden`;
  the text beside them carries the meaning.
- The hero H1 colours exactly three words, one per skill: *see* (red),
  *think* (blue), *move* (ink with a yellow bar). Every other heading colours
  at most one word, with `<span class="word word--{skill}">`, never `<em>`.

## Colour

- **Ground** `--bg` is the page. `--paper` marks alternating bands (work,
  experience). Ink carries type and structure.
- **Colour fields** — one per skill, used once each: the profile's blue square
  (compute: the head that thinks), the interlude's yellow band (actuation:
  the walking dog), the contact's red band (perception: "have a difficult
  problem?"). Ink bands for the capabilities strip and footer.
- **Status dots** are red (the nav live dot, the current role).
- **Contrast**: body copy is `--ink-muted` on ground/paper/yellow. Red text
  only at `--text-h3` and up. Yellow is never a text colour on a light
  surface; an actuation word is ink with a yellow underline bar. On red,
  blue and ink, type is `--white` and focus uses `--focus-ring-inverse`.

## Type

- **Unbounded**, lowercase, tight tracking for display: H1, H2, H3, the
  wordmark, nav links, section-label names, project titles. 800 for hero/H2,
  600 for smaller display.
- **Geist** for body; **Geist Mono** (uppercase, tracked) for technical
  labels, captions, specs and meta.
- `--text-hero` is used exactly twice: the hero H1 and the contact headline.
  Section heads are `--text-h2`. The footer ends on the lowercase name with a
  yellow full stop.
- No serif anywhere.

## Layout

- Desktop: 12 columns inside a 1320px container, 24px gutters, 60px margins.
  Mobile: 4 columns, 16px gutters, 20px margins. One media breakpoint
  (48rem); finer adaptation uses container queries with token thresholds.
- Every section opens the same way: the **section label** (number, name, a
  2px ink rule that fills the row, meta on the right — `01 profile ——
  (ABOUT)`), then a heading row (H2 left, aside right), then content.
- Structure is drawn with **2px ink rules** (`--rule`). Hairlines only
  separate table rows. Heavy rules (`--rule-heavy`) for the gait track, the
  timeline spine and underline bars.
- Square corners everywhere. Only buttons, tags, chips and the menu trigger
  are pills.
- Featured work stays **asymmetric and alternating** (media 8, meta 3), and
  secondary projects stay an **index table**, not a card grid.

## Robots (live 3D)

Unchanged cast and behaviour (see v3 table in git history and
`robots/`): humanoid in the hero, perception head in 01, quadruped in the
interlude, arm in 03, hand in 06, waving robot in the footer.

1. **One robot per section, never two in a viewport.**
2. **One material language**: `--robot-shell` (paper white), `--robot-joint`
   (ink), `--robot-signal` (red status light), shared studio light, contact
   shadow at `--robot-shadow`. Downloaded models get their materials replaced.
3. **Robots stand on shapes, never in boxes.** The canvas is transparent; the
   composition behind it (circle, square, triangle, disc, ground bar) is plain
   HTML/CSS, never drawn in the canvas.
4. **Annotate, don't decorate.** Hero callouts map parts to real skills and
   carry the skill's shape. Never invent specs for the robot itself.
5. **Posters first.** Every robot has a transparent PNG/WebP still rendered
   from the same scene (`tools/posters.html`). Re-render them whenever robot
   tokens change.
6. **Performance** and **accessibility** rules from v3 still apply: lazy
   per-section renderers, pixel ratio ≤ 2, `aria-hidden` canvases, posters
   for reduced motion / no WebGL / failures.

## Project media

- Real captures replace the diagrams as soon as they exist.
- Until then, diagrams are SVG in the Bauhaus language: detection boxes over
  primitive shapes, lidar rings on a blue field. Labels name what the system
  outputs (class, distance, bearing) without made-up numbers. Every frame
  has a mono `Fig. NN — …` caption.

## Motion

Quiet and mechanical — driven, not bounced.

- Section content fades up `--reveal-distance` over `--dur-reveal`,
  staggered by `--stagger`.
- Hero shapes settle `--settle-distance` into place over `--dur-settle` on
  load, from a visible state; the orbit turns once per `--dur-orbit`.
- Robot behaviour, gait track, hand nudge and press scale as in v3.
- Everything respects `prefers-reduced-motion`.

## Accessibility

- Contrast floors are tested in `tests/unit/styles.test.mjs`.
- Focus is always visible: `--focus-ring` on light surfaces,
  `--focus-ring-inverse` on red, blue and ink.
- Hit targets are at least `--control-h` tall.

## Banned

- Shadows, gradients, glassmorphism, blur panels, grain, custom cursors
- Dark mode or a theme toggle (the ink bands are part of the page, not a theme)
- A primary colour used where it doesn't mean its skill
- Red or yellow body text; yellow text on a light surface
- Serif type; `<em>` styling in headings
- Rounded containers or cards around content or robots
- Card grids for work — featured blocks + index table instead
- Stock photography and AI-generated robot images
- Robots outside the approved lineup, or in their original colours
- Marquees and decorative particles
- Invented numbers in diagrams
- Motion that ignores `prefers-reduced-motion`

## Rule of thumb

If a shape or colour doesn't tell someone which skill they're looking at,
remove it. What stays should feel assembled: aligned to the grid, labelled
like an instrument, and built from four shapes.
