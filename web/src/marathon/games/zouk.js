// Bal zouk (world 5): an open-air zouk ball in Martinique at night. String
// lights, palms, a little band on a madras-roofed stage, couples swaying in the
// back. 3-4 elegant ladies (generic, never named) stand along the dance floor.
// Now and then one of them turns to the hero: TELL = she faces him, closes her
// eyes in a big smile, blushes, gives a shy little wave, a pink heart pops over
// her head and a pink glow lights the floor under her (window shorter with
// speed). TAP her to get a dance. The others chat, laugh with each other, watch
// the band, look away, or glance over and roll their eyes ("pff", no heart).
// Tap one who is not smiling = "No thanks!" and a garden rake lands on the
// hero's head, BONK (un râteau). Timeout = a râteau too. Boss: 2 yeses needed.

import { person, palm, bulbs, neon, madras, madrasBand, diamondRock, sky, rrect, circle, ellipse, vgrad, shadowed, groundShadow, text, OUTFITS, PAL } from '../art.js';

const smooth = (u) => u * u * (3 - 2 * u);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const approach = (v, target, rate, dt) => v + (target - v) * Math.min(1, dt * rate);

const GOLD = '#f2c14e';
const LIPS = '#a8284a';

// The ladies' looks: two traditional (madras skirt, lace blouse, head-tie), three party dresses.
const TRAD = [
  { kind: 'trad', skin: '#6b4329', hair: '#1c1210', tint: null, blouse: '#fff8ee', shoes: '#c8553d' },
  { kind: 'trad', skin: '#b07650', hair: '#2a1a12', tint: 'rgba(205,30,80,0.38)', blouse: '#ffffff', shoes: '#7a2f6b' },
];
const PARTY = [
  { kind: 'party', skin: '#8d5a3b', hair: '#20150f', dress: ['#ff86ab', '#e0306b'], style: 'puff', flower: PAL.mango, shoes: '#ffd166' },
  { kind: 'party', skin: '#d29d74', hair: '#3a2416', dress: ['#6fe6de', '#109fae'], style: 'bun', flower: PAL.hibiscus, shoes: '#ffffff' },
  { kind: 'party', skin: '#4e2f20', hair: '#140c08', dress: ['#ffd36b', '#ff8a3c'], style: 'long', flower: '#ffffff', shoes: '#ef2d6b' },
];

// Arm poses: [upper, forearm] angles per side (0 = hanging down, positive = outwards).
function armPose(kind, t) {
  const w = Math.sin(t * 2) * 0.03;
  switch (kind) {
    case 'hip': return [[0.75, -1.9], [0.75, -1.9]];
    case 'wave': return [[0.14 + w, 0.1], [1.6, 1.0 + Math.sin(t * 12) * 0.35]];
    case 'chest': return [[0.14 + w, 0.1], [0.25, -1.6]];
    case 'dance': return [[1.2 + Math.sin(t * 3) * 0.3, 1.0], [1.2 - Math.sin(t * 3) * 0.3, 1.0]];
    case 'stop': return [[0.14, 0.1], [1.35, -0.4]];
    case 'clap': return [[0.3, -1.4 + Math.sin(t * 16) * 0.18], [0.3, -1.4 + Math.sin(t * 16) * 0.18]];
    case 'partner': return [[0.14, 0.1], [1.3 + Math.sin(t * 4) * 0.2, 1.0]];
    default: return [[0.14 + w, 0.1], [0.14 - w, 0.1]];
  }
}

/** Madras check over a rectangle (the current clip shapes it), optionally tinted. */
function madrasFill(c, x, y, w, h, tint) {
  c.save();
  c.translate(x, y);
  c.scale(0.42, 0.42);
  c.fillStyle = madras(c);
  c.fillRect(0, 0, w / 0.42, h / 0.42);
  c.restore();
  if (tint) {
    c.fillStyle = tint;
    c.fillRect(x, y, w, h);
  }
}

/** Soft side shading over a clipped garment, s wide around x = 0. */
function shade(c, y0, y1, s) {
  const g = c.createLinearGradient(-s * 0.2, 0, s * 0.2, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.2)');
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(30,10,40,0.22)');
  c.fillStyle = g;
  c.fillRect(-s * 0.25, y0, s * 0.5, y1 - y0);
}

function heartPath(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.25, x, y - r * 0.42);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.25, x + r * 1.5, y - r * 0.1, x, y + r * 0.9);
  c.closePath();
}

function heart(c, x, y, r, color = PAL.hibiscus) {
  shadowed(c, () => {
    heartPath(c, x, y, r);
    c.fillStyle = color;
    c.fill();
  }, 10, 3, 'rgba(255,60,120,0.5)');
  ellipse(c, x - r * 0.45, y - r * 0.35, r * 0.22, r * 0.14, 'rgba(255,255,255,0.6)', -0.5);
}

/** n-point star (sparkle with points = 4, cartoon star with 5). */
function star(c, x, y, r, rot, color, points = 5, inner = 0.45) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.restore();
}

/**
 * An elegant lady at the ball (generic, not a friend), feet at (x, y), s tall.
 * o: f (head turn -1..1, 0 = facing the hero), tilt, eyes, mouth, arms, sway,
 * blush, look, lean, bounce, reach ([x, y] local point her left hand holds).
 */
