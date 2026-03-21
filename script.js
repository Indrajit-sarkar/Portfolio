/* ========================================
   INDRAJIT SARKAR - ULTRA PREMIUM PORTFOLIO
   Apple-Inspired Interactive JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initBannerParallax();
    initPageLoader();
    initThemeToggle();
    initScrollProgress();
    initNavigation();
    initHeroParallax();
    initTypingEffect();
    initCarousel();
    initCounters();
    initScrollReveal();
    initCopyToClipboard();
    initTiltCards();
    initMagneticButtons();
    initDynamicOrbs();
    initLogoModal();
    initMobileBottomNav();
    initHeroStats();
    initTextScramble();
    initInteractiveOrb(); // Interactive orb mouse tracking
    // initCustomCursor(); // Disabled custom cursor
    initSmoothScroll();
    initParallaxSections();
    initEnhancedGlassEffect();
    initFloatingElements();
    initScrollLinkedAnimations();
    initCertificateSections(); // Interactive 3D and slider certifications
    initProjectSections(); // Interactive 3D and carousel projects
    initShootingStars(); // Animated shooting stars for dark mode
    initContactForm(); // Contact form handler
});

/* ========== BANNER PARALLAX (from Intro) ========== */
function initBannerParallax() {
    const listBg = document.querySelectorAll('.banner .bg');
    const titleBanner = document.querySelector('.banner h1');
    if (listBg.length === 0) return;

    window.addEventListener('scroll', () => {
        const top = window.scrollY;
        listBg.forEach((bg, index) => {
            if (index !== 0 && index !== 8) {
                bg.style.transform = `translateY(${(top * index / 2)}px)`;
            } else if (index === 0) {
                bg.style.transform = `translateY(${(top / 3)}px)`;
            }
        });
        if (titleBanner) {
            titleBanner.style.transform = `translateY(${(top * 4 / 2)}px)`;
        }
    }, { passive: true });
}

/* ========== PAGE LOADER ========== */
function initPageLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        }, 1800);
    });
    // Fallback: hide after 4s max
    setTimeout(() => { if (loader) { loader.classList.add('hidden'); } }, 4000);
}

/* ========== THEME TOGGLE ========== */
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeMeta(saved);
    }
    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeMeta(next);
    });
}
function updateThemeMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#000000' : '#f5f5f7';
}

