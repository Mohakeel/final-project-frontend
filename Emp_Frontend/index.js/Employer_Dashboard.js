import { getEmpProfile, getMyJobs, getVerificationRequests, logout, removeToken, removeRole, getName, setName } from '../../frontend/api.js';

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

// ── Animate count ──
function animateCount(element, target, duration) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    element.textContent = Math.floor(start);
  }, 16);
}

// ── Sign Out ──
const signOutBtn = document.getElementById('signOutBtn');
if (signOutBtn) {
  signOutBtn.addEventListener('click', async e => {
    e.preventDefault();
    await logout();
    window.location.href = '../Other_Frontend/Login.html';
  });
}

// ── Post New Job Button ──
const postNewJobBtn = document.getElementById('postNewJobBtn');
if (postNewJobBtn) {
  postNewJobBtn.addEventListener('click', () => {
    window.location.href = 'Emp_Post_Job.html';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Animate impact number
  const impactNum = document.querySelector('.impact-number');
  if (impactNum) {
    const numberSpan = document.createElement('span');
    numberSpan.textContent = '0';
    impactNum.innerHTML = '';
    impactNum.appendChild(numberSpan);
    impactNum.appendChild(Object.assign(document.createElement('span'), {
      className: 'impact-text',
      textContent: 'Applications Received',
    }));
    animateCount(numberSpan, 342, 1200);
  }

  // Load API data
  try {
    // Instantly show stored name before API responds
    const userNameEl = document.querySelector('.user-name');
    const storedName = getName();
    if (userNameEl && storedName) userNameEl.textContent = storedName;

    const [profile, jobs, verifications] = await Promise.all([
      getEmpProfile(),
      getMyJobs(),
      getVerificationRequests(),
    ]);

    // Update name from API and persist it
    if (userNameEl && profile.company_name) {
      userNameEl.textContent = profile.company_name;
      setName(profile.company_name);
    }

    // Update welcome title
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle && profile.company_name) {
      welcomeTitle.textContent = `Welcome back, ${profile.company_name}`;
    }

    // Stats
    const totalJobs  = jobs.length;
    const openJobs   = jobs.filter(j => j.status === 'OPEN').length;
    const pendingVer = verifications.filter(v => v.status === 'PENDING').length;

    const statNums = document.querySelectorAll('.impact-stat-num');
    if (statNums[0]) statNums[0].textContent = totalJobs;
    if (statNums[1]) { statNums[1].textContent = pendingVer; }

    // Render verification list with real data (last 3)
    const container = document.getElementById('verificationList');
    if (container && verifications.length > 0) {
      const recent = verifications.slice(0, 3);
      container.innerHTML = recent.map(v => `
        <div class="verif-item">
          <div class="verif-left">
            <div class="verif-avatar" style="width:38px;height:38px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:#3730a3;">
              ${(v.student_name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div class="verif-name">${v.student_name || '—'}</div>
              <div class="verif-role">${v.degree || '—'}</div>
            </div>
          </div>
          <div class="verif-right">
            <span class="badge badge-${v.status.toLowerCase()}">${v.status}</span>
          </div>
        </div>
      `).join('');
    } else if (container) {
      // Fallback to static render if no data
      container.innerHTML = '<div style="color:#aaa;font-size:14px;padding:12px;">No verification requests yet.</div>';
    }
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message);
  }
});
