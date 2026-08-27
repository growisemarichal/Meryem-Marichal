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

      // cortina: se cierra (0 → 0.3), se abre (0.4 → 0.65), se mantiene
      // abierta, y se vuelve a cerrar al final (0.82 → 1) con un
      // difuminado a negro antes de soltar la sección.
      let barPct;
      if (p < 0.35) {
        barPct = mapClamped(p, 0, 0.3, 52, 0);
      } else if (p < 0.82) {
        barPct = -mapClamped(p, 0.4, 0.65, 0, 60);
      } else {
        barPct = -mapClamped(p, 0.82, 1, 60, 0);
      }
      barTop.style.transform = `translateY(${barPct}%)`;
      barBottom.style.transform = `translateY(${-barPct}%)`;
      // solo deja de tapar clics mientras está totalmente abierta
      const open = p > 0.65 && p < 0.82;
      barTop.style.pointerEvents = open ? 'none' : 'auto';
      barBottom.style.pointerEvents = open ? 'none' : 'auto';

      // "Ya empezaste." aparece mientras está cerrado, y se va rápido
      const wordIn = mapClamped(p, 0.1, 0.28, 0, 1);
      const wordOut = 1 - mapClamped(p, 0.32, 0.42, 0, 1);
      const wordOpacity = Math.min(wordIn, wordOut);
      wordWrap.style.opacity = String(wordOpacity);
      const wordScale = mapClamped(p, 0, 0.42, 0.8, 1.08);
      wordWrap.style.transform = `scale(${wordScale})`;

      // la foto de fondo y el mensaje final se revelan al reabrirse,
      // y se difuminan a negro otra vez antes de que la cortina cierre
      const revealIn = mapClamped(p, 0.4, 0.65, 0, 1);
      const revealOut = 1 - mapClamped(p, 0.82, 1, 0, 1);
      const revealOpacity = Math.min(revealIn, revealOut);
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

  // ---------- GALERÍA "UN VISTAZO DENTRO": cinta continua, arrastrable,
  // con zoom al hacer clic y desplazamiento al acercar el ratón a los
  // bordes. Entrada con rebote al llegar scrolleando. ----------
  (function anexosCinta() {
    const viewport = document.getElementById('anexosCinta');
    const track = document.getElementById('anexosCintaTrack');
    if (!viewport || !track) return;

    viewport.classList.add('carousel3d-reveal');
    if (reduceMotion) {
      viewport.classList.add('is-visible');
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' });
      revealObserver.observe(viewport);
    }

    const TOTAL = 11;
    const images = Array.from({ length: TOTAL }, (_, i) => `anexo-${String(i + 1).padStart(2, '0')}.png`);
    const loopImages = images.concat(images); // duplicadas para el bucle infinito
    loopImages.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'anexos-cinta-slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      slide.appendChild(img);
      slide.addEventListener('click', () => {
        if (dragged) return;
        openGalleryLightbox(images, i % TOTAL);
      });
      track.appendChild(slide);
    });

    if (reduceMotion) track.style.animation = 'none';

    // ---- arrastrar con el ratón/dedo ----
    let isDown = false, startX = 0, scrollStart = 0, dragged = false;
    viewport.addEventListener('pointerdown', (e) => {
      isDown = true; dragged = false;
      viewport.classList.add('dragging');
      startX = e.clientX;
      scrollStart = viewport.scrollLeft;
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) dragged = true;
      viewport.scrollLeft = scrollStart - dx;
    });
    ['pointerup', 'pointerleave'].forEach(ev => {
      viewport.addEventListener(ev, () => {
        isDown = false;
        viewport.classList.remove('dragging');
      });
    });

    // ---- acercar el ratón al borde izquierdo/derecho: se desplaza sola ----
    if (!reduceMotion) {
      const EDGE = 90; // px desde el borde donde ya empieza a moverse
      const MAX_SPEED = 11;
      let edgeSpeed = 0;
      let hovering = false;
      viewport.addEventListener('mouseenter', () => { hovering = true; });
      viewport.addEventListener('mouseleave', () => { hovering = false; edgeSpeed = 0; });
      viewport.addEventListener('mousemove', (e) => {
        if (isDown) { edgeSpeed = 0; return; }
        const rect = viewport.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < EDGE) {
          edgeSpeed = -MAX_SPEED * (1 - x / EDGE);
        } else if (x > rect.width - EDGE) {
          edgeSpeed = MAX_SPEED * (1 - (rect.width - x) / EDGE);
        } else {
          edgeSpeed = 0;
        }
      });
      (function edgeScrollLoop() {
        requestAnimationFrame(edgeScrollLoop);
        if (hovering && edgeSpeed !== 0 && !isDown) {
          viewport.scrollLeft += edgeSpeed;
        }
      })();
    }
  })();

  // ---------- LIGHTBOX compartido de la galería (con flechas) ----------
  function openGalleryLightbox(images, startIndex) {
    let idx = startIndex;
    const overlay = document.createElement('div');
    overlay.className = 'gallery-lightbox';
    overlay.innerHTML = `
      <button class="gallery-lightbox-close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <button class="gallery-lightbox-nav gallery-lightbox-prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <img alt="">
      <button class="gallery-lightbox-nav gallery-lightbox-next" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    `;
    document.body.appendChild(overlay);
    const img = overlay.querySelector('img');
    const show = () => { img.src = images[((idx % images.length) + images.length) % images.length]; };
    show();
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    function close() {
      overlay.classList.remove('is-open');
      document.removeEventListener('keydown', onKeyDown);
      setTimeout(() => overlay.remove(), 200);
    }
    function next() { idx += 1; show(); }
    function prev() { idx -= 1; show(); }
    function onKeyDown(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.gallery-lightbox-close')) close();
    });
    overlay.querySelector('.gallery-lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });
    overlay.querySelector('.gallery-lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
    document.addEventListener('keydown', onKeyDown);
  }

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
