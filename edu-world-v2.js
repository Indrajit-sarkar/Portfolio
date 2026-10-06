/* ============================================================
   EDUCATION WORLD v2 — Three.js scroll-driven 3D journey
   Each stop is modelled on the real campus from the photos the cards use:
   Allwin Public School, UAS and VC PU College, Indian Academy Degree College
   and Atria Institute of Technology, along a Bengaluru street with palms,
   gulmohar and jacaranda trees, auto-rickshaws, birds, people and fireflies.
   ============================================================ */
import * as THREE from 'three';

const canvas = document.getElementById('ewCanvas');
const rail   = document.getElementById('ewRail');
const stage  = document.getElementById('ewStage');
const cardWrap = document.getElementById('ewCards');
const fill   = document.getElementById('ewFill');
const stopLbl = document.getElementById('ewStop');
if (!canvas || !rail) throw new Error('edu world: mount missing');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();

/* ===== STOPS ===== */
const STOPS = [
    { at: 0,   yr: 'Passout 2018 · School Captain', name: 'Allwin Public School',
      deg: 'Schooling', place: 'Ganganagar, Bengaluru', tag: 'Where it started',
      desc: 'Nursery, primary & high school · School Captain', accent: 0x8b5cf6 },
    { at: 62,  yr: '2018 — 2020', name: 'UAS and VC PU College',
      deg: 'Pre-University · CEBA', place: 'Bengaluru', tag: 'Commerce & basics',
      desc: 'Commerce, Economics, Business Studies & Accountancy', accent: 0xff8a3d },
    { at: 124, yr: 'Aug 2020 — Nov 2023', name: 'Indian Academy Degree College (Autonomous)',
      deg: 'Bachelor of Computer Applications', place: 'Bengaluru', tag: 'First real code',
      desc: 'BCA · Foundation in programming, databases & software engineering', accent: 0x34d399 },
    { at: 186, yr: 'Feb 2024 — Nov 2025', name: 'Atria Institute of Technology',
      deg: 'Master of Computer Applications', place: 'Bengaluru', tag: 'Azure & AI',
      desc: 'MCA · Completed 2025 · Azure AI, cloud & advanced computing', accent: 0x5b8cff }
];
const ROAD_END = STOPS[STOPS.length - 1].at + 26;

/* ===== CARDS ===== */
const cards = STOPS.map((s) => {
    const el = document.createElement('article');
    el.className = 'ew-card';
    el.innerHTML =
        `<p class="ew-yr">${s.yr}</p>` +
        `<h3>${s.deg}</h3>` +
        `<p>${s.name}<br>${s.place}</p>` +
        (s.desc ? `<p class="ew-desc">${s.desc}</p>` : '') +
        `<span class="ew-tag">${s.tag}</span>`;
    cardWrap.appendChild(el);
    return el;
});

/* ===== SCENE SETUP ===== */
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(50, 1, 0.5, 600);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

/* ===== PALETTE ===== */
const PALETTE = {
    day: {
        sky: 0xbfe0f0, skyTop: 0x6bb3d9, ground: 0x7fb06a, ground2: 0x6aa25b,
        fog: 0xcfe6f0, hemi: 0xffffff, hemiG: 0x8fb47a, sun: 0xfff3d6,
        sunI: 1.8, ambI: 0.6, roof: 0xc4553f, road: 0x9a8d78, sidewalk: 0xd4cbb8,
        water: 0x5588aa, flower1: 0xff6b8a, flower2: 0xffdd44, flower3: 0xcc88ff
    },
    night: {
        sky: 0x0a0e1a, skyTop: 0x060810, ground: 0x1a2840, ground2: 0x162236,
        fog: 0x0c1020, hemi: 0x8fa8ff, hemiG: 0x1b2440, sun: 0xaebeff,
        sunI: 0.35, ambI: 0.18, roof: 0x7a3b34, road: 0x4a4538, sidewalk: 0x3a3832,
        water: 0x1a2a44, flower1: 0x553040, flower2: 0x554420, flower3: 0x443060
    }
};
let P = PALETTE.day;

/* ===== LIGHTS ===== */
const hemi = new THREE.HemisphereLight(P.hemi, P.hemiG, P.ambI);
scene.add(hemi);

const sun = new THREE.DirectionalLight(P.sun, P.sunI);
sun.position.set(-40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.001;
scene.add(sun.target);
scene.add(sun);

const lamp = new THREE.PointLight(0xffd9a0, 0, 46, 2);
lamp.position.set(0, 9, 0);
scene.add(lamp);

// Rim light for drama
const rim = new THREE.DirectionalLight(0xffe8cc, 0.3);
rim.position.set(30, 20, -20);
scene.add(rim);

/* ===== HELPER ===== */
const mat = (c, flat = true) => new THREE.MeshLambertMaterial({ color: c, flatShading: flat });
const phong = (c, spec = 0x222222, shin = 10) => new THREE.MeshPhongMaterial({ color: c, specular: spec, shininess: shin, flatShading: true });

// seeded random
let _seed = 42;
function srand() { _seed = (_seed * 16807) % 2147483647; return (_seed - 1) / 2147483646; }

/* ===== GROUND ===== */
const groundMat = mat(P.ground);
const gGeo = new THREE.PlaneGeometry(ROAD_END + 140, 180, Math.round((ROAD_END + 140) / 4), 36);
gGeo.rotateX(-Math.PI / 2);
{
    const pos = gGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const edge = Math.min(1, Math.abs(z) / 14);
        pos.setY(i, (Math.sin(x * 0.06) * 1.8 + Math.cos(z * 0.08) * 2.2 + Math.sin(x * 0.02 + z * 0.03) * 1.2) * edge);
    }
    gGeo.computeVertexNormals();
}
const ground = new THREE.Mesh(gGeo, groundMat);
ground.position.set(ROAD_END / 2 - 30, 0, 0);
ground.receiveShadow = true;
scene.add(ground);

/* ===== ROAD + SIDEWALKS ===== */
const roadMat = mat(P.road);
const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_END + 100, 0.42, 7.5), roadMat);
road.position.set(ROAD_END / 2 - 30, 0.21, 0);
road.receiveShadow = true;
scene.add(road);

// Road markings (dashed center line)
const dashGeo = new THREE.BoxGeometry(1.8, 0.05, 0.2);
const dashMat = mat(0xccccaa);
for (let x = -20; x < ROAD_END + 20; x += 4) {
    const d = new THREE.Mesh(dashGeo, dashMat);
    d.position.set(x, 0.45, 0);
    scene.add(d);
}

// Sidewalks
const swMat = mat(P.sidewalk);
const sw1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_END + 100, 0.35, 2.2), swMat);
sw1.position.set(ROAD_END / 2 - 30, 0.17, -4.8);
sw1.receiveShadow = true;
scene.add(sw1);
const sw2 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_END + 100, 0.35, 2.2), swMat);
sw2.position.set(ROAD_END / 2 - 30, 0.17, 4.8);
scene.add(sw2);

/* ===== TREES (varied types) ===== */
const trunkMat = mat(0x6b4b34);
const leafMats = [mat(0x3f7f4a), mat(0x356f42), mat(0x4a8f52), mat(0x2a6638), mat(0x558844)];

function coniferTree(x, z, s) {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.5 * s, 2.8 * s, 6), trunkMat);
    t.position.y = 1.4 * s; t.castShadow = true; g.add(t);
    // layered cones
    for (let i = 0; i < 3; i++) {
        const r = (2.2 - i * 0.5) * s;
        const h = (2.8 - i * 0.4) * s;
        const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), leafMats[Math.abs((x * 7 + i) | 0) % leafMats.length]);
        c.position.y = (3 + i * 1.6) * s;
        c.castShadow = true;
        g.add(c);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
}

const bloomGulmohar = mat(0xe2512c), bloomJacaranda = mat(0x9a7fd6);
function roundTree(x, z, s) {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.4 * s, 3 * s, 6), trunkMat);
    t.position.y = 1.5 * s; t.castShadow = true; g.add(t);
    const c = new THREE.Mesh(new THREE.SphereGeometry(2 * s, 8, 6), leafMats[Math.abs((x * 3) | 0) % leafMats.length]);
    c.position.y = 4.2 * s; c.castShadow = true; g.add(c);
    const kind = Math.abs(Math.sin(x * 12.9898 + z * 78.233)) % 1;
    if (kind < 0.3) {                                   // gulmohar (red-orange) or jacaranda (violet)
        const bloom = kind < 0.17 ? bloomGulmohar : bloomJacaranda;
        for (let i = 0; i < 9; i++) {
            const a = i * 2.4, rr = 1.6 * s;
            const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 * s, 0), bloom);
            b.position.set(Math.cos(a) * rr * 0.8, 4.2 * s + 0.9 * s + Math.sin(i) * 0.6 * s, Math.sin(a) * rr * 0.8);
            g.add(b);
        }
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
}

// Place trees
_seed = 42;
const treeGroups = [];
for (let i = 0; i < 160; i++) {
    const x = -30 + srand() * (ROAD_END + 60);
    const far = srand() < 0.78;
    const s = far ? 0.7 + srand() * 0.9 : 0.45 + srand() * 0.35;
    const z = far ? -(12 + srand() * 40) : (8 + srand() * 8);
    const fn = srand() > 0.5 ? coniferTree : roundTree;
    treeGroups.push(fn(x, z, s));
}

/* ===== BUSHES & FLOWERS ===== */
const bushMat = mat(0x3a6a3a);
_seed = 99;
for (let i = 0; i < 80; i++) {
    const x = -20 + srand() * (ROAD_END + 40);
    const z = srand() > 0.5 ? -(6 + srand() * 4) : (6 + srand() * 3);
    const s = 0.3 + srand() * 0.6;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 5), bushMat);
    bush.position.set(x, s * 0.4, z);
    scene.add(bush);
}

// Flower clusters
const flowerColors = [0xff6b8a, 0xffdd44, 0xcc88ff, 0xff9966, 0x88ccff];
_seed = 77;
const flowerMeshes = [];
for (let i = 0; i < 120; i++) {
    const x = -20 + srand() * (ROAD_END + 40);
    const z = srand() > 0.5 ? -(7 + srand() * 6) : (7 + srand() * 5);
    const color = flowerColors[Math.floor(srand() * flowerColors.length)];
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.15 + srand() * 0.12, 5, 4), mat(color));
    f.position.set(x, 0.15, z);
    flowerMeshes.push(f);
    scene.add(f);
}

/* ===== ROCKS ===== */
const rockMat = mat(0x8a8578);
_seed = 55;
for (let i = 0; i < 40; i++) {
    const x = -20 + srand() * (ROAD_END + 40);
    const z = srand() > 0.5 ? -(8 + srand() * 15) : (8 + srand() * 10);
    const s = 0.3 + srand() * 0.8;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.position.set(x, s * 0.3, z);
    rock.rotation.set(srand() * Math.PI, srand() * Math.PI, 0);
    scene.add(rock);
}

/* ===== BUILDINGS — modelled on the real campuses (the same photos the cards use) =====
   Facades are painted onto canvas textures (windows, grilles, murals, signage) and
   given real depth with geometry: sunshades, pilasters, awnings, arches, the stage
   frame at UAS, the faceted glass pyramids and steel roof frame at Atria.
   Window glow at night comes from an emissive map painted alongside each facade. */
const winMats = [];      // plain window planes (kept for applyTheme)
const glowMats = [];     // facade materials whose windows light up after dark
const roofMat = mat(P.roof);

function ctex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
}
function facade(w, h, base, glow) {
    const m = new THREE.MeshLambertMaterial({ map: ctex(w, h, base) });
    if (glow) { m.emissiveMap = ctex(w, h, glow); m.emissive = new THREE.Color(0x000000); glowMats.push(m); }
    return m;
}
function boxFront(W, H, D, front, side, top) {             // front face = +z
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [side, side, top || side, side, front, side]);
    m.castShadow = true; m.receiveShadow = true;
    return m;
}
function put(geo, material, x, y, z, parent, cast = true) {
    const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m;
}
function planeTex(w, h, pw, ph, draw, transparent) {
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshLambertMaterial({ map: ctex(pw, ph, draw), transparent: !!transparent }));
}
function fitText(c, text, x, y, maxW, size, weight, family, align) {
    let s = size;
    do { c.font = `${weight} ${s}px ${family}`; s -= 2; } while (c.measureText(text).width > maxW && s > 8);
    c.textAlign = align || 'left'; c.fillText(text, x, y);
}
const SANS = 'Arial, Helvetica, sans-serif';
const KANNADA = '"Nirmala UI", "Noto Sans Kannada", "Kannada Sangam MN", "Tunga", sans-serif';
function grime(c, w, h, base, streak, n) {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let i = 0; i < (n || w / 6); i++) {
        c.globalAlpha = 0.04 + srand() * 0.07; c.fillStyle = streak;
        const x = srand() * w; c.fillRect(x, srand() * h * 0.3, 2 + srand() * 7, h);
    }
    c.globalAlpha = 1;
}
const lit = () => srand() < 0.55;

/* Indian tricolour (used on the school flagpole) */
function tricolourTex() {
    return ctex(300, 200, (c, w, h) => {
        c.fillStyle = '#FF9933'; c.fillRect(0, 0, w, h / 3);
        c.fillStyle = '#FFFFFF'; c.fillRect(0, h / 3, w, h / 3);
        c.fillStyle = '#138808'; c.fillRect(0, 2 * h / 3, w, h / 3);
        c.strokeStyle = '#000080'; c.lineWidth = 3;
        c.beginPath(); c.arc(w / 2, h / 2, 28, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * 27, h / 2 + Math.sin(a) * 27); c.lineWidth = 1.2; c.stroke(); }
        c.fillStyle = '#000080'; c.beginPath(); c.arc(w / 2, h / 2, 4, 0, Math.PI * 2); c.fill();
    });
}

