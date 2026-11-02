/*
 * 103 SPX canvas textures, painted once at start (no image files): the road
 * with its centre dashes and gutters, pavements, grass, Montceau house fronts
 * (rendered or brick, shutters, lace curtains, a few shops), roof tiles, the
 * ZUP tower blocks, road signs and soft sprites. Seeded, so the town looks the
 * same every ride.
 */
import * as THREE from 'three';

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** A texture from a canvas; repeat wraps it, srgb for colour maps. */
export function texture(c, { repeat = false, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  t.anisotropy = aniso;
  return t;
}

/** Per-pixel grain: brightness wobble of ±amount (0..255). */
function grain(g, w, h, amount, rnd, tint = [1, 1, 1]) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 2 * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n * tint[0]));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * tint[1]));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * tint[2]));
  }
  g.putImageData(img, 0, 0);
}

/** Soft blotches, drawn wrapped vertically so the texture tiles along the road. */
function blotches(g, w, h, n, rnd, colors, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = rMin + rnd() * (rMax - rMin);
    const col = colors[Math.floor(rnd() * colors.length)];
    for (const oy of [-h, 0, h]) {
      const grad = g.createRadialGradient(x, y + oy, 0, x, y + oy, r);
      grad.addColorStop(0, col.replace('A', String(alpha * (0.5 + rnd() * 0.5))));
      grad.addColorStop(1, col.replace('A', '0'));
      g.fillStyle = grad;
      g.fillRect(x - r, y + oy - r, r * 2, r * 2);
    }
  }
}

function crack(g, x, y, len, rnd, width = 1.4, color = 'rgba(20,20,22,0.55)') {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  let a = rnd() * Math.PI * 2;
  for (let k = 0; k < len; k++) {
    a += (rnd() - 0.5) * 1.1;
    x += Math.cos(a) * 7;
    y += Math.sin(a) * 7;
    g.lineTo(x, y);
  }
  g.stroke();
}

/**
 * The road: 7 m wide (u) by 14 m long (v), 73 px a metre. Gutters at both
 * kerbs, worn wheel tracks, oil down the lane middles, cracks and patches;
 * `dashes` paints the centre line (3 m dashes, 4 m gaps).
 */
