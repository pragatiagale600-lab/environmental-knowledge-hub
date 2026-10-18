/**
 * Environmental Knowledge Hub - Verification Audit & Progress Script
 * Computes live verification counts, subcategory breakdown, and data fidelity metrics.
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
    renderLiveAuditDashboard();
  } catch (err) {
    console.error('Error loading audit data:', err);
  }
});

function renderLiveAuditDashboard() {
  const audit = DataLoader.getAuditSummary();
  const counts = DataLoader.getCategoryCounts();

  // Top metric counters
  const totalStudiesEl = document.getElementById('auditTotalStudies');
  const verifiedEl = document.getElementById('auditVerifiedCount');
  const inReviewEl = document.getElementById('auditInReviewCount');
  const unverifiedEl = document.getElementById('auditUnverifiedCount');

  if (totalStudiesEl) totalStudiesEl.textContent = audit.totalStudies;
  if (verifiedEl) verifiedEl.textContent = audit.verifiedCount;
  if (inReviewEl) inReviewEl.textContent = audit.inReviewCount;
  if (unverifiedEl) unverifiedEl.textContent = audit.needsVerificationCount;

  // Render Table
  const tableBody = document.getElementById('auditTableBody');
  if (!tableBody) return;

  const categories = DataLoader.getCategories();
  let html = '';

  categories.forEach(cat => {
    const catAudit = audit.categories[cat.id];
    if (!catAudit) return;

    // Category Header Row
    html += `
      <tr style="background-color: #f1f6f3; font-weight: 700;">
        <td colspan="6" style="padding: 1rem; color: var(--color-primary-900);">
          <strong>${cat.title}</strong> (${catAudit.total} total documented studies)
        </td>
      </tr>
    `;

    cat.subcategories.forEach(sub => {
      const subAudit = catAudit.subcategories[sub.id] || { total: 0, verified: 0, inReview: 0, needsVerification: 0 };
      const target = 10;
      const pct = Math.min(100, Math.round((subAudit.verified / target) * 100));

      let badgeClass = 'status-verified';
      let badgeLabel = 'Target Met (10+)';
      if (subAudit.verified < target) {
        badgeClass = subAudit.verified >= 5 ? 'status-review' : 'status-unverified';
        badgeLabel = `${subAudit.verified}/10 Verified`;
      }

      html += `
        <tr>
          <td>
            <a href="subcategories.html?category=${cat.id}&subcategory=${sub.id}" style="font-weight: 600;">
              ${sub.name}
            </a>
          </td>
          <td><strong>${subAudit.total}</strong></td>
          <td style="color: var(--color-success); font-weight: 600;">${subAudit.verified}</td>
          <td style="color: var(--color-warning);">${subAudit.inReview}</td>
          <td style="color: var(--text-muted);">${subAudit.needsVerification}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <div class="progress-bar-wrap" style="width: 80px;">
                <div class="progress-bar-fill" style="width: ${pct}%;"></div>
              </div>
              <span class="status-indicator ${badgeClass}" style="font-size: 0.7rem;">
                ${badgeLabel}
              </span>
            </div>
          </td>
        </tr>
      `;
    });
  });

  tableBody.innerHTML = html;
}
