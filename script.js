import { formatNpt } from './lib/clock.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateClock = () => {
  document.querySelectorAll('.nav-clock').forEach((clock) => {
    clock.textContent = formatNpt(new Date());
  });
};
updateClock();
window.setInterval(updateClock, 30_000);

const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');

const setMenuState = (open) => {
  if (!menuToggle || !menu) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  if (open) menu.querySelector('a')?.focus({ preventScroll: true });
  else menuToggle.focus({ preventScroll: true });
};

menuToggle?.addEventListener('click', () => {
  setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
});
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') setMenuState(false);
});

document.querySelectorAll('.index-row').forEach((row) => {
  row.addEventListener('click', () => {
    const open = row.getAttribute('aria-expanded') === 'true';
    const detail = document.getElementById(row.getAttribute('aria-controls'));
    row.setAttribute('aria-expanded', String(!open));
    if (detail) detail.hidden = open;
  });
});

const caseStudy = document.querySelector('.case-study');
const caseClose = document.querySelector('.case-close');
const caseFields = {
  vision: {
    index: '01',
    kicker: 'PERCEPTION PIPELINE',
    title: 'Real-time object detection',
    summary: 'A computer-vision pipeline that turns a live camera feed into spatial information a robotic system can use.',
    problem: 'Raw video is rich in information but difficult for a downstream system to act on without a clear, structured signal.',
    approach: 'SSD MobileNetV2 handles detection while FastAPI exposes the result as a lightweight service for distance and direction estimation.',
    lesson: 'Perception becomes valuable when it is designed around the next decision, not just the model output.',
  },
  edge: {
    index: '02',
    kicker: 'EDGE INTELLIGENCE',
    title: 'Orientation and spatial intelligence',
    summary: 'A Jetson Nano experiment combining Lidar, depth sensing, and PyTorch inference for local environmental context.',
    problem: 'Remote inference adds latency and connectivity assumptions to systems that need to respond close to the sensor.',
    approach: 'Sensor input and model inference are brought closer to the device so spatial reasoning can happen with a smaller feedback loop.',
    lesson: 'Hardware constraints are design inputs: memory, latency, and power shape the useful version of an AI system.',
  },
};

const setCaseParam = (key) => {
  const url = new URL(window.location.href);
  if (key) url.searchParams.set('case', key);
  else url.searchParams.delete('case');
  window.history.replaceState(null, '', url);
};

const openCase = (key) => {
  const content = caseFields[key];
  if (!content || !caseStudy) return;
  for (const [field, value] of Object.entries(content)) {
    const node = document.querySelector(`#case-${field}`);
    if (node) node.textContent = value;
  }
  caseStudy.showModal();
  setCaseParam(key);
};

document.querySelectorAll('.case-study-trigger').forEach((button) => {
  button.addEventListener('click', () => openCase(button.dataset.case));
});
caseClose?.addEventListener('click', () => caseStudy?.close());
caseStudy?.addEventListener('click', (event) => {
  if (event.target === caseStudy) caseStudy.close();
});
caseStudy?.addEventListener('close', () => setCaseParam(null));
const initialCase = new URLSearchParams(window.location.search).get('case');
if (initialCase && Object.hasOwn(caseFields, initialCase)) openCase(initialCase);

const attend = (element, active) => {
  const robot = document.querySelector(`.robot[data-robot="${CSS.escape(element.dataset.attends)}"]`);
  robot?.setAttribute('data-attend', String(active));
};
document.querySelectorAll('[data-attends]').forEach((element) => {
  element.addEventListener('pointerenter', () => attend(element, true));
  element.addEventListener('pointerleave', () => attend(element, false));
  element.addEventListener('focus', () => attend(element, true));
  element.addEventListener('blur', () => attend(element, false));
});
document.querySelectorAll('.robot[data-robot]').forEach((robot) => robot.setAttribute('data-attend', 'false'));

const reveals = [...document.querySelectorAll('.reveal')];
if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-in'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  reveals.forEach((element) => revealObserver.observe(element));
}

const interlude = document.querySelector('.interlude');
const quadruped = interlude?.querySelector('.robot[data-robot="quadruped"]');
if (interlude && quadruped) {
  let inView = false;
  const syncWalking = () => interlude.classList.toggle('is-walking', inView && quadruped.classList.contains('is-live'));
  if ('IntersectionObserver' in window) {
    const interludeObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncWalking();
    }, { threshold: 0 });
    interludeObserver.observe(quadruped);
  }
  new MutationObserver(syncWalking).observe(quadruped, { attributes: true, attributeFilter: ['class'] });
  syncWalking();
}

// Start live robots after the first paint so static page behavior stays usable.
window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    import('./robots/index.js')
      .then(({ initRobots }) => initRobots())
      .catch((error) => console.warn('Robots stay on their poster:', error));
  });
});
