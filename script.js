import { formatNpt } from './lib/clock.js';
import { validateContact, buildMailto, CONTACT_EMAIL } from './lib/contact.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal runs first: CSS holds .reveal content back until this marks it in.
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

// Local time in Kathmandu, shown in Contact.
const updateClock = () => {
  document.querySelectorAll('.local-clock').forEach((clock) => {
    clock.textContent = formatNpt(new Date());
  });
};
updateClock();
window.setInterval(updateClock, 30_000);

// Phone menu: the toggle names what it will do, focus stays inside while open.
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');

const setMenuState = (open, { restoreFocus = true } = {}) => {
  if (!menuToggle || !menu) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? 'Close' : 'Menu';
  menu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  if (open) menu.querySelector('a')?.focus({ preventScroll: true });
  else if (restoreFocus) menuToggle.focus({ preventScroll: true });
};

menuToggle?.addEventListener('click', () => {
  setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
});
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));
document.addEventListener('keydown', (event) => {
  const isOpen = menuToggle?.getAttribute('aria-expanded') === 'true';
  if (!isOpen) return;
  if (event.key === 'Escape') {
    setMenuState(false);
    return;
  }
  if (event.key !== 'Tab' || !menu) return;
  const focusable = [menuToggle, ...menu.querySelectorAll('a[href]')];
  const first = focusable[0];
  const last = focusable.at(-1);
  const outside = !focusable.includes(document.activeElement);
  if (event.shiftKey && (document.activeElement === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || outside)) {
    event.preventDefault();
    first.focus();
  }
});
// The menu only exists below 48rem; widening the window closes it.
window.matchMedia('(width >= 48rem)').addEventListener('change', (event) => {
  if (event.matches && menuToggle?.getAttribute('aria-expanded') === 'true') setMenuState(false, { restoreFocus: false });
});

// More projects: each row discloses its detail paragraph.
document.querySelectorAll('.index-row').forEach((row) => {
  row.addEventListener('click', () => {
    const open = row.getAttribute('aria-expanded') === 'true';
    const detail = document.getElementById(row.getAttribute('aria-controls'));
    row.setAttribute('aria-expanded', String(!open));
    if (detail) detail.hidden = open;
  });
});

// Case studies open in a dialog; ?case=vision|edge links straight to one.
const caseStudy = document.querySelector('.case-study');
const caseClose = document.querySelector('.case-close');
const caseFields = {
  vision: {
    index: '01',
    kicker: 'Final-year project, 2025',
    title: 'Real-time object detection with distance and direction',
    summary: 'A computer-vision pipeline that turns a live camera feed into spatial information a robotic system can use.',
    problem: 'Raw video holds a lot of information, but a downstream system needs a clear, structured signal before it can act on it.',
    approach: 'SSD MobileNet detects objects in each frame, and a FastAPI service reports each object with its estimated distance and direction. A Spring Boot web app with user login sits in front, and the whole stack is deployed with Docker.',
    lesson: 'Perception pays off when it is designed around the decision that comes next.',
  },
  edge: {
    index: '02',
    kicker: 'Edge AI',
    title: 'Orientation and spatial edge intelligence',
    summary: 'A Jetson Nano experiment combining LiDAR, depth sensing and PyTorch inference for local environmental context.',
    problem: 'Remote inference adds latency and a dependence on the network, which a robot that has to react close to its sensors can’t afford.',
    approach: 'Sensor input and model inference run on the device, so spatial reasoning happens inside a short feedback loop.',
    lesson: 'Hardware constraints are design inputs: memory, latency and power shape the useful version of an AI system.',
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

// A robot pays attention while its control is hovered or focused.
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

// The track under the quadruped moves only while the dog is live and on screen.
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

// Copy the email address, and say whether it worked.
document.querySelectorAll('.copy-email').forEach((button) => {
  const status = button.closest('.contact-email')?.querySelector('.copy-status');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      if (status) status.textContent = `Copied ${button.dataset.copy} to your clipboard.`;
    } catch {
      if (status) status.textContent = 'Couldn’t copy automatically. Select the address and copy it yourself.';
    }
  });
});

// Contact form: errors appear on submit and clear as each field is fixed.
// A valid message opens the visitor's email app; the site stores nothing.
const form = document.querySelector('.contact-form');
if (form) {
  const fields = ['name', 'email', 'message'].map((key) => [key, form.elements[key]]);
  const status = form.querySelector('.form-status');
  const values = () => Object.fromEntries(fields.map(([key, input]) => [key, input.value]));
  const showError = (input, message) => {
    const error = document.getElementById(`${input.id}-error`);
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = message ?? '';
      error.hidden = !message;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const current = values();
    const errors = validateContact(current);
    fields.forEach(([key, input]) => showError(input, errors[key]));
    const firstInvalid = fields.find(([key]) => errors[key]);
    if (firstInvalid) {
      if (status) status.textContent = '';
      firstInvalid[1].focus();
      return;
    }
    if (status) status.textContent = `Your email app should now open with the message ready to send. If nothing opens, write to ${CONTACT_EMAIL} from any email account.`;
    window.location.href = buildMailto(current);
  });

  fields.forEach(([key, input]) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') !== 'true') return;
      if (!validateContact(values())[key]) showError(input, null);
    });
  });
}

// Start live robots after the first paint so static page behavior stays usable.
window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    import('./robots/index.js')
      .then(({ initRobots }) => initRobots())
      .catch((error) => console.warn('Robots stay on their poster:', error));
  });
});
