function initAmbientReveal(root = document) {
  const elements = root.querySelectorAll('[data-reveal-up]:not(.reveal-up)');
  if (elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach((el) => {
    el.classList.add('reveal-up');
    observer.observe(el);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAmbientReveal());
} else {
  initAmbientReveal();
}
