/* ============================================================
   Liquid Glass Integration — Portfolio 2027
   Wraps target elements with liquid-glass-js Container/Button
   instances for Apple-inspired glass refraction effects.

   Dependencies (loaded via CDN in index.html):
   - html2canvas
   - liquid-glass-js container.js
   - liquid-glass-js button.js
   - liquid-glass-js glass.css

   Safe: if any dependency fails, buttons keep working normally.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Guard: bail if the library didn't load ---------- */
    function ready() {
        return typeof Container === 'function' && typeof Button === 'function' && typeof html2canvas === 'function';
    }

    /* ---------- Utility: wait for a selector to appear in DOM ---- */
    function waitForElement(selector, timeout) {
        timeout = timeout || 8000;
        return new Promise(function (resolve) {
            var el = document.querySelector(selector);
            if (el) { resolve(el); return; }

            var timer = setTimeout(function () {
                if (obs) obs.disconnect();
                resolve(null);
            }, timeout);

            var obs = new MutationObserver(function () {
                el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    clearTimeout(timer);
                    resolve(el);
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        });
    }

    /* ---------- Shared glass config per element type ---------- */
    var GLASS_CONFIG = {
        themeToggle: { type: 'pill', tintOpacity: 0.18, borderRadius: 99 },
        resumeBtn:   { type: 'pill', tintOpacity: 0.22, borderRadius: 99 },
        ctaBtn:      { type: 'pill', tintOpacity: 0.25, borderRadius: 99 },
        arrowBtn:    { type: 'circle', tintOpacity: 0.2, borderRadius: 50 },
        muteBtn:     { type: 'circle', tintOpacity: 0.2, borderRadius: 50 }
    };

    /* ---------- Inject a glass Container behind an element ------- */
    function applyGlass(el, config) {
        if (!el || el.classList.contains('lg-enhanced')) return;

        try {
            var container = new Container({
                type: config.type,
                tintOpacity: config.tintOpacity,
                borderRadius: config.borderRadius
            });

            // The library creates container.element — a div.glass-container.
            // We position it absolutely behind the target's content.
            var glassEl = container.element;

            // Mark the original element so we don't double-apply
            el.classList.add('lg-enhanced');

            // Make the target a positioning context if it isn't already
            var pos = getComputedStyle(el).position;
            if (pos === 'static') {
                el.style.position = 'relative';
            }

            // Insert the glass element as the first child so it sits behind
            el.insertBefore(glassEl, el.firstChild);

            // Tell the container to read size from its DOM parent
            // (the element it was just inserted into)
            requestAnimationFrame(function () {
                container.updateSizeFromDOM();
            });

            // Re-measure on resize
            var resizeObs = null;
            if (typeof ResizeObserver === 'function') {
                resizeObs = new ResizeObserver(function () {
                    container.updateSizeFromDOM();
                });
                resizeObs.observe(el);
            }

            return container;
        } catch (e) {
            console.warn('[liquid-glass] Could not enhance element:', el, e);
            return null;
        }
    }

    /* ---------- Theme change: recapture page snapshot ----------- */
    function watchThemeChanges() {
        var obs = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (m.attributeName === 'data-theme') {
                    // Clear cached snapshot so the glass recaptures
                    // the new theme colours
                    setTimeout(function () {
                        if (typeof Container !== 'undefined') {
                            Container.pageSnapshot = null;
                            Container.isCapturing = false;
                            // Re-init each instance so they recapture
                            Container.instances.forEach(function (inst) {
                                try {
                                    inst.capturePageSnapshot && inst.capturePageSnapshot();
                                } catch (e) { /* swallow */ }
                            });
                        }
                    }, 600); // small delay for CSS transition
                }
            });
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    /* ---------- Main init ---------- */
    function init() {
        if (!ready()) {
            console.warn('[liquid-glass] Library not loaded — skipping glass effects.');
            return;
        }

        console.log('[liquid-glass] Initialising liquid glass effects…');

        // 1. Theme toggle (#themeToggle)
        var themeToggle = document.querySelector('#themeToggle');
        applyGlass(themeToggle, GLASS_CONFIG.themeToggle);

        // 2. Nav Resume button
        var resumeBtn = document.querySelector('.nav-resume');
        applyGlass(resumeBtn, GLASS_CONFIG.resumeBtn);

        // 3. "Get in touch" primary CTA (hero section)
        //    There may be multiple .btn-primary on the page; we target the hero one.
        var ctaBtns = document.querySelectorAll('.stage-actions .btn-primary');
        ctaBtns.forEach(function (btn) {
            applyGlass(btn, GLASS_CONFIG.ctaBtn);
        });

        // Also apply to any other standalone "Get in touch" .btn-primary
        // linked to #contact
        var allPrimary = document.querySelectorAll('a.btn-primary[href="#contact"]');
        allPrimary.forEach(function (btn) {
            applyGlass(btn, GLASS_CONFIG.ctaBtn);
        });

        // 4. Project card arrows
        var arrows = document.querySelectorAll('.proj-mini-arrow');
        arrows.forEach(function (arrow) {
            applyGlass(arrow, GLASS_CONFIG.arrowBtn);
        });

        // 5. Alex chatbot mute toggle (dynamically injected)
        waitForElement('.alex-mute', 10000).then(function (muteEl) {
            if (muteEl) {
                applyGlass(muteEl, GLASS_CONFIG.muteBtn);
            }
        });

        // Watch for theme changes to refresh glass captures
        watchThemeChanges();

        console.log('[liquid-glass] ✓ Glass effects applied.');
    }

    /* ---------- Boot ---------- */
    // Wait for DOM + a brief moment for layout to settle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(init, 1200);
        });
    } else {
        // DOM already parsed (script at end of body)
        setTimeout(init, 1200);
    }
})();
