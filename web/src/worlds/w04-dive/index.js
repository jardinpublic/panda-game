// World 4 - "Le lagon des requins citrons": Panda spearfishes in a turquoise
// lagoon, seen from the side. Arrows / WASD or drag to swim, Space / tap to
// fire the speargun. Small fish, lionfish, lemon sharks that charge.
// Langoustines must be measured (they are always too small), the GoPro
// slips away, and oxygen only comes back at the surface. The whole gang
// watches from the boat, the paddle, the pontoon and the beach.

import {
  LAGOON, LEGAL_CM, createDive, langoustineSize, gaugeReading, steerToward, clampToLagoon, touches, rampInterval, clamp,
} from './rules.js';

export const MODELS = ['nature'];

export const TEXTS = {
  en: {
    howto: ['Arrows / WASD or drag: swim. Space or tap: fire the speargun.', 'Fish = points, lionfish = bonus, lemon sharks = big points but they charge!', 'Langoustine? Swipe up KEEP or down THROW BACK. Too small = coastguard fine.', 'Breathe at the surface. Catch the GoPro before it hits the bottom!'],
    objective: 'Spearfish until the boat calls you back',
    go: 'Masks on! Dive!',
    o2: 'O₂', air: 'AIR! Go up!', gulp: 'Glug glug… out of air!',
    fire: '🔱', keep: '⬆ KEEP', throw: '⬇ BACK',
    time_left: '{s}s', bite: 'CHOMP!', charge: '!',
    gauge_title: 'Langoustine: measure it!', legal_line: 'legal min. {cm} cm', cm: '{cm} cm',
    gauge_hint: '⬆ Keep  ·  ⬇ Throw back',
    v_legal: 'A real one! Hoho!', v_fine: 'COASTGUARD: €150 FINE!', v_released: 'Good boy. Back to the reef.',
    v_wasted: 'Hoho… that one was legal.', v_escaped: 'It wriggled away…',
    shrimp: ['That\'s a shrimp, Panda!', 'Shrimp! Shrimp!', 'A shrimp again, stylish.'],
    coastguard: 'Coastguard',
    gopro_drop: 'THE GOPRO! Catch it!', gopro_saved: 'GoPro saved! +{p}', gopro_lost: 'Gone. Like the real one…',
    gopro_say: 'My GoPro!',
    combo: 'x{m} combo!', lion: 'Lionfish!', shark_flee: 'Shark scared off!', shark_bonk: 'BONK!',
    spit: 'Beurk!', victor_line: ['Sustainable fishing, Panda!', 'I\'m an oceanographer, I know a shrimp.', 'Stylish dive.'],
    mamar_line: ['Olé!', 'Want some sandwich?', 'Aïe aïe aïe, my line is stuck'],
    romain_line: ['Looool', 'Looool, the shrimp!', 'R\'gard\' don\'!'],
    cous_line: ['Hoho! Over here!', 'Be wise, Panda…', 'Careful with the sharks!'],
    babar_line: ['Ptoo.', 'Rase z\'y tout!', 'Ptoo. Oops.'],
    violaine_line: ['Awkward!', 'Go for it!', 'Nice wave out there!'],
    beach_line: ['Bravo Panda!', 'Bring us dinner!', 'Le crapa!'],
    done: 'The boat calls you back. Hoho, good dive!',
    dead_line: 'Too many bites… Victor fishes you out.',
    end_fines: 'The coastguard knows your name now.',
  },
  fr: {
    howto: ['Flèches / ZQSD ou glisser : nager. Espace ou toucher : tirer au harpon.', 'Poissons = points, poisson-lion = bonus, requins citrons = gros points mais ils chargent !', 'Langouste ? Swipe en haut GARDER ou en bas RELÂCHER. Trop petite = amende des garde-côtes.', 'Respire à la surface. Rattrape la GoPro avant qu\'elle touche le fond !'],
    objective: 'Chasse jusqu\'à ce que le bateau te rappelle',
    go: 'Masque, tuba… plonge !',
    o2: 'O₂', air: 'DE L\'AIR ! Remonte !', gulp: 'Glou glou… plus d\'air !',
    fire: '🔱', keep: '⬆ GARDER', throw: '⬇ RELÂCHER',
    time_left: '{s} s', bite: 'CROC !', charge: '!',
    gauge_title: 'Langouste : mesure-la !', legal_line: 'taille légale {cm} cm', cm: '{cm} cm',
    gauge_hint: '⬆ Garder  ·  ⬇ Relâcher',
    v_legal: 'Une vraie ! Hoho !', v_fine: 'GARDE-CÔTES : 150 € D\'AMENDE !', v_released: 'Bien. Retour au récif.',
    v_wasted: 'Hoho… celle-là était légale.', v_escaped: 'Elle s\'est tortillée et enfuie…',
    shrimp: ['C\'est une crevette, Panda !', 'Crevette ! Crevette !', 'Encore une crevette, stylé.'],
    coastguard: 'Garde-côtes',
    gopro_drop: 'LA GOPRO ! Rattrape-la !', gopro_saved: 'GoPro sauvée ! +{p}', gopro_lost: 'Perdue. Comme la vraie…',
    gopro_say: 'Ma GoPro !',
    combo: 'Combo x{m} !', lion: 'Poisson-lion !', shark_flee: 'Requin effrayé !', shark_bonk: 'BONK !',
    spit: 'Beurk !', victor_line: ['Pêche durable, Panda !', 'Je suis océanographe, je reconnais une crevette.', 'Plongée stylée.'],
    mamar_line: ['Olé !', 'Un bout de sandwich ?', 'Aïe aïe aïe, ma ligne est coincée'],
    romain_line: ['Looool', 'Looool, la crevette !', 'R\'gard\' don\' !'],
    cous_line: ['Hoho ! Par ici !', 'Sois sage, Panda…', 'Attention aux requins !'],
    babar_line: ['Ptou.', 'Rase z\'y tout !', 'Ptou. Oups.'],
    violaine_line: ['Malaisant !', 'Vazy balance !', 'Belle vague au large !'],
    beach_line: ['Bravo Panda !', 'Ramène le dîner !', 'Le crapa !'],
    done: 'Le bateau te rappelle. Hoho, belle plongée !',
    dead_line: 'Trop de morsures… Victor te repêche.',
    end_fines: 'Les garde-côtes connaissent ton nom maintenant.',
  },
};

