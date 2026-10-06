const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ---- Theme toggle ---------------------------------------------------------
   Dark is the default brand identity regardless of OS preference; the
   toggle is an explicit opt-in to the light variant, remembered per visitor. */
const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
// Browser chrome tint follows the active theme's --bg token.
const syncThemeColor = () => {
  themeColorMeta.content = getComputedStyle(document.body).getPropertyValue('--bg').trim();
};
const storedTheme = localStorage.getItem('samir-theme');
const initialLight = storedTheme === 'light';
document.body.classList.toggle('theme-light', initialLight);
themeLabel.textContent = initialLight ? 'Light' : 'Dark';
themeToggle.setAttribute('aria-pressed', String(initialLight));
syncThemeColor();

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('theme-light');
  themeLabel.textContent = isLight ? 'Light' : 'Dark';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  localStorage.setItem('samir-theme', isLight ? 'light' : 'dark');
  syncThemeColor();
  document.dispatchEvent(new CustomEvent('themechange'));
});

/* ---- Custom cursor ------------------------------------------------------*/
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
if (isFinePointer && !prefersReducedMotion) {
  document.body.classList.add('has-cursor');
  let ringX = window.innerWidth / 2;
  let ringY = window.innerHeight / 2;
  window.addEventListener('pointermove', (event) => {
    cursorDot.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    ringX = event.clientX;
    ringY = event.clientY;
  });
  (function animateRing() {
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateRing);
  })();
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('is-active'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-active'));
  });
}

/* ---- Magnetic buttons -----------------------------------------------------*/
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('.button').forEach((button) => {
    // Measure once per hover, not on every mousemove (avoids a layout read per event).
    let rect;
    button.addEventListener('mouseenter', () => { rect = button.getBoundingClientRect(); });
    button.addEventListener('mousemove', (event) => {
      if (!rect) return;
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      // `translate`, not `transform`, so the CSS :active press-scale still composes.
      button.style.translate = `${x * 0.18}px ${y * 0.32}px`;
    });
    button.addEventListener('mouseleave', () => { button.style.translate = ''; });
  });
}

/* ---- Fullscreen nav overlay -----------------------------------------------*/
/* The trigger stays above the open overlay and morphs into an X (CSS keyed
   on aria-expanded), so it doubles as the close control. */
const menuTrigger = document.querySelector('.menu-trigger');
const menuLabel = menuTrigger.querySelector('span');
const navOverlay = document.getElementById('nav-overlay');
// While the overlay is open, everything behind it is inert so Tab stays in
// the menu (plus the corner trigger, which is the close control).
const behindNav = [document.querySelector('main'), document.querySelector('.site-footer'), document.querySelector('.corner-tl'), document.querySelector('.skip-link')];
const setNavState = (isOpen) => {
  const focusWasInMenu = navOverlay.contains(document.activeElement);
  navOverlay.classList.toggle('is-open', isOpen);
  navOverlay.setAttribute('aria-hidden', String(!isOpen));
  navOverlay.inert = !isOpen;
  behindNav.forEach((el) => { if (el) el.inert = isOpen; });
  menuTrigger.setAttribute('aria-expanded', String(isOpen));
  menuLabel.textContent = isOpen ? 'Close' : 'Menu';
  document.body.classList.toggle('nav-open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (isOpen) {
    navOverlay.querySelector('a')?.focus({ preventScroll: true });
  } else if (focusWasInMenu) {
    // The menu just went inert; hand focus back to the control that opened it.
    menuTrigger.focus({ preventScroll: true });
  }
};
menuTrigger.addEventListener('click', () => setNavState(!navOverlay.classList.contains('is-open')));
navOverlay.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNavState(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navOverlay.classList.contains('is-open')) setNavState(false);
});

/* ---- Hero kinetic headline reveal (GSAP, progressively enhanced) ---------
   Wait for webfonts: Unbounded swapping in after the CSS transform:110%
   has already resolved (against fallback-font metrics) would otherwise
   leave GSAP animating from a stale pixel offset instead of the real one. */
if (window.gsap && !prefersReducedMotion) {
  document.documentElement.classList.add('js-ready');
  const revealHero = () => {
    gsap.set('.kinetic .line > span', { yPercent: 110, opacity: 0 });
    gsap.to('.kinetic .line > span', {
      yPercent: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.09,
      delay: 0.15,
    });
  };
  if (document.fonts?.ready) {
    document.fonts.ready.then(revealHero);
  } else {
    revealHero();
  }
}

/* ---- Scroll progress -------------------------------------------------- */
const progress = document.querySelector('.scroll-progress span');
let progressQueued = false;
window.addEventListener('scroll', () => {
  if (progressQueued) return;
  progressQueued = true;
  requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${scrollable ? window.scrollY / scrollable : 0})`;
    progressQueued = false;
  });
}, { passive: true });

/* ---- Section reveal on scroll --------------------------------------------*/
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal-group').forEach((element) => {
  element.style.animationPlayState = 'paused';
  revealObserver.observe(element);
});

/* ---- Project detail toggle ---------------------------------------------*/
document.querySelectorAll('.details-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    const detail = document.getElementById(button.getAttribute('aria-controls'));
    detail.hidden = isOpen;
    button.innerHTML = !isOpen ? 'Hide Problem Solved <span aria-hidden="true">−</span>' : 'The Problem Solved <span aria-hidden="true">+</span>';
  });
});

/* ---- Case study dialog ---------------------------------------------------*/
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
    lesson: 'Perception becomes valuable when it is designed around the next decision, not just the model output.'
  },
  edge: {
    index: '02',
    kicker: 'EDGE INTELLIGENCE',
    title: 'Orientation and spatial intelligence',
    summary: 'A Jetson Nano experiment combining Lidar, depth sensing, and PyTorch inference for local environmental context.',
    problem: 'Remote inference adds latency and connectivity assumptions to systems that need to respond close to the sensor.',
    approach: 'Sensor input and model inference are brought closer to the device so spatial reasoning can happen with a smaller feedback loop.',
    lesson: 'Hardware constraints are design inputs: memory, latency, and power shape the useful version of an AI system.'
  }
};

/* The open case study is reflected in the URL (?case=vision) so it can be
   linked to and survives a reload; closing removes the param. */
const setCaseParam = (key) => {
  const url = new URL(window.location.href);
  if (key) url.searchParams.set('case', key); else url.searchParams.delete('case');
  history.replaceState(null, '', url);
};
const openCase = (key) => {
  const content = caseFields[key];
  if (!content || !caseStudy) return;
  document.querySelector('#case-index').textContent = content.index;
  document.querySelector('#case-kicker').textContent = content.kicker;
  document.querySelector('#case-title').textContent = content.title;
  document.querySelector('#case-summary').textContent = content.summary;
  document.querySelector('#case-problem').textContent = content.problem;
  document.querySelector('#case-approach').textContent = content.approach;
  document.querySelector('#case-lesson').textContent = content.lesson;
  caseStudy.showModal();
  setCaseParam(key);
};

document.querySelectorAll('.case-study-trigger').forEach((button) => {
  button.addEventListener('click', () => openCase(button.dataset.case));
});
// Fires for every way the dialog closes: close button, backdrop click, Esc.
caseStudy?.addEventListener('close', () => setCaseParam(null));
const initialCase = new URLSearchParams(window.location.search).get('case');
if (initialCase && Object.hasOwn(caseFields, initialCase)) openCase(initialCase);
caseClose?.addEventListener('click', () => caseStudy.close());
caseStudy?.addEventListener('click', (event) => { if (event.target === caseStudy) caseStudy.close(); });