/* ========== SCROLL PROGRESS ========== */
function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const h = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/* ========== NAVIGATION ========== */
function initNavigation() {
    const nav = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    const links = document.querySelectorAll('.nav-link');
    if (!nav || !toggle || !menu) return;

    // Hamburger toggle
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
    });

    // Close on link click
    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
        });
    });

    // Scrolled state
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                nav.classList.toggle('scrolled', window.scrollY > 50);
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // Active link tracking
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                if (active) active.classList.add('active');
            }
        });
    }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });
    sections.forEach(s => observer.observe(s));

    // Back to top
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/* ========== HERO PARALLAX ========== */
function initHeroParallax() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: 0, y: 0 };
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    // Increased particle count for full screen density
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 0.5, o: Math.random() * 0.5 + 0.1
        });
    }

    document.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    function animate() {
        ctx.clearRect(0, 0, w, h);
        const theme = document.documentElement.getAttribute('data-theme');
        const color = theme === 'light' ? '29,29,31' : '255,255,255';

        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            const dx = mouse.x - p.x, dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                p.x -= dx * 0.01;
                p.y -= dy * 0.01;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${p.o})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${color}, ${0.05 * (1 - d / 120)})`;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/* ========== TYPING EFFECT ========== */
function initTypingEffect() {
    const el = document.getElementById('typingText');
    if (!el) return;
    const texts = [
        'Azure AI Engineer ',
        'Problem Solver ',
        'Full-Stack Developer ',
        'Cloud Infrastructure Specialist '
    ];
    let textIndex = 0, charIndex = 0, deleting = false;

    function type() {
        const current = texts[textIndex];
        el.textContent = deleting
            ? current.substring(0, charIndex--)
            : current.substring(0, charIndex++);

        if (!deleting && charIndex >= current.length) {
            setTimeout(() => { deleting = true; type(); }, 2000);
            return;
        }
        if (deleting && charIndex < 0) {
            deleting = false;
            textIndex = (textIndex + 1) % texts.length;
            setTimeout(type, 500);
            return;
        }
        setTimeout(type, deleting ? 30 : 80);
    }
    setTimeout(type, 1500);
}

/* ========== EDUCATION CAROUSEL ========== */
function initCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    if (!track || slides.length === 0) return;

    let current = 0, startX = 0, isDragging = false, diff = 0;

    function goToSlide(i) {
        current = ((i % slides.length) + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(current + 1));
    dots.forEach(d => d.addEventListener('click', () => goToSlide(+d.dataset.slide)));

    // Touch/drag
    const getX = e => e.touches ? e.touches[0].clientX : e.clientX;
    track.addEventListener('touchstart', e => { startX = getX(e); isDragging = true; }, { passive: true });
    track.addEventListener('mousedown', e => { startX = getX(e); isDragging = true; });
    track.addEventListener('touchmove', e => { if (isDragging) diff = getX(e) - startX; }, { passive: true });
    track.addEventListener('mousemove', e => { if (isDragging) diff = getX(e) - startX; });
    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        if (Math.abs(diff) > 50) goToSlide(diff > 0 ? current - 1 : current + 1);
        diff = 0;
    };
    track.addEventListener('touchend', endDrag);
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);

    // Auto-advance
    let autoInterval = setInterval(() => goToSlide(current + 1), 6000);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoInterval));
    track.parentElement.addEventListener('mouseleave', () => {
        autoInterval = setInterval(() => goToSlide(current + 1), 6000);
    });
}

/* ========== ANIMATED COUNTERS ========== */
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                entry.target.dataset.counted = 'true';
                const parent = entry.target.closest('.metric');
                if (!parent) return;
                const target = +parent.dataset.value;
                const suffix = parent.dataset.suffix || '';
                const duration = 2000;
                const start = performance.now();

                function animate(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 4);
                    entry.target.textContent = Math.floor(target * eased) + suffix;
                    if (progress < 1) requestAnimationFrame(animate);
                }
                requestAnimationFrame(animate);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
}

/* ========== SCROLL REVEAL ========== */
function initScrollReveal() {
    const elements = document.querySelectorAll('[data-scroll]');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger delay for siblings
                const parent = entry.target.parentElement;
                const siblings = parent ? parent.querySelectorAll('[data-scroll]') : [];
                let delay = 0;
                siblings.forEach((sib, idx) => {
                    if (sib === entry.target) delay = idx * 100;
                });
                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

/* ========== COPY TO CLIPBOARD ========== */
function initCopyToClipboard() {
    const items = document.querySelectorAll('.contact-item[data-copy]');
    const toast = document.getElementById('toast');
    items.forEach(item => {
        const btn = item.querySelector('.copy-btn');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const text = item.dataset.copy;
            try {
                await navigator.clipboard.writeText(text);
                if (toast) {
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 2500);
                }
            } catch { /* fallback: do nothing */ }
        });
    });
}

/* ========== TILT CARDS ========== */
function initTiltCards() {
    if (window.matchMedia('(hover: none)').matches) return; // Skip on touch
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = (y - 0.5) * 8;
            const ry = (x - 0.5) * -8;
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
            // Mouse spotlight
            card.style.setProperty('--mouse-x', (x * 100) + '%');
            card.style.setProperty('--mouse-y', (y * 100) + '%');
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* ========== MAGNETIC BUTTONS ========== */
function initMagneticButtons() {
    if (window.matchMedia('(hover: none)').matches) return;
    const magnetics = document.querySelectorAll('.magnetic');
    magnetics.forEach(el => {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) * 0.2;
            const dy = (e.clientY - cy) * 0.2;
            el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
            el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            setTimeout(() => { el.style.transition = ''; }, 400);
        });
    });
}

/* ========== DYNAMIC ORBS ========== */
function initDynamicOrbs() {
    const orbs = document.querySelectorAll('.gradient-orb');
    if (orbs.length === 0) return;
    let mouseX = 0.5, mouseY = 0.5;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
    }, { passive: true });

    function animateOrbs() {
        orbs.forEach((orb, i) => {
            const speed = (i + 1) * 15;
            const ox = (mouseX - 0.5) * speed;
            const oy = (mouseY - 0.5) * speed;
            orb.style.transform = `translate(${ox}px, ${oy}px)`;
        });
        requestAnimationFrame(animateOrbs);
    }
    animateOrbs();
}

/* ========== LOGO MODAL ========== */
function initLogoModal() {
    const logoLink = document.getElementById('navLogoLink');
    const modal = document.getElementById('logoModal');
    const closeBtn = document.getElementById('logoModalClose');
    if (!logoLink || !modal) return;

    logoLink.addEventListener('click', e => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
}

/* ========== MOBILE BOTTOM NAV ========== */
function initMobileBottomNav() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    if (navItems.length === 0) return;

    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navItems.forEach(item => {
                    item.classList.toggle('active', item.dataset.section === entry.target.id);
                });
            }
        });
    }, { threshold: 0.3 });
    sections.forEach(s => observer.observe(s));
}

/* ========== HERO STATS COUNTER ========== */
function initHeroStats() {
    const stats = document.querySelectorAll('.hero-stat-number');
    if (stats.length === 0) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                entry.target.dataset.counted = 'true';
                const target = +entry.target.dataset.count;
                const duration = 1500;
                const start = performance.now();
                function animate(now) {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    entry.target.textContent = Math.floor(target * eased) + '+';
                    if (progress < 1) requestAnimationFrame(animate);
                }
                requestAnimationFrame(animate);
            }
        });
    }, { threshold: 0.5 });
    stats.forEach(s => observer.observe(s));
}

/* ========== TEXT SCRAMBLE ========== */
function initTextScramble() {
    const elements = document.querySelectorAll('.scramble-text');
    if (elements.length === 0) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.scrambled) {
                entry.target.dataset.scrambled = 'true';
                const text = entry.target.textContent;
                let iteration = 0;
                const interval = setInterval(() => {
                    entry.target.textContent = text.split('').map((char, i) => {
                        if (i < iteration) return text[i];
                        if (char === ' ') return ' ';
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join('');
                    iteration += 1 / 2;
                    if (iteration >= text.length) clearInterval(interval);
                }, 30);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    elements.forEach(el => observer.observe(el));
}

/* ========== CUSTOM CURSOR ========== */
function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    }, { passive: true });

    function animate() {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;

        cursorX += dx * 0.2;
        cursorY += dy * 0.2;

        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        requestAnimationFrame(animate);
    }
    animate();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('a, button, .btn, .nav-link, .project-card, .cert-card, input, textarea');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        el.addEventListener('touchstart', () => cursor.classList.add('hover'), { passive: true });
        el.addEventListener('touchend', () => cursor.classList.remove('hover'), { passive: true });
    });
}

/* ========== SMOOTH SCROLL ========== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (!target) return;

            const offsetTop = target.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        });
    });
}

/* ========== PARALLAX SECTIONS ========== */
function initParallaxSections() {
    // Disabled - keeping text stable
    return;
}

/* ========== ENHANCED GLASS EFFECT ========== */
function initEnhancedGlassEffect() {
    const glassCards = document.querySelectorAll('.glass-card, .glass-card-enhanced');

    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            card.style.setProperty('--mouse-x', x + '%');
            card.style.setProperty('--mouse-y', y + '%');
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });
}

/* ========== FLOATING ELEMENTS ========== */
function initFloatingElements() {
    // Disabled - keeping elements stable
    return;
}

/* ========== SCROLL-LINKED ANIMATIONS ========== */
function initScrollLinkedAnimations() {
    // Disabled - keeping content stable
    return;
}

/* ========== ENHANCED COUNTER ANIMATION ========== */
function animateValue(element, start, end, duration, suffix = '') {
    const range = end - start;
    const startTime = performance.now();

    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = start + (range * eased);

        element.textContent = Math.floor(current) + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* ========== ENHANCED TILT CARDS ========== */
function initTiltCards() {
    if (window.matchMedia('(hover: none)').matches) return;

    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
        let bounds;

        card.addEventListener('mouseenter', () => {
            bounds = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', (e) => {
            if (!bounds) return;

            const x = (e.clientX - bounds.left) / bounds.width;
            const y = (e.clientY - bounds.top) / bounds.height;

            // Subtle tilt - reduced from 12 to 6 degrees
            const rx = (y - 0.5) * 6;
            const ry = (x - 0.5) * -6;

            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
            card.style.setProperty('--mouse-x', (x * 100) + '%');
            card.style.setProperty('--mouse-y', (y * 100) + '%');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            setTimeout(() => {
                card.style.transition = '';
            }, 400);
        });
    });
}

/* ========== ENHANCED MAGNETIC BUTTONS ========== */
function initMagneticButtons() {
    if (window.matchMedia('(hover: none)').matches) return;

    const magnetics = document.querySelectorAll('.magnetic');

    magnetics.forEach(el => {
        let bounds;

        el.addEventListener('mouseenter', () => {
            bounds = el.getBoundingClientRect();
        });

        el.addEventListener('mousemove', (e) => {
            if (!bounds) return;

            const cx = bounds.left + bounds.width / 2;
            const cy = bounds.top + bounds.height / 2;

            // Subtle magnetic effect - reduced from 0.3 to 0.15
            const dx = (e.clientX - cx) * 0.15;
            const dy = (e.clientY - cy) * 0.15;

            el.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
            el.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            setTimeout(() => {
                el.style.transition = '';
            }, 400);
        });
    });
}

/* ========== ENHANCED SCROLL REVEAL ========== */
function initScrollReveal() {
    const elements = document.querySelectorAll('[data-scroll]');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const parent = entry.target.parentElement;
                const siblings = parent ? Array.from(parent.querySelectorAll('[data-scroll]')) : [];
                const index = siblings.indexOf(entry.target);
                const delay = index >= 0 ? index * 80 : 0;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    elements.forEach(el => {
        observer.observe(el);
    });
}

/* ========== INTERACTIVE ORB MOUSE TRACKING ========== */
function initInteractiveOrb() {
    const orb = document.getElementById('interactiveOrb');
    if (!orb) return;

    let mouseX = window.innerWidth * 0.1; // Start at 10% from left
    let mouseY = window.innerHeight * 0.1; // Start at 10% from top
    let orbX = mouseX;
    let orbY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    function animateOrb() {
        // Smooth follow with easing
        const dx = mouseX - orbX;
        const dy = mouseY - orbY;

        orbX += dx * 0.03; // Slower follow
        orbY += dy * 0.03;

        // Apply transform
        orb.style.transform = `translate(${orbX - 150}px, ${orbY - 150}px)`;

        requestAnimationFrame(animateOrb);
    }

    animateOrb();
}



/* ========== DYNAMIC CERTIFICATIONS WITH LAZY LOADING ========== */
function initCertifications() {
    console.log('initCertifications called');
    const grid = document.getElementById('certificationsGrid');
    if (!grid) {
        console.error('certificationsGrid not found!');
        return;
    }
    console.log('Grid found:', grid);

    // Certificate data array
    const certificates = [
        'AI-102.pdf',
        'PowerBi PL-300.pdf',
        'AZ-900.pdf',
        'Lean Six sigma Black Belt.pdf',
        'Lean Six sigma Green Belt.pdf',
        'Lean SIx sigma Yellow Belt.pdf',
        'Lean Six sigma White Belt.pdf',
        'Lean six sigma from Six sigma Academy Amsterdam.pdf',
        'AIGPE FEMA.pdf',
        'AIGPE FIVE FORCE.pdf',
        'AIGPE Mini Tab Beginner.pdf',
        'AIGPE PARENTO .pdf',
        'AIGPE QUALITY Function.pdf',
        'Just In time.pdf',
        'AIGPE AI-POWERED  ROOT CAUSE ANALYSIS.pdf',
        'AIGPE AI-POWERED WBS SPECIALIST.pdf',
        'AIGPE KANO ANALYSIS SPECIALIST.pdf',
        '8D PROBLEM SOLVING EXPERT .pdf',
        'Cyber security certificate.pdf',
        'Google Cloud Computing Foundations.pdf',
        'Internship certificate.pdf'
    ];

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'cert-modal-overlay';

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'cert-card-preview expanded';
    modalContent.style.display = 'none';
    modalContent.style.flexDirection = 'column';
    modalContent.style.height = '90vh';

    // Append to overlay
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // Function to clean filename for display
    function cleanTitle(filename) {
        return filename
            .replace('.pdf', '')
            .replace(/_/g, ' ')
            .replace(/AIGPE /g, '')
            .replace(/  +/g, ' ')
            .trim();
    }

    // Function to expand card
    function expandCard(card, title, pdfUrl, pdfPath) {
        console.log('expandCard called', title);

        // Populate modal content
        modalContent.innerHTML = `
            <div class="cert-preview-container" style="flex: 1; min-height: 0;">
                <iframe 
                    class="cert-preview-iframe" 
                    src="${pdfUrl}"
                    title="${title} Preview"
                    style="width: 100%; height: 100%;"
                ></iframe>
            </div>
            <div class="cert-card-content">
                <h3 class="cert-card-title">${title}</h3>
                <div class="cert-card-actions">
                    <button class="cert-btn cert-btn-close magnetic cert-close-btn" id="modalCloseBtn">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Close
                    </button>
                    <a href="${pdfPath}" target="_blank" rel="noopener" class="cert-btn cert-btn-primary magnetic light-sweep">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                        View in New Tab
                    </a>
                </div>
            </div>
        `;

        console.log('Showing overlay');
        modalContent.style.display = 'flex';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add event listener to the new close button
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                collapseCard();
            });
        }
    }

    // Function to collapse card
    function collapseCard() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';

        setTimeout(() => {
            modalContent.style.display = 'none';
            modalContent.innerHTML = ''; // Clear iframe to free memory
        }, 500); // Wait for transition
    }

    // Create card HTML
    function createCertCard(filename) {
        const title = cleanTitle(filename);
        const pdfPath = `Certificates/${filename}`;
        const pdfUrl = `${pdfPath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

        const card = document.createElement('div');
        card.className = 'cert-card-preview glass-card tilt-card';
        card.innerHTML = `
            <div class="cert-preview-container">
                <div class="cert-loading">
                    <div class="cert-loading-spinner"></div>
                </div>
                <iframe 
                    class="cert-preview-iframe" 
                    data-src="${pdfUrl}"
                    title="${title} Preview"
                    loading="lazy"
                ></iframe>
            </div>
            <div class="cert-card-content">
                <h3 class="cert-card-title">${title}</h3>
                <div class="cert-card-actions">
                    <button class="cert-btn cert-btn-close magnetic cert-close-btn" style="display: none;">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Close
                    </button>
                    <a href="${pdfPath}" target="_blank" rel="noopener" class="cert-btn cert-btn-primary magnetic light-sweep" style="display: none;">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                        View in New Tab
                    </a>
                </div>
            </div>
        `;

        // Add click handler for close button
        const closeBtn = card.querySelector('.cert-close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            collapseCard(card);
        });

        // Add click handler for card to expand
        card.addEventListener('click', (e) => {
            console.log('Card clicked!', e.target);

            // Don't expand if clicking on a link or button
            if (e.target.closest('a') || e.target.closest('button')) {
                console.log('Clicked on button/link, not expanding');
                return;
            }

            console.log('Expanding card...');
            expandCard(card, title, pdfUrl, pdfPath);
        });

        return card;
    }

    // Render all cards
    certificates.forEach((filename, index) => {
        console.log(`Creating card ${index + 1}:`, filename);
        const card = createCertCard(filename);
        grid.appendChild(card);
        console.log(`Card ${index + 1} added to grid`);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            collapseCard();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            collapseCard();
        }
    });

    // Lazy loading with IntersectionObserver
    const lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const iframe = card.querySelector('.cert-preview-iframe');
                const loading = card.querySelector('.cert-loading');

                if (iframe && iframe.dataset.src && !iframe.src) {
                    // Set the src to start loading
                    iframe.src = iframe.dataset.src;

                    // Hide loading indicator when iframe loads
                    iframe.addEventListener('load', () => {
                        setTimeout(() => {
                            loading.classList.add('hidden');
                        }, 300);
                    });

                    // Fallback: hide loading after 3 seconds
                    setTimeout(() => {
                        loading.classList.add('hidden');
                    }, 3000);
                }

                // Stop observing this card
                lazyLoadObserver.unobserve(card);
            }
        });
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });

    // Observe all cards
    const cards = grid.querySelectorAll('.cert-card-preview');
    cards.forEach(card => lazyLoadObserver.observe(card));

    // Re-initialize tilt and magnetic effects for new cards
    // Re-initialize tilt and magnetic effects for new cards
    if (typeof initTiltCards === 'function') {
        setTimeout(() => initTiltCards(), 100);
    }
    if (typeof initMagneticButtons === 'function') {
        setTimeout(() => initMagneticButtons(), 100);
    }
}

