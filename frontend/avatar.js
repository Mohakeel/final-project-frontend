/**
 * Shared avatar loader — call initAvatar() on DOMContentLoaded on every page.
 * On profile pages, also call initAvatarUpload() to enable click-to-upload.
 */
import { getMe, uploadAvatar, API_BASE, getName } from './api.js';

let currentUserId = null;

export async function initAvatar() {
  try {
    const me = await getMe();
    currentUserId = me.id;

    if (me.has_avatar) {
      setAvatarImage(`${API_BASE}/auth/avatar/${me.id}?t=${Date.now()}`);
    } else {
      // Show first letter of name as fallback
      const userName = getName() || 'User';
      setAvatarInitials(userName);
    }
  } catch (_) {
    // If API fails, try to show initials from stored name
    const userName = getName() || 'User';
    setAvatarInitials(userName);
  }
}

function setAvatarImage(url) {
  // Replace all .avatar elements with an img
  document.querySelectorAll('.avatar').forEach(el => {
    el.style.backgroundImage = `url(${url})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.color = 'transparent'; // hide initials text
    el.style.fontSize = '0';
    el.textContent = ''; // Clear any text content
  });
}

function setAvatarInitials(name) {
  // Get first letter of name
  const initial = name.trim().charAt(0).toUpperCase();
  
  // Generate a consistent color based on the name
  const colors = [
    { bg: '#e0f2fe', text: '#0369a1' }, // blue
    { bg: '#fce7f3', text: '#be185d' }, // pink
    { bg: '#ddd6fe', text: '#6d28d9' }, // purple
    { bg: '#fef3c7', text: '#d97706' }, // amber
    { bg: '#d1fae5', text: '#059669' }, // green
    { bg: '#ffe4e6', text: '#e11d48' }, // rose
    { bg: '#e0e7ff', text: '#4f46e5' }, // indigo
    { bg: '#fed7aa', text: '#c2410c' }, // orange
  ];
  
  // Use first character code to pick a color
  const colorIndex = name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  document.querySelectorAll('.avatar').forEach(el => {
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = color.bg;
    el.style.color = color.text;
    el.style.fontSize = '18px';
    el.style.fontWeight = '600';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.textContent = initial;
  });
}

/**
 * Call this on the profile page to make the avatar clickable for upload.
 * Wraps the .avatar element with an upload trigger.
 */
export function initAvatarUpload(onSuccess) {
  const avatarEl = document.querySelector('.avatar, .profile-avatar, .avatar-large');
  if (!avatarEl) return;

  // If avatar is inside an <a> tag, prevent navigation on click
  const parentLink = avatarEl.closest('a');
  if (parentLink) {
    parentLink.addEventListener('click', e => e.preventDefault());
  }

  // Style as clickable
  avatarEl.style.cursor = 'pointer';
  avatarEl.title = 'Click to change profile picture';

  // Add camera overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:absolute;bottom:0;left:0;right:0;
    background:rgba(0,0,0,0.45);
    color:#fff;font-size:11px;font-weight:600;
    text-align:center;padding:4px 0;
    border-radius:0 0 50% 50%;
    pointer-events:none;
  `;
  overlay.textContent = '📷';
  avatarEl.style.position = 'relative';
  avatarEl.style.overflow = 'hidden';
  avatarEl.appendChild(overlay);

  // Hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';
  input.style.display = 'none';
  document.body.appendChild(input);

  avatarEl.addEventListener('click', e => {
    e.stopPropagation();
    input.click();
  });

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    // Preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarImage(objectUrl);

    try {
      await uploadAvatar(file);
      // Refresh avatar to show uploaded image
      await initAvatar();
      if (onSuccess) onSuccess();
    } catch (e) {
      alert('Failed to upload: ' + e.message);
      // Revert to initials on error
      const userName = getName() || 'User';
      setAvatarInitials(userName);
    }
  });
}

// Export setAvatarInitials for use in other modules
export { setAvatarInitials };
