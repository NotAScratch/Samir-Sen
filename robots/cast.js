/* The code-built cast: four robots made from primitives. Every joint is a
   named Group pivot, so poses and gaits are plain rotations. Materials come
   in as `M` (see materials.js). "l"/"r" in names mean the -/+ side of the
   lateral axis (x for the humanoid, z for the quadruped).

   Each builder returns a Robot:
   { object, frame: { position, target }, update(t, { pointer, attend, motion }) } */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clampLook } from './logic.js';

const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const group = (parent, x = 0, y = 0, z = 0, name = '') => {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
};
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 4, r);
const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 20);
const ball = (r) => new THREE.SphereGeometry(r, 32, 16);
const disc = (r, h) => new THREE.CylinderGeometry(r, r, h, 32);
const damp = (current, target, k) => current + (target - current) * k;
const side = (s) => (s < 0 ? 'l' : 'r');

// Eases yaw/pitch toward the pointer. The target is clamped, so the head
// can never wind up past lookMax and then lag when the pointer turns back.
const lookFollower = ({ yaw, pitch, k }, lookMax) => {
  let x = 0;
  let y = 0;
  return (pointer) => {
    x = damp(x, clampLook(pointer.x * yaw, lookMax), k);
    y = damp(y, clampLook(pointer.y * pitch, lookMax), k);
    return { yaw: x, pitch: y };
  };
};

function buildHead(parent, M) {
  const head = group(parent, 0, 0, 0, 'head');
  const skull = mesh(ball(0.115), M.shell, 0, 0.11, 0);
  skull.scale.set(0.95, 1.15, 1.05);
  const visor = mesh(ball(0.1), M.visor, 0, 0.1, 0.072);
  visor.scale.set(0.88, 0.8, 0.6);
  head.add(skull, visor);
  for (const s of [-1, 1]) {
    const ear = mesh(disc(0.04, 0.03), M.joint, s * 0.105, 0.11, -0.005);
    ear.rotation.z = Math.PI / 2;
    head.add(ear);
  }
  const light = mesh(ball(0.009), M.signal, 0.088, 0.165, 0.045);
  light.castShadow = false;
  head.add(light);
  return { head, light };
}

/** Humanoid "Unit-01": idles, shifts weight, and turns its head toward the cursor. */
export function buildHumanoid(M, opts) {
  const root = new THREE.Group();
  const pelvis = group(root, 0, 1.0, 0, 'pelvis');
  pelvis.add(mesh(rbox(0.3, 0.16, 0.2, 0.06), M.shell));
  pelvis.add(mesh(disc(0.09, 0.08), M.joint, 0, 0.1, 0));

  const torso = group(pelvis, 0, 0.12, 0, 'torso');
  torso.add(mesh(rbox(0.2, 0.16, 0.15, 0.05), M.joint, 0, 0.1, 0));
  const chest = mesh(rbox(0.4, 0.3, 0.22, 0.08), M.shell, 0, 0.33, 0);
  torso.add(chest);
  torso.add(mesh(rbox(0.3, 0.004, 0.01, 0.002), M.joint, 0, 0.27, 0.107));
  torso.add(mesh(disc(0.045, 0.1), M.joint, 0, 0.53, 0));

  const neck = group(torso, 0, 0.58, 0, 'neck');
  const { head, light } = buildHead(neck, M);

  const arms = [];
  let rightWrist;
  for (const s of [-1, 1]) {
    const shoulder = group(torso, s * 0.25, 0.42, 0, `shoulder-${side(s)}`);
    shoulder.add(mesh(ball(0.07), M.joint));
    shoulder.add(mesh(cap(0.055, 0.2), M.shell, 0, -0.16, 0));
    const elbow = group(shoulder, 0, -0.3, 0, `elbow-${side(s)}`);
    elbow.add(mesh(ball(0.05), M.joint));
    elbow.add(mesh(cap(0.048, 0.18), M.shell, 0, -0.14, 0));
    const wrist = group(elbow, 0, -0.27, 0, `wrist-${side(s)}`);
    wrist.add(mesh(ball(0.032), M.joint));
    wrist.add(mesh(rbox(0.035, 0.1, 0.075, 0.015), M.shell, 0, -0.07, 0));
    if (s > 0) rightWrist = wrist;
    arms.push({ s, shoulder, elbow });
  }

  const legs = [];
  for (const s of [-1, 1]) {
    const hip = group(pelvis, s * 0.1, -0.05, 0, `hip-${side(s)}`);
    hip.add(mesh(ball(0.07), M.joint));
    hip.add(mesh(cap(0.07, 0.3), M.shell, 0, -0.22, 0));
    const knee = group(hip, 0, -0.44, 0, `knee-${side(s)}`);
    const kneeCap = mesh(disc(0.06, 0.12), M.joint);
    kneeCap.rotation.z = Math.PI / 2;
    knee.add(kneeCap);
    knee.add(mesh(cap(0.06, 0.3), M.shell, 0, -0.22, 0));
    const ankle = group(knee, 0, -0.44, 0, `ankle-${side(s)}`);
    ankle.add(mesh(ball(0.04), M.joint));
    ankle.add(mesh(rbox(0.1, 0.05, 0.22, 0.02), M.shell, 0, -0.04, 0.04));
    ankle.add(mesh(rbox(0.1, 0.015, 0.22, 0.006), M.rubber, 0, -0.07, 0.04));
    legs.push({ s, hip, knee });
  }

  // Where the page pins its callouts: visor face, chest face, right wrist.
  const anchors = {
    perception: new THREE.Object3D(),
    edge: new THREE.Object3D(),
    actuation: new THREE.Object3D(),
  };
  anchors.perception.position.set(0, 0.1, 0.132);
  head.add(anchors.perception);
  anchors.edge.position.set(0, 0, 0.11);
  chest.add(anchors.edge);
  rightWrist.add(anchors.actuation);

  const look = lookFollower({ yaw: 0.7, pitch: 0.3, k: 0.06 }, opts.lookMax);
  return {
    object: root,
    frame: { position: [1.82, 1.39, 4.67], target: [0, 0.94, 0] },
    anchors,
    update(t, { pointer }) {
      const sway = Math.sin(t * 0.55);
      pelvis.position.x = sway * 0.012;
      pelvis.rotation.z = sway * 0.012;
      torso.rotation.y = Math.sin(t * 0.4) * 0.05;
      chest.scale.setScalar(1 + Math.sin(t * 1.6) * 0.008);
      for (const { s, shoulder, elbow } of arms) {
        shoulder.rotation.z = s * (0.1 + Math.sin(t * 0.8 + s) * 0.02);
        shoulder.rotation.x = Math.sin(t * 0.55 + s) * 0.04;
        elbow.rotation.x = -0.18;
      }
      for (const { s, hip, knee } of legs) {
        hip.rotation.z = -sway * 0.012 * s;
        knee.rotation.x = 0.04 + (s * sway > 0 ? sway * 0.04 : 0);
      }
      const { yaw, pitch } = look(pointer);
      neck.rotation.y = yaw;
      neck.rotation.x = pitch;
      light.visible = Math.sin(t * 3) > -0.6;
    },
  };
}

