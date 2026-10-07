/* Downloaded CC0 models, made to match the code-built cast: every material is
   swapped for the shared matte set, and each model is scaled to a known height
   so it stands on y=0 like the rest. Builders return the same Robot shape as
   cast.js; they are async because the GLB has to download first. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isDarkColor, pickClip } from './logic.js';

const loader = new GLTFLoader();
const FADE_SECONDS = 0.3;

// Dark untextured parts become graphite joints, everything else the white shell.
const matte = (M) => (material) => (isDarkColor(material.color, Boolean(material.map)) ? M.joint : M.shell);

/** Loads a GLB as `{ object, clips }`: matte, `height` tall, centred on x/z, feet on y=0. */
export async function loadModel(url, M, { height }) {
  const gltf = await loader.loadAsync(url); // rejects on HTTP errors
  const pick = matte(M);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(pick) : pick(o.material);
    o.castShadow = true;
    o.receiveShadow = true;
  });

  // Precise bounds follow skinned vertices instead of the stale bind-pose box.
  const measure = () => new THREE.Box3().setFromObject(gltf.scene, true);
  const size = measure().getSize(new THREE.Vector3());
  gltf.scene.scale.multiplyScalar(height / size.y);
  const box = measure();
  const centre = box.getCenter(new THREE.Vector3());
  gltf.scene.position.set(-centre.x, -box.min.y, -centre.z);

  const object = new THREE.Group();
  object.add(gltf.scene);
  return { object, clips: gltf.animations };
}

const findClip = (clips, wanted) => {
  const name = pickClip(clips.map((c) => c.name), wanted);
  if (!name) throw new Error(`Model has no "${wanted}" clip`);
  return clips.find((c) => c.name === name);
};

/** Static robot arm on a slow turntable. The file has no clips. */
export async function buildArm(M, url) {
  const { object: turntable } = await loadModel(url, M, { height: 1.0 });
  // The page owns the outer transform (cursor tilt), so spin an inner pivot.
  const root = new THREE.Group();
  root.add(turntable);
  return {
    object: root,
    frame: { position: [0.9, 0.75, 1.9], target: [0, 0.5, 0] },
    update(t, { motion }) {
      turntable.rotation.y = motion ? 0.436 * Math.sin((t * 2 * Math.PI) / 12) : 0;
    },
  };
}

/** Animated robot: idles, and cross-fades into a wave while the page is attending. */
export async function buildWaver(M, url) {
  const { object, clips } = await loadModel(url, M, { height: 1.2 });
  const mixer = new THREE.AnimationMixer(object);
  const idle = mixer.clipAction(findClip(clips, 'idle'));
  const wave = mixer.clipAction(findClip(clips, 'wave'));
  idle.play();
  wave.play().setEffectiveWeight(0); // runs silently so a fade-in is never a cold start

  let mix = 0; // 0 = idle, 1 = wave
  let last = null;
  return {
    object,
    actions: { idle, wave },
    frame: { position: [0.5, 0.8, 2.4], target: [0, 0.6, 0] },
    update(t, { attend }) {
      // The mixer's delta comes from successive `t`, so the first frame advances nothing.
      const delta = last === null ? 0 : Math.max(0, t - last);
      last = t;
      // Blending by hand (not crossFadeTo) lets a fade reverse mid-way without a pop.
      const before = mix;
      mix = THREE.MathUtils.clamp(mix + (attend ? delta : -delta) / FADE_SECONDS, 0, 1);
      if (before === 0 && mix > 0) wave.reset(); // each wave starts from its first frame
      idle.setEffectiveWeight(1 - mix);
      wave.setEffectiveWeight(mix);
      mixer.update(delta);
    },
  };
}
