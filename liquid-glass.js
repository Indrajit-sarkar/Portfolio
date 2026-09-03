/* ============================================================
   Liquid Glass Integration — Apple-style glass effects
   Uses dashersw/liquid-glass-js (Container + Button classes)
   
   Applied ONLY to project mini cards where glass looks good.
   Wrapped in try/catch to handle html2canvas color parse errors.
   ============================================================ */
(function () {
  'use strict';

  function ready() {
    return typeof Container === 'function' && typeof Button === 'function' && typeof html2canvas === 'function';
  }

  function glassOverlay(targetEl, config) {
    if (!targetEl || targetEl.dataset.lgApplied) return null;
    targetEl.dataset.lgApplied = '1';

    try {
      var c = new Container({
        type: config.type || 'rounded',
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

      requestAnimationFrame(function () {
        try { c.updateSizeFromDOM(); } catch (e) {}
      });

      if (typeof ResizeObserver === 'function') {
        new ResizeObserver(function () {
          try { c.updateSizeFromDOM(); } catch (e) {}
        }).observe(targetEl);
      }

      return c;
    } catch (e) {
      console.warn('[liquid-glass] Failed on element:', e.message);
      return null;
    }
  }

  function watchTheme() {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'data-theme') {
          setTimeout(function () {
            try {
              Container.pageSnapshot = null;
              Container.isCapturing = false;
              Container.instances.forEach(function (inst) {
                try { inst.capturePageSnapshot && inst.capturePageSnapshot(); } catch (e) {}
              });
            } catch (e) {}
          }, 800);
        }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function init() {
    if (!ready()) {
      console.warn('[liquid-glass] Library not loaded — skipping.');
      return;
    }
    console.log('[liquid-glass] Initializing glass effects…');

    try {
      // Only project mini cards — edu-cards and exp-cards have their own styling
      document.querySelectorAll('.proj-mini.glass').forEach(function (card) {
        glassOverlay(card, { type: 'rounded', tintOpacity: 0.12, borderRadius: 16 });
      });

      watchTheme();
      console.log('[liquid-glass] ✓ Glass effects applied to cards.');
    } catch (e) {
      console.warn('[liquid-glass] Init error:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 1500);
    });
  } else {
    setTimeout(init, 1500);
  }
})();
