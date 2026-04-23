import { getMyApplications, withdrawApplication, logout, getName } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Navbar name ──
const userNameEl = document.querySelector('.user-name');
if (userNameEl) {
  const stored = getName();
  if (stored) userNameEl.textContent = stored;
}

// ── Nav active state ──
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── Sign Out ──
document.addEventListener('DOMContentLoaded', () => {
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
      window.location.href = '../../Login.html';
    });
  }
});

// ── Browse All Listings ──
const browseBtn = document.querySelector('.btn-browse');
if (browseBtn) browseBtn.addEventListener('click', () => { window.location.href = 'App_Job_Listning.html'; });

const newAppBtn = document.getElementById('newAppBtn');
if (newAppBtn) newAppBtn.addEventListener('click', () => { window.location.href = 'App_Job_Listning.html'; });

// ── Withdraw modal ──
let pendingWithdrawId = null;

document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalConfirm = document.getElementById('modalConfirm');
  const modalCancel  = document.getElementById('modalCancel');

  if (modalCancel) {
    modalCancel.addEventListener('click', () => { modalOverlay.classList.remove('active'); pendingWithdrawId = null; });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) { modalOverlay.classList.remove('active'); pendingWithdrawId = null; }
    });
  }
  if (modalConfirm) {
    modalConfirm.addEventListener('click', async () => {
      if (!pendingWithdrawId) return;
      const card = document.querySelector(`.app-card[data-id="${pendingWithdrawId}"]`);
      modalOverlay.classList.remove('active');
      try {
        await withdrawApplication(pendingWithdrawId);
        if (card) {
          card.style.transition = 'all 0.3s ease';
          card.style.maxHeight  = card.offsetHeight + 'px';
          card.style.overflow   = 'hidden';
          requestAnimationFrame(() => {
            card.style.maxHeight    = '0';
            card.style.opacity      = '0';
            card.style.padding      = '0';
            card.style.marginBottom = '0';
            card.style.borderWidth  = '0';
          });
          setTimeout(() => { card.remove(); updateCardBorders(); updateCount(); }, 320);
        }
      } catch (err) {
        const errEl = document.createElement('div');
        errEl.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;';
        errEl.textContent = 'Error: ' + err.message;
        document.body.appendChild(errEl);
        setTimeout(() => errEl.remove(), 3000);
      }
      pendingWithdrawId = null;
    });
  }
});

function updateCardBorders() {
  const remaining = document.querySelectorAll('.app-card');
  remaining.forEach(c => { c.style.borderRadius = ''; });
  if (remaining.length === 0) { document.getElementById('emptyState').style.display = 'flex'; return; }
  remaining[0].style.borderRadius = remaining.length === 1 ? '12px' : '12px 12px 0 0';
  if (remaining.length > 1) remaining[remaining.length - 1].style.borderRadius = '0 0 12px 12px';
}

function updateCount() {
  const remaining = document.querySelectorAll('.app-card').length;
  const allTab = document.querySelector('.filter-tab[data-filter="all"]');
  if (allTab) allTab.textContent = `All (${remaining})`;
}

// ── Render applications from API ──
function renderApplications(applications) {
  const appList = document.getElementById('appList');
  if (!appList) return;

  if (applications.length === 0) {
    appList.innerHTML = '';
    document.getElementById('emptyState').style.display = 'flex';
    return;
  }

  const statusMap = { PENDING: 'pending', REVIEWED: 'review', ACCEPTED: 'accepted', REJECTED: 'rejected' };
  const badgeMap  = { PENDING: 'pending', REVIEWED: 'review', ACCEPTED: 'accepted', REJECTED: 'rejected' };
  const labelMap  = { PENDING: 'Pending Review', REVIEWED: 'In Review', ACCEPTED: 'Accepted', REJECTED: 'Rejected' };

  appList.innerHTML = applications.map(app => {
    const statusKey = statusMap[app.status] || 'pending';
    const dateStr   = app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const initials  = (app.job_title || 'JB').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="app-card" data-status="${statusKey}" data-id="${app.id}">
        <div class="app-logo">
          <div class="logo-placeholder logo-blue"><span>${initials}</span></div>
        </div>
        <div class="app-body">
          <div class="app-top">
            <div class="app-title-wrap">
              <h3 class="app-title">${app.job_title || 'Job Application'}</h3>
            </div>
            <span class="status-badge ${badgeMap[app.status] || 'pending'}">${labelMap[app.status] || app.status}</span>
          </div>
          <p class="app-meta">
            <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            Applied ${dateStr}
          </p>
          <div class="app-quote-row">
            ${app.cover_letter ? `<blockquote class="app-quote">"${app.cover_letter.slice(0, 100)}..."</blockquote>` : '<span class="app-quote" style="color:#aaa;">No cover letter</span>'}
            ${app.status === 'PENDING' || app.status === 'REVIEWED'
              ? `<button class="withdraw-btn" data-id="${app.id}">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Withdraw
                </button>`
              : `<span class="archived-note">Archived</span>`}
          </div>
        </div>
      </div>`;
  }).join('');

  // Bind withdraw buttons
  document.querySelectorAll('.withdraw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingWithdrawId = parseInt(btn.dataset.id);
      const modalOverlay = document.getElementById('modalOverlay');
      if (modalOverlay) modalOverlay.classList.add('active');
    });
  });

  // Update count
  const allTab = document.querySelector('.filter-tab[data-filter="all"]');
  if (allTab) allTab.textContent = `All (${applications.length})`;
}

// ── Filter tabs ──
function bindFilterTabs() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const statusMap  = { all: null, pending: ['pending', 'review'], archived: ['rejected'] };

  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filter  = this.getAttribute('data-filter');
      const allowed = statusMap[filter];
      let visibleCount = 0;
      document.querySelectorAll('.app-card').forEach(card => {
        const status = card.getAttribute('data-status');
        const show   = !allowed || allowed.includes(status);
        card.classList.toggle('hidden', !show);
        if (show) visibleCount++;
      });
      document.getElementById('emptyState').style.display = visibleCount === 0 ? 'flex' : 'none';
    });
  });
}

// ── Search filter ──
function bindSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    let visibleCount = 0;
    document.querySelectorAll('.app-card').forEach(card => {
      const title = card.querySelector('.app-title')?.textContent.toLowerCase() || '';
      const meta  = card.querySelector('.app-meta')?.textContent.toLowerCase() || '';
      const show  = !query || title.includes(query) || meta.includes(query);
      card.classList.toggle('hidden', !show);
      if (show) visibleCount++;
    });
    document.getElementById('emptyState').style.display = visibleCount === 0 ? 'flex' : 'none';
  });
}

// ── Load ──
document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();
  try {
    const applications = await getMyApplications();
    renderApplications(applications);
  } catch (err) {
    // Fall back to static HTML content
    console.warn('Applications load error:', err.message);
    // Still bind withdraw buttons on static cards
    document.querySelectorAll('.withdraw-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingWithdrawId = btn.getAttribute('data-id');
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) modalOverlay.classList.add('active');
      });
    });
  }
  bindFilterTabs();
  bindSearch();
});