function lady(c, L, x, y, s, t, o = {}) {
  const { f = 0, tilt = 0, eyes = 'open', mouth = 'soft', arms = 'rest', sway = 0, blush = 0, look = 0, lean = 0, bounce = 0, reach = null } = o;
  const hemY = -s * 0.075;
  const waistY = -s * 0.4;
  const shY = -s * 0.565;
  const hx = sway * s * 0.06;
  c.save();
  groundShadow(c, x, y, s * 0.42);
  c.translate(x, y - bounce);
  c.rotate(lean);
  c.lineCap = 'round';
  // Ankles and shoes under the long skirt.
  c.strokeStyle = L.skin;
  c.lineWidth = s * 0.032;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * s * 0.045 + hx * 0.3, hemY - s * 0.01);
    c.lineTo(side * s * 0.045, -s * 0.02);
    c.stroke();
    ellipse(c, side * s * 0.052, -s * 0.012, s * 0.036, s * 0.016, L.shoes);
  }
  // Lace petticoat peeking under a traditional skirt.
  if (L.kind === 'trad') {
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      circle(c, -s * 0.19 + k * s * 0.38 + hx, hemY + Math.sin(k * Math.PI) * s * 0.022 + s * 0.006, s * 0.016, 'rgba(255,255,255,0.92)');
    }
  }
  // Long flared skirt that swings with the music.
  const skirt = () => {
    c.beginPath();
    c.moveTo(-s * 0.08, waistY);
    c.quadraticCurveTo(-s * 0.13 + hx * 0.4, -s * 0.25, -s * 0.2 + hx, hemY);
    c.quadraticCurveTo(hx, hemY + s * 0.035, s * 0.2 + hx, hemY);
    c.quadraticCurveTo(s * 0.13 + hx * 0.4, -s * 0.25, s * 0.08, waistY);
    c.closePath();
  };
  shadowed(c, () => {
    skirt();
    c.fillStyle = L.kind === 'trad' ? PAL.mango : L.dress[1];
    c.fill();
  }, 10, 4);
  c.save();
  skirt();
  c.clip();
  if (L.kind === 'trad') madrasFill(c, -s * 0.26, waistY, s * 0.52, -waistY, L.tint);
  else {
    c.fillStyle = vgrad(c, waistY, hemY, L.dress);
    c.fillRect(-s * 0.26, waistY, s * 0.52, -waistY);
  }
  c.strokeStyle = 'rgba(40,10,40,0.13)';
  c.lineWidth = s * 0.01;
  for (const k of [-0.6, -0.2, 0.2, 0.6]) {
    c.beginPath();
    c.moveTo(k * s * 0.07, waistY);
    c.quadraticCurveTo(k * s * 0.11 + hx * 0.4, -s * 0.24, k * s * 0.19 + hx, hemY);
    c.stroke();
  }
  shade(c, waistY, 0, s);
  c.restore();
  // Neck, then the bodice.
  rrect(c, -s * 0.028, -s * 0.665, s * 0.056, s * 0.11, s * 0.02);
  c.fillStyle = L.skin;
  c.fill();
  const bodice = () => {
    c.beginPath();
    c.moveTo(-s * 0.08, waistY + s * 0.012);
    c.quadraticCurveTo(-s * 0.095, -s * 0.48, -s * 0.1, shY + s * 0.012);
    c.quadraticCurveTo(0, shY - s * 0.03, s * 0.1, shY + s * 0.012);
    c.quadraticCurveTo(s * 0.095, -s * 0.48, s * 0.08, waistY + s * 0.012);
    c.closePath();
  };
  c.save();
  bodice();
  c.clip();
  c.fillStyle = L.kind === 'trad' ? L.blouse : vgrad(c, shY, waistY, [L.dress[0], L.dress[1]]);
  c.fillRect(-s * 0.12, shY - s * 0.04, s * 0.24, s * 0.22);
  if (L.kind === 'trad') {
    // Madras shoulder scarf, tied at the waist.
    c.save();
    c.beginPath();
    c.moveTo(-s * 0.11, shY);
    c.quadraticCurveTo(-s * 0.02, -s * 0.47, s * 0.09, waistY + s * 0.02);
    c.lineTo(s * 0.09, waistY + s * 0.06);
    c.quadraticCurveTo(-s * 0.05, -s * 0.46, -s * 0.11, shY + s * 0.07);
    c.closePath();
    c.clip();
    madrasFill(c, -s * 0.12, shY - s * 0.02, s * 0.24, s * 0.22, L.tint);
    c.restore();
  } else {
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(-s * 0.1, waistY - s * 0.012, s * 0.2, s * 0.022);
  }
  shade(c, shY - s * 0.04, waistY + s * 0.02, s);
  c.restore();
  // Scoop neckline and a gold necklace (collier choux on the madras ladies).
  c.beginPath();
  c.ellipse(0, shY - s * 0.004, s * 0.05, s * 0.034, 0, 0, Math.PI);
  c.fillStyle = L.skin;
  c.fill();
  for (let i = 0; i < 7; i++) {
    const a = 0.35 + (i / 6) * (Math.PI - 0.7);
    circle(c, Math.cos(a) * s * 0.045, shY + Math.sin(a) * s * 0.032, s * (L.kind === 'trad' ? 0.009 : 0.005), GOLD);
  }
  // Puffed sleeves or little cap sleeves.
  for (const side of [-1, 1]) {
    const col = L.kind === 'trad' ? L.blouse : L.dress[0];
    circle(c, side * s * 0.1, shY + s * 0.02, s * (L.kind === 'trad' ? 0.04 : 0.028), col);
    circle(c, side * s * 0.1 - s * 0.012, shY + s * 0.008, s * 0.014, 'rgba(255,255,255,0.35)');
  }
  // Arms.
  const pose = armPose(arms, t);
  c.strokeStyle = L.skin;
  c.lineWidth = s * 0.036;
  for (const side of [-1, 1]) {
    const sx = side * s * 0.1;
    const sy = shY + s * 0.025;
    let ex;
    let ey;
    let hx2;
    let hy2;
    if (side === -1 && reach) {
      [hx2, hy2] = reach;
      ex = (sx + hx2) / 2;
      ey = (sy + hy2) / 2 + s * 0.04;
    } else {
      const [a1, fore] = pose[side === -1 ? 0 : 1];
      ex = sx + side * Math.sin(a1) * s * 0.11;
      ey = sy + Math.cos(a1) * s * 0.11;
      const a2 = a1 + fore;
      hx2 = ex + side * Math.sin(a2) * s * 0.1;
      hy2 = ey + Math.cos(a2) * s * 0.1;
    }
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(ex, ey);
    c.lineTo(hx2, hy2);
    c.stroke();
    circle(c, hx2, hy2, s * 0.022, L.skin);
    if (L.kind === 'trad') {
      c.strokeStyle = GOLD;
      c.lineWidth = s * 0.008;
      c.beginPath();
      c.arc(ex + (hx2 - ex) * 0.75, ey + (hy2 - ey) * 0.75, s * 0.02, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = L.skin;
      c.lineWidth = s * 0.036;
    }
  }
  // Head.
  c.save();
  c.translate(0, -s * 0.64);
  c.rotate(tilt);
  c.translate(0, s * 0.64);
  ladyHead(c, L, s, t, { f, eyes, mouth, blush, look });
  c.restore();
  c.restore();
}