export function roadCanvas({ dashes = true, seed = 3 } = {}) {
  const W = 512;
  const H = 1024;
  const pm = W / 7; // px per metre
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#56585e';
  g.fillRect(0, 0, W, H);
  blotches(g, W, H, 60, rnd, ['rgba(30,30,34,A)', 'rgba(120,120,126,A)', 'rgba(70,64,58,A)'], 20, 90, 0.16);
  // Lane centres (oil) and wheel tracks (polished lighter)
  for (const lane of [-1.65, 1.65]) {
    const cx = W / 2 + lane * pm;
    let grad = g.createLinearGradient(cx - 0.45 * pm, 0, cx + 0.45 * pm, 0);
    grad.addColorStop(0, 'rgba(20,18,16,0)');
    grad.addColorStop(0.5, 'rgba(20,18,16,0.2)');
    grad.addColorStop(1, 'rgba(20,18,16,0)');
    g.fillStyle = grad;
    g.fillRect(cx - 0.45 * pm, 0, 0.9 * pm, H);
    for (const t of [-0.85, 0.85]) {
      const tx = cx + t * pm;
      grad = g.createLinearGradient(tx - 0.28 * pm, 0, tx + 0.28 * pm, 0);
      grad.addColorStop(0, 'rgba(150,150,156,0)');
      grad.addColorStop(0.5, 'rgba(150,150,156,0.14)');
      grad.addColorStop(1, 'rgba(150,150,156,0)');
      g.fillStyle = grad;
      g.fillRect(tx - 0.28 * pm, 0, 0.56 * pm, H);
    }
  }
  // Repair patches
  for (let i = 0; i < 2; i++) {
    const pw = (0.8 + rnd() * 1.6) * pm;
    const ph = (0.8 + rnd() * 2.5) * pm;
    const px = 0.4 * pm + rnd() * (W - pw - 0.8 * pm);
    const py = rnd() * (H - ph);
    g.fillStyle = rnd() < 0.5 ? 'rgba(36,36,40,0.14)' : 'rgba(110,110,114,0.16)';
    g.fillRect(px, py, pw, ph);
    g.strokeStyle = 'rgba(15,15,18,0.28)';
    g.lineWidth = 2;
    g.strokeRect(px, py, pw, ph);
  }
  for (let i = 0; i < 14; i++) crack(g, rnd() * W, 30 + rnd() * (H - 60), 4 + Math.floor(rnd() * 10), rnd);
  // Tar-sealed joints (shiny black lines)
  for (let i = 0; i < 3; i++) crack(g, rnd() * W, 60 + rnd() * (H - 120), 12, rnd, 3.5, 'rgba(12,12,14,0.6)');
  grain(g, W, H, 26, rnd, [1, 1, 1.04]);
  // Gutters along the kerbs: concrete strip and a dark line where it meets the asphalt
  for (const side of [0, 1]) {
    const gx = side ? W - 0.32 * pm : 0;
    g.fillStyle = '#8c8a84';
    g.fillRect(gx, 0, 0.32 * pm, H);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(side ? gx - 2 : gx + 0.32 * pm - 1, 0, 3, H);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 0.5 * pm) g.fillRect(gx, y, 0.32 * pm, 2);
  }
  // Centre dashes, a little worn
  if (dashes) {
    for (const y0 of [0, 7 * pm]) {
      g.fillStyle = '#f2f0e8';
      g.fillRect(W / 2 - 0.06 * pm, y0 + 2 * pm, 0.12 * pm, 3 * pm);
    }
    const img = g.getImageData(W / 2 - 8, 0, 16, H);
    for (let i = 0; i < img.data.length; i += 4) if (img.data[i] > 200 && rnd() < 0.12) img.data[i + 3] = 0;
    g.putImageData(img, W / 2 - 8, 0);
  }
  return c;
}