/* ========== SHOOTING STARS ANIMATION ========== */
function initShootingStars() {
    // Create the container for shooting stars
    const container = document.createElement('div');
    container.className = 'shooting-stars-container';
    document.body.appendChild(container);

    // Function to generate a shooting star
    function createShootingStar() {
        // Only run if we are in dark mode
        if (document.documentElement.getAttribute('data-theme') !== 'dark') {
            return;
        }

        const star = document.createElement('div');
        star.className = 'shooting-star';

        // Randomize the starting position along the left or bottom edge
        // To ensure it flies across the screen from bottom-left to top-right
        const startX = Math.random() * (window.innerWidth / 2); // Start in the left half
        const startY = (window.innerHeight / 2) + (Math.random() * (window.innerHeight / 2)); // Start in the bottom half

        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;

        // Append star and remove it after animation (1.5s total time)
        container.appendChild(star);
        setTimeout(() => {
            star.remove();
        }, 1500);
    }

    // Spawn stars continuously at randomized intervals between 2s and 6s
    function scheduleNextStar() {
        const randomDelay = Math.random() * 4000 + 2000;
        setTimeout(() => {
            createShootingStar();
            scheduleNextStar();
        }, randomDelay);
    }

    // Start the spawning loop
    scheduleNextStar();
}




