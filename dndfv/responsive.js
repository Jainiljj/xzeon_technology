/* Xzeon Technologies — Responsive JS Helper */
(function () {
  'use strict';

  function init() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var overlay = document.querySelector('.mobile-menu-overlay');
    var menu = document.querySelector('.mobile-menu');
    var navActions = document.querySelector('nav .nav-actions');
    var html = document.documentElement;
    var body = document.body;
    var scrollY = 0;

    // Inject toggle button if missing
    if (!toggle && navActions) {
      toggle = document.createElement('button');
      toggle.className = 'mobile-menu-toggle';
      toggle.setAttribute('aria-label', 'Toggle menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      navActions.appendChild(toggle);
    }

    // Inject overlay if missing
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mobile-menu-overlay';
      body.appendChild(overlay);
    }

    // Inject menu if missing
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'mobile-menu';

      var ul = document.createElement('ul');
      var pages = [
        { name: 'Home', url: 'index.html' },
        { name: 'Services', url: 'services.html' },
        { name: 'Projects', url: 'projects.html' },
        { name: 'About', url: 'about.html' },
        { name: 'Contact', url: 'contact.html' }
      ];

      pages.forEach(function (p) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = p.url;
        a.textContent = p.name;
        li.appendChild(a);
        ul.appendChild(li);
      });

      menu.appendChild(ul);
      body.appendChild(menu);
    }

    // Set active state on mobile menu links based on current path
    var currentPath = window.location.pathname.split('/').pop() || 'index.html';
    var menuLinks = menu.querySelectorAll('ul li a');
    menuLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (!toggle || !menu || !overlay) return;
    if (toggle.dataset.responsiveInit) return;
    toggle.dataset.responsiveInit = 'true';

    function openMenu() {
      scrollY = window.scrollY;
      toggle.classList.add('active');
      menu.classList.add('active');
      overlay.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      html.classList.add('menu-open');
      body.classList.add('menu-open');
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = '-' + scrollY + 'px';
      body.style.width = '100%';
    }

    function closeMenu() {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      overlay.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      html.classList.remove('menu-open');
      body.classList.remove('menu-open');
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      window.scrollTo(0, scrollY);
    }

    function toggleMenu() {
      if (menu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    overlay.addEventListener('click', closeMenu);

    menuLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        closeMenu();
      }
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth >= 1024 && menu.classList.contains('active')) {
          closeMenu();
        }
      }, 250);
    });
  }

  // Safe execution check if DOM is already parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
