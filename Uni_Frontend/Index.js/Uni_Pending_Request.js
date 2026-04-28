import { getPendingRequests, processVerification, logout, removeToken, removeRole, getName, setName, getUniProfile } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

document.addEventListener('DOMContentLoaded', () => {
  initNotificationBell();
  initAvatar();

  // ── Load navbar username ──
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;
  getUniProfile().then(p => {
    if (userNameEl && p.uni_name) { userNameEl.textContent = p.uni_name; setName(p.uni_name); }
  }).catch(() => {});

  const PAGE_SIZE = 3;
  let currentPage = 1;
  let activeFilter = 'all';
  let requests = [];
  let pendingAction = null;

  // ── Toast ──
  function showToast(msg, duration = 2800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
  }

  // ── Stats ──
  function updateStats() {
    const queueEl   = document.getElementById('stat-queue');
    const flaggedEl = document.getElementById('stat-flagged');
    if (queueEl)   queueEl.textContent   = requests.length;
    if (flaggedEl) flaggedEl.textContent = 0; // no priority flag from API
  }

  // ── Render Table ──
  function getFilteredRequests() {
    const query = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    let filtered = [...requests];
    if (query) {
      filtered = filtered.filter(r =>
        (r.student_name || '').toLowerCase().includes(query) ||
        (r.degree || '').toLowerCase().includes(query) ||
        String(r.year || '').includes(query)
      );
    }
    return filtered;
  }

  function renderTable() {
    const filtered   = getFilteredRequests();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start     = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);
    const tbody     = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">No pending requests.</td></tr>`;
    } else {
      pageItems.forEach(req => {
        const tr = document.createElement('tr');
        const initials = (req.student_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const dateStr  = req.created_at ? new Date(req.created_at).toLocaleDateString() : '—';
        tr.innerHTML = `
          <td>
            <div class="student-cell">
              <div class="stu-avatar">${initials}</div>
              <div>
                <div class="stu-name">${req.student_name || '—'}</div>
                <div class="stu-id">ID: ${req.id}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="deg-name">${req.degree || '—'}</div>
            <div class="deg-faculty"></div>
          </td>
          <td>${req.year || '—'}</td>
          <td>${dateStr}</td>
          <td>
            <div class="action-cell">
              <button class="btn-reject" data-id="${req.id}">Reject</button>
              <button class="btn-approve" data-id="${req.id}">Approve</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    }

    const total = filtered.length;
    const end   = Math.min(start + PAGE_SIZE, total);
    document.getElementById('showing-text').textContent =
      total === 0 ? 'No requests found' : `Showing ${start + 1} to ${end} of ${total} requests`;
    document.getElementById('page-info').textContent = `${currentPage} / ${totalPages}`;
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages;

    document.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', () => openModal('approve', parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', () => openModal('reject', parseInt(btn.dataset.id)));
    });
  }

  // ── Modal ──
  function openModal(type, reqId) {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    pendingAction = { type, reqId };

    document.getElementById('modal-icon').textContent  = type === 'approve' ? '✅' : '❌';
    document.getElementById('modal-title').textContent =
      type === 'approve' ? `Approve ${req.student_name}?` : `Reject ${req.student_name}?`;
    document.getElementById('modal-desc').textContent  =
      type === 'approve'
        ? `This will approve the ${req.degree} credential and issue a verified certificate.`
        : `This will reject the ${req.degree} credential. The employer will be notified.`;

    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.textContent = type === 'approve' ? 'Approve' : 'Reject';
    confirmBtn.style.background = type === 'approve' ? '#3b35c3' : '#d64040';

    document.getElementById('modal-overlay').classList.add('show');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
    pendingAction = null;
  }

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.getElementById('modal-confirm').addEventListener('click', async () => {
    if (!pendingAction) return;
    const { type, reqId } = pendingAction;
    const req = requests.find(r => r.id === reqId);
    closeModal();

    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.disabled = true;

    try {
      const status = type === 'approve' ? 'VERIFIED' : 'REJECTED';
      let reason;
      if (type === 'reject') {
        reason = prompt('Enter rejection reason (optional):') || 'No reason provided';
      }
      await processVerification(reqId, status, reason);
      requests = requests.filter(r => r.id !== reqId);

      if (type === 'approve') {
        const approvalsEl = document.getElementById('stat-approvals');
        if (approvalsEl) approvalsEl.textContent = parseInt(approvalsEl.textContent || '0') + 1;
        showToast(`✓ ${req.student_name}'s credential approved.`);
      } else {
        showToast(`✗ ${req.student_name}'s credential rejected.`);
      }

      updateStats();
      renderTable();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      confirmBtn.disabled = false;
    }
  });

  // ── Pagination ──
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    const total = Math.ceil(getFilteredRequests().length / PAGE_SIZE);
    if (currentPage < total) { currentPage++; renderTable(); }
  });

  // ── Filter Tabs ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      currentPage = 1;
      renderTable();
    });
  });

  // ── Search ──
  document.getElementById('search-input').addEventListener('input', () => {
    currentPage = 1;
    renderTable();
  });

  // ── Bell ──
  const bellBtn = document.getElementById('bell-btn');
  if (bellBtn) {
    const dot = document.createElement('span');
    dot.style.cssText = 'position:absolute;top:2px;right:2px;width:7px;height:7px;background:#e04040;border-radius:50%;display:block;';
    bellBtn.appendChild(dot);
    bellBtn.addEventListener('click', () => {
      dot.style.display = dot.style.display === 'none' ? 'block' : 'none';
      showToast('Notifications cleared.');
    });
  }

  // ── Sign Out ──
  const signOutEl = document.getElementById('sign-out') || document.getElementById('signOutBtn');
  if (signOutEl) {
    signOutEl.addEventListener('click', async e => {
      e.preventDefault();
      try { await logout(); } catch (_) {}
      removeToken();
      removeRole();
      window.location.href = (window.location.pathname.includes('/CertiVerify/') ? '/CertiVerify' : '') + '/Login.html';
    });
  }

  // ── Nav highlight ──
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Load data ──
  async function loadRequests() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">Loading...</td></tr>`;
    try {
      requests = await getPendingRequests();
      updateStats();
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#e04040;">Failed to load: ${err.message}</td></tr>`;
    }
  }

  loadRequests();
});
