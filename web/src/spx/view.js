/*
 * 103 SPX in 3D (three.js): Montceau-les-Mines from the Parc du Petit Bois to
 * Panda's house, built from the route (route.js), and everything on the road
 * drawn from the rules' state (rules.js). Low-poly, flat-coloured, one merged
 * mesh per vehicle or person so a phone keeps up.
 *
 *   const view = createView({ canvas, rules, tier, castUrl });
 *   view.update(dt); view.resize(w, h); view.event(name, data); view.dispose();
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { paintFace } from './faces.js';
import { SPOTS } from './rules.js';

const SKY_TOP = '#5fb0e6';
const HORIZON = '#f6d6b2';
const CAR_COLORS = ['#e94f37', '#3a86ff', '#f6ae2d', '#2ec4b6', '#f1f1f1', '#5c6470', '#8e5cc2', '#2d6a4f', '#c9a227'];
const BRICKS = ['#b5603f', '#a8553a', '#c17049', '#cfa77d', '#d9c39a', '#b98a6b', '#9c4f37', '#e0cfae'];
const ROOFS = ['#7d3a2c', '#5c3027', '#4c4f57', '#8b4532'];

/* ---------------- Geometry helpers ---------------- */

const tmpQ = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
}

/** A coloured copy of geom, moved by matrix m, ready to merge. */
function part(geom, color, m) {
  const g = geom.index ? geom.toNonIndexed() : geom.clone();
  if (m) g.applyMatrix4(m);
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}

/** A cylinder from a to b (arrays [x,y,z]). */
function tube(a, b, r, color, seg = 7) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const geom = new THREE.CylinderGeometry(r, r, len, seg);
  const dir = vb.clone().sub(va).normalize();
  tmpQ.setFromUnitVectors(UP, dir);
  const m = new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), tmpQ.clone(), new THREE.Vector3(1, 1, 1));
  return part(geom, color, m);
}

const box = (w, h, d, color, m) => part(new THREE.BoxGeometry(w, h, d), color, m);
const ball = (r, color, m, seg = 10) => part(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 3)), color, m);
const merge = (parts) => mergeGeometries(parts.filter(Boolean));

/* ---------------- Canvas textures ---------------- */

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  tex.anisotropy = 4;
  return tex;
}

function speckle(g, w, h, base, dots, n = 1400, size = 2) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    g.fillStyle = dots[i % dots.length];
    g.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
}

/** A label above someone: white text on a coloured pill. */
function labelTexture(text, bg = '#ef2d6b') {
  return canvasTexture(512, 128, (g) => {
    g.font = '800 64px Fredoka, system-ui, sans-serif';
    const w = Math.min(500, g.measureText(text).width + 60);
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect((512 - w) / 2, 14, w, 100, 50);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = '#ffffff';
    g.stroke();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 256, 68, 470);
  });
}

function sprite(map, w, h, opts = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, fog: opts.fog !== false, depthTest: opts.depthTest !== false }));
  s.scale.set(w, h, 1);
  if (opts.order) s.renderOrder = opts.order;
  return s;
}

/* ---------------- Models (forward is +Z) ---------------- */

function mopedGeometry(color, opts = {}) {
  const chrome = '#c9ced6';
  const dark = '#26282c';
  const p = [];
  for (const z of [-0.56, 0.6]) {
    p.push(part(new THREE.TorusGeometry(0.29, 0.05, 6, 18), dark, M(0, 0.32, z, 0, Math.PI / 2, 0)));
    p.push(part(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 12), '#9aa0a8', M(0, 0.32, z, 0, 0, Math.PI / 2)));
  }
  p.push(tube([0, 0.95, 0.42], [0, 0.42, -0.02], 0.045, color));
  p.push(tube([0, 0.42, -0.02], [0, 0.85, -0.45], 0.04, color));
  p.push(box(0.24, 0.3, 0.5, color, M(0, 0.62, -0.08, 0.15)));
  if (opts.decal) p.push(box(0.25, 0.16, 0.3, '#f4f4f4', M(0, 0.64, -0.12, 0.15)));
  p.push(box(0.27, 0.11, 0.62, opts.seat || '#2a2320', M(0, 0.86, -0.3)));
  p.push(box(0.24, 0.04, 0.32, chrome, M(0, 0.9, -0.72)));
  p.push(box(0.12, 0.05, 0.5, color, M(0, 0.66, -0.62, -0.4)));
  p.push(box(0.12, 0.05, 0.4, color, M(0, 0.66, 0.62, 0.35)));
  for (const x of [-0.07, 0.07]) p.push(tube([x, 0.98, 0.48], [x, 0.32, 0.6], 0.025, chrome));
  p.push(tube([-0.34, 1.12, 0.42], [0.34, 1.12, 0.42], 0.022, chrome));
  for (const x of [-0.32, 0.32]) p.push(tube([x * 0.86, 1.12, 0.42], [x, 1.12, 0.42], 0.035, dark));
  p.push(part(new THREE.CylinderGeometry(0.1, 0.08, 0.12, 10), chrome, M(0, 0.98, 0.58, Math.PI / 2)));
  p.push(part(new THREE.CircleGeometry(0.075, 10), '#fff6c8', M(0, 0.98, 0.645)));
  p.push(box(0.2, 0.22, 0.26, '#3a3d42', M(0, 0.38, 0.06)));
  p.push(tube([0.1, 0.34, 0.06], [0.15, 0.4, -0.62], 0.03, chrome));
  p.push(part(new THREE.CylinderGeometry(0.055, 0.045, 0.32, 8), chrome, M(0.15, 0.42, -0.7, Math.PI / 2)));
  for (const x of [-0.17, 0.17]) p.push(box(0.12, 0.03, 0.06, dark, M(x, 0.3, 0.05)));
  if (opts.solex) p.push(box(0.2, 0.2, 0.26, dark, M(0, 0.62, 0.66)));
  return merge(p);
}

/** A rider sitting on a moped. head: false leaves the head out (a face sprite goes there). */
function riderGeometry({ shirt, legs = '#3b5b8c', skin = '#efc4a2', hair = '#3b2a20', head = true, shoes = '#222222' }) {
  const p = [];
  p.push(part(new THREE.CapsuleGeometry(0.17, 0.34, 4, 8), shirt, M(0, 1.27, -0.12, 0.28)));
  for (const s of [-1, 1]) {
    p.push(tube([s * 0.2, 1.43, -0.04], [s * 0.27, 1.22, 0.22], 0.055, shirt));
    p.push(tube([s * 0.27, 1.22, 0.22], [s * 0.3, 1.12, 0.4], 0.045, skin));
    p.push(tube([s * 0.12, 0.95, -0.22], [s * 0.17, 0.93, 0.16], 0.075, legs));
    p.push(tube([s * 0.17, 0.93, 0.16], [s * 0.17, 0.42, 0.08], 0.065, legs));
    p.push(box(0.1, 0.07, 0.2, shoes, M(s * 0.17, 0.35, 0.12)));
  }
  if (head) {
    p.push(ball(0.165, skin, M(0, 1.66, -0.02)));
    p.push(ball(0.17, hair, M(0, 1.71, -0.06, 0, 0, 0, 1, 0.75, 1)));
    for (const s of [-1, 1]) p.push(ball(0.045, skin, M(s * 0.165, 1.64, -0.02)));
  }
  return merge(p);
}

