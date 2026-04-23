import { register, setToken, setRole, setName } from '../frontend/api.js';

// ========================
// ANIMATED NETWORK CANVAS
// ========================
let canvas, ctx, nodes = [];

function initCanvas() {
  canvas = document.getElementById('networkCanvas');
  if (!canvas) return false;
  ctx = canvas.getContext('2d');
  return true;
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function createNodes(count) {
  nodes = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 2.5 + 1.5
    });
  }
}

function drawNetwork() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const maxDist = 130;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx   = nodes[i].x - nodes[j].x;
      const dy   = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${0.18 * (1 - dist / maxDist)})`;
        ctx.lineWidth   = 0.8;
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  });
}

function updateNodes() {
  nodes.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
    if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
  });
}

function animateNetwork() {
  updateNodes();
  drawNetwork();
  requestAnimationFrame(animateNetwork);
}

window.addEventListener('resize', () => { resizeCanvas(); createNodes(55); });

document.addEventListener('DOMContentLoaded', () => {
  if (initCanvas()) {
    resizeCanvas();
    createNodes(55);
    animateNetwork();
  }
});

// ========================
// ROLE SELECTOR
// ========================
const roleBtns = document.querySelectorAll('.role-btn');
let selectedRole = 'applicant';

roleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    roleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRole = btn.dataset.role;
  });
});

// ========================
// PASSWORD VISIBILITY TOGGLE
// ========================
const pwInput   = document.getElementById('password');
const togglePw  = document.getElementById('togglePw');
const eyeIcon   = document.getElementById('eyeIcon');
const eyeOpen = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const eyeClosed = `<path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
let pwVisible = false;
togglePw.addEventListener('click', () => {
  pwVisible = !pwVisible;
  pwInput.type = pwVisible ? 'text' : 'password';
  eyeIcon.innerHTML = pwVisible ? eyeClosed : eyeOpen;
});

// ========================
// PASSWORD STRENGTH
// ========================
const strengthBar   = document.getElementById('strengthBar');
const strengthFill  = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthConfig = [
  { label: '',        color: '#dde0ec', pct: '0%'   },
  { label: 'Weak',    color: '#ef4444', pct: '25%'  },
  { label: 'Fair',    color: '#f97316', pct: '50%'  },
  { label: 'Good',    color: '#eab308', pct: '75%'  },
  { label: 'Strong',  color: '#22c55e', pct: '90%'  },
  { label: 'Perfect', color: '#16a34a', pct: '100%' },
];

pwInput.addEventListener('input', () => {
  const pw = pwInput.value;
  if (!pw) { strengthBar.classList.remove('visible'); return; }
  strengthBar.classList.add('visible');
  const score = Math.min(getStrength(pw), 5);
  const cfg   = strengthConfig[score];
  strengthFill.style.width      = cfg.pct;
  strengthFill.style.background = cfg.color;
  strengthLabel.textContent     = cfg.label;
  strengthLabel.style.color     = cfg.color;
});

// ========================
// VALIDATION HELPERS
// ========================
function showError(inputEl, errorEl, msg) {
  inputEl.classList.add('error');
  inputEl.classList.remove('valid');
  errorEl.textContent = msg;
}
function showValid(inputEl, errorEl) {
  inputEl.classList.remove('error');
  inputEl.classList.add('valid');
  errorEl.textContent = '';
}

const nameInput  = document.getElementById('fullName');
const nameError  = document.getElementById('nameError');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');
const pwError    = document.getElementById('pwError');

nameInput.addEventListener('blur', () => {
  const v = nameInput.value.trim();
  if (!v) showError(nameInput, nameError, 'Full name is required.');
  else if (v.length < 2) showError(nameInput, nameError, 'Name must be at least 2 characters.');
  else showValid(nameInput, nameError);
});
nameInput.addEventListener('input', () => {
  if (nameInput.classList.contains('error') && nameInput.value.trim().length >= 2)
    showValid(nameInput, nameError);
});

emailInput.addEventListener('blur', () => {
  const v = emailInput.value.trim();
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!v) showError(emailInput, emailError, 'Email address is required.');
  else if (!emailRx.test(v)) showError(emailInput, emailError, 'Please enter a valid email address.');
  else showValid(emailInput, emailError);
});
emailInput.addEventListener('input', () => {
  if (emailInput.classList.contains('error')) {
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRx.test(emailInput.value.trim())) showValid(emailInput, emailError);
  }
});

