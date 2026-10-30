/* One entry point for every robot, code-built or downloaded. Callers get the
   same Robot shape back (see cast.js) and never care which kind it is. */
import { buildHumanoid, buildBust, buildQuadruped, buildHand } from './cast.js';
import { buildArm, buildWaver, buildSpecimen } from './models.js';

export const ROBOT_NAMES = ['humanoid', 'bust', 'quadruped', 'arm', 'hand', 'waver'];
// Not cast members: third-party objects whose file comes from the container's data-model.
export const OBJECT_NAMES = ['specimen'];

/** `base` prefixes the model URLs, for pages that live below the site root.
   `model` is the GLB path for a specimen. */
export async function createRobot(name, { M, tokens, base = '', model = '' }) {
  const opts = { lookMax: tokens.lookMax, handNudge: tokens.handNudge };
  const builders = {
    humanoid: () => buildHumanoid(M, opts),
    bust: () => buildBust(M, opts),
    quadruped: () => buildQuadruped(M),
    arm: () => buildArm(M, `${base}assets/models/robot-arm.glb`),
    hand: () => buildHand(M, opts),
    waver: () => buildWaver(M, `${base}assets/models/animated-robot.glb`),
    specimen: () => {
      if (!model) throw new Error('Specimen has no data-model');
      return buildSpecimen(`${base}${model}`);
    },
  };
  if (!ROBOT_NAMES.includes(name) && !OBJECT_NAMES.includes(name)) throw new Error(`Unknown robot "${name}"`);
  return builders[name]();
}