/** Pavement: 2 m × 2 m of concrete slabs (1 m), stains. */
export function pavementCanvas(seed = 5) {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#bcb6aa';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * 128;
    const y = Math.floor(i / 2) * 128;
    g.fillStyle = `rgba(${rnd() < 0.5 ? '255,250,240' : '90,84,76'},${0.05 + rnd() * 0.08})`;
    g.fillRect(x, y, 128, 128);
  }
  blotches(g, S, S, 10, rnd, ['rgba(70,64,56,A)', 'rgba(40,40,40,A)'], 6, 26, 0.16);
  grain(g, S, S, 18, rnd);
  g.strokeStyle = 'rgba(70,64,56,0.55)';
  g.lineWidth = 2;
  for (let k = 0; k <= S; k += 128) {
    g.beginPath();
    g.moveTo(0, k);
    g.lineTo(S, k);
    g.moveTo(k, 0);
    g.lineTo(k, S);
    g.stroke();
  }
  // Chewing gum spots
  for (let i = 0; i < 6; i++) {
    g.fillStyle = 'rgba(60,58,56,0.5)';
    g.beginPath();
    g.arc(rnd() * S, rnd() * S, 2 + rnd() * 2, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** Kerb stones: light granite blocks, 1 m long. */
export function kerbCanvas(seed = 9) {
  const c = canvas(128, 32);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#c9c6bf';
  g.fillRect(0, 0, 128, 32);
  grain(g, 128, 32, 30, rnd);
  g.fillStyle = 'rgba(60,60,60,0.5)';
  g.fillRect(0, 0, 2, 32);
  g.fillRect(64, 0, 2, 32);
  return c;
}

/** Grass for the verges, gardens and the park: 8 m a tile. */
export function grassCanvas(seed = 11) {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#7f9a4c';
  g.fillRect(0, 0, S, S);
  blotches(g, S, S, 40, rnd, ['rgba(92,120,52,A)', 'rgba(150,160,80,A)', 'rgba(70,96,44,A)'], 30, 110, 0.35);
  for (let i = 0; i < 5000; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const l = 3 + rnd() * 6;
    g.strokeStyle = rnd() < 0.5 ? 'rgba(60,92,36,0.5)' : 'rgba(170,190,100,0.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rnd() - 0.5) * 3, y - l);
    g.stroke();
  }
  // Daisies and clover
  for (let i = 0; i < 60; i++) {
    g.fillStyle = rnd() < 0.7 ? 'rgba(255,255,250,0.85)' : 'rgba(250,215,80,0.85)';
    g.fillRect(rnd() * S, rnd() * S, 2, 2);
  }
  grain(g, S, S, 10, rnd);
  return c;
}

/* ---------------- House fronts ---------------- */

/**
 * The house fronts of Montceau: two floors, three bays, rendered walls or
 * brick, brick or stone window surrounds, painted shutters. Each variant is
 * one 512 × 512 canvas for an 8 m × 6 m front.
 */
export const FACADES = [
  { wall: '#e9dcc0', trim: 'brick', shutter: '#4f7d5a', door: '#7a4a2e' },
  { wall: '#d9b98b', trim: 'stone', shutter: '#7a4f33', door: '#5a3a24' },
  { wall: '#c9c4b8', trim: 'brick', shutter: '#5b7f9e', door: '#3e5670' },
  { wall: '#b5603f', brick: true, trim: 'stone', shutter: '#e9e3d4', door: '#6d3b26' },
  { wall: '#efe2a6', trim: 'stone', shutter: '#a33b2e', door: '#8a3a2a' },
  { wall: '#ead2c3', trim: 'brick', shutter: '#f4f1ea', door: '#455a64' },
  { wall: '#9c4f37', brick: true, trim: 'stone', shutter: '#3f6e57', door: '#3a2a20' },
  { wall: '#d8d2c2', trim: 'stone', shutter: '#9a8a6a', door: '#6b5a44', closed: true },
];

/** Shop fronts on the ground floor (the rest of the house above). */
export const SHOPS = {
  tabac: { wall: '#e6d6b8', trim: 'stone', shutter: '#4f6d7a', door: '#3a3a3a', sign: 'TABAC · PRESSE', signBg: '#b8322a', signFg: '#ffffff', front: '#7a1f1a', awning: ['#b8322a', '#f4efe2'] },
  boulangerie: { wall: '#efe4cc', trim: 'brick', shutter: '#6d4c2e', door: '#3a3a3a', sign: 'BOULANGERIE', signBg: '#f4e3b5', signFg: '#7a4a1e', front: '#6d4c2e', awning: ['#e0a22b', '#fff4d6'] },
  pharmacie: { wall: '#dfe5e0', trim: 'stone', shutter: '#3f6e57', door: '#3a3a3a', sign: 'PHARMACIE', signBg: '#2e8b57', signFg: '#ffffff', front: '#24563c', awning: ['#2e8b57', '#f2f7f2'] },
  cafe: { wall: '#e9d7b0', trim: 'brick', shutter: '#8a2a22', door: '#3a3a3a', sign: 'CAFÉ DES SPORTS', signBg: '#1f3f8f', signFg: '#ffd23f', front: '#1f2f5f', awning: ['#1f3f8f', '#f4efe2'] },
  coiffure: { wall: '#ecd8d4', trim: 'stone', shutter: '#a85a7a', door: '#3a3a3a', sign: 'COIFFURE', signBg: '#a85a7a', signFg: '#ffffff', front: '#5e2f45', awning: ['#a85a7a', '#fbeef2'] },
};

function bricks(g, x0, y0, w, h, base, rnd) {
  g.fillStyle = '#b8ab98';
  g.fillRect(x0, y0, w, h);
  const bw = 22;
  const bh = 9;
  const col = new THREE.Color(base);
  for (let y = y0, row = 0; y < y0 + h; y += bh + 2, row++) {
    for (let x = x0 - (row % 2 ? bw / 2 : 0); x < x0 + w; x += bw + 2) {
      const k = 0.82 + rnd() * 0.3;
      g.fillStyle = `rgb(${Math.min(255, col.r * 255 * k)},${Math.min(255, col.g * 255 * k)},${Math.min(255, col.b * 255 * k)})`;
      g.fillRect(Math.max(x0, x), y, Math.min(bw, x0 + w - Math.max(x0, x)), Math.min(bh, y0 + h - y));
    }
  }
}

function windowBay(g, x, y, w, h, f, rnd, opts = {}) {
  // Surround: brick or dressed stone
  const t = 11;
  if (f.trim === 'brick' && !f.brick) {
    bricks(g, x - t, y - t, w + t * 2, h + t * 2, '#a9553a', rnd);
  } else {
    g.fillStyle = f.brick ? '#e8dfcc' : '#efe8d8';
    g.fillRect(x - t, y - t, w + t * 2, h + t * 2);
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(x - t, y + h + t - 3, w + t * 2, 3);
  }
  // Glass: the sky's reflection
  const grad = g.createLinearGradient(x, y, x + w * 0.3, y + h);
  grad.addColorStop(0, '#a9c6dc');
  grad.addColorStop(0.45, '#4d6a82');
  grad.addColorStop(1, '#22313f');
  g.fillStyle = grad;
  g.fillRect(x, y, w, h);
  // Lace curtains in half the windows
  if (opts.curtain) {
    g.fillStyle = 'rgba(250,248,240,0.62)';
    g.fillRect(x + 3, y + 3, w - 6, h * 0.62);
    g.fillStyle = 'rgba(220,214,200,0.6)';
    for (let k = 0; k < 6; k++) g.fillRect(x + 6 + k * ((w - 12) / 6), y + 4, 2, h * 0.6);
  }
  // White frame and the cross bars
  g.strokeStyle = '#f6f4ee';
  g.lineWidth = 5;
  g.strokeRect(x + 2, y + 2, w - 4, h - 4);
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x + w / 2, y);
  g.lineTo(x + w / 2, y + h);
  g.moveTo(x, y + h * 0.36);
  g.lineTo(x + w, y + h * 0.36);
  g.stroke();
  // Sill
  g.fillStyle = '#e4dccb';
  g.fillRect(x - t - 3, y + h + t - 2, w + t * 2 + 6, 7);
  // Flower box with geraniums
  if (opts.flowers) {
    g.fillStyle = '#8a5a3a';
    g.fillRect(x + 2, y + h - 8, w - 4, 10);
    for (let k = 0; k < 9; k++) {
      g.fillStyle = k % 3 ? '#d93a3a' : '#4f8a3a';
      g.beginPath();
      g.arc(x + 8 + k * ((w - 16) / 8), y + h - 10 - rnd() * 6, 4 + rnd() * 2, 0, Math.PI * 2);
      g.fill();
    }
  }
  // Shutters (persiennes): open on both sides, or closed over the window
  const slats = (sx, sy, sw, sh) => {
    g.fillStyle = f.shutter;
    g.fillRect(sx, sy, sw, sh);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let k = sy + 4; k < sy + sh - 2; k += 6) g.fillRect(sx + 3, k, sw - 6, 2);
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.lineWidth = 2;
    g.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
  };
  if (opts.closed) {
    slats(x, y, w / 2, h);
    slats(x + w / 2, y, w / 2, h);
  } else if (opts.shutters !== false) {
    slats(x - t - w / 2 + 2, y - 2, w / 2 - 2, h + 4);
    slats(x + w + t, y - 2, w / 2 - 2, h + 4);
  }
}

