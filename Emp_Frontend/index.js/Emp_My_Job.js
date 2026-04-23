import { getMyJobs, deleteJob, updateJob, logout, removeToken, removeRole, getName, setName, getEmpProfile } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Toast ──
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e40af;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 3000);
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
      window.location.href = (window.location.pathname.includes('/CertiVerify/') ? '/CertiVerify' : '') + '/Login.html';
    });
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();
  const jobList = document.getElementById('jobList');
  let allJobs = [];

  // ── Create New Listing button ──
  document.getElementById('createNewListingBtn')?.addEventListener('click', () => {
    window.location.href = 'Emp_Post_Job.html';
  });

  // Load and display user name
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

  // ── Tab filtering ──
  function bindTabs() {
    const tabs     = document.querySelectorAll('.tab');
    const jobCards = document.querySelectorAll('.job-card');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter');
        jobCards.forEach(card => {
          const status = card.getAttribute('data-status');
          card.style.display = (filter === 'all' || status === filter) ? 'flex' : 'none';
        });
      });
    });
  }

  // ── Search ──
  function bindSearch() {
    const searchInput = document.querySelector('.search-box input') || document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      document.querySelectorAll('.job-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'flex' : 'none';
      });
    });
  }

  // ── Render jobs from API ──
  function renderJobs(jobs) {
    allJobs = jobs; // store for edit modal access
    if (!jobList) return;
    if (jobs.length === 0) {
      jobList.innerHTML = '<p style="color:#aaa;padding:24px;">No jobs posted yet.</p>';
      return;
    }

    // Update tab counts
    const allCount = jobs.length;
    const activeCount = jobs.filter(j => j.status === 'OPEN').length;
    const draftCount = jobs.filter(j => j.status === 'DRAFT').length;
    const closedCount = jobs.filter(j => j.status === 'CLOSED').length;

    const tabs = document.querySelectorAll('.tab');
    if (tabs[0]) tabs[0].textContent = `All Jobs (${allCount})`;
    if (tabs[1]) tabs[1].textContent = `Active (${activeCount})`;
    if (tabs[2]) tabs[2].textContent = `Drafts (${draftCount})`;
    if (tabs[3]) tabs[3].textContent = `Closed (${closedCount})`;

    jobList.innerHTML = jobs.map(job => {
      const statusLabel = job.status === 'OPEN' ? 'Active' : job.status === 'CLOSED' ? 'Closed' : job.status === 'DRAFT' ? 'Draft' : job.status;
      const badgeClass  = job.status === 'OPEN' ? 'active-badge' : job.status === 'CLOSED' ? 'closed-badge' : 'draft-badge';
      const dataStatus  = job.status === 'OPEN' ? 'active' : job.status === 'DRAFT' ? 'draft' : 'closed';
      const salary = job.salary_min && job.salary_max
        ? `${(job.salary_min / 1000).toFixed(0)}k – ${(job.salary_max / 1000).toFixed(0)}k`
        : job.salary_min ? `${(job.salary_min / 1000).toFixed(0)}k+` : 'Salary not specified';
      
      // Action buttons based on status
      let actionButtons = '';
      if (job.status === 'DRAFT') {
        actionButtons = `
          <button class="btn-outline publish-btn" data-id="${job.id}">Publish</button>
          <button class="icon-action edit-btn" data-id="${job.id}" title="Edit">✏️</button>
          <button class="icon-action danger delete-btn" data-id="${job.id}" title="Delete">🗑</button>
        `;
      } else if (job.status === 'OPEN') {
        actionButtons = `
          <button class="btn-outline view-apps-btn" data-id="${job.id}">View Applications</button>
          <button class="icon-action unpublish-btn" data-id="${job.id}" title="Unpublish">📥</button>
          <button class="icon-action close-btn" data-id="${job.id}" title="Close">🔒</button>
          <button class="icon-action danger delete-btn" data-id="${job.id}" title="Delete">🗑</button>
        `;
      } else if (job.status === 'CLOSED') {
        actionButtons = `
          <button class="btn-outline muted-btn">View Report</button>
          <button class="icon-action reopen-btn" data-id="${job.id}" title="Reopen">🔓</button>
          <button class="icon-action danger delete-btn" data-id="${job.id}" title="Delete">🗑</button>
        `;
      }

      return `
        <div class="job-card" data-status="${dataStatus}" data-id="${job.id}">
          <div class="job-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
          </div>
          <div class="job-info">
            <div class="job-title-row">
              <h4 class="job-title">${job.title}</h4>
              <span class="status-badge ${badgeClass}">${statusLabel}</span>
            </div>
            <div class="job-meta">
              <span>📍 ${job.location || 'Remote'}</span>
              <span>💰 ${salary}</span>
              <span>🕐 ${job.job_type || 'Full-time'}</span>
            </div>
          </div>
          <div class="job-actions">
            ${actionButtons}
          </div>
        </div>`;
    }).join('');

    // Bind all action buttons
    bindActionButtons();
    bindTabs();
    bindSearch();
  }

  // ── Bind action buttons ──
  function bindActionButtons() {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id   = parseInt(btn.dataset.id);
        const card = btn.closest('.job-card');
        const title = card?.querySelector('.job-title')?.textContent || 'this job';
        if (!confirm(`Delete "${title}"?`)) return;
        try {
          await deleteJob(id);
          card.style.transition = 'opacity 0.3s';
          card.style.opacity    = '0';
          setTimeout(() => card.remove(), 300);
          showToast('Job deleted.');
        } catch (err) {
          showToast('Error: ' + err.message);
        }
      });
    });

    // Publish buttons (DRAFT -> OPEN)
    document.querySelectorAll('.publish-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        try {
          await updateJob(id, { status: 'OPEN' });
          showToast('Job published successfully!');
          const jobs = await getMyJobs();
          renderJobs(jobs);
        } catch (err) {
          showToast('Error: ' + err.message);
        }
      });
    });

    // Unpublish buttons (OPEN -> DRAFT)
    document.querySelectorAll('.unpublish-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        if (!confirm('Unpublish this job? It will be moved to drafts.')) return;
        try {
          await updateJob(id, { status: 'DRAFT' });
          showToast('Job unpublished.');
          const jobs = await getMyJobs();
          renderJobs(jobs);
        } catch (err) {
          showToast('Error: ' + err.message);
        }
      });
    });

    // Close buttons (OPEN -> CLOSED)
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        if (!confirm('Close this job? No more applications will be accepted.')) return;
        try {
          await updateJob(id, { status: 'CLOSED' });
          showToast('Job closed.');
          const jobs = await getMyJobs();
          renderJobs(jobs);
        } catch (err) {
          showToast('Error: ' + err.message);
        }
      });
    });

    // Reopen buttons (CLOSED -> OPEN)
    document.querySelectorAll('.reopen-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        try {
          await updateJob(id, { status: 'OPEN' });
          showToast('Job reopened.');
          const jobs = await getMyJobs();
          renderJobs(jobs);
        } catch (err) {
          showToast('Error: ' + err.message);
        }
      });
    });

    // View applications buttons
    document.querySelectorAll('.view-apps-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('selected_job_id', btn.dataset.id);
        window.location.href = 'Emp_Job_Application.html';
      });
    });

    // Edit buttons — open modal with job data
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const jobId = parseInt(btn.dataset.id);
        const job = allJobs.find(j => j.id === jobId);
        if (!job) return;
        openEditModal(job);
      });
    });
  }

  // ── Edit Modal ──
  function openEditModal(job) {
    document.getElementById('editJobId').value = job.id;
    document.getElementById('editTitle').value = job.title || '';
    document.getElementById('editDescription').value = job.description || '';
    document.getElementById('editLocation').value = job.location || '';
    document.getElementById('editJobType').value = job.job_type || 'Full-time';
    document.getElementById('editSalaryMin').value = job.salary_min || '';
    document.getElementById('editSalaryMax').value = job.salary_max || '';
    document.getElementById('editResponsibilities').value = job.responsibilities || '';
    document.getElementById('editReqEducation').value = job.req_education || '';
    document.getElementById('editReqExperience').value = job.req_experience || '';
    document.getElementById('editReqTechSkills').value = job.req_tech_skills || '';
    document.getElementById('editReqSoftSkills').value = job.req_soft_skills || '';
    document.getElementById('editModal').style.display = 'flex';
  }

  document.getElementById('closeEditModal')?.addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
  });
  document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
  });
  document.getElementById('editModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('editModal'))
      document.getElementById('editModal').style.display = 'none';
  });

  document.getElementById('saveEditBtn')?.addEventListener('click', async () => {
    const jobId = parseInt(document.getElementById('editJobId').value);
    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    try {
      await updateJob(jobId, {
        title:            document.getElementById('editTitle').value.trim(),
        description:      document.getElementById('editDescription').value.trim(),
        location:         document.getElementById('editLocation').value.trim(),
        job_type:         document.getElementById('editJobType').value,
        salary_min:       parseFloat(document.getElementById('editSalaryMin').value) || null,
        salary_max:       parseFloat(document.getElementById('editSalaryMax').value) || null,
        responsibilities: document.getElementById('editResponsibilities').value.trim() || null,
        req_education:    document.getElementById('editReqEducation').value.trim() || null,
        req_experience:   document.getElementById('editReqExperience').value.trim() || null,
        req_tech_skills:  document.getElementById('editReqTechSkills').value.trim() || null,
        req_soft_skills:  document.getElementById('editReqSoftSkills').value.trim() || null,
      });
      document.getElementById('editModal').style.display = 'none';
      showToast('Job updated successfully!');
      // Reload jobs
      const jobs = await getMyJobs();
      renderJobs(jobs);
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      saveBtn.textContent = 'Save Changes';
      saveBtn.disabled = false;
    }
  });

  // ── Load jobs ──
  if (jobList) {
    jobList.innerHTML = '<p style="color:#aaa;padding:24px;">Loading...</p>';
    try {
      const jobs = await getMyJobs();
      renderJobs(jobs);
    } catch (err) {
      jobList.innerHTML = `<p style="color:#e04040;padding:24px;">Failed to load jobs: ${err.message}</p>`;
    }
  } else {
    // Static HTML page — just bind existing UI
    bindTabs();
    bindSearch();
  }

  // ── Create New Listing ──
  const createBtn = document.querySelector('.btn-primary');
  if (createBtn) {
    createBtn.addEventListener('click', () => { window.location.href = 'Emp_Post_Job.html'; });
  }
});
