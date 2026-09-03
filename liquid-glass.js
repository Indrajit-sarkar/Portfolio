/* ============================================================
   Liquid Glass Integration — Apple-style glass effects
   Uses dashersw/liquid-glass-js (Container + Button classes)
   
   ONLY applied to: theme toggle, resume button, CTA buttons.
   NOT applied to: nav bar, nav links (breaks scroll behavior).
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

    // Ensure target is a positioning context
    var pos = getComputedStyle(targetEl).position;
    if (pos === 'static') targetEl.style.position = 'relative';

    // Elevate existing children above glass
    Array.from(targetEl.children).forEach(function (child) {
      if (child !== glassEl) {
        child.style.position = child.style.position || 'relative';
        if (!child.style.zIndex || child.style.zIndex === 'auto') {
          child.style.zIndex = '1';
        }
      }
    });

    // Insert glass as first child (behind everything)
    targetEl.insertBefore(glassEl, targetEl.firstChild);

    // Make original BG transparent so glass shows through
    targetEl.style.background = 'transparent';
    targetEl.style.backgroundColor = 'transparent';
    targetEl.style.backdropFilter = 'none';
    targetEl.style.webkitBackdropFilter = 'none';
    targetEl.style.boxShadow = 'none';

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

    // 1. THEME TOGGLE — Glass pill behind the dark/light switch
    var themeToggle = document.querySelector('#themeToggle');
    if (themeToggle) {
      glassOverlay(themeToggle, { type: 'pill', tintOpacity: 0.20, borderRadius: 99 });
      var knob = themeToggle.querySelector('.tt-knob');
      if (knob) {
        knob.style.position = 'relative';
        knob.style.zIndex = '3';
      }
    }

    // 2. RESUME BUTTON — Glass pill
    var resumeBtn = document.querySelector('.nav-resume');
    if (resumeBtn) {
      glassOverlay(resumeBtn, { type: 'pill', tintOpacity: 0.18, borderRadius: 99 });
    }

    // 3. CTA BUTTONS — "Get in touch" etc.
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      glassOverlay(btn, { type: 'pill', tintOpacity: 0.22, borderRadius: 99 });
    });

    // 4. "Resume" ghost button in hero
    document.querySelectorAll('.btn-ghost').forEach(function (btn) {
      // Only the hero ones, not the nav
      if (!btn.classList.contains('nav-resume') && !btn.closest('.nav-actions')) {
        glassOverlay(btn, { type: 'pill', tintOpacity: 0.15, borderRadius: 99 });
      }
    });

    watchTheme();
    console.log('[liquid-glass] ✓ Glass effects applied.');
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
