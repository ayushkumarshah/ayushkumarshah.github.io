/* ==========================================================================
   Theme layer behaviour: light/dark toggle, active tab, sticky masthead
   shadow, scroll reveal, back-to-top and post reading progress.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var MODES = ['system', 'light', 'dark'];

  function readMode() {
    try {
      var saved = localStorage.getItem('theme');
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch (e) {
      return 'system';
    }
  }

  function applyMode(mode) {
    if (mode === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
    try {
      if (mode === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', mode);
    } catch (e) {}

    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      var label = 'Theme: ' + mode + (mode === 'system' ? ' (follows your device)' : '');
      btn.setAttribute('data-mode', mode);
      btn.setAttribute('title', label + ' · click to change');
      btn.setAttribute('aria-label', 'Color theme: ' + mode);
    }
  }

  // ── Theme toggle: system → light → dark → system ─────────────────────
  var toggle = document.querySelector('.theme-toggle');
  applyMode(readMode());
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = MODES[(MODES.indexOf(readMode()) + 1) % MODES.length];
      applyMode(next);
    });
  }

  // ── Highlight the current tab ────────────────────────────────────────
  var path = window.location.pathname.replace(/index\.html$/, '');
  var items = document.querySelectorAll('#site-nav .masthead__menu-item');
  for (var i = 0; i < items.length; i++) {
    if (items[i].classList.contains('masthead__menu-item--lg')) continue;
    var a = items[i].querySelector('a');
    if (!a) continue;
    // Tab links are absolute (site.url prefix); only same-origin ones count.
    if (a.host && a.host !== window.location.host) continue;
    var target = a.pathname;
    if (target !== '/' && path.indexOf(target) === 0) {
      items[i].classList.add('is-active');
    }
  }
  // Blog posts live under /YYYY/MM/, so light up "Blog Posts" there too.
  if (/^\/\d{4}\/\d{2}\//.test(path)) {
    var blog = document.querySelector('#site-nav a[href$="/year-archive/"]');
    if (blog) blog.parentNode.classList.add('is-active');
  }

  // ── Masthead shadow, back-to-top, reading progress ───────────────────
  var masthead = document.querySelector('.masthead');

  var topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(topBtn);

  var progress = null;
  var article = document.querySelector('article.page .page__content');
  if (article && /^\/\d{4}\/\d{2}\//.test(path)) {
    progress = document.createElement('div');
    progress.className = 'reading-progress';
    document.body.appendChild(progress);
  }

  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || root.scrollTop;
    if (masthead) masthead.classList.toggle('is-scrolled', y > 8);
    topBtn.classList.toggle('is-visible', y > 600);
    if (progress) {
      var max = root.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ── Scroll reveal for cards ──────────────────────────────────────────
  var selector = [
    '.news-item', '.publication-item', '.project-item', '.teaching-item',
    '.review-stat', '.list__item', '.post-item'
  ].join(',');
  var cards = document.querySelectorAll(selector);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

    for (var j = 0; j < cards.length; j++) {
      var rect = cards[j].getBoundingClientRect();
      // Leave anything already on screen alone so nothing flickers on load.
      if (rect.top < window.innerHeight) continue;
      cards[j].classList.add('reveal');
      io.observe(cards[j]);
    }
  }
})();