pwInput.addEventListener('blur', () => {
  const v = pwInput.value;
  if (!v) showError(pwInput, pwError, 'Password is required.');
  else if (v.length < 12) showError(pwInput, pwError, 'Password must be at least 12 characters.');
  else if (!/[^A-Za-z0-9]/.test(v)) showError(pwInput, pwError, 'Password must include at least one symbol.');
  else showValid(pwInput, pwError);
});
pwInput.addEventListener('input', () => {
  if (pwInput.classList.contains('error')) {
    const v = pwInput.value;
    if (v.length >= 12 && /[^A-Za-z0-9]/.test(v)) showValid(pwInput, pwError);
  }
});

// ========================
// ERROR MESSAGE ELEMENT
// ========================
function getOrCreateErrorEl() {
  let el = document.querySelector('.error-msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'error-msg';
    el.style.cssText = 'color:#dc2626;font-size:13px;margin-top:8px;text-align:center;';
    const btn = document.getElementById('createBtn');
    btn.parentNode.insertBefore(el, btn.nextSibling);
  }
  return el;
}

// ========================
// FORM SUBMISSION
// ========================
const createBtn = document.getElementById('createBtn');
const btnText   = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const successOverlay = document.getElementById('successOverlay');

function validateAll() {
  let valid = true;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const name = nameInput.value.trim();
  if (!name || name.length < 2) {
    showError(nameInput, nameError, !name ? 'Full name is required.' : 'Name must be at least 2 characters.');
    valid = false;
  } else showValid(nameInput, nameError);
  const email = emailInput.value.trim();
  if (!email) { showError(emailInput, emailError, 'Email address is required.'); valid = false; }
  else if (!emailRx.test(email)) { showError(emailInput, emailError, 'Please enter a valid email address.'); valid = false; }
  else showValid(emailInput, emailError);
  const pw = pwInput.value;
  if (!pw) { showError(pwInput, pwError, 'Password is required.'); valid = false; }
  else if (pw.length < 12) { showError(pwInput, pwError, 'Password must be at least 12 characters.'); valid = false; }
  else if (!/[^A-Za-z0-9]/.test(pw)) { showError(pwInput, pwError, 'Password must include at least one symbol.'); valid = false; }
  else showValid(pwInput, pwError);
  return valid;
}

createBtn.addEventListener('click', async () => {
  if (!validateAll()) return;

  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  createBtn.disabled = true;
  getOrCreateErrorEl().textContent = '';

  try {
    const data = await register(
      emailInput.value.trim(),
      pwInput.value,
      selectedRole,
      nameInput.value.trim()
    );
    setToken(data.access_token);
    setRole(data.role);
    setName(data.name || nameInput.value.trim());

    // Show success overlay briefly, then redirect — overlay is NOT dismissable during redirect
    successOverlay.classList.add('active');
    // Use relative path for localhost, absolute for GitHub Pages
    let dest;
    if (window.location.pathname.includes('/CertiVerify/')) {
      const base = '/CertiVerify';
      dest = data.role === 'applicant'  ? base + '/Applicant_Frontend/App_Dashboard.html' :
             data.role === 'employer'   ? base + '/Emp_Frontend/Employer_Dashboard.html'  :
             data.role === 'university' ? base + '/Uni_Frontend/Uni_Dashboard.html'       :
             base + '/Other_Frontend/index.html';
    } else {
      dest = data.role === 'applicant'  ? '../Applicant_Frontend/App_Dashboard.html' :
             data.role === 'employer'   ? '../Emp_Frontend/Employer_Dashboard.html'  :
             data.role === 'university' ? '../Uni_Frontend/Uni_Dashboard.html'       :
             'index.html';
    }
    setTimeout(() => { window.location.href = dest; }, 1200);
  } catch (err) {
    getOrCreateErrorEl().textContent = err.message || 'Registration failed. Please try again.';
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    createBtn.disabled = false;
  }
});

// Overlay is intentionally not dismissable — redirect happens automatically

[nameInput, emailInput, pwInput].forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') createBtn.click(); });
});
