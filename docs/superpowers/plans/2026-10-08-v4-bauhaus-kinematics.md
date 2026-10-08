# v4 Bauhaus Kinematics Implementation Plan

> **For agentic workers:** executed inline with superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Move the site from v3 "Precision White" to the approved v4 "Bauhaus Kinematics" design without losing any existing behaviour.

**Spec:** `docs/superpowers/specs/2026-10-08-v4-bauhaus-kinematics-design.md`

**Tech stack:** unchanged (static HTML/CSS/ES modules, Three.js 0.169.0 via import map, `node --test` unit tests, browser test pages).

## Global Constraints

- No build step, no npm dependencies in the site.
- `styles.css`: tokens only (no raw hex/rgb/px/durations), no shadows/gradients/blur, one `@media` breakpoint (48rem).
- `--text-hero` only on `.display-hero` (hero H1 + contact H2).
- Robot containers stay `aria-hidden="true"` with `alt=""` posters at their current pixel sizes.
- Commit messages end with the session's Co-Authored-By / Claude-Session lines.

## How to run tests

- Unit: `node --test tests/unit/*.mjs` → `# fail 0`.
- Browser: serve the repo on `127.0.0.1:5173` and run the session's headless runner over `tests/browser/*.test.html` (jsDelivr is blocked by the sandbox proxy, so the runner serves the identical npm tarball of `three@0.169.0` for those URLs). Baseline before this plan: cast 6/6, models 7/7, page 7/8, stage 6/7 — the two failures (`quadruped walking follows its own visibility and live state`, `only one robot may be live or loading in the viewport`) fail identically on the untouched base commit `525521c`.

## Review Focus

1. Every colour pairing that carries text meets its contrast floor (body ≥ 4.5:1, red only on display sizes).
2. No horizontal scroll at 390px, including the full-bleed interlude and contact bands and the hand robot.
3. Keyboard focus is visible on red, blue, yellow and ink surfaces (the ink focus ring disappears on ink).
4. Live robots still align with their posters and callouts after the material and layout changes.

---

### Task 1: v4 design system — TASTE.md, tokens.css, style-contract tests

**Files:** Modify `design/TASTE.md`, `design/tokens.css`, `tests/unit/styles.test.mjs`.

**Interfaces — produces (tokens.css):** `--bg #E8EAEE`, `--paper #F4F5F7`, `--ink #141414`, `--ink-muted #4A4C52`, `--ink-faint #5E6068`, `--red #D7261E`, `--blue #1F45B5`, `--yellow #F2B705`, `--white #FFFFFF`; skill aliases `--perception: var(--red)`, `--compute: var(--blue)`, `--actuation: var(--yellow)`, `--data: var(--ink)`; `--font-display` (Unbounded), `--weight-bold: 800`, `--weight-semibold: 600`; `--rule: 2px`, `--rule-heavy: 6px`, `--bar: 10px`; `--shape-sm/md/lg`; `--bp-tiles-4: 60rem`; robot tokens `--robot-shell: var(--paper)`, `--robot-joint: var(--ink)`, `--robot-signal: var(--red)`. v3-only names (`--line`, `--line-strong`, `--accent`, `--font-serif`, `--serif-scale`, `--tracking-serif`) stay defined with v4 values until Task 2 stops using them.

- [ ] Step 1: In `styles.test.mjs`, replace the v3 token assertions with a test `tokens.css: v4 palette, skill aliases and contrast floors` that parses the hex tokens and asserts the values above, the four skill aliases, and computed WCAG contrast: ink-muted on bg ≥ 4.5, ink-muted on paper ≥ 4.5, ink-faint on bg ≥ 4.5, white on red ≥ 4.5, ink on yellow ≥ 4.5, red on bg ≥ 3.
- [ ] Step 2: Run `node --test tests/unit/styles.test.mjs`. Expected: the new test FAILS (tokens still v3).
- [ ] Step 3: Rewrite `design/tokens.css` for v4 and `design/TASTE.md` for v4 (rules from the spec: shape↔skill map, colour roles, contrast rules, type, layout, robots, motion, banned list, rule of thumb).
- [ ] Step 4: Run `node --test tests/unit/*.mjs`. Expected: `# fail 0`.
- [ ] Step 5: Commit `Design system v4: Bauhaus Kinematics tokens and taste`.

