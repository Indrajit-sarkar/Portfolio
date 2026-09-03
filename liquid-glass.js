/* ============================================================
   Liquid Glass Integration — Apple-style glass effects
   Uses dashersw/liquid-glass-js (Container + Button classes)
   
   Strategy: Create liquid glass overlays that sit BEHIND the
   existing elements. The library needs its own DOM elements
   (with WebGL canvases) — we position them absolutely behind
   the original content.
   ============================================================ */
(function () {
  'use strict';

  /* ── Guard ─────────────────────────────────────────── */
  function ready() {
    return typeof Container === 'function' && typeof Button === 'function' && typeof html2canvas === 'function';
  }

  /* ── Config ────────────────────────────────────────── */
  var GLASS = {
    nav:     { type: 'pill', tintOpacity: 0.15, borderRadius: 99 },
    toggle:  { type: 'pill', tintOpacity: 0.20, borderRadius: 99 },
    resume:  { type: 'pill', tintOpacity: 0.18, borderRadius: 99 },
    cta:     { type: 'pill', tintOpacity: 0.22, borderRadius: 99 },
    navLink: { type: 'pill', tintOpacity: 0.12, borderRadius: 99 }
  };

  /* ── Helper: create a glass overlay behind an element ── */
  function glassOverlay(targetEl, config) {
    if (!targetEl || targetEl.dataset.lgApplied) return null;
    targetEl.dataset.lgApplied = '1';

    // Create a Container instance — it makes its own element + canvas
    var c = new Container({
      type: config.type || 'pill',
      tintOpacity: config.tintOpacity || 0.2,
      borderRadius: config.borderRadius || 48
    });

    var glassEl = c.element;

    // Position the glass element absolutely behind the target
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

    // Ensure children sit above glass
    Array.from(targetEl.children).forEach(function (child) {
      if (child !== glassEl) {
        var z = getComputedStyle(child).zIndex;
        if (z === 'auto' || parseInt(z) < 1) {
          child.style.position = child.style.position || 'relative';
          child.style.zIndex = '1';
        }
      }
    });

    // Insert glass as first child (behind everything)
    targetEl.insertBefore(glassEl, targetEl.firstChild);

    // Remove the original background so glass shows through
    targetEl.style.background = 'transparent';
    targetEl.style.backgroundColor = 'transparent';
    targetEl.style.backdropFilter = 'none';
    targetEl.style.webkitBackdropFilter = 'none';
    targetEl.style.boxShadow = 'none';

    // Size the glass after layout settles
    requestAnimationFrame(function () {
      c.updateSizeFromDOM();
    });

    // Re-measure on resize
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () {
        c.updateSizeFromDOM();
      }).observe(targetEl);
    }

    return c;
  }

  /* ── Helper: create a glass Button overlay for an <a> or <button> ── */
  function glassButton(targetEl, config, text) {
    if (!targetEl || targetEl.dataset.lgApplied) return null;
    targetEl.dataset.lgApplied = '1';

    var btn = new Button({
      text: text || targetEl.textContent.trim() || 'Button',
      size: config.size || 14,
      type: config.type || 'pill',
      tintOpacity: config.tintOpacity || 0.2,
      warp: false
    });

    var glassEl = btn.element;

    // Position glass behind the target
    glassEl.style.position = 'absolute';
    glassEl.style.top = '-1px';
    glassEl.style.left = '-1px';
    glassEl.style.width = 'calc(100% + 2px)';
    glassEl.style.height = 'calc(100% + 2px)';
    glassEl.style.pointerEvents = 'none';
    glassEl.style.zIndex = '0';

    // Hide the Button's own text element — we keep the original content
    if (btn.textElement) btn.textElement.style.display = 'none';

    // Ensure target is a positioning context
    var pos = getComputedStyle(targetEl).position;
    if (pos === 'static') targetEl.style.position = 'relative';

    // Elevate original children
    Array.from(targetEl.children).forEach(function (child) {
      if (child !== glassEl) {
        child.style.position = child.style.position || 'relative';
        child.style.zIndex = '2';
      }
    });

    targetEl.insertBefore(glassEl, targetEl.firstChild);

    // Transparent background so glass shows
    targetEl.style.background = 'transparent';
    targetEl.style.backgroundColor = 'transparent';
    targetEl.style.backdropFilter = 'none';
    targetEl.style.webkitBackdropFilter = 'none';
    targetEl.style.border = '1px solid rgba(255,255,255,0.08)';

    requestAnimationFrame(function () {
      btn.updateSizeFromDOM();
    });

    return btn;
  }

  /* ── Recapture on theme change ──────────────────────── */
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

  /* ── Recapture on scroll (glass shows correct background) ── */
  function watchScroll() {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          Container.instances.forEach(function (inst) {
            if (inst.gl_refs && inst.gl_refs.gl && inst.gl_refs.scrollYLoc) {
              inst.gl_refs.gl.uniform1f(inst.gl_refs.scrollYLoc, window.scrollY);
              if (inst.render) inst.render();
            }
          });
          ticking = false;
        });
      }
    }, { passive: true });
  }

  /* ── Main Init ─────────────────────────────────────── */
  function init() {
    if (!ready()) {
      console.warn('[liquid-glass] Library not loaded — skipping.');
      return;
    }
    console.log('[liquid-glass] Initializing Apple-style glass effects…');

    // 1. NAV BAR — Glass container behind the entire nav
    var navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
      glassOverlay(navMenu, GLASS.nav);
    }

    // 2. NAV INNER — Glass behind the header bar itself
    var navInner = document.querySelector('.nav-inner');
    if (navInner) {
      glassOverlay(navInner, { type: 'rounded', tintOpacity: 0.12, borderRadius: 24 });
    }

    // 3. THEME TOGGLE — Glass pill behind toggle switch
    var themeToggle = document.querySelector('#themeToggle');
    if (themeToggle) {
      glassOverlay(themeToggle, GLASS.toggle);
      // Ensure the knob stays above
      var knob = themeToggle.querySelector('.tt-knob');
      if (knob) {
        knob.style.position = 'relative';
        knob.style.zIndex = '3';
      }
    }

    // 4. RESUME BUTTON — Glass pill
    var resumeBtn = document.querySelector('.nav-resume');
    if (resumeBtn) {
      glassOverlay(resumeBtn, GLASS.resume);
    }

    // 5. CTA BUTTONS — "Get in touch", "Resume" hero button, etc.
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      glassOverlay(btn, GLASS.cta);
    });

    // 6. NAV LINKS — Individual glass pills for active/hovered state
    document.querySelectorAll('.nav-link').forEach(function (link) {
      // Only apply glass to the active link initially
      if (link.classList.contains('is-active')) {
        glassOverlay(link, GLASS.navLink);
      }

      // Apply glass on hover
      link.addEventListener('mouseenter', function () {
        if (!link.dataset.lgApplied) {
          glassOverlay(link, GLASS.navLink);
        }
      });
    });

    // 7. Watch for theme changes and scroll
    watchTheme();
    watchScroll();

    console.log('[liquid-glass] ✓ Glass effects applied.');
  }

  /* ── Boot ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 1500); // Wait for layout + fonts
    });
  } else {
    setTimeout(init, 1500);
  }
})();
