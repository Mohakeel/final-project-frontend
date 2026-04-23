import { getCertificates, createCertificate, bulkUploadCertificates, deleteCertificate, logout, removeToken, removeRole, getName, setName, getUniProfile } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ─── DATA ───────────────────────────────────────────────────────────
let allCerts = [];
const PAGE_SIZE = 10;
let currentPage = 1;
let filteredCerts = [];

// ─── TOAST ───────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Load Certificates ──
async function loadCertificates() {
  try {
    const certs = await getCertificates();
    allCerts = certs.map(c => ({
      id: c.id,
      initials: (c.student_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      color: getRandomColor().bg,
      textColor: getRandomColor().text,
      name: c.student_name,
      certId: c.certificate_id || '—',
      hash: c.cert_hash.slice(0, 6) + '...' + c.cert_hash.slice(-4),
      fullHash: c.cert_hash,
      degree: c.degree,
      classOf: `Class of ${c.graduation_year}`,
      status: c.status.toLowerCase()
    }));
    filteredCerts = [...allCerts];
    renderTable();
  } catch (err) {
    showToast('Failed to load certificates: ' + err.message);
  }
}

function getRandomColor() {
  const colors = [
    { bg: '#dbeafe', text: '#1e40af' }, { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#d1fae5', text: '#065f46' }, { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' }, { bg: '#e0f2fe', text: '#0369a1' },
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ─── RENDER TABLE ────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filteredCerts.slice(start, start + PAGE_SIZE);

  if (slice.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#aaa;">No certificates found.</td></tr>';
  } else {
    tbody.innerHTML = slice.map(c => `
      <tr>
        <td>
          <div class="student-cell">
            <div class="stu-avatar" style="background:${c.color};color:${c.textColor}">${c.initials}</div>
            <div>
              <div class="stu-name">${c.name}</div>
              <div class="stu-hash">CERT ID: ${c.certId}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="deg-name">${c.degree}</div>
          <div class="deg-class">${c.classOf}</div>
        </td>
        <td><span class="badge ${c.status}">${c.status === 'verified' ? 'Verified' : 'Pending'}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn view-btn" title="View SHA-256 Hash" data-hash="${c.fullHash}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="action-btn del" title="Delete" data-id="${c.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.action-btn.del').forEach(btn => {
      btn.addEventListener('click', () => deleteCertHandler(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.action-btn.view-btn').forEach(btn => {
      btn.addEventListener('click', () => showToast('SHA-256: ' + btn.dataset.hash));
    });
  }

  const showingLabel = document.getElementById('showingLabel');
  if (showingLabel) {
    showingLabel.textContent = `Showing ${Math.min(slice.length, PAGE_SIZE)} of ${filteredCerts.length.toLocaleString()} certificates`;
  }
  updatePagination();
}

// ─── PAGINATION ──────────────────────────────────────────────────────
function updatePagination() {
  const totalPages = Math.max(1, Math.ceil(filteredCerts.length / PAGE_SIZE));
  document.querySelectorAll('.pg-btn[data-page]').forEach(btn => {
    const p = parseInt(btn.dataset.page);
    btn.classList.toggle('active', p === currentPage);
    btn.style.display = p <= totalPages ? '' : 'none';
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────
async function deleteCertHandler(id) {
  const cert = allCerts.find(c => c.id === id);
  if (!cert) return;
  if (!confirm(`Delete certificate for ${cert.name}?`)) return;
  try {
    await deleteCertificate(id);
    allCerts = allCerts.filter(c => c.id !== id);
    filteredCerts = filteredCerts.filter(c => c.id !== id);
    const total = Math.ceil(filteredCerts.length / PAGE_SIZE);
    if (currentPage > total) currentPage = Math.max(1, total);
    renderTable();
    showToast('Certificate removed');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

// ─── MAIN INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();

  // Load username
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;
  try {
    const profile = await getUniProfile();
    if (userNameEl && profile.uni_name) { userNameEl.textContent = profile.uni_name; setName(profile.uni_name); }
  } catch (err) { console.error('Failed to load profile:', err); }

  // Load certificates
  await loadCertificates();

  // ── Pagination ──
  document.querySelectorAll('.pg-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderTable(); });
  });
  document.getElementById('prevBtn')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
  });
  document.getElementById('nextBtn')?.addEventListener('click', () => {
    const total = Math.ceil(filteredCerts.length / PAGE_SIZE);
    if (currentPage < total) { currentPage++; renderTable(); }
  });

  // ── Search ──
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    filteredCerts = allCerts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.hash.toLowerCase().includes(q) ||
      c.degree.toLowerCase().includes(q)
    );
    currentPage = 1;
    renderTable();
  });

  // ── Mint form ──
  document.getElementById('mintBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('studentName').value.trim();
    const deg  = document.getElementById('degreeProgram').value.trim();
    const year = document.getElementById('gradYear').value.trim();
    if (!name || !deg || !year) { showToast('⚠️ Please fill all fields'); return; }
    const mintBtn = document.getElementById('mintBtn');
    mintBtn.textContent = 'Minting...';
    mintBtn.disabled = true;
    try {
      await createCertificate({
        student_name: name,
        degree: deg,
        graduation_year: parseInt(year),
        certificate_id: document.getElementById('certId')?.value?.trim() || undefined
      });
      showToast(`✅ Certificate minted for ${name}`);
      document.getElementById('studentName').value = '';
      document.getElementById('degreeProgram').value = '';
      document.getElementById('gradYear').value = '';
      if (document.getElementById('certId')) document.getElementById('certId').value = '';
      await loadCertificates();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      mintBtn.textContent = 'Mint & Verify Certificate';
      mintBtn.disabled = false;
    }
  });

  // ── FAB ──
  document.getElementById('fabBtn')?.addEventListener('click', () => {
    document.getElementById('studentName')?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Export CSV ──
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const rows = [['Name', 'Hash', 'Degree', 'Class', 'Status'],
      ...filteredCerts.map(c => [c.name, c.fullHash, c.degree, c.classOf, c.status])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'certificates.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('📥 CSV exported');
  });

  // ── Sign out ──
  document.getElementById('signOutBtn')?.addEventListener('click', async e => {
    e.preventDefault();
    try { await logout(); } catch (_) {}
    removeToken();
    removeRole();
    window.location.href = '../../Login.html';
  });

  // ── BULK UPLOAD ──
  const bulkDropZone    = document.getElementById('bulkDropZone');
  const bulkFileInput   = document.getElementById('bulkFileInput');
  const browseBulkBtn   = document.getElementById('browseBulkBtn');
  const bulkFileInfo    = document.getElementById('bulkFileInfo');
  const bulkPreview     = document.getElementById('bulkPreview');
  const bulkPreviewCount= document.getElementById('bulkPreviewCount');
  const bulkPreviewHead = document.getElementById('bulkPreviewHead');
  const bulkPreviewBody = document.getElementById('bulkPreviewBody');
  const bulkClearBtn    = document.getElementById('bulkClearBtn');
  const bulkImportBtn   = document.getElementById('bulkImportBtn');
  const templateBtn     = document.getElementById('downloadTemplateBtn');
  const bulkModal       = document.getElementById('bulkModal');
  const bulkModalIcon   = document.getElementById('bulkModalIcon');
  const bulkModalTitle  = document.getElementById('bulkModalTitle');
  const bulkModalDesc   = document.getElementById('bulkModalDesc');
  const bulkModalOk     = document.getElementById('bulkModalOk');

  let currentBulkFile = null;

  function showBulkModal(icon, title, desc) {
    if (!bulkModal) return;
    bulkModalIcon.textContent  = icon;
    bulkModalTitle.textContent = title;
    bulkModalDesc.textContent  = desc;
    bulkModal.classList.add('show');
  }

  bulkModalOk?.addEventListener('click', () => bulkModal.classList.remove('show'));

  templateBtn?.addEventListener('click', () => {
    const csv = 'Student Name,Certificate ID,Degree Program,Graduation Year\n'
              + 'Jane Smith,CERT-2024-001,B.Sc. Computer Science,2024\n'
              + 'John Doe,CERT-2024-002,M.A. Economics,2024\n';
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'certificate_upload_template.csv'
    });
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('📥 Template downloaded');
  });

  browseBulkBtn?.addEventListener('click', e => { e.stopPropagation(); bulkFileInput?.click(); });
  bulkDropZone?.addEventListener('click', () => bulkFileInput?.click());
  bulkDropZone?.addEventListener('dragover', e => { e.preventDefault(); bulkDropZone.classList.add('dragover'); });
  bulkDropZone?.addEventListener('dragleave', () => bulkDropZone.classList.remove('dragover'));
  bulkDropZone?.addEventListener('drop', e => {
    e.preventDefault();
    bulkDropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleBulkFile(e.dataTransfer.files[0]);
  });

  bulkFileInput?.addEventListener('change', () => {
    if (bulkFileInput.files[0]) handleBulkFile(bulkFileInput.files[0]);
  });

  bulkClearBtn?.addEventListener('click', () => {
    if (bulkFileInput) bulkFileInput.value = '';
    currentBulkFile = null;
    if (bulkFileInfo) bulkFileInfo.textContent = '';
    if (bulkPreview) bulkPreview.style.display = 'none';
    if (bulkPreviewHead) bulkPreviewHead.innerHTML = '';
    if (bulkPreviewBody) bulkPreviewBody.innerHTML = '';
  });

  bulkImportBtn?.addEventListener('click', async () => {
    if (!currentBulkFile) { showToast('⚠️ No file selected'); return; }
    bulkImportBtn.textContent = 'Uploading...';
    bulkImportBtn.disabled = true;
    try {
      const result = await bulkUploadCertificates(currentBulkFile);
      if (result.errors && result.errors.length > 0) {
        const errorList = result.errors.slice(0, 5).join('\n');
        const moreErrors = result.errors.length > 5 ? `\n... and ${result.errors.length - 5} more errors` : '';
        showBulkModal('⚠️', 'Import Completed with Errors',
          `${result.created} certificate${result.created !== 1 ? 's' : ''} added.\n\n${result.errors.length} errors:\n${errorList}${moreErrors}`);
      } else {
        showBulkModal('✅', 'Import Successful',
          `${result.created} certificate record${result.created !== 1 ? 's' : ''} added to the database.`);
      }
      await loadCertificates();
      if (bulkFileInput) bulkFileInput.value = '';
      currentBulkFile = null;
      if (bulkFileInfo) bulkFileInfo.textContent = '';
      if (bulkPreview) bulkPreview.style.display = 'none';
    } catch (err) {
      showBulkModal('⚠️', 'Upload Failed', err.message);
    } finally {
      bulkImportBtn.textContent = 'Import to Database';
      bulkImportBtn.disabled = false;
    }
  });

  function handleBulkFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      showBulkModal('⚠️', 'Unsupported File', 'Please upload a .csv, .xls, or .xlsx file.');
      return;
    }
    currentBulkFile = file;
    if (bulkFileInfo) bulkFileInfo.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = e => parseAndRender(e.target.result);
      reader.readAsText(file);
    } else {
      renderExcelPlaceholder(file.name);
    }
  }

  function renderExcelPlaceholder(filename) {
    const headers = ['Student Name', 'Certificate ID', 'Degree Program', 'Graduation Year'];
    if (bulkPreviewHead) bulkPreviewHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    if (bulkPreviewBody) bulkPreviewBody.innerHTML = `<tr><td colspan="${headers.length}" style="text-align:center;color:#888;padding:1.5rem;">Excel preview not available — <strong>${filename}</strong> is ready to import.</td></tr>`;
    if (bulkPreviewCount) bulkPreviewCount.textContent = 'Excel file loaded';
    if (bulkPreview) bulkPreview.style.display = 'block';
  }

  function parseAndRender(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) { showBulkModal('⚠️', 'Empty File', 'The CSV file has no data rows.'); return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows    = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
    if (bulkPreviewHead) bulkPreviewHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    const display = rows.slice(0, 10);
    if (bulkPreviewBody) bulkPreviewBody.innerHTML = display.map(row =>
      '<tr>' + headers.map((_, i) => `<td>${row[i] ?? ''}</td>`).join('') + '</tr>'
    ).join('');
    const total = rows.length;
    if (bulkPreviewCount) bulkPreviewCount.textContent = `${total} record${total !== 1 ? 's' : ''} found${total > 10 ? ' (showing first 10)' : ''}`;
    if (bulkPreview) bulkPreview.style.display = 'block';
  }
});
