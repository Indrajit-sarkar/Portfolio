/* ========================================
   INDRAJIT SARKAR - ULTRA PREMIUM PORTFOLIO
   Apple-Inspired Interactive JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
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
    initCertifications(); // Dynamic certifications with lazy loading
});

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