function walkerGeometry({ coat, legs = '#4a4a52', skin = '#eebd9c', cane = false }) {
  const p = [];
  for (const s of [-1, 1]) {
    p.push(tube([s * 0.1, 0.9, 0], [s * 0.11, 0.08, 0.02], 0.07, legs));
    p.push(box(0.12, 0.08, 0.24, '#2a2523', M(s * 0.11, 0.04, 0.06)));
    p.push(tube([s * 0.22, 1.42, 0], [s * 0.3, 0.98, 0.12], 0.055, coat));
  }
  p.push(part(new THREE.CapsuleGeometry(0.2, 0.42, 4, 8), coat, M(0, 1.2, 0, 0.08)));
  if (cane) p.push(tube([0.32, 0.98, 0.14], [0.36, 0.02, 0.22], 0.025, '#5a3b22'));
  p.push(ball(0.05, skin, M(0.3, 0.96, 0.12)));
  return merge(p);
}

function seatedGeometry({ shirt, legs }) {
  const p = [];
  p.push(part(new THREE.CapsuleGeometry(0.19, 0.36, 4, 8), shirt, M(0, 0.95, -0.05, -0.1)));
  for (const s of [-1, 1]) {
    p.push(tube([s * 0.11, 0.62, 0], [s * 0.12, 0.62, 0.42], 0.08, legs));
    p.push(tube([s * 0.12, 0.62, 0.42], [s * 0.12, 0.08, 0.46], 0.07, legs));
    p.push(tube([s * 0.22, 1.12, 0], [s * 0.26, 0.8, 0.25], 0.055, shirt));
  }
  return merge(p);
}

function carGeometry(color, police = false) {
  const p = [];
  const glass = '#2c3e50';
  p.push(box(1.7, 0.62, 4.0, color, M(0, 0.58, 0)));
  p.push(box(1.52, 0.5, 2.0, glass, M(0, 1.13, -0.25)));
  p.push(box(1.54, 0.08, 1.9, color, M(0, 1.41, -0.25)));
  for (const x of [-0.74, 0.74]) p.push(box(0.06, 0.48, 0.12, color, M(x, 1.13, 0.72)));
  for (const [x, z] of [[-0.78, 1.25], [0.78, 1.25], [-0.78, -1.25], [0.78, -1.25]]) p.push(part(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12), '#1d1d1f', M(x, 0.32, z, 0, 0, Math.PI / 2)));
  p.push(box(1.74, 0.16, 0.14, '#8d939b', M(0, 0.36, 2.03)));
  p.push(box(1.74, 0.16, 0.14, '#8d939b', M(0, 0.36, -2.03)));
  for (const x of [-0.6, 0.6]) {
    p.push(box(0.32, 0.14, 0.04, '#fff3c4', M(x, 0.66, 2.01)));
    p.push(box(0.3, 0.14, 0.04, '#d6312b', M(x, 0.66, -2.01)));
  }
  if (police) {
    p.push(box(1.72, 0.18, 4.02, '#1f4fa8', M(0, 0.62, 0)));
    p.push(box(1.72, 0.06, 4.02, '#e23b3b', M(0, 0.73, 0)));
    p.push(box(1.0, 0.12, 0.3, '#2b2b2b', M(0, 1.5, -0.1)));
  }
  return merge(p);
}

function benchGeometry() {
  const wood = '#9a6a3c';
  const iron = '#2f3a3f';
  const p = [];
  p.push(box(2.0, 0.06, 0.45, wood, M(0, 0.48, 0)));
  p.push(box(2.0, 0.4, 0.06, wood, M(0, 0.8, -0.22, -0.15)));
  for (const x of [-0.85, 0.85]) {
    p.push(box(0.06, 0.48, 0.42, iron, M(x, 0.24, 0)));
    p.push(box(0.06, 0.5, 0.06, iron, M(x, 0.75, -0.2)));
  }
  for (const [x, z] of [[-0.3, 0.3], [0.1, 0.35], [0.5, 0.28], [0.95, 0.25]]) p.push(part(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8), '#c8102e', M(x, 0.06, z)));
  return merge(p);
}

function canGeometry() {
  return merge([
    part(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), '#c8102e', M(0, 0.16, 0, 0, 0, Math.PI / 2)),
    part(new THREE.CylinderGeometry(0.112, 0.112, 0.08, 12), '#e4b43a', M(0, 0.16, 0, 0, 0, Math.PI / 2)),
  ]);
}

function legGeometry() {
  return merge([part(new THREE.CylinderGeometry(0.07, 0.06, 0.9, 8), '#8a5a2b', M(0, 0.08, 0, 0, 0.6, Math.PI / 2)), box(0.2, 0.05, 0.2, '#5f3d1d', M(0.33, 0.08, -0.25, 0, 0.6, 0))]);
}

function stars() {
  return canvasTexture(128, 128, (g) => {
    g.translate(64, 64);
    g.fillStyle = '#ffd23f';
    g.strokeStyle = '#6b4a00';
    g.lineWidth = 5;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 22 : 54;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.stroke();
  });
}

/* ---------------- The view ---------------- */

