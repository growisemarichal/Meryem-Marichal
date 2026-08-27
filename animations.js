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

  // ---------- QUIÉN SOY: TEXTO Y FOTO CON MOVIMIENTO CINEMATOGRÁFICO ----------
  (function bioCinematic() {
    if (reduceMotion || window.innerWidth < 901) return;
    const sections = document.querySelectorAll('.bio-section');
    if (!sections.length) return;
    const pairs = Array.from(sections)
      .map(section => ({ section, content: section.querySelector('.bio-content'), img: section.querySelector('.bio-img') }))
      .filter(p => p.content);

    const update = () => {
      const vh = window.innerHeight;
      pairs.forEach(({ section, content, img }) => {
        const rect = section.getBoundingClientRect();
        const progress = (vh - rect.top) / (vh + rect.height); // 0 al entrar, 1 al salir
        const drift = (progress - 0.5) * 50;
        content.style.transform = `translateY(${drift}px)`;
        if (img) img.style.transform = `translateY(${drift * -0.3}px)`;
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  // ---------- CTA FINAL: cortina que se cierra, aparece "Ya empezaste.",
  // y se abre revelando el mensaje y el botón. Sección fijada (sticky):
  // el progreso 0→1 recorre el scroll extra de la sección. Más rápida
  // y directa que la primera versión, para que se sienta dinámica. ----------
  (function cutSceneReveal() {
    const pin = document.getElementById('cutPin');
    const bg = document.getElementById('cutBg');
    const reveal = document.getElementById('cutReveal');
    const barTop = document.getElementById('cutBarTop');
    const barBottom = document.getElementById('cutBarBottom');
    const wordWrap = document.getElementById('cutWordWrap');
    if (!pin || !bg || !reveal || !barTop || !barBottom || !wordWrap) return;
    if (reduceMotion) return; // el CSS ya deja el mensaje visible sin animar

    const clamp01 = (n) => Math.min(1, Math.max(0, n));
    const mapClamped = (p, inMin, inMax, outMin, outMax) => {
      const t = clamp01((p - inMin) / (inMax - inMin));
      return outMin + (outMax - outMin) * t;
    };

    let range = 0;
    let top = 0;
    let ticking = false;

    function measure() {
      const rect = pin.getBoundingClientRect();
      top = rect.top + window.scrollY;
      range = Math.max(1, rect.height - window.innerHeight);
    }

    function render() {
      ticking = false;
      const p = clamp01((window.scrollY - top) / range);

      // cortina cerrándose (0 → 0.3) y volviendo a abrirse (0.4 → 0.65)
      const closeAmt = mapClamped(p, 0, 0.3, 52, 0);
      const openAmt = mapClamped(p, 0.4, 0.65, 0, 60);
      const barPct = p < 0.35 ? closeAmt : -openAmt;
      barTop.style.transform = `translateY(${barPct}%)`;
      barBottom.style.transform = `translateY(${-barPct}%)`;
      // cuando la cortina ya se abrió del todo, deja de tapar clics
      barTop.style.pointerEvents = p > 0.65 ? 'none' : 'auto';
      barBottom.style.pointerEvents = p > 0.65 ? 'none' : 'auto';

      // "Ya empezaste." aparece mientras está cerrado, y se va rápido
      const wordIn = mapClamped(p, 0.1, 0.28, 0, 1);
      const wordOut = 1 - mapClamped(p, 0.32, 0.42, 0, 1);
      const wordOpacity = Math.min(wordIn, wordOut);
      wordWrap.style.opacity = String(wordOpacity);
      const wordScale = mapClamped(p, 0, 0.42, 0.8, 1.08);
      wordWrap.style.transform = `scale(${wordScale})`;

      // la foto de fondo y el mensaje final se revelan al reabrirse
      const revealOpacity = mapClamped(p, 0.4, 0.65, 0, 1);
      reveal.style.opacity = String(revealOpacity);
      bg.style.opacity = String(revealOpacity);
      const bgScale = mapClamped(p, 0.4, 1, 1.15, 1);
      bg.style.transform = `scale(${bgScale})`;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    }

    measure();
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { measure(); render(); });
  })();

  // ---------- CARRUSEL 3D: entrada con rebote al llegar scrolleando ----------
  (function carousel3dReveal() {
    const root = document.getElementById('carousel3d-root');
    if (!root) return;
    root.classList.add('carousel3d-reveal');
    if (reduceMotion) { root.classList.add('is-visible'); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' });
    observer.observe(root);
  })();

  // ---------- CONSTELACIÓN DE FONDO: puntos que se iluminan y se conectan
  // cerca del ratón. Cubre toda la página (igual que en la referencia),
  // casi invisible salvo donde pasa el cursor. ----------
  (function constellationBackground() {
    const canvas = document.getElementById('siteConstellation');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = 1;
    const mouse = { x: -9999, y: -9999 };
    let points = [];
    let rafId = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(120, (width * height) / 14000));
      points = Array.from({ length: count }, () => {
        const r = Math.random() * 1.6 + 0.5;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r,
          base: r
        };
      });
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 170) {
          const push = (1 - dist / 170) * 1.9;
          p.x += (dx / (dist || 1)) * push;
          p.y += (dy / (dist || 1)) * push;
          p.r = p.base + push * 1.6;
        } else {
          p.r += (p.base - p.r) * 0.08;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dist < 220 ? 'rgba(247,178,190,0.85)' : 'rgba(232,222,222,0.30)';
        ctx.fill();
      }

      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        if (!a || Math.hypot(a.x - mouse.x, a.y - mouse.y) > 230) continue;
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          if (!b) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 130) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(247,178,190,${(1 - d / 130) * 0.28})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY; }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }

    resize();
    tick();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
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

  // ---------- TÍTULOS QUE APARECEN PALABRA A PALABRA ----------
  // (no depende del ratón, así que va antes del "return" de abajo: también
  // tiene que verse en móvil, no solo en ordenador)
  (function wordRevealHeadings() {
    if (reduceMotion) return;
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
})();
