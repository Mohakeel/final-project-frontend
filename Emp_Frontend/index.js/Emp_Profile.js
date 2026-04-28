import { getEmpProfile, updateEmpProfile, logout, removeToken, removeRole, getName, setName, uploadAvatar, getMe, API_BASE } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Show stored name instantly ──
const userNameEl = document.querySelector('.user-name');
const storedName = getName();
if (userNameEl && storedName) userNameEl.textContent = storedName;

document.addEventListener('DOMContentLoaded', () => {
  initNotificationBell();
  initAvatar();
  setupAvatarUpload();
});

// ── Avatar upload — dedicated implementation for profile page ──
function setupAvatarUpload() {
  const avatarEl = document.getElementById('navAvatar') || document.querySelector('.avatar');
  if (!avatarEl) return;

  // Block parent <a> navigation permanently on profile page
  const parentLink = avatarEl.closest('a');
  if (parentLink) {
    parentLink.addEventListener('click', (e) => e.preventDefault(), true);
  }

  avatarEl.style.cursor = 'pointer';
  avatarEl.style.position = 'relative';
  avatarEl.style.overflow = 'hidden';
  avatarEl.title = 'Click to upload profile picture';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);color:#fff;font-size:10px;text-align:center;padding:3px 0;pointer-events:none;';
  overlay.textContent = '📷';
  avatarEl.appendChild(overlay);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  avatarEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }

    const url = URL.createObjectURL(file);
    applyAvatarToAll(url);

    try {
      await uploadAvatar(file);
      showToast('Profile picture updated!');
    } catch (e) {
      showToast('Upload failed: ' + e.message);
    }
  });
}

function applyAvatarToAll(url) {
  document.querySelectorAll('.avatar').forEach(el => {
    el.style.backgroundImage = `url(${url})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.color = 'transparent';
    el.style.fontSize = '0';
  });
}

// ── Toast ──
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e40af;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ── Load profile ──
async function loadProfile() {
  try {
    const profile = await getEmpProfile();
    console.log('Employer profile data:', profile); // Debug log
    
    const nameEl  = document.getElementById('companyName');
    const indEl   = document.getElementById('industry');
    const emailEl = document.getElementById('corpEmail');
    const phoneEl = document.getElementById('phoneNumber');
    const accountEmailEl = document.getElementById('accountEmail'); // Login email field if exists
    
    if (nameEl  && profile.company_name)  nameEl.value  = profile.company_name;
    if (emailEl && profile.company_email) emailEl.value = profile.company_email;
    if (phoneEl && profile.phone) phoneEl.value = profile.phone;
    
    // Populate login email if field exists
    if (accountEmailEl && profile.email) {
      accountEmailEl.value = profile.email;
    }
    
    if (indEl   && profile.industry) {
      const opts = Array.from(indEl.options);
      const match = opts.find(o => o.value.toLowerCase() === (profile.industry || '').toLowerCase());
      if (match) indEl.value = match.value;
    }
    if (userNameEl && profile.company_name) {
      userNameEl.textContent = profile.company_name;
      setName(profile.company_name);
    }
  } catch (err) {
    console.error('Failed to load employer profile:', err);
    showToast('Failed to load profile: ' + err.message);
  }
}

// ── Nav Active State ──
// ── Sign Out ──
// ── Save / Cancel ──
// (All wired inside DOMContentLoaded)

document.addEventListener('DOMContentLoaded', () => {
  // Nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Sign Out
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
      window.location.href = (window.location.pathname.includes('/CertiVerify/') ? '/CertiVerify' : '') + '/Login.html';
    });
  }

  // Save / Cancel
  const saveBtn   = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name  = document.getElementById('companyName').value.trim();
      const email = document.getElementById('corpEmail').value.trim();
      const phone = document.getElementById('phoneNumber').value.trim();
      const industry = document.getElementById('industry').value;
      if (!name)  { showToast('Company name is required.'); return; }
      if (!email || !email.includes('@')) { showToast('Please enter a valid corporate email address.'); return; }
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled    = true;
      try {
        await updateEmpProfile({ company_name: name, company_email: email, phone: phone, industry });
        showToast('Profile saved successfully.');
        saveBtn.textContent = '✔ Saved!';
        saveBtn.style.background = '#16a34a';
        setTimeout(() => { saveBtn.textContent = 'Save Changes'; saveBtn.style.background = '#1a3cdc'; saveBtn.disabled = false; }, 2500);
      } catch (err) {
        showToast('Error: ' + err.message);
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled    = false;
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => { loadProfile(); });
  }

  loadProfile();
});
