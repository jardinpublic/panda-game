// World 10 - "La revanche de Babar": role swap, you play Babar at a terrace
// barbecue party in Martinique. Sneak up behind Panda and land the running
// gags (lighter tap on the shoulder, spit on the back) with a timing bar.
// Panda looks around (telegraphed head turn + yellow cone, then red cone):
// moving inside it gets you spotted. Hide behind friends and props, freeze.
// Mamar and Romain are accomplices; Aline and Eugénie snitch if bumped.

import {
  createPartyState, OBSTACLES, WAYPOINTS, GRILL_WAYPOINT, BABAR_START,
  FRONT_RANGE, FRONT_HALF,
} from './rules.js';

export const MODELS = ['nature', 'platform'];

export const TEXTS = {
  en: {
    howto: [
      'You are Babar! Arrows / WASD or tap / drag to sneak around.',
      'When Panda turns his head (yellow cone), hide behind friends or FREEZE.',
      'Right behind him: press Space / tap in the green zone to land the gag!',
    ],
    objective: 'Gags landed: {n} — goal {goal}',
    go: 'Revenge time, Babar!',
    hmm: ['Hm?', 'Hmmm…', 'Who\'s there?'],
    freeze: 'FREEZE!',
    spotted: 'Hoho, I see you Babar!',
    strike: 'SPOTTED! {n}/{max}',
    lighter: 'Lighter tap!',
    spit: 'Spit on the back!',
    mini_title_lighter: '🔥 Lighter tap',
    mini_title_spit: '💦 Spit',
    mini_hint: 'Space / tap in the green!',
    perfect: 'PERFECT!',
    good: 'Nice!',
    miss: 'Missed!',
    combo: 'COMBO x{n}',
    react_lighter: ['Ouch! Babaaar!', 'Hoho… the lighter again?!'],
    react_spit: ['Yuck! Babar!!', 'Hoho… is it raining?'],
    snitch_aline: 'Panda, Babar is behind you!',
    snitch_eugenie: 'Panda! Watch your back, darling!',
    merguez: 'Hoho, the merguez!',
    merguez_tip: 'Merguez time: Panda is busy eating!',
    cous_grill: 'Merguez are ready!',
    babar_win: 'Shave it all off!',
    suspicion: 'Panda suspects',
    time: '{s}s',
    end_win: '{n} gags landed. Panda will never feel safe at a barbecue again.',
    end_few: 'Time\'s up: Panda ate all the merguez in peace.',
    end_caught: 'Three times caught. "Hoho, nice try Babar."',
  },
  fr: {
    howto: [
      'Tu es Babar ! Flèches / ZQSD ou touche / glisse pour te faufiler.',
      'Quand Panda tourne la tête (cône jaune), cache-toi derrière les potes ou FIGE-TOI.',
      'Juste derrière lui : Espace / touche dans le vert pour placer le gag !',
    ],
    objective: 'Gags placés : {n} — objectif {goal}',
    go: 'La revanche, Babar !',
    hmm: ['Hm ?', 'Hmmm…', 'Qui va là ?'],
    freeze: 'FIGE-TOI !',
    spotted: 'Hoho, j\'te vois Babar !',
    strike: 'REPÉRÉ ! {n}/{max}',
    lighter: 'Coup de briquet !',
    spit: 'Crachat dans le dos !',
    mini_title_lighter: '🔥 Coup de briquet',
    mini_title_spit: '💦 Crachat',
    mini_hint: 'Espace / touche dans le vert !',
    perfect: 'PARFAIT !',
    good: 'Bien joué !',
    miss: 'Raté !',
    combo: 'COMBO x{n}',
    react_lighter: ['Aïe ! Babaaar !', 'Hoho… encore le briquet ?!'],
    react_spit: ['Beurk ! Babar !!', 'Hoho… il pleut ?'],
    snitch_aline: 'Panda, Babar est derrière toi !',
    snitch_eugenie: 'Panda ! Attention derrière, mon chou !',
    merguez: 'Hoho les merguez !',
    merguez_tip: 'Pause merguez : Panda est occupé à manger !',
    cous_grill: 'Les merguez sont prêtes !',
    babar_win: 'Rase z\'y tout !',
    suspicion: 'Panda se méfie',
    time: '{s}s',
    end_win: '{n} gags placés. Panda ne sera plus jamais tranquille à un barbecue.',
    end_few: 'Temps écoulé : Panda a mangé toutes les merguez en paix.',
    end_caught: 'Repéré trois fois. « Hoho, bien essayé Babar. »',
  },
};