function ladyHead(c, L, s, t, { f, eyes, mouth, blush, look }) {
  const hy = -s * 0.76;
  const rx = s * 0.105;
  const ry = s * 0.122;
  const fo = f * rx * 0.42;
  // Hair behind the head.
  if (L.style === 'puff') {
    circle(c, -f * rx * 0.2, hy - ry * 0.72, rx * 1.05, L.hair);
    circle(c, -rx * 0.8 - f * rx * 0.2, hy - ry * 0.35, rx * 0.55, L.hair);
    circle(c, rx * 0.8 - f * rx * 0.2, hy - ry * 0.35, rx * 0.55, L.hair);
    circle(c, -rx * 0.3 - f * rx * 0.2, hy - ry * 1.15, rx * 0.35, 'rgba(255,255,255,0.08)');
  } else if (L.style === 'long') {
    rrect(c, -rx * 1.18 - f * rx * 0.25, hy - ry * 0.9, rx * 2.36, ry * 2.05, rx * 0.8);
    c.fillStyle = L.hair;
    c.fill();
  } else if (L.style === 'bun') {
    circle(c, -f * rx * 0.3, hy - ry * 1.05, rx * 0.5, L.hair);
  }
  // Ears (the one on the turned side hides) and their gold hoops come later.
  const ears = [];
  for (const side of [-1, 1]) {
    if (side * f > 0.45) continue;
    const ex = side * rx * 0.96 - f * rx * 0.3;
    ears.push(ex);
    ellipse(c, ex, hy + ry * 0.08, rx * 0.14, ry * 0.18, L.skin);
  }
  // Face.
  const g = c.createRadialGradient(-rx * 0.35, hy - ry * 0.4, rx * 0.1, 0, hy, rx * 1.2);
  g.addColorStop(0, 'rgba(255,255,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ellipse(c, 0, hy, rx, ry, L.skin);
  ellipse(c, 0, hy, rx, ry, g);
  if (L.kind === 'trad') {
    // Madras head-tie with its points on top.
    const cx = -f * rx * 0.15;
    for (const i of [-1, 0, 1]) {
      const bx = cx + i * rx * 0.42;
      const by = hy - ry * 0.95;
      c.save();
      c.beginPath();
      c.moveTo(bx - rx * 0.2, by + ry * 0.12);
      c.quadraticCurveTo(bx + i * rx * 0.1, by - ry * 0.5, bx + i * rx * 0.3 + rx * 0.08, by - ry * 0.55);
      c.quadraticCurveTo(bx + rx * 0.12, by - ry * 0.2, bx + rx * 0.2, by + ry * 0.12);
      c.closePath();
      c.clip();
      madrasFill(c, bx - rx * 0.4, by - ry * 0.6, rx * 0.9, ry * 0.8, L.tint);
      c.restore();
    }
    c.save();
    c.beginPath();
    c.ellipse(cx, hy - ry * 0.32, rx * 1.12, ry * 0.8, 0, Math.PI, Math.PI * 2);
    c.quadraticCurveTo(cx, hy - ry * 0.12, cx - rx * 1.12, hy - ry * 0.32);
    c.closePath();
    c.clip();
    madrasFill(c, cx - rx * 1.2, hy - ry * 1.2, rx * 2.4, ry * 1.0, L.tint);
    c.fillStyle = 'rgba(30,10,40,0.15)';
    c.fillRect(cx - rx * 1.2, hy - ry * 0.45, rx * 2.4, ry * 0.2);
    c.restore();
    circle(c, cx + rx * 0.78, hy - ry * 0.72, rx * 0.18, L.tint ? '#d8405e' : '#e8a020');
  } else {
    // Hair cap and a flower tucked over the ear.
    c.save();
    c.beginPath();
    c.ellipse(0, hy, rx, ry, 0, 0, Math.PI * 2);
    c.clip();
    ellipse(c, -f * rx * 0.25, hy - ry * 0.95, rx * 1.3, ry * 0.62, L.hair);
    ellipse(c, -f * rx * 0.25 - rx * 0.3, hy - ry * 0.85, rx * 0.4, ry * 0.12, 'rgba(255,255,255,0.12)', -0.3);
    c.restore();
    const flowerX = (f > 0 ? -1 : 1) * rx * 0.8;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      ellipse(c, flowerX + Math.cos(a) * rx * 0.16, hy - ry * 0.6 + Math.sin(a) * rx * 0.16, rx * 0.14, rx * 0.1, L.flower, a);
    }
    circle(c, flowerX, hy - ry * 0.6, rx * 0.07, '#ffd34d');
  }
  // Eyes and brows.
  const ey = hy + ry * 0.02;
  const sp = rx * 0.4 * (1 - Math.abs(f) * 0.3);
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    const ex = fo + side * sp;
    c.strokeStyle = PAL.ink;
    c.lineWidth = rx * 0.07;
    if (eyes === 'happy') {
      c.beginPath();
      c.arc(ex, ey + ry * 0.06, rx * 0.13, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    } else if (eyes === 'closed') {
      c.beginPath();
      c.arc(ex, ey - ry * 0.04, rx * 0.12, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    } else if (eyes === 'roll') {
      ellipse(c, ex, ey, rx * 0.13, ry * 0.15, '#ffffff');
      circle(c, ex + look * rx * 0.03, ey - ry * 0.08, rx * 0.075, '#2a1a14');
      c.save();
      c.beginPath();
      c.ellipse(ex, ey, rx * 0.13, ry * 0.15, 0, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = L.skin;
      c.fillRect(ex - rx * 0.15, ey - ry * 0.2, rx * 0.3, ry * 0.11);
      c.restore();
      c.beginPath();
      c.moveTo(ex - rx * 0.14, ey - ry * 0.09);
      c.lineTo(ex + rx * 0.14, ey - ry * 0.09);
      c.stroke();
    } else {
      ellipse(c, ex + look * rx * 0.05, ey, rx * 0.105, ry * 0.135, '#2a1a14');
      circle(c, ex + look * rx * 0.05 + rx * 0.035, ey - ry * 0.05, rx * 0.04, '#ffffff');
    }
    // Lashes.
    c.lineWidth = rx * 0.04;
    c.beginPath();
    c.moveTo(ex + side * rx * 0.1, ey - ry * 0.07);
    c.lineTo(ex + side * rx * 0.19, ey - ry * 0.14);
    c.stroke();
    // Brows.
    c.strokeStyle = L.hair;
    c.lineWidth = rx * 0.05;
    const by = ey - ry * (eyes === 'roll' ? 0.32 : eyes === 'happy' ? 0.3 : 0.25);
    c.beginPath();
    if (eyes === 'roll') {
      c.moveTo(ex - rx * 0.13, by + side * ry * 0.02);
      c.lineTo(ex + rx * 0.13, by - side * ry * 0.02);
    } else {
      c.arc(ex, by + ry * 0.08, rx * 0.15, Math.PI * 1.2, Math.PI * 1.8);
    }
    c.stroke();
  }
  // Nose.
  c.strokeStyle = 'rgba(40,15,10,0.35)';
  c.lineWidth = rx * 0.045;
  c.beginPath();
  c.arc(fo * 1.2, hy + ry * 0.2, rx * 0.07, 0.3, Math.PI - 0.3);
  c.stroke();
  // Cheeks.
  if (blush > 0.01) {
    for (const side of [-1, 1]) ellipse(c, fo + side * rx * 0.56, hy + ry * 0.3, rx * 0.17, ry * 0.09, `rgba(255,105,140,${0.5 * blush})`);
  }
  // Mouth.
  const mx = fo * 1.15;
  const my = hy + ry * 0.47;
  c.strokeStyle = LIPS;
  c.lineWidth = rx * 0.055;
  if (mouth === 'smile') {
    c.beginPath();
    c.moveTo(mx - rx * 0.24, my - ry * 0.05);
    c.quadraticCurveTo(mx, my + ry * 0.3, mx + rx * 0.24, my - ry * 0.05);
    c.quadraticCurveTo(mx, my + ry * 0.05, mx - rx * 0.24, my - ry * 0.05);
    c.fillStyle = '#7a1530';
    c.fill();
    ellipse(c, mx, my + ry * 0.03, rx * 0.15, ry * 0.035, '#ffffff');
  } else if (mouth === 'laugh') {
    c.beginPath();
    c.moveTo(mx - rx * 0.2, my - ry * 0.06);
    c.quadraticCurveTo(mx, my + ry * 0.42, mx + rx * 0.2, my - ry * 0.06);
    c.closePath();
    c.fillStyle = '#6e1427';
    c.fill();
    ellipse(c, mx, my + ry * 0.12, rx * 0.09, ry * 0.06, '#ff8fa3');
    ellipse(c, mx, my - ry * 0.03, rx * 0.14, ry * 0.03, '#ffffff');
  } else if (mouth === 'talk') {
    ellipse(c, mx, my, rx * 0.08, ry * (0.04 + 0.06 * Math.abs(Math.sin(t * 13))), '#6e1427');
  } else if (mouth === 'flat') {
    c.beginPath();
    c.moveTo(mx - rx * 0.12, my);
    c.quadraticCurveTo(mx, my - ry * 0.03, mx + rx * 0.13, my + ry * 0.03);
    c.stroke();
  } else {
    c.beginPath();
    c.arc(mx, my - ry * 0.08, rx * 0.14, 0.4, Math.PI - 0.4);
    c.stroke();
  }
  // Gold hoop earrings.
  c.strokeStyle = GOLD;
  c.lineWidth = rx * 0.07;
  for (const ex of ears) {
    c.beginPath();
    c.arc(ex, hy + ry * 0.42, rx * 0.17, 0, Math.PI * 2);
    c.stroke();
    circle(c, ex - rx * 0.1, hy + ry * 0.36, rx * 0.03, 'rgba(255,255,255,0.8)');
  }
}

/** Dancing couple in the back: soft violet shapes holding each other. */
function couple(c, x, y, s, t, ph) {
  const sw = Math.sin(t * 2.2 + ph);
  c.save();
  c.translate(x + sw * 3, y);
  c.rotate(sw * 0.07);
  groundShadow(c, 0, 0, s * 0.5);
  const cols = ['#3d2468', '#55307a'];
  for (const side of [-1, 1]) {
    const px = side * s * 0.12;
    const col = cols[side < 0 ? 0 : 1];
    c.fillStyle = col;
    if (side > 0) {
      c.beginPath();
      c.moveTo(px - s * 0.06, -s * 0.36);
      c.lineTo(px + s * 0.06, -s * 0.36);
      c.lineTo(px + s * 0.14 + sw * s * 0.03, -s * 0.04);
      c.lineTo(px - s * 0.12 + sw * s * 0.03, -s * 0.04);
      c.closePath();
      c.fill();
    } else {
      rrect(c, px - s * 0.06, -s * 0.36, s * 0.12, s * 0.34, s * 0.04);
      c.fill();
    }
    rrect(c, px - s * 0.075, -s * 0.64, s * 0.15, s * 0.32, s * 0.06);
    c.fill();
    circle(c, px - side * s * 0.02, -s * 0.76, s * 0.1, col);
    circle(c, px - side * s * 0.05, -s * 0.8, s * 0.035, 'rgba(255,150,210,0.35)');
  }
  c.strokeStyle = '#4a2a72';
  c.lineWidth = s * 0.05;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.06, -s * 0.56);
  c.quadraticCurveTo(0, -s * 0.66, s * 0.07, -s * 0.56);
  c.stroke();
  c.restore();
}

/** A cartoon garden rake. Origin at the middle of its metal head, handle up. */
function rake(c, x, y, rot, s) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  shadowed(c, () => {
    rrect(c, -s * 0.03, -s, s * 0.06, s, s * 0.03);
    const g = c.createLinearGradient(-s * 0.03, 0, s * 0.03, 0);
    g.addColorStop(0, '#e0a868');
    g.addColorStop(1, '#9a6430');
    c.fillStyle = g;
    c.fill();
  }, 8, 3);
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.fillRect(-s * 0.018, -s * 0.95, s * 0.012, s * 0.85);
  c.fillStyle = '#8a95a3';
  for (let i = 0; i < 9; i++) {
    const tx = -s * 0.2 + (i / 8) * s * 0.4;
    rrect(c, tx - s * 0.011, -s * 0.01, s * 0.022, s * 0.13, s * 0.011);
    c.fill();
  }
  rrect(c, -s * 0.23, -s * 0.035, s * 0.46, s * 0.06, s * 0.03);
  c.fillStyle = vgrad(c, -s * 0.035, s * 0.025, ['#e4ebf2', '#7d8794']);
  c.fill();
  circle(c, 0, -s * 0.03, s * 0.04, '#6d7684');
  c.restore();
}

