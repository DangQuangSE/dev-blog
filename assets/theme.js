/* Applies the stored/system theme before paint, and exposes toggleTheme() for the UI button. */
(function () {
  var STORAGE_KEY = 'theme';

  function getPreferredTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  function syncThemeToggleIcons() {
    var isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function (el) {
      var label = isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối';
      el.setAttribute('aria-label', label);
      el.title = label;
    });
  }

  applyTheme(getPreferredTheme());

  window.toggleTheme = function () {
    var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    syncThemeToggleIcons();
  };

  window.syncThemeToggleIcons = syncThemeToggleIcons;
  document.addEventListener('DOMContentLoaded', syncThemeToggleIcons);
})();
