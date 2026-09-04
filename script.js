const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');

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