const FISH_COLORS = ['#ffd23f', '#3ec1ff', '#ff7eb6', '#7cff9b', '#ff9f43'];
const STYLE = `
.w04-gauge { position: absolute; left: 50%; top: 16%; transform: translateX(-50%); width: min(420px, 86vw); background: rgba(255,253,246,0.96); border: 4px solid #1b1b2f; border-radius: 18px; padding: 8px 14px 10px; box-shadow: 0 5px 0 #1b1b2f; font-weight: 800; text-align: center; display: none; }
.w04-gauge.show { display: block; animation: w04pop .25s ease-out; }
.w04-gauge h3 { margin: 0 0 4px; font-size: 18px; }
.w04-size { font-size: 34px; line-height: 1.1; }
.w04-ruler { position: relative; height: 34px; margin: 8px 4px 4px; border: 3px solid #1b1b2f; border-radius: 8px; background: linear-gradient(90deg, #ff6b6b 0%, #ff9f6b 50%, #57d977 50%, #2fbf5a 100%); overflow: hidden; }
.w04-ruler i { position: absolute; top: 0; bottom: 0; width: 6px; margin-left: -3px; background: #1b1b2f; border-radius: 3px; }
.w04-ruler b { position: absolute; top: 0; bottom: 0; left: 50%; width: 3px; margin-left: -1px; background: #fff; }
.w04-legal { font-size: 13px; opacity: 0.8; }
.w04-hint { font-size: 16px; margin-top: 4px; }
.w04-timer { height: 7px; margin-top: 6px; border-radius: 4px; background: #ffb703; }
@keyframes w04pop { 0% { transform: translateX(-50%) scale(0.6); } 100% { transform: translateX(-50%) scale(1); } }
`;

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const state = createDive(ctx.mode);
  const cfg = state.cfg;
  const R = () => ctx.random();

  // --- Shared geometry and materials ---------------------------------------------
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
  const G = {
    sphere: new THREE.SphereGeometry(1, 16, 12),
    cone: new THREE.ConeGeometry(1, 1, 12),
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
    bubble: new THREE.SphereGeometry(1, 8, 6),
  };
  const M = {
    eye: mat('#ffffff'), pupil: mat('#111111'),
    shark: mat('#d6c27a', { roughness: 0.5 }), sharkBelly: mat('#f4ecd0'),
    lionBody: mat('#c8402e'), lionStripe: mat('#fff3e6'), lionFin: mat('#f08a6c', { transparent: true, opacity: 0.85 }),
    lango: mat('#e8552f', { roughness: 0.4 }), langoDark: mat('#9e2e17'),
    gopro: mat('#1b1b1f', { roughness: 0.3 }), lens: mat('#4fa3ff', { emissive: '#103a7a', roughness: 0.1 }), red: mat('#ff2a2a', { emissive: '#ff2a2a' }),
    spear: mat('#cfd6dd', { metalness: 0.7, roughness: 0.25 }), gun: mat('#2b2f3a'),
    bubble: new THREE.MeshBasicMaterial({ color: '#eaffff', transparent: true, opacity: 0.55, depthWrite: false }),
  };
  const fishMats = FISH_COLORS.map((c) => mat(c, { emissive: c, emissiveIntensity: 0.15 }));
  const mesh = (geo, material, sx, sy, sz) => {
    const m = new THREE.Mesh(geo, material);
    m.scale.set(sx, sy, sz ?? sx);
    return m;
  };

  // --- Lagoon ----------------------------------------------------------------------
  ctx.setupSky({ top: '#8ee9ff', bottom: '#0a4a78', fog: 0x1b8fc0, fogNear: 13, fogFar: 58 });
  const sun = ctx.addLights(root);
  sun.position.set(6, 30, 12);
  const floorY = LAGOON.floorY;

  const sandGeo = new THREE.PlaneGeometry(130, 70, 52, 24);
  const pos = sandGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.4) * 0.25 + Math.cos(pos.getY(i) * 0.5) * 0.2 + R() * 0.15);
  sandGeo.computeVertexNormals();
  const sand = new THREE.Mesh(sandGeo, mat('#f2dca2', { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, floorY - 0.4, -18);
  sand.receiveShadow = true;
  root.add(sand);

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), new THREE.MeshStandardMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false, roughness: 0.1 }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, LAGOON.surfaceY, -20);
  root.add(surface);
  // A thin bright line at the surface so it reads from the side.
  const surfLine = new THREE.Mesh(new THREE.PlaneGeometry(140, 0.18), new THREE.MeshBasicMaterial({ color: '#e9fdff', transparent: true, opacity: 0.7 }));
  surfLine.position.set(0, LAGOON.surfaceY, -1.5);
  root.add(surfLine);

  // Beach on the right, rising out of the water.
  const beachShape = new THREE.Shape();
  beachShape.moveTo(19, floorY - 1);
  beachShape.lineTo(46, floorY - 1);
  beachShape.lineTo(46, 1.5);
  beachShape.lineTo(27, 1.4);
  beachShape.lineTo(24.5, 0.3);
  beachShape.lineTo(22.5, -4);
  beachShape.lineTo(19, floorY - 1);
  const beach = new THREE.Mesh(new THREE.ExtrudeGeometry(beachShape, { depth: 52, bevelEnabled: false }), mat('#f6dfa4', { roughness: 1 }));
  beach.position.z = -45;
  beach.receiveShadow = true;
  root.add(beach);
  for (let i = 0; i < 5; i++) {
    const palm = models.get('tree_palm', { height: 5 + R() * 2 });
    const p = palm || (() => { const g = new THREE.Group(); const t = mesh(G.cyl, mat('#8a5a2b'), 0.2, 5); t.position.y = 2.5; g.add(t); const l = mesh(G.sphere, mat('#2f9e44'), 1.6, 0.5); l.position.y = 5; g.add(l); return g; })();
    p.position.set(29 + i * 3.2, 1.4, -3 - (i % 2) * 4);
    root.add(p);
  }

  // Pontoon on the left, with its posts in the water.
  const wood = mat('#9c6b3c');
  const deck = mesh(G.box, wood, 12, 0.3, 3);
  deck.position.set(-31, 1.2, -1.2);
  root.add(deck);
  for (let x = -36; x <= -25; x += 2.7) {
    for (const z of [-2.4, 0]) {
      const post = mesh(G.cyl, wood, 0.15, 15);
      post.position.set(x, 1.2 - 7.5, z - 0.2);
      root.add(post);
    }
  }

  // Coral, rocks and seaweed at the back and a few in front.
  const coralMats = ['#ff6f91', '#ff9f43', '#a55eea', '#ffd166', '#ef476f', '#06d6a0'].map((c) => mat(c, { emissive: c, emissiveIntensity: 0.12 }));
  for (let i = 0; i < 26; i++) {
    const g = new THREE.Group();
    const m = coralMats[i % coralMats.length];
    const kind = i % 3;
    if (kind === 0) {
      for (let k = 0; k < 5; k++) {
        const b = mesh(G.cyl, m, 0.12, 0.8 + R() * 1.4);
        b.position.set((R() - 0.5) * 0.8, 0.5, (R() - 0.5) * 0.6);
        b.rotation.z = (R() - 0.5) * 0.9;
        g.add(b);
      }
    } else if (kind === 1) {
      const b = mesh(G.sphere, m, 0.8 + R() * 0.6, 0.5 + R() * 0.3);
      b.position.y = 0.3;
      g.add(b);
    } else {
      for (let k = 0; k < 3; k++) {
        const c = mesh(G.cone, m, 0.35, 1 + R() * 1.6);
        c.position.set((R() - 0.5) * 0.9, 0.6, 0);
        g.add(c);
      }
    }
    g.position.set(-30 + R() * 52, floorY - 0.3, -2.5 - R() * 14);
    root.add(g);
  }
  for (let i = 0; i < 9; i++) {
    const rock = models.get('rock_largeA', { height: 1.5 + R() * 2 }) || mesh(new THREE.DodecahedronGeometry(1), mat('#7d8a8f'), 1.4, 1, 1.2);
    rock.position.set(-28 + R() * 48, floorY - 0.3, -4 - R() * 16);
    root.add(rock);
  }
  const seaweeds = [];
  const weedMat = mat('#2fbf71', { emissive: '#0d4d2a', emissiveIntensity: 0.3 });
  const weedMat2 = mat('#56d364');
  for (let i = 0; i < 18; i++) {
    let parent = new THREE.Group();
    const front = i < 4;
    parent.position.set(-28 + R() * 48, floorY - 0.3, front ? 2.5 + R() * 1.5 : -1.5 - R() * 10);
    root.add(parent);
    const strand = { segs: [], phase: R() * 6 };
    const n = 5 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) {
      const seg = new THREE.Group();
      seg.position.y = k === 0 ? 0 : 0.7;
      const leaf = mesh(G.box, k % 2 ? weedMat : weedMat2, 0.22, 0.75, 0.05);
      leaf.position.y = 0.35;
      seg.add(leaf);
      parent.add(seg);
      parent = seg;
      strand.segs.push(seg);
    }
    seaweeds.push(strand);
  }

  // Light rays from the surface.
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(2 + R() * 2, 18), new THREE.MeshBasicMaterial({ color: '#e8fdff', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(-26 + i * 6.5 + R() * 2, -7.5, -4 - R() * 8);
    ray.rotation.z = 0.25 + R() * 0.1;
    root.add(ray);
    rays.push({ mesh: ray, phase: R() * 6 });
  }

  // --- Panda: face sprite, a diving mask, fins and the speargun ---------------------
  const PANDA_SCALE = 0.8;
  const panda = ctx.character('panda', { scale: PANDA_SCALE });
  panda.rotation.order = 'YXZ';
  root.add(panda);
  const finMat = mat('#ffd400');
  for (const leg of [panda.userData.parts.legL, panda.userData.parts.legR]) {
    const fin = mesh(G.box, finMat, 0.3, 0.05, 0.62);
    fin.position.set(0, -0.68, 0.3);
    leg.add(fin);
  }
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = 256; maskCanvas.height = 160;
  {
    const g = maskCanvas.getContext('2d');
    g.fillStyle = '#ff7b00'; // snorkel
    g.fillRect(214, 0, 20, 110);
    g.beginPath(); g.arc(214, 110, 20, 0, Math.PI); g.fill();
    g.lineWidth = 14; g.strokeStyle = '#14141c';
    g.fillStyle = 'rgba(120, 225, 255, 0.38)';
    g.beginPath(); g.roundRect(18, 46, 200, 84, 28); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.beginPath(); g.ellipse(64, 70, 26, 8, -0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#14141c';
    g.fillRect(108, 46, 20, 84);
  }
  const maskTex = new THREE.CanvasTexture(maskCanvas);
  maskTex.colorSpace = THREE.SRGBColorSpace;
  const mask = new THREE.Sprite(new THREE.SpriteMaterial({ map: maskTex, transparent: true, depthWrite: false }));
  const headH = 1.25 * PANDA_SCALE;
  mask.scale.set(headH * 0.62, headH * 0.39, 1);
  root.add(mask);
  const gun = new THREE.Group();
  const gunBody = mesh(G.cyl, M.gun, 0.07, 1.3);
  gunBody.rotation.z = -Math.PI / 2;
  gunBody.position.x = 0.5;
  const gunTip = mesh(G.cyl, M.spear, 0.025, 0.7);
  gunTip.rotation.z = -Math.PI / 2;
  gunTip.position.x = 1.45;
  gun.add(gunBody, gunTip);
  root.add(gun);
  const reticle = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false }));
  root.add(reticle);

  const player = { x: -4, y: -3, vx: 0, vy: 0, aimX: 1, aimY: 0, facing: 1 };
  const SWIM_SPEED = 6.5;
  const CENTER = 1.15 * PANDA_SCALE; // body centre above the feet

  // --- The gang -----------------------------------------------------------------------
  const cast = {};
  function friend(id, x, y, z, ry, anim) {
    const c = ctx.character(id, { scale: 0.85 });
    c.position.set(x, y, z);
    c.rotation.y = ry;
    c.userData.anim = anim;
    root.add(c);
    cast[id] = c;
    return c;
  }
  // Boat with Victor and Violaine, drifting at the surface.
  const boat = new THREE.Group();
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-2.6, 0.6); hullShape.lineTo(2.9, 0.6); hullShape.lineTo(2.2, -0.5); hullShape.lineTo(-2.3, -0.5); hullShape.lineTo(-2.6, 0.6);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 1.8, bevelEnabled: false }), mat('#ffffff'));
  hull.position.z = -0.9;
  const stripe = mesh(G.box, mat('#1d70c9'), 5.2, 0.18, 1.86);
  stripe.position.y = 0.38;
  boat.add(hull, stripe);
  boat.position.set(4, 0, -3.2);
  root.add(boat);
  const victor = friend('victor', -0.9, 0.5, 0, 0.3, 'idle'); boat.add(victor);
  const violaine = friend('violaine', 1.1, 0.5, 0, -0.3, 'cheer'); boat.add(violaine);
  // Romain on a paddle board.
  const paddle = new THREE.Group();
  const board = mesh(G.box, mat('#ff4f79'), 3, 0.15, 0.8);
  paddle.add(board);
  const oar = mesh(G.cyl, mat('#333'), 0.04, 2.4);
  oar.position.set(0.5, 1.5, 0.3);
  paddle.add(oar);
  paddle.position.set(-14, 0.05, -1.8);
  root.add(paddle);
  const romain = friend('romain', 0, 0.08, 0, 0, 'idle'); paddle.add(romain);
  // Pontoon: Babar spits, Mamar fishes with a sandwich.
  friend('babar', -25.8, 1.35, -1.2, 0.6, 'idle');
  const mamar = friend('mamar', -29, 1.35, -0.6, 0.4, 'sit');
  const rod = mesh(G.cyl, mat('#4a3b2a'), 0.03, 2.6);
  rod.position.set(-28.2, 2.4, -0.2);
  rod.rotation.z = -0.8;
  root.add(rod);
  const line = mesh(G.cyl, new THREE.MeshBasicMaterial({ color: '#ffffff' }), 0.01, 8);
  line.position.set(-27.2, -1.6, -0.2);
  root.add(line);
  const sandwich = mesh(G.box, mat('#e8b866'), 0.5, 0.18, 0.25);
  sandwich.position.set(-0.45, 0.85, 0.35);
  mamar.add(sandwich);
  // The beach crew.
  friend('cous', 26.5, 1.4, -1.2, -0.5, 'cheer');
  friend('greg', 29, 1.4, -2.2, -0.3, 'idle');
  friend('aline', 31, 1.4, -1.6, -0.4, 'cheer');
  friend('eugenie', 33, 1.4, -2.6, -0.5, 'dance');
  const castList = Object.values(cast);

  // Coastguard boat, crosses when Panda keeps an undersized one.
  const coastguard = new THREE.Group();
  const rib = mesh(G.box, mat('#ff6a00'), 4.2, 0.6, 1.8);
  rib.position.y = 0.3;
  const tubes = mesh(G.box, mat('#3a3f47'), 4.4, 0.45, 2.0);
  tubes.position.y = 0.1;
  const siren = mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#2f6bff' }), 0.22);
  siren.position.y = 1;
  coastguard.add(tubes, rib, siren);
  coastguard.visible = false;
  root.add(coastguard);
  let coastguardX = 0;

  // --- Entities ---------------------------------------------------------------------
  const fishes = []; // {kind, group, x, y, vx, r, hp, phase, state, timer, color}
  const langos = []; // {group, x, y}
  const bubbles = [];
  let spear = null; // {mesh, x, y, dx, dy, dist}
  let reload = 0;
  let gopro = null; // {group, x, y, vx, grace}
  let decision = null; // {lango, size, t, left}
  const spits = [];
  let shake = 0;
  let time = 0;
  let fishTimer = 1.5;
  let lionTimer = 6;
  let sharkTimer = 8;
  let langoTimer = 0;
  let goproIndex = 0;
  let quoteTimer = 4;
  let spitTimer = 9;
  let o2Warned = false;
  let fireQueued = false;
  let lastShownLeft = -1;

  function fishMesh(kind, colorIndex) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    if (kind === 'shark') {
      const b = mesh(G.sphere, M.shark, 1.7, 0.55, 0.55); body.add(b);
      const belly = mesh(G.sphere, M.sharkBelly, 1.5, 0.35, 0.5); belly.position.y = -0.2; body.add(belly);
      const dorsal = mesh(G.cone, M.shark, 0.35, 0.9, 0.12); dorsal.position.set(0.1, 0.65, 0); dorsal.rotation.z = -0.35; body.add(dorsal);
      const dorsal2 = mesh(G.cone, M.shark, 0.22, 0.5, 0.1); dorsal2.position.set(-0.9, 0.45, 0); dorsal2.rotation.z = -0.35; body.add(dorsal2);
      const tail = mesh(G.cone, M.shark, 0.45, 1, 0.12); tail.position.set(-1.9, 0.25, 0); tail.rotation.z = 0.9; body.add(tail);
      const tail2 = mesh(G.cone, M.shark, 0.3, 0.6, 0.12); tail2.position.set(-1.8, -0.2, 0); tail2.rotation.z = 2.3; body.add(tail2);
      for (const s of [-1, 1]) {
        const fin = mesh(G.cone, M.shark, 0.25, 0.8, 0.1); fin.position.set(0.4, -0.35, s * 0.4); fin.rotation.set(s * 0.6, 0, 2.2); body.add(fin);
        const eye = mesh(G.sphere, M.pupil, 0.08); eye.position.set(1.25, 0.12, s * 0.33); body.add(eye);
      }
      const tailRef = tail; g.userData.tail = tailRef;
    } else if (kind === 'lionfish') {
      const b = mesh(G.sphere, M.lionBody, 0.6, 0.4, 0.3); body.add(b);
      for (let k = -2; k <= 2; k++) { const st = mesh(G.box, M.lionStripe, 0.06, 0.78, 0.6); st.position.x = k * 0.2; body.add(st); }
      for (let k = 0; k < 9; k++) {
        const sp = mesh(G.cone, M.lionFin, 0.06, 0.9, 0.06);
        const a = 0.3 + k * 0.32;
        sp.position.set(Math.cos(a) * 0.45 - 0.1, Math.sin(a) * 0.35, 0);
        sp.rotation.z = a - Math.PI / 2;
        body.add(sp);
      }
      const tail = mesh(G.cone, M.lionFin, 0.25, 0.4, 0.08); tail.position.x = -0.7; tail.rotation.z = Math.PI / 2; body.add(tail);
      g.userData.tail = tail;
      const eye = mesh(G.sphere, M.eye, 0.09); eye.position.set(0.42, 0.1, 0.22); body.add(eye);
    } else {
      const m = fishMats[colorIndex % fishMats.length];
      const b = mesh(G.sphere, m, 0.42, 0.24, 0.14); body.add(b);
      const tail = mesh(G.cone, m, 0.16, 0.3, 0.05); tail.position.x = -0.5; tail.rotation.z = Math.PI / 2; body.add(tail);
      g.userData.tail = tail;
      const eye = mesh(G.sphere, M.eye, 0.07); eye.position.set(0.25, 0.06, 0.1); body.add(eye);
      const pupil = mesh(G.sphere, M.pupil, 0.035); pupil.position.set(0.29, 0.06, 0.15); body.add(pupil);
    }
    g.userData.body = body;
    return g;
  }

  function spawnFish(kind, x, y, dir, colorIndex = 0) {
    const group = fishMesh(kind, colorIndex);
    const speed = kind === 'shark' ? cfg.sharkSpeed : kind === 'lionfish' ? 1.2 : 2.2 + R() * 1.3;
    const f = {
      kind, group, x, y, baseY: y, vx: dir * speed, vy: 0, dir,
      r: kind === 'shark' ? 1.1 : kind === 'lionfish' ? 0.6 : 0.42,
      hp: kind === 'shark' ? cfg.sharkHp : 1, phase: R() * 6, state: 'cruise', timer: 2 + R() * 3,
      color: kind === 'shark' ? 0xd6c27a : kind === 'lionfish' ? 0xff6b4a : new THREE.Color(FISH_COLORS[colorIndex % FISH_COLORS.length]).getHex(),
    };
    group.position.set(x, y, 0);
    root.add(group);
    fishes.push(f);
    return f;
  }
  function spawnSchool() {
    const dir = R() < 0.5 ? 1 : -1;
    const x = dir > 0 ? LAGOON.minX - 6 : LAGOON.maxX + 6;
    const y = floorY + 2 + R() * 9;
    const n = 3 + Math.floor(R() * 3);
    const color = Math.floor(R() * FISH_COLORS.length);
    for (let i = 0; i < n; i++) spawnFish('fish', x - dir * i * 0.9, y + (R() - 0.5) * 1.4, dir, color + (i % 2));
  }
  function spawnLangoustine() {
    const g = new THREE.Group();
    const body = mesh(G.sphere, M.lango, 0.45, 0.18, 0.2); g.add(body);
    const tail = mesh(G.cone, M.langoDark, 0.18, 0.4, 0.12); tail.position.x = -0.5; tail.rotation.z = Math.PI / 2; g.add(tail);
    for (const s of [-1, 1]) {
      const ant = mesh(G.cyl, M.langoDark, 0.015, 1.1); ant.position.set(0.7, 0.3, s * 0.08); ant.rotation.z = -1; g.add(ant);
      const claw = mesh(G.sphere, M.lango, 0.14, 0.08, 0.08); claw.position.set(0.55, -0.05, s * 0.2); g.add(claw);
    }
    const x = LAGOON.minX + 3 + R() * (LAGOON.maxX - LAGOON.minX - 6);
    g.position.set(x, floorY + 0.25, 0);
    g.rotation.y = R() < 0.5 ? 0 : Math.PI;
    root.add(g);
    langos.push({ group: g, x, y: floorY + 0.25, phase: R() * 6 });
  }

  // Bubbles: a small pool of rising spheres (fx particles fall, bubbles rise).
  for (let i = 0; i < 60; i++) {
    const b = new THREE.Mesh(G.bubble, M.bubble);
    b.visible = false;
    root.add(b);
    bubbles.push({ mesh: b, life: 0, vy: 0, phase: 0 });
  }
  let bubbleNext = 0;
  function bubble(x, y, z = 0, size = 0.08) {
    const b = bubbles[bubbleNext];
    bubbleNext = (bubbleNext + 1) % bubbles.length;
    b.mesh.visible = true;
    b.mesh.position.set(x, y, z);
    b.mesh.scale.setScalar(size * (0.6 + R() * 0.8));
    b.vy = 1.4 + R() * 1.2;
    b.phase = R() * 6;
    b.life = 6;
  }

  // --- Screen to lagoon plane -------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();
  function screenToLagoon(sx, sy) {
    ndc.set(sx, sy);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(plane, hitPoint);
  }

  // --- Langoustine gauge (DOM) -------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = STYLE;
  const gauge = document.createElement('div');
  gauge.className = 'w04-gauge';
  gauge.innerHTML = `<h3></h3><div class="w04-size"></div><div class="w04-ruler"><b></b><i></i></div><div class="w04-legal"></div><div class="w04-hint"></div><div class="w04-timer"></div>`;
  const gEl = (s) => gauge.querySelector(s);
  const RULER_MIN = LEGAL_CM - 10;
  const RULER_MAX = LEGAL_CM + 10;

  function fireButtons() {
    hud.buttons([{ id: 'fire', label: ctx.t('fire'), side: 'right', onDown: () => { fireQueued = true; } }]);
  }
  let decisionInput = null;
  function decisionButtons() {
    hud.buttons([
      { id: 'throw', label: ctx.t('throw'), side: 'left', onDown: () => { decisionInput = false; } },
      { id: 'keep', label: ctx.t('keep'), side: 'right', onDown: () => { decisionInput = true; } },
    ]);
    for (const b of hud.el.querySelectorAll('.hud-btn')) { b.style.fontSize = '17px'; b.style.width = '120px'; b.style.borderRadius = '24px'; }
  }

  function openDecision(lango) {
    decision = { lango, size: langoustineSize(R, cfg), t: 0, left: cfg.decide };
    decisionInput = null;
    gEl('h3').textContent = ctx.t('gauge_title');
    gEl('.w04-legal').textContent = ctx.t('legal_line', { cm: LEGAL_CM });
    gEl('.w04-hint').textContent = ctx.t('gauge_hint');
    gauge.classList.add('show');
    decisionButtons();
    sfx.power();
    lango.group.position.set(player.x + player.facing * 0.8, player.y + 0.6, 0.3);
    hud.say(panda, ctx.tShared('quote_panda'), 1.2);
  }

  function closeDecision(keep) {
    const d = decision;
    decision = null;
    gauge.classList.remove('show');
    fireButtons();
    const { verdict, points } = state.decide(d.size, keep);
    const at = d.lango.group.position.clone();
    root.remove(d.lango.group);
    langos.splice(langos.indexOf(d.lango), 1);
    langoTimer = 3.5;
    const label = ctx.t(`v_${verdict}`);
    if (verdict === 'legal') {
      sfx.win(); fx.burst(at, 40); hud.banner(label, 1500, '#7CFF6B');
      hud.float(panda, `+${points}`, '#7CFF6B', 2.6);
    } else if (verdict === 'fine') {
      sfx.lose(); shake = 0.5; hud.banner(label, 2000, '#ff5d5d');
      hud.float(panda, `${points}`, '#ff5d5d', 2.6);
      hud.say(victor, ctx.t('shrimp'), 2.5);
      hud.say(romain, ctx.t('romain_line'), 2);
      coastguard.visible = true;
      coastguardX = player.x - 26;
      coastguard.position.set(coastguardX, 0, -5);
    } else if (verdict === 'released') {
      sfx.coin(); hud.float(panda, `+${points} ${label}`, '#9be7ff', 2.6);
      for (let i = 0; i < 6; i++) bubble(at.x, at.y, 0.2, 0.12);
      if (R() < 0.6) hud.say(victor, ctx.t('shrimp'), 2);
    } else {
      sfx.click(); hud.float(panda, label, '#ffffff', 2.6);
    }
  }

  // --- Shooting -----------------------------------------------------------------------
  function fire(dx, dy) {
    if (spear || reload > 0 || decision) return;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    player.aimX = dx; player.aimY = dy;
    if (Math.abs(dx) > 0.2) player.facing = Math.sign(dx);
    const m = new THREE.Group();
    const shaft = mesh(G.cyl, M.spear, 0.035, 1.6);
    shaft.rotation.z = -Math.PI / 2;
    const tip = mesh(G.cone, M.spear, 0.08, 0.3);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.9;
    m.add(shaft, tip);
    m.rotation.z = Math.atan2(dy, dx);
    root.add(m);
    spear = { mesh: m, x: player.x + dx * 1.2, y: player.y + dy * 1.2, dx, dy, dist: 0, hit: false };
    state.shoot();
    sfx.whoosh();
    reload = 0.35;
  }

  function spearHits(f) {
    if (f.kind === 'shark') {
      f.hp--;
      f.group.userData.flash = 0.4;
      fx.burst(new THREE.Vector3(f.x, f.y, 0), 18, { color: 0xffffff, speed: 3, up: 1 });
      shake = Math.max(shake, 0.25);
      if (f.hp > 0) {
        sfx.hit();
        hud.float(f.group, ctx.t('shark_bonk'), '#ffffff', 1.4);
        f.state = 'telegraph'; f.timer = cfg.telegraph; // angry: charges right away
        return;
      }
      const pts = state.hit('shark');
      f.state = 'flee'; f.vx = Math.sign(f.x - player.x || 1) * 12; f.vy = 1.5; f.dir = Math.sign(f.vx);
      sfx.power();
      hud.banner(ctx.t('shark_flee'), 1100, '#ffd84a');
      hud.float(f.group, `+${pts}`, '#ffd84a', 1.8);
      if (R() < 0.5) hud.say(violaine, ctx.t('violaine_line'), 2);
    } else {
      const pts = state.hit(f.kind);
      fx.burst(new THREE.Vector3(f.x, f.y, 0), f.kind === 'lionfish' ? 34 : 14, { color: f.color, speed: 3, up: 1.5 });
      sfx.coin();
      hud.float(f.group, f.kind === 'lionfish' ? `${ctx.t('lion')} +${pts}` : `+${pts}`, f.kind === 'lionfish' ? '#ff9f43' : '#ffffff', 1);
      removeFish(f);
      if (state.combo > 0 && state.combo % 4 === 0) {
        hud.banner(ctx.t('combo', { m: state.multiplier() }), 900, '#ffd84a');
        hud.say(mamar, ctx.t('mamar_line'), 1.6);
      }
    }
    for (let i = 0; i < 5; i++) bubble(f.x, f.y, 0.2, 0.1);
  }

  function removeFish(f) {
    root.remove(f.group);
    const i = fishes.indexOf(f);
    if (i >= 0) fishes.splice(i, 1);
  }

  // --- Lifecycle ----------------------------------------------------------------------
  function start() {
    hud.el.appendChild(gauge);
    document.head.appendChild(style);
    ctx.music(104, [0, 3, 7, 10, 7, 3, 5, 2]);
    hud.setObjective(ctx.t('objective'));
    hud.setHearts(state.hearts, cfg.hearts);
    hud.banner(ctx.t('go'), 1800, '#7ff3ff');
    fireButtons();
    for (let i = 0; i < 3; i++) spawnLangoustine();
    spawnSchool();
    spawnFish('lionfish', 6, floorY + 2.5, -1);
    sfx.whoosh();
    hud.say(cast.cous, ctx.t('cous_line'), 2.5);
  }

  const tmp = new THREE.Vector3();

  function update(rawDt) {
    if (state.over) {
      // The shell keeps calling (slowed down) behind the result screen.
      time += rawDt;
      panda.userData.animate(rawDt * 4, state.won ? 'cheer' : 'hit');
      for (const c of castList) c.userData.animate(rawDt * 4, 'cheer');
      return;
    }
    // Slow motion while the langoustine is measured.
    const dt = decision ? rawDt * 0.2 : rawDt;
    time += rawDt;
    const ev = state.step(dt, player.y);
    const progress = state.progress();

    // --- Input
    let mx = 0;
    let my = 0;
    if (!decision) {
      mx = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0);
      my = (input.held('up') ? 1 : 0) - (input.held('down') ? 1 : 0);
    }
    let tx = player.x + mx * 3;
    let ty = player.y + my * 3;
    let steering = mx !== 0 || my !== 0;
    if (!decision && input.held('touch') && input.pointer.down) {
      const p = screenToLagoon(input.pointer.x, input.pointer.y);
      if (p && Math.hypot(p.x - player.x, p.y - player.y) > 0.6) { tx = p.x; ty = p.y; steering = true; }
    }
    const speed = SWIM_SPEED * (mx && my ? 0.85 : 1);
    if (steering) {
      const [nx, ny] = steerToward(player.x, player.y, tx, ty, speed, dt);
      player.vx = (nx - player.x) / Math.max(dt, 1e-4);
      player.vy = (ny - player.y) / Math.max(dt, 1e-4);
      const d = Math.hypot(player.vx, player.vy);
      if (d > 0.5) { player.aimX = player.vx / d; player.aimY = player.vy / d; }
      if (Math.abs(player.vx) > 0.4) player.facing = Math.sign(player.vx);
      [player.x, player.y] = clampToLagoon(nx, ny, CENTER);
    } else {
      player.vx *= 0.9; player.vy *= 0.9;
      // A gentle float upwards when idle.
      [player.x, player.y] = clampToLagoon(player.x + player.vx * dt * 0.2, player.y + 0.25 * dt, CENTER);
    }
    if (!decision) {
      for (const tap of input.taps) {
        const p = screenToLagoon(tap.x, tap.y);
        if (p) fire(p.x - player.x, p.y - player.y);
      }
      if (input.pressed('action') || fireQueued) fire(player.aimX, player.aimY);
    }
    fireQueued = false;
    reload = Math.max(0, reload - dt);

    // --- Panda pose
    const moving = Math.hypot(player.vx, player.vy) > 1;
    panda.position.set(player.x, player.y - CENTER, 0);
    const targetTilt = moving ? clamp(0.9 - player.vy * 0.12, 0.15, 1.6) : 0.25;
    panda.rotation.x += (targetTilt - panda.rotation.x) * Math.min(1, dt * 6);
    panda.rotation.y += (player.facing * Math.PI / 2 - panda.rotation.y) * Math.min(1, dt * 8);
    panda.userData.animate(dt, decision ? 'cheer' : moving ? 'run' : 'idle');
    panda.userData.parts.head.getWorldPosition(tmp);
    mask.position.set(tmp.x + player.facing * 0.04, tmp.y + headH * 0.47, tmp.z + 0.45);
    gun.position.set(player.x, player.y, 0.35);
    gun.rotation.z = Math.atan2(player.aimY, player.aimX);
    reticle.position.set(player.x + player.aimX * 3.4, player.y + player.aimY * 3.4, 0.1);
    reticle.material.opacity = reload > 0 || spear ? 0.15 : 0.6;
    if (state.invuln > 0) panda.visible = Math.floor(time * 12) % 2 === 0;
    else panda.visible = true;
    if (R() < dt * 2.2 && !state.atSurface(player.y)) bubble(mask.position.x, mask.position.y + 0.2, 0.3, 0.09);

    // --- Oxygen
    hud.meter('o2', state.oxygen, state.oxygen < 0.25 ? '#ff4d4d' : '#4cc9f0', ctx.t('o2'));
    if (state.oxygen < 0.25 && !o2Warned) { o2Warned = true; hud.banner(ctx.t('air'), 1400, '#ff6b6b'); sfx.click(); }
    if (state.oxygen > 0.5) o2Warned = false;
    if (ev.o2Empty) {
      sfx.hit(); panda.userData.flash(); shake = 0.4;
      hud.float(panda, ctx.t('gulp'), '#ff6b6b', 2.6);
      for (let i = 0; i < 12; i++) bubble(player.x, player.y + 1, 0.3, 0.14);
      hud.setHearts(state.hearts, cfg.hearts);
    }

    // --- Spawning
    fishTimer -= dt; lionTimer -= dt; sharkTimer -= dt;
    if (fishTimer <= 0) { spawnSchool(); fishTimer = rampInterval(cfg.fishEvery, progress) * (0.7 + R() * 0.6); }
    if (lionTimer <= 0) {
      if (fishes.filter((f) => f.kind === 'lionfish').length < 2) {
        const dir = R() < 0.5 ? 1 : -1;
        spawnFish('lionfish', dir > 0 ? LAGOON.minX - 4 : LAGOON.maxX + 4, floorY + 1.5 + R() * 4, dir);
      }
      lionTimer = rampInterval(cfg.lionEvery, progress) * (0.8 + R() * 0.4);
    }
    if (sharkTimer <= 0) {
      if (fishes.filter((f) => f.kind === 'shark' && f.state !== 'flee').length < cfg.maxSharks) {
        const dir = player.x > 0 ? 1 : -1;
        spawnFish('shark', dir > 0 ? LAGOON.minX - 6 : LAGOON.maxX + 6, clamp(player.y + (R() - 0.5) * 5, floorY + 2, -2), dir);
      }
      sharkTimer = rampInterval(cfg.sharkEvery, progress) * (0.8 + R() * 0.4);
    }
    if (langos.length < 3 && !decision) {
      langoTimer -= dt;
      if (langoTimer <= 0) { spawnLangoustine(); langoTimer = 3; }
    }

    // --- Fish
    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i];
      f.phase += dt * (f.kind === 'shark' ? 4 : 9);
      if (f.kind === 'shark') {
        const dx = player.x - f.x;
        const dy = player.y - f.y;
        const dist = Math.hypot(dx, dy);
        if (f.state === 'cruise') {
          f.timer -= dt;
          f.vx = f.dir * cfg.sharkSpeed;
          f.vy = (f.baseY + Math.sin(f.phase * 0.5) * 0.8 - f.y) * 1.5;
          if (f.timer <= 0 && dist < 9 && !decision) {
            f.state = 'telegraph'; f.timer = cfg.telegraph;
            hud.float(f.group, ctx.t('charge'), '#ff3b3b', 1.4);
            sfx.click();
          }
          if ((f.x > LAGOON.maxX + 8 && f.dir > 0) || (f.x < LAGOON.minX - 8 && f.dir < 0)) {
            f.dir = -f.dir; f.baseY = clamp(player.y, floorY + 2, -2);
          }
        } else if (f.state === 'telegraph') {
          f.timer -= dt;
          f.vx *= 0.9; f.vy *= 0.9;
          f.dir = Math.sign(dx) || f.dir;
          f.group.userData.body.position.y = Math.sin(time * 50) * 0.06;
          if (f.timer <= 0) {
            f.state = 'charge'; f.timer = 1.6;
            const d = dist || 1;
            f.vx = (dx / d) * cfg.chargeSpeed; f.vy = (dy / d) * cfg.chargeSpeed;
            sfx.whoosh();
          }
        } else if (f.state === 'charge') {
          f.timer -= dt;
          if (f.timer <= 0) { f.state = 'cruise'; f.timer = 2.5 + R() * 2.5; f.baseY = f.y; f.dir = Math.sign(f.vx) || 1; }
        } else if (f.state === 'flee') {
          f.vy *= 0.98;
          if (f.x < LAGOON.minX - 12 || f.x > LAGOON.maxX + 12) { removeFish(f); continue; }
        }
        if (f.state !== 'flee' && touches(f.x + f.dir * 0.8, f.y, f.r, player.x, player.y, 0.55) && !decision) {
          if (state.hurt()) {
            sfx.hit(); panda.userData.flash(); shake = 0.6;
            fx.burst(new THREE.Vector3(player.x, player.y, 0.3), 24, { color: 0xff5d5d, speed: 4, up: 1 });
            hud.float(panda, ctx.t('bite'), '#ff4d4d', 2.6);
            hud.setHearts(state.hearts, cfg.hearts);
            if (R() < 0.6) hud.say(romain, ctx.t('romain_line'), 1.8);
          }
          f.state = 'cruise'; f.timer = 3; f.dir = Math.sign(f.x - player.x) || 1;
          f.x += f.dir * 1.5; f.baseY = f.y;
        }
      } else {
        f.vy = Math.sin(f.phase * 0.3) * 0.4;
        // Small fish dodge a little when Panda is close.
        if (f.kind === 'fish' && Math.hypot(player.x - f.x, player.y - f.y) < 2.2) f.vy += Math.sign(f.y - player.y || 1) * 2;
        if (f.x < LAGOON.minX - 10 || f.x > LAGOON.maxX + 10) { removeFish(f); continue; }
      }
      f.x += f.vx * dt;
      f.y = clamp(f.y + f.vy * dt, floorY + 0.8, -0.8);
      f.group.position.set(f.x, f.y, 0);
      const facing = f.state === 'charge' || f.state === 'flee' ? Math.sign(f.vx) || f.dir : f.dir;
      f.group.rotation.y = facing > 0 ? 0 : Math.PI;
      f.group.rotation.z = f.state === 'charge' ? Math.atan2(f.vy, Math.abs(f.vx)) * 0.8 : 0;
      const tail = f.group.userData.tail;
      if (tail) tail.rotation.y = Math.sin(f.phase * 2) * 0.5;
      if (f.group.userData.flash > 0) {
        f.group.userData.flash -= dt;
        f.group.userData.body.scale.setScalar(1 + Math.sin(f.group.userData.flash * 40) * 0.08);
      }
    }

    // --- Spear
    if (spear) {
      const step = 24 * dt;
      spear.x += spear.dx * step; spear.y += spear.dy * step; spear.dist += step;
      spear.mesh.position.set(spear.x, spear.y, 0.1);
      if (R() < 0.5) bubble(spear.x, spear.y, 0.1, 0.06);
      let hitAny = false;
      for (const f of fishes) {
        if (f.state === 'flee') continue;
        if (touches(spear.x + spear.dx * 0.8, spear.y + spear.dy * 0.8, 0.2, f.x, f.y, f.r)) { spearHits(f); hitAny = true; break; }
      }
      if (hitAny || spear.dist > 13 || spear.y < floorY || spear.y > 0.5) {
        if (!hitAny) state.miss();
        root.remove(spear.mesh);
        spear = null;
      }
    }

    // --- Langoustines
    for (const l of langos) {
      if (decision && decision.lango === l) continue;
      l.phase += dt * 3;
      l.group.position.x = l.x + Math.sin(l.phase * 0.3) * 0.4;
      l.group.children[0].rotation.z = Math.sin(l.phase) * 0.05;
      if (!decision && touches(l.group.position.x, l.y, 0.5, player.x, player.y - CENTER * 0.5, 0.9)) { openDecision(l); break; }
    }
    if (decision) {
      decision.t += rawDt;
      decision.left -= rawDt;
      const reading = gaugeReading(decision.size, decision.t, cfg.wobble);
      const ratio = clamp((reading - RULER_MIN) / (RULER_MAX - RULER_MIN), 0, 1);
      gEl('.w04-ruler i').style.left = `${ratio * 100}%`;
      gEl('.w04-size').textContent = ctx.t('cm', { cm: reading.toFixed(1) });
      gEl('.w04-size').style.color = reading >= LEGAL_CM ? '#1f9d4a' : '#d62828';
      gEl('.w04-timer').style.width = `${clamp(decision.left / cfg.decide, 0, 1) * 100}%`;
      decision.lango.group.position.set(player.x + player.facing * 0.9, player.y + 0.5, 0.3);
      decision.lango.group.rotation.z = Math.sin(time * 18) * 0.3;
      const freshKey = (dir) => input.pressed(dir) || (input.swipes.includes(dir) && !input.held(dir));
      let choice = decisionInput;
      if (decision.t > 0.25) {
        if (freshKey('up')) choice = true;
        else if (freshKey('down')) choice = false;
      } else choice = null;
      if (choice !== null) closeDecision(choice);
      else if (decision.left <= 0) closeDecision(null);
      decisionInput = null;
    }

    // --- GoPro event
    if (!gopro && goproIndex < cfg.gopros.length && progress >= cfg.gopros[goproIndex] && !decision && player.y > floorY + 5) {
      goproIndex++;
      gopro = { group: new THREE.Group(), x: player.x, y: player.y + 0.5, vx: -player.facing * 3.5, grace: 0.7 };
      const body = mesh(G.box, M.gopro, 0.45, 0.32, 0.3);
      const lens = mesh(G.cyl, M.lens, 0.1, 0.1); lens.rotation.x = Math.PI / 2; lens.position.z = 0.17;
      const led = mesh(G.sphere, M.red, 0.04); led.position.set(0.15, 0.12, 0.16);
      gopro.group.add(body, lens, led);
      root.add(gopro.group);
      hud.banner(ctx.t('gopro_drop'), 1600, '#ffd84a');
      hud.say(panda, ctx.t('gopro_say'), 1.5);
      sfx.hoho();
    }
    if (gopro) {
      gopro.grace -= dt;
      gopro.vx *= 0.97;
      gopro.x = clamp(gopro.x + gopro.vx * dt, LAGOON.minX, LAGOON.maxX);
      gopro.y -= cfg.goproFall * (1 + progress * 0.3) * dt;
      gopro.group.position.set(gopro.x + Math.sin(time * 3) * 0.3, gopro.y, 0.2);
      gopro.group.rotation.z = Math.sin(time * 2.5) * 0.6;
      gopro.group.rotation.y += dt * 2;
      if (R() < dt * 4) bubble(gopro.x, gopro.y, 0.2, 0.06);
      if (gopro.grace <= 0 && touches(gopro.x, gopro.y, 0.35, player.x, player.y, 0.9)) {
        const pts = state.saveGopro();
        sfx.win(); fx.burst(gopro.group.position.clone(), 60);
        hud.banner(ctx.t('gopro_saved', { p: pts }), 1600, '#7CFF6B');
        hud.say(cast.cous, ctx.t('cous_line'), 2);
        root.remove(gopro.group); gopro = null;
      } else if (gopro.y <= floorY + 0.2) {
        state.loseGopro();
        sfx.lose(); fx.burst(gopro.group.position.clone(), 20, { color: 0xf2dca2, speed: 2, up: 1 });
        hud.banner(ctx.t('gopro_lost'), 1800, '#ffffff');
        root.remove(gopro.group); gopro = null;
      }
    }

    // --- Scenery and the gang
    for (const s of seaweeds) {
      for (let k = 0; k < s.segs.length; k++) s.segs[k].rotation.z = Math.sin(time * 1.3 + s.phase + k * 0.5) * 0.12;
    }
    for (const r of rays) r.mesh.material.opacity = 0.07 + Math.sin(time * 0.7 + r.phase) * 0.04;
    surface.position.y = LAGOON.surfaceY + Math.sin(time * 1.2) * 0.04;
    for (const b of bubbles) {
      if (!b.mesh.visible) continue;
      b.life -= rawDt;
      b.mesh.position.y += b.vy * rawDt;
      b.mesh.position.x += Math.sin(time * 4 + b.phase) * 0.01;
      if (b.mesh.position.y > LAGOON.surfaceY || b.life <= 0) b.mesh.visible = false;
    }
    if (R() < rawDt * 1.5) bubble(LAGOON.minX + R() * 45, floorY + 0.3, -1 - R() * 6, 0.1);
    boat.position.x = 4 + Math.sin(time * 0.08) * 9;
    boat.position.y = Math.sin(time * 1.3) * 0.08;
    boat.rotation.z = Math.sin(time * 1.1) * 0.04;
    paddle.position.x = -6 + Math.sin(time * 0.11) * 13;
    paddle.rotation.y = Math.cos(time * 0.11) > 0 ? 0 : Math.PI;
    oar.rotation.x = Math.sin(time * 2) * 0.5;
    sandwich.rotation.z = Math.sin(time * 1.5) * 0.3;
    line.position.y = -1.6 + Math.sin(time * 0.9) * 0.3;
    for (const c of castList) c.userData.animate(rawDt, c.userData.anim);
    if (coastguard.visible) {
      coastguardX += 14 * rawDt;
      coastguard.position.x = coastguardX;
      coastguard.position.y = Math.sin(time * 6) * 0.1;
      siren.material.color.set(Math.floor(time * 6) % 2 ? '#2f6bff' : '#ff2a2a');
      if (Math.floor(time * 3) !== Math.floor((time - rawDt) * 3)) sfx.note(Math.floor(time * 3) % 2 ? 880 : 660);
      if (coastguardX > player.x + 30) coastguard.visible = false;
    }

    // Babar spits from the pontoon, now and then (a running gag).
    spitTimer -= rawDt;
    if (spitTimer <= 0) {
      spitTimer = 10 + R() * 8;
      hud.say(cast.babar, ctx.t('babar_line'), 1.6);
      const blob = mesh(G.sphere, M.bubble, 0.12);
      blob.position.set(-25.2, 2.6, -0.6);
      root.add(blob);
      spits.push({ mesh: blob, vx: 2.4, vy: 2, sinking: false });
    }
    for (let i = spits.length - 1; i >= 0; i--) {
      const s = spits[i];
      if (!s.sinking) { s.vy -= 9 * rawDt; if (s.mesh.position.y < 0) { s.sinking = true; s.vx = 0; s.vy = -1.5; } }
      s.mesh.position.x += s.vx * rawDt;
      s.mesh.position.y += s.vy * rawDt;
      s.mesh.position.z += (0 - s.mesh.position.z) * rawDt;
      if (touches(s.mesh.position.x, s.mesh.position.y, 0.2, player.x, player.y, 0.9)) {
        hud.float(panda, ctx.t('spit'), '#c8ff9b', 2.6);
        sfx.click();
        root.remove(s.mesh); spits.splice(i, 1);
      } else if (s.mesh.position.y < floorY + 4) { root.remove(s.mesh); spits.splice(i, 1); }
    }

    // Cameo lines: whoever is on screen says something now and then.
    quoteTimer -= rawDt;
    if (quoteTimer <= 0) {
      quoteTimer = 4 + R() * 3;
      const near = castList.filter((c) => {
        c.getWorldPosition(tmp);
        return Math.abs(tmp.x - camera.position.x) < 13 && c !== cast.babar;
      });
      if (near.length) {
        const c = near[Math.floor(R() * near.length)];
        const id = c.userData.id;
        const key = { victor: 'victor_line', mamar: 'mamar_line', romain: 'romain_line', cous: 'cous_line', violaine: 'violaine_line' }[id];
        hud.say(c, key ? ctx.t(key) : (R() < 0.5 ? ctx.t('beach_line') : ctx.tShared(`quote_${id}`)), 2.2);
      }
    }

    // --- Camera, with a little shake
    shake = Math.max(0, shake - rawDt);
    const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.8 : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.8 : 0;
    const camX = clamp(player.x, LAGOON.minX + 4, LAGOON.maxX + 2);
    const camY = clamp(player.y + 1.2, floorY + 5.5, 1.5);
    camera.position.set(camX + sx, camY + sy, 15);
    camera.lookAt(camX, camY - 0.6, 0);
    sun.target.position.set(camX, floorY, -4);

    // --- HUD
    hud.setScore(state.score);
    const left = Math.ceil(state.timeLeft());
    if (left !== lastShownLeft) {
      lastShownLeft = left;
      hud.setProgress(progress, ctx.t('time_left', { s: left }));
    }

    // --- End
    if (state.over) {
      gauge.classList.remove('show');
      hud.buttons([]);
      if (state.won) {
        panda.userData.animate(0, 'cheer');
        fx.burst(new THREE.Vector3(player.x, player.y + 1, 0.3), 80);
        ctx.finish({ score: state.score, stars: state.stars(), line: state.fines >= 2 ? ctx.t('end_fines') : ctx.t('done') });
      } else {
        ctx.fail({ score: state.score, line: ctx.t('dead_line') });
      }
    }
  }

  function dispose() {
    style.remove();
    gauge.remove();
    maskTex.dispose();
    fishes.length = 0;
    langos.length = 0;
    spits.length = 0;
  }

  return { start, update, dispose, state };
}
