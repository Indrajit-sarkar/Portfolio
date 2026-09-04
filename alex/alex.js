/* ═══════════════════════════════════════════════════════════
   Alex AI Companion - Main Controller
   ═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  class AlexCompanion {
    constructor() {
      this.state = 'idle';
      this.currentSection = 'hero';
      this.position = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this.mousePos = { x: 0, y: 0 };
      this.idleTimer = 0;
      this.clickCount = 0;
      this.clickTimer = null;
      this.isVisible = true;
      this.konami = [];
      this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
      
      this.init();
    }

    init() {
      this.createDOM();
      this.setupEventListeners();
      this.enterScene();
      console.log('Alex fully initialized');
    }

    createDOM() {
      const container = document.createElement('div');
      container.id = 'alex-companion';
      container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 5px solid #fff;
        border-radius: 20px;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
        font-weight: bold;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        cursor: pointer;
      `;
      container.textContent = 'ALEX';
      
      document.body.appendChild(container);
      this.element = container;
      console.log('Alex element created and appended:', container);
      console.log('Element in DOM:', document.getElementById('alex-companion'));
    }

    setupEventListeners() {
      // Character click
      this.element.addEventListener('click', () => {
        alert('Alex clicked!');
        this.handleClick();
      });
      
      // Mouse tracking
      document.addEventListener('mousemove', (e) => {
        this.mousePos = { x: e.clientX, y: e.clientY };
        this.resetIdleTimer();
      });
    }

    handleClick() {
      this.clickCount++;
      clearTimeout(this.clickTimer);
      
      if (this.clickCount === 1) {
        this.clickTimer = setTimeout(() => {
          // Single click - open chat
          this.openChat();
          this.clickCount = 0;
        }, 300);
      } else if (this.clickCount === 2) {
        // Double click - backflip
        this.setState('celebrating');
        setTimeout(() => this.setState('idle'), 1200);
        this.clickCount = 0;
      } else if (this.clickCount >= 3) {
        // Triple click - spin robot
        this.setState('celebrating');
        this.character.style.animation = 'alex-celebrate-jump 0.6s ease-in-out 2';
        setTimeout(() => this.setState('idle'), 1200);
        this.clickCount = 0;
      }
    }

    handleKonami(e) {
      this.konami.push(e.key);
      if (this.konami.length > this.konamiCode.length) {
        this.konami.shift();
      }
      
      if (JSON.stringify(this.konami) === JSON.stringify(this.konamiCode)) {
        this.setState('celebrating');
        this.showSpeech('🎉 Konami Code Activated!', 2000);
        setTimeout(() => this.setState('idle'), 3000);
        this.konami = [];
      }
    }

    enterScene() {
      console.log('Alex entering scene - element should be visible in center');
    }

    observeSections() {
      const sections = document.querySelectorAll('section[id], main[id]');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            this.handleSectionChange(entry.target.id);
          }
        });
      }, { threshold: [0.5] });
      
      sections.forEach(section => observer.observe(section));
    }

    handleSectionChange(sectionId) {
      if (this.currentSection === sectionId) return;
      
      this.currentSection = sectionId;
      
      const sectionEl = document.getElementById(sectionId);
      if (!sectionEl) return;
      
      const rect = sectionEl.getBoundingClientRect();
      const safeX = Math.max(100, Math.min(window.innerWidth - 150, rect.left + 100));
      const safeY = Math.max(120, Math.min(window.innerHeight - 150, rect.top + window.scrollY + 150));
      
      // Determine movement speed based on distance
      const distance = Math.hypot(this.position.x - safeX, this.position.y - safeY);
      
      if (distance > 1000) {
        // Teleport for very fast scrolls
        this.position.x = safeX;
        this.position.y = safeY;
        this.target.x = safeX;
        this.target.y = safeY;
      } else if (distance > 500) {
        this.setState('running');
        this.target.x = safeX;
        this.target.y = safeY;
      } else {
        this.setState('walking');
        this.target.x = safeX;
        this.target.y = safeY;
      }
      
      // Section-specific behaviors
      this.sectionBehavior(sectionId);
    }

    sectionBehavior(sectionId) {
      setTimeout(() => {
        switch(sectionId) {
          case 'hero':
            this.setState('wave');
            setTimeout(() => this.setState('idle'), 1000);
            break;
            
          case 'about':
            this.showSpeech('Want to know more about me?', 3000);
            this.setState('pointing');
            setTimeout(() => this.setState('idle'), 2000);
            break;
            
          case 'skills':
            this.setState('typing');
            this.showSpeech('These are my tech skills!', 3000);
            setTimeout(() => this.setState('idle'), 3000);
            break;
            
          case 'projects':
            this.setState('pointing');
            this.showSpeech('Check out these awesome projects!', 3000);
            setTimeout(() => this.setState('idle'), 2000);
            break;
            
          case 'experience':
            this.showSpeech('My professional journey', 3000);
            setTimeout(() => this.setState('idle'), 1000);
            break;
            
          case 'certifications':
            this.setState('celebrating');
            this.showSpeech('24 Certifications! 🎓', 2000);
            setTimeout(() => this.setState('idle'), 2000);
            break;
            
          case 'contact':
            this.setState('wave');
            this.showSpeech("Let's build something together!", 3000, 'Get in Touch', () => {
              document.querySelector('#contact form')?.scrollIntoView({ behavior: 'smooth' });
            });
            setTimeout(() => this.setState('idle'), 1500);
            break;
            
          default:
            this.setState('idle');
        }
      }, 800);
    }

    setState(newState) {
      if (this.state === newState) return;
      
      // Remove old state classes
      this.element.classList.remove(
        'alex-walking', 'alex-running', 'alex-celebrating',
        'alex-pointing', 'alex-typing', 'alex-sleeping'
      );
      
      this.state = newState;
      
      // Add new state class
      if (newState !== 'idle' && newState !== 'wave') {
        this.element.classList.add(`alex-${newState}`);
      }
      
      // State-specific actions
      if (newState === 'sleeping') {
        this.zzz.style.opacity = '1';
      } else {
        this.zzz.style.opacity = '0';
      }
    }

    showSpeech(text, duration = 3000, buttonText = null, buttonCallback = null) {
      this.speechText.textContent = text;
      
      // Remove existing button
      const existingBtn = this.speech.querySelector('.alex-speech-button');
      if (existingBtn) existingBtn.remove();
      
      // Add button if provided
      if (buttonText && buttonCallback) {
        const btn = document.createElement('button');
        btn.className = 'alex-speech-button';
        btn.textContent = buttonText;
        btn.onclick = buttonCallback;
        this.speech.appendChild(btn);
      }
      
      this.speech.classList.add('active');
      
      setTimeout(() => {
        this.speech.classList.remove('active');
      }, duration);
    }

    openChat() {
      // Trigger existing chatbot
      const chatbotFAB = document.querySelector('.alex-fab');
      if (chatbotFAB) {
        chatbotFAB.click();
      }
      
      // Move Alex to bottom right
      this.target.x = window.innerWidth - 180;
      this.target.y = window.innerHeight - 140;
      this.setState('wave');
      
      setTimeout(() => this.setState('idle'), 1000);
    }

    resetIdleTimer() {
      this.idleTimer = 0;
      if (this.state === 'sleeping') {
        this.setState('idle');
      }
    }

    updateIdleState(deltaTime) {
      if (this.state !== 'idle' && this.state !== 'sleeping') {
        this.idleTimer = 0;
        return;
      }
      
      this.idleTimer += deltaTime;
      
      // Start sleeping after 35 seconds
      if (this.idleTimer > 35000 && this.state !== 'sleeping') {
        this.setState('sleeping');
      }
      // Yawn after 20 seconds
      else if (this.idleTimer > 20000 && this.idleTimer < 20500 && this.state === 'idle') {
        this.showSpeech('😴', 1500);
      }
    }

    trackMouseCursor() {
      const rect = this.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = this.mousePos.x - centerX;
      const dy = this.mousePos.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Look at cursor if nearby
      if (distance < 200) {
        const angle = Math.atan2(dy, dx);
        const lookX = Math.cos(angle) * 2;
        const lookY = Math.sin(angle) * 2;
        
        const eyes = this.element.querySelectorAll('.alex-eye');
        eyes.forEach(eye => {
          eye.style.transform = `translate(${lookX}px, ${lookY}px)`;
        });
      } else {
        const eyes = this.element.querySelectorAll('.alex-eye');
        eyes.forEach(eye => {
          eye.style.transform = 'translate(0, 0)';
        });
      }
    }

    updatePosition() {
      // Smooth movement towards target
      const dx = this.target.x - this.position.x;
      const dy = this.target.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 2) {
        const speed = this.state === 'running' ? 0.15 : 0.08;
        this.position.x += dx * speed;
        this.position.y += dy * speed;
        
        // Flip character based on direction
        if (dx < -5) {
          this.character.style.transform = 'scaleX(-1)';
        } else if (dx > 5) {
          this.character.style.transform = 'scaleX(1)';
        }
      } else if (this.state === 'walking' || this.state === 'running') {
        this.setState('idle');
      }
      
      // Ensure Alex stays in safe bounds
      const safeMargin = 50;
      this.position.x = Math.max(safeMargin, Math.min(window.innerWidth - safeMargin, this.position.x));
      this.position.y = Math.max(100, Math.min(window.innerHeight - safeMargin, this.position.y));
      
      this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    }

    startAnimationLoop() {
      let lastTime = performance.now();
      
      const loop = (currentTime) => {
        if (!this.isVisible) {
          requestAnimationFrame(loop);
          return;
        }
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        this.updatePosition();
        this.updateIdleState(deltaTime);
        this.trackMouseCursor();
        
        requestAnimationFrame(loop);
      };
      
      requestAnimationFrame(loop);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Alex initializing...');
      new AlexCompanion();
    });
  } else {
    console.log('Alex initializing immediately...');
    new AlexCompanion();
  }
})();
