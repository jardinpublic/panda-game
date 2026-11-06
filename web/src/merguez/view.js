/*
 * Golden Merguez 3D view (three.js): the level, the covers, the characters as
 * billboards that always face the camera, the thrown things, the hero's own
 * weapon in hand. It only reads the rules (rules.js) and their events.
 *
 *   const view = createView({ canvas, rules });
 *   view.event(e);   view.render(dt);   view.resize();   view.dispose();
 */
import * as THREE from 'three';
import { characterCanvas, weaponCanvas, CHAR_W, CHAR_H } from './sprites.js';

const CHAR_SIZE = 1.9; // metres, a character's billboard height
const SINK = 1.08; // how far a hiding character crouches
const HEAVY = { andouille: 1, rouleau: 1, cote: 1, poulet: 1, chorizo: 1, poissonchat: 1 };

function seeded(seed) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

export function createView({ canvas, rules }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 260);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  // Sky and light: a warm late afternoon.
  const skyCv = document.createElement('canvas');
  skyCv.width = 4;
  skyCv.height = 256;
  const sg = skyCv.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5aa9e6');
  grad.addColorStop(0.6, '#a9d6f2');
  grad.addColorStop(1, '#ffe0b8');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 4, 256);
  const skyTex = new THREE.CanvasTexture(skyCv);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  scene.fog = new THREE.Fog('#cfe6f2', 40, 130);
  scene.add(new THREE.HemisphereLight('#fff4e0', '#4c7a3a', 1.6));
  const sun = new THREE.DirectionalLight('#fff1d6', 1.6);
  sun.position.set(-20, 30, 10);
  scene.add(sun);

  const disposables = [];
  const mats = new Map();
  const mat = (color) => {
    if (!mats.has(color)) {
      const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
      mats.set(color, m);
      disposables.push(m);
    }
    return mats.get(color);
  };
  function mesh(geo, color, x, y, z, parent = scene) {
    disposables.push(geo);
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  const box = (w, h, d, color, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, parent);

  /* ---------- The Jardin Public ---------- */
  const ground = mesh(new THREE.PlaneGeometry(90, 160), '#69a84f', 0, 0, -45);
  ground.rotation.x = -Math.PI / 2;
  const path = mesh(new THREE.PlaneGeometry(4.2, 120), '#dcc79c', 0, 0.01, -40);
  path.rotation.x = -Math.PI / 2;
  const cross = mesh(new THREE.PlaneGeometry(40, 3), '#dcc79c', 0, 0.012, -38);
  cross.rotation.x = -Math.PI / 2;
  const bowl = mesh(new THREE.PlaneGeometry(12, 7), '#e4d2a6', 0.5, 0.013, -62.5); // the pétanque ground
  bowl.rotation.x = -Math.PI / 2;

  function tree(x, z, s = 1, crown = '#3f8a3a') {
    mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.4 * s, 7), '#7a5536', x, 1.2 * s, z);
    mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), crown, x, 3.1 * s, z);
    mesh(new THREE.IcosahedronGeometry(1.0 * s, 0), crown, x + 0.6 * s, 2.6 * s, z + 0.4 * s);
  }
  const rnd = seeded(7);
  for (let i = 0; i < 46; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (7 + rnd() * 18);
    const z = 6 - rnd() * 104;
    tree(x, z, 0.8 + rnd() * 0.6, ['#3f8a3a', '#4f9a3e', '#367a36'][i % 3]);
  }
  // Railings and the houses of Montceau behind them.
  for (const side of [-1, 1]) box(0.08, 1.1, 120, '#2f4a35', side * 26, 0, -40);
  const house = ['#e9d6b8', '#d8c7b0', '#efe1c4', '#cfa98a', '#e3cfae'];
  for (let i = 0; i < 9; i++) {
    const h = 7 + (i % 3) * 2;
    box(9, h, 6, house[i % house.length], -36 + i * 9, 0, -112);
    box(9.4, 1.2, 6.4, '#8a4c38', -36 + i * 9, h, -112);
  }
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const h = 6 + ((i + (side > 0 ? 1 : 0)) % 3) * 2;
      box(6, h, 9, house[(i + 2) % house.length], side * 34, 0, -10 - i * 16);
    }
  }
  // Lamp posts along the path.
  for (let z = -6; z > -90; z -= 14) {
    for (const side of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), '#2b2f36', side * 2.8, 1.6, z);
      mesh(new THREE.SphereGeometry(0.22, 8, 6), '#fff2c4', side * 2.8, 3.3, z);
    }
  }

  /** Builds a cover in front of (x, z) (between it and the hero): what people hide behind. */
  function cover(type, x, z, facing = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    if (type === 'bench') {
      box(1.9, 0.08, 0.5, '#9a6a3c', 0, 0.45, 0, g);
      box(1.9, 0.55, 0.08, '#9a6a3c', 0, 0.55, 0.22 * facing, g);
      box(1.9, 0.12, 0.08, '#7f552e', 0, 0.95, 0.22 * facing, g);
      for (const k of [-0.8, 0.8]) box(0.08, 0.45, 0.46, '#2b2f36', k, 0, 0, g);
    } else if (type === 'hedge') {
      box(2, 0.9, 0.8, '#3f7f3a', 0, 0, 0, g);
      for (const k of [-0.6, 0, 0.6]) mesh(new THREE.IcosahedronGeometry(0.3, 0), '#4a8f42', k, 0.92, 0, g);
    } else if (type === 'tree') {
      mesh(new THREE.CylinderGeometry(0.3, 0.38, 2.6, 8), '#7a5536', 0, 1.3, 0, g);
      mesh(new THREE.IcosahedronGeometry(1.7, 0), '#3f8a3a', 0, 3.2, 0, g);
      for (const k of [-0.55, 0.55]) mesh(new THREE.IcosahedronGeometry(0.62, 0), '#4a8f42', k, 0.5, 0.1, g);
    } else if (type === 'bin') {
      box(1.5, 1.05, 0.8, '#2f6e3c', 0, 0, 0, g);
      box(1.6, 0.1, 0.9, '#275c32', 0, 1.05, 0, g);
    } else if (type === 'wall') {
      box(1.9, 0.98, 0.4, '#b9ad98', 0, 0, 0, g);
      box(2, 0.08, 0.5, '#a39784', 0, 0.98, 0, g);
    } else if (type === 'kiosque') {
      box(1.8, 1.02, 0.15, '#f3efe6', 0, 0, 0, g);
      for (const k of [-0.85, 0, 0.85]) box(0.12, 1.12, 0.18, '#e2dccf', k, 0, 0, g);
    } else if (type === 'fountain') {
      box(2, 1.0, 0.5, '#c9c2b4', 0, 0, 0, g);
    } else if (type === 'car205') {
      // José's old Peugeot 205, side on: faded red, a grey primer door.
      box(3.7, 0.8, 1.6, '#c4453a', 0, 0.28, 0, g);
      box(2.1, 0.62, 1.42, '#c4453a', -0.2, 1.08, 0, g);
      box(2.0, 0.5, 1.46, '#2b3448', -0.2, 1.12, 0, g);
      box(0.95, 0.72, 0.04, '#9a9a9a', -0.55, 0.32, 0.81, g);
      for (const k of [-1.2, 1.2]) {
        const w = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 12), '#1e1e24', k, 0.34, 0.82, g);
        w.rotation.x = Math.PI / 2;
      }
    }
    return g;
  }

  // The big pieces of the level, then a cover for every opponent and every hero's station.
  mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 16), '#c9c2b4', 1.2, 0.4, -30); // fountain basin
  mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 16), '#7cc4df', 1.2, 0.78, -30);
  mesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 8), '#c9c2b4', 1.2, 1.4, -30);
  mesh(new THREE.CylinderGeometry(0.9, 0.3, 0.3, 12), '#c9c2b4', 1.2, 2.4, -30);
  const kio = new THREE.Group();
  kio.position.set(-2, 0, -47.5);
  scene.add(kio);
  mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.7, 8), '#e9e3d6', 0, 0.35, 0, kio);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 6), '#2f5a3a', Math.cos(a) * 3, 2.1, Math.sin(a) * 3, kio);
  }
  mesh(new THREE.ConeGeometry(3.9, 1.6, 8), '#3a7a4a', 0, 4.3, 0, kio);
  for (const level of rules.levels) {
    for (const st of level.stations) {
      cover(st.cover, st.x, st.z - 1.25, -1);
      for (const f of st.foes) cover(f.cover, f.x, f.z + (f.cover === 'car205' ? 1.15 : 0.65), 1);
    }
  }

  /* ---------- Billboards ---------- */
  const textures = new Map();
  function tex(cv) {
    if (!textures.has(cv)) {
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      textures.set(cv, t);
      disposables.push(t);
    }
    return textures.get(cv);
  }
  function sprite(cv, w, h, center = [0.5, 0]) {
    const m = new THREE.SpriteMaterial({ map: tex(cv), transparent: true, alphaTest: 0.04 });
    disposables.push(m);
    const s = new THREE.Sprite(m);
    s.center.set(center[0], center[1]);
    s.scale.set(w, h, 1);
    scene.add(s);
    return s;
  }
  const markCv = document.createElement('canvas');
  markCv.width = 64;
  markCv.height = 64;
  {
    const c = markCv.getContext('2d');
    c.fillStyle = '#ff3b3b';
    c.beginPath();
    c.arc(32, 32, 28, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.font = '800 44px Fredoka, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', 32, 34);
  }
  const shadowCv = document.createElement('canvas');
  shadowCv.width = 64;
  shadowCv.height = 64;
  {
    const c = shadowCv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }

  const foeArt = new Map(); // foe id -> { body, mark, pose }
  function foeSprite(f) {
    if (foeArt.has(f.id)) return foeArt.get(f.id);
    const body = sprite(characterCanvas(f.who, 'idle'), CHAR_SIZE * (CHAR_W / CHAR_H), CHAR_SIZE);
    const mark = sprite(markCv, 0.42, 0.42, [0.5, 0.5]);
    mark.material.depthTest = false; // seen even from behind the hero's cover
    mark.renderOrder = 5;
    mark.visible = false;
    const art = { body, mark, pose: 'idle' };
    foeArt.set(f.id, art);
    return art;
  }
  function dropFoes(keep) {
    for (const [id, a] of foeArt) {
      if (keep.has(id)) continue;
      scene.remove(a.body, a.mark);
      foeArt.delete(id);
    }
  }

  /* ---------- Thrown things ---------- */
  const flying = new Map(); // shot object -> sprite
  function throwSprite(kind) {
    const s = HEAVY[kind] ? 0.62 : 0.38;
    return sprite(weaponCanvas(kind), s, s, [0.5, 0.5]);
  }
  const fx = []; // little bursts and splats
  function burst(x, y, z, color, n = 8, size = 0.18) {
    const cv = document.createElement('canvas');
    cv.width = 32;
    cv.height = 32;
    const c = cv.getContext('2d');
    c.fillStyle = color;
    c.beginPath();
    c.arc(16, 16, 14, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < n; i++) {
      const s = sprite(cv, size, size, [0.5, 0.5]);
      s.position.set(x, y, z);
      const a = (i / n) * Math.PI * 2;
      fx.push({ s, vx: Math.cos(a) * 2.2, vy: 1.5 + Math.random() * 2, vz: Math.sin(a) * 2.2, life: 0.6 });
    }
  }

  // The hero's weapon, held at the bottom right of the view.
  const held = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(weaponCanvas(rules.weapon, 256)), transparent: true, depthTest: false }));
  disposables.push(held.material);
  held.renderOrder = 10;
  held.scale.set(0.2, 0.2, 1);
  camera.add(held);
  let recoil = 0;

  /* ---------- Per frame ---------- */
  const ease = (k) => k * k * (3 - 2 * k);
  let t = 0;
  function eyePos() {
    let x = rules.pos.x;
    let z = rules.pos.z;
    let bob = 0;
    const next = rules.nextStation();
    if (rules.phase === 'move' && next) {
      const k = ease(rules.walk());
      x += (next.x - x) * k;
      z += (next.z - z) * k;
      bob = Math.abs(Math.sin(t * 9)) * 0.06;
    }
    const y = rules.phase === 'move' ? 1.45 + bob : rules.eye();
    return new THREE.Vector3(x, y, z);
  }

  function render(dt) {
    t += dt;
    const eye = eyePos();
    camera.position.copy(eye);
    const yaw = rules.phase === 'move' ? 0 : rules.yaw;
    camera.rotation.set(rules.phase === 'move' ? 0 : rules.pitch, -yaw, 0);
    // Weapon in hand: lowered in cover, kicks on each throw.
    recoil = Math.max(0, recoil - dt * 6);
    const low = 1 - rules.rise;
    held.position.set(0.13, -0.2 - low * 0.12 + recoil * 0.04, -0.55 + recoil * 0.05);
    held.material.rotation = -0.5 + recoil * 0.4 + Math.sin(t * 2) * 0.03;

    // Opponents
    const alive = new Set();
    for (const f of rules.foes) {
      alive.add(f.id);
      const a = foeSprite(f);
      const p = rules.foePos(f);
      const pose = f.state === 'ko' || f.hurt > 0 ? 'sad' : f.state === 'tell' ? 'point' : f.state === 'throw' ? 'cheer' : 'idle';
      if (pose !== a.pose) {
        a.pose = pose;
        a.body.material.map = tex(characterCanvas(f.who, pose, pose === 'point' || pose === 'cheer' ? f.weapon : null));
        a.body.material.needsUpdate = true;
      }
      const sink = f.state === 'ko' ? Math.min(1.6, f.t * 2) : SINK * (1 - f.peek);
      a.body.position.set(p.x, -sink, p.z);
      a.body.material.rotation = f.state === 'ko' ? Math.min(1.3, f.t * 3) * -f.side : 0;
      a.body.material.opacity = f.state === 'ko' ? Math.max(0, 1 - Math.max(0, f.t - 0.8) * 2) : 1;
      a.body.material.color.setRGB(1, f.hurt > 0 ? 0.6 : 1, f.hurt > 0 ? 0.6 : 1);
      a.mark.visible = f.state === 'tell';
      a.mark.position.set(p.x, CHAR_SIZE + 0.35 - sink + Math.sin(t * 12) * 0.05, p.z);
    }
    dropFoes(alive);

    // The hero's throws: from the hand to the target (or along the aim).
    const live = new Set();
    for (const s of rules.shots) {
      live.add(s);
      let sp = flying.get(s);
      if (!sp) {
        sp = throwSprite(s.kind);
        const from = new THREE.Vector3(0.22, -0.2, -0.5).applyQuaternion(camera.quaternion).add(camera.position);
        const f = rules.foes.find((x) => x.id === s.target);
        let to;
        if (f) {
          const p = rules.foePos(f);
          to = new THREE.Vector3(p.x, s.head ? 1.55 : 1.0, p.z);
        } else {
          const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(s.pitch, -s.yaw, 0, 'YXZ'));
          to = camera.position.clone().addScaledVector(dir, s.dist);
        }
        sp.userData = { from, to, spin: (Math.random() < 0.5 ? -1 : 1) * 9 };
        flying.set(s, sp);
        recoil = 1;
      }
      const k = Math.min(1, s.t / s.T);
      const { from, to, spin } = sp.userData;
      sp.position.lerpVectors(from, to, k);
      sp.position.y += Math.sin(k * Math.PI) * Math.min(1.2, s.dist * 0.05);
      sp.material.rotation = t * spin;
    }
    // Their throws: from their hand to the hero's face.
    for (const s of rules.incoming) {
      live.add(s);
      let sp = flying.get(s);
      if (!sp) {
        sp = throwSprite(s.kind);
        const f = rules.foes.find((x) => x.id === s.foe);
        const p = f ? rules.foePos(f) : { x: 0, z: rules.pos.z - 12 };
        sp.userData = { from: new THREE.Vector3(p.x + 0.3, 1.8, p.z), spin: 7 };
        flying.set(s, sp);
      }
      sp.visible = s.t >= 0;
      const k = Math.max(0, Math.min(1, s.t / s.T));
      const to = new THREE.Vector3(rules.pos.x + s.side * 0.3, 1.35, rules.pos.z - 0.35);
      sp.position.lerpVectors(sp.userData.from, to, k);
      sp.position.y += Math.sin(k * Math.PI) * 1.1;
      sp.material.rotation = t * sp.userData.spin;
    }
    for (const [s, sp] of flying) {
      if (live.has(s)) continue;
      scene.remove(sp);
      flying.delete(s);
    }
    // Bursts
    for (const p of fx) {
      p.life -= dt;
      p.vy -= 9 * dt;
      p.s.position.x += p.vx * dt;
      p.s.position.y += p.vy * dt;
      p.s.position.z += p.vz * dt;
      p.s.material.opacity = Math.max(0, p.life / 0.6);
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      if (fx[i].life > 0) continue;
      scene.remove(fx[i].s);
      fx.splice(i, 1);
    }
    renderer.render(scene, camera);
  }

  const SPLAT = { mollard: '#d9f2c4', crotte: '#b8c95a', shot: '#f39a1e', rose: '#d8243c', mouchoir: '#ffffff', gardon: '#c7d3dc', sardine: '#9ab7d4' };
  function event(e) {
    if (e.type === 'hit' || e.type === 'ko') {
      const f = rules.foes.find((x) => x.id === e.foe);
      if (!f) return;
      const p = rules.foePos(f);
      burst(p.x, e.head ? 1.55 : 1.1, p.z + 0.1, e.type === 'ko' ? '#ffd23f' : SPLAT[rules.weapon] || '#c0392b', e.type === 'ko' ? 12 : 6);
    } else if (e.type === 'block') {
      burst(rules.pos.x, 1.0, rules.pos.z - 1.3, SPLAT[e.kind] || '#c0392b', 5, 0.12);
    }
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait phones: keep about 52° of view across, so the whole station fits.
    const across = (52 * Math.PI) / 180;
    const fov = (2 * Math.atan(Math.tan(across / 2) / camera.aspect) * 180) / Math.PI;
    camera.fov = Math.max(62, Math.min(92, fov));
    camera.updateProjectionMatrix();
  }
  resize();

  return {
    render,
    event,
    resize,
    dispose() {
      for (const d of disposables) d.dispose?.();
      renderer.dispose();
    },
  };
}
