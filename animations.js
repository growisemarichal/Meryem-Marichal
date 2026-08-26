/*
  Animaciones compartidas del sitio (nav, botones magnéticos, tarjetas con
  tilt, resplandor del hero y títulos que aparecen palabra a palabra).
  Se incluye en las 4 páginas; cada bloque comprueba que sus elementos
  existan antes de hacer nada, así que es seguro cargarlo en todas.
*/
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- NAV: se esconde al bajar, reaparece al subir ----------
  (function navHideOnScroll() {
    const navBar = document.querySelector('nav');
    if (!navBar) return;
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) {
        navBar.classList.remove('nav-hidden');
      } else if (currentScrollY > lastScrollY) {
        navBar.classList.add('nav-hidden');
      } else {
        navBar.classList.remove('nav-hidden');
      }
      lastScrollY = currentScrollY;
    }, { passive: true });
  })();

  // ---------- BARRA DE PROGRESO DE LECTURA (con flecha que viaja por la pantalla) ----------
  (function scrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    const fill = document.createElement('div');
    fill.className = 'scroll-progress-fill';
    const arrow = document.createElement('div');
    arrow.className = 'scroll-progress-arrow';
    fill.appendChild(arrow);
    bar.appendChild(fill);
    document.body.appendChild(bar);

    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      fill.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  })();

  // ---------- PARALLAX SUAVE DEL LOGO EN EL HERO ----------
  (function heroParallax() {
    if (reduceMotion) return;
    const hero = document.querySelector('.hero');
    const logo = document.querySelector('.hero-logo-wrap');
    if (!hero || !logo) return;
    const update = () => {
      const heroHeight = hero.offsetHeight;
      const scrollY = window.scrollY;
      if (scrollY > heroHeight) return;
      const progress = Math.min(scrollY / heroHeight, 1);
      logo.style.transform = `translateY(${scrollY * 0.25}px)`;
      logo.style.opacity = String(Math.max(1 - progress * 1.2, 0));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // ---------- TESTIMONIOS EN CINTA (ticker con las citas reales) ----------
  (function testimonialsMarquee() {
    if (reduceMotion) return;
    const grid = document.querySelector('.testi-grid');
    if (!grid) return;
    const quotes = Array.from(grid.querySelectorAll('.testi-text'))
      .map(el => el.textContent.trim())
      .filter(Boolean);
    if (!quotes.length) return;

    const track = document.createElement('div');
    track.className = 'testi-marquee-track';
    quotes.concat(quotes).forEach(q => {
      const item = document.createElement('span');
      item.className = 'testi-marquee-item';
      item.textContent = q;
      track.appendChild(item);
    });

    const marquee = document.createElement('div');
    marquee.className = 'testi-marquee';
    marquee.appendChild(track);
    grid.parentElement.insertBefore(marquee, grid);
  })();

  if (reduceMotion || !hasFinePointer) return; // el resto son efectos de ratón/hover

  // ---------- BOTONES MAGNÉTICOS ----------
  (function magneticButtons() {
    const targets = document.querySelectorAll('.btn-bracket, .nav-cta');
    targets.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  })();

  // ---------- TARJETAS CON INCLINACIÓN 3D (tilt) ----------
  (function tiltCards() {
    const cards = document.querySelectorAll('.module-card, .pain-card, .testi-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  })();

  // ---------- RESPLANDOR QUE SIGUE AL RATÓN EN EL HERO ----------
  (function heroSpotlight() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const spotlight = document.createElement('div');
    spotlight.className = 'hero-spotlight';
    hero.appendChild(spotlight);
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      spotlight.style.left = (e.clientX - rect.left) + 'px';
      spotlight.style.top = (e.clientY - rect.top) + 'px';
      spotlight.classList.add('active');
    });
    hero.addEventListener('mouseleave', () => spotlight.classList.remove('active'));
  })();

  // ---------- TÍTULOS QUE APARECEN PALABRA A PALABRA ----------
  (function wordRevealHeadings() {
    const headings = document.querySelectorAll('.section-head h2, .final-cta h2');
    if (!headings.length) return;

    const splitIntoWords = (el) => {
      const walk = (node) => {
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(chunk => {
              if (chunk.trim() === '') {
                frag.appendChild(document.createTextNode(chunk));
                return;
              }
              const mask = document.createElement('span');
              mask.className = 'word-reveal-word';
              const inner = document.createElement('span');
              inner.textContent = chunk;
              mask.appendChild(inner);
              frag.appendChild(mask);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(el);
    };

    headings.forEach(h => {
      h.classList.add('word-reveal');
      splitIntoWords(h);
      h.querySelectorAll('.word-reveal-word > span').forEach((word, i) => {
        word.style.transitionDelay = (i * 0.035) + 's';
      });
    });

    const wordObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          wordObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -40px 0px' });
    headings.forEach(h => wordObserver.observe(h));
  })();
})();
