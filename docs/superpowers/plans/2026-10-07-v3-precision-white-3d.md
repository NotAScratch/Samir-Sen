# v3 Precision White + Live 3D Robots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark v2 site with the white v3 Figma design, with six live Three.js robots (four built in code, two free CC0 models) replacing robot images.

**Architecture:** Static ES-module site. A `robots/` package gives every robot one interface (`{object, frame, anchors?, floating?, update(t, input)}`); a controller gives each robot section its own lazily-started canvas, with a transparent WebP poster as first paint and as the fallback. Page behaviour lives in `script.js`; layout in `styles.css` from `design/tokens.css` only.

**Tech Stack:** HTML, CSS, vanilla JS modules, Three.js 0.169.0 (jsDelivr import map), Node 20 `node --test` for unit tests, browser test pages run in the preview server.

**Spec:** `docs/superpowers/specs/2026-10-07-v3-precision-white-3d-design.md` (read it first). Visual reference: Figma `1H3FimcUCNMbv5AZWmbG47` and `design/TASTE.md`.

## Global Constraints

- No build step, no npm dependencies. Three via import map: `"three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js"`, `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"`.
- Every CSS value comes from `design/tokens.css`. No raw hex, `rgb(`, `px`, or `ms`/`s` durations in `styles.css` (`0`, `%`, `fr`, unitless allowed). 3D colours are read from tokens via `getComputedStyle`.
- `--text-hero` is used exactly twice: hero H1 and contact H2.
- At most one `<em>` (Instrument Serif italic) per heading.
- `--accent` only for: nav live dot, current-role dot, live tag in featured media, robot status lights.
- Fonts: `Geist:wght@400;500`, `Geist+Mono:wght@400;500`, `Instrument+Serif:ital@1` from Google Fonts.
- Robot containers `aria-hidden="true"`; posters `alt=""`.
- Budgets: models ≤ 1.5 MB, posters ≤ 400 KB total; pixel ratio ≤ 2; shadow map 1024.
- Work on branch `v3-precision-white`. Never push or merge without the user's go-ahead. `design/3d-lab/` is never committed.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Fast scrolling past every robot section → no more than 3 live WebGL contexts at once, nothing stays running off-screen. (Task 4: `limits live contexts`)
2. A model file 404s or the CDN is down → that robot keeps its poster, the rest of the page works, one `console.warn`. (Task 4: `failed robot keeps poster`)
3. WebGL context lost (mobile backgrounding, GPU reset) → the robot falls back to its poster instead of a blank box. (Task 4: `context loss reverts to poster`)
4. Window resize / phone rotation → canvas matches its box at the new size, no stretched robot. (Task 4: `resize matches container`)
5. Keyboard-only visitor → focusing the email link nudges the hand and focusing "Back to top" makes the footer robot wave, same as hover. (Task 8: `attend follows focus`)

## How to run tests

- Unit: `node --test tests/unit/` → every test `ok`, final line `# fail 0`.
- Browser: start the preview (`.claude/launch.json` → `portfolio`, port 5173), open `http://localhost:5173/tests/browser/<name>.test.html`, wait for load. Pass = `document.title` starts with `PASS`; failures are listed in `<pre id="out">`.

---

### Task 1: Test harness and robot logic

**Files:**
- Create: `robots/logic.js`, `tests/unit/logic.test.mjs`, `tests/browser/harness.js`
- Modify: `.gitignore` (append `design/3d-lab/`)

**Interfaces:**
- Produces (`robots/logic.js`, pure, no imports):
  - `canRun3D({ reducedMotion, saveData, hasWebGL }): boolean`
  - `isDarkColor({ r, g, b }, hasMap): boolean` — luminance `0.2126r + 0.7152g + 0.0722b < 0.18` and `!hasMap`; channels 0–1
  - `clampLook(value, max): number`
  - `pickClip(names, wanted): string | null` — first name containing `wanted`, case-insensitive
  - `phaseFor(rect, viewportH, margin = 200): 'run' | 'idle' | 'dispose'` — `run` if `rect.bottom > -margin && rect.top < viewportH + margin`; `dispose` if `rect.bottom < -2 * viewportH || rect.top > 3 * viewportH`; else `idle`
  - `cssAngleToRad(value): number` — accepts `"40deg"`, `"0.5rad"`
  - `cssNumber(value, fallback): number` — parses `"24px"`, `" 0.1 "`; `fallback` on NaN