function door(g, x, y, w, h, color, rnd) {
  g.fillStyle = '#e8e0cf';
  g.fillRect(x - 10, y - 12, w + 20, h + 12);
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 3;
  g.strokeRect(x + 8, y + 26, w - 16, h * 0.32);
  g.strokeRect(x + 8, y + h * 0.5, w - 16, h * 0.4);
  // Fanlight
  g.fillStyle = '#3d556a';
  g.fillRect(x + 6, y + 6, w - 12, 14);
  // Knob and the little blue house number
  g.fillStyle = '#e8c35a';
  g.fillRect(x + w - 14, y + h * 0.5, 6, 6);
  g.fillStyle = '#1f4fa0';
  g.fillRect(x + w + 14, y + 10, 20, 15);
  g.fillStyle = '#ffffff';
  g.font = '700 12px sans-serif';
  g.textAlign = 'center';
  g.fillText(String(1 + Math.floor(rnd() * 60)), x + w + 24, y + 22);
  // Step
  g.fillStyle = '#b9b2a2';
  g.fillRect(x - 6, y + h - 6, w + 12, 6);
}

/** A house front, or a shop with the house above it. */
export function facadeCanvas(f, seed = 1) {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  if (f.brick) bricks(g, 0, 0, S, S, f.wall, rnd);
  else {
    g.fillStyle = f.wall;
    g.fillRect(0, 0, S, S);
    blotches(g, S, S, 30, rnd, ['rgba(120,100,80,A)', 'rgba(255,255,255,A)'], 20, 80, 0.12);
    grain(g, S, S, 16, rnd);
  }
  // Rain streaks under the eaves and grime at the foot
  let grad = g.createLinearGradient(0, 0, 0, 40);
  grad.addColorStop(0, 'rgba(60,50,40,0.35)');
  grad.addColorStop(1, 'rgba(60,50,40,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, 40);
  // Cornice
  g.fillStyle = '#e7dfcf';
  g.fillRect(0, 0, S, 10);
  g.fillStyle = 'rgba(0,0,0,0.2)';
  g.fillRect(0, 10, S, 3);
  const cols = [0.2, 0.5, 0.8];
  const ww = 58;
  const wh = 92;
  // Upper floor
  cols.forEach((cx, i) => windowBay(g, cx * S - ww / 2, 70, ww, wh, f, rnd, { curtain: rnd() < 0.5, flowers: i !== 1 && rnd() < 0.35, closed: f.closed && i !== 1 }));
  if (f.sign) {
    // Shop: fascia, shop window, awning painted flat (a 3D one goes on top)
    g.fillStyle = f.front;
    g.fillRect(14, 262, S - 28, 250);
    g.fillStyle = f.signBg;
    g.fillRect(20, 268, S - 40, 54);
    g.fillStyle = f.signFg;
    g.font = '700 38px Fredoka, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(f.sign, S / 2, 297, S - 70);
    grad = g.createLinearGradient(0, 330, 0, 500);
    grad.addColorStop(0, '#2c3e4c');
    grad.addColorStop(0.5, '#4f6e86');
    grad.addColorStop(1, '#1d2731');
    g.fillStyle = grad;
    g.fillRect(30, 336, 300, 164);
    // Things in the window
    for (let k = 0; k < 9; k++) {
      g.fillStyle = ['#e8c35a', '#d9534f', '#f4f1ea', '#5b9bd5', '#8bc34a'][k % 5];
      g.fillRect(44 + k * 31, 440 - rnd() * 40, 20, 40 + rnd() * 30);
    }
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.moveTo(60, 336);
    g.lineTo(130, 336);
    g.lineTo(60, 480);
    g.fill();
    g.strokeStyle = f.front;
    g.lineWidth = 6;
    g.strokeRect(30, 336, 300, 164);
    door(g, 362, 340, 100, 168, '#2f3a40', rnd);
  } else {
    // Ground floor: door on one side
    const doorAt = rnd() < 0.5 ? 0 : 2;
    cols.forEach((cx, i) => {
      if (i === doorAt) door(g, cx * S - 36, 318, 72, 190, f.door, rnd);
      else windowBay(g, cx * S - ww / 2, 330, ww, wh, f, rnd, { curtain: rnd() < 0.6, closed: f.closed && rnd() < 0.5 });
    });
    // Stone plinth
    g.fillStyle = '#a9a294';
    g.fillRect(0, 470, S, 42);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x < S; x += 64) g.fillRect(x, 470, 2, 42);
    g.fillRect(0, 470, S, 3);
  }
  // Downpipe
  g.fillStyle = '#7d7f80';
  g.fillRect(S - 12, 0, 7, S);
  grad = g.createLinearGradient(0, 430, 0, S);
  grad.addColorStop(0, 'rgba(40,34,28,0)');
  grad.addColorStop(1, 'rgba(40,34,28,0.35)');
  g.fillStyle = grad;
  g.fillRect(0, 430, S, 82);
  return c;
}

