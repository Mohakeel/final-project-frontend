import { getAllRequests, processVerification, logout, removeToken, removeRole, getName, setName, getUniProfile } from '../../frontend/api.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Load navbar username ──
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;
  getUniProfile().then(p => {
    if (userNameEl && p.uni_name) { userNameEl.textContent = p.uni_name; setName(p.uni_name); }
  }).catch(() => {});

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let allData = [];
  let filtered = [];

  // ── Toast ──
  function showToast(msg, duration = 2800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
  }

  // ── Filter ──
  function getFiltered() {
    const query  = (document.getElementById('global-search')?.value || '').trim().toLowerCase();
    const year   = document.getElementById('year-filter')?.value || '';
    const status = document.getElementById('status-filter')?.value || '';

    return allData.filter(r => {
      const matchQ = !query ||
        (r.student_name || '').toLowerCase().includes(query) ||
        (r.cert_hash || '').toLowerCase().includes(query) ||
        (r.degree || '').toLowerCase().includes(query);
      const matchY = !year   || String(r.year) === year;
      const matchS = !status || r.status === status;
      return matchQ && matchY && matchS;
    });
  }

  // ── Render ──
  function renderTable() {
    filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:#aaa;font-size:14px;">No records match your filters.</td></tr>`;
    } else {
      items.forEach(r => {
        const initials = (r.student_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="student-cell">
              <div class="stu-avatar">${initials}</div>
              <div>
                <div class="stu-name">${r.student_name || '—'}</div>
                <div class="stu-id">ID: ${r.id}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="deg-name">${r.degree || '—'}</div>
            <div class="deg-year">Class of ${r.year || '—'}</div>
          </td>
          <td>${badgeHTML(r.status)}</td>
          <td>${vdataHTML(r)}</td>
          <td>${actionHTML(r)}</td>`;
        tbody.appendChild(tr);
      });
    }

    const total = filtered.length;
    const end   = Math.min(start + PAGE_SIZE, total);
    const showEl = document.getElementById('showing-text');
    showEl.innerHTML = total === 0
      ? 'No records found'
      : `Showing <strong>${start + 1} – ${end}</strong> of ${total.toLocaleString()} records`;

    renderPagination(totalPages);
    bindActionBtns();
  }

  function badgeHTML(status) {
    const map = { VERIFIED: 'badge-verified', REJECTED: 'badge-rejected', PENDING: 'badge-pending' };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
  }

  function vdataHTML(r) {
    if (r.status === 'VERIFIED') {
      return `<div class="vdata-label blue">CERTIFICATE HASH</div>
              <div class="hash-pill">${r.cert_hash || '—'}</div>`;
    }
    if (r.status === 'REJECTED') {
      return `<div class="vdata-label red">REJECTION REASON</div>
              <div class="rejection-text">Rejected</div>`;
    }
    return `<div class="awaiting-text">Awaiting processing</div>`;
  }

  function actionHTML(r) {
    if (r.status === 'VERIFIED')
      return `<button class="btn-view" data-id="${r.id}" title="View details">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>`;
    if (r.status === 'REJECTED')
      return `<button class="btn-notes" data-id="${r.id}" title="View notes">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </button>`;
    // PENDING — show approve + reject
    return `
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn-approve-sm" data-id="${r.id}" title="Approve" style="background:#dcfce7;color:#16a34a;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600;">✓ Approve</button>
        <button class="btn-reject-sm" data-id="${r.id}" title="Reject" style="background:#fee2e2;color:#dc2626;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600;">✗ Reject</button>
      </div>`;
  }

  // ── Pagination ──
  function renderPagination(totalPages) {
    const pg = document.getElementById('pagination');
    pg.innerHTML = '';

    const prev = mkPgBtn('‹', currentPage === 1);
    prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
    pg.appendChild(prev);

    paginationPages(currentPage, totalPages).forEach(p => {
      if (p === '...') {
        const el = document.createElement('span');
        el.className = 'pg-ellipsis';
        el.textContent = '...';
        pg.appendChild(el);
      } else {
        const btn = mkPgBtn(p, false);
        if (p === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => { currentPage = p; renderTable(); });
        pg.appendChild(btn);
      }
    });

    const next = mkPgBtn('›', currentPage === totalPages);
    next.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderTable(); } });
    pg.appendChild(next);
  }

  function mkPgBtn(label, disabled) {
    const btn = document.createElement('button');
    btn.className = 'pg-btn';
    btn.innerHTML = label;
    btn.disabled  = disabled;
    return btn;
  }

  function paginationPages(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3)   return [1, 2, 3, '...', total];
    if (cur >= total - 2) return [1, '...', total - 2, total - 1, total];
    return [1, '...', cur - 1, cur, cur + 1, '...', total];
  }

  // ── Action buttons ──
  function bindActionBtns() {
    document.querySelectorAll('.btn-view, .btn-notes').forEach(btn => {
      btn.addEventListener('click', () => openDetailModal(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.btn-approve-sm').forEach(btn => {
      btn.addEventListener('click', async () => {
        const r = allData.find(x => x.id === parseInt(btn.dataset.id));
        if (!r || !confirm(`Approve ${r.student_name}'s credential?`)) return;
        try {
          await processVerification(r.id, 'VERIFIED');
          r.status = 'VERIFIED';
          renderTable();
          showToast(`✓ ${r.student_name}'s credential approved.`);
        } catch (err) { showToast('Error: ' + err.message); }
      });
    });
    document.querySelectorAll('.btn-reject-sm').forEach(btn => {
      btn.addEventListener('click', async () => {
        const r = allData.find(x => x.id === parseInt(btn.dataset.id));
        if (!r) return;
        const reason = prompt('Enter rejection reason (optional):') || 'No reason provided';
        if (!confirm(`Reject ${r.student_name}'s credential?`)) return;
        try {
          await processVerification(r.id, 'REJECTED', reason);
          r.status = 'REJECTED';
          renderTable();
          showToast(`✗ ${r.student_name}'s credential rejected.`);
        } catch (err) { showToast('Error: ' + err.message); }
      });
    });
  }

  // ── Detail Modal ──
  function openDetailModal(id) {
    const r = allData.find(x => x.id === id);
    if (!r) return;
    document.getElementById('modal-title').textContent = r.student_name || 'Record Details';
    document.getElementById('modal-body').innerHTML = `
      <div class="modal-row"><span class="modal-row-label">Degree</span><span class="modal-row-value">${r.degree || '—'}</span></div>
      <div class="modal-row"><span class="modal-row-label">Graduation Year</span><span class="modal-row-value">Class of ${r.year || '—'}</span></div>
      <div class="modal-row"><span class="modal-row-label">Status</span><span class="modal-row-value">${r.status}</span></div>
      ${r.cert_hash ? `<div class="modal-row"><span class="modal-row-label">Certificate Hash</span><span class="modal-row-value" style="font-family:monospace;font-size:12px;">${r.cert_hash}</span></div>` : ''}`;
    document.getElementById('modal-overlay').classList.add('show');
  }

  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('show');
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay'))
      document.getElementById('modal-overlay').classList.remove('show');
  });

  // ── Advanced Filter ──
  document.getElementById('filter-btn').addEventListener('click', () => {
    document.getElementById('adv-overlay').classList.add('show');
  });
  document.getElementById('adv-close').addEventListener('click', () => {
    document.getElementById('adv-overlay').classList.remove('show');
  });
  document.getElementById('adv-close-btn').addEventListener('click', () => {
    document.getElementById('adv-overlay').classList.remove('show');
  });
  document.getElementById('adv-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('adv-overlay'))
      document.getElementById('adv-overlay').classList.remove('show');
  });

  // ── Export CSV ──
  document.getElementById('export-btn').addEventListener('click', () => {
    const rows = [['Name', 'Degree', 'Year', 'Status', 'Hash']];
    filtered.forEach(r => rows.push([r.student_name, r.degree, r.year, r.status, r.cert_hash || '']));
    const csv  = rows.map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'all_requests.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully.');
  });

  // ── Search / Filters ──
  ['global-search', 'year-filter', 'status-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { currentPage = 1; renderTable(); });
  });
  document.getElementById('top-search')?.addEventListener('input', e => {
    const gs = document.getElementById('global-search');
    if (gs) gs.value = e.target.value;
    currentPage = 1;
    renderTable();
  });

  // ── Issue Certificate ──
  document.getElementById('issue-btn')?.addEventListener('click', () => {
    showToast('Certificate issuance workflow launched.');
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

  // ── Nav ──
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Sign Out ──
  const signOutEl = document.getElementById('sign-out') || document.getElementById('signOutBtn');
  if (signOutEl) {
    signOutEl.addEventListener('click', async e => {
      e.preventDefault();
      try { await logout(); } catch (_) {}
      removeToken();
      removeRole();
      window.location.href = '../Other_Frontend/Login.html';
    });
  }

  // ── Load data ──
  async function loadHistory() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">Loading...</td></tr>`;
    try {
      allData = await getAllRequests();
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#e04040;">Failed to load: ${err.message}</td></tr>`;
    }
  }

  loadHistory();
});