- Produces (`tests/browser/harness.js`): `test(name, fn)`, `assert(cond, msg)`, `assertEqual(actual, expected, msg)`, `run(): Promise<void>` (awaits async tests, sets `document.title` to `PASS n/n` or `FAIL k/n`, writes details to `#out`)

- [ ] **Step 1: Write failing tests** in `tests/unit/logic.test.mjs` (`node:test`, `node:assert/strict`):
  - `canRun3D` false when any of `reducedMotion: true`, `saveData: true`, `hasWebGL: false`; true when all clear.
  - `isDarkColor({r:0.05,g:0.05,b:0.05}, false)` true; `({r:0.05,g:0.05,b:0.05}, true)` false; `({r:1,g:0.5,b:0}, false)` false.
  - `clampLook(1.2, 0.698)` → `0.698`; `clampLook(-1.2, 0.698)` → `-0.698`; `clampLook(0.3, 0.698)` → `0.3`.
  - `pickClip(['RobotArmature|Robot_Idle','RobotArmature|Robot_Wave'], 'wave')` → `'RobotArmature|Robot_Wave'`; `pickClip(['A'], 'idle')` → `null`.
  - `phaseFor({top:100,bottom:500}, 900)` → `'run'`; `({top:1050,bottom:1400}, 900)` → `'run'` (inside margin); `({top:1200,bottom:1600}, 900)` → `'idle'`; `({top:2800,bottom:3200}, 900)` → `'dispose'`; `({top:-2400,bottom:-1900}, 900)` → `'dispose'`.
  - `cssAngleToRad('40deg')` ≈ `0.6981` (±1e-4); `cssAngleToRad('0.5rad')` → `0.5`.
  - `cssNumber('24px', 0)` → `24`; `cssNumber(' 0.1 ', 0)` → `0.1`; `cssNumber('', 7)` → `7`.

- [ ] **Step 2: Run** `node --test tests/unit/` — Expected: FAIL (cannot find `robots/logic.js`).
- [ ] **Step 3: Implement `robots/logic.js`** with the signatures above. Implement `tests/browser/harness.js` (≈40 lines, no deps).
- [ ] **Step 4: Run** `node --test tests/unit/` — Expected: all `ok`, `# fail 0`.
- [ ] **Step 5: Commit** `robots/logic.js tests/ .gitignore` — "Add robot logic helpers and test harness".

---

### Task 2: Shared materials and code-built cast

**Files:**
- Create: `robots/materials.js`, `robots/cast.js`, `tests/browser/cast.test.html`
- Source to port: `design/3d-lab/procedural.js` (local only; geometry, poses and gaits carry over)

**Interfaces:**
- Consumes: `clampLook` (Task 1).
- Produces (`robots/materials.js`):
  - `readTokens(el = document.documentElement): { shell, joint, accent, shadow, lookMax, handNudge }` — from `--robot-shell`, `--robot-joint`, `--accent` (strings), `--robot-shadow` (number), `--look-max` (radians), `--hand-nudge` (px number)
  - `createMaterials(tokens): { shell, joint, visor, rubber, signal }` — shell `MeshPhysicalMaterial` roughness 0.42 clearcoat 0.35; joint `MeshStandardMaterial` roughness 0.45 metalness 0.65; visor = `joint` colour × 0.2, roughness 0.06, clearcoat 1; rubber = `joint` colour, roughness 0.92, metalness 0; signal emissive `accent`, intensity 2.2 (no hex literals in JS)
- Produces (`robots/cast.js`): `buildHumanoid(M, opts)`, `buildBust(M, opts)`, `buildQuadruped(M, opts)`, `buildHand(M, opts)` → **Robot**:
  ```js
  { object: Object3D, frame: { position: [x,y,z], target: [x,y,z] },
    anchors?: { perception: Object3D, edge: Object3D, actuation: Object3D }, // humanoid only
    floating?: boolean,                                                   // hand only
    update(t: number, input: { pointer:{x,y}, attend:boolean, motion:boolean }): void }
  ```
  `opts = { lookMax: number, handNudge?: number }`. Head yaw/pitch pass through `clampLook(…, opts.lookMax)`. Quadruped has **no** 3D track (the page draws it). Hand: when `input.attend` the arm eases toward −x by `handNudge / 1000` world units (1 px ≈ 1 mm at contact scale); pointing pose is held (no open/point cycle). Humanoid anchors are empty `Object3D`s parented to head (visor centre), chest (front face), and right wrist.
  Initial frames: humanoid `{position:[1.4,1.35,3.6], target:[0,1.0,0]}`, bust `{[0.55,0.62,1.3],[0,0.46,0]}`, quadruped `{[0.9,0.75,2.2],[0,0.38,0]}`, hand `{[-0.2,0.4,0.4],[-0.1,0.3,0]}` (retuned in Task 5).