/** Side walls: the same render, one small window. */
export function sideWallCanvas(f, seed = 2) {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  if (f.brick) bricks(g, 0, 0, S, S, f.wall, rnd);
  else {
    g.fillStyle = f.wall;
    g.fillRect(0, 0, S, S);
    blotches(g, S, S, 12, rnd, ['rgba(120,100,80,A)'], 10, 50, 0.14);
    grain(g, S, S, 16, rnd);
  }
  g.fillStyle = '#e7dfcf';
  g.fillRect(0, 0, S, 5);
  windowBay(g, S * 0.5 - 18, 50, 36, 50, f, rnd, { shutters: false, curtain: true });
  g.fillStyle = '#a9a294';
  g.fillRect(0, 235, S, 21);
  return c;
}

/** Roof tiles (Burgundy flat/mechanical tiles), light so an instance colour can tint them. */
export function tilesCanvas(seed = 13) {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#d8d0c8';
  g.fillRect(0, 0, S, S);
  const tw = 21;
  const th = 16;
  for (let row = 0; row * th < S + th; row++) {
    const y = row * th;
    for (let x = -(row % 2) * (tw / 2); x < S; x += tw) {
      const k = 0.78 + rnd() * 0.3;
      const v = Math.floor(235 * k);
      const grad = g.createLinearGradient(0, y, 0, y + th);
      grad.addColorStop(0, `rgb(${v},${v - 8},${v - 14})`);
      grad.addColorStop(1, `rgb(${v - 60},${v - 66},${v - 70})`);
      g.fillStyle = grad;
      g.beginPath();
      g.roundRect(x + 1, y, tw - 2, th + 2, [0, 0, 6, 6]);
      g.fill();
    }
  }
  // Lichen and moss
  blotches(g, S, S, 18, rnd, ['rgba(120,130,70,A)', 'rgba(60,60,50,A)'], 6, 22, 0.3);
  return c;
}

