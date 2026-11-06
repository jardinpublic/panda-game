/*
 * Golden Merguez pictures, painted on canvases (browser only):
 * - the characters: the gang and the bosses with the marathon's person(),
 *   the people of the levels with a simple body and 103 RCX's paintFace();
 * - the thrown things, one little drawing per weapon.
 * Every picture is cached.
 */
import { person, circle, ellipse, rrect, vgrad, OUTFITS } from '../marathon/art.js';
import { paintFace } from '../spx/faces.js';
import { PEOPLE } from './rules.js';

export const CHAR_W = 256;
export const CHAR_H = 400;
const cache = new Map();

/** Body colours of the people (not in the gang). */
const PEOPLE_LOOK = {
  gogol: { coat: '#5b6f8f', legs: '#3a3a44' },
  pineur: { coat: '#7b6a52', legs: '#4a4238' },
  gardien: { coat: '#3f6b46', legs: '#2c3b30' },
  controleur: { coat: '#2a3a6b', legs: '#22283a' },
  videur: { coat: '#18161e', legs: '#22283a' },
  proprio: { coat: '#9b3d4f', legs: '#e9c7a8' },
  flic: { coat: '#1f2b4d', legs: '#1a2236' },
  chasseur: { coat: '#f07a1e', legs: '#3a3a2a' },
};

function peopleBody(c, who, pose, t) {
  const look = PEOPLE_LOOK[who] || PEOPLE_LOOK.pineur;
  const x = CHAR_W / 2;
  const y = CHAR_H - 14;
  const s = CHAR_H * 0.95;
  ellipse(c, x, y, s * 0.14, s * 0.025, 'rgba(0,0,0,0.25)');
  c.lineCap = 'round';
  c.strokeStyle = look.legs;
  c.lineWidth = s * 0.07;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + side * s * 0.05, y - s * 0.25);
    c.lineTo(x + side * s * 0.06, y - s * 0.02);
    c.stroke();
    ellipse(c, x + side * s * 0.07, y - s * 0.01, s * 0.05, s * 0.022, '#2a221c');
  }
  rrect(c, x - s * 0.15, y - s * 0.58, s * 0.3, s * 0.36, s * 0.1);
  c.fillStyle = vgrad(c, y - s * 0.58, y - s * 0.22, [look.coat, '#2a2a30']);
  c.fill();
  // arms: down, or one up to throw
  c.strokeStyle = look.coat;
  c.lineWidth = s * 0.06;
  const up = pose === 'point' || pose === 'cheer';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + side * s * 0.13, y - s * 0.53);
    if (up && side === 1) c.lineTo(x + s * 0.24, y - s * 0.78);
    else c.lineTo(x + side * s * 0.17, y - s * 0.3);
    c.stroke();
  }
  const face = paintFace(who);
  const fh = s * 0.4;
  const fw = fh * (256 / 320);
  c.save();
  c.translate(x, y - s * 0.75);
  if (pose === 'sad') c.rotate(0.15);
  c.drawImage(face, -fw / 2, -fh / 2, fw, fh);
  c.restore();
  void t;
}

/**
 * A character standing, feet at the bottom of a CHAR_W×CHAR_H canvas.
 * pose: 'idle' (hiding), 'point' (winding up, weapon raised), 'cheer' (throwing), 'sad' (hit).
 */
export function characterCanvas(who, pose = 'idle', weapon = null) {
  const key = `${who}:${pose}:${weapon}`;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = CHAR_W;
  cv.height = CHAR_H;
  const c = cv.getContext('2d');
  if (PEOPLE.includes(who) || !OUTFITS[who]) peopleBody(c, who, pose, 0);
  else person(c, who, CHAR_W / 2, CHAR_H - 14, CHAR_H * 0.92, pose, 0.4);
  if (weapon && (pose === 'point' || pose === 'cheer')) {
    // The weapon raised over the head, ready to throw.
    c.save();
    c.translate(CHAR_W * 0.72, CHAR_H * 0.2);
    c.rotate(-0.5);
    drawWeapon(c, weapon, CHAR_W * 0.36);
    c.restore();
  }
  cache.set(key, cv);
  return cv;
}

