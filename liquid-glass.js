/* ============================================================
   Liquid Glass Integration — Apple-style glass effects
   Uses dashersw/liquid-glass-js (Container + Button classes)
   
   Applied ONLY to large surfaces where glass refraction
   looks good. NOT on small buttons (breaks visibility).
   ============================================================ */
(function () {
  'use strict';

  function ready() {
    return typeof Container === 'function' && typeof Button === 'function' && typeof html2canvas === 'function';
  }

  /* ── Helper: create a glass overlay behind an element ── */
  function glassOverlay(targetEl, config) {
    if (!targetEl || targetEl.dataset.lgApplied) return null;
    targetEl.dataset.lgApplied = '1';

    var c = new Container({
      type: config.type || 'pill',
      tintOpacity: config.tintOpacity || 0.2,
      borderRadius: config.borderRadius || 48
    });

    var glassEl = c.element;
    glassEl.style.position = 'absolute';
    glassEl.style.top = '0';
    glassEl.style.left = '0';
    glassEl.style.width = '100%';
    glassEl.style.height = '100%';
    glassEl.style.pointerEvents = 'none';
    glassEl.style.zIndex = '0';
    glassEl.style.borderRadius = (config.borderRadius || 48) + 'px';

    var pos = getComputedStyle(targetEl).position;
    if (pos === 'static') targetEl.style.position = 'relative';

    Array.from(targetEl.children).forEach(function (child) {
      if (child !== glassEl) {
        child.style.position = child.style.position || 'relative';
        if (!child.style.zIndex || child.style.zIndex === 'auto') {
          child.style.zIndex = '1';
        }
      }
    });

    targetEl.insertBefore(glassEl, targetEl.firstChild);

    // Only make BG transparent if explicitly requested
    if (config.clearBg) {
      targetEl.style.background = 'transparent';
      targetEl.style.backgroundColor = 'transparent';
      targetEl.style.backdropFilter = 'none';
      targetEl.style.webkitBackdropFilter = 'none';
      targetEl.style.boxShadow = 'none';
    }

    requestAnimationFrame(function () {
      c.updateSizeFromDOM();
    });

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () {
        c.updateSizeFromDOM();
      }).observe(targetEl);
    }

    return c;
  }

  /* ── Recapture on theme change ── */
  function watchTheme() {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'data-theme') {
          setTimeout(function () {
            Container.pageSnapshot = null;
            Container.isCapturing = false;
            Container.instances.forEach(function (inst) {
              try { inst.capturePageSnapshot && inst.capturePageSnapshot(); } catch (e) {}
            });
          }, 800);
        }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ── Main Init ── */
  function init() {
    if (!ready()) {
      console.warn('[liquid-glass] Library not loaded — skipping.');
      return;
    }
    console.log('[liquid-glass] Initializing glass effects…');

    // Glass on larger card-like elements where it actually looks good
    // Do NOT apply to small buttons — it kills their background/visibility

    // Glass overlay on .glass cards (project cards, contact card, etc.)
    // These already have transparent backgrounds so glass refraction shines
    document.querySelectorAll('.proj-mini.glass, .contact-card.glass, .exp-card.glass').forEach(function (card) {
      glassOverlay(card, { type: 'rounded', tintOpacity: 0.12, borderRadius: 16 });
    });

    watchTheme();
    console.log('[liquid-glass] ✓ Glass effects applied to cards.');
  }

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 1500);
    });
  } else {
    setTimeout(init, 1500);
  }
})();