/** Bust: head + shoulders for the profile section. Tracks the cursor; status light blinks. */
export function buildBust(M, opts) {
  const root = new THREE.Group();
  const torso = group(root, 0, 0, 0, 'torso');
  torso.add(mesh(rbox(0.46, 0.3, 0.24, 0.09), M.shell, 0, 0.15, 0));
  for (const s of [-1, 1]) torso.add(mesh(ball(0.06), M.joint, s * 0.25, 0.2, 0));
  torso.add(mesh(disc(0.045, 0.12), M.joint, 0, 0.34, 0));
  for (const s of [-1, 1]) {
    const cable = mesh(cap(0.012, 0.1), M.joint, s * 0.03, 0.34, -0.02);
    cable.rotation.z = s * 0.15;
    torso.add(cable);
  }
  const neck = group(torso, 0, 0.4, 0, 'neck');
  const { head, light } = buildHead(neck, M);
  head.position.y = -0.01;

  const look = lookFollower({ yaw: 0.8, pitch: 0.35, k: 0.05 }, opts.lookMax);
  return {
    object: root,
    frame: { position: [0.66, 0.49, 1.51], target: [0.02, 0.3, -0.01] },
    update(t, { pointer }) {
      const { yaw, pitch } = look(pointer);
      // The idle drift rides on top, so clamp the sum.
      neck.rotation.y = clampLook(yaw + Math.sin(t * 0.3) * 0.04, opts.lookMax);
      neck.rotation.x = pitch;
      neck.rotation.z = Math.sin(t * 0.45) * 0.03;
      light.visible = (t % 2.4) > 0.25;
    },
  };
}

