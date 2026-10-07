/* One robot's stage: a transparent canvas appended to `container`, with the
   shared studio light (room environment, one soft key, contact shadow) and a
   camera framed by the robot. Loaded only on demand, so it may import Three.js.

   The canvas is sized by CSS (`position: absolute; inset: 0; width: 100%;
   height: 100%`), so resizing its drawing buffer never moves the layout.
   Materials passed in with the robot are shared and are never disposed here. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FOV = 26;
const SHADOW_MAP = 1024;

/** `Stage = { canvas, render(t, input), resize(), project(object3d), dispose(), firstFrame, lost }`. */
export function createStage(container, robot, { shadowOpacity, preserveDrawingBuffer = false }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer });
  const canvas = renderer.domElement;
  const gl = renderer.getContext();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);
  const point = new THREE.Vector3();
  let envTarget = null;
  let observer = null;
  let width = 0;
  let height = 0;
  let drawn = false;
  let lost = false;
  let disposed = false;
  let resolveFirstFrame;
  const firstFrame = new Promise((resolve) => { resolveFirstFrame = resolve; });

  const onLost = () => {
    lost = true;
    container.dispatchEvent(new CustomEvent('robot:lost'));
  };

  function dispose() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    // Geometries belong to this robot; its materials are shared, so only the ground's goes.
    scene.traverse((o) => {
      o.geometry?.dispose();
      o.skeleton?.dispose();
      if (o.material?.isShadowMaterial) o.material.dispose();
    });
    envTarget?.dispose();
    renderer.dispose();
    if (!lost && !gl.isContextLost()) renderer.forceContextLoss(); // frees the GPU context now, not at garbage collection
    canvas.remove();
  }

  function resize() {
    if (disposed || lost) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (!w || !h || (w === width && h === height && pixelRatio === renderer.getPixelRatio())) return;
    width = w;
    height = h;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false); // CSS owns the displayed size
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Resizing clears the canvas, and a frame may be painted before the next draw.
    if (drawn && !gl.isContextLost()) renderer.render(scene, camera);
  }

  try {
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    envTarget = pmrem.fromScene(room, 0.04);
    pmrem.dispose();
    room.dispose();
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.9;

    const key = new THREE.DirectionalLight();
    key.intensity = 1.6;
    key.position.set(2.5, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 15 });
    const fill = new THREE.HemisphereLight();
    fill.intensity = 0.5;
    scene.add(key, fill);

    if (!robot.floating) {
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: shadowOpacity }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
    }
    scene.add(robot.object);

    camera.position.fromArray(robot.frame.position);
    camera.lookAt(...robot.frame.target);
    camera.updateMatrixWorld();

    canvas.setAttribute('aria-hidden', 'true');
    canvas.addEventListener('webglcontextlost', onLost);
    container.append(canvas);
    resize();
    observer = new ResizeObserver(resize);
    observer.observe(container);
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    canvas,
    firstFrame,
    get lost() { return lost; },
    resize,
    render(t, input) {
      if (disposed || lost || gl.isContextLost()) return; // the lost event may still be in flight
      robot.update(t, input);
      renderer.render(scene, camera);
      if (!drawn) {
        drawn = true;
        resolveFirstFrame();
      }
    },
    // Container-relative pixels (y grows downward), for HTML callouts.
    project(object3d) {
      object3d.getWorldPosition(point).project(camera);
      return { x: (point.x + 1) * 0.5 * width, y: (1 - point.y) * 0.5 * height };
    },
    dispose,
  };
}
