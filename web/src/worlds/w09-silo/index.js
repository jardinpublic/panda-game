// World 9 - "Carottés dans l'Silo": the group's WhatsApp is named after the
// series Silo. Panda climbs the giant spiral staircase of a deep silo, one
// left/right foothold at a time, faster and faster. Episodes and carrots are
// bonuses, crates and Babar's spit are to be avoided, friends wait on the
// landings, and Victor "Croco" climbs behind with Romain: if Croco catches
// Panda, it is over. Score = height + episodes; stars on height.

import { createClimb, LANDING_EFFECTS, MAX_GAP, MODES } from './rules.js';

export const MODELS = ['platform'];

export const TEXTS = {
  en: {
    howto: ['Left / right arrows, or tap the left / right side: put your foot on the next step.', 'Wrong side or too slow = you slip down. Dodge crates 📦 and Babar\'s spit 💧.', 'Grab episodes 📺 and carrots 🥕. Don\'t let Croco catch you!'],
    objective: 'Climb the Silo before Croco catches you',
    ready: 'Do it FOR THE SILO!', go: 'CLIMB!',
    croco: 'Croco', pace: 'Pace', height: 'Height',
    croco_line: ['No rest for crocs!', 'Coming for you, Panda!'], romain_line: ['Do it FOR THE SILO!', 'Looool', 'Look at that!'],
    slip: 'Slip!', too_slow: 'Too slow!', crate: 'Crate!', spit: 'Ptooey!', babar_spit: 'Ptooey!',
    tv: '📺 One more episode!', carrot: '🥕 Carrot!', binge: 'BINGE x{n}!',
    greg_line: 'I haven\'t even started Silo!', cous_line: 'Your parcel! 20 € a parcel!', mamar_line: 'A sandwich for Croco! Aïe aïe aïe',
    eugenie_line: 'Bisous! Climb, Panda!', violaine_line: 'Awkward, that pace!', aline_line: 'Silo done!',
    push: 'Croco −{n}', faster: 'Faster!', fire: 'ON FIRE x{n}!', panda_line: 'Hoho, one more episode.',
    win: 'Silo done! {h} steps and {e} episodes.', lose: 'Croco caught you: no rest for crocs!',
  },
  fr: {
    howto: ['Flèches gauche / droite, ou touche le côté gauche / droit : pose le pied sur la marche suivante.', 'Mauvais côté ou trop lent = tu glisses. Évite les caisses 📦 et les crachats de Babar 💧.', 'Ramasse les épisodes 📺 et les carottes 🥕. Ne te fais pas rattraper par Croco !'],
    objective: 'Grimpe le Silo avant que Croco te rattrape',
    ready: 'Do it FOR THE SILO !', go: 'GRIMPE !',
    croco: 'Croco', pace: 'Rythme', height: 'Hauteur',
    croco_line: ['Pas d\'repos pour les crocos !', 'J\'arrive, Panda !'], romain_line: ['Do it FOR THE SILO !', 'Looool', 'R\'gard\' don\' !'],
    slip: 'Glissade !', too_slow: 'Trop lent !', crate: 'Caisse !', spit: 'Ptuih !', babar_spit: 'Ptuih !',
    tv: '📺 Encore un épisode !', carrot: '🥕 Carotte !', binge: 'BINGE x{n} !',
    greg_line: 'J\'ai même pas commencé Silo !', cous_line: 'Ton colis ! 20 € par colis !', mamar_line: 'Un sandwich pour Croco ! Aïe aïe aïe',
    eugenie_line: 'Bisous ! Monte, Panda !', violaine_line: 'Malaisant, ce rythme !', aline_line: 'Silo fini !',
    push: 'Croco −{n}', faster: 'Plus vite !', fire: 'EN FEU x{n} !', panda_line: 'Hoho, encore un épisode.',
    win: 'Silo fini ! {h} marches et {e} épisodes.', lose: 'Croco t\'a eu : pas d\'repos pour les crocos !',
  },
};

