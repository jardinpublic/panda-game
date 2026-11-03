// Canvas 2D art kit: a modern, smooth Martinique look. Gradients, soft
// shadows, rounded shapes, no thick black outlines and no pixels.
// Every function takes the 2D context first and draws in logical units
// (the stage is 400 units wide). Safe to call in Node tests with a fake context.

import { heard } from '../core/voice.js';

export const FONT = "'Fredoka', 'Baloo 2', system-ui, sans-serif";

/** A line drawn on the game's screen (not an off-screen share card): Panda says his Hoho. */
const onScreen = (c) => !!(c && c.canvas && c.canvas.isConnected);

export const PAL = {
  lagoon: '#12c2c9',
  sea: '#0a8fb0',
  deep: '#063f5c',
  sand: '#f8e2b6',
  sandDark: '#e9c58b',
  palm: '#16a06a',
  leaf: '#33d08b',
  coral: '#ff6f61',
  mango: '#ffb23e',
  hibiscus: '#ef2d6b',
  sunset1: '#ff7b54',
  sunset2: '#ffc46b',
  night: '#1a1238',
  violet: '#5b2a86',
  cream: '#fff7ea',
  ink: '#1e1a33',
  white: '#ffffff',
  creole: ['#ff8fa3', '#ffd166', '#7bdff2', '#b8f2a1', '#cdb4ff', '#ffb38a'],
};

export const CAST_IDS = ['panda', 'cous', 'mamar', 'babar', 'victor', 'romain', 'eugenie', 'violaine', 'aline', 'greg'];
/** People from the stories who are not in the gang: drawn like them, never playable, never
 * random friends or cameos. They appear only in their own mini-games (car205, rudy-escape, rudy-food). */
export const EXTRA_IDS = ['rudy', 'jose', 'lamoule'];

/** Shirt, trousers and build per friend. Panda wears madras, Cous a hawaiian shirt. */
export const OUTFITS = {
  panda: { shirt: '#ffcf3f', pattern: 'madras', legs: '#3c4c6e', skin: '#f0c3a3' },
  cous: { shirt: '#1f7a4d', pattern: 'flowers', legs: '#4a4d55', skin: '#f4cbb0', tall: 1.1 },
  romain: { shirt: '#bcd6ee', pattern: 'tie', legs: '#232838', skin: '#e2b08c' },
  mamar: { shirt: '#75b8ec', pattern: 'stripes', legs: '#1c2030', skin: '#ebbd98' },
  victor: { shirt: '#1c2a4a', pattern: 'plain', legs: '#d96a4a', skin: '#d9a07a' },
  babar: { shirt: '#33363c', pattern: 'hoodie', legs: '#3a4c70', skin: '#efc19f', wide: 1.12 },
  greg: { shirt: '#9fc3e3', pattern: 'plain', legs: '#2c3240', skin: '#ebbd9b' },
  aline: { shirt: '#2f8c96', pattern: 'plain', legs: '#2c3240', skin: '#f5ccb2', small: 0.95 },
  eugenie: { shirt: '#26232e', pattern: 'plain', legs: '#c83a44', skin: '#f8d3bd', small: 0.94, skirt: true },
  violaine: { shirt: '#e8664e', pattern: 'plain', legs: '#3a5280', skin: '#ecb994', small: 0.95 },
  // Rudy lives in the woods: khaki parka. José: skinny, white tank top, very hairy. Lamoule: tall.
  rudy: { shirt: '#7d8a4e', pattern: 'hoodie', legs: '#4a4238', skin: '#efc0a0', tall: 1.14, wide: 1.3, afro: '#5e4532' },
  jose: { shirt: '#f1f0ea', pattern: 'hairy', legs: '#2c3a5a', skin: '#d6a27a', wide: 0.8, bareArms: true, hairy: '#1c1512' },
  lamoule: { shirt: '#3d6b4f', pattern: 'plain', legs: '#2b2f3a', skin: '#f4cdb4', tall: 1.16 },
};

// ---- images ---------------------------------------------------------------------

const heads = {};

/** Loads every head picture (cast/<id>.svg). Resolves when all are decoded or failed. */
export function loadHeads(base = 'cast/') {
  if (typeof Image === 'undefined') return Promise.resolve();
  return Promise.all([...CAST_IDS, ...EXTRA_IDS].map((id) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { heads[id] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = `${base}${id}.svg`;
  })));
}

export function headImage(id) {
  return heads[id] || null;
}

// ---- primitives -----------------------------------------------------------------

export function rrect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
  return g;
}

