/* ========================================
   INDRAJIT SARKAR - ULTRA PREMIUM PORTFOLIO
   Apple-Inspired Interactive JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initNavigation();
    initHeroParallax();
    initTypingEffect();
    initCarousel();
    initCounters();
    initScrollReveal();
    initCopyToClipboard();
    initSmoothHovers();
    initDynamicOrbs();
    initLogoModal();

});

/* ========== SCROLL PROGRESS ========== */
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${progress}%`;
    }, { passive: true });
}

/* ... existing code ... */


/* ========== NAVIGATION ========== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('backToTop');

    // Scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = '';

            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Back to top
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Update active link on scroll
    const sections = document.querySelectorAll('section[id]');
    const observerOptions = {
        rootMargin: '-50% 0px -50% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

/* ========== HERO PARALLAX ========== */
function initHeroParallax() {
    const heroImage = document.querySelector('.hero-image-wrapper');
    const heroSection = document.querySelector('.hero');

    if (!heroImage || !heroSection) return;

    // Subtle parallax on mouse move
    let isHovering = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    heroSection.addEventListener('mouseenter', () => isHovering = true);
    heroSection.addEventListener('mouseleave', () => {
        isHovering = false;
        targetX = 0;
        targetY = 0;
    });

    heroSection.addEventListener('mousemove', (e) => {
        if (!isHovering) return;

        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        targetX = x * 8; // Subtle rotation
        targetY = -y * 8;
    });

    // Smooth animation loop
    function animate() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        heroImage.style.transform = `
            perspective(1000px)
            rotateY(${currentX}deg)
            rotateX(${currentY}deg)
        `;

        requestAnimationFrame(animate);
    }

    animate();
}

/* ========== TYPING EFFECT ========== */
function initTypingEffect() {
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;

    const texts = [
        'Microsoft Certified Azure AI Engineer',
        'Full-Stack Developer',
        'Infrastructure Management Analyst',
        'Cloud & AI Enthusiast'
    ];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentText = texts[textIndex];
        let typingSpeed;

        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 30;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 60;
        }

        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 2500; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 400;
        }

        setTimeout(type, typingSpeed);
    }

    setTimeout(type, 1000);
}

/* ========== EDUCATION CAROUSEL ========== */
function initCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;
    let startTranslate = 0;

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentIndex = index;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // Button controls
    prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Dot controls
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToSlide(i));
    });

    // Touch/Mouse drag with smooth momentum
    const getX = (e) => e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;

    const handleStart = (e) => {
        isDragging = true;
        startX = getX(e);
        track.style.transition = 'none';
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        const diff = getX(e) - startX;
        const translate = -currentIndex * 100 + (diff / track.offsetWidth) * 100;
        track.style.transform = `translateX(${translate}%)`;
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = '';

        const endX = e.type.includes('mouse') ? e.clientX : e.changedTouches[0].clientX;
        const diff = endX - startX;

        if (Math.abs(diff) > 80) {
            if (diff > 0) goToSlide(currentIndex - 1);
            else goToSlide(currentIndex + 1);
        } else {
            goToSlide(currentIndex);
        }
    };

    track.addEventListener('mousedown', handleStart);
    track.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });

    // Auto-advance every 8 seconds
    let autoSlide = setInterval(() => goToSlide(currentIndex + 1), 8000);

    // Pause on interaction
    track.addEventListener('mouseenter', () => clearInterval(autoSlide));
    track.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => goToSlide(currentIndex + 1), 8000);
    });
}

/* ========== ANIMATED COUNTERS ========== */
function initCounters() {
    const counters = document.querySelectorAll('.counter');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const parent = counter.closest('.metric');
                const target = parseInt(parent?.dataset.value) || 0;
                const suffix = parent?.dataset.suffix || '';
                const duration = 2000;
                const startTime = performance.now();

                function animate(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Ease out cubic
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const current = Math.floor(target * easeOut);

                    counter.textContent = current + suffix;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        counter.textContent = target + suffix;
                    }
                }

                requestAnimationFrame(animate);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

/* ========== SCROLL REVEAL ========== */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.exp-card, .project-card, .cert-card, .skill-category, .slide-info, .contact-item, .bento-item'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el, index) => {
        el.classList.add('reveal');
        // Add a small stagger delay via inline style if needed, 
        // or just let CSS handles it. Staggered reveal is better.
        el.style.transitionDelay = `${(index % 3) * 0.1}s`;
        observer.observe(el);
    });
}

/* ========== COPY TO CLIPBOARD ========== */
function initCopyToClipboard() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    const toast = document.getElementById('toast');

    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const item = btn.closest('.contact-item');
            const text = item?.dataset.copy;

            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);

                // Show toast
                toast?.classList.add('show');
                setTimeout(() => toast?.classList.remove('show'), 2500);

                // Subtle feedback
                btn.textContent = '✓';
                btn.style.color = 'var(--primary-green)';

                setTimeout(() => {
                    btn.textContent = '📋';
                    btn.style.color = '';
                }, 2000);

            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });
}

/* ========== SMOOTH HOVERS ========== */
function initSmoothHovers() {
    // Add subtle magnetic effect to buttons
    const buttons = document.querySelectorAll('.btn, .social-link');

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // Enhanced project card effects (Liquid Glass v2)
    const glassCards = document.querySelectorAll('.glass-card');

    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set variables for CSS radial gradient sweep
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Perspective tilt
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = -(x - centerX) / 20;

            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-8px)
                scale(1.02)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });
}

/* ========== DYNAMIC ORBS (iPad Pro Style) ========== */
function initDynamicOrbs() {
    const orbs = document.querySelectorAll('.gradient-orb');

    if (orbs.length === 0) return;

    // Add subtle mouse parallax to orbs
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * 30;
        targetY = (e.clientY / window.innerHeight - 0.5) * 30;
    }, { passive: true });

    function animateOrbs() {
        mouseX += (targetX - mouseX) * 0.02;
        mouseY += (targetY - mouseY) * 0.02;

        orbs.forEach((orb, i) => {
            const factor = (i + 1) * 0.5;
            orb.style.transform = `translate(${mouseX * factor}px, ${mouseY * factor}px)`;
        });

        requestAnimationFrame(animateOrbs);
    }

    animateOrbs();
}

/* ========== PERFORMANCE: Passive scroll listeners ========== */
// Most scroll listeners already use { passive: true }
// This ensures smooth 60fps scrolling

/* ========== LOGO MODAL ========== */
function initLogoModal() {
    const navLogoLink = document.getElementById('navLogoLink');
    const logoModal = document.getElementById('logoModal');
    const logoModalClose = document.getElementById('logoModalClose');

    if (!navLogoLink || !logoModal || !logoModalClose) return;

    // Open modal
    navLogoLink.addEventListener('click', (e) => {
        e.preventDefault();
        logoModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    // Close modal function
    const closeModal = () => {
        logoModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    };

    // Close on button click
    logoModalClose.addEventListener('click', closeModal);

    // Close on click outside
    logoModal.addEventListener('click', (e) => {
        if (e.target === logoModal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && logoModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Console Easter Egg
    console.log("%c Designed & Developed by Indrajit Sarkar ", "background: #10b981; color: #000; padding: 6px; border-radius: 4px; font-weight: bold;");
}
