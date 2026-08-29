const AMBIENT_VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

function initAmbientVideo() {
  const bg = document.getElementById('ambient-bg');
  if (!bg || !bg.hasAttribute('data-ambient-video') || bg.querySelector('video')) return;

  const video = document.createElement('video');
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;

  const source = document.createElement('source');
  source.src = AMBIENT_VIDEO_SRC;
  source.type = 'video/mp4';

  video.appendChild(source);
  bg.prepend(video);
}

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

function initAmbient() {
  initAmbientVideo();
  initAmbientReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAmbient);
} else {
  initAmbient();
}
