/* Shared site header, injected into <div id="site-header" data-active="..."></div>. */
(function () {
  var NAV_ITEMS = [
    { key: 'home', href: 'index.html', label: 'Trang chủ' },
    { key: 'knowledge', href: 'knowledge.html', label: 'Kiến thức' },
    { key: 'projects', href: 'projects.html', label: 'Dự án' },
    { key: 'posts', href: 'posts.html?category=all', label: 'Bài viết' },
  ];

  var TOGGLE_HTML =
    '<button type="button" data-theme-toggle onclick="toggleTheme()" ' +
    'class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-border text-foreground hover:bg-accent transition-colors" ' +
    'aria-label="Chuyển chế độ sáng/tối">' +
    '<span class="material-symbols-outlined !text-lg" data-theme-icon>light_mode</span>' +
    '</button>';

  var BACK_NAV_HTML =
    '<a href="javascript:void(0)" onclick="window.history.back()" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">' +
    '<span class="material-symbols-outlined !text-sm">arrow_back</span> Quay lại</a>' +
    '<span class="text-foreground/10">|</span>' +
    '<a href="index.html" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Về Trang chủ</a>';

  function navLinkHtml(item, isActive) {
    var cls = isActive
      ? 'text-sm font-medium text-foreground transition-colors'
      : 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors';
    return '<a href="' + item.href + '" class="' + cls + '">' + item.label + '</a>';
  }

  window.SiteHeader = {
    /**
     * options.active: 'home' | 'knowledge' | 'posts' | 'reader' (reader = back-navigation, no main nav)
     * options.position: 'fixed' | 'sticky' (default 'sticky')
     * options.extra: extra HTML rendered before the theme toggle (e.g. search box, CTA pill, back links)
     */
    init: function (options) {
      options = options || {};
      var mount = document.getElementById('site-header');
      if (!mount) return;

      var isReader = options.active === 'reader';
      var nav = isReader
        ? ''
        : '<nav class="hidden md:flex items-center gap-8">' +
          NAV_ITEMS.map(function (item) { return navLinkHtml(item, item.key === options.active); }).join('') +
          '</nav>';

      var trailing = isReader ? BACK_NAV_HTML : (options.extra || '');
      var positionClass = options.position === 'fixed' ? 'fixed' : 'sticky';

      mount.outerHTML =
        '<header class="' + positionClass + ' top-0 left-0 z-50 w-full bg-background/70 backdrop-blur-md border-b border-border">' +
        '<div class="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">' +
        '<div class="flex items-center gap-2">' +
        '<a href="index.html" style="font-family: \'Instrument Serif\', serif;" class="text-3xl tracking-tight text-foreground">CORNDEVs<sup class="text-xs">®</sup></a>' +
        '</div>' +
        nav +
        '<div class="flex items-center gap-4">' + trailing + TOGGLE_HTML + '</div>' +
        '</div>' +
        '</header>';

      if (window.syncThemeToggleIcons) window.syncThemeToggleIcons();
    }
  };
})();
