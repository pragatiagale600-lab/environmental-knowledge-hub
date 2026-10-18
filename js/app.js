/**
 * Environmental Knowledge Hub - Main Application Script (Home Dashboard)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile navigation toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const siteNav = document.getElementById('siteNav');
  if (mobileToggle && siteNav) {
    mobileToggle.addEventListener('click', () => {
      siteNav.classList.toggle('open');
    });
  }

  // Initialize data loader
  try {
    await DataLoader.init();
const categories = DataLoader.getCategories();
const caseStudies = DataLoader.getAllCaseStudies();
    
    // Update live metrics on hero bar
    updateHeroStats();

    // Render 5 Main Topic Cards
    renderTopicCards(categories);

    // Load photos from Wikimedia API after topic cards render
if (window.EnvironmentalAPI) {
  window.EnvironmentalAPI.loadTopicImages().catch(error => {
    console.error("Photo API error:", error);
  });
}
    // Populate search filter dropdowns
    populateSearchFilters();

    // Render Recent Verified Case Studies
    renderRecentStudies();

    // Load photos for Featured Case Studies
if (window.EnvironmentalAPI?.loadCaseStudyImages) {
  window.EnvironmentalAPI.loadCaseStudyImages();
}
    // Setup search listener
    setupSearchForm();

  } catch (error) {
    console.error('Error initializing Home Dashboard:', error);
    const container = document.getElementById('topicsGrid');
    if (container) {
      container.innerHTML = `
        <div class="state-container">
          <div class="state-title">Dataset Loading Error</div>
          <p class="state-desc">Unable to load the environmental case studies archive. Please verify data files.</p>
        </div>
      `;
    }
  }
});

function updateHeroStats() {
  const counts = DataLoader.getCategoryCounts();
  const audit = DataLoader.getAuditSummary();

  const totalEl = document.getElementById('statTotalStudies');
  const catEl = document.getElementById('statTotalCategories');
  const subcatEl = document.getElementById('statTotalSubcategories');
  const verifiedEl = document.getElementById('statVerifiedRatio');

  if (totalEl) totalEl.textContent = counts.total;
  if (catEl) catEl.textContent = DataLoader.getCategories().length;
  
  let subcatCount = 0;
  DataLoader.getCategories().forEach(c => { subcatCount += c.subcategories.length; });
  if (subcatEl) subcatEl.textContent = subcatCount;

  if (verifiedEl) {
    const pct = counts.total > 0 ? Math.round((audit.verifiedCount / counts.total) * 100) : 0;
    verifiedEl.textContent = `${audit.verifiedCount} (${pct}%)`;
  }
}


function renderTopicCards(categories) {
  const grid = document.getElementById('topicsGrid');
  if (!grid) return;

  const counts = DataLoader.getCategoryCounts();

  grid.innerHTML = categories.map(cat => {
    const studyCount = counts.byCategory[cat.id] || 0;
    const iconSvg = AppIcons.get(cat.icon, 24);

    const subchips = cat.subcategories.map(sub => {
      const subCount = counts.bySubcategory[sub.id] || 0;

      return `
        <a href="subcategories.html?category=${cat.id}&subcategory=${sub.id}"
           class="subcategory-chip"
           onclick="event.stopPropagation();">
          ${sub.name}
          <span style="opacity: 0.7;">(${subCount})</span>
        </a>
      `;
    }).join('');

    return `
      <div class="topic-card"
           data-cat="${cat.id}"
           onclick="window.location.href='subcategories.html?category=${cat.id}';"
           style="cursor: pointer;">

        <div class="topic-card-header">
          <div class="topic-icon-badge">
            ${iconSvg}
          </div>
          <span class="topic-count-pill">
            ${studyCount} Case ${studyCount === 1 ? 'Study' : 'Studies'}
          </span>
        </div>

        <h3 class="topic-title">${cat.title}</h3>

        <p class="topic-desc">${cat.shortDescription}</p>

        <div class="topic-subcategories-list">
          ${subchips}
        </div>

        <div class="topic-card-footer">
          <span>Explore Subcategories</span>
          ${AppIcons.get('arrow-right', 18)}
        </div>

      </div>
    `;
  }).join('');
}

function populateSearchFilters() {
  const catSelect = document.getElementById('filterCategory');
  const locSelect = document.getElementById('filterLocation');
  const yearSelect = document.getElementById('filterYear');

  if (catSelect) {
    const categories = DataLoader.getCategories();
    catSelect.innerHTML = '<option value="all">All Main Categories</option>' + 
      categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  }

  if (locSelect) {
    const locations = DataLoader.getAvailableLocations();
    locSelect.innerHTML = '<option value="all">All Locations / States</option>' +
      locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
  }

  if (yearSelect) {
    const years = DataLoader.getAvailableYears();
    yearSelect.innerHTML = '<option value="all">All Documented Years</option>' +
      years.map(y => `<option value="${y}">${y}</option>`).join('');
  }
}

function setupSearchForm() {
  const form = document.getElementById('homeSearchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('mainSearchInput')?.value.trim() || '';
    const cat = document.getElementById('filterCategory')?.value || 'all';
    const loc = document.getElementById('filterLocation')?.value || 'all';
    const yr = document.getElementById('filterYear')?.value || 'all';

    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (cat !== 'all') params.set('category', cat);
    if (loc !== 'all') params.set('location', loc);
    if (yr !== 'all') params.set('year', yr);

    window.location.href = `subcategories.html?${params.toString()}`;
  });

  const resetBtn = document.getElementById('btnResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('mainSearchInput').value = '';
      document.getElementById('filterCategory').value = 'all';
      document.getElementById('filterLocation').value = 'all';
      document.getElementById('filterYear').value = 'all';
    });
  }
}

function renderRecentStudies() {
  const container = document.getElementById('recentStudiesGrid');
  if (!container) return;

  const allStudies = DataLoader.getAllCaseStudies();
  if (allStudies.length === 0) {
    container.innerHTML = `
      <div class="state-container">
        <p class="state-desc">No case studies loaded yet.</p>
      </div>
    `;
    return;
  }

  // Pick top 6 verified case studies across distinct categories
  const featured = allStudies.slice(0, 6);

  container.innerHTML = featured.map(study => createCaseCardHtml(study)).join('');
}

function createCaseCardHtml(study) {
  const statusClass = study.verificationStatus?.includes('Verified')
    ? 'status-verified'
    : (study.verificationStatus?.includes('Review')
        ? 'status-review'
        : 'status-unverified');

  const statusText = study.verificationStatus || 'Needs verification';

  const subcatInfo = DataLoader.getSubcategoryById(study.subcategory);
  const subcatName = subcatInfo ? subcatInfo.name : (study.subcategory || 'Environment');

  // Use existing category images instead of broken JSON image paths
  const categoryImages = {
    disaster: 'assets/images/disaster.jpg',
    pollution: 'assets/images/pollution.jpg',
    'climate-change': 'assets/images/climate-change.jpg',
    deforestation: 'assets/images/deforestation.jpg',
    conservation: 'assets/images/conservation.jpg'
  };

  const categoryId = study.category || study.categoryId || 'conservation';

  // Always use the existing image for this category
  const imgUrl = categoryImages[categoryId] || categoryImages.conservation;
  const imgCaption = study.title || 'Environmental Case Study';

  return `
    <a href="case-study.html?id=${encodeURIComponent(study.id)}"
       class="case-card"
       data-category="${categoryId}">

      <div class="case-card-image-wrap">
        <img
          src="${imgUrl}"
          alt="${imgCaption}"
          class="case-card-img"
          onerror="this.onerror=null; this.style.display='none'; this.parentElement.style.background='#e8f0e9';"
        >

        <div class="case-card-badge-overlay">
          <span class="badge-subcat">${subcatName}</span>
          <span class="badge-year">${study.year || 'N/A'}</span>
        </div>
      </div>

      <div class="case-card-body">
        <div class="case-card-meta">
          <span class="case-card-meta-item">
            ${AppIcons.get('map-pin', 14)}
            ${study.location?.state || study.location?.country || 'Documented Site'}
          </span>

          <span class="case-card-meta-item">
            ${AppIcons.get('calendar', 14)}
            ${study.year || 'N/A'}
          </span>
        </div>

        <h4 class="case-card-title">${study.title || 'Untitled Case Study'}</h4>
        <p class="case-card-summary">${study.summary || 'Environmental case study details.'}</p>

        <div class="case-card-metrics-preview">
          <div class="metric-mini">
            <span class="metric-mini-label">Casualties / Impact</span>
            <span class="metric-mini-val">
              ${study.impact?.casualties?.deaths || study.impact?.casualties?.displaced || 'Documented'}
            </span>
          </div>

          <div class="metric-mini">
            <span class="metric-mini-label">Verification</span>
            <span class="metric-mini-val" style="color: var(--color-primary-700);">
              ${study.lastVerifiedDate || 'Recent'}
            </span>
          </div>
        </div>

        <div class="case-card-footer">
          <span class="status-indicator ${statusClass}">
            <span class="status-dot"></span>
            ${statusText}
          </span>

          <span class="btn-read-case">
            Full Dossier ${AppIcons.get('arrow-right', 14)}
          </span>
        </div>
      </div>
    </a>
  `;
}

window.createCaseCardHtml = createCaseCardHtml;