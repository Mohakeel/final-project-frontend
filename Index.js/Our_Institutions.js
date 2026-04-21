// ========================
// DATA: Card metadata for modal
// ========================
const cardData = [
  {
    name: "Stanford University",
    location: "Stanford, California, USA",
    tags: [
      { label: "TIER 1 ELITE", cls: "tag-blue" },
      { label: "WASC ACCREDITED", cls: "tag-green" }
    ],
    verified: "842,500+",
    bg: "#1a2744",
    letter: "S",
    letterColor: "#c9a84c"
  },
  {
    name: "ETH Zurich",
    location: "Zurich, Switzerland",
    tags: [
      { label: "GOLD PARTNER", cls: "tag-gold" },
      { label: "EU VERIFIED", cls: "tag-blue" }
    ],
    verified: "512,200+",
    bg: "#1a3a4a",
    letter: "E",
    letterColor: "#4fc3f7"
  },
  {
    name: "University of Tokyo",
    location: "Bunkyo, Tokyo, Japan",
    tags: [
      { label: "TIER 1 ELITE", cls: "tag-blue" },
      { label: "MEXT CERTIFIED", cls: "tag-purple" }
    ],
    verified: "678,900+",
    bg: "#1a2a1a",
    letter: "T",
    letterColor: "#81c784"
  },
  {
    name: "Oxford University",
    location: "Oxford, United Kingdom",
    tags: [
      { label: "LEGACY PARTNER", cls: "tag-orange" },
      { label: "GLOBAL GOLD", cls: "tag-gold" }
    ],
    verified: "1.2M+",
    bg: "#1e1a30",
    letter: "O",
    letterColor: "#b39ddb"
  },
  {
    name: "McGill University",
    location: "Montreal, Canada",
    tags: [
      { label: "TIER 1 ELITE", cls: "tag-blue" },
      { label: "AACSB CERTIFIED", cls: "tag-green" }
    ],
    verified: "324,100+",
    bg: "#0d2a1a",
    letter: "M",
    letterColor: "#a5d6a7"
  },
  {
    name: "NUS Singapore",
    location: "Queenstown, Singapore",
    tags: [
      { label: "APAC LEADER", cls: "tag-teal" },
      { label: "ASPIRE VERIFIED", cls: "tag-purple" }
    ],
    verified: "441,800+",
    bg: "#1a2a3a",
    letter: "N",
    letterColor: "#f48fb1"
  }
];

// ========================
// MODAL
// ========================
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalName    = document.getElementById('modalName');
const modalLoc     = document.getElementById('modalLocation');
const modalTagsEl  = document.getElementById('modalTags');
const modalVerEl   = document.getElementById('modalVerified');
const modalIcon    = document.getElementById('modalIcon');

function openModal(idx) {
  const d = cardData[idx];
  modalIcon.style.background = d.bg;
  modalIcon.innerHTML = `<span style="font-size:1.5rem;font-family:'Fraunces',serif;font-weight:900;color:${d.letterColor}">${d.letter}</span>`;
  modalName.textContent = d.name;
  modalLoc.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${d.location}`;
  modalTagsEl.innerHTML = d.tags.map(t => `<span class="tag ${t.cls}">${t.label}</span>`).join('');
  modalVerEl.textContent = d.verified;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Attach click to each card and arrow button
document.querySelectorAll('.inst-card').forEach((card, i) => {
  card.addEventListener('click', () => openModal(i));
});

// ========================
// QUICK FILTERS
// ========================
const qfBtns = document.querySelectorAll('.qf-btn');
const cards  = document.querySelectorAll('.inst-card');
const noResults = document.getElementById('noResults');
const pagination = document.getElementById('pagination');

function applyFilter(filter) {
  let visible = 0;
  cards.forEach(card => {
    const match = filter === 'all' || card.dataset.filter === filter;
    card.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  noResults.style.display  = visible === 0 ? 'block' : 'none';
  pagination.style.display = visible === 0 ? 'none'  : 'flex';
}

qfBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    qfBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
    // Reset search
    document.getElementById('searchInput').value = '';
  });
});

// ========================
// SEARCH
// ========================
const searchInput = document.getElementById('searchInput');
const findBtn = document.getElementById('findBtn');

function doSearch() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { applyFilter('all'); return; }

  // Reset quick filter active state
  qfBtns.forEach(b => b.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');

  let visible = 0;
  cards.forEach((card, i) => {
    const d = cardData[i];
    const match =
      d.name.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      d.tags.some(t => t.label.toLowerCase().includes(q));
    card.classList.toggle('hidden', !match);
    if (match) visible++;
  });

  noResults.style.display  = visible === 0 ? 'block' : 'none';
  pagination.style.display = visible === 0 ? 'none'  : 'flex';
}

findBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
searchInput.addEventListener('input', () => { if (searchInput.value === '') applyFilter('all'); });

// ========================
// FILTERS BUTTON (toggle visual)
// ========================
const filtersBtn = document.getElementById('filtersBtn');
let filtersActive = false;
filtersBtn.addEventListener('click', () => {
  filtersActive = !filtersActive;
  filtersBtn.style.background    = filtersActive ? 'var(--blue-light)' : '';
  filtersBtn.style.borderColor   = filtersActive ? 'var(--blue)' : '';
  filtersBtn.style.color         = filtersActive ? 'var(--blue)' : '';
});

// ========================
// PAGINATION
// ========================
let currentPage = 1;
const totalPages = 12;
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageBtns = document.querySelectorAll('.page-btn[data-page]');

function setPage(page) {
  currentPage = page;
  pageBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.page) === page);
  });
  prevBtn.disabled = page === 1;
  nextBtn.disabled = page === totalPages;
  // Scroll to cards
  document.querySelector('.cards-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

pageBtns.forEach(btn => {
  btn.addEventListener('click', () => setPage(parseInt(btn.dataset.page)));
});

prevBtn.addEventListener('click', () => { if (currentPage > 1) setPage(currentPage - 1); });
nextBtn.addEventListener('click', () => { if (currentPage < totalPages) setPage(currentPage + 1); });

// ========================
// HAMBURGER MENU
// ========================
const hamburger = document.getElementById('hamburger');
let menuOpen = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  const navLinks   = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');

  if (menuOpen) {
    Object.assign(navLinks.style, {
      display: 'flex', flexDirection: 'column', position: 'absolute',
      top: '64px', left: '0', width: '100%', background: '#fff',
      padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
      gap: '18px', zIndex: '200'
    });
    Object.assign(navActions.style, {
      display: 'flex', flexDirection: 'column', position: 'absolute',
      top: '160px', left: '0', width: '100%', background: '#fff',
      padding: '16px 24px 24px', gap: '12px', zIndex: '200',
      borderBottom: '1px solid #e5e7eb'
    });
  } else {
    navLinks.style.display   = 'none';
    navActions.style.display = 'none';
  }
});

// ========================
// SCROLL REVEAL FOR CARDS
// ========================
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.inst-card').forEach((card, i) => {
  card.style.opacity   = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = `opacity 0.5s ${i * 0.07}s ease, transform 0.5s ${i * 0.07}s ease`;
  observer.observe(card);
});

// Wire arrow buttons to open modal
document.querySelectorAll('.arrow-btn').forEach((btn, index) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.inst-card');
    if (card) card.click();
  });
});