const CSS = `
.w10-mini { position: absolute; left: 50%; bottom: 18%; transform: translateX(-50%); width: min(520px, 86vw);
  pointer-events: none; text-align: center; display: none; font-weight: 800; }
.w10-mini.show { display: block; animation: w10pop .18s ease-out; }
.w10-mini-title { color: #fff; font-size: 24px; text-shadow: 0 2px 0 #000, 0 0 10px #000; margin-bottom: 6px; }
.w10-bar { position: relative; height: 34px; border-radius: 17px; background: rgba(20,20,30,.78); border: 3px solid #fff; overflow: hidden; }
.w10-zone { position: absolute; top: 0; bottom: 0; background: #4cd964; }
.w10-perfect { position: absolute; top: 0; bottom: 0; background: #ffe14a; }
.w10-marker { position: absolute; top: -4px; bottom: -4px; width: 8px; margin-left: -4px; background: #fff; box-shadow: 0 0 10px #fff; border-radius: 4px; }
.w10-mini-hint { color: #ffe14a; font-size: 16px; margin-top: 6px; text-shadow: 0 2px 0 #000; }
@keyframes w10pop { from { transform: translateX(-50%) scale(.6); } to { transform: translateX(-50%) scale(1); } }
`;

const FRIEND_FACING = { bbq: [-6, -4], tableA: [5.6, -4], tableB: [6, 4.2] };

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const state = createPartyState({ mode: ctx.mode, random: ctx.random });
  const cfg = state.cfg;
  const goal = cfg.stars[0];

  // --- Scene ---------------------------------------------------------------------
  ctx.setupSky({ top: '#ff9a5c', bottom: '#ffe3a8', fog: 0xffe0b0, fogNear: 30, fogFar: 70 });
  const sun = ctx.addLights(root);
  sun.position.set(-10, 16, 8);

  function mat(color, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
  }
  function mesh(geo, color, extra) {
    const m = new THREE.Mesh(geo, mat(color, extra));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Wooden deck with plank texture
  const deckCanvas = document.createElement('canvas');
  deckCanvas.width = 256; deckCanvas.height = 256;
  {
    const g = deckCanvas.getContext('2d');
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ['#c08a55', '#b67d4a', '#c9935c', '#b88250'][i % 4];
      g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = 'rgba(60,30,10,.45)';
      g.fillRect(0, i * 32, 256, 2);
      g.fillRect(((i * 97) % 256), i * 32, 2, 32);
    }
  }
  const deckTex = new THREE.CanvasTexture(deckCanvas);
  deckTex.colorSpace = THREE.SRGBColorSpace;
  deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping;
  deckTex.repeat.set(6, 4);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.85 }));
  deck.rotation.x = -Math.PI / 2;
  deck.receiveShadow = true;
  root.add(deck);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat('#5fbf4a', { roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.03;
  root.add(grass);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(90, 8), mat('#f3d79a', { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.02, -14);
  root.add(sand);
  const seaMat = mat('#1fb4d8', { roughness: 0.15, metalness: 0.1 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 40), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.01, -37);
  root.add(sea);
  // Deck railing posts and string lights
  const bulbs = [];
  const bulbColors = ['#ffdf5e', '#ff6b8a', '#6bd5ff', '#8af27a', '#ffffff'];
  const corners = [[-12, -9], [12, -9], [12, 9], [-12, 9]];
  for (const [x, z] of corners) {
    const post = mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 8), '#6b4a2b');
    post.position.set(x, 1.8, z);
    root.add(post);
  }
  for (let e = 0; e < 4; e++) {
    const [ax, az] = corners[e];
    const [bx, bz] = corners[(e + 1) % 4];
    for (let i = 1; i < 14; i++) {
      const k = i / 14;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: bulbColors[(i + e) % bulbColors.length] }));
      bulb.position.set(ax + (bx - ax) * k, 3.5 - Math.sin(k * Math.PI) * 0.7, az + (bz - az) * k);
      root.add(bulb);
      bulbs.push(bulb);
    }
  }
  // Background palms around the terrace
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (Math.sin(a) > 0.2) continue; // keep the camera side clear
    const p = palm(4.5 + (i % 3));
    p.position.set(Math.cos(a) * 17, 0, Math.sin(a) * 13);
    p.rotation.y = a;
    root.add(p);
  }

  function palm(h) {
    const m = models.get('tree_palm', { height: h });
    if (m) return m;
    const g = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(0.18, 0.28, h, 8), '#8a5a33');
    trunk.position.y = h / 2;
    g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = mesh(new THREE.ConeGeometry(0.5, 2.4, 4), '#2f9e44');
      leaf.position.set(Math.cos(i) * 0.9, h, Math.sin(i) * 0.9);
      leaf.rotation.set(Math.sin(i) * 1.3, 0, -Math.cos(i) * 1.3);
      g.add(leaf);
    }
    return g;
  }

  // --- Props (all obstacles) ------------------------------------------------------
  const merguez = [];
  const smokePos = new THREE.Vector3(-6, 1.3, -4);
  function barbecue() {
    const g = new THREE.Group();
    for (const [x, z] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) {
      const leg = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 6), '#333');
      leg.position.set(x, 0.42, z);
      g.add(leg);
    }
    const tray = mesh(new THREE.BoxGeometry(1.5, 0.3, 1), '#2b2b2f', { metalness: 0.5 });
    tray.position.y = 0.95;
    g.add(tray);
    const coals = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.85), new THREE.MeshStandardMaterial({ color: '#ff5a1f', emissive: '#ff3d00', emissiveIntensity: 1.2 }));
    coals.position.y = 1.1;
    g.add(coals);
    for (let i = 0; i < 7; i++) {
      const bar = mesh(new THREE.BoxGeometry(1.4, 0.02, 0.03), '#999', { metalness: 0.8, roughness: 0.3 });
      bar.position.set(0, 1.14, -0.4 + i * 0.13);
      g.add(bar);
    }
    for (let i = 0; i < 6; i++) {
      const m = mesh(new THREE.CapsuleGeometry(0.05, 0.42, 4, 8), '#a8432a');
      m.rotation.z = Math.PI / 2;
      m.position.set(-0.4 + (i % 3) * 0.4, 1.19, -0.22 + Math.floor(i / 3) * 0.42);
      g.add(m);
      merguez.push(m);
    }
    return g;
  }
  function table(top) {
    const g = new THREE.Group();
    const t = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 20), '#f7f3e8');
    t.position.y = 0.78;
    const leg = mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.78, 8), '#555');
    leg.position.y = 0.39;
    const pole = mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 6), '#eee');
    pole.position.y = 1.15;
    const shade = mesh(new THREE.ConeGeometry(1.5, 0.55, 12), top);
    shade.position.y = 2.35;
    g.add(t, leg, pole, shade);
    for (let i = 0; i < 4; i++) {
      const glass = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 8), i % 2 ? '#ffb347' : '#ffe8a3', { transparent: true, opacity: 0.85 });
      glass.position.set(Math.cos(i * 1.6) * 0.45, 0.9, Math.sin(i * 1.6) * 0.45);
      g.add(glass);
    }
    const plate = mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.03, 14), '#fff');
    plate.position.set(0, 0.83, 0);
    g.add(plate);
    return g;
  }
  function bar() {
    const g = new THREE.Group();
    const counter = mesh(new THREE.BoxGeometry(2.1, 1.1, 1.1), '#d9a35b');
    counter.position.y = 0.55;
    const topB = mesh(new THREE.BoxGeometry(2.3, 0.08, 1.25), '#7a4a22');
    topB.position.y = 1.14;
    g.add(counter, topB);
    for (let i = 0; i < 5; i++) {
      const stripe = mesh(new THREE.BoxGeometry(0.06, 1.05, 0.02), '#8a5a2b');
      stripe.position.set(-0.85 + i * 0.42, 0.55, 0.56);
      g.add(stripe);
    }
    for (let i = 0; i < 4; i++) {
      const bottle = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 8), ['#c9772a', '#e8e0c8', '#c9772a', '#7a3b12'][i], { transparent: true, opacity: 0.9 });
      bottle.position.set(-0.7 + i * 0.45, 1.39, 0);
      g.add(bottle);
    }
    return g;
  }
  function planter() {
    const g = new THREE.Group();
    const box = mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.6, 12), '#c8553d');
    box.position.y = 0.3;
    g.add(box);
    const bush = models.get('plant_bush', { height: 1.2 }) || mesh(new THREE.SphereGeometry(0.7, 12, 10), '#3aa655');
    bush.position.y = bush.isMesh ? 1 : 0.55;
    g.add(bush);
    const flower = models.get('flower_redA', { height: 0.5 });
    if (flower) { flower.position.set(0.3, 0.6, 0.2); g.add(flower); }
    return g;
  }
  function speaker() {
    const g = new THREE.Group();
    const b = mesh(new THREE.BoxGeometry(0.9, 1.5, 0.8), '#1d1d24');
    b.position.y = 0.75;
    g.add(b);
    for (const y of [0.45, 1.1]) {
      const cone = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), '#555');
      cone.rotation.x = Math.PI / 2;
      cone.position.set(0, y, -0.41);
      g.add(cone);
    }
    g.rotation.y = Math.PI / 2;
    g.userData.pulse = b;
    return g;
  }
  function crates() {
    const g = new THREE.Group();
    for (const [x, y, z] of [[0, 0, 0], [0.5, 0, 0.4], [0.2, 0.75, 0.2]]) {
      const c = models.get('crate', { height: 0.75 }) || mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), '#c68a4a');
      if (c.isMesh) c.position.set(x, y + 0.37, z); else c.position.set(x, y, z);
      g.add(c);
    }
    return g;
  }

  const friends = {};
  let speakerObj = null;
  for (const o of OBSTACLES) {
    let obj;
    if (o.kind === 'friend') {
      obj = ctx.character(o.id);
      const near = OBSTACLES.filter((x) => x.kind === 'prop').reduce((best, x) => (Math.hypot(x.x - o.x, x.z - o.z) < Math.hypot(best.x - o.x, best.z - o.z) ? x : best));
      const look = FRIEND_FACING[near.id] || [near.x, near.z];
      obj.rotation.y = Math.atan2(look[0] - o.x, look[1] - o.z);
      obj.userData.state = 'idle';
      obj.userData.stateT = 0;
      friends[o.id] = obj;
    } else if (o.id === 'bbq') obj = barbecue();
    else if (o.id === 'tableA') obj = table('#ff5d8f');
    else if (o.id === 'tableB') obj = table('#3fc1c9');
    else if (o.id === 'bar') obj = bar();
    else if (o.id.startsWith('palm')) obj = palm(2.6);
    else if (o.id === 'planter') obj = planter();
    else if (o.id === 'speaker') { obj = speaker(); speakerObj = obj; }
    else obj = crates();
    obj.position.set(o.x, 0, o.z);
    root.add(obj);
  }

  const panda = ctx.character('panda');
  root.add(panda);
  const babar = ctx.character('babar');
  root.add(babar);
  // Merguez in Panda's hand while he eats at the grill
  const handMerguez = mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), '#a8432a');
  handMerguez.position.set(0, -0.62, 0.12);
  handMerguez.rotation.x = Math.PI / 2;
  panda.userData.parts.armR.add(handMerguez);
  // Babar's lighter (flame shows during the lighter gag)
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 8), new THREE.MeshBasicMaterial({ color: '#ffb000' }));
  flame.visible = false;
  root.add(flame);

  // Ring under Babar: green = hidden, orange = seen but frozen, red = getting spotted
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 28), new THREE.MeshBasicMaterial({ color: '#4cd964', transparent: true, opacity: 0.85, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  root.add(ring);
  // Tap-to-move target marker
  const tapMark = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  tapMark.rotation.x = -Math.PI / 2;
  tapMark.position.y = 0.05;
  root.add(tapMark);

  // View cones (sectors on the ground) attached under Panda
  function sector(range, half, color, opacity) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CircleGeometry(range, 32, -Math.PI / 2 - half, half * 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.06;
    g.add(m);
    g.userData.mat = m.material;
    root.add(g);
    return g;
  }
  const frontCone = sector(FRONT_RANGE, FRONT_HALF, '#ffffff', 0.2);
  const warnCone = sector(cfg.range, cfg.half + cfg.sweep, '#ffd43b', 0.22);
  const lookCone = sector(cfg.range, cfg.half, '#ff3b3b', 0.38);

  // Eye icon above Panda's head (code-drawn)
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = 128; eyeCanvas.height = 128;
  {
    const g = eyeCanvas.getContext('2d');
    g.fillStyle = '#ffd43b';
    g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 7;
    g.beginPath(); g.ellipse(64, 64, 46, 26, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#222';
    g.beginPath(); g.arc(64, 64, 15, 0, 7); g.fill();
  }
  const eyeTex = new THREE.CanvasTexture(eyeCanvas);
  eyeTex.colorSpace = THREE.SRGBColorSpace;
  const eye = new THREE.Sprite(new THREE.SpriteMaterial({ map: eyeTex, transparent: true, depthTest: false }));
  eye.scale.set(0.8, 0.8, 1);
  eye.visible = false;
  root.add(eye);

  // --- Timing bar overlay ------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = CSS;
  const mini = document.createElement('div');
  mini.className = 'w10-mini';
  mini.innerHTML = '<div class="w10-mini-title"></div><div class="w10-bar"><div class="w10-zone"></div><div class="w10-perfect"></div><div class="w10-marker"></div></div><div class="w10-mini-hint"></div>';
  const miniTitle = mini.querySelector('.w10-mini-title');
  const miniZone = mini.querySelector('.w10-zone');
  const miniPerfect = mini.querySelector('.w10-perfect');
  const miniMarker = mini.querySelector('.w10-marker');

  // --- Input helpers -------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const moveTarget = { x: 0, z: 0, active: false };
  let touchConsumed = false;
  function pointToGround(x, y) {
    ndc.set(x, y);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(groundPlane, hit);
  }
  function setTarget(x, y) {
    if (!pointToGround(x, y)) return;
    moveTarget.x = hit.x;
    moveTarget.z = hit.z;
    moveTarget.active = true;
    tapMark.position.x = hit.x;
    tapMark.position.z = hit.z;
    tapMark.material.opacity = 0.9;
  }

  // --- Runtime state ---------------------------------------------------------------------
  const camTarget = new THREE.Vector3(BABAR_START.x * 0.6, 0, BABAR_START.z * 0.5);
  const tmp = new THREE.Vector3();
  let shake = 0;
  let time = 0;
  let chatterTimer = 4;
  let lastStrikes = -1;
  let lastGags = -1;
  let outro = -1;
  let endLine = '';
  let ended = false;
  let merguezTipShown = false;
  let pandaHop = 0;

  function refreshHud() {
    if (state.strikes !== lastStrikes) {
      lastStrikes = state.strikes;
      hud.setHearts(cfg.maxStrikes - state.strikes, cfg.maxStrikes);
    }
    if (state.gags !== lastGags) {
      lastGags = state.gags;
      hud.setObjective(ctx.t('objective', { n: state.gags, goal }));
    }
    hud.setScore(state.score);
    hud.setProgress(state.time / cfg.duration, ctx.t('time', { s: Math.ceil(state.remaining()) }));
    const sus = state.suspicion;
    hud.meter('sus', sus, sus > 0.6 ? '#ff3b3b' : sus > 0.25 ? '#ffa94d' : '#4cd964', `👁 ${ctx.t('suspicion')}`);
  }

  function react(id, line, secs = 2, anim = 'cheer') {
    const f = friends[id];
    if (!f) return;
    hud.say(f, line, secs);
    f.userData.state = anim;
    f.userData.stateT = secs;
  }

  function onEvents(events) {
    for (const e of events) {
      switch (e) {
        case 'turning': {
          hud.say(panda, ctx.t('hmm'), 1.2);
          sfx.note(330);
          const p = state.panda;
          const b = state.babar;
          const a = Math.atan2(b.x - p.x, b.z - p.z);
          let d = Math.abs(((a - p.lookAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (d < cfg.half + cfg.sweep + 0.2 && Math.hypot(b.x - p.x, b.z - p.z) < cfg.range + 1) hud.banner(ctx.t('freeze'), 900, '#ffd43b');
          break;
        }
        case 'looking':
          sfx.note(220);
          break;
        case 'spotted':
          sfx.hoho();
          hud.say(panda, ctx.t('spotted'), 2.2);
          hud.banner(ctx.t('strike', { n: state.strikes, max: cfg.maxStrikes }), 1300, '#ff4d4d');
          babar.userData.flash();
          fx.burst(tmp.set(state.babar.x, 1.6, state.babar.z), 20, { color: 0xff4d4d });
          shake = 0.45;
          break;
        case 'miniStart':
          sfx.whoosh();
          miniTitle.textContent = ctx.t(state.mini.gag === 'lighter' ? 'mini_title_lighter' : 'mini_title_spit');
          mini.querySelector('.w10-mini-hint').textContent = ctx.t('mini_hint');
          miniZone.style.left = `${(state.mini.center - cfg.zone / 2) * 100}%`;
          miniZone.style.width = `${cfg.zone * 100}%`;
          miniPerfect.style.left = `${(state.mini.center - cfg.perfect / 2) * 100}%`;
          miniPerfect.style.width = `${cfg.perfect * 100}%`;
          mini.classList.add('show');
          break;
        case 'gag': {
          mini.classList.remove('show');
          const lighter = state.lastGag === 'lighter';
          const at = tmp.set(state.panda.x, 1.6, state.panda.z);
          if (lighter) {
            sfx.whoosh(); sfx.hit();
            flame.visible = true;
            flame.userData.t = 0.6;
            fx.burst(at, 30, { color: 0xffa000, speed: 3, up: 3 });
          } else {
            sfx.hit();
            fx.burst(at, 30, { color: 0xbfe8ff, speed: 3, up: 2 });
          }
          fx.burst(at.setY(2.4), 40);
          hud.float(panda, `+${state.lastPoints}`, '#ffd84a', 2.8);
          hud.banner(state.lastGrade === 'perfect' ? ctx.t('perfect') : ctx.t(lighter ? 'lighter' : 'spit'), 1100, state.lastGrade === 'perfect' ? '#ffe14a' : '#ffffff');
          if (state.combo > 1) hud.float(babar, ctx.t('combo', { n: state.combo }), '#ff8cff', 2.6);
          hud.say(panda, ctx.t(lighter ? 'react_lighter' : 'react_spit'), 1.8);
          if (ctx.random() < 0.5) hud.say(babar, ctx.tShared('quote_babar'), 1.6);
          panda.userData.flash();
          pandaHop = 0.4;
          shake = 0.3;
          sfx.coin();
          break;
        }
        case 'accomplice':
          if (state.accompliceId === 'mamar') react('mamar', ctx.tShared('quote_mamar'), 2.2);
          else react('romain', ctx.tShared('quote_romain'), 2.2);
          break;
        case 'miss':
          mini.classList.remove('show');
          hud.banner(ctx.t('miss'), 900, '#ff9f9f');
          hud.say(panda, ctx.t('hmm'), 1.2);
          sfx.click();
          shake = 0.15;
          break;
        case 'snitch': {
          const id = state.snitchId;
          react(id, ctx.t(`snitch_${id}`), 2.2, 'hit');
          sfx.click();
          shake = 0.15;
          break;
        }
        case 'merguez':
          hud.say(panda, ctx.t('merguez'), 2.2);
          react('cous', ctx.t('cous_grill'), 1.8, 'idle');
          fx.burst(smokePos, 14, { color: 0xffffff, speed: 1, up: 2 });
          sfx.power();
          if (!merguezTipShown) {
            merguezTipShown = true;
            hud.banner(ctx.t('merguez_tip'), 1800, '#ffb347');
          }
          break;
        case 'won':
          outro = 2.2;
          endLine = ctx.t('end_win', { n: state.gags });
          hud.say(babar, ctx.t('babar_win'), 2);
          hud.say(friends.mamar, ctx.tShared('quote_mamar'), 2);
          hud.say(friends.romain, 'Looool', 2);
          fx.burst(tmp.set(state.babar.x, 2, state.babar.z), 80);
          for (const id in friends) { friends[id].userData.state = 'dance'; friends[id].userData.stateT = 5; }
          break;
        case 'timeout':
          outro = 1.8;
          endLine = ctx.t('end_few');
          hud.say(panda, ctx.t('merguez'), 2);
          break;
        case 'lost':
          outro = 1.8;
          endLine = ctx.t('end_caught');
          break;
        default: break;
      }
    }
  }

  // --- Lifecycle ----------------------------------------------------------------------------
  function start() {
    hud.el.appendChild(style);
    hud.el.appendChild(mini);
    ctx.music(112, [0, 4, 7, 4, 9, 7, 5, 4]);
    hud.banner(ctx.t('go'), 1800, '#ffd84a');
    hud.say(babar, ctx.tShared('quote_babar'), 2.2);
    hud.say(panda, ctx.t('merguez'), 2.2, 2.6);
    babar.position.set(BABAR_START.x, 0, BABAR_START.z);
    refreshHud();
    sfx.whoosh();
  }

  function readMove() {
    let mx = input.axisX();
    let mz = (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0);
    if (mx || mz) { moveTarget.active = false; return { mx, mz }; }
    if (!input.pointer.down) touchConsumed = false;
    if (!state.mini && !touchConsumed) {
      if (input.pointer.down) setTarget(input.pointer.x, input.pointer.y);
      else if (input.taps.length) setTarget(input.taps[0].x, input.taps[0].y);
    }
    if (moveTarget.active) {
      const dx = moveTarget.x - state.babar.x;
      const dz = moveTarget.z - state.babar.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.2) moveTarget.active = false;
      else {
        const k = Math.min(1, d / 0.5) / d;
        mx = dx * k; mz = dz * k;
      }
    }
    return { mx, mz };
  }

  function update(dt) {
    time += dt;
    if (outro >= 0) {
      outro -= dt;
      animateAll(dt);
      updateCamera(dt);
      if (outro <= 0 && !ended) {
        ended = true;
        if (state.won) ctx.finish({ score: state.score + state.bestCombo * 50, stars: state.stars(), line: endLine });
        else ctx.fail({ score: state.score, line: endLine });
      }
      return;
    }
    let press = false;
    if (state.mini && (input.pressed('action') || input.pressed('touch'))) {
      if (input.pressed('touch')) touchConsumed = true;
      moveTarget.active = false;
      press = true;
    }
    const move = readMove();
    move.press = press;
    const events = state.step(dt, move);
    onEvents(events);
    if (state.mini) miniMarker.style.left = `${state.mini.pos * 100}%`;
    else mini.classList.remove('show');
    animateAll(dt);
    updateCamera(dt);
    refreshHud();
  }

  function animateAll(dt) {
    const p = state.panda;
    const b = state.babar;
    // Babar
    babar.position.set(b.x, 0, b.z);
    babar.rotation.y = state.mini ? Math.atan2(p.x - b.x, p.z - b.z) : b.angle;
    babar.userData.animate(dt, outro >= 0 && state.won ? 'dance' : b.moving ? 'run' : 'idle');
    babar.scale.y = b.moving || state.mini ? 1 : 0.92; // crouched freeze
    if (state.mini) {
      // reaching arm towards Panda
      babar.userData.parts.armR.rotation.x = -1.4;
    }
    const ringMat = ring.material;
    ring.position.x = b.x;
    ring.position.z = b.z;
    ringMat.color.set(state.suspicion > 0.05 ? '#ff3b3b' : b.visible ? '#ffa94d' : '#4cd964');
    tapMark.material.opacity = Math.max(0, tapMark.material.opacity - dt * 1.5);

    // Panda
    pandaHop = Math.max(0, pandaHop - dt);
    panda.position.set(p.x, Math.abs(Math.sin(pandaHop * 8)) * 0.4, p.z);
    panda.rotation.y = p.angle;
    const pState = outro >= 0 ? (state.won ? 'hit' : 'cheer') : p.phase === 'startled' ? 'hit' : p.phase === 'walk' && p.look === 'none' ? 'run' : 'idle';
    panda.userData.animate(p.phase === 'walk' ? dt * 0.55 : dt, pState);
    handMerguez.visible = p.eating;
    if (p.eating && p.look === 'none') panda.userData.parts.armR.rotation.x = -1.6 - Math.max(0, Math.sin(time * 3)) * 0.6;
    if (p.eating && Math.sin(time * 3) > 0.995) fx.burst(tmp.set(p.x, 2, p.z), 3, { color: 0xffd84a, speed: 1, up: 1 });

    // Cones and the eye
    frontCone.position.set(p.x, 0, p.z);
    frontCone.rotation.y = p.angle;
    frontCone.visible = p.look === 'none' && p.phase !== 'startled' && outro < 0;
    warnCone.position.set(p.x, 0, p.z);
    warnCone.rotation.y = p.lookAngle;
    warnCone.visible = p.look === 'turning';
    warnCone.userData.mat.opacity = 0.14 + Math.abs(Math.sin(time * 10)) * 0.2;
    lookCone.position.set(p.x, 0, p.z);
    lookCone.rotation.y = p.angle;
    lookCone.visible = p.look === 'looking';
    eye.visible = p.look !== 'none';
    eye.position.set(p.x, panda.userData.height + 0.7, p.z);
    const pulse = p.look === 'turning' ? 0.65 + Math.abs(Math.sin(time * 9)) * 0.35 : 1;
    eye.scale.set(0.8 * pulse, 0.8 * pulse, 1);

    // Lighter flame at Panda's shoulder after the lighter gag
    if (flame.visible) {
      flame.userData.t -= dt;
      flame.position.set(p.x - Math.sin(p.angle) * 0.3, 1.6 + Math.sin(time * 40) * 0.03, p.z - Math.cos(p.angle) * 0.3);
      flame.scale.setScalar(0.8 + Math.random() * 0.4);
      if (flame.userData.t <= 0) flame.visible = false;
    }

    // Friends
    for (const id in friends) {
      const f = friends[id];
      f.userData.stateT -= dt;
      if (f.userData.stateT <= 0 && f.userData.state !== 'idle') f.userData.state = 'idle';
      f.userData.animate(dt, f.userData.state);
    }
    // Cous flips merguez now and then
    if (friends.cous.userData.state === 'idle') friends.cous.userData.parts.armR.rotation.x = -1 + Math.sin(time * 4) * 0.3;
    for (let i = 0; i < merguez.length; i++) merguez[i].rotation.x = Math.sin(time * 2 + i) * 0.4;
    if (Math.random() < dt * 3) fx.burst(smokePos, 2, { color: 0xdddddd, speed: 0.4, up: 1.5 });

    // Party lights and speaker
    for (let i = 0; i < bulbs.length; i++) bulbs[i].scale.setScalar(0.8 + Math.max(0, Math.sin(time * 4 + i)) * 0.5);
    if (speakerObj) speakerObj.userData.pulse.scale.setScalar(1 + Math.max(0, Math.sin(time * 11.7)) * 0.04);
    seaMat.color.setHSL(0.53, 0.75, 0.47 + Math.sin(time * 0.8) * 0.03);

    // Random chatter: the gang lives its life
    chatterTimer -= dt;
    if (chatterTimer <= 0 && outro < 0) {
      chatterTimer = 3.5 + ctx.random() * 3;
      const ids = Object.keys(friends);
      const id = ids[Math.floor(ctx.random() * ids.length)];
      hud.say(friends[id], ctx.tShared(`quote_${id}`), 1.8);
    }
  }

  function updateCamera(dt) {
    const b = state.babar;
    camTarget.x += (b.x * 0.6 - camTarget.x) * Math.min(1, dt * 3);
    camTarget.z += (b.z * 0.55 - 1 - camTarget.z) * Math.min(1, dt * 3);
    shake = Math.max(0, shake - dt);
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    camera.position.set(camTarget.x + sx, 15 + sy, camTarget.z + 8);
    camera.lookAt(camTarget.x, 0, camTarget.z - 0.5);
    sun.target.position.set(camTarget.x, 0, camTarget.z);
  }

  function dispose() {
    style.remove();
    mini.remove();
    deckTex.dispose();
    eyeTex.dispose();
  }

  // Keep WAYPOINTS / GRILL_WAYPOINT referenced for readers: the grill is where Panda eats.
  void WAYPOINTS; void GRILL_WAYPOINT;

  return { start, update, dispose, state };
}
