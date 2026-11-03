// World 3 - "Hoho ma bagnole !": Panda's red Fiat Panda is parked by a little
// castle, and waves of kids run in from every side to scribble on it, slap
// stickers, kick the tyres and let the air out. Tap a kid (Panda runs over
// and shouts) or move with the arrows and shout with Space. Power-ups: water
// pistol, scary face, ice creams. Cous brings guinea pigs, Mamar eats on a
// bench, Babar spits from the balcony, Romain laughs, the others walk by.

import { createDefence, waveSize, SPIT_TIME, SPIT_WARN, SPIT_RADIUS } from './rules.js';

export const MODELS = ['nature'];

export const TEXTS = {
  en: {
    howto: [
      'Tap a kid (or the ground): Panda runs there and shouts when close.',
      'Keyboard: arrows to move, Space to shout "Hoho ma bagnole!".',
      'Grab power-ups: 💦 water pistol, 👹 scary face, 🍦 ice creams.',
      'Survive every wave before the car is wrecked!',
    ],
    objective: 'Protect the Fiat Panda from the kids!',
    wave: 'Wave {n}/{total}', last_wave: 'Last wave!', wave_label: 'Wave {n}/{total}',
    wave_clear: 'Wave cleared! Car polished +{n}%',
    shout: ['Hoho ma bagnole!', 'Hoho, not my car!', 'Hoho, hands off!'],
    multi: 'x{n} SHOO!',
    kid_flee: ['Hihihi!', 'Run!', 'Waaah!', 'Hehe!'],
    kid_back: 'They\'re back!',
    scribble: 'Scribbling!', sticker: 'Stickers!', kick: 'Kicking tyres!', air: 'Letting air out!',
    pistol: '💦 Water pistol!', scary: '👹 Scary face!', icecream: '🍦 Free ice creams!',
    pets: '🐹 Cous brings guinea pigs!',
    cous_line: ['Guinea pigs, kids! 20 € a cuddle!', 'Be wise, kids… pet the guinea pigs.', 'New Cous shares his guinea pigs.'],
    babar_spit: ['Shave it all off!', 'Ptooey!', 'What do I have to do with it?!'],
    slowed: 'Eww, slippery!',
    mamar: ['Aïe aïe aïe aïe, the car!', 'Olé! (eats fries)', 'Fries, anyone?'],
    romain: ['Looool', 'Looool, your car!', 'Look at that!'],
    victor: ['Stylish car, Panda!', 'Get to work, Panda!', '13.6 kg, my squash!'],
    greg: ['Le crapa! Nice car!', 'In the US, cars are bigger.', 'I baked a cake!'],
    aline: ['Poor little ones, be nice!', 'We love you anyway!'],
    eugenie: ['That car is SO you, Panda!', 'Bisous the kids!'],
    violaine: ['Awkward!', 'Go for it!', 'Surf\'s up!'],
    careful: '⚠️ Careful, the car!',
    damage: 'Car',
    shout_btn: '📣 HOHO',
    win: 'The Fiat Panda survived. Hoho, ma bagnole!',
    win3: 'Not a scratch! Panda polishes his car with pride.',
    lose: 'The car looks like a Christmas tree. Romain: "Looool".',
  },
  fr: {
    howto: [
      'Touche un gamin (ou le sol) : Panda y court et crie quand il est proche.',
      'Clavier : flèches pour bouger, Espace pour crier « Hoho ma bagnole ! ».',
      'Ramasse les bonus : 💦 pistolet à eau, 👹 grimace, 🍦 glaces.',
      'Tiens toutes les vagues avant que la bagnole soit en ruine !',
    ],
    objective: 'Protège la Fiat Panda des gamins !',
    wave: 'Vague {n}/{total}', last_wave: 'Dernière vague !', wave_label: 'Vague {n}/{total}',
    wave_clear: 'Vague repoussée ! Bagnole lustrée +{n} %',
    shout: ['Hoho ma bagnole !', 'Hoho, pas ma bagnole !', 'Hoho, on touche pas !'],
    multi: 'x{n} OUSTE !',
    kid_flee: ['Hihihi !', 'Cours !', 'Waaah !', 'Héhé !'],
    kid_back: 'Ils reviennent !',
    scribble: 'Gribouillis !', sticker: 'Autocollants !', kick: 'Coups de pied !', air: 'Dégonfle !',
    pistol: '💦 Pistolet à eau !', scary: '👹 Grimace qui fait peur !', icecream: '🍦 Glaces gratuites !',
    pets: '🐹 Cous amène ses cochons d\'Inde !',
    cous_line: ['Des cochons d\'Inde ! 20 € la caresse !', 'Soyez sages… caressez les cochons d\'Inde.', 'New Cous partage ses cochons d\'Inde.'],
    babar_spit: ['Rase z\'y tout !', 'Ptou !', 'Qué don\' qu\' j\'ai à voir ?!'],
    slowed: 'Beurk, ça glisse !',
    mamar: ['Aïe aïe aïe aïe, la bagnole !', 'Olé ! (mange des frites)', 'Des frites, quelqu\'un ?'],
    romain: ['Looool', 'Looool, ta bagnole !', 'R\'gard\' don\' !'],
    victor: ['Stylée la bagnole, Panda !', 'Bosse don\', Panda !', '13,6 kg, ma courge !'],
    greg: ['Le crapa ! Belle auto !', 'Aux States, les caisses sont plus grosses.', 'J\'ai fait un gâteau !'],
    aline: ['Les pauvres petits, sois gentil !', 'On t\'aime quand même !'],
    eugenie: ['Cette bagnole, c\'est tellement toi, Panda !', 'Bisous les enfants !'],
    violaine: ['Malaisant !', 'Vazy balance !', 'Y a des vagues !'],
    careful: '⚠️ Attention la bagnole !',
    damage: 'Bagnole',
    shout_btn: '📣 HOHO',
    win: 'La Fiat Panda a survécu. Hoho, ma bagnole !',
    win3: 'Pas une rayure ! Panda lustre sa bagnole avec fierté.',
    lose: 'La bagnole ressemble à un sapin de Noël. Romain : « Looool ».',
  },
};

