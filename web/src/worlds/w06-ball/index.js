// World 6 - "La balle de Mamar": Panda, dressed as a wild creature (ears and
// a tail), refuses to go back into Mamar's blue-and-white ball. Round grass
// arena, Mamar throws patterns from the far rim, stops for sandwich breaks.
// Move with arrows/WASD or drag, dash with Space or the 💨 button. A hit is a
// capture attempt: mash to break free. Three captures and it is over.
// Rules live in rules.js (pure, unit-tested).

import { createBallGame, ARENA_R, GRASS, BABAR_POS, COUS_POS } from './rules.js';

export const MODELS = ['nature', 'platform'];

export const TEXTS = {
  en: {
    howto: ['Arrows / WASD or drag: move. Space or 💨: dash (brief invincibility).', 'Hit by a ball? MASH any key or tap fast to break free!', 'Grab the Hoho stars. Mamar\'s sandwich break = bonus time. Three captures and you\'re done.'],
    objective: 'Never go back in the ball!',
    go: 'Back in the ball, Panda!',
    refuse: ['I\'m NOT going back in!', 'Hoho, catch me if you can!', 'Wild and free!'],
    mash: 'MASH TO BREAK FREE!',
    struggle: 'Struggle',
    dash: 'Dash',
    free: 'BROKE FREE!',
    captured: 'Captured! {n}/{max}',
    pop_out: '…but Panda wriggles back out.',
    throw_aimed: ['Go, ball!', 'This one is yours!'],
    throw_spread: 'Fan of balls!',
    throw_rapid: 'Olé, olé, olé!',
    throw_bounce: 'Bouncy one!',
    throw_giant: 'THE GIANT BALL!',
    break: 'SANDWICH BREAK! Grab the bonuses!',
    aie: 'Aïe aïe aïe aïe… sandwich time.',
    break_end: 'Break\'s over!',
    spit: 'Ptoui!',
    slippery: 'Slippery!',
    decoy: 'Go, little guinea pig!',
    decoy_caught: 'Wrong creature!',
    close: 'Close! +5',
    hoho: 'Hoho!',
    heart: 'We love you anyway! −1 capture',
    shield: 'Eugénie\'s kiss: shield!',
    shield_pop: 'Shield popped!',
    merguez: 'Hoho, the merguez!',
    lol: 'Looool',
    cheer_mamar: ['Go Mamar!', 'Get him, my love!'],
    grass: 'Hidden in the tall grass…',
    final: 'Last seconds!',
    win_line: 'Panda stays wild. Mamar eats another sandwich to cope.',
    lose_line: 'Click. Panda is in the ball. Mamar: "Olé!"',
  },
  fr: {
    howto: ['Flèches / ZQSD ou glisser : bouger. Espace ou 💨 : esquive (invincible un instant).', 'Touché par une balle ? MARTÈLE une touche ou tape vite pour t\'échapper !', 'Ramasse les étoiles Hoho. Pause sandwich de Mamar = bonus. Trois captures et c\'est fini.'],
    objective: 'Ne retourne jamais dans la balle !',
    go: 'Rentre dans la balle, Panda !',
    refuse: ['J\'y retourne PAS !', 'Hoho, attrape-moi si tu peux !', 'Sauvage et libre !'],
    mash: 'MARTÈLE POUR T\'ÉCHAPPER !',
    struggle: 'Débats-toi',
    dash: 'Esquive',
    free: 'ÉCHAPPÉ !',
    captured: 'Capturé ! {n}/{max}',
    pop_out: '…mais Panda se tortille et ressort.',
    throw_aimed: ['Vas-y, la balle !', 'Celle-là, elle est pour toi !'],
    throw_spread: 'Éventail de balles !',
    throw_rapid: 'Olé, olé, olé !',
    throw_bounce: 'Une rebondissante !',
    throw_giant: 'LA BALLE GÉANTE !',
    break: 'PAUSE SANDWICH ! Prends les bonus !',
    aie: 'Aïe aïe aïe aïe… l\'heure du sandwich.',
    break_end: 'Fin de la pause !',
    spit: 'Ptoui !',
    slippery: 'Ça glisse !',
    decoy: 'Vas-y, p\'tit cochon d\'Inde !',
    decoy_caught: 'Mauvaise créature !',
    close: 'Ouf ! +5',
    hoho: 'Hoho !',
    heart: 'On t\'aime quand même ! −1 capture',
    shield: 'Bisou d\'Eugénie : bouclier !',
    shield_pop: 'Bouclier éclaté !',
    merguez: 'Hoho les merguez !',
    lol: 'Looool',
    cheer_mamar: ['Allez Mamar !', 'Attrape-le, mon chéri !'],
    grass: 'Caché dans les hautes herbes…',
    final: 'Dernières secondes !',
    win_line: 'Panda reste sauvage. Mamar mange un autre sandwich pour s\'en remettre.',
    lose_line: 'Clic. Panda est dans la balle. Mamar : « Olé ! »',
  },
};

