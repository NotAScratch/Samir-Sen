const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

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
    button.addEventListener('mousemove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.18}px, ${y * 0.32}px)`;
    });
    button.addEventListener('mouseleave', () => { button.style.transform = ''; });
  });
}

/* ---- Fullscreen nav overlay -----------------------------------------------*/
const menuTrigger = document.querySelector('.menu-trigger');
const menuClose = document.querySelector('.menu-close');
const navOverlay = document.getElementById('nav-overlay');
const setNavState = (isOpen) => {
  navOverlay.classList.toggle('is-open', isOpen);
  navOverlay.setAttribute('aria-hidden', String(!isOpen));
  menuTrigger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
};
menuTrigger.addEventListener('click', () => setNavState(!navOverlay.classList.contains('is-open')));
menuClose.addEventListener('click', () => setNavState(false));
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
window.addEventListener('scroll', () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${scrollable ? (window.scrollY / scrollable) * 100 : 0}%`;
});

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
    button.innerHTML = !isOpen ? 'Hide problem solved <span>−</span>' : 'The problem solved <span>+</span>';
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

document.querySelectorAll('.case-study-trigger').forEach((button) => {
  button.addEventListener('click', () => {
    const content = caseFields[button.dataset.case];
    if (!content || !caseStudy) return;
    document.querySelector('#case-index').textContent = content.index;
    document.querySelector('#case-kicker').textContent = content.kicker;
    document.querySelector('#case-title').textContent = content.title;
    document.querySelector('#case-summary').textContent = content.summary;
    document.querySelector('#case-problem').textContent = content.problem;
    document.querySelector('#case-approach').textContent = content.approach;
    document.querySelector('#case-lesson').textContent = content.lesson;
    caseStudy.showModal();
  });
});
caseClose?.addEventListener('click', () => caseStudy.close());
caseStudy?.addEventListener('click', (event) => { if (event.target === caseStudy) caseStudy.close(); });

/* ---- Inject real project imagery into the work blocks ---------------------*/
const projectImages = [
  ['images/image1.png', 'Computer vision workbench with camera hardware and object detection output'],
  ['images/image2.png', 'Camera and edge-computing board mounted for spatial sensing'],
  [null, null],
  [null, null],
  ['images/image3.png', 'Spatial sensing prototype with lidar scan pattern and edge device'],
  ['images/image.png', 'Embedded electronics board being tested with power and measurement equipment']
];

document.querySelectorAll('.work-block').forEach((block, index) => {
  const [source, alt] = projectImages[index] || [];
  const media = block.querySelector('.work-media');
  if (source && media) {
    const image = document.createElement('img');
    image.src = source;
    image.alt = alt;
    image.loading = 'lazy';
    media.prepend(image);
  }
});
