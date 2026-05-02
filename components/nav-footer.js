// Aurora Systems — Shared Nav + Footer
(function() {

  const LOGO_IMG = `<img src="uploads/Aurora Logo.png" alt="Aurora" style="width:32px;height:32px;object-fit:contain;" />`;

  function getActivePage() {
    const path = window.location.pathname;
    if (path.includes('services')) return 'services';
    if (path.includes('portfolio')) return 'portfolio';
    if (path.includes('about')) return 'about';
    if (path.includes('contact')) return 'contact';
    if (path.includes('blog')) return 'blog';
    return 'home';
  }

  function injectNav() {
    const active = getActivePage();
    const navHTML = `
    <nav class="nav" id="main-nav">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">
          <div class="nav-logo-mark">${LOGO_IMG}</div>
          Aurora
        </a>
        <ul class="nav-links">
          <li>
            <div class="nav-dropdown">
              <button class="nav-dropdown-toggle">
                Services
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="nav-dropdown-menu">
                <a href="services.html#custom-software" class="nav-dropdown-item">Custom Software</a>
                <a href="services.html#mobile-apps" class="nav-dropdown-item">Mobile Apps</a>
                <a href="services.html#ui-ux" class="nav-dropdown-item">UI / UX Design</a>
                <a href="services.html#ai-automation" class="nav-dropdown-item">AI & Automation</a>
                <a href="services.html#web-dev" class="nav-dropdown-item">Web Development</a>
                <a href="services.html#idea-validation" class="nav-dropdown-item">Idea Validation</a>
              </div>
            </div>
          </li>
          <li><a href="portfolio.html" class="${active === 'portfolio' ? 'active nav-portfolio' : 'nav-portfolio'}">Work</a></li>
          <li><a href="about.html" class="${active === 'about' ? 'active nav-about' : 'nav-about'}">About</a></li>
          <li><a href="blog.html" class="${active === 'blog' ? 'active nav-blog' : 'nav-blog'}">Blog</a></li>
        </ul>
        <div class="nav-actions">
          <a href="contact.html" class="btn btn-outline btn-sm">Talk to us</a>
          <a href="contact.html" class="btn btn-primary btn-sm">Start a project</a>
        </div>
        <button class="nav-hamburger" id="hamburger-btn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    <div class="mobile-menu" id="mobile-menu">
      <a href="index.html">Home</a>
      <a href="services.html">Services</a>
      <a href="portfolio.html">Work</a>
      <a href="about.html">About</a>
      <a href="blog.html">Blog</a>
      <a href="contact.html" style="color: var(--accent)">Start a project →</a>
    </div>`;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Scroll behavior
    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // Services dropdown
    const dropdown = document.querySelector('.nav-dropdown');
    const toggle = document.querySelector('.nav-dropdown-toggle');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));

    // Hamburger
    const btn = document.getElementById('hamburger-btn');
    const menu = document.getElementById('mobile-menu');
    btn.addEventListener('click', () => {
      menu.classList.toggle('open');
      const spans = btn.querySelectorAll('span');
      if (menu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
  }

  function injectFooter() {
    const footerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="footer-logo-mark">${LOGO_IMG}</div>
              Aurora
            </div>
            <p>We build the world's next digital products — from bold ideas to revenue-ready platforms. Strategy, design, engineering, AI.</p>
            <div style="margin-top:28px; display:flex; gap:16px; flex-wrap:wrap;">
              <a href="contact.html" class="btn btn-accent btn-sm btn-arrow">Start a project</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Services</h4>
            <a href="services.html#custom-software">Custom Software</a>
            <a href="services.html#mobile-apps">Mobile Apps</a>
            <a href="services.html#ui-ux">UI / UX Design</a>
            <a href="services.html#ai-automation">AI & Automation</a>
            <a href="services.html#web-dev">Web Development</a>
            <a href="services.html#idea-validation">Idea Validation</a>
          </div>
          <div class="footer-col">
            <h4>Company</h4>
            <a href="portfolio.html">Work</a>
            <a href="about.html">About</a>
            <a href="blog.html">Blog</a>
            <a href="contact.html">Careers</a>
            <a href="contact.html">Contact</a>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <a href="mailto:support@aurorasystems.co.zw">support@aurorasystems.co.zw</a>
            <a href="tel:+2637804040000">+263 78 004 0000</a>
            <a href="tel:+16292765611">+1 (629) 276-5611</a>
            <div style="margin-top:16px; font-size:13px; color:rgba(250,249,247,0.35); line-height:1.7;">
              Harare, Zimbabwe<br>
              Dover, Delaware, USA
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Aurora Systems. All rights reserved.</span>
          <span>A subsidiary of Attribute AI, LLC</span>
        </div>
      </div>
    </footer>`;
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

  // Scroll reveal
  function initReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectNav();
    injectFooter();
    // Small delay so DOM is ready for reveal
    setTimeout(initReveal, 50);
  });

})();
