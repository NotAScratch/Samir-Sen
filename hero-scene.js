import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero-scene');
if (canvas && window.WebGLRenderingContext) {
  try {
    initHeroScene(canvas);
  } catch (err) {
    console.error('hero-scene: falling back, WebGL init failed', err);
    canvas.remove();
  }
}

function readColor(varName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function initHeroScene(canvas) {
  const container = canvas.parentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const group = new THREE.Group();
  scene.add(group);

  const wireMaterial = new THREE.LineBasicMaterial({
    color: readColor('--accent', '#B6FF4C'),
    transparent: true,
    opacity: 0.85,
  });
  const coreGeometry = new THREE.IcosahedronGeometry(1.7, 1);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeometry), wireMaterial);
  group.add(wire);

  const innerMaterial = new THREE.LineBasicMaterial({
    color: readColor('--text-muted', '#9AA097'),
    transparent: true,
    opacity: 0.35,
  });
  const innerGeometry = new THREE.IcosahedronGeometry(1.15, 0);
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(innerGeometry), innerMaterial);
  group.add(inner);

  const pointCount = 260;
  const positions = new Float32Array(pointCount * 3);
  for (let i = 0; i < pointCount; i += 1) {
    const radius = 2.6 + Math.random() * 0.9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pointsMaterial = new THREE.PointsMaterial({
    color: readColor('--accent', '#B6FF4C'),
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  group.add(points);

  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  container.addEventListener('pointermove', (event) => {
    const rect = container.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  container.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function resize() {
    const { clientWidth, clientHeight } = container;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // Keep the wireframe colour tied to the active theme.
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    requestAnimationFrame(() => {
      wireMaterial.color.set(readColor('--accent', '#B6FF4C'));
      pointsMaterial.color.set(readColor('--accent', '#B6FF4C'));
      innerMaterial.color.set(readColor('--text-muted', '#9AA097'));
    });
  });

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !prefersReducedMotion) requestAnimationFrame(animate);
  });

  function animate() {
    if (!running) return;
    pointerX += (targetX - pointerX) * 0.04;
    pointerY += (targetY - pointerY) * 0.04;
    group.rotation.y += 0.0022;
    group.rotation.x = pointerY * 0.25;
    group.rotation.y += pointerX * 0.0008;
    points.rotation.y -= 0.0009;
    renderer.render(scene, camera);
    if (!prefersReducedMotion) requestAnimationFrame(animate);
  }

  renderer.render(scene, camera);
  if (!prefersReducedMotion) requestAnimationFrame(animate);
}