- [ ] **Step 1: Write `tests/browser/cast.test.html`** (import map + harness). Tests:
  - `each builder returns a Robot` — for all four: `object.isObject3D`, `frame.position.length === 3`, `typeof update === 'function'`.
  - `update runs 300 frames without throwing` — `t` from 0 to 10, pointer sweeping −1…1, `motion: true`.
  - `head yaw never exceeds lookMax` — humanoid with `lookMax: 0.3`, pointer `{x: 1}` for 300 frames → the neck group's `rotation.y` ≤ 0.3 + 1e-6.
  - `humanoid exposes three anchors` — keys `perception`, `edge`, `actuation`, each `isObject3D`.
  - `quadruped has no track` — no descendant mesh with `BoxGeometry`.
  - `materials come from tokens` — `readTokens()` on a test element with `--robot-shell:#F2F2EF` → `createMaterials(...).shell.color.getHexString() === 'f2f2ef'`.
- [ ] **Step 2: Run** the page — Expected: `FAIL` (modules missing).
- [ ] **Step 3: Implement** `robots/materials.js` and `robots/cast.js` (port from the lab; replace module-level materials with the `M` argument).
- [ ] **Step 4: Run** the page — Expected: `PASS 6/6`.
- [ ] **Step 5: Commit** — "Add shared robot materials and code-built cast".

---

### Task 3: Downloaded models and robot registry

**Files:**
- Create: `assets/models/robot-arm.glb` (copy of `design/3d-lab/models/free-robot-arm.glb`), `assets/models/animated-robot.glb` (copy of `free-animated-robot.glb`), `robots/models.js`, `robots/registry.js`, `tests/browser/models.test.html`

**Interfaces:**
- Consumes: `isDarkColor`, `pickClip` (Task 1); `createMaterials`, `readTokens` (Task 2); cast builders (Task 2).
- Produces (`robots/models.js`):
  - `loadModel(url, M, { height }): Promise<{ object, clips }>` — every mesh material → `M.joint` if `isDarkColor` else `M.shell`; scale to `height`; centre x/z; feet on y=0; `castShadow = true`.
  - `buildArm(M, url): Promise<Robot>` — height 1.0; turntable `rotation.y = 0.436 * sin(t * 2π / 12)` when `motion`; frame `{[0.9,0.75,1.9],[0,0.5,0]}`.
  - `buildWaver(M, url): Promise<Robot>` — height 1.2; plays `pickClip(…,'idle')`; on `attend` cross-fades to `pickClip(…,'wave')` over 0.3 s and back when `attend` clears; frame `{[0.5,0.8,2.4],[0,0.6,0]}`.
- Produces (`robots/registry.js`):
  - `ROBOT_NAMES = ['humanoid','bust','quadruped','arm','hand','waver']`
  - `createRobot(name, { M, tokens, base = '' }): Promise<Robot>` — `base` prefixes model URLs (`${base}assets/models/…`).

- [ ] **Step 1: Write `tests/browser/models.test.html`** tests:
  - `arm loads with matte materials only` — every mesh material is `M.shell` or `M.joint`.
  - `waver idles then waves on attend` — after `update(0.5, {attend:false,…})` the active action's clip name contains `Idle`; after 20 updates with `attend:true` the Wave action's `getEffectiveWeight()` > 0.9.
  - `models stand on the ground` — `Box3.setFromObject(object).min.y` within ±0.01 of 0, height within ±0.02 of target.
  - `createRobot builds every name` — all six resolve to objects with `update`.
  - `missing model rejects` — `createRobot` with `base: 'nope/'` for `arm` rejects (does not hang).
  - `model weight within budget` — `fetch` HEAD of both GLBs, sum of `content-length` ≤ 1 572 864.
