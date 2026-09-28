import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero-scene');
if (canvas && window.WebGLRenderingContext) {
  try {
    initGyroscope(canvas);
  } catch (err) {
    console.error('hero-scene: falling back, WebGL init failed', err);
    canvas.closest('.hero-scene-wrap')?.remove();
  }
}

function readColor(varName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function initGyroscope(canvas) {
  const container = canvas.closest('.hero-scene-wrap');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accent = readColor('--accent', '#FF5A1F');
  const muted = readColor('--text-faint', '#6E6858');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const rig = new THREE.Group();
  scene.add(rig);

  const ringMaterialOuter = new THREE.MeshBasicMaterial({ color: muted, wireframe: true, transparent: true, opacity: 0.5 });
  const ringMaterialMid = new THREE.MeshBasicMaterial({ color: muted, wireframe: true, transparent: true, opacity: 0.6 });
  const ringMaterialInner = new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.9 });

  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.02, 8, 120), ringMaterialOuter);
  ringOuter.rotation.x = Math.PI / 2.4;
  const ringMid = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.018, 8, 120), ringMaterialMid);
  ringMid.rotation.y = Math.PI / 2.6;
  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.022, 8, 120), ringMaterialInner);
  ringInner.rotation.x = Math.PI / 5;
  ringInner.rotation.y = Math.PI / 3;

  rig.add(ringOuter, ringMid, ringInner);

  const coreMaterial = new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.95 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), coreMaterial);
  rig.add(core);

  const starCount = 180;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const radius = 4 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: muted, size: 0.02, transparent: true, opacity: 0.4 });
  const stars = new THREE.Points(starGeometry, starsMaterial);
  scene.add(stars);

  // Keep the gyroscope's colours tied to the active theme.
  document.addEventListener('themechange', () => {
    const nextAccent = readColor('--accent', '#FF5A1F');
    const nextMuted = readColor('--text-faint', '#6E6858');
    ringMaterialOuter.color.set(nextMuted);
    ringMaterialMid.color.set(nextMuted);
    ringMaterialInner.color.set(nextAccent);
    coreMaterial.color.set(nextAccent);
    starsMaterial.color.set(nextMuted);
  });

  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  window.addEventListener('pointermove', (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollFactor = 0;
  window.addEventListener('scroll', () => {
    const heroHeight = container.parentElement?.offsetHeight || window.innerHeight;
    scrollFactor = Math.min(window.scrollY / heroHeight, 1.4);
  }, { passive: true });

  function resize() {
    const { clientWidth, clientHeight } = container;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !prefersReducedMotion) requestAnimationFrame(animate);
  });

  function animate() {
    if (!running) return;
    pointerX += (targetX - pointerX) * 0.04;
    pointerY += (targetY - pointerY) * 0.04;

    const spin = 0.0016 + scrollFactor * 0.01;
    ringOuter.rotation.z += spin;
    ringMid.rotation.z -= spin * 1.4;
    ringInner.rotation.z += spin * 1.9;
    rig.rotation.y = pointerX * 0.35;
    rig.rotation.x = pointerY * 0.2;
    stars.rotation.y += 0.0004;

    renderer.render(scene, camera);
    if (!prefersReducedMotion) requestAnimationFrame(animate);
  }

  renderer.render(scene, camera);
  if (!prefersReducedMotion) requestAnimationFrame(animate);
}