const ACTION_ICON = { scribble: '🖍️', sticker: '⭐', kick: '🦶', air: '💨', icecream: '🍦', pets: '🐹', flee: '😝', back: '😈' };
const PICKUP_ICON = { pistol: '💦', scary: '👹', icecream: '🍦' };
const PASSERS = ['victor', 'greg', 'aline', 'eugenie', 'violaine'];
const WHEELS = [[1.1, 0.8], [1.1, -0.8], [-1.1, 0.8], [-1.1, -0.8]];

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const state = createDefence({ mode: ctx.mode, rand: ctx.random });
  const cfg = state.cfg;
  const disposables = [];
  const tmp = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let ended = false;
  let endTimer = 0;
  let shake = 0;
  let time = 0;
  let shoutSaid = 0;
  let soundTimer = 0;
  let shoutQueued = false;
  let dragging = false;
  let scaryTimer = 0;
  let pandaCheer = 0;
  let slowSaid = 0;

  // --- Builders --------------------------------------------------------------------------
  function track(x) { disposables.push(x); return x; }
  function mat(color, extra = {}) { return track(new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra })); }
  function box(w, h, d, color, x = 0, y = 0, z = 0, extra) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Array.isArray(color) ? color : mat(color, extra));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 16) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }
  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return track(tex);
  }
  const emojiTex = new Map();
  function emoji(ch) {
    if (!emojiTex.has(ch)) {
      emojiTex.set(ch, canvasTexture(128, 128, (g) => {
        g.fillStyle = 'rgba(255,255,255,0.92)';
        g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
        g.font = '76px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(ch, 64, 70);
      }));
    }
    return emojiTex.get(ch);
  }
  function sprite(ch, size = 0.8) {
    const s = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: emoji(ch), transparent: true, depthWrite: false })));
    s.scale.set(size, size, 1);
    return s;
  }

  // --- The square, the castle, the palms ---------------------------------------------
  ctx.setupSky({ top: '#2f9be8', bottom: '#c4f1ff', fogNear: 45, fogFar: 110 });
  const sun = ctx.addLights(root);
  sun.position.set(10, 22, 12);
  const grass = new THREE.Mesh(new THREE.CircleGeometry(60, 48), mat('#7ccf5a', { roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  root.add(grass);
  const cobbles = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#e6d3a8'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) {
        g.fillStyle = ['#dcc79a', '#efdcb4', '#d6c08f'][(x * 7 + y * 3) % 3];
        g.beginPath(); g.ellipse(x + 16, y + 16, 13, 12, 0, 0, 7); g.fill();
      }
    }
  });
  cobbles.wrapS = cobbles.wrapT = THREE.RepeatWrapping;
  cobbles.repeat.set(7, 7);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(12.6, 48), track(new THREE.MeshStandardMaterial({ map: cobbles, roughness: 0.95 })));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  root.add(plaza);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.4), track(new THREE.MeshStandardMaterial({ map: cobbles, roughness: 0.95 })));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.012, -8.6);
  root.add(path);

  // A small sandstone castle with two towers and a balcony (Babar's).
  const castle = new THREE.Group();
  castle.position.set(0, 0, -16);
  const stone = '#ecd9b4';
  castle.add(box(11, 6, 4, stone, 0, 3, 0));
  for (let x = -5; x <= 5; x += 1.25) castle.add(box(0.7, 0.7, 0.7, stone, x, 6.35, 1.65));
  castle.add(box(2.4, 3.2, 0.3, '#5a3d27', 0, 1.6, 2.05));
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 20, 1, false, 0, Math.PI), mat('#5a3d27'));
  arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  arch.position.set(0, 3.2, 2.05);
  castle.add(arch);
  for (const x of [-6.6, 6.6]) {
    castle.add(cyl(1.7, 1.9, 8.5, stone, x, 4.25, 0.5, 20));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3, 20), mat('#d1495b'));
    roof.position.set(x, 10, 0.5);
    roof.castShadow = true;
    castle.add(roof);
    const pole = cyl(0.05, 0.05, 1.4, '#555', x, 12.1, 0.5, 6);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), mat('#ffd84a', { side: THREE.DoubleSide }));
    flag.position.set(x + 0.45, 12.5, 0.5);
    castle.add(pole, flag);
    for (const wy of [3, 5.6]) castle.add(box(0.5, 0.9, 0.1, '#3c5a80', x, wy, 2.35));
  }
  for (const wx of [-3.2, 3.2]) castle.add(box(1, 1.3, 0.1, '#3c5a80', wx, 4.3, 2.05));
  castle.add(box(2.6, 0.2, 1.4, stone, 3.2, 3.6, 2.6));
  for (let i = 0; i < 6; i++) castle.add(cyl(0.05, 0.05, 0.7, '#7a5a3a', 2.1 + i * 0.44, 4.05, 3.25, 6));
  castle.add(box(2.6, 0.08, 0.08, '#7a5a3a', 3.2, 4.4, 3.25));
  root.add(castle);

  for (const [x, z, h] of [[-13, -6, 6.5], [13.5, -7, 7], [-14, 4, 6], [14, 5, 6.8], [-9.5, -11, 7.4], [10, -11.5, 6.2], [-15, 10, 6], [16, 11, 6.4]]) {
    const palm = models.get('tree_palm', { height: h }) || (() => {
      const g = new THREE.Group();
      g.add(cyl(0.2, 0.3, h, '#8a5a30', 0, h / 2, 0, 8));
      const top = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 6), mat('#2f9a4a'));
      top.scale.y = 0.4;
      top.position.y = h;
      g.add(top);
      return g;
    })();
    palm.position.set(x, 0, z);
    palm.rotation.y = x * 0.7;
    root.add(palm);
  }
  for (const [x, z] of [[-11, 1], [11.5, 0], [-6, 11], [7, 11.5]]) {
    const bush = models.get('plant_bush', { height: 1.2 }) || box(1.2, 1, 1.2, '#3fae5a', 0, 0.5, 0);
    bush.position.set(x, 0, z);
    root.add(bush);
  }

  // --- The red Fiat Panda ---------------------------------------------------------------
  const car = new THREE.Group();
  const red = mat('#d62828', { roughness: 0.35, metalness: 0.15 });
  const glass = mat('#9fd8f5', { roughness: 0.1, metalness: 0.3 });
  const plastic = mat('#3b3d42', { roughness: 0.8 });
  const body = box(3.4, 0.72, 1.6, '#d62828', 0, 0.62, 0);
  body.material = red;
  car.add(body);
  const cabin = box(2.2, 0.66, 1.48, [glass, glass, red, red, glass, glass], -0.2, 1.31, 0);
  car.add(cabin);
  for (const x of [-1.27, -0.2, 0.86]) for (const z of [-0.745, 0.745]) {
    const pillar = box(0.12, 0.66, 0.04, '#d62828', x, 1.31, z);
    pillar.material = red;
    car.add(pillar);
  }
  car.add(box(3.42, 0.2, 1.64, '#3b3d42', 0, 0.33, 0));
  for (const x of [-1.76, 1.76]) {
    const b = box(0.16, 0.3, 1.66, '#3b3d42', x, 0.4, 0);
    b.material = plastic;
    car.add(b);
  }
  car.add(box(0.04, 0.26, 0.9, '#22252b', 1.71, 0.78, 0.1));
  for (const z of [-0.55, 0.55]) {
    car.add(box(0.06, 0.2, 0.34, '#fff6c2', 1.71, 0.78, z, { emissive: '#fff2a0', emissiveIntensity: 0.4 }));
    car.add(box(0.06, 0.22, 0.26, '#ff3b30', -1.71, 0.78, z, { emissive: '#ff3b30', emissiveIntensity: 0.3 }));
  }
  car.add(cyl(0.015, 0.015, 0.9, '#222', -1.1, 2.05, 0.6, 4));
  const plateTex = canvasTexture(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#1b1b1b'; g.strokeText('PANDA', w / 2, h / 2 + 4);
    g.fillStyle = '#ffffff'; g.fillText('PANDA', w / 2, h / 2 + 4);
  });
  const plateMat = track(new THREE.MeshBasicMaterial({ map: plateTex, transparent: true, toneMapped: false }));
  for (const [x, y, z, ry, w] of [[0.35, 0.62, 0.805, 0, 1.3], [0.35, 0.62, -0.805, Math.PI, 1.3], [-1.75, 0.8, 0, -Math.PI / 2, 0.8]]) {
    const label = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.25), plateMat);
    label.position.set(x, y, z);
    label.rotation.y = ry;
    car.add(label);
  }
  const wheels = WHEELS.map(([x, z]) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.36, z);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20), mat('#1b1b1e'));
    tyre.rotation.x = Math.PI / 2;
    tyre.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 12), mat('#c9ccd2', { metalness: 0.6 }));
    hub.rotation.x = Math.PI / 2;
    pivot.add(tyre, hub);
    car.add(pivot);
    return { pivot, flat: 0, x, z };
  });
  root.add(car);
  const redBase = new THREE.Color('#d62828');
  const redWorn = new THREE.Color('#7d4a3e');

  // Damage decals: crayon scribbles and stickers, revealed as kids work.
  const scribbleTex = [0, 1, 2].map((v) => canvasTexture(128, 96, (g) => {
    g.lineWidth = 7; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = ['#2b59ff', '#00b050', '#ff9f1c', '#9b5de5', '#111'][(v + i * 2) % 5];
      g.beginPath();
      g.moveTo(10, 20 + i * 25);
      for (let x = 10; x < 118; x += 12) g.lineTo(x, 20 + i * 25 + ((x / 12 + v) % 2 ? 14 : -10));
      g.stroke();
    }
  }));
  const stickerTex = ['⭐', '💖', '😜', '🦄', '🌈'].map((ch) => emoji(ch));
  const decalSlots = { front: [], back: [], left: [], right: [] };
  const decalMats = [];
  function addDecal(side, x, y, z, ry, tex, size) {
    const m = track(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false }));
    decalMats.push(m);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(size, size * (tex.image.height / tex.image.width)), m);
    d.position.set(x, y, z);
    d.rotation.set(0, ry, (x * 7 + y * 3) % 0.6 - 0.3);
    d.visible = false;
    car.add(d);
    decalSlots[side].push(d);
  }
  for (let i = 0; i < 8; i++) {
    const x = -1.35 + (i % 4) * 0.85 + (i > 3 ? 0.3 : 0);
    const y = i > 3 ? 0.45 : 0.82;
    const kind = i % 2 ? stickerTex[i % 5] : scribbleTex[i % 3];
    const size = i % 2 ? 0.34 : 0.6;
    addDecal('left', x, y, 0.815, 0, kind, size);
    addDecal('right', -x, y, -0.815, Math.PI, kind, size);
  }
  for (let i = 0; i < 4; i++) {
    const z = -0.5 + (i % 2) * 0.9;
    const y = i > 1 ? 1.25 : 0.62;
    // Low ones on the bonnet front / tailgate, high ones on the windscreen / rear window.
    addDecal('front', i > 1 ? 0.92 : 1.72, y, z, Math.PI / 2, i % 2 ? stickerTex[i] : scribbleTex[i % 3], 0.4);
    addDecal('back', i > 1 ? -1.32 : -1.76, y, -z, -Math.PI / 2, i % 2 ? stickerTex[i + 1] : scribbleTex[(i + 1) % 3], 0.4);
  }
  function sideOf(k) {
    const cx = Math.cos(k.angle);
    if (Math.abs(cx) > 0.82) return cx > 0 ? 'front' : 'back';
    return Math.sin(k.angle) > 0 ? 'left' : 'right';
  }
  function revealDecal(side) {
    const list = decalSlots[side];
    const d = list.find((x) => !x.visible) || decalSlots.left.find((x) => !x.visible) || decalSlots.right.find((x) => !x.visible);
    if (d) {
      d.visible = true;
      d.scale.setScalar(0.1);
      d.userData.pop = 0.25;
    }
  }

  // --- Panda ---------------------------------------------------------------------------
  const panda = ctx.character('panda');
  root.add(panda);
  const gun = new THREE.Group();
  gun.add(box(0.12, 0.14, 0.42, '#1fa3ff'));
  gun.add(box(0.1, 0.22, 0.1, '#ff6b9a', 0, -0.14, -0.08));
  gun.position.set(0, -0.64, 0.2);
  gun.visible = false;
  panda.userData.parts.armR.add(gun);
  const scaryFace = sprite('👹', 1.6);
  scaryFace.visible = false;
  scaryFace.position.y = 3.1;
  panda.add(scaryFace);
  const ringMat = track(new THREE.MeshBasicMaterial({ color: '#ffe14a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  const shoutRing = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 48), ringMat);
  shoutRing.rotation.x = -Math.PI / 2;
  shoutRing.position.y = 0.05;
  root.add(shoutRing);
  let ringT = 1;
  let ringR = 1;
  const markerMat = track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 24), markerMat);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.04;
  root.add(marker);

  // --- Kids (a pool of generic, unnamed kids) -------------------------------------------
  const kidPool = [];
  const kidView = new Map(); // rules kid id -> pooled view
  function makeKidView(i) {
    const mesh = ctx.kid(i * 3 + 1);
    mesh.visible = false;
    const icon = sprite('⭐', 0.7);
    icon.position.y = 2.5;
    icon.visible = false;
    mesh.add(icon);
    root.add(mesh);
    return { mesh, icon, kid: null, revealed: 0, hop: 0 };
  }
  for (let i = 0; i < 16; i++) kidPool.push(makeKidView(i));
  function attachKid(k) {
    const v = kidPool.pop() || makeKidView(kidView.size + 16);
    v.kid = k;
    v.revealed = 0;
    v.mesh.visible = true;
    v.icon.visible = false;
    v.mesh.position.set(k.x, 0, k.z);
    kidView.set(k.id, v);
    return v;
  }
  function releaseKid(k) {
    const v = kidView.get(k.id);
    if (!v) return;
    v.mesh.visible = false;
    v.kid = null;
    kidView.delete(k.id);
    kidPool.push(v);
  }
  function setIcon(v, key) {
    v.icon.visible = !!key;
    if (key) v.icon.material.map = emoji(ACTION_ICON[key]);
  }

  // --- Pickups, ice-cream cart, guinea pigs, spit -------------------------------------
  const pickupView = new Map();
  function addPickup(p) {
    const g = new THREE.Group();
    const s = sprite(PICKUP_ICON[p.kind], 1.1);
    s.position.y = 1.1;
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 24), track(new THREE.MeshBasicMaterial({ color: '#ffe14a', transparent: true, opacity: 0.8, depthWrite: false })));
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    g.add(s, glow);
    g.position.set(p.x, 0, p.z);
    g.userData.icon = s;
    root.add(g);
    pickupView.set(p.id, g);
    fx.burst(tmp.set(p.x, 1, p.z), 12, { speed: 2, up: 3 });
  }
  function removePickup(p) {
    const g = pickupView.get(p.id);
    if (g) {
      root.remove(g);
      g.traverse((o) => o.geometry?.dispose());
      pickupView.delete(p.id);
    }
  }
  const cart = new THREE.Group();
  cart.add(box(1.6, 0.9, 0.9, '#ffffff', 0, 0.75, 0));
  cart.add(box(1.62, 0.25, 0.92, '#ff8fab', 0, 1.1, 0));
  cart.add(cyl(0.04, 0.04, 1.4, '#999', 0, 1.9, 0, 6));
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 12), mat('#4ecdc4'));
  umbrella.position.y = 2.7;
  cart.add(umbrella);
  for (const x of [-0.6, 0.6]) {
    const w = cyl(0.25, 0.25, 0.1, '#333', x, 0.25, 0.48, 12);
    w.rotation.x = Math.PI / 2;
    cart.add(w);
  }
  const cone = sprite('🍦', 0.9);
  cone.position.y = 3.4;
  cart.add(cone);
  cart.visible = false;
  root.add(cart);
  const pen = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const post = box(0.1, 0.5, 0.1, '#b07a46', Math.cos(a) * 1.1, 0.25, Math.sin(a) * 1.1);
    pen.add(post);
  }
  const pigs = [];
  for (const [color, x, z] of [['#c98a4b', -0.4, 0.1], ['#ffffff', 0.35, -0.2], ['#f2b880', 0.1, 0.45]]) {
    const pig = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), mat(color));
    b.scale.set(1.35, 0.8, 1);
    b.position.y = 0.22;
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#e88a8a'));
    ear.position.set(0.3, 0.38, 0.12);
    pig.add(b, ear);
    pig.position.set(x, 0, z);
    pen.add(pig);
    pigs.push(pig);
  }
  pen.visible = false;
  root.add(pen);
  const cous = ctx.character('cous');
  cous.visible = false;
  root.add(cous);
  let cousTimer = 0;

  const spitMat = track(new THREE.MeshStandardMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.85, roughness: 0.05 }));
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(SPIT_RADIUS, 24), spitMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.03;
  puddle.visible = false;
  root.add(puddle);
  const spitBall = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), spitMat);
  spitBall.visible = false;
  root.add(spitBall);
  const spitWarnMat = track(new THREE.MeshBasicMaterial({ color: '#4fb8ff', transparent: true, opacity: 0.5, depthWrite: false }));
  const spitTarget = new THREE.Mesh(new THREE.RingGeometry(SPIT_RADIUS * 0.8, SPIT_RADIUS, 24), spitWarnMat);
  spitTarget.rotation.x = -Math.PI / 2;
  spitTarget.position.y = 0.045;
  spitTarget.visible = false;
  root.add(spitTarget);
  const spitFrom = new THREE.Vector3(3.2, 5.7, -13);
  let spitShot = null; // {x, z, t}

  // --- The gang -------------------------------------------------------------------------
  const babar = ctx.character('babar');
  babar.position.set(3.2, 3.7, -13.1);
  root.add(babar);
  const mamar = ctx.character('mamar');
  mamar.position.set(9.2, 0.45, -3.6);
  mamar.rotation.y = -1.1;
  const bench = new THREE.Group();
  bench.add(box(2.4, 0.12, 0.7, '#b07a46', 0, 0.55, 0));
  bench.add(box(2.4, 0.5, 0.1, '#b07a46', 0, 0.85, -0.35));
  for (const x of [-1, 1]) bench.add(box(0.12, 0.55, 0.6, '#555', x, 0.27, 0));
  bench.position.set(9.4, 0, -3.8);
  bench.rotation.y = -1.1;
  root.add(bench, mamar);
  const fries = new THREE.Group();
  fries.add(box(0.2, 0.22, 0.12, '#e63946'));
  for (let i = 0; i < 5; i++) fries.add(box(0.03, 0.18, 0.03, '#ffd166', -0.07 + i * 0.035, 0.15, 0));
  fries.position.set(0, -0.66, 0.1);
  mamar.userData.parts.armR.add(fries);
  const romain = ctx.character('romain');
  romain.position.set(-3.4, 0, -11.2);
  root.add(romain);
  let romainCheer = 0;
  const passers = PASSERS.map((id, i) => {
    const c = ctx.character(id);
    c.visible = false;
    if (id === 'victor') {
      const squash = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat('#f08a24'));
      squash.scale.set(1.3, 0.9, 1);
      squash.position.set(0, -0.62, 0.25);
      c.userData.parts.armR.add(squash);
    } else if (id === 'violaine') {
      const board = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), mat('#ff9f1c'));
      board.scale.set(0.35, 2.4, 0.08);
      board.position.set(0.15, -0.3, -0.1);
      c.userData.parts.armR.add(board);
    } else if (id === 'greg') {
      const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 16), mat('#f7c6d9'));
      cake.position.set(-0.25, -0.62, 0.25);
      c.userData.parts.armL.add(cake);
    }
    root.add(c);
    return { id, c, active: false, dir: 1, said: false, next: 5 + i * 8.5 };
  });

  // --- Touch button ------------------------------------------------------------------------
  function setupButtons() {
    const map = hud.buttons([{ id: 'shout', label: ctx.t('shout_btn'), side: 'right', onDown: () => { shoutQueued = true; } }]);
    Object.assign(map.shout.style, { width: '120px', height: '120px', fontSize: '22px', fontWeight: 'bold', background: '#ffd84a', border: '5px solid #fff', color: '#7a1010' });
    return map;
  }

  // --- Reactions ---------------------------------------------------------------------------
  function lineFor(id) { return ctx.t(id); }

  function onShout(r) {
    if (!r) return;
    sfx.hoho();
    ringT = 0;
    ringR = r.radius;
    shoutRing.position.set(state.panda.x, 0.05, state.panda.z);
    pandaCheer = 0.45;
    shake = Math.max(shake, r.count ? 0.25 : 0.1);
    if (time - shoutSaid > 1.3 || r.count >= 2) {
      hud.say(panda, ctx.t('shout'), 1.2);
      shoutSaid = time;
    }
    if (r.count) {
      sfx.coin();
      hud.float(panda, `+${r.points}`, '#ffd84a', 3);
      for (let i = 0; i < r.kids.length; i++) {
        const v = kidView.get(r.kids[i].id);
        if (!v) continue;
        fx.burst(tmp.set(v.mesh.position.x, 1, v.mesh.position.z), 10, { speed: 3, up: 3 });
        if (i < 2) hud.say(v.mesh, ctx.t('kid_flee'), 0.9, 2.1);
      }
      if (r.count >= 2) {
        hud.banner(ctx.t('multi', { n: r.count }), 1000, '#ffd84a');
        if (r.count >= 3) { hud.say(romain, ctx.tShared('quote_romain'), 1.6); romainCheer = 1.5; }
      }
    }
  }

  function onEvent(e) {
    switch (e.type) {
      case 'wave': {
        const last = e.wave === cfg.waves;
        hud.banner(last ? ctx.t('last_wave') : ctx.t('wave', { n: e.wave, total: cfg.waves }), 1500, last ? '#ff6b6b' : '#ffd84a');
        sfx.whoosh();
        break;
      }
      case 'spawn': attachKid(e.kid); break;
      case 'arrive': {
        const v = kidView.get(e.kid.id);
        if (v) {
          setIcon(v, e.kid.action);
          if (state.atCar() <= 2) hud.float(v.mesh, ctx.t(e.kid.action), '#ff8fab', 2.3);
        }
        break;
      }
      case 'shout': onShout(e); break;
      case 'gone': releaseKid(e.kid); break;
      case 'return': {
        const v = kidView.get(e.kid.id);
        if (v) { setIcon(v, 'back'); hud.float(v.mesh, ctx.t('kid_back'), '#ff6b6b', 2.3); }
        break;
      }
      case 'threshold':
        hud.banner(ctx.t('careful'), 1300, '#ff6b6b');
        hud.say(mamar, lineFor('mamar'), 2);
        hud.say(romain, lineFor('romain'), 2);
        romainCheer = 2;
        sfx.hit();
        shake = Math.max(shake, 0.3);
        break;
      case 'pickup_spawn': addPickup(e.pickup); break;
      case 'pickup_gone': removePickup(e.pickup); break;
      case 'pickup':
        removePickup(e.pickup);
        sfx.power();
        hud.banner(ctx.t(e.pickup.kind), 1400, '#6bd5ff');
        fx.burst(tmp.set(e.pickup.x, 1.2, e.pickup.z), 30);
        break;
      case 'power':
        if (e.kind === 'scary') {
          scaryTimer = 1.3;
          shake = Math.max(shake, 0.5);
          sfx.hit();
          ringT = 0;
          ringR = 9;
          shoutRing.position.set(state.panda.x, 0.05, state.panda.z);
          if (e.count) hud.float(panda, `+${e.count} 😱`, '#ffd84a', 3);
        } else if (e.kind === 'icecream') {
          cart.position.set(state.distraction.x, 0, state.distraction.z);
          cart.visible = true;
        }
        break;
      case 'squirt': {
        const v = kidView.get(e.kid.id);
        sfx.whoosh();
        if (v) {
          fx.burst(tmp.set(v.mesh.position.x, 1, v.mesh.position.z), 14, { color: 0x4fb8ff, speed: 2, up: 2 });
          hud.float(v.mesh, '💦 +10', '#6bd5ff', 2);
        }
        break;
      }
      case 'distraction_end':
        cart.visible = false;
        if (e.kind === 'pets') { cousTimer = 1.5; hud.say(cous, ctx.tShared('quote_cous'), 1.5); }
        if (e.count) hud.float(car, `+${e.count * 5}`, '#ffd84a', 2.4);
        break;
      case 'cous':
        pen.position.set(e.x, 0, e.z);
        pen.visible = true;
        cous.position.set(e.x + (e.x > 0 ? 1.6 : -1.6), 0, e.z - 0.4);
        cous.visible = true;
        cousTimer = 7;
        hud.banner(ctx.t('pets'), 1600, '#9dffcf');
        hud.say(cous, ctx.t('cous_line'), 2.6);
        sfx.power();
        break;
      case 'spit_warn':
        spitShot = { x: e.x, z: e.z, t: 0 };
        spitTarget.position.set(e.x, 0.045, e.z);
        spitTarget.visible = true;
        spitBall.visible = true;
        hud.say(babar, `${ctx.t('babar_spit')}`, 1.4);
        break;
      case 'spit_land':
        spitTarget.visible = false;
        spitBall.visible = false;
        spitShot = null;
        puddle.position.set(e.x, 0.03, e.z);
        puddle.visible = true;
        puddle.scale.setScalar(0.2);
        sfx.land();
        fx.burst(tmp.set(e.x, 0.3, e.z), 14, { color: 0xbfe8ff, speed: 2, up: 2 });
        break;
      case 'wave_clear':
        sfx.win();
        hud.banner(ctx.t('wave_clear', { n: Math.round(e.repaired) }), 1500, '#8af27a');
        fx.burst(tmp.set(0, 1.6, 0), 40, { speed: 4, up: 4 });
        // Polishing removes a few marks.
        for (const side of Object.values(decalSlots)) {
          const d = side.find((x) => x.visible);
          if (d) d.visible = false;
        }
        for (const w of wheels) w.flat = Math.max(0, w.flat - 0.5);
        break;
      case 'win': finish(true); break;
      case 'lose': finish(false); break;
      default: break;
    }
  }

  function finish(won) {
    if (ended) return;
    ended = true;
    const score = state.finalScore();
    if (won) {
      const stars = state.stars();
      fx.burst(tmp.set(0, 2, 0), 90, { speed: 6, up: 5 });
      hud.say(panda, ctx.t('shout'), 2.5);
      for (const p of passers) p.c.userData.flash();
      ctx.finish({ score, stars, line: ctx.t(stars === 3 ? 'win3' : 'win') });
    } else {
      romainCheer = 10;
      hud.say(romain, 'Looool', 3);
      shake = 0.8;
      ctx.fail({ score, line: ctx.t('lose') });
    }
  }

  // --- Input -----------------------------------------------------------------------------------
  function groundAt(x, y, out) {
    ndc.set(x, y);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(groundPlane, out);
  }
  function pickKid(px, py) {
    let best = null;
    let bestD = 0.16;
    const aspect = camera.aspect || 1;
    for (const v of kidView.values()) {
      const k = v.kid;
      if (!k || (k.state !== 'approach' && k.state !== 'mischief')) continue;
      tmp.set(k.x, 0.9, k.z).project(camera);
      const d = Math.hypot((tmp.x - px) * aspect, tmp.y - py);
      if (d < bestD) { best = k; bestD = d; }
    }
    return best;
  }
  const hit = new THREE.Vector3();
  function handlePointer() {
    if (input.pressed('touch')) {
      const k = pickKid(input.pointer.x, input.pointer.y);
      if (k) {
        state.setTarget(k.x, k.z, k.id);
        dragging = false;
        markerMat.color.set('#ff6b6b');
        marker.position.set(k.x, 0.04, k.z);
        markerMat.opacity = 0.9;
        sfx.click();
      } else if (groundAt(input.pointer.x, input.pointer.y, hit)) {
        state.setTarget(hit.x, hit.z);
        dragging = true;
        markerMat.color.set('#ffffff');
        marker.position.set(state.panda.tx, 0.04, state.panda.tz);
        markerMat.opacity = 0.9;
      }
    } else if (dragging && input.held('touch') && input.pointer.down) {
      if (groundAt(input.pointer.x, input.pointer.y, hit)) {
        state.setTarget(hit.x, hit.z);
        marker.position.set(state.panda.tx, 0.04, state.panda.tz);
      }
    } else if (!input.pointer.down) {
      dragging = false;
    }
  }

  // --- Per frame -------------------------------------------------------------------------------
  function updateKids(dt) {
    for (const v of kidView.values()) {
      const k = v.kid;
      const m = v.mesh;
      const dx = k.x - m.position.x;
      const dz = k.z - m.position.z;
      const moving = Math.hypot(dx, dz) > 0.002;
      m.position.x = k.x;
      m.position.z = k.z;
      let anim = 'idle';
      if (k.state === 'mischief') {
        m.rotation.y = Math.atan2(-k.x, -k.z);
        // Reveal marks on the car as they work.
        if (k.action === 'scribble' || k.action === 'sticker') {
          const n = Math.floor(k.work / 1.6);
          while (v.revealed < n) { v.revealed++; revealDecal(sideOf(k)); }
        }
        if (k.action === 'air') {
          let best = wheels[0];
          let bd = Infinity;
          for (const w of wheels) { const d = Math.hypot(w.x - k.x, w.z - k.z); if (d < bd) { bd = d; best = w; } }
          best.flat = Math.min(1, best.flat + dt * 0.18);
          anim = 'sit';
        } else if (k.action === 'sticker') anim = 'jump';
        else anim = 'idle';
      } else if (moving) {
        m.rotation.y = Math.atan2(dx, dz);
        anim = 'run';
      } else if (k.state === 'distracted') {
        anim = 'cheer';
      }
      if (k.state === 'flee' && v.icon.material.map !== emoji(ACTION_ICON.flee)) setIcon(v, 'flee');
      if (k.state === 'distracted') {
        const key = state.distraction && state.distraction.kind === 'pets' ? 'pets' : 'icecream';
        if (v.icon.material.map !== emoji(ACTION_ICON[key])) setIcon(v, key);
      }
      if (k.state === 'approach' && v.icon.visible && v.icon.material.map !== emoji(ACTION_ICON.back)) setIcon(v, null);
      m.userData.animate(dt, anim);
      const parts = m.userData.parts;
      if (k.state === 'mischief') {
        if (k.action === 'scribble') { parts.armR.rotation.x = -1.5 + Math.sin(time * 18 + k.id) * 0.35; parts.armR.rotation.z = Math.cos(time * 14) * 0.2; }
        if (k.action === 'kick') parts.legR.rotation.x = -Math.max(0, Math.sin(time * 7 + k.id)) * 1.3;
      }
      m.position.y = k.state === 'flee' ? Math.abs(Math.sin(time * 10 + k.id)) * 0.25 : 0;
      v.icon.position.y = 2.6 + Math.sin(time * 5 + k.id) * 0.08;
    }
  }

  function updateCar(dt) {
    let kicks = 0;
    for (const v of kidView.values()) if (v.kid.state === 'mischief' && v.kid.action === 'kick') kicks++;
    car.rotation.x = kicks ? Math.sin(time * 30) * 0.012 * Math.min(3, kicks) : 0;
    car.position.y = kicks ? Math.abs(Math.sin(time * 15)) * 0.02 : 0;
    let tiltF = 0;
    let tiltS = 0;
    for (const w of wheels) {
      w.pivot.scale.y = 1 - w.flat * 0.35;
      w.pivot.position.y = 0.36 - w.flat * 0.1;
      tiltF += Math.sign(w.x) * w.flat;
      tiltS += Math.sign(w.z) * w.flat;
    }
    car.rotation.z = -tiltF * 0.02;
    car.rotation.x += tiltS * 0.02;
    red.color.copy(redBase).lerp(redWorn, (state.damage / 100) * 0.55);
    for (const list of Object.values(decalSlots)) for (const d of list) {
      if (d.userData.pop > 0) {
        d.userData.pop -= dt;
        d.scale.setScalar(1 + Math.sin((1 - d.userData.pop / 0.25) * Math.PI) * 0.4 - (d.userData.pop / 0.25) * 0.9);
      } else if (d.visible) d.scale.setScalar(1);
    }
    // Mischief sounds, never more than one every 0.7 s.
    soundTimer -= dt;
    if (soundTimer <= 0 && state.atCar() > 0) {
      soundTimer = 0.7;
      const any = [...kidView.values()].find((v) => v.kid.state === 'mischief');
      if (any) ({ scribble: sfx.hat, sticker: sfx.click, kick: sfx.land, air: sfx.whoosh })[any.kid.action]();
    }
  }

  function updateGang(dt) {
    babar.userData.animate(dt, spitShot ? 'hit' : 'idle');
    mamar.userData.animate(dt, 'sit');
    mamar.userData.parts.armR.rotation.x = Math.sin(time * 1.4) > 0.5 ? -2.4 : -1.2;
    romainCheer = Math.max(0, romainCheer - dt);
    romain.userData.animate(dt, romainCheer > 0 ? 'cheer' : 'idle');
    romain.rotation.y = Math.atan2(-romain.position.x, -romain.position.z);
    // Passers-by on the path between the car and the castle.
    for (const p of passers) {
      if (!p.active) {
        p.next -= dt;
        if (p.next <= 0 && !ended) {
          p.active = true;
          p.dir = ctx.random() < 0.5 ? 1 : -1;
          p.c.position.set(-17 * p.dir, 0, -8.6 + (ctx.random() - 0.5));
          p.c.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          p.c.visible = true;
          p.said = false;
        }
        continue;
      }
      p.c.position.x += p.dir * 2.4 * dt;
      p.c.userData.animate(dt, 'run');
      if (!p.said && Math.abs(p.c.position.x) < 4) {
        p.said = true;
        hud.say(p.c, ctx.random() < 0.7 ? lineFor(p.id) : ctx.tShared(`quote_${p.id}`), 2.2);
      }
      if (Math.abs(p.c.position.x) > 17.5) {
        p.active = false;
        p.c.visible = false;
        p.next = 22 + ctx.random() * 14;
      }
    }
    // Cous with his guinea pigs.
    if (cous.visible) {
      cous.userData.animate(dt, 'cheer');
      cous.rotation.y = Math.atan2(state.panda.x - cous.position.x, state.panda.z - cous.position.z);
      pigs.forEach((pig, i) => { pig.position.y = Math.abs(Math.sin(time * 6 + i * 2)) * 0.1; pig.rotation.y = time * (i % 2 ? 1 : -1); });
      cousTimer -= dt;
      if (cousTimer <= 0 && !(state.distraction && state.distraction.kind === 'pets')) {
        cous.visible = false;
        pen.visible = false;
      }
    }
    if (cart.visible) { umbrella.rotation.y += dt; cone.position.y = 3.4 + Math.sin(time * 4) * 0.1; }
    // Babar's spit in flight, then the puddle.
    if (spitShot) {
      spitShot.t += dt;
      const f = Math.min(1, spitShot.t / SPIT_WARN);
      spitBall.position.set(
        spitFrom.x + (spitShot.x - spitFrom.x) * f,
        spitFrom.y + (0 - spitFrom.y) * f + Math.sin(f * Math.PI) * 3,
        spitFrom.z + (spitShot.z - spitFrom.z) * f,
      );
      spitWarnMat.opacity = 0.35 + Math.sin(time * 20) * 0.25;
    }
    if (puddle.visible) {
      if (!state.spit || state.spit.warn > 0) puddle.visible = false;
      else {
        puddle.scale.setScalar(Math.min(1, puddle.scale.x + dt * 5) * Math.min(1, state.spit.t / 0.5 + 0.2));
        spitMat.opacity = 0.85 * Math.min(1, state.spit.t / SPIT_TIME + 0.3);
      }
    }
  }

  function updatePanda(dt) {
    const p = state.panda;
    const dx = p.x - panda.position.x;
    const dz = p.z - panda.position.z;
    panda.position.set(p.x, 0, p.z);
    if (Math.hypot(dx, dz) > 0.001) panda.rotation.y = Math.atan2(dx, dz);
    pandaCheer = Math.max(0, pandaCheer - dt);
    panda.userData.animate(dt, pandaCheer > 0 ? 'cheer' : p.moving ? 'run' : 'idle');
    gun.visible = state.pistol > 0;
    if (gun.visible) panda.userData.parts.armR.rotation.x = -1.5;
    scaryTimer = Math.max(0, scaryTimer - dt);
    scaryFace.visible = scaryTimer > 0;
    if (scaryFace.visible) { const s = 1.6 + Math.sin(time * 20) * 0.2; scaryFace.scale.set(s, s, 1); }
    if (p.slowed && time - slowSaid > 2.5) { slowSaid = time; hud.float(panda, ctx.t('slowed'), '#bfe8ff', 2.8); }
    // Shout ring and target marker.
    ringT = Math.min(1, ringT + dt / 0.35);
    shoutRing.scale.setScalar(Math.max(0.01, ringR * (0.3 + ringT * 0.7)));
    ringMat.opacity = (1 - ringT) * 0.85;
    markerMat.opacity = p.tx === null ? Math.max(0, markerMat.opacity - dt * 3) : 0.5 + Math.sin(time * 10) * 0.3;
    if (p.targetKid !== null) {
      const v = kidView.get(p.targetKid);
      if (v) marker.position.set(v.kid.x, 0.04, v.kid.z);
    }
  }

  function placeCamera(dt) {
    const a = camera.aspect || 1.6;
    const k = Math.tan((27.5 * Math.PI) / 180) * a;
    const portrait = Math.max(0, Math.min(1, (1.2 - a) / 0.7));
    const dirY = 12.5 + portrait * 7;
    const dirZ = 14 - portrait * 4;
    const l = Math.hypot(dirY, dirZ);
    const dist = Math.max(16.5, 7.5 / k);
    shake = Math.max(0, shake - dt * 2);
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sz = shake ? (Math.random() - 0.5) * shake : 0;
    const tx = state.panda.x * 0.3;
    const tz = state.panda.z * 0.3 - 1.8 + portrait * 1.5;
    camera.position.set(tx + sx, (dirY / l) * dist, tz + (dirZ / l) * dist + sz);
    camera.lookAt(tx, 0, tz);
  }

  // --- Lifecycle --------------------------------------------------------------------------------
  function start() {
    camera.fov = 55;
    camera.updateProjectionMatrix();
    setupButtons();
    ctx.music(118, [0, 4, 7, 4, 9, 7, 5, 4]);
    hud.setObjective(ctx.t('objective'));
    hud.setScore(0);
    hud.banner(ctx.t('shout'), 1600, '#ff6b6b');
    hud.say(panda, ctx.t('shout'), 2);
    hud.say(mamar, lineFor('mamar'), 2.5);
    sfx.hoho();
    panda.position.set(state.panda.x, 0, state.panda.z);
    placeCamera(0);
  }

  function update(dt) {
    time += dt;
    if (!ended) {
      handlePointer();
      const move = { x: input.axisX(), z: (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0) };
      if (input.pressed('action') || shoutQueued) onShout(state.shout());
      shoutQueued = false;
      const events = state.step(dt, move);
      for (let i = 0; i < events.length; i++) onEvent(events[i]);

      const dmg = state.damage;
      const color = dmg < 35 ? '#4caf50' : dmg < 70 ? '#ffb703' : '#ff4d4d';
      hud.meter('car', 1 - dmg / 100, color, `🚗 ${ctx.t('damage')} ${Math.round(100 - dmg)}%`);
      hud.setScore(state.score, '⭐ ');
      const waveFrac = state.phase === 'wave' ? 1 - state.toSpawn / Math.max(1, waveSize(cfg, state.wave)) : 1;
      hud.setProgress((Math.max(0, state.wave - 1) + (state.wave ? waveFrac : 0)) / cfg.waves, ctx.t('wave_label', { n: Math.max(1, state.wave), total: cfg.waves }));
    } else {
      endTimer += dt;
      panda.userData.animate(dt, state.won() ? 'cheer' : 'hit');
    }
    if (!ended) updatePanda(dt);
    updateKids(dt);
    updateCar(dt);
    updateGang(dt);
    for (const g of pickupView.values()) {
      g.userData.icon.position.y = 1.1 + Math.sin(time * 4) * 0.15;
      g.rotation.y += dt;
    }
    placeCamera(dt);
  }

  function dispose() {
    kidView.clear();
    kidPool.length = 0;
    pickupView.clear();
    for (const d of disposables) d.dispose?.();
    disposables.length = 0;
  }

  return { start, update, dispose, state };
}

