// ============================================================
// app.js - Router & Application Initialization
// ============================================================

const App = (() => {

  function init() {
    window.addEventListener('hashchange', handleRoute);
    document.addEventListener('click', handleGlobalClick);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash || '#/';

    // Guard routes
    if (hash === '#/create' && (!Auth.isAdmin())) {
      UI.showToast('Bạn không có quyền tạo giải đấu. Cần quyền Admin!', 'error');
      window.location.hash = '#/';
      return;
    }
    if (hash === '#/admin-theme' && (!Auth.isAdmin())) {
      UI.showToast('Truy cập bị từ chối!', 'error');
      window.location.hash = '#/';
      return;
    }

    if (hash === '#/' || hash === '#' || hash === '') {
      UI.renderDashboard();
    } else if (hash === '#/create') {
      UI.renderCreateForm();
    } else if (hash === '#/admin-theme') {
      UI.renderAdminTheme();
    } else if (hash === '#/stats') {
      UI.renderStatsPage();
    } else if (hash === '#/search') {
      UI.renderSearchPage();
    } else if (hash === '#/profile') {
      UI.renderProfilePage();
    } else if (hash.startsWith('#/tournament/')) {
      const id = hash.split('/').pop();
      UI.renderTournamentDetail(id);
    } else {
      UI.renderDashboard();
    }

    updateActiveNav();
    UI.updateAuthUI();
    window.scrollTo(0, 0);
  }

  function updateActiveNav() {
    const hash = window.location.hash || '#/';

    // Top navbar
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash || (href === '#/' && (hash === '#' || hash === ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Bottom navbar
    const bnavMap = {
      'bnav-home':   ['#/', '#', ''],
      'bnav-create': ['#/create'],
      'bnav-stats':  ['#/stats'],
      'bnav-search': ['#/search'],
    };
    Object.entries(bnavMap).forEach(([id, hashes]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const isActive = hashes.some(h => h === hash) ||
        (id === 'bnav-home' && hash.startsWith('#/tournament/'));
      el.classList.toggle('active', isActive);
    });
  }


  function handleGlobalClick(e) {
    // Close mobile nav on link click
    if (e.target.closest('.nav-link')) {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) navLinks.classList.remove('open');
    }

    // Close modal on overlay click
    if (e.target.classList.contains('modal-overlay')) {
      UI.hideModal();
    }
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  return { init, navigate };
})();

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);