const STYLE = `
.w06-stick { position: absolute; width: 110px; height: 110px; margin: -55px 0 0 -55px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.85); background: rgba(117,183,232,0.25); pointer-events: none; display: none; }
.w06-stick i { position: absolute; left: 50%; top: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
  background: #fff; border: 3px solid #1d2a44; }
.w06-mash { position: absolute; left: 50%; top: 58%; transform: translate(-50%, -50%); font-size: 54px; pointer-events: none; display: none;
  animation: w06-pulse 0.25s infinite alternate; }
@keyframes w06-pulse { from { transform: translate(-50%, -50%) scale(1); } to { transform: translate(-50%, -50%) scale(1.25); } }
`;

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const game = createBallGame({ mode: ctx.mode, random: ctx.random });
  const cfg = game.cfg;
  let time = 0;
  let shake = 0;
  let ended = false;
  let dashQueued = false;
  let mashQueued = 0;
  let crowdTimer = 4;
  let lastFinal = false;
  let grassHint = false;
  let slipHint = 0;
  let styleEl = null;
  let stickEl = null;
  let mashEl = null;
  let drag = null;
  const tmpV = new THREE.Vector3();

  ctx.setupSky({ top: '#2f8fe8', bottom: '#d6f6ff', fogNear: 35, fogFar: 90 });
  const sun = ctx.addLights(root);

  // --- Materials and shared geometry ------------------------------------------------
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
  function stripeTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#75b7e8';
      g.fillRect(0, (i * 128) / 5, 64, 128 / 5 + 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const ballMat = new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.35 });
  const ballGeo = new THREE.SphereGeometry(1, 20, 14);
  const sunMat = new THREE.MeshStandardMaterial({ color: '#ffcf33', emissive: '#7a5a00', roughness: 0.3 });
  const sunGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 14);

  /** The blue-and-white striped ball with the little golden sun button. */
  function makeBall(radius) {
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(ballGeo, ballMat);
    sphere.scale.setScalar(radius);
    sphere.castShadow = true;
    const button = new THREE.Mesh(sunGeo, sunMat);
    button.rotation.x = Math.PI / 2;
    button.position.z = radius * 0.97;
    button.scale.setScalar(radius / 0.42 * 0.5);
    const spin = new THREE.Group();
    spin.rotation.order = 'YXZ';
    spin.add(sphere, button);
    g.add(spin);
    g.userData.spin = spin;
    return g;
  }

  // --- Arena ------------------------------------------------------------------------
  const field = new THREE.Mesh(new THREE.CircleGeometry(60, 48), mat('#5fbf4a', { roughness: 1 }));
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  root.add(field);
  const arena = new THREE.Mesh(new THREE.CircleGeometry(ARENA_R, 64), mat('#86d96a', { roughness: 1 }));
  arena.rotation.x = -Math.PI / 2;
  arena.position.y = 0.01;
  arena.receiveShadow = true;
  root.add(arena);
  const chalk = new THREE.Mesh(new THREE.RingGeometry(ARENA_R - 0.12, ARENA_R + 0.12, 72), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  chalk.rotation.x = -Math.PI / 2;
  chalk.position.y = 0.02;
  root.add(chalk);
  const midLine = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.8, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }));
  midLine.rotation.x = -Math.PI / 2;
  midLine.position.y = 0.02;
  root.add(midLine);
  // Low striped fence posts.
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 6), mat(i % 2 ? '#ffffff' : '#75b7e8'));
    post.position.set(Math.cos(a) * (ARENA_R + 0.35), 0.35, Math.sin(a) * (ARENA_R + 0.35));
    root.add(post);
  }

  // Tall grass patches: clusters of blades that sway.
  const bladeGeo = new THREE.ConeGeometry(0.12, 1.3, 4);
  bladeGeo.translate(0, 0.65, 0);
  const bladeMats = [mat('#2f9e3f'), mat('#3fb34a'), mat('#5ccf55')];
  const grassGroups = [];
  for (const patch of GRASS) {
    const g = new THREE.Group();
    const n = Math.round(patch.r * 18);
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(ctx.random()) * patch.r;
      const a = ctx.random() * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, bladeMats[i % 3]);
      blade.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      blade.rotation.set((ctx.random() - 0.5) * 0.4, ctx.random() * 3, (ctx.random() - 0.5) * 0.4);
      blade.scale.y = 0.7 + ctx.random() * 0.6;
      g.add(blade);
    }
    g.position.set(patch.x, 0, patch.z);
    root.add(g);
    grassGroups.push(g);
  }
  // Trees and flowers around the field.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    const r = ARENA_R + 7 + ctx.random() * 6;
    const name = i % 3 === 0 ? 'tree_palm' : i % 3 === 1 ? 'tree_default' : 'plant_bush';
    const tree = models.get(name, { height: name === 'plant_bush' ? 1.2 : 4 + ctx.random() * 2 });
    if (tree) {
      tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      root.add(tree);
    } else {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), mat('#8a5a32'));
      trunk.position.set(Math.cos(a) * r, 1.5, Math.sin(a) * r);
      const top = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), mat('#2e9a46'));
      top.position.set(0, 2, 0);
      trunk.add(top);
      root.add(trunk);
    }
  }
  for (let i = 0; i < 16; i++) {
    const a = ctx.random() * Math.PI * 2;
    const r = ARENA_R + 1.5 + ctx.random() * 4;
    const f = models.get(['flower_redA', 'flower_yellowA', 'flower_purpleA'][i % 3], { height: 0.6 });
    if (f) { f.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); root.add(f); }
  }

  // Bleachers behind Mamar with the crowd.
  const bleachers = new THREE.Group();
  const seatColors = ['#75b7e8', '#ffffff', '#75b7e8'];
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 1.2), mat(seatColors[i]));
    step.position.set(0, 0.25 + i * 0.5, -i * 1.2);
    step.scale.y = 1 + i * 2;
    step.position.y = (0.5 * (1 + i * 2)) / 2;
    bleachers.add(step);
  }
  bleachers.position.set(0, 0, -(ARENA_R + 4.2));
  root.add(bleachers);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), new THREE.MeshBasicMaterial({ map: bannerTexture(), transparent: true }));
  banner.position.set(0, 5.4, -(ARENA_R + 7.5));
  root.add(banner);
  function bannerTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 86;
    const g = c.getContext('2d');
    g.fillStyle = '#75b7e8'; g.fillRect(0, 0, 512, 86);
    g.fillStyle = '#fff'; g.fillRect(0, 28, 512, 30);
    g.fillStyle = '#1d2a44';
    g.font = 'bold 44px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('MAMAR ★ OLÉ ★ PANDA', 256, 45);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // --- Cast -------------------------------------------------------------------------
  const panda = ctx.character('panda');
  root.add(panda);
  // Wild-creature costume: round ears that always face the camera, and a fluffy tail.
  const ears = new THREE.Group();
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat('#1b1b1f'));
    ear.scale.set(1, 1, 0.5);
    ear.position.set(0.05 + s * 0.3, 2.3, -0.05);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat('#ff9eb5'));
    inner.position.set(0, 0, 0.08);
    ear.add(inner);
    ears.add(ear);
  }
  panda.userData.parts.body.add(ears);
  const tail = new THREE.Group();
  const tailBall = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat('#f6f6f0'));
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat('#1b1b1f'));
  tailTip.position.set(0, 0.12, -0.14);
  tail.add(tailBall, tailTip);
  tail.position.set(0, 0.78, -0.34);
  panda.userData.parts.body.add(tail);
  const shieldBubble = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 14), new THREE.MeshStandardMaterial({ color: '#ff8fc8', transparent: true, opacity: 0.28, emissive: '#ff4fa0', emissiveIntensity: 0.3 }));
  shieldBubble.position.y = 1.1;
  shieldBubble.visible = false;
  panda.add(shieldBubble);
  // The ball Panda is stuck in while struggling.
  const trap = makeBall(0.9);
  trap.visible = false;
  root.add(trap);

  const mamar = ctx.character('mamar', { scale: 1.1 });
  root.add(mamar);
  const handBall = makeBall(0.3);
  handBall.position.y = -0.75;
  handBall.visible = false;
  mamar.userData.parts.armR.add(handBall);
  const sandwich = new THREE.Group();
  [['#e8b866', 0.1], ['#6cb84a', 0.05], ['#c9433b', 0.05], ['#e8b866', 0.1]].forEach(([c, h], i) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.25), mat(c));
    l.position.y = i * 0.08;
    sandwich.add(l);
  });
  sandwich.position.set(0, -0.75, 0.15);
  sandwich.visible = false;
  mamar.userData.parts.armL.add(sandwich);
  // Aim line shown while Mamar winds up.
  const aimLine = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }));
  aimLine.rotation.x = -Math.PI / 2;
  aimLine.visible = false;
  root.add(aimLine);

  const eugenie = ctx.character('eugenie');
  root.add(eugenie);
  const babar = ctx.character('babar');
  babar.position.set(BABAR_POS.x, 0, BABAR_POS.z);
  babar.rotation.y = Math.PI / 2;
  root.add(babar);
  const cous = ctx.character('cous');
  cous.position.set(COUS_POS.x, 0, COUS_POS.z);
  cous.rotation.y = -Math.PI / 2;
  root.add(cous);
  // Romain the referee on a high chair.
  const romain = ctx.character('romain');
  const chair = new THREE.Group();
  for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), mat('#f2f2f2'));
    leg.position.set(x, 0.8, z);
    chair.add(leg);
  }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 1), mat('#2a2a33'));
  seat.position.y = 1.6;
  chair.add(seat);
  chair.position.set(ARENA_R + 1.4, 0, -5.6);
  root.add(chair);
  romain.position.set(ARENA_R + 1.4, 1.65, -5.6);
  romain.rotation.y = -Math.PI / 2 - 0.4;
  root.add(romain);
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.04), mat('#ffd400'));
  card.position.set(0, -0.8, 0.1);
  romain.userData.parts.armR.add(card);
  // Crowd on the bleachers.
  const crowd = [];
  const crowdSpots = [['victor', -4.2, 1], ['greg', -1.4, 1], ['aline', 1.4, 1], ['violaine', 4.2, 1]];
  for (const [id, x, row] of crowdSpots) {
    const c = ctx.character(id);
    c.position.set(x, 0.5 + row * 1, -(ARENA_R + 4.2) - row * 1.2);
    root.add(c);
    crowd.push(c);
  }
  for (let i = 0; i < 3; i++) {
    const k = ctx.kid(i + 2);
    k.position.set(-3 + i * 3, 2.5, -(ARENA_R + 4.2) - 2.4);
    root.add(k);
    crowd.push(k);
  }
  const talkers = [...crowd.slice(0, 4), cous, babar, eugenie, romain];

  // --- Entity meshes ------------------------------------------------------------------
  const tracked = new Map(); // entity -> mesh
  function starMesh() {
    const m = models.get('star', { height: 0.8 });
    if (m) return m;
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.17 : 0.4;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false }), mat('#ffd84a', { emissive: '#8a6a00' }));
    s.position.y = 0.45;
    g.add(s);
    return g;
  }
  function itemMesh(kind) {
    const g = new THREE.Group();
    let inner;
    if (kind === 'hoho') inner = starMesh();
    else if (kind === 'heart') inner = models.get('heart', { height: 0.8 }) || (() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), mat('#ff4d6d')); m.position.y = 0.4; return m; })();
    else if (kind === 'shield') {
      inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), mat('#ff8fc8', { emissive: '#a0306a', flatShading: true }));
      inner.position.y = 0.45;
    } else {
      // A merguez on a little fork.
      inner = new THREE.Group();
      const sausage = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.7, 4, 10), mat('#a8452a', { roughness: 0.5 }));
      sausage.rotation.z = Math.PI / 2;
      sausage.position.y = 0.55;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), mat('#d9c08a'));
      stick.position.set(0.1, 0.3, 0);
      inner.add(sausage, stick);
    }
    g.add(inner);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 24), new THREE.MeshBasicMaterial({ color: kind === 'hoho' ? '#fff3a0' : '#ffffff', transparent: true, opacity: 0.6 }));
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.04;
    g.add(halo);
    g.userData.inner = inner;
    return g;
  }
  function puddleMesh() {
    const g = new THREE.Group();
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshStandardMaterial({ color: '#bff0d8', transparent: true, opacity: 0.8, roughness: 0.05, metalness: 0.1 }));
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.03;
    const glob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#d8fff0', { transparent: true, opacity: 0.9 }));
    g.add(disk, glob);
    g.userData.disk = disk;
    g.userData.glob = glob;
    return g;
  }
  function guineaPig() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), mat('#c98a4b'));
    body.scale.set(0.8, 0.7, 1.2);
    body.position.y = 0.28;
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat('#ffffff'));
    patch.position.set(0, 0.42, 0.1);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#ff9eb5'));
    nose.position.set(0, 0.3, 0.44);
    g.add(body, patch, nose);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#8a5a32'));
      ear.position.set(s * 0.15, 0.5, 0.25);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#111'));
      eye.position.set(s * 0.12, 0.38, 0.38);
      g.add(ear, eye);
    }
    return g;
  }
  function track(list, make) {
    for (const e of list) {
      if (tracked.has(e)) continue;
      const m = make(e);
      root.add(m);
      tracked.set(e, m);
    }
  }
  function sweep() {
    for (const [e, m] of tracked) {
      if (!e.dead) continue;
      if (e.kind === 'hoho' || e.kind === 'heart' || e.kind === 'shield' || e.kind === 'merguez') {
        if (e.life > 0) fx.burst(m.position.clone().setY(0.8), 14, { color: 0xffe066, speed: 3 });
      } else if (e.r) {
        // A ball that vanished near Panda or a decoy: little puff.
        fx.burst(m.position, 6, { color: 0xffffff, speed: 2, up: 1 });
      }
      root.remove(m);
      tracked.delete(e);
    }
  }

  // --- Input ------------------------------------------------------------------------
  function readMove() {
    let mx = input.axisX();
    let mz = (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0);
    const p = input.pointer;
    if (p.down) {
      if (!drag) drag = { x: p.x, y: p.y };
      const aspect = camera.aspect || 1;
      const dx = (p.x - drag.x) * aspect;
      const dy = -(p.y - drag.y);
      const len = Math.hypot(dx, dy);
      if (len > 0.025) {
        const k = Math.min(1, len / 0.12) / len;
        mx = dx * k;
        mz = dy * k;
      }
      if (stickEl) {
        const r = stickEl.parentElement.getBoundingClientRect();
        stickEl.style.display = 'block';
        stickEl.style.left = `${(drag.x * 0.5 + 0.5) * r.width}px`;
        stickEl.style.top = `${(-drag.y * 0.5 + 0.5) * r.height}px`;
        const knob = stickEl.firstChild;
        const kx = Math.max(-1, Math.min(1, len ? dx / Math.max(len, 0.12) : 0)) * 34;
        const ky = Math.max(-1, Math.min(1, len ? dy / Math.max(len, 0.12) : 0)) * 34;
        knob.style.transform = `translate(${kx}px, ${ky}px)`;
      }
    } else {
      drag = null;
      if (stickEl) stickEl.style.display = 'none';
    }
    return { mx, mz };
  }
  function readMash() {
    let n = input.taps.length + mashQueued;
    for (const a of ['left', 'right', 'up', 'down', 'action']) if (input.pressed(a)) n++;
    mashQueued = 0;
    return n;
  }

  // --- Lifecycle --------------------------------------------------------------------
  function start() {
    styleEl = document.createElement('style');
    styleEl.textContent = STYLE;
    document.head.appendChild(styleEl);
    stickEl = document.createElement('div');
    stickEl.className = 'w06-stick';
    stickEl.innerHTML = '<i></i>';
    hud.el.appendChild(stickEl);
    mashEl = document.createElement('div');
    mashEl.className = 'w06-mash';
    mashEl.textContent = '👊👊👊';
    hud.el.appendChild(mashEl);
    hud.buttons([{ id: 'dash', label: '💨', side: 'right', onDown: () => { dashQueued = true; mashQueued++; } }]);
    ctx.music(144, [0, 3, 7, 10, 7, 3, 5, 7]);
    hud.setObjective(ctx.t('objective'));
    hud.setHearts(cfg.maxCaptures, cfg.maxCaptures);
    hud.banner(ctx.t('go'), 1800, '#75b7e8');
    hud.say(mamar, ctx.t('go'), 2.2);
    hud.say(panda, ctx.t('refuse'), 2.2);
    setTimeout(() => { if (!ended) hud.say(crowd[1], ctx.tShared('quote_greg'), 2); }, 1500);
    sfx.whoosh();
    placeCamera(0, true);
  }

  function placeCamera(dt, snap = false) {
    const aspect = camera.aspect || 1;
    const portrait = aspect < 1 ? (1 - aspect) : 0;
    const height = 13 + portrait * 13;
    const back = 10 + portrait * 6;
    const follow = 0.45 + portrait * 0.35;
    const tx = game.x * follow;
    const tz = game.z * follow;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    tmpV.set(tx + sx, height + sy, tz + back);
    if (snap) camera.position.copy(tmpV); else camera.position.lerp(tmpV, Math.min(1, dt * 5));
    camera.lookAt(camera.position.x - sx, 0, camera.position.z - back - 1.5);
  }

  function update(dt) {
    time += dt;
    shake = Math.max(0, shake - dt * 2);
    if (ended) {
      panda.userData.animate(dt, game.won ? 'dance' : 'hit');
      mamar.userData.animate(dt, game.won ? 'sit' : 'cheer');
      for (const c of crowd) c.userData.animate(dt, 'cheer');
      return;
    }

    const move = readMove();
    const mash = readMash();
    const ev = game.step(dt, { mx: move.mx, mz: move.mz, dash: dashQueued || input.pressed('action'), mash });
    dashQueued = false;
    const st = game.struggle;
    const mp = game.mamarPos();

    // --- Panda
    panda.position.set(game.x, 0, game.z);
    const speed = Math.hypot(game.vx, game.vz);
    if (speed > 0.3) panda.rotation.y = Math.atan2(game.vx, game.vz);
    ears.rotation.y = -panda.rotation.y;
    tail.rotation.y = Math.sin(time * 12) * 0.4;
    panda.visible = !st && !(game.invuln > 0 && game.dashTime <= 0 && Math.sin(time * 30) > 0.3);
    panda.userData.animate(dt, game.dashTime > 0 ? 'jump' : speed > 0.8 ? 'run' : 'idle');
    shieldBubble.visible = game.shield > 0;
    if (shieldBubble.visible) shieldBubble.scale.setScalar(1 + Math.sin(time * 6) * 0.05);

    if (ev.dashed) {
      sfx.whoosh();
      fx.burst(panda.position.clone().setY(0.3), 12, { color: 0xffffff, speed: 3, up: 1 });
    }
    // --- Capture struggle
    if (ev.hit) {
      sfx.hit();
      shake = 0.6;
      trap.position.set(game.x, 0.9, game.z);
      trap.visible = true;
      hud.banner(ctx.t('mash'), 1400, '#ff4d6d');
      hud.say(romain, ctx.t('lol'), 1.6);
      hud.say(mamar, ctx.tShared('quote_mamar'), 1.6);
      fx.burst(trap.position, 30, { color: 0x75b7e8 });
    }
    if (st) {
      trap.visible = true;
      const danger = 1 - st.meter;
      trap.userData.spin.rotation.set(0, 0, Math.sin(time * (10 + danger * 18)) * (0.2 + danger * 0.35));
      trap.scale.setScalar(1 + (mash ? 0.12 : 0));
      if (mash) { sfx.click(); fx.burst(trap.position, 3, { color: 0xffffff, speed: 2, up: 2 }); }
      hud.meter('struggle', st.meter, st.meter > 0.66 ? '#4caf50' : st.meter > 0.33 ? '#ffd84a' : '#ff4d4d', ctx.t('struggle'));
      mashEl.style.display = 'block';
    } else {
      trap.visible = false;
      mashEl.style.display = 'none';
    }
    if (ev.freed) {
      sfx.power();
      fx.burst(panda.position.clone().setY(1), 50);
      hud.banner(ctx.t('free'), 1200, '#8af27a');
      hud.say(panda, ctx.t('hoho'), 1.4);
      hud.meter('struggle', 0, '#4caf50', ctx.t('struggle'));
      sfx.hoho();
    }
    if (ev.captured) {
      sfx.lose();
      shake = 0.9;
      hud.setHearts(cfg.maxCaptures - game.captures, cfg.maxCaptures);
      hud.meter('struggle', 0, '#ff4d4d', ctx.t('struggle'));
      if (!ev.lost) {
        hud.banner(`${ctx.t('captured', { n: game.captures, max: cfg.maxCaptures })} ${ctx.t('pop_out')}`, 2000, '#ff9f1c');
        hud.say(crowd[3], ctx.tShared('quote_violaine'), 1.6);
        fx.burst(panda.position.clone().setY(1), 30, { color: 0xffffff });
      }
    }

    // --- Mamar, Eugénie and the aim telegraph
    mamar.position.set(mp.x, 0, mp.z);
    mamar.lookAt(game.x, 0, game.z);
    const onBreak = game.onBreak();
    handBall.visible = !!game.windup;
    sandwich.visible = onBreak;
    const strolling = !onBreak && !game.windup && !st;
    mamar.userData.animate(strolling ? dt * 0.4 : dt, onBreak ? 'sit' : game.windup ? 'cheer' : st ? 'dance' : 'run');
    const ea = game.mamarA - 0.16 * Math.sign(Math.cos(game.mamarA) || 1);
    eugenie.position.set(Math.cos(ea) * (ARENA_R + 2.6), 0, Math.sin(ea) * (ARENA_R + 2.6));
    eugenie.lookAt(0, 0, 0);
    eugenie.userData.animate(dt, game.windup || st ? 'cheer' : 'idle');
    if (game.windup) {
      const dx = game.x - mp.x;
      const dz = game.z - mp.z;
      const len = Math.hypot(dx, dz);
      aimLine.visible = true;
      aimLine.scale.y = len;
      aimLine.position.set(mp.x + dx / 2, 0.05, mp.z + dz / 2);
      aimLine.rotation.z = Math.atan2(dx, dz);
      aimLine.material.opacity = 0.25 + Math.abs(Math.sin(time * 16)) * 0.35;
    } else aimLine.visible = false;
    if (ev.windup) {
      hud.say(mamar, ctx.t(`throw_${ev.windup}`), 1.1);
      if (ev.windup === 'giant') { hud.banner(ctx.t('throw_giant'), 1100, '#75b7e8'); shake = 0.3; }
      if (ctx.random() < 0.3) hud.say(eugenie, ctx.t('cheer_mamar'), 1.2);
    }
    if (ev.fired) sfx.jump();
    if (ev.breakStart) {
      hud.banner(ctx.t('break'), 2000, '#ffd84a');
      hud.say(mamar, ctx.t('aie'), 2.5);
      sfx.power();
    }
    if (ev.breakEnd) { hud.banner(ctx.t('break_end'), 900, '#fff'); hud.say(mamar, ctx.tShared('quote_mamar'), 1.2); }

    // --- Balls
    track(game.balls, (b) => makeBall(b.r));
    for (const b of game.balls) {
      const m = tracked.get(b);
      m.position.set(b.x, b.y, b.z);
      const sp = Math.hypot(b.vx, b.vz);
      b.roll = (b.roll || 0) + (sp / b.r) * dt;
      m.userData.spin.rotation.set(b.roll, Math.atan2(b.vx, b.vz), 0);
    }
    if (ev.bounced) sfx.land();

    // --- Items
    track(game.items, (it) => itemMesh(it.kind));
    for (const it of game.items) {
      const m = tracked.get(it);
      m.position.set(it.x, 0, it.z);
      m.userData.inner.rotation.y += dt * 3;
      m.userData.inner.position.y = 0.15 + Math.sin(time * 4 + it.id) * 0.12;
      m.visible = it.life > 1.5 || Math.sin(time * 25) > 0;
    }
    if (ev.hoho) {
      sfx.coin();
      hud.float(panda, '+10', '#ffd84a', 2.4);
      if (game.hohos % 5 === 0) { hud.say(panda, ctx.t('hoho'), 1); sfx.hoho(); }
    }
    if (ev.bonus === 'heart') {
      sfx.power();
      hud.setHearts(cfg.maxCaptures - game.captures, cfg.maxCaptures);
      hud.say(crowd[2], ctx.t('heart'), 2);
      fx.burst(panda.position.clone().setY(1.5), 30, { color: 0xff6b8a });
    } else if (ev.bonus === 'shield') {
      sfx.power();
      hud.say(eugenie, ctx.t('shield'), 2);
      fx.burst(panda.position.clone().setY(1.5), 30, { color: 0xff8fc8 });
    } else if (ev.bonus === 'merguez') {
      sfx.power();
      hud.say(panda, ctx.t('merguez'), 2);
      hud.float(panda, '+25', '#ff9f1c', 2.6);
      fx.burst(panda.position.clone().setY(1.5), 40, { color: 0xff9f1c });
    }
    if (ev.shieldPop) { sfx.hit(); hud.float(panda, ctx.t('shield_pop'), '#ff8fc8', 2.4); fx.burst(panda.position.clone().setY(1.2), 30, { color: 0xff8fc8 }); }
    if (ev.nearMiss) {
      hud.float(panda, ctx.t('close'), '#ffffff', 2.2);
      if (ctx.random() < 0.25) hud.say(crowd[0], ctx.tShared('quote_victor'), 1.4);
    }

    // --- Babar's puddles
    track(game.puddles, () => puddleMesh());
    for (const p of game.puddles) {
      const m = tracked.get(p);
      const { disk, glob } = m.userData;
      if (p.landIn > 0) {
        const k = 1 - p.landIn / 0.9;
        m.position.set(BABAR_POS.x + (p.x - BABAR_POS.x) * k, 0, BABAR_POS.z + (p.z - BABAR_POS.z) * k);
        glob.position.y = 1.6 + Math.sin(k * Math.PI) * 3 - k * 1.4;
        glob.visible = true;
        disk.visible = false;
      } else {
        m.position.set(p.x, 0, p.z);
        glob.visible = false;
        disk.visible = true;
        disk.material.opacity = Math.min(0.8, p.life * 0.4);
      }
    }
    if (ev.spit) {
      hud.say(babar, ctx.t('spit'), 1.2);
      sfx.whoosh();
    }
    babar.lookAt(game.x, 0, game.z);
    babar.userData.animate(dt, ev.spit ? 'hit' : 'idle');
    if (game.onPuddle() && !st) {
      slipHint -= dt;
      if (slipHint <= 0) { hud.float(panda, ctx.t('slippery'), '#bff0d8', 2.4); slipHint = 2.5; }
    }

    // --- Cous's guinea-pig decoys
    track(game.decoys, () => guineaPig());
    for (const g of game.decoys) {
      const m = tracked.get(g);
      m.position.set(g.x, Math.abs(Math.sin(time * 16)) * 0.08, g.z);
      m.rotation.y = Math.atan2(g.vx, g.vz);
    }
    if (ev.decoy) { hud.say(cous, ctx.t('decoy'), 1.8); sfx.click(); }
    if (ev.decoyCaught) {
      hud.say(mamar, ctx.t('decoy_caught'), 1.6);
      hud.say(romain, ctx.t('lol'), 1.4);
      sfx.hoho();
    }
    cous.userData.animate(dt, game.decoys.length ? 'cheer' : 'idle');
    romain.userData.animate(dt, st ? 'cheer' : 'sit');
    sweep();

    // --- Crowd and grass
    for (const c of crowd) c.userData.animate(dt, st || ev.freed ? 'cheer' : onBreak ? 'dance' : 'idle');
    for (let i = 0; i < grassGroups.length; i++) grassGroups[i].rotation.z = Math.sin(time * 1.5 + i) * 0.03;
    crowdTimer -= dt;
    if (crowdTimer <= 0) {
      const who = talkers[Math.floor(ctx.random() * talkers.length)];
      hud.say(who, ctx.tShared(`quote_${who.userData.id}`), 1.8);
      crowdTimer = 4 + ctx.random() * 3;
    }
    const hidden = game.inGrass();
    if (hidden && !grassHint) { hud.float(panda, ctx.t('grass'), '#bfffb0', 2.6); grassHint = true; }

    // --- HUD and camera
    const left = Math.max(0, game.duration - game.time);
    hud.setScore(game.score(), '⭐ ');
    hud.setProgress(game.progress(), `${Math.ceil(left)} s`);
    hud.meter('dash', 1 - game.dashCd / cfg.dashCd, game.dashCd <= 0 ? '#6bd5ff' : '#9aa7b8', `💨 ${ctx.t('dash')}`);
    if (!lastFinal && left < 10) { lastFinal = true; hud.banner(ctx.t('final'), 1200, '#ff9f1c'); }
    placeCamera(dt);
    sun.position.set(game.x + 8, 18, game.z + 6);
    sun.target.position.set(game.x, 0, game.z);

    // --- End
    if (ev.won) {
      ended = true;
      fx.burst(panda.position.clone().setY(2), 90);
      hud.say(panda, ctx.t('hoho'), 3);
      hud.say(mamar, ctx.t('aie'), 3);
      ctx.finish({ score: game.score(), stars: game.stars(), line: ctx.t('win_line') });
    } else if (ev.lost) {
      ended = true;
      trap.visible = true;
      trap.position.set(game.x, 0.9, game.z);
      panda.visible = false;
      hud.say(mamar, ctx.tShared('quote_mamar'), 3);
      hud.say(romain, ctx.t('lol'), 3);
      ctx.fail({ score: game.score(), line: ctx.t('lose_line') });
    }
  }

  function dispose() {
    styleEl?.remove();
    stickEl?.remove();
    mashEl?.remove();
    tracked.clear();
  }

  return { start, update, dispose, game };
}