- [ ] **Step 2: Run** — Expected: `FAIL`.
- [ ] **Step 3: Copy the two GLBs; implement** `robots/models.js` and `robots/registry.js`.
- [ ] **Step 4: Run** — Expected: `PASS 6/6`.
- [ ] **Step 5: Commit** — "Add CC0 models, matte loader and robot registry".

---

### Task 4: Stage and lazy lifecycle controller

**Files:**
- Create: `robots/stage.js`, `robots/index.js`, `tests/browser/stage.test.html`

**Interfaces:**
- Consumes: `canRun3D`, `phaseFor` (Task 1); `readTokens`, `createMaterials` (Task 2); `createRobot` (Task 3).
- Produces (`robots/stage.js`):
  - `createStage(container, robot, { shadowOpacity, preserveDrawingBuffer = false }): Stage`
  - `Stage = { canvas, render(t, input): void, resize(): void, project(obj3d): {x, y}, dispose(): void, firstFrame: Promise<void>, lost: boolean }`
  - Transparent renderer appended to `container`; pixel ratio `min(devicePixelRatio, 2)`; `NeutralToneMapping`; `RoomEnvironment` env (intensity 0.9); key `DirectionalLight` 1.6 at `[2.5,5,3]` with 1024 shadow map, radius 6; hemisphere 0.5; `ShadowMaterial` ground at `shadowOpacity` (omitted when `robot.floating`); `PerspectiveCamera` fov 26 at `robot.frame`; `ResizeObserver` on container; `webglcontextlost` → `lost = true`, dispatches `robot:lost` on container. `project` returns container-relative px.
- Produces (`robots/index.js`):
  - `detectEnv(): { reducedMotion, saveData, hasWebGL }`
  - `initRobots(root = document, env = detectEnv(), { base = '' } = {}): Controller | null` — `null` when `!canRun3D(env)`. Containers: `[data-robot]` (value ∈ `ROBOT_NAMES`) holding `<img class="robot-poster">`. Three.js and robot modules load via dynamic `import()` on the first `'run'`. Per container phase from `phaseFor`, evaluated on scroll/resize (passive) and on start: `run` → create (once) + animate; `idle` → stop drawing; `dispose` → `stage.dispose()`. After `firstFrame` adds class `is-live` to the container. On any create/load error or `robot:lost`: dispose, add `is-failed`, one `console.warn`, never retry. Input per frame: shared pointer, `attend = container.dataset.attend === 'true'`, `motion: true`. Callouts: elements `[data-anchor]` inside the container get `--ax`/`--ay` (px) from `stage.project(robot.anchors[name])` each frame.
  - `Controller = { entries: Map<Element, {phase, stage?, robot?}>, liveCount(): number, destroy(): void }`

