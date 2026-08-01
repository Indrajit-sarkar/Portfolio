/* ============================================================
   INDRAJIT SARKAR — PORTFOLIO 2027
   Interaction engine. Progressive enhancement:
   the site stays fully usable if any CDN library fails.
   ============================================================ */
(() => {
    'use strict';

    const doc = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

    doc.classList.add('anim-ready');

    /* ---------- Theme ---------- */
    function initTheme() {
        const btn = $('#themeToggle');
        const saved = localStorage.getItem('theme');
        if (saved) doc.dataset.theme = saved;
        const sync = () => btn && btn.setAttribute('aria-checked', String(doc.dataset.theme === 'dark'));
        sync();
        btn && btn.addEventListener('click', () => {
            doc.dataset.theme = doc.dataset.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', doc.dataset.theme);
            sync();
        });
    }

    /* ---------- Smooth scroll (Lenis, desktop only) ---------- */
    let lenis = null;
    function initLenis() {
        if (reduced || !finePointer || typeof window.Lenis !== 'function') return;
        try {
            lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
            doc.style.scrollBehavior = 'auto';
            const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
            requestAnimationFrame(raf);
            if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
        } catch (e) { lenis = null; }
    }

    function scrollToTarget(target) {
        const el = typeof target === 'string' ? $(target) : target;
        if (!el) return;
        const go = () => {
            const y = el.getBoundingClientRect().top + window.scrollY - 84;
            if (lenis) lenis.scrollTo(y);
            else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
        };
        go();
        // content-visibility:auto sections use estimated heights until rendered —
        // re-aim once layout has settled so distant anchors land precisely
        setTimeout(go, 450);
    }

    function initAnchors() {
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a || a.classList.contains('skip-link')) return;
            const id = a.getAttribute('href');
            if (id.length < 2) return;
            const el = $(id);
            if (!el) return;
            e.preventDefault();
            scrollToTarget(el);
            history.replaceState(null, '', id);
            closeMenu();
        });
    }

    /* ---------- Navigation ---------- */
    const navBar = $('#navBar');
    const navMenu = $('#navMenu');
    const navToggle = $('#navToggle');

    function closeMenu() {
        navMenu && navMenu.classList.remove('is-open');
        navToggle && navToggle.classList.remove('is-open');
        navToggle && navToggle.setAttribute('aria-expanded', 'false');
    }

    function initNav() {
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const open = navMenu.classList.toggle('is-open');
                navToggle.classList.toggle('is-open', open);
                navToggle.setAttribute('aria-expanded', String(open));
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#navMenu') && !e.target.closest('#navToggle')) closeMenu();
            });
        }

        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            navBar && navBar.classList.toggle('is-scrolled', y > 30);
            if (navBar && !navMenu.classList.contains('is-open')) {
                navBar.classList.toggle('is-hidden', y > 500 && y > lastY + 6);
                if (y < lastY - 6) navBar.classList.remove('is-hidden');
            }
            lastY = y;
        }, { passive: true });

        // active section highlighting
        const links = $$('.nav-link[data-section], .bn-item[data-section]');
        const sections = $$('main section[id]');
        if ('IntersectionObserver' in window && sections.length) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((en) => {
                    if (!en.isIntersecting) return;
                    links.forEach((l) => l.classList.toggle('is-active', l.dataset.section === en.target.id));
                });
            }, { rootMargin: '-38% 0px -55% 0px' });
            sections.forEach((s) => io.observe(s));
        }
    }

    /* ---------- Scroll progress ---------- */
    function initProgress() {
        const bar = $('#progressBar');
        if (!bar) return;
        let ticking = false;
        const update = () => {
            const max = doc.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    }

    /* ---------- Split-letter titles ---------- */
    function initSplit() {
        $$('[data-split], [data-split-scrub]').forEach((el) => {
            const text = el.textContent;
            el.setAttribute('aria-label', text.trim());
            el.textContent = '';
            [...text].forEach((ch, i) => {
                const s = document.createElement('span');
                s.className = 'ltr';
                s.setAttribute('aria-hidden', 'true');
                s.textContent = ch === ' ' ? ' ' : ch;
                s.style.setProperty('--d', `${i * 0.045}s`);
                el.appendChild(s);
            });
        });
    }

    /* ---------- Reveal on scroll ---------- */
    function initReveal() {
        const items = $$('[data-reveal], [data-split], [data-split-scrub]');
        if (!('IntersectionObserver' in window) || reduced) {
            items.forEach((el) => el.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                const el = en.target;
                const delay = parseInt(el.dataset.revealDelay || '0', 10);
                if (delay) el.style.transitionDelay = `${delay}ms`;
                el.classList.add('is-in');
                io.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        items.forEach((el) => io.observe(el));
    }

    /* ---------- Typing effect ---------- */
    function initTyping() {
        const el = $('#typeText');
        if (!el) return;
        const roles = ['Azure AI Engineer', 'Problem Solver', 'Full-Stack Developer', 'Cloud Infrastructure Specialist'];
        if (reduced) { el.textContent = roles[0]; return; }
        let ri = 0, ci = roles[0].length, deleting = false;
        (function tick() {
            const word = roles[ri];
            el.textContent = word.substring(0, ci);
            let wait = deleting ? 40 : 85;
            if (!deleting && ci >= word.length) { deleting = true; wait = 2200; }
            else if (deleting && ci <= 0) { deleting = false; ri = (ri + 1) % roles.length; wait = 450; }
            else ci += deleting ? -1 : 1;
            setTimeout(tick, wait);
        })();
    }

    /* ---------- Counters & rings ---------- */
    function animateCount(el) {
        const target = parseFloat(el.dataset.count || '0');
        const dur = 1500, t0 = performance.now();
        const step = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function initCounters() {
        const nums = $$('[data-count]');
        const rings = $$('[data-ring]');
        if (!('IntersectionObserver' in window) || reduced) {
            nums.forEach((el) => { el.textContent = el.dataset.count; });
            rings.forEach((el) => { $('.ring-fill', el).style.strokeDasharray = `${el.dataset.ring}, 100`; });
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                const el = en.target;
                if (el.dataset.count !== undefined) animateCount(el);
                if (el.dataset.ring !== undefined) $('.ring-fill', el).style.strokeDasharray = `${el.dataset.ring}, 100`;
                io.unobserve(el);
            });
        }, { threshold: 0.5 });
        nums.concat(rings).forEach((el) => io.observe(el));
    }

    /* ---------- Education coverflow ---------- */
    function initEducation() {
        const track = $('#eduTrack');
        if (!track) return;
        const cards = $$('.edu-card', track);
        const dotsWrap = $('#eduDots');
        const dots = cards.map((_, i) => {
            const d = document.createElement('button');
            d.className = 'dot' + (i === 0 ? ' is-active' : '');
            d.setAttribute('aria-label', `Go to education ${i + 1}`);
            d.addEventListener('click', () => cards[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }));
            dotsWrap && dotsWrap.appendChild(d);
            return d;
        });

        let raf = null;
        const update = () => {
            raf = null;
            const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
            let best = 0, bestDist = Infinity;
            cards.forEach((card, i) => {
                const r = card.getBoundingClientRect();
                const dist = (r.left + r.width / 2) - mid;
                const n = Math.max(-1, Math.min(1, dist / (r.width * 1.1)));
                if (!reduced) {
                    card.style.setProperty('--ry', (n * -13).toFixed(2));
                    card.style.setProperty('--sc', (1 - Math.abs(n) * 0.07).toFixed(3));
                }
                if (Math.abs(dist) < bestDist) { bestDist = Math.abs(dist); best = i; }
            });
            dots.forEach((d, i) => d.classList.toggle('is-active', i === best));
        };
        track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
        window.addEventListener('resize', update);
        update();

        const step = (dir) => {
            const w = cards[0].getBoundingClientRect().width + 20;
            track.scrollBy({ left: dir * w, behavior: reduced ? 'auto' : 'smooth' });
        };
        $('#eduPrev') && $('#eduPrev').addEventListener('click', () => step(-1));
        $('#eduNext') && $('#eduNext').addEventListener('click', () => step(1));
    }

    /* ---------- Featured projects slider ---------- */
    function initFeatured() {
        const track = $('#featTrack');
        if (!track) return;
        const slides = $$('.feat-slide', track);
        const dotsWrap = $('#featDots');
        let idx = 0;
        const dots = slides.map((_, i) => {
            const d = document.createElement('button');
            d.className = 'dot' + (i === 0 ? ' is-active' : '');
            d.setAttribute('aria-label', `Project ${i + 1}`);
            d.addEventListener('click', () => go(i));
            dotsWrap && dotsWrap.appendChild(d);
            return d;
        });

        function go(i) {
            const prev = idx;
            idx = (i + slides.length) % slides.length;
            slides.forEach((s, k) => {
                s.classList.toggle('is-active', k === idx);
                s.classList.toggle('is-exit-left', k === prev && prev !== idx && ((prev < idx && !(prev === 0 && idx === slides.length - 1)) || (prev === slides.length - 1 && idx === 0)));
            });
            dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
        }

        $('#featPrev') && $('#featPrev').addEventListener('click', () => go(idx - 1));
        $('#featNext') && $('#featNext').addEventListener('click', () => go(idx + 1));

        // swipe
        let x0 = null;
        track.addEventListener('pointerdown', (e) => { x0 = e.clientX; }, { passive: true });
        track.addEventListener('pointerup', (e) => {
            if (x0 === null) return;
            const dx = e.clientX - x0;
            if (Math.abs(dx) > 48) go(idx + (dx < 0 ? 1 : -1));
            x0 = null;
        }, { passive: true });
    }

    /* ---------- Spline 3D (lazy) ---------- */
    function initSpline() {
        const mount = $('#splineMount');
        if (!mount || !('IntersectionObserver' in window)) return;
        const load = () => {
            if (mount.dataset.loaded) return;
            mount.dataset.loaded = '1';
            const s = document.createElement('script');
            s.type = 'module';
            s.src = 'https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js';
            document.head.appendChild(s);
            const v = document.createElement('spline-viewer');
            v.setAttribute('url', mount.dataset.scene);
            v.setAttribute('loading-anim-type', 'none');
            v.setAttribute('events-target', 'local');
            mount.appendChild(v);
            if (window.customElements && customElements.whenDefined) {
                customElements.whenDefined('spline-viewer').then(() => mount.classList.add('is-live')).catch(() => {});
            } else {
                mount.classList.add('is-live');
            }
        };
        new IntersectionObserver((en, io) => {
            if (en[0].isIntersecting) { io.disconnect(); load(); }
        }, { rootMargin: '700px' }).observe(mount);
    }

    /* ---------- Certificate 3D ring ---------- */
    function initRing() {
        const ring = $('#certRing');
        const stage = $('#ringStage');
        if (!ring || !stage) return;

        const certs = [
            ['5force', 'Porter Five Forces'],
            ['8d', '8D Problem Solving'],
            ['fmea', 'FMEA'],
            ['jit', 'Just In Time'],
            ['kano', 'Kano Analysis'],
            ['minitab', 'Minitab'],
            ['parento', 'Pareto Analysis'],
            ['qfd', 'Quality Function Deployment'],
            ['root-cause', 'Root Cause Analysis'],
            ['wbs', 'WBS Specialist'],
        ];
        certs.forEach(([slug, title], i) => {
            const item = document.createElement('div');
            item.className = 'ring-item';
            item.style.setProperty('--a', `${(360 / certs.length) * i}deg`);
            const img = document.createElement('img');
            img.src = `assets/opt/${slug}-480.webp`;
            img.alt = `${title} certificate`;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.dataset.lightbox = 'ring';
            img.dataset.full = `assets/opt/${slug}-1000.webp`;
            item.appendChild(img);
            ring.appendChild(item);
        });

        const size = () => {
            const w = stage.clientWidth;
            const cardW = Math.max(150, Math.min(250, w * 0.24));
            const radius = Math.max(240, Math.min(560, w * 0.36));
            ring.style.setProperty('--ring-card-w', `${cardW}px`);
            ring.style.setProperty('--ring-r', `${radius}px`);
        };
        size();
        window.addEventListener('resize', size);

        let angle = 0, vel = 0, dragging = false, lastX = 0, autoPaused = 0, visible = true, lastT = performance.now();

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((en) => { visible = en[0].isIntersecting; })
                .observe(stage);
        }

        stage.addEventListener('pointerdown', (e) => {
            dragging = true; lastX = e.clientX; vel = 0;
            stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
        });
        stage.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            lastX = e.clientX;
            angle += dx * 0.25;
            vel = dx * 0.25;
            autoPaused = performance.now() + 2600;
        });
        const end = () => { dragging = false; };
        stage.addEventListener('pointerup', end);
        stage.addEventListener('pointercancel', end);
        stage.addEventListener('pointerleave', end);

        (function spin(t) {
            const dt = Math.min(48, t - lastT); lastT = t;
            if (visible && !document.hidden) {
                if (!dragging) {
                    if (Math.abs(vel) > 0.05) { angle += vel; vel *= 0.95; }
                    else if (!reduced && t > autoPaused) angle -= dt * 0.008;
                }
                ring.style.transform = `rotateX(-7deg) rotateY(${angle}deg)`;
            }
            requestAnimationFrame(spin);
        })(performance.now());
    }

    /* ---------- Lightbox ---------- */
    function initLightbox() {
        const box = $('#lightbox');
        const img = $('#lightboxImg');
        if (!box || !img) return;
        let group = [], idx = 0, returnFocus = null;

        const fullSrc = (el) =>
            el.dataset.full ||
            (el.currentSrc || el.src).replace('-640.webp', '-1280.webp').replace('-480.webp', '-1000.webp');

        function show(i) {
            idx = (i + group.length) % group.length;
            img.src = fullSrc(group[idx]);
            img.alt = group[idx].alt || 'Expanded view';
        }
        function open(target) {
            group = $$(`img[data-lightbox="${target.dataset.lightbox}"]`);
            show(group.indexOf(target));
            returnFocus = target;
            box.hidden = false;
            requestAnimationFrame(() => box.classList.add('is-open'));
            document.body.style.overflow = 'hidden';
            $('#lbClose').focus();
        }
        function close() {
            box.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { box.hidden = true; img.src = ''; }, 320);
            if (returnFocus) { returnFocus.focus(); returnFocus = null; }
        }

        // keyboard-operable triggers
        const armTrigger = (t) => {
            if (t.dataset.lbArmed) return;
            t.dataset.lbArmed = '1';
            t.setAttribute('tabindex', '0');
            t.setAttribute('role', 'button');
        };
        $$('img[data-lightbox]').forEach(armTrigger);
        new MutationObserver(() => $$('img[data-lightbox]').forEach(armTrigger))
            .observe(document.body, { childList: true, subtree: true });

        document.addEventListener('click', (e) => {
            const t = e.target.closest('img[data-lightbox]');
            if (t) { e.preventDefault(); open(t); }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const t = e.target.closest && e.target.closest('img[data-lightbox]');
            if (t) { e.preventDefault(); open(t); }
        });
        img.addEventListener('error', () => {
            if (group[idx]) img.src = group[idx].currentSrc || group[idx].src;
        }, true);
        $('#lbClose').addEventListener('click', close);
        $('#lbPrev').addEventListener('click', () => show(idx - 1));
        $('#lbNext').addEventListener('click', () => show(idx + 1));
        box.addEventListener('click', (e) => { if (e.target === box) close(); });
        document.addEventListener('keydown', (e) => {
            if (box.hidden) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') show(idx - 1);
            if (e.key === 'ArrowRight') show(idx + 1);
        });
    }

    /* ---------- Skill sheet ---------- */
    function initSkillSheet() {
        const sheet = $('#skillSheet');
        if (!sheet) return;
        const title = $('#sheetTitle'), desc = $('#sheetDesc'), link = $('#sheetLink');
        let returnFocus = null;
        function open(chip) {
            title.textContent = chip.dataset.name;
            desc.textContent = chip.dataset.desc;
            link.href = chip.dataset.link;
            returnFocus = chip;
            sheet.hidden = false;
            requestAnimationFrame(() => sheet.classList.add('is-open'));
            $('#sheetClose').focus();
        }
        function close() {
            sheet.classList.remove('is-open');
            setTimeout(() => { sheet.hidden = true; }, 320);
            if (returnFocus) { returnFocus.focus(); returnFocus = null; }
        }
        $$('.skill-chip').forEach((c) => c.addEventListener('click', () => open(c)));
        $('#sheetClose').addEventListener('click', close);
        sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
        document.addEventListener('keydown', (e) => { if (!sheet.hidden && e.key === 'Escape') close(); });
    }

    /* ---------- Copy to clipboard + toast ---------- */
    function initCopy() {
        const toast = $('#toast');
        let timer;
        const notify = (msg) => {
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('is-show');
            clearTimeout(timer);
            timer = setTimeout(() => toast.classList.remove('is-show'), 2200);
        };
        $$('[data-copy]').forEach((el) => {
            el.addEventListener('click', () => {
                const text = el.dataset.copy;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text)
                        .then(() => notify('Copied to clipboard ✓'))
                        .catch(() => notify(text));
                } else notify(text);
            });
        });
    }

    /* ---------- Volunteer arrows ---------- */
    function initVolunteer() {
        const track = $('#volTrack');
        if (!track) return;
        const step = (dir) => {
            const card = $('.vol-card', track);
            const w = card ? card.getBoundingClientRect().width + 20 : 360;
            track.scrollBy({ left: dir * w, behavior: reduced ? 'auto' : 'smooth' });
        };
        $('#volPrev') && $('#volPrev').addEventListener('click', () => step(-1));
        $('#volNext') && $('#volNext').addEventListener('click', () => step(1));
    }

    /* ---------- Contact form (EmailJS) ---------- */
    function initContact() {
        const form = $('#contactForm');
        if (!form) return;
        const status = $('#formStatus');
        const submit = $('.form-submit', form);

        if (window.emailjs) {
            try { emailjs.init({ publicKey: 'dH-MdfZjVa62Ljuty' }); }
            catch (e) { try { emailjs.init('dH-MdfZjVa62Ljuty'); } catch (e2) { /* noop */ } }
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: $('#contactName').value.trim(),
                email: $('#contactEmail').value.trim(),
                message: $('#contactMessage').value.trim(),
            };
            if (!data.name || !data.email || !data.message) {
                status.textContent = 'Please fill in all fields.';
                status.className = 'form-status error';
                return;
            }
            if (!window.emailjs) {
                window.location.href =
                    `mailto:sarkar.sarkar.indrajit01@gmail.com?subject=${encodeURIComponent('Portfolio message from ' + data.name)}&body=${encodeURIComponent(data.message + '\n\n— ' + data.name + ' (' + data.email + ')')}`;
                return;
            }
            submit.classList.add('is-loading');
            submit.disabled = true;
            status.textContent = '';
            status.className = 'form-status';
            emailjs.send('service_yid3m2x', 'template_0z1jl8a', data)
                .then(() => {
                    status.textContent = "✓ Message sent successfully! I'll get back to you soon.";
                    status.className = 'form-status success';
                    form.reset();
                    setTimeout(() => { status.textContent = ''; status.className = 'form-status'; }, 6000);
                })
                .catch(() => {
                    status.textContent = '✗ Failed to send. Please email me directly instead.';
                    status.className = 'form-status error';
                })
                .finally(() => {
                    submit.classList.remove('is-loading');
                    submit.disabled = false;
                });
        });
    }

    /* ---------- Magnetic buttons ---------- */
    function initMagnetic() {
        if (!finePointer || reduced) return;
        $$('[data-magnetic]').forEach((el) => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
                const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
                el.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
            });
            el.addEventListener('mouseleave', () => { el.style.transform = ''; });
        });
    }

    /* ---------- Tilt cards ---------- */
    function initTilt() {
        if (!finePointer || reduced) return;
        const attach = (el, max) => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
            });
        };
        $$('[data-tilt]').forEach((el) => attach(el, 8));
        $$('[data-tilt-soft]').forEach((el) => attach(el, 2.5));
    }

    /* ---------- Glow tracking (skills) ---------- */
    function initGlow() {
        if (!finePointer) return;
        $$('.glow-track').forEach((el) => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', `${e.clientX - r.left}px`);
                el.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    /* ---------- Custom cursor ---------- */
    function initCursor() {
        if (!finePointer || reduced) return;
        const dot = $('#cursorDot'), ringEl = $('#cursorRing');
        if (!dot || !ringEl) return;
        let mx = -100, my = -100, rx = -100, ry = -100;
        window.addEventListener('mousemove', (e) => {
            mx = e.clientX; my = e.clientY;
            dot.style.left = `${mx}px`;
            dot.style.top = `${my}px`;
        }, { passive: true });
        (function follow() {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            ringEl.style.left = `${rx}px`;
            ringEl.style.top = `${ry}px`;
            requestAnimationFrame(follow);
        })();
        document.addEventListener('mouseover', (e) => {
            document.body.classList.toggle(
                'cursor-hover',
                !!e.target.closest('a, button, .skill-chip, [data-lightbox]')
            );
        });
    }

    /* ---------- GSAP flourishes (optional) ---------- */
    function initGsap() {
        if (reduced || !window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(window.ScrollTrigger);

        gsap.to('#heroInner', {
            opacity: 0.15, scale: 0.94, yPercent: -5, ease: 'none',
            scrollTrigger: { trigger: '#hero', start: 'top top', end: '85% top', scrub: 0.4 },
        });

        gsap.fromTo('.proj-hero-title', { yPercent: 16 }, {
            yPercent: -10, ease: 'none',
            scrollTrigger: { trigger: '.proj-hero', start: 'top bottom', end: 'bottom top', scrub: 0.4 },
        });

        $$('.ach-featured-media img').forEach((el) => {
            gsap.fromTo(el, { yPercent: -6 }, {
                yPercent: 6, ease: 'none',
                scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
            });
        });
    }

    /* ---------- Misc ---------- */
    function initMisc() {
        const y = $('#year');
        if (y) y.textContent = String(new Date().getFullYear());
        const toTop = $('#toTop');
        toTop && toTop.addEventListener('click', () => {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        });
    }

    /* ---------- Boot ---------- */
    function boot() {
        initTheme();
        initLenis();
        initAnchors();
        initNav();
        initProgress();
        initSplit();
        initReveal();
        initTyping();
        initCounters();
        initEducation();
        initFeatured();
        initSpline();
        initRing();
        initLightbox();
        initSkillSheet();
        initCopy();
        initVolunteer();
        initContact();
        initMagnetic();
        initTilt();
        initGlow();
        initCursor();
        initGsap();
        initMisc();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