/** Quadruped "Unit-K9": trotting gait. The page draws the distance track itself. */
export function buildQuadruped(M) {
  const root = new THREE.Group();
  const body = group(root, 0, 0.55, 0, 'body');
  body.add(mesh(rbox(0.9, 0.18, 0.3, 0.07), M.shell));
  body.add(mesh(rbox(0.56, 0.025, 0.12, 0.01), M.joint, -0.02, 0.095, 0));
  body.add(mesh(rbox(0.12, 0.13, 0.25, 0.04), M.joint, 0.5, -0.005, 0));
  for (const z of [-0.055, 0.055]) body.add(mesh(ball(0.026), M.visor, 0.565, 0.015, z));
  body.add(mesh(rbox(0.08, 0.12, 0.22, 0.03), M.joint, -0.47, 0, 0));
  const light = mesh(ball(0.012), M.signal, 0.38, 0.095, 0);
  light.castShadow = false;
  body.add(light);

  // Diagonal pairs share a phase: fr + bl, then fl + br.
  const legs = [];
  const LEGS = [['fr', 0.33, 0.17, 0], ['fl', 0.33, -0.17, Math.PI], ['br', -0.33, 0.17, Math.PI], ['bl', -0.33, -0.17, 0]];
  for (const [id, x, z, phase] of LEGS) {
    const hip = group(body, x, -0.05, z, `hip-${id}`);
    const hj = mesh(disc(0.06, 0.07), M.joint);
    hj.rotation.x = Math.PI / 2;
    hip.add(hj);
    hip.add(mesh(cap(0.048, 0.2), M.shell, 0, -0.14, 0));
    const knee = group(hip, 0, -0.28, 0, `knee-${id}`);
    knee.add(mesh(ball(0.045), M.joint));
    knee.add(mesh(cap(0.024, 0.22), M.joint, 0, -0.14, 0));
    knee.add(mesh(ball(0.036), M.rubber, 0, -0.28, 0));
    legs.push({ hip, knee, phase });
  }

  return {
    object: root,
    frame: { position: [0.79, 0.63, 1.9], target: [0.01, 0.31, 0] },
    update(t, { motion }) {
      const p = t * (motion ? 5.5 : 0);
      for (const { hip, knee, phase } of legs) {
        const f = p + phase;
        hip.rotation.z = -0.6 + Math.sin(f) * 0.32;
        knee.rotation.z = 1.2 + Math.max(0, Math.cos(f)) * 0.55;
      }
      body.position.y = 0.55 + (motion ? Math.abs(Math.sin(p)) * 0.012 : 0);
      body.rotation.z = motion ? Math.sin(p) * 0.012 : 0;
      light.visible = (t % 1.6) > 0.2;
    },
  };
}

/** Robotic hand: holds a pointing pose and eases toward the email link while attending. */
export function buildHand(M, opts) {
  const nudgeTo = -(opts.handNudge ?? 0) / 1000; // 1 px ~ 1 mm at contact scale
  const root = new THREE.Group();
  const arm = group(root, 0, 0.3, 0, 'arm');
  const forearm = mesh(cap(0.05, 0.34), M.shell, 0.29, 0, 0);
  forearm.rotation.z = Math.PI / 2;
  arm.add(forearm);
  const cuff = mesh(disc(0.055, 0.03), M.joint, 0.1, 0, 0);
  cuff.rotation.z = Math.PI / 2;
  arm.add(cuff);
  const wrist = group(arm, 0.07, 0, 0, 'wrist');
  wrist.add(mesh(ball(0.04), M.joint));
  wrist.add(mesh(rbox(0.12, 0.035, 0.1, 0.015), M.shell, -0.07, 0, 0));

  // Index (the front-edge finger) points; the rest curl. The pose is static.
  const FINGER_CURL = 1.33;
  const INDEX_CURL = 0.05;
  const THUMB_CURL = 0.75;
  const segs = [0.045, 0.032, 0.026];
  const makeFinger = (x, z, lengths, yaw, curls) => {
    const base = group(wrist, x, 0, z);
    base.rotation.y = yaw;
    let parent = base;
    lengths.forEach((len, k) => {
      const j = group(parent);
      j.add(mesh(ball(0.0135), k === 0 ? M.joint : M.shell));
      const seg = mesh(cap(0.0125, len - 0.014), M.shell, -len / 2, 0, 0);
      seg.rotation.z = Math.PI / 2;
      j.add(seg);
      j.rotation.z = curls[k];
      parent = group(j, -len, 0, 0);
    });
  };
  [-0.036, -0.012, 0.012, 0.036].forEach((z, i) => {
    const scale = i === 0 || i === 3 ? 0.88 : 1;
    const curl = i === 3 ? INDEX_CURL : FINGER_CURL;
    makeFinger(-0.13, z, segs.map((s) => s * scale), 0, [curl * 0.8, curl, curl]);
  });
  makeFinger(-0.05, 0.055, [0.04, 0.03], -0.7, [THUMB_CURL, THUMB_CURL]);

  let nudge = 0;
  return {
    object: root,
    floating: true,
    frame: { position: [-0.12, 0.39, 0.56], target: [-0.02, 0.29, 0.01] },
    update(t, { attend }) {
      nudge = damp(nudge, attend ? nudgeTo : 0, 0.08);
      wrist.rotation.x = Math.sin(t * 0.9) * 0.05;
      arm.position.x = nudge + Math.sin(t * 1.2) * 0.004;
    },
  };
}
