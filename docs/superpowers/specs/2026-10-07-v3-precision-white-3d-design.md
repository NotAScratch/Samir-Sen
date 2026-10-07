# v3 "Precision White" site with live 3D robots — design

Date: 2026-10-07 · Branch: `v3-precision-white` · Status: approved in chat, pending spec review

## Goal

Replace the current dark v2 "Kinetic Lab" site with the v3 "Precision White"
design from Figma (https://www.figma.com/design/1H3FimcUCNMbv5AZWmbG47),
with the flat robot images replaced by live Three.js robots: four built in
code plus two free CC0 models, all in one material language.

Success means:
- Desktop (1440) and mobile (390) match the Figma frames' structure,
  type, spacing and copy.
- Six robots render live, each in its section, with the behaviours below.
- With reduced motion, without WebGL, or with data-saver on, every robot
  shows its poster still and the page is complete without JS 3D.
- No console errors; no horizontal scroll at 390px; keyboard focus
  visible everywhere.

## Constraints

- Static site: plain HTML/CSS/JS, ES modules, no build step, no npm.
  Three.js from jsDelivr via an import map (pinned `three@0.169.0`).
- GitHub Pages deploys the **entire repo root** on every push to `main`.
  Anything committed is public; nothing ships until the branch is merged.
- `design/TASTE.md` and `design/tokens.css` (v3) are the rules. No raw
  values in CSS/JS styling — tokens only. 3D colours are read from tokens
  (`--robot-shell`, `--robot-joint`, `--robot-shadow`, `--accent`).
- Content is the existing real content (projects, roles, skills, notes,
  case studies). Nothing invented.

## Decision: one canvas per robot, lazily started

Each robot section owns a small transparent `<canvas>`. A shared
IntersectionObserver starts a robot's renderer when its section comes
within 200px of the viewport, pauses its loop when it leaves, and disposes
the WebGL context when it is more than two viewports away. At most ~2
contexts are live at once. Text layers above the canvas via normal DOM
stacking. (Rejected: one shared scissor canvas — draws over the hero
headline and lags on mobile scroll; `<model-viewer>` for downloads — a
second lighting system.)

## File layout

```
index.html            rewritten to the Figma structure
styles.css            rewritten; tokens only
script.js             rewritten: reveals, mobile menu, details, case study, clock
robots/
  index.js            finds [data-robot], gates on capability, lazy lifecycle
  stage.js            renderer + scene + light + shadow + camera for one robot
  materials.js        shared shell/joint/visor/rubber/signal materials from tokens
  cast.js             code-built robots (from design/3d-lab/procedural.js)
  models.js           GLB loader → matte override → same interface as cast
assets/
  models/robot-arm.glb        Yali Izzo, CC0 (409 KB)
  models/animated-robot.glb   Quaternius, CC0 (392 KB)
  posters/*.webp              transparent stills, one per robot
tools/
  posters.html, posters.js    renders the posters from robots/ (dev only, noindex)
  poster-server.py            static server that accepts the poster PUTs
```

Removed: `hero-scene.js`, the GSAP `<script>`, theme toggle, custom
cursor, grain overlay, and the LEGACY ALIASES block in `tokens.css`.
`design/3d-lab/` stays local and is added to `.gitignore` (it holds 7 MB
of comparison models and AI renders that must not deploy).

## Page structure (maps 1:1 to Figma frames)

1. **Nav** — wordmark; centre status: live dot + "Kathmandu · HH:MM NPT ·
   Open to collaborations" (live clock via `Intl`, `Asia/Kathmandu`);
   links Work / About / Services / Notes + ghost "Let's talk". Mobile:
   wordmark + "● Menu" pill opening a full-screen list.
2. **Hero** — eyebrow, H1 "Systems that / see, think, / and *move.*",
   intro, Primary "Selected work ↘" + Ghost "Download CV ↓", ground line,
   foot row (Scroll ↓ · coordinates · Portfolio — Vol. 03 / 2026).
   Robot: **Unit-01 humanoid**, with three HTML callouts (Perception ·
   Edge compute · Actuation) positioned over the canvas.
3. **Capabilities strip** — five mono items between hairlines.
4. **01 Profile** — Section Label; viewfinder (corner ticks) with
   **profile head**; H2 "Curiosity, made *tangible.*"; lead, body, mono
   note; facts row (06 / 2025 / KTM).
5. **02 Work** — Section Label; H2 "From signal to *solution.*" + aside;
   featured 01 (media left 8 cols, meta right 3) and featured 02
   (mirrored), each with its SVG wireframe placeholder, spec rows, and
   "Read the case study →" opening the existing case-study dialog;
   **interlude** with **Unit-K9 quadruped** on the dashed metre track and
   the "Locomotion is a *perception* problem first." line; index table
   03–06 where each row is a button that expands its existing "problem
   solved" text.
6. **03 Services** — Section Label; H2 "A practical *stack.*" + aside;
   **robot arm** beside the heading; four service columns.
7. **04 Experience** — H2 "Learning by *shipping.*" + timeline (current
   role has the live dot).
8. **05 Notes** — H2 "Work in *progress.*" + three notes (meta "Draft").
9. **06 Contact** — H2 "Have a difficult *problem?*" (hero size), email,
   Primary "Start a conversation →" + Ghost CV, details row; **contact
   hand** entering from the right, pointing at the email.
10. **Footer** — © / "Built with intent — Kathmandu" / "Back to top ↑",
    CC0 credits line, full-width wordmark; **animated robot** small,
    beside "Back to top".

## Robot interface

Every robot — code-built or loaded — exposes the same shape so `stage.js`
does not care where it came from:

```js
{ object: THREE.Object3D,           // feet on y=0, facing +z (quadruped faces +x)
  frame: { position, target },      // camera framing for its section
  update(t, input) }                // input: { pointer:{x,y}, attend:boolean, motion:boolean }
```

- `pointer` is viewport-normalised (−1…1).
- `attend` is true while the robot's trigger is hovered or focused:
  the email link for the hand, "Back to top" for the footer robot.
  `script.js` sets `data-attend` on the robot container; `index.js`
  reads it each frame.
- Head turns are clamped to `--look-max`.

| Robot | Source | Behaviour |
|---|---|---|
| Unit-01 humanoid | `cast.js` | idle sway, breathing, head follows cursor |
| Profile head | `cast.js` | head follows cursor, status light blinks |
| Unit-K9 quadruped | `cast.js` | trots while in view; track scrolls under it |
| Robot arm | `models.js` | slow turntable (±25°), no clips in file |
| Contact hand | `cast.js` | points; eases `--hand-nudge` toward the email on `attend` |
| Animated robot | `models.js` | plays its `Robot_Idle` clip; cross-fades to `Robot_Wave` on `attend` |

`models.js` replaces every material with the shared matte set (dark
source colours → joint, everything else → shell) and normalises scale and
position.

## Posters and fallbacks

- Each robot container renders `<img class="robot-poster" alt="">`
  (WebP, transparent, sized for 2×) as its first paint. The canvas fades
  in over `--dur-base` after its first rendered frame, then the poster
  is hidden.
- The 3D never starts when any of these hold: `prefers-reduced-motion:
  reduce`, no WebGL2/WebGL context, `navigator.connection.saveData`.
  The poster stays.
- A failed GLB load or context loss reverts that robot to its poster and
  logs one `console.warn`.
- Posters are generated by `tools/posters.html` from the same `robots/`
  code, so they always match the live robots.

## Accessibility

- Robot containers are `aria-hidden="true"`; callouts are real text.
- Index rows and "Read the case study" are `<button>`s with
  `aria-expanded` / dialog semantics; the dialog traps focus via
  `<dialog>.showModal()` (existing behaviour kept).
- Focus ring `--focus-ring` / `--focus-offset` on every interactive
  element. Contrast per TASTE.md.

## Performance budget

- Models ≤ 1.5 MB total (currently ~0.8 MB). Posters ≤ 400 KB total.
- Three.js and addons loaded only when the first robot initialises
  (dynamic `import()`), never before first paint.
- Pixel ratio capped at 2; shadow maps 1024; render loop only while a
  robot is in view.

## Verification

No test framework exists in this static repo; verification is in the
browser preview (`.claude/launch.json` → `portfolio` on :5173):
1. Desktop 1440 and mobile 390 screenshots, section by section, against
   the Figma frames.
2. Console clean (no errors) on load and after scrolling the full page.
3. Reduced-motion emulation → posters only, no canvas created.
4. WebGL disabled (force `getContext` to return null) → posters only.
5. Keyboard: tab through nav, buttons, index rows, dialog open/close.
6. Network panel: models and Three.js load lazily; totals within budget.
7. No horizontal scroll at 390px.

## Out of scope

- Updating the Figma file (blocked by the Starter-plan limit; later).
- Separate case-study pages; real project captures (placeholders stay).
- Dark mode (banned in v3).