/** A thrown thing on its own, centred on a square canvas. */
export function weaponCanvas(kind, size = 128) {
  const key = `w:${kind}:${size}`;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const c = cv.getContext('2d');
  c.translate(size / 2, size / 2);
  drawWeapon(c, kind, size * 0.86);
  cache.set(key, cv);
  return cv;
}

function sausage(c, s, col, dark, { bend = 0.35, thick = 0.2, len = 0.9 } = {}) {
  c.lineCap = 'round';
  c.strokeStyle = dark;
  c.lineWidth = s * thick + 4;
  const path = () => {
    c.beginPath();
    c.moveTo(-s * len * 0.5, s * bend * 0.3);
    c.quadraticCurveTo(0, -s * bend * 0.4, s * len * 0.5, s * bend * 0.3);
  };
  path();
  c.stroke();
  c.strokeStyle = col;
  c.lineWidth = s * thick;
  path();
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = s * thick * 0.25;
  c.beginPath();
  c.moveTo(-s * len * 0.35, s * bend * 0.05);
  c.quadraticCurveTo(0, -s * bend * 0.45, s * len * 0.3, s * bend * 0.02);
  c.stroke();
}

function fish(c, s, body, belly, fin, { whiskers = false, len = 0.9 } = {}) {
  const L = s * len;
  c.fillStyle = fin;
  c.beginPath();
  c.moveTo(L * 0.38, 0);
  c.lineTo(L * 0.55, -s * 0.16);
  c.lineTo(L * 0.55, s * 0.16);
  c.closePath();
  c.fill();
  ellipse(c, 0, 0, L * 0.42, s * 0.16, body);
  ellipse(c, -L * 0.02, s * 0.06, L * 0.32, s * 0.07, belly);
  c.fillStyle = fin;
  c.beginPath();
  c.moveTo(-L * 0.05, -s * 0.14);
  c.lineTo(L * 0.12, -s * 0.26);
  c.lineTo(L * 0.18, -s * 0.12);
  c.closePath();
  c.fill();
  circle(c, -L * 0.28, -s * 0.04, s * 0.035, '#ffffff');
  circle(c, -L * 0.29, -s * 0.04, s * 0.018, '#111111');
  if (whiskers) {
    c.strokeStyle = '#2b2620';
    c.lineWidth = 2.5;
    for (const k of [-1, 1]) {
      c.beginPath();
      c.moveTo(-L * 0.38, s * 0.03);
      c.quadraticCurveTo(-L * 0.55, s * 0.08 * k, -L * 0.62, s * 0.18 * k);
      c.stroke();
    }
  }
}

