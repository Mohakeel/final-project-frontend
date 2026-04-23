import { login, setToken, setRole, setName } from '../frontend/api.js';

// ========================
// ANIMATED NETWORK CANVAS
// ========================
const canvas = document.getElementById('networkCanvas');
const ctx    = canvas.getContext('2d');
let nodes    = [];

function resizeCanvas() {
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
resizeCanvas();
createNodes(55);
animateNetwork();

// ========================
// STATS BARS
// ========================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.stats-bar-fill').forEach(bar => {
      bar.style.width = bar.style.width;
    });
  }, 600);
});

// ========================
// PASSWORD TOGGLE
// ========================
const pwInput  = document.getElementById('password');
const togglePw = document.getElementById('togglePw');
const eyeIcon  = document.getElementById('eyeIcon');
const eyeOpen   = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const eyeClosed = `<path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
let pwVisible = false;
togglePw.addEventListener('click', () => {
  pwVisible    = !pwVisible;
  pwInput.type = pwVisible ? 'text' : 'password';
  eyeIcon.innerHTML = pwVisible ? eyeClosed : eyeOpen;
});

// ========================
// VALIDATION HELPERS
// ========================
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');
const pwError    = document.getElementById('pwError');
const emailRx    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(input, errorEl, msg) {
  input.classList.add('error');
  input.classList.remove('valid');
  errorEl.textContent = msg;
}
function showValid(input, errorEl) {
  input.classList.remove('error');
  input.classList.add('valid');
  errorEl.textContent = '';
}

emailInput.addEventListener('blur', () => {
  const v = emailInput.value.trim();
  if (!v) showError(emailInput, emailError, 'Institutional email is required.');
  else if (!emailRx.test(v)) showError(emailInput, emailError, 'Please enter a valid email address.');
  else showValid(emailInput, emailError);
});
emailInput.addEventListener('input', () => {
  if (emailInput.classList.contains('error') && emailRx.test(emailInput.value.trim()))
    showValid(emailInput, emailError);
});
pwInput.addEventListener('blur', () => {
  const v = pwInput.value;
  if (!v) showError(pwInput, pwError, 'Password is required.');
  else if (v.length < 6) showError(pwInput, pwError, 'Password must be at least 6 characters.');
  else showValid(pwInput, pwError);
});
pwInput.addEventListener('input', () => {
  if (pwInput.classList.contains('error') && pwInput.value.length >= 6)
    showValid(pwInput, pwError);
});

// ========================
// TOAST
// ========================
const toast    = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
function showToast(msg, duration = 3000) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ========================
// ERROR MESSAGE ELEMENT
// ========================
function getOrCreateErrorEl() {
  let el = document.querySelector('.error-msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'error-msg';
    el.style.cssText = 'color:#dc2626;font-size:13px;margin-top:8px;text-align:center;';
    const btn = document.getElementById('signinBtn');
    btn.parentNode.insertBefore(el, btn.nextSibling);
  }
  return el;
}

// ========================
// SIGN IN SUBMIT
// ========================
const signinBtn  = document.getElementById('signinBtn');
const btnText    = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

function validateSignIn() {
  let valid = true;
  const email = emailInput.value.trim();
  const pw    = pwInput.value;
  if (!email) { showError(emailInput, emailError, 'Institutional email is required.'); valid = false; }
  else if (!emailRx.test(email)) { showError(emailInput, emailError, 'Please enter a valid email address.'); valid = false; }
  else showValid(emailInput, emailError);
  if (!pw) { showError(pwInput, pwError, 'Password is required.'); valid = false; }
  else if (pw.length < 6) { showError(pwInput, pwError, 'Password must be at least 6 characters.'); valid = false; }
  else showValid(pwInput, pwError);
  return valid;
}

signinBtn.addEventListener('click', async () => {
  if (!validateSignIn()) return;

  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  signinBtn.disabled = true;
  getOrCreateErrorEl().textContent = '';

  try {
    const data = await login(emailInput.value.trim(), pwInput.value);
    setToken(data.access_token);
    setRole(data.role);
    // Store email prefix as temporary name — dashboard will overwrite from profile API
    if (data.name) setName(data.name);
    else setName(emailInput.value.trim().split('@')[0]);

    showToast('✓ Signed in successfully! Redirecting…');

    setTimeout(() => {
      if (data.role === 'applicant') window.location.href = '../Applicant_Frontend/App_Dashboard.html';
      else if (data.role === 'employer') window.location.href = '../Emp_Frontend/Employer_Dashboard.html';
      else if (data.role === 'university') window.location.href = '../Uni_Frontend/Uni_Dashboard.html';
      else window.location.href = 'index.html';
    }, 800);
  } catch (err) {
    getOrCreateErrorEl().textContent = err.message || 'Login failed. Please try again.';
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    signinBtn.disabled = false;
  }
});

[emailInput, pwInput].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') signinBtn.click(); });
});

// ========================
// FORGOT PASSWORD MODAL
// ========================
const forgotLink  = document.getElementById('forgotLink');
const forgotModal = document.getElementById('forgotModal');
const forgotClose = document.getElementById('forgotClose');
const resetEmail  = document.getElementById('resetEmail');
const resetError  = document.getElementById('resetError');
const sendResetBtn  = document.getElementById('sendResetBtn');
const resetBtnText  = document.getElementById('resetBtnText');
const resetSpinner  = document.getElementById('resetSpinner');

function openForgot() {
  forgotModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => resetEmail.focus(), 300);
}
function closeForgot() {
  forgotModal.classList.remove('active');
  document.body.style.overflow = '';
  resetEmail.value = '';
  resetError.textContent = '';
  resetEmail.classList.remove('error', 'valid');
}

forgotLink.addEventListener('click', e => { e.preventDefault(); openForgot(); });
forgotClose.addEventListener('click', closeForgot);
forgotModal.addEventListener('click', e => { if (e.target === forgotModal) closeForgot(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeForgot(); });

sendResetBtn.addEventListener('click', () => {
  const v = resetEmail.value.trim();
  if (!v || !emailRx.test(v)) {
    resetEmail.classList.add('error');
    resetError.textContent = 'Please enter a valid institutional email.';
    return;
  }
  resetEmail.classList.remove('error');
  resetError.textContent = '';
  resetBtnText.classList.add('hidden');
  resetSpinner.classList.remove('hidden');
  sendResetBtn.disabled = true;
  setTimeout(() => {
    resetBtnText.classList.remove('hidden');
    resetSpinner.classList.add('hidden');
    sendResetBtn.disabled = false;
    closeForgot();
    showToast('✓ Reset link sent! Check your inbox.');
  }, 1600);
});
resetEmail.addEventListener('keydown', e => { if (e.key === 'Enter') sendResetBtn.click(); });
