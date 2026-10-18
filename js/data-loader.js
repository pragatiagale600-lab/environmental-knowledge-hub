/**
 * Environmental Knowledge Hub - Centralized Data Loader & Query Engine
 * Loads JSON datasets, indexes records, and provides filtering and stats.
 */

const DataLoader = (() => {
  let categoriesData = null;
  let allCaseStudies = [];
  let isLoaded = false;
  let loadPromise = null;

  const DATA_FILES = [
    'data/disaster.json',
    'data/deforestation.json',
    'data/pollution.json',
    'data/climate-change.json',
    'data/conservation.json'
  ];

  /**
   * Initializes and loads all data sources
   */
  async function init() {
    if (isLoaded) return { categories: categoriesData, caseStudies: allCaseStudies };
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        // Load categories configuration
        const catRes = await fetch('data/categories.json');
        if (!catRes.ok) throw new Error(`Failed to load categories: ${catRes.statusText}`);
        categoriesData = await catRes.json();

        // Load all case study dataset files in parallel
        const results = await Promise.allSettled(
          DATA_FILES.map(file => fetch(file).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status} for ${file}`);
            return r.json();
          }))
        );

        allCaseStudies = [];
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            allCaseStudies.push(...res.value);
          } else {
            console.warn(`Dataset file ${DATA_FILES[idx]} could not be loaded or was empty:`, res.reason);
          }
        });

        isLoaded = true;
        return { categories: categoriesData, caseStudies: allCaseStudies };
      } catch (err) {
        console.error('DataLoader initialization error:', err);
        throw err;
      }
    })();

    return loadPromise;
  }

  function getAllCaseStudies() {
    return allCaseStudies;
  }

  function getCategories() {
    return categoriesData ? categoriesData.categories : [];
  }

  function getCategoryById(catId) {
    if (!categoriesData) return null;
    return categoriesData.categories.find(c => c.id === catId) || null;
  }

  function getSubcategoryById(subId) {
    if (!categoriesData) return null;
    for (const cat of categoriesData.categories) {
      const found = cat.subcategories.find(s => s.id === subId);
      if (found) {
        return { ...found, categoryId: cat.id, categoryTitle: cat.title };
      }
    }
    return null;
  }

  function getCaseStudyById(id) {
    return allCaseStudies.find(item => item.id === id) || null;
  }

  function getCaseStudiesByCategory(catId) {
    return allCaseStudies.filter(item => item.category === catId);
  }

  function getCaseStudiesBySubcategory(subId) {
    return allCaseStudies.filter(item => item.subcategory === subId);
  }

  /**
   * Powerful search and filter function
   */
  function filterCaseStudies({ category, subcategory, year, location, search, verificationStatus } = {}) {
    return allCaseStudies.filter(item => {
      // Category filter
      if (category && category !== 'all' && item.category !== category) {
        return false;
      }

      // Subcategory filter
      if (subcategory && subcategory !== 'all' && item.subcategory !== subcategory) {
        return false;
      }

      // Year filter
      if (year && year !== 'all' && String(item.year) !== String(year)) {
        return false;
      }

      // Location filter
      if (location && location !== 'all') {
        const itemState = item.location?.state?.toLowerCase() || '';
        const itemCountry = item.location?.country?.toLowerCase() || '';
        const targetLoc = location.toLowerCase();
        if (!itemState.includes(targetLoc) && !itemCountry.includes(targetLoc)) {
          return false;
        }
      }

      // Verification filter
      if (verificationStatus && verificationStatus !== 'all') {
        if (item.verificationStatus !== verificationStatus) {
          return false;
        }
      }

      // Free text search (checks title, location, summary, causes, affected areas)
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const summaryMatch = item.summary?.toLowerCase().includes(query);
        const stateMatch = item.location?.state?.toLowerCase().includes(query);
        const countryMatch = item.location?.country?.toLowerCase().includes(query);
        const affectedMatch = item.location?.affectedAreas?.some(a => a.toLowerCase().includes(query));
        const causesMatch = item.causes?.some(c => c.toLowerCase().includes(query));
        const subcatMatch = item.subcategory?.toLowerCase().includes(query);

        if (!titleMatch && !summaryMatch && !stateMatch && !countryMatch && !affectedMatch && !causesMatch && !subcatMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get unique locations (sorted alphabetically)
   */
  function getAvailableLocations() {
    const locSet = new Set();
    allCaseStudies.forEach(item => {
      if (item.location?.state) locSet.add(item.location.state);
      if (item.location?.country && !locSet.has(item.location.country)) {
        // optionally add country if distinct
      }
    });
    return Array.from(locSet).sort();
  }

  /**
   * Get unique years in descending order
   */
  function getAvailableYears() {
    const yearSet = new Set();
    allCaseStudies.forEach(item => {
      if (item.year) yearSet.add(item.year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }

  /**
   * Get exact live counts for all categories and subcategories
   */
  function getCategoryCounts() {
    const counts = {
      total: allCaseStudies.length,
      byCategory: {},
      bySubcategory: {}
    };

    if (categoriesData) {
      categoriesData.categories.forEach(cat => {
        counts.byCategory[cat.id] = 0;
        cat.subcategories.forEach(sub => {
          counts.bySubcategory[sub.id] = 0;
        });
      });
    }

    allCaseStudies.forEach(item => {
      if (counts.byCategory[item.category] !== undefined) {
        counts.byCategory[item.category]++;
      }
      if (counts.bySubcategory[item.subcategory] !== undefined) {
        counts.bySubcategory[item.subcategory]++;
      }
    });

    return counts;
  }

  /**
   * Generates a comprehensive verification status audit summary
   */
  function getAuditSummary() {
    const audit = {
      totalStudies: allCaseStudies.length,
      verifiedCount: 0,
      inReviewCount: 0,
      needsVerificationCount: 0,
      categories: {}
    };

    if (!categoriesData) return audit;

    categoriesData.categories.forEach(cat => {
      audit.categories[cat.id] = {
        title: cat.title,
        total: 0,
        verified: 0,
        inReview: 0,
        needsVerification: 0,
        subcategories: {}
      };

      cat.subcategories.forEach(sub => {
        audit.categories[cat.id].subcategories[sub.id] = {
          name: sub.name,
          total: 0,
          verified: 0,
          inReview: 0,
          needsVerification: 0
        };
      });
    });

    allCaseStudies.forEach(item => {
      const status = item.verificationStatus || 'Needs verification';
      const isVerified = status.includes('Verified');
      const isInReview = status.includes('Review');
      const isPending = !isVerified && !isInReview;

      if (isVerified) audit.verifiedCount++;
      else if (isInReview) audit.inReviewCount++;
      else audit.needsVerificationCount++;

      const catAudit = audit.categories[item.category];
      if (catAudit) {
        catAudit.total++;
        if (isVerified) catAudit.verified++;
        else if (isInReview) catAudit.inReview++;
        else catAudit.needsVerification++;

        const subAudit = catAudit.subcategories[item.subcategory];
        if (subAudit) {
          subAudit.total++;
          if (isVerified) subAudit.verified++;
          else if (isInReview) subAudit.inReview++;
          else subAudit.needsVerification++;
        }
      }
    });

    return audit;
  }

  return {
    init,
    getAllCaseStudies,
    getCategories,
    getCategoryById,
    getSubcategoryById,
    getCaseStudyById,
    getCaseStudiesByCategory,
    getCaseStudiesBySubcategory,
    filterCaseStudies,
    getAvailableLocations,
    getAvailableYears,
    getCategoryCounts,
    getAuditSummary
  };
})();

window.DataLoader = DataLoader;
