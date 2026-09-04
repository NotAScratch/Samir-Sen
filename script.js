const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const palette = document.querySelector('.command-palette');
const progress = document.querySelector('.scroll-progress span');
const quickNav = document.querySelector('.quick-nav');
const closeDialog = document.querySelector('.dialog-close');

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