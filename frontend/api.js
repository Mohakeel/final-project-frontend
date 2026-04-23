// ============================================================
// CertiVerify – Shared API Service Layer
// ============================================================

export const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000'
  : 'https://certiverify-production.up.railway.app';

// ── Token / Role helpers ──────────────────────────────────
export const getToken  = ()    => localStorage.getItem('cv_token');
export const setToken  = (t)   => localStorage.setItem('cv_token', t);
export const removeToken = ()  => localStorage.removeItem('cv_token');
export const getRole   = ()    => localStorage.getItem('cv_role');
export const setRole   = (r)   => localStorage.setItem('cv_role', r);
export const removeRole = ()   => localStorage.removeItem('cv_role');
export const getName   = ()    => localStorage.getItem('cv_name');
export const setName   = (n)   => localStorage.setItem('cv_name', n);
export const removeName = ()   => localStorage.removeItem('cv_name');

// ── Core fetch wrapper ────────────────────────────────────
export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  // Only set Content-Type for JSON bodies (not FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    removeRole();
    const base = window.location.pathname.includes('/CertiVerify/') ? '/CertiVerify' : '';
    window.location.href = base + '/Login.html';
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const msg = data.msg || data.error || data.message || `Request failed (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────
export async function login(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email, password, role, name) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, name }),
  });
}

export async function logout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
  removeToken();
  removeRole();
  removeName();
}

// ── University ────────────────────────────────────────────
export async function getUniProfile() {
  return apiFetch('/university/profile');
}

export async function updateUniProfile(data) {
  return apiFetch('/university/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getPendingRequests() {
  return apiFetch('/university/verification-requests');
}

export async function getAllRequests() {
  return apiFetch('/university/all-verification-requests');
}

export async function processVerification(id, status, reason) {
  const body = { status };
  if (reason) body.reason = reason;
  return apiFetch(`/university/verify-request/${id}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function verifyCertByHash(hash) {
  return apiFetch(`/university/certificate-verification/${hash}`);
}

// ── Certificate Management ────────────────────────────────
export async function getCertificates() {
  return apiFetch('/university/certificates');
}

export async function createCertificate(data) {
  return apiFetch('/university/certificates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkUploadCertificates(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/university/certificates/bulk', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteCertificate(id) {
  return apiFetch(`/university/certificates/${id}`, {
    method: 'DELETE',
  });
}

// ── Employer ──────────────────────────────────────────────
export async function getEmpProfile() {
  return apiFetch('/employer/profile');
}

export async function updateEmpProfile(data) {
  return apiFetch('/employer/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getMyJobs() {
  return apiFetch('/employer/jobs');
}

export async function createJob(data) {
  return apiFetch('/employer/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJob(id, data) {
  return apiFetch(`/employer/job/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteJob(id) {
  return apiFetch(`/employer/job/${id}`, { method: 'DELETE' });
}

export async function getJobApplications(id) {
  return apiFetch(`/employer/job/${id}/applications`);
}

export async function updateAppStatus(id, status) {
  return apiFetch(`/employer/application/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function requestVerification(data) {
  return apiFetch('/employer/request-verification', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getVerificationRequests() {
  return apiFetch('/employer/verification-requests');
}

export async function getUniversities() {
  return apiFetch('/employer/universities');
}

// ── Applicant ─────────────────────────────────────────────
export async function getApplicantProfile() {
  return apiFetch('/applicant/profile');
}

export async function updateApplicantProfile(data) {
  return apiFetch('/applicant/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadResume(file) {
  const fd = new FormData();
  fd.append('resume', file);
  return apiFetch('/applicant/upload-resume', { method: 'POST', body: fd });
}

export async function updateResume(file) {
  const fd = new FormData();
  fd.append('resume', file);
  return apiFetch('/applicant/resume', { method: 'PUT', body: fd });
}

export async function deleteResume() {
  return apiFetch('/applicant/resume', { method: 'DELETE' });
}

export async function getJobs() {
  return apiFetch('/applicant/view-jobs');
}

export async function getJobDetail(id) {
  return apiFetch(`/applicant/job/${id}`);
}

export async function applyForJob(id, coverLetter) {
  return apiFetch(`/applicant/apply-job/${id}`, {
    method: 'POST',
    body: JSON.stringify({ cover_letter: coverLetter }),
  });
}

export async function getMyApplications() {
  return apiFetch('/applicant/applications');
}

export async function withdrawApplication(id) {
  return apiFetch(`/applicant/application/${id}`, { method: 'DELETE' });
}

// ── Notifications ─────────────────────────────────────────
export async function getNotifications() {
  return apiFetch('/notifications');
}

export async function getUnreadCount() {
  return apiFetch('/notifications/unread-count');
}

export async function markAllRead() {
  return apiFetch('/notifications/mark-read', { method: 'POST' });
}

export async function markOneRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'POST' });
}

// ── Avatar ────────────────────────────────────────────────
export async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append('avatar', file);
  return apiFetch('/auth/avatar', { method: 'POST', body: fd });
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export const getAvatarUrl = (userId) =>
  `${API_BASE}/auth/avatar/${userId}?t=${Date.now()}`;
