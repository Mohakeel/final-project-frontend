import { verifyCertByHash } from '../frontend/api.js';

// ========================
// VERIFY BUTTON & MODAL
// ========================
const verifyBtn       = document.getElementById('verifyBtn');
const credentialInput = document.getElementById('credentialInput');
const modalOverlay    = document.getElementById('modalOverlay');
const modalClose      = document.getElementById('modalClose');
const modalTitle      = document.getElementById('modalTitle');
const modalMessage    = document.getElementById('modalMessage');
const modalLoader     = document.getElementById('modalLoader');

function openModal(title, message, loading = false) {
  modalTitle.textContent   = title;
  modalMessage.textContent = message;
  modalLoader.classList.toggle('hidden', !loading);
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function renderResult(data) {
  modalLoader.classList.add('hidden');
  modalTitle.textContent = '✓ Certificate Verified';
  modalMessage.innerHTML = `
    <strong>Student:</strong> ${data.student_name}<br/>
    <strong>Degree:</strong> ${data.degree}<br/>
    <strong>Year:</strong> ${data.year}<br/>
    <strong>Hash:</strong> <code style="font-size:11px;word-break:break-all;">${data.cert_hash}</code><br/>
    <strong>Issued:</strong> ${data.issued_date ? new Date(data.issued_date).toLocaleDateString() : 'N/A'}
  `;
}

verifyBtn.addEventListener('click', async () => {
  const val = credentialInput.value.trim();
  if (!val) {
    openModal('Input Required', 'Please enter a Credential Hash to verify.', false);
    return;
  }

  openModal('Verifying Credential…', 'Querying the distributed ledger. Please wait.', true);

  try {
    const data = await verifyCertByHash(val);
    renderResult(data);
  } catch (err) {
    modalLoader.classList.add('hidden');
    modalTitle.textContent   = '✗ Verification Failed';
    modalMessage.textContent = 'Certificate not found or invalid.';
  }
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ========================
// HAMBURGER MENU TOGGLE
// ========================
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  const navLinks  = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');
  const isOpen = navLinks.style.display === 'flex';
  if (isOpen) {
    navLinks.style.display  = 'none';
    navActions.style.display = 'none';
  } else {
    navLinks.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:64px;left:0;width:100%;background:#fff;padding:20px 24px;border-bottom:1px solid #e5e7eb;gap:18px;z-index:200;';
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
  el.style.opacity   = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = `opacity 0.55s ${i * 0.08}s ease, transform 0.55s ${i * 0.08}s ease`;
  observer.observe(el);
});

credentialInput.addEventListener('keydown', e => { if (e.key === 'Enter') verifyBtn.click(); });
