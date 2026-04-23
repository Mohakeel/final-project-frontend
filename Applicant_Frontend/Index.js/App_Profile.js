import { getApplicantProfile, updateApplicantProfile, logout, removeToken, removeRole, getName, setName, uploadAvatar } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();
  setupAvatarUpload();

  // ── Show stored name instantly ──
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;

  // ── Animated counter utility ──
  function animateCount(el, target, suffix = '', duration = 1200) {
    let start = 0;
    const startTime = performance.now();
    const update = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const scoreEl = document.getElementById('scoreNum');
  if (scoreEl) animateCount(scoreEl, 98, '', 1400);

  setTimeout(() => {
    const credEl  = document.getElementById('credNum');
    const matchEl = document.getElementById('matchNum');
    const privEl  = document.getElementById('privNum');
    if (credEl)  animateCount(credEl,  12, '',  1000);
    if (matchEl) animateCount(matchEl,  4, '',  1000);
    if (privEl)  animateCount(privEl, 100, '%', 1200);
  }, 300);

  // ── Nav switching ──
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => { n.classList.remove('active'); const ind = n.querySelector('.nav-indicator'); if (ind) ind.remove(); });
      item.classList.add('active');
    });
  });

  const emailInput = document.getElementById('emailInput');
  const nameInput  = document.getElementById('nameInput');
  const phoneInput = document.getElementById('phoneInput');

  // ── Load profile ──
  try {
    const profile = await getApplicantProfile();
    if (nameInput  && profile.full_name) nameInput.value  = profile.full_name;
    if (phoneInput && profile.phone)     phoneInput.value = profile.phone;

    // Topbar — persist updated name
    if (userNameEl && profile.full_name) {
      userNameEl.textContent = profile.full_name;
      setName(profile.full_name);
    }
  } catch (err) {
    console.warn('Profile load error:', err.message);
  }

  // ── Save Changes ──
  const saveBtn = document.getElementById('saveBtn');
  const toast   = document.getElementById('toast');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled    = true;

      try {
        await updateApplicantProfile({
          full_name: nameInput?.value || '',
          phone:     phoneInput?.value || '',
        });
        if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled    = false;
      } catch (err) {
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled    = false;
        const errEl = document.querySelector('.error-msg') || (() => {
          const el = document.createElement('div');
          el.className = 'error-msg';
          el.style.cssText = 'color:#dc2626;font-size:13px;margin-top:8px;';
          saveBtn.parentNode.insertBefore(el, saveBtn.nextSibling);
          return el;
        })();
        errEl.textContent = err.message;
      }
    });
  }

  // ── Cancel ──
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      try {
        const profile = await getApplicantProfile();
        if (nameInput  && profile.full_name) nameInput.value  = profile.full_name;
        if (phoneInput && profile.phone)     phoneInput.value = profile.phone;
        [nameInput, phoneInput].forEach(inp => {
          if (!inp) return;
          inp.style.background = '#fef9c3';
          setTimeout(() => { inp.style.background = ''; }, 600);
        });
      } catch (_) {}
    });
  }

  // ── Search focus ring ──
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => { searchInput.parentElement.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.12)'; searchInput.parentElement.style.borderRadius = '8px'; });
    searchInput.addEventListener('blur',  () => { searchInput.parentElement.style.boxShadow = 'none'; });
  }

  // ── Record item hover ──
  document.querySelectorAll('.record-item').forEach(item => {
    item.style.transition = 'background 0.12s';
    item.addEventListener('mouseenter', () => { item.style.background = '#f9fafb'; });
    item.addEventListener('mouseleave', () => { item.style.background = ''; });
  });

  // ── Status mini card hover ──
  document.querySelectorAll('.status-mini').forEach(card => {
    card.style.transition = 'transform 0.15s, box-shadow 0.15s';
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 14px rgba(124,58,237,0.1)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
  });

  // ── Sign Out ──
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
      window.location.href = '../../Login.html';
    });
  }
});

// ── Avatar upload ──
function setupAvatarUpload() {
  const avatarEl = document.querySelector('.avatar');
  if (!avatarEl) return;

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
    document.querySelectorAll('.avatar').forEach(el => {
      el.style.backgroundImage = `url(${url})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.color = 'transparent';
      el.style.fontSize = '0';
    });

    try {
      await uploadAvatar(file);
      const toast = document.getElementById('toast');
      if (toast) { toast.textContent = 'Profile picture updated!'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
    } catch (e) {
      alert('Upload failed: ' + e.message);
    }
  });
}
