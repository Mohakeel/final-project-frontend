// ========================
// HAMBURGER MENU TOGGLE
// ========================
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  const navLinks   = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');
  const isOpen = navLinks.style.display === 'flex';
  if (isOpen) {
    navLinks.style.display   = 'none';
    navActions.style.display = 'none';
  } else {
    navLinks.style.cssText   = 'display:flex;flex-direction:column;position:absolute;top:64px;left:0;width:100%;background:#fff;padding:20px 24px;border-bottom:1px solid #e5e7eb;gap:18px;z-index:200;';
    navActions.style.cssText = `display:flex;flex-direction:column;position:absolute;top:${navLinks.offsetHeight + 64}px;left:0;width:100%;background:#fff;padding:16px 24px 24px;gap:12px;z-index:200;border-bottom:1px solid #e5e7eb;`;
  }
});

// ========================
// SCROLL REVEAL
// ========================
const revealEls = document.querySelectorAll('.step-card, .compliance-item, .security-title');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el, i) => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(28px)';
  el.style.transition = `opacity 0.55s ${i * 0.08}s ease, transform 0.55s ${i * 0.08}s ease`;
  observer.observe(el);
});
