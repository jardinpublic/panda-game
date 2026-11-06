/*
 * Golden Merguez scenery: the light of each level, its decor, and the covers
 * people hide behind. Built with a small kit (box, mesh) handed over by view.js,
 * so everything a level adds is disposed when the next level starts.
 */
import * as THREE from 'three';
import { grassCanvas, pavementCanvas, tilesCanvas, roadCanvas } from '../spx/textures.js';

/** Sky gradient (top → horizon), fog, ambient and sun of each level. */
export const ENV = {
  jardin: { sky: ['#5aa9e6', '#a9d6f2', '#ffe0b8'], fog: ['#cfe6f2', 40, 130], hemi: ['#fff4e0', '#4c7a3a', 1.6], sun: ['#fff1d6', 1.6] },
  gare: { sky: ['#8fb3d1', '#c9d8e2', '#e8e2d6'], fog: ['#d4dbe0', 35, 120], hemi: ['#f4f4f0', '#6b6258', 1.5], sun: ['#fff6e6', 1.2] },
  moliere: { sky: ['#0b0618', '#1c0f33', '#2a1440'], fog: ['#1a0f2e', 20, 90], hemi: ['#d9ccff', '#5a3a7a', 2.1], sun: ['#ff9ae0', 0.9] },
  rue: { sky: ['#0d1433', '#1d2a5a', '#3a3a66'], fog: ['#1a2040', 20, 95], hemi: ['#a9bcff', '#3a3f4a', 1.25], sun: ['#ffd9a0', 0.6] },
  crapa: { sky: ['#060b1f', '#10204a', '#1d2f55'], fog: ['#0e1a33', 14, 75], hemi: ['#9fb6ff', '#24331f', 1.15], sun: ['#cfe0ff', 0.6] },
};

