import { createRobot, ROBOT_NAMES } from '../robots/registry.js';
import { createStage } from '../robots/stage.js';
import { createMaterials, readTokens } from '../robots/materials.js';

// Pixel size, settle input and time only. Each robot's camera frame lives in its
// builder (robots/cast.js, robots/models.js), because the live stage uses it too.
const SPECS = {
  humanoid: { width: 1208, height: 1800, input: { pointer: { x: -0.35, y: 0.05 } }, time: 2 },
  bust: { width: 1072, height: 1200, input: { pointer: { x: -0.4, y: 0 } }, time: 1 },
  quadruped: { width: 1836, height: 1233, input: { motion: true }, time: 0.37 },
  arm: { width: 1200, height: 1400, input: { motion: false }, time: 0 },
  hand: { width: 2120, height: 1422, input: { attend: false }, time: 4.2 },
  waver: { width: 720, height: 900, input: { attend: true }, time: 0.6 },
};

// Posters have a fixed pixel size, so render 1:1 whatever the display's pixel ratio is.
// The stage reads devicePixelRatio whenever it resizes, so this has to come first.
Object.defineProperty(window, 'devicePixelRatio', { value: 1 });

const out = document.querySelector('#out');
const stages = document.querySelector('#stages');
const status = document.querySelector('#status');
const tokens = readTokens();
const anchors = {};

function settle(robot, name, input, time) {
  for (let i = 0; i < 240; i += 1) {
    const t = name === 'waver' ? (time * i) / 239 : time;
    robot.update(t, input);
  }
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('Canvas could not encode WebP')),
    'image/webp', 0.9,
  ));
}

async function renderPoster(name) {
  const spec = SPECS[name];
  const container = document.createElement('div');
  container.style.width = `${spec.width}px`;
  container.style.height = `${spec.height}px`;
  stages.append(container);

  const M = createMaterials(tokens);
  let robot;
  let stage;
  try {
    robot = await createRobot(name, { M, tokens, base: '../' });
    settle(robot, name, spec.input, spec.time);
    stage = createStage(container, robot, {
      shadowOpacity: name === 'hand' ? 0 : tokens.shadow,
      preserveDrawingBuffer: true,
    });
    // The poster's pixel size is part of the page layout (it fixes each container's aspect ratio).
    if (stage.canvas.width !== spec.width || stage.canvas.height !== spec.height) {
      throw new Error(`${name}: canvas is ${stage.canvas.width} × ${stage.canvas.height}, expected ${spec.width} × ${spec.height}`);
    }
    stage.render(spec.time, spec.input);
    const blob = await toBlob(stage.canvas);
    const response = await fetch(`../assets/posters/${name}.webp`, { method: 'PUT', body: blob });
    if (!response.ok) throw new Error(`${name}: poster upload failed (${response.status})`);

    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = URL.createObjectURL(blob);
    image.alt = `${name} robot poster preview`;
    image.width = spec.width;
    image.height = spec.height;
    const caption = document.createElement('figcaption');
    caption.textContent = `${name} · ${spec.width} × ${spec.height}`;
    figure.append(image, caption);
    out.append(figure);

    if (name === 'humanoid') {
      anchors.perception = robot.anchors.perception;
      anchors.edge = robot.anchors.edge;
      anchors.actuation = robot.anchors.actuation;
      // project() returns container CSS pixels, so divide by the container's CSS size, not the poster's pixel size.
      const cssWidth = container.clientWidth;
      const cssHeight = container.clientHeight;
      const positions = Object.fromEntries(Object.entries(anchors).map(([key, object]) => {
        const point = stage.project(object);
        return [key, { x: Number((point.x / cssWidth * 100).toFixed(2)), y: Number((point.y / cssHeight * 100).toFixed(2)) }];
      }));
      console.info('Humanoid poster anchor positions (%)', positions);
      window.__posterAnchors = positions;
    }
    status.textContent = `${name} rendered`;
    return { name, bytes: blob.size };
  } finally {
    stage?.dispose();
    for (const material of Object.values(M)) material.dispose();
    container.remove();
  }
}

async function renderAll() {
  const unknown = Object.keys(SPECS).filter((name) => !ROBOT_NAMES.includes(name));
  if (unknown.length) throw new Error(`Missing robot builders: ${unknown.join(', ')}`);
  const results = [];
  for (const name of ROBOT_NAMES) results.push(await renderPoster(name));
  window.__posters = results;
  status.textContent = `Rendered ${results.length} posters`;
  document.title = 'Posters done';
}

renderAll().catch((error) => {
  console.error(error);
  status.textContent = `Poster rendering failed: ${error.message}`;
  document.title = 'Poster rendering failed';
});