/* Coconut palm — Bengaluru campuses are full of them */
const palmTrunkMat = mat(0x8a7356), palmLeafMat = new THREE.MeshLambertMaterial({ color: 0x4d8f3a, side: THREE.DoubleSide, flatShading: true });
function palmTree(x, z, s, parent) {
    const g = new THREE.Group();
    let px = 0, py = 0;
    const lean = (srand() - 0.5) * 0.35;
    for (let i = 0; i < 7; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.27 * s, 1.25 * s, 6), i % 2 ? palmTrunkMat : mat(0x7a6448));
        seg.position.set(px, py + 0.62 * s, 0); seg.rotation.z = -lean * 0.6; seg.castShadow = true; g.add(seg);
        py += 1.2 * s; px += lean * 0.45 * s;
    }
    for (let i = 0; i < 9; i++) {
        const f = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 3.8 * s, 1, 3), palmLeafMat);
        const pos = blade.geometry.attributes.position;
        blade.geometry.translate(0, 1.9 * s, 0);                       // pivot at the crown
        for (let k = 0; k < pos.count; k++) { const yy = pos.getY(k); pos.setZ(k, Math.pow(yy / (3.8 * s), 2) * 1.6 * s); }
        blade.geometry.computeVertexNormals();
        blade.rotation.x = Math.PI / 2 - 0.3;                           // rise a little, then droop
        f.add(blade); f.rotation.y = i / 9 * Math.PI * 2; f.rotation.z = 0;
        f.position.set(px, py, 0); g.add(f);
    }
    for (let i = 0; i < 4; i++) put(new THREE.SphereGeometry(0.2 * s, 6, 5), mat(0x6b5a2e), px + Math.cos(i * 1.6) * 0.3 * s, py - 0.2 * s, Math.sin(i * 1.6) * 0.3 * s, g);
    g.position.set(x, 0, z);
    (parent || scene).add(g);
    return g;
}

/* -------- Stop 1: Allwin Public School, Ganganagar --------
   Four-storey cream block, dark window grilles, blue-bordered signboard
   (Kannada + English), cartoon mouse & alphabet mural, blue awning over
   grille gates, black rooftop water tank, green-and-yellow neighbour. */