### Task 2: Restyle the page (index.html + styles.css)

**Files:** Modify `index.html`, `styles.css`, `tests/unit/page.test.mjs`, `tests/unit/styles.test.mjs`, `tests/browser/page.test.html` (only if a selector it uses moves).

**Interfaces — consumes:** Task 1 tokens. **Produces:** classes `.shape`, `.shape--perception|compute|actuation|data`, `.word`, `.word--perception|compute|actuation`, `.hero-shapes`, `.hero-legend`, `.interlude-band`, `.service-shape`.

- [ ] Step 1: Write failing unit tests:
  - page: fonts link is `family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&family=Unbounded:wght@600;800&display=swap`; `theme-color` is `#E8EAEE`; no `<em>` in any `h1–h3`; the hero H1 has exactly one each of `word--perception`, `word--compute`, `word--actuation`; every other heading has at most one `word--`; every `.shape` span is `aria-hidden="true"`; the hero has a visible `.hero-legend` with three items carrying perception/compute/actuation shapes; the interlude sits in its own `<section class="interlude-band">` after `#work` and before `#services`; the three notes carry `note--perception`, `note--compute`, `note--actuation` in that order.
  - styles: `.shape--perception/compute/actuation/data` backgrounds are `var(--perception/compute/actuation/data)`; triangle and half-disc are clipped/rounded shapes; `.word--perception` colour `var(--perception)`, `.word--compute` colour `var(--compute)`, `.word--actuation` is ink with a `var(--actuation)` underline; `.interlude-band` background `var(--yellow)`, `.contact` background `var(--red)` and colour `var(--white)`; `.strip` and `.site-footer` background `var(--ink)`; the v3-only token names are no longer defined in tokens.css nor used in styles.css; `--font-serif` is unused; status dots use `var(--red)`; focus ring on dark/colour bands switches to `var(--white)`; the services tile grid uses a container query at the `--bp-tiles-4` threshold (60rem).
- [ ] Step 2: Run unit tests. Expected: the new tests FAIL.
- [ ] Step 3: Update `index.html` (fonts, theme-color, words, shapes, legend, hero shapes, interlude band, note classes, Bauhaus diagrams with no invented numbers) and restyle `styles.css` section by section per the spec; remove the v3-only tokens from `tokens.css`.
- [ ] Step 4: Run unit tests → `# fail 0`; run the browser pages → no new failures vs baseline; render 1440 and 390 screenshots and compare against the mockup; check no horizontal scroll at 390.
- [ ] Step 5: Commit `Restyle homepage in Bauhaus Kinematics`.

### Task 3: Robot materials and posters

**Files:** Modify `robots/tokens.js`, `robots/materials.js`, `tests/browser/cast.test.html`, `assets/posters/*.webp` (regenerated).

**Interfaces — consumes:** `--robot-shell`, `--robot-joint`, `--robot-signal` (Task 1). **Produces:** `readTokens().signal` replaces `readTokens().accent`.

- [ ] Step 1: In `cast.test.html`, set `--robot-signal:#112233` (instead of `--accent`) and assert `mats.signal.emissive` is `112233`; add an assertion that `readTokens()` throws when `--robot-signal` is missing even if `--accent` is set.
- [ ] Step 2: Run cast tests. Expected: FAIL.
- [ ] Step 3: `tokens.js` reads `--robot-signal` into `signal`; `materials.js` uses `tokens.signal`.
- [ ] Step 4: Run cast/models/stage/page browser tests → no new failures; regenerate the six posters with `tools/posters.html` via `tools/poster-server.py`; confirm sizes are unchanged and total ≤ 400 KB; unit tests green.
- [ ] Step 5: Commit `Robots: v4 materials and re-rendered posters`.

### Task 4: Figma sync

**Files:** none in the repo (Figma file `1H3FimcUCNMbv5AZWmbG47`).

- [ ] Step 1: Probe the Figma MCP (`whoami`, then `get_metadata` on the file).
- [ ] Step 2: If calls are allowed: add a `v4 — Bauhaus Kinematics` variable collection mirroring `design/tokens.css` colour tokens and a page with the v4 desktop frame. If the plan limit still blocks calls: record the blocker with the exact error and leave the repo as the source of truth.
- [ ] Step 3: Unit tests still `# fail 0` (no repo change expected).