export function circle(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

export function ellipse(c, x, y, rx, ry, fill, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

/** Soft shadow on the ground under a character or object. */
export function groundShadow(c, x, y, w) {
  ellipse(c, x, y, w / 2, w / 7, 'rgba(20, 10, 40, 0.22)');
}

/** Runs draw() with a soft drop shadow. */
export function shadowed(c, draw, blur = 14, dy = 6, color = 'rgba(20, 10, 40, 0.28)') {
  c.save();
  c.shadowColor = color;
  c.shadowBlur = blur;
  c.shadowOffsetY = dy;
  draw();
  c.restore();
}

/** Text with a soft shadow; align centre by default. */
export function text(c, str, x, y, { size = 28, color = PAL.white, weight = 700, align = 'center', base = 'middle', shadow = true, stroke = null, max } = {}) {
  if (onScreen(c)) heard(str);
  c.save();
  c.font = `${weight} ${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = base;
  if (shadow) {
    c.shadowColor = 'rgba(20, 10, 40, 0.35)';
    c.shadowBlur = size * 0.25;
    c.shadowOffsetY = size * 0.08;
  }
  if (stroke) {
    c.lineJoin = 'round';
    c.lineWidth = size * 0.16;
    c.strokeStyle = stroke;
    c.strokeText(str, x, y, max);
  }
  c.fillStyle = color;
  c.fillText(str, x, y, max);
  c.restore();
}

/** Rounded speech bubble with a tail pointing down to (x, y). */
export function bubble(c, str, x, y, { size = 17, color = PAL.ink, bg = PAL.white, maxW = 230 } = {}) {
  if (onScreen(c)) heard(str);
  c.save();
  c.font = `600 ${size}px ${FONT}`;
  const widthOf = (t) => c.measureText(t).width || t.length * size * 0.5;
  // Long lines wrap onto several rows instead of being squeezed.
  const lines = widthOf(str) + 24 > maxW ? wrap(c, str, maxW - 24, size) : [str];
  const w = Math.min(maxW, Math.max(...lines.map(widthOf)) + 24);
  const lh = size * 1.2;
  const h = lines.length * lh + 14;
  const bx = Math.max(6, Math.min(400 - w - 6, x - w / 2));
  const by = y - h - 10;
  const tx = Math.max(bx + 14, Math.min(bx + w - 14, x));
  shadowed(c, () => {
    rrect(c, bx, by, w, h, Math.min(h / 2, 18));
    c.fillStyle = bg;
    c.fill();
    c.beginPath();
    c.moveTo(tx - 7, by + h - 1);
    c.lineTo(tx, y);
    c.lineTo(tx + 7, by + h - 1);
    c.fill();
  }, 10, 4);
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  lines.forEach((ln, i) => c.fillText(ln, bx + w / 2, by + 7 + lh * (i + 0.5) + 1, w - 16));
  c.restore();
}

// ---- madras -----------------------------------------------------------------------

let madrasCache = null;

/** The Martinique madras check as a canvas pattern (null in Node). */
export function madras(c) {
  if (madrasCache !== null) return madrasCache;
  if (typeof document === 'undefined') return (madrasCache = PAL.mango);
  const t = document.createElement('canvas');
  t.width = t.height = 64;
  const p = t.getContext('2d');
  p.fillStyle = '#ffcf3f';
  p.fillRect(0, 0, 64, 64);
  const bands = [[0, 14, 'rgba(232, 40, 60, 0.75)'], [22, 6, 'rgba(30, 150, 90, 0.6)'], [34, 12, 'rgba(255, 120, 30, 0.7)'], [52, 4, 'rgba(110, 40, 140, 0.55)']];
  for (const [o, w, col] of bands) {
    p.fillStyle = col;
    p.fillRect(o, 0, w, 64);
    p.fillRect(0, o, 64, w);
  }
  p.fillStyle = 'rgba(255,255,255,0.5)';
  p.fillRect(30, 0, 1, 64);
  p.fillRect(0, 30, 64, 1);
  madrasCache = c.createPattern(t, 'repeat') || PAL.mango;
  return madrasCache;
}

/** A madras band, e.g. a decorative strip at the top of a card. */
export function madrasBand(c, x, y, w, h, scale = 0.5) {
  c.save();
  rrect(c, x, y, w, h, Math.min(h / 2, 10));
  c.clip();
  c.translate(x, y);
  c.scale(scale, scale);
  c.fillStyle = madras(c);
  c.fillRect(0, 0, w / scale, h / scale);
  c.restore();
}

// ---- characters --------------------------------------------------------------------

/**
 * A friend's caricature head centred on (x, y), h units tall (neck included).
 * opts: rot (radians), flip, squash (1 = none), hat id, alpha.
 */
export function head(c, id, x, y, h, { rot = 0, flip = false, squash = 1, hat = 'none', alpha = 1 } = {}) {
  const img = headImage(id);
  const w = h * (360 / 440);
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rot);
  c.scale(flip ? -1 : 1, squash);
  if (OUTFITS[id]?.afro) afro(c, h, OUTFITS[id].afro);
  if (img) {
    c.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ellipse(c, 0, -h * 0.05, w * 0.42, h * 0.4, OUTFITS[id]?.skin || '#f0c3a3');
    text(c, (id || '?')[0].toUpperCase(), 0, -h * 0.05, { size: h * 0.3, color: PAL.ink, shadow: false });
  }
  // Anchor: the top of the hair on the cartoon heads (tools/art/cartoon_heads.py).
  if (hat && hat !== 'none') drawHat(c, hat, 0, -h * 0.33, w * 0.62);
  c.restore();
}

/** Rudy's giant afro, drawn behind his head picture: a cloud of curls far wider than the head. */
function afro(c, h, col) {
  const cy = -h * 0.17;
  const rx = h * 0.55;
  const ry = h * 0.45;
  ellipse(c, 0, cy, rx, ry, col);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    if (Math.sin(a) > 0.55) continue; // not under the chin
    const r = h * (0.1 + (i % 3) * 0.02);
    circle(c, Math.cos(a) * rx * 0.94, cy + Math.sin(a) * ry * 0.94, r, col);
  }
  // Curls: little light spirals all over the mass
  c.strokeStyle = 'rgba(255,225,190,0.35)';
  c.lineWidth = Math.max(1, h * 0.012);
  for (let i = 0; i < 24; i++) {
    const a = i * 2.39996;
    const d = Math.sqrt((i + 0.5) / 24);
    const x = Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    if (Math.abs(x) < h * 0.3 && y > -h * 0.3) continue; // keep the face clear
    c.beginPath();
    c.arc(x, y, h * 0.035, 0, Math.PI * 1.5);
    c.stroke();
  }
}

/** Hats sit on top of the head: x, y is the top of the hair, w the head width. */
export function drawHat(c, hat, x, y, w) {
  c.save();
  c.translate(x, y);
  if (hat === 'bakoua') {
    // Martinique's conical straw hat.
    const g = vgrad(c, -w * 0.55, w * 0.1, ['#f6d58b', '#d9a95a']);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-w * 0.85, w * 0.12);
    c.quadraticCurveTo(0, -w * 0.05, w * 0.85, w * 0.12);
    c.lineTo(w * 0.05, -w * 0.6);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(150, 100, 40, 0.5)';
    c.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(-w * 0.85 + i * w * 0.21, w * 0.08 - i * 0.02 * w);
      c.lineTo(w * 0.05, -w * 0.6);
      c.stroke();
    }
    ellipse(c, w * 0.05, -w * 0.62, w * 0.06, w * 0.06, '#c48c3a');
  } else if (hat === 'madras') {
    // Madras head-tie with its knot.
    c.fillStyle = madras(c);
    c.beginPath();
    c.ellipse(0, -w * 0.05, w * 0.58, w * 0.32, 0, Math.PI, 0);
    c.fill();
    c.beginPath();
    c.ellipse(w * 0.3, -w * 0.3, w * 0.2, w * 0.13, -0.6, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(w * 0.48, -w * 0.38, w * 0.16, w * 0.08, -1.1, 0, Math.PI * 2);
    c.fill();
  } else if (hat === 'shades') {
    c.translate(0, w * 0.68);
    c.fillStyle = '#121218';
    rrect(c, -w * 0.48, -w * 0.06, w * 0.42, w * 0.2, w * 0.08);
    c.fill();
    rrect(c, w * 0.02, -w * 0.06, w * 0.42, w * 0.2, w * 0.08);
    c.fill();
    c.fillRect(-w * 0.1, -w * 0.04, w * 0.16, w * 0.04);
    c.fillStyle = 'rgba(120, 220, 255, 0.45)';
    c.fillRect(-w * 0.42, -w * 0.03, w * 0.12, w * 0.05);
    c.fillRect(w * 0.08, -w * 0.03, w * 0.12, w * 0.05);
  } else if (hat === 'party') {
    c.fillStyle = vgrad(c, -w * 0.8, 0, [PAL.hibiscus, PAL.mango]);
    c.beginPath();
    c.moveTo(-w * 0.3, w * 0.05);
    c.lineTo(w * 0.3, w * 0.05);
    c.lineTo(0, -w * 0.75);
    c.closePath();
    c.fill();
    circle(c, 0, -w * 0.78, w * 0.1, PAL.lagoon);
  } else if (hat === 'crown') {
    c.fillStyle = vgrad(c, -w * 0.45, 0, ['#ffe27a', '#f0a92b']);
    c.beginPath();
    c.moveTo(-w * 0.4, w * 0.05);
    c.lineTo(-w * 0.45, -w * 0.4);
    c.lineTo(-w * 0.2, -w * 0.15);
    c.lineTo(0, -w * 0.48);
    c.lineTo(w * 0.2, -w * 0.15);
    c.lineTo(w * 0.45, -w * 0.4);
    c.lineTo(w * 0.4, w * 0.05);
    c.closePath();
    c.fill();
    circle(c, 0, -w * 0.12, w * 0.06, PAL.hibiscus);
  } else if (hat === 'citroen') {
    // The Citroën double chevron, drawn on the forehead in blue marker by a friend.
    const fy = w * 0.34;
    c.strokeStyle = 'rgba(40, 90, 210, 0.85)';
    c.lineWidth = w * 0.065;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const dy of [0, w * 0.15]) {
      c.beginPath();
      c.moveTo(-w * 0.26, fy + dy + w * 0.08);
      c.lineTo(-w * 0.01, fy + dy - w * 0.035);
      c.lineTo(w * 0.25, fy + dy + w * 0.075);
      c.stroke();
    }
  } else if (hat === 'flower') {
    hibiscus(c, -w * 0.3, w * 0.1, w * 0.22, 0.4);
  }
  c.restore();
}

/** A can of 8.6, Panda's beer: centred on (x, y), s tall. */
export function beerCan(c, x, y, s, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const w = s * 0.56;
  shadowed(c, () => {
    rrect(c, -w / 2, -s / 2, w, s, w * 0.18);
    c.fillStyle = vgrad(c, -s / 2, s / 2, ['#2e7d4f', '#14532d']);
    c.fill();
  }, 6, 3);
  c.fillStyle = '#c9cdd6';
  c.fillRect(-w / 2 + 2, -s / 2, w - 4, s * 0.08);
  c.fillRect(-w / 2 + 2, s / 2 - s * 0.06, w - 4, s * 0.06);
  c.fillStyle = '#f2c94c';
  c.fillRect(-w / 2, -s * 0.12, w, s * 0.3);
  text(c, '8.6', 0, s * 0.03, { size: s * 0.24, color: '#14532d', shadow: false, weight: 700 });
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.fillRect(-w / 2 + w * 0.15, -s * 0.42, w * 0.12, s * 0.84);
  c.restore();
}

/** A hibiscus flower. */
export function hibiscus(c, x, y, r, rot = 0, color = PAL.hibiscus) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  for (let i = 0; i < 5; i++) {
    c.rotate((Math.PI * 2) / 5);
    ellipse(c, r * 0.55, 0, r * 0.55, r * 0.42, color);
  }
  circle(c, 0, 0, r * 0.22, '#ffd34d');
  c.strokeStyle = '#ffd34d';
  c.lineWidth = r * 0.07;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(r * 0.5, -r * 0.5);
  c.stroke();
  c.restore();
}

/**
 * A full friend, feet at (x, y), s units tall. pose: 'idle' | 'run' | 'cheer' |
 * 'sad' | 'point' | 'sit' | 'dance'. t drives the animation. opts: flip, hat, squash.
 */
export function person(c, id, x, y, s, pose = 'idle', t = 0, { flip = false, hat = 'none', squash = 1, alpha = 1 } = {}) {
  const o = OUTFITS[id] || OUTFITS.panda;
  const k = s * (o.small || 1) * (o.tall || 1);
  const wide = o.wide || 1;
  const legH = k * 0.2;
  const torsoH = k * 0.27;
  const torsoW = k * 0.25 * wide;
  const headH = k * 0.55;
  const bob = pose === 'run' ? Math.abs(Math.sin(t * 14)) * k * 0.04 : pose === 'dance' ? Math.abs(Math.sin(t * 8)) * k * 0.05 : Math.sin(t * 3) * k * 0.008;
  c.save();
  c.globalAlpha *= alpha;
  groundShadow(c, x, y, torsoW * 1.6);
  c.translate(x, y);
  if (flip) c.scale(-1, 1);
  c.scale(1, squash);
  const hip = -legH - bob + (pose === 'sit' ? legH * 0.6 : 0);
  // legs
  const swing = pose === 'run' ? Math.sin(t * 14) * 0.7 : pose === 'dance' ? Math.sin(t * 8) * 0.35 : 0;
  c.lineCap = 'round';
  c.strokeStyle = o.legs;
  c.lineWidth = k * 0.085;
  for (const side of [-1, 1]) {
    const a = side * swing;
    c.beginPath();
    c.moveTo(side * torsoW * 0.22, hip);
    if (pose === 'sit') c.lineTo(side * torsoW * 0.22 + legH * 0.8, hip + legH * 0.15);
    else c.lineTo(side * torsoW * 0.22 + Math.sin(a) * legH, hip + Math.cos(a) * legH);
    c.stroke();
  }
  // shoes
  for (const side of [-1, 1]) {
    const a = side * swing;
    const fx = pose === 'sit' ? side * torsoW * 0.22 + legH * 0.8 : side * torsoW * 0.22 + Math.sin(a) * legH;
    const fy = pose === 'sit' ? hip + legH * 0.15 : hip + Math.cos(a) * legH;
    ellipse(c, fx + k * 0.02, fy, k * 0.05, k * 0.028, '#f4f1ea');
  }
  // torso
  const top = hip - torsoH;
  c.save();
  rrect(c, -torsoW / 2, top, torsoW, torsoH + k * 0.02, torsoW * 0.38);
  c.clip();
  c.fillStyle = o.pattern === 'madras' ? madras(c) : o.shirt;
  c.fillRect(-torsoW / 2, top, torsoW, torsoH + k * 0.02);
  shirtPattern(c, o, -torsoW / 2, top, torsoW, torsoH);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.fillRect(-torsoW / 2, top, torsoW * 0.35, torsoH);
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.fillRect(torsoW * 0.22, top, torsoW * 0.3, torsoH);
  c.restore();
  if (o.skirt) {
    c.fillStyle = o.legs;
    c.beginPath();
    c.moveTo(-torsoW * 0.5, hip - k * 0.02);
    c.lineTo(torsoW * 0.5, hip - k * 0.02);
    c.lineTo(torsoW * 0.65, hip + legH * 0.5);
    c.lineTo(-torsoW * 0.65, hip + legH * 0.5);
    c.closePath();
    c.fill();
  }
  // arms
  const arms = armAngles(pose, t);
  c.strokeStyle = o.shirt;
  c.lineWidth = k * 0.075;
  for (const side of [-1, 1]) {
    const a = arms[side === -1 ? 0 : 1];
    const sx = side * torsoW * 0.47;
    const sy = top + k * 0.04;
    const ex = sx + side * Math.sin(a) * k * 0.2;
    const ey = sy + Math.cos(a) * k * 0.2;
    c.strokeStyle = o.bareArms ? o.skin : o.pattern === 'madras' ? '#f0a92b' : o.shirt;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(ex, ey);
    c.stroke();
    if (o.hairy) {
      // Hairy arms: little dark strokes along the arm
      c.save();
      c.strokeStyle = o.hairy;
      c.lineWidth = Math.max(1, k * 0.007);
      for (let i = 1; i < 8; i++) {
        const px = sx + (ex - sx) * (i / 8) + (i % 2 ? 1 : -1) * k * 0.012;
        const py = sy + (ey - sy) * (i / 8);
        c.beginPath();
        c.moveTo(px - k * 0.008, py - k * 0.006);
        c.lineTo(px + k * 0.006, py + k * 0.007);
        c.stroke();
      }
      c.restore();
      c.strokeStyle = o.shirt;
      c.lineWidth = k * 0.075;
    }
    circle(c, ex, ey, k * 0.04, o.skin);
  }
  // head
  head(c, id, -k * 0.005, top - headH * 0.38, headH, { hat, rot: pose === 'sad' ? 0.12 : pose === 'dance' ? Math.sin(t * 8) * 0.1 : 0 });
  c.restore();
}

function armAngles(pose, t) {
  switch (pose) {
    case 'cheer': return [2.6 + Math.sin(t * 12) * 0.25, 2.6 + Math.cos(t * 12) * 0.25];
    case 'run': return [Math.sin(t * 14) * 0.9 + 0.3, -Math.sin(t * 14) * 0.9 + 0.3];
    case 'sad': return [0.08, 0.08];
    case 'point': return [0.25, 1.75];
    case 'dance': return [1.8 + Math.sin(t * 8) * 0.8, 1.8 - Math.sin(t * 8) * 0.8];
    case 'sit': return [0.6, 0.6];
    default: return [0.25 + Math.sin(t * 2) * 0.04, 0.25 - Math.sin(t * 2) * 0.04];
  }
}

function shirtPattern(c, o, x, y, w, h) {
  if (o.pattern === 'flowers') {
    for (let i = 0; i < 6; i++) hibiscus(c, x + ((i * 37) % w), y + ((i * 23) % h) + 4, w * 0.12, i, '#ffd166');
  } else if (o.pattern === 'stripes') {
    c.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < w; i += w / 4) c.fillRect(x + i, y, w / 8, h);
  } else if (o.pattern === 'tie') {
    c.fillStyle = '#c0394b';
    c.beginPath();
    c.moveTo(-w * 0.06, y + 2);
    c.lineTo(w * 0.06, y + 2);
    c.lineTo(w * 0.08, y + h * 0.75);
    c.lineTo(0, y + h * 0.88);
    c.lineTo(-w * 0.08, y + h * 0.75);
    c.closePath();
    c.fill();
  } else if (o.pattern === 'hairy') {
    // Tank top: bare shoulders, and chest hair sticking out of the neckline
    c.fillStyle = o.skin;
    c.beginPath();
    c.arc(0, y, w * 0.3, 0, Math.PI);
    c.fill();
    c.fillRect(x, y, w * 0.14, h * 0.3);
    c.fillRect(x + w * 0.86, y, w * 0.14, h * 0.3);
    c.strokeStyle = o.hairy;
    c.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const px = -w * 0.22 + (i * w * 0.44) / 8;
      c.beginPath();
      c.moveTo(px, y + 2);
      c.quadraticCurveTo(px + 3, y + w * 0.12, px - 1, y + w * 0.22 - Math.abs(px) * 0.3);
      c.stroke();
    }
  } else if (o.pattern === 'hoodie') {
    c.fillStyle = 'rgba(255,255,255,0.15)';
    rrect(c, -w * 0.3, y + h * 0.55, w * 0.6, h * 0.3, 6);
    c.fill();
  }
}

/** A generic unnamed kid (no faces of real children): round head, cap, t-shirt. */
export function kid(c, x, y, s, seed = 0, t = 0, pose = 'run') {
  const shirt = PAL.creole[seed % PAL.creole.length];
  const skin = ['#8d5a3b', '#c68863', '#f0c3a3', '#5e3a26'][seed % 4];
  const bob = pose === 'run' ? Math.abs(Math.sin(t * 16 + seed)) * s * 0.05 : 0;
  c.save();
  groundShadow(c, x, y, s * 0.4);
  c.translate(x, y - bob);
  c.lineCap = 'round';
  c.strokeStyle = '#3a4c70';
  c.lineWidth = s * 0.09;
  const sw = pose === 'run' ? Math.sin(t * 16 + seed) * 0.6 : 0;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * s * 0.07, -s * 0.25);
    c.lineTo(side * s * 0.07 + Math.sin(side * sw) * s * 0.22, -s * 0.03);
    c.stroke();
  }
  rrect(c, -s * 0.15, -s * 0.55, s * 0.3, s * 0.32, s * 0.1);
  c.fillStyle = shirt;
  c.fill();
  c.strokeStyle = skin;
  c.lineWidth = s * 0.07;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * s * 0.14, -s * 0.5);
    c.lineTo(side * s * 0.28, -s * 0.4 - Math.sin(t * 16 + seed + side) * s * 0.12);
    c.stroke();
  }
  circle(c, 0, -s * 0.72, s * 0.2, skin);
  // cheeky face
  circle(c, -s * 0.07, -s * 0.74, s * 0.025, PAL.ink);
  circle(c, s * 0.07, -s * 0.74, s * 0.025, PAL.ink);
  c.strokeStyle = PAL.ink;
  c.lineWidth = s * 0.02;
  c.beginPath();
  c.arc(0, -s * 0.68, s * 0.07, 0.2, Math.PI - 0.2);
  c.stroke();
  // cap
  c.fillStyle = PAL.creole[(seed + 2) % PAL.creole.length];
  c.beginPath();
  c.arc(0, -s * 0.78, s * 0.2, Math.PI, 0);
  c.fill();
  c.fillRect(0, -s * 0.8, s * 0.3, s * 0.05);
  c.restore();
}

// ---- scenery -----------------------------------------------------------------------

export function sky(c, W, H, stops) {
  c.fillStyle = vgrad(c, 0, H, stops);
  c.fillRect(0, 0, W, H);
}

export function sun(c, x, y, r, color = '#fff2b0') {
  const g = c.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
  g.addColorStop(0, 'rgba(255, 245, 200, 0.9)');
  g.addColorStop(0.35, 'rgba(255, 200, 120, 0.35)');
  g.addColorStop(1, 'rgba(255, 160, 100, 0)');
  c.fillStyle = g;
  c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  circle(c, x, y, r, color);
}

/** Rocher du Diamant, the iconic rock off Martinique's south coast. */
export function diamondRock(c, x, y, s, color = 'rgba(40, 60, 90, 0.55)') {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - s, y);
  c.quadraticCurveTo(x - s * 0.55, y - s * 0.4, x - s * 0.2, y - s * 0.95);
  c.quadraticCurveTo(x + s * 0.05, y - s * 1.1, x + s * 0.3, y - s * 0.7);
  c.quadraticCurveTo(x + s * 0.7, y - s * 0.3, x + s, y);
  c.closePath();
  c.fill();
}

/** Sea band with moving highlight lines. */
export function sea(c, W, y, h, t, top = PAL.lagoon, bottom = PAL.sea) {
  c.fillStyle = vgrad(c, y, y + h, [top, bottom]);
  c.fillRect(0, y, W, h);
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 2;
  c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const yy = y + 6 + ((i * 17) % Math.max(1, h - 8));
    const xx = ((i * 83 + t * (20 + i * 3)) % (W + 80)) - 40;
    c.beginPath();
    c.moveTo(xx, yy);
    c.lineTo(xx + 18 + (i % 3) * 8, yy);
    c.stroke();
  }
}

export function sand(c, W, y, H, t = 0) {
  c.fillStyle = vgrad(c, y, H, [PAL.sand, PAL.sandDark]);
  c.beginPath();
  c.moveTo(0, y + 8);
  for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.03 + 1) * 5);
  c.lineTo(W, H);
  c.lineTo(0, H);
  c.closePath();
  c.fill();
  // foam line
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = 3;
  c.beginPath();
  for (let x = 0; x <= W; x += 10) c.lineTo(x, y - 2 + Math.sin(x * 0.05 + t * 2) * 2);
  c.stroke();
}

/** Palm tree from its foot (x, y), h tall, swaying with t. */
export function palm(c, x, y, h, t = 0, lean = 0.15) {
  const sway = Math.sin(t * 1.3 + x) * 0.04;
  const tx = x + h * (lean + sway);
  const ty = y - h;
  c.strokeStyle = '#a0703f';
  c.lineWidth = h * 0.06;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + h * lean * 0.2, y - h * 0.6, tx, ty);
  c.stroke();
  c.strokeStyle = 'rgba(90, 60, 30, 0.35)';
  c.lineWidth = h * 0.02;
  for (let i = 1; i < 8; i++) {
    const k = i / 8;
    const px = x + (tx - x) * k * k;
    const py = y + (ty - y) * k;
    c.beginPath();
    c.moveTo(px - h * 0.03, py);
    c.lineTo(px + h * 0.03, py - h * 0.01);
    c.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.55 + Math.sin(t * 1.8 + i) * 0.05;
    const len = h * (0.45 + (i % 2) * 0.1);
    c.save();
    c.translate(tx, ty);
    c.rotate(a);
    const g = c.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, PAL.palm);
    g.addColorStop(1, PAL.leaf);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -len * 0.22, len, len * 0.25);
    c.quadraticCurveTo(len * 0.5, len * 0.05, 0, 0);
    c.fill();
    c.restore();
  }
  circle(c, tx - 4, ty + 5, h * 0.035, '#6b4a2a');
  circle(c, tx + 5, ty + 6, h * 0.035, '#7b5632');
}

/** Pastel Creole house with balcony and shutters. */
export function creoleHouse(c, x, y, w, h, color, roof = '#c8553d') {
  shadowed(c, () => {
    c.fillStyle = color;
    c.fillRect(x, y - h, w, h);
  }, 12, 4, 'rgba(20,10,40,0.18)');
  c.fillStyle = roof;
  c.beginPath();
  c.moveTo(x - 8, y - h);
  c.lineTo(x + w / 2, y - h - h * 0.38);
  c.lineTo(x + w + 8, y - h);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fillRect(x + 4, y - h * 0.52, w - 8, 3);
  for (let i = 0; i < 2; i++) {
    const wx = x + w * (0.18 + i * 0.44);
    c.fillStyle = '#2f7a6d';
    c.fillRect(wx, y - h * 0.85, w * 0.2, h * 0.26);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(wx + w * 0.09, y - h * 0.85, 2, h * 0.26);
  }
  c.fillStyle = '#7a4a2a';
  rrect(c, x + w * 0.4, y - h * 0.4, w * 0.2, h * 0.4, 4);
  c.fill();
}

export function bubbles(c, W, H, t, n = 14) {
  for (let i = 0; i < n; i++) {
    const x = (i * 71) % W + Math.sin(t * 2 + i) * 6;
    const y = H - ((t * (30 + (i % 5) * 10) + i * 97) % (H + 40));
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
    c.stroke();
  }
}

export function lightRays(c, W, H, t) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = W * (0.1 + i * 0.22) + Math.sin(t * 0.5 + i) * 20;
    const g = c.createLinearGradient(x, 0, x + 60, H * 0.8);
    g.addColorStop(0, 'rgba(180, 255, 250, 0.18)');
    g.addColorStop(1, 'rgba(180, 255, 250, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 15, 0);
    c.lineTo(x + 25, 0);
    c.lineTo(x + 110, H * 0.8);
    c.lineTo(x + 30, H * 0.8);
    c.closePath();
    c.fill();
  }
  c.restore();
}

export function seaweed(c, x, y, h, t, color = '#1fa37a') {
  c.strokeStyle = color;
  c.lineWidth = 6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  for (let i = 1; i <= 6; i++) c.lineTo(x + Math.sin(t * 2 + i * 0.8 + x) * 8 * (i / 6), y - (h * i) / 6);
  c.stroke();
}

/** String of warm party bulbs between two points. */
export function bulbs(c, x0, y0, x1, y1, t, n = 9) {
  c.strokeStyle = 'rgba(30, 20, 40, 0.6)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 30, x1, y1);
  c.stroke();
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * ((x0 + x1) / 2) + k * k * x1;
    const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * (Math.max(y0, y1) + 30) + k * k * y1;
    const col = [PAL.mango, PAL.hibiscus, PAL.lagoon, PAL.leaf][i % 4];
    const on = 0.65 + 0.35 * Math.sin(t * 3 + i);
    const g = c.createRadialGradient(x, y + 5, 0, x, y + 5, 16);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = on;
    c.fillStyle = g;
    c.fillRect(x - 16, y - 11, 32, 32);
    c.globalAlpha = 1;
    circle(c, x, y + 5, 4, col);
  }
}

/** Neon sign text with glow. */
export function neon(c, str, x, y, size, color, t = 0) {
  const flicker = 0.85 + 0.15 * Math.sin(t * 20) * Math.sin(t * 7);
  c.save();
  c.globalAlpha = flicker;
  c.shadowColor = color;
  c.shadowBlur = size * 0.8;
  text(c, str, x, y, { size, color: '#fff', shadow: false, weight: 600 });
  c.shadowBlur = size * 0.4;
  text(c, str, x, y, { size, color, shadow: false, weight: 600 });
  c.restore();
}

// ---- full scenes (background only, characters are drawn by the game) ----------------

export const scene = {
  /** Sunset beach with the Diamond Rock and palms. horizon ~ 0.45 H. */
  beach(c, W, H, t, { horizon = 0.46, shore = 0.6 } = {}) {
    sky(c, W, H * horizon, ['#5ab8e8', '#ffb38a', '#ffd59e']);
    sun(c, W * 0.72, H * horizon * 0.62, 26);
    diamondRock(c, W * 0.28, H * horizon, 46);
    sea(c, W, H * horizon, H * (shore - horizon), t);
    sand(c, W, H * shore, H, t);
    palm(c, -10, H * shore + 40, H * 0.42, t, 0.25);
    palm(c, W + 10, H * shore + 70, H * 0.38, t + 1, -0.28);
  },
  /** Underwater lagoon. */
  lagoon(c, W, H, t) {
    sky(c, W, H, ['#2fd6d2', '#0a8fb0', '#063f5c']);
    lightRays(c, W, H, t);
    c.fillStyle = vgrad(c, H * 0.86, H, ['#e9cf98', '#c9a66c']);
    c.beginPath();
    c.moveTo(0, H * 0.9);
    for (let x = 0; x <= W; x += 25) c.lineTo(x, H * 0.88 + Math.sin(x * 0.04) * 8);
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.fill();
    for (let i = 0; i < 6; i++) seaweed(c, 20 + i * 72, H * 0.9, 60 + (i % 3) * 30, t, i % 2 ? '#1fa37a' : '#2bc48a');
    for (let i = 0; i < 4; i++) ellipse(c, 60 + i * 100, H * 0.9, 22, 12, ['#ff8fa3', '#ffb38a', '#cdb4ff', '#ff6f61'][i]);
    bubbles(c, W, H, t);
  },
  /** Bright modern office with a sea view. */
  office(c, W, H, t) {
    sky(c, W, H, ['#f3efe7', '#e8e1d5']);
    // window
    shadowed(c, () => {
      rrect(c, 30, 70, W - 60, H * 0.32, 18);
      c.fillStyle = '#7fd3ef';
      c.fill();
    }, 16, 6, 'rgba(20,10,40,0.15)');
    c.save();
    rrect(c, 30, 70, W - 60, H * 0.32, 18);
    c.clip();
    sky(c, W, 70 + H * 0.2, ['#7fd3ef', '#bfeaf6']);
    sea(c, W, 70 + H * 0.2, H * 0.12, t);
    diamondRock(c, W * 0.7, 70 + H * 0.2, 30);
    palm(c, 60, 70 + H * 0.34, H * 0.22, t, 0.2);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.fillRect(W / 2 - 2, 70, 4, H * 0.32);
    // floor
    c.fillStyle = vgrad(c, H * 0.62, H, ['#d9c7ae', '#c4ae90']);
    c.fillRect(0, H * 0.62, W, H * 0.38);
    // plant
    rrect(c, W - 70, H * 0.55, 40, 50, 8);
    c.fillStyle = PAL.coral;
    c.fill();
    for (let i = 0; i < 5; i++) ellipse(c, W - 50 + (i - 2) * 9, H * 0.52 - (i % 2) * 14, 9, 24, i % 2 ? PAL.palm : PAL.leaf, (i - 2) * 0.35);
  },
  /** Le Molière: dark club with neon and sweeping spots. */
  club(c, W, H, t) {
    sky(c, W, H, [PAL.night, '#2c1550', '#120a26']);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const a = Math.sin(t * 0.9 + i * 2) * 0.6;
      const col = [PAL.hibiscus, PAL.lagoon, PAL.mango][i];
      c.save();
      c.translate(W * (0.2 + i * 0.3), 0);
      c.rotate(a);
      const g = c.createLinearGradient(0, 0, 0, H * 0.9);
      g.addColorStop(0, col + '88');
      g.addColorStop(1, col + '00');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-8, 0);
      c.lineTo(8, 0);
      c.lineTo(90, H * 0.9);
      c.lineTo(-90, H * 0.9);
      c.fill();
      c.restore();
    }
    c.restore();
    neon(c, 'Le Molière', W / 2, 60, 34, PAL.hibiscus, t);
    c.fillStyle = vgrad(c, H * 0.72, H, ['#3a1d5e', '#1a0f33']);
    c.fillRect(0, H * 0.72, W, H * 0.28);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = `hsla(${(i * 45 + t * 60) % 360}, 80%, 60%, 0.18)`;
      c.fillRect(i * (W / 8), H * 0.72, W / 8 - 2, H * 0.28);
    }
  },
  /** Creole street by the little castle, daytime. */
  street(c, W, H, t) {
    sky(c, W, H * 0.6, ['#4fb6ec', '#a9e2f7']);
    sun(c, W * 0.85, 70, 20);
    // castle on the hill
    c.fillStyle = '#c9b79a';
    c.fillRect(W * 0.55, H * 0.2, 90, 70);
    for (let i = 0; i < 5; i++) c.fillRect(W * 0.55 + i * 20, H * 0.2 - 12, 12, 12);
    c.fillRect(W * 0.55 + 30, H * 0.2 - 40, 28, 40);
    c.fillStyle = PAL.hibiscus;
    c.beginPath();
    c.moveTo(W * 0.55 + 44, H * 0.2 - 62);
    c.lineTo(W * 0.55 + 62, H * 0.2 - 55);
    c.lineTo(W * 0.55 + 44, H * 0.2 - 48);
    c.fill();
    c.fillStyle = vgrad(c, H * 0.28, H * 0.42, ['#47b26b', '#2f8f52']);
    c.beginPath();
    c.ellipse(W * 0.6, H * 0.36, W * 0.7, H * 0.09, 0, Math.PI, 0);
    c.fill();
    c.fillRect(0, H * 0.35, W, H * 0.1);
    creoleHouse(c, 10, H * 0.45, 90, 80, PAL.creole[0]);
    creoleHouse(c, 300, H * 0.45, 90, 70, PAL.creole[2], '#3d7ac8');
    palm(c, 130, H * 0.46, 120, t, 0.1);
    // road
    c.fillStyle = vgrad(c, H * 0.45, H, ['#77788a', '#5a5b6c']);
    c.fillRect(0, H * 0.45, W, H * 0.55);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 6; i++) c.fillRect(i * 80 + 10, H * 0.75, 40, 5);
  },
  /** Night garden party with string lights. */
  garden(c, W, H, t) {
    sky(c, W, H, ['#1a1a4a', '#3d2a6b', '#6b3b6b']);
    for (let i = 0; i < 30; i++) circle(c, (i * 97) % W, (i * 53) % (H * 0.4), 1 + (i % 3) * 0.5, `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 2 + i)})`);
    palm(c, -20, H * 0.75, H * 0.5, t, 0.2);
    palm(c, W + 20, H * 0.75, H * 0.45, t + 2, -0.2);
    c.fillStyle = vgrad(c, H * 0.7, H, ['#2b6b4a', '#1c4a33']);
    c.fillRect(0, H * 0.7, W, H * 0.3);
    bulbs(c, 0, 90, W, 120, t, 10);
    bulbs(c, 0, 180, W, 150, t + 1, 10);
  },
  /** Sunny backyard barbecue with bougainvillea. */
  yard(c, W, H, t) {
    sky(c, W, H * 0.6, ['#58bdf0', '#bdeafa']);
    sun(c, 70, 80, 22);
    c.fillStyle = '#f4e9d8';
    c.fillRect(0, H * 0.3, W, H * 0.3);
    for (let i = 0; i < 18; i++) circle(c, (i * 29) % W, H * 0.3 + Math.sin(i) * 14, 16, i % 3 ? '#e0408a' : '#c72c7a');
    for (let i = 0; i < 10; i++) ellipse(c, (i * 47) % W, H * 0.32 + (i % 3) * 10, 10, 6, PAL.palm);
    c.fillStyle = vgrad(c, H * 0.6, H, ['#5bc26a', '#3a9a50']);
    c.fillRect(0, H * 0.6, W, H * 0.4);
  },
  /** Mangrove: green water and roots (Georges the croco's home). */
  mangrove(c, W, H, t) {
    sky(c, W, H * 0.5, ['#7cc8a8', '#c9ecd2']);
    c.fillStyle = '#2f7a4f';
    for (let i = 0; i < 7; i++) ellipse(c, i * 70, H * 0.33, 60, 40, i % 2 ? '#2f7a4f' : '#3a9160');
    c.strokeStyle = '#5a4030';
    c.lineWidth = 4;
    for (let i = 0; i < 14; i++) {
      const x = i * 30 + 5;
      c.beginPath();
      c.moveTo(x, H * 0.36);
      c.quadraticCurveTo(x + 10, H * 0.45, x - 6 + (i % 3) * 6, H * 0.52);
      c.stroke();
    }
    c.fillStyle = vgrad(c, H * 0.5, H, ['#3f8f7a', '#1d5a4c']);
    c.fillRect(0, H * 0.5, W, H * 0.5);
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = H * 0.55 + i * 30;
      const x = (i * 61 + t * 15) % (W + 60) - 30;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 30, y);
      c.stroke();
    }
  },
  /** Corn silo against a big sky. */
  silo(c, W, H, t) {
    sky(c, W, H, ['#ffb38a', '#ffd9a8', '#a8dcf0']);
    for (let i = 0; i < 4; i++) ellipse(c, ((i * 130 + t * 12) % (W + 120)) - 60, 80 + i * 40, 50, 14, 'rgba(255,255,255,0.7)');
  },
  /** Video call grid background. */
  call(c, W, H) {
    sky(c, W, H, ['#22263a', '#151826']);
  },
};

/** Splits str into lines that fit maxW at the given font size. */
export function wrap(c, str, maxW, size, weight = 600) {
  c.save();
  c.font = `${weight} ${size}px ${FONT}`;
  const words = String(str).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = c.measureText(test).width || test.length * size * 0.5;
    if (width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  c.restore();
  return lines;
}
