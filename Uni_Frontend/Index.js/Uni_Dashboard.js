import { getUniProfile, getPendingRequests, getAllRequests, logout, removeToken, removeRole, getName, setName } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Toast ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Relative time ──
function relativeTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

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

// ── Action cards navigation ──
document.querySelectorAll('.action-card[data-href]').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => { window.location.href = card.getAttribute('data-href'); });
  card.addEventListener('mousedown', () => (card.style.transform = 'scale(0.97)'));
  card.addEventListener('mouseup',   () => (card.style.transform = ''));
  card.addEventListener('mouseleave',() => (card.style.transform = ''));
});

// ── Issue New Certificate button ──
const issueBtn = document.querySelector('.btn-issue');
if (issueBtn) {
  issueBtn.addEventListener('click', () => { window.location.href = 'Uni_Certificate_Management.html'; });
}

// ── Progress bars ──
document.querySelectorAll('.progress-fill').forEach(fill => {
  const target = fill.classList.contains('full') ? '100%' : '82%';
  fill.style.width = '0%';
  fill.style.transition = 'width 1.2s cubic-bezier(.4,0,.2,1)';
  setTimeout(() => (fill.style.width = target), 300);
});

// ── Notification bell ──
const bell = document.querySelector('#notifBtn');
if (bell) {
  bell.style.position = 'relative';
  const dot = document.createElement('span');
  dot.style.cssText = 'position:absolute;top:4px;right:4px;width:8px;height:8px;background:#e04040;border-radius:50%;display:block;pointer-events:none;';
  bell.appendChild(dot);
}

// ── Load API data ──
async function loadDashboard() {
  // Instantly show stored name before API responds
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;

  // Stat card loading placeholders
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(el => { el.textContent = '…'; });

  try {
    const [profile, pending, all] = await Promise.all([
      getUniProfile(),
      getPendingRequests(),
      getAllRequests(),
    ]);

    // Update name from API and persist it
    if (userNameEl && profile.uni_name) {
      userNameEl.textContent = profile.uni_name;
      setName(profile.uni_name);
    }
    const userRoleEl = document.querySelector('.user-role');
    if (userRoleEl) userRoleEl.textContent = 'Academic Registrar';

    // Stat cards: pending, verified, rejected
    const verified = all.filter(r => r.status === 'VERIFIED').length;
    const rejected = all.filter(r => r.status === 'REJECTED').length;

    if (statNumbers[0]) statNumbers[0].textContent = pending.length.toLocaleString();
    if (statNumbers[1]) statNumbers[1].textContent = verified.toLocaleString();
    if (statNumbers[2]) statNumbers[2].textContent = rejected.toLocaleString();

    // Recent activity — last 3 records from all requests
    const recent = [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
    const activityPanel = document.querySelector('.activity-panel');
    if (activityPanel && recent.length > 0) {
      // Remove existing static items
      activityPanel.querySelectorAll('.activity-item').forEach(el => el.remove());

      recent.forEach(r => {
        const statusClass = r.status === 'VERIFIED' ? 'badge-green' : r.status === 'REJECTED' ? 'badge-red' : 'badge-amber';
        const initials = (r.student_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
          <div class="activity-avatar">${initials}</div>
          <div class="activity-info">
            <div class="activity-name">${r.student_name || 'Unknown'}</div>
            <div class="activity-degree">${r.degree || ''}</div>
          </div>
          <div class="activity-status">
            <span class="badge ${statusClass}">${r.status}</span>
            <div class="activity-time">${relativeTime(r.created_at)}</div>
          </div>`;
        activityPanel.appendChild(item);
      });
    }
  } catch (err) {
    showToast('Failed to load dashboard data: ' + err.message);
    statNumbers.forEach(el => { el.textContent = '—'; });
  }
}

// ── Bulk CSV / XLS Upload (preserved from original) ──
document.addEventListener('DOMContentLoaded', () => {
  initNotificationBell();
  initAvatar();
  loadDashboard();

  const dropZone       = document.getElementById('uploadDropZone');
  const fileInput      = document.getElementById('uploadFileInput');
  const browseBtn      = document.getElementById('browseUploadBtn');
  const fileInfo       = document.getElementById('uploadFileInfo');
  const previewSection = document.getElementById('uploadPreview');
  const previewCount   = document.getElementById('previewCount');
  const previewHead    = document.getElementById('previewHead');
  const previewBody    = document.getElementById('previewBody');
  const clearBtn       = document.getElementById('clearUploadBtn');
  const importBtn      = document.getElementById('importBtn');
  const templateBtn    = document.getElementById('downloadTemplateBtn');
  const importModal      = document.getElementById('importModal');
  const importModalIcon  = document.getElementById('importModalIcon');
  const importModalTitle = document.getElementById('importModalTitle');
  const importModalDesc  = document.getElementById('importModalDesc');
  const importModalOk    = document.getElementById('importModalOk');

  function showModal(icon, title, desc) {
    importModalIcon.textContent  = icon;
    importModalTitle.textContent = title;
    importModalDesc.textContent  = desc;
    importModal.classList.add('show');
  }
  importModalOk.addEventListener('click', () => importModal.classList.remove('show'));

  templateBtn.addEventListener('click', () => {
    const headers = 'Student Name,Student ID,Degree Program,Graduation Year,Certificate Hash\n';
    const sample  = 'Jane Smith,STU-001,B.Sc. Computer Science,2024,\nJohn Doe,STU-002,M.A. Economics,2024,\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'certificate_upload_template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Template downloaded');
  });

  browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  clearBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInfo.textContent = '';
    previewSection.style.display = 'none';
    previewHead.innerHTML = '';
    previewBody.innerHTML = '';
  });

  importBtn.addEventListener('click', () => {
    const rowCount = previewBody.querySelectorAll('tr').length;
    if (!rowCount) return;
    showModal('✅', 'Import Successful', `${rowCount} certificate record${rowCount > 1 ? 's' : ''} have been queued for blockchain verification.`);
  });

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      showModal('⚠️', 'Unsupported File', 'Please upload a .csv, .xls, or .xlsx file.');
      return;
    }
    fileInfo.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = e => parseCSV(e.target.result);
      reader.readAsText(file);
    } else {
      renderPlaceholderPreview(file.name);
    }
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) { showModal('⚠️', 'Empty File', 'The CSV file has no data rows.'); return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows    = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
    renderPreview(headers, rows);
  }

  function renderPreview(headers, rows) {
    previewHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    const display = rows.slice(0, 10);
    previewBody.innerHTML = display.map(row =>
      '<tr>' + headers.map((_, i) => `<td>${row[i] ?? ''}</td>`).join('') + '</tr>'
    ).join('');
    const total = rows.length;
    previewCount.textContent = `${total} record${total !== 1 ? 's' : ''} found${total > 10 ? ' (showing first 10)' : ''}`;
    previewSection.style.display = 'block';
  }

  function renderPlaceholderPreview(filename) {
    const headers = ['Student Name', 'Student ID', 'Degree Program', 'Graduation Year', 'Certificate Hash'];
    previewHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    previewBody.innerHTML = `<tr><td colspan="${headers.length}" style="text-align:center;color:#888;padding:1.5rem;">Excel preview not available — file <strong>${filename}</strong> is ready to import.</td></tr>`;
    previewCount.textContent = 'Excel file loaded';
    previewSection.style.display = 'block';
  }
});
