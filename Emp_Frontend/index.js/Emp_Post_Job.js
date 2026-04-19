import { createJob, logout, removeToken, removeRole } from '../../frontend/api.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Toast helper ──
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
  }

  // ── Form data ──
  function getFormData() {
    return {
      title:       document.getElementById('jobTitle').value.trim(),
      description: document.getElementById('jobDescription').value.trim(),
      location:    document.getElementById('jobLocation').value.trim(),
      job_type:    document.getElementById('jobType').value,
      salary_min:  parseFloat(document.getElementById('salaryMin').value) || null,
      salary_max:  parseFloat(document.getElementById('salaryMax').value) || null,
      credential_required: document.getElementById('credentialToggle')?.checked || false,
      is_public:   document.getElementById('visibilityToggle')?.checked || true,
      ai_matching: document.getElementById('aiToggle')?.checked || false,
    };
  }

  function validateForm(data) {
    if (!data.title)       { showToast('Please enter a job title.');       document.getElementById('jobTitle').focus();       return false; }
    if (!data.description) { showToast('Please add a job description.');   document.getElementById('jobDescription').focus(); return false; }
    if (!data.location)    { showToast('Please enter a location.');        document.getElementById('jobLocation').focus();    return false; }
    if (data.salary_min && data.salary_max && data.salary_min > data.salary_max) {
      showToast('Salary minimum cannot exceed salary maximum.');
      document.getElementById('salaryMin').focus();
      return false;
    }
    return true;
  }

  // ── Create Job button ──
  const createBtn = document.getElementById('createJobBtn');
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const data = getFormData();
      if (!validateForm(data)) return;

      data.status = 'OPEN'; // Publish immediately

      createBtn.textContent = 'Posting...';
      createBtn.disabled    = true;

      try {
        await createJob(data);
        showToast('Job posted successfully!');
        // Clear form
        ['jobTitle', 'jobDescription', 'jobLocation', 'salaryMin', 'salaryMax'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        setTimeout(() => { window.location.href = 'Emp_My_Job.html'; }, 1500);
      } catch (err) {
        showToast('Error: ' + err.message);
      } finally {
        createBtn.textContent = 'Create Job';
        createBtn.disabled    = false;
      }
    });
  }

  // ── Save as Draft button ──
  const draftBtn = document.getElementById('saveDraftBtn');
  if (draftBtn) {
    draftBtn.addEventListener('click', async () => {
      const data = getFormData();
      if (!data.title) { 
        showToast('Please enter a job title to save a draft.'); 
        document.getElementById('jobTitle').focus(); 
        return; 
      }

      data.status = 'DRAFT'; // Save as draft

      draftBtn.textContent = 'Saving...';
      draftBtn.disabled = true;

      try {
        await createJob(data);
        showToast('Draft saved successfully!');
        setTimeout(() => { window.location.href = 'Emp_My_Job.html'; }, 1500);
      } catch (err) {
        showToast('Error: ' + err.message);
      } finally {
        draftBtn.textContent = 'Save as Draft';
        draftBtn.disabled = false;
      }
    });
  }

  // ── Feature card click toggles checkbox ──
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT') return;
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change')); }
    });
  });

  // ── Salary auto-correct ──
  const salaryMin = document.getElementById('salaryMin');
  const salaryMax = document.getElementById('salaryMax');
  function swapIfNeeded() {
    const min = Number(salaryMin.value);
    const max = Number(salaryMax.value);
    if (min && max && min > max) {
      [salaryMin.value, salaryMax.value] = [salaryMax.value, salaryMin.value];
      showToast('Salary range was swapped to keep min below max.');
    }
  }
  if (salaryMin) salaryMin.addEventListener('blur', swapIfNeeded);
  if (salaryMax) salaryMax.addEventListener('blur', swapIfNeeded);

  // ── Nav active ──
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

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
});
