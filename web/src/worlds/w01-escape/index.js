// World 1 - "15h pétantes !": 15:00 sharp, Panda bolts from the office to
// his beach with Romain right behind. Three lanes; swipe or arrows to change
// lane, up/Space to jump, down to slide. Every hit lets Romain catch up.
// The whole gang appears along the way.

import { createRunState, laneX, LANES } from './rules.js';

export const MODELS = ['office', 'nature', 'platform'];

export const TEXTS = {
  en: {
    howto: ['Swipe or arrows: change lane. Up / Space: jump. Down: slide.', 'Grab the euros. Rum = turbo, sandwich = breathing room.', 'Every bump lets Romain catch up. Reach the beach!'],
    go: '15:00! RUN!', office: 'The office', street: 'Fort-de-France', beach: 'The beach!',
    romain_gap: 'Romain', caught: 'Romain caught you: "You want to see work?"', arrived: 'Hoho, beach time!',
    rum: 'RUM TURBO!', sandwich: 'Mamar\'s sandwich!', objective: 'Reach the beach before Romain catches you',
    file: 'Here, a file!',
  },
  fr: {
    howto: ['Swipe ou flèches : changer de couloir. Haut / Espace : sauter. Bas : glisser.', 'Ramasse les euros. Rhum = turbo, sandwich = répit.', 'Chaque choc laisse Romain te rattraper. Atteins la plage !'],
    go: '15H ! COURS !', office: 'Le bureau', street: 'Fort-de-France', beach: 'La plage !',
    romain_gap: 'Romain', caught: 'Romain t\'a eu : « Te veux voir du travail ? »', arrived: 'Hoho, à la plage !',
    rum: 'TURBO RHUM !', sandwich: 'Le sandwich du Mamar !', objective: 'Atteins la plage avant que Romain te rattrape',
    file: 'Tiens, un dossier !',
  },
};