/** Draws a weapon centred on (0, 0), about `s` wide. */
export function drawWeapon(c, kind, s) {
  c.save();
  switch (kind) {
    case 'merguez':
      sausage(c, s, '#b8402c', '#6e2116');
      for (let i = -2; i <= 2; i++) {
        c.strokeStyle = 'rgba(40,10,5,0.6)';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(i * s * 0.12 - 4, -s * 0.06);
        c.lineTo(i * s * 0.12 + 4, s * 0.06);
        c.stroke();
      }
      break;
    case 'chorizo':
      sausage(c, s, '#a3221d', '#5e0f0c', { thick: 0.26, len: 0.8 });
      for (let i = 0; i < 7; i++) circle(c, -s * 0.3 + i * s * 0.1, ((i * 7) % 5) - 2, 3, 'rgba(255,240,220,0.8)');
      c.strokeStyle = '#efe6d2';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(s * 0.4, s * 0.1);
      c.lineTo(s * 0.48, -s * 0.02);
      c.stroke();
      break;
    case 'andouille':
      sausage(c, s, '#8f7a6c', '#4a3d34', { thick: 0.3, len: 0.85, bend: 0.2 });
      c.strokeStyle = 'rgba(70,50,40,0.6)';
      c.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        c.beginPath();
        c.arc(i * s * 0.1, 0, s * 0.08, 0.6, 2.4);
        c.stroke();
      }
      break;
    case 'mollard':
    case 'crotte': {
      const big = kind === 'mollard' ? 1 : 0.6;
      const col = kind === 'mollard' ? '#d9f2c4' : '#b8c95a';
      ellipse(c, 0, 0, s * 0.3 * big, s * 0.22 * big, col);
      circle(c, s * 0.22 * big, -s * 0.05, s * 0.1 * big, col);
      circle(c, -s * 0.2 * big, s * 0.08, s * 0.08 * big, col);
      circle(c, -s * 0.08 * big, -s * 0.07 * big, s * 0.07 * big, 'rgba(255,255,255,0.75)');
      break;
    }
    case 'shot':
      c.fillStyle = 'rgba(230,240,255,0.85)';
      c.beginPath();
      c.moveTo(-s * 0.2, -s * 0.3);
      c.lineTo(s * 0.2, -s * 0.3);
      c.lineTo(s * 0.15, s * 0.3);
      c.lineTo(-s * 0.15, s * 0.3);
      c.closePath();
      c.fill();
      c.fillStyle = '#f39a1e';
      c.beginPath();
      c.moveTo(-s * 0.18, -s * 0.12);
      c.lineTo(s * 0.18, -s * 0.12);
      c.lineTo(s * 0.15, s * 0.25);
      c.lineTo(-s * 0.15, s * 0.25);
      c.closePath();
      c.fill();
      ellipse(c, s * 0.16, -s * 0.32, s * 0.12, s * 0.07, '#b8402c', 0.4); // the sausage slice
      break;
    case 'gardon':
      fish(c, s, '#c7d3dc', '#eef2f4', '#e0533c');
      break;
    case 'poissonchat':
      fish(c, s, '#6d6250', '#b9ad92', '#4e4638', { whiskers: true, len: 1 });
      break;
    case 'sardine':
      fish(c, s * 0.8, '#5f86b0', '#dfe8f0', '#3f5f84', { len: 1.05 });
      break;
    case 'rouleau':
      c.rotate(0.3);
      rrect(c, -s * 0.32, -s * 0.11, s * 0.64, s * 0.22, s * 0.1);
      c.fillStyle = vgrad(c, -s * 0.11, s * 0.11, ['#e8c28a', '#b98a4e']);
      c.fill();
      for (const k of [-1, 1]) {
        rrect(c, k > 0 ? s * 0.3 : -s * 0.48, -s * 0.05, s * 0.18, s * 0.1, s * 0.05);
        c.fillStyle = '#9c6a34';
        c.fill();
      }
      break;
    case 'archet':
      c.rotate(-0.4);
      c.strokeStyle = '#6b3f1d';
      c.lineWidth = s * 0.05;
      c.beginPath();
      c.moveTo(-s * 0.48, 0);
      c.quadraticCurveTo(0, -s * 0.06, s * 0.48, 0);
      c.stroke();
      c.strokeStyle = '#f6f1e3';
      c.lineWidth = s * 0.025;
      c.beginPath();
      c.moveTo(-s * 0.44, s * 0.06);
      c.lineTo(s * 0.44, s * 0.06);
      c.stroke();
      rrect(c, -s * 0.5, -s * 0.03, s * 0.1, s * 0.12, 3);
      c.fillStyle = '#1e1a18';
      c.fill();
      break;
    case 'treuffe':
      // A treuffe (Burgundy for a potato): a lumpy spud with its eyes
      c.rotate(-0.3);
      ellipse(c, 0, 0, s * 0.34, s * 0.24, '#b98a52');
      ellipse(c, s * 0.12, -s * 0.06, s * 0.18, s * 0.16, '#c99a5e');
      ellipse(c, -s * 0.12, s * 0.06, s * 0.16, s * 0.13, '#a97a46');
      ellipse(c, -s * 0.08, -s * 0.1, s * 0.14, s * 0.05, 'rgba(255,240,210,0.45)', -0.2);
      for (const [ex, ey] of [[-0.18, 0.02], [0.05, 0.1], [0.2, -0.08], [-0.02, -0.12]]) circle(c, s * ex, s * ey, s * 0.022, '#6e4a26');
      break;
    case 'cote':
      ellipse(c, 0, 0, s * 0.42, s * 0.3, '#9e3b2d');
      ellipse(c, -s * 0.05, -s * 0.03, s * 0.34, s * 0.22, '#c2503f');
      ellipse(c, s * 0.12, s * 0.05, s * 0.12, s * 0.07, '#f2e6d4');
      c.strokeStyle = '#f4ecdf';
      c.lineWidth = s * 0.07;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(s * 0.25, s * 0.12);
      c.lineTo(s * 0.52, s * 0.3);
      c.stroke();
      circle(c, s * 0.54, s * 0.3, s * 0.06, '#f4ecdf');
      break;
    case 'mouchoir':
      for (const [dx, dy, r] of [[0, 0, 0.22], [0.14, -0.08, 0.14], [-0.15, 0.06, 0.14], [0.05, 0.14, 0.12]]) circle(c, s * dx, s * dy, s * r, '#f7f7f4');
      c.strokeStyle = 'rgba(150,160,180,0.6)';
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(s * (i * 0.06 - 0.1), s * 0.02, s * 0.08, 0.3 + i, 1.8 + i);
        c.stroke();
      }
      break;
    case 'poulet':
      ellipse(c, 0, 0, s * 0.36, s * 0.26, '#d98a3a');
      ellipse(c, -s * 0.06, -s * 0.06, s * 0.24, s * 0.14, '#f0ad5c');
      for (const k of [-1, 1]) {
        c.save();
        c.translate(s * 0.28, k * s * 0.14);
        c.rotate(k * 0.5);
        ellipse(c, s * 0.08, 0, s * 0.12, s * 0.08, '#c97830');
        circle(c, s * 0.2, 0, s * 0.035, '#f4ecdf');
        c.restore();
      }
      break;
    case 'boule':
      circle(c, 0, 0, s * 0.3, '#9aa2ac');
      c.strokeStyle = '#6b737d';
      c.lineWidth = 3;
      for (const k of [-0.12, 0, 0.12]) {
        c.beginPath();
        c.ellipse(0, 0, s * 0.3, s * (0.12 + Math.abs(k)), 0.4, 0, Math.PI * 2);
        c.stroke();
      }
      circle(c, -s * 0.1, -s * 0.12, s * 0.07, 'rgba(255,255,255,0.7)');
      break;
    case 'pv':
      c.rotate(-0.2);
      rrect(c, -s * 0.3, -s * 0.22, s * 0.6, s * 0.44, s * 0.04);
      c.fillStyle = '#f4a3c4';
      c.fill();
      c.fillStyle = 'rgba(80,30,60,0.6)';
      for (let i = 0; i < 4; i++) c.fillRect(-s * 0.22, -s * 0.12 + i * s * 0.08, s * (i === 0 ? 0.3 : 0.42), s * 0.025);
      c.font = `800 ${Math.round(s * 0.14)}px Fredoka, sans-serif`;
      c.textAlign = 'center';
      c.fillStyle = '#7a1e46';
      c.fillText('PV', s * 0.18, s * 0.16);
      break;
    case 'glacon':
      c.rotate(0.3);
      rrect(c, -s * 0.2, -s * 0.2, s * 0.4, s * 0.4, s * 0.06);
      c.fillStyle = 'rgba(190,230,255,0.85)';
      c.fill();
      rrect(c, -s * 0.12, -s * 0.14, s * 0.12, s * 0.18, s * 0.03);
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.fill();
      break;
    case 'pantoufle':
      ellipse(c, 0, 0, s * 0.38, s * 0.16, '#8a3b5c');
      ellipse(c, s * 0.12, -s * 0.02, s * 0.2, s * 0.12, '#b0507a');
      for (let i = 0; i < 5; i++) circle(c, s * (0.02 + i * 0.06), -s * 0.12, s * 0.035, '#f4ecdf');
      break;
    case 'pomme':
    default:
      ellipse(c, 0, 0, s * 0.18, s * 0.3, '#7a4f2a');
      for (let i = 0; i < 5; i++) for (const k of [-1, 1]) ellipse(c, k * s * 0.08, -s * 0.2 + i * s * 0.1, s * 0.07, s * 0.04, '#a06a3a', k * 0.5);
      break;
  }
  c.restore();
}
