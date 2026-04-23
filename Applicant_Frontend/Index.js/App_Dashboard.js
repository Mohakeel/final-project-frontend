import { getApplicantProfile, getMyApplications, getJobs, logout, removeToken, removeRole, getName, setName } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();

  // ── Animate progress bar on load ──
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = '0%';
    requestAnimationFrame(() => setTimeout(() => { progressBar.style.width = '85%'; }, 200));
  }

  // ── Active nav item switching ──
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Search input focus effect ──
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      searchInput.parentElement.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
      searchInput.parentElement.style.borderRadius = '8px';
    });
    searchInput.addEventListener('blur', () => { searchInput.parentElement.style.boxShadow = 'none'; });
  }

  // ── New Application button ──
  const newAppBtn = document.querySelector('.new-app-btn');
  if (newAppBtn) {
    newAppBtn.addEventListener('click', () => { window.location.href = 'App_Job_Listning.html'; });
  }

  // ── Manage Document button ──
  const manageBtn = document.querySelector('.manage-btn');
  if (manageBtn) {
    const originalHTML = manageBtn.innerHTML;
    manageBtn.addEventListener('click', () => {
      manageBtn.textContent = 'Opening...';
      setTimeout(() => { manageBtn.innerHTML = originalHTML; }, 1500);
    });
  }

  // ── Stat card counter animation ──
  function animateCount(el, target, duration = 1000) {
    let start = 0;
    const step = target / (duration / 16);
    const update = () => {
      start = Math.min(start + step, target);
      el.textContent = String(Math.round(start)).padStart(2, '0');
      if (start < target) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // ── Feature item hover lift ──
  document.querySelectorAll('.feature-item').forEach(item => {
    item.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
    item.addEventListener('mouseenter', () => { item.style.transform = 'translateY(-2px)'; item.style.boxShadow = '0 4px 16px rgba(30, 64, 175, 0.08)'; });
    item.addEventListener('mouseleave', () => { item.style.transform = 'translateY(0)'; item.style.boxShadow = 'none'; });
  });

  // ── Table row hover ──
  document.querySelectorAll('.apps-table tbody tr').forEach(row => {
    row.style.transition = 'background 0.12s ease';
    row.addEventListener('mouseenter', () => { row.style.background = '#f9fafb'; });
    row.addEventListener('mouseleave', () => { row.style.background = ''; });
  });

  // ── Bell ──
  const bellBtn = document.querySelector('.icon-btn');
  if (bellBtn) {
    let hasAlert = true;
    bellBtn.addEventListener('click', () => { hasAlert = !hasAlert; bellBtn.style.color = hasAlert ? '#1e40af' : '#6b7280'; });
  }

  // ── Sign Out ──
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
      window.location.href = '../../Login.html';
    });
  }

  // ── Show stored name instantly, then load from API ──
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;

  // ── Load API data ──
  try {
    const [profile, applications, jobs] = await Promise.all([
      getApplicantProfile(),
      getMyApplications(),
      getJobs(),
    ]);

    // Update name from API and persist it
    if (userNameEl && profile.full_name) {
      userNameEl.textContent = profile.full_name;
      setName(profile.full_name);
    }

    // Stat cards
    const statNums = document.querySelectorAll('.stat-num');
    if (statNums[0]) animateCount(statNums[0], jobs.length, 900);
    if (statNums[1]) animateCount(statNums[1], applications.filter(a => a.status === 'PENDING').length, 900);

    // Welcome text
    const welcomeH1 = document.querySelector('.welcome-text h1');
    if (welcomeH1 && profile.full_name) {
      const firstName = profile.full_name.split(' ')[0];
      welcomeH1.innerHTML = `Welcome back,<br/>${firstName}.`;
    }
  } catch (err) {
    // Non-critical — page still works with static content
    console.warn('Dashboard load error:', err.message);
  }

});
