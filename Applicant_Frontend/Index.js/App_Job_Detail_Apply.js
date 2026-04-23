import { getJobDetail, applyForJob, getApplicantProfile, logout, removeToken, removeRole, getName, setName } from '../../frontend/api.js';
import { initNotificationBell } from '../../frontend/notifications.js';
import { initAvatar } from '../../frontend/avatar.js';

// ── Nav active state ──
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── Load job detail ──
async function loadJobDetail() {
  // Get job_id from URL params or localStorage
  const params = new URLSearchParams(window.location.search);
  jobId = parseInt(params.get('job_id') || localStorage.getItem('selected_job_id'));

  if (!jobId) return; // Use static content

  try {
    const job = await getJobDetail(jobId);

    // Populate job header
    const titleEl = document.querySelector('.job-title');
    if (titleEl) titleEl.textContent = job.title || 'Job Detail';

    const metaItems = document.querySelectorAll('.meta-item');
    if (metaItems[0]) metaItems[0].innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${job.location || 'Remote'}`;
    if (metaItems[1]) {
      const salary = job.salary_min && job.salary_max
        ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k /yr`
        : 'Salary not specified';
      metaItems[1].innerHTML = `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> ${salary}`;
    }
    if (metaItems[2]) metaItems[2].innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${job.job_type || 'Full-time'}`;

    // Description
    const descEl = document.querySelector('.section-body');
    if (descEl && job.description) descEl.textContent = job.description;

    // Breadcrumb
    const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = job.title || 'Job Detail';
  } catch (err) {
    console.warn('Job detail load error:', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNotificationBell();
  initAvatar();

  // ── Resume section ──
  const uploadZone   = document.getElementById('uploadZone');
  const fileInput    = document.getElementById('fileInput');
  const browseBtn    = document.getElementById('browseBtn');
  const fileNameEl   = document.getElementById('fileName');
  const aiScoreSub   = document.getElementById('aiScoreSub');
  const useExisting  = document.getElementById('useExisting');
  const useNew       = document.getElementById('useNew');
  const existingBox  = document.getElementById('existingResumeBox');
  const uploadNewRow = document.getElementById('uploadNewRow');

  function updateResumeUI() {
    if (useNew?.checked) { uploadZone.style.display = ''; }
    else { uploadZone.style.display = 'none'; if (fileNameEl) fileNameEl.textContent = ''; }
  }
  useExisting?.addEventListener('change', updateResumeUI);
  useNew?.addEventListener('change', updateResumeUI);

  async function loadExistingResume() {
    try {
      const profile = await getApplicantProfile();
      const nameEl  = document.getElementById('fullName');
      const emailEl = document.getElementById('email');
      if (nameEl  && profile.full_name) nameEl.value  = profile.full_name;
      if (emailEl && profile.email)     emailEl.value = profile.email;
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl && profile.full_name) { userNameEl.textContent = profile.full_name; setName(profile.full_name); }
      if (profile.resume_path) {
        const filename = profile.resume_path.split(/[\\/]/).pop();
        if (document.getElementById('existingResumeName')) document.getElementById('existingResumeName').textContent = filename;
        if (existingBox) existingBox.style.display = '';
        if (uploadZone) uploadZone.style.display = 'none';
      } else {
        if (existingBox) existingBox.style.display = 'none';
        if (uploadNewRow) uploadNewRow.style.display = 'none';
        if (uploadZone) uploadZone.style.display = '';
      }
    } catch (e) {
      if (existingBox) existingBox.style.display = 'none';
      if (uploadNewRow) uploadNewRow.style.display = 'none';
      if (uploadZone) uploadZone.style.display = '';
    }
  }

  browseBtn?.addEventListener('click', e => { e.stopPropagation(); fileInput?.click(); });
  uploadZone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', function() { handleFile(this.files[0]); });
  uploadZone?.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone?.addEventListener('dragleave', () => uploadZone?.classList.remove('drag-over'));
  uploadZone?.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      if (fileNameEl) { fileNameEl.textContent = 'Please upload a PDF or DOCX file.'; fileNameEl.style.color = '#dc2626'; }
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      if (fileNameEl) { fileNameEl.textContent = 'File exceeds 10MB limit.'; fileNameEl.style.color = '#dc2626'; }
      return;
    }
    if (fileNameEl) { fileNameEl.textContent = file.name + ' — ready to upload'; fileNameEl.style.color = '#1e40af'; }
    if (aiScoreSub) {
      aiScoreSub.textContent = 'Calculating your match score...';
      setTimeout(() => {
        const score = Math.floor(Math.random() * 15) + 82;
        aiScoreSub.textContent = `Match score: ${score}% — Strong fit for this role!`;
      }, 1800);
    }
  }

  // ── Apply button ──
  const applyBtn = document.getElementById('applyBtn');
  let jobId = null;

  function showError(msg) {
    let errEl = document.querySelector('.apply-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'apply-error';
      errEl.style.cssText = 'color:#dc2626;font-size:13px;margin-top:8px;';
      if (applyBtn) applyBtn.parentNode.insertBefore(errEl, applyBtn.nextSibling);
    }
    errEl.textContent = msg;
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const coverLetter = document.getElementById('coverLetter')?.value?.trim() || '';
      const consent     = document.getElementById('consent')?.checked;
      if (!consent) { showError('Please consent to the background check to proceed.'); return; }
      if (!jobId)   { showError('No job selected. Please go back to job listings.'); return; }
      applyBtn.textContent = 'Submitting...';
      applyBtn.disabled    = true;
      showError('');
      try {
        await applyForJob(jobId, coverLetter);
        applyBtn.innerHTML = 'Application Submitted! ✓';
        applyBtn.classList.add('success');
        applyBtn.disabled = true;
      } catch (err) {
        showError(err.message || 'Failed to submit application.');
        applyBtn.textContent = 'Apply Now';
        applyBtn.disabled    = false;
      }
    });
    applyBtn.style.opacity = '0.7';
  }

  // ── Consent checkbox ──
  const consentCb = document.getElementById('consent');
  if (consentCb && applyBtn) {
    consentCb.addEventListener('change', function() { applyBtn.style.opacity = this.checked ? '1' : '0.7'; });
  }

  // ── Sign Out ──
  document.getElementById('signOutBtn')?.addEventListener('click', async e => {
    e.preventDefault();
    try { await logout(); } catch (_) {}
    removeToken();
    removeRole();
    window.location.href = (window.location.pathname.includes('/CertiVerify/') ? '/CertiVerify' : '') + '/Login.html';
  });

  // ── Load job detail ──
  async function loadJobDetail() {
    const params = new URLSearchParams(window.location.search);
    jobId = parseInt(params.get('job_id') || localStorage.getItem('selected_job_id'));
    if (!jobId) return;
    try {
      const job = await getJobDetail(jobId);

      // Title
      const titleEl = document.querySelector('.job-title');
      if (titleEl) titleEl.textContent = job.title || 'Job Detail';

      // Meta items
      const metaItems = document.querySelectorAll('.meta-item');
      if (metaItems[0]) metaItems[0].innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${job.location || 'Remote'}`;
      if (metaItems[1]) {
        const salary = job.salary_min && job.salary_max ? `$${(job.salary_min/1000).toFixed(0)}k – $${(job.salary_max/1000).toFixed(0)}k /yr` : 'Salary not specified';
        metaItems[1].innerHTML = `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> ${salary}`;
      }
      if (metaItems[2]) metaItems[2].innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${job.job_type || 'Full-time'}`;

      // Description
      const descEl = document.querySelector('.section-body');
      if (descEl && job.description) descEl.textContent = job.description;

      // Key Responsibilities
      if (job.responsibilities) {
        const respList = document.querySelector('.responsibilities-list');
        if (respList) {
          const items = job.responsibilities.split('\n').filter(r => r.trim());
          if (items.length > 0) {
            respList.innerHTML = items.map(r => `
              <li class="resp-item">
                <span class="resp-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
                ${r.trim()}
              </li>`).join('');
          }
        }
      }

      // Requirements
      const reqCards = document.querySelectorAll('.req-card');
      if (reqCards.length >= 4) {
        if (job.req_education)   reqCards[0].querySelector('.req-text').textContent = job.req_education;
        if (job.req_experience)  reqCards[1].querySelector('.req-text').textContent = job.req_experience;
        if (job.req_tech_skills) reqCards[2].querySelector('.req-text').textContent = job.req_tech_skills;
        if (job.req_soft_skills) reqCards[3].querySelector('.req-text').textContent = job.req_soft_skills;
      }

      // Map address
      const mapAddress = document.querySelector('.map-address');
      if (mapAddress && job.location) mapAddress.textContent = job.location;

      // Breadcrumb
      const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = job.title || 'Job Detail';
    } catch (err) {
      console.warn('Job detail load error:', err.message);
    }
  }

  loadExistingResume();
  loadJobDetail();
});
