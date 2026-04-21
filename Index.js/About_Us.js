// ===================== HAMBURGER MENU =====================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    navLinks.classList.remove('open');
  }
});

// ===================== SCROLL REVEAL =====================
const revealTargets = document.querySelectorAll(
  '.value-card, .partner-logo, .stat-block, .story-left, .hero-left, .hero-right, .cta-inner'
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach(el => {
  el.classList.add('reveal-init');
  observer.observe(el);
});

// Add reveal styles dynamically
const style = document.createElement('style');
style.textContent = `
  .reveal-init {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.55s ease, transform 0.55s ease;
  }
  .reveal-init.revealed {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// ===================== STAT COUNTER ANIMATION =====================
function animateCounter(el, target, suffix, duration) {
  let start = 0;
  const isFloat = target % 1 !== 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = isFloat
      ? (ease * target).toFixed(1)
      : Math.floor(ease * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const text = el.getAttribute('data-target');
      const suffix = el.getAttribute('data-suffix') || '';
      const target = parseFloat(text);
      animateCounter(el, target, suffix, 1600);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

// Set data attributes for stat counters
const statNumbers = document.querySelectorAll('.stat-number');
const statData = [
  { target: '99.9', suffix: '%' },
  { target: '500', suffix: '+' }
];
statNumbers.forEach((el, i) => {
  if (statData[i]) {
    el.setAttribute('data-target', statData[i].target);
    el.setAttribute('data-suffix', statData[i].suffix);
    el.textContent = '0' + statData[i].suffix;
    statObserver.observe(el);
  }
});

// ===================== ACTIVE NAV LINK =====================
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 80) {
      current = section.getAttribute('id') || '';
    }
  });
  navItems.forEach(link => {
    link.classList.remove('active');
    if (current && link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});