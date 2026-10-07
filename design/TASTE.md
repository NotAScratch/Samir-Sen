# Taste — v3, "Precision White"

## Read this before writing any UI

1. Read `design/tokens.css`. Every value in `styles.css` comes from it.
2. The Figma file is the visual source of truth:
   https://www.figma.com/design/1H3FimcUCNMbv5AZWmbG47
   - `01 — Foundations`: components (Button, Tag, Section Label, Callout),
     robot stills (posters of the live 3D robots), colour/space
     variables and text styles.
   - `02 — Desktop · 1440` and `03 — Mobile · 390`: the full homepage.
   If code and Figma disagree, Figma wins — then fix the token, not the
   component.
3. This is the personal site of an R&D AI roboticist & automation engineer.
   It should read like a precision instrument's spec sheet laid out by an
   editorial designer: white paper, black ink, hairlines, and robots drawn
   as annotated figures. Not a SaaS landing page, not a dark "tech" site.

## What this project looks like (v3)

- **White is the material.** `#FFFFFF` from the first pixel to the last.
  No tinted sections, no grey panels, no dark mode, no theme toggle.
- **Ink does the structure.** Type and 1px hairlines (`--line`) carry all
  separation. Rows, timelines, specs and section openers are divided by
  hairlines, never by boxes or shadows.
- **One accent, for signals only.** `--accent` (signal orange) marks live
  state: the status dot in the nav, the "current role" dot, a live-feed
  indicator, a sensor heading vector. It is never a button, a link, a
  background or decoration. The primary button is ink.
- **Type.** Geist for everything structural, Geist Mono (uppercase,
  tracked) for technical labels, and Instrument Serif Italic for exactly
  **one word per headline** — the human note in a machine-precise system
  (*move.*, *tangible.*, *solution.*, *problem?*). Never two serif words in
  one heading, never serif in body copy.
- **Big type is the personality.** `--text-hero` is used exactly twice:
  the hero H1 and the contact headline. Every other section head is
  `--text-h2`. The footer ends on the name set to the full container width
  (`--text-wordmark`).

## Layout

- Desktop: 12 columns inside a 1320px container, 24px gutters, 60px
  margins. Mobile: 4 columns, 16px gutters, 20px margins.
- Every section opens the same way: the **Section Label** (index, title,
  a hairline rule that fills the row, meta on the right — `01 PROFILE ——
  (ABOUT)`), then a heading row with the H2 on the left and a 3-column
  aside on the right, then content.
