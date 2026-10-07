/* Lazy lifecycle for the page's live robots. Each `[data-robot]` container
   owns one WebGL stage, created when it nears the viewport and freed when
   it is far away. Only logic.js is imported up front: Three.js, the stage,
   the materials and the registry load on the first robot that needs to run.

   Anything that goes wrong (404 model, CDN down, context lost) leaves that
   robot on its poster: the container gets `is-failed`, one console.warn is
   logged, and it is never retried. A robot that is drawing gets `is-live`. */
import { canRun3D, phaseFor, clampLook } from './logic.js';

const MAX_LIVE = 3; // WebGL contexts are scarce; browsers drop the oldest past ~16

export function detectEnv() {
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(navigator.connection?.saveData),
    hasWebGL: probeWebGL(),
  };
}

// Three.js needs WebGL2. The probe context is released at once.
function probeWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

/** Returns `null` when 3D is not allowed; otherwise `{ entries, liveCount(), destroy() }`.
   `base` prefixes model URLs for pages below the site root. */
export function initRobots(root = document, env = detectEnv(), { base = '' } = {}) {
  if (!canRun3D(env)) return null;

  const entries = new Map(); // container -> { phase, stage?, robot?, ... }
  const pointer = { x: 0, y: 0 }; // viewport-normalised, y positive downward
  const input = { pointer, attend: false, motion: true };
  let shared = null;
  let raf = 0;
  let dirty = false;
  let destroyed = false;

  // Loaded once, on the first robot that comes into range. A rejected load
  // stays rejected, so every robot falls back and none retries.
  const load = () => (shared ??= (async () => {
    const [stage, materials, registry] = await Promise.all([
      import('./stage.js'), import('./materials.js'), import('./registry.js'),
    ]);
    const tokens = materials.readTokens();
    return { createStage: stage.createStage, createRobot: registry.createRobot, tokens, M: materials.createMaterials(tokens) };
  })());

  const liveCount = () => [...entries.values()].filter((entry) => entry.stage).length;

  // Hands the container back to its poster. Safe to call twice.
  const release = (el, entry) => {
    const { stage } = entry;
    delete entry.stage;
    delete entry.robot;
    delete entry.callouts;
    el.classList.remove('is-live');
    for (const node of el.querySelectorAll('[data-anchor]')) {
      node.style.removeProperty('--ax'); // back to the poster's own callout position
      node.style.removeProperty('--ay');
    }
    try {
      stage?.dispose();
    } catch {
      // A lost context can refuse to be freed; nothing is left to clean up.
    }
  };

  const fail = (el, entry, error) => {
    if (entry.failed) return;
    entry.failed = true;
    release(el, entry);
    el.classList.add('is-failed');
    console.warn(`Robot "${el.dataset.robot}" stays on its poster:`, error);
  };

  const gapToViewport = (el) => {
    const { top, bottom } = el.getBoundingClientRect();
    return Math.max(top - window.innerHeight, -bottom, 0);
  };

  // At most MAX_LIVE contexts: a new robot may take the place of one that is out of range.
  const outOfRange = () => [...entries].filter(([, entry]) => entry.stage && entry.phase !== 'run');
  const hasRoom = () => liveCount() < MAX_LIVE || outOfRange().length > 0;
  const makeRoom = () => {
    while (liveCount() >= MAX_LIVE) {
      const spare = outOfRange();
      if (!spare.length) return false;
      const [el, entry] = spare.reduce((far, next) => (gapToViewport(next[0]) > gapToViewport(far[0]) ? next : far));
      release(el, entry);
    }
    return true;
  };

  const create = async (el, entry) => {
    entry.loading = true;
    try {
      const { createStage, createRobot, tokens, M } = await load();
      const robot = await createRobot(el.dataset.robot, { M, tokens, base });
      // The page may have scrolled on while the model downloaded.
      if (destroyed || entry.failed || entry.phase !== 'run' || !makeRoom()) return;
      const stage = createStage(el, robot, { shadowOpacity: tokens.shadow });
      entry.stage = stage;
      entry.robot = robot;
      entry.callouts = [...el.querySelectorAll('[data-anchor]')].map((node) => ({ node, name: node.dataset.anchor }));
      stage.firstFrame.then(() => { if (entry.stage === stage) el.classList.add('is-live'); });
      wake();
    } catch (error) {
      if (!destroyed) fail(el, entry, error);
    } finally {
      entry.loading = false;
    }
  };

  const evaluate = () => {
    const viewportH = window.innerHeight;
    for (const [el, entry] of entries) {
      entry.phase = phaseFor(el.getBoundingClientRect(), viewportH);
      if (entry.phase === 'dispose' && entry.stage) release(el, entry);
    }
    // Starts come second, so contexts freed above count as room.
    for (const [el, entry] of entries) {
      if (entry.phase === 'run' && !entry.failed && !entry.stage && !entry.loading && hasRoom()) void create(el, entry);
    }
  };

  // Callout positions are written only when they move by a tenth of a pixel.
  const placeCallouts = (stage, { robot, callouts }) => {
    for (const callout of callouts) {
      const anchor = robot.anchors?.[callout.name];
      if (!anchor) continue;
      const { x, y } = stage.project(anchor);
      const px = Math.round(x * 10) / 10;
      const py = Math.round(y * 10) / 10;
      if (px !== callout.x) callout.node.style.setProperty('--ax', `${px}px`);
      if (py !== callout.y) callout.node.style.setProperty('--ay', `${py}px`);
      callout.x = px;
      callout.y = py;
    }
  };

  // One loop for every robot; it stops itself when nothing is in the run phase.
  const frame = (now) => {
    raf = 0;
    if (destroyed) return;
    if (dirty) {
      dirty = false;
      evaluate();
    }
    let drawing = false;
    for (const [el, entry] of entries) {
      if (entry.phase !== 'run' || !entry.stage) continue;
      try {
        input.attend = el.dataset.attend === 'true';
        entry.stage.render(now / 1000, input);
        placeCallouts(entry.stage, entry);
        drawing = true;
      } catch (error) {
        fail(el, entry, error);
      }
    }
    if (drawing) wake();
  };
  const wake = () => { if (!raf && !destroyed) raf = requestAnimationFrame(frame); };

  const recheck = () => {
    dirty = true;
    wake();
  };
  const onPointer = (event) => {
    pointer.x = clampLook((event.clientX / window.innerWidth - 0.5) * 2, 1);
    pointer.y = clampLook((event.clientY / window.innerHeight - 0.5) * 2, 1);
  };
  const onLost = (event) => {
    const el = event.currentTarget;
    fail(el, entries.get(el), new Error('WebGL context lost'));
  };

  for (const el of root.querySelectorAll('[data-robot]')) {
    entries.set(el, { phase: 'idle' });
    el.addEventListener('robot:lost', onLost);
  }
  window.addEventListener('scroll', recheck, { passive: true });
  window.addEventListener('resize', recheck, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  evaluate();

  return {
    entries,
    liveCount,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', recheck);
      window.removeEventListener('resize', recheck);
      window.removeEventListener('pointermove', onPointer);
      for (const [el, entry] of entries) {
        release(el, entry);
        el.classList.remove('is-failed');
        el.removeEventListener('robot:lost', onLost);
      }
      entries.clear();
      // The controller made the shared materials, so it frees them.
      shared?.then(({ M }) => { for (const material of Object.values(M)) material.dispose(); }, () => {});
    },
  };
}
