/* ============================================================
   BANNER DE COOKIES + CARGA CONDICIONAL DE ANALÍTICA
   ------------------------------------------------------------
   Google Analytics 4 y Microsoft Clarity SOLO se cargan si la
   persona pulsa "Aceptar". Si pulsa "Rechazar" no se carga nada.
   El consentimiento se vuelve a pedir pasados 12 meses.

   >>> PARA ACTIVAR LA ANALÍTICA: sustituye los dos valores de
       abajo por tus identificadores reales (ver instrucciones
       que te pasó Nira). Mientras sigan con las "X" no se
       cargará nada aunque la persona acepte.
   ============================================================ */
(function () {
  "use strict";

  var GA_MEASUREMENT_ID = "G-XXXXXXXXXX";   // Google Analytics 4  -> Administrar > Flujos de datos
  var CLARITY_PROJECT_ID = "XXXXXXXXXX";    // Microsoft Clarity   -> Settings > Overview

  var STORAGE_KEY = "cc-consent-v1";
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses

  function isConfigured(v) {
    return v && v.indexOf("XXXX") === -1;
  }

  // Mientras no haya NINGÚN identificador real de analítica, el banner
  // permanece desactivado (no hay nada que consentir). En cuanto pongas
  // arriba el ID de Google Analytics o de Clarity, se activa solo.
  var ANALYTICS_AVAILABLE = isConfigured(GA_MEASUREMENT_ID) || isConfigured(CLARITY_PROJECT_ID);

  function hideCookieControls() {
    var els = document.querySelectorAll(".footer-legal-btn, #cc-settings-line");
    for (var i = 0; i < els.length; i++) els[i].style.display = "none";
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.ts || Date.now() - data.ts > MAX_AGE_MS) return null;
      return data.choice; // "accepted" | "rejected"
    } catch (e) {
      return null;
    }
  }

  function saveConsent(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: choice, ts: Date.now() }));
    } catch (e) {}
  }

  /* ---------- Carga de scripts de terceros ---------- */
  var analyticsLoaded = false;

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    // Google Analytics 4
    if (isConfigured(GA_MEASUREMENT_ID)) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
    }

    // Microsoft Clarity
    if (isConfigured(CLARITY_PROJECT_ID)) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
    }
  }

  /* ---------- Banner ---------- */
  function buildBanner() {
    var banner = document.createElement("div");
    banner.className = "cc-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Aviso de cookies");
    banner.innerHTML =
      '<h2>Cookies</h2>' +
      '<p>Uso cookies de terceros (Google Analytics y Microsoft Clarity) para entender ' +
      'cómo se usa la web y mejorarla. Puedes aceptarlas o rechazarlas. ' +
      'Más info en la <a href="politica-cookies.html">Política de cookies</a>.</p>' +
      '<div class="cc-actions">' +
      '<button type="button" class="cc-btn cc-btn-reject" data-cc="reject">Rechazar</button>' +
      '<button type="button" class="cc-btn cc-btn-accept" data-cc="accept">Aceptar</button>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector('[data-cc="accept"]').addEventListener("click", function () {
      saveConsent("accepted");
      hideBanner(banner);
      loadAnalytics();
    });
    banner.querySelector('[data-cc="reject"]').addEventListener("click", function () {
      saveConsent("rejected");
      hideBanner(banner);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { banner.classList.add("cc-visible"); });
    });
    return banner;
  }

  function hideBanner(banner) {
    banner.classList.remove("cc-visible");
    setTimeout(function () { if (banner && banner.parentNode) banner.parentNode.removeChild(banner); }, 500);
  }

  var currentBanner = null;

  function showBanner() {
    if (currentBanner && currentBanner.parentNode) return;
    currentBanner = buildBanner();
  }

  // Permite reabrir el banner desde el enlace "Configurar cookies" del pie
  window.openCookieSettings = function () {
    if (!ANALYTICS_AVAILABLE) return;
    var existing = document.querySelector(".cc-banner");
    if (existing) return;
    currentBanner = buildBanner();
  };

  /* ---------- Arranque ---------- */
  function init() {
    if (!ANALYTICS_AVAILABLE) {
      // Fase 1: analítica todavía sin configurar -> banner desactivado.
      hideCookieControls();
      return;
    }
    var consent = readConsent();
    if (consent === "accepted") {
      loadAnalytics();
    } else if (consent === null) {
      showBanner();
    }
    // "rejected" -> no hacer nada
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
