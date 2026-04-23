document.addEventListener('DOMContentLoaded', () => {

  // ── Toast ──
  function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
  }

  // ── Modal helpers ──
  let pendingCallback = null;

  function openModal({ icon, title, desc, confirmLabel, confirmColor, onConfirm }) {
    document.getElementById('modal-icon').textContent    = icon;
    document.getElementById('modal-title').textContent   = title;
    document.getElementById('modal-desc').textContent    = desc;
    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.textContent   = confirmLabel;
    confirmBtn.style.background = confirmColor;
    pendingCallback = onConfirm;
    document.getElementById('modal-overlay').classList.add('show');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
    pendingCallback = null;
  }

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('modal-confirm').addEventListener('click', () => {
    if (pendingCallback) pendingCallback();
    closeModal();
  });

  // ── Generate Hash ──
  const generateBtn     = document.getElementById('generate-btn');
  const hashResult      = document.getElementById('hash-result');
  const approveActions  = document.getElementById('approve-actions');
  const hashCodeEl      = document.getElementById('hash-code');
  let hashGenerated     = false;

  function randomHex(len) {
    return [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  generateBtn.addEventListener('click', () => {
    if (hashGenerated) return;

    generateBtn.textContent = 'Generating...';
    generateBtn.disabled    = true;

    setTimeout(() => {
      const hash = `0x${randomHex(8)}${randomHex(8)}${randomHex(8)}${randomHex(8)}${randomHex(8)}${randomHex(8)}${randomHex(8)}${randomHex(8)}`;
      hashCodeEl.textContent = `cert_hash: ${hash}`;
      hashResult.classList.add('visible');
      approveActions.classList.add('visible');
      generateBtn.textContent = '&#10003; Hash Generated';
      generateBtn.innerHTML   = '&#10003; Hash Generated';
      hashGenerated = true;
      showToast('✓ Cryptographic hash generated and registered on the ledger.');
    }, 1400);
  });

  // ── Copy Hash ──
  document.getElementById('copy-btn').addEventListener('click', () => {
    const text = hashCodeEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Hash copied to clipboard.');
    }).catch(() => {
      showToast('Copy failed — please copy manually.');
    });
  });

  // ── Confirm Approval ──
  document.getElementById('approve-confirm-btn').addEventListener('click', () => {
    openModal({
      icon: '✅',
      title: 'Confirm Approval',
      desc: 'You are about to approve Elena Rodriguez\'s credential and issue a verified certificate on the institutional ledger. This action cannot be undone.',
      confirmLabel: 'Approve & Issue',
      confirmColor: '#3b35c3',
      onConfirm: () => {
        document.querySelector('.approve-panel').style.opacity = '0.6';
        document.querySelector('.reject-panel').style.opacity  = '0.4';
        document.querySelector('.reject-panel').style.pointerEvents = 'none';
        document.getElementById('approve-confirm-btn').textContent = '✓ Certificate Issued';
        document.getElementById('approve-confirm-btn').style.background = '#28a86a';
        document.querySelector('.status-badge').innerHTML =
          '<span style="width:8px;height:8px;border-radius:50%;background:#28a86a;display:inline-block;"></span> Certificate Issued';
        document.querySelector('.status-badge').style.background = '#e3f8ec';
        document.querySelector('.status-badge').style.borderColor = '#a0ddb8';
        document.querySelector('.status-badge').style.color = '#1a7a4a';
        showToast('✓ Certificate successfully issued for Elena Rodriguez.', 4000);
      }
    });
  });

  // ── Rejection Reason / Note ──
  const rejectionNote  = document.getElementById('rejection-note');
  const rejectConfirm  = document.getElementById('reject-confirm-btn');
  const notifyCheck    = document.getElementById('notify-check');

  function updateRejectBtn() {
    const hasNote = rejectionNote.value.trim().length > 0;
    rejectConfirm.classList.toggle('enabled', hasNote);
  }

  rejectionNote.addEventListener('input', updateRejectBtn);
  notifyCheck.addEventListener('change', updateRejectBtn);

  // ── Confirm Rejection ──
  rejectConfirm.addEventListener('click', () => {
    const reason = document.getElementById('rejection-reason').value;
    const note   = rejectionNote.value.trim();
    const notify = notifyCheck.checked;

    const reasonLabels = {
      incomplete:   'Incomplete academic records',
      'missing-sig':'Missing graduation signature',
      duplicate:    'Duplicate application detected',
      fraud:        'Suspected document fraud',
      other:        'Other'
    };

    openModal({
      icon: '❌',
      title: 'Confirm Rejection',
      desc: `You are about to reject Elena Rodriguez's application. Reason: "${reasonLabels[reason] || reason}".${notify ? ' A formal notification will be sent to the student.' : ''}`,
      confirmLabel: 'Reject Application',
      confirmColor: '#d64040',
      onConfirm: () => {
        document.querySelector('.reject-panel').style.opacity = '0.6';
        document.querySelector('.approve-panel').style.opacity = '0.4';
        document.querySelector('.approve-panel').style.pointerEvents = 'none';
        rejectConfirm.textContent = '✓ Rejected';
        rejectConfirm.style.background = '#d64040';
        rejectConfirm.style.borderColor = '#d64040';
        rejectConfirm.style.color = '#fff';
        rejectConfirm.style.lineHeight = 'normal';
        document.querySelector('.status-badge').innerHTML =
          '<span style="width:8px;height:8px;border-radius:50%;background:#d64040;display:inline-block;"></span> Application Rejected';
        document.querySelector('.status-badge').style.background = '#fde8e8';
        document.querySelector('.status-badge').style.borderColor = '#f5b8b8';
        document.querySelector('.status-badge').style.color = '#a52020';
        showToast('✗ Application rejected' + (notify ? ' — student notified.' : '.'), 4000);
      }
    });
  });

  // ── View Document ──
  document.getElementById('doc-view-btn').addEventListener('click', () => {
    showToast('📄 Opening transcript_final_2023.pdf...');
  });

  // ── Bell ──
  const bellBtn = document.getElementById('bell-btn');
  const dot = document.createElement('span');
  dot.style.cssText = 'position:absolute;top:2px;right:2px;width:7px;height:7px;background:#e04040;border-radius:50%;display:block;';
  bellBtn.appendChild(dot);
  bellBtn.addEventListener('click', () => {
    dot.style.display = dot.style.display === 'none' ? 'block' : 'none';
    showToast('Notifications cleared.');
  });

  // ── Nav ──
  document.querySelectorAll('.nav-item, .tnav-link').forEach(item => {
    item.addEventListener('click', e => {
      const group = item.classList.contains('tnav-link')
        ? document.querySelectorAll('.tnav-link')
        : document.querySelectorAll('.nav-item');
      group.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Sign Out ──
  document.getElementById('sign-out').addEventListener('click', e => {
    e.preventDefault();
    if (confirm('Are you sure you want to sign out?')) showToast('Signed out successfully.');
  });

});

// Sign out
document.addEventListener('DOMContentLoaded', () => {
  const signOutBtnUni = document.getElementById('signOutBtn');
  if (signOutBtnUni) {
    signOutBtnUni.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to sign out?')) {
        window.location.href = '../../Login.html';
      }
    });
  }
});
