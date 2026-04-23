import { getUniProfile, updateUniProfile, logout, removeToken, removeRole, getName, setName, uploadAvatar } from '../../frontend/api.js';
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

  // ── Toast helper ──
  function showToast(msg, duration = 2800) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  // ── Animate trust bar on load ──
  const trustFill = document.getElementById('trust-fill');
  if (trustFill) setTimeout(() => (trustFill.style.width = '99.9%'), 400);

  const uniNameInput    = document.getElementById('uni-name');
  const adminEmailInput = document.getElementById('admin-email');

  // ── Load profile ──
  try {
    const profile = await getUniProfile();
    if (uniNameInput    && profile.uni_name)  uniNameInput.value    = profile.uni_name;
    if (adminEmailInput && profile.uni_email) adminEmailInput.value = profile.uni_email;

    // Populate topbar — also persist updated name
    if (userNameEl && profile.uni_name) {
      userNameEl.textContent = profile.uni_name;
      setName(profile.uni_name);
    }

    // University code field (read-only display)
    const codeEl = document.querySelector('.field-code');
    if (codeEl && profile.uni_code) codeEl.textContent = profile.uni_code;
  } catch (err) {
    showToast('Failed to load profile: ' + err.message);
  }

  // ── Update Profile ──
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      const name  = uniNameInput  ? uniNameInput.value.trim()  : '';
      const email = adminEmailInput ? adminEmailInput.value.trim() : '';

      if (!name) { showToast('University name cannot be empty.'); uniNameInput?.focus(); return; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { showToast('Please enter a valid email address.'); adminEmailInput?.focus(); return; }

      updateBtn.textContent = 'Saving...';
      updateBtn.disabled    = true;

      try {
        await updateUniProfile({ uni_name: name, uni_email: email });
        showToast('Profile updated successfully.');
        updateBtn.innerHTML = '&#10003; Saved!';
        updateBtn.style.background = '#28a86a';
        setTimeout(() => {
          updateBtn.innerHTML = '&#128190; Update Profile';
          updateBtn.style.background = '';
          updateBtn.disabled = false;
        }, 2500);
      } catch (err) {
        showToast('Error: ' + err.message);
        updateBtn.innerHTML = '&#128190; Update Profile';
        updateBtn.disabled  = false;
      }
    });
  }

  // ── Reset Changes ──
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      try {
        const profile = await getUniProfile();
        if (uniNameInput    && profile.uni_name)  uniNameInput.value    = profile.uni_name;
        if (adminEmailInput && profile.uni_email) adminEmailInput.value = profile.uni_email;
        showToast('Changes reset to original values.');
      } catch (_) {
        showToast('Could not reset — please reload the page.');
      }
    });
  }

  // ── Change Seal ──
  const changeSealBtn = document.querySelector('.btn-change-seal');
  if (changeSealBtn) {
    changeSealBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = 'image/png, image/svg+xml, image/jpeg';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const sealRing = document.querySelector('.seal-ring');
          if (sealRing) {
            sealRing.innerHTML = `<img src="${ev.target.result}" style="width:82px;height:82px;border-radius:50%;object-fit:cover;" alt="Seal" />`;
          }
          showToast('Institutional seal updated.');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  // ── Add Department ──
  const addDeptBtn = document.getElementById('add-dept-btn');
  if (addDeptBtn) {
    addDeptBtn.addEventListener('click', () => {
      const name = prompt('Enter new department name:');
      if (!name || !name.trim()) return;
      const grid   = document.querySelector('.dept-grid');
      const colors = ['blue', 'purple'];
      const color  = colors[Math.floor(Math.random() * colors.length)];
      const card   = document.createElement('div');
      card.className = 'dept-card';
      card.innerHTML = `
        <div class="dept-accent ${color}"></div>
        <div class="dept-info">
          <div class="dept-name">${name.trim()}</div>
          <div class="dept-count">00 Active Registrars</div>
        </div>`;
      grid.insertBefore(card, addDeptBtn);
      showToast(`"${name.trim()}" department added.`);
    });
  }

  // ── Nav highlighting ──
  document.querySelectorAll('.nav-item, .tnav-link').forEach(item => {
    item.addEventListener('click', () => {
      const group = item.classList.contains('tnav-link')
        ? document.querySelectorAll('.tnav-link')
        : document.querySelectorAll('.nav-item');
      group.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Bell ──
  const bellBtn = document.getElementById('bell-btn') || document.getElementById('notifBtn');
  if (bellBtn) {
    bellBtn.style.position = 'relative';
    const dot = document.createElement('span');
    dot.style.cssText = 'position:absolute;top:2px;right:2px;width:7px;height:7px;background:#e04040;border-radius:50%;display:block;';
    bellBtn.appendChild(dot);
    bellBtn.addEventListener('click', () => {
      dot.style.display = dot.style.display === 'none' ? 'block' : 'none';
      showToast('Notifications marked as read.');
    });
  }

  // ── Contact Support ──
  const supportLink = document.getElementById('support-link');
  if (supportLink) {
    supportLink.addEventListener('click', e => { e.preventDefault(); showToast('Connecting to registrar support...'); });
  }

  // ── Sign Out ──
  const signOutEl = document.querySelector('.sign-out') || document.getElementById('signOutBtn');
  if (signOutEl) {
    signOutEl.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
      window.location.href = '../../Login.html';
    });
  }

  // ── Avatar upload ──
  function setupAvatarUpload() {
    const avatarEl = document.getElementById('navAvatar') || document.querySelector('.avatar');
    if (!avatarEl) return;

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
      document.querySelectorAll('.avatar').forEach(el => {
        el.style.backgroundImage = `url(${url})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.color = 'transparent';
        el.style.fontSize = '0';
      });

      try {
        await uploadAvatar(file);
        showToast('Profile picture updated!');
      } catch (e) {
        showToast('Upload failed: ' + e.message);
      }
    });
  }

});
