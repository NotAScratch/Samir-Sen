/* Read shared robot design tokens without importing Three.js, so lifecycle
   decisions can use them before the rendering modules are loaded. */
import { cssAngleToRad, cssLengthToPx, cssNumber } from './logic.js';

const read = (style, name) => {
  const value = style.getPropertyValue(name).trim();
  if (!value) throw new Error(`Missing CSS token ${name}`);
  return value;
};

export function readTokens(el = document.documentElement) {
  const style = getComputedStyle(el);
  const root = el.ownerDocument?.documentElement ?? el;
  const rootFontSize = cssNumber(getComputedStyle(root).fontSize, 16);
  return {
    shell: read(style, '--robot-shell'),
    joint: read(style, '--robot-joint'),
    signal: read(style, '--robot-signal'),
    shadow: cssNumber(read(style, '--robot-shadow')),
    lookMax: cssAngleToRad(read(style, '--look-max')),
    handNudge: cssNumber(read(style, '--hand-nudge')),
    activationMargin: cssLengthToPx(read(style, '--robot-activation-margin'), rootFontSize),
  };
}
