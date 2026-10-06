/* Alex — Indrajit's walking 16-bit pixel pet (he's also the AI chat assistant).
   The sprite is drawn in code on a 32×45 grid (no image assets): his swept
   black hair and stubble, in a black suit, white shirt and black tie.
   It walks the bottom of the screen, tracks the cursor with its eyes, reacts
   to hover and dragging, opens the Alex AI chat when clicked, and nudges
   visitors towards the certificates section. */
(function () {
  'use strict';

  // Game pages are embedded in an overlay iframe on games.html — one pet is enough.
  if (window.self !== window.top) return;

  var script = document.currentScript;
  var MODE = (script && script.getAttribute('data-mode')) || 'normal';   // 'normal' | '404'
  // site root, resolved from this script's own URL so any page depth works
  var BASE = script && script.src ? script.src.replace(/pet\/pet\.js.*$/, '') : '/';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  // pages where the pet stays quiet: no timed reminders or idle chatter
  var GAME_PAGE = ['games.html', 'sketch-ops.html', 'voxelcraft.html'].indexOf(PAGE) !== -1;

  var W = 32, H = 45, OY = 1;   // OY: one row of headroom for the outline
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var C = {
    o: '#1b1410',
    hair: '#16110f', hairMid: '#2a2220', hairHi: '#4a3f3b',
    skin: '#c28a63', skinSh: '#9c6746', skinHi: '#d9a47c', stub: '#7f5539',
    white: '#f4f2ec', whiteSh: '#d3cec2', whiteDk: '#a9a397',
    suit: '#2a2b32', suitSh: '#1c1d22', suitHi: '#454751',
    tie: '#0d0d10', tieHi: '#3a3b44',
    pant: '#26272d', pantSh: '#1a1b20', pantDk: '#121216',
    shoe: '#151518', shoeSh: '#4a4b55', sole: '#060607',
    eyeW: '#fbfbf8', pupil: '#2a1a12', mouth: '#5a2a22', tongue: '#c95f5f', blush: '#db7f6c',
    lens: '#121212', lensHi: '#5b5b5b',
    jet: '#7d828f', jetHi: '#b7bcc8', jetDk: '#4c505b', jetRed: '#d24b3e',
    fire1: '#fff3b0', fire2: '#ffc23d', fire3: '#ff7a1f', fire4: '#e2401c'
  };

  /* ---------------- sprite ---------------- */
  var grid;
  function clear() {
    grid = [];
    for (var i = 0; i < W * H; i++) grid.push(null);
  }
  function p(x, y, c) { y += OY; if (x >= 0 && x < W && y >= 0 && y < H) grid[y * W + x] = c; }
  function r(x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) p(x + i, y + j, c); }

  /* s = { face, eyes, look:{x,y}, arms, legs, bob, swing, shades, blush } */
  function compose(s) {
    clear();
    var b = s.bob || 0;           // body bob (head + torso)
    var lx = s.look ? s.look.x : 0, ly = s.look ? s.look.y : 0;

    // ---- jetpack: two tanks out beside the arms, flames below ----
    var jt = 19 + b;
    if (s.jetpack) {
      [3, 26].forEach(function (jx) {
        r(jx + 1, jt - 1, 1, 1, C.jetHi);                 // domed cap
        r(jx, jt, 3, 9, C.jet);
        r(jx, jt, 1, 8, C.jetHi);
        r(jx + 2, jt, 1, 9, C.jetDk);
        r(jx, jt + 3, 3, 1, C.jetRed);
        r(jx, jt + 9, 3, 1, C.jetDk);                    // nozzle
      });
      // harness straps over the shoulders
      r(6, jt + 1, 1, 1, C.jetDk); r(25, jt + 1, 1, 1, C.jetDk);
      if (s.flame) {
        var fl = s.flame, flick = s.flick || 0;          // 1 = sputter, 2 = full burn
        [3, 26].forEach(function (jx) {
          var len = fl === 1 ? 2 + flick : 9 + flick * 2;
          for (var k = 0; k < len; k++) {
            var c = k < 2 ? C.fire1 : k < len * 0.5 ? C.fire2 : k < len * 0.8 ? C.fire3 : C.fire4;
            if (k < len - 2) r(jx, jt + 10 + k, 3, 1, c);
            else p(jx + 1, jt + 10 + k, c);
          }
        });
      }
    }

    // ---- legs ----
    var L = s.legs || [0, 0, 0, 0];   // [lx, ly, rx, ry] foot offsets
    leg(10, L[0], L[1], true);
    leg(16, L[2], L[3], false);

    // ---- torso: black suit jacket, white shirt, black tie ----
    var t = 19 + b;
    r(10, 28, 12, 1, C.pant);   // waistband, so a bob never opens a gap
    r(9, t, 14, 10, C.suit);
    r(9, t, 14, 1, C.suitHi);                        // shoulder line
    r(22, t + 1, 1, 9, C.suitSh); r(9, t + 9, 14, 1, C.suitSh);
    // shirt V and collar
    r(13, t, 6, 1, C.white);
    for (var v = 1; v <= 4; v++) { p(13 + (v > 2 ? 1 : 0), t + v, C.white); p(18 - (v > 2 ? 1 : 0), t + v, C.white); }
    r(14, t + 1, 4, 3, C.white);
    p(13, t, C.whiteSh); p(18, t, C.whiteSh);
    // lapels
    p(12, t + 1, C.suitHi); p(12, t + 2, C.suitHi); p(13, t + 3, C.suitHi); p(14, t + 5, C.suitHi);
    p(19, t + 1, C.suitHi); p(19, t + 2, C.suitHi); p(18, t + 3, C.suitHi); p(17, t + 5, C.suitHi);
    // tie
    r(15, t, 2, 1, C.tie);
    r(15, t + 1, 2, 5, C.tie); p(15, t + 2, C.tieHi);
    p(16, t + 6, C.tie);
    // buttons + pocket square
    p(16, t + 7, C.suitHi);
    r(19, t + 3, 2, 1, C.white);

    // ---- arms ----
    var arms = s.arms || 'down';
    var swing = s.swing || 0;
    var raiseL = arms === 'wave' || arms === 'up' || arms === 'held';
    var raiseR = arms === 'up' || arms === 'held';
    if (raiseL) {
      var hx = arms === 'wave' && s.waveTick ? 5 : 6;
      r(6, t - 5, 2, 6, C.suit); r(7, t - 5, 1, 6, C.suitSh); p(8, t, C.suit);
      r(6, t - 6, 2, 1, C.white);                    // shirt cuff
      r(hx, t - 8, 2, 2, C.skin);
    } else {
      r(7, t + 1 + swing, 2, 7, C.suit); r(8, t + 1 + swing, 1, 7, C.suitSh);
      r(7, t + 8 + swing, 2, 1, C.white);
      r(7, t + 9 + swing, 2, 2, C.skin);
    }
    if (raiseR) {
      r(24, t - 5, 2, 6, C.suit); r(24, t - 5, 1, 6, C.suitSh); p(23, t, C.suit);
      r(24, t - 6, 2, 1, C.white);
      r(24, t - 8, 2, 2, C.skin);
    } else {
      r(23, t + 1 - swing, 2, 7, C.suit); r(24, t + 1 - swing, 1, 7, C.suitSh);
      r(23, t + 8 - swing, 2, 1, C.white);
      r(23, t + 9 - swing, 2, 2, C.skin);
    }

    // ---- head ----
    var h = b;
    r(14, 18 + h, 4, 1, C.skinSh);                       // neck
    r(10, 8 + h, 12, 8, C.skin);
    r(11, 16 + h, 10, 1, C.skin);
    r(12, 17 + h, 8, 1, C.skin);
    r(21, 9 + h, 1, 7, C.skinSh);
    r(10, 8 + h, 12, 1, C.skinSh);                        // hair shadow
    p(9, 11 + h, C.skin); p(9, 12 + h, C.skinSh); p(9, 13 + h, C.skin);
    p(22, 11 + h, C.skin); p(22, 12 + h, C.skinSh); p(22, 13 + h, C.skinSh);
    // stubble
    for (var sx = 11; sx <= 20; sx++) {
      if ((sx + h) % 2 === 0) p(sx, 15 + h, C.stub);
      p(sx, 16 + h, (sx % 2) ? C.stub : C.skinSh);
    }
    r(12, 17 + h, 8, 1, C.stub);
    p(10, 14 + h, C.stub); p(21, 14 + h, C.stub); p(10, 15 + h, C.stub); p(21, 15 + h, C.stub);
    // hair: voluminous, swept up and over to his left
    r(9, 3 + h, 14, 5, C.hair);
    r(10, 2 + h, 13, 1, C.hair);
    r(11, 1 + h, 12, 1, C.hair);
    r(14, 0 + h, 8, 1, C.hair);
    p(23, 2 + h, C.hair); p(23, 3 + h, C.hair);
    r(9, 8 + h, 2, 3, C.hair); r(21, 8 + h, 2, 3, C.hair);
    r(11, 8 + h, 4, 1, C.hair); p(11, 9 + h, C.hairMid);
    r(15, 1 + h, 4, 1, C.hairHi); r(19, 1 + h, 2, 1, C.hairMid);
    r(13, 2 + h, 3, 1, C.hairHi); r(19, 2 + h, 2, 1, C.hairMid);
    r(12, 3 + h, 2, 1, C.hairHi); r(17, 3 + h, 2, 1, C.hairHi);
    p(11, 4 + h, C.hairHi); p(16, 4 + h, C.hairMid); p(21, 4 + h, C.hairMid);
    p(10, 6 + h, C.hairMid); p(20, 6 + h, C.hairMid);
    // brows
    r(12, 9 + h, 3, 1, C.hairMid); r(17, 9 + h, 3, 1, C.hairMid); p(12, 10 + h, C.skinSh); p(19, 10 + h, C.skinSh);

    // eyes
    var eyes = s.eyes || 'open';
    if (s.shades) {
      r(11, 10 + h, 10, 1, C.lens);
      r(11, 11 + h, 4, 2, C.lens); r(17, 11 + h, 4, 2, C.lens);
      r(15, 11 + h, 2, 1, C.lens);
      p(12, 11 + h, C.lensHi); p(18, 11 + h, C.lensHi);
    } else if (eyes === 'happy') {
      [12, 17].forEach(function (ex) {
        p(ex, 12 + h, C.o); p(ex + 1, 11 + h, C.o); p(ex + 2, 12 + h, C.o);
      });
    } else if (eyes === 'closed') {
      r(12, 12 + h, 3, 1, C.o); r(17, 12 + h, 3, 1, C.o);
    } else {
      var wide = eyes === 'wide';
      [12, 17].forEach(function (ex) {
        r(ex, 11 + h, 3, 2, C.eyeW);
        if (wide) { p(ex + 1, 11 + h, C.pupil); }
        else {
          var px = ex + 1 + lx;
          if (ly < 0) p(px, 11 + h, C.pupil);
          else if (ly > 0) p(px, 12 + h, C.pupil);
          else r(px, 11 + h, 1, 2, C.pupil);
        }
      });
    }
    // nose
    p(16, 12 + h, C.skinSh); p(16, 13 + h, C.skinSh); p(15, 13 + h, C.skinHi);
    if (s.blush) { p(11, 13 + h, C.blush); p(12, 13 + h, C.blush); p(19, 13 + h, C.blush); p(20, 13 + h, C.blush); }
    // mouth
    var face = s.face || 'smile';
    if (face === 'open') { r(14, 14 + h, 4, 2, C.mouth); r(15, 15 + h, 2, 1, C.tongue); }
    else if (face === 'grin') { r(14, 14 + h, 4, 1, C.mouth); r(15, 15 + h, 2, 1, C.mouth); }
    else if (face === 'o') { r(15, 14 + h, 2, 2, C.mouth); }
    else if (face === 'flat') { r(15, 14 + h, 2, 1, C.mouth); }
    else { p(14, 14 + h, C.mouth); r(15, 15 + h, 2, 1, C.mouth); p(17, 14 + h, C.mouth); }

  }

  function leg(x0, fx_, lift, left) {
    // lift: negative = foot raised. The lower legs sit one pixel apart so the
    // auto-outline draws the split between the wide trousers.
    var lx = left ? x0 + fx_ - 1 : x0 + fx_ + 1;
    r(x0, 29, 6, 4, C.pant);
    r(lx, 33 + lift, 6, 6, C.pant);
    r(x0 + 2, 30, 1, 3, C.pantSh);
    r(lx + (left ? 1 : 4), 33 + lift, 1, 5, C.pantSh);
    r(lx, 38 + lift, 6, 1, C.pantSh);
    if (left) r(x0 + 5, 31, 1, 2, C.pantDk);
    // chunky white sneaker
    r(lx, 39 + lift, 6, 2, C.shoe);
    r(lx, 40 + lift, 6, 1, C.shoeSh);
    p(lx + 2, 39 + lift, C.shoeSh); p(lx + 3, 39 + lift, C.shoeSh);
    r(lx, 41 + lift, 6, 1, C.sole);
  }

  function paint(ctx) {
    ctx.clearRect(0, 0, W, H);
    var i, x, y;
    // auto outline
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (grid[i]) continue;
      if ((x > 0 && grid[i - 1]) || (x < W - 1 && grid[i + 1]) ||
          (y > 0 && grid[i - W]) || (y < H - 1 && grid[i + W])) {
        ctx.fillStyle = C.o; ctx.fillRect(x, y, 1, 1);
      }
    }
    for (i = 0; i < grid.length; i++) {
      if (grid[i]) { ctx.fillStyle = grid[i]; ctx.fillRect(i % W, (i / W) | 0, 1, 1); }
    }
  }

  /* Design tokens the chat panel and bubble use, injected only on pages that
     don't already define them (game pages, the business card, 404). */
  var TOKENS = ':root{--bg-0:#0c0c0b;--bg-1:#141412;--ink:#f3f2ee;--ink-2:rgba(243,242,238,.66);' +
    '--ink-3:rgba(243,242,238,.44);--khaki:#c0a377;--stone:#a78766;--blue:#c0a377;--violet:#a78766;' +
    '--grad:linear-gradient(100deg,#c0a377,#a78766 60%,#d8c6a4);--glass-bg:rgba(243,242,238,.045);' +
    '--glass-bg-strong:rgba(20,20,18,.76);--glass-line:rgba(243,242,238,.12);' +
    '--shadow:0 24px 60px -24px rgba(0,0,0,.7);--hair:rgba(243,242,238,.14);' +
    "--font-b:'Space Grotesk',system-ui,sans-serif;--font-m:'JetBrains Mono',ui-monospace,Consolas,monospace;" +
    '--r-lg:22px;--r-md:14px;--r-sm:8px;--ease:cubic-bezier(.22,1,.36,1);--spring:cubic-bezier(.34,1.56,.64,1);' +
    '--lg-line:rgba(243,242,238,.16);--lg-inset:inset 0 1px 0 rgba(243,242,238,.22),inset 0 -1px 1px rgba(0,0,0,.3);' +
    '--lg-blur:blur(28px) saturate(140%)}';
  function ensureTokens() {
    if (getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()) return;
    var st = document.createElement('style');
    st.id = 'pet-tokens';
    st.textContent = TOKENS;
    document.head.appendChild(st);
  }

  /* ---------------- storage (per-viewer, best-effort) ---------------- */
  var store = {
    get: function (k) { try { return sessionStorage.getItem('pet:' + k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem('pet:' + k, v); } catch (e) {} }
  };

  /* ---------------- pet ---------------- */
  var Pet = {
    x: 40, y: 0, vy: 0, dir: 1,
    state: 'idle', stateT: 0, stateDur: 0,
    target: null, speed: 46,
    pointer: null, lastMove: Date.now(), lastPointerMove: 0,
    blinkAt: 0, nextThink: 0, cooldownNear: 0,
    bubbleOpen: false, frameKey: '',
    clickIdx: 0,

    init: function () {
      ensureTokens();
      this.scale = this.pickScale();
      this.build();
      this.measureGround();
      this.bind();
      this.x = this.clampX(90);
      this.blinkAt = performance.now() + 2500;
      this.nextThink = performance.now() + 3000;
      this.timers = [];
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);

      var self = this;
      // the mobile bottom nav can render after us, so re-measure once it settles
      [1200, 3500].forEach(function (ms) {
        setTimeout(function () {
          self.measureGround();
          if (MODE !== '404' && self.state !== 'held' && self.state !== 'fall') self.x = self.clampX(self.x);
        }, ms);
      });
      if (MODE === '404') { this.start404(); return; }

      var greeted = store.get('greeted');
      setTimeout(function () {
        if (PAGE === 'certifications.html') {
          store.set('certs', '1');
          self.setState('cool', 3000);
          self.say("Welcome to Indrajit's trophy room! 😎", null, 3600);
        } else if (greeted) { self.say(self.pick(['Welcome back! 👋', 'Oh hey, you again! 😄']), null, 3200); }
        else {
          store.set('greeted', '1');
          self.setState('wave', 2600);
          self.say("Hi! I'm Alex 👋 Click me to chat, or drag me around.", null, 5200);
        }
      }, 1600);
      if (!GAME_PAGE) this.scheduleNudges();
    },

    build: function () {
      var el = document.createElement('div');
      el.id = 'pixel-pet';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Alex — open the AI chat');
      el.title = 'Chat with me';
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      cv.style.width = W * this.scale + 'px';
      cv.style.height = H * this.scale + 'px';
      el.appendChild(cv);
      var shadow = document.createElement('span');
      shadow.className = 'pet-shadow';
      el.appendChild(shadow);
      document.body.appendChild(el);

      var bub = document.createElement('div');
      bub.className = 'pet-bubble';
      bub.setAttribute('role', 'status');
      bub.setAttribute('aria-live', 'polite');
      document.body.appendChild(bub);

      this.el = el; this.cv = cv; this.ctx = cv.getContext('2d');
      this.shadow = shadow; this.bub = bub;
      this.w = W * this.scale; this.h = H * this.scale;
    },

    /* Whole-pixel scale picked from the short side of the viewport, so the
       pet keeps its proportions on phones, landscape phones, tablets and 4K. */
    pickScale: function () {
      var w = window.innerWidth, h = window.innerHeight;
      if (Math.min(w, h) < 420 || h < 520) return 2;
      if (w >= 1900 && h >= 1150) return 4;
      return 3;
    },
    applyScale: function () {
      var sc = this.pickScale();
      if (sc === this.scale) return;
      this.scale = sc;
      this.cv.style.width = W * sc + 'px';
      this.cv.style.height = H * sc + 'px';
      this.w = W * sc; this.h = H * sc;
    },
    /* stand on top of a visible bottom nav (mobile), otherwise near the edge */
    measureGround: function () {
      var g = 14, nav = document.querySelector('.bottom-nav');
      if (nav && getComputedStyle(nav).display !== 'none') {
        var r = nav.getBoundingClientRect();
        if (r.height) g = Math.max(14, Math.round(window.innerHeight - r.top + 8));
      }
      this._ground = g;

      // start to the right of the gesture-control button when it shares our strip
      var m = 8, gb = document.getElementById('gesture-toggle');
      if (gb && getComputedStyle(gb).display !== 'none') {
        var gr = gb.getBoundingClientRect();
        var top = window.innerHeight - g - this.h;
        if (gr.width && gr.bottom > top && gr.top < window.innerHeight - g) m = Math.round(gr.right + 8);
      }
      this._minX = m;
    },
    ground: function () { return this._ground == null ? 14 : this._ground; },
    maxX: function () {
      return Math.max(16, window.innerWidth - this.w - 16);
    },

    /* -------- input -------- */
    bind: function () {
      var self = this, el = this.el;
      document.addEventListener('pointermove', function (e) {
        self.pointer = { x: e.clientX, y: e.clientY };
        self.lastMove = Date.now();
        self.lastPointerMove = performance.now();
        if (self.state === 'sleep') self.wake();
      }, { passive: true });
      ['scroll', 'keydown', 'touchstart'].forEach(function (ev) {
        window.addEventListener(ev, function () {
          self.lastMove = Date.now();
          if (self.state === 'sleep') self.wake();
        }, { passive: true });
      });

      el.addEventListener('mouseenter', function () {
        self.hover = true;
        if (MODE !== '404' && self.isFree()) { self.setState('happy', 1e9); self.spawn('♥', 2); }
      });
      el.addEventListener('mouseleave', function () {
        self.hover = false;
        if (self.state === 'happy') self.setState('idle');
      });

      var down = null;
      el.addEventListener('pointerdown', function (e) {
        down = { x: e.clientX, y: e.clientY, ox: e.clientX - self.x, dragging: false };
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener('pointermove', function (e) {
        if (!down || MODE === '404') return;
        if (!down.dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
          down.dragging = true;
          self.setState('held', 1e9);
          self.hideBubble();
          self.say(self.pick(['Whoa whoa whoa!', 'Wheee! 😆', "I can fly!"]), null, 1600);
        }
        if (down.dragging) {
          self.x = self.clampX(e.clientX - self.w / 2);
          var groundY = window.innerHeight - self.ground();
          self.y = Math.max(0, groundY - e.clientY - self.h * 0.25);
        }
      });
      var up = function () {
        if (!down) return;
        var wasDrag = down.dragging; down = null;
        if (wasDrag) { self.vy = 0; self.setState('fall', 1e9); }
        else if (MODE === '404') self.takeOff(true);
        else self.poke();
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (MODE === '404') self.takeOff(true); else self.poke();
        }
      });

      var onResize = function () {
        self.applyScale();
        self.measureGround();
        if (MODE === '404') {
          if (self.state === 'walk') self.target = self.center();
          else if (self.state !== 'fly' && self.state !== 'gone') self.x = self.center();
        } else self.x = self.clampX(self.x);
      };
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });

      // step aside while a game is running (pointer lock, fullscreen, the arcade overlay,
      // or a page that flags it with body.pet-away)
      setInterval(function () {
        var ov = PAGE === 'games.html' && document.getElementById('overlay');
        var away = !!(document.pointerLockElement || document.fullscreenElement ||
                      document.body.classList.contains('pet-away') ||
                      (ov && ov.classList.contains('active')));
        if (away === !!self.away) return;
        self.away = away;
        self.el.classList.toggle('is-away', away);
        if (away) self.hideBubble();
      }, 500);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) { self.prev = null; requestAnimationFrame(self.loop); }
      });

      if (MODE === '404') return;
      this.watchSections();
      this.watchChat();
    },

    // keep clear of the gesture-control button in the bottom-left corner
    minX: function () { return this._minX == null ? 8 : this._minX; },
    clampX: function (x) {
      var lo = this.minX(), hi = this.maxX();
      if (hi < lo) lo = 8;   // very narrow screens
      return Math.max(lo, Math.min(hi, x));
    },
    center: function () { return Math.round(window.innerWidth / 2 - this.w / 2); },
    isFree: function () { return ['idle', 'walk', 'sleep', 'happy'].indexOf(this.state) !== -1; },

    setState: function (s, dur) {
      this.state = s; this.stateT = 0;
      this.stateDur = dur || ({ excited: 1700, wave: 2200, cool: 2600, land: 500, surprised: 900 }[s] || 0);
    },

    wake: function () {
      this.setState('surprised', 900);
      this.say(this.pick(["Huh? I wasn't sleeping!", 'Oh! You\'re back 😅']), null, 2200);
    },

    /* -------- click: open (or close) the Alex AI chat -------- */
    poke: function () {
      var wasOpen = this.chatOpen;
      this.setState('excited', 1300);
      this.spawn('✦', 4);
      this.openAI();
      if (!wasOpen) this.say(this.pick(['Ask me anything! 💬', "Let's chat! ✨", "I know all of Indrajit's secrets 🤫"]), null, 2400);
    },

    /* idle chatter, so there's still personality between clicks */
    chatter: function () {
      var self = this;
      var lines = [
        function () { self.say('Alex, at your service! 🤵', null, 3000); },
        function () { self.say('Suited up and ready for work 👔', null, 3000); },
        function () { self.say('Psst — try dragging me up and letting go 😄', null, 3000); },
        function () { self.say('Indrajit spots planes ✈️ Check out his Hobbies!', [{ t: 'Take me', fn: function () { location.href = BASE + 'Hobbies.html'; } }], 5000); }
      ];
      if (PAGE === 'hobbies.html') lines.pop();
      lines[this.clickIdx++ % lines.length]();
    },

    certCount: function () {
      var e = document.querySelector('#certifications .eyebrow');
      var m = e && e.textContent.match(/\[(\d+)\]/);
      return m ? m[1] : null;
    },

    remindCerts: function (manual) {
      var n = this.certCount();
      var self = this;
      this.setState('point', 3200);
      this.say((manual ? '' : 'Psst! ') + "Have you checked out Indrajit's " + (n ? n + ' ' : '') + 'certificates yet? 🏅', [
        { t: 'Show me', primary: true, fn: function () { self.goCerts(); } },
        { t: 'Later', fn: function () { self.hideBubble(); } }
      ], 9000);
    },

    suggestAI: function (manual) {
      var self = this;
      this.setState('wave', 2600);
      this.say('Got questions about Indrajit? Ask me, I know all his secrets ✨', [
        { t: 'Ask AI', primary: true, fn: function () { self.openAI(); } },
        { t: 'Maybe later', fn: function () { self.hideBubble(); } }
      ], 9000);
    },

    goCerts: function () {
      this.hideBubble();
      if (!document.getElementById('certifications')) {
        location.href = BASE + 'certifications.html';
        return;
      }
      var a = document.createElement('a');
      a.href = '#certifications'; a.style.display = 'none';
      document.body.appendChild(a); a.click(); a.remove();
      this.setState('excited', 1500);
    },

    openAI: function () {
      var self = this;
      this.hideBubble();
      this.ensureChat(function (fab) {
        // anchor the panel to the pet *before* it opens, so it grows out of him
        if (!self.chatOpen) self.placeChat(true);
        fab.click();
      });
      if (!this.chatOpen) this.setState('happy', 1500);
    },

    /* Put the chat panel next to the pet: above him when there's room,
       beside him on short screens, and let it scale out from his position.
       Phones (<= 600px) keep the chatbot's own full-screen sheet. */
    placeChat: function (force) {
      var panel = document.querySelector('.alex-panel');
      if (!panel) return;
      var key = Math.round(this.x) + ',' + Math.round(this.y) + ',' + window.innerWidth + 'x' + window.innerHeight;
      if (!force && key === this._chatKey) return;
      this._chatKey = key;

      var vw = window.innerWidth, vh = window.innerHeight, st = panel.style;
      var cx = this.x + this.w / 2;
      var petTop = this.ground() + this.y + this.h;           // distance from the bottom edge
      if (vw <= 600) {
        st.left = st.right = st.bottom = st.top = st.maxHeight = st.width = '';
        st.transformOrigin = Math.round(cx) + 'px ' + Math.round(vh - petTop) + 'px';
        return;
      }
      var pw = Math.min(380, vw - 24);
      var want = Math.min(600, vh - 24);
      var above = vh - petTop - 12 - 12;
      var left, bottom, h, ox, oy;
      if (above >= Math.min(want, 380)) {
        h = Math.min(want, above);
        bottom = petTop + 12;
        left = Math.max(12, Math.min(vw - pw - 12, cx - pw / 2));
        ox = cx - left; oy = h;                                 // grow up out of his head
      } else {
        h = want;
        bottom = 12;
        var right = this.x + this.w + 12;
        left = right + pw <= vw - 12 ? right : Math.max(12, this.x - pw - 12);
        ox = left > this.x ? 0 : pw;                            // grow sideways out of him
        oy = h - (petTop - this.h / 2 - bottom);
      }
      st.right = 'auto'; st.top = 'auto';
      st.left = Math.round(left) + 'px';
      st.bottom = Math.round(bottom) + 'px';
      st.width = pw + 'px';
      st.height = Math.round(h) + 'px';
      st.maxHeight = Math.round(h) + 'px';
      st.transformOrigin = Math.round(ox) + 'px ' + Math.round(oy) + 'px';
    },

    /* pages without the chatbot get it loaded on first click */
    ensureChat: function (cb) {
      var fab = document.querySelector('.alex-fab');
      if (fab) { cb(fab); return; }
      if (!this.chatLoading && !document.querySelector('script[src*="chatbot/chatbot.js"]')) {
        this.chatLoading = true;
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = BASE + 'chatbot/chatbot.css';
        document.head.appendChild(l);
        var sc = document.createElement('script');
        sc.src = BASE + 'chatbot/chatbot.js';
        document.body.appendChild(sc);
      }
      var tries = 0;
      var iv = setInterval(function () {
        var f = document.querySelector('.alex-fab');
        if (f) { clearInterval(iv); setTimeout(function () { cb(f); }, 60); }
        else if (++tries > 60) clearInterval(iv);
      }, 100);
    },

    /* -------- 404: walk in, realise the page is gone, jetpack away -------- */
    after: function (ms, fn) { this.timers.push(setTimeout(fn, ms)); },
    clearTimers: function () { this.timers.forEach(clearTimeout); this.timers = []; },

    start404: function () {
      this.el.title = '';
      this.el.setAttribute('aria-label', 'Alex, flying away from this missing page');
      this.dir = 1;
      this.run404();
    },

    run404: function () {
      var self = this;
      this.clearTimers();
      this.jet = false; this.y = 0; this.vy = 0;
      this.el.style.visibility = '';
      if (reduced) {
        this.x = this.center(); this.setState('surprised', 1e9);
        this.say("Uh-oh, this page doesn't exist. Let's head home!", null, 1e9);
        return;
      }
      this.x = this.dir > 0 ? -this.w - 10 : window.innerWidth + 10;
      this.target = this.center();
      this.speed = Math.max(90, window.innerWidth / 9);   // a brisk entrance on any width
      this.setState('walk', 1e9);
      this.onArrive = function () {
        self.setState('surprised', 1e9);
        self.say('Wait… where did the page go? 🤔', null, 2100);
        self.after(2200, function () {
          self.setState('lookaround', 1e9);
          self.after(1700, function () {
            self.say("Yep, it's a 404. Time to bail! 🚀", null, 2400);
            self.jet = true;
            self.setState('jetprep', 1e9);
            self.after(2300, function () { self.takeOff(false); });
          });
        });
      };
    },

    takeOff: function (early) {
      if (this.state === 'fly' || this.state === 'gone' || reduced) return;
      this.clearTimers();
      this.onArrive = null;
      this.jet = true;
      this.vy = 40;
      this.setState('fly', 1e9);
      this.say(early ? "Okay okay, I'm going! 🚀" : 'Byeee! 👋', null, 1600);
    },

    scheduleNudges: function () {
      var self = this, count = 0;
      var tick = function () {
        if (count >= 4) return;
        if (self.bubbleOpen || self.chatOpen || self.away || document.hidden || !self.isFree()) {
          setTimeout(tick, 8000); return;
        }
        var seenCerts = store.get('certs'), usedAI = store.get('ai');
        if (seenCerts && usedAI) return;
        var wantCerts = !seenCerts && (count % 2 === 0 || usedAI);
        if (wantCerts) self.remindCerts(false); else self.suggestAI(false);
        count++;
        setTimeout(tick, 70000);
      };
      setTimeout(tick, 22000);
    },

    watchSections: function () {
      var self = this, sec = document.getElementById('certifications');
      if (!sec || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (!self.celebratedCerts) {
            self.celebratedCerts = true;
            store.set('certs', '1');
            setTimeout(function () {
              self.setState('cool', 3200);
              self.spawn('✦', 6);
              self.say(self.pick(['Yesss, his certificates! 😎', 'He worked hard for these 😎']), null, 3600);
            }, 500);
          }
        });
      }, { threshold: 0.12 }).observe(sec);
    },

    watchChat: function () {
      var self = this;
      setInterval(function () {
        var panel = document.querySelector('.alex-panel');
        var open = !!(panel && panel.classList.contains('is-open'));
        if (open && !self.chatOpen) {
          store.set('ai', '1'); self.hideBubble();
          if (self.state === 'walk') { self.target = null; self.setState('idle'); }
          self.placeChat(true);
        }
        self.chatOpen = open;
      }, 600);
    },

    /* -------- speech bubble -------- */
    say: function (text, actions, ms) {
      if (this.away) return;   // never talk over a running game
      var self = this, b = this.bub;
      b.innerHTML = '';
      var tx = document.createElement('p');
      tx.textContent = text;
      b.appendChild(tx);
      if (actions && actions.length) {
        var row = document.createElement('div');
        row.className = 'pet-actions';
        actions.forEach(function (a) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = a.t;
          if (a.primary) btn.className = 'is-primary';
          btn.addEventListener('click', function (e) { e.stopPropagation(); a.fn(); });
          row.appendChild(btn);
        });
        b.appendChild(row);
      }
      b.classList.add('is-open');
      this.bubbleOpen = true;
      clearTimeout(this.bubTimer);
      this.bubTimer = setTimeout(function () { self.hideBubble(); }, ms || 3500);
      this.placeBubble();
    },
    hideBubble: function () {
      this.bub.classList.remove('is-open');
      this.bubbleOpen = false;
      clearTimeout(this.bubTimer);
    },
    placeBubble: function () {
      if (!this.bubbleOpen) return;
      var bw = this.bub.offsetWidth;
      var cx = this.x + this.w / 2;
      var left = Math.max(10, Math.min(window.innerWidth - bw - 10, cx - bw / 2));
      this.bub.style.left = left + 'px';
      this.bub.style.bottom = (this.ground() + this.y + this.h + 6) + 'px';
      this.bub.style.setProperty('--tail', Math.max(14, Math.min(bw - 14, cx - left)) + 'px');
    },

    /* -------- particles -------- */
    spawn: function (ch, n, cls, yFrac) {
      if (reduced) return;
      for (var i = 0; i < n; i++) {
        var s = document.createElement('span');
        s.className = 'pet-fx' + (cls ? ' ' + cls : ch === '♥' ? ' is-heart' : ch === 'z' ? ' is-z' : '');
        s.textContent = ch;
        s.style.left = (this.x + this.w * (cls === 'is-smoke' ? (Math.random() < 0.5 ? 0.17 : 0.83) : 0.25 + Math.random() * 0.5)) + 'px';
        s.style.bottom = (this.ground() + this.y + this.h * (yFrac != null ? yFrac + Math.random() * 0.05 : 0.6 + Math.random() * 0.3)) + 'px';
        s.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
        s.style.animationDelay = (i * 0.12) + 's';
        document.body.appendChild(s);
        setTimeout(s.remove.bind(s), 1800 + i * 120);
      }
    },

    pick: function (a) { return a[(Math.random() * a.length) | 0]; },

    /* -------- brain -------- */
    think: function (now) {
      if (this.chatOpen) return;
      var idleFor = Date.now() - this.lastMove;
      if (idleFor > 40000 && this.state !== 'sleep' && this.isFree()) {
        this.setState('sleep', 1e9); return;
      }
      if (this.state !== 'idle' || reduced) return;
      var roll = Math.random();
      var ptr = this.pointer;
      if (ptr && roll < 0.35 && now - this.lastPointerMove < 4000) {
        // come over to wherever the cursor is
        this.target = this.clampX(ptr.x - this.w / 2);
      } else if (roll < 0.8) {
        this.target = this.clampX(Math.random() * this.maxX());
      } else {
        this.setState(Math.random() < 0.5 ? 'wave' : 'excited');
        if (!GAME_PAGE && !this.bubbleOpen && Math.random() < 0.5) this.chatter();
        return;
      }
      if (Math.abs(this.target - this.x) > 20) this.setState('walk', 1e9);
    },

    loop: function (now) {
      if (document.hidden) return;
      var dt = this.prev ? Math.min(0.05, (now - this.prev) / 1000) : 0.016;
      this.prev = now;
      this.stateT += dt * 1000;

      var s = this.state;
      if (s === 'land' && this.stateT > this.stateDur) {
        this.setState('happy', 1400);
        this.spawn('♥', 2);
        this.say(this.pick(['Nailed the landing! 🙌', 'Again! Again!', 'Ta-da! ✨']), null, 2000);
        s = this.state;
      }
      if (this.stateDur && this.stateT > this.stateDur && ['walk', 'held', 'fall', 'sleep'].indexOf(s) === -1) {
        this.setState(s === 'happy' && this.hover ? 'happy' : 'idle', s === 'happy' && this.hover ? 1e9 : 0);
        s = this.state;
      }

      if (MODE !== '404' && now > this.nextThink) { this.think(now); this.nextThink = now + 2500 + Math.random() * 4500; }

      // cursor proximity
      var near = false, ptr = this.pointer;
      if (ptr) {
        var cx = this.x + this.w / 2, cy = window.innerHeight - this.ground() - this.y - this.h / 2;
        var dist = Math.hypot(ptr.x - cx, ptr.y - cy);
        near = dist < 170;
        if (MODE !== '404' && near && !this.hover && (s === 'idle' || s === 'walk') && now > this.cooldownNear && now - this.lastPointerMove < 300) {
          this.cooldownNear = now + 14000;
          this.setState('excited', 1500);
          this.spawn('✦', 3);
          if (!this.bubbleOpen) this.say(this.pick(['Oh hi! 👋', 'Ooh, a cursor!', 'Hey there!', 'Hello, friend! 😄']), null, 1800);
          s = this.state;
        }
      }

      // physics / motion
      var look = { x: 0, y: 0 }, pose = { bob: 0, legs: [0, 0, 0, 0] };
      if (s === 'walk') {
        if (this.target == null) this.target = this.x;
        var d = this.target - this.x;
        this.dir = d >= 0 ? 1 : -1;
        var step = this.speed * (this.chatOpen ? 2 : 1) * dt;
        if (Math.abs(d) <= step) {
          this.x = this.target; this.target = null; this.setState('idle');
          if (this.onArrive) { var arrive = this.onArrive; this.onArrive = null; arrive(); }
        }
        else this.x += step * this.dir;
      }
      if (s === 'fly') {
        this.vy += 700 * dt;
        this.y += this.vy * dt;
        this.x += this.dir * 40 * dt;
        if (!this.smokeAt || now > this.smokeAt) { this.smokeAt = now + 70; this.spawn('●', 1, 'is-smoke', 0.12); }
        if (this.y > window.innerHeight + 40) {
          this.setState('gone', 1e9);
          this.hideBubble();
          this.el.style.visibility = 'hidden';
          var me = this;
          this.after(2600, function () { me.dir = -me.dir; me.run404(); });
        }
      } else if (s === 'jetprep') {
        this.y = this.stateT > 1300 ? Math.min(12, (this.stateT - 1300) / 50) : 0;
        if (this.stateT > 1300 && (!this.smokeAt || now > this.smokeAt)) { this.smokeAt = now + 140; this.spawn('●', 1, 'is-smoke', 0.12); }
      } else if (s === 'gone') {
        // off-screen, waiting to walk back in
      } else if (s === 'fall') {
        this.vy -= 1800 * dt;
        this.y += this.vy * dt;
        if (this.y <= 0) {
          this.y = 0; this.vy = 0;
          this.setState('land', 450);
        }
      } else if (s !== 'held') {
        if (s === 'excited' && !reduced) this.y = Math.abs(Math.sin(this.stateT / 160)) * 16;
        else if (s === 'cool' && !reduced) this.y = Math.max(0, Math.sin(this.stateT / 220)) * 8;
        else this.y = Math.max(0, this.y - 400 * dt);
      }
      if (this.y > 0 && s !== 'held' && s !== 'fall' && s !== 'excited' && s !== 'cool') this.y = Math.max(0, this.y);

      // eyes follow the cursor
      if (ptr) {
        var hx = this.x + this.w / 2, hy = window.innerHeight - this.ground() - this.y - this.h * 0.72;
        var ddx = ptr.x - hx, ddy = ptr.y - hy;
        look.x = Math.abs(ddx) < 28 ? 0 : (ddx > 0 ? 1 : -1);
        look.y = Math.abs(ddy) < 60 ? 0 : (ddy > 0 ? 1 : -1);
        if (this.dir < 0) look.x = -look.x; // canvas is mirrored when facing left
      }

      // pose by state
      var t = this.stateT, frame;
      var spec = { look: look, arms: 'down', face: 'smile', eyes: 'open', bob: 0, legs: [0, 0, 0, 0] };
      var blinking = false;
      if (now > this.blinkAt) { blinking = true; if (now > this.blinkAt + 130) this.blinkAt = now + 2200 + Math.random() * 3200; }

      switch (s) {
        case 'walk':
          frame = Math.floor(now / 130) % 4;
          spec.legs = [[0, -1, 0, 0], [0, 0, 0, 0], [0, 0, 0, -1], [0, 0, 0, 0]][frame];
          spec.bob = (frame % 2) ? 0 : -1;
          spec.swing = frame === 0 ? 1 : frame === 2 ? -1 : 0;
          spec.look = { x: 1, y: 0 };
          break;
        case 'excited':
          spec.arms = 'up'; spec.face = 'open'; spec.eyes = 'happy';
          spec.legs = this.y > 4 ? [0, -1, 0, -1] : [0, 0, 0, 0];
          break;
        case 'happy':
          spec.face = 'grin'; spec.eyes = 'happy'; spec.blush = true;
          spec.bob = Math.floor(now / 380) % 2 ? -1 : 0;
          break;
        case 'wave':
          spec.arms = 'wave'; spec.waveTick = Math.floor(t / 180) % 2; spec.face = 'grin';
          break;
        case 'point':
          spec.arms = 'wave'; spec.waveTick = 0; spec.face = 'grin';
          spec.bob = Math.floor(now / 400) % 2 ? -1 : 0;
          break;
        case 'cool':
          spec.shades = true; spec.arms = 'up'; spec.face = 'grin';
          break;
        case 'held':
          spec.arms = 'held'; spec.face = 'o'; spec.eyes = 'wide';
          frame = Math.floor(now / 160) % 2;
          spec.legs = frame ? [-1, -1, 1, 0] : [1, 0, -1, -1];
          break;
        case 'fall':
          spec.arms = 'up'; spec.face = 'open'; spec.eyes = 'wide'; spec.legs = [0, -1, 0, -1];
          break;
        case 'land':
          spec.bob = 1; spec.face = 'flat'; spec.eyes = 'closed';
          break;
        case 'surprised':
          spec.face = 'o'; spec.eyes = 'wide';
          break;
        case 'lookaround':
          spec.face = 'flat';
          spec.look = { x: Math.floor(t / 420) % 2 ? 1 : -1, y: 0 };
          break;
        case 'jetprep':
          spec.jetpack = true; spec.face = 'grin';
          spec.flame = t > 1300 ? 2 : (t > 500 ? 1 : 0);
          spec.flick = Math.floor(now / 70) % 2;
          spec.shades = t > 900;
          spec.legs = t > 1300 ? [0, -1, 0, -1] : [0, 0, 0, 0];
          break;
        case 'fly':
          spec.jetpack = true; spec.flame = 2; spec.flick = Math.floor(now / 60) % 2;
          spec.arms = 'up'; spec.shades = true; spec.face = 'grin';
          spec.legs = [0, -1, 0, -1];
          break;
        case 'sleep':
          spec.eyes = 'closed'; spec.face = 'flat';
          spec.bob = Math.floor(now / 900) % 2;
          if (!this.zAt || now > this.zAt) { this.zAt = now + 1400; this.spawn('z', 1); }
          break;
        default: // idle
          spec.bob = reduced ? 0 : (Math.floor(now / 620) % 2 ? -1 : 0);
          if (near) spec.face = 'grin';
      }
      if (blinking && spec.eyes === 'open' && !spec.shades) spec.eyes = 'closed';
      if (this.jet && MODE === '404') spec.jetpack = true;

      var key = JSON.stringify(spec) + this.dir;
      if (key !== this.frameKey) {
        this.frameKey = key;
        compose(spec);
        paint(this.ctx);
      }

      var squash = s === 'land' ? ' scale(1.08, 0.9)' : '';
      if (s === 'jetprep' && t > 500) squash += ' translateX(' + (Math.floor(now / 45) % 2 ? 1 : -1) + 'px)';
      this.cv.style.transform = (this.dir < 0 ? 'scaleX(-1)' : '') + squash;
      this.el.style.transform = 'translate3d(' + this.x.toFixed(1) + 'px,' + (-this.y).toFixed(1) + 'px,0)';
      this.el.style.bottom = this.ground() + 'px';
      this.shadow.style.transform = 'translate(-50%, ' + this.y.toFixed(1) + 'px) scale(' + Math.max(0.4, 1 - this.y / 160).toFixed(2) + ')';
      this.shadow.style.opacity = Math.max(0, 1 - this.y / 240).toFixed(2);
      this.el.classList.toggle('is-held', s === 'held');
      this.placeBubble();
      if (this.chatOpen) this.placeChat(false);

      requestAnimationFrame(this.loop);
    }
  };

  Pet._render = function (spec, ctx) { compose(spec); paint(ctx || this.ctx); };
  window.__pixelPet = Pet;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { Pet.init(); });
  else Pet.init();
})();