- Featured work is **asymmetric and alternating**: media spans 8 columns,
  meta spans 3 (index, title, description, spec rows, "Read the case
  study →"). The next project mirrors it. Secondary projects go in an
  **index table** (No. / Project / Domain / Stack / ↗), not a card grid.
- Navigation is a quiet top bar: wordmark left, live status centre, links
  and a ghost "Let's talk" pill right. On mobile it collapses to the
  wordmark and a "● Menu" pill.
- Square corners everywhere. Only buttons, tags and the menu trigger are
  pills.

## Robots (live 3D)

The robots are real-time Three.js components, not images. Two sources,
combined: robots **built in code** (owned outright, every joint
animatable) for the main cast, and **free CC0 models** where hand-building
would cost more than it's worth. Prototypes live in `design/3d-lab/`
(`procedural.js` for the code-built robots, `models/` for the downloads).

| Robot | Source | Section | Behaviour |
|---|---|---|---|
| Unit-01 humanoid | Code | Hero | Idles and shifts weight; head turns toward the cursor |
| Profile head | Code | 01 Profile | Inside the viewfinder; tracks the cursor; status light blinks |
| Unit-K9 quadruped | Code | Interlude | Trots along the dashed distance track while in view |
| Robot Arm | Free · Yali Izzo · CC0 | 03 Services | Slow turntable beside the heading |
| Contact hand | Code | 06 Contact | Points at the email; eases `--hand-nudge` toward it on hover/focus |
| Animated Robot | Free · Quaternius · CC0 | Footer | Waves (its built-in clip) when "Back to top" is hovered |

Rules:

1. **One robot per section, never two in a viewport.** They are accents
   to the work, not the work.
2. **One material language.** Every robot, including downloaded ones,
   renders in `--robot-shell` (matte white) and `--robot-joint` (graphite)
   with the shared studio light: room environment, one soft key light,
   and a contact shadow at `--robot-shadow` opacity. Downloaded models get
   their materials replaced on load and never keep their own colours.
3. **No boxes.** The canvas is transparent and sits directly on `--bg`.
   No cards, borders or panels behind a robot.
4. **Annotate, don't decorate.** The hero callouts map robot parts to real
   skills (head → Perception · OpenCV/PyTorch, chest → Edge compute ·
   Jetson Nano/Lidar, hand → Actuation · embedded control). Callouts are
   real HTML text, never drawn in the canvas. Never invent specs for the
   robot itself.
5. **Posters first.** Every robot has a transparent PNG still (rendered
   from the same scene — `design/3d-lab/stills.html`) that shows before
   the 3D loads, and stays put for `prefers-reduced-motion`, no WebGL, or
   a failed load. The Figma file uses these same stills.
6. **Performance.** One WebGL renderer for the whole page (scissor per
   section) or lazy-initialised per section; render only what's on
   screen; pixel ratio capped at 2. Total model weight under 1.5 MB.
7. Robots are decorative: the canvas is `aria-hidden="true"` and the
   callout text carries the meaning.
8. CC0 models need no credit, but list them on a credits line anyway.

## Project media

- Real captures (live feed, sensor output, hardware photos) replace the
  wireframe placeholders as soon as they exist.
- Until then, placeholders are hand-authored SVG in the same line
  language as the Figma frames: detection boxes with ink label chips,
  lidar range rings with point returns. Every frame gets a mono
  `Fig. NN — …` caption below it.
- Any numbers inside a placeholder (confidence, distance, heading) are
  illustrative and must be replaced by real output before launch.

## Motion

Quiet and mechanical — things move like they are driven, not bounced.

- Section content fades up `--reveal-distance` over `--dur-reveal`,
  staggered by `--stagger`.
- Robot heads turn toward the cursor, damped, never more than
  `--look-max`. Whole-robot parallax tilt is capped at `--parallax-tilt`.
- Quadruped: trots only while its section is in view; the track scrolls
  under it at `--walk-distance` per cycle.
- Contact hand: eases `--hand-nudge` toward the email on hover/focus of
  the email link.
- Buttons press to `--press-scale`.
- Everything respects `prefers-reduced-motion`: reveals become instant,
  and every robot shows its poster still instead of animating.

## Accessibility

- `--ink-muted` (6.7:1) is the minimum for body copy. `--ink-faint`
  (4.5:1) is only for mono meta labels and captions.
- Focus is always visible: `--focus-ring` with `--focus-offset`.
- Hit targets are at least `--control-h` tall.

## Banned

- Any background other than `--bg`; dark sections; dark mode
- Shadows, gradients (text, backgrounds, buttons), glassmorphism, blur
  panels
- Cards and rounded containers around content or robots
- The accent used for anything other than live/status signals
- More than one serif word per headline
- Card grids for work — featured blocks + index table instead
- Stock photography and AI-generated robot images
- Robots outside the approved lineup — new ones go through
  `design/3d-lab/` first, in the shared materials and light
- Downloaded models in their original colours
- Custom cursors, grain overlays, decorative particles — the robots and
  the type carry the page
- Motion that ignores `prefers-reduced-motion`

## Rule of thumb

If an element doesn't help someone understand the work faster, delete it.
If it stays, it should feel measured: aligned to the grid, labelled like
an instrument, and set in ink on white.
