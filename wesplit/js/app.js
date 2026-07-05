/* ============================================================
   GoPlaces – Main App Controller
   ============================================================ */
'use strict';

const App = (() => {
  let _currentPage = 'dashboard';

    /* ---- Init ---- */
  function init() {
    // Initialize subsystems
    Storage.initDB();
    Modal.init();
    Auth.init();
    Sheets.setupAutoSync();
    Pages.setupForms();

    // Check auth state
    setTimeout(() => {
      const user = Storage.User.get();
      if (user) {
        onAuthSuccess(user);
      } else {
        showAuthScreen();
      }
    }, 2200); // After splash animation

    // Theme
    const settings = Storage.Settings.get();
    applyTheme(settings.theme || 'light');

    // Event listeners
    setupNavigation();
    setupHeaderActions();

    // Handle back/forward browser navigation
    window.addEventListener('popstate', (e) => {
      if (e.state?.page) navigate(e.state.page);
    });

    // Service Worker registration (for offline caching)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // SW optional – app works without it
      });
    }
  }

  /* ---- Auth success ---- */
  function onAuthSuccess(user) {
    updateUserUI();
    document.getElementById('auth-screen')?.classList.add('hidden');
    document.getElementById('app-screen')?.classList.remove('hidden');
    navigate(_currentPage || 'dashboard');
    NotifPanel.updateBadge();
  }

  /* ---- Show auth screen ---- */
  function showAuthScreen() {
    document.getElementById('auth-screen')?.classList.remove('hidden');
    document.getElementById('app-screen')?.classList.add('hidden');
  }

  /* ---- Update user UI ---- */
  function updateUserUI() {
    const user = Storage.User.get();
    if (!user) return;
    const initial = (user.avatar || user.name?.[0] || 'U').toUpperCase();
    const el = document.getElementById('nav-username');
    if (el) el.textContent = user.name || 'Traveler';
    const coinsEl = document.getElementById('coins-count');
    if (coinsEl) coinsEl.textContent = user.coins || 0;
    const navAv = document.getElementById('nav-avatar');
    if (navAv) navAv.textContent = initial;
    const headAv = document.getElementById('header-avatar');
    if (headAv) headAv.textContent = initial;
  }

  /* ---- Navigation ---- */
  function setupNavigation() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-link');
      if (!link) return;
      e.preventDefault();
      const page = link.dataset.page;
      if (page) {
        navigate(page);
        closeSidebar();
      }
    });
  }

  function navigate(page) {
    _currentPage = page;
    App.currentPage = page;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });

    // Push history
    history.pushState({ page }, '', '#' + page);

    // Render page
    Pages.render(page);
  }

  function setTitle(title, subtitle = '') {
    const t = document.getElementById('page-title');
    const s = document.getElementById('page-subtitle');
    if (t) t.textContent = title;
    if (s) s.textContent = subtitle;
  }

  /* ---- Header actions ---- */
  function setupHeaderActions() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      const next    = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      Storage.Settings.update({ theme: next });
    });

    // Notifications
    document.getElementById('notif-btn')?.addEventListener('click', NotifPanel.toggle);

    // Hamburger
    document.getElementById('hamburger-btn')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    // Sheets sync button
    document.getElementById('sheets-sync-btn')?.addEventListener('click', () => Sheets.syncAll());
    document.getElementById('header-avatar')?.addEventListener('click', () => navigate('profile'));

    // Sign out
    document.getElementById('signout-btn')?.addEventListener('click', Auth.signOut);
  }

  /* ---- Sidebar ---- */
  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.remove('hidden');
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
  }

  /* ---- Theme ---- */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = theme === 'dark';
  }

  function toggleTheme(isDark) {
    applyTheme(isDark ? 'dark' : 'light');
    Storage.Settings.update({ theme: isDark ? 'dark' : 'light' });
  }

  const AppAPI = { init, onAuthSuccess, showAuthScreen, navigate, setTitle, updateUserUI, toggleTheme, currentPage: 'dashboard' };
  return AppAPI;
})();

window.App = App;

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', App.init);

/* ---- Global keyboard shortcuts ---- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Modal.close();
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
  }
});
