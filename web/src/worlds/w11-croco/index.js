// World 11 - "Georges, le croco de la Lézarde": the final boss. Georges is a
// big (vegan!) crocodile in the Lézarde river at Lamentin. Panda and Victor
// ("Croco") wrestle him barehanded, Dundee style: dodge his tail swipes and
// lunges, feed him vegetables when he is tired, then pin him with a
// quick-time sequence. Nobody gets hurt: Georges gets tired, calmed, pinned,
// then joins the party. The whole gang watches and helps from the bank.

import { createCrocoState, crocoXAt, BANK, FLIGHT_TIME, STRIKE_WINDOW, RECOVER_TIME } from './rules.js';

export const MODELS = ['nature'];

export const TEXTS = {
  en: {
    howto: [
      'Dodge Georges: jump (Up / Space / swipe up) over his tail, step aside (arrows) from his lunges.',
      'When he is tired, throw veggies into his mouth (Space / tap): he is vegan!',
      'Then wrestle like Dundee: swipe or press the arrow shown before time runs out.',
    ],
    intro: 'GEORGES OF THE LÉZARDE!',
    georges: 'Georges',
    obj_dodge: 'Dodge Georges until he gets tired',
    obj_feed: 'Feed him veggies: {n}/{need}',
    obj_wrestle: 'Pin him! Follow the arrows',
    phase_dodge: 'Round {n}: DODGE!',
    tired: 'Georges is tired!',
    feed: 'FEED HIM! (he\'s vegan)',
    calmed: 'Georges is calm… WRESTLE!',
    recover: 'Georges got his breath back!',
    break_free: 'He wriggles free!',
    wrong: 'Oops! Back to the bank!',
    jump_hint: '⤒ JUMP!',
    move_hint: '⇆ MOVE!',
    chomp: 'CHOMP!',
    ouch: ['Ouch!', 'Hoho… ouch.'],
    yum: ['Crunch!', 'Yum!', 'Mmm, veggies!'],
    splash: 'Splash!',
    pin: ['PINNED!', 'Like Dundee!', 'Hold him!'],
    cous_carrot: 'Organic carrots, Georges!',
    mamar_sandwich: 'Aïe aïe aïe aïe… a sandwich for you, Panda!',
    romain_film: 'Look at that! I\'m filming!',
    babar_spit: 'Take that, Georges!',
    victor_dundee: ['Like Dundee, Panda!', 'Get to work, Panda!', 'Stylish!'],
    victory: 'GEORGES JOINS THE PARTY!',
    party: ['Hoho! Party with Georges!', 'Veggie barbecue tonight!'],
    end_win: 'Georges is pinned, calm, and now the gang\'s mascot. Vegan BBQ at the Lézarde!',
    end_lose: 'Georges wins this round… and takes a well-deserved nap.',
  },
  fr: {
    howto: [
      'Esquive Georges : saute (Haut / Espace / glisse vers le haut) sa queue, écarte-toi (flèches) de ses attaques.',
      'Quand il est fatigué, lance des légumes dans sa gueule (Espace / touche) : il est vegan !',
      'Puis lutte comme Dundee : glisse ou appuie sur la flèche indiquée avant la fin du temps.',
    ],
    intro: 'GEORGES DE LA LÉZARDE !',
    georges: 'Georges',
    obj_dodge: 'Esquive Georges jusqu\'à ce qu\'il fatigue',
    obj_feed: 'Nourris-le de légumes : {n}/{need}',
    obj_wrestle: 'Plaque-le ! Suis les flèches',
    phase_dodge: 'Manche {n} : ESQUIVE !',
    tired: 'Georges est fatigué !',
    feed: 'NOURRIS-LE ! (il est vegan)',
    calmed: 'Georges est calme… À LA LUTTE !',
    recover: 'Georges a repris son souffle !',
    break_free: 'Il se dégage !',
    wrong: 'Oups ! Retour sur la berge !',
    jump_hint: '⤒ SAUTE !',
    move_hint: '⇆ BOUGE !',
    chomp: 'CHOMP !',
    ouch: ['Aïe !', 'Hoho… aïe.'],
    yum: ['Crounch !', 'Miam !', 'Mmm, des légumes !'],
    splash: 'Plouf !',
    pin: ['PLAQUÉ !', 'Comme Dundee !', 'Tiens-le !'],
    cous_carrot: 'Carottes bio, Georges !',
    mamar_sandwich: 'Aïe aïe aïe aïe… un sandwich pour toi, Panda !',
    romain_film: 'R\'gard\' don\' ! Je filme !',
    babar_spit: 'Tiens, Georges !',
    victor_dundee: ['Comme Dundee, Panda !', 'Bosse don\', Panda !', 'Stylé !'],
    victory: 'GEORGES REJOINT LA FÊTE !',
    party: ['Hoho ! La fête avec Georges !', 'Barbecue vegan ce soir !'],
    end_win: 'Georges est plaqué, calmé, et devient la mascotte de la bande. Barbecue vegan à la Lézarde !',
    end_lose: 'Georges gagne cette manche… et s\'offre une bonne sieste.',
  },
};

