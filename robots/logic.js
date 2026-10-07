/* Pure helpers for the 3D robots. No imports, no DOM, no Three.js: this file
   loads in the browser and under `node --test` alike. */

// 3D is an enhancement: skip it for reduced motion, data saver or no WebGL.
export const canRun3D = ({ reducedMotion, saveData, hasWebGL }) =>
  !reducedMotion && !saveData && Boolean(hasWebGL);

// Dark untextured materials get lifted so the robot reads on a white page.
export const isDarkColor = ({ r, g, b }, hasMap) =>
  !hasMap && 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18;

export const clampLook = (value, max) => Math.max(-max, Math.min(max, value));

// First clip whose name contains `wanted`, ignoring case.
export const pickClip = (names, wanted) => {
  const needle = wanted.toLowerCase();
  return names.find((name) => name.toLowerCase().includes(needle)) ?? null;
};

// Where a canvas sits relative to the viewport decides how much work it gets.
export const phaseFor = (rect, viewportH, margin = 200) => {
  if (rect.bottom > -margin && rect.top < viewportH + margin) return 'run';
  if (rect.bottom < -2 * viewportH || rect.top > 3 * viewportH) return 'dispose';
  return 'idle';
};

// Reads a CSS custom property value such as "40deg" or "0.5rad".
export const cssAngleToRad = (value) => {
  const n = parseFloat(value);
  return String(value).trim().endsWith('rad') ? n : (n * Math.PI) / 180;
};

export const cssNumber = (value, fallback) => {
  const n = parseFloat(value);
  return Number.isNaN(n) ? fallback : n;
};
