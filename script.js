const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const palette = document.querySelector('.command-palette');
const progress = document.querySelector('.scroll-progress span');
const quickNav = document.querySelector('.quick-nav');
const closeDialog = document.querySelector('.dialog-close');
const loader = document.querySelector('.loading-screen');
const loaderPercent = document.querySelector('.loader-percent');

const loaderStart = performance.now();
const updateLoader = (now) => {
  const elapsed = Math.min(now - loaderStart, 5000);
  loaderPercent.textContent = `${String(Math.round((elapsed / 5000) * 100)).padStart(2, '0')}%`;
  if (elapsed < 5000) requestAnimationFrame(updateLoader);
};
requestAnimationFrame(updateLoader);
setTimeout(() => loader.remove(), 5800);

const togglePalette = () => {
  if (palette.open) palette.close();
  else palette.showModal();
};

quickNav.addEventListener('click', togglePalette);
closeDialog.addEventListener('click', () => palette.close());
palette.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => palette.close()));

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    togglePalette();
  }
  if (event.key === 'Escape' && palette.open) palette.close();
});

window.addEventListener('scroll', () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${scrollable ? (window.scrollY / scrollable) * 100 : 0}%`;
});

const navLinks = [...document.querySelectorAll('.main-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => navObserver.observe(section));

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeLabel.textContent = isDark ? 'Dark' : 'Light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
});

document.querySelectorAll('.details-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.project-card');
    const isOpen = card.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.innerHTML = isOpen ? 'Hide problem solved <span>−</span>' : 'View problem solved <span>+</span>';
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

const openCaseStudy = (key) => {
  const content = caseFields[key];
  if (!content || !caseStudy) return;
  Object.entries(content).forEach(([field, value]) => {
    const element = document.querySelector(`#case-${field}`) || document.querySelector(`#case-title`);
    if (element) element.textContent = value;
  });
  document.querySelector('#case-index').textContent = content.index;
  document.querySelector('#case-kicker').textContent = content.kicker;
  caseStudy.showModal();
};

document.querySelectorAll('.project-card').forEach((card, index) => {
  if (index > 1) return;
  const button = document.createElement('button');
  button.className = 'case-study-trigger';
  button.type = 'button';
  button.dataset.case = index === 0 ? 'vision' : 'edge';
  button.innerHTML = 'Open case study <span>↗</span>';
  button.addEventListener('click', () => openCaseStudy(button.dataset.case));
  card.querySelector('.project-content').append(button);
});

caseClose?.addEventListener('click', () => caseStudy.close());
caseStudy?.addEventListener('click', (event) => {
  if (event.target === caseStudy) caseStudy.close();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => {
  element.style.animationPlayState = 'paused';
  revealObserver.observe(element);
});