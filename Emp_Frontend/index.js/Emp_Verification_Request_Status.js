import { getVerificationRequests, logout, removeToken, removeRole, getName, setName, getEmpProfile } from '../../frontend/api.js';

// ── Sign Out ──
const signOutBtn = document.getElementById('signOutBtn');
if (signOutBtn) {
  signOutBtn.addEventListener('click', async e => {
    e.preventDefault();
    try { await logout(); } catch (_) {}
    removeToken();
    removeRole();
    window.location.href = '../Other_Frontend/Login.html';
  });
}

// ── State Management ──
let allRequests = [];
let filteredRequests = [];
let currentFilter = 'All';
let currentPage = 1;
const pageSize = 10; // Items per page

// ── Load and display user name ──
document.addEventListener('DOMContentLoaded', async () => {
  const userNameEl = document.querySelector('.user-name');
  const storedName = getName();
  if (userNameEl && storedName) userNameEl.textContent = storedName;
  
  try {
    const profile = await getEmpProfile();
    if (userNameEl && profile.company_name) {
      userNameEl.textContent = profile.company_name;
      setName(profile.company_name);
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});

// ── New Request Button ──
const newRequestBtn = document.getElementById('newRequestBtn');
if (newRequestBtn) {
  newRequestBtn.addEventListener('click', () => {
    window.location.href = 'Emp_Verification_Request_Form.html';
  });
}

// ── Filter Button ──
const filterBtn = document.getElementById('filterBtn');
if (filterBtn) {
  filterBtn.addEventListener('click', () => {
    const filterOptions = ['All', 'PENDING', 'VERIFIED', 'REJECTED'];
    const current = filterBtn.dataset.filter || 'All';
    const currentIndex = filterOptions.indexOf(current);
    const nextFilter = filterOptions[(currentIndex + 1) % filterOptions.length];
    filterBtn.dataset.filter = nextFilter;
    filterBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
      Filter: ${nextFilter}
    `;
    applyFilter(nextFilter);
  });
}

// ── Search Input ──
const searchInput = document.querySelector('.search-input');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    applySearchAndFilter();
  });
}

// ── Apply Search and Filter ──
function applySearchAndFilter() {
  const searchQuery = searchInput?.value.toLowerCase().trim() || '';
  
  // First apply filter
  let filtered = currentFilter === 'All' 
    ? [...allRequests] 
    : allRequests.filter(req => req.status === currentFilter);
  
  // Then apply search
  if (searchQuery) {
    filtered = filtered.filter(req => {
      const studentName = (req.student_name || '').toLowerCase();
      const degree = (req.degree || '').toLowerCase();
      const status = (req.status || '').toLowerCase();
      return studentName.includes(searchQuery) || 
             degree.includes(searchQuery) || 
             status.includes(searchQuery);
    });
  }
  
  filteredRequests = filtered;
  currentPage = 1; // Reset to first page
  renderCurrentPage();
}

// ── Apply Filter ──
function applyFilter(filter) {
  currentFilter = filter;
  applySearchAndFilter();
}

// ── Render Current Page ──
function renderCurrentPage() {
  const totalFiltered = filteredRequests.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  
  // Ensure current page is valid
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }
  
  // Calculate slice indices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const pageRequests = filteredRequests.slice(startIndex, endIndex);
  
  // Render table
  renderTable(pageRequests, startIndex);
  
  // Update pagination info
  updatePaginationInfo(startIndex + 1, endIndex, totalFiltered);
  
  // Update pagination buttons
  updatePaginationButtons(totalPages);
}

// ── Update Pagination Info ──
function updatePaginationInfo(start, end, total) {
  const pageInfo = document.querySelector('.page-info');
  if (!pageInfo) return;
  
  if (total === 0) {
    pageInfo.textContent = 'No results found';
  } else {
    pageInfo.textContent = `Showing ${start}–${end} of ${total} requests`;
  }
}

// ── Update Pagination Buttons ──
function updatePaginationButtons(totalPages) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  // Update prev/next button states
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    prevBtn.style.cursor = currentPage === 1 ? 'not-allowed' : 'pointer';
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    nextBtn.style.opacity = (currentPage >= totalPages || totalPages === 0) ? '0.5' : '1';
    nextBtn.style.cursor = (currentPage >= totalPages || totalPages === 0) ? 'not-allowed' : 'pointer';
  }
  
  // Update page number buttons (show current page and neighbors)
  const pageControls = document.querySelector('.page-controls');
  if (!pageControls) return;
  
  // Clear existing page buttons (keep prev/next)
  const existingPageBtns = pageControls.querySelectorAll('.page-btn:not(#prevBtn):not(#nextBtn)');
  existingPageBtns.forEach(btn => btn.remove());
  
  // Generate page buttons
  const maxVisiblePages = 3;
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // Insert page buttons before nextBtn
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
    pageBtn.textContent = i;
    pageBtn.onclick = () => setPage(i);
    pageControls.insertBefore(pageBtn, nextBtn);
  }
}

// ── Render Table ──
function renderTable(requests, startIndex = 0) {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#aaa;">No verification requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map((req, index) => {
    const globalIndex = startIndex + index;
    const initials = (req.student_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <tr style="cursor:pointer;" onclick="showDetail(${globalIndex})">
        <td>
          <div class="student-cell">
            <div class="student-avatar av-blue">${initials}</div>
            <div>
              <div class="student-name">${req.student_name || '—'}</div>
              <div class="student-year">Year ${req.year || '—'}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="cred-name">${req.degree || '—'}</div>
          <div class="cred-inst">Verification Request #${req.id}</div>
        </td>
        <td><span class="status-badge ${statusBadgeClass(req.status)}">${req.status}</span></td>
        <td>${getHashCell(req)}</td>
        <td>${getActionButton(req)}</td>
      </tr>`;
  }).join('');
}

// ── Helper Functions ──
function getHashCell(req) {
  if (req.status === 'VERIFIED' && req.cert_hash) {
    return `<span class="hash-code">${req.cert_hash}</span>`;
  } else if (req.status === 'PENDING') {
    return `<span class="hash-pending">Verification in progress...</span>`;
  } else {
    return `<span class="hash-error">Record Mismatch / Rejected</span>`;
  }
}

function getActionButton(req) {
  if (req.status === 'REJECTED') {
    return `<button class="action-btn warn" title="Error" data-idx="${req.id}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </button>`;
  }
  return `<button class="action-btn" title="View" data-idx="${req.id}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  </button>`;
}

function statusBadgeClass(status) {
  if (status === 'VERIFIED') return 'badge-verified';
  if (status === 'PENDING')  return 'badge-pending';
  return 'badge-rejected';
}

// ── Show Detail ──
window.showDetail = function(index) {
  const req = filteredRequests[index];
  if (!req) return;
  
  const detailId = document.querySelector('.detail-id');
  if (detailId) detailId.textContent = `● ID: VR-${req.id}`;

  const names = document.querySelectorAll('.detail-name');
  const subs  = document.querySelectorAll('.detail-sub');
  if (names[0]) names[0].textContent = req.student_name || '—';
  if (subs[0])  subs[0].textContent  = `Degree: ${req.degree || '—'}`;
  if (names[1]) names[1].textContent = `University #${req.university_id}`;
  if (subs[1])  subs[1].textContent  = `Year: ${req.year || '—'}`;

  const remarks = document.querySelector('.remarks-box');
  if (remarks) {
    remarks.textContent = req.cert_hash
      ? `Certificate hash: ${req.cert_hash}. Status: ${req.status}.`
      : `Status: ${req.status}. Submitted on ${req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}.`;
  }

  document.getElementById('detailSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── Pagination Controls ──
window.changePage = function(delta) {
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const newPage = currentPage + delta;
  
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderCurrentPage();
  }
};

window.setPage = function(pageNum) {
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  
  if (pageNum >= 1 && pageNum <= totalPages) {
    currentPage = pageNum;
    renderCurrentPage();
  }
};

// ── Load Data ──
document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('tableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#aaa;">Loading...</td></tr>`;

  try {
    allRequests = await getVerificationRequests();
    filteredRequests = [...allRequests];
    renderCurrentPage();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#e04040;">Failed to load: ${err.message}</td></tr>`;
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) pageInfo.textContent = 'Failed to load requests';
  }
});
