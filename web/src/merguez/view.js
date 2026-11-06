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
import { ENV, buildDecor, buildCover } from './decor.js';

const CHAR_SIZE = 1.9; // metres, a character's billboard height
const SINK = 1.08; // how far a hiding character crouches
const HEAVY = { citrouille: 1, rouleau: 1, cote: 1, poulet: 1, cubi: 1, museau: 1 };

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
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 260);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  // Light and sky: changed for each level (see decor.js ENV).
  const hemi = new THREE.HemisphereLight('#fff4e0', '#4c7a3a', 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  let shadowAt = null;
  /** The sun follows the station so the shadows around the hero stay sharp. */
  function aimSun(z) {
    sun.position.set(-18, 30, z + 6);
    sun.target.position.set(0, 0, z - 10);
    sun.target.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
    shadowAt = z;
  }
  const skyCv = document.createElement('canvas');
  skyCv.width = 4;
  skyCv.height = 256;
  const skyTex = new THREE.CanvasTexture(skyCv);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  scene.fog = new THREE.Fog('#cfe6f2', 40, 130);

  const disposables = [];
  const mats = new Map();
  const mat = (color) => {
    if (!mats.has(color)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.02 });
      mats.set(color, m);
      disposables.push(m);
    }
    return mats.get(color);
  };

  /* ---------- The level: its decor and covers, rebuilt at each new level ---------- */
  let world = null;
  let worldStuff = [];
  let shownLevel = -1;
  const kit = {
    group: null,
    night: false,
    track: (x) => worldStuff.push(x),
    mesh(geo, color, x, y, z, parent = kit.group) {
      worldStuff.push(geo);
      const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color);
      m.castShadow = true;
      m.receiveShadow = true;
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    },
    box: (w, h, d, color, x, y, z, parent) => kit.mesh(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, parent),
    /** A material painted with a canvas texture, repeated rx × ry times. */
    painted(cv, rx = 1, ry = 1, opts = {}) {
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      t.anisotropy = 8;
      const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0, ...opts });
      worldStuff.push(t, m);
      return m;
    },
  };
  function loadLevel(index) {
    if (world) {
      scene.remove(world);
      for (const d of worldStuff) d.dispose?.();
    }
    worldStuff = [];
    world = new THREE.Group();
    scene.add(world);
    kit.group = world;
    const L = rules.levels[index];
    const env = ENV[L.id] || ENV.jardin;
    kit.night = ['moliere', 'rue', 'crapa'].includes(L.id);
    const g = skyCv.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, env.sky[0]);
    grad.addColorStop(0.6, env.sky[1]);
    grad.addColorStop(1, env.sky[2]);
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    skyTex.needsUpdate = true;
    scene.fog.color.set(env.fog[0]);
    scene.fog.near = env.fog[1];
    scene.fog.far = env.fog[2];
    hemi.color.set(env.hemi[0]);
    hemi.groundColor.set(env.hemi[1]);
    hemi.intensity = env.hemi[2];
    sun.color.set(env.sun[0]);
    sun.intensity = env.sun[1];
    buildDecor(L.id, kit);
    const bigCover = { car205: 1.15, car: 1.15, kiosk: 1.0, tent: 1.6, dj: 0.9 };
    for (const st of L.stations) {
      // The hero's own cover, wide enough to slide along it (rules: SIDE = 1.2 m each way).
      // Low enough to see the people over it from the crouch (they are who you tap).
      buildCover(kit, st.cover, st.x, st.z - 1.25, -1).scale.set(1.6, 0.72, 1);
      for (const f of st.foes) buildCover(kit, f.cover, f.x, f.z + (bigCover[f.cover] || 0.65), 1);
    }
    shownLevel = index;
    shadowAt = null;
  }
  loadLevel(rules.level);

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
    const blobGeo = new THREE.PlaneGeometry(1.1, 0.55);
    const blobMat = new THREE.MeshBasicMaterial({ map: tex(shadowCv), transparent: true, depthWrite: false });
    disposables.push(blobGeo, blobMat);
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.rotation.x = -Math.PI / 2;
    scene.add(blob);
    const mark = sprite(markCv, 0.42, 0.42, [0.5, 0.5]);
    mark.material.depthTest = false; // seen even from behind the hero's cover
    mark.renderOrder = 5;
    mark.visible = false;
    const art = { body, mark, blob, pose: 'idle' };
    foeArt.set(f.id, art);
    return art;
  }
  function dropFoes(keep) {
    for (const [id, a] of foeArt) {
      if (keep.has(id)) continue;
      scene.remove(a.body, a.mark, a.blob);
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
    let x = rules.heroX();
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

  /** The shout comes out of a flying megaphone, growing as it travels. */
  function shoutFrom(sp, k, hidden = false) {
    if (!sp.userData.words) sp.userData.words = wordSprite();
    const w = sp.userData.words;
    w.visible = !hidden;
    const g = 0.35 + 0.65 * k;
    w.scale.set(2.4 * g, 0.6 * g, 1);
    w.position.copy(sp.position);
    w.position.y += 0.32 * g;
  }

  function render(dt) {
    t += dt;
    if (rules.level !== shownLevel) loadLevel(rules.level);
    if (shadowAt !== rules.pos.z) aimSun(rules.pos.z);
    const eye = eyePos();
    camera.position.copy(eye);
    // A still camera, looking a little down onto the station (you tap the people you see).
    camera.rotation.set(-0.05, 0, 0);
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
      a.blob.position.set(p.x, 0.03, p.z);
      a.blob.material.opacity = f.state === 'ko' ? Math.max(0, 1 - f.t) : 0.35 + 0.65 * f.peek;
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
      if (s.kind === 'megaphone') shoutFrom(sp, k);
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
      const to = new THREE.Vector3(s.tx + s.side * 0.3, 1.35, rules.pos.z - 0.35);
      sp.position.lerpVectors(sp.userData.from, to, k);
      sp.position.y += Math.sin(k * Math.PI) * 1.1;
      sp.material.rotation = t * sp.userData.spin;
      if (s.kind === 'megaphone') shoutFrom(sp, k, s.t < 0);
    }
    for (const [s, sp] of flying) {
      if (live.has(s)) continue;
      // The shout lingers where the megaphone landed, floating up
      const w = sp.userData.words;
      if (w) fx.push({ s: w, vx: 0, vy: 0.9, vz: 0, life: 1.2, grav: 0 });
      scene.remove(sp);
      flying.delete(s);
    }
    // Bursts
    for (const p of fx) {
      p.life -= dt;
      p.vy -= (p.grav ?? 9) * dt;
      p.s.position.x += p.vx * dt;
      p.s.position.y += p.vy * dt;
      p.s.position.z += p.vz * dt;
      p.s.material.opacity = Math.max(0, Math.min(1, p.life / 0.6));
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      if (fx[i].life > 0) continue;
      scene.remove(fx[i].s);
      fx.splice(i, 1);
    }
    renderer.render(scene, camera);
  }

  const SPLAT = { cubi: '#8e1b34', crotte: '#b8c95a', megaphone: '#e8e4dc', treuffe: '#c9a36a', mouchoir: '#ffffff', sacdos: '#f1ece0', sardine: '#9ab7d4' };
  /** « Tu es creux ! », the shout of Cous's megaphones, as a sprite. */
  const SHOUT = 'Tu es creux !';
  let shoutCv = null;
  function wordSprite() {
    if (!shoutCv) {
      shoutCv = document.createElement('canvas');
      shoutCv.width = 512;
      shoutCv.height = 128;
      const c = shoutCv.getContext('2d');
      c.font = '800 64px Fredoka, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineWidth = 12;
      c.strokeStyle = '#ef2d6b';
      c.strokeText(SHOUT, 256, 64);
      c.fillStyle = '#ffffff';
      c.fillText(SHOUT, 256, 64);
    }
    const s = sprite(shoutCv, 2.4, 0.6, [0.5, 0.5]);
    s.material.depthTest = false;
    s.renderOrder = 6;
    return s;
  }

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

  /**
   * Who is under a tap at (clientX, clientY): the closest person (head or body)
   * within reach of the finger, out or still behind their cover; else the
   * direction of the tap as { yaw, pitch }.
   */
  const v = new THREE.Vector3();
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const toScreen = (x, y, z) => {
      v.set(x, y, z).project(camera);
      return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height, front: v.z < 1 };
    };
    const reach = Math.max(46, rect.width * 0.12);
    let best = null;
    for (const f of rules.foes) {
      if (f.state === 'ko') continue;
      const p = rules.foePos(f);
      const sink = 1.08 * (1 - f.peek);
      for (const [h, head] of [[1.55, true], [1.0, false]]) {
        const s = toScreen(p.x, h - sink, p.z);
        if (!s.front) continue;
        const d = Math.hypot(s.x - clientX, s.y - clientY);
        const limit = head ? reach * 0.45 : reach;
        if (d < limit && (!best || d - (head ? 8 : 0) < best.d)) best = { foe: f.id, head, d: d - (head ? 8 : 0) };
      }
    }
    if (best) return { foe: best.foe, head: best.head };
    const ndc = new THREE.Vector3(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    return { yaw: Math.atan2(ndc.x, -ndc.z), pitch: Math.atan2(ndc.y, Math.hypot(ndc.x, ndc.z)) };
  }

  /** Where a person's head is on screen (testing). */
  function screenOf(id) {
    const f = rules.foes.find((x) => x.id === id);
    if (!f) return null;
    const rect = canvas.getBoundingClientRect();
    const p = rules.foePos(f);
    v.set(p.x, 1.55 - 1.08 * (1 - f.peek), p.z).project(camera);
    return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
  }

  return {
    pick,
    screenOf,
    render,
    event,
    resize,
    dispose() {
      for (const d of [...disposables, ...worldStuff]) d.dispose?.();
      renderer.dispose();
    },
  };
}
