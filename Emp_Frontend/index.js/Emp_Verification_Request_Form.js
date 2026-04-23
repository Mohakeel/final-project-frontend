import { requestVerification, getUniversities, logout, removeToken, removeRole } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();

  // ── Load universities from API ──
  try {
    const universities = await getUniversities();
    const menu = document.getElementById('dropdownMenu');
    if (menu && universities.length > 0) {
      menu.innerHTML = universities.map(u =>
        `<div class="dropdown-item" onclick="selectInstitution('${u.uni_name}', ${u.id})">${u.uni_name}</div>`
      ).join('');
    }
  } catch (err) {
    console.warn('Failed to load universities:', err.message);
  }
});

// ─── Dropdown ─────────────────────────────────────
let dropdownOpen = false;
let selectedUniversityId = null;

window.toggleDropdown = function() {
  dropdownOpen = !dropdownOpen;
  const menu    = document.getElementById('dropdownMenu');
  const wrapper = document.getElementById('institutionSelect');
  menu.classList.toggle('open', dropdownOpen);
  wrapper.classList.toggle('open', dropdownOpen);
};

window.selectInstitution = function(name, id) {
  const valueEl = document.getElementById('selectValue');
  valueEl.textContent = name;
  valueEl.classList.add('selected');
  selectedUniversityId = id;
  dropdownOpen = false;
  document.getElementById('dropdownMenu').classList.remove('open');
  document.getElementById('institutionSelect').classList.remove('open');
  updateProgress();
};

document.addEventListener('click', e => {
  const wrapper = document.getElementById('institutionSelect');
  if (!wrapper.contains(e.target)) {
    dropdownOpen = false;
    document.getElementById('dropdownMenu').classList.remove('open');
    wrapper.classList.remove('open');
  }
});

// ─── Progress Bar ─────────────────────────────────────
function updateProgress() {
  const institution = document.getElementById('selectValue').classList.contains('selected');
  const name   = document.getElementById('studentName').value.trim();
  const degree = document.getElementById('degreeProgram').value.trim();
  const year   = document.getElementById('gradYear').value.trim();
  const filled = [institution, name !== '', degree !== '', year.length === 4].filter(Boolean).length;
  document.querySelector('.form-progress-fill').style.width = (filled / 4 * 100) + '%';
}

['studentName', 'degreeProgram', 'gradYear'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateProgress);
});
document.getElementById('gradYear').addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '');
  updateProgress();
});

// ─── Toast ─────────────────────────────────────
function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function showErrorToast(msg) {
  let t = document.getElementById('toast');
  const orig = t.innerHTML;
  t.innerHTML = msg;
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); t.innerHTML = orig; }, 3500);
}

// ─── Form Validation & Submit ─────────────────────────────────────
window.handleSubmit = async function() {
  const institution = document.getElementById('selectValue').classList.contains('selected');
  const name   = document.getElementById('studentName').value.trim();
  const degree = document.getElementById('degreeProgram').value.trim();
  const year   = document.getElementById('gradYear').value.trim();

  highlightField('studentName',   name === '');
  highlightField('degreeProgram', degree === '');
  highlightField('gradYear',      year.length !== 4);

  if (!institution) {
    document.getElementById('institutionSelect').style.borderColor = '#e74c3c';
  } else {
    document.getElementById('institutionSelect').style.borderColor = '';
  }

  if (!institution || !name || !degree || year.length !== 4) {
    shakeForm();
    return;
  }

  const submitBtn = document.querySelector('.submit-btn');
  if (submitBtn) { submitBtn.textContent = 'Submitting...'; submitBtn.disabled = true; }

  try {
    await requestVerification({
      university_id: selectedUniversityId,
      student_name:  name,
      degree:        degree,
      year:          parseInt(year),
    });
    showToast();
    resetForm();
  } catch (err) {
    showErrorToast('Error: ' + err.message);
  } finally {
    if (submitBtn) { submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> Submit Verification Request'; submitBtn.disabled = false; }
  }
};

function highlightField(id, isError) {
  const wrapper = document.getElementById(id)?.closest('.input-wrapper');
  if (!wrapper) return;
  wrapper.style.borderColor = isError ? '#e74c3c' : '';
  wrapper.style.background  = isError ? '#fff8f8' : '';
}

function shakeForm() {
  const card = document.querySelector('.form-card');
  card.style.transition = 'transform 0.08s';
  const moves = ['-6px', '6px', '-4px', '4px', '0px'];
  let i = 0;
  const interval = setInterval(() => {
    card.style.transform = `translateX(${moves[i]})`;
    i++;
    if (i >= moves.length) { clearInterval(interval); card.style.transform = ''; }
  }, 80);
}

function resetForm() {
  document.getElementById('studentName').value   = '';
  document.getElementById('degreeProgram').value = '';
  document.getElementById('gradYear').value      = '';
  const valueEl = document.getElementById('selectValue');
  valueEl.textContent = 'Search or Select Institution';
  valueEl.classList.remove('selected');
  selectedUniversityId = null;
  document.querySelectorAll('.input-wrapper').forEach(w => { w.style.borderColor = ''; w.style.background = ''; });
  document.getElementById('institutionSelect').style.borderColor = '';
  document.querySelector('.form-progress-fill').style.width = '0%';
}

// ── Sign Out ──
document.addEventListener('DOMContentLoaded', () => {
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async e => {
      e.preventDefault();
      try { await logout(); } catch (_) {}
      removeToken();
      removeRole();
      window.location.href = (window.location.pathname.includes('/CertiVerify/') ? '/CertiVerify' : '') + '/Login.html';
    });
  }
});