export function createView({ canvas, rules, tier = 1, castUrl = (id) => `./cast/${id}.svg`, texts = (k) => k }) {
  const st = rules.state;
  const route = rules.route;
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier >= 2, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier >= 2 ? 1.75 : 1.4));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HORIZON);
  scene.fog = new THREE.Fog(HORIZON, 38, 175);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 600);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6f7a4a, 1.9));
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.6);
  sun.position.set(-60, 90, 40);
  scene.add(sun);

  const lambert = (opts) => keep(new THREE.MeshLambertMaterial(opts));
  const VC = lambert({ vertexColors: true });

  /* ---- Faces ---- */
  const loader = new THREE.TextureLoader();
  const castTextures = new Map();
  function castTexture(id) {
    if (!castTextures.has(id)) {
      const tex = keep(loader.load(castUrl(id)));
      tex.colorSpace = THREE.SRGBColorSpace;
      castTextures.set(id, tex);
    }
    return castTextures.get(id);
  }
  function castSprite(id, size) {
    return sprite(castTexture(id), size, size * 1.22);
  }
  const faceTextures = new Map();
  function faceSprite(id, size, variant = 0) {
    const key = id + variant;
    if (!faceTextures.has(key)) {
      const tex = keep(new THREE.CanvasTexture(paintFace(id, variant)));
      tex.colorSpace = THREE.SRGBColorSpace;
      faceTextures.set(key, tex);
    }
    return sprite(faceTextures.get(key), size, size * 1.25);
  }
  const labelCache = new Map();
  function label(text, bg) {
    if (!labelCache.has(text)) labelCache.set(text, keep(labelTexture(text, bg)));
    const s = sprite(labelCache.get(text), 2.6, 0.65);
    return s;
  }

  /* ---- Ground, sky ---- */
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < route.xs.length; i++) {
    minX = Math.min(minX, route.xs[i]);
    maxX = Math.max(maxX, route.xs[i]);
    minZ = Math.min(minZ, route.zs[i]);
    maxZ = Math.max(maxZ, route.zs[i]);
  }
  const grassTex = keep(canvasTexture(256, 256, (g, w, h) => speckle(g, w, h, '#8fa45e', ['#7f9552', '#9db36a', '#86994f', '#a7b874'], 2600, 3), true));
  const groundW = maxX - minX + 500;
  const groundD = maxZ - minZ + 500;
  grassTex.repeat.set(groundW / 12, groundD / 12);
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(groundW, groundD)), lambert({ map: grassTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((minX + maxX) / 2, -0.03, (minZ + maxZ) / 2);
  scene.add(ground);

  const skyTex = keep(
    canvasTexture(2048, 512, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, SKY_TOP);
      grad.addColorStop(0.62, '#a9d3ec');
      grad.addColorStop(0.78, HORIZON);
      grad.addColorStop(1, HORIZON);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      const horizon = h * 0.79;
      // Clouds
      g.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 14; i++) {
        const x = (i * 157) % w;
        const y = 60 + ((i * 53) % 160);
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          g.ellipse(x + k * 34, y - (k % 2) * 12, 46, 20, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      // Far hills
      g.fillStyle = '#a7b38a';
      g.beginPath();
      g.moveTo(0, horizon);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, horizon - 30 - 22 * Math.sin(x / 140) - 14 * Math.sin(x / 57));
      g.lineTo(w, horizon);
      g.fill();
      // Town silhouettes: houses, a church spire, chimneys and mine headframes (chevalements)
      g.fillStyle = '#7f8a73';
      for (let x = 0; x < w; x += 46) {
        const hh = 18 + ((x * 7) % 26);
        g.fillRect(x, horizon - hh, 38, hh);
        g.beginPath();
        g.moveTo(x - 3, horizon - hh);
        g.lineTo(x + 19, horizon - hh - 14);
        g.lineTo(x + 41, horizon - hh);
        g.fill();
      }
      const headframe = (x) => {
        g.strokeStyle = '#5d6656';
        g.lineWidth = 7;
        g.beginPath();
        g.lineWidth = 5;
        g.moveTo(x - 26, horizon);
        g.lineTo(x, horizon - 92);
        g.lineTo(x + 26, horizon);
        g.moveTo(x - 17, horizon - 32);
        g.lineTo(x + 17, horizon - 32);
        g.moveTo(x - 9, horizon - 62);
        g.lineTo(x + 9, horizon - 62);
        g.moveTo(x - 19, horizon - 32);
        g.lineTo(x + 10, horizon - 62);
        g.moveTo(x, horizon - 92);
        g.lineTo(x + 44, horizon);
        g.stroke();
        g.lineWidth = 4;
        g.beginPath();
        g.arc(x, horizon - 97, 12, 0, Math.PI * 2);
        g.stroke();
      };
      headframe(380);
      headframe(1420);
      g.fillStyle = '#5d6656';
      const spire = (x) => {
        g.fillRect(x - 16, horizon - 90, 32, 90);
        g.beginPath();
        g.moveTo(x - 20, horizon - 90);
        g.lineTo(x, horizon - 170);
        g.lineTo(x + 20, horizon - 90);
        g.fill();
      };
      spire(900);
      for (const x of [640, 1180, 1880]) g.fillRect(x, horizon - 120, 14, 120);
    })
  );
  const sky = new THREE.Mesh(keep(new THREE.CylinderGeometry(330, 330, 200, 48, 1, true)), keep(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })));
  sky.renderOrder = -10;
  // The horizon line of the texture (79% down) sits at eye level
  sky.position.y = 200 * (0.5 - 0.21) - 6;
  scene.add(sky);

  /* ---- Road, pavements, kerbs ---- */
  const asphalt = keep(canvasTexture(128, 128, (g, w, h) => speckle(g, w, h, '#5b5d63', ['#4d4f55', '#686a70', '#55575c', '#717379'], 1800, 2), true));
  const paveTex = keep(
    canvasTexture(128, 128, (g, w, h) => {
      speckle(g, w, h, '#c9c2b5', ['#bdb5a7', '#d3cdc1'], 600, 2);
      g.strokeStyle = '#ada597';
      g.lineWidth = 2;
      for (let k = 0; k <= 128; k += 32) {
        g.beginPath();
        g.moveTo(0, k);
        g.lineTo(128, k);
        g.moveTo(k, 0);
        g.lineTo(k, 128);
        g.stroke();
      }
    }, true)
  );

  function ribbon(from, to, y, uScale, vScale, step = 2, yOuter = y) {
    const pos = [];
    const uv = [];
    const idx = [];
    let n = 0;
    for (let s = 0; s <= route.length; s += step) {
      const a = route.at(s, from);
      const b = route.at(s, to);
      pos.push(a.x, y, a.z, b.x, yOuter, b.z);
      uv.push(0, s / vScale, uScale, s / vScale);
      if (n > 0) {
        const i = n * 2;
        idx.push(i - 2, i, i - 1, i - 1, i, i + 1);
      }
      n++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return keep(g);
  }
  const roadMat = lambert({ map: asphalt });
  // Ribbons wind left or right depending on the side: draw both faces
  roadMat.side = THREE.DoubleSide;
  scene.add(new THREE.Mesh(ribbon(-3.5, 3.5, 0, 2, 7), roadMat));
  const paveMat = lambert({ map: paveTex, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(ribbon(3.5, 5.6, 0.12, 1, 2.1), paveMat));
  scene.add(new THREE.Mesh(ribbon(-5.6, -3.5, 0.12, 1, 2.1), paveMat));
  const kerbMat = lambert({ color: '#a39d93', side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const g = ribbon(side * 3.5, side * 3.5, 0, 1, 2, 2, 0.12);
    scene.add(new THREE.Mesh(g, kerbMat));
  }
  // Centre dashes (none on the ring)
  {
    const pos = [];
    const ring = route.ring;
    for (let s = 6; s < route.length - 25; s += 9) {
      if (ring && s > ring.s0 - 6 && s < ring.s1 + 4) continue;
      const a0 = route.at(s, -0.07);
      const b0 = route.at(s, 0.07);
      const a1 = route.at(s + 4, -0.07);
      const b1 = route.at(s + 4, 0.07);
      pos.push(a0.x, 0.015, a0.z, b0.x, 0.015, b0.z, a1.x, 0.015, a1.z, b0.x, 0.015, b0.z, b1.x, 0.015, b1.z, a1.x, 0.015, a1.z);
    }
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    scene.add(new THREE.Mesh(g, keep(new THREE.MeshBasicMaterial({ color: '#efeee8', side: THREE.DoubleSide }))));
  }

  /* ---- The ZUP roundabout and the Lac du Plessis ---- */
  const ring = route.ring;
  let viewLake = null;
  if (ring) {
    const r = ring.r;
    const ringRoad = new THREE.Mesh(keep(new THREE.RingGeometry(r - 3.6, r + 3.6, 56)), roadMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.set(ring.cx, -0.005, ring.cz);
    scene.add(ringRoad);
    const outer = new THREE.Mesh(keep(new THREE.RingGeometry(r + 3.6, r + 5.8, 56)), paveMat);
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(ring.cx, 0.1, ring.cz);
    scene.add(outer);
    const island = merge([
      part(new THREE.CylinderGeometry(r - 3.6, r - 3.6, 0.3, 40), '#a39d93', M(0, 0.15, 0)),
      part(new THREE.CylinderGeometry(r - 4.1, r - 4.1, 0.32, 40), '#7fa04f', M(0, 0.17, 0)),
      // The mine wagon (berline) on its rails, Montceau's mining past
      box(3.2, 0.12, 0.3, '#5b4a3a', M(0, 0.4, -0.5)),
      box(3.2, 0.12, 0.3, '#5b4a3a', M(0, 0.4, 0.5)),
      box(1.8, 0.9, 1.1, '#6e4b33', M(0, 1.0, 0)),
      box(1.9, 0.1, 1.2, '#2f2f33', M(0, 1.48, 0)),
      ...[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z]) => part(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10), '#2f2f33', M(x, 0.55, z, Math.PI / 2))),
      part(new THREE.SphereGeometry(0.6, 8, 6), '#2a2a2e', M(0, 1.6, 0, 0, 0, 0, 1, 0.5, 0.7)),
      ...Array.from({ length: 14 }, (_, i) => ball(0.35, ['#e94f6b', '#ffd23f', '#ffffff'][i % 3], M(Math.cos(i) * (r - 6), 0.45, Math.sin(i) * (r - 6)), 6)),
    ]);
    keep(island);
    const islandMesh = new THREE.Mesh(island, VC);
    islandMesh.position.set(ring.cx, 0, ring.cz);
    scene.add(islandMesh);
    // The lake, east-south-east of the roundabout (as on the map)
    const water = keep(
      canvasTexture(256, 256, (g, w, h) => {
        speckle(g, w, h, '#3d8fb8', ['#58a6cb', '#357fa5', '#7cc0de'], 900, 3);
      }, true)
    );
    water.repeat.set(6, 6);
    const lakeDir = new THREE.Vector2(0.94, 0.34).normalize();
    let lakeDist = r + 48;
    const clear = (x, z, need) => {
      for (let s = 0; s < route.length; s += 3) {
        const p = route.at(s);
        if (Math.hypot(p.x - x, p.z - z) < need) return false;
      }
      return true;
    };
    while (!clear(ring.cx + lakeDir.x * lakeDist, ring.cz + lakeDir.y * lakeDist, 40) && lakeDist < 160) lakeDist += 6;
    const lake = new THREE.Mesh(keep(new THREE.CircleGeometry(32, 40)), lambert({ map: water }));
    lake.rotation.x = -Math.PI / 2;
    lake.scale.set(1, 0.62, 1);
    lake.position.set(ring.cx + lakeDir.x * lakeDist, 0.02, ring.cz + lakeDir.y * lakeDist);
    scene.add(lake);
    viewLake = { mesh: lake, tex: water };
    const lakeSign = plaque('LAC DU PLESSIS', '#2f6b3a');
    const lp = route.at(ring.s0 - 2, 5.0);
    lakeSign.position.set(lp.x, 0, lp.z);
    lakeSign.rotation.y = lp.heading + Math.PI;
    scene.add(lakeSign);
  }

  /* ---- Street plaques (blue enamel, white letters) ---- */
  function plaque(text, color = '#1f4fa0') {
    const tex = keep(
      canvasTexture(512, 140, (g, w, h) => {
        g.fillStyle = '#e9efe6';
        g.beginPath();
        g.roundRect(0, 0, w, h, 18);
        g.fill();
        g.fillStyle = '#2d7a4b';
        g.beginPath();
        g.roundRect(6, 6, w - 12, h - 12, 14);
        g.fill();
        g.fillStyle = color;
        g.beginPath();
        g.roundRect(14, 14, w - 28, h - 28, 10);
        g.fill();
        g.strokeStyle = '#e9efe6';
        g.lineWidth = 4;
        g.beginPath();
        g.roundRect(22, 22, w - 44, h - 44, 8);
        g.stroke();
        g.fillStyle = '#ffffff';
        g.font = '700 46px Fredoka, system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(text, w / 2, h / 2 + 2, w - 70);
      })
    );
    const grp = new THREE.Group();
    const board = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.4, 0.66)), lambert({ map: tex, side: THREE.DoubleSide }));
    board.position.y = 2.5;
    grp.add(board);
    const post = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6)), lambert({ color: '#4a4f55' }));
    post.position.y = 1.25;
    grp.add(post);
    return grp;
  }
  for (const sec of route.sections) {
    if (sec.ring) continue;
    const p = route.at(sec.s0 + 7, 4.7);
    const pl = plaque(sec.name.toUpperCase());
    pl.position.set(p.x, 0, p.z);
    pl.rotation.y = p.heading + Math.PI;
    scene.add(pl);
  }

  /* ---- Houses, hedges, trees, lamps ---- */
  const facade = keep(
    canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.08)';
      g.lineWidth = 2;
      for (let y = 0; y < h; y += 12) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
        for (let x = (y / 12) % 2 ? 0 : 14; x < w; x += 28) {
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x, y + 12);
          g.stroke();
        }
      }
      const win = (x, y, ww, hh) => {
        g.fillStyle = '#f4f1ea';
        g.fillRect(x - 6, y - 6, ww + 12, hh + 12);
        g.fillStyle = '#6f8fa8';
        g.fillRect(x, y, ww, hh);
        g.fillStyle = '#9bb8cc';
        g.fillRect(x + 4, y + 4, ww / 2 - 6, hh - 8);
        g.fillStyle = '#4f7f5a';
        g.fillRect(x - 22, y - 4, 14, hh + 8);
        g.fillRect(x + ww + 8, y - 4, 14, hh + 8);
      };
      win(44, 34, 46, 60);
      win(166, 34, 46, 60);
      win(44, 156, 46, 60);
      g.fillStyle = '#f4f1ea';
      g.fillRect(156, 140, 68, 116);
      g.fillStyle = '#7a4a2e';
      g.fillRect(164, 148, 52, 108);
      g.fillStyle = '#e8c35a';
      g.fillRect(204, 200, 6, 6);
    })
  );
  const houses = [];
  const hedges = [];
  const trees = [];
  const lamps = [];
  {
    // A coarse grid of the road, to keep everything off it
    const cell = 12;
    const grid = new Map();
    for (let s = 0; s <= route.length; s += 2) {
      const p = route.at(s);
      const k = Math.floor(p.x / cell) + ',' + Math.floor(p.z / cell);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(p);
    }
    const nearRoad = (x, z, need) => {
      const gx = Math.floor(x / cell);
      const gz = Math.floor(z / cell);
      const span = Math.ceil(need / cell);
      for (let i = -span; i <= span; i++) {
        for (let j = -span; j <= span; j++) {
          const list = grid.get(gx + i + ',' + (gz + j));
          if (!list) continue;
          for (const p of list) if ((p.x - x) ** 2 + (p.z - z) ** 2 < need * need) return true;
        }
      }
      return false;
    };
    const rnd = mulberry(7);
    const skip = (s) => {
      if (ring && Math.hypot(route.at(s).x - ring.cx, route.at(s).z - ring.cz) < ring.r + 26) return true;
      return s > route.length - 30;
    };
    const parkEnd = route.sections[0].s1 + 10;
    for (const side of [-1, 1]) {
      let s = 2;
      let row = Math.floor(rnd() * BRICKS.length);
      while (s < route.length) {
        const w = 7 + rnd() * 3;
        const d = 7 + rnd() * 2;
        const garden = 1.2 + rnd() * 2.2;
        const off = 5.6 + garden + d / 2;
        const p = route.at(s + w / 2, side * off);
        const inPark = s < parkEnd;
        if (!skip(s) && !inPark && rnd() > 0.1 && !nearRoad(p.x, p.z, off - 0.4) && !nearRoad(p.x, p.z, Math.max(w, d) / 2 + 2.8)) {
          if (rnd() < 0.25) row = Math.floor(rnd() * BRICKS.length);
          houses.push({ x: p.x, z: p.z, w, d, h: 5 + rnd() * 1.8, rot: p.heading + (side > 0 ? -Math.PI / 2 : Math.PI / 2), color: BRICKS[row], roof: ROOFS[Math.floor(rnd() * ROOFS.length)] });
          // Hedge or low wall in front
          if (rnd() < 0.8) {
            const hp = route.at(s + w / 2, side * 6.0);
            if (!nearRoad(hp.x, hp.z, 5.6)) hedges.push({ x: hp.x, z: hp.z, len: w - 0.8, rot: hp.heading, wall: rnd() < 0.35 });
          }
        } else if (!skip(s) && (inPark || rnd() < 0.6)) {
          for (let k = 0; k < (inPark ? 4 : 1); k++) {
            const tp = route.at(s + rnd() * w, side * (7 + rnd() * (inPark ? 16 : 4)));
            if (!nearRoad(tp.x, tp.z, 6.4)) trees.push({ x: tp.x, z: tp.z, size: 0.8 + rnd() * 0.6 });
          }
        }
        s += w + 0.4 + rnd() * 2.5;
      }
    }
    // Trees around the lake and the ring
    if (ring) {
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2;
        const rr = ring.r + 10 + rnd() * 40;
        const x = ring.cx + Math.cos(a) * rr;
        const z = ring.cz + Math.sin(a) * rr;
        if (!nearRoad(x, z, 6.5) && !(viewLake && Math.hypot(x - viewLake.mesh.position.x, (z - viewLake.mesh.position.z) / 0.62) < 34)) trees.push({ x, z, size: 0.9 + rnd() * 0.7 });
      }
    }
    for (let s = 10, k = 0; s < route.length; s += 26, k++) {
      const p = route.at(s, (k % 2 ? 1 : -1) * 5.1);
      lamps.push({ x: p.x, z: p.z, rot: p.heading + (k % 2 ? 0 : Math.PI) });
    }
  }
  const dummy = new THREE.Object3D();
  function instanced(geom, mat, list, place, colorOf) {
    if (!list.length) return null;
    const mesh = new THREE.InstancedMesh(keep(geom), mat, list.length);
    list.forEach((it, i) => {
      place(dummy, it);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (colorOf) mesh.setColorAt(i, new THREE.Color(colorOf(it)));
    });
    scene.add(mesh);
    return mesh;
  }
  const houseGeom = new THREE.BoxGeometry(1, 1, 1);
  houseGeom.translate(0, 0.5, 0);
  instanced(houseGeom, lambert({ map: facade }), houses, (o, h) => {
    o.position.set(h.x, 0, h.z);
    o.rotation.set(0, h.rot, 0);
    o.scale.set(h.w, h.h, h.d);
  }, (h) => h.color);
  const roofGeom = new THREE.BufferGeometry();
  {
    // A gable roof prism, 1×1×1, ridge along X
    const v = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 1, 0, 0.5, 1, 0];
    const i = [0, 4, 1, 1, 4, 5, 3, 2, 4, 2, 5, 4, 0, 3, 4, 1, 5, 2];
    roofGeom.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    roofGeom.setIndex(i);
    roofGeom.computeVertexNormals();
  }
  const roofMat = lambert({ color: '#ffffff', side: THREE.DoubleSide, flatShading: true });
  instanced(roofGeom, roofMat, houses, (o, h) => {
    o.position.set(h.x, h.h, h.z);
    o.rotation.set(0, h.rot, 0);
    o.scale.set(h.w + 0.6, 2.4, h.d + 0.6);
  }, (h) => h.roof);
  const chimneyGeom = new THREE.BoxGeometry(0.6, 1.6, 0.6);
  instanced(chimneyGeom, lambert({ color: '#8c4a36' }), houses, (o, h) => {
    o.position.set(h.x, h.h + 1.6, h.z);
    o.rotation.set(0, h.rot, 0);
    o.translateX(h.w * 0.28);
    o.scale.set(1, 1, 1);
  });
  const hedgeGeom = new THREE.BoxGeometry(1, 1, 1);
  hedgeGeom.translate(0, 0.5, 0);
  instanced(hedgeGeom, lambert({ color: '#ffffff' }), hedges, (o, h) => {
    o.position.set(h.x, 0, h.z);
    o.rotation.set(0, h.rot, 0);
    o.scale.set(0.6, h.wall ? 0.7 : 1.0, h.len);
  }, (h) => (h.wall ? '#c8b89c' : '#4f7d3a'));
  const treeGeom = merge([part(new THREE.CylinderGeometry(0.18, 0.25, 2.4, 7), '#6b4a2f', M(0, 1.2, 0)), part(new THREE.IcosahedronGeometry(1.7, 0), '#5f8f3e', M(0, 3.4, 0)), part(new THREE.IcosahedronGeometry(1.2, 0), '#6fa04a', M(0.5, 4.3, 0.3))]);
  instanced(treeGeom, VC, trees, (o, t) => {
    o.position.set(t.x, 0, t.z);
    o.rotation.set(0, t.x, 0);
    o.scale.setScalar(t.size);
  });
  const lampGeom = merge([tube([0, 0, 0], [0, 4.6, 0], 0.07, '#3d4248'), tube([0, 4.6, 0], [0, 4.7, 0.9], 0.05, '#3d4248'), box(0.3, 0.14, 0.5, '#3d4248', M(0, 4.66, 1.0)), box(0.24, 0.04, 0.4, '#fff1c2', M(0, 4.58, 1.0))]);
  instanced(lampGeom, VC, lamps, (o, l) => {
    o.position.set(l.x, 0, l.z);
    o.rotation.set(0, l.rot + Math.PI / 2, 0);
    o.scale.setScalar(1);
  });

  /* ---- Fixed places: the Parc du Petit Bois sign, the café, Panda's house ---- */
  {
    const p = route.at(6, -5);
    const sign = plaque('PARC DU PETIT BOIS', '#2f6b3a');
    sign.position.set(p.x, 0, p.z);
    sign.rotation.y = p.heading + Math.PI;
    scene.add(sign);
  }
  const sec = rules.sec;
  {
    // The café terrace where the table leg comes from (a table is missing one)
    const legS = sec.desmoulins.s0 + SPOTS.leg;
    const parts = [];
    const table = (x, z, tilt = 0) => {
      parts.push(part(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 14), '#f2f2f2', M(x, 0.78, z, tilt, 0, tilt * 0.6)));
      if (!tilt) parts.push(tube([x, 0, z], [x, 0.76, z], 0.04, '#6b6f75'));
      for (const a of [0, 2.1, 4.2]) parts.push(box(0.36, 0.06, 0.36, '#d23c3c', M(x + Math.cos(a) * 0.65, 0.45, z + Math.sin(a) * 0.65)));
    };
    table(0, 0);
    table(1.8, 1.2, 0.35);
    table(-1.6, 1.4);
    parts.push(tube([0, 0, 0], [0, 2.4, 0], 0.04, '#cfcfcf'));
    parts.push(part(new THREE.ConeGeometry(1.6, 0.6, 8), '#e94f37', M(0, 2.5, 0)));
    const terrace = new THREE.Mesh(keep(merge(parts)), VC);
    const p = route.at(legS + 4, 7.4);
    terrace.position.set(p.x, 0.12, p.z);
    terrace.rotation.y = p.heading;
    scene.add(terrace);
    const cafe = plaque('CAFÉ DES SPORTS', '#b8322a');
    const cp = route.at(legS + 9, 5.0);
    cafe.position.set(cp.x, 0, cp.z);
    cafe.rotation.y = cp.heading + Math.PI;
    scene.add(cafe);
  }
  const home = new THREE.Group();
  {
    const end = route.length;
    const p = route.at(end - 2, 11);
    const house = merge([
      box(10, 6, 8, '#f2c94c', M(0, 3, 0)),
      part(new THREE.ConeGeometry(7.2, 3, 4), '#b8452f', M(0, 7.5, 0, 0, Math.PI / 4, 0, 1, 1, 0.8)),
      box(1.4, 2.4, 0.1, '#7a4a2e', M(0, 1.2, 4.02)),
      box(1.6, 1.4, 0.1, '#6f8fa8', M(-3, 3.8, 4.02)),
      box(1.6, 1.4, 0.1, '#6f8fa8', M(3, 3.8, 4.02)),
      box(1.6, 1.4, 0.1, '#6f8fa8', M(-3, 1.6, 4.02)),
      box(1.6, 1.4, 0.1, '#6f8fa8', M(3, 1.6, 4.02)),
    ]);
    const mesh = new THREE.Mesh(keep(house), VC);
    home.add(mesh);
    const banner = keep(
      canvasTexture(512, 128, (g, w, h) => {
        g.fillStyle = '#ef2d6b';
        g.beginPath();
        g.roundRect(0, 0, w, h, 24);
        g.fill();
        g.fillStyle = '#ffffff';
        g.font = '800 70px Fredoka, system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(texts('house').toUpperCase(), w / 2, h / 2 + 4);
      })
    );
    const b = new THREE.Mesh(keep(new THREE.PlaneGeometry(4.2, 1.05)), lambert({ map: banner, side: THREE.DoubleSide }));
    b.position.set(0, 5.4, 4.1);
    home.add(b);
    home.position.set(p.x, 0, p.z);
    // Door and banner face the street
    home.rotation.y = p.heading + Math.PI / 2;
    scene.add(home);
    // The gang waits in front of the house
    const gang = ['cous', 'aline', 'romain', 'victor', 'mamar', 'eugenie', 'violaine', 'greg'];
    const shirts = ['#2ec4b6', '#e94f6b', '#3a86ff', '#7cb342', '#74acdf', '#ffb703', '#8e5cc2', '#d62828'];
    gang.forEach((id, i) => {
      // On the pavement in front of the house (its wall starts 7 m from the road centre)
      const gp = route.at(end - 13 + i * 1.7, 4.9 + (i % 2) * 0.8);
      const body = new THREE.Mesh(keep(walkerGeometry({ coat: shirts[i] })), VC);
      body.position.set(gp.x, 0.12, gp.z);
      body.rotation.y = gp.heading + Math.PI / 2;
      scene.add(body);
      const face = castSprite(id, 0.62);
      face.position.set(gp.x, 1.95, gp.z);
      scene.add(face);
    });
    // The finish: a chequered line across the road
    const flag = keep(
      canvasTexture(64, 16, (g) => {
        for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) {
          g.fillStyle = (x + y) % 2 ? '#111' : '#fff';
          g.fillRect(x * 4, y * 4, 4, 4);
        }
      })
    );
    flag.magFilter = THREE.NearestFilter;
    const fp = route.at(end - 5);
    const line = new THREE.Mesh(keep(new THREE.PlaneGeometry(7, 1.2)), lambert({ map: flag }));
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = -fp.heading;
    line.position.set(fp.x, 0.02, fp.z);
    scene.add(line);
  }

  /* ---- Panda on his 103 SPX ---- */
  const geo = {};
  const once = (key, make) => geo[key] || (geo[key] = keep(make()));
  const panda = new THREE.Group();
  const pandaBody = new THREE.Group();
  panda.add(pandaBody);
  pandaBody.add(new THREE.Mesh(once('spx', () => mopedGeometry('#2f6fd1', { decal: true })), VC));
  const riderMesh = new THREE.Mesh(once('pandaRider', () => riderGeometry({ shirt: '#f2b705', hair: '#4a3426', skin: '#efc4a2' })), VC);
  pandaBody.add(riderMesh);
  {
    // Panda's face on the front of his head (seen when the camera comes round)
    const face = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.42, 0.52)), keep(new THREE.MeshLambertMaterial({ map: castTexture('panda'), transparent: true, alphaTest: 0.1 })));
    face.position.set(0, 1.64, 0.15);
    pandaBody.add(face);
    // "103 SPX" on the side panels
    const decal = keep(
      canvasTexture(128, 64, (g) => {
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 128, 64);
        g.fillStyle = '#1f3f8f';
        g.font = '800 34px Fredoka, system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('103 SPX', 64, 34);
      })
    );
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.3, 0.15)), keep(new THREE.MeshLambertMaterial({ map: decal })));
      d.position.set(s * 0.128, 0.64, -0.12);
      d.rotation.set(0.15 * s, (s * Math.PI) / 2, 0);
      pandaBody.add(d);
    }
  }
  const shadowTex = keep(
    canvasTexture(64, 64, (g) => {
      const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(0,0,0,0.45)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    })
  );
  const shadowMat = keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  const shadowGeom = keep(new THREE.PlaneGeometry(1, 1));
  function blob(w, l) {
    const m = new THREE.Mesh(shadowGeom, shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.scale.set(w, l, 1);
    m.position.y = 0.03;
    return m;
  }
  panda.add(blob(1.0, 2.0));
  scene.add(panda);

  /* ---- Smoke and stars ---- */
  const puffTex = keep(
    canvasTexture(64, 64, (g) => {
      const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(225,228,236,0.9)');
      grad.addColorStop(1, 'rgba(225,228,236,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    })
  );
  const puffs = [];
  for (let i = 0; i < 26; i++) {
    const s = sprite(puffTex, 0.4, 0.4);
    s.visible = false;
    scene.add(s);
    puffs.push({ s, life: 0 });
  }
  let puffClock = 0;
  const starTex = keep(stars());
  const sparks = [];
  for (let i = 0; i < 16; i++) {
    const s = sprite(starTex, 0.35, 0.35);
    s.visible = false;
    scene.add(s);
    sparks.push({ s, life: 0, vx: 0, vy: 0, vz: 0 });
  }
  function burst(x, y, z, n = 8) {
    let k = 0;
    for (const p of sparks) {
      if (p.life > 0) continue;
      const a = (k / n) * Math.PI * 2;
      p.life = 0.8;
      p.s.visible = true;
      p.s.position.set(x, y, z);
      p.vx = Math.cos(a) * 2.2;
      p.vz = Math.sin(a) * 2.2;
      p.vy = 2.5;
      if (++k >= n) break;
    }
  }

  /* ---- Things on the road ---- */
  const objects = new Map();
  const bumpTex = keep(
    canvasTexture(128, 16, (g) => {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#1d1d1f' : '#f2c230';
        g.fillRect(i * 16, 0, 16, 16);
      }
    })
  );
  function makeObject(e) {
    const g = new THREE.Group();
    switch (e.kind) {
      case 'car':
      case 'parked': {
        const color = CAR_COLORS[e.id % CAR_COLORS.length];
        g.add(new THREE.Mesh(once('car' + color, () => carGeometry(color)), VC));
        g.add(blob(2.0, 4.4));
        break;
      }
      case 'gogol': {
        g.add(new THREE.Mesh(once('solex', () => mopedGeometry('#1d1d20', { solex: true })), VC));
        g.add(new THREE.Mesh(once('gogolRider', () => riderGeometry({ shirt: '#6d6a75', legs: '#4a4652', head: false })), VC));
        g.add(at(faceSprite('gogol', 0.62), 0, 1.72, 0));
        g.add(at(label(texts('gogolName').toUpperCase(), '#8e5cc2'), 0, 2.55, 0));
        g.add(blob(0.9, 1.9));
        break;
      }
      case 'pineur': {
        g.add(new THREE.Mesh(once('pineur', () => walkerGeometry({ coat: '#a08a6a', cane: true })), VC));
        g.add(at(faceSprite('pineur', 0.66), 0, 1.86, 0));
        const l = label(texts('pineurName').toUpperCase(), '#e07a10');
        l.scale.set(3.4, 0.85, 1);
        g.add(at(l, 0, 2.8, 0));
        g.add(blob(0.8, 0.8));
        break;
      }
      case 'panne': {
        // His old car, bonnet up, steaming
        g.add(new THREE.Mesh(once('panne', () => merge([carGeometry('#d8c9a3'), box(1.5, 0.06, 1.1, '#d8c9a3', M(0, 1.25, 1.6, -0.9))])), VC));
        g.add(blob(2.0, 4.4));
        g.userData.steam = true;
        break;
      }
      case 'impuissant': {
        g.add(new THREE.Mesh(once('impuissant', () => walkerGeometry({ coat: '#7d8b9a' })), VC));
        g.add(at(faceSprite('impuissant', 0.66), 0, 1.86, 0));
        const l = label(texts('impuissantName').toUpperCase(), '#6c7a89');
        l.scale.set(3.6, 0.9, 1);
        g.add(at(l, 0, 2.85, 0));
        g.add(blob(0.8, 0.8));
        break;
      }
      case 'bench': {
        g.add(new THREE.Mesh(once('bench', benchGeometry), VC));
        const bud = new THREE.Mesh(once('bud', () => seatedGeometry({ shirt: '#6b4f3a', legs: '#3d4a5c' })), VC);
        bud.position.x = -0.45;
        const smo = new THREE.Mesh(once('smo', () => seatedGeometry({ shirt: '#5c6b3a', legs: '#4a3d33' })), VC);
        smo.position.x = 0.45;
        g.add(bud, smo);
        g.add(at(faceSprite('bud', 0.6), -0.45, 1.5, 0.05));
        g.add(at(faceSprite('smo', 0.6), 0.45, 1.5, 0.05));
        g.add(at(label(texts('budName').toUpperCase(), '#2a9d8f'), -0.9, 2.3, 0));
        g.add(at(label(texts('smoName').toUpperCase(), '#2a9d8f'), 1.1, 2.75, 0));
        break;
      }
      case 'can': {
        g.add(new THREE.Mesh(once('can', canGeometry), VC));
        g.add(at(ringGlow('#ffd23f'), 0, 0.03, 0));
        break;
      }
      case 'leg': {
        g.add(new THREE.Mesh(once('leg', legGeometry), VC));
        g.add(at(ringGlow('#7bdff2'), 0, 0.03, 0));
        break;
      }
      case 'bump': {
        const m = new THREE.Mesh(once('bump', () => new THREE.BoxGeometry(7, 0.14, 0.9)), keep(new THREE.MeshLambertMaterial({ map: bumpTex })));
        m.position.y = 0.05;
        g.add(m);
        break;
      }
      case 'hole': {
        const m = new THREE.Mesh(once('hole', () => new THREE.CircleGeometry(0.62, 9)), keep(new THREE.MeshBasicMaterial({ color: '#2a2a2c' })));
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.02;
        m.scale.set(1, 0.8, 1);
        g.add(m);
        break;
      }
      case 'azzouz': {
        const colors = ['#2f7fd1', '#e0a21b', '#d23c5a'];
        const c = colors[e.nth % 3];
        g.add(new THREE.Mesh(once('azzMob' + c, () => mopedGeometry(c)), VC));
        g.add(new THREE.Mesh(once('azzRider' + c, () => riderGeometry({ shirt: c, legs: '#2a2d36', head: false })), VC));
        g.add(at(faceSprite('azzouz', 0.6, e.nth), 0, 1.72, 0));
        if (e.nth === 0) g.add(at(label(texts('azzouzName').toUpperCase(), '#2f7fd1'), 0, 2.5, 0));
        g.add(blob(0.9, 1.9));
        break;
      }
      case 'pietro': {
        g.add(new THREE.Mesh(once('pietroMob', () => mopedGeometry('#b3261e')), VC));
        g.add(new THREE.Mesh(once('pietroRider', () => riderGeometry({ shirt: '#1f1f22', legs: '#2d3340', head: false })), VC));
        g.add(at(faceSprite('pietro', 0.64), 0, 1.74, 0));
        g.add(at(label(texts('pietroName').toUpperCase(), '#b3261e'), 0, 2.55, 0));
        g.add(blob(0.9, 1.9));
        break;
      }
      case 'babar': {
        g.add(new THREE.Mesh(once('rcx', () => mopedGeometry('#d62828', { decal: true })), VC));
        g.add(new THREE.Mesh(once('babarRider', () => riderGeometry({ shirt: '#74acdf', legs: '#3b5b8c', head: false })), VC));
        g.add(at(castSprite('babar', 0.6), 0, 1.74, 0));
        g.add(at(label('BABAR · 103 RCX', '#d62828'), 0, 2.6, 0));
        g.add(blob(0.9, 1.9));
        break;
      }
      default:
        break;
    }
    scene.add(g);
    return g;
  }
  function at(obj, x, y, z) {
    obj.position.set(x, y, z);
    return obj;
  }
  function ringGlow(color) {
    const m = new THREE.Mesh(once('glow', () => new THREE.RingGeometry(0.55, 0.75, 20)), keep(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // Les keufs: a police car that follows Panda when the chase is on
  const police = new THREE.Group();
  police.add(new THREE.Mesh(once('police', () => carGeometry('#f4f6f8', true)), VC));
  const lightL = new THREE.Mesh(keep(new THREE.BoxGeometry(0.4, 0.16, 0.26)), keep(new THREE.MeshBasicMaterial({ color: '#2f6bff' })));
  const lightR = lightL.clone();
  lightR.material = keep(new THREE.MeshBasicMaterial({ color: '#ff3b3b' }));
  lightL.position.set(-0.28, 1.6, -0.1);
  lightR.position.set(0.28, 1.6, -0.1);
  police.add(lightL, lightR);
  police.add(at(faceSprite('keufs', 0.5), -0.38, 1.22, 0.35));
  police.add(at(label(texts('keufsName').toUpperCase(), '#1f4fa8'), 0, 2.5, 0));
  police.add(blob(2.0, 4.4));
  police.visible = false;
  scene.add(police);

  /* ---- Camera and per-frame update ---- */
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let camReady = false;
  let shake = 0;
  let crashSpin = 0;
  let clock = 0;
  let endOrbit = 0;
  let baseFov = 62;

  function place(obj, s, x, flip = false, y = 0) {
    const p = route.at(s, x);
    obj.position.set(p.x, y, p.z);
    obj.rotation.y = p.heading + (flip ? Math.PI : 0);
    return p;
  }

  function update(dt) {
    clock += dt;
    // Panda
    const lift = st.air > 0 ? Math.sin((1 - st.air / rules.tuning.jumpTime) * Math.PI) * 0.55 : 0;
    const p = place(panda, st.s, st.x, false, lift);
    const lean = Math.max(-0.35, Math.min(0.35, (st.target - st.x) * 0.16));
    const down = st.phase === 'down' || st.phase === 'over';
    crashSpin += ((down ? 1.35 : 0) - crashSpin) * Math.min(1, dt * (down ? 9 : 4));
    pandaBody.rotation.set(st.air > 0 ? -0.32 : 0, 0, -lean - crashSpin);
    pandaBody.position.y = st.air > 0 ? 0 : Math.sin(clock * 30) * 0.008 * Math.min(1, st.v / 6);

    // Smoke from the exhaust (a two-stroke always smokes)
    puffClock -= dt;
    if (puffClock <= 0 && (st.phase === 'ride' || st.phase === 'pedal')) {
      puffClock = st.phase === 'pedal' ? 0.18 : 0.06;
      const free = puffs.find((q) => q.life <= 0);
      if (free) {
        const ex = route.at(st.s - 0.8, st.x + 0.15);
        free.life = 1;
        free.s.visible = true;
        free.s.position.set(ex.x, 0.45 + lift, ex.z);
      }
    }
    for (const q of puffs) {
      if (q.life <= 0) continue;
      q.life -= dt * 1.2;
      q.s.position.y += dt * 0.6;
      const k = 1 - q.life;
      q.s.scale.setScalar(0.35 + k * 1.1);
      q.s.material.opacity = Math.max(0, q.life) * 0.55;
      if (q.life <= 0) q.s.visible = false;
    }
    for (const q of sparks) {
      if (q.life <= 0) continue;
      q.life -= dt;
      q.vy -= 6 * dt;
      q.s.position.x += q.vx * dt;
      q.s.position.y += q.vy * dt;
      q.s.position.z += q.vz * dt;
      q.s.material.rotation += dt * 6;
      if (q.life <= 0) q.s.visible = false;
    }

    // Entities
    const alive = new Set();
    for (const e of st.entities) {
      alive.add(e.id);
      let o = objects.get(e.id);
      if (!o) {
        o = makeObject(e);
        objects.set(e.id, o);
      }
      if (e.kind === 'can' && e.flight > 0) {
        const bench = st.entities.find((b) => b.id === e.from);
        const f = 1 - e.flight / 0.8;
        const from = bench ? route.at(bench.s, bench.x) : route.at(e.s, e.x);
        const to = route.at(e.s, e.x);
        o.position.set(from.x + (to.x - from.x) * f, 0.6 + Math.sin(f * Math.PI) * 3, from.z + (to.z - from.z) * f);
        o.rotation.z += dt * 10;
        continue;
      }
      const flip = e.kind === 'car' && e.oncoming;
      place(o, e.s, e.x, flip);
      if (e.kind === 'parked') o.rotation.y += e.side * 0.04;
      if (e.kind === 'impuissant') o.rotation.y += Math.PI / 2 + Math.sin(clock * 2) * 0.3;
      if (o.userData.steam && Math.random() < dt * 10) {
        const q = puffs.find((pp) => pp.life <= 0);
        if (q) {
          const sp = route.at(e.s + 1.8, e.x);
          q.life = 1;
          q.s.visible = true;
          q.s.position.set(sp.x, 1.3, sp.z);
        }
      }
      if (e.kind === 'bench') o.rotation.y -= Math.PI / 2;
      if (e.kind === 'can' || e.kind === 'leg') o.children[0].rotation.y = clock * 2.5;
      if (e.kind === 'pineur') o.rotation.y = route.at(e.s).heading + (e.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      if (e.kind === 'pietro') {
        const tilt = e.state === 'down' ? Math.min(1.4, e.timer * 3) : e.reel > 0 ? Math.sin(e.reel * 20) * 0.25 : e.lunge > 0 ? -e.side * 0.25 : 0;
        o.rotation.z = tilt * (e.side || 1);
      }
      if (e.kind === 'azzouz' && e.state === 'pushed') o.rotation.z = Math.sin(clock * 18) * 0.2;
      if (e.kind === 'gogol' || e.kind === 'azzouz' || e.kind === 'babar' || e.kind === 'pietro') o.position.y = Math.sin(clock * 28 + e.id) * 0.01;
    }
    for (const [id, o] of objects) {
      if (alive.has(id)) continue;
      scene.remove(o);
      objects.delete(id);
    }

    // Les keufs
    police.visible = st.chase.on;
    if (st.chase.on) {
      place(police, st.s - st.chase.gap, st.chase.x);
      const blink = Math.floor(clock * 6) % 2 === 0;
      lightL.visible = blink;
      lightR.visible = !blink;
    }

    // The lake ripples
    if (viewLake) viewLake.tex.offset.x = Math.sin(clock * 0.3) * 0.02;

    // Camera
    shake = Math.max(0, shake - dt * 2.5);
    let wantPos;
    let wantLook;
    if (st.phase === 'pedal') {
      // Front three-quarter view: see Panda's face while he pedals
      const f = route.at(st.s + 3.6, st.x + 1.6);
      wantPos = new THREE.Vector3(f.x, 1.75, f.z);
      wantLook = new THREE.Vector3(p.x, 1.35, p.z);
    } else if (st.phase === 'done') {
      // Come round to the front-left: Panda, his house and the gang in one shot
      endOrbit = Math.min(1, endOrbit + dt * 0.35);
      const f = route.at(st.s + 9, -4.5);
      const b = route.at(st.s - 6, st.x * 0.6);
      const look = route.at(st.s - 3, 6);
      wantPos = new THREE.Vector3(b.x + (f.x - b.x) * endOrbit, 2.6 + endOrbit * 0.6, b.z + (f.z - b.z) * endOrbit);
      wantLook = new THREE.Vector3(p.x + (look.x - p.x) * endOrbit * 0.6, 1.6, p.z + (look.z - p.z) * endOrbit * 0.6);
    } else {
      // Straight behind Panda along his own heading (not the road behind him, which bends away in tight turns)
      const f = route.at(st.s + 6, st.x * 0.5);
      wantPos = new THREE.Vector3(p.x - p.dx * 6.2 - p.rx * st.x * 0.35, 2.65 + lift * 0.5, p.z - p.dz * 6.2 - p.rz * st.x * 0.35);
      wantLook = new THREE.Vector3((p.x + f.x) / 2, 1.05, (p.z + f.z) / 2);
    }
    if (!camReady) {
      camPos.copy(wantPos);
      camLook.copy(wantLook);
      camReady = true;
    }
    const k = 1 - Math.exp(-dt * (st.phase === 'ride' ? 7 : 3));
    camPos.lerp(wantPos, k);
    camLook.lerp(wantLook, k);
    camera.position.copy(camPos);
    if (shake > 0) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
    camera.lookAt(camLook);
    const fov = baseFov + (st.boost > 0 || st.slip ? 8 : 0);
    if (Math.abs(camera.fov - fov) > 0.1) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }
    sky.position.x = camera.position.x;
    sky.position.z = camera.position.z;
    renderer.render(scene, camera);
  }

  function event(name, data) {
    if (name === 'crash' || name === 'ram') {
      shake = name === 'crash' ? 0.6 : 0.3;
      if (name === 'crash') burst(panda.position.x, 1.8, panda.position.z, 7);
    }
    if (name === 'bonk' && data) {
      const o = objects.get(data.id);
      if (o) burst(o.position.x, 1.9, o.position.z, 8);
      shake = 0.2;
    }
    if (name === 'bump') shake = 0.35;
    if (name === 'can' || name === 'leg') burst(panda.position.x, 1.2, panda.position.z, 5);
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait phones: a little wider view so the road fits
    baseFov = w < h ? 66 : 58;
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    for (const d of disposables) d.dispose?.();
    for (const t of castTextures.values()) t.dispose();
    renderer.dispose();
  }

  return { update, event, resize, dispose, renderer, scene, camera };
}

/** Small seeded random for the scenery (the same town every ride). */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