/* ========================================= */
/* PROJECTS section JS from Projects part1 */
/* ========================================= */
function initProjectSections() {
    // Project Carousel
    let nextDom = document.getElementById('projNext');
    let prevDom = document.getElementById('projPrev');
    let carouselDom = document.querySelector('.proj-carousel');
    if (!carouselDom || !nextDom || !prevDom) return;

    let SliderDom = carouselDom.querySelector('.proj-carousel-list');
    let thumbnailBorderDom = carouselDom.querySelector('.proj-carousel-thumbnail');
    let thumbnailItemsDom = thumbnailBorderDom.querySelectorAll('.proj-thumb-item');
    let timeDom = carouselDom.querySelector('.proj-carousel-time');

    if (thumbnailItemsDom.length > 0) {
        thumbnailBorderDom.appendChild(thumbnailItemsDom[0]);
    }
    let timeRunning = 3000;
    let timeAutoNext = 7000;

    nextDom.onclick = function() {
        showSlider('next');
    };
    prevDom.onclick = function() {
        showSlider('prev');
    };

    let runTimeOut;
    let runNextAuto = setTimeout(() => {
        nextDom.click();
    }, timeAutoNext);

    function showSlider(type) {
        let SliderItemsDom = SliderDom.querySelectorAll('.proj-carousel-item');
        let thumbItems = thumbnailBorderDom.querySelectorAll('.proj-thumb-item');

        if (type === 'next') {
            SliderDom.appendChild(SliderItemsDom[0]);
            thumbnailBorderDom.appendChild(thumbItems[0]);
            carouselDom.classList.add('next');
        } else {
            SliderDom.prepend(SliderItemsDom[SliderItemsDom.length - 1]);
            thumbnailBorderDom.prepend(thumbItems[thumbItems.length - 1]);
            carouselDom.classList.add('prev');
        }
        clearTimeout(runTimeOut);
        runTimeOut = setTimeout(() => {
            carouselDom.classList.remove('next');
            carouselDom.classList.remove('prev');
        }, timeRunning);

        clearTimeout(runNextAuto);
        runNextAuto = setTimeout(() => {
            nextDom.click();
        }, timeAutoNext);
    }

    // Flex Card auto-slide
    const cards = document.querySelectorAll('input[name="projSlide"]');
    const cardPrevBtn = document.getElementById('projCardPrev');
    const cardNextBtn = document.getElementById('projCardNext');
    if (cards.length > 0) {
        let currentCard = 0;
        function showNextCard() {
            currentCard = (currentCard + 1) % cards.length;
            cards[currentCard].checked = true;
        }
        function showPrevCard() {
            currentCard = (currentCard - 1 + cards.length) % cards.length;
            cards[currentCard].checked = true;
        }
        if (cardNextBtn) cardNextBtn.addEventListener('click', showNextCard);
        if (cardPrevBtn) cardPrevBtn.addEventListener('click', showPrevCard);
        setInterval(showNextCard, 5000);
    }

    // Particle Background
    const particleCanvas = document.getElementById('projParticles');
    if (particleCanvas) {
        const ctx = particleCanvas.getContext('2d');
        let particles = [];
        function resizeCanvas() {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = particleCanvas.parentElement ? particleCanvas.parentElement.offsetHeight : window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                r: Math.random() * 2 + 0.5,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                o: Math.random() * 0.4 + 0.1
            });
        }

        function animateParticles() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > particleCanvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > particleCanvas.height) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.o})`;
                ctx.fill();
            });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }
}


/* ========================================= */
/* CERTIFICATES section JS from original   */
/* ========================================= */
function initCertificateSections() {
// ========================================
// SECTION 1: CERTIFICATIONS 3D CAROUSEL
// ========================================
(function() {
    const modal = document.getElementById('certificateModal1');
    const modalImg = document.getElementById('certExpandedImg1');
    const closeBtn = document.querySelector('.cert-close[data-modal="certificateModal1"]');
    const slider = document.querySelector('.cert-slider');
    const prevBtn = document.getElementById('certPrevBtn1');
    const nextBtn = document.getElementById('certNextBtn1');

    if (!modal || !slider) return;

    const certificates = document.querySelectorAll('.cert-slider-item img');
    let currentIndex = 0;

    certificates.forEach((img, index) => {
        img.addEventListener('click', function(e) {
            // Skip if universal modal is enabled
            if (window.useUniversalModal) return;
            e.stopPropagation();
            currentIndex = index;
            openModal(this.src);
        });
    });

    function openModal(imgSrc) {
        modal.style.display = 'flex';
        if (modalImg) modalImg.src = imgSrc;
        slider.style.animationPlayState = 'paused';
        setTimeout(() => { modal.classList.add('show'); }, 10);
    }

    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            slider.style.animationPlayState = 'running';
        }, 300);
    }

    function showPrevious() {
        currentIndex = (currentIndex - 1 + certificates.length) % certificates.length;
        updateModalImage();
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % certificates.length;
        updateModalImage();
    }

    function updateModalImage() {
        if (!modalImg) return;
        modalImg.style.opacity = '0';
        modalImg.style.transform = 'scale(0.8)';
        setTimeout(() => {
            modalImg.src = certificates[currentIndex].src;
            modalImg.style.opacity = '1';
            modalImg.style.transform = 'scale(1)';
        }, 200);
    }

    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); showPrevious(); });
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); showNext(); });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });

    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') closeModal();
            else if (e.key === 'ArrowLeft') showPrevious();
            else if (e.key === 'ArrowRight') showNext();
        }
    });
})();


// ========================================
// SECTION 2: LEAN SIX SIGMA SLIDER
// ========================================
(function() {
    let list = document.querySelectorAll('.cert-belt-carousel .cert-belt-list .cert-belt-item');
    let carousel = document.querySelector('.cert-belt-carousel');
    let dots = document.querySelectorAll('.cert-belt-dots li');
    let nextBtn = document.getElementById('certBeltNext');
    let prevBtn = document.getElementById('certBeltPrev');

    if (!carousel || !nextBtn || !prevBtn || list.length === 0) return;

    let lastPosition = list.length - 1;
    let active = 0;
    let zIndex = 2;

    nextBtn.onclick = () => {
        let newValue = active + 1 > lastPosition ? 0 : active + 1;
        setItemActive(newValue, showSlider);
    };

    prevBtn.onclick = () => {
        let newValue = active - 1 < 0 ? lastPosition : active - 1;
        setItemActive(newValue, showSlider);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            setItemActive(index, showSlider);
        });
    });

    const setItemActive = (newValue, callbackFunction) => {
        if (newValue === active) return;
        let type = newValue > active ? 'next' : 'prev';
        active = newValue;

        if (list[active].classList.contains('cert-white-belt')) {
            carousel.classList.add('white-active');
        } else {
            carousel.classList.remove('white-active');
        }
        callbackFunction(type);
    };

    let removeEffect;
    let autoRun = setTimeout(() => { nextBtn.click(); }, 5000);

    const showSlider = (type) => {
        carousel.style.pointerEvents = 'none';
        let itemActiveOld = document.querySelector('.cert-belt-carousel .cert-belt-list .cert-belt-item.active');
        if (itemActiveOld) itemActiveOld.classList.remove('active');
        zIndex++;
        list[active].style.zIndex = zIndex;
        list[active].classList.add('active');

        if (type === 'next') {
            carousel.style.setProperty('--transform', '300px');
        } else {
            carousel.style.setProperty('--transform', '-300px');
        }
        carousel.classList.add('effect');

        let dotActiveOld = document.querySelector('.cert-belt-dots li.active');
        if (dotActiveOld) dotActiveOld.classList.remove('active');
        dots[active].classList.add('active');

        clearTimeout(removeEffect);
        removeEffect = setTimeout(() => {
            carousel.classList.remove('effect');
            carousel.style.pointerEvents = 'auto';
        }, 1500);

        clearTimeout(autoRun);
        autoRun = setTimeout(() => { nextBtn.click(); }, 5000);
    };

    // Certificate Modal Functionality
    const certificateModal = document.getElementById('certificateModal2');
    const modalImage = document.getElementById('certModalImage2');
    const modalClose = document.querySelector('.cert-belt-modal-close[data-modal="certificateModal2"]');
    const modalPrev = document.getElementById('certModalPrev2');
    const modalNext = document.getElementById('certModalNext2');
    const certificateImages = document.querySelectorAll('.cert-belt-item .cert-belt-image');

    let currentModalIndex = 0;

    const certificates = [
        'img/certificates/White belt.jpg',
        'img/certificates/Yellow belt.jpg',
        'img/certificates/Green Belt.jpg',
        'img/certificates/Black Belt.jpg'
    ];

    certificateImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            // Skip if universal modal is enabled
            if (window.useUniversalModal) return;
            currentModalIndex = index;
            openModal();
        });
    });

    function openModal() {
        if (modalImage) modalImage.src = certificates[currentModalIndex];
        if (certificateModal) certificateModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (certificateModal) certificateModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function showNextCertificate() {
        currentModalIndex = (currentModalIndex + 1) % certificates.length;
        if (modalImage) modalImage.src = certificates[currentModalIndex];
    }

    function showPrevCertificate() {
        currentModalIndex = (currentModalIndex - 1 + certificates.length) % certificates.length;
        if (modalImage) modalImage.src = certificates[currentModalIndex];
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalNext) modalNext.addEventListener('click', showNextCertificate);
    if (modalPrev) modalPrev.addEventListener('click', showPrevCertificate);

    if (certificateModal) {
        certificateModal.addEventListener('click', (e) => {
            if (e.target === certificateModal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (certificateModal && certificateModal.classList.contains('active')) {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowRight') showNextCertificate();
            if (e.key === 'ArrowLeft') showPrevCertificate();
        }
    });
})();


// ========================================
// SECTION 3: 3D RING CAROUSEL
// ========================================
(function() {
    let xPos = 0;
    let autoRotate;
    let clickStartX = 0;
    let clickStartY = 0;
    let clickThreshold = 5;
    let currentModalIndex = 0;

    const images = [
        'img/certificates/5force.jpg',
        'img/certificates/8D.jpg',
        'img/certificates/FMEA.jpg',
        'img/certificates/JIT.jpg',
        'img/certificates/KANO.jpg',
        'img/certificates/minitab.jpg',
        'img/certificates/Parento.jpg',
        'img/certificates/QFD.jpg',
        'img/certificates/Root cause.jpg',
        'img/certificates/WBS.jpg'
    ];

    document.querySelectorAll('.cert-ring-img img').forEach((img, i) => {
        img.src = images[i];
    });

    const modal = document.getElementById('certModal3');
    const modalImage = document.getElementById('certModalImage3');
    const closeModalBtn = document.getElementById('certCloseModal3');
    const prevBtn = document.getElementById('certPrevBtn3');
    const nextBtn = document.getElementById('certNextBtn3');

    if (!modal) return;

    function openModal(index) {
        currentModalIndex = index;
        if (modalImage) modalImage.src = images[currentModalIndex];
        modal.classList.add('active');
    }

    function closeModalFunc() {
        modal.classList.remove('active');
    }

    function showPrevCertificate() {
        currentModalIndex = (currentModalIndex - 1 + images.length) % images.length;
        if (modalImage) modalImage.src = images[currentModalIndex];
    }

    function showNextCertificate() {
        currentModalIndex = (currentModalIndex + 1) % images.length;
        if (modalImage) modalImage.src = images[currentModalIndex];
    }

    document.querySelectorAll('.cert-ring-img').forEach((imgDiv, index) => {
        imgDiv.addEventListener('mousedown', (e) => {
            clickStartX = e.clientX;
            clickStartY = e.clientY;
        });

        imgDiv.addEventListener('mouseup', (e) => {
            const moveX = Math.abs(e.clientX - clickStartX);
            const moveY = Math.abs(e.clientY - clickStartY);
            if (moveX < clickThreshold && moveY < clickThreshold) {
                // Skip if universal modal is enabled
                if (window.useUniversalModal) return;
                e.stopPropagation();
                e.preventDefault();
                openModal(index);
            }
        });

        imgDiv.addEventListener('dragstart', (e) => { e.preventDefault(); });
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalFunc);
    if (prevBtn) prevBtn.addEventListener('click', showPrevCertificate);
    if (nextBtn) nextBtn.addEventListener('click', showNextCertificate);

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('cert-modal-content3')) {
            closeModalFunc();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') showPrevCertificate();
            else if (e.key === 'ArrowRight') showNextCertificate();
            else if (e.key === 'Escape') closeModalFunc();
        }
    });

    const ring = document.getElementById('certRing');
    const dragger = document.getElementById('certDragger');

    if (!ring || !dragger || typeof gsap === 'undefined') return;

    gsap.timeline()
        .set(dragger, { opacity: 0 })
        .set(ring, { rotationY: 180 })
        .set('.cert-ring-img', {
            rotateY: (i) => i * -36,
            transformOrigin: '50% 50% 1350px',
            z: -1350,
            backfaceVisibility: 'hidden'
        })
        .from('.cert-ring-img', {
            duration: 1.5,
            y: 200,
            opacity: 0,
            stagger: 0.1,
            ease: 'expo'
        })
        .add(() => {
            autoRotate = gsap.to(ring, {
                rotationY: '+=360',
                duration: 30,
                ease: 'none',
                repeat: -1
            });
        });

    if (typeof Draggable !== 'undefined') {
        Draggable.create(dragger, {
            onDragStart: (e) => {
                if (e.touches) e.clientX = e.touches[0].clientX;
                xPos = Math.round(e.clientX);
                if (autoRotate) autoRotate.pause();
            },
            onDrag: (e) => {
                if (e.touches) e.clientX = e.touches[0].clientX;
                gsap.to(ring, {
                    rotationY: '-=' + ((Math.round(e.clientX) - xPos) % 360),
                    onUpdate: () => {}
                });
                xPos = Math.round(e.clientX);
            },
            onDragEnd: () => {
                gsap.set(dragger, { x: 0, y: 0 });
                if (autoRotate) autoRotate.resume();
            }
        });
    }
})();

}


/* ========== CONTACT FORM HANDLER ========== */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.form-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const formStatus = document.getElementById('formStatus');

        // Get form data
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            message: document.getElementById('contactMessage').value
        };

        // Disable button and show loader
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';

        try {
            // Create mailto link with form data
            const mailtoLink = `mailto:indusarkar01@gmail.com?subject=Portfolio Contact from ${encodeURIComponent(formData.name)}&body=${encodeURIComponent(
                `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
            )}`;

            // Open mailto link
            window.location.href = mailtoLink;

            // Show success message
            formStatus.textContent = 'Opening your email client...';
            formStatus.classList.add('success');
            formStatus.style.display = 'block';

            // Reset form after a delay
            setTimeout(() => {
                form.reset();
                formStatus.style.display = 'none';
            }, 3000);

        } catch (error) {
            // Show error message
            formStatus.textContent = 'Failed to open email client. Please try again.';
            formStatus.classList.add('error');
            formStatus.style.display = 'block';
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
}


/* ========== UNIVERSAL IMAGE MODAL ========== */
// Global flag to prevent old modals from opening
window.useUniversalModal = true;

function initUniversalImageModal() {
    const modal = document.getElementById('universalImageModal');
    const modalImg = document.getElementById('universalModalImg');
    const closeBtn = document.querySelector('.universal-modal-close');
    const prevBtn = document.getElementById('universalModalPrev');
    const nextBtn = document.getElementById('universalModalNext');

    if (!modal || !modalImg || !closeBtn) return;

    let currentImageIndex = 0;
    let currentImageSet = [];
    let isCertificateMode = false;

    // Get all certificate images from ALL certificate sections
    const getAllCertificateImages = () => {
        const certImages = [];
        
        // Section 1: 3D Carousel certificates
        document.querySelectorAll('.cert-slider-item img').forEach(img => {
            if (img.src && !certImages.includes(img)) certImages.push(img);
        });
        
        // Section 2: Belt certificates
        document.querySelectorAll('.cert-belt-item img, .cert-belt-image').forEach(img => {
            if (img.src && !certImages.includes(img)) certImages.push(img);
        });
        
        // Section 3: Ring carousel certificates
        document.querySelectorAll('.cert-ring-img img').forEach(img => {
            if (img.src && !certImages.includes(img)) certImages.push(img);
        });
        
        // Any other images in certificate sections
        document.querySelectorAll('#certifications img, .cert-section img').forEach(img => {
            if (img.src && !certImages.includes(img) && 
                (img.src.includes('certificates') || img.closest('.cert-slider-item, .cert-ring-img, .cert-belt-item'))) {
                certImages.push(img);
            }
        });
        
        return certImages;
    };

    const certificateImages = getAllCertificateImages();

    // Get all other images
    const allImages = document.querySelectorAll('img:not(.universal-modal-content):not([data-no-modal])');

    // Track mouse position to distinguish between click and drag
    let mouseDownPos = { x: 0, y: 0 };
    let isDragging = false;
    const dragThreshold = 5; // pixels

    allImages.forEach((img, index) => {
        // Track mousedown position
        img.addEventListener('mousedown', function(e) {
            mouseDownPos = { x: e.clientX, y: e.clientY };
            isDragging = false;
        }, true);

        // Track if user is dragging
        img.addEventListener('mousemove', function(e) {
            if (mouseDownPos.x !== 0 || mouseDownPos.y !== 0) {
                const moveX = Math.abs(e.clientX - mouseDownPos.x);
                const moveY = Math.abs(e.clientY - mouseDownPos.y);
                if (moveX > dragThreshold || moveY > dragThreshold) {
                    isDragging = true;
                }
            }
        }, true);

        img.addEventListener('click', function(e) {
            // Only open modal if not dragging
            if (isDragging) {
                isDragging = false;
                mouseDownPos = { x: 0, y: 0 };
                return;
            }

            e.stopPropagation();
            e.preventDefault(); // Prevent default behavior
            
            // Check if this is a certificate image - improved detection
            const isCertificate = certificateImages.includes(this) || 
                                 this.src.includes('certificates') ||
                                 this.closest('.cert-slider-item, .cert-ring-img, .cert-belt-item, .cert-section, #certifications') ||
                                 this.classList.contains('cert-belt-image') ||
                                 this.parentElement.classList.contains('cert-ring-img');
            
            if (isCertificate) {
                // Certificate mode - show navigation
                isCertificateMode = true;
                currentImageSet = certificateImages;
                
                // Find the index of clicked certificate
                currentImageIndex = certificateImages.indexOf(this);
                if (currentImageIndex === -1) {
                    // If not found in array, find by src
                    currentImageIndex = certificateImages.findIndex(img => img.src === this.src);
                }
                
                // If still not found, add it and use it
                if (currentImageIndex === -1) {
                    certificateImages.push(this);
                    currentImageIndex = certificateImages.length - 1;
                }
                
                prevBtn.style.display = 'block';
                nextBtn.style.display = 'block';
            } else {
                // Regular image mode - no navigation
                isCertificateMode = false;
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }
            
            modal.style.display = 'block';
            modalImg.src = this.src;
            document.body.style.overflow = 'hidden';
            updateNavigationButtons();
            
            // Reset tracking
            mouseDownPos = { x: 0, y: 0 };
            isDragging = false;
        }, true); // Use capture phase to intercept before other handlers

        // Reset on mouseup
        img.addEventListener('mouseup', function() {
            setTimeout(() => {
                mouseDownPos = { x: 0, y: 0 };
                isDragging = false;
            }, 100);
        }, true);
    });

    // Navigation functions
    function showPrevImage() {
        if (!isCertificateMode || currentImageIndex <= 0) return;
        currentImageIndex--;
        modalImg.src = currentImageSet[currentImageIndex].src;
        updateNavigationButtons();
    }

    function showNextImage() {
        if (!isCertificateMode || currentImageIndex >= currentImageSet.length - 1) return;
        currentImageIndex++;
        modalImg.src = currentImageSet[currentImageIndex].src;
        updateNavigationButtons();
    }

    function updateNavigationButtons() {
        if (!isCertificateMode) return;
        prevBtn.disabled = currentImageIndex <= 0;
        nextBtn.disabled = currentImageIndex >= currentImageSet.length - 1;
    }

    // Event listeners
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrevImage();
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNextImage();
    });

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft' && isCertificateMode) {
                showPrevImage();
            } else if (e.key === 'ArrowRight' && isCertificateMode) {
                showNextImage();
            }
        }
    });

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initUniversalImageModal();
});