- [ ] **Step 1: Write `tests/browser/stage.test.html`** — fixture page with six 400×400 `[data-robot]` containers stacked 1500 px apart, each with a poster `<img>`. Tests:
  - `returns null when 3D not allowed` — `initRobots(document, {reducedMotion:true, saveData:false, hasWebGL:true})` → `null`, no `<canvas>` in the document.
  - `first robot goes live` — fresh controller; within 5 s the first container has class `is-live` and a canvas.
  - `limits live contexts` — scroll from top to bottom in 300 px steps (await a frame each); `liveCount()` never exceeds 3; at the bottom the first container has no canvas.
  - `failed robot keeps poster` — container `data-robot="arm"` with `base:'nope/'` → gets `is-failed`, poster still visible (`offsetParent !== null` under the test's CSS), no thrown error.
  - `context loss reverts to poster` — on a live stage call `renderer.getContext().getExtension('WEBGL_lose_context').loseContext()` → container gets `is-failed`.
  - `resize matches container` — resize a live container to 300×200 → after a frame `canvas.width === 300 * min(dpr,2)` and `canvas.height === 200 * min(dpr,2)`.
  - `anchors move callouts` — humanoid container with `<span data-anchor="perception">` → after `is-live`, its `--ax` and `--ay` are set and lie inside the container.
- [ ] **Step 2: Run** — Expected: `FAIL`.
- [ ] **Step 3: Implement** `robots/stage.js` and `robots/index.js`.
- [ ] **Step 4: Run** — Expected: `PASS 7/7`.
- [ ] **Step 5: Commit** — "Add per-section robot stage with lazy lifecycle and fallbacks".

---

### Task 5: Poster tool and posters

**Files:**
- Create: `tools/posters.html` (`<meta name="robots" content="noindex">`), `tools/posters.js`, `tools/poster-server.py`, `assets/posters/{humanoid,bust,quadruped,arm,hand,waver}.webp`
- Modify: `robots/cast.js`, `robots/models.js` frames (retune), `.claude/launch.json` (add `posters` config: `python tools/poster-server.py . 5174`, port 5174)

**Interfaces:**
- Consumes: `createRobot`, `ROBOT_NAMES` (Task 3); `createStage` (Task 4).
- Produces: posters at these pixel sizes (they also fix each container's aspect ratio in Task 7): humanoid 1208×1800, bust 1072×1200, quadruped 1836×1233, arm 1200×1400, hand 2120×1422, waver 720×900. `tools/posters.js` also prints humanoid anchor positions as percentages of the poster (`perception`, `edge`, `actuation`) for Task 6's inline defaults.
- `tools/poster-server.py <root> <port>`: static server; accepts `PUT` only to `/assets/posters/<name>.webp` (regex `[a-z]+\.webp`), 403 otherwise. (Port of the lab's stills server.)

- [ ] **Step 1: Implement** the server and `tools/posters.js`: for each name, an off-screen fixed-size container, `createStage(…, { preserveDrawingBuffer: true })`, settle `update` 240× at a representative pose (humanoid pointer `{x:-0.35,y:0.05}`, bust `{x:-0.4}`, quadruped `t=0.37`, waver clip time 0.6 s), render, `toBlob('image/webp', 0.9)`, `PUT`, show `<img>` previews and set `document.title = 'Posters done'`.
- [ ] **Step 2: Run** the `posters` preview, open `/tools/posters.html` — Expected: title `Posters done`, six files in `assets/posters/`.
- [ ] **Step 3: Check by eye** each preview: robot fills 80–90 % of the frame height (quadruped/hand: width), nothing cropped, contact shadow visible (none for hand). Retune `frame` values and re-run until true.
- [ ] **Step 4: Verify budget** — `du -cb assets/posters/*.webp` total ≤ 409 600.
- [ ] **Step 5: Commit** — "Add poster renderer and robot posters".

---

### Task 6: Page markup

**Files:**
- Modify (rewrite): `index.html`
- Delete: `hero-scene.js`
- Create: `tests/unit/page.test.mjs`

**Interfaces:**
- Consumes: poster paths (Task 5), robot names (Task 3), anchor percentages (Task 5).
- Produces (hooks for Tasks 7–8): sections `#top` (hero), `#about`, `#work`, `#services`, `#experience`, `#notes`, `#contact`; robot containers `.robot[data-robot]` with `.robot-poster`; callouts `[data-anchor]` inside the hero robot with inline `style="--ax:…%;--ay:…%"` defaults; `.nav-clock` (time text), `.menu-toggle[aria-expanded][aria-controls="menu"]`, `#menu`; index rows `button.index-row[aria-expanded][aria-controls]` + `p.project-detail[hidden]`; `button.case-study-trigger[data-case="vision"|"edge"]`; `<dialog class="case-study">` (existing markup, keep ids `case-index`, `case-kicker`, `case-title`, `case-summary`, `case-problem`, `case-approach`, `case-lesson`); `a.email-link[data-attends="hand"]`; `a.to-top[data-attends="waver"]`; `.interlude` containing `svg.interlude-track`.

Section order and copy follow the spec's "Page structure"; reuse existing copy from the current `index.html` for project descriptions, details, timeline, notes, case studies and links. Copy that is new in v3:

| Where | Copy |
|---|---|
| Nav status | `Kathmandu · <span class="nav-clock">--:--</span> NPT · Open to collaborations` |
| Nav links | Work · About · Services · Notes · `Let's talk →` (ghost, `#contact`) |
| Hero eyebrow | `R&D AI Roboticist & Automation Engineer — Baliyo Ventures` |
| Hero H1 | `Systems that<br>see, think,<br>and <em>move.</em>` |
| Hero intro | `Turning computer-vision research into reliable, physical-world automation — one perception loop at a time.` |
| Callouts | `01 — Perception` / `OpenCV · PyTorch · SSD`; `02 — Edge compute` / `Jetson Nano · Lidar`; `03 — Actuation` / `Embedded control` |
| Hero foot | `Scroll ↓` · `27.7172° N  85.3240° E` · `Portfolio — Vol. 03 / 2026` |
| Strip | Computer vision + Edge intelligence + Automation + Backend systems + Embedded hardware |
| Section labels | `01 Profile (About)`, `02 Selected work (06 projects)`, `03 Services & stack (What I do)`, `04 Experience (2023 — Now)`, `05 Field notes (Writing)`, `06 Contact (Let's build)` |
| Profile facts | `06` Selected projects · `2025` BSc (Hons) Computing with AI · `KTM` Based in Kathmandu, Nepal |
| Profile caption | `Fig. 01 — Perception head` · `Live render` |
| Work aside | `Perception, edge compute and embedded systems — each project starts with a physical-world constraint and ends with something that runs.` |
| Featured 01 | kicker `01 — Computer vision`; title `Real-time object detection, distance & direction`; body = current project 1 text; specs Model: SSD MobileNetV2 · Serve: FastAPI · live video · Output: Class · metres · bearing; caption `Fig. 02 — Detection overlay on live feed` · `01 / 06` |
| Featured 02 | kicker `02 — Spatial edge AI`; title `Orientation & spatial edge intelligence`; body = current project 2 text; specs Device: Jetson Nano · Sensors: Lidar · depth · Inference: PyTorch, on-device; caption `Fig. 03 — Lidar returns + orientation` · `02 / 06` |
| Featured media | reuse the current project 1 and 2 `<svg class="diagram">` markup, restyled; live tag `● Live · SSD MobileNetV2 · FastAPI stream` on 01 |
| Interlude | `Interlude — Fig. 04 Gait study` · `Locomotion is a <em>perception</em> problem first.` · metre labels `0.0 m` … `2.5 m` (every 0.5) |
| Index rows 03–06 | Domain: Machine learning / Data analysis / Human–robot interaction / Embedded systems; Stack: scikit-learn · Random Forest / Pandas · NumPy · Matplotlib / Linux · edge hardware / Microcontroller · RF |
| Services aside | `I take a problem from sensor to service: perceive it, model it, ship it to hardware, and expose it through an API someone else can use.` |
| Service (A) | `Perception & computer vision` — `Detection, depth and spatial reasoning that turns pixels into decisions a machine can act on.` — PyTorch / OpenCV / SSD MobileNetV2 / Lidar fusion |
| Service (B) | `Edge & embedded systems` — `Models squeezed onto real hardware, where latency, power and memory shape the design.` — Jetson Nano / Microcontrollers / Linux · SSH / Edge integration |
| Service (C) | `Backend & architecture` — `Services that expose robotic capability cleanly — typed APIs, containers, and sane boundaries.` — Python · FastAPI / Java · Spring Boot / REST · Microservices / Docker · AWS · Azure |
| Service (D) | `Data & analytics` — `Turning raw logs and datasets into models and charts that hold up to questions.` — scikit-learn / Pandas · NumPy / Regression / Matplotlib · Seaborn |
| Work H2 / Profile H2 / Services H2 / Experience H2 / Notes H2 / Contact H2 | `From signal to <em>solution.</em>` / `Curiosity, made <em>tangible.</em>` / `A practical <em>stack.</em>` / `Learning by <em>shipping.</em>` / `Work in <em>progress.</em>` / `Have a difficult <em>problem?</em>` |
| Notes meta | `Note / 00N` · `Draft`; link `Read note →`; header link `All notes →` |
| Contact | `Write to me`; details GitHub `NotAScratch ↗`, LinkedIn `in/samirsen8 ↗`, Location `Kathmandu, NP`, Local time `UTC +5:45` |
| Footer | `© 2026 Samir Sen` · `Built with intent — Kathmandu` · `Back to top ↑`; credits `3D: Robot Arm by Yali Izzo (CC0) · Animated Robot by Quaternius (CC0)`; wordmark `Samir Sen` |

Head: Google Fonts link (Global Constraints), `../`-free import map, `<link rel="stylesheet" href="design/tokens.css">` then `styles.css`, `<script type="module" src="script.js">`. No GSAP, no `hero-scene.js`, no theme toggle, cursor or grain markup.

- [ ] **Step 1: Write `tests/unit/page.test.mjs`** (reads `index.html` as text):
  - required ids present: `top, about, work, services, experience, notes, contact`.
  - exactly six `data-robot="…"` attributes, set equals `['humanoid','bust','quadruped','arm','hand','waver']`; each container has `aria-hidden="true"` and an `<img class="robot-poster"` with `alt=""` whose `src` file exists on disk.
  - exactly two elements with class `display-hero`.
  - no `<h1>`/`<h2>`/`<h3>` contains more than one `<em>`.
  - no occurrences of `gsap`, `hero-scene`, `theme-toggle`, `cursor-dot`, `grain`.
  - both `data-case="vision"` and `data-case="edge"` present; six `project-detail-` ids present.
  - `fs.existsSync('hero-scene.js') === false`.
- [ ] **Step 2: Run** `node --test tests/unit/` — Expected: page tests FAIL.
- [ ] **Step 3: Rewrite `index.html`; delete `hero-scene.js`.**
- [ ] **Step 4: Run** `node --test tests/unit/` — Expected: `# fail 0`.
- [ ] **Step 5: Commit** — "Rebuild page markup for v3".

---

### Task 7: Styles

**Files:**
- Modify (rewrite): `styles.css`
- Modify: `design/tokens.css` — delete the LEGACY ALIASES block; add `--dur-gait: 1140ms; /* one quadruped trot cycle */`
- Create: `tests/unit/styles.test.mjs`

**Interfaces:**
- Consumes: class/id hooks from Task 6; poster sizes (Task 5) as `aspect-ratio` on each `.robot` variant.
- Produces: `.robot.is-live` (canvas `opacity: 1` over `--dur-base`, poster `visibility: hidden`), `.robot.is-failed` (poster visible, canvas hidden), callout placement `left: var(--ax); top: var(--ay)`, `.interlude.is-walking .interlude-track` (stroke-dashoffset animation, `--walk-distance` per `--dur-gait`, paused otherwise and under reduced motion), `.reveal` → `.reveal.is-in` (fade-up `--reveal-distance` over `--dur-reveal`, stagger via `--i * --stagger`), `.menu-open` on `<body>` (full-screen `#menu`).

Layout values (desktop ≥ 48rem): `.shell` max-width `--container`, side padding `--margin`; 12-column grid with `--gutter`. Hero: copy in columns 1–8, `.robot--humanoid` in columns 9–12 bottom-aligned on the ground line, H1 overlapping it allowed. Featured: media spans 8, meta starts column 10 (span 3); `.featured--reverse` mirrors. Profile: viewfinder spans 5, copy starts column 7. Services/Notes: 4 and 3 equal columns. Contact: `.robot--hand` absolutely positioned from the right edge, vertically centred on `.email-link`. Mobile (< 48rem): single column, 4-column grid, hero callout `actuation` hidden, buttons full width, contact hand in normal flow above the email. Exact spacing per Figma; section padding `--section-y`, label→content `--section-gap`.

- [ ] **Step 1: Write `tests/unit/styles.test.mjs`**:
  - `styles.css` has no match for `/#[0-9a-fA-F]{3,8}\b/`, `/rgba?\(/`, `/\d+(\.\d+)?px\b/`, `/\d+(\.\d+)?m?s\b/` outside comments (strip `/* … */` first; allow `1px` only via `--hairline` → so no exceptions).
  - `styles.css` contains no `text-shadow`, `box-shadow` other than `none`, `linear-gradient`, `radial-gradient`, `backdrop-filter`.
  - every `var(--name)` used in `styles.css` is defined in `design/tokens.css`.
  - `design/tokens.css` does not contain `LEGACY ALIASES` and does contain `--dur-gait`.
  - `--text-hero` appears in `styles.css` exactly once (applied via the shared `.display-hero` class).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Rewrite `styles.css`; edit `design/tokens.css`.**
- [ ] **Step 4: Run** `node --test tests/unit/` — Expected: `# fail 0`.
- [ ] **Step 5: Visual check** — preview at 1440×900 and 390×844: each section beside its Figma frame (desktop page `2:4`, mobile `2:5`); fix spacing/alignment mismatches; no horizontal scroll at 390 (`document.documentElement.scrollWidth === 390`).
- [ ] **Step 6: Commit** — "Rewrite styles for v3; drop legacy token aliases".

---

### Task 8: Page behaviour

**Files:**
- Modify (rewrite): `script.js` (ES module)
- Create: `lib/clock.js`, `tests/unit/clock.test.mjs`, `tests/browser/page.test.html`

**Interfaces:**
- Consumes: hooks from Task 6; `initRobots` (Task 4).
- Produces (`lib/clock.js`): `formatNpt(date: Date): string` → `"HH:MM"`, 24-hour, `Asia/Kathmandu`.
- `script.js`: on load calls `initRobots()`; reveals via IntersectionObserver (`.reveal` → `.is-in`; immediate under reduced motion); clock updates `.nav-clock` every 30 s; menu toggle (`aria-expanded`, `body.menu-open`, Esc and link click close it and return focus to the toggle); index rows toggle their `project-detail` (`aria-expanded` + `hidden`); case-study dialog keeps the current behaviour (content object, `?case=` param, close on Esc/backdrop/button — port from current `script.js` lines 164–217); `[data-attends]` elements set `data-attend="true"` on `.robot[data-robot=<value>]` on `pointerenter`/`focus` and `"false"` on `pointerleave`/`blur`; `.interlude` gets `is-walking` while its quadruped container is `is-live` and on screen.

- [ ] **Step 1: Write tests.**
  - `tests/unit/clock.test.mjs`: `formatNpt(new Date('2026-10-07T07:21:00Z'))` → `'13:06'`; `formatNpt(new Date('2026-10-07T18:15:00Z'))` → `'00:00'`.
  - `tests/browser/page.test.html` (loads `/index.html` in an `<iframe>`, tests against its document):
    - `menu opens and Esc closes` — click `.menu-toggle` → `aria-expanded="true"`; dispatch `Escape` → `"false"` and toggle is `document.activeElement`.
    - `index row toggles detail` — click first `.index-row` → its `aria-controls` target not `hidden`; click again → `hidden`.
    - `case param opens dialog` — iframe `src="/index.html?case=edge"` → `dialog.open === true`, `#case-title` text `Orientation and spatial intelligence`; `?case=nope` → `dialog.open === false`, no error.
    - `attend follows focus` — focus `.email-link` → `.robot[data-robot="hand"]` has `data-attend="true"`; blur → `"false"`; same for `.to-top` → `waver`.
    - `clock renders` — `.nav-clock` matches `/^\d{2}:\d{2}$/`.
- [ ] **Step 2: Run** unit + browser — Expected: FAIL.
- [ ] **Step 3: Implement** `lib/clock.js` and `script.js`.
- [ ] **Step 4: Run** `node --test tests/unit/` (`# fail 0`) and `page.test.html` (`PASS 5/5`).
- [ ] **Step 5: Commit** — "Rewrite page behaviour for v3".

---

### Task 9: Full verification

**Files:** fixes only, wherever verification finds problems.

- [ ] **Step 1: Unit + browser suites** — `node --test tests/unit/` → `# fail 0`; `cast`, `models`, `stage`, `page` test pages all `PASS`.
- [ ] **Step 2: Desktop and mobile** — full-page screenshots at 1440 and 390; compare with the Figma frames section by section; robots live and moving; callouts sit on head/chest/wrist.
- [ ] **Step 3: Console** — load, scroll to bottom and back: zero errors (warnings only from deliberate fallbacks).
- [ ] **Step 4: Reduced motion** — emulate `prefers-reduced-motion: reduce`, reload: no `<canvas>` in the DOM, all six posters visible, reveals instant, interlude track still.
- [ ] **Step 5: No WebGL** — reload with `HTMLCanvasElement.prototype.getContext = () => null` injected before scripts (via the test harness iframe): posters only, no errors.
- [ ] **Step 6: Keyboard** — Tab from top to footer: every interactive element shows `--focus-ring`; menu, index rows, dialog all operable; Esc closes dialog and menu.
- [ ] **Step 7: Network** — on first load before scrolling, no `.glb` requested and Three.js requested only after the hero robot starts; GLB total ≤ 1.5 MB; posters ≤ 400 KB.
- [ ] **Step 8: Commit fixes** — "Fix v3 verification findings" (skip if none). Report results to the user; do not push or merge.
