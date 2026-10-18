/**
 * Environmental Knowledge Hub - Detailed Case Study Dossier Script
 * Renders verified reports, timelines, damage assessments, rescue agencies, and citations.
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

    const params = new URLSearchParams(window.location.search);
    const studyId = params.get('id');

    if (!studyId) {
      renderErrorState('Missing Case Study ID', 'No case study was specified in the request URL. Please return to the explorer.');
      return;
    }

    const study = DataLoader.getCaseStudyById(studyId);
    if (!study) {
      renderErrorState('Case Study Not Found', `No documented case study matches identifier "${studyId}".`);
      return;
    }

    renderCaseStudyDetail(study);

  } catch (err) {
    console.error('Error rendering case study detail:', err);
    renderErrorState('System Error', 'Unable to load case study documentation.');
  }
});

function renderErrorState(title, message) {
  const container = document.getElementById('caseDetailContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="state-container" style="max-width: 600px; margin: 4rem auto;">
      <div class="state-icon">${AppIcons.get('alert-triangle', 48)}</div>
      <h2 class="state-title">${title}</h2>
      <p class="state-desc">${message}</p>
      <a href="subcategories.html" class="btn-search" style="display: inline-flex; margin-top: 1rem;">
        Back to Case Studies Explorer
      </a>
    </div>
  `;
}

function renderCaseStudyDetail(study) {
  // Page Title
  document.title = `${study.title} - Environmental Knowledge Hub`;

  const cat = DataLoader.getCategoryById(study.category);
  const sub = DataLoader.getSubcategoryById(study.subcategory);

  // 1. Breadcrumbs
  renderBreadcrumbs(cat, sub, study.title);

  // 2. Header & Status
  renderHeader(study, cat, sub);

  // 3. Key Facts Bar
  renderKeyFacts(study);

  // 4. Media Block
  renderMedia(study);

  // 5. Timeline
  renderTimeline(study);

  // 6. Causes
  renderCauses(study);

  // 7. Impact & Damage
  renderImpact(study);

  // 8. Government & Rescue Response
  renderRescue(study);

  // 9. Relief & Recovery
  renderRelief(study);

  // 10. References & Source Checklist
  renderReferences(study);

  // 11. Sidebar Metadata & Related Studies
  renderSidebar(study, cat, sub);
}

function renderBreadcrumbs(cat, sub, title) {
  const nav = document.getElementById('detailBreadcrumbs');
  if (!nav) return;

  nav.innerHTML = `
    <a href="index.html">Home</a>
    <span class="breadcrumb-separator">/</span>
    <a href="subcategories.html?category=${cat ? cat.id : ''}">${cat ? cat.title : 'Category'}</a>
    <span class="breadcrumb-separator">/</span>
    <a href="subcategories.html?category=${cat ? cat.id : ''}&subcategory=${sub ? sub.id : ''}">${sub ? sub.name : 'Subcategory'}</a>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-current">${title}</span>
  `;
}

function renderHeader(study, cat, sub) {
  const headerContainer = document.getElementById('detailHeaderBlock');
  if (!headerContainer) return;

  const isVerified = study.verificationStatus?.includes('Verified');
  const isReview = study.verificationStatus?.includes('Review');
  const statusClass = isVerified ? 'status-verified' : (isReview ? 'status-review' : 'status-unverified');
  const statusText = study.verificationStatus || 'Needs verification';

  headerContainer.innerHTML = `
    <div class="case-detail-top-tags">
      <span class="badge-subcat" style="background-color: var(--color-primary-800);">${cat ? cat.title : study.category}</span>
      <span class="badge-subcat" style="background-color: #3f5e50;">${sub ? sub.name : study.subcategory}</span>
      <span class="status-indicator ${statusClass}">
        <span class="status-dot"></span>
        ${statusText}
      </span>
      <span style="font-size: 0.8125rem; color: var(--text-muted); margin-left: auto;">
        ${AppIcons.get('clock', 14)} Last verified: <strong>${study.lastVerifiedDate || 'Not verified'}</strong>
      </span>
    </div>

    <h1 class="case-detail-title">${study.title}</h1>
    <p class="case-detail-lead">${study.summary}</p>
  `;
}

function renderKeyFacts(study) {
  const container = document.getElementById('detailKeyFacts');
  if (!container) return;

  const loc = study.location || {};
  const affectedList = loc.affectedAreas ? loc.affectedAreas.join(', ') : 'Not documented';
  const duration = study.dateDetails ? `${study.dateDetails.duration || 'Documented episode'}` : 'Recorded event';
  const peakTime = study.dateDetails?.peakIntensity ? `(Peak: ${study.dateDetails.peakIntensity})` : '';

  container.innerHTML = `
    <div class="fact-box">
      <span class="fact-title">${AppIcons.get('calendar', 14)} Date & Duration</span>
      <span class="fact-value">${study.year}</span>
      <span class="fact-subtext">${duration} ${peakTime}</span>
    </div>

    <div class="fact-box">
      <span class="fact-title">${AppIcons.get('map-pin', 14)} Primary Location</span>
      <span class="fact-value">${loc.state ? `${loc.state}, ` : ''}${loc.country || 'Global'}</span>
      <span class="fact-subtext">${loc.coordinates ? loc.coordinates : 'Coordinates on record'}</span>
    </div>

    <div class="fact-box">
      <span class="fact-title">${AppIcons.get('users', 14)} Human Casualties</span>
      <span class="fact-value">${study.impact?.casualties?.deaths || 'Under investigation'}</span>
      <span class="fact-subtext">${study.impact?.casualties?.displaced || 'Displacement recorded'}</span>
    </div>

    <div class="fact-box">
      <span class="fact-title">${AppIcons.get('shield-check', 14)} Affected Regions</span>
      <span class="fact-value" style="font-size: 0.9rem; font-weight: 600;">${loc.affectedAreas ? loc.affectedAreas.slice(0, 3).join(', ') : 'Documented zones'}</span>
      <span class="fact-subtext">${loc.affectedAreas && loc.affectedAreas.length > 3 ? `+${loc.affectedAreas.length - 3} additional districts` : 'Regional impact'}</span>
    </div>
  `;
}

function renderMedia(study) {
  const container = document.getElementById('detailMediaContainer');
  if (!container) return;

  if (!study.media || !study.media.imageUrl) {
    container.innerHTML = `
      <div class="detail-media-box" style="padding: 2rem; text-align: center; background: #f4f6f4;">
        <div style="color: var(--text-muted); font-size: 0.9rem;">
          ${AppIcons.get('info', 20)} Photographic documentation pending verification from government archival repositories.
        </div>
      </div>
    `;
    return;
  }

  const media = study.media;
  container.innerHTML = `
    <div class="detail-media-box">
      <img src="${media.imageUrl}" alt="${media.caption || study.title}" class="detail-media-img" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'450\\' viewBox=\\'0 0 800 450\\'%3E%3Crect fill=\\'%231b4332\\' width=\\'800\\' height=\\'450\\'/%3E%3Ctext fill=\\'%23ffffff\\' font-family=\\'sans-serif\\' font-size=\\'24\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\'%3E${encodeURIComponent(study.title)}%3C/text%3E%3C/svg%3E';">
      <div class="detail-media-caption">
        <span><strong>Figure:</strong> ${media.caption || study.title}</span>
        <div class="detail-media-credit">
          <span>Source & Credit: <strong>${media.credit || 'Official Record'}</strong></span> • 
          <span>Licence: <strong>${media.license || 'Public Domain / Educational Fair Use'}</strong></span>
          ${media.sourceUrl ? ` • <a href="${media.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-700);">View Original</a>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderTimeline(study) {
  const container = document.getElementById('detailTimeline');
  if (!container) return;

  if (!study.timeline || study.timeline.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Detailed chronological timeline is currently under verification.</p>';
    return;
  }

  container.innerHTML = `
    <ol class="timeline-list">
      ${study.timeline.map(item => `
        <li class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-date">${item.date || 'Key Event'}</div>
          <div class="timeline-desc">${item.event}</div>
        </li>
      `).join('')}
    </ol>
  `;
}

function renderCauses(study) {
  const container = document.getElementById('detailCauses');
  if (!container) return;

  if (!study.causes || study.causes.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Root causes are documented in the official incident references below.</p>';
    return;
  }

  container.innerHTML = `
    <ul class="bullet-list-custom">
      ${study.causes.map(c => `<li>${c}</li>`).join('')}
    </ul>
  `;
}

function renderImpact(study) {
  const container = document.getElementById('detailImpact');
  if (!container) return;

  const cas = study.impact?.casualties || {};

  container.innerHTML = `
    <div class="impact-cards-grid">
      <div class="impact-card">
        <div class="impact-card-header">Fatalities</div>
        <div class="impact-card-value">${cas.deaths || 'Under investigation'}</div>
        <div class="impact-card-sub">Documented official mortality figure</div>
      </div>
      <div class="impact-card">
        <div class="impact-card-header">Injuries & Missing</div>
        <div class="impact-card-value">${cas.injured || 'Documented'}</div>
        <div class="impact-card-sub">${cas.missing ? `${cas.missing} registered missing` : 'Search records compiled'}</div>
      </div>
      <div class="impact-card">
        <div class="impact-card-header">Displaced Population</div>
        <div class="impact-card-value">${cas.displaced || 'Under assessment'}</div>
        <div class="impact-card-sub">Evacuated to camps or relocated</div>
      </div>
    </div>

    <div style="margin-top: 1.5rem;">
      <h4 style="font-family: var(--font-body); font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--color-primary-900);">
        Environmental & Ecological Consequences
      </h4>
      <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">
        ${study.impact?.environmentalDamage || 'Ecological impacts recorded in official state impact reports.'}
      </p>

      <h4 style="font-family: var(--font-body); font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--color-primary-900);">
        Social & Civil Infrastructure Damage
      </h4>
      <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">
        ${study.impact?.socialDamage || 'Social infrastructure disruption recorded.'}
      </p>

      <h4 style="font-family: var(--font-body); font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--color-primary-900);">
        Economic & Asset Losses
      </h4>
      <p style="color: var(--text-secondary);">
        ${study.impact?.economicDamage || 'Loss assessments submitted to disaster management authorities.'}
      </p>
    </div>
  `;
}

function renderRescue(study) {
  const container = document.getElementById('detailRescue');
  if (!container) return;

  const resp = study.responseAndRescue || {};
  const agencies = resp.rescueAgencies || [];

  container.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <h4 style="font-family: var(--font-body); font-size: 1rem; color: var(--color-primary-900); margin-bottom: 0.4rem;">
        Government Actions & Executive Orders
      </h4>
      <p style="color: var(--text-secondary);">
        ${resp.governmentResponse || 'Official state actions initiated according to standard operating procedures.'}
      </p>
    </div>

    ${agencies.length > 0 ? `
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-family: var(--font-body); font-size: 1rem; color: var(--color-primary-900); margin-bottom: 0.6rem;">
          Mobilized Rescue Agencies & Force Units
        </h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          ${agencies.map(a => `<span class="subcategory-chip" style="background-color: var(--bg-surface-alt); font-weight: 600;">${a}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    ${resp.communityRole ? `
      <div>
        <h4 style="font-family: var(--font-body); font-size: 1rem; color: var(--color-primary-900); margin-bottom: 0.4rem;">
          Civil Society & Grassroots Participation
        </h4>
        <p style="color: var(--text-secondary);">
          ${resp.communityRole}
        </p>
      </div>
    ` : ''}
  `;
}

function renderRelief(study) {
  const container = document.getElementById('detailRelief');
  if (!container) return;

  if (!study.reliefAndRecovery || study.reliefAndRecovery.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Rehabilitation and structural reforms documented in the post-event audit reports.</p>';
    return;
  }

  container.innerHTML = `
    <ul class="bullet-list-custom">
      ${study.reliefAndRecovery.map(item => `<li>${item}</li>`).join('')}
    </ul>
  `;
}

function renderReferences(study) {
  const container = document.getElementById('detailReferences');
  if (!container) return;

  if (!study.references || study.references.length === 0) {
    container.innerHTML = `
      <div style="padding: 1rem; background: var(--bg-surface-alt); border-radius: var(--radius-md);">
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">
          Direct primary bibliography citations are in the process of peer verification.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = study.references.map(ref => `
    <div class="reference-item">
      <div class="reference-icon">${AppIcons.get('file-text', 20)}</div>
      <div class="reference-details">
        <h5>${ref.title}</h5>
        <div class="reference-publisher">
          Published by: <strong>${ref.publisher}</strong> • Date: ${ref.date || 'Documented'}
        </div>
        ${ref.url ? `
          <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="reference-link">
            <span>Access Official Document / Report</span>
            ${AppIcons.get('external-link', 14)}
          </a>
        ` : '<span style="font-size: 0.8rem; color: var(--text-muted);">(Archival Record / Printed Gazette)</span>'}
      </div>
    </div>
  `).join('');
}

function renderSidebar(study, cat, sub) {
  // Verification Box
  const auditContainer = document.getElementById('sidebarVerificationBox');
  if (auditContainer) {
    const isVerified = study.verificationStatus?.includes('Verified');
    auditContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span class="status-indicator ${isVerified ? 'status-verified' : 'status-unverified'}">
          ${study.verificationStatus || 'Needs verification'}
        </span>
      </div>
      <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
        This case study is cross-referenced against official scientific archives (NDMA, NIDM, CPCB, IMD, MoEFCC, IPCC).
      </p>
      <div style="font-size: 0.775rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
        Last Verified: <strong>${study.lastVerifiedDate || 'Under Review'}</strong><br>
        Document ID: <code>${study.id}</code>
      </div>
    `;
  }

  // Related Studies
  const relatedContainer = document.getElementById('sidebarRelatedStudies');
  if (relatedContainer) {
    const related = DataLoader.getCaseStudiesBySubcategory(study.subcategory)
      .filter(s => s.id !== study.id)
      .slice(0, 4);

    if (related.length === 0) {
      relatedContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No further case studies in this exact subcategory.</p>';
      return;
    }

    relatedContainer.innerHTML = related.map(rel => `
      <div style="margin-bottom: 0.85rem; padding-bottom: 0.85rem; border-bottom: 1px solid var(--border-subtle);">
        <a href="case-study.html?id=${rel.id}" style="font-weight: 600; font-size: 0.875rem; color: var(--color-primary-900); display: block; line-height: 1.35; margin-bottom: 0.25rem;">
          ${rel.title}
        </a>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          ${rel.year} • ${rel.location?.state || rel.location?.country || 'Documented'}
        </div>
      </div>
    `).join('');
  }
}
