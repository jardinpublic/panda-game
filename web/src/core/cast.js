// The cast in 3D: each friend's illustrated caricature face (an always-facing
// sprite) on a chunky animated body. Big head, small body: classic caricature.
//
//   const panda = createCharacter('panda');
//   scene.add(panda);
//   panda.userData.animate(dt, 'run');   // idle | run | jump | cheer | hit | dance | sit
//
// Kids are generic, unnamed and drawn in code: createKid(seed).

import * as THREE from 'three';

const BASE = `${import.meta.env.BASE_URL}cast/`;
const textureCache = new Map();

export const CAST_IDS = ['panda', 'cous', 'romain', 'mamar', 'victor', 'babar', 'greg', 'aline', 'eugenie', 'violaine'];

/** Clothes per friend, from their photos and the chats. */
export const OUTFITS = {
  panda: { shirt: '#f7f7f2', pattern: 'panda', legs: '#3c4c6e', skin: '#f0c3a3' },
  cous: { shirt: '#1f7a4d', pattern: 'hawaiian', legs: '#4a4d55', skin: '#f4cbb0', tall: 1.12 },
  romain: { shirt: '#bcd6ee', pattern: 'tie', legs: '#232838', skin: '#e2b08c' },
  mamar: { shirt: '#ffffff', pattern: 'argentina', legs: '#1c2030', skin: '#ebbd98' },
  victor: { shirt: '#1c2a4a', pattern: 'plain', legs: '#d96a4a', skin: '#d9a07a' },
  babar: { shirt: '#33363c', pattern: 'hoodie', legs: '#3a4c70', skin: '#efc19f', wide: 1.1 },
  greg: { shirt: '#9fc3e3', pattern: 'plain', legs: '#2c3240', skin: '#ebbd9b' },
  aline: { shirt: '#2f8c96', pattern: 'plain', legs: '#2c3240', skin: '#f5ccb2', small: 0.95 },
  eugenie: { shirt: '#1d1d24', pattern: 'plain', legs: '#c83a44', skin: '#f8d3bd', small: 0.94, skirt: true },
  violaine: { shirt: '#e8664e', pattern: 'plain', legs: '#3a5280', skin: '#ecb994', small: 0.95 },
};