const ZONES = [
  { key: 'office', until: 0.33, ground: '#c9b79a', side: '#e6ecea' },
  { key: 'street', until: 0.7, ground: '#5d6270', side: '#d8d2c4' },
  { key: 'beach', until: 1.01, ground: '#f3d79a', side: '#1fa3c8' },
];
const HOUSE_COLORS = ['#ff9eb0', '#ffd65c', '#7cc8f5', '#8de0a8', '#ffb37a'];

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const state = createRunState({
    length: ctx.mode === 'easy' ? 900 : ctx.mode === 'hard' ? 1500 : 1200,
    speedFactor: ctx.speed,
    bumpDamage: ctx.mode === 'easy' ? 18 : ctx.mode === 'hard' ? 32 : 25,
  });
  const objects = []; // obstacles and pickups: {mesh, kind, lane, z, height, hit}
  const scenery = [];
  let zone = 0;
  let spawnZ = -30;
  let sceneryZ = 0;
  let time = 0;
  let quoteTimer = 3;

  ctx.setupSky({ top: '#2f86eb', bottom: '#cdf3ff', fogNear: 40, fogFar: 110 });
  const sun = ctx.addLights(root);

  // Ground: one long strip that follows the player, recoloured per zone.
  const groundMat = new THREE.MeshStandardMaterial({ color: ZONES[0].ground, roughness: 0.9 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 400), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);
  const sideMat = new THREE.MeshStandardMaterial({ color: ZONES[0].side, roughness: 1 });
  const sides = new THREE.Mesh(new THREE.PlaneGeometry(80, 400), sideMat);
  sides.rotation.x = -Math.PI / 2;
  sides.position.y = -0.05;
  root.add(sides);
  const laneLines = [];
  for (const x of [-1.1, 1.1]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 400), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.01, 0);
    root.add(line);
    laneLines.push(line);
  }

  const panda = ctx.character('panda');
  root.add(panda);
  const romain = ctx.character('romain', { scale: 1.05 });
  root.add(romain);

  // --- Builders -----------------------------------------------------------------
  function model(name, opts, fallback) {
    return models.get(name, opts) || fallback();
  }
  function box(w, h, d, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
    m.position.y = h / 2;
    m.castShadow = true;
    const g = new THREE.Group();
    g.add(m);
    return g;
  }
  function coinMesh() {
    const c = model('coin-gold', { height: 0.7 }, () => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20), new THREE.MeshStandardMaterial({ color: '#ffcc33', metalness: 0.6, roughness: 0.3, emissive: '#7a5200' }));
      m.rotation.x = Math.PI / 2;
      const g = new THREE.Group(); g.add(m); return g;
    });
    return c;
  }
  function pickupMesh(kind) {
    if (kind === 'rum') {
      const g = new THREE.Group();
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12), new THREE.MeshStandardMaterial({ color: '#c9772a', transparent: true, opacity: 0.9, roughness: 0.2 }));
      bottle.position.y = 0.5;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.25, 10), new THREE.MeshStandardMaterial({ color: '#c9772a' }));
      neck.position.y = 0.92;
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.2, 12), new THREE.MeshStandardMaterial({ color: '#fff4d6' }));
      label.position.y = 0.45;
      g.add(bottle, neck, label);
      return g;
    }
    const g = new THREE.Group();
    const layers = [['#e8b866', 0.12], ['#6cb84a', 0.06], ['#c9433b', 0.06], ['#e8b866', 0.12]];
    let y = 0.3;
    for (const [color, h] of layers) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.35), new THREE.MeshStandardMaterial({ color }));
      l.position.y = y;
      y += h;
      g.add(l);
    }
    return g;
  }
  function obstacleMesh(kind) {
    switch (kind) {
      case 'desk': return model('desk', { width: 1.9 }, () => box(1.9, 0.8, 0.9, '#b7864f'));
      case 'cabinet': return model('bookcaseOpen', { height: 2.4 }, () => box(1.6, 2.4, 0.6, '#8d99ae'));
      case 'printer': return box(1.3, 0.75, 0.9, '#e9ecef');
      case 'banner': {
        const g = new THREE.Group();
        const sheet = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: '#fff7e0' }));
        sheet.position.y = 1.65;
        for (const x of [-0.95, 0.95]) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 6), new THREE.MeshStandardMaterial({ color: '#555' }));
          pole.position.set(x, 1, 0);
          g.add(pole);
        }
        g.add(sheet);
        return g;
      }
      case 'cone': {
        const g = new THREE.Group();
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 16), new THREE.MeshStandardMaterial({ color: '#ff7b00' }));
        c.position.y = 0.4;
        g.add(c);
        return g;
      }
      case 'crate': return model('crate', { height: 0.9 }, () => box(1, 0.9, 1, '#c68a4a'));
      case 'barrier': return box(2, 0.6, 0.3, '#e63946');
      case 'parasol': {
        const g = new THREE.Group();
        const top = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 16), new THREE.MeshStandardMaterial({ color: '#ff5d8f' }));
        top.position.y = 1.7;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), new THREE.MeshStandardMaterial({ color: '#eee' }));
        pole.position.y = 0.85;
        g.add(top, pole);
        return g;
      }
      case 'crab': {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10), new THREE.MeshStandardMaterial({ color: '#ff4d2e' }));
        body.scale.y = 0.6;
        body.position.y = 0.3;
        g.add(body);
        for (const s of [-1, 1]) {
          const claw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff4d2e' }));
          claw.position.set(s * 0.55, 0.4, 0.2);
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff' }));
          eye.position.set(s * 0.15, 0.62, 0.2);
          g.add(claw, eye);
        }
        return g;
      }
      case 'spit': {
        const g = new THREE.Group();
        const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), new THREE.MeshStandardMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.85, roughness: 0.05 }));
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.y = 0.02;
        g.add(puddle);
        return g;
      }
      default: return box(1, 1, 1, '#999');
    }
  }
  // kind -> how to pass it: 'jump' (low), 'slide' (high), 'side' (tall: change lane)
  const PASS = { desk: 'jump', printer: 'jump', cone: 'jump', crate: 'jump', barrier: 'jump', crab: 'jump', spit: 'jump', banner: 'slide', parasol: 'slide', cabinet: 'side', colleague: 'side' };
  const ZONE_OBSTACLES = [
    ['desk', 'printer', 'banner', 'cabinet', 'colleague'],
    ['cone', 'crate', 'barrier', 'banner', 'spit', 'colleague'],
    ['crab', 'parasol', 'crate', 'spit', 'colleague'],
  ];
  const ZONE_COLLEAGUES = [['aline', 'eugenie', 'greg'], ['victor', 'cous', 'violaine'], ['victor', 'violaine', 'greg']];

  function addObject(kind, lane, z) {
    let mesh;
    if (kind === 'coin') mesh = coinMesh();
    else if (kind === 'rum' || kind === 'sandwich') mesh = pickupMesh(kind);
    else if (kind === 'colleague') {
      const list = ZONE_COLLEAGUES[zone];
      const who = list[Math.floor(ctx.random() * list.length)];
      mesh = ctx.character(who);
      mesh.rotation.y = Math.PI;
      mesh.userData.who = who;
      const file = box(0.5, 0.06, 0.38, '#fffbe8');
      file.position.set(0.45, 1.05, 0.3);
      mesh.add(file);
    } else mesh = obstacleMesh(kind);
    mesh.position.set(laneX(lane), kind === 'coin' ? 0.9 : 0, z);
    root.add(mesh);
    objects.push({ mesh, kind, lane, z, pass: PASS[kind], hit: false });
  }

  // Pattern generator: a row of obstacles and coins every few metres.
  function spawnRow(z) {
    if (-z > state.length - 8) return; // nothing past the beach finish line
    const progress = Math.min(1, -z / state.length);
    zone = ZONES.findIndex((zn) => progress < zn.until);
    const kinds = ZONE_OBSTACLES[zone];
    const r = ctx.random();
    const free = Math.floor(ctx.random() * 3);
    const blockers = r < 0.25 ? 2 : 1;
    const used = new Set([free]);
    for (let i = 0; i < blockers; i++) {
      let lane = Math.floor(ctx.random() * 3);
      if (used.has(lane)) lane = [0, 1, 2].find((l) => !used.has(l));
      used.add(lane);
      addObject(kinds[Math.floor(ctx.random() * kinds.length)], lane, z);
    }
    // Coins: a line in the free lane, sometimes an arc over an obstacle.
    for (let i = 0; i < 5; i++) addObject('coin', free, z + 3 + i * 1.6);
    state.coinsTotal += 5;
    if (ctx.random() < 0.06) addObject(ctx.random() < 0.55 ? 'rum' : 'sandwich', free, z - 4);
  }

  // Side scenery per zone, with friends cheering along the way.
  let cameoIndex = 0;
  const CAMEO_ORDER = ['cous', 'mamar', 'aline', 'greg', 'eugenie', 'victor', 'violaine', 'babar'];
  function spawnScenery(z) {
    const progress = Math.min(1, -z / state.length);
    const zi = ZONES.findIndex((zn) => progress < zn.until);
    for (const side of [-1, 1]) {
      let item = null;
      if (zi === 0) {
        const pick = ['desk', 'pottedPlant', 'kitchenCoffeeMachine', 'chairDesk', 'loungeSofa'][Math.floor(ctx.random() * 5)];
        item = models.get(pick, { height: pick === 'pottedPlant' ? 1.6 : 1 });
        if (ctx.random() < 0.5) {
          const wall = box(0.3, 3, 8, '#dfe7e4');
          wall.position.set(side * 6.5, 0, z);
          root.add(wall);
          scenery.push(wall);
          const win = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshBasicMaterial({ color: '#7fd0f5' }));
          win.position.set(side * 6.3, 1.8, z);
          win.rotation.y = -side * Math.PI / 2;
          root.add(win);
          scenery.push(win);
        }
      } else if (zi === 1) {
        const h = 4 + ctx.random() * 3;
        item = box(5, h, 5.5, HOUSE_COLORS[Math.floor(ctx.random() * HOUSE_COLORS.length)]);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.6, 4), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
        roof.position.y = h + 0.8;
        roof.rotation.y = Math.PI / 4;
        item.add(roof);
        for (const wy of [1.3, 3]) {
          const shutter = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), new THREE.MeshStandardMaterial({ color: '#2a6f4f' }));
          shutter.position.set(-side * 2.51, wy, 0);
          shutter.rotation.y = -side * Math.PI / 2;
          item.add(shutter);
        }
        item.position.set(side * 8.5, 0, z);
      } else {
        item = models.get('tree_palm', { height: 4 + ctx.random() * 2 }) || box(0.4, 4, 0.4, '#7a5230');
        if (side > 0) {
          const sea = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ color: '#1fa3c8', roughness: 0.2 }));
          sea.rotation.x = -Math.PI / 2;
          sea.position.set(26, 0.02, z);
          root.add(sea);
          scenery.push(sea);
        }
      }
      if (item) {
        if (zi !== 1) item.position.set(side * (5.2 + ctx.random() * 1.5), 0, z + ctx.random() * 3);
        root.add(item);
        scenery.push(item);
      }
    }
    // A friend on the roadside every ~40 m.
    if (Math.floor(-z / 40) !== Math.floor((-z - 10) / 40)) {
      const who = CAMEO_ORDER[cameoIndex++ % CAMEO_ORDER.length];
      const friend = ctx.character(who);
      const side = cameoIndex % 2 ? -1 : 1;
      friend.position.set(side * 4.4, 0, z);
      friend.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      friend.userData.state = who === 'babar' ? 'idle' : 'cheer';
      friend.userData.cameo = who;
      root.add(friend);
      scenery.push(friend);
    }
  }

  // --- Lifecycle --------------------------------------------------------------------
  function start() {
    ctx.music(132, [0, 4, 7, 9, 7, 4, 2, 4]);
    hud.setObjective(ctx.t('objective'));
    hud.banner(ctx.t('go'), 1800, '#ffd84a');
    hud.say(panda, ctx.tShared('quote_panda'), 2);
    for (let z = -25; z > -120; z -= 10) spawnRow(z);
    spawnZ = -120;
    for (let z = 10; z > -120; z -= 10) spawnScenery(z);
    sceneryZ = -120;
    sfx.whoosh();
  }

  function update(dt) {
    time += dt;
    const events = state.step(dt, {
      left: input.swipes.includes('left'),
      right: input.swipes.includes('right'),
      jump: input.swipes.includes('up') || input.pressed('action') || input.taps.length > 0,
      slide: input.swipes.includes('down'),
    });
    if (events.jumped) sfx.jump();
    if (events.landed) sfx.land();

    // Player and camera
    const z = -state.distance;
    panda.position.set(state.x, state.y, z);
    panda.rotation.y = Math.PI + (state.x - state.targetX()) * 0.15;
    panda.userData.animate(dt, state.y > 0.05 ? 'jump' : state.sliding > 0 ? 'hit' : 'run');
    panda.scale.y = state.sliding > 0 ? 0.6 : 1;
    camera.position.set(state.x * 0.5, 4.2, z + 7.5);
    camera.lookAt(state.x * 0.6, 1.2, z - 6);
    sun.position.set(8, 18, z + 6);
    sun.target.position.set(0, 0, z - 10);
    ground.position.z = z - 150;
    sides.position.z = z - 150;
    for (const l of laneLines) l.position.z = z - 150;

    // Romain: his distance behind is the gap meter.
    const romainZ = z + 2.5 + state.gap * 0.14;
    romain.position.set(state.x * 0.7, 0, romainZ);
    romain.rotation.y = Math.PI;
    romain.userData.animate(dt, 'run');
    romain.visible = state.gap < 60;
    hud.meter('gap', state.gap / 100, state.gap < 30 ? '#ff4d4d' : '#4caf50', ctx.t('romain_gap'));
    if (state.gap < 25 && ctx.random() < dt * 0.6) hud.say(romain, ctx.tShared('quote_romain'), 1.4);

    // Zone colours and banners
    const progress = state.distance / state.length;
    const zi = ZONES.findIndex((zn) => progress < zn.until);
    if (zi !== zone) {
      zone = zi;
      groundMat.color.set(ZONES[zone].ground);
      sideMat.color.set(ZONES[zone].side);
      hud.banner(ctx.t(ZONES[zone].key), 1500, '#fff');
    }
    hud.setScore(Math.floor(state.score()), '€ ');
    hud.setProgress(progress, `${Math.floor(progress * 100)}%`);

    // Spawning ahead, cleaning behind
    while (spawnZ > z - 120) { spawnRow(spawnZ); spawnZ -= Math.max(9, 14 - progress * 5); }
    while (sceneryZ > z - 120) { spawnScenery(sceneryZ); sceneryZ -= 10; }
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.z > z + 10) { root.remove(o.mesh); objects.splice(i, 1); continue; }
      if (o.kind === 'coin') o.mesh.rotation.y += dt * 4;
      if (o.kind === 'rum' || o.kind === 'sandwich') o.mesh.rotation.y += dt * 2;
      if (o.kind === 'colleague') o.mesh.userData.animate(dt, 'idle');
      if (o.hit || Math.abs(o.z - z) > 0.8 || o.lane !== state.lane) continue;
      if (o.kind === 'coin') {
        o.hit = true; root.remove(o.mesh);
        state.coins++;
        sfx.coin();
        if (state.coins % 10 === 0) hud.float(panda, `+${state.coins}`, '#ffd84a', 2.6);
      } else if (o.kind === 'rum' || o.kind === 'sandwich') {
        o.hit = true; root.remove(o.mesh);
        sfx.power();
        fx.burst(panda.position.clone().setY(1.5), 30);
        if (o.kind === 'rum') { state.boost(); hud.banner(ctx.t('rum'), 1200, '#ff9f1c'); }
        else { state.breathe(); hud.say(panda, ctx.t('sandwich'), 1.6); }
      } else if (!state.passes(o.pass)) {
        o.hit = true;
        if (state.turbo > 0) {
          fx.burst(o.mesh.position.clone().setY(1), 25);
          o.mesh.rotation.z = 1.4;
          continue;
        }
        if (!state.bump()) continue;
        sfx.hit();
        panda.userData.flash();
        fx.burst(panda.position.clone().setY(1.2), 18, { color: 0xffffff });
        if (o.kind === 'colleague') hud.say(o.mesh, ctx.t('file'), 1.5);
        else hud.say(panda, ctx.tShared('quote_panda'), 1.4);
      }
    }

    // Cameos animate and talk sometimes
    quoteTimer -= dt;
    for (let i = scenery.length - 1; i >= 0; i--) {
      const s = scenery[i];
      if (s.position.z > z + 12) { root.remove(s); scenery.splice(i, 1); continue; }
      if (s.userData.cameo) {
        s.userData.animate(dt, s.userData.state);
        if (quoteTimer <= 0 && Math.abs(s.position.z - z) < 14 && s.position.z < z) {
          hud.say(s, ctx.tShared(`quote_${s.userData.cameo}`), 2);
          quoteTimer = 2.5;
          if (s.userData.cameo === 'babar') {
            // Babar spits a puddle into Panda's lane from the roadside.
            addObject('spit', state.lane, z - 18);
          }
        }
      }
    }

    // End conditions
    if (state.gap <= 0) {
      romain.position.z = z + 1;
      hud.say(romain, ctx.tShared('quote_romain'), 3);
      ctx.fail({ score: state.score(), line: ctx.t('caught') });
    } else if (state.distance >= state.length) {
      panda.userData.animate(dt, 'cheer');
      fx.burst(panda.position.clone().setY(2), 80);
      ctx.finish({ score: state.score(), stars: state.stars(), line: ctx.t('arrived') });
    }
  }

  function dispose() {
    objects.length = 0;
    scenery.length = 0;
  }

  return { start, update, dispose, state };
}

export { LANES };