/** The ZUP tower blocks: 4 m of a 5-storey front (windows, balconies with coloured panels). */
export function towerCanvas(panel = '#e07a2f', seed = 17) {
  const W = 256;
  const H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#e8e2d6';
  g.fillRect(0, 0, W, H);
  grain(g, W, H, 14, rnd);
  const fh = H / 5;
  for (let f = 0; f < 5; f++) {
    const y = f * fh;
    // Floor slab line
    g.fillStyle = '#cfc8ba';
    g.fillRect(0, y + fh - 8, W, 8);
    // Window
    const grad = g.createLinearGradient(0, y + 16, 0, y + fh - 26);
    grad.addColorStop(0, '#9fb9cc');
    grad.addColorStop(1, '#2e3f4e');
    g.fillStyle = grad;
    g.fillRect(24, y + 18, 90, fh - 46);
    g.strokeStyle = '#f2f0ea';
    g.lineWidth = 4;
    g.strokeRect(24, y + 18, 90, fh - 46);
    if (rnd() < 0.4) {
      g.fillStyle = 'rgba(240,236,226,0.8)';
      g.fillRect(28, y + 22, 82, (fh - 54) * 0.5);
    }
    // Balcony: coloured panel and railing
    g.fillStyle = f % 2 ? panel : '#f2efe8';
    g.fillRect(132, y + fh * 0.48, 112, fh * 0.42);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.fillRect(132, y + fh * 0.48, 112, 4);
    g.fillStyle = '#41505c';
    g.fillRect(140, y + 18, 96, fh * 0.42);
    // Washing on a line, now and then
    if (rnd() < 0.3) {
      for (let k = 0; k < 4; k++) {
        g.fillStyle = ['#e94f6b', '#ffffff', '#3a86ff', '#ffd23f'][k];
        g.fillRect(146 + k * 22, y + fh * 0.36, 14, 16);
      }
    }
  }
  return c;
}