export default {
  id: 'zouk',
  world: 'w05',
  input: 'tap',
  base: 4.5,
  min: 2.8,
  survive: false,
  verb: { en: 'GET A DANCE!', fr: 'DÉCROCHE UNE DANSE !' },
  title: { en: 'Zouk ball', fr: 'Eul’ bal zouk' },
  howto: {
    en: 'Tap the lady who smiles at you with a little heart. Not the others!',
    fr: 'Touche la dame qui te sourit avec un petit cœur. Pas les autres !',
  },
  winLine: { en: "Hoho, I've still got it!", fr: "Hoho, j'ai encore la cote !" },
  rival: ['babar', 'mamar'],
  rivalLine: { en: 'She said yes?! Impossible…', fr: 'Elle a dit oui ?! Impossible…' },
  loseLine: { en: 'Hoho… another rake!', fr: 'Hoho… encore un râteau !' },
  create(g) {
    const W = g.W;
    const H = g.H;
    const sp = g.speed;
    const n = sp < 1.5 ? 3 : 4;
    const needed = g.boss ? 2 : 1;
    // Tempos (all shrink with speed).
    const turnT = 0.2 / Math.pow(sp, 0.7);
    const winT = (0.95 / Math.pow(sp, 0.85)) * (g.boss ? 0.85 : 1);
    const backT = 0.18 / sp;
    const glanceT = 0.6 / Math.pow(sp, 0.7);
    const firstAt = 0.6 / Math.sqrt(sp);
    const gap = () => (0.35 + g.random() * 0.4) / Math.pow(sp, 0.8);
    // Layout.
    const hY = H * 0.3; // sea horizon
    const floorTop = H * 0.4;
    const stY = floorTop + 6;
    const ladyFeet = H * 0.63;
    const ladySize = n === 3 ? 168 : 158;
    const xs = n === 3 ? [80, 200, 320] : [54, 148, 252, 346];
    const half = n === 3 ? 58 : 46;
    const HX = 200;
    const HF = H * 0.9;
    const HS = 150;
    const DANCE_HX = 168;
    const DANCE_LX = 236;
    const FX = 344;
    const FF = H * 0.91;
    const fallT = 0.32;
    const friend = g.friend();
    const ho = OUTFITS[g.hero] || OUTFITS.panda;
    const hk = HS * (ho.small || 1) * (ho.tall || 1);
    // Looks: 1-2 traditional madras outfits, the rest party dresses, shuffled.
    const shuffle = (list) => {
      const a = [...list];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(g.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const nTrad = n === 3 ? 1 + (g.random() < 0.5 ? 1 : 0) : 2;
    const looks = shuffle([...shuffle(TRAD).slice(0, nTrad), ...shuffle(PARTY).slice(0, n - nTrad)]);
    const women = xs.map((x, i) => ({
      x,
      feet: ladyFeet + (i % 2) * 6,
      size: ladySize,
      L: looks[i],
      nb: i < n / 2 ? 1 : -1, // which way her friends are
      band: x <= 200 ? 1 : -1,
      phase: g.random() * 6,
      mode: 'idle', // idle | glance | turn | smile | back | refuse | yes | dance
      mt: 0,
      md: 0,
      sub: 'chat',
      subT: 0,
      glanceIn: (0.5 + g.random() * 1.4) / Math.pow(sp, 0.8),
      f: (i < n / 2 ? 1 : -1) * 0.8,
      heart: 0,
      blush: 0,
      accepted: false,
    }));
    const SUBS = ['chat', 'laugh', 'band', 'away'];
    for (const w of women) {
      w.sub = SUBS[Math.floor(g.random() * SUBS.length)];
      w.subT = (0.7 + g.random()) / Math.sqrt(sp);
    }
    const dir = { cur: null, last: null, wait: firstAt };
    const s = { t: 0, endT: 0, end: null, got: 0, partner: null, refuser: null, rakeAt: 0, rakeT: -1, bonked: false, cheered: false };

    const headTopOf = (w) => w.feet - w.size * 1.02;

    function toIdle(w) {
      w.mode = 'idle';
      w.mt = 0;
      w.glanceIn = (0.8 + g.random() * 1.4) / Math.pow(sp, 0.8);
      w.sub = SUBS[Math.floor(g.random() * SUBS.length)];
      w.subT = (0.7 + g.random()) / Math.sqrt(sp);
    }

    function startWindow() {
      const free = women.filter((w) => !w.accepted);
      let pool = free.filter((w) => w.mode === 'idle' && w !== dir.last);
      if (!pool.length) pool = free.filter((w) => w !== dir.last);
      if (!pool.length) pool = free;
      if (!pool.length) return;
      const w = pool[Math.floor(g.random() * pool.length)];
      w.mode = 'turn';
      w.mt = 0;
      w.md = turnT;
      dir.cur = w;
      dir.last = w;
    }

    function canGlance(w) {
      if (women.some((q) => q !== w && q.mode === 'glance')) return false;
      if (sp < 1.5 && dir.cur && dir.cur.mode !== 'back') return false;
      return !(sp < 1.5 && dir.wait < 0.25 && !dir.cur);
    }

    function stepWoman(w, dt) {
      const live = !g.done;
      w.mt += dt;
      if (!live && w !== s.partner && (w.mode === 'turn' || w.mode === 'smile')) {
        w.mode = 'back';
        w.mt = 0;
        w.md = backT;
      }
      if (w.mode === 'idle') {
        w.subT -= dt;
        if (w.subT <= 0) {
          w.sub = SUBS[Math.floor(g.random() * SUBS.length)];
          w.subT = (0.7 + g.random()) / Math.sqrt(sp);
        }
        if (live && !w.accepted) {
          w.glanceIn -= dt;
          if (w.glanceIn <= 0) {
            if (canGlance(w)) {
              w.mode = 'glance';
              w.mt = 0;
              w.md = glanceT;
            } else w.glanceIn = 0.2 / sp;
          }
        }
      } else if (w.mode === 'glance') {
        if (w.mt >= w.md) toIdle(w);
      } else if (w.mode === 'turn') {
        if (w.mt >= w.md) {
          w.mode = 'smile';
          w.mt = 0;
          w.md = winT;
          g.sfx.pop();
          g.fx.burst(w.x, headTopOf(w) - 10, { kind: 'spark', n: 6, colors: ['#ffffff', '#ffb3cf'], speed: 90 });
        }
      } else if (w.mode === 'smile') {
        if (w.mt >= w.md) {
          w.mode = 'back';
          w.mt = 0;
          w.md = backT;
        }
      } else if (w.mode === 'back') {
        if (w.mt >= w.md) {
          toIdle(w);
          if (dir.cur === w) {
            dir.cur = null;
            dir.wait = gap();
          }
        }
      }
      const look = faceOf(w);
      const rate = 14 * Math.sqrt(sp);
      w.f = approach(w.f, look.f, rate, dt);
      w.heart = approach(w.heart, look.heart, 12, dt);
      w.blush = approach(w.blush, look.blush, 10, dt);
    }

    /** What her face and arms are doing right now. */
    function faceOf(w) {
      const base = { f: 0, tilt: 0, eyes: 'open', mouth: 'soft', arms: 'rest', look: 0, heart: 0, blush: 0, sway: Math.sin(s.t * 2.4 + w.phase) * 0.35, pff: false };
      switch (w.mode) {
        case 'glance': {
          const p = w.mt / w.md;
          if (p < 0.3) return { ...base, f: 0, mouth: 'flat' };
          if (p > 0.85) return { ...base, f: -w.nb * 0.9, mouth: 'flat', look: -w.nb };
          return { ...base, f: 0, eyes: 'roll', mouth: 'flat', arms: 'hip', tilt: 0.06 * w.nb, pff: true };
        }
        case 'turn': return { ...base, f: 0, mouth: 'soft' };
        case 'smile': return { ...base, f: 0, eyes: 'happy', mouth: 'smile', arms: 'wave', heart: 1, blush: 1 };
        case 'back': return { ...base, f: w.nb * 0.8, look: w.nb, heart: 0 };
        case 'refuse': {
          const away = w.x < 200 ? -1 : 1;
          return { ...base, f: away, eyes: 'closed', mouth: 'flat', arms: 'stop', tilt: -away * 0.12 };
        }
        case 'yes': return { ...base, f: 0, eyes: 'happy', mouth: 'smile', arms: 'clap', heart: 0.55, blush: 1 };
        case 'dance': return { ...base, f: -0.35, eyes: 'happy', mouth: 'smile', arms: 'partner', heart: 0, blush: 1 };
        default:
          break;
      }
      if (w.sub === 'laugh') return { ...base, f: w.nb * 0.75, eyes: 'happy', mouth: 'laugh', arms: 'chest', tilt: -w.nb * 0.12, bounce: Math.abs(Math.sin(s.t * 16)) * 2 };
      if (w.sub === 'band') return { ...base, f: w.band * 0.7, look: w.band, mouth: 'soft', arms: 'dance', sway: Math.sin(s.t * 3 + w.phase) * 0.7 };
      if (w.sub === 'away') return { ...base, f: -w.nb * 0.9, look: -w.nb, mouth: 'flat', arms: 'hip' };
      return { ...base, f: w.nb * 0.8, look: w.nb, mouth: 'talk' };
    }

    function hit(x, y) {
      let best = null;
      let bd = Infinity;
      for (const w of women) {
        if (y < headTopOf(w) - 24 || y > w.feet + 14) continue;
        const d = Math.abs(x - w.x);
        if (d < half && d < bd) {
          best = w;
          bd = d;
        }
      }
      return best;
    }

    function accept(w) {
      s.got++;
      w.accepted = true;
      if (dir.cur === w) dir.cur = null;
      const top = headTopOf(w);
      g.sfx.good();
      g.fx.burst(w.x, top, { kind: 'petal', n: 8, colors: [PAL.hibiscus, '#ff8fa3', PAL.mango], speed: 160 });
      g.fx.text(w.x, top - 24, '♥', { color: '#ff5c93', size: 42 });
      if (s.got >= needed) {
        s.end = 'win';
        s.partner = w;
        w.mode = 'dance';
        w.mt = 0;
        g.sfx.hoho();
        g.fx.burst(200, HF - 120, { kind: 'confetti', n: 44 });
        g.fx.flash('rgba(255,120,200,0.25)');
        g.say(DANCE_LX, HF - 160, g.tr({ en: "Let's dance!", fr: 'Allez, on danse !' }), 0.8);
        g.win();
      } else {
        w.mode = 'yes';
        w.mt = 0;
        g.say(w.x, top, g.tr({ en: 'With pleasure!', fr: 'Avec plaisir !' }), 0.9);
        dir.wait = 0.3 / sp;
      }
    }

    function refuse(w) {
      s.end = 'rake';
      s.refuser = w;
      w.mode = 'refuse';
      w.mt = 0;
      if (dir.cur === w) dir.cur = null;
      s.rakeAt = 0.22;
      g.sfx.bad();
      g.fx.shake(5);
      g.say(w.x, headTopOf(w), g.tr({ en: 'No thanks!', fr: 'Non merci !' }), 1.4);
      g.lose();
    }

    function heroHeadTop(squash) {
      return HF - hk * 0.93 * squash;
    }

    return {
      update(dt) {
        s.t += dt;
        if (!g.done) {
          if (!dir.cur) {
            dir.wait -= dt;
            if (dir.wait <= 0) startWindow();
          }
        }
        for (const w of women) stepWoman(w, dt);
        if (!g.done) return;
        s.endT += dt;
        if (!s.end) {
          // Time ran out: nobody got asked, the rake comes anyway.
          s.end = 'timeout';
          s.rakeAt = 0.08;
          g.sfx.bad();
          g.say(FX, FF - 120, g.tr({ en: 'Too shy, champ!', fr: 'Trop timide, mon vié !' }), 1.4);
        }
        if (s.end === 'win') {
          if (!s.cheered && s.endT > 0.7) {
            s.cheered = true;
            g.say(DANCE_HX, heroHeadTop(1), g.tr({ en: "Hoho, I've still got it!", fr: "Hoho, j'ai encore la cote !" }), 1.4);
          }
          return;
        }
        if (s.rakeT < 0 && s.endT >= s.rakeAt) {
          s.rakeT = 0;
          g.sfx.whoosh();
        }
        if (s.rakeT >= 0) {
          s.rakeT += dt;
          if (!s.bonked && s.rakeT >= fallT) {
            s.bonked = true;
            const top = heroHeadTop(1);
            g.sfx.hit();
            g.fx.shake(14);
            g.fx.text(HX + 40, top - 40, 'BONK!', { color: PAL.mango, size: 40 });
            g.fx.burst(HX, top, { kind: 'spark', n: 12, colors: ['#ffffff', PAL.mango], speed: 220 });
          }
        }
      },
      press(x, y) {
        if (s.end) return;
        const w = hit(x, y);
        if (!w) {
          g.sfx.tap();
          g.fx.burst(x, y, { kind: 'spark', n: 4, colors: ['#ffffff'], speed: 70 });
          return;
        }
        if (w.accepted) return;
        g.sfx.tap();
        const yes = w.mode === 'smile' || (w.mode === 'turn' && w.mt > w.md * 0.5) || (w.mode === 'back' && w.mt < 0.06);
        if (yes) accept(w);
        else refuse(w);
      },
      draw(c) {
        const t = s.t;
        const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.4)), 3);
        // Night sky, moon, sea and the Diamond Rock.
        sky(c, W, floorTop + 10, ['#0b0a28', '#22154e', '#4a2463']);
        for (let i = 0; i < 26; i++) circle(c, (i * 89 + 13) % W, (i * 41) % (hY * 0.9), 1 + (i % 3) * 0.5, `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * 2 + i)})`);
        const mg = c.createRadialGradient(330, 92, 4, 330, 92, 70);
        mg.addColorStop(0, 'rgba(255,240,200,0.45)');
        mg.addColorStop(1, 'rgba(255,240,200,0)');
        c.fillStyle = mg;
        c.fillRect(260, 22, 140, 140);
        circle(c, 330, 92, 17, '#fff4d8');
        circle(c, 325, 88, 4, 'rgba(220,200,170,0.5)');
        c.fillStyle = vgrad(c, hY, floorTop, ['#1d2c62', '#0f1638']);
        c.fillRect(0, hY, W, floorTop - hY + 2);
        diamondRock(c, 64, hY + 1, 34, 'rgba(8,6,26,0.75)');
        c.fillStyle = 'rgba(255,240,200,0.3)';
        for (let i = 0; i < 6; i++) c.fillRect(318 + Math.sin(t * 2 + i) * 6 - i * 2, hY + 4 + i * 7, 24 + i * 4, 2);
        // The band's stage.
        const glow = c.createRadialGradient(200, stY - 60, 10, 200, stY - 60, 140);
        glow.addColorStop(0, `rgba(255,90,170,${0.35 + beat * 0.2})`);
        glow.addColorStop(1, 'rgba(255,90,170,0)');
        c.fillStyle = glow;
        c.fillRect(60, stY - 200, 280, 220);
        c.fillStyle = '#5a3a28';
        c.fillRect(118, stY - 126, 6, 112);
        c.fillRect(276, stY - 126, 6, 112);
        for (const [mx, ph, inst] of [[154, 0, 'guitar'], [200, 1.3, 'drum'], [246, 2.4, 'mic']]) {
          const bob = Math.abs(Math.sin(t * 4.4 + ph)) * 3;
          const by = stY - 18 - bob;
          c.fillStyle = '#2a1846';
          rrect(c, mx - 9, by - 34, 18, 34, 7);
          c.fill();
          circle(c, mx, by - 42, 9, '#2a1846');
          circle(c, mx - 3, by - 45, 3, 'rgba(255,160,220,0.45)');
          if (inst === 'guitar') {
            ellipse(c, mx + 4, by - 16, 9, 7, '#c8553d', 0.4);
            c.strokeStyle = '#3a2416';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(mx + 6, by - 18);
            c.lineTo(mx + 22, by - 36);
            c.stroke();
          } else if (inst === 'drum') {
            rrect(c, mx - 12, by - 22, 24, 22, 8);
            c.fillStyle = '#a0703f';
            c.fill();
            ellipse(c, mx, by - 22, 12, 4, '#f4e2c0');
          } else {
            c.strokeStyle = '#c9d2dc';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(mx - 14, by);
            c.lineTo(mx - 14, by - 40);
            c.stroke();
            circle(c, mx - 14, by - 42, 3.5, '#e4ebf2');
          }
        }
        rrect(c, 112, stY - 20, 176, 22, 6);
        c.fillStyle = vgrad(c, stY - 20, stY + 2, ['#8a5a3a', '#4a2c1c']);
        c.fill();
        madrasBand(c, 106, stY - 134, 188, 20, 0.35);
        for (let i = 0; i < 9; i++) circle(c, 116 + i * 21, stY - 112, 6, i % 2 ? PAL.hibiscus : PAL.mango);
        neon(c, g.tr({ en: 'ZOUK BALL', fr: 'BAL ZOUK' }), 200, stY - 156, 26, PAL.hibiscus, t);
        // Sound system with pulsing speakers and floating notes.
        for (const sx of [74, 326]) {
          shadowed(c, () => {
            rrect(c, sx - 20, stY - 76, 40, 74, 8);
            c.fillStyle = '#1b1430';
            c.fill();
          }, 10, 4);
          for (const [cy, r] of [[stY - 56, 10], [stY - 24, 14]]) {
            circle(c, sx, cy, r * (1 + beat * 0.12), '#3a2c55');
            circle(c, sx, cy, r * 0.4 * (1 + beat * 0.2), '#120c22');
          }
          for (let i = 0; i < 2; i++) {
            const age = (t * 0.55 + i * 0.5 + sx * 0.01) % 1;
            c.save();
            c.globalAlpha = 1 - age;
            text(c, i ? '♫' : '♪', sx + Math.sin(age * 6 + i) * 10, stY - 86 - age * 70, { size: 20, color: i ? PAL.lagoon : PAL.mango, shadow: false });
            c.restore();
          }
        }
        // The dance floor.
        c.fillStyle = vgrad(c, floorTop, H, ['#45243a', '#2a1426', '#140a14']);
        c.fillRect(0, floorTop, W, H - floorTop);
        const vpY = floorTop - 260;
        c.strokeStyle = 'rgba(255,220,190,0.07)';
        c.lineWidth = 2;
        for (let i = -9; i <= 9; i++) {
          c.beginPath();
          c.moveTo(200 + i * 26, floorTop);
          c.lineTo(200 + (i * 26 * (H - vpY)) / (floorTop - vpY), H);
          c.stroke();
        }
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const lx = 200 + Math.sin(t * 0.7 + i * 2.1) * 130;
          const ly = floorTop + (H - floorTop) * (0.25 + i * 0.25);
          const col = ['255,80,160', '40,200,210', '255,180,60'][i];
          const lg = c.createRadialGradient(lx, ly, 4, lx, ly, 110);
          lg.addColorStop(0, `rgba(${col},0.22)`);
          lg.addColorStop(1, `rgba(${col},0)`);
          c.fillStyle = lg;
          c.fillRect(lx - 110, ly - 110, 220, 220);
        }
        c.restore();
        c.fillStyle = 'rgba(255,200,120,0.35)';
        c.fillRect(0, floorTop, W, 2);
        // Palms and string lights.
        palm(c, -12, H * 0.52, H * 0.42, t, 0.22);
        palm(c, W + 12, H * 0.5, H * 0.4, t + 2, -0.22);
        bulbs(c, -10, 74, W + 10, 92, t, 11);
        bulbs(c, 0, H * 0.17, 112, stY - 132, t + 1, 6);
        bulbs(c, 288, stY - 132, W, H * 0.16, t + 2, 6);
        // Couples dancing in the back.
        for (const [cx, cy, ph] of [[40, 34, 0], [118, 52, 1.7], [282, 50, 3.1], [362, 36, 4.4]]) couple(c, cx, floorTop + cy, 70, t, ph);
        // The ladies.
        for (const w of women) {
          if (w === s.partner) continue;
          const look = faceOf(w);
          if (w.heart > 0.02) {
            const pg = c.createRadialGradient(w.x, w.feet, 4, w.x, w.feet, 80);
            pg.addColorStop(0, `rgba(255,110,170,${0.55 * w.heart})`);
            pg.addColorStop(1, 'rgba(255,110,170,0)');
            c.fillStyle = pg;
            c.fillRect(w.x - 80, w.feet - 40, 160, 80);
          }
          lady(c, w.L, w.x, w.feet, w.size, t + w.phase, { ...look, f: w.f, blush: w.blush });
          const top = headTopOf(w);
          if (w.heart > 0.03) {
            const pop = w.mode === 'smile' ? 1 + 0.3 * Math.sin(clamp01(w.mt / 0.2) * Math.PI) : 1;
            const r = 15 * w.heart * pop * (1 + 0.07 * Math.sin(t * 12));
            heart(c, w.x + 2, top - 18, r);
            for (let i = 0; i < 3; i++) {
              const a = t * 3 + (i * Math.PI * 2) / 3;
              star(c, w.x + Math.cos(a) * w.size * 0.17, top + 26 + Math.sin(a) * w.size * 0.09, 6 * w.heart, t * 4 + i, '#fff6c8', 4, 0.3);
            }
          }
          if (look.pff) text(c, 'pff', w.x + w.nb * 30, top + 6, { size: 15, color: 'rgba(230,225,245,0.9)', weight: 600 });
          if (w.mode === 'yes') star(c, w.x + 26, top + 4, 7, t * 3, PAL.mango, 4, 0.3);
        }
        // Hero, friend, partner.
        if (s.end === 'win') {
          const w = s.partner;
          const k = smooth(clamp01(s.endT / 0.45));
          const sway = Math.sin(s.endT * 4.2) * 11 * k;
          const bob = Math.abs(Math.sin(s.endT * 4.2)) * 4 * k;
          const hx = HX + (DANCE_HX - HX) * k + sway;
          const lx = w.x + (DANCE_LX - w.x) * k + sway;
          const lf = w.feet + (HF - w.feet) * k;
          const ls = w.size + (150 - w.size) * k;
          person(c, g.hero, hx, HF - bob, HS, 'idle', t, { hat: g.hat });
          const tw = hk * 0.25 * (ho.wide || 1);
          const handX = hx + tw * 0.47 + Math.sin(0.25) * hk * 0.2;
          const handY = HF - bob - hk * 0.47 + hk * 0.04 + Math.cos(0.25) * hk * 0.2;
          const look = faceOf(w);
          lady(c, w.L, lx, lf, ls, t + w.phase, { ...look, f: w.f, blush: w.blush, sway: Math.sin(s.endT * 4.2) * 0.8, lean: Math.sin(s.endT * 4.2) * 0.04, bounce: bob, reach: [handX - lx, handY - lf + bob] });
          circle(c, handX, handY, ls * 0.026, w.L.skin);
          for (let i = 0; i < 4; i++) {
            const age = (s.endT * 0.8 + i * 0.25) % 1;
            c.save();
            c.globalAlpha = 1 - age;
            heart(c, (hx + lx) / 2 + Math.sin(age * 6 + i) * 18, HF - 165 - age * 90, 6 + (i % 2) * 3, i % 2 ? '#ff8fb3' : PAL.hibiscus);
            c.restore();
          }
        } else {
          const bonkAge = s.bonked ? s.rakeT - fallT : 0;
          const squash = s.bonked ? 1 - 0.18 * Math.max(0, 1 - bonkAge * 4) * Math.abs(Math.cos(bonkAge * 20)) : 1;
          const pose = s.bonked ? 'sad' : s.end === 'rake' ? 'point' : 'idle';
          const flip = s.end === 'rake' && s.refuser && s.refuser.x < HX && !s.bonked;
          person(c, g.hero, HX, HF, HS, pose, t, { hat: g.hat, squash, flip });
          if (s.rakeT >= 0) {
            const top = heroHeadTop(squash);
            const RS = 110;
            const landY = top - RS * 0.1;
            const p = clamp01(s.rakeT / fallT);
            const y = -60 + (landY + 60) * p * p;
            const wob = s.bonked ? Math.sin(bonkAge * 25) * 0.18 * Math.exp(-bonkAge * 5) : 0;
            const rot = s.bonked ? 0.42 + wob : -2.6 * (1 - p) + 0.42 * p;
            rake(c, HX + 6, y, rot, RS);
            if (s.bonked) {
              for (let i = 0; i < 3; i++) {
                const a = t * 6 + i * 2.1;
                star(c, HX + Math.cos(a) * 34, top - 4 + Math.sin(a) * 9, 7, t * 5 + i, '#ffe066');
              }
            }
          }
        }
        const fpose = s.end === 'win' ? 'cheer' : s.bonked ? 'sad' : 'dance';
        person(c, friend, FX, FF, 112, fpose, t + 1.3, { flip: true });
        // Dances still needed (boss).
        if (needed > 1) {
          for (let i = 0; i < needed; i++) {
            const x = 200 + (i - (needed - 1) / 2) * 32;
            if (i < s.got) heart(c, x, 104, 11);
            else {
              heartPath(c, x, 104, 11);
              c.strokeStyle = 'rgba(255,180,210,0.8)';
              c.lineWidth = 2.5;
              c.stroke();
            }
          }
        }
      },
      bot() {
        if (g.done || s.end) return null;
        const w = women.find((q) => q.mode === 'smile' && q.mt > 0.04 && !q.accepted);
        return w ? { press: [w.x, w.feet - w.size * 0.5] } : null;
      },
    };
  },
};