const CSS = `
.w11-qte { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); pointer-events: none; display: none; text-align: center; }
.w11-qte.show { display: block; }
.w11-arrow { width: 132px; height: 132px; border-radius: 50%; background: rgba(255,255,255,.92); border: 6px solid #2f9e44;
  font-size: 84px; line-height: 118px; font-weight: 900; color: #1b4332; box-shadow: 0 6px 0 rgba(0,0,0,.3); margin: 0 auto; }
.w11-arrow.pop { animation: w11pop .2s ease-out; }
.w11-timer { width: 200px; height: 14px; border-radius: 7px; background: rgba(0,0,0,.5); margin: 12px auto 0; overflow: hidden; border: 2px solid #fff; }
.w11-timer i { display: block; height: 100%; background: #ffd84a; }
@keyframes w11pop { from { transform: scale(1.5); } to { transform: scale(1); } }
`;
const ARROWS = { left: '←', right: '→', up: '↑', down: '↓' };
const PANDA_Z = 0.8;
const VEGGIE_COLORS = ['#ff8c1a', '#4caf50', '#e63946', '#f4d35e'];

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const state = createCrocoState({ mode: ctx.mode, random: ctx.random });
  const cfg = state.cfg;
  const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // --- Scene ---------------------------------------------------------------------------
  ctx.setupSky({ top: '#2e8fd6', bottom: '#d9f7d0', fog: 0xcfeccb, fogNear: 25, fogFar: 70 });
  const sun = ctx.addLights(root);

  function mat(color, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
  }
  function mesh(geo, color, extra) {
    const m = new THREE.Mesh(geo, mat(color, extra));
    m.castShadow = true;
    return m;
  }

  const waterMat = mat('#2f9a8a', { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(90, 22, 30, 8), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.15, -12.2);
  water.receiveShadow = true;
  root.add(water);
  const waterPos = water.geometry.attributes.position;
  const waterBase = Float32Array.from(waterPos.array);
  const riverBed = new THREE.Mesh(new THREE.PlaneGeometry(90, 22), mat('#355e3b'));
  riverBed.rotation.x = -Math.PI / 2;
  riverBed.position.set(0, -0.8, -12.2);
  root.add(riverBed);
  const bank = new THREE.Mesh(new THREE.BoxGeometry(90, 1, 16), mat('#7cbf4f', { roughness: 1 }));
  bank.position.set(0, -0.5, 6.8);
  bank.receiveShadow = true;
  root.add(bank);
  const mud = new THREE.Mesh(new THREE.BoxGeometry(90, 1, 1.8), mat('#8a6a43', { roughness: 1 }));
  mud.position.set(0, -0.52, -0.5);
  mud.receiveShadow = true;
  root.add(mud);
  const farBank = new THREE.Mesh(new THREE.BoxGeometry(90, 1.2, 12), mat('#4f9d3a', { roughness: 1 }));
  farBank.position.set(0, -0.3, -29);
  root.add(farBank);

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
  function mangrove() {
    const g = new THREE.Group();
    const rootMat = mat('#6b4a2b');
    for (let i = 0; i < 5; i++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5 + (i % 3) * 0.2, 0.06, 6, 14, Math.PI), rootMat);
      arc.rotation.y = i * 0.7;
      arc.position.y = -0.1;
      g.add(arc);
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 7), rootMat);
    trunk.position.y = 1.4;
    g.add(trunk);
    const crown = mesh(new THREE.SphereGeometry(1.1, 10, 8), '#2d6a4f');
    crown.position.y = 2.8;
    crown.scale.y = 0.7;
    g.add(crown);
    return g;
  }
  // Jungle on both banks
  for (let i = 0; i < 16; i++) {
    const x = -30 + i * 4 + (i % 2) * 1.3;
    const p = palm(5 + (i % 3) * 1.2);
    p.position.set(x, 0.3, -25 - (i % 3) * 2);
    root.add(p);
    if (i % 2 === 0) {
      const m = mangrove();
      m.position.set(x + 1.5, 0, -22.5);
      root.add(m);
    }
  }
  for (const x of [-14, -10, 10, 14, -18, 18]) {
    const m = mangrove();
    m.position.set(x, 0, -1.6);
    root.add(m);
    const p = palm(5.5);
    p.position.set(x * 1.1, 0, 9 + Math.abs(x) * 0.1);
    root.add(p);
  }
  for (let i = 0; i < 10; i++) {
    const b = models.get(i % 2 ? 'plant_bush' : 'flower_yellowA', { height: i % 2 ? 1 : 0.5 });
    if (b) { b.position.set(-12 + i * 2.7, 0, 7.5 + (i % 3)); root.add(b); }
  }
  const lilies = [];
  for (let i = 0; i < 9; i++) {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12, 0.3, Math.PI * 1.8), mat('#5cb85c'));
    lily.rotation.x = -Math.PI / 2;
    lily.position.set(-12 + i * 3 + ((i * 7) % 3), -0.08, -8 - (i % 4) * 2.5);
    root.add(lily);
    lilies.push(lily);
  }

  // --- Georges (all primitives, cartoon) ------------------------------------------------
  const croco = new THREE.Group();
  const crocoBody = new THREE.Group(); // bob / thrash
  croco.add(crocoBody);
  const green = '#4f8a3a';
  const dark = '#2f5d27';
  const belly = '#c9d98a';
  const body = mesh(new THREE.SphereGeometry(1, 20, 14), green);
  body.scale.set(1.25, 0.65, 2.6);
  body.position.y = 0.55;
  const bellyM = mesh(new THREE.SphereGeometry(1, 16, 10), belly);
  bellyM.scale.set(1.1, 0.45, 2.4);
  bellyM.position.y = 0.35;
  crocoBody.add(body, bellyM);
  for (let i = 0; i < 9; i++) {
    const ridge = mesh(new THREE.ConeGeometry(0.16, 0.38, 4), dark);
    ridge.position.set(0, 1.18 - Math.abs(i - 4) * 0.05, -2 + i * 0.5);
    crocoBody.add(ridge);
    if (i % 2 === 0) {
      for (const sx of [-0.45, 0.45]) {
        const r2 = mesh(new THREE.ConeGeometry(0.1, 0.24, 4), dark);
        r2.position.set(sx, 1.05 - Math.abs(i - 4) * 0.05, -2 + i * 0.5);
        crocoBody.add(r2);
      }
    }
  }
  for (const [x, z] of [[-1, 1.4], [1, 1.4], [-1, -1.4], [1, -1.4]]) {
    const leg = mesh(new THREE.CapsuleGeometry(0.22, 0.4, 4, 8), green);
    leg.position.set(x, 0.25, z);
    leg.rotation.z = x * 0.6;
    crocoBody.add(leg);
  }
  // Head with two hinged jaws
  const head = new THREE.Group();
  head.position.set(0, 0.6, 2.4);
  crocoBody.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.75, 16, 12), green);
  skull.scale.set(1.15, 0.75, 1);
  head.add(skull);
  const upper = new THREE.Group();
  upper.position.set(0, 0.1, 0.3);
  head.add(upper);
  const snout = mesh(new THREE.BoxGeometry(1.1, 0.34, 1.9), green);
  snout.position.set(0, 0.05, 0.95);
  upper.add(snout);
  const lower = new THREE.Group();
  lower.position.set(0, -0.15, 0.3);
  head.add(lower);
  const jaw = mesh(new THREE.BoxGeometry(1.0, 0.24, 1.8), '#7fb069');
  jaw.position.set(0, -0.08, 0.9);
  lower.add(jaw);
  const tongue = mesh(new THREE.BoxGeometry(0.7, 0.05, 1.3), '#ff8fa3');
  tongue.position.set(0, 0.06, 0.8);
  lower.add(tongue);
  const toothMat = mat('#ffffff', { roughness: 0.3 });
  for (let i = 0; i < 6; i++) {
    for (const sx of [-0.45, 0.45]) {
      const tu = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), toothMat);
      tu.rotation.x = Math.PI;
      tu.position.set(sx, -0.17, 0.25 + i * 0.3);
      upper.add(tu);
      if (i % 2) {
        const tl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 5), toothMat);
        tl.position.set(sx * 0.9, 0.1, 0.35 + i * 0.28);
        lower.add(tl);
      }
    }
  }
  for (const sx of [-0.2, 0.2]) {
    const nostril = mesh(new THREE.SphereGeometry(0.08, 8, 6), '#1b3a17');
    nostril.position.set(sx, 0.24, 1.8);
    upper.add(nostril);
  }
  const lids = [];
  const pupils = [];
  for (const sx of [-0.4, 0.4]) {
    const bump = mesh(new THREE.SphereGeometry(0.3, 12, 10), green);
    bump.position.set(sx, 0.5, -0.05);
    head.add(bump);
    const eyeW = mesh(new THREE.SphereGeometry(0.26, 14, 10), '#ffffff');
    eyeW.position.set(sx, 0.62, 0.05);
    head.add(eyeW);
    const pupil = mesh(new THREE.SphereGeometry(0.12, 10, 8), '#111');
    pupil.position.set(sx, 0.66, 0.27);
    head.add(pupil);
    pupils.push(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff' }));
    shine.position.set(sx + 0.04, 0.72, 0.37);
    head.add(shine);
    const lid = mesh(new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark);
    lid.position.set(sx, 0.62, 0.05);
    lid.rotation.x = -1.6; // open
    head.add(lid);
    lids.push(lid);
  }
  // Tail: chain of segments, each child of the previous
  const tailSegs = [];
  let parent = crocoBody;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group();
    seg.position.set(0, i === 0 ? 0.5 : 0, i === 0 ? -2.3 : -0.75);
    const w = 0.75 - i * 0.11;
    const m = mesh(new THREE.BoxGeometry(w, w * 0.6, 0.85), i % 2 ? green : '#467d33');
    m.position.z = -0.38;
    seg.add(m);
    const sp = mesh(new THREE.ConeGeometry(0.09, 0.22, 4), dark);
    sp.position.set(0, w * 0.35, -0.38);
    seg.add(sp);
    parent.add(seg);
    tailSegs.push(seg);
    parent = seg;
  }
  // Party hat for the end
  const hat = mesh(new THREE.ConeGeometry(0.35, 0.8, 14), '#ff5d8f');
  hat.position.set(0, 1.25, 0);
  hat.visible = false;
  head.add(hat);
  const pom = mesh(new THREE.SphereGeometry(0.1, 8, 6), '#ffd84a');
  pom.position.y = 0.42;
  hat.add(pom);
  croco.position.set(0, -0.25, -14);
  root.add(croco);

  // --- Characters ------------------------------------------------------------------------
  const panda = ctx.character('panda');
  root.add(panda);
  const victor = ctx.character('victor');
  root.add(victor);
  const SPECTATORS = [
    ['cous', -3.8, 3.4], ['mamar', -5.4, 2.6], ['babar', -7, 1.8], ['romain', -8.4, 1.0],
    ['greg', 3.8, 3.4], ['aline', 5.4, 2.6], ['eugenie', 7, 1.8], ['violaine', 8.4, 1.0],
  ];
  const gang = {};
  for (const [id, x, z] of SPECTATORS) {
    const c = ctx.character(id);
    c.position.set(x, 0, z);
    c.rotation.y = Math.atan2(-x, -4 - z);
    c.userData.state = 'cheer';
    c.userData.stateT = 0;
    root.add(c);
    gang[id] = c;
  }
  const kid = ctx.kid(3);
  kid.position.set(-6.4, 0, 3.4);
  kid.rotation.y = Math.atan2(6.4, -7.4);
  root.add(kid);
  // Romain's phone (he films everything)
  const phone = mesh(new THREE.BoxGeometry(0.16, 0.28, 0.03), '#111');
  phone.position.set(0, -0.62, 0.12);
  gang.romain.userData.parts.armR.add(phone);

  // --- Telegraphs, projectiles, overlays -----------------------------------------------
  const tailStripe = new THREE.Mesh(new THREE.PlaneGeometry(BANK.maxX - BANK.minX + 3, 1.4), new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0, depthWrite: false }));
  tailStripe.rotation.x = -Math.PI / 2;
  tailStripe.position.set(0, 0.04, PANDA_Z);
  root.add(tailStripe);
  const lungeZone = new THREE.Mesh(new THREE.CircleGeometry(cfg.lungeHalf, 28), new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0, depthWrite: false }));
  lungeZone.rotation.x = -Math.PI / 2;
  lungeZone.position.set(0, 0.05, PANDA_Z);
  root.add(lungeZone);
  const lungeRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  lungeRing.rotation.x = -Math.PI / 2;
  lungeRing.position.set(0, 0.06, PANDA_Z);
  root.add(lungeRing);
  const sweep = mesh(new THREE.BoxGeometry(2.2, 0.45, 0.6), '#4f8a3a', { transparent: true, opacity: 0.85 });
  sweep.visible = false;
  root.add(sweep);
  // Aim line on the water during the feeding phase
  const aim = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false }));
  aim.rotation.x = -Math.PI / 2;
  aim.visible = false;
  root.add(aim);
  const mouthRing = new THREE.Mesh(new THREE.RingGeometry(cfg.aimTol * 0.7, cfg.aimTol * 0.7 + 0.12, 28), new THREE.MeshBasicMaterial({ color: '#8af27a', transparent: true, opacity: 0.8, depthWrite: false }));
  mouthRing.rotation.x = -Math.PI / 2;
  mouthRing.visible = false;
  root.add(mouthRing);

  function veggieMesh(kind) {
    const g = new THREE.Group();
    if (kind === 0) {
      const c = mesh(new THREE.ConeGeometry(0.13, 0.55, 8), VEGGIE_COLORS[0]);
      c.rotation.x = Math.PI;
      const top = mesh(new THREE.ConeGeometry(0.1, 0.2, 5), '#3a9d23');
      top.position.y = 0.33;
      g.add(c, top);
    } else if (kind === 1) {
      const c = mesh(new THREE.CapsuleGeometry(0.11, 0.38, 4, 8), VEGGIE_COLORS[1]);
      c.rotation.z = Math.PI / 2;
      g.add(c);
    } else {
      g.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), VEGGIE_COLORS[kind]));
    }
    return g;
  }
  const flying = []; // {v, mesh, fromX, fromY, fromZ}
  const lobs = []; // cosmetic lobs: {mesh, from, to, t, dur, onLand}

  const style = document.createElement('style');
  style.textContent = CSS;
  const qte = document.createElement('div');
  qte.className = 'w11-qte';
  qte.innerHTML = '<div class="w11-arrow"></div><div class="w11-timer"><i></i></div>';
  const qteArrow = qte.querySelector('.w11-arrow');
  const qteFill = qte.querySelector('.w11-timer i');

  // --- Runtime ---------------------------------------------------------------------------
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const btn = { left: false, right: false, jump: false, throw: false };
  let time = 0;
  let shake = 0;
  let pandaHurt = 0;
  let outro = -1;
  let ended = false;
  let romainTimer = 6;
  let cheerTimer = 2.5;
  let lastHearts = -1;
  let lastObjective = '';
  let lastButtons = '';
  let victorHop = 0;
  let thrash = 0;
  let snap = 0;
  let crocoVisualZ = -14;
  let crocoVisualX = 0;
  let crocoYaw = 0;
  let mouthOpen = 0;

  function setButtons(kind) {
    if (!touch || kind === lastButtons) return;
    lastButtons = kind;
    const move = [
      { id: 'l', label: '◀', side: 'left', onDown: () => { btn.left = true; }, onUp: () => { btn.left = false; } },
      { id: 'r', label: '▶', side: 'left', onDown: () => { btn.right = true; }, onUp: () => { btn.right = false; } },
    ];
    if (kind === 'dodge') hud.buttons([...move, { id: 'j', label: '⤒', side: 'right', onDown: () => { btn.jump = true; } }]);
    else if (kind === 'feed') hud.buttons([...move, { id: 't', label: '🥕', side: 'right', onDown: () => { btn.throw = true; } }]);
    else hud.buttons([]);
  }

  function lob(obj, from, to, dur, onLand) {
    root.add(obj);
    obj.position.copy(from);
    lobs.push({ mesh: obj, from: from.clone(), to: to.clone(), t: 0, dur, onLand });
  }

  function mouthPos(out) {
    // Front of the snout in world space
    return out.set(crocoVisualX, 0.6, crocoVisualZ + 3.6);
  }

  function refreshHud() {
    if (state.hearts !== lastHearts) {
      lastHearts = state.hearts;
      hud.setHearts(state.hearts, cfg.hearts);
    }
    hud.meter('georges', state.health / cfg.health, '#7bd389', `🐊 ${ctx.t('georges')}`);
    hud.setScore(state.dodges * 25 + state.fed * 40 + state.pins * 60);
    hud.setProgress(1 - state.health / cfg.health, `${Math.floor(state.time)}s`);
    let obj = '';
    const ph = state.phase === 'break' ? state.next : state.phase;
    if (ph === 'dodge' || ph === 'intro') obj = ctx.t('obj_dodge');
    else if (ph === 'feed') obj = ctx.t('obj_feed', { n: state.calm, need: cfg.feedNeed });
    else if (ph === 'wrestle') obj = ctx.t('obj_wrestle');
    if (obj !== lastObjective) { lastObjective = obj; hud.setObjective(obj); }
    setButtons(state.phase === 'dodge' || state.phase === 'intro' ? 'dodge' : state.phase === 'feed' ? 'feed' : 'none');
  }

  function cheer(id, line, secs = 2, anim = 'cheer') {
    const c = gang[id];
    hud.say(c, line, secs);
    c.userData.state = anim;
    c.userData.stateT = secs;
  }

  function showPrompt() {
    if (!state.prompt) return;
    qteArrow.textContent = ARROWS[state.prompt.dir];
    qteArrow.classList.remove('pop');
    void qteArrow.offsetWidth;
    qteArrow.classList.add('pop');
    qte.classList.add('show');
  }

  function onEvents(events) {
    for (const e of events) {
      switch (e) {
        case 'dodgePhase':
          hud.banner(ctx.t('phase_dodge', { n: state.cycle + 1 }), 1400, '#ffd84a');
          hud.say(victor, ctx.t('victor_dundee'), 1.8);
          qte.classList.remove('show');
          break;
        case 'telegraph': {
          const a = state.attack;
          sfx.note(a.kind === 'tail' ? 180 : 260);
          if (ctx.mode === 'easy' || state.cycle < 2) hud.float(panda, ctx.t(a.kind === 'tail' ? 'jump_hint' : 'move_hint'), '#ffffff', 2.8);
          break;
        }
        case 'strike':
          sfx.whoosh();
          if (state.attack?.kind === 'lunge') {
            snap = 0.3;
            hud.float(new THREE.Vector3(state.attack.x, 1.5, PANDA_Z - 1), ctx.t('chomp'), '#ffffff', 0);
            fx.burst(tmp.set(state.attack.x, 0.2, PANDA_Z - 1.2), 25, { color: 0x9fe3ff, speed: 4, up: 3 });
          } else {
            fx.burst(tmp.set(0, 0.1, -1), 30, { color: 0x9fe3ff, speed: 6, up: 3 });
          }
          shake = Math.max(shake, 0.2);
          break;
        case 'hit':
          sfx.hit();
          panda.userData.flash();
          pandaHurt = 0.6;
          shake = 0.55;
          hud.float(panda, ctx.t('ouch'), '#ff6b6b', 2.6);
          fx.burst(tmp.set(state.px, 1.4, PANDA_Z), 18, { color: 0xffffff });
          if (ctx.random() < 0.6) cheer('eugenie', ctx.tShared('quote_eugenie'), 1.6, 'hit');
          break;
        case 'dodged':
          sfx.coin();
          hud.float(panda, '+25', '#ffd84a', 2.4);
          if (ctx.random() < 0.35) {
            const ids = ['greg', 'aline', 'violaine', 'eugenie'];
            const id = ids[Math.floor(ctx.random() * ids.length)];
            cheer(id, ctx.tShared(`quote_${id}`), 1.6);
          }
          break;
        case 'babarSpit': {
          cheer('babar', ctx.t('babar_spit'), 1.8, 'jump');
          const spit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#cfefff' }));
          lob(spit, tmp.copy(gang.babar.position).setY(1.6), mouthPos(tmp2).setY(1.4), 0.7, (p) => {
            fx.burst(p, 18, { color: 0xcfefff, speed: 2, up: 2 });
            sfx.click();
          });
          break;
        }
        case 'tired':
          hud.banner(ctx.t('tired'), 1400, '#9be15d');
          sfx.power();
          break;
        case 'feedPhase':
          hud.banner(ctx.t('feed'), 1400, '#ff9f1c');
          break;
        case 'throw': {
          const v = state.veggies[state.veggies.length - 1];
          const m = veggieMesh(Math.floor(ctx.random() * 4));
          root.add(m);
          flying.push({ v, mesh: m, fromX: state.px, fromY: 1.5, fromZ: PANDA_Z, cous: false });
          sfx.jump();
          break;
        }
        case 'cousThrow': {
          const v = state.veggies[state.veggies.length - 1];
          const m = veggieMesh(0);
          root.add(m);
          flying.push({ v, mesh: m, fromX: gang.cous.position.x, fromY: 2, fromZ: gang.cous.position.z, cous: true });
          cheer('cous', ctx.t('cous_carrot'), 1.8);
          break;
        }
        case 'fed':
          sfx.coin();
          mouthPos(tmp);
          fx.burst(tmp, 22, { color: 0x8af27a, speed: 2.5, up: 3 });
          hud.float(tmp.clone(), `${ctx.t('yum')} +40`, '#8af27a', 1.2);
          snap = 0.25;
          break;
        case 'splash':
          sfx.click();
          break;
        case 'sandwich': {
          cheer('mamar', ctx.t('mamar_sandwich'), 2.4);
          const sw = new THREE.Group();
          for (const [c, y] of [['#e8b866', 0], ['#6cb84a', 0.07], ['#c9433b', 0.12], ['#e8b866', 0.18]]) {
            const l = mesh(new THREE.BoxGeometry(0.5, 0.07, 0.25), c);
            l.position.y = y;
            sw.add(l);
          }
          lob(sw, tmp.copy(gang.mamar.position).setY(1.6), tmp2.set(state.px, 1.6, PANDA_Z), 0.8, (p) => {
            fx.burst(p, 20, { color: 0xff6b8a });
            hud.float(panda, '+♥', '#ff6b8a', 2.6);
            sfx.power();
          });
          break;
        }
        case 'calmed':
          hud.banner(ctx.t('calmed'), 1300, '#6bd5ff');
          sfx.power();
          fx.burst(mouthPos(tmp).setY(1.5), 50);
          break;
        case 'recover':
          hud.banner(ctx.t('recover'), 1300, '#ff6b6b');
          sfx.hoho();
          break;
        case 'wrestlePhase':
          victorHop = 0.4;
          break;
        case 'prompt':
          showPrompt();
          sfx.beat();
          break;
        case 'pin':
          sfx.hat(); sfx.coin();
          thrash = 0.35;
          shake = 0.3;
          fx.burst(tmp.set(crocoVisualX, 1.5, crocoVisualZ + 0.5), 25);
          hud.float(panda, `${ctx.t('pin')} +60`, '#ffd84a', 2.6);
          break;
        case 'wrong':
          qte.classList.remove('show');
          hud.banner(ctx.t('wrong'), 1200, '#ff6b6b');
          sfx.hit();
          shake = 0.5;
          thrash = 0.8;
          fx.burst(tmp.set(crocoVisualX, 0.2, crocoVisualZ + 1), 40, { color: 0x9fe3ff, speed: 5, up: 4 });
          break;
        case 'breakFree':
          qte.classList.remove('show');
          hud.banner(ctx.t('break_free'), 1200, '#ffd84a');
          sfx.whoosh();
          thrash = 0.8;
          fx.burst(tmp.set(crocoVisualX, 0.2, crocoVisualZ + 1), 40, { color: 0x9fe3ff, speed: 5, up: 4 });
          cheer('romain', ctx.t('romain_film'), 1.8);
          break;
        case 'won':
          qte.classList.remove('show');
          hud.buttons([]);
          outro = 5.5;
          hat.visible = true;
          hud.banner(ctx.t('victory'), 2600, '#ffd84a');
          ctx.music(128, [0, 4, 7, 12, 7, 4, 9, 7]);
          for (const id in gang) { gang[id].userData.state = 'dance'; gang[id].userData.stateT = 99; }
          hud.say(panda, ctx.t('party'), 2.5);
          hud.say(gang.mamar, 'Aïe aïe aïe aïe', 2.5);
          hud.say(gang.romain, ctx.t('romain_film'), 2.5);
          break;
        case 'lost':
          outro = 2.4;
          hud.buttons([]);
          hud.say(gang.violaine, ctx.tShared('quote_violaine'), 2);
          break;
        default: break;
      }
    }
  }

  // --- Lifecycle ----------------------------------------------------------------------------
  function start() {
    hud.el.appendChild(style);
    hud.el.appendChild(qte);
    ctx.music(104, [0, 3, 5, 7, 5, 3, 0, -2]);
    hud.banner(ctx.t('intro'), 2400, '#9be15d');
    hud.say(victor, ctx.t('victor_dundee'), 2.4);
    hud.say(panda, ctx.tShared('quote_panda'), 2);
    refreshHud();
    sfx.whoosh();
  }

  function update(dt) {
    time += dt;
    if (outro >= 0) {
      outro -= dt;
      animate(dt);
      if (outro <= 0 && !ended) {
        ended = true;
        if (state.won) ctx.finish({ score: state.score(), stars: state.stars(), line: ctx.t('end_win') });
        else ctx.fail({ score: state.score(), line: ctx.t('end_lose') });
      }
      return;
    }
    const tapped = input.taps.length > 0;
    const move = input.axisX() + (btn.right ? 1 : 0) - (btn.left ? 1 : 0);
    const inWrestle = state.phase === 'wrestle';
    const jump = !inWrestle && state.phase !== 'feed' && (input.pressed('up') || input.pressed('action') || input.swipes.includes('up') || btn.jump || tapped);
    const throwIt = state.phase === 'feed' && (input.pressed('action') || input.pressed('up') || btn.throw || tapped);
    let swipe = null;
    if (inWrestle && input.swipes.length) swipe = input.swipes[0];
    btn.jump = false;
    btn.throw = false;
    const events = state.step(dt, { move, jump, throw: throwIt, swipe });
    onEvents(events);
    if (state.phase === 'wrestle' && state.prompt) {
      qteFill.style.width = `${Math.max(0, 1 - state.prompt.t / state.prompt.limit) * 100}%`;
    }
    animate(dt);
    refreshHud();
  }

  function animate(dt) {
    const a = state.attack;
    const phase = state.phase;
    // --- Georges' target pose
    let tz = -7.5;
    let tx = 0;
    let yaw = 0;
    let open = 0.15 + Math.max(0, Math.sin(time * 1.3)) * 0.15;
    let lidOpen = 1;
    if (phase === 'intro') tz = -7.5 - Math.max(0, state.phaseT - 1) * 3;
    if (a && phase === 'dodge') {
      const k = Math.min(1, a.t / a.tele);
      if (a.kind === 'lunge') {
        tx = a.x;
        if (a.t < a.tele) { tz = -7.5 - k * 1.2; open = 0.3 + k * 0.6; }
        else if (a.t < a.tele + STRIKE_WINDOW) { tz = -4.1; open = snap > 0 ? 0 : 0.9; }
        else { tz = -6; open = 0.2; }
      } else {
        tz = -4.6;
        tx = 0;
        if (a.t < a.tele) yaw = Math.PI - 1.3 * k;
        else {
          const s = Math.min(1, (a.t - a.tele) / (STRIKE_WINDOW + RECOVER_TIME * 0.6));
          yaw = Math.PI - 1.3 + 2.6 * s;
        }
      }
    }
    if (phase === 'feed' || (phase === 'break' && state.next === 'wrestle')) {
      tx = phase === 'feed' ? state.crocoX() : crocoXAt(state.feedClock, cfg.sway);
      tz = -6;
      open = 0.95;
      lidOpen = 0.45;
    }
    if (phase === 'break' && state.next === 'feed') { tz = -6.5; lidOpen = 0.5; open = 0.6; }
    if (phase === 'wrestle') { tz = -4.5; tx = crocoVisualX; open = 0.05; lidOpen = 0.6; }
    if (phase === 'won') { tz = -1; tx = 0; open = 0.4; lidOpen = 1; yaw = Math.sin(time * 3) * 0.3; }
    if (phase === 'lost') { tz = -6; open = 0.1; lidOpen = 0.1; }
    const follow = Math.min(1, dt * (a && a.kind === 'lunge' && a.t >= a.tele ? 18 : 4));
    crocoVisualZ += (tz - crocoVisualZ) * follow;
    if (phase === 'feed') crocoVisualX = tx;
    else crocoVisualX += (tx - crocoVisualX) * Math.min(1, dt * (a && a.kind === 'lunge' ? 5 : 2.5));
    crocoYaw += (yaw - crocoYaw) * Math.min(1, dt * (a && a.kind === 'tail' && a.t >= a.tele ? 14 : 5));
    croco.position.set(crocoVisualX, phase === 'won' ? 0.15 : -0.25 + Math.sin(time * 1.6) * 0.05, crocoVisualZ);
    croco.rotation.y = crocoYaw;
    snap = Math.max(0, snap - dt);
    mouthOpen += (open - mouthOpen) * Math.min(1, dt * (snap > 0 ? 30 : 8));
    upper.rotation.x = -mouthOpen * 0.55;
    lower.rotation.x = mouthOpen * 0.3;
    const blink = Math.sin(time * 0.7) > 0.97 ? 0.1 : lidOpen;
    for (const lid of lids) lid.rotation.x = -1.6 + (1 - blink) * 1.4;
    for (const p of pupils) p.position.x = Math.sign(p.position.x) * 0.4 + Math.max(-0.08, Math.min(0.08, (state.px - crocoVisualX) * 0.02));
    // Tail wiggle; raised and fast during the tail telegraph
    const tailTele = a && a.kind === 'tail' && a.t < a.tele;
    for (let i = 0; i < tailSegs.length; i++) {
      tailSegs[i].rotation.y = Math.sin(time * (tailTele ? 12 : 2.5) - i * 0.6) * (tailTele ? 0.25 : 0.12);
      tailSegs[i].rotation.x = tailTele ? -0.08 : 0;
    }
    thrash = Math.max(0, thrash - dt);
    crocoBody.rotation.z = phase === 'wrestle' ? Math.sin(time * 9) * 0.12 + thrash * Math.sin(time * 30) * 0.4 : phase === 'won' ? Math.sin(time * 6) * 0.15 : 0;
    crocoBody.position.y = phase === 'won' ? Math.abs(Math.sin(time * 6)) * 0.3 : 0;

    // --- Telegraph meshes
    const showTail = a && a.kind === 'tail' && phase === 'dodge' && a.t < a.tele + STRIKE_WINDOW;
    tailStripe.material.opacity = showTail ? 0.2 + Math.abs(Math.sin(time * 12)) * 0.3 : 0;
    const showLunge = a && a.kind === 'lunge' && phase === 'dodge' && a.t < a.tele + STRIKE_WINDOW;
    lungeZone.material.opacity = showLunge ? 0.25 + Math.abs(Math.sin(time * 12)) * 0.2 : 0;
    lungeRing.material.opacity = showLunge && a.t < a.tele ? 0.9 : 0;
    if (a) {
      lungeZone.position.x = a.x;
      lungeRing.position.x = a.x;
      const r = cfg.lungeHalf * (1 + 1.5 * Math.max(0, 1 - a.t / a.tele));
      lungeRing.scale.setScalar(r);
    }
    sweep.visible = !!(a && a.kind === 'tail' && a.t >= a.tele && a.t < a.tele + STRIKE_WINDOW);
    if (sweep.visible) {
      const s = (a.t - a.tele) / STRIKE_WINDOW;
      sweep.position.set(BANK.minX - 1.5 + s * (BANK.maxX - BANK.minX + 3), 0.3, PANDA_Z);
      fx.burst(tmp.set(sweep.position.x, 0.2, PANDA_Z), 2, { color: 0x9fe3ff, speed: 1, up: 2 });
    }
    // Feeding helpers
    const feeding = phase === 'feed';
    aim.visible = feeding;
    mouthRing.visible = feeding;
    if (feeding) {
      aim.position.set(state.px, 0.02, PANDA_Z - 2);
      mouthPos(tmp);
      // Easy / normal show where the mouth will be when the veggie lands; hard makes you lead it.
      const aimX = ctx.mode === 'hard' ? tmp.x : crocoXAt(state.feedClock + FLIGHT_TIME, cfg.sway);
      mouthRing.position.set(aimX, 0.02, tmp.z - 0.6);
      const aligned = Math.abs(state.px - aimX) < cfg.aimTol;
      mouthRing.material.color.set(aligned ? '#8af27a' : '#ffffff');
      aim.material.color.set(aligned ? '#8af27a' : '#ffffff');
    }

    // --- Panda and Victor
    pandaHurt = Math.max(0, pandaHurt - dt);
    victorHop = Math.max(0, victorHop - dt);
    if (phase === 'wrestle' || (phase === 'break' && state.next === 'wrestle' && state.phaseT < 0.6)) {
      // Both ride Georges' back
      panda.position.set(crocoVisualX - 0.35, 0.95 + Math.abs(Math.sin(time * 9)) * 0.1, crocoVisualZ + 0.9);
      panda.rotation.y = Math.PI;
      panda.userData.animate(dt, 'hit');
      victor.position.set(crocoVisualX + 0.4, 0.95, crocoVisualZ - 0.6);
      victor.rotation.y = Math.PI;
      victor.userData.animate(dt, 'cheer');
    } else if (phase === 'won') {
      const ang = time * 0.6;
      panda.position.set(Math.cos(ang) * 2.5, 0, 1 + Math.sin(ang) * 1.2);
      panda.rotation.y = Math.atan2(-panda.position.x, -panda.position.z + 1);
      panda.userData.animate(dt, 'dance');
      victor.position.set(Math.cos(ang + Math.PI) * 2.5, 0, 1 + Math.sin(ang + Math.PI) * 1.2);
      victor.rotation.y = Math.atan2(-victor.position.x, -victor.position.z + 1);
      victor.userData.animate(dt, 'dance');
    } else {
      panda.position.set(state.px, state.py, PANDA_Z);
      panda.rotation.y = Math.PI;
      const moving = Math.abs(input.axisX() + (btn.right ? 1 : 0) - (btn.left ? 1 : 0)) > 0;
      panda.userData.animate(dt, phase === 'lost' ? 'sit' : pandaHurt > 0 ? 'hit' : state.py > 0.05 ? 'jump' : moving ? 'run' : 'idle');
      if (phase === 'feed') panda.userData.parts.armR.rotation.x = -2.2 + Math.max(0, state.throwCd) * 4;
      const vx = Math.max(BANK.minX, Math.min(BANK.maxX + 1.5, state.px + (state.px > 3 ? -1.5 : 1.5)));
      victor.position.x += (vx - victor.position.x) * Math.min(1, dt * 5);
      victor.position.z = PANDA_Z + 0.4;
      victor.position.y = state.py * 0.9;
      victor.rotation.y = Math.PI;
      victor.userData.animate(dt, state.py > 0.05 ? 'jump' : phase === 'feed' ? 'cheer' : 'run');
    }

    // --- Projectiles
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      const k = Math.min(1, f.v.t / FLIGHT_TIME);
      mouthPos(tmp);
      const toX = f.cous ? tmp.x : f.v.x;
      f.mesh.position.set(f.fromX + (toX - f.fromX) * k, f.fromY + (0.6 - f.fromY) * k + Math.sin(k * Math.PI) * 2.5, f.fromZ + (tmp.z - f.fromZ) * k);
      f.mesh.rotation.x += dt * 12;
      if (!state.veggies.includes(f.v)) {
        if (!f.cous && Math.abs(f.v.x - tmp.x) >= cfg.aimTol) {
          fx.burst(f.mesh.position, 16, { color: 0x9fe3ff, speed: 2, up: 3 });
          hud.float(f.mesh.position.clone(), ctx.t('splash'), '#9fe3ff', 0.5);
        }
        root.remove(f.mesh);
        flying.splice(i, 1);
      }
    }
    for (let i = lobs.length - 1; i >= 0; i--) {
      const l = lobs[i];
      l.t += dt;
      const k = Math.min(1, l.t / l.dur);
      l.mesh.position.lerpVectors(l.from, l.to, k);
      l.mesh.position.y += Math.sin(k * Math.PI) * 1.8;
      l.mesh.rotation.y += dt * 8;
      if (k >= 1) {
        l.onLand?.(l.mesh.position.clone());
        root.remove(l.mesh);
        lobs.splice(i, 1);
      }
    }

    // --- The gang on the bank
    for (const id in gang) {
      const c = gang[id];
      c.userData.stateT -= dt;
      if (c.userData.stateT <= 0) c.userData.state = id === 'romain' ? 'idle' : (Math.sin(time * 0.5 + c.position.x) > 0.3 ? 'cheer' : 'idle');
      if (phase === 'won') {
        const i = SPECTATORS.findIndex((s) => s[0] === id);
        const ang = time * 0.4 + (i / SPECTATORS.length) * Math.PI * 2;
        c.position.x += (Math.cos(ang) * 5.2 - c.position.x) * Math.min(1, dt * 2);
        c.position.z += (1 + Math.sin(ang) * 2.6 - c.position.z) * Math.min(1, dt * 2);
        c.rotation.y = Math.atan2(-c.position.x, 1 - c.position.z);
      }
      c.userData.animate(dt, phase === 'won' ? 'dance' : c.userData.state);
    }
    gang.romain.userData.parts.armR.rotation.x = phase === 'won' ? -2.6 : -1.5; // filming
    kid.userData.animate(dt, phase === 'won' ? 'dance' : 'cheer');
    romainTimer -= dt;
    if (romainTimer <= 0 && phase !== 'won') {
      romainTimer = 7 + ctx.random() * 4;
      hud.say(gang.romain, ctx.t('romain_film'), 1.8);
    }
    cheerTimer -= dt;
    if (cheerTimer <= 0) {
      cheerTimer = phase === 'won' ? 0.7 : 3.2 + ctx.random() * 2;
      if (phase === 'won') {
        fx.burst(tmp.set((ctx.random() - 0.5) * 10, 3 + ctx.random() * 2, (ctx.random() - 0.5) * 4), 50);
        sfx.coin();
      } else {
        const ids = ['greg', 'aline', 'eugenie', 'violaine', 'cous', 'mamar'];
        const id = ids[Math.floor(ctx.random() * ids.length)];
        hud.say(gang[id], ctx.tShared(`quote_${id}`), 1.6);
      }
    }
    if (victorHop > 0 && phase !== 'wrestle') victor.position.y = Math.sin(victorHop * 8) * 0.5;

    // --- World and camera
    for (let i = 0; i < waterPos.count; i++) {
      const x = waterBase[i * 3];
      const y = waterBase[i * 3 + 1];
      waterPos.array[i * 3 + 2] = Math.sin(x * 0.4 + time * 1.5) * 0.06 + Math.cos(y * 0.6 + time) * 0.05;
    }
    waterPos.needsUpdate = true;
    for (let i = 0; i < lilies.length; i++) lilies[i].position.y = -0.08 + Math.sin(time * 1.2 + i) * 0.03;

    shake = Math.max(0, shake - dt);
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    if (phase === 'wrestle') {
      camera.position.set(crocoVisualX * 0.5 + 3 + sx, 4.5 + sy, crocoVisualZ + 7);
      camera.lookAt(crocoVisualX, 0.8, crocoVisualZ + 0.5);
    } else if (phase === 'won') {
      const ang = time * 0.25;
      camera.position.set(Math.sin(ang) * 3, 5.5, 10.5);
      camera.lookAt(0, 1, -0.5);
    } else {
      // Pull back on portrait screens, and during the intro to show the whole gang.
      const portrait = camera.aspect < 1 ? 1 : 0;
      const intro = phase === 'intro' ? Math.min(1, state.phaseT / 2) : 0;
      camera.position.set(state.px * 0.4 + sx, 5.4 + portrait * 2.6 + intro * 3.5 + sy, 10.4 + portrait * 4 + intro * 5);
      camera.lookAt(state.px * 0.3, 0.6, -3.5);
    }
    sun.position.set(6, 18, 8);
    sun.target.position.set(0, 0, -2);
  }

  function dispose() {
    style.remove();
    qte.remove();
    flying.length = 0;
    lobs.length = 0;
  }

  return { start, update, dispose, state };
}