/* ========== SKILL MODAL ========== */
function initSkillModal() {
    const modal = document.getElementById('skillModal');
    const modalTitle = document.getElementById('skillModalTitle');
    const modalDescription = document.getElementById('skillModalDescription');
    const modalLink = document.getElementById('skillModalLink');
    const closeBtn = document.querySelector('.skill-modal-close');
    
    if (!modal) {
        console.error('Skill modal not found');
        return;
    }
    
    // Get all skill tags
    const skillTags = document.querySelectorAll('.skill-tag[data-skill]');
    console.log('Found skill tags:', skillTags.length);
    
    skillTags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const skillName = this.getAttribute('data-skill');
            const description = this.getAttribute('data-description');
            const link = this.getAttribute('data-link');
            
            console.log('Skill clicked:', skillName);
            console.log('Link:', link);
            
            modalTitle.textContent = skillName;
            modalDescription.textContent = description;
            modalLink.href = link || '#';
            
            console.log('Modal link href set to:', modalLink.href);
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Add click handler to Learn More button - force navigation
    modalLink.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent modal from closing
        const href = this.getAttribute('href');
        console.log('Learn More clicked, href:', href);
        
        if (href && href !== '#') {
            window.open(href, '_blank', 'noopener,noreferrer');
            e.preventDefault(); // Prevent default after we manually open
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeModal);
    
    // Only close if clicking the backdrop, not the content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
    
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Initialize skill modal
document.addEventListener('DOMContentLoaded', function() {
    initSkillModal();
});

// ========================================
// VOLUNTARY WORKS CAROUSEL
// ========================================
(function() {
    let voluntaryNextButton = document.getElementById('voluntary-next');
    let voluntaryPrevButton = document.getElementById('voluntary-prev');
    let voluntaryCarousel = document.querySelector('.voluntary-carousel');
    let voluntaryListHTML = document.querySelector('.voluntary-carousel .voluntary-list');

    if (!voluntaryNextButton || !voluntaryPrevButton || !voluntaryCarousel || !voluntaryListHTML) {
        return; // Exit if elements don't exist
    }

    voluntaryNextButton.onclick = function(){
        showVoluntarySlider('next');
    }

    voluntaryPrevButton.onclick = function(){
        showVoluntarySlider('prev');
    }

    let unAcceptClick;
    const showVoluntarySlider = (type) => {
        voluntaryNextButton.style.pointerEvents = 'none';
        voluntaryPrevButton.style.pointerEvents = 'none';

        voluntaryCarousel.classList.remove('next', 'prev');
        let items = document.querySelectorAll('.voluntary-carousel .voluntary-list .voluntary-item');
        
        if(type === 'next'){
            voluntaryListHTML.appendChild(items[0]);
            voluntaryCarousel.classList.add('next');
        }else{
            voluntaryListHTML.prepend(items[items.length - 1]);
            voluntaryCarousel.classList.add('prev');
        }
        
        clearTimeout(unAcceptClick);
        unAcceptClick = setTimeout(()=>{
            voluntaryNextButton.style.pointerEvents = 'auto';
            voluntaryPrevButton.style.pointerEvents = 'auto';
        }, 2000)
    }
})();


/* ========== EMAILJS CONTACT FORM ========== */
// Initialize EmailJS
(function() {
    emailjs.init('dH-MdfZjVa62Ljuty');
})();

// Handle contact form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) {
        console.error('Contact form not found');
        return;
    }
    
    const formStatus = document.getElementById('formStatus');
    const submitBtn = contactForm.querySelector('.form-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Show loading state
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        submitBtn.disabled = true;
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        // Get form data
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            message: document.getElementById('contactMessage').value
        };

        // Send email using EmailJS
        emailjs.send('service_yid3m2x', 'template_0z1jl8a', formData)
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);
                
                // Show success message
                formStatus.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
                formStatus.className = 'form-status success';
                
                // Reset form
                contactForm.reset();
                
                // Reset button state
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
                submitBtn.disabled = false;
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                    formStatus.textContent = '';
                    formStatus.className = 'form-status';
                }, 5000);
            }, function(error) {
                console.log('FAILED...', error);
                
                // Show error message
                formStatus.textContent = '✗ Failed to send message. Please try again or email me directly.';
                formStatus.className = 'form-status error';
                
                // Reset button state
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            });
    });
});
