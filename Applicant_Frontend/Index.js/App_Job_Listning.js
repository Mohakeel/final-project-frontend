import { getJobs, logout, getName } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Navbar name ──
const userNameEl = document.querySelector('.user-name');
if (userNameEl) {
  const stored = getName();
  if (stored) userNameEl.textContent = stored;
}

// ── Sign Out ──
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('signOutBtn')?.addEventListener('click', async e => {
    e.preventDefault();
    await logout();
    window.location.href = '../../Login.html';
  });
});

// ── State ──
let allJobs = [];
let activeType = '';
let maxSalary = 350000;

// ── Filters ──
function getFilters() {
  const remote = document.getElementById('cb-remote')?.checked;
  const onsite = document.getElementById('cb-onsite')?.checked;
  const search = document.querySelector('.search-input')?.value.toLowerCase().trim() || '';
  return { remote, onsite, search };
}

function matchesLocation(job, remote, onsite) {
  if (remote && onsite) return true;
  if (!remote && !onsite) return false;
  const loc = (job.location || '').toLowerCase();
  const isRemote = loc.includes('remote');
  if (remote && isRemote) return true;
  if (onsite && !isRemote) return true;
  return false;
}

function applyFilters() {
  const { remote, onsite, search } = getFilters();
  return allJobs.filter(job => {
    const matchLoc    = matchesLocation(job, remote, onsite);
    const matchType   = !activeType || (job.job_type || '').toLowerCase() === activeType.toLowerCase();
    const matchQ      = !search ||
      (job.title || '').toLowerCase().includes(search) ||
      (job.location || '').toLowerCase().includes(search) ||
      (job.description || '').toLowerCase().includes(search);
    // Salary: show if no salary data, or if salary_min is within range
    const jobSalary   = job.salary_min || 0;
    const matchSalary = jobSalary === 0 || jobSalary <= maxSalary;
    return matchLoc && matchType && matchQ && matchSalary;
  });
}

// ── Render ──
function renderJobs() {
  const listings = document.getElementById('jobListings');
  if (!listings) return;
  const jobs = applyFilters();
  listings.innerHTML = '';

  if (jobs.length === 0) {
    listings.innerHTML = `<div style="padding:3rem;text-align:center;color:#9ca3af;font-size:15px;">No jobs match your filters.</div>`;
    return;
  }

  jobs.forEach(job => {
    const salary = job.salary_min && job.salary_max
      ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`
      : job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}k+` : 'Salary not listed';

    const loc = job.location || 'Remote';
    const isRemote = loc.toLowerCase().includes('remote');
    const locBadge = isRemote ? `<span class="tag">Remote</span>` : `<span class="tag">On-site</span>`;

    const card = document.createElement('div');
    card.className = 'job-card featured-top';
    card.innerHTML = `
      <div class="job-card-left">
        <div class="company-icon verified">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
      </div>
      <div class="job-card-body">
        <div class="job-card-header">
          <div class="job-title-row">
            <h3 class="job-title">${job.title}</h3>
            <span class="badge fulltime-badge">${job.job_type || 'Full-time'}</span>
          </div>
          <p class="salary">${salary} <span class="salary-period">yearly base</span></p>
        </div>
        <p class="company-meta">${loc}</p>
        <p class="job-desc">${(job.description || '').slice(0, 140)}${(job.description || '').length > 140 ? '...' : ''}</p>
        <div class="job-footer">
          ${locBadge}
          <a href="App_Job_Detail_Apply.html?job_id=${job.id}" class="view-details"
             onclick="localStorage.setItem('selected_job_id','${job.id}')">View Details →</a>
        </div>
      </div>`;
    listings.appendChild(card);
  });
}

// ── Filter listeners ──
document.getElementById('cb-remote')?.addEventListener('change', e => {
  e.target.closest('.checkbox-item').classList.toggle('checked', e.target.checked);
  renderJobs();
});
document.getElementById('cb-onsite')?.addEventListener('change', e => {
  e.target.closest('.checkbox-item').classList.toggle('checked', e.target.checked);
  renderJobs();
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    activeType = this.textContent.trim() === 'All' ? '' : this.textContent.trim();
    renderJobs();
  });
});

document.querySelector('.search-input')?.addEventListener('input', () => renderJobs());

// ── Salary range — actually filters now ──
const salaryRange = document.getElementById('salaryRange');
if (salaryRange) {
  salaryRange.addEventListener('input', function () {
    maxSalary = parseInt(this.value);
    const display = maxSalary >= 350000 ? '$350k+' : `$${Math.round(maxSalary / 1000)}k`;
    const labels = document.querySelectorAll('.range-labels span');
    if (labels[1]) labels[1].textContent = display;
    renderJobs();
  });
}

// ── Load ──
document.addEventListener('DOMContentLoaded', async () => {
  initNotificationBell();
  initAvatar();
  const listings = document.getElementById('jobListings');
  if (listings) listings.innerHTML = `<div style="padding:3rem;text-align:center;color:#9ca3af;">Loading jobs...</div>`;
  try {
    allJobs = await getJobs();
    renderJobs();
  } catch (err) {
    if (listings) listings.innerHTML = `<div style="padding:3rem;text-align:center;color:#dc2626;">Failed to load jobs: ${err.message}</div>`;
  }
});