// Staircase geometry: step i turns DTH radians and rises RISE. 'R' = inner
// tread (towards the column, on Panda's right), 'L' = outer tread (by the wall).
const DTH = 0.3;
const RISE = 0.34;
const RADIUS = { R: 1.85, L: 3.35 };
const WALL_R = 4.5;
const AHEAD = 26;
const BEHIND = 10;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];

const CSS = `
.w09-strip { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
.w09-row { display: grid; grid-template-columns: 62px 62px; gap: 6px; }
.w09-row i { display: flex; align-items: center; justify-content: center; height: 30px; border-radius: 9px; border: 3px solid var(--ink); font-style: normal; font-size: 20px; background: #f6c453; }
.w09-row i.gap { background: rgba(0, 0, 0, 0.35); border-style: dashed; border-color: rgba(255, 255, 255, 0.5); }
.w09-row i.bad { background: #ff6b6b; }
.w09-row i.wide { grid-column: 1 / span 2; background: #ffe08a; }
.w09-row i img { height: 30px; }
.w09-row.next i { height: 40px; box-shadow: 0 0 0 3px #fff, 0 4px 0 3px var(--ink); }
.w09-row.next i.gap { box-shadow: none; }
.w09-row:not(.next) { opacity: 0.8; transform: scale(0.88); }
.w09-flash { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(circle, transparent 50%, rgba(255, 60, 60, 0.55)); }
`;

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const climb = createClimb({ mode: ctx.mode, random: ctx.random });
  const tune = MODES[ctx.mode] || MODES.normal;
  let time = 0;
  let ready = 2.4; // intro before the clock starts
  let ended = false;
  let shake = 0;
  let flash = 0;
  let pending = [];
  let pandaSide = 'R';
  let lastSpoken = 0;
  let musicStage = 0;
  let lastEpisodesBanner = 0;
  let stripKey = '';
  const views = new Map(); // step index -> { group, treads, item, itemKind, dropT, friend }
  const tmp = new THREE.Vector3();
  const look = new THREE.Vector3();

  ctx.setupSky({ top: '#ffd27a', bottom: '#ff9e6b', fog: 0xffc58a, fogNear: 7, fogFar: 34 });
  const sun = ctx.addLights(root);
  const fill = new THREE.PointLight(0xfff0d0, 18, 14, 1.6);
  root.add(fill);

  // --- Silo: painted wall, central column, ground floor ------------------------
  function bandTexture(colors, rows, w = 256, h = 256, portholes = false) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const bh = h / colors.length;
    colors.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * bh, w, bh); });
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < rows; i++) g.fillRect(0, (i * h) / rows, w, 3);
    if (portholes) {
      for (let x = 32; x < w; x += 128) {
        g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(x, h * 0.3, 22, 0, 7); g.fill();
        g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(x, h * 0.3, 15, 0, 7); g.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  const wallTex = bandTexture(['#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'], 8, 256, 256, true);
  wallTex.repeat.set(6, 15);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(WALL_R, WALL_R, 60, 48, 1, true),
    new THREE.MeshStandardMaterial({ map: wallTex, side: THREE.BackSide, roughness: 0.9 }));
  root.add(wall);
  const colTex = bandTexture(['#264653', '#2a9d8f'], 2);
  colTex.repeat.set(2, 30);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 60, 24), new THREE.MeshStandardMaterial({ map: colTex, roughness: 0.6 }));
  root.add(column);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(WALL_R, WALL_R, 0.5, 48), new THREE.MeshStandardMaterial({ color: '#c98b52', roughness: 1 }));
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  root.add(floor);
  // A Silo poster on the floor wall: a big carrot.
  const WALL_PERIOD = 4; // texture repeats every 4 units: move the wall by whole periods

  // --- Shared step parts --------------------------------------------------------------
  const treadGeo = { R: new THREE.BoxGeometry(1.5, 0.18, 0.52), L: new THREE.BoxGeometry(1.5, 0.18, 0.95) };
  const landingGeo = new THREE.BoxGeometry(3.1, 0.2, 1.5);
  const treadMats = [new THREE.MeshStandardMaterial({ color: '#d9d4c7', roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: '#c4bfb3', roughness: 0.8 })];
  const nextMat = new THREE.MeshStandardMaterial({ color: '#ffd84a', emissive: '#a06a00', emissiveIntensity: 0.6, roughness: 0.5 });
  const landingMat = new THREE.MeshStandardMaterial({ color: '#ffb703', roughness: 0.6 });
  const stubGeo = new THREE.BoxGeometry(0.25, 0.12, 0.4);
  const stubMat = new THREE.MeshStandardMaterial({ color: '#7d756a' });
  const shadowGeo = new THREE.CircleGeometry(0.42, 18);
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false });
  const puddleGeo = new THREE.CircleGeometry(0.5, 20);
  const spitMat = new THREE.MeshStandardMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.85, roughness: 0.05 });
  const dropGeo = new THREE.SphereGeometry(0.11, 8, 6);
  const railMat = new THREE.MeshStandardMaterial({ color: '#e76f51', roughness: 0.5 });
  const railGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6);

  function tvMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.44, 0.14), new THREE.MeshStandardMaterial({ color: '#3a2e4a' }));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.32), new THREE.MeshBasicMaterial({ color: '#58e1ff' }));
    screen.position.z = 0.075;
    const play = new THREE.Mesh(new THREE.CircleGeometry(0.09, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    play.position.z = 0.08;
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), new THREE.MeshStandardMaterial({ color: '#222' }));
    ant.position.set(0.1, 0.32, 0); ant.rotation.z = -0.5;
    g.add(body, screen, play, ant);
    return g;
  }
  function carrotMesh() {
    const g = new THREE.Group();
    const root_ = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 12), new THREE.MeshStandardMaterial({ color: '#ff8c1a' }));
    root_.rotation.z = Math.PI;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), new THREE.MeshStandardMaterial({ color: '#3fbf4f' }));
    leaves.position.y = 0.42;
    g.add(root_, leaves);
    return g;
  }
  function crateMesh() {
    const m = models.get('crate', { height: 0.62 });
    if (m) return m;
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), new THREE.MeshStandardMaterial({ color: '#c68a4a' }));
    b.position.y = 0.31;
    g.add(b);
    return g;
  }
  function prop(kind) {
    const g = new THREE.Group();
    if (kind === 'parcel') {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.4), new THREE.MeshStandardMaterial({ color: '#c8975a' }));
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.42), new THREE.MeshStandardMaterial({ color: '#f1e3b0' }));
      g.add(box, tape);
    } else if (kind === 'sandwich') {
      let y = 0;
      for (const [color, h] of [['#e8b866', 0.08], ['#6cb84a', 0.04], ['#c9433b', 0.04], ['#e8b866', 0.08]]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.22), new THREE.MeshStandardMaterial({ color }));
        l.position.y = y; y += h; g.add(l);
      }
    } else if (kind === 'cake') {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.24, 18), new THREE.MeshStandardMaterial({ color: '#f7c6d9' }));
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: '#d00000' }));
      cherry.position.y = 0.16;
      g.add(c, cherry);
    } else if (kind === 'surf') {
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.1, 4, 10), new THREE.MeshStandardMaterial({ color: '#4cc9f0' }));
      b.scale.z = 0.3;
      g.add(b);
    } else if (kind === 'remote') {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: '#222' }));
      g.add(r);
    } else if (kind === 'heart') {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff4d6d' }));
      h.position.y = 0.7;
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), new THREE.MeshStandardMaterial({ color: '#fff' }));
      string.position.y = 0.3;
      g.add(h, string);
    }
    return g;
  }
  const PROPS = { cous: 'parcel', mamar: 'sandwich', greg: 'cake', violaine: 'surf', aline: 'remote', eugenie: 'heart' };

  // Friends on landings (one instance each, reused as landings come and go).
  const friendChars = {};
  function friendChar(id) {
    if (!friendChars[id]) {
      const c = ctx.character(id, { scale: 0.85 });
      const p = prop(PROPS[id]);
      p.position.set(0, -0.62, 0.22);
      c.userData.parts.armR.add(p);
      friendChars[id] = c;
    }
    return friendChars[id];
  }

  const stepAngle = (i) => i * DTH;
  const stepY = (i) => (i < 0 ? -0.25 : i * RISE);
  function placeOnStep(obj, i, r, y = 0) {
    const a = stepAngle(i);
    obj.position.set(Math.cos(a) * r, stepY(i) + y, Math.sin(a) * r);
    obj.rotation.y = -a;
  }

  function buildStep(i) {
    const st = climb.stepAt(i);
    const group = new THREE.Group();
    group.position.y = stepY(i);
    group.rotation.y = -stepAngle(i);
    const v = { group, treads: {}, item: null, itemSide: null, dropT: -1, drops: null, friend: null, st };
    const mat = treadMats[i % 2];
    if (st.type === 'landing') {
      const plank = new THREE.Mesh(landingGeo, landingMat);
      plank.position.x = 2.6;
      plank.receiveShadow = true;
      group.add(plank);
      v.treads.L = plank; v.treads.R = plank;
      const friend = friendChar(st.friend);
      friend.position.set(4.0, 0.1, 0.45);
      friend.rotation.y = -Math.PI / 2 - 0.5;
      group.add(friend);
      v.friend = friend;
    } else {
      for (const side of ['L', 'R']) {
        const present = st.type !== 'single' || st.side === side;
        if (!present) {
          const stub = new THREE.Mesh(stubGeo, stubMat);
          stub.position.set(side === 'L' ? 4.3 : 1.15, 0, 0);
          group.add(stub);
          continue;
        }
        const t = new THREE.Mesh(treadGeo[side], mat);
        t.position.x = RADIUS[side];
        t.receiveShadow = true;
        t.castShadow = true;
        group.add(t);
        v.treads[side] = t;
      }
      // Rail post by the wall every other step.
      if (i % 2 === 0) {
        const post = new THREE.Mesh(railGeo, railMat);
        post.position.set(4.2, 0.5, 0);
        group.add(post);
      }
      if (st.type === 'bonus') {
        const item = st.item === 'tv' ? tvMesh() : carrotMesh();
        item.position.set(RADIUS[st.side], 0.75, 0);
        item.visible = !st.taken;
        group.add(item);
        v.item = item; v.itemSide = st.side;
      } else if (st.type === 'hazard') {
        const bad = st.side === 'L' ? 'R' : 'L';
        v.itemSide = bad;
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(RADIUS[bad], 0.1, 0);
        group.add(shadow);
        if (st.item === 'crate') {
          const crate = crateMesh();
          crate.position.set(RADIUS[bad], 7, 0);
          crate.visible = false;
          group.add(crate);
          v.item = crate;
        } else {
          const puddle = new THREE.Mesh(puddleGeo, spitMat);
          puddle.rotation.x = -Math.PI / 2;
          puddle.position.set(RADIUS[bad], 0.1, 0);
          group.add(puddle);
          v.item = puddle;
          v.drops = [0, 0.5].map((phase) => {
            const d = new THREE.Mesh(dropGeo, spitMat);
            d.position.set(RADIUS[bad], 4, 0);
            d.userData.phase = phase;
            group.add(d);
            return d;
          });
        }
      }
    }
    root.add(group);
    views.set(i, v);
    return v;
  }

  // --- Characters -------------------------------------------------------------------
  const panda = ctx.character('panda', { scale: 0.85 });
  root.add(panda);
  const victor = ctx.character('victor', { scale: 0.85 });
  const romain = ctx.character('romain', { scale: 0.85 });
  root.add(victor, romain);
  const babar = ctx.character('babar', { scale: 0.85 });
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 1.2), railMat);
  ledge.position.y = -0.08;
  babar.add(ledge);
  root.add(babar);
  let babarStep = 9;
  const babarDrop = new THREE.Mesh(dropGeo, spitMat);
  root.add(babarDrop);
  // The gang cheering on the ground floor at the start (all ten friends appear here or above).
  const floorGang = [];
  ['aline', 'eugenie', 'violaine', 'greg', 'mamar', 'cous'].forEach((id, k) => {
    const c = ctx.character(id, { scale: 0.85 });
    const a = -2.75 + k * 0.28;
    c.position.set(Math.cos(a) * 3.3, -0.25, Math.sin(a) * 3.3);
    c.rotation.y = Math.atan2(-c.position.x, -c.position.z);
    root.add(c);
    floorGang.push(c);
  });

  // Panda's displayed position tweens from one step to the next with a hop.
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  let hopT = 1;
  let fromAngle = 0;
  let toAngle = 0;
  let dispAngle = 0;
  function pandaTarget(i, side) {
    const a = stepAngle(i);
    const r = RADIUS[side];
    to.set(Math.cos(a) * r, stepY(i) + 0.1, Math.sin(a) * r);
    toAngle = a;
  }
  function moveTo(i, side) {
    from.copy(panda.position);
    fromAngle = dispAngle;
    pandaTarget(i, side);
    hopT = 0;
  }
  pandaTarget(0, pandaSide);
  panda.position.copy(to);

  // --- DOM: the next-steps strip ------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = CSS;
  const strip = document.createElement('div');
  strip.className = 'w09-strip';
  const flashEl = document.createElement('div');
  flashEl.className = 'w09-flash';
  const ICON = { tv: '📺', carrot: '🥕', crate: '📦', spit: '💧' };
  const castUrl = (id) => `${import.meta.env.BASE_URL}cast/${id}.svg`;
  function cell(st, side) {
    if (st.type === 'single') return st.side === side ? '<i></i>' : '<i class="gap"></i>';
    if (st.type === 'hazard') return st.side === side ? '<i></i>' : `<i class="bad">${ICON[st.item]}</i>`;
    if (st.type === 'bonus') return st.side === side && !st.taken ? `<i>${ICON[st.item]}</i>` : '<i></i>';
    return '';
  }
  function renderStrip() {
    const key = `${climb.pos}|${climb.next().taken ? 1 : 0}`;
    if (key === stripKey) return;
    stripKey = key;
    let html = '';
    for (let k = 4; k >= 1; k--) {
      const st = climb.stepAt(climb.pos + k);
      const inner = st.type === 'landing' ? `<i class="wide"><img src="${castUrl(st.friend)}" alt=""></i>` : cell(st, 'L') + cell(st, 'R');
      html += `<div class="w09-row ${k === 1 ? 'next' : ''}">${inner}</div>`;
    }
    strip.innerHTML = html;
  }

  // --- Feedback -----------------------------------------------------------------------
  function sayFriend(id, key, secs = 1.8) {
    hud.say(friendChars[id], ctx.t(key), secs, 2.2);
  }

  function onPress(side) {
    const ev = climb.press(side);
    if (ev.ignored) return;
    if (ev.climbed) {
      pandaSide = ev.step.type === 'single' || ev.step.type === 'hazard' ? ev.step.side : side;
      moveTo(climb.pos, pandaSide);
      const n = SCALE[climb.streak % SCALE.length] + (Math.floor(climb.streak / SCALE.length) % 2) * 12;
      sfx.note(262 * 2 ** (n / 12));
      if (ev.pickup) {
        const v = views.get(climb.pos);
        if (v?.item) v.item.visible = false;
        if (ev.pickup === 'tv') {
          sfx.coin();
          hud.float(panda, ctx.t('tv'), '#58e1ff', 2.2);
          fx.burst(tmp.copy(to).setY(to.y + 1.2), 24, { color: 0x58e1ff });
          if (climb.episodes % 5 === 0 && climb.episodes > lastEpisodesBanner) {
            lastEpisodesBanner = climb.episodes;
            hud.banner(ctx.t('binge', { n: climb.episodes }), 1200, '#58e1ff');
            hud.say(panda, ctx.t('panda_line'), 1.6);
            sfx.hoho();
          }
        } else {
          sfx.power();
          hud.float(panda, ctx.t('carrot'), '#ff8c1a', 2.2);
          fx.burst(tmp.copy(to).setY(to.y + 1.2), 24, { color: 0xff8c1a });
        }
      }
      if (ev.landing) {
        const fxs = LANDING_EFFECTS[ev.landing];
        sayFriend(ev.landing, `${ev.landing}_line`, 2.2);
        friendChars[ev.landing].userData.flash();
        sfx.power();
        fx.burst(tmp.copy(to).setY(to.y + 1.5), 50);
        if (fxs.push) hud.float(victor, ctx.t('push', { n: fxs.push }), '#8af27a', 2.4);
        if (fxs.points) hud.float(panda, `+${fxs.points}`, '#ffd84a', 2.6);
      }
      if (climb.streak > 0 && climb.streak % 15 === 0) {
        hud.banner(ctx.t('fire', { n: climb.streak }), 1000, '#ff9f1c');
        fx.burst(tmp.copy(to).setY(to.y + 1), 40);
      }
      if (climb.pos % 10 === 0 && climb.pos === climb.best) hud.float(panda, `⬆ ${climb.pos}`, '#ffffff', 2.8);
    } else if (ev.slipped || ev.hit) {
      onSlip(ev.hit);
    }
  }

  function onSlip(hit) {
    const st = climb.stepAt(climb.pos);
    if (st.type === 'single' || st.type === 'hazard') pandaSide = st.side;
    moveTo(climb.pos, pandaSide);
    panda.userData.flash();
    shake = hit ? 0.45 : 0.25;
    flash = hit ? 0.6 : 0.35;
    if (hit) {
      sfx.hit();
      hud.banner(ctx.t(hit === 'crate' ? 'crate' : 'spit'), 800, '#ff4d6d');
      if (hit === 'spit') hud.say(babar, ctx.t('babar_spit'), 1.4);
      fx.burst(tmp.copy(panda.position).setY(panda.position.y + 1.3), 26, { color: hit === 'spit' ? 0xbfe8ff : 0xc68a4a });
    } else {
      sfx.land();
      hud.float(panda, ctx.t('slip'), '#ff6b6b', 2.4);
    }
  }

  // --- Lifecycle ----------------------------------------------------------------------
  function start() {
    hud.el.style.pointerEvents = 'none'; // let taps reach the canvas; the buttons stay clickable
    document.head.appendChild(style);
    hud.el.appendChild(strip);
    hud.el.appendChild(flashEl);
    hud.buttons([
      { id: 'l', label: '⬅', side: 'left', onDown: () => pending.push('L') },
      { id: 'r', label: '➡', side: 'right', onDown: () => pending.push('R') },
    ]);
    hud.setObjective(ctx.t('objective'));
    hud.banner(ctx.t('ready'), 2000, '#ffd84a');
    hud.say(romain, ctx.t('romain_line'), 2.2);
    floorGang.forEach((c, k) => { if (k % 2 === 0) hud.say(c, ctx.tShared(`quote_${['aline', 'eugenie', 'violaine', 'greg', 'mamar', 'cous'][k]}`), 2.2); });
    ctx.music(112, [0, 3, 7, 10, 12, 10, 7, 3]);
    renderStrip();
  }

  function update(dt) {
    time += dt;
    const playing = !ended && ready <= 0;
    if (!ended && ready > 0) {
      ready -= dt;
      if (ready <= 0) { hud.banner(ctx.t('go'), 900, '#8af27a'); sfx.whoosh(); }
      pending.length = 0;
    }
    if (playing) {
      if (input.pressed('left')) pending.push('L');
      if (input.pressed('right')) pending.push('R');
      if (input.pressed('touch')) pending.push(input.pointer.x < 0 ? 'L' : 'R');
      for (const side of pending) onPress(side);
      pending.length = 0;
      const ev = climb.step(dt);
      if (ev.tooSlow) {
        if (ev.slipped) onSlip(null);
        hud.float(panda, ctx.t('too_slow'), '#ff6b6b', 2.8);
      }
      // Music speeds up with the run.
      const stageNow = climb.time > 46 ? 2 : climb.time > 23 ? 1 : 0;
      if (stageNow !== musicStage) {
        musicStage = stageNow;
        ctx.music([112, 128, 144][stageNow], [0, 3, 7, 10, 12, 10, 7, 3]);
        hud.banner(ctx.t('faster'), 900, '#ff9f1c');
      }
      if (ev.caught) {
        ended = true;
        hud.say(victor, ctx.t('croco_line'), 3);
        shake = 0.6;
        ctx.fail({ score: climb.score(), line: ctx.t('lose') });
      } else if (ev.timeUp) {
        ended = true;
        fx.burst(tmp.copy(panda.position).setY(panda.position.y + 2), 120);
        hud.say(panda, ctx.tShared('quote_panda'), 3);
        ctx.finish({ score: climb.score(), stars: climb.stars(), line: ctx.t('win', { h: climb.best, e: climb.episodes }) });
      }
      // The gang behind shouts when Croco gets close.
      lastSpoken -= dt;
      if (lastSpoken <= 0 && climb.gap() < 5) {
        lastSpoken = 2.6;
        if (ctx.random() < 0.5) hud.say(victor, ctx.t('croco_line'), 1.6); else hud.say(romain, ctx.t('romain_line'), 1.6);
      }
    }

    // HUD
    const gap = climb.gap();
    hud.setScore(climb.score(), '⭐ ');
    hud.setProgress(Math.min(1, climb.time / climb.duration), `${Math.max(0, Math.ceil(climb.duration - climb.time))} s`);
    hud.meter('croco', Math.min(1, gap / MAX_GAP), gap < 4 ? '#ff4d4d' : gap < 8 ? '#ffb703' : '#4caf50', `🐊 ${ctx.t('croco')}`);
    const pace = playing ? 1 - climb.idle / climb.window() : 1;
    hud.meter('pace', pace, pace < 0.3 ? '#ff4d4d' : '#58e1ff', `⏱ ${ctx.t('pace')}`);
    hud.meter('height', climb.best / tune.stars[1], '#ffd84a', `⬆ ${climb.best} / ${tune.stars[1]}`);
    renderStrip();

    // Stairs window: build ahead, drop behind.
    const lo = Math.max(0, climb.pos - BEHIND);
    const hi = climb.pos + AHEAD;
    for (const [i, v] of views) {
      if (i < lo || i > hi) { root.remove(v.group); if (v.friend) v.group.remove(v.friend); views.delete(i); }
    }
    for (let i = lo; i <= hi; i++) if (!views.has(i)) buildStep(i);
    const nextIdx = climb.pos + 1;
    for (const [i, v] of views) {
      const st = v.st;
      if (st.type !== 'landing') {
        for (const side of ['L', 'R']) {
          const tr = v.treads[side];
          if (tr) tr.material = i === nextIdx ? nextMat : treadMats[i % 2];
        }
      } else v.treads.L.material = i === nextIdx ? nextMat : landingMat;
      if (v.item && st.type === 'bonus') { v.item.rotation.y += dt * 2.5; v.item.position.y = 0.75 + Math.sin(time * 3 + i) * 0.08; }
      if (st.type === 'hazard' && st.item === 'crate') {
        if (v.dropT < 0 && i <= climb.pos + 6) { v.dropT = 0; v.item.visible = true; }
        if (v.dropT >= 0 && v.dropT < 1) {
          v.dropT = Math.min(1, v.dropT + dt / 0.4);
          v.item.position.y = 0.09 + (1 - v.dropT * v.dropT) * 7;
          if (v.dropT >= 1 && Math.abs(i - climb.pos) < 8) { sfx.land(); fx.burst(tmp.set(0, 0, 0).setFromMatrixPosition(v.item.matrixWorld), 10, { color: 0xc68a4a, speed: 3 }); }
        }
      }
      if (v.drops) {
        for (const d of v.drops) {
          const k = (time * 0.9 + d.userData.phase) % 1;
          d.position.y = 4 - k * 3.9;
          d.visible = k < 0.97;
        }
      }
      if (v.friend) v.friend.userData.animate(dt, i <= climb.best ? 'cheer' : 'idle');
    }

    // Babar leans over a ledge above the next spit hazard.
    for (let i = climb.pos + 1; i <= climb.pos + 10; i++) {
      const st = climb.stepAt(i);
      if (st.type === 'hazard' && st.item === 'spit') { babarStep = i; break; }
    }
    const ba = stepAngle(babarStep);
    const bad = climb.stepAt(babarStep).side === 'L' ? 'R' : 'L';
    babar.position.set(Math.cos(ba) * 4.0, stepY(babarStep) + 4.2, Math.sin(ba) * 4.0);
    babar.rotation.y = Math.atan2(-babar.position.x, -babar.position.z);
    babar.userData.animate(dt, 'idle');
    const bk = (time * 0.9) % 1;
    babarDrop.position.set(Math.cos(ba) * RADIUS[bad], stepY(babarStep) + 4.1 - bk * 3.9, Math.sin(ba) * RADIUS[bad]);
    babarDrop.visible = climb.stepAt(babarStep).item === 'spit' && bk < 0.97;

    // Panda hop
    hopT = Math.min(1, hopT + dt / 0.12);
    panda.position.lerpVectors(from, to, hopT);
    panda.position.y += Math.sin(hopT * Math.PI) * 0.35;
    dispAngle = fromAngle + (toAngle - fromAngle) * hopT;
    panda.rotation.y = -dispAngle;
    panda.userData.animate(dt, ended && !climb.won ? 'hit' : ended ? 'cheer' : hopT < 1 ? 'jump' : ready > 0 ? 'idle' : 'run');

    // Croco and Romain climb behind.
    const c = climb.chaser;
    const ca = c * DTH;
    victor.position.set(Math.cos(ca) * 2.6, stepY(Math.floor(c)) + 0.1, Math.sin(ca) * 2.6);
    victor.rotation.y = -ca;
    victor.userData.animate(dt, ended && !climb.won ? 'cheer' : 'run');
    const rc = c - 2.5;
    const ra = rc * DTH;
    romain.position.set(Math.cos(ra) * 2.4, stepY(Math.floor(rc)) + 0.1, Math.sin(ra) * 2.4);
    romain.rotation.y = -ra;
    romain.userData.animate(dt, 'run');
    for (const g of floorGang) g.userData.animate(dt, 'cheer');

    // Camera: behind and above Panda, looking ahead up the spiral (intro: the gang below).
    const a = dispAngle;
    const py = panda.position.y;
    const intro = Math.max(0, Math.min(1, ready / 1.6));
    tmp.set(Math.cos(a - 0.8) * 3.4, py + 3.1, Math.sin(a - 0.8) * 3.4);
    look.set(Math.cos(a + 0.5) * 2.3, py + 1.0, Math.sin(a + 0.5) * 2.3);
    if (intro > 0) {
      tmp.lerp(new THREE.Vector3(Math.cos(-0.1) * 3.9, 3.0, Math.sin(-0.1) * 3.9), intro);
      look.lerp(new THREE.Vector3(Math.cos(-2.0) * 3.3, 1.1, Math.sin(-2.0) * 3.3), intro);
    }
    shake = Math.max(0, shake - dt);
    if (shake > 0) { tmp.x += Math.sin(time * 70) * shake * 0.3; tmp.y += Math.cos(time * 61) * shake * 0.3; }
    camera.position.copy(tmp);
    camera.lookAt(look);
    fill.position.set(tmp.x, tmp.y + 0.5, tmp.z);
    sun.position.set(panda.position.x + 3, py + 14, panda.position.z + 2);
    sun.target.position.copy(panda.position);
    const base = Math.floor(py / WALL_PERIOD) * WALL_PERIOD;
    wall.position.y = base;
    column.position.y = base;
    flash = Math.max(0, flash - dt);
    flashEl.style.opacity = String(Math.min(1, flash * 1.6));
  }

  function dispose() {
    style.remove();
    strip.remove();
    flashEl.remove();
    views.clear();
    wallTex.dispose();
    colTex.dispose();
  }

  return { start, update, dispose, climb };
}
