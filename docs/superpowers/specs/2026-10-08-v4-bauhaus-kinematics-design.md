# v4 "Bauhaus Kinematics" — design

Date: 2026-10-08 · Branch: `claude/ecstatic-darwin-nm9m35` · Status: direction and
full-page mockup approved in chat ("Bauhaus Kinematics is the choice"; "go ahead
and complete all 4 tasks").

Visual reference: the approved mockup published at
https://claude.ai/artifact/H1XBBwq1bWu2EdUoDTERa1 (source kept in the session
scratchpad; screenshots were reviewed at 1440 and 390).

## Goal

Replace v3 "Precision White" (white page, ink hairlines, one orange signal) with
v4 "Bauhaus Kinematics": a robot read as Bauhaus primitives. Every skill gets
one shape and one primary colour, and the same shapes act as icons, markers
and legend across the page, so the system explains itself.

| Skill | Shape | Colour |
|---|---|---|
| Perception (sensing, vision) | circle ● | red |
| Edge compute (processing, backend) | square ■ | blue |
| Actuation (hardware, embedded, motion) | triangle ▲ | yellow |
| Data (analysis, ML on logs) | half-disc ◖ | ink |

Success means:
- The homepage at 1440 and 390 matches the mockup's structure, colour fields,
  type and shape language, using the existing real copy and the six robot
  posters / live robots.
- All existing behaviour keeps working: live robots + posters, callouts on
  3D anchors, menu, index disclosure, case-study dialog, reveal, attend
  (email → hand, back to top → waver), quadruped walk.
- No horizontal scroll at 390px; focus visible on every surface; body text
  ≥ 4.5:1 on its own surface; reduced motion gets a still page.

## Constraints

- Static site, no build step, no npm dependencies. Three.js stays on the
  pinned jsDelivr import map.
- Every CSS value comes from `design/tokens.css`; `styles.css` has no raw
  hex/rgb/px/durations (existing contract, kept).
- Still banned: shadows, gradients, blur panels, grain, custom cursors, dark
  mode / theme toggle, stock or AI-generated robot images, invented numbers.
- One media-query breakpoint (48rem) remains; finer adaptation uses
  container queries whose thresholds mirror tokens.
- GitHub Pages deploys `main`; this work stays on the feature branch.

## Palette (tokens) and contrast

| Token | Value | Use |
|---|---|---|
| `--bg` (ground) | `#E8EAEE` | page background (cool concrete) |
| `--paper` | `#F4F5F7` | alternating bands (work, experience), robot shell |
| `--ink` | `#141414` | type, rules, buttons, footer band, data shape |
| `--ink-muted` | `#4A4C52` | body copy (7.1:1 on ground, 4.7:1 on yellow) |
| `--ink-faint` | `#5E6068` | mono labels/captions only (5.2:1 on ground) |
| `--red` | `#D7261E` | perception; contact band; status dots |
| `--blue` | `#1F45B5` | compute; profile field |
| `--yellow` | `#F2B705` | actuation; interlude band; underline bars |
| `--white` | `#FFFFFF` | text on red/blue/ink, contact disc |

Red on ground is 4.2:1: red may colour display type (≥ `--text-h3`) and
shapes, never small text. Yellow is never a text colour on light surfaces; an
actuation word is ink with a yellow bar under it. White on red is 5.0:1.

## Type

- Display: **Unbounded** (600, 800), lowercase, tight tracking — H1, H2, H3,
  wordmark, nav links, section-label names.
- Body: **Geist** 400/500. Labels: **Geist Mono** uppercase, tracked.
- Instrument Serif is retired. Headings no longer use `<em>`; a coloured word
  is `<span class="word word--{skill}">`. H2s carry at most one; the hero H1
  carries exactly three (see / think / move = perception / compute /
  actuation).
- `--text-hero` stays on exactly the hero H1 and the contact H2.

## Structure, section by section

- **Nav**: ground bar with a 2px ink bottom rule; wordmark = three mini
  shapes + "samir sen"; red live dot + Kathmandu clock; lowercase display
  links; ink pill "Let's talk".
- **Hero**: H1 left; the humanoid stands on a composition (red circle behind
  the head, blue square behind the chest, yellow triangle at the hand,
  dotted orbit, ink ground bar). Callouts become bordered tags with the
  matching shape glyph. A visible three-item legend (perception / edge
  compute / actuation) under the actions.
- **Capabilities strip**: ink band, white display text, shape glyphs between
  items (static — no marquee).
- **01 Profile**: the bust stands in a blue square field with a red "eye"
  circle; facts carry a shape glyph after each value.
- **02 Work** (paper band): featured projects with Bauhaus diagrams
  (detection boxes over shapes; lidar rings on blue) with no invented
  numbers; kicker glyph by skill; index table domain column gets glyphs and
  rows highlight yellow on hover.
- **Interlude**: full-bleed yellow band after the work section; the
  quadruped walks on a heavy ink track with metre ticks.
- **03 Services**: the arm stands on a yellow triangle; four tiles in a ruled
  grid, each with its big shape, (A)–(D), copy and stack chips.
- **04 Experience** (paper band): timeline on a thick ink spine with shape
  nodes; the current role keeps its red live dot.
- **05 Notes**: three columns with heavy top bars in red / blue / yellow
  (note 001 perception, 002 edge constraints, 003 hardware loop).
- **06 Contact**: red band, white type; the hand points at the email from a
  white disc with a blue square; yellow bar under the email; inverted pills.
- **Footer**: ink band, lowercase wordmark "samir sen" with a yellow dot,
  waving robot, credits and shape legend.
- **Case-study dialog**: ground panel with a 2px ink border, ink backdrop.

## Robots

Material language changes with the palette: shell `--paper` (cool matte
white), joints `--ink`, status light `--red` (new `--robot-signal` token; the
orange `--accent` is retired). Posters are re-rendered from the same scene
with `tools/posters.html` so poster and live render match.

## Motion

Driven, not bounced (unchanged tokens). Additions: hero shapes settle in on
load from a visible resting state; the orbit turns slowly. Everything is
still under `prefers-reduced-motion`.

## Figma

The Figma file is meant to mirror the tokens and frames. The Figma MCP
returned a Starter-plan call limit on 2026-10-08; Figma sync is attempted
last and reported honestly if still blocked.