function faceTexture(id) {
  if (!textureCache.has(id)) {
    const tex = new THREE.TextureLoader().load(`${BASE}${id}.svg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    textureCache.set(id, tex);
  }
  return textureCache.get(id);
}

function shirtTexture(outfit) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = outfit.shirt;
  g.fillRect(0, 0, 128, 128);
  switch (outfit.pattern) {
    case 'argentina':
      g.fillStyle = '#75b7e8';
      for (let x = 10; x < 128; x += 36) g.fillRect(x, 0, 16, 128);
      break;
    case 'hawaiian':
      for (let i = 0; i < 14; i++) {
        const x = (i * 47) % 128;
        const y = (i * 29) % 128;
        g.fillStyle = '#f4a24a';
        g.beginPath(); g.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(x - 4, y - 2, 3, 0, Math.PI * 2); g.fill();
      }
      break;
    case 'panda':
      g.fillStyle = '#111';
      g.beginPath(); g.arc(52, 48, 8, 0, 7); g.arc(76, 48, 8, 0, 7); g.fill();
      g.fillStyle = '#eee';
      g.beginPath(); g.arc(64, 62, 16, 0, 7); g.fill();
      g.fillStyle = '#111';
      g.beginPath(); g.arc(58, 60, 4, 0, 7); g.arc(70, 60, 4, 0, 7); g.fill();
      break;
    case 'tie':
      g.fillStyle = '#c8202b';
      g.beginPath(); g.moveTo(58, 0); g.lineTo(70, 0); g.lineTo(74, 90); g.lineTo(64, 104); g.lineTo(54, 90); g.fill();
      break;
    case 'hoodie':
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(40, 70, 48, 26);
      g.strokeStyle = '#ddd';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(54, 10); g.lineTo(54, 50); g.moveTo(74, 10); g.lineTo(74, 50); g.stroke();
      break;
    default:
      break;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function limb(radius, length, color) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
  mesh.castShadow = true;
  // Pivot at the top: shift geometry down.
  mesh.geometry.translate(0, -length / 2 - radius * 0.3, 0);
  return mesh;
}

/**
 * Builds a character. Options: { scale, faceTexture } (faceTexture lets kids
 * use a code-drawn face). Returns a Group with userData.animate(dt, state)
 * and userData.flash() for hits.
 */
export function createCharacter(id, { scale = 1, face = null, outfit = null } = {}) {
  const o = outfit || OUTFITS[id] || OUTFITS.panda;
  const tall = o.tall || 1;
  const small = o.small || 1;
  const wide = o.wide || 1;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32 * wide, 0.45 * tall, 4, 12),
    new THREE.MeshStandardMaterial({ map: shirtTexture(o), roughness: 0.8 }));
  torso.position.y = 0.95 * tall;
  torso.castShadow = true;
  body.add(torso);
  if (o.skirt) {
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 16, 1, true), new THREE.MeshStandardMaterial({ color: o.legs, side: THREE.DoubleSide }));
    skirt.position.y = 0.62;
    body.add(skirt);
  }
  const legL = limb(0.11, 0.42, o.skirt ? o.skin : o.legs);
  const legR = limb(0.11, 0.42, o.skirt ? o.skin : o.legs);
  legL.position.set(-0.14, 0.62, 0);
  legR.position.set(0.14, 0.62, 0);
  body.add(legL, legR);
  for (const leg of [legL, legR]) {
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: '#1d1a1c' }));
    shoe.scale.set(1, 0.6, 1.5);
    shoe.position.set(0, -0.6, 0.05);
    leg.add(shoe);
  }
  const armL = limb(0.09, 0.42, o.shirt);
  const armR = limb(0.09, 0.42, o.shirt);
  armL.position.set(-0.4 * wide, 1.22 * tall, 0);
  armR.position.set(0.4 * wide, 1.22 * tall, 0);
  body.add(armL, armR);
  for (const arm of [armL, armR]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: o.skin }));
    hand.position.y = -0.58;
    arm.add(hand);
  }
  const headMaterial = new THREE.SpriteMaterial({ map: face || faceTexture(id), transparent: true });
  const head = new THREE.Sprite(headMaterial);
  const headH = 1.25 * small;
  head.scale.set(headH * (360 / 440), headH, 1);
  head.center.set(0.478, 0.095);
  head.position.y = 1.32 * tall;
  body.add(head);

  root.scale.setScalar(scale * small);
  let phase = 0;
  let flash = 0;
  const parts = { body, torso, legL, legR, armL, armR, head };

  root.userData = {
    id,
    parts,
    height: (1.32 * tall + headH) * scale * small,
    flash() { flash = 0.5; },
    /** Plays one animation step. state: idle | run | jump | cheer | hit | dance | sit */
    animate(dt, state = 'idle') {
      phase += dt * (state === 'run' ? 14 : state === 'dance' ? 9 : 4);
      const s = Math.sin(phase);
      body.position.y = 0;
      body.rotation.set(0, 0, 0);
      legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0);
      armL.rotation.set(0, 0, 0); armR.rotation.set(0, 0, 0);
      switch (state) {
        case 'run':
          legL.rotation.x = s * 0.9; legR.rotation.x = -s * 0.9;
          armL.rotation.x = -s * 0.8; armR.rotation.x = s * 0.8;
          body.position.y = Math.abs(Math.cos(phase)) * 0.08;
          body.rotation.x = 0.12;
          break;
        case 'jump':
          legL.rotation.x = -0.6; legR.rotation.x = 0.3;
          armL.rotation.z = 2.4; armR.rotation.z = -2.4;
          break;
        case 'cheer':
          armL.rotation.z = 2.6 + s * 0.3; armR.rotation.z = -2.6 - s * 0.3;
          body.position.y = Math.max(0, s) * 0.25;
          break;
        case 'dance':
          armL.rotation.z = 1.8 + s * 0.8; armR.rotation.z = -1.8 + s * 0.8;
          body.rotation.z = s * 0.15;
          legL.rotation.z = Math.max(0, s) * 0.4; legR.rotation.z = Math.min(0, s) * 0.4;
          body.position.y = Math.abs(s) * 0.12;
          break;
        case 'hit':
          body.rotation.x = -0.4;
          armL.rotation.z = 1.2; armR.rotation.z = -1.2;
          break;
        case 'sit':
          legL.rotation.x = -1.4; legR.rotation.x = -1.4;
          body.position.y = -0.45;
          break;
        default:
          body.position.y = Math.sin(phase * 0.7) * 0.02;
          armL.rotation.z = 0.08; armR.rotation.z = -0.08;
      }
      if (flash > 0) {
        flash -= dt;
        headMaterial.color.setScalar(Math.sin(flash * 40) > 0 ? 3 : 1);
      } else {
        headMaterial.color.setScalar(1);
      }
    },
  };
  root.userData.animate(0, 'idle');
  return root;
}

/** A generic cartoon kid with a code-drawn face (never a real child). */
export function createKid(seed = 1) {
  const hair = ['#3b2414', '#d9a441', '#1c1a18', '#a5492a'][seed % 4];
  const skins = ['#f5cfb4', '#d9a07a', '#8d5a3b', '#f0c3a3'];
  const skin = skins[(seed * 7) % 4];
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 440;
  const g = c.getContext('2d');
  g.lineWidth = 8;
  g.strokeStyle = '#2a1d18';
  g.fillStyle = skin;
  g.beginPath(); g.ellipse(180, 210, 120, 140, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = hair;
  g.beginPath(); g.ellipse(180, 110, 130, 75, 0, Math.PI, 0); g.fill(); g.stroke();
  for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(80 + i * 50, 100, 26, 40, 0.3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(135, 200, 30, 0, 7); g.arc(225, 200, 30, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#2a1d18';
  g.beginPath(); g.arc(145, 205, 12, 0, 7); g.arc(235, 205, 12, 0, 7); g.fill();
  g.beginPath(); g.arc(180, 280, 40, 0.15, Math.PI - 0.15); g.stroke();
  g.fillStyle = '#e88a8a';
  g.beginPath(); g.arc(110, 255, 18, 0, 7); g.arc(250, 255, 18, 0, 7); g.fill();
  g.fillStyle = skin;
  g.fillRect(150, 340, 60, 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const shirts = ['#f2c14e', '#4ecdc4', '#ff6b6b', '#9b5de5', '#00bb7f'];
  return createCharacter('kid', {
    scale: 0.68, face: tex,
    outfit: { shirt: shirts[seed % shirts.length], pattern: 'plain', legs: '#33507a', skin },
  });
}
