/**
 * Environmental Knowledge Hub - Subcategories & Case Studies Explorer Script
 * Supports multi-filter, search, dynamic subcategory pills, and grid rendering.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile nav toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const siteNav = document.getElementById('siteNav');
  if (mobileToggle && siteNav) {
    mobileToggle.addEventListener('click', () => {
      siteNav.classList.toggle('open');
    });
  }

  try {
    await DataLoader.init();

    // Parse URL Query parameters
    const params = new URLSearchParams(window.location.search);
    const activeCategory = params.get('category') || 'all';
    const activeSubcategory = params.get('subcategory') || 'all';
    const activeSearch = params.get('search') || '';
    const activeLocation = params.get('location') || 'all';
    const activeYear = params.get('year') || 'all';
    const activeStatus = params.get('status') || 'all';

    // Populate filter controls
    populateFilterControls(activeCategory, activeLocation, activeYear, activeStatus);

    if (activeSearch) {
      const searchBox = document.getElementById('explorerSearchInput');
      if (searchBox) searchBox.value = activeSearch;
    }

    // Render category hero header info
    renderCategoryHeader(activeCategory, activeSubcategory);

    // Render Subcategory Tabs/Pills
    renderSubcategoryPills(activeCategory, activeSubcategory);

    // Initial render of filtered results
    applyFiltersAndRender();

    // Attach event listeners for real-time filtering
    attachFilterListeners();

  } catch (err) {
    console.error('Error loading subcategories explorer:', err);
    const container = document.getElementById('caseStudiesContainer');
    if (container) {
      container.innerHTML = `
        <div class="state-container">
          <div class="state-title">Error Loading Repository</div>
          <p class="state-desc">${err.message}</p>
        </div>
      `;
    }
  }
});

function renderCategoryHeader(activeCategory, activeSubcategory) {
  const titleEl = document.getElementById('explorerTitle');
  const descEl = document.getElementById('explorerDesc');
  const breadcrumbSub = document.getElementById('breadcrumbSubcat');
  const breadcrumbCat = document.getElementById('breadcrumbCat');

  if (activeCategory === 'all') {
    if (titleEl) titleEl.textContent = 'All Environmental Case Studies';
    if (descEl) descEl.textContent = 'Browse the complete academic repository of verified environmental disasters, industrial crises, climate events, and conservation breakthroughs.';
    if (breadcrumbCat) breadcrumbCat.textContent = 'All Topics';
    if (breadcrumbSub) breadcrumbSub.style.display = 'none';
    return;
  }

  const cat = DataLoader.getCategoryById(activeCategory);
  if (!cat) return;

  if (breadcrumbCat) {
    breadcrumbCat.textContent = cat.title;
    breadcrumbCat.href = `subcategories.html?category=${cat.id}`;
  }

  if (activeSubcategory && activeSubcategory !== 'all') {
    const sub = cat.subcategories.find(s => s.id === activeSubcategory);
    if (sub) {
      if (titleEl) titleEl.textContent = `${sub.name} Case Studies`;
      if (descEl) descEl.textContent = sub.description;
      if (breadcrumbSub) {
        breadcrumbSub.textContent = sub.name;
        breadcrumbSub.style.display = 'inline';
      }
      return;
    }
  }

  if (titleEl) titleEl.textContent = `${cat.title} Case Studies`;
  if (descEl) descEl.textContent = cat.shortDescription;
  if (breadcrumbSub) breadcrumbSub.style.display = 'none';
}

function renderSubcategoryPills(activeCategory, activeSubcategory) {
  const container = document.getElementById('subcategoryPillsContainer');
  if (!container) return;

  const counts = DataLoader.getCategoryCounts();
  let subcategories = [];

  if (activeCategory === 'all') {
    DataLoader.getCategories().forEach(c => {
      subcategories.push(...c.subcategories.map(s => ({ ...s, catId: c.id })));
    });
  } else {
    const cat = DataLoader.getCategoryById(activeCategory);
    if (cat) {
      subcategories = cat.subcategories.map(s => ({ ...s, catId: cat.id }));
    }
  }

  const allCount = activeCategory === 'all' 
    ? DataLoader.getAllCaseStudies().length 
    : (counts.byCategory[activeCategory] || 0);

  let pillsHtml = `
    <button type="button" class="pill-item ${activeSubcategory === 'all' ? 'active' : ''}" data-sub="all">
      <span>All in this Section</span>
      <span class="pill-badge">${allCount}</span>
    </button>
  `;

  subcategories.forEach(sub => {
    const subCount = counts.bySubcategory[sub.id] || 0;
    const isActive = activeSubcategory === sub.id;
    pillsHtml += `
      <button type="button" class="pill-item ${isActive ? 'active' : ''}" data-sub="${sub.id}" data-cat="${sub.catId}">
        <span>${sub.name}</span>
        <span class="pill-badge">${subCount}</span>
      </button>
    `;
  });

  container.innerHTML = pillsHtml;

  // Add click handlers
  container.querySelectorAll('.pill-item').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.pill-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const chosenSub = btn.getAttribute('data-sub');
      const chosenCat = btn.getAttribute('data-cat');
      
      const subSelect = document.getElementById('filterSubcategory');
      if (subSelect) subSelect.value = chosenSub;

      // Update URL query state without reload
      const url = new URL(window.location);
      if (chosenSub === 'all') {
        url.searchParams.delete('subcategory');
      } else {
        url.searchParams.set('subcategory', chosenSub);
        if (chosenCat) url.searchParams.set('category', chosenCat);
      }
      window.history.pushState({}, '', url);

      applyFiltersAndRender();
    });
  });
}

function populateFilterControls(activeCat, activeLoc, activeYr, activeStat) {
  const catSelect = document.getElementById('filterCategory');
  const subSelect = document.getElementById('filterSubcategory');
  const locSelect = document.getElementById('filterLocation');
  const yrSelect = document.getElementById('filterYear');
  const statSelect = document.getElementById('filterVerification');

  if (catSelect) {
    const categories = DataLoader.getCategories();
    catSelect.innerHTML = '<option value="all">All Topics</option>' +
      categories.map(c => `<option value="${c.id}" ${c.id === activeCat ? 'selected' : ''}>${c.title}</option>`).join('');
  }

  updateSubcategoryDropdown(activeCat);

  if (locSelect) {
    const locations = DataLoader.getAvailableLocations();
    locSelect.innerHTML = '<option value="all">All Locations</option>' +
      locations.map(loc => `<option value="${loc}" ${loc === activeLoc ? 'selected' : ''}>${loc}</option>`).join('');
  }

  if (yrSelect) {
    const years = DataLoader.getAvailableYears();
    yrSelect.innerHTML = '<option value="all">All Years</option>' +
      years.map(y => `<option value="${y}" ${String(y) === String(activeYr) ? 'selected' : ''}>${y}</option>`).join('');
  }

  if (statSelect && activeStat !== 'all') {
    statSelect.value = activeStat;
  }
}

function updateSubcategoryDropdown(selectedCatId) {
  const subSelect = document.getElementById('filterSubcategory');
  if (!subSelect) return;

  let subs = [];
  if (selectedCatId === 'all') {
    DataLoader.getCategories().forEach(c => {
      subs.push(...c.subcategories);
    });
  } else {
    const cat = DataLoader.getCategoryById(selectedCatId);
    if (cat) subs = cat.subcategories;
  }

  const currentSub = new URLSearchParams(window.location.search).get('subcategory') || 'all';
  subSelect.innerHTML = '<option value="all">All Subcategories</option>' +
    subs.map(s => `<option value="${s.id}" ${s.id === currentSub ? 'selected' : ''}>${s.name}</option>`).join('');
}

function attachFilterListeners() {
  const searchInput = document.getElementById('explorerSearchInput');
  const catSelect = document.getElementById('filterCategory');
  const subSelect = document.getElementById('filterSubcategory');
  const locSelect = document.getElementById('filterLocation');
  const yrSelect = document.getElementById('filterYear');
  const statSelect = document.getElementById('filterVerification');
  const resetBtn = document.getElementById('btnResetExplorerFilters');

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyFiltersAndRender();
      }, 250);
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const newCat = catSelect.value;
      updateSubcategoryDropdown(newCat);
      renderSubcategoryPills(newCat, 'all');
      renderCategoryHeader(newCat, 'all');
      applyFiltersAndRender();
    });
  }

  [subSelect, locSelect, yrSelect, statSelect].forEach(el => {
    if (el) el.addEventListener('change', applyFiltersAndRender);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = 'all';
      if (subSelect) subSelect.value = 'all';
      if (locSelect) locSelect.value = 'all';
      if (yrSelect) yrSelect.value = 'all';
      if (statSelect) statSelect.value = 'all';
      
      updateSubcategoryDropdown('all');
      renderSubcategoryPills('all', 'all');
      renderCategoryHeader('all', 'all');
      
      window.history.pushState({}, '', 'subcategories.html');
      applyFiltersAndRender();
    });
  }
}

function applyFiltersAndRender() {
  const search = document.getElementById('explorerSearchInput')?.value.trim() || '';
  const category = document.getElementById('filterCategory')?.value || 'all';
  const subcategory = document.getElementById('filterSubcategory')?.value || 'all';
  const location = document.getElementById('filterLocation')?.value || 'all';
  const year = document.getElementById('filterYear')?.value || 'all';
  const verificationStatus = document.getElementById('filterVerification')?.value || 'all';

  const results = DataLoader.filterCaseStudies({
    category,
    subcategory,
    location,
    year,
    search,
    verificationStatus
  });

  renderResults(results);
}

function renderResults(results) {
  const container = document.getElementById('caseStudiesContainer');
  const countBadge = document.getElementById('resultsCountBadge');

  if (countBadge) {
    countBadge.textContent = `Showing ${results.length} Documented Case ${results.length === 1 ? 'Study' : 'Studies'}`;
  }

  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `
      <div class="state-container" style="grid-column: 1 / -1;">
        <div class="state-icon">${AppIcons.get('search', 48)}</div>
        <h3 class="state-title">No Case Studies Match Your Filter</h3>
        <p class="state-desc">Try resetting your filters or using broader search terms such as region name, disaster type, or river basin.</p>
        <button class="btn-search" style="margin: 0 auto;" onclick="document.getElementById('btnResetExplorerFilters').click();">
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = results.map(study => createCaseCardHtml(study)).join('');
}