/* ---------------- Signs, labels and sprites ---------------- */

/** French road signs: 'interdit' (no entry), 'cedez' (give way), 'bump' (speed bump), 'bus'. */
export function signCanvas(kind) {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.translate(S / 2, S / 2);
  if (kind === 'interdit') {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(0, 0, 62, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#d0202a';
    g.beginPath();
    g.arc(0, 0, 58, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(-42, -10, 84, 20);
  } else if (kind === 'cedez' || kind === 'bump') {
    const up = kind === 'bump';
    g.fillStyle = '#d0202a';
    g.beginPath();
    if (up) {
      g.moveTo(0, -60);
      g.lineTo(60, 48);
      g.lineTo(-60, 48);
    } else {
      g.moveTo(-60, -48);
      g.lineTo(60, -48);
      g.lineTo(0, 60);
    }
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    if (up) {
      g.moveTo(0, -36);
      g.lineTo(42, 38);
      g.lineTo(-42, 38);
    } else {
      g.moveTo(-40, -36);
      g.lineTo(40, -36);
      g.lineTo(0, 38);
    }
    g.closePath();
    g.fill();
    if (up) {
      g.fillStyle = '#111111';
      g.beginPath();
      g.moveTo(-26, 26);
      g.quadraticCurveTo(0, -4, 26, 26);
      g.closePath();
      g.fill();
    }
  } else if (kind === 'bus') {
    g.fillStyle = '#1f4fa0';
    g.fillRect(-60, -60, 120, 120);
    g.fillStyle = '#ffffff';
    g.font = '800 46px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('BUS', 0, 4);
  }
  return c;
}

/** A pill label with the name of someone (white letters). */
export function labelCanvas(text, bg = '#ef2d6b') {
  const c = canvas(512, 128);
  const g = c.getContext('2d');
  g.font = '800 64px Fredoka, system-ui, sans-serif';
  const w = Math.min(500, g.measureText(text).width + 60);
  g.shadowColor = 'rgba(0,0,0,0.35)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 4;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect((512 - w) / 2, 14, w, 96, 48);
  g.fill();
  g.shadowColor = 'transparent';
  g.lineWidth = 7;
  g.strokeStyle = '#ffffff';
  g.stroke();
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 64, 470);
  return c;
}

/** Blue enamel street plaque (green rim), white capitals. */
export function plaqueCanvas(text, color = '#1f4fa0') {
  const c = canvas(512, 140);
  const g = c.getContext('2d');
  const w = 512;
  const h = 140;
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
  return c;
}

/** A soft round glow (white centre fading out). */
export function glowCanvas(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = canvas(64, 64);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/** A soft cumulus cloud, for big billboards in the sky. */
export function cloudCanvas(seed = 21) {
  const W = 512;
  const H = 256;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  for (let i = 0; i < 26; i++) {
    const x = 90 + rnd() * (W - 180);
    const y = 110 + rnd() * 70 - Math.sin(((x - 90) / (W - 180)) * Math.PI) * 50;
    const r = 34 + rnd() * 56;
    const grad = g.createRadialGradient(x, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.6, 'rgba(250,246,240,0.6)');
    grad.addColorStop(1, 'rgba(240,236,232,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Grey-blue undersides
  const grad = g.createLinearGradient(0, 120, 0, 230);
  grad.addColorStop(0, 'rgba(160,170,190,0)');
  grad.addColorStop(1, 'rgba(160,170,190,0.45)');
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  return c;
}

/**
 * The far horizon, around the whole town: hills, roofs, the church spire,
 * chimneys and the mine headframes (chevalements) of Montceau, hazy blue.
 */
export function skylineCanvas(seed = 23) {
  const W = 2048;
  const H = 256;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  const base = H;
  // Far hills
  g.fillStyle = '#a7b4b8';
  g.beginPath();
  g.moveTo(0, base);
  for (let x = 0; x <= W; x += 16) g.lineTo(x, base - 70 - 30 * Math.sin((x / W) * Math.PI * 6) - 16 * Math.sin((x / W) * Math.PI * 23));
  g.lineTo(W, base);
  g.fill();
  // Nearer hills with woods
  g.fillStyle = '#8e9f94';
  g.beginPath();
  g.moveTo(0, base);
  for (let x = 0; x <= W; x += 12) g.lineTo(x, base - 40 - 18 * Math.sin((x / W) * Math.PI * 9 + 1) - 6 * rnd());
  g.lineTo(W, base);
  g.fill();
  // The town
  g.fillStyle = '#7c8a87';
  for (let x = 0; x < W; x += 30 + rnd() * 30) {
    const hh = 14 + rnd() * 22;
    const ww = 22 + rnd() * 26;
    g.fillRect(x, base - hh, ww, hh);
    g.beginPath();
    g.moveTo(x - 3, base - hh);
    g.lineTo(x + ww / 2, base - hh - 10);
    g.lineTo(x + ww + 3, base - hh);
    g.fill();
  }
  const headframe = (x, s) => {
    g.strokeStyle = '#5f6d6c';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x - 22 * s, base);
    g.lineTo(x, base - 120 * s);
    g.lineTo(x + 22 * s, base);
    g.moveTo(x - 14 * s, base - 45 * s);
    g.lineTo(x + 14 * s, base - 45 * s);
    g.moveTo(x - 8 * s, base - 84 * s);
    g.lineTo(x + 8 * s, base - 84 * s);
    g.moveTo(x, base - 120 * s);
    g.lineTo(x + 52 * s, base);
    g.stroke();
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x, base - 124 * s, 13 * s, 0, Math.PI * 2);
    g.stroke();
  };
  headframe(300, 1);
  headframe(1350, 0.8);
  g.fillStyle = '#5f6d6c';
  const spire = (x) => {
    g.fillRect(x - 14, base - 96, 28, 96);
    g.beginPath();
    g.moveTo(x - 18, base - 96);
    g.lineTo(x, base - 176);
    g.lineTo(x + 18, base - 96);
    g.fill();
  };
  spire(860);
  for (const x of [600, 1120, 1830]) g.fillRect(x, base - 140, 12, 140);
  // Haze toward the bottom
  const grad = g.createLinearGradient(0, base - 180, 0, base);
  grad.addColorStop(0, 'rgba(232,222,206,0)');
  grad.addColorStop(1, 'rgba(232,222,206,0.55)');
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  return c;
}

/** The chequered finish line. */
export function chequerCanvas() {
  const c = canvas(64, 16);
  const g = c.getContext('2d');
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 4; y++) {
      g.fillStyle = (x + y) % 2 ? '#111' : '#fff';
      g.fillRect(x * 4, y * 4, 4, 4);
    }
  }
  return c;
}

/** Zebra crossing stripes (0.5 m stripes across 7 m). */
export function zebraCanvas() {
  const c = canvas(256, 32);
  const g = c.getContext('2d');
  const rnd = seeded(31);
  for (let i = 0; i < 7; i++) {
    g.fillStyle = 'rgba(244,242,234,0.92)';
    g.fillRect(6 + i * 36, 0, 18, 32);
  }
  const img = g.getImageData(0, 0, 256, 32);
  for (let i = 0; i < img.data.length; i += 4) if (rnd() < 0.1) img.data[i + 3] *= 0.4;
  g.putImageData(img, 0, 0);
  return c;
}

/** Text painted on the side of something (POLICE, 103 SPX). */
export function decalCanvas(text, bg, fg, w = 256, h = 64, font = 40) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
  }
  g.fillStyle = fg;
  g.font = `800 ${font}px Fredoka, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2, w - 10);
  return c;
}