function seeded(seed) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/** A flat label (station sign, neon) on a plane. */
function label(k, text, w, h, color, bg, x, y, z, { glow = false, rotY = 0 } = {}) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = Math.round((512 * h) / w);
  const c = cv.getContext('2d');
  if (bg) {
    c.fillStyle = bg;
    c.fillRect(0, 0, cv.width, cv.height);
  }
  c.font = `800 ${Math.round(cv.height * 0.6)}px Fredoka, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (glow) {
    c.shadowColor = color;
    c.shadowBlur = 24;
  }
  c.fillStyle = color;
  c.fillText(text, cv.width / 2, cv.height / 2 + 2, cv.width * 0.94);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  k.track(tex);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: !bg });
  k.track(m);
  const geo = new THREE.PlaneGeometry(w, h);
  k.track(geo);
  const p = new THREE.Mesh(geo, m);
  p.position.set(x, y, z);
  p.rotation.y = rotY;
  k.group.add(p);
  return p;
}

/** Something that glows in the dark (lamps, neon, windows): not lit, always bright. */
function glow(k, geo, color, x, y, z, parent = k.group) {
  k.track(geo);
  const m = new THREE.MeshBasicMaterial({ color });
  k.track(m);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function tree(k, x, z, s = 1, crown = '#3f8a3a', trunk = '#7a5536') {
  k.mesh(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 2.6 * s, 10), trunk, x, 1.3 * s, z);
  const light = new THREE.Color(crown).offsetHSL(0.01, 0.02, 0.06).getStyle();
  k.mesh(new THREE.SphereGeometry(1.35 * s, 14, 10), crown, x, 3.2 * s, z);
  k.mesh(new THREE.SphereGeometry(0.95 * s, 12, 9), light, x + 0.8 * s, 3.6 * s, z + 0.3 * s);
  k.mesh(new THREE.SphereGeometry(0.9 * s, 12, 9), crown, x - 0.75 * s, 2.8 * s, z + 0.4 * s);
  k.mesh(new THREE.SphereGeometry(0.8 * s, 12, 9), light, x + 0.1 * s, 4.1 * s, z - 0.3 * s);
}

/** A painted ground: the texture repeats every `tile` metres. */
function ground(k, w, d, cv, tile, x, z, y = 0, opts) {
  const p = k.mesh(new THREE.PlaneGeometry(w, d), k.painted(cv, w / tile, d / tile, opts), x, y, z);
  p.rotation.x = -Math.PI / 2;
  p.castShadow = false;
  return p;
}

function flat(k, w, d, color, x, z, y = 0.01) {
  const p = k.mesh(new THREE.PlaneGeometry(w, d), color, x, y, z);
  p.rotation.x = -Math.PI / 2;
  return p;
}

/* ---------- The five places ---------- */

function jardin(k) {
  ground(k, 90, 160, grassCanvas(11), 6, 0, -45);
  ground(k, 4.2, 120, pavementCanvas(5), 3, 0, -40, 0.01, { color: '#f0dcae' });
  flat(k, 40, 3, '#dcc79c', 0, -38, 0.012);
  flat(k, 12, 7, '#e4d2a6', 0.5, -62.5, 0.013); // the pétanque ground
  const rnd = seeded(7);
  for (let i = 0; i < 46; i++) {
    const side = i % 2 ? 1 : -1;
    tree(k, side * (7 + rnd() * 18), 6 - rnd() * 104, 0.8 + rnd() * 0.6, ['#3f8a3a', '#4f9a3e', '#367a36'][i % 3]);
  }
  for (const side of [-1, 1]) k.box(0.08, 1.1, 120, '#2f4a35', side * 26, 0, -40);
  const house = ['#e9d6b8', '#d8c7b0', '#efe1c4', '#cfa98a', '#e3cfae'];
  for (let i = 0; i < 9; i++) {
    const h = 7 + (i % 3) * 2;
    k.box(9, h, 6, house[i % house.length], -36 + i * 9, 0, -112);
    k.box(9.4, 1.2, 6.4, '#8a4c38', -36 + i * 9, h, -112);
  }
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) k.box(6, 6 + ((i + (side > 0 ? 1 : 0)) % 3) * 2, 9, house[(i + 2) % house.length], side * 34, 0, -10 - i * 16);
  }
  for (let z = -6; z > -90; z -= 14) {
    for (const side of [-1, 1]) {
      k.mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), '#2b2f36', side * 2.8, 1.6, z);
      k.mesh(new THREE.SphereGeometry(0.22, 8, 6), '#fff2c4', side * 2.8, 3.3, z);
    }
  }
  // The fountain and the bandstand
  k.mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 16), '#c9c2b4', 1.2, 0.4, -30);
  k.mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 16), '#7cc4df', 1.2, 0.78, -30);
  k.mesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 8), '#c9c2b4', 1.2, 1.4, -30);
  k.mesh(new THREE.CylinderGeometry(0.9, 0.3, 0.3, 12), '#c9c2b4', 1.2, 2.4, -30);
  const kio = new THREE.Group();
  kio.position.set(-2, 0, -47.5);
  k.group.add(kio);
  k.mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.7, 8), '#e9e3d6', 0, 0.35, 0, kio);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    k.mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 6), '#2f5a3a', Math.cos(a) * 3, 2.1, Math.sin(a) * 3, kio);
  }
  k.mesh(new THREE.ConeGeometry(3.9, 1.6, 8), '#3a7a4a', 0, 4.3, 0, kio);
}

function gare(k) {
  ground(k, 16, 140, pavementCanvas(7), 2.5, -1, -40); // the platform
  flat(k, 0.3, 140, '#f2c230', 6.4, -40, 0.012); // the yellow line
  k.box(10, 0.6, 140, '#6b5f55', 12, -0.6, -40); // the track bed, lower
  for (const x of [10.2, 11.6]) k.box(0.12, 0.12, 140, '#8c8f96', x, 0, -40);
  for (let z = 25; z > -110; z -= 1.2) k.box(2.2, 0.06, 0.25, '#5a4636', 10.9, -0.04, z);
  // The TER waiting at the platform, white with a blue band
  for (let i = 0; i < 4; i++) {
    const z = -6 - i * 26;
    k.box(3, 3.2, 24, '#eef0f2', 10.9, 0.1, z);
    k.box(3.05, 0.5, 24, '#2f5fb3', 10.9, 0.6, z);
    for (let w = -10; w <= 10; w += 3) glow(k, new THREE.BoxGeometry(0.05, 0.9, 1.8), '#bfe0f0', 9.37, 2.3, z + w);
  }
  // The station building: brick, tall windows, the sign
  k.box(2, 7, 140, '#b5543c', -9, 0, -40);
  for (let z = 20; z > -100; z -= 6) k.box(0.1, 3, 2, '#3a3448', -7.95, 1.2, z);
  label(k, 'MONTCEAU-LES-MINES', 9, 1.1, '#ffffff', '#1f4fa0', -7.9, 5.2, -30, { rotY: Math.PI / 2 });
  label(k, 'MONTCEAU-LES-MINES', 9, 1.1, '#ffffff', '#1f4fa0', -7.9, 5.2, -75, { rotY: Math.PI / 2 });
  // The canopy over the platform, on its columns
  k.box(5, 0.2, 140, '#ece8e0', -5.6, 4.4, -40);
  for (let z = 10; z > -100; z -= 9) k.mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.4, 12), '#3a5a8a', -3.4, 2.2, z);
  label(k, '12:07', 1.4, 0.6, '#1d1d24', '#f6f2e8', -3.4, 3.6, -30);
}

function moliere(k) {
  ground(k, 14, 120, tilesCanvas(13), 2, 0, -40, 0, { color: '#5a4a7a', roughness: 0.35, metalness: 0.15 });
  // The dance floor: tiles that glow
  const cols = ['#ff4fb4', '#4fd6ff', '#ffd23f', '#8a5bff'];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) glow(k, new THREE.PlaneGeometry(1.1, 1.1), cols[(i + j) % 4], -3.3 + i * 1.3, 0.015, -28 - j * 1.3).rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    k.box(0.4, 5.5, 120, '#4a2c6e', side * 7.2, 0, -40);
    glow(k, new THREE.BoxGeometry(0.06, 0.08, 118), side > 0 ? '#ff4fb4' : '#4fd6ff', side * 6.98, 3.6, -40);
    glow(k, new THREE.BoxGeometry(0.06, 0.08, 118), '#ffd23f', side * 6.98, 1.2, -40);
  }
  k.box(14.8, 0.3, 120, '#2a1840', 0, 5.5, -40);
  // Coloured spotlights along the club
  const spots = ['#ff4fb4', '#4fd6ff', '#ffd23f'];
  for (let i = 0; i < 7; i++) {
    const z = 4 - i * 14;
    const light = new THREE.PointLight(spots[i % 3], 40, 22, 1.6);
    light.position.set(i % 2 ? 3 : -3, 4.6, z);
    k.group.add(light);
    glow(k, new THREE.CylinderGeometry(0.2, 0.32, 0.4, 12), spots[i % 3], i % 2 ? 3 : -3, 5.1, z);
  }
  // Disco ball and its sparkles
  glow(k, new THREE.IcosahedronGeometry(0.6, 1), '#dfe6f0', 0, 4.4, -32);
  for (let i = 0; i < 30; i++) {
    const a = i * 2.4;
    glow(k, new THREE.SphereGeometry(0.06, 4, 3), '#ffffff', Math.cos(a) * (2 + (i % 5)), 1 + (i % 4), -32 + Math.sin(a) * (3 + (i % 3)));
  }
  // The long bar on the right wall, bottles glowing behind it
  k.box(1, 1.1, 30, '#5a3420', 5.6, 0, -50);
  for (let z = -36; z > -64; z -= 0.7) glow(k, new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6), cols[Math.abs(Math.round(z * 3)) % 4], 6.7, 1.9, z);
  label(k, 'LE MOLIÈRE', 7, 1.4, '#ff4fb4', null, 0, 4.2, -98, { glow: true });
  k.box(14.8, 5.5, 0.4, '#2a1840', 0, 0, -99);
}

function rue(k) {
  ground(k, 8, 140, roadCanvas({ dashes: false, seed: 3 }), 8, 0, -40);
  for (const side of [-1, 1]) ground(k, 3, 140, pavementCanvas(9), 2.5, side * 5.5, -40, 0.02);
  for (let z = 20; z > -100; z -= 6) flat(k, 0.2, 2.5, '#e8e6df', 0, z, 0.015);
  // Houses on both sides, some windows lit
  const fronts = ['#d8cbb3', '#cdb89a', '#e3d6bd', '#bfa98e'];
  const rnd = seeded(11);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const z = 14 - i * 10;
      const h = 6 + (i % 3);
      k.box(4, h, 9.4, fronts[(i + (side > 0 ? 1 : 0)) % 4], side * 9.5, 0, z);
      k.box(4.4, 1, 9.8, '#7d4433', side * 9.5, h, z);
      for (const wz of [-2.5, 2.5]) {
        const lit = rnd() < 0.45;
        if (lit) glow(k, new THREE.BoxGeometry(0.05, 1.2, 1.1), '#ffd66e', side * 7.48, 3.6, z + wz);
        else k.box(0.05, 1.2, 1.1, '#2b2f4a', side * 7.48, 3, z + wz);
      }
    }
  }
  // Street lamps
  for (let z = 6; z > -96; z -= 16) {
    for (const side of [-1, 1]) {
      k.mesh(new THREE.CylinderGeometry(0.07, 0.09, 4, 6), '#2b2f36', side * 6.6, 2, z);
      glow(k, new THREE.SphereGeometry(0.25, 8, 6), '#ffcf7a', side * 6.6, 4.1, z);
    }
  }
  // Cous's garage at the end, its door up, light inside
  k.box(5, 3, 5, '#c9bca4', -4.5, 0, -84);
  glow(k, new THREE.BoxGeometry(3.6, 2.4, 0.05), '#ffd66e', -4.5, 1.2, -81.45);
  label(k, 'GARAGE', 2.4, 0.4, '#5a4a3a', '#c9bca4', -4.5, 2.7, -81.4);
}

function crapa(k) {
  ground(k, 90, 160, grassCanvas(31), 6, 0, -45, 0, { color: '#4f6a46' });
  flat(k, 3, 120, '#4a3d2c', 0, -40, 0.01);
  const rnd = seeded(23);
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1;
    tree(k, side * (5 + rnd() * 20), 10 - rnd() * 110, 0.9 + rnd() * 0.8, ['#1f4a2a', '#24552e', '#1a3d25'][i % 3], '#4a3424');
  }
  // The préau at the edge of the woods
  for (const [x, z] of [[-9, 2], [-5, 2], [-9, -4], [-5, -4]]) k.mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6), '#6b4a30', x, 1.4, z);
  k.box(5.4, 0.25, 7.4, '#7a3a2a', -7, 2.8, -1);
  // The moon, and Rudy's campfire by his tent
  glow(k, new THREE.SphereGeometry(3, 16, 12), '#f4f0d8', -30, 34, -120);
  glow(k, new THREE.ConeGeometry(0.4, 0.9, 7), '#ff8a2a', -2.4, 0.45, -79);
  glow(k, new THREE.ConeGeometry(0.22, 0.6, 7), '#ffd23f', -2.4, 0.4, -79);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    k.mesh(new THREE.DodecahedronGeometry(0.18, 0), '#6d6a66', -2.4 + Math.cos(a) * 0.55, 0.12, -79 + Math.sin(a) * 0.55);
  }
}

const PLACES = { jardin, gare, moliere, rue, crapa };

export function buildDecor(id, k) {
  (PLACES[id] || jardin)(k);
}

/** A parked car seen from the side (José's 205 is faded red with a grey primer door). */
function car(k, g, body, door) {
  k.box(3.7, 0.8, 1.6, body, 0, 0.28, 0, g);
  k.box(2.1, 0.62, 1.42, body, -0.2, 1.08, 0, g);
  k.box(2.0, 0.5, 1.46, '#2b3448', -0.2, 1.12, 0, g);
  if (door) k.box(0.95, 0.72, 0.04, door, -0.55, 0.32, 0.81, g);
  for (const x of [-1.2, 1.2]) {
    const w = k.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 12), '#1e1e24', x, 0.34, 0.82, g);
    w.rotation.x = Math.PI / 2;
  }
}

/** Builds a cover centred on (x, z): what people hide behind (facing: which way it faces). */
export function buildCover(k, type, x, z, facing = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  k.group.add(g);
  const box = (w, h, d, c, bx, by, bz) => k.box(w, h, d, c, bx, by, bz, g);
  const mesh = (geo, c, mx, my, mz) => k.mesh(geo, c, mx, my, mz, g);
  switch (type) {
    case 'bench':
      box(1.9, 0.08, 0.5, '#9a6a3c', 0, 0.45, 0);
      box(1.9, 0.55, 0.08, '#9a6a3c', 0, 0.55, 0.22 * facing);
      box(1.9, 0.12, 0.08, '#7f552e', 0, 0.95, 0.22 * facing);
      for (const kx of [-0.8, 0.8]) box(0.08, 0.45, 0.46, '#2b2f36', kx, 0, 0);
      break;
    case 'hedge':
      // A trimmed hedge: a rounded block of leaves
      box(1.9, 0.8, 0.75, '#3f7f3a', 0, 0, 0);
      for (const kx of [-0.7, -0.23, 0.23, 0.7]) mesh(new THREE.SphereGeometry(0.36, 14, 10), kx % 0.5 ? '#4a8f42' : '#3f7f3a', kx, 0.78, 0);
      for (const kx of [-0.95, 0.95]) mesh(new THREE.SphereGeometry(0.4, 14, 10), '#3f7f3a', kx, 0.42, 0);
      break;
    case 'tree':
      mesh(new THREE.CylinderGeometry(0.26, 0.4, 2.8, 12), '#6a4a30', 0, 1.4, 0);
      for (const [cx, cy, cz, cr] of [[0, 3.4, 0, 1.5], [0.9, 3.9, 0.2, 1.0], [-0.85, 3.0, 0.3, 1.0], [0.1, 4.5, -0.2, 0.9]]) mesh(new THREE.SphereGeometry(cr, 14, 10), k.night ? '#1f4a2a' : '#3f8a3a', cx, cy, cz);
      // a bush at its foot to hide behind
      for (const kx of [-0.55, 0.55]) mesh(new THREE.SphereGeometry(0.62, 14, 10), k.night ? '#24552e' : '#4a8f42', kx, 0.5, 0.15);
      break;
    case 'bin':
      box(1.5, 1.05, 0.8, '#2f6e3c', 0, 0, 0);
      box(1.6, 0.1, 0.9, '#275c32', 0, 1.05, 0);
      break;
    case 'wall':
      box(1.9, 0.98, 0.4, '#b9ad98', 0, 0, 0);
      box(2, 0.08, 0.5, '#a39784', 0, 0.98, 0);
      break;
    case 'kiosque':
      box(1.8, 1.02, 0.15, '#f3efe6', 0, 0, 0);
      for (const kx of [-0.85, 0, 0.85]) box(0.12, 1.12, 0.18, '#e2dccf', kx, 0, 0);
      break;
    case 'fountain':
      box(2, 1.0, 0.5, '#c9c2b4', 0, 0, 0);
      break;
    case 'car205':
      car(k, g, '#c4453a', '#9a9a9a');
      break;
    case 'car':
      car(k, g, '#5a6f8f', null);
      break;
    case 'pillar':
      mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.4, 10), '#3a5a8a', 0, 2.2, 0);
      box(1.5, 1.05, 0.7, '#8c8f96', 0, 0, 0); // a planter at its foot
      break;
    case 'machine':
      box(1.3, 1.9, 0.8, '#c8332b', 0, 0, 0);
      box(0.9, 1.1, 0.05, '#2b3448', -0.1, 0.6, 0.41 * facing);
      break;
    case 'cart':
      box(1.7, 0.35, 0.9, '#6b737d', 0, 0.15, 0);
      box(0.8, 0.6, 0.8, '#8a5a35', -0.4, 0.5, 0);
      box(0.7, 0.55, 0.7, '#2f5fb3', 0.42, 0.5, 0);
      box(0.6, 0.3, 0.6, '#c8332b', 0, 1.0, 0);
      break;
    case 'kiosk':
      box(2.8, 2.1, 1.4, '#2f6e4a', 0, 0, 0);
      box(3.1, 0.15, 1.8, '#c8332b', 0, 2.1, 0.1);
      for (let i = 0; i < 6; i++) box(0.36, 0.48, 0.04, ['#ffd23f', '#ef2d6b', '#4fd6ff'][i % 3], -1.05 + i * 0.42, 1.1, 0.71 * facing);
      label(k, 'PRESSE', 1.6, 0.35, '#ffffff', '#c8332b', x, 1.85, z + 0.72 * facing);
      break;
    case 'table':
      mesh(new THREE.CylinderGeometry(0.75, 0.85, 1.05, 14), '#7a2b55', 0, 0.52, 0);
      mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 14), '#c9a3ff', 0, 1.07, 0);
      break;
    case 'sofa':
      box(2.1, 0.5, 0.9, '#a8242f', 0, 0.2, 0);
      box(2.1, 0.55, 0.2, '#8a1c26', 0, 0.55, 0.35 * facing);
      for (const kx of [-1, 1]) box(0.2, 0.75, 0.9, '#8a1c26', kx * 0.95, 0.2, 0);
      break;
    case 'speaker':
      box(1.0, 1.7, 0.8, '#18161e', 0, 0, 0);
      for (const y of [0.45, 1.15]) {
        const c = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 14), '#3a3644', 0, y, 0.41 * facing);
        c.rotation.x = Math.PI / 2;
      }
      break;
    case 'bar':
      box(2.4, 1.1, 0.7, '#5a3420', 0, 0, 0);
      box(2.6, 0.08, 0.9, '#c9a36a', 0, 1.1, 0);
      break;
    case 'dj':
      box(3.0, 1.2, 1.1, '#18161e', 0, 0, 0);
      for (const kx of [-0.8, 0.8]) mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16), '#3a3644', kx, 1.24, 0);
      for (let i = 0; i < 5; i++) glow(k, new THREE.BoxGeometry(0.4, 0.12, 0.04), ['#ff4fb4', '#4fd6ff', '#ffd23f'][i % 3], -1.2 + i * 0.6, 0.6, 0.57 * facing, g);
      break;
    case 'gate':
      // The gate of the house whose lamps got broken: two posts, a low wall, the railings.
      for (const kx of [-1.4, 1.4]) {
        box(0.5, 1.7, 0.5, '#d8cbb3', kx, 0, 0);
        mesh(new THREE.SphereGeometry(0.2, 8, 6), '#3a3a48', kx, 1.9, 0);
      }
      box(2.3, 0.95, 0.3, '#cdbf9f', 0, 0, 0);
      for (let i = 0; i < 9; i++) box(0.05, 0.7, 0.05, '#2a2a33', -1.0 + i * 0.25, 0.95, 0);
      break;
    case 'rock':
      mesh(new THREE.DodecahedronGeometry(0.95, 0), '#6d6a66', 0, 0.55, 0).scale.set(1.15, 0.75, 0.7);
      break;
    case 'log':
      for (const [y, dz] of [[0.32, 0], [0.86, 0.05]]) {
        const l = mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 9), '#6b4a30', 0, y, dz);
        l.rotation.z = Math.PI / 2;
      }
      break;
    case 'tent':
      // Rudy's tent: a triangular prism, its door open on the fire.
      {
        const shape = new THREE.Shape();
        shape.moveTo(-1.4, 0);
        shape.lineTo(1.4, 0);
        shape.lineTo(0, 1.75);
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.6, bevelEnabled: false });
        geo.translate(0, 0, -1.3);
        mesh(geo, '#3b6e8f', 0, 0, 0);
        const door = new THREE.Shape();
        door.moveTo(-0.5, 0);
        door.lineTo(0.5, 0);
        door.lineTo(0, 1.1);
        door.closePath();
        const dg = new THREE.ShapeGeometry(door);
        mesh(dg, '#1d2a35', 0, 0.01, 1.31 * facing);
      }
      break;
    default:
      box(1.8, 1.0, 0.6, '#8c8f96', 0, 0, 0);
  }
  return g;
}
