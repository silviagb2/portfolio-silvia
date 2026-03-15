/**
 * Shared navigation component
 * Usage: add <div id="nav-root"></div> at the top of <body>
 * and <script src="components/nav.js"></script> before </body>
 *
 * To mark a page as active, add data-nav-active="work" or "about"
 * to the <body> tag of each page.
 */

(function () {
  const root = document.getElementById('nav-root');
  if (!root) return;

  // Detect active page from body attribute
  const activePage = document.body.dataset.navActive || '';

  const workActive  = activePage === 'work'  ? ' active" aria-current="page' : '';
  const aboutActive = activePage === 'about' ? ' active" aria-current="page' : '';

  root.innerHTML = `
    <nav class="nav" aria-label="Main navigation">
      <a href="index.html" class="nav-logo">
        <span class="nav-name">Silvia<span class="nav-name-last"> Gutierrez</span></span>
      </a>
      <div class="nav-pill">
        <a href="index.html" class="nav-pill-link${workActive}">Work</a>
        <a href="about.html" class="nav-pill-link${aboutActive}">About</a>
      </div>
      <a href="https://www.linkedin.com/in/silviagb/" target="_blank" rel="noopener" class="nav-contact-btn" style="background-color:#ffffff">
        Contact<span class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0"> (opens in new tab)</span>
      </a>
    </nav>
  `;
  // Scroll hide/show behavior
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const nav = root.querySelector('.nav');
    if (nav) {
      if (y > lastY && y > 96) nav.classList.add('nav--hidden');
      else nav.classList.remove('nav--hidden');
    }
    lastY = y;
  });
})();