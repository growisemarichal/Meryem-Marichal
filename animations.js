/*
  Animaciones compartidas del sitio (nav, botones magnéticos, tarjetas con
  tilt, resplandor del hero y títulos que aparecen palabra a palabra).
  Se incluye en las 4 páginas; cada bloque comprueba que sus elementos
  existan antes de hacer nada, así que es seguro cargarlo en todas.
*/
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- LÍNEAS DIVISORIAS: se dibujan solas al llegar (en vez de
  // estar siempre fijas), un detalle editorial en toda la página ----------
  (function topLinesDraw() {
    const lines = document.querySelectorAll('.top-line');
    if (!lines.length) return;
    if (reduceMotion) { lines.forEach(l => l.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    lines.forEach(l => observer.observe(l));
  })();

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

  // ---------- CTA FINAL (x2): cortina que se cierra, aparece una
  // palabra, y se abre revelando el contenido. Sección fijada (sticky):
  // el progreso 0→1 recorre el scroll extra de la sección. La misma
  // coreografía se usa dos veces seguidas, con contenido distinto. ----------
  function initCutScene(ids) {
    const pin = document.getElementById(ids.pin);
    const bg = ids.bg ? document.getElementById(ids.bg) : null;
    const reveal = document.getElementById(ids.reveal);
    const barTop = document.getElementById(ids.barTop);
    const barBottom = document.getElementById(ids.barBottom);
    const wordWrap = document.getElementById(ids.wordWrap);
    if (!pin || !reveal || !barTop || !barBottom || !wordWrap) return;
    if (reduceMotion) return; // el CSS ya deja el mensaje visible sin animar

    const clamp01 = (n) => Math.min(1, Math.max(0, n));
    // interpola sobre varios puntos de control, como framer-motion useTransform
    const interp = (t, inputs, outputs) => {
      t = clamp01(t);
      if (t <= inputs[0]) return outputs[0];
      if (t >= inputs[inputs.length - 1]) return outputs[outputs.length - 1];
      for (let i = 0; i < inputs.length - 1; i++) {
        if (t >= inputs[i] && t <= inputs[i + 1]) {
          const local = (t - inputs[i]) / (inputs[i + 1] - inputs[i] || 1);
          return outputs[i] + (outputs[i + 1] - outputs[i]) * local;
        }
      }
      return outputs[outputs.length - 1];
    };

    let range = 0;
    let top = 0;
    let ticking = false;

    function measure() {
      const rect = pin.getBoundingClientRect();
      top = rect.top + window.scrollY;
      range = Math.max(1, rect.height - window.innerHeight);
    }

    // Curvas EXACTAS del componente de referencia (CinemaCut · MAISON
    // NOIR / Scroll Magic Pages), traducidas 1:1 de su código con
    // motion/react useTransform sobre scrollYProgress (0→1):
    //   cuchillas   [0, .42, .62, 1]  → [-52%, 0%, 0%, -52%]
    //   palabra     opacidad [.36, .5, .66] → [0, 1, 0]
    //               escala   [.36, .66]     → [0.82, 1.18]
    //   escena      escala   [.6, 1]        → [1.35, 1]
    //               opacidad [.6, .78]      → [0, 1]
    function render() {
      ticking = false;
      const p = clamp01((window.scrollY - top) / range);

      const blade = interp(p, [0, 0.42, 0.62, 1], [-52, 0, 0, -52]);
      barTop.style.transform = `translateY(${blade}%)`;
      barBottom.style.transform = `translateY(${-blade}%)`;
      // solo deja de tapar clics mientras están totalmente abiertas
      const bladesOpen = Math.abs(blade) > 40;
      barTop.style.pointerEvents = bladesOpen ? 'none' : 'auto';
      barBottom.style.pointerEvents = bladesOpen ? 'none' : 'auto';

      // "slate flash": la palabra destella con las cuchillas cerradas
      wordWrap.style.opacity = String(interp(p, [0.36, 0.5, 0.66], [0, 1, 0]));
      wordWrap.style.transform = `scale(${interp(p, [0.36, 0.66], [0.82, 1.18])})`;

      // la escena de detrás (foto + titular) se revela al abrirse
      const sceneOpacity = interp(p, [0.6, 0.78], [0, 1]);
      reveal.style.opacity = String(sceneOpacity);
      if (bg) {
        bg.style.opacity = String(sceneOpacity);
        bg.style.transform = `scale(${interp(p, [0.6, 1], [1.35, 1])})`;
      }
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
  }

  initCutScene({
    pin: 'cutPin', bg: 'cutBg', reveal: 'cutReveal',
    barTop: 'cutBarTop', barBottom: 'cutBarBottom', wordWrap: 'cutWordWrap'
  });

  // ---------- GALERÍA "UNA MIRADA POR DENTRO": cinta continua que se
  // desliza sola despacio. Flechas para avanzar imagen a imagen, se puede
  // arrastrar, y al pulsar una foto se abre a pantalla completa (con sus
  // propias flechas). Entrada en cascada: cada foto llega por separado. ----------
  (function anexosCinta() {
    const viewport = document.getElementById('anexosCinta');
    const track = document.getElementById('anexosCintaTrack');
    if (!viewport || !track) return;
    const btnPrev = document.getElementById('anexosPrev');
    const btnNext = document.getElementById('anexosNext');

    const TOTAL = 11;
    const images = Array.from({ length: TOTAL }, (_, i) => `anexo-${String(i + 1).padStart(2, '0')}.png`);
    const loopImages = images.concat(images); // duplicadas para el bucle sin costuras
    loopImages.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'anexos-cinta-slide';
      slide.dataset.index = i % TOTAL;
      slide.style.transitionDelay = ((i % TOTAL) * 0.06) + 's';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Página de la guía';
      img.loading = 'lazy';
      img.draggable = false;
      slide.appendChild(img);
      track.appendChild(slide);
    });

    // entrada en cascada al llegar a pantalla
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
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealObserver.observe(viewport);
    }

    // ---- desplazamiento automático suave (con scrollLeft, no con CSS, para
    // que las flechas y el arrastre no peleen con la animación) ----
    const AUTO_SPEED = 0.45; // px por frame ≈ lento y tranquilo
    let paused = false;        // ratón encima
    let dragging = false;      // arrastrando
    let lightboxOpen = false;  // foto ampliada abierta

    function halfWidth() { return track.scrollWidth / 2 || 1; }
    // mantiene el scroll en [0.5·half, 1.5·half): siempre hay recorrido para
    // arrastrar en ambos sentidos y el salto es invisible (contenido duplicado)
    function wrapScroll() {
      const half = halfWidth();
      if (viewport.scrollLeft >= half * 1.5) viewport.scrollLeft -= half;
      else if (viewport.scrollLeft < half * 0.5) viewport.scrollLeft += half;
    }
    // empezar en el medio para tener recorrido a ambos lados
    requestAnimationFrame(() => { viewport.scrollLeft = halfWidth(); });

    function loop() {
      requestAnimationFrame(loop);
      if (reduceMotion || paused || dragging || lightboxOpen) return;
      viewport.scrollLeft += AUTO_SPEED;
      wrapScroll();
    }
    loop();

    viewport.addEventListener('mouseenter', () => { paused = true; });
    viewport.addEventListener('mouseleave', () => { paused = false; });

    // ---- flechas: avanzan una imagen (con margen) ----
    function step(dir) {
      const slide = track.querySelector('.anexos-cinta-slide');
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16') || 16;
      const amount = Math.max((slide ? slide.offsetWidth + gap : 0), 160);
      viewport.scrollBy({ left: dir * amount, behavior: 'smooth' });
      // recolocar dentro del bucle una vez terminado el scroll suave
      setTimeout(wrapScroll, 420);
    }
    if (btnPrev) btnPrev.addEventListener('click', () => step(-1));
    if (btnNext) btnNext.addEventListener('click', () => step(1));

    // ---- arrastrar + detectar pulsación (sin setPointerCapture, que
    // retargetea el 'click' y rompía la apertura de la foto) ----
    let startX = 0, startScroll = 0, moved = 0, activeId = null, lastOpen = 0;

    function openFor(slide) {
      if (!slide) return;
      if (Date.now() - lastOpen < 400) return; // evita doble apertura (pointerup + click)
      lastOpen = Date.now();
      openGalleryLightbox(images, Number(slide.dataset.index) || 0);
    }

    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      activeId = e.pointerId;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      moved = 0;
      viewport.classList.add('dragging');
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== activeId) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      viewport.scrollLeft = startScroll - dx;
      wrapScroll();
    });

    window.addEventListener('pointerup', (e) => {
      if (!dragging || e.pointerId !== activeId) return;
      dragging = false;
      activeId = null;
      viewport.classList.remove('dragging');
      if (moved < 6) {
        let slide = (e.target && e.target.closest) ? e.target.closest('.anexos-cinta-slide') : null;
        if (!slide) {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          slide = el && el.closest ? el.closest('.anexos-cinta-slide') : null;
        }
        openFor(slide);
      }
    });

    window.addEventListener('pointercancel', () => {
      dragging = false; activeId = null; viewport.classList.remove('dragging');
    });

    // respaldo: 'click' normal delegado (ahora funciona porque la cinta se
    // pausa al pasar el ratón y ya no hay captura de puntero)
    track.addEventListener('click', (e) => {
      if (moved >= 6) return;
      const slide = e.target.closest && e.target.closest('.anexos-cinta-slide');
      openFor(slide);
    });

    // exponer el estado del lightbox para pausar la cinta
    viewport._setLightbox = (v) => { lightboxOpen = v; };
  })();

  // ---------- FOTO A PANTALLA COMPLETA (lightbox) con flechas y zoom ----------
  function openGalleryLightbox(images, startIndex) {
    let idx = startIndex;
    const viewport = document.getElementById('anexosCinta');
    if (viewport && viewport._setLightbox) viewport._setLightbox(true);

    const overlay = document.createElement('div');
    overlay.className = 'gallery-lightbox';
    overlay.innerHTML = `
      <button class="gallery-lightbox-close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <button class="gallery-lightbox-nav gallery-lightbox-prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="gallery-lightbox-stage"><img alt="Página de la guía ampliada"></div>
      <button class="gallery-lightbox-nav gallery-lightbox-next" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="gallery-lightbox-counter"></p>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('lightbox-open');
    const img = overlay.querySelector('img');
    const counter = overlay.querySelector('.gallery-lightbox-counter');
    const stage = overlay.querySelector('.gallery-lightbox-stage');
    let zoomed = false;

    const show = () => {
      const real = ((idx % images.length) + images.length) % images.length;
      img.src = images[real];
      counter.textContent = (real + 1) + ' / ' + images.length;
      zoomed = false;
      stage.classList.remove('is-zoomed');
    };
    show();
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    function close() {
      overlay.classList.remove('is-open');
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('lightbox-open');
      if (viewport && viewport._setLightbox) viewport._setLightbox(false);
      setTimeout(() => overlay.remove(), 220);
    }
    function next() { idx += 1; show(); }
    function prev() { idx -= 1; show(); }
    function onKeyDown(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    // pulsar la imagen: acercar / alejar
    stage.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomed = !zoomed;
      stage.classList.toggle('is-zoomed', zoomed);
    });
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
    const headings = document.querySelectorAll('.section-head h2, .final-cta h2, .gancho-heading, .bio-content h2, .philosophy-section > .wrap h2, .philosophy-closing h3, .anexos-gallery-head h2');
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
