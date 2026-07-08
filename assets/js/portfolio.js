(function () {
  'use strict';

  var THEME_KEY = 'portfolio-theme';

  function initTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeColor(theme);
  }

  function updateThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#f8f8fc');
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeColor(next);
  }

  function initNav() {
    var links = document.querySelectorAll('[data-nav]');
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var navLinks = document.querySelector('.nav-dock__links');
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var el = document.querySelector(id);
        if (el) sections.push({ link: link, el: el });
      }
    });

    function setActive() {
      var scrollY = window.scrollY + 120;
      var current = sections[0];

      sections.forEach(function (item) {
        if (item.el.offsetTop <= scrollY) current = item;
      });

      links.forEach(function (l) { l.classList.remove('is-active'); });
      if (current) current.link.classList.add('is-active');
    }

    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      links.forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('is-open');
          menuToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }

  function initReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  function initSkillBars() {
    var items = document.querySelectorAll('.skill-item');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (item) {
        var fill = item.querySelector('.skill-item__fill');
        if (fill) fill.style.width = item.getAttribute('data-level');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var fill = entry.target.querySelector('.skill-item__fill');
            var level = entry.target.getAttribute('data-level');
            if (fill && level) fill.style.width = level;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    items.forEach(function (item) { observer.observe(item); });
  }

  function initGitHub() {
    if (typeof GitHubCalendar === 'function') {
      GitHubCalendar('.calendar', 'kingsuk', {
        responsive: true,
        tooltips: true
      });
    }

    if (typeof GitHubActivity !== 'undefined' && GitHubActivity.feed) {
      GitHubActivity.feed({
        username: 'kingsuk',
        selector: '#feed',
        limit: 12
      });
    }
  }

  function initYear() {
    var el = document.querySelector('[data-year]');
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNav();
    initReveal();
    initSkillBars();
    initGitHub();
    initYear();

    var themeBtn = document.querySelector('[data-theme-toggle]');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  });
})();
