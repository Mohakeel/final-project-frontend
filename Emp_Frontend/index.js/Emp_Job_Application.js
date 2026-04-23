import { getJobApplications, updateAppStatus, logout, removeToken, removeRole } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Toast ──
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Status badge HTML ──
function statusBadgeHTML(status) {
  const map = {
    'PENDING':  '<span class="badge badge-pending">Pending</span>',
    'ACCEPTED': '<span class="badge badge-accepted">Accepted</span>',
    'REJECTED': '<span class="badge badge-rejected">Rejected</span>',
    'REVIEWED': '<span class="badge badge-reviewed">Reviewed</span>',
  };
  return map[status] || `<span class="badge">${status}</span>`;
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
      window.location.href = '../../Login.html';
    });
  }
});

// ── Tab switching ──
let currentTab = 'all';
let currentStatusFilter = 'All';
let currentPage = 1;
let activeRowIndex = null;
let allApplicants = [];

function getFilteredData() {
  return allApplicants.filter(a => {
    const statusMatch = currentStatusFilter === 'All' || a.status === currentStatusFilter;
    return statusMatch;
  });
}

function renderTable() {
  const data  = getFilteredData();
  const tbody = document.getElementById('tableBody');

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#aaa;">No applicants found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((a, i) => {
    const initials = (a.applicant_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const dateStr  = a.created_at ? new Date(a.created_at).toLocaleDateString() : '—';
    const cover    = a.cover_letter ? `"${a.cover_letter.slice(0, 60)}..."` : '—';
    return `
      <tr onclick="selectRow(${i})">
        <td>
          <div class="applicant-cell">
            <div class="ap-av">${initials}</div>
            <div>
              <div class="ap-name">${a.applicant_name || '—'}</div>
              <div class="ap-email">${a.applicant_email || '—'}</div>
            </div>
          </div>
        </td>
        <td><span class="cover-snippet">${cover}</span></td>
        <td><span class="date-cell">${dateStr}</span></td>
        <td id="status-${a.id}">${statusBadgeHTML(a.status)}</td>
        <td>
          <div class="action-cell">
            <button class="act-btn accept-btn" data-id="${a.id}" title="Accept">✓</button>
            <button class="act-btn reject-btn" data-id="${a.id}" title="Reject">✗</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Bind status update buttons
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await changeStatus(parseInt(btn.dataset.id), 'ACCEPTED');
    });
  });
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await changeStatus(parseInt(btn.dataset.id), 'REJECTED');
    });
  });
}

async function changeStatus(appId, status) {
  try {
    await updateAppStatus(appId, status);
    const app = allApplicants.find(a => a.id === appId);
    if (app) app.status = status;
    const cell = document.getElementById(`status-${appId}`);
    if (cell) cell.innerHTML = statusBadgeHTML(status);
    showToast(`Application ${status.toLowerCase()}.`);
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

window.selectRow = function(index) {
  activeRowIndex = index;
  document.querySelectorAll('#tableBody tr').forEach((r, i) => {
    r.style.background = i === index ? '#f0f4ff' : '';
  });
};

// ── Status Filter ──
let statusDropOpen = false;
window.toggleStatusDrop = function() {
  statusDropOpen = !statusDropOpen;
  document.getElementById('statusDropdown').classList.toggle('open', statusDropOpen);
};
window.filterStatus = function(e, status) {
  e.stopPropagation();
  currentStatusFilter = status;
  document.getElementById('statusLabel').textContent = `Status: ${status}`;
  statusDropOpen = false;
  document.getElementById('statusDropdown').classList.remove('open');
  renderTable();
};
document.addEventListener('click', e => {
  const sel = document.getElementById('statusSelect');
  if (sel && !sel.contains(e.target)) {
    statusDropOpen = false;
    document.getElementById('statusDropdown')?.classList.remove('open');
  }
  const ctx = document.getElementById('contextMenu');
  if (ctx && !ctx.contains(e.target)) ctx.classList.remove('open');
});

// ── Tab switching ──
window.switchTab = function(el, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentTab = tab;
  renderTable();
};

// ── Pagination ──
window.setPage = function(n) {
  currentPage = n;
  [1, 2, 3].forEach(i => {
    const btn = document.getElementById(`pg${i}`);
    if (btn) btn.classList.toggle('active', i === n);
  });
};
window.changePage = function(delta) {
  const next = currentPage + delta;
  if (next >= 1 && next <= 3) window.setPage(next);
};

// ── Context Menu ──
window.openContext = function(e, index) {
  e.stopPropagation();
  activeRowIndex = index;
  const menu = document.getElementById('contextMenu');
  menu.style.top  = `${e.clientY}px`;
  menu.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
  menu.classList.add('open');
};
window.ctxAction = async function(action) {
  const data = getFilteredData();
  if (activeRowIndex === null || !data[activeRowIndex]) return;
  const app = data[activeRowIndex];
  document.getElementById('contextMenu').classList.remove('open');

  if (action === 'accept') await changeStatus(app.id, 'ACCEPTED');
  else if (action === 'reject') await changeStatus(app.id, 'REJECTED');
  else if (action === 'view') showToast(`Viewing ${app.applicant_name}'s profile`);
  else if (action === 'shortlist') showToast(`${app.applicant_name} shortlisted`);
};

// ── Load data ──
document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();
  const jobId = localStorage.getItem('selected_job_id') || new URLSearchParams(window.location.search).get('job_id');
  const tbody = document.getElementById('tableBody');

  if (!jobId) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#aaa;">No job selected. Go to My Jobs and click "View Applications".</td></tr>`;
    return;
  }

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#aaa;">Loading...</td></tr>`;

  try {
    allApplicants = await getJobApplications(parseInt(jobId));
    renderTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#e04040;">Failed to load: ${err.message}</td></tr>`;
  }
});