function buildSchool(x) {
    const g = new THREE.Group();
    const W = 18, H = 15, D = 10, cw = 1024, ch = Math.round(1024 * H / W), s = cw / W;
    const U = v => v * s, Y = v => ch - v * s;
    const floors = [0, 4, 7.7, 11.35, 15];
    const winRects = [];
    const front = facade(cw, ch, (c) => {
        grime(c, cw, ch, '#ece3d1', '#8f8470');
        // floor slabs
        for (const f of floors.slice(1, 4)) { c.fillStyle = '#f5efe3'; c.fillRect(0, Y(f) - 6, cw, 10); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, Y(f) + 4, cw, 6); }
        // ground floor: recessed, grille gates and a shutter
        c.fillStyle = '#373c42'; c.fillRect(0, Y(4) + 10, cw, U(4) - 10);
        c.strokeStyle = '#646c74'; c.lineWidth = 3;
        for (const [a, b] of [[1.5, 7.2], [8.4, 13.2]]) {
            for (let gx = U(a); gx < U(b); gx += 9) { c.beginPath(); c.moveTo(gx, Y(3.6)); c.lineTo(gx, ch); c.stroke(); }
            for (const yy of [3.2, 1.9, 0.6]) { c.beginPath(); c.moveTo(U(a), Y(yy)); c.lineTo(U(b), Y(yy)); c.stroke(); }
        }
        c.fillStyle = '#a7adb3'; c.fillRect(U(14), Y(3.4), U(3.4), U(3.4));
        c.fillStyle = '#8a9096'; for (let yy = Y(3.4); yy < ch; yy += 7) c.fillRect(U(14), yy, U(3.4), 2);
        // upper-floor grille windows
        for (let f = 1; f <= 3; f++) {
            const y0 = floors[f] + 0.65, y1 = floors[f + 1] - 0.55;
            const cols = f === 1 ? [[16.2, 17.5]] : [[1.0, 5.3], [6.3, 10.6], [11.6, 15.9], [16.4, 17.5]];
            for (const [a, b] of cols) {
                const rx = U(a), ry = Y(y1), rw = U(b - a), rh = U(y1 - y0);
                c.fillStyle = '#2a2e34'; c.fillRect(rx, ry, rw, rh);
                c.fillStyle = 'rgba(120,150,170,0.18)'; c.fillRect(rx + 4, ry + 4, rw - 8, rh * 0.4);
                c.strokeStyle = '#676d74'; c.lineWidth = 2;
                for (let gx = rx + 7; gx < rx + rw; gx += 11) { c.beginPath(); c.moveTo(gx, ry); c.lineTo(gx, ry + rh); c.stroke(); }
                for (const fy of [0.33, 0.66]) { c.beginPath(); c.moveTo(rx, ry + rh * fy); c.lineTo(rx + rw, ry + rh * fy); c.stroke(); }
                c.strokeStyle = '#d6cbb5'; c.lineWidth = 5; c.strokeRect(rx, ry, rw, rh);
                winRects.push([rx, ry, rw, rh]);
            }
        }
        // mural on the first floor: a cartoon mouse and alphabet bubbles
        const mx = U(1.3), my = Y(6.0);
        c.fillStyle = '#d9d6cf'; c.beginPath(); c.arc(mx + 40, my - 60, 34, 0, 7); c.fill();
        c.beginPath(); c.arc(mx + 14, my - 92, 20, 0, 7); c.arc(mx + 66, my - 92, 20, 0, 7); c.fill();
        c.fillStyle = '#4f9a54'; c.fillRect(mx + 16, my - 28, 48, 56);
        c.fillStyle = '#d9d6cf'; c.fillRect(mx + 20, my + 28, 14, 26); c.fillRect(mx + 46, my + 28, 14, 26);
        c.fillStyle = '#222'; c.beginPath(); c.arc(mx + 30, my - 64, 4, 0, 7); c.arc(mx + 50, my - 64, 4, 0, 7); c.fill();
        c.strokeStyle = '#555'; c.lineWidth = 2; c.strokeRect(mx + 16, my - 28, 48, 56);
        const bubbles = [['A', '#3b82c4'], ['ಅ', '#7a5bc0'], ['B', '#e0a43b'], ['C', '#3b82c4'], ['ಆ', '#4f9a54'], ['D', '#3b82c4'], ['E', '#d9534f'], ['ಇ', '#7a5bc0']];
        bubbles.forEach(([t, col], i) => {
            const bx = mx + 120 + (i % 4) * 46, by = my - 80 + Math.floor(i / 4) * 62 + (i % 2) * 14;
            c.fillStyle = '#f4f8fb'; c.beginPath(); c.arc(bx, by, 20, 0, 7); c.fill();
            c.strokeStyle = col; c.lineWidth = 3; c.stroke();
            c.fillStyle = col; c.font = `bold 22px ${/[A-Z]/.test(t) ? SANS : KANNADA}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, bx, by + 1);
        });
        c.textBaseline = 'alphabetic';
        // pilaster shading between bays
        for (const px of [5.8, 11.1, 16.15]) { c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(U(px), Y(15), 8, U(11)); }
    }, (c) => {
        c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch);
        for (const [rx, ry, rw, rh] of winRects) if (lit()) { c.fillStyle = '#ffd27a'; c.fillRect(rx + 4, ry + 4, rw - 8, rh - 8); }
        c.fillStyle = '#ffcc70'; c.fillRect(U(1.5), Y(3.6), U(11.7), U(3.4));
    });
    const side = facade(512, Math.round(512 * H / D), (c, w, h) => {
        grime(c, w, h, '#e6dcc8', '#8f8470');
        for (let f = 1; f <= 3; f++) { const y = h - (floors[f] + 1.2) * (h / H); c.fillStyle = '#2a2e34'; c.fillRect(w * 0.35, y - 70, w * 0.3, 70); }
    });
    const body = boxFront(W, H, D, front, side, mat(0xd9cfbb));
    body.position.y = H / 2; g.add(body);

    // depth: floor sunshades, pilasters, parapet
    for (const f of [7.6, 11.25]) put(new THREE.BoxGeometry(W + 0.2, 0.14, 0.7), mat(0xe9e0cd), 0, f, D / 2 + 0.35, g);
    for (const px of [5.8, 11.1, 16.15]) put(new THREE.BoxGeometry(0.4, H - 4, 0.3), mat(0xe2d8c4), -W / 2 + px, 4 + (H - 4) / 2, D / 2 + 0.15, g);
    put(new THREE.BoxGeometry(W + 0.3, 0.6, D + 0.3), mat(0xe2d8c4), 0, H + 0.3, 0, g);
    // blue awning over the ground floor
    const awn = put(new THREE.BoxGeometry(W + 0.6, 0.12, 2.2), mat(0x3d74b8), 0, 4.15, D / 2 + 1.0, g);
    awn.rotation.x = 0.28;
    for (const ax of [-W / 2 + 0.3, W / 2 - 0.3]) put(new THREE.CylinderGeometry(0.05, 0.05, 3.9, 5), mat(0x555a60), ax, 1.95, D / 2 + 1.9, g);
    // signboard
    const sign = planeTex(10.5, 2.7, 1024, 263, (c, w, h) => {
        c.fillStyle = '#fdfdfb'; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#2c63b5'; c.lineWidth = 16; c.strokeRect(8, 8, w - 16, h - 16);
        c.fillStyle = '#e9f1fb'; c.beginPath(); c.arc(128, h / 2, 82, 0, 7); c.fill();
        c.strokeStyle = '#2c63b5'; c.lineWidth = 7; c.stroke();
        c.fillStyle = '#f2c230'; c.beginPath(); c.arc(128, h / 2 - 8, 34, 0, 7); c.fill();
        c.fillStyle = '#3d8f4a'; c.beginPath(); c.moveTo(80, h / 2 + 48); c.quadraticCurveTo(128, h / 2 + 4, 176, h / 2 + 48); c.fill();
        c.fillStyle = '#2c63b5'; fitText(c, 'APS', 128, h / 2 + 2, 70, 34, 'bold', SANS, 'center');
        c.fillStyle = '#1f4e9c'; fitText(c, 'ಆಲ್ವಿನ್ ಪಬ್ಲಿಕ್ ಸ್ಕೂಲ್', 245, 78, 740, 56, 'bold', KANNADA);
        fitText(c, 'ALLWIN PUBLIC SCHOOL', 240, 168, 750, 92, 'bold', SANS);
        c.fillStyle = '#2b2b2b'; fitText(c, 'Nursery, Primary and High School  ·  (Recognised by Govt. of Karnataka)', 242, 222, 740, 26, '600', SANS);
    });
    sign.position.set(0.6, 6.0, D / 2 + 0.06); g.add(sign);
    const signRim = put(new THREE.BoxGeometry(10.7, 2.9, 0.1), mat(0x2c63b5), 0.6, 6.0, D / 2 + 0.01, g, false);
    // black rooftop water tank (a Bengaluru constant)
    put(new THREE.CylinderGeometry(0.85, 0.85, 1.5, 14), mat(0x1f1f1f), W / 2 - 2.2, H + 1.35, -2, g);
    put(new THREE.BoxGeometry(2.4, 0.5, 2.4), mat(0x9a9a9a), W / 2 - 2.2, H + 0.85, -2, g);
    // climbing vines on the left corner
    _seed = 1201;
    for (let i = 0; i < 26; i++) {
        const vy = srand() * 9, r = 0.35 + srand() * 0.5 * (1 - vy / 10);
        put(new THREE.IcosahedronGeometry(r, 0), leafMats[i % leafMats.length], -W / 2 + 0.2 + srand() * 1.6, vy + 0.4, D / 2 + 0.3 + srand() * 0.4, g);
    }
    // green-and-yellow neighbour with balconies
    const nb = new THREE.Group();
    const nbBody = put(new THREE.BoxGeometry(9, 11, 8), mat(0xe6d36c), 0, 5.5, 0, nb);
    for (const fy of [3.6, 7.2, 10.8]) {
        put(new THREE.BoxGeometry(9.6, 0.25, 1.5), mat(0x3e9a5a), 0, fy, 4.6, nb);
        put(new THREE.BoxGeometry(9.6, 0.9, 0.08), mat(0x3e9a5a), 0, fy + 0.55, 5.3, nb);
    }
    for (const fy of [1.8, 5.4, 9.0]) for (const wx of [-2.6, 2.6]) put(new THREE.BoxGeometry(1.6, 1.8, 0.1), mat(0x2b3a34), wx, fy, 4.02, nb, false);
    nb.position.set(W / 2 + 5.2, 0, -1); g.add(nb);
    palmTree(W / 2 + 10.5, 4, 1.25, g);
    // compound wall with a grille gate
    const wallM = mat(0xd9cbb0), bandM = mat(0x3d74b8);
    for (const [wx, ww] of [[-6.5, 8], [6.5, 8]]) { put(new THREE.BoxGeometry(ww, 1.5, 0.35), wallM, wx, 0.75, D / 2 + 4, g); put(new THREE.BoxGeometry(ww, 0.15, 0.4), bandM, wx, 1.55, D / 2 + 4, g); }
    for (let gx = -2.4; gx <= 2.4; gx += 0.3) put(new THREE.BoxGeometry(0.05, 1.8, 0.05), mat(0x3b4046), gx, 0.9, D / 2 + 4, g, false);
    put(new THREE.BoxGeometry(5, 0.08, 0.08), mat(0x3b4046), 0, 1.75, D / 2 + 4, g, false);
    // the national flag
    put(new THREE.CylinderGeometry(0.07, 0.09, 7.5, 6), mat(0xeeeeee), -W / 2 - 1.8, 3.75, D / 2 + 3, g);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6, 6, 1), new THREE.MeshLambertMaterial({ map: tricolourTex(), side: THREE.DoubleSide }));
    { const p = flag.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * 2.2) * 0.12); flag.geometry.computeVertexNormals(); }
    flag.position.set(-W / 2 - 0.55, 6.6, D / 2 + 3); g.add(flag);
    g.userData.flag = flag;
    // a white car parked at the gate
    const car = new THREE.Group();
    put(new THREE.BoxGeometry(3.4, 1.0, 1.7), mat(0xf2f2ee), 0, 0.75, 0, car);
    put(new THREE.BoxGeometry(2.0, 0.75, 1.55), mat(0xf2f2ee), -0.25, 1.6, 0, car);
    put(new THREE.BoxGeometry(2.05, 0.55, 1.6), mat(0x2d3a46), -0.25, 1.62, 0, car, false);
    for (const [wx, wz] of [[-1.1, 0.8], [-1.1, -0.8], [1.1, 0.8], [1.1, -0.8]]) { const w = put(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), mat(0x1a1a1a), wx, 0.32, wz, car); w.rotation.x = Math.PI / 2; }
    car.position.set(W / 2 - 1, 0, D / 2 + 6.2); g.add(car);

    g.position.set(x, 0, -20);
    scene.add(g);
    return g;
}

/* -------- Stop 2: UAS and VC PU College --------
   Long three-storey cream block with vertical pilasters, paired ochre-framed
   windows under concrete sunshades, a red-earth ground in front, and the
   raised stage with its steel pipe frame. */
function buildPUCollege(x) {
    const g = new THREE.Group();
    const W = 36, H = 11.5, D = 9, cw = 2048, ch = Math.round(2048 * H / W), s = cw / W;
    const U = v => v * s, Y = v => ch - v * s;
    const floors = [0, 3.8, 7.6, 11.5];
    const winRects = [];
    const front = facade(cw, ch, (c) => {
        grime(c, cw, ch, '#ebe2cb', '#a0927a');
        c.fillStyle = '#e1d7be'; c.fillRect(0, 0, cw, U(0.75)); c.fillStyle = '#c8bc9e'; c.fillRect(0, U(0.75), cw, 5);
        for (let b = 0; b < 12; b++) {
            const x0 = b * 3;
            for (let f = 0; f < 3; f++) {
                if (f === 0 && (b === 5 || b === 6)) {                      // entrance
                    c.fillStyle = '#4a3a2a'; c.fillRect(U(x0 + 0.7), Y(floors[0] + 2.6), U(1.7), U(2.6));
                    c.strokeStyle = '#c9a24a'; c.lineWidth = 5; c.strokeRect(U(x0 + 0.7), Y(floors[0] + 2.6), U(1.7), U(2.6));
                    continue;
                }
                for (const wx of [0.75, 1.85]) {
                    const rx = U(x0 + wx), ry = Y(floors[f] + 2.4), rw = U(0.85), rh = U(1.55);
                    c.fillStyle = '#2f2a24'; c.fillRect(rx, ry, rw, rh);
                    if (srand() < 0.3) { c.fillStyle = '#6b5e4a'; c.fillRect(rx + 4, ry + 4, rw / 2 - 4, rh - 8); }
                    c.strokeStyle = '#c9a24a'; c.lineWidth = 4; c.strokeRect(rx, ry, rw, rh);
                    c.beginPath(); c.moveTo(rx + rw / 2, ry); c.lineTo(rx + rw / 2, ry + rh); c.stroke();
                    winRects.push([rx, ry, rw, rh]);
                }
                c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(U(x0 + 0.5), Y(floors[f] + 2.55), U(2.1), 9);    // sunshade shadow
            }
            c.fillStyle = '#f4eddb'; c.fillRect(U(x0), U(0.8), U(0.42), ch);                               // pilaster
            c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(U(x0 + 0.42), U(0.8), 5, ch);
        }
    }, (c) => {
        c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch);
        for (const [rx, ry, rw, rh] of winRects) if (lit()) { c.fillStyle = '#ffd27a'; c.fillRect(rx + 3, ry + 3, rw - 6, rh - 6); }
    });
    const sideM = mat(0xe3d9c2);
    const body = boxFront(W, H, D, front, sideM, mat(0xd7ccb3));
    body.position.y = H / 2; g.add(body);
    for (let b = 0; b <= 12; b++) put(new THREE.BoxGeometry(0.42, H - 0.6, 0.32), mat(0xf1e9d6), -W / 2 + b * 3 + 0.21, (H - 0.6) / 2, D / 2 + 0.16, g);
    for (const f of [2.55, 6.35, 10.15]) put(new THREE.BoxGeometry(W + 0.3, 0.12, 0.75), mat(0xe8dfca), 0, f, D / 2 + 0.37, g);
    put(new THREE.BoxGeometry(W + 0.4, 0.5, D + 0.4), mat(0xddd2b8), 0, H + 0.25, 0, g);
    put(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 5), mat(0x777777), -W / 2 + 6, H + 1.6, -1, g);   // rooftop mast
    put(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 12), mat(0x1f1f1f), W / 2 - 4, H + 1.15, -2, g);
    // red-earth ground
    const earth = new THREE.Mesh(new THREE.PlaneGeometry(58, 11), mat(0xc1844f));
    earth.rotation.x = -Math.PI / 2; earth.position.set(0, 0.07, D / 2 + 5.4); earth.receiveShadow = true; g.add(earth);
    // stage with its steel pipe frame
    const stageM = mat(0xc9a77c), pipe = phong(0x9aa0a8, 0x888888, 40);
    put(new THREE.BoxGeometry(9, 1.1, 4.2), stageM, 0, 0.55, D / 2 + 2.6, g);
    for (let i = 0; i < 3; i++) put(new THREE.BoxGeometry(3.2, 0.37, 0.6), mat(0xb89870), 0, 0.18 + i * 0.37 - 0.0, D / 2 + 5.0 - i * 0.45, g).scale.y = 1;
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) put(new THREE.BoxGeometry(0.6, 0.37 * (i + 1), 1.4), mat(0xb89870), sx * (4.8 + (2 - i) * 0.5), 0.185 * (i + 1), D / 2 + 2.6, g);
    const px = [-4.2, 4.2], pz = [D / 2 + 0.9, D / 2 + 4.3];
    for (const a of px) for (const b of pz) put(new THREE.CylinderGeometry(0.07, 0.07, 4.6, 6), pipe, a, 1.1 + 2.3, b, g);
    for (const b of pz) { put(new THREE.BoxGeometry(8.6, 0.12, 0.12), pipe, 0, 5.7, b, g); put(new THREE.BoxGeometry(8.6, 0.1, 0.1), pipe, 0, 4.6, b, g); }
    for (const a of px) put(new THREE.BoxGeometry(0.12, 0.12, 3.5), pipe, a, 5.7, D / 2 + 2.6, g);
    for (let k = -3; k <= 3; k++) put(new THREE.BoxGeometry(0.08, 0.08, 3.5), pipe, k * 1.2, 5.75, D / 2 + 2.6, g);
    // hedges & shrubs
    for (let i = 0; i < 6; i++) put(new THREE.SphereGeometry(0.8 + srand() * 0.3, 7, 5), mat(0x3f7a3a), 9 + i * 1.5, 0.6, D / 2 + 1.2, g);
    for (const hx of [-14, -11.5]) put(new THREE.SphereGeometry(0.7, 7, 5), mat(0x3f7a3a), hx, 0.5, D / 2 + 1.0, g);
    // tall eucalyptus behind
    for (const [ex, ez] of [[-20, -7], [-12, -8], [5, -9], [16, -7], [21, -8]]) {
        put(new THREE.CylinderGeometry(0.18, 0.28, 14, 6), mat(0xd8d0c4), ex, 7, ez, g);
        for (let k = 0; k < 3; k++) put(new THREE.SphereGeometry(1.6 + srand(), 7, 5), leafMats[(k + ex) & 3], ex + (srand() - 0.5) * 2, 13 + k * 1.3, ez, g);
    }
    // entrance gate by the road
    const gate = new THREE.Group();
    for (const sx of [-4, 4]) { put(new THREE.BoxGeometry(0.9, 4.2, 0.9), mat(0xe6dcc4), sx, 2.1, 0, gate); put(new THREE.BoxGeometry(1.1, 0.3, 1.1), mat(0x7a1f1f), sx, 4.35, 0, gate); }
    const gsign = planeTex(8.8, 1.3, 1024, 152, (c, w, h) => {
        c.fillStyle = '#7a1f1f'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8c35a'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
        c.fillStyle = '#fbe9b0'; fitText(c, 'UAS AND VC PU COLLEGE', w / 2, 74, w - 60, 66, 'bold', SANS, 'center');
        c.fillStyle = '#f3dca0'; fitText(c, 'BENGALURU', w / 2, 128, 300, 34, '600', SANS, 'center');
    });
    gsign.position.set(0, 4.9, 0.47); gate.add(gsign);
    put(new THREE.BoxGeometry(8.9, 1.4, 0.4), mat(0x6a1a1a), 0, 4.9, 0.25, gate);
    gate.position.set(-12, 0, D / 2 + 11.4); g.add(gate);

    g.position.set(x, 0, -20);
    scene.add(g);
    return g;
}

/* -------- Stop 3: Indian Academy Degree College (Autonomous) --------
   Big white complex: green-panelled left wing, arched centre block with a
   gable, arcade of white arched balconies on the right, a glass top storey,
   and the INDIAN ACADEMY lettering and pylon sign. */
function buildBCACollege(x) {
    const g = new THREE.Group();
    // raised plot (the campus sits on a rise)
    put(new THREE.BoxGeometry(58, 1.2, 22), mat(0x5f8f4a), 0, 0.6, 0, g).receiveShadow = true;
    const base = 1.2;
    const whiteM = mat(0xf2f2ee), floorH = 3.5;
    // left wing — windows with green spandrel panels
    {
        const W = 16, H = 15, cw = 1024, ch = 960, s = cw / W, U = v => v * s, Y = v => ch - v * s, rects = [];
        const fm = facade(cw, ch, (c) => {
            c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, cw, ch);
            for (let f = 0; f < 4; f++) for (let i = 0; i < 5; i++) {
                const wx = 0.8 + i * 3.05, wy = f * floorH + 0.9;
                if (f === 0) { c.fillStyle = '#39444a'; c.fillRect(U(wx), Y(wy + 2.2), U(2.2), U(2.2)); continue; }
                c.fillStyle = '#78b58a'; c.fillRect(U(wx), Y(wy + 0.8), U(2.2), U(0.8));
                c.fillStyle = '#334450'; c.fillRect(U(wx), Y(wy + 2.5), U(2.2), U(1.6));
                c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.strokeRect(U(wx), Y(wy + 2.5), U(2.2), U(1.6));
                c.beginPath(); c.moveTo(U(wx + 1.1), Y(wy + 2.5)); c.lineTo(U(wx + 1.1), Y(wy + 0.9)); c.stroke();
                rects.push([U(wx), Y(wy + 2.5), U(2.2), U(1.6)]);
            }
            for (let f = 1; f < 4; f++) { c.fillStyle = '#e3e3dd'; c.fillRect(0, Y(f * floorH) - 4, cw, 8); }
        }, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch); for (const r of rects) if (lit()) { c.fillStyle = '#ffd27a'; c.fillRect(r[0] + 3, r[1] + 3, r[2] - 6, r[3] - 6); } });
        const m = boxFront(W, H, 12, fm, whiteM); m.position.set(-15, base + H / 2, 0); g.add(m);
        put(new THREE.BoxGeometry(W + 0.3, 0.5, 12.3), whiteM, -15, base + H + 0.25, 0, g);
    }
    // centre block — tall arched windows, columned porch, gable with emblem
    {
        const W = 12, H = 18, cw = 768, ch = 1152, s = cw / W, U = v => v * s, Y = v => ch - v * s, rects = [];
        const fm = facade(cw, ch, (c) => {
            c.fillStyle = '#f6f6f2'; c.fillRect(0, 0, cw, ch);
            for (let f = 1; f < 5; f++) for (const ax of [1.6, 7.0]) {
                const wx = U(ax), wy = Y(f * 3.4 + 2.6), ww = U(3.4), wh = U(2.4);
                c.fillStyle = '#2f4e5c'; c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx, wy + ww / 2); c.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); c.lineTo(wx + ww, wy + wh); c.closePath(); c.fill();
                c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.stroke();
                c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.62); c.lineTo(wx + ww, wy + wh * 0.62); c.lineWidth = 3; c.stroke();
                rects.push([wx, wy + ww / 2, ww, wh - ww / 2]);
            }
            c.fillStyle = '#39444a'; c.fillRect(U(1.5), Y(3.2), U(9), U(3.2));
        }, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch); for (const r of rects) if (lit()) { c.fillStyle = '#ffd890'; c.fillRect(r[0] + 4, r[1], r[2] - 8, r[3] - 4); } });
        const m = boxFront(W, H, 13, fm, whiteM); m.position.set(-1, base + H / 2, 0.5); g.add(m);
        const tri = new THREE.Shape(); tri.moveTo(-6.4, 0); tri.lineTo(6.4, 0); tri.lineTo(0, 3.2); tri.closePath();
        const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.8, bevelEnabled: false }), whiteM);
        ped.position.set(-1, base + H, 6.2); ped.castShadow = true; g.add(ped);
        const emb = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), mat(0x3a8fa8)); emb.position.set(-1, base + H + 1.25, 7.02); g.add(emb);
        const emb2 = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 20), mat(0xd9b04a)); emb2.position.set(-1, base + H + 1.25, 7.03); g.add(emb2);
        for (const cx of [-4.5, -1.8, 0.8, 3.5]) addPillar2(g, cx - 1, base, 7.8, 4.2, 0.32);
        put(new THREE.BoxGeometry(11, 0.5, 2.6), whiteM, -1, base + 4.4, 7.4, g);
    }
    // right wing — arcade of white arched balconies with balustrades
    {
        const W = 18, H = 15, cw = 1152, ch = 960, s = cw / W, U = v => v * s, Y = v => ch - v * s, rects = [];
        const fm = facade(cw, ch, (c) => {
            c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, cw, ch);
            for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) {
                const ax = 0.5 + i * 2.95, ay = f * floorH + 0.6, aw = 2.35, ah = 2.6;
                const X0 = U(ax), Yb = Y(ay), Wd = U(aw), Ht = U(ah);
                c.fillStyle = f === 0 ? '#39444a' : '#2c3438';
                c.beginPath(); c.moveTo(X0, Yb); c.lineTo(X0, Yb - Ht + Wd / 2); c.arc(X0 + Wd / 2, Yb - Ht + Wd / 2, Wd / 2, Math.PI, 0); c.lineTo(X0 + Wd, Yb); c.closePath(); c.fill();
                rects.push([X0, Yb - Ht + Wd / 2, Wd, Ht - Wd / 2]);
                if (f > 0) {
                    c.fillStyle = '#ffffff'; c.fillRect(X0, Yb - U(0.85), Wd, 6); c.fillRect(X0, Yb - 6, Wd, 6);
                    for (let bx = X0 + 6; bx < X0 + Wd - 4; bx += 12) c.fillRect(bx, Yb - U(0.85), 5, U(0.85));
                    if (srand() < 0.35) { c.fillStyle = '#4f8f4a'; c.beginPath(); c.arc(X0 + Wd * (0.25 + srand() * 0.5), Yb - U(0.9), 10, 0, 7); c.fill(); }
                }
            }
            for (let f = 1; f < 4; f++) { c.fillStyle = '#e3e3dd'; c.fillRect(0, Y(f * floorH) - 4, cw, 8); }
        }, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch); for (const r of rects) if (lit()) { c.fillStyle = '#ffd890'; c.fillRect(r[0] + 6, r[1], r[2] - 12, r[3] - 8); } });
        const m = boxFront(W, H, 12, fm, whiteM); m.position.set(14, base + H / 2, 0); g.add(m);
        // glass top storey with a rounded end
        const glassM = phong(0x2f7d8c, 0xaaddee, 80);
        const gm = facade(1024, 160, (c, w, h) => { c.fillStyle = '#2f7d8c'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, 0, w, h * 0.4); c.fillStyle = '#e8f4f6'; for (let xx = 0; xx < w; xx += 40) c.fillRect(xx, 0, 3, h); c.fillRect(0, h / 2, w, 3); },
            (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#8fd8e0'; for (let xx = 0; xx < w; xx += 40) if (srand() < 0.5) c.fillRect(xx + 5, 6, 30, h - 12); });
        const top = boxFront(17, 2.8, 10.4, gm, glassM, whiteM); top.position.set(13.5, base + H + 1.4, 0); g.add(top);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 2.8, 20, 1, false, 0, Math.PI), glassM);
        cap.rotation.y = Math.PI; cap.position.set(22, base + H + 1.4, 0); cap.scale.x = 0.35; g.add(cap);
        put(new THREE.BoxGeometry(18.8, 0.3, 11), whiteM, 14, base + H + 2.95, 0, g);
        const letters = planeTex(11, 1.5, 1024, 140, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#2e8aa6'; fitText(c, 'INDIAN ACADEMY', w / 2, 104, w - 30, 110, 'bold', SANS, 'center'); }, true);
        letters.position.set(15.5, base + H - 0.9, 6.05); g.add(letters);
    }
    // pylon sign at the gate
    const py = new THREE.Group();
    put(new THREE.BoxGeometry(0.5, 6, 0.5), mat(0xdddddd), -3.2, 3, 0, py); put(new THREE.BoxGeometry(0.5, 6, 0.5), mat(0xdddddd), 3.2, 3, 0, py);
    const ps = planeTex(6.4, 2.6, 768, 312, (c, w, h) => {
        c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#2e8aa6'; c.fillRect(0, h - 26, w, 26);
        c.fillStyle = '#2e8aa6'; fitText(c, 'INDIAN ACADEMY', w / 2, 120, w - 40, 96, 'bold', SANS, 'center');
        c.fillStyle = '#3c4a52'; fitText(c, 'Degree College (Autonomous)', w / 2, 196, w - 60, 46, '600', SANS, 'center');
        fitText(c, 'Bengaluru', w / 2, 256, 300, 36, '500', SANS, 'center');
    });
    ps.position.set(0, 4.5, 0.27); py.add(ps); put(new THREE.BoxGeometry(6.6, 2.8, 0.4), mat(0xf4f4f4), 0, 4.5, 0.02, py);
    py.position.set(26, 0, 9.5); g.add(py);
    // lush trees on the slope below
    _seed = 3301;
    for (let i = 0; i < 9; i++) {
        const tx = -26 + i * 5.6 + srand() * 2, tz = 9 + srand() * 2.5, sc = 0.7 + srand() * 0.5;
        put(new THREE.CylinderGeometry(0.2 * sc, 0.3 * sc, 2.4 * sc, 6), trunkMat, tx, 1.2 + 1.2 * sc, tz, g);
        put(new THREE.SphereGeometry(1.9 * sc, 8, 6), leafMats[i % leafMats.length], tx, 1.2 + 3.4 * sc, tz, g);
    }
    g.position.set(x, 0, -22);
    scene.add(g);
    return g;
}
function addPillar2(group, x, y0, z, h, r) {
    put(new THREE.CylinderGeometry(r, r * 1.1, h, 10), mat(0xf4f4f0), x, y0 + h / 2, z, group);
}

/* -------- Stop 4: Atria Institute of Technology --------
   The faceted facade of blue glass pyramids, a steel exoskeleton arching over
   the roof, a vertical garden down the left side, purple ATRIA banners,
   palms and the little red-roofed security kiosk. */
let atriaGlass = null;
function buildMCAInstitute(x) {
    const g = new THREE.Group();
    const W = 30, H = 21, D = 12;
    const concrete = mat(0xdedfe0);
    const backGlass = new THREE.MeshLambertMaterial({ color: 0x1d3550 });
    const body = boxFront(W, H, D, backGlass, concrete, mat(0xcfd0d2));
    body.position.y = H / 2; g.add(body);
    atriaGlass = new THREE.MeshPhongMaterial({ color: 0x4a8fd0, specular: 0xd8f0ff, shininess: 110, flatShading: true, emissive: 0x000000 });
    const pyr = new THREE.ConeGeometry(3 / Math.SQRT2 * 0.97, 1.35, 4, 1);
    pyr.rotateY(Math.PI / 4); pyr.rotateX(Math.PI / 2); pyr.translate(0, 0, 0.675);   // base flush on the facade
    const frameM = mat(0x2a3440);
    for (let r = 0; r < 7; r++) for (let cc = 0; cc < 10; cc++) {
        if (r === 0 && cc >= 4 && cc <= 5) continue;                       // entrance
        const m = new THREE.Mesh(pyr, atriaGlass);
        m.position.set(-W / 2 + 1.5 + cc * 3, 1.5 + r * 3, D / 2 + 0.02);
        m.castShadow = true; g.add(m);
    }
    for (let cc = 0; cc <= 10; cc++) put(new THREE.BoxGeometry(0.12, H, 0.12), frameM, -W / 2 + cc * 3, H / 2, D / 2 + 0.05, g, false);
    for (let r = 0; r <= 7; r++) put(new THREE.BoxGeometry(W, 0.12, 0.12), frameM, 0, r * 3, D / 2 + 0.05, g, false);
    // entrance + sign canopy
    put(new THREE.BoxGeometry(5.6, 2.8, 0.2), new THREE.MeshPhongMaterial({ color: 0x9fc6de, specular: 0xffffff, shininess: 90 }), 0, 1.4, D / 2 + 0.1, g, false);
    put(new THREE.BoxGeometry(9, 0.3, 2.6), mat(0x3a3f46), 0, 3.15, D / 2 + 1.3, g);
    const sgn = planeTex(8.6, 0.9, 1024, 108, (c, w, h) => { c.fillStyle = '#3a3f46'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; fitText(c, 'ATRIA INSTITUTE OF TECHNOLOGY', w / 2, 74, w - 40, 60, 'bold', SANS, 'center'); });
    sgn.position.set(0, 3.75, D / 2 + 2.62); g.add(sgn);
    put(new THREE.BoxGeometry(8.8, 1.0, 0.1), mat(0x3a3f46), 0, 3.75, D / 2 + 2.57, g, false);
    // steel exoskeleton arching over the roof
    const steel = phong(0xa7b0b8, 0xffffff, 60);
    for (let i = 0; i <= 5; i++) {
        const ax = -W / 2 + 0.6 + i * (W - 1.2) / 5;
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(ax, H - 3, D / 2 + 0.4), new THREE.Vector3(ax, H + 1.6, D / 2 + 0.2),
            new THREE.Vector3(ax, H + 3.4, D / 2 - 3), new THREE.Vector3(ax, H + 3.2, -D / 2 + 2.5), new THREE.Vector3(ax, H, -D / 2)
        ]);
        put(new THREE.TubeGeometry(curve, 24, 0.13, 6, false), steel, 0, 0, 0, g);
    }
    put(new THREE.CylinderGeometry(0.12, 0.12, W - 1.2, 6), steel, 0, H + 3.4, D / 2 - 3, g).rotation.z = Math.PI / 2;
    put(new THREE.CylinderGeometry(0.12, 0.12, W - 1.2, 6), steel, 0, H + 1.6, D / 2 + 0.2, g).rotation.z = Math.PI / 2;
    // vertical garden down the left
    const greenWall = new THREE.MeshLambertMaterial({ map: ctex(256, 512, (c, w, h) => {
        c.fillStyle = '#2f6b2f'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 2200; i++) { c.fillStyle = ['#3f8a3a', '#55a347', '#2a5a28', '#6bb34f', '#24502a'][i % 5]; c.beginPath(); c.arc(srand() * w, srand() * h, 3 + srand() * 6, 0, 7); c.fill(); }
    }) });
    put(new THREE.BoxGeometry(1.4, H * 0.92, D + 0.4), greenWall, -W / 2 - 0.7, H * 0.46, 0, g);
    for (let i = 0; i < 22; i++) put(new THREE.IcosahedronGeometry(0.4 + srand() * 0.45, 0), leafMats[i % leafMats.length], -W / 2 - 1.2 - srand() * 0.4, srand() * H * 0.9, -D / 2 + srand() * D, g);
    // white annex behind on the right
    const annex = facade(512, 560, (c, w, h) => { c.fillStyle = '#f1f1ef'; c.fillRect(0, 0, w, h); for (let y = 40; y < h - 40; y += 90) { c.fillStyle = '#3c4a56'; c.fillRect(30, y, w - 60, 34); } },
        (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); for (let y = 40; y < h - 40; y += 90) if (srand() < 0.6) { c.fillStyle = '#ffd890'; c.fillRect(34, y + 4, w - 68, 26); } });
    const an = boxFront(12, 13, 10, annex, mat(0xeeeeec)); an.position.set(W / 2 + 6.5, 6.5, -2); g.add(an);
    // purple ATRIA banners
    const bannerTex = ctex(128, 340, (c, w, h) => {
        c.fillStyle = '#5a2d8c'; c.fillRect(0, 0, w, h); c.fillStyle = '#d9b44a'; c.fillRect(0, 10, w, 6); c.fillRect(0, h - 16, w, 6);
        c.fillStyle = '#ffffff'; c.font = `bold 52px ${SANS}`; c.textAlign = 'center';
        'ATRIA'.split('').forEach((ch, i) => c.fillText(ch, w / 2, 80 + i * 54));
    });
    const bannerM = new THREE.MeshLambertMaterial({ map: bannerTex, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
        const bx = -12.5 + i * 5;
        put(new THREE.CylinderGeometry(0.07, 0.07, 6.2, 6), mat(0x8a8f96), bx, 3.1, D / 2 + 4.2, g);
        const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.2), bannerM); b.position.set(bx + 0.68, 4.3, D / 2 + 4.2); g.add(b);
    }
    // security kiosk with a red tiled roof
    put(new THREE.BoxGeometry(2.2, 2.6, 2.2), mat(0xf2f0ea), -W / 2 - 4.5, 1.3, D / 2 + 4.6, g);
    const kr = put(new THREE.ConeGeometry(2.1, 1.2, 4), mat(0xb5452f), -W / 2 - 4.5, 3.2, D / 2 + 4.6, g); kr.rotation.y = Math.PI / 4;
    put(new THREE.BoxGeometry(1.2, 1, 0.05), mat(0x2d3a46), -W / 2 - 4.5, 1.7, D / 2 + 5.71, g, false);
    // palms
    _seed = 4401;
    for (const [tx, tz] of [[-9.5, D / 2 + 6.4], [-2.8, D / 2 + 6.8], [3.8, D / 2 + 6.4], [10.5, D / 2 + 6.8], [-W / 2 - 7, -2], [W / 2 + 13.5, 4]]) palmTree(tx, tz, 1.15 + srand() * 0.25, g);
    g.position.set(x, 0, -22);
    scene.add(g);
    return g;
}

const buildings = [
    buildSchool(STOPS[0].at),
    buildPUCollege(STOPS[1].at),
    buildBCACollege(STOPS[2].at),
    buildMCAInstitute(STOPS[3].at)
];

/* ===== EXTRA WORLD DETAILS ===== */

/* Fences along the far side of the road */
const fenceMat = mat(0x8a7a5a);
const fencePostGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.2, 5);
const fenceRailGeo = new THREE.BoxGeometry(3.8, 0.08, 0.06);
_seed = 444;
for (let x = -15; x < ROAD_END + 15; x += 4) {
    // Skip near buildings
    const nearBuilding = STOPS.some(s => Math.abs(x - s.at) < 30);
    if (nearBuilding) continue;
    if (srand() > 0.7) continue; // some gaps for variety
    
    const post = new THREE.Mesh(fencePostGeo, fenceMat);
    post.position.set(x, 1.1, -7);
    scene.add(post);
    // Top cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), fenceMat);
    cap.position.set(x, 2.25, -7);
    scene.add(cap);
    // Rails
    const rail1 = new THREE.Mesh(fenceRailGeo, fenceMat);
    rail1.position.set(x + 2, 1.6, -7);
    scene.add(rail1);
    const rail2 = new THREE.Mesh(fenceRailGeo, fenceMat);
    rail2.position.set(x + 2, 0.8, -7);
    scene.add(rail2);
}

/* Small pond between stop 1 and 2 */
const pondGeo = new THREE.CircleGeometry(6, 16);
pondGeo.rotateX(-Math.PI / 2);
const pondMat = new THREE.MeshPhongMaterial({ 
    color: 0x3a6688, specular: 0x88aacc, shininess: 80, 
    transparent: true, opacity: 0.75 
});
const pond = new THREE.Mesh(pondGeo, pondMat);
pond.position.set(93, 0.15, -28);
scene.add(pond);
// Pond edge rocks
for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 5.5 + srand() * 1.5;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + srand() * 0.3, 0), rockMat);
    rock.position.set(93 + Math.cos(angle) * r, 0.2, -28 + Math.sin(angle) * r);
    rock.rotation.set(srand(), srand(), 0);
    scene.add(rock);
}
// Reeds around pond
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 4.5 + srand() * 1;
    const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2 + srand(), 4), mat(0x4a6a3a));
    reed.position.set(93 + Math.cos(angle) * r, 1, -28 + Math.sin(angle) * r);
    scene.add(reed);
    // Reed tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), mat(0x6a5a3a));
    tip.position.set(93 + Math.cos(angle) * r, 2 + srand(), -28 + Math.sin(angle) * r);
    scene.add(tip);
}

/* Power lines (simple poles + wires every ~50 units) */
const poleMat = mat(0x5a5040);
for (let px = 10; px < ROAD_END; px += 50) {
    const poleGroup = new THREE.Group();
    const mainPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 10, 6), poleMat);
    mainPole.position.y = 5; poleGroup.add(mainPole);
    // Cross arm
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 4), poleMat);
    crossArm.position.set(0, 9.5, 0); poleGroup.add(crossArm);
    // Insulators
    for (const iz of [-1.5, 0, 1.5]) {
        const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6), mat(0xcccccc));
        insulator.position.set(0, 9.7, iz); poleGroup.add(insulator);
    }
    poleGroup.position.set(px, 0, 12);
    scene.add(poleGroup);
}

/* Trash cans / bins near stops */
STOPS.forEach(s => {
    const bin = new THREE.Group();
    const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.2, 8), mat(0x4a5a4a));
    canBody.position.y = 0.6; bin.add(canBody);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.1, 8), mat(0x3a4a3a));
    lid.position.y = 1.25; bin.add(lid);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.025, 4, 12), mat(0x666666));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.9; bin.add(band);
    bin.position.set(s.at + 7, 0, -6.2);
    scene.add(bin);
});

/* Small garden plots near school */
const gardenX = STOPS[0].at + 16;
for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
        // Soil patch
        const soil = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 1.5), mat(0x4a3a2a));
        soil.position.set(gardenX + c * 2.5, 0.08, -14 - r * 2);
        scene.add(soil);
        // Small plants
        for (let p = 0; p < 3; p++) {
            const plantStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5 + srand() * 0.3, 4), mat(0x3a6a30));
            plantStem.position.set(gardenX + c * 2.5 - 0.6 + p * 0.6, 0.4, -14 - r * 2);
            scene.add(plantStem);
            const plantTop = new THREE.Mesh(new THREE.SphereGeometry(0.12 + srand() * 0.08, 5, 4), mat(flowerColors[Math.floor(srand() * flowerColors.length)]));
            plantTop.position.set(gardenX + c * 2.5 - 0.6 + p * 0.6, 0.7 + srand() * 0.2, -14 - r * 2);
            scene.add(plantTop);
        }
    }
}

/* Parking lot near MCA building */
const parkX = STOPS[3].at;
const carColors = [0x4a4a5a, 0x8a3030, 0xf0f0e0, 0x2a3a5a, 0x5a5a5a];
_seed = 555;
for (let i = 0; i < 5; i++) {
    const car = new THREE.Group();
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 1.8), mat(carColors[i % carColors.length]));
    carBody.position.y = 0.8; car.add(carBody);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.6), mat(carColors[i % carColors.length]));
    roof.position.y = 1.7; roof.position.x = -0.2; car.add(roof);
    // Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.4), mat(0x88aacc));
    windshield.position.set(0.8, 1.5, 0); windshield.rotation.z = -0.3; car.add(windshield);
    // Wheels
    for (const [wx, wz] of [[-1, 0.85], [-1, -0.85], [1, 0.85], [1, -0.85]]) {
        const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), mat(0x1a1a1a));
        cw.rotation.x = Math.PI / 2;
        cw.position.set(wx, 0.3, wz); car.add(cw);
    }
    // Headlights
    const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), mat(0xffffcc));
    hl1.position.set(1.6, 0.7, 0.6); car.add(hl1);
    const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), mat(0xffffcc));
    hl2.position.set(1.6, 0.7, -0.6); car.add(hl2);
    
    car.position.set(parkX + 18 + i * 4, 0, 14 + (i % 2) * 3);
    car.rotation.y = Math.PI * 0.5;
    scene.add(car);
}

/* ===== SIGNPOSTS ===== */
const postMat = mat(0x8a7a63), signMat = mat(0xf0e6d2);
STOPS.forEach((s, i) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5.5, 6), postMat);
    p.position.y = 2.75; g.add(p);
    const b = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.8, 0.3), signMat);
    b.position.set(1.8, 4.8, 0); g.add(b);
    const label = planeTex(5.6, 1.5, 640, 172, (c, w, h) => {
        c.fillStyle = '#f0e6d2'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#2a2622'; fitText(c, s.name.replace(' (Autonomous)', ''), w / 2, 78, w - 40, 54, 'bold', SANS, 'center');
        c.fillStyle = '#5a5248'; fitText(c, s.deg + ' · ' + s.yr.split(' · ')[0], w / 2, 138, w - 40, 34, '600', SANS, 'center');
    });
    label.position.set(1.8, 4.7, 0.16); g.add(label);
    // Accent stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.3, 0.32), mat(s.accent));
    stripe.position.set(1.8, 5.5, 0); g.add(stripe);
    g.position.set(s.at - 9, 0, -7.5);
    scene.add(g);
});

/* ===== STREET LIGHTS (detailed, with glow cones at night) ===== */
const lampPosts = [];
const lampGlows = []; // meshes that appear only at night
const lampPoleMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a, specular: 0x666666, shininess: 20, flatShading: false });
const lampDarkMetal = mat(0x2a2a2a);
const lampBulbMatOff = mat(0xddddcc);
const lampBulbMatOn = new THREE.MeshBasicMaterial({ color: 0xffeebb });

for (let lx = -10; lx < ROAD_END + 10; lx += 12) {
    const g = new THREE.Group();

    // Base plate
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.15, 10), lampDarkMetal);
    basePlate.position.y = 0.08; g.add(basePlate);

    // Main pole (tapered, taller)
    const mainPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 7, 8), lampPoleMat);
    mainPole.position.y = 3.6; mainPole.castShadow = true; g.add(mainPole);

    // Decorative ring near top
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 12), lampPoleMat);
    ring1.rotation.x = Math.PI / 2; ring1.position.y = 6.4; g.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), lampPoleMat);
    ring2.rotation.x = Math.PI / 2; ring2.position.y = 6.6; g.add(ring2);

    // Curved arm (quarter-arc reaching over the road)
    const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 6.8, 0),
        new THREE.Vector3(0.6, 7.2, 0),
        new THREE.Vector3(1.4, 7.3, 0),
        new THREE.Vector3(2.0, 7.15, 0),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 12, 0.06, 6, false);
    const armMesh = new THREE.Mesh(armGeo, lampPoleMat);
    g.add(armMesh);

    // Lamp housing (lantern shape)
    const housingG = new THREE.Group();
    housingG.position.set(2.0, 7.0, 0);

    // Top cap
    const topCap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.2, 8), lampDarkMetal);
    topCap.position.y = 0.3; housingG.add(topCap);
    // Housing body (hexagonal lantern)
    const housingBody = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.45, 6), lampDarkMetal);
    housingG.add(housingBody);
    // Glass panels (slightly emissive at night)
    for (let gi = 0; gi < 6; gi++) {
        const angle = (gi / 6) * Math.PI * 2;
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, 0.35),
            new THREE.MeshPhongMaterial({ color: 0xffeedd, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
        );
        glass.position.set(Math.cos(angle) * 0.26, 0, Math.sin(angle) * 0.26);
        glass.rotation.y = -angle + Math.PI / 2;
        housingG.add(glass);
    }
    // Bottom rim
    const bottomRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 4, 8), lampDarkMetal);
    bottomRim.rotation.x = Math.PI / 2; bottomRim.position.y = -0.22;
    housingG.add(bottomRim);

    // Bulb inside
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lampBulbMatOff);
    housingG.add(bulb);
    lampGlows.push(bulb); // will swap material at night

    g.add(housingG);

    // Point light (only active at night, stronger and warmer)
    const lp = new THREE.PointLight(0xffd080, 0, 22, 1.8);
    lp.position.set(2.0, 6.8, 0);
    g.add(lp);
    lampPosts.push(lp);

    // Light cone (visible cone of light projecting down at night)
    const coneMat = new THREE.MeshBasicMaterial({
        color: 0xffd080, transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6.5, 12, 1, true), coneMat);
    cone.position.set(2.0, 3.5, 0);
    // default: tip at +Y (near lamp), base at -Y (wide on ground)
    g.add(cone);
    lampGlows.push(cone); // will adjust opacity at night

    // Ground glow circle (projected light on ground)
    const groundGlow = new THREE.Mesh(
        new THREE.CircleGeometry(2.8, 16),
        new THREE.MeshBasicMaterial({ color: 0xffd080, transparent: true, opacity: 0, depthWrite: false })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.set(2.0, 0.05, 0);
    g.add(groundGlow);
    lampGlows.push(groundGlow); // will adjust opacity at night

    // Place alternating on both sides of road
    const side = Math.floor(lx / 12) % 2 === 0 ? -6.5 : 5.5;
    g.position.set(lx, 0, side);
    // Rotate so the arm (built along +X) points toward the road (z=0)
    if (side < 0) g.rotation.y = Math.PI / 2;   // far side: arm toward +z
    else g.rotation.y = -Math.PI / 2;            // near side: arm toward -z
    scene.add(g);
}

/* ===== AUTO-RICKSHAWS ===== */
function autoRickshaw(x, z, ry) {
    const g = new THREE.Group();
    const green = mat(0x2f8f4a), yellow = mat(0xf2c230), black = mat(0x1e1e1e);
    put(new THREE.BoxGeometry(2.4, 0.7, 1.3), green, 0, 0.55, 0, g);
    put(new THREE.BoxGeometry(0.7, 0.95, 0.95), green, 1.3, 0.75, 0, g);
    put(new THREE.BoxGeometry(2.3, 0.14, 1.45), yellow, -0.05, 2.15, 0, g);
    put(new THREE.BoxGeometry(0.14, 1.3, 1.45), yellow, -1.15, 1.5, 0, g);
    for (const [px, pz] of [[1.05, 0.62], [1.05, -0.62]]) put(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 5), black, px, 1.5, pz, g);
    const ws = put(new THREE.PlaneGeometry(1.15, 0.75), new THREE.MeshPhongMaterial({ color: 0x9ab8cc, shininess: 80, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }), 1.12, 1.55, 0, g, false);
    ws.rotation.y = Math.PI / 2;
    put(new THREE.BoxGeometry(0.8, 0.5, 1.15), black, -0.55, 1.05, 0, g);
    for (const [wx, wz] of [[1.3, 0], [-0.8, 0.66], [-0.8, -0.66]]) { const w = put(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), black, wx, 0.3, wz, g); w.rotation.x = Math.PI / 2; }
    put(new THREE.SphereGeometry(0.11, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffcc }), 1.67, 0.95, 0, g, false);
    g.position.set(x, 0.42, z); g.rotation.y = ry;
    scene.add(g);
    return g;
}
autoRickshaw(STOPS[0].at + 13, 2.6, Math.PI);
autoRickshaw(STOPS[1].at - 16, 2.6, 0);
autoRickshaw(STOPS[2].at + 20, -2.4, Math.PI);
autoRickshaw(STOPS[3].at - 18, 2.6, 0.05);

/* ===== BENCHES ===== */
_seed = 33;
for (let i = 0; i < 16; i++) {
    const x = -10 + srand() * (ROAD_END + 20);
    const z = srand() > 0.5 ? -6 : 6;
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.8), mat(0x7a5a3a));
    seat.position.y = 0.9; bench.add(seat);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.6), mat(0x4a4a4a));
    leg1.position.set(-1, 0.45, 0); bench.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.6), mat(0x4a4a4a));
    leg2.position.set(1, 0.45, 0); bench.add(leg2);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.1), mat(0x7a5a3a));
    back.position.set(0, 1.3, -0.35); bench.add(back);
    bench.position.set(x, 0, z);
    bench.rotation.y = z > 0 ? Math.PI : 0;
    scene.add(bench);
}

/* ===== CYCLIST (high-detail stylized character) ===== */
const rider = new THREE.Group();
{
    /* -- materials -- */
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x1f6f8b, specular: 0x4488aa, shininess: 18, flatShading: true });
    const chromeMat = new THREE.MeshPhongMaterial({ color: 0xd0d0d0, specular: 0xffffff, shininess: 80, flatShading: false });
    const skinMat = new THREE.MeshPhongMaterial({ color: 0xe8b98c, specular: 0x664422, shininess: 8, flatShading: false });
    const hairMat = mat(0x1e0e04);
    const shirtMat = new THREE.MeshPhongMaterial({ color: 0xc0a377, specular: 0x443322, shininess: 5, flatShading: false });
    const collarMat = mat(0xd8cc98);
    const pantsMat = new THREE.MeshPhongMaterial({ color: 0x2e3d58, specular: 0x222233, shininess: 4, flatShading: false });
    const shoeMat = new THREE.MeshPhongMaterial({ color: 0x1a1815, specular: 0x333333, shininess: 12, flatShading: false });
    const soleMat = mat(0xf0f0f0);
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x181818, specular: 0x333333, shininess: 6, flatShading: false });
    const spokeMat = mat(0xbbbbbb);
    const seatMat = mat(0x111111);
    const gripMat = mat(0x282828);
    const bpMat = new THREE.MeshPhongMaterial({ color: 0x34281a, specular: 0x221100, shininess: 4, flatShading: false });
    const bpAccent = mat(0xc0a377);
    const glassMat2 = new THREE.MeshPhongMaterial({ color: 0x88aacc, specular: 0xffffff, shininess: 80 });

    /* ============================================
       BICYCLE
       ============================================ */

    /* -- Wheels -- */
    function buildWheel() {
        const wg = new THREE.Group();
        const tire = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.2, 12, 32), tireMat);
        wg.add(tire);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.04, 8, 32), chromeMat);
        wg.add(rim);
        const innerRim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.025, 6, 32), chromeMat);
        wg.add(innerRim);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.55, 12), chromeMat);
        hub.rotation.x = Math.PI / 2; wg.add(hub);
        // Quick release skewer
        const qr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), chromeMat);
        qr.rotation.x = Math.PI / 2; wg.add(qr);
        const qrLever = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.04), chromeMat);
        qrLever.position.set(0, 0, 0.36); wg.add(qrLever);
        // 28 spokes (14 per side, crossing pattern)
        for (let i = 0; i < 28; i++) {
            const a = (Math.PI * 2 / 28) * i;
            const side = i % 2 === 0 ? 0.12 : -0.12;
            const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.8, 3), spokeMat);
            sp.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, side * 0.5);
            sp.rotation.z = a;
            // tilt spoke toward hub
            sp.rotation.x = side > 0 ? 0.08 : -0.08;
            wg.add(sp);
        }
        // Valve
        const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.22, 5), mat(0xddcc00));
        valve.position.set(0, 1.05, 0); wg.add(valve);
        return wg;
    }

    const rearWheel = buildWheel();
    rearWheel.position.set(-1.45, 1.15, 0);
    rider.add(rearWheel);
    const frontWheel = buildWheel();
    frontWheel.position.set(1.45, 1.15, 0);
    rider.add(frontWheel);
    rider.userData.wheels = [rearWheel, frontWheel];

    /* -- Frame (tubes as tapered cylinders, proper angles) -- */
    function frameTube(ax, ay, bx, by, r1, r2, material) {
        const dx = bx - ax, dy = by - ay;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, dy);
        const geo = new THREE.CylinderGeometry(r1, r2 || r1, len, 8);
        const mesh = new THREE.Mesh(geo, material || frameMat);
        mesh.position.set((ax + bx) / 2, (ay + by) / 2, 0);
        mesh.rotation.z = -angle;
        return mesh;
    }

    // Frame points
    const BBx = 0, BBy = 1.35;           // bottom bracket
    const STx = -0.55, STy = 3.25;       // seat tube top
    const HTtx = 1.2, HTty = 3.05;       // head tube top
    const HTbx = 1.05, HTby = 2.15;      // head tube bottom
    const DOrx = -1.45, DOry = 1.15;     // rear dropout
    const DOfx = 1.45, DOfy = 1.15;      // front dropout

    rider.add(frameTube(BBx, BBy, STx, STy, 0.07, 0.06));      // seat tube
    rider.add(frameTube(STx, STy, HTtx, HTty, 0.06, 0.055));    // top tube
    rider.add(frameTube(HTtx, HTty, BBx, BBy, 0.075, 0.065));   // down tube
    rider.add(frameTube(BBx, BBy, DOrx, DOry, 0.05, 0.045));    // chainstay
    rider.add(frameTube(STx, STy, DOrx, DOry, 0.04, 0.035));    // seatstay
    rider.add(frameTube(HTtx, HTty, HTbx, HTby, 0.06, 0.06));   // head tube
    rider.add(frameTube(HTbx, HTby, DOfx, DOfy, 0.05, 0.04));   // fork

    // Chainring + chain
    const chainring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 6, 20), chromeMat);
    chainring.position.set(BBx, BBy, 0.15); rider.add(chainring);
    const sprocket = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 12), chromeMat);
    sprocket.position.set(DOrx, DOry, 0.12); rider.add(sprocket);
    // Chain (simplified as a thin torus connecting chainring to sprocket)
    const chainPath = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.02), mat(0x333333));
    chainPath.position.set(-0.72, 1.25, 0.14); chainPath.rotation.z = -0.02; rider.add(chainPath);
    const chainBot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.02), mat(0x333333));
    chainBot.position.set(-0.72, 1.22, 0.14); rider.add(chainBot);

    // Crank arms
    const crankR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.035), chromeMat);
    crankR.position.set(BBx, BBy - 0.28, 0.18); rider.add(crankR);
    const crankL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.035), chromeMat);
    crankL.position.set(BBx, BBy + 0.28, -0.18); crankL.rotation.z = Math.PI; rider.add(crankL);
    // Pedals
    const pedalGeoR = new THREE.BoxGeometry(0.28, 0.05, 0.1);
    const pedalR = new THREE.Mesh(pedalGeoR, mat(0x3a3a3a));
    pedalR.position.set(BBx, BBy - 0.6, 0.18); rider.add(pedalR);
    const pedalL = new THREE.Mesh(pedalGeoR, mat(0x3a3a3a));
    pedalL.position.set(BBx, BBy + 0.6, -0.18); rider.add(pedalL);
    rider.userData.cranks = [crankR, crankL, pedalR, pedalL];

    // Seat post + saddle
    const seatPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 8), chromeMat);
    seatPost.position.set(-0.5, 3.55, 0); rider.add(seatPost);
    // Saddle (organic shape using LatheGeometry)
    const saddlePts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.18, 0.02),
        new THREE.Vector2(0.22, 0.04),
        new THREE.Vector2(0.18, 0.06),
        new THREE.Vector2(0, 0.06),
    ];
    const saddleGeo = new THREE.LatheGeometry(saddlePts, 12);
    const saddle = new THREE.Mesh(saddleGeo, seatMat);
    saddle.rotation.x = Math.PI / 2;
    saddle.position.set(-0.42, 3.88, 0);
    saddle.scale.set(1, 1, 2.2);
    rider.add(saddle);

    // Handlebar assembly
    const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), chromeMat);
    stemMesh.rotation.z = -0.4; stemMesh.position.set(1.3, 3.25, 0); rider.add(stemMesh);
    const hbar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 14, Math.PI * 1.1), chromeMat);
    hbar.rotation.y = Math.PI / 2; hbar.rotation.x = Math.PI * 0.55;
    hbar.position.set(1.48, 3.42, 0); rider.add(hbar);
    // Brake levers
    const brakeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), mat(0x222222));
    brakeR.position.set(1.55, 3.3, 0.2); brakeR.rotation.z = -0.4; rider.add(brakeR);
    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), mat(0x222222));
    brakeL.position.set(1.55, 3.3, -0.2); brakeL.rotation.z = -0.4; rider.add(brakeL);
    // Grips
    const gripGeoR = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 10);
    const gripR = new THREE.Mesh(gripGeoR, gripMat);
    gripR.position.set(1.48, 3.42, 0.24); rider.add(gripR);
    const gripL = new THREE.Mesh(gripGeoR, gripMat);
    gripL.position.set(1.48, 3.42, -0.24); rider.add(gripL);

    // Reflectors
    const reflRear = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), mat(0xff2200));
    reflRear.position.set(-0.55, 3.85, 0.01); reflRear.rotation.y = Math.PI; rider.add(reflRear);
    const reflFront = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), mat(0xffffff));
    reflFront.position.set(1.65, 3.05, 0.01); rider.add(reflFront);

    // Bell
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), chromeMat);
    bell.position.set(1.4, 3.52, 0.15); rider.add(bell);

    /* ============================================
       HUMAN BODY (proper cycling pose)
       Saddle=(-0.42, 3.88), Grips=(1.48, 3.42, ±0.24)
       ============================================ */

    // --- HEAD ---
    const headGroup = new THREE.Group();
    headGroup.position.set(1.05, 4.48, 0);
    headGroup.rotation.z = 0.2;
    rider.add(headGroup);

    // Skull (slightly elongated, not a perfect sphere)
    const skullGeo = new THREE.SphereGeometry(0.36, 16, 12);
    skullGeo.scale(1, 1.05, 0.95);
    const skull = new THREE.Mesh(skullGeo, skinMat);
    skull.castShadow = true;
    headGroup.add(skull);

    // Ears (more detailed with inner ear)
    function buildEar(zSign) {
        const earG = new THREE.Group();
        const outer = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skinMat);
        earG.add(outer);
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshPhongMaterial({ color: 0xd4a07a, flatShading: false }));
        inner.position.set(0.01, 0, zSign * 0.01);
        earG.add(inner);
        earG.position.set(-0.04, -0.02, zSign * 0.34);
        return earG;
    }
    headGroup.add(buildEar(1));
    headGroup.add(buildEar(-1));

    // Eyes (expressive, slightly larger for character)
    function buildEye(z) {
        const eyeG = new THREE.Group();
        // White
        const white = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), mat(0xfefefe));
        eyeG.add(white);
        // Iris
        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), mat(0x4a3520));
        iris.position.set(0.04, 0, 0);
        eyeG.add(iris);
        // Pupil
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(0x050505));
        pupil.position.set(0.055, 0, 0);
        eyeG.add(pupil);
        // Catchlight (tiny white dot)
        const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 3), mat(0xffffff));
        catchlight.position.set(0.06, 0.015, 0.01);
        eyeG.add(catchlight);
        // Upper eyelid
        const lid = new THREE.Mesh(
            new THREE.SphereGeometry(0.068, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.35),
            skinMat
        );
        lid.position.set(0, 0.01, 0);
        eyeG.add(lid);
        eyeG.position.set(0.26, 0.06, z);
        return eyeG;
    }
    headGroup.add(buildEye(0.13));
    headGroup.add(buildEye(-0.13));

    // Eyebrows (curved, expressive)
    function buildBrow(z, tilt) {
        const pts = [];
        for (let t = 0; t <= 1; t += 0.2) {
            pts.push(new THREE.Vector3(
                0.24 + Math.sin(t * Math.PI) * 0.02,
                0.17 + t * tilt,
                z - 0.06 + t * 0.12
            ));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 6, 0.015, 4, false);
        return new THREE.Mesh(tubeGeo, mat(0x1e0e04));
    }
    headGroup.add(buildBrow(0.13, 0.025));
    headGroup.add(buildBrow(-0.13, -0.025));

    // Nose (more refined shape)
    const noseG = new THREE.Group();
    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.12, 6), skinMat);
    noseBridge.rotation.x = -Math.PI / 2 + 0.2;
    noseBridge.position.set(0.33, 0.02, 0);
    noseG.add(noseBridge);
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 5), skinMat);
    noseTip.position.set(0.37, -0.03, 0);
    noseG.add(noseTip);
    // Nostrils
    const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 4), new THREE.MeshPhongMaterial({ color: 0xc09070 }));
    nostrilR.position.set(0.35, -0.05, 0.025);
    noseG.add(nostrilR);
    const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 4), new THREE.MeshPhongMaterial({ color: 0xc09070 }));
    nostrilL.position.set(0.35, -0.05, -0.025);
    noseG.add(nostrilL);
    headGroup.add(noseG);

    // Mouth (smile with lips)
    const upperLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, 0.012, 4, 10, Math.PI),
        new THREE.MeshPhongMaterial({ color: 0xc47860 })
    );
    upperLip.rotation.z = Math.PI;
    upperLip.position.set(0.3, -0.13, 0);
    headGroup.add(upperLip);
    const lowerLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.014, 4, 10, Math.PI),
        new THREE.MeshPhongMaterial({ color: 0xcc8068 })
    );
    lowerLip.position.set(0.3, -0.14, 0);
    headGroup.add(lowerLip);

    // Chin
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), skinMat);
    chin.position.set(0.22, -0.26, 0);
    chin.scale.set(1, 0.6, 1.1);
    headGroup.add(chin);

    // Hair (styled, visible below helmet)
    const hairBack = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 12, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65),
        hairMat
    );
    hairBack.position.set(-0.02, -0.01, 0);
    headGroup.add(hairBack);
    // Sideburns
    for (const zs of [0.32, -0.32]) {
        const sb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.08), hairMat);
        sb.position.set(-0.06, -0.08, zs);
        headGroup.add(sb);
    }

    // Helmet (detailed with aerodynamic shape)
    const helmetPts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.3, 0.02),
        new THREE.Vector2(0.42, 0.08),
        new THREE.Vector2(0.44, 0.2),
        new THREE.Vector2(0.38, 0.35),
        new THREE.Vector2(0.2, 0.45),
        new THREE.Vector2(0, 0.46),
    ];
    const helmetGeo = new THREE.LatheGeometry(helmetPts, 16);
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0x4a5a33, specular: 0x666666, shininess: 25, flatShading: false });
    const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
    helmetMesh.position.set(0, -0.06, 0);
    headGroup.add(helmetMesh);
    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.48), new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 30 }));
    visor.position.set(0.32, 0.01, 0); visor.rotation.z = 0.12;
    headGroup.add(visor);
    // Helmet vents
    for (let v = -1; v <= 1; v++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.055), mat(0x2a2a2a));
        vent.position.set(0.02, 0.38, v * 0.14);
        headGroup.add(vent);
    }
    // Strap under chin
    for (const zs of [0.28, -0.28]) {
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 4), mat(0x1a1a1a));
        strap.position.set(0.14, -0.2, zs); strap.rotation.z = 0.25;
        headGroup.add(strap);
    }
    // Strap buckle
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.03), chromeMat);
    buckle.position.set(0.18, -0.35, 0.22);
    headGroup.add(buckle);

    // --- NECK ---
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.2, 10), skinMat);
    neck.position.set(0.9, 4.22, 0); neck.rotation.z = -0.4;
    rider.add(neck);

    // --- TORSO (organic shape, leaning forward) ---
    const torsoPts = [
        new THREE.Vector2(0, -0.65),
        new THREE.Vector2(0.32, -0.55),
        new THREE.Vector2(0.38, -0.2),
        new THREE.Vector2(0.36, 0.15),
        new THREE.Vector2(0.3, 0.45),
        new THREE.Vector2(0.24, 0.6),
        new THREE.Vector2(0, 0.65),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPts, 12);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0.28, 4.0, 0);
    torso.rotation.z = -0.6;
    torso.castShadow = true;
    rider.add(torso);

    // Shirt collar
    const collarG = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 14), collarMat);
    collarG.rotation.x = Math.PI / 2;
    collarG.position.set(0.78, 4.15, 0);
    rider.add(collarG);

    // Belt
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 4, 14), mat(0x3a2a1a));
    belt.rotation.x = Math.PI / 2;
    belt.position.set(-0.2, 3.68, 0);
    rider.add(belt);
    // Belt buckle
    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), chromeMat);
    beltBuckle.position.set(-0.05, 3.68, 0.34);
    rider.add(beltBuckle);

    // --- ARMS (reaching to grips) ---
    // Shoulders at ~(0.68, 4.2, ±0.38) → Grips at (1.48, 3.42, ±0.24)
    function buildArm(sz) {
        const armG = new THREE.Group();
        // Upper arm (shirt sleeve)
        const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.4, 6, 10), shirtMat);
        upper.position.set(0.16, -0.14, 0);
        upper.rotation.z = -0.7;
        armG.add(upper);
        // Elbow
        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMat);
        elbow.position.set(0.38, -0.2, 0);
        armG.add(elbow);
        // Forearm (skin)
        const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.38, 6, 10), skinMat);
        fore.position.set(0.56, -0.15, sz * 0.04);
        fore.rotation.z = -0.25;
        armG.add(fore);
        // Wrist
        const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), skinMat);
        wrist.position.set(0.72, -0.08, sz * 0.06);
        armG.add(wrist);
        // Hand (gripping handlebar)
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), skinMat);
        hand.position.set(0.76, -0.04, sz * 0.06);
        hand.scale.set(1.2, 0.8, 1);
        armG.add(hand);
        // Fingers wrapping around grip
        for (let f = 0; f < 4; f++) {
            const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 6), skinMat);
            finger.position.set(0.77, -0.06 + f * 0.02, sz * 0.07);
            finger.rotation.set(f * 0.1, 0, 0.3);
            armG.add(finger);
        }
        // Thumb
        const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.04, 4, 6), skinMat);
        thumb.position.set(0.74, 0.02, sz * 0.03);
        thumb.rotation.z = -0.5;
        armG.add(thumb);

        armG.position.set(0.68, 4.2, sz * 0.36);
        return armG;
    }
    rider.add(buildArm(1));
    rider.add(buildArm(-1));

    // --- LEGS (bent at knee, feet on pedals) ---
    function buildLeg(zSide) {
        const legG = new THREE.Group();
        // Thigh (angled forward-down)
        const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.7, 7, 10), pantsMat);
        thigh.position.set(0.18, -0.4, 0);
        thigh.rotation.z = 0.35;
        thigh.castShadow = true;
        legG.add(thigh);
        // Knee
        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), pantsMat);
        knee.position.set(0.4, -0.82, 0);
        legG.add(knee);
        // Shin (angled down-back to pedal)
        const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.65, 7, 10), pantsMat);
        shin.position.set(0.32, -1.25, 0);
        shin.rotation.z = -0.2;
        legG.add(shin);
        // Ankle
        const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), skinMat);
        ankle.position.set(0.24, -1.62, 0);
        legG.add(ankle);
        // Shoe (detailed)
        const shoeG = new THREE.Group();
        const shoeBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.14), shoeMat);
        shoeG.add(shoeBody);
        const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), shoeMat);
        toeCap.position.set(0.13, -0.01, 0); toeCap.scale.set(1.2, 0.8, 1.1);
        shoeG.add(toeCap);
        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.15), soleMat);
        sole.position.y = -0.06; shoeG.add(sole);
        // Heel
        const heel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.12), mat(0x111111));
        heel.position.set(-0.13, -0.05, 0); shoeG.add(heel);
        // Lace detail
        for (let lc = 0; lc < 3; lc++) {
            const lace = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.1), mat(0xdddddd));
            lace.position.set(-0.04 + lc * 0.06, 0.055, 0);
            shoeG.add(lace);
        }
        shoeG.position.set(0.24, -1.72, 0);
        legG.add(shoeG);

        legG.position.set(-0.2, 3.55, zSide * 0.19);
        return legG;
    }

    const legR = buildLeg(1);
    const legL = buildLeg(-1);
    rider.add(legR);
    rider.add(legL);
    rider.userData.legs = [legR, legL];
}
rider.scale.setScalar(0.62);
scene.add(rider);

/* ===== AMBIENT LIFE: BIRDS ===== *//* ===== AMBIENT LIFE: BIRDS ===== */
const birds = [];
_seed = 88;
for (let i = 0; i < 18; i++) {
    const birdGroup = new THREE.Group();
    const bodyMat = mat(srand() > 0.5 ? 0x2a2a2a : 0x5a4a3a);
    // V-shape wings
    const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), bodyMat);
    wingL.rotation.z = 0.3; wingL.position.set(-0.5, 0, 0);
    birdGroup.add(wingL);
    const wingR = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), bodyMat);
    wingR.rotation.z = -0.3; wingR.position.set(0.5, 0, 0);
    birdGroup.add(wingR);
    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4), bodyMat);
    birdGroup.add(body);

    birdGroup.position.set(
        srand() * ROAD_END,
        20 + srand() * 30,
        -20 + srand() * 40
    );
    birdGroup.userData = {
        baseY: birdGroup.position.y,
        speed: 8 + srand() * 12,
        flapSpeed: 3 + srand() * 4,
        phase: srand() * Math.PI * 2,
        dir: srand() > 0.5 ? 1 : -1
    };
    birds.push(birdGroup);
    scene.add(birdGroup);
}

/* ===== AMBIENT LIFE: DETAILED PEOPLE near stops ===== */
const walkers = [];

function buildDetailedPerson(opts) {
    const o = Object.assign({
        isChild: false, shirtColor: 0xc0a377, pantsColor: 0x3a4a6a,
        hairColor: 0x2a1a0a, hairStyle: 'short', hasBackpack: false,
        hasBag: false, skinTone: 0xe8b98c, shoeColor: 0x2a2220,
        sleeveLength: 'short' /* 'short' or 'long' */
    }, opts);

    const person = new THREE.Group();
    const sc = o.isChild ? 0.55 : 1;
    const headRatio = o.isChild ? 1.3 : 1; // kids have bigger heads

    // Materials
    const skin = new THREE.MeshPhongMaterial({ color: o.skinTone, specular: 0x664422, shininess: 6, flatShading: false });
    const shirt = new THREE.MeshPhongMaterial({ color: o.shirtColor, specular: 0x222222, shininess: 4, flatShading: false });
    const pants = new THREE.MeshPhongMaterial({ color: o.pantsColor, specular: 0x111122, shininess: 3, flatShading: false });
    const hair = mat(o.hairColor);
    const shoe = mat(o.shoeColor);

    const baseY = o.isChild ? 0.2 : 0;

    // --- LEGS ---
    function personLeg(zOff) {
        const lg = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085 * sc, 0.45 * sc, 6, 8), pants);
        thigh.position.y = -0.28 * sc; lg.add(thigh);
        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.07 * sc, 6, 5), pants);
        knee.position.y = -0.58 * sc; lg.add(knee);
        const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.065 * sc, 0.42 * sc, 6, 8), pants);
        shin.position.y = -0.88 * sc; lg.add(shin);
        const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sc, 5, 4), skin);
        ankle.position.y = -1.14 * sc; lg.add(ankle);
        // Shoe
        const shG = new THREE.Group();
        const shBody = new THREE.Mesh(new THREE.BoxGeometry(0.2 * sc, 0.07 * sc, 0.1 * sc), shoe);
        shG.add(shBody);
        const shToe = new THREE.Mesh(new THREE.SphereGeometry(0.05 * sc, 5, 4), shoe);
        shToe.position.set(0.08 * sc, -0.01 * sc, 0); shToe.scale.set(1.1, 0.7, 1); shG.add(shToe);
        const shSole = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.025 * sc, 0.11 * sc), mat(0xeeeeee));
        shSole.position.y = -0.04 * sc; shG.add(shSole);
        shG.position.y = -1.22 * sc;
        lg.add(shG);
        lg.position.set(zOff, 0.6 * sc + baseY, 0);
        return lg;
    }
    const pLegR = personLeg(0.09 * sc);
    const pLegL = personLeg(-0.09 * sc);
    person.add(pLegR); person.add(pLegL);

    // --- TORSO (organic) ---
    const tPts = [
        new THREE.Vector2(0, -0.45 * sc),
        new THREE.Vector2(0.2 * sc, -0.38 * sc),
        new THREE.Vector2(0.24 * sc, 0),
        new THREE.Vector2(0.2 * sc, 0.3 * sc),
        new THREE.Vector2(0, 0.42 * sc),
    ];
    const tGeo = new THREE.LatheGeometry(tPts, 10);
    const torsoM = new THREE.Mesh(tGeo, shirt);
    torsoM.position.y = 1.15 * sc + baseY;
    torsoM.castShadow = true;
    person.add(torsoM);

    // Belt
    const pBelt = new THREE.Mesh(new THREE.TorusGeometry(0.22 * sc, 0.02 * sc, 4, 12), mat(0x4a3a2a));
    pBelt.rotation.x = Math.PI / 2;
    pBelt.position.y = 0.72 * sc + baseY;
    person.add(pBelt);

    // --- ARMS ---
    function personArm(zSign) {
        const ag = new THREE.Group();
        const upper = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.055 * sc, 0.35 * sc, 5, 7),
            o.sleeveLength === 'long' ? shirt : shirt
        );
        upper.position.y = -0.2 * sc; ag.add(upper);
        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sc, 6, 5), skin);
        elbow.position.y = -0.45 * sc; ag.add(elbow);
        const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.04 * sc, 0.32 * sc, 5, 7), skin);
        fore.position.y = -0.68 * sc; ag.add(fore);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035 * sc, 6, 5), skin);
        hand.position.y = -0.88 * sc; hand.scale.set(1, 0.7, 1.1); ag.add(hand);
        ag.position.set(zSign * 0.25 * sc, 1.42 * sc + baseY, 0);
        return ag;
    }
    const pArmR = personArm(1);
    const pArmL = personArm(-1);
    person.add(pArmR); person.add(pArmL);

    // --- NECK ---
    const pNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * sc, 0.08 * sc, 0.12 * sc, 8), skin);
    pNeck.position.y = 1.6 * sc + baseY;
    person.add(pNeck);

    // --- HEAD ---
    const headG = new THREE.Group();
    headG.position.y = 1.82 * sc * headRatio + baseY;
    person.add(headG);

    const hs = 0.22 * sc * headRatio;
    const pSkull = new THREE.Mesh(new THREE.SphereGeometry(hs, 14, 10), skin);
    pSkull.scale.set(1, 1.05, 0.95);
    headG.add(pSkull);

    // Eyes
    for (const ez of [hs * 0.5, -hs * 0.5]) {
        const eyeG = new THREE.Group();
        const ew = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.22, 8, 6), mat(0xfefefe));
        eyeG.add(ew);
        const ei = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.14, 6, 5), mat(0x3a2a18));
        ei.position.x = hs * 0.12; eyeG.add(ei);
        const ep = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.08, 5, 4), mat(0x050505));
        ep.position.x = hs * 0.18; eyeG.add(ep);
        const ecl = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.04, 3, 3), mat(0xffffff));
        ecl.position.set(hs * 0.19, hs * 0.05, hs * 0.03); eyeG.add(ecl);
        eyeG.position.set(hs * 0.7, hs * 0.2, ez);
        headG.add(eyeG);
    }

    // Eyebrows
    for (const ez of [hs * 0.5, -hs * 0.5]) {
        const brow = new THREE.Mesh(new THREE.BoxGeometry(hs * 0.4, hs * 0.07, hs * 0.08), mat(o.hairColor));
        brow.position.set(hs * 0.65, hs * 0.55, ez);
        headG.add(brow);
    }

    // Nose
    const pNose = new THREE.Mesh(new THREE.ConeGeometry(hs * 0.12, hs * 0.25, 6), skin);
    pNose.rotation.x = -Math.PI / 2;
    pNose.position.set(hs * 0.95, 0, 0);
    headG.add(pNose);

    // Mouth
    const pMouth = new THREE.Mesh(
        new THREE.TorusGeometry(hs * 0.12, hs * 0.03, 4, 8, Math.PI),
        new THREE.MeshPhongMaterial({ color: 0xcc8868 })
    );
    pMouth.rotation.z = Math.PI;
    pMouth.position.set(hs * 0.7, -hs * 0.45, 0);
    headG.add(pMouth);

    // Ears
    for (const ez of [1, -1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.2, 6, 5), skin);
        ear.position.set(-hs * 0.1, 0, ez * hs * 0.92);
        ear.scale.set(0.5, 0.8, 0.6);
        headG.add(ear);
    }

    // Hair
    if (o.hairStyle === 'short') {
        const hTop = new THREE.Mesh(
            new THREE.SphereGeometry(hs * 1.08, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            hair
        );
        hTop.position.y = hs * 0.05;
        headG.add(hTop);
    } else if (o.hairStyle === 'long') {
        const hTop = new THREE.Mesh(
            new THREE.SphereGeometry(hs * 1.08, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            hair
        );
        hTop.position.y = hs * 0.05; headG.add(hTop);
        const hBack = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.4, hs * 1.2, 6, 8), hair);
        hBack.position.set(-hs * 0.2, -hs * 0.4, 0); headG.add(hBack);
        // Bangs
        const bangs = new THREE.Mesh(new THREE.BoxGeometry(hs * 0.15, hs * 0.4, hs * 1.4), hair);
        bangs.position.set(hs * 0.5, hs * 0.35, 0); headG.add(bangs);
    } else if (o.hairStyle === 'ponytail') {
        const hTop = new THREE.Mesh(
            new THREE.SphereGeometry(hs * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            hair
        );
        hTop.position.y = hs * 0.05; headG.add(hTop);
        // Ponytail
        const tail = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.12, hs * 1, 5, 6), hair);
        tail.position.set(-hs * 0.4, -hs * 0.2, 0); tail.rotation.z = 0.5;
        headG.add(tail);
        // Hair tie
        const tie = new THREE.Mesh(new THREE.TorusGeometry(hs * 0.14, hs * 0.03, 4, 8), mat(0xff4466));
        tie.rotation.x = Math.PI / 2;
        tie.position.set(-hs * 0.25, hs * 0.1, 0); headG.add(tie);
    } else if (o.hairStyle === 'curly') {
        for (let ci = 0; ci < 16; ci++) {
            const curl = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.2, 5, 4), hair);
            const ca = (ci / 16) * Math.PI * 2;
            const cr = hs * 0.75;
            curl.position.set(
                Math.cos(ca) * cr * 0.6,
                hs * 0.35 + Math.sin(ci * 1.3) * hs * 0.15,
                Math.sin(ca) * cr
            );
            headG.add(curl);
        }
    } else if (o.hairStyle === 'bun') {
        const hTop = new THREE.Mesh(
            new THREE.SphereGeometry(hs * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            hair
        );
        hTop.position.y = hs * 0.05; headG.add(hTop);
        const bun = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.3, 8, 6), hair);
        bun.position.set(-hs * 0.3, hs * 0.5, 0); headG.add(bun);
    }

    // Backpack
    if (o.hasBackpack) {
        const bpG = new THREE.Group();
        const bpPts2 = [
            new THREE.Vector2(0, -0.25 * sc),
            new THREE.Vector2(0.15 * sc, -0.2 * sc),
            new THREE.Vector2(0.18 * sc, 0),
            new THREE.Vector2(0.14 * sc, 0.2 * sc),
            new THREE.Vector2(0, 0.25 * sc),
        ];
        const bpGeo2 = new THREE.LatheGeometry(bpPts2, 8);
        const bpMesh = new THREE.Mesh(bpGeo2, mat(0x3a5577));
        bpMesh.rotation.x = Math.PI / 2;
        bpG.add(bpMesh);
        for (const zs of [0.08 * sc, -0.08 * sc]) {
            const st = new THREE.Mesh(new THREE.BoxGeometry(0.03 * sc, 0.35 * sc, 0.04 * sc), mat(0x2a4466));
            st.position.set(0.12 * sc, 0.1 * sc, zs); bpG.add(st);
        }
        bpG.position.set(-0.18 * sc, 1.15 * sc + baseY, 0);
        person.add(bpG);
    }

    // Book bag (carried at side)
    if (o.hasBag) {
        const bag = new THREE.Group();
        const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.2 * sc, 0.28 * sc, 0.06 * sc), mat(0x884422));
        bag.add(bagBody);
        const bagFlap = new THREE.Mesh(new THREE.BoxGeometry(0.2 * sc, 0.04 * sc, 0.07 * sc), mat(0x773318));
        bagFlap.position.y = 0.14 * sc; bag.add(bagFlap);
        bag.position.set(0.22 * sc, 0.85 * sc + baseY, 0.15 * sc);
        person.add(bag);
    }

    person.userData.legGroups = [pLegR, pLegL];
    person.userData.armGroups = [pArmR, pArmL];
    return person;
}

/* People per stop */
const peopleConfigs = [
    // School — uniformed children
    [
        { isChild: true, shirtColor: 0xffffff, pantsColor: 0x1e2e4a, hairStyle: 'short', hairColor: 0x1a0a00, hasBackpack: true, skinTone: 0xd4a574 },
        { isChild: true, shirtColor: 0xffffff, pantsColor: 0x1e2e4a, hairStyle: 'ponytail', hairColor: 0x2a1a0a, hasBag: true, skinTone: 0xe8b98c },
        { isChild: true, shirtColor: 0xffffff, pantsColor: 0x1e2e4a, hairStyle: 'curly', hairColor: 0x1a0800, hasBackpack: true, skinTone: 0xc08a60 },
        { isChild: true, shirtColor: 0xffffff, pantsColor: 0x1e2e4a, hairStyle: 'short', hairColor: 0x3a2a1a, skinTone: 0xe0b090, shoeColor: 0x0a0a0a },
        { isChild: true, shirtColor: 0xffffff, pantsColor: 0x1e2e4a, hairStyle: 'long', hairColor: 0x0a0800, hasBag: true, skinTone: 0xd4a574 },
        { isChild: true, shirtColor: 0xffffff, pantsColor: 0x1e2e4a, hairStyle: 'bun', hairColor: 0x1a0a00, skinTone: 0xe8c0a0 },
    ],
    // PU College
    [
        { shirtColor: 0x5577aa, pantsColor: 0x2a2a3a, hairStyle: 'short', hasBackpack: true, skinTone: 0xe8b98c },
        { shirtColor: 0xaa5555, pantsColor: 0x2a2a3a, hairStyle: 'long', hairColor: 0x4a2a1a, skinTone: 0xd4a574 },
        { shirtColor: 0x55aa77, pantsColor: 0x3a4a5a, hairStyle: 'ponytail', hairColor: 0x1a0a00, hasBag: true, skinTone: 0xc08a60 },
        { shirtColor: 0x8866aa, pantsColor: 0x3a3a4a, hairStyle: 'curly', hairColor: 0x2a1a0a, skinTone: 0xe0b090 },
        { shirtColor: 0xcc9955, pantsColor: 0x2a3a4a, hairStyle: 'bun', hairColor: 0x1a0800, hasBackpack: true, skinTone: 0xd4a070 },
    ],
    // BCA
    [
        { shirtColor: 0x3388aa, pantsColor: 0x1a1a2a, hairStyle: 'short', hasBackpack: true, skinTone: 0xe8b98c },
        { shirtColor: 0xcc7744, pantsColor: 0x3a3a5a, hairStyle: 'long', hairColor: 0x3a2a1a, hasBag: true, skinTone: 0xd4a574 },
        { shirtColor: 0x44aa66, pantsColor: 0x2a2a3a, hairStyle: 'curly', hairColor: 0x0a0800, skinTone: 0xc08a60 },
        { shirtColor: 0x7766cc, pantsColor: 0x2a2a3a, hairStyle: 'ponytail', hairColor: 0x2a1a0a, hasBackpack: true, skinTone: 0xe0b090 },
    ],
    // MCA
    [
        { shirtColor: 0x334455, pantsColor: 0x1a1a2a, hairStyle: 'short', hasBackpack: true, skinTone: 0xe8b98c, shoeColor: 0x1a1008 },
        { shirtColor: 0x886644, pantsColor: 0x2a2a3a, hairStyle: 'bun', hairColor: 0x2a1a0a, hasBag: true, skinTone: 0xd4a574, shoeColor: 0x2a1a10 },
        { shirtColor: 0x556677, pantsColor: 0x1a1a1a, hairStyle: 'short', hairColor: 0x1a0a00, skinTone: 0xe0b090 },
        { shirtColor: 0x445566, pantsColor: 0x2a2a3a, hairStyle: 'long', hairColor: 0x3a2a1a, hasBackpack: true, skinTone: 0xc08a60 },
    ],
];

STOPS.forEach((s, si) => {
    const configs = peopleConfigs[si];
    configs.forEach((cfg, i) => {
        const person = buildDetailedPerson(cfg);
        const spread = configs.length > 4 ? 3.5 : 4.5;
        person.position.set(
            s.at + (i - Math.floor(configs.length / 2)) * spread,
            0,
            srand() > 0.5 ? -(8 + srand() * 5) : (7 + srand() * 4)
        );
        person.scale.setScalar(0.85);
        person.userData.baseX = person.position.x;
        person.userData.walkRange = 2 + srand() * 3;
        person.userData.speed = 0.4 + srand() * 0.8;
        person.userData.phase = srand() * Math.PI * 2;
        walkers.push(person);
        scene.add(person);
    });
});

/* ===== AMBIENT: FIREFLIES (night only) ===== */
const fireflyGeo = new THREE.SphereGeometry(0.08, 4, 3);
const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
const fireflies = [];
_seed = 111;
for (let i = 0; i < 60; i++) {
    const ff = new THREE.Mesh(fireflyGeo, fireflyMat.clone());
    ff.position.set(
        srand() * ROAD_END,
        1 + srand() * 6,
        -15 + srand() * 30
    );
    ff.userData = {
        basePos: ff.position.clone(),
        phase: srand() * Math.PI * 2,
        speed: 0.5 + srand() * 1.5,
        range: 1 + srand() * 2
    };
    ff.visible = false;
    fireflies.push(ff);
    scene.add(ff);
}

/* ===== AMBIENT: FALLING LEAVES ===== */
const leafGeo = new THREE.PlaneGeometry(0.3, 0.2);
const leafColors = [0x8b5a2b, 0xcc8844, 0x6a8a3a, 0xaa6633, 0xddaa44];
const leaves = [];
_seed = 222;
for (let i = 0; i < 50; i++) {
    const lmat = new THREE.MeshBasicMaterial({
        color: leafColors[Math.floor(srand() * leafColors.length)],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const leaf = new THREE.Mesh(leafGeo, lmat);
    leaf.position.set(
        srand() * ROAD_END,
        8 + srand() * 10,
        -10 + srand() * 20
    );
    leaf.userData = {
        fallSpeed: 0.5 + srand() * 1,
        swaySpeed: 1 + srand() * 2,
        swayAmp: 0.5 + srand() * 1,
        phase: srand() * Math.PI * 2,
        startY: leaf.position.y,
        startX: leaf.position.x
    };
    leaves.push(leaf);
    scene.add(leaf);
}

/* ===== THEME ===== */
function applyTheme() {
    const dark = document.documentElement.dataset.theme !== 'light';
    P = dark ? PALETTE.night : PALETTE.day;
    scene.background = new THREE.Color(P.sky);
    scene.fog = new THREE.Fog(P.fog, 60, 240);
    hemi.color.setHex(P.hemi); hemi.groundColor.setHex(P.hemiG); hemi.intensity = P.ambI;
    sun.color.setHex(P.sun); sun.intensity = P.sunI;
    sun.position.set(dark ? 40 : -40, dark ? 70 : 60, dark ? -20 : 30);
    groundMat.color.setHex(P.ground);
    roofMat.color.setHex(P.roof);
    lamp.intensity = dark ? 55 : 0;
    rim.intensity = dark ? 0.15 : 0.3;
    renderer.toneMappingExposure = dark ? 0.9 : 1.1;

    for (const m of winMats) m.color.setHex(dark ? 0xffd98a : 0x2a3550);
    for (const m of glowMats) m.emissive.setHex(dark ? 0xffcf80 : 0x000000);
    if (atriaGlass) { atriaGlass.emissive.setHex(dark ? 0x173a63 : 0x000000); atriaGlass.color.setHex(dark ? 0x3a6fa8 : 0x4a8fd0); }
    for (const lp of lampPosts) lp.intensity = dark ? 12 : 0;
    // Street light glow effects
    for (const gm of lampGlows) {
        if (gm.material.isMeshBasicMaterial && gm.geometry.type === 'SphereGeometry') {
            // Bulb: swap to glowing material
            gm.material = dark ? lampBulbMatOn : lampBulbMatOff;
        } else if (gm.material.isMeshBasicMaterial && gm.geometry.type === 'ConeGeometry') {
            // Light cone
            gm.material.opacity = dark ? 0.06 : 0;
        } else if (gm.material.isMeshBasicMaterial && gm.geometry.type === 'CircleGeometry') {
            // Ground glow
            gm.material.opacity = dark ? 0.12 : 0;
        }
    }
    for (const ff of fireflies) ff.visible = dark;

    drawFrame();
}

/* ===== SCROLL ===== */
let progress = 0;
let animTime = 0;

function readProgress() {
    const r = rail.getBoundingClientRect();
    const span = r.height - innerHeight;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / span));
}

function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / Math.max(1, h);
    cam.updateProjectionMatrix();
}

function drawFrame() {
    const dark = document.documentElement.dataset.theme !== 'light';
    const dt = clock.getDelta();
    animTime += dt;

    const x = progress * ROAD_END;

    // Rider position
    rider.position.x = x;
    const wheelSpin = -x * 0.85;
    for (const wl of rider.userData.wheels) {
        wl.rotation.z = wheelSpin;
    }
    // Leg pedalling — legs pivot from hip joint, creating natural cycling motion
    if (rider.userData.legs) {
        const pedal = x * 1.6;
        // Rock the whole leg group (thigh + knee + shin + shoe move together)
        rider.userData.legs[0].rotation.x = Math.sin(pedal) * 0.45;
        rider.userData.legs[1].rotation.x = Math.sin(pedal + Math.PI) * 0.45;
    }
    // Crank + pedal rotation
    if (rider.userData.cranks) {
        const cAngle = x * 1.6;
        rider.userData.cranks[0].rotation.z = cAngle;
        rider.userData.cranks[1].rotation.z = cAngle + Math.PI;
        rider.userData.cranks[2].position.y = 1.4 - 0.55 * Math.cos(cAngle);
        rider.userData.cranks[2].position.x = 0.55 * Math.sin(cAngle);
        rider.userData.cranks[3].position.y = 1.4 - 0.55 * Math.cos(cAngle + Math.PI);
        rider.userData.cranks[3].position.x = 0.55 * Math.sin(cAngle + Math.PI);
    }
    // Gentle rider bob (subtle up/down from pedaling)
    rider.position.y = 0.15 + Math.abs(Math.sin(x * 1.6)) * 0.04;

    lamp.position.set(x, 9, 6);

    // Chase camera with slight sway
    const camSway = Math.sin(animTime * 0.5) * 0.3;
    cam.position.set(x - 15, 10 + camSway * 0.2, 30);
    cam.lookAt(x + 3, 3.5 + camSway * 0.1, -2);

    // Shadow camera follows rider
    sun.target.position.set(x, 0, 0);
    sun.target.updateMatrixWorld();
    sun.shadow.camera.left = x - 40;
    sun.shadow.camera.right = x + 40;

    // Animate birds
    if (!reduced) {
        for (const b of birds) {
            const d = b.userData;
            b.position.x += d.dir * d.speed * dt;
            b.position.y = d.baseY + Math.sin(animTime * d.flapSpeed + d.phase) * 2;
            // Wing flap
            if (b.children[0]) b.children[0].rotation.z = 0.3 + Math.sin(animTime * d.flapSpeed + d.phase) * 0.4;
            if (b.children[1]) b.children[1].rotation.z = -0.3 - Math.sin(animTime * d.flapSpeed + d.phase) * 0.4;
            // Wrap around
            if (b.position.x > ROAD_END + 30) b.position.x = -30;
            if (b.position.x < -30) b.position.x = ROAD_END + 30;
        }

        // Animate walkers
        for (const w of walkers) {
            const d = w.userData;
            w.position.x = d.baseX + Math.sin(animTime * d.speed + d.phase) * d.walkRange;
            // Segmented leg swing
            if (d.legGroups || w.userData.legGroups) {
                const legs = d.legGroups || w.userData.legGroups;
                const lswing = Math.sin(animTime * d.speed * 3 + d.phase);
                if (legs[0]) legs[0].rotation.x = lswing * 0.35;
                if (legs[1]) legs[1].rotation.x = -lswing * 0.35;
            }
            // Arm swing (opposite to legs)
            if (d.armGroups || w.userData.armGroups) {
                const arms = d.armGroups || w.userData.armGroups;
                const aswing = Math.sin(animTime * d.speed * 3 + d.phase);
                if (arms[0]) arms[0].rotation.x = -aswing * 0.25;
                if (arms[1]) arms[1].rotation.x = aswing * 0.25;
            }
            // Face walking direction
            const vx = Math.cos(animTime * d.speed + d.phase) * d.walkRange * d.speed;
            w.rotation.y = vx > 0 ? 0 : Math.PI;
        }

        // Animate fireflies
        if (dark) {
            for (const ff of fireflies) {
                const d = ff.userData;
                ff.position.x = d.basePos.x + Math.sin(animTime * d.speed + d.phase) * d.range;
                ff.position.y = d.basePos.y + Math.cos(animTime * d.speed * 0.7 + d.phase) * d.range * 0.5;
                ff.position.z = d.basePos.z + Math.sin(animTime * d.speed * 0.5 + d.phase * 2) * d.range * 0.3;
                // Pulse glow
                ff.material.opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(animTime * 3 + d.phase));
                ff.material.transparent = true;
            }
        }

        // Animate leaves
        for (const leaf of leaves) {
            const d = leaf.userData;
            leaf.position.y -= d.fallSpeed * dt;
            leaf.position.x = d.startX + Math.sin(animTime * d.swaySpeed + d.phase) * d.swayAmp;
            leaf.rotation.x = animTime * d.swaySpeed;
            leaf.rotation.z = Math.sin(animTime * d.swaySpeed * 0.5 + d.phase) * 0.5;
            // Reset when below ground
            if (leaf.position.y < 0) {
                leaf.position.y = d.startY + 5;
                leaf.position.x = d.startX;
            }
        }
    }

    const flag = buildings[0] && buildings[0].userData.flag;
    if (flag && !reduced) {
        const p = flag.geometry.attributes.position;
        for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * 2.2 - animTime * 4) * 0.14 * (p.getX(k) + 1.2) / 2.4);
        p.needsUpdate = true;
    }

    renderer.render(scene, cam);
}

function onScroll() {
    progress = readProgress();
    drawFrame();
    fill.style.width = (progress * 100).toFixed(1) + '%';
    stage.classList.toggle('is-riding', progress > 0.02);

    const x = progress * ROAD_END;
    let near = 0, best = 1e9;
    STOPS.forEach((s, i) => {
        const d = Math.abs(s.at - x);
        if (d < best) { best = d; near = i; }
    });
    cards.forEach((c, i) => c.classList.toggle('is-on', i === near && best < 30));
    stopLbl.textContent = `Stop ${near + 1} / ${STOPS.length} · ${STOPS[near].name}`;
}

/* ===== ANIMATION LOOP ===== */
let isInView = false;
const viewObserver = new IntersectionObserver((entries) => {
    isInView = entries[0].isIntersecting;
}, { threshold: 0.05 });
viewObserver.observe(rail);

function animate() {
    requestAnimationFrame(animate);
    if (!isInView || reduced) return;
    drawFrame();
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { layout(); onScroll(); }, { passive: true });

new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
});

layout();
applyTheme();
onScroll();
animate(); // continuous animation loop for birds, leaves, people

if (reduced) { progress = 0; drawFrame(); cards[0].classList.add('is-on'); }

window.__eduWorld = {
    draw: onScroll, layout,
    stops: STOPS.length,
    setProgress(p) {
        progress = Math.min(1, Math.max(0, p));
        drawFrame();
        fill.style.width = (progress * 100).toFixed(1) + '%';
        const x = progress * ROAD_END;
        let near = 0, best = 1e9;
        STOPS.forEach((s, i) => { const d = Math.abs(s.at - x); if (d < best) { best = d; near = i; } });
        cards.forEach((c, i) => c.classList.toggle('is-on', i === near && best < 30));
        stopLbl.textContent = `Stop ${near + 1} / ${STOPS.length} · ${STOPS[near].name}`;
        return near;
    },
    goTo(i) { return this.setProgress((STOPS[i] ? STOPS[i].at : 0) / ROAD_END); }
};
