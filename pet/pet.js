/* Alex — Indrajit's walking 16-bit pixel pet (he's also the AI chat assistant).
   The sprite is drawn in code (no image assets): his swept black hair and stubble,
   in a black suit, white shirt and black tie — with outfits, hats and props he
   swaps as you move through the site.
   It walks the bottom of the screen, tracks the cursor with its eyes, opens the
   Alex AI chat when clicked and can be dragged and dropped. Stroke his head and he
   dozes off; tickle his belly and he laughs, then gets cross and sends you to
   another part of the portfolio. Each section has its own look: a graduation gown
   (and a thrown cap) in Education, a laptop out of the backpack in Experience, a
   handyman's hard hat and screwdriver in Projects; on the Hobbies page he rides a
   bicycle and takes photos with a flash. */
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

  // Body art is drawn in "body coordinates" (x 0–31, y 0–43); OX/OY pad the canvas
  // so hats, props and the bicycle have room around him.
  var OX = 4, OY = 8, W = 40, H = 52;
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
    flush: '#d8573f', tear: '#7cc4ff', tearHi: '#d4ecff',
    lens: '#121212', lensHi: '#5b5b5b',
    gold: '#e2b23a', goldSh: '#b88a1e', goldHi: '#fbe08a',
    jet: '#7d828f', jetHi: '#b7bcc8', jetDk: '#4c505b', jetRed: '#d24b3e',
    fire1: '#fff3b0', fire2: '#ffc23d', fire3: '#ff7a1f', fire4: '#e2401c',
    bag: '#3a4250', bagSh: '#2a303b', bagHi: '#55607a',
    alu: '#c9ccd2', aluSh: '#9a9ea8', aluHi: '#eef0f3',
    gadget: '#1c1c20', gadgetHi: '#4a4a52'
  };
  // jacket / sleeve / trouser / shoe colours for each outfit
  var OUTFIT = {
    suit:   { jac: C.suit, jacSh: C.suitSh, jacHi: C.suitHi, cuff: C.white, pant: C.pant, pantSh: C.pantSh, pantDk: C.pantDk, shoe: C.shoe, shoeSh: C.shoeSh, sole: C.sole },
    gown:   { jac: '#1f2547', jacSh: '#141832', jacHi: '#3a4578', cuff: '#1f2547', pant: C.pant, pantSh: C.pantSh, pantDk: C.pantDk, shoe: C.shoe, shoeSh: C.shoeSh, sole: C.sole },
    handy:  { jac: '#b5443a', jacSh: '#86302a', jacHi: '#d8695c', cuff: '#86302a', pant: '#3d5f8f', pantSh: '#2c4770', pantDk: '#203656', shoe: '#5a3a22', shoeSh: '#80583a', sole: '#24170d' },
    iron:   { jac: '#b3202a', jacSh: '#7d141b', jacHi: '#e0504a', cuff: '#e2b23a', hand: '#e2b23a', pant: '#b3202a', pantSh: '#7d141b', pantDk: '#560c12', shoe: '#e2b23a', shoeSh: '#b88a1e', sole: '#3a2a10' },
    casual: { jac: '#1d1d21', jacSh: '#111114', jacHi: '#3c3c44', cuff: '#1d1d21', pant: '#3b5d8c', pantSh: '#2b4569', pantDk: '#20344f', shoe: '#f0f0ea', shoeSh: '#c9c9c1', sole: '#8f8f88' }
  };

  /* ---------------- sprite ---------------- */
  var grid;
  function clear() {
    grid = [];
    for (var i = 0; i < W * H; i++) grid.push(null);
  }
  function p(x, y, c) { x += OX; y += OY; if (x >= 0 && x < W && y >= 0 && y < H) grid[y * W + x] = c; }
  function r(x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) p(x + i, y + j, c); }
  function line(x0, y0, x1, y1, c) {
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (var n = 0; n < 64; n++) {
      p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  /* graduation cap, shared by the sprite and the cap he throws (put = pixel writer) */
  function drawMortar(put, h, sway) {
    var R = function (x, y, w, hh, c) { for (var j = 0; j < hh; j++) for (var i = 0; i < w; i++) put(x + i, y + j, c); };
    R(10, h, 13, 3, '#141832');                 // skull cap
    R(11, h - 3, 11, 1, '#3a4578');             // board, seen from just above
    R(7, h - 2, 19, 1, '#1f2547');
    R(9, h - 1, 15, 1, '#141832');
    put(16, h - 3, C.gold);                     // button
    var tx = 24 + (sway || 0);                  // tassel
    put(17, h - 3, C.gold); R(18, h - 3, 6, 1, C.gold);
    R(tx, h - 2, 1, 4, C.gold); R(tx - 1, h + 2, 3, 2, C.goldSh); put(tx, h + 2, C.gold);
  }

  function drawBike(f, noCrank) {
    var frame = '#1f6f8b', frameHi = '#3a93b0', tyre = '#141414', spoke = '#a2a6ae';
    [[4, 38], [28, 38]].forEach(function (w) {
      for (var y = -5; y <= 5; y++) for (var x = -5; x <= 5; x++) {
        var d = Math.hypot(x, y);
        if (d >= 3.6 && d <= 4.7) p(w[0] + x, w[1] + y, tyre);
      }
      var a = f * Math.PI / 4;
      for (var k = -3; k <= 3; k++) {
        p(w[0] + Math.round(Math.cos(a) * k), w[1] + Math.round(Math.sin(a) * k), spoke);
        p(w[0] + Math.round(Math.cos(a + Math.PI / 2) * k), w[1] + Math.round(Math.sin(a + Math.PI / 2) * k), spoke);
      }
      p(w[0], w[1], '#d8d8d8');
    });
    line(4, 38, 16, 38, frame);      // chainstay
    line(4, 38, 12, 30, frame);      // seatstay
    line(16, 38, 12, 29, frame);     // seat tube
    line(12, 30, 26, 30, frameHi);   // top tube
    line(16, 38, 26, 31, frame);     // down tube
    line(26, 30, 28, 38, frame);     // fork
    line(26, 30, 25, 26, '#2a2a2a'); r(23, 26, 5, 1, '#2a2a2a');   // stem + bar
    r(10, 28, 5, 1, '#111');          // saddle
    if (noCrank) return;
    var c = f % 2 ? 1 : -1;           // crank + pedals
    p(16 + c, 37, '#888'); p(16 - c, 39, '#888');
    r(15 + 2 * c, 36, 2, 1, '#333'); r(15 - 2 * c, 40, 2, 1, '#333');
  }

  /* ---- side-on rider (bicycle / car). Drawn facing +x; the canvas is mirrored
     when he heads left, so you see his left side going right and his right side
     going left. Legs are two-bone IK chains whose feet stay on the turning pedals. ---- */
  function brush(x0, y0, x1, y1, w, c) {
    var n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)), o = (w - 1) / 2;
    for (var i = 0; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      r(Math.round(x - o), Math.round(y - o), w, w, c);
    }
  }
  function knee(hx, hy, fx, fy, L1, L2) {         // the knee always bends forward (+x)
    var dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01);
    var a = Math.atan2(dy, dx), A = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    var k1 = [hx + Math.cos(a - A) * L1, hy + Math.sin(a - A) * L1], k2 = [hx + Math.cos(a + A) * L1, hy + Math.sin(a + A) * L1];
    return k1[0] > k2[0] ? k1 : k2;
  }
  function sideLeg(hip, foot, pant, pantSh, shoe, sole, edge) {
    var k = knee(hip[0], hip[1], foot[0], foot[1], 6.4, 6.4);
    if (edge) {                                   // outline the near leg so it reads against the far one
      brush(hip[0], hip[1], k[0], k[1], 5, C.o);
      brush(k[0], k[1], foot[0] - 0.5, foot[1] - 1.5, 4, C.o);
      r(Math.round(foot[0]) - 3, Math.round(foot[1]) - 3, 7, 5, C.o);
    }
    brush(hip[0], hip[1], k[0], k[1], 3, pant);
    brush(k[0], k[1], foot[0] - 0.5, foot[1] - 1.5, 2, pant);
    p(Math.round(k[0]) + 1, Math.round(k[1]), pantSh);
    var fx = Math.round(foot[0]), fy = Math.round(foot[1]);
    r(fx - 2, fy - 2, 5, 2, shoe); p(fx + 3, fy - 1, shoe); r(fx - 2, fy, 6, 1, sole);
  }
  function composeSide(s) {
    var F = OUTFIT[s.outfit] || OUTFIT.suit, b = s.bob || 0, h = b;
    var onBike = s.bike != null;
    var hip = [12, 28 + b];

    if (onBike) {
      var a = (s.bike || 0) * Math.PI / 4, BB = [16, 38], CR = 3.5;
      var near = [BB[0] + Math.cos(a) * CR, BB[1] + Math.sin(a) * CR];
      var far = [BB[0] - Math.cos(a) * CR, BB[1] - Math.sin(a) * CR];
      // far leg and crank sit behind the frame, a shade darker
      sideLeg([hip[0] - 1, hip[1]], far, F.pantDk, F.pantDk, F.shoeSh, F.sole);
      line(16, 38, Math.round(far[0]), Math.round(far[1]), '#555');
      drawBike(s.bike, true);
      line(16, 38, Math.round(near[0]), Math.round(near[1]), '#9a9aa2');
      p(16, 38, '#c8c8cc');
      sideLeg(hip, near, F.pant, F.pantSh, F.shoe, F.sole, true);
    }

    // torso, leaning forward from the hips
    var lean = onBike ? 5 : 3, top = 19 + b;
    for (var y = top; y <= 28 + b; y++) {
      var cx = Math.round(hip[0] + lean * (28 + b - y) / (28 + b - top));
      r(cx - 3, y, 6, 1, F.jac);
      p(cx - 3, y, F.jacSh);
      if (s.outfit === 'casual' || s.outfit === 'suit') { p(cx + 2, y, C.white); if (s.outfit === 'casual') p(cx + 1, y, C.white); }
    }
    r(hip[0] - 3, 28 + b, 6, 1, F.pant);
    if (s.outfit === 'suit') p(hip[0] + lean + 2, top + 2, C.tie);

    // near arm reaching for the handlebar / steering wheel
    var sh = [hip[0] + lean - 0.5, top + 1.5], hand = onBike ? [24, 26] : [21.5, 27];
    var el = [(sh[0] + hand[0]) / 2 + 0.5, (sh[1] + hand[1]) / 2 + 1.5];
    brush(sh[0], sh[1], el[0], el[1], 3, F.jac);
    brush(el[0], el[1], hand[0] - 1, hand[1] - 0.5, 2, F.jac);
    p(Math.round(hand[0]) - 2, Math.round(hand[1]), F.cuff);
    r(Math.round(hand[0]) - 1, Math.round(hand[1]) - 1, 2, 2, F.hand || C.skin);

    // head in profile, facing forward
    r(17, 17 + h, 3, 2, C.skinSh);                           // neck
    r(16, 8 + h, 7, 8, C.skin); r(17, 16 + h, 5, 1, C.skin); r(22, 15 + h, 1, 1, C.skin);
    r(16, 8 + h, 1, 7, C.skinSh);
    p(23, 12 + h, C.skin); p(23, 13 + h, C.skinSh); p(24, 12 + h, C.skinSh);   // nose
    r(17, 11 + h, 2, 3, C.skinSh); p(18, 12 + h, C.skin);                      // ear
    for (var sx = 18; sx <= 22; sx++) { if (sx % 2) p(sx, 15 + h, C.stub); p(sx, 16 + h, C.stub); }
    p(19, 14 + h, C.stub);
    r(15, 3 + h, 8, 5, C.hair); r(14, 5 + h, 3, 7, C.hair); r(16, 2 + h, 7, 1, C.hair); r(18, 1 + h, 5, 1, C.hair);
    r(21, 3 + h, 3, 2, C.hair); p(24, 4 + h, C.hair); r(16, 8 + h, 3, 1, C.hair);
    r(17, 2 + h, 3, 1, C.hairHi); r(19, 3 + h, 3, 1, C.hairHi); p(16, 5 + h, C.hairMid);
    // brow + eye
    if (s.brows === 'angry') { p(20, 9 + h, C.hair); p(21, 10 + h, C.hair); p(22, 10 + h, C.hair); }
    else if (s.brows === 'sad') { p(20, 10 + h, C.hairMid); p(21, 9 + h, C.hairMid); p(22, 9 + h, C.hairMid); }
    else r(20, 9 + h, 3, 1, C.hairMid);
    var eyes = s.eyes || 'open';
    if (s.shades) { r(19, 10 + h, 4, 2, C.lens); p(21, 10 + h, C.lensHi); }
    else if (eyes === 'closed' || eyes === 'squint') r(20, 11 + h, 2, 1, C.o);
    else if (eyes === 'happy') { p(20, 11 + h, C.o); p(21, 10 + h, C.o); p(22, 11 + h, C.o); }
    else if (eyes === 'glare') { r(20, 11 + h, 2, 1, C.eyeW); p(21, 11 + h, C.pupil); r(20, 10 + h, 3, 1, C.skinSh); }
    else { r(20, 10 + h, 2, 2, C.eyeW); r(21, 10 + h, 1, 2, C.pupil); }
    if (s.blush) p(20, 13 + h, C.blush);
    if (s.flush) { r(19, 13 + h, 2, 1, C.flush); p(19, 8 + h, C.flush); }
    if (s.tears != null) for (var k = 0; k < 2 + (s.tears % 3); k++) p(20, 12 + h + k, C.tear);
    var face = s.face || 'smile';
    if (face === 'open' || face === 'laugh' || face === 'wail') { r(21, 14 + h, 2, 2, C.mouth); p(22, 15 + h, C.tongue); }
    else if (face === 'o') r(21, 14 + h, 2, 2, C.mouth);
    else if (face === 'grit') { r(20, 14 + h, 3, 1, C.white); p(23, 14 + h, C.mouth); }
    else if (face === 'flat' || face === 'frown') r(21, 14 + h, 2, 1, C.mouth);
    else { p(21, 14 + h, C.mouth); p(22, 14 + h, C.mouth); p(23, 13 + h, C.mouth); }
    // headwear, side-on
    if (s.hat === 'captain') {
      r(15, 1 + h, 8, 3, C.white); r(14, 4 + h, 10, 2, '#1f2547'); r(22, 6 + h, 4, 1, '#111'); p(20, 2 + h, C.gold);
    } else if (s.hat === 'phones') {
      r(16, h, 6, 1, C.gadget); p(15, 1 + h, C.gadget); p(22, 1 + h, C.gadget); r(17, 2 + h, 1, 8, C.gadget);
      r(16, 10 + h, 4, 5, '#b23a3a'); r(16, 10 + h, 4, 1, '#e0675a');
    } else if (s.hat === 'hard') {
      r(15, h, 9, 4, '#f2c230'); r(14, 4 + h, 12, 1, '#c9971c'); r(17, 1 + h, 2, 2, '#fff0a0');
    }

    if (s.car != null) drawCar(s.car, true);
  }

  /* s = { outfit, hat, glasses, medal, prop, face, eyes, brows, look, arms, legs, seat,
           bob, swing, shades, blush, flush, tears, bike, flash, jetpack, flame } */
  function compose(s) {
    clear();
    if (s.side) { composeSide(s); return; }
    var b = s.bob || 0;           // body bob (head + torso)
    var lx = s.look ? s.look.x : 0, ly = s.look ? s.look.y : 0;
    var F = OUTFIT[s.outfit] || OUTFIT.suit, outfit = s.outfit || 'suit';
    var t = 19 + b, h = b, i;

    // ---- jetpack: two tanks out beside the arms, flames below ----
    var jt = 19 + b;
    if (s.jetpack) {
      [3, 26].forEach(function (jx) {
        r(jx + 1, jt - 1, 1, 1, C.jetHi);
        r(jx, jt, 3, 9, C.jet);
        r(jx, jt, 1, 8, C.jetHi);
        r(jx + 2, jt, 1, 9, C.jetDk);
        r(jx, jt + 3, 3, 1, C.jetRed);
        r(jx, jt + 9, 3, 1, C.jetDk);
      });
      r(6, jt + 1, 1, 1, C.jetDk); r(25, jt + 1, 1, 1, C.jetDk);
      if (s.flame) {
        var fl = s.flame, flick = s.flick || 0;
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

    if (s.bike != null) drawBike(s.bike);
    if (s.prop === 'laptop') {                  // his backpack, set down beside him
      r(-3, 34, 7, 7, C.bag); r(-3, 34, 7, 2, C.bagSh); r(-2, 37, 5, 3, C.bagHi); p(0, 36, C.gold);
    }
    if (s.prop === 'bagback') r(9, t - 2, 14, 3, C.bag);   // top of the backpack peeking over his shoulders

    // ---- legs ----
    if (s.seat === 'car') {
      // legs are down in the footwell
    } else if (s.seat === 'cross') {
      r(7, t + 10, 18, 3, F.pant); r(7, t + 12, 18, 1, F.pantSh);
      r(5, t + 11, 4, 2, F.pant); r(23, t + 11, 4, 2, F.pant);
      r(5, t + 13, 4, 2, F.shoe); r(23, t + 13, 4, 2, F.shoe);
      r(5, t + 14, 4, 1, F.sole); r(23, t + 14, 4, 1, F.sole);
      p(16, t + 11, F.pantDk);
    } else {
      var L = s.legs || [0, 0, 0, 0];
      leg(10, L[0], L[1], true, F);
      leg(16, L[2], L[3], false, F);
      r(10, 28, 12, 1, F.pant);    // waistband, so a bob never opens a gap
      if (s.thrust) {              // boot thrusters
        var fk = s.flick || 0;
        [10 + L[0] - 1, 16 + L[2] + 1].forEach(function (bx) {
          r(bx + 1, 42, 4, 1, C.fire1); r(bx + 2, 43, 2, 1, fk ? C.fire2 : C.fire3);
        });
      }
    }

    // ---- torso ----
    r(9, t, 14, 10, F.jac);
    r(9, t, 14, 1, F.jacHi);
    r(22, t + 1, 1, 9, F.jacSh); r(9, t + 9, 14, 1, F.jacSh);
    if (outfit === 'suit' || outfit === 'gown') {
      if (outfit === 'gown' && !s.seat) {     // the robe falls to the knees
        r(8, 28, 16, 7, F.jac); r(8, 28, 1, 7, F.jacHi); r(23, 28, 1, 7, F.jacSh); r(8, 34, 16, 1, F.jacSh);
        p(15, 31, F.jacSh); p(16, 32, F.jacSh); p(15, 33, F.jacSh);
      }
      r(13, t, 6, 1, C.white);
      for (var v = 1; v <= 4; v++) { p(13 + (v > 2 ? 1 : 0), t + v, C.white); p(18 - (v > 2 ? 1 : 0), t + v, C.white); }
      r(14, t + 1, 4, 3, C.white);
      p(13, t, C.whiteSh); p(18, t, C.whiteSh);
      r(15, t, 2, 1, C.tie); r(15, t + 1, 2, 5, C.tie); p(15, t + 2, C.tieHi); p(16, t + 6, C.tie);
      if (outfit === 'suit') {
        p(12, t + 1, C.suitHi); p(12, t + 2, C.suitHi); p(13, t + 3, C.suitHi); p(14, t + 5, C.suitHi);
        p(19, t + 1, C.suitHi); p(19, t + 2, C.suitHi); p(18, t + 3, C.suitHi); p(17, t + 5, C.suitHi);
        p(16, t + 7, C.suitHi);
        r(19, t + 3, 2, 1, C.white);
      } else {                                // gold graduation stole
        var se = s.seat ? 9 : 14;
        r(11, t, 2, se, C.gold); r(19, t, 2, se, C.gold); r(12, t, 1, se, C.goldSh); r(20, t, 1, se, C.goldSh);
        p(11, t + 3, C.goldHi); p(19, t + 3, C.goldHi);
      }
    } else if (outfit === 'handy') {          // check shirt, denim bib overalls, tool belt
      for (i = 9; i <= 22; i += 3) r(i, t + 1, 1, 8, F.jacSh);
      r(9, t + 4, 14, 1, F.jacHi);
      r(12, t + 3, 8, 7, F.pant); r(12, t, 1, 3, F.pant); r(19, t, 1, 3, F.pant);
      r(14, t + 4, 4, 2, F.pantSh); p(12, t + 3, C.gold); p(19, t + 3, C.gold);
      r(13, t, 6, 1, F.jacHi); p(15, t + 1, F.jacSh); p(16, t + 1, F.jacSh);
      r(9, t + 9, 14, 1, '#6b4422'); r(15, t + 9, 2, 1, C.gold);
      r(7, t + 10, 3, 1, '#9a9aa2'); r(8, t + 10, 1, 4, '#8a5a2b');          // hammer on the belt
      r(21, t + 9, 2, 2, '#f2c230'); p(21, t + 10, '#2a2a2a');               // tape measure
    } else if (outfit === 'iron') {           // red-and-gold armour with a glowing chest reactor
      r(9, t, 3, 2, C.gold); r(20, t, 3, 2, C.gold);
      r(13, t + 5, 6, 4, C.gold); r(13, t + 5, 6, 1, C.goldHi); r(15, t + 6, 2, 3, C.goldSh); r(13, t + 7, 6, 1, C.goldSh);
      r(14, t + 1, 4, 4, '#4a0c10'); r(15, t + 1, 2, 4, '#7fd8ff'); r(14, t + 2, 4, 2, '#7fd8ff');
      r(15, t + 2, 2, 2, s.glow ? '#ffffff' : '#dff8ff');
      r(10, t + 3, 2, 3, C.gold); r(20, t + 3, 2, 3, C.gold);
    } else if (outfit === 'casual') {         // open black jacket over a white tee (his look in the photos)
      r(12, t, 8, 10, C.white); r(19, t + 1, 1, 9, C.whiteSh); r(14, t, 4, 1, C.whiteSh);
      p(12, t + 2, F.jacHi); p(12, t + 5, F.jacHi); p(19, t + 2, F.jacHi); p(19, t + 5, F.jacHi);
      r(12, t + 9, 8, 1, C.whiteSh);
    }
    if (s.medal) {                            // ribbon + medal for the certificates
      p(13, t + 1, '#2e6fd0'); p(14, t + 2, '#2e6fd0'); p(18, t + 1, '#d04a3a'); p(17, t + 2, '#d04a3a');
      r(15, t + 3, 2, 1, '#2e6fd0'); r(15, t + 4, 2, 2, C.gold); p(15, t + 4, C.goldHi);
    }
    if (s.prop === 'bagback') { r(10, t + 1, 2, 7, '#4a3a2a'); r(20, t + 1, 2, 7, '#4a3a2a'); }
    if (s.prop === 'bagfront' || s.prop === 'pulling') {
      r(10, t + 2, 12, 8, C.bag); r(10, t + 2, 12, 2, C.bagSh); r(13, t + 6, 6, 3, C.bagHi); r(15, t + 4, 2, 1, C.gold);
      if (s.prop === 'pulling') { r(11, t - 3, 10, 5, C.alu); r(11, t - 3, 10, 1, C.aluHi); r(20, t - 2, 1, 4, C.aluSh); p(15, t - 1, C.aluHi); }
    }

    arms(s, t, h, F);

    if (s.car != null) drawCar(s.car);

    // ---- props held in front of the body ----
    if (s.prop === 'laptop') {
      r(10, t + 1, 12, 8, C.alu); r(10, t + 1, 12, 1, C.aluHi); r(21, t + 2, 1, 7, C.aluSh);
      r(15, t + 4, 2, 2, s.glow ? C.goldHi : C.gold);              // the logo, glowing faintly
      r(8, t + 9, 16, 1, C.aluSh); r(9, t + 9, 14, 1, C.alu);
      var ty = s.swing || 0;                                        // hands tapping the keyboard
      r(9, t + 8 + (ty > 0 ? -1 : 0), 2, 2, C.skin); r(21, t + 8 + (ty < 0 ? -1 : 0), 2, 2, C.skin);
    } else if (s.prop === 'controller') {
      r(11, t + 4, 10, 3, C.gadget); r(10, t + 5, 2, 3, C.gadget); r(20, t + 5, 2, 3, C.gadget);
      r(11, t + 4, 10, 1, C.gadgetHi); p(13, t + 5, '#9a9aa2'); p(12, t + 5, '#9a9aa2'); p(13, t + 6, '#9a9aa2');
      p(18, t + 5, '#e04848'); p(19, t + 6, '#48a0e0'); p(17, t + 6, '#58c060');
      r(10 + (s.swing > 0 ? 1 : 0), t + 4, 2, 2, C.skin); r(20 - (s.swing < 0 ? 1 : 0), t + 4, 2, 2, C.skin);
    } else if (s.prop === 'book') {
      r(9, t + 3, 14, 6, '#7a3c22'); r(10, t + 3, 5, 5, C.white); r(17, t + 3, 5, 5, C.white);
      r(15, t + 3, 2, 6, '#5a2a14');
      for (i = 0; i < 3; i++) { r(11, t + 4 + i * 1.5 | 0, 3, 1, C.whiteDk); r(18, t + 4 + i * 1.5 | 0, 3, 1, C.whiteDk); }
      r(9, t + 5, 2, 2, C.skin); r(21, t + 5, 2, 2, C.skin);
    } else if (s.prop === 'screwdriver') {
      var sh = s.swing || 0;
      r(25, t + 9, 3, 2, sh ? '#f2c230' : '#d6402c'); p(sh ? 26 : 25, t + 9, sh ? '#d6402c' : '#f2c230');
      r(28, t + 10, 4, 1, '#b8bcc4'); p(32, t + 10, '#e8eaee');
    } else if (s.prop === 'diploma') {
      r(2, t + 9, 7, 2, '#f4f0e0'); r(2, t + 10, 7, 1, '#d8d0b8'); r(5, t + 9, 1, 2, '#c0392b'); p(5, t + 11, '#c0392b');
    } else if (s.prop === 'trophy') {
      r(3, t - 15, 7, 4, C.gold); r(3, t - 15, 7, 1, C.goldHi); r(9, t - 14, 1, 3, C.goldSh);
      p(2, t - 14, C.gold); p(2, t - 13, C.goldSh); p(10, t - 14, C.gold); p(10, t - 13, C.goldSh);
      r(5, t - 11, 3, 1, C.goldSh); r(6, t - 10, 1, 1, C.gold); r(4, t - 9, 5, 1, C.goldSh);
      p(5, t - 14, C.goldHi);
    }

    // ---- head ----
    r(14, 18 + h, 4, 1, C.skinSh);
    r(10, 8 + h, 12, 8, C.skin);
    r(11, 16 + h, 10, 1, C.skin);
    r(12, 17 + h, 8, 1, C.skin);
    r(21, 9 + h, 1, 7, C.skinSh);
    r(10, 8 + h, 12, 1, C.skinSh);
    p(9, 11 + h, C.skin); p(9, 12 + h, C.skinSh); p(9, 13 + h, C.skin);
    p(22, 11 + h, C.skin); p(22, 12 + h, C.skinSh); p(22, 13 + h, C.skinSh);
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
    if (s.brows === 'angry') {
      p(12, 9 + h, C.hair); p(13, 10 + h, C.hair); p(14, 10 + h, C.hair);
      p(19, 9 + h, C.hair); p(18, 10 + h, C.hair); p(17, 10 + h, C.hair);
    } else if (s.brows === 'sad') {
      p(12, 10 + h, C.hairMid); p(13, 10 + h, C.hairMid); p(14, 9 + h, C.hairMid);
      p(17, 9 + h, C.hairMid); p(18, 10 + h, C.hairMid); p(19, 10 + h, C.hairMid);
    } else {
      r(12, 9 + h, 3, 1, C.hairMid); r(17, 9 + h, 3, 1, C.hairMid); p(12, 10 + h, C.skinSh); p(19, 10 + h, C.skinSh);
    }

    // eyes
    var eyes = s.eyes || 'open';
    if (s.shades) {
      r(11, 10 + h, 10, 1, C.lens);
      r(11, 11 + h, 4, 2, C.lens); r(17, 11 + h, 4, 2, C.lens);
      r(15, 11 + h, 2, 1, C.lens);
      p(12, 11 + h, C.lensHi); p(18, 11 + h, C.lensHi);
    } else if (eyes === 'happy') {
      [12, 17].forEach(function (ex) { p(ex, 12 + h, C.o); p(ex + 1, 11 + h, C.o); p(ex + 2, 12 + h, C.o); });
    } else if (eyes === 'closed') {
      r(12, 12 + h, 3, 1, C.o); r(17, 12 + h, 3, 1, C.o);
    } else if (eyes === 'squint') {            // > <  (laughing too hard)
      p(12, 10 + h, C.o); p(13, 11 + h, C.o); p(14, 11 + h, C.o); p(12, 12 + h, C.o);
      p(19, 10 + h, C.o); p(18, 11 + h, C.o); p(17, 11 + h, C.o); p(19, 12 + h, C.o);
    } else if (eyes === 'glare') {
      [12, 17].forEach(function (ex) { r(ex, 12 + h, 3, 1, C.eyeW); p(ex + 1, 12 + h, C.pupil); r(ex, 11 + h, 3, 1, C.skinSh); });
    } else if (eyes === 'sad') {
      [12, 17].forEach(function (ex) { r(ex, 11 + h, 3, 2, C.eyeW); r(ex + 1, 12 + h, 1, 1, C.pupil); p(ex === 12 ? 12 : 19, 11 + h, C.skinSh); });
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
    if (s.glasses && !s.shades) {             // round reading glasses
      [11, 16].forEach(function (gx) {
        r(gx, 10 + h, 5, 1, C.gadget); r(gx, 13 + h, 5, 1, C.gadget);
        r(gx, 11 + h, 1, 2, C.gadget); r(gx + 4, 11 + h, 1, 2, C.gadget);
      });
      p(10, 11 + h, C.gadget); p(21, 11 + h, C.gadget);
    }
    // nose
    p(16, 12 + h, C.skinSh); p(16, 13 + h, C.skinSh); p(15, 13 + h, C.skinHi);
    if (s.blush) { p(11, 13 + h, C.blush); p(12, 13 + h, C.blush); p(19, 13 + h, C.blush); p(20, 13 + h, C.blush); }
    if (s.flush) {
      r(10, 13 + h, 3, 2, C.flush); r(19, 13 + h, 3, 2, C.flush);
      p(19, 8 + h, C.flush); p(20, 9 + h, C.flush); p(20, 8 + h, '#a33a2a');
    }
    if (s.tears != null) {                    // tear streaks, a pixel longer every other frame
      var tl = 2 + (s.tears % 3);
      [12, 19].forEach(function (tx) {
        for (var k = 0; k < tl; k++) p(tx, 13 + h + k, k === tl - 1 ? C.tearHi : C.tear);
      });
    }
    // mouth
    var face = s.face || 'smile';
    if (face === 'open') { r(14, 14 + h, 4, 2, C.mouth); r(15, 15 + h, 2, 1, C.tongue); }
    else if (face === 'grin') { r(14, 14 + h, 4, 1, C.mouth); r(15, 15 + h, 2, 1, C.mouth); }
    else if (face === 'o') { r(15, 14 + h, 2, 2, C.mouth); }
    else if (face === 'flat') { r(15, 14 + h, 2, 1, C.mouth); }
    else if (face === 'laugh') {
      r(13, 14 + h, 6, 1, C.mouth); r(14, 14 + h, 4, 1, C.white);
      r(13, 15 + h, 6, 1, C.mouth); r(15, 15 + h, 2, 1, C.tongue); r(14, 16 + h, 4, 1, C.mouth);
    } else if (face === 'frown') { p(14, 15 + h, C.mouth); r(15, 14 + h, 2, 1, C.mouth); p(17, 15 + h, C.mouth); }
    else if (face === 'grit') {
      r(12, 14 + h, 8, 2, C.mouth); r(13, 14 + h, 6, 1, C.white); r(13, 15 + h, 6, 1, C.whiteSh);
      p(15, 14 + h, C.whiteDk); p(17, 14 + h, C.whiteDk); p(15, 15 + h, C.whiteDk); p(17, 15 + h, C.whiteDk);
    } else if (face === 'wail') { r(14, 14 + h, 4, 3, C.mouth); r(15, 16 + h, 2, 1, C.tongue); }
    else { p(14, 14 + h, C.mouth); r(15, 15 + h, 2, 1, C.mouth); p(17, 14 + h, C.mouth); }

    // ---- headwear ----
    if (s.hat === 'mortar') drawMortar(p, h, s.tassel || 0);
    else if (s.hat === 'iron' || s.hat === 'ironup') {   // armoured helmet, faceplate down or flipped up
      var R1 = '#b3202a', R2 = '#7d141b';
      r(10, h - 1, 12, 1, R1); r(9, h, 14, 8, R1); r(21, h + 1, 2, 7, R2);
      r(9, h + 8, 2, 7, R1); r(21, h + 8, 2, 7, R2); r(10, h + 15, 2, 2, R1); r(20, h + 15, 2, 2, R2);
      r(12, h, 3, 1, '#e0504a');
      if (s.hat === 'iron') {
        r(11, h + 4, 10, 13, C.gold); r(11, h + 4, 10, 1, C.goldHi); r(20, h + 5, 1, 12, C.goldSh);
        r(12, h + 11, 3, 1, '#e8fbff'); r(17, h + 11, 3, 1, '#e8fbff'); p(12, h + 10, C.goldSh); p(19, h + 10, C.goldSh);
        r(14, h + 15, 4, 1, C.goldSh); p(13, h + 14, C.goldSh); p(18, h + 14, C.goldSh);
        r(12, h + 16, 8, 1, R2);
      } else {
        r(11, h + 1, 10, 3, C.gold); r(11, h + 1, 10, 1, C.goldHi);       // faceplate, flipped up
      }
    }
    else if (s.hat === 'hard') {
      var Y = '#f2c230', Ys = '#c9971c', Yh = '#fff0a0';
      r(12, h - 2, 8, 1, Y); r(10, h - 1, 12, 1, Y); r(9, h, 14, 3, Y);
      r(15, h - 2, 2, 5, Yh); p(11, h - 1, Yh); p(10, h, Yh);
      r(22, h, 1, 3, Ys); r(7, h + 3, 18, 1, Ys); r(7, h + 3, 18, 1, Ys);
    } else if (s.hat === 'captain') {
      r(11, h - 2, 10, 1, C.white); r(10, h - 1, 12, 3, C.white); r(21, h - 1, 1, 3, C.whiteSh);
      r(9, h + 2, 14, 2, '#1f2547'); r(15, h + 2, 2, 1, C.gold); r(9, h + 4, 12, 1, '#111');
      p(14, h, C.gold); p(15, h - 1, C.gold); p(16, h, C.gold);
    } else if (s.hat === 'phones') {
      r(10, h - 2, 12, 1, C.gadget); p(9, h - 1, C.gadget); p(22, h - 1, C.gadget);
      r(8, h, 1, 8, C.gadget); r(23, h, 1, 8, C.gadget);
      r(6, h + 8, 4, 6, '#b23a3a'); r(22, h + 8, 4, 6, '#b23a3a');
      r(6, h + 8, 4, 1, '#e0675a'); r(22, h + 8, 4, 1, '#e0675a'); r(9, h + 9, 1, 4, C.gadget); r(22, h + 9, 1, 4, C.gadget);
    }

    // ---- props in front of the face ----
    if (s.prop === 'camera') {
      r(10, 9 + h, 12, 6, C.gadget); r(12, 8 + h, 5, 1, C.gadget); r(10, 9 + h, 12, 1, C.gadgetHi);
      r(13, 10 + h, 5, 5, '#55565e'); r(14, 11 + h, 3, 3, '#0a0a0c'); p(14, 11 + h, '#8ab4ff');
      r(19, 7 + h, 3, 2, s.flash ? '#fffbe6' : '#bdbdb6');
      if (s.flash) {
        p(20, 4 + h, '#fff6b8'); p(17, 5 + h, '#fff6b8'); p(23, 5 + h, '#fff6b8');
        p(24, 7 + h, '#fff6b8'); p(16, 7 + h, '#fff6b8'); p(20, 5 + h, '#fffbe6');
      }
      r(9, 12 + h, 2, 2, C.skin); r(21, 12 + h, 2, 2, C.skin);
    } else if (s.prop === 'binoc') {
      r(11, 10 + h, 4, 4, C.gadget); r(17, 10 + h, 4, 4, C.gadget); r(15, 11 + h, 2, 1, C.gadget);
      p(12, 10 + h, '#6a8ab0'); p(18, 10 + h, '#6a8ab0'); r(11, 13 + h, 4, 1, C.gadgetHi); r(17, 13 + h, 4, 1, C.gadgetHi);
      r(9, 12 + h, 2, 2, C.skin); r(21, 12 + h, 2, 2, C.skin);
    } else if (s.prop === 'phone') {
      r(22, 9 + h, 2, 5, '#111'); p(22, 10 + h, '#4a8ad0');
      r(21, 12 + h, 2, 2, C.skin);
    }
  }

  function drawCar(f, side) {                  // a red sports car, seen side-on
    var red = '#c41e2a', redSh = '#8c1219', redHi = '#ef5a5a', glass = '#9fc8e0';
    if (side) {                                                                // steering wheel, edge-on
      r(22, 25, 1, 5, '#1a1a1a'); p(23, 26, '#1a1a1a'); p(23, 28, '#1a1a1a'); line(23, 29, 25, 31, '#333');
    } else { r(13, 28, 6, 1, '#1a1a1a'); p(12, 29, '#1a1a1a'); p(19, 29, '#1a1a1a'); }
    r(-2, 30, 10, 1, red); r(25, 31, 9, 1, red);
    r(-3, 31, 38, 7, red); r(-2, 31, 36, 1, redHi); r(-3, 37, 38, 1, redSh);
    r(8, 31, 1, 6, redSh); r(23, 31, 1, 6, redSh);                              // door shut lines
    r(3, 33, 4, 2, '#2a0a0c'); r(30, 34, 4, 1, '#2a0a0c');                     // side intake, grille
    r(33, 32, 2, 1, '#fff3c4'); r(-3, 32, 2, 1, '#ff4040');                     // head / tail lights
    line(24, 30, 22, 25, glass); line(25, 30, 23, 25, '#cfe6f3');               // windscreen
    [[4, 39], [27, 39]].forEach(function (w) {
      for (var y = -5; y <= 5; y++) for (var x = -5; x <= 5; x++) {
        var d = Math.hypot(x, y);
        if (d <= 4.4) p(w[0] + x, w[1] + y, d > 2.6 ? '#151515' : d > 1.6 ? '#c0c4ca' : '#6a6e76');
      }
      var a = f * Math.PI / 3;
      p(w[0] + Math.round(Math.cos(a) * 2), w[1] + Math.round(Math.sin(a) * 2), '#2a2a2e');
      p(w[0] - Math.round(Math.cos(a) * 2), w[1] - Math.round(Math.sin(a) * 2), '#2a2a2e');
      p(w[0], w[1], '#e8e8e8');
    });
  }

  function arms(s, t, h, F) {
    var a = s.arms || 'down', swing = s.swing || 0, hand = F.hand || C.skin;
    var glow = s.repulsor ? '#e8fbff' : hand;
    if (s.prop === 'laptop' || s.prop === 'controller' || s.prop === 'screwdriver') swing = 0;
    var raiseL = a === 'wave' || a === 'up' || a === 'held';
    var raiseR = a === 'up' || a === 'held';
    if (a === 'iron') {                       // arms back, palms down: repulsors
      r(6, t + 1, 2, 7, F.jac); r(7, t + 1, 1, 7, F.jacSh); r(6, t + 8, 2, 1, F.cuff); r(5, t + 9, 2, 2, glow);
      r(24, t + 1, 2, 7, F.jac); r(25, t + 1, 1, 7, F.jacSh); r(24, t + 8, 2, 1, F.cuff); r(25, t + 9, 2, 2, glow);
      return;
    }
    // left arm
    if (a === 'cam') { r(7, t, 2, 4, F.jac); r(8, 14 + h, 2, 5, F.jac); p(8, t, F.jacSh); }
    else if (a === 'hold') { r(7, t + 1, 2, 5, F.jac); r(8, t + 5, 3, 2, F.jac); r(10, t + 5, 1, 2, F.cuff); }
    else if (raiseL) {
      var hx = a === 'wave' && s.waveTick ? 5 : 6;
      r(6, t - 5, 2, 6, F.jac); r(7, t - 5, 1, 6, F.jacSh); p(8, t, F.jac);
      r(6, t - 6, 2, 1, F.cuff);
      r(hx, t - 8, 2, 2, hand);
    } else {
      r(7, t + 1 + swing, 2, 7, F.jac); r(8, t + 1 + swing, 1, 7, F.jacSh);
      r(7, t + 8 + swing, 2, 1, F.cuff);
      r(7, t + 9 + swing, 2, 2, hand);
    }
    // right arm
    if (a === 'cam' || a === 'phone') { r(23, t, 2, 4, F.jac); r(22, 14 + h, 2, 5, F.jac); p(23, t, F.jacSh); }
    else if (a === 'hold') { r(23, t + 1, 2, 5, F.jac); r(21, t + 5, 3, 2, F.jac); r(21, t + 5, 1, 2, F.cuff); }
    else if (raiseR) {
      r(24, t - 5, 2, 6, F.jac); r(24, t - 5, 1, 6, F.jacSh); p(23, t, F.jac);
      r(24, t - 6, 2, 1, F.cuff);
      r(24, t - 8, 2, 2, hand);
    } else {
      r(23, t + 1 - swing, 2, 7, F.jac); r(24, t + 1 - swing, 1, 7, F.jacSh);
      r(23, t + 8 - swing, 2, 1, F.cuff);
      r(23, t + 9 - swing, 2, 2, hand);
    }
  }

  function leg(x0, fx_, lift, left, F) {
    // lift: negative = foot raised. The lower legs sit one pixel apart so the
    // auto-outline draws the split between the wide trousers.
    var lx = left ? x0 + fx_ - 1 : x0 + fx_ + 1;
    r(x0, 29, 6, 4, F.pant);
    r(lx, 33 + lift, 6, 6, F.pant);
    r(x0 + 2, 30, 1, 3, F.pantSh);
    r(lx + (left ? 1 : 4), 33 + lift, 1, 5, F.pantSh);
    r(lx, 38 + lift, 6, 1, F.pantSh);
    if (left) r(x0 + 5, 31, 1, 2, F.pantDk);
    r(lx, 39 + lift, 6, 2, F.shoe);
    r(lx, 40 + lift, 6, 1, F.shoeSh);
    p(lx + 2, 39 + lift, F.shoeSh); p(lx + 3, 39 + lift, F.shoeSh);
    r(lx, 41 + lift, 6, 1, F.sole);
  }

  function paint(ctx) {
    ctx.clearRect(0, 0, W, H);
    var i, x, y;
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

  /* the thrown cap is its own little canvas (21×9 px) */
  var HAT_W = 21, HAT_H = 9;
  function paintHat(ctx) {
    var g = [];
    for (var i = 0; i < HAT_W * HAT_H; i++) g.push(null);
    drawMortar(function (x, y, c) { x -= 6; y += 4; if (x >= 0 && x < HAT_W && y >= 0 && y < HAT_H) g[y * HAT_W + x] = c; }, 0, 0);
    ctx.clearRect(0, 0, HAT_W, HAT_H);
    for (var y = 0; y < HAT_H; y++) for (var x = 0; x < HAT_W; x++) {
      var k = y * HAT_W + x;
      if (g[k]) { ctx.fillStyle = g[k]; ctx.fillRect(x, y, 1, 1); }
      else if ((x > 0 && g[k - 1]) || (x < HAT_W - 1 && g[k + 1]) || (y > 0 && g[k - HAT_W]) || (y < HAT_H - 1 && g[k + HAT_W])) {
        ctx.fillStyle = C.o; ctx.fillRect(x, y, 1, 1);
      }
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

  /* ---------------- what he does in each part of the site ----------------
     outfit/hat/glasses/medal are worn while he's there; act is what he gets up to
     whenever he's standing still; still = he stays put instead of wandering off. */
  var ZONES = {
    education:      { outfit: 'gown', hat: 'mortar', act: 'grad', lines: ['Graduation day! 🎓', 'Cap and gown, ready to walk the stage 🎓', 'Look Mum, I graduated! 🎓'] },
    experience:     { act: 'code', intro: 'unpack', still: true, lines: ['Work mode: laptop out 💻', "Time to ship some code! 💻", 'Let me just fix this one bug… 🐛'] },
    projects:       { outfit: 'handy', hat: 'hard', act: 'fix', lines: ['Hard hat on — building mode! 🔧', 'Hand me that screwdriver 🪛', 'Under construction… 🚧'] },
    research:       { glasses: true, act: 'read', still: true, lines: ['Hmm, fascinating paper… 🤓', 'Peer review in progress 🧐'] },
    skills:         { outfit: 'iron', hat: 'ironup', act: 'iron', intro: 'ironfly', lines: ['Suit up! These skills are my superpowers 🦾', 'Armour on. Wheels up! 🚀'] },
    certifications: { act: 'cool', medal: true, lines: ['Yesss, his certificates! 😎', 'He worked hard for these 😎'] },
    achievements:   { act: 'trophy', lines: ['We won! 🏆', 'Trophy cabinet, coming through 🏆'] },
    volunteer:      { act: 'love', lines: ['Giving back feels good 💛'] },
    contact:        { act: 'phone', lines: ['Go on, give him a call! 📞', 'He replies fast, promise 📨'] },
    testimonials:   { act: 'touched', lines: ['Aww, people said such nice things 🥹', "I'm not crying, you're crying 🥲"] },
    // Hobbies page (base outfit: his black jacket + tee; he gets around by bicycle)
    'h-garage':     { act: 'drive', lines: ['Vroom vroom! 🏎️', 'Fasten your seatbelts 🏎️💨'] },
    'h-lens':       { act: 'photo', still: true, lines: ['Say cheese! 📸', 'Hold still, this is a good angle 📸'] },
    'h-arcade':     { act: 'game', still: true, lines: ['Just one more level 🎮', 'Boss fight! Do not disturb 🎮'] },
    'h-runway':     { act: 'spot', still: true, lines: ['Is that an A380?! ✈️', 'Plane spotted! ✈️'] },
    'h-marina':     { hat: 'captain', act: 'salute', lines: ['Aye aye, captain! ⚓', 'Permission to come aboard? 🛥️'] },
    music:          { hat: 'phones', act: 'music', lines: ["This one's a banger 🎧", 'Turn it up! 🎶'] }
  };
  var HOBBY_KEYS = { garage: 'h-garage', lens: 'h-lens', arcade: 'h-arcade', runway: 'h-runway', marina: 'h-marina' };

  /* places he can send visitors (used when he's annoyed, sad, or just nudging) */
  var DESTS = [
    { key: 'projects', t: 'Projects 🔧', id: 'projects', say: "Psst! Want to see what he's built? 🔧" },
    { key: 'hobbies', t: 'Hobbies 🚲', page: 'Hobbies.html', say: 'He has cool hobbies — cars, planes, superyachts! 🚲' },
    { key: 'card', t: 'Business card 💼', page: 'business-card/index.html', say: 'Grab his business card — it flips! 💼' },
    { key: 'experience', t: 'Experience 💻', id: 'experience', say: 'See where he has worked 💻' },
    { key: 'research', t: 'Research 🧪', id: 'research', say: 'He has published research papers! 🧪' },
    { key: 'certifications', t: 'Certificates 🏅', id: 'certifications', say: null }
  ];

  /* ---------------- pet ---------------- */
  // touch-first device (no hover): tap / hold gestures stand in for the mouse-hover zones
  var TOUCH = !!(window.matchMedia && matchMedia('(hover: none)').matches);
  var EMOTE_OK = ['idle', 'walk', 'happy', 'excited', 'wave', 'point', 'pat', 'laugh', 'surprised', 'cool'];
  var LOCKS = ['toss', 'unpack', 'held', 'fall', 'land', 'change', 'ironfly'];

  var Pet = {
    x: 40, y: 0, vy: 0, dir: 1,
    state: 'idle', stateT: 0, stateDur: 0,
    target: null, speed: 46,
    pointer: null, lastMove: Date.now(), lastPointerMove: 0,
    blinkAt: 0, nextThink: 0, cooldownNear: 0,
    bubbleOpen: false, frameKey: '',
    clickIdx: 0,
    zone: null, act: null, cos: { outfit: 'suit' },
    fxAt: 0, curBob: 0, tickleT: 0, angryCool: 0, lastSY: 0,

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
      [1200, 3500].forEach(function (ms) {
        setTimeout(function () {
          self.measureGround();
          if (MODE !== '404' && self.state !== 'held' && self.state !== 'fall') self.x = self.clampX(self.x);
        }, ms);
      });
      if (MODE === '404') { this.start404(); return; }

      // what he wears and does by default on this page
      this.baseCos = { outfit: PAGE === 'hobbies.html' ? 'casual' : 'suit' };
      this.baseAct = PAGE === 'hobbies.html' ? 'ride' : null;
      this.cos = Object.assign({}, this.baseCos); this.act = this.baseAct;
      if (PAGE === 'hobbies.html') store.set('seen:hobbies', '1');
      if (location.pathname.toLowerCase().indexOf('business-card') !== -1) store.set('seen:card', '1');
      this.zones = this.findZones();
      this.lastSY = window.scrollY;

      var greeted = store.get('greeted');
      setTimeout(function () {
        if (PAGE === 'certifications.html') {
          store.set('seen:certifications', '1');
          self.setState('cool', 3000);
          self.say("Welcome to Indrajit's trophy room! 😎", null, 3600);
        } else if (greeted) { self.say(self.pick(['Welcome back! 👋', 'Oh hey, you again! 😄']), null, 3200); }
        else {
          store.set('greeted', '1');
          self.setState('wave', 2600);
          self.say(TOUCH ? "Hi! I'm Alex 👋 Tap my head or tummy, hold me to chat, or drag me around."
                         : "Hi! I'm Alex 👋 Click me to chat, pat my head, or drag me around.", null, 5600);
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

      var hat = document.createElement('canvas');      // the graduation cap he throws
      hat.className = 'pet-hat'; hat.width = HAT_W; hat.height = HAT_H;
      hat.setAttribute('aria-hidden', 'true');
      paintHat(hat.getContext('2d'));
      document.body.appendChild(hat);

      this.el = el; this.cv = cv; this.ctx = cv.getContext('2d');
      this.shadow = shadow; this.bub = bub; this.hatEl = hat;
      this.w = W * this.scale; this.h = H * this.scale;
    },

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
    // empty rows above his hair (room for hats), so bubbles and the chat sit on his head
    headroom: function () { return (OY - 2) * this.scale; },
    safeArea: function () {
      if (!this._probe) {
        var d = document.createElement('div');
        d.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
          'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
        document.body.appendChild(d); this._probe = d;
      }
      var cs = getComputedStyle(this._probe);
      return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
    },
    measureGround: function () {
      var sa = this._safe = this.safeArea();
      var g = 14 + sa.b, nav = document.querySelector('.bottom-nav');
      if (nav && getComputedStyle(nav).display !== 'none') {
        var r = nav.getBoundingClientRect();
        if (r.height) g = Math.max(14 + sa.b, Math.round(window.innerHeight - r.top + 8));
      }
      this._ground = g;
      var m = 8 + sa.l, gb = document.getElementById('gesture-toggle');
      if (gb && getComputedStyle(gb).display !== 'none') {
        var gr = gb.getBoundingClientRect();
        var top = window.innerHeight - g - this.h;
        if (gr.width && gr.bottom > top && gr.top < window.innerHeight - g) m = Math.round(gr.right + 8);
      }
      this._minX = m;
    },
    ground: function () { return this._ground == null ? 14 : this._ground; },
    maxX: function () {
      return Math.max(16, window.innerWidth - this.w - 16 - ((this._safe && this._safe.r) || 0));
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
        self.hover = false; self.hoverPart = null;
        if (self.state === 'happy') self.setState('idle');
        if (self.state === 'pat') self.endPat();
      });

      var down = null;
      el.addEventListener('pointerdown', function (e) {
        down = { x: e.clientX, y: e.clientY, ox: e.clientX - self.x, dragging: false,
                 touch: e.pointerType !== 'mouse', part: self.partAt(e.clientY) };
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        if (down.touch && MODE !== '404') {
          var d0 = down;
          // press and hold: on the head he dozes off, anywhere else it opens the chat
          d0.timer = setTimeout(function () {
            if (down !== d0 || d0.dragging) return;
            d0.longFired = true;
            if (d0.part === 'head' && self.canEmote()) { self.setState('pat', 1e9); self.spawn('♥', 1); self.say('Mmm… zzz… 💤', null, 1800); }
            else self.poke();
          }, 520);
        }
      });
      el.addEventListener('pointermove', function (e) {
        if (!down && MODE !== '404' && e.pointerType === 'mouse') self.feel(e);
        if (!down || MODE === '404') return;
        if (!down.dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
          down.dragging = true;
          clearTimeout(down.timer);
          self.flight = null;
          self.capCatch(true);
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
        var d = down; down = null; clearTimeout(d.timer);
        if (d.dragging) { self.vy = 0; self.setState('fall', 1e9); }
        else if (MODE === '404') self.takeOff(true);
        else if (d.touch) {
          if (d.longFired) { if (self.state === 'pat') self.endPat(); }
          else self.tap(d.part);
        }
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
        self._vw = window.innerWidth; self._vh = window.innerHeight;
        self.applyScale();
        self.measureGround();
        if (MODE === '404') {
          if (self.state === 'walk') self.target = self.center();
          else if (self.state !== 'fly' && self.state !== 'gone') self.x = self.center();
        } else self.x = self.clampX(self.x);
      };
      self.onResize = onResize;
      self._vw = window.innerWidth; self._vh = window.innerHeight;
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
      if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

      setInterval(function () {
        var ov = PAGE === 'games.html' && document.getElementById('overlay');
        var away = !!(document.pointerLockElement || document.fullscreenElement ||
                      document.body.classList.contains('pet-away') ||
                      (ov && ov.classList.contains('active')));
        if (away === !!self.away) return;
        self.away = away;
        self.el.classList.toggle('is-away', away);
        if (away) { self.hideBubble(); self.capCatch(true); }
      }, 500);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { self.hiddenAt = Date.now(); return; }
        self.prev = null; requestAnimationFrame(self.loop);
        // gone a while? he missed you
        if (MODE !== '404' && self.hiddenAt && Date.now() - self.hiddenAt > 25000 && self.canEmote()) {
          self.setState('cry', 2600);
          self.say(self.pick(['You left me alone! 😭', 'Where did you go?! 😢']), null, 2400);
          self.queue = 'happy';
        }
      });

      if (MODE === '404') return;
      // heading for the tab bar / close button: he gets sad and suggests somewhere else
      document.addEventListener('mouseout', function (e) {
        if (e.relatedTarget || e.clientY > 8 || self.away || self.chatOpen) return;
        if (store.get('cried') || !self.canEmote()) return;
        store.set('cried', '1');
        self.setState('cry', 5200);
        self.spawn('💧', 2, 'is-tear', 0.72);
        var d = self.dests(2);
        var name = d[0] ? d[0].t.replace(/\s+\S+$/, '').toLowerCase() : 'projects';
        self.say("Leaving already? 😢 You haven't seen his " + name + ' yet…', self.destButtons(d), 7500);
      });
      this.watchChat();
    },

    minX: function () { return this._minX == null ? 8 : this._minX; },
    clampX: function (x) {
      var lo = this.minX(), hi = this.maxX();
      if (hi < lo) lo = 8;
      return Math.max(lo, Math.min(hi, x));
    },
    center: function () { return Math.round(window.innerWidth / 2 - this.w / 2); },
    isFree: function () { return ['idle', 'walk', 'sleep', 'happy'].indexOf(this.state) !== -1; },
    canEmote: function () { return EMOTE_OK.indexOf(this.state) !== -1; },

    setState: function (s, dur) {
      if (s !== 'laugh') this.tickleT = 0;
      this.state = s; this.stateT = 0;
      this.stateDur = dur || ({ excited: 1700, wave: 2200, cool: 2600, land: 500, surprised: 900, change: 520 }[s] || 0);
    },

    wake: function () {
      this.setState('surprised', 900);
      this.say(this.pick(["Huh? I wasn't sleeping!", 'Oh! You\'re back 😅']), null, 2200);
    },

    /* -------- stroking and tickling (mouse only) -------- */
    partAt: function (clientY) {
      var rc = this.cv.getBoundingClientRect();
      var row = (clientY - rc.top) / this.scale - OY - this.curBob;
      return row < 18.5 ? 'head' : row < 29 ? 'belly' : 'legs';
    },
    /* touchscreens: tap the head = a quick doze, tap the tummy = tickle, tap the feet = chat */
    tap: function (part) {
      if (part === 'head' && this.canEmote()) {
        this.target = null;
        this.setState('pat', 2600); this.queue = 'happy';
        this.spawn('♥', 1);
        this.say(this.pick(['Ooh, head pats… so sleepy… 😴', 'Mmm… zzz… 💤']), null, 2000);
      } else if (part === 'belly' && (this.canEmote() || this.state === 'angry')) {
        this.tickle(380);
        if (this.state === 'laugh') this.stateDur = this.stateT + 1500;
      } else this.poke();
    },
    feel: function (e) {
      var part = this.partAt(e.clientY);
      this.hoverPart = part;
      if (part === 'head') {
        if (this.state !== 'pat' && this.state !== 'angry' && this.canEmote()) {
          this.target = null;
          this.setState('pat', 1e9);
          this.spawn('♥', 1);
          if (!this.bubbleOpen) this.say(this.pick(['Ooh, head pats… so sleepy… 😴', 'Mmm… zzz… 💤', 'Keep going… *yawn* 😪']), null, 2200);
        }
        return;
      }
      if (this.state === 'pat') this.endPat();
      if (part === 'belly') this.tickle(Math.hypot(e.movementX || 0, e.movementY || 0));
    },
    endPat: function () {
      this.setState('surprised', 700);
      this.queue = 'happy';
      if (!this.bubbleOpen) this.say(this.pick(['*yawn* That was a lovely nap 😌', 'Huh — I dozed off! 😊']), null, 1800);
    },
    tickle: function (dist) {
      var now = performance.now();
      if (this.state === 'angry') {
        this.stateT = Math.min(this.stateT, 800);
        if (now > this.fxAt) { this.fxAt = now + 900; this.spawn('💢', 1, 'is-anger', 0.86); }
        return;
      }
      if (!this.canEmote()) return;
      if (now < this.angryCool) {
        this.setState('angry', 2400);
        this.spawn('💢', 1, 'is-anger', 0.86);
        this.say(this.pick(['Hey! I said stop! 😤', 'Not the belly again! 😠']), null, 1800);
        return;
      }
      if (this.state !== 'laugh') {
        this.target = null;
        this.setState('laugh', 900);
        if (!this.bubActions) this.say(this.pick(['Hahaha that tickles! 😆', 'Hehe — stop it! 🤭', 'Ahaha, my belly! 😂']), null, 1700);
      } else this.stateDur = this.stateT + 900;     // keep laughing while you keep tickling
      this.tickleT += dist;
      if (this.tickleT > 1100 || this.stateT > 3200) this.getAngry();
    },
    getAngry: function () {
      this.setState('angry', 5200);
      this.angryCool = performance.now() + 12000;
      this.spawn('💢', 2, 'is-anger', 0.86);
      this.say("Okay, ENOUGH tickling! 😤 Go bother something else —", this.destButtons(this.dests(3)), 8000);
    },

    /* -------- where to send people -------- */
    dests: function (n, unseenOnly) {
      var here = location.pathname.toLowerCase(), zone = this.zone, out = [], later = [];
      DESTS.forEach(function (d) {
        if (d.page && here.indexOf(d.page.replace('index.html', '').toLowerCase().replace(/\/$/, '')) !== -1) return;
        if (d.key === zone) return;
        if (d.key === 'certifications' && PAGE === 'certifications.html') return;
        (store.get('seen:' + d.key) ? later : out).push(d);
      });
      if (!unseenOnly) out = out.concat(later);
      return out.slice(0, n);
    },
    destButtons: function (list) {
      var self = this;
      return list.map(function (d, i) { return { t: d.t, primary: i === 0, fn: function () { self.go(d); } }; });
    },
    go: function (d) {
      this.hideBubble();
      if (d.page) { location.href = BASE + d.page; return; }
      if (d.key === 'certifications') { this.goCerts(); return; }
      if (!document.getElementById(d.id)) { location.href = BASE + 'index.html#' + d.id; return; }
      var a = document.createElement('a');
      a.href = '#' + d.id; a.style.display = 'none';
      document.body.appendChild(a); a.click(); a.remove();
      this.setState('excited', 1500);
    },

    /* -------- sections: outfit, props and the thing he does there -------- */
    findZones: function () {
      var out = [];
      if (PAGE === 'hobbies.html') {
        Array.prototype.forEach.call(document.querySelectorAll('section.hobby'), function (el) {
          var n = el.querySelector('.hobby-num'), m = n && n.textContent.match(/([A-Za-z]+)\s*$/);
          var k = m && HOBBY_KEYS[m[1].toLowerCase()];
          if (k) out.push({ key: k, el: el });
        });
      }
      Object.keys(ZONES).forEach(function (k) {
        if (k.indexOf('h-') === 0) return;
        var el = document.getElementById(k);
        if (el) out.push({ key: k, el: el });
      });
      return out;
    },
    checkZones: function () {
      if (!this.zones || !this.zones.length) return;
      var vh = window.innerHeight, mid = vh * 0.5, key = null, edu = null;
      var sy = window.scrollY, down = sy > this.lastSY + 1; this.lastSY = sy;
      for (var i = 0; i < this.zones.length; i++) {
        var z = this.zones[i], rc = z.el.getBoundingClientRect();
        if (z.key === 'education') edu = rc;
        if (!key && rc.top <= mid && rc.bottom >= mid) key = z.key;
      }
      // throw the cap just as the education section is about to scroll away
      if (edu) {
        if (this.zone === 'education' && !this.tossed && down && edu.bottom < vh * 0.64 && edu.bottom > vh * 0.2 && this.canEmote()) this.tossCap();
        if (edu.bottom > vh * 1.02) this.tossed = false;
      }
      if (key !== this.zone && LOCKS.indexOf(this.state) === -1) this.enterZone(key);
    },
    enterZone: function (key) {
      var prevAct = this.act, Z = key ? ZONES[key] : null, b = this.baseCos;
      var next = { outfit: (Z && Z.outfit) || b.outfit, hat: Z && Z.hat, glasses: Z && Z.glasses, medal: Z && Z.medal };
      var changed = next.outfit !== this.cos.outfit || next.hat !== this.cos.hat || !!next.glasses !== !!this.cos.glasses;
      this.zone = key;
      this.cos = next;
      this.act = (Z && Z.act) || this.baseAct;
      if (key) store.set('seen:' + key, '1');
      if (key === 'certifications') store.set('seen:certifications', '1');
      if (!this.canEmote() && this.state !== 'sleep') return;
      if (this.state === 'sleep') this.setState('idle');
      if (changed || prevAct === 'code' || this.act === 'code') {
        this.spawn('✺', 5, 'is-poof', 0.45);
        this.target = null;
        this.setState('change', 520);
        this.queue = Z && Z.intro && !reduced ? Z.intro : null;
      } else if (this.state === 'walk' && Z && Z.still) { this.target = null; this.setState('idle'); }
      if (key === 'certifications') { this.spawn('✦', 6); }
      if (Z && Z.lines && !this.bubbleOpen && !this.chatOpen) {
        var first = !store.get('z:' + key);
        if (first || Math.random() < 0.3) { store.set('z:' + key, '1'); this.say(this.pick(Z.lines), null, 3000); }
      }
    },
    tossCap: function () {
      this.tossed = true;
      this.target = null;
      this.setState('toss', 1e9);
      this.say(this.pick(['Hats off! 🎓🎉', "We did it! 🎓", 'Class dismissed! 🎓✨']), null, 2200);
      this.spawn('✦', 8, 'is-confetti', 0.8);
      if (reduced) { this.setState('excited', 1200); return; }
      var sc = this.scale;
      var left = this.dir > 0 ? this.x + (6 + OX) * sc : this.x + (W - 1 - (26 + OX)) * sc;
      var top = window.innerHeight - this.ground() - this.y - this.h + (this.curBob - 4 + OY) * sc;
      this.capOff = true;
      this.hat = { x: left, y: top, y0: top, vy: -Math.min(1250, window.innerHeight * 1.5), rot: 0, vr: (Math.random() < 0.5 ? -1 : 1) * 620 };
      var st = this.hatEl.style;
      st.width = HAT_W * sc + 'px'; st.height = HAT_H * sc + 'px'; st.display = 'block';
      st.transform = 'translate3d(' + left + 'px,' + top + 'px,0)' + (this.dir < 0 ? ' scaleX(-1)' : '');
    },
    capCatch: function (silent) {
      if (!this.capOff) return;
      this.hat = null; this.capOff = false;
      this.hatEl.style.display = 'none';
      if (this.state === 'toss') {
        this.setState('excited', 1300);
        if (!silent) { this.spawn('✦', 6, 'is-confetti', 0.8); this.say(this.pick(['Caught it! 🎓✨', 'And… caught! 😎']), null, 1800); }
      }
    },
    /* Iron Man suit: take off, loop around the screen, land back where he started.
       The route is in viewport fractions, so it fits any size or orientation. */
    startFlight: function () {
      if (reduced) { this.setState('cool', 2200); return; }
      this.target = null;
      this.flight = { x0: this.x, k: 0 };
      this.setState('ironfly', 1e9);
      this.nextFlight = performance.now() + 26000 + Math.random() * 14000;
      this.say(this.pick(['Suit up… and lift-off! 🚀', 'Repulsors online. Wheee! 🦾', 'Up, up and away! 🚀']), null, 2200);
    },
    flightAt: function (u) {
      var f = this.flight, lo = this.minX(), hi = this.maxX();
      var top = Math.max(60, window.innerHeight - this.ground() - this.h - 24 - ((this._safe && this._safe.t) || 0));
      var X = function (fr) { return lo + (hi - lo) * fr; };
      var pts = [[f.x0, 0], [f.x0, top * 0.22], [X(0.82), top * 0.62], [X(0.55), top * 0.95], [X(0.12), top * 0.66],
                 [X(0.35), top * 0.34], [f.x0, top * 0.2], [f.x0, 0]];
      var n = pts.length - 1, seg = Math.min(n - 1, Math.floor(u * n)), q = u * n - seg;
      var P0 = pts[Math.max(0, seg - 1)], P1 = pts[seg], P2 = pts[seg + 1], P3 = pts[Math.min(n, seg + 2)];
      var cr = function (a, b, c, d) { return 0.5 * (2 * b + (-a + c) * q + (2 * a - 5 * b + 4 * c - d) * q * q + (-a + 3 * b - 3 * c + d) * q * q * q); };
      return [cr(P0[0], P1[0], P2[0], P3[0]), Math.max(0, cr(P0[1], P1[1], P2[1], P3[1]))];
    },

    flashScreen: function () {
      if (reduced) return;
      var f = document.createElement('div');
      f.className = 'pet-flash';
      f.style.setProperty('--fx', Math.round(this.x + this.w / 2) + 'px');
      f.style.setProperty('--fy', Math.round(window.innerHeight - this.ground() - this.y - this.h * 0.68) + 'px');
      document.body.appendChild(f);
      setTimeout(f.remove.bind(f), 420);
    },

    /* -------- click: open (or close) the Alex AI chat -------- */
    poke: function () {
      var wasOpen = this.chatOpen;
      this.setState('excited', 1300);
      this.spawn('✦', 4);
      this.openAI();
      if (!wasOpen) this.say(this.pick(['Ask me anything! 💬', "Let's chat! ✨", "I know all of Indrajit's secrets 🤫"]), null, 2400);
    },

    chatter: function () {
      var self = this;
      var lines = [
        function () { self.say('Alex, at your service! 🤵', null, 3000); },
        function () { self.say('Psst — pat my head… but please don’t tickle my belly 🙈', null, 3400); },
        function () { self.say('Psst — try dragging me up and letting go 😄', null, 3000); },
        function () { var d = self.dests(1)[0]; if (d && d.say) self.say(d.say, self.destButtons([d]), 5000); else self.say('Suited up and ready for work 👔', null, 3000); }
      ];
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

    nudgeTo: function (d) {
      if (d.key === 'certifications') { this.remindCerts(false); return; }
      var self = this;
      this.setState('point', 3200);
      this.say(d.say, [
        { t: 'Show me', primary: true, fn: function () { self.go(d); } },
        { t: 'Later', fn: function () { self.hideBubble(); } }
      ], 9000);
    },

    suggestAI: function () {
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
        if (!self.chatOpen) self.placeChat(true);
        fab.click();
      });
      if (!this.chatOpen) this.setState('happy', 1500);
    },

    placeChat: function (force) {
      var panel = document.querySelector('.alex-panel');
      if (!panel) return;
      var key = Math.round(this.x) + ',' + Math.round(this.y) + ',' + window.innerWidth + 'x' + window.innerHeight;
      if (!force && key === this._chatKey) return;
      this._chatKey = key;

      var vw = window.innerWidth, vh = window.innerHeight, st = panel.style;
      var cx = this.x + this.w / 2;
      var petTop = this.ground() + this.y + this.h - this.headroom();
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
        ox = cx - left; oy = h;
      } else {
        h = want;
        bottom = 12;
        var right = this.x + this.w + 12;
        left = right + pw <= vw - 12 ? right : Math.max(12, this.x - pw - 12);
        ox = left > this.x ? 0 : pw;
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
      this.speed = Math.max(90, window.innerWidth / 9);
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

    /* reminders: every ~70 s, point at a part of the site they haven't seen yet
       (projects, hobbies, the business card, research, certificates…) or the AI chat */
    scheduleNudges: function () {
      var self = this, count = 0;
      var tick = function () {
        if (count >= 5) return;
        if (self.bubbleOpen || self.chatOpen || self.away || document.hidden || !self.isFree()) {
          setTimeout(tick, 8000); return;
        }
        var d = self.dests(1, true)[0], usedAI = store.get('ai');
        if (!d && usedAI) return;
        if (d && (usedAI || count % 3 !== 2)) self.nudgeTo(d); else self.suggestAI();
        count++;
        setTimeout(tick, 70000);
      };
      setTimeout(tick, 22000);
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
      if (this.away) return;
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
      this.bubActions = !!(actions && actions.length);
      clearTimeout(this.bubTimer);
      this.bubTimer = setTimeout(function () { self.hideBubble(); }, ms || 3500);
      this.placeBubble();
    },
    hideBubble: function () {
      this.bub.classList.remove('is-open');
      this.bubbleOpen = false;
      this.bubActions = false;
      clearTimeout(this.bubTimer);
    },
    placeBubble: function () {
      if (!this.bubbleOpen) return;
      var bw = this.bub.offsetWidth;
      var cx = this.x + this.w / 2;
      var left = Math.max(10, Math.min(window.innerWidth - bw - 10, cx - bw / 2));
      this.bub.style.left = left + 'px';
      this.bub.style.bottom = (this.ground() + this.y + this.h - this.headroom() + 6) + 'px';
      this.bub.style.setProperty('--tail', Math.max(14, Math.min(bw - 14, cx - left)) + 'px');
    },

    /* -------- particles -------- */
    spawn: function (ch, n, cls, yFrac) {
      if (reduced) return;
      var colors = ['#e2b23a', '#e0566b', '#4aa3df', '#5cc27a', '#c0a377'];
      for (var i = 0; i < n; i++) {
        var s = document.createElement('span');
        s.className = 'pet-fx' + (cls ? ' ' + cls : ch === '♥' ? ' is-heart' : ch === 'z' ? ' is-z' : '');
        s.textContent = ch;
        var fx = cls === 'is-smoke' ? (Math.random() < 0.5 ? 0.17 : 0.83)
          : cls === 'is-thrust' ? (Math.random() < 0.5 ? 0.37 : 0.63)          // under each boot
          : cls === 'is-exhaust' ? (this.dir > 0 ? 0.03 : 0.97)                 // out of the car's tail
          : 0.25 + Math.random() * 0.5;
        s.style.left = (this.x + this.w * fx) + 'px';
        s.style.bottom = (this.ground() + this.y + this.h * (yFrac != null ? yFrac + Math.random() * 0.05 : 0.6 + Math.random() * 0.3)) + 'px';
        s.style.setProperty('--dx', (Math.random() * (cls === 'is-confetti' ? 120 : 40) - (cls === 'is-confetti' ? 60 : 20)).toFixed(0) + 'px');
        if (cls === 'is-confetti') s.style.color = colors[i % colors.length];
        s.style.animationDelay = (i * (cls === 'is-confetti' ? 0.04 : 0.12)) + 's';
        document.body.appendChild(s);
        setTimeout(s.remove.bind(s), 2200 + i * 120);
      }
    },
    // a particle every `ms`, for the looping activities
    every: function (now, ms, ch, cls, yFrac) {
      if (now < this.fxAt) return;
      this.fxAt = now + ms * (0.75 + Math.random() * 0.5);
      this.spawn(ch, 1, cls, yFrac);
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
      var Z = this.zone && ZONES[this.zone];
      if (Z && Z.still) return;                                  // busy: coding, reading, gaming…
      var roll = Math.random();
      var ptr = this.pointer;
      if (ptr && roll < 0.35 && now - this.lastPointerMove < 4000) {
        this.target = this.clampX(ptr.x - this.w / 2);
      } else if (roll < (this.act && this.act !== 'ride' ? 0.55 : 0.8)) {
        this.target = this.clampX(Math.random() * this.maxX());
      } else {
        if (!this.act) this.setState(Math.random() < 0.5 ? 'wave' : 'excited');
        if (!GAME_PAGE && !this.bubbleOpen && Math.random() < 0.5) this.chatter();
        return;
      }
      if (Math.abs(this.target - this.x) > 20) this.setState('walk', 1e9);
    },
    vehicle: function () {
      if (PAGE !== 'hobbies.html') return null;
      if (this.zone === 'h-garage') return 'car';
      return (!this.zone || !ZONES[this.zone] || !ZONES[this.zone].still) ? 'bike' : null;
    },

    /* what he does while standing still in the current section */
    actPose: function (spec, now) {
      var f2 = Math.floor(now / 180) % 2;
      switch (this.act) {
        case 'grad':
          spec.prop = 'diploma'; spec.face = 'grin'; spec.tassel = Math.floor(now / 520) % 2;
          spec.bob = Math.floor(now / 620) % 2 ? -1 : 0;
          break;
        case 'code':
          spec.seat = 'cross'; spec.bob = 8; spec.prop = 'laptop'; spec.look = { x: 0, y: 1 };
          spec.swing = Math.floor(now / 130) % 3 - 1; spec.glow = Math.floor(now / 700) % 2;
          spec.face = Math.floor(now / 3200) % 4 === 3 ? 'grin' : 'flat';
          this.every(now, 1100, this.pick(['</>', '{ }', ';', '01', '=>', '( )']), 'is-code', 0.5);
          break;
        case 'fix':
          spec.prop = 'screwdriver'; spec.swing = f2; spec.face = Math.floor(now / 2600) % 3 === 2 ? 'grin' : 'flat';
          spec.look = { x: 1, y: 1 };
          this.every(now, 900, this.pick(['⚙', '✦', '·']), 'is-spark', 0.3);
          break;
        case 'read':
          spec.prop = 'book'; spec.arms = 'hold'; spec.look = { x: 0, y: 1 }; spec.face = 'flat';
          if (Math.floor(now / 4500) % 3 === 2) { spec.face = 'o'; spec.look = { x: 0, y: -1 }; this.every(now, 4000, '💡', 'is-idea', 0.95); }
          break;
        case 'flex':
          spec.arms = Math.floor(now / 800) % 2 ? 'up' : 'down'; spec.face = 'grin';
          this.every(now, 1400, '⚡', 'is-spark', 0.7);
          break;
        case 'cool':
          spec.shades = true; spec.face = 'grin'; spec.bob = Math.floor(now / 620) % 2 ? -1 : 0;
          break;
        case 'trophy':
          spec.arms = 'wave'; spec.waveTick = 0; spec.prop = 'trophy'; spec.face = 'open'; spec.eyes = 'happy';
          spec.bob = Math.floor(now / 400) % 2 ? -1 : 0;
          this.every(now, 1000, '✦', null, 1.0);
          break;
        case 'love':
          spec.face = 'grin'; spec.eyes = 'happy'; spec.blush = true; spec.bob = Math.floor(now / 500) % 2 ? -1 : 0;
          this.every(now, 1300, '♥', 'is-heart', 0.75);
          break;
        case 'phone':
          spec.arms = 'phone'; spec.prop = 'phone'; spec.look = { x: 1, y: 0 };
          spec.face = Math.floor(now / 260) % 3 ? 'o' : 'smile';
          if (Math.floor(now / 2400) % 2) spec.face = 'grin';
          break;
        case 'touched':
          spec.tears = Math.floor(now / 260); spec.eyes = 'happy'; spec.face = 'smile'; spec.blush = true; spec.brows = 'sad';
          spec.bob = Math.floor(now / 700) % 2;
          break;
        case 'photo':
          spec.arms = 'cam'; spec.prop = 'camera';
          if (!this.shotAt || now > this.shotAt) {
            this.shotAt = now + 1500 + Math.random() * 2400;
            var flash = Math.random() < 0.45;
            this.spawn(flash ? '⚡' : 'click', 1, 'is-click', 0.95);
            if (flash) { this.flashUntil = now + 150; this.flashScreen(); }
          }
          spec.flash = now < (this.flashUntil || 0);
          spec.bob = now < (this.flashUntil || 0) + 120 ? 1 : 0;
          break;
        case 'game':
          spec.arms = 'hold'; spec.prop = 'controller'; spec.swing = Math.floor(now / 110) % 3 - 1; spec.look = { x: 0, y: 1 };
          spec.face = Math.floor(now / 1800) % 3 === 0 ? 'o' : 'flat';
          if (Math.floor(now / 5400) % 4 === 3) { spec.face = 'open'; spec.eyes = 'happy'; this.every(now, 600, '★', 'is-spark', 0.8); }
          break;
        case 'spot':
          spec.arms = 'cam'; spec.prop = 'binoc'; spec.bob = Math.floor(now / 900) % 2 ? -1 : 0;
          this.every(now, 2600, '✈', 'is-plane', 1.05);
          break;
        case 'salute':
          spec.arms = 'wave'; spec.waveTick = Math.floor(now / 1600) % 2; spec.face = 'grin';
          break;
        case 'music':
          var playing = (function () { var a = document.getElementById('mpAudio'); return !!(a && !a.paused); })();
          var beat = Math.floor(now / (playing ? 260 : 420)) % 2;
          spec.eyes = 'happy'; spec.face = playing ? 'open' : 'grin'; spec.bob = beat ? -1 : 0;
          spec.legs = beat ? [0, -1, 0, 0] : [0, 0, 0, -1];
          if (playing) spec.arms = Math.floor(now / 520) % 2 ? 'up' : 'wave';
          this.every(now, playing ? 500 : 1000, this.pick(['♪', '♫']), 'is-note', 0.85);
          break;
        case 'ride':
          spec.bike = 2; spec.side = true;                        // parked: pedals level
          break;
        case 'drive':                                          // parked, engine idling
          spec.car = 0; spec.side = true; spec.bob = 4 + (Math.floor(now / 110) % 2); spec.face = 'grin';
          break;
        case 'iron':                                           // armour on, faceplate up; takes off now and then
          spec.glow = Math.floor(now / 500) % 2; spec.face = 'grin';
          if (!this.nextFlight) this.nextFlight = now + 22000;
          if (now > this.nextFlight && !this.chatOpen) this.startFlight();
          break;
      }
    },

    loop: function (now) {
      if (document.hidden) return;
      if (this.onResize && (window.innerWidth !== this._vw || window.innerHeight !== this._vh)) this.onResize();
      var dt = this.prev ? Math.min(0.05, (now - this.prev) / 1000) : 0.016;
      this.prev = now;
      this.stateT += dt * 1000;

      if (MODE !== '404' && (!this.zoneAt || now > this.zoneAt)) { this.zoneAt = now + 220; this.checkZones(); }

      var s = this.state;
      if (s === 'land' && this.stateT > this.stateDur) {
        this.setState('happy', 1400);
        this.spawn('♥', 2);
        if (this.landLine) { this.say(this.landLine, null, 2200); this.landLine = null; }
        else this.say(this.pick(['Nailed the landing! 🙌', 'Again! Again!', 'Ta-da! ✨']), null, 2000);
        s = this.state;
      }
      if (this.stateDur && this.stateT > this.stateDur && ['walk', 'held', 'fall', 'sleep'].indexOf(s) === -1) {
        if (this.queue) {
          var q = this.queue; this.queue = null;
          if (q === 'ironfly') this.startFlight();
          else this.setState(q, q === 'unpack' ? 2600 : q === 'happy' ? 1600 : 0);
        }
        else this.setState(s === 'happy' && this.hover ? 'happy' : 'idle', s === 'happy' && this.hover ? 1e9 : 0);
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
      var look = { x: 0, y: 0 };
      var veh = MODE !== '404' ? this.vehicle() : null, bike = veh === 'bike';
      if (s === 'walk') {
        if (this.target == null) this.target = this.x;
        var d = this.target - this.x;
        this.dir = d >= 0 ? 1 : -1;
        var step = this.speed * (this.chatOpen ? 2 : 1) * (veh === 'car' ? 3.4 : bike ? 2.3 : 1) * dt;
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
      } else if (s === 'ironfly') {
        var fl = this.flight;
        if (!fl) { this.setState('fall', 1e9); this.vy = 0; }
        else {
          fl.k = Math.min(1, fl.k + dt / 8);                    // ~8 s round trip
          var u = fl.k < 0.06 ? 0 : (fl.k - 0.06) / 0.94;         // hover a moment while the thrusters spool up
          var pos = this.flightAt(u * u * (3 - 2 * u) * 0.15 + u * 0.85);
          var vx = pos[0] - this.x;
          if (Math.abs(vx) > 0.4) this.dir = vx > 0 ? 1 : -1;
          this.x = pos[0]; this.y = fl.k < 0.06 ? fl.k / 0.06 * 6 : pos[1];
          if (!this.smokeAt || now > this.smokeAt) { this.smokeAt = now + 45; this.spawn('●', 1, 'is-thrust', 0.03); }
          if (fl.k >= 1) {
            this.x = this.clampX(fl.x0); this.y = 0; this.flight = null;
            this.landLine = this.pick(['Touchdown — right where I took off 🎯', 'Stuck the landing 🦾', 'Back on my mark ✨']);
            this.setState('land', 450);
          }
        }
      } else if (s !== 'held') {
        if (s === 'excited' && !reduced) this.y = Math.abs(Math.sin(this.stateT / 160)) * 16;
        else if (s === 'cool' && !reduced) this.y = Math.max(0, Math.sin(this.stateT / 220)) * 8;
        else this.y = Math.max(0, this.y - 400 * dt);
      }

      // the thrown graduation cap
      if (this.hat) {
        var hp = this.hat;
        hp.vy += 1500 * dt; hp.y += hp.vy * dt; hp.rot += hp.vr * dt;
        if (hp.vy > 0 && hp.y >= hp.y0) this.capCatch(false);
        else this.hatEl.style.transform = 'translate3d(' + hp.x.toFixed(1) + 'px,' + hp.y.toFixed(1) + 'px,0) rotate(' + hp.rot.toFixed(0) + 'deg)' + (this.dir < 0 ? ' scaleX(-1)' : '');
      }

      // eyes follow the cursor
      if (ptr) {
        var hx = this.x + this.w / 2, hy = window.innerHeight - this.ground() - this.y - this.h * 0.72;
        var ddx = ptr.x - hx, ddy = ptr.y - hy;
        look.x = Math.abs(ddx) < 28 ? 0 : (ddx > 0 ? 1 : -1);
        look.y = Math.abs(ddy) < 60 ? 0 : (ddy > 0 ? 1 : -1);
        if (this.dir < 0) look.x = -look.x;
      }

      // pose by state
      var t = this.stateT, frame;
      var spec = { look: look, arms: 'down', face: 'smile', eyes: 'open', bob: 0, legs: [0, 0, 0, 0] };
      var blinking = false, shake = 0;
      if (now > this.blinkAt) { blinking = true; if (now > this.blinkAt + 130) this.blinkAt = now + 2200 + Math.random() * 3200; }

      switch (s) {
        case 'walk':
          if (veh === 'car') {                                   // driving along the bottom of the Hobbies page
            spec.car = Math.floor(now / 70) % 6; spec.bob = 4; spec.side = true; spec.face = 'grin';
            if (!this.smokeAt || now > this.smokeAt) { this.smokeAt = now + 160; this.spawn('●', 1, 'is-exhaust', 0.1); }
            break;
          }
          if (bike) {                                          // pedalling along on the Hobbies page
            frame = Math.floor(now / 75) % 8;                   // crank turns a full circle every 8 frames
            spec.bike = frame; spec.side = true; spec.face = 'grin';
            spec.bob = frame % 4 === 1 ? 1 : 0;
            break;
          }
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
        // ---- emotions ----
        case 'pat':                                            // head pats send him to sleep
          spec.eyes = 'closed'; spec.face = 'smile'; spec.blush = true;
          spec.bob = Math.floor(now / 1100) % 2;
          if (!this.zAt || now > this.zAt) { this.zAt = now + 1200; this.spawn('z', 1); }
          break;
        case 'laugh':
          spec.eyes = 'squint'; spec.face = 'laugh'; spec.blush = true;
          spec.bob = Math.floor(now / 90) % 2 ? -1 : 0;
          spec.swing = Math.floor(now / 90) % 2 ? 1 : -1;
          shake = Math.floor(now / 70) % 2 ? 1 : -1;
          this.every(now, 300, this.pick(['ha', 'ha!', 'hee']), 'is-ha', 0.78);
          break;
        case 'angry':
          spec.brows = 'angry'; spec.eyes = 'glare'; spec.face = 'grit'; spec.flush = true;
          frame = Math.floor(now / 240) % 2;
          spec.legs = frame ? [0, -1, 0, 0] : [0, 0, 0, -1];
          shake = t < 900 ? (Math.floor(now / 50) % 2 ? 1 : -1) : 0;
          this.every(now, 1100, '💢', 'is-anger', 0.86);
          break;
        case 'cry':
          spec.brows = 'sad'; spec.eyes = Math.floor(now / 1400) % 3 === 2 ? 'sad' : 'closed'; spec.face = 'wail';
          spec.tears = Math.floor(now / 220); spec.bob = Math.floor(now / 300) % 2;
          this.every(now, 650, '💧', 'is-tear', 0.7);
          break;
        case 'toss':
          spec.arms = 'up'; spec.face = 'open'; spec.eyes = 'happy'; spec.look = { x: 0, y: -1 };
          spec.legs = Math.floor(now / 200) % 2 ? [0, -1, 0, -1] : [0, 0, 0, 0];
          break;
        case 'unpack':                                         // backpack round to the front, laptop out, sit
          if (t < 800) { spec.prop = 'bagfront'; spec.arms = 'hold'; spec.face = 'grin'; spec.look = { x: 0, y: 1 }; }
          else if (t < 1700) { spec.prop = 'pulling'; spec.arms = 'held'; spec.face = 'open'; spec.eyes = 'happy'; }
          else { spec.seat = 'cross'; spec.bob = 8; spec.prop = 'laptop'; spec.face = 'grin'; }
          break;
        case 'change':
          spec.face = 'grin'; spec.eyes = 'closed';
          break;
        case 'ironfly':
          spec.hat = 'iron'; spec.arms = 'iron'; spec.repulsor = true; spec.thrust = true;
          spec.flick = Math.floor(now / 60) % 2; spec.glow = spec.flick;
          break;
        default: // idle
          spec.bob = reduced ? 0 : (Math.floor(now / 620) % 2 ? -1 : 0);
          if (near) spec.face = 'grin';
          if (this.act && MODE !== '404') this.actPose(spec, now);
          else if (this.zone === 'experience' || this.queue === 'unpack') spec.prop = 'bagback';
      }
      if (blinking && spec.eyes === 'open' && !spec.shades && spec.prop !== 'camera' && spec.prop !== 'binoc') spec.eyes = 'closed';
      if (this.jet && MODE === '404') spec.jetpack = true;
      if (MODE !== '404' && s !== 'fly' && s !== 'jetprep') {
        var cs = this.cos;
        spec.outfit = cs.outfit;
        if (cs.hat && !spec.hat && !(this.capOff && cs.hat === 'mortar')) spec.hat = cs.hat;
        if (veh === 'car' && spec.car == null && ['held', 'fall', 'land', 'excited'].indexOf(s) === -1) { spec.car = 0; spec.bob = 4 + (spec.bob > 0 ? 1 : 0); spec.side = true; }
        if (spec.car != null) { spec.seat = 'car'; if (spec.arms === 'down') spec.arms = 'hold'; }
        if (cs.glasses) spec.glasses = true;
        if (cs.medal) spec.medal = true;
        if (spec.hat === 'phones' && spec.prop === 'camera') spec.hat = null;
        if (this.zone === 'experience' && s === 'walk') spec.prop = 'bagback';
      }
      this.curBob = spec.bob || 0;

      var key = JSON.stringify(spec) + this.dir;
      if (key !== this.frameKey) {
        this.frameKey = key;
        compose(spec);
        paint(this.ctx);
      }

      var squash = s === 'land' ? ' scale(1.08, 0.9)' : s === 'change' ? ' scale(' + (1 + Math.sin(t / 40) * 0.08).toFixed(3) + ', ' + (1 - Math.sin(t / 40) * 0.06).toFixed(3) + ')' : '';
      if (s === 'jetprep' && t > 500) squash += ' translateX(' + (Math.floor(now / 45) % 2 ? 1 : -1) + 'px)';
      if (shake && !reduced) squash += ' translateX(' + shake + 'px)';
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
  Pet._size = { W: W, H: H };
  window.__pixelPet = Pet;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { Pet.init(); });
  else Pet.init();
})();
