// World 5 - "Le Molière": the night club. Panda dances on the beat: arrows
// fly in from four sides and must be hit (keys or swipes) as they reach the
// ring. Rings with a heart or a rum glass are hit with Space / tap (a flirt
// that always fails, a late-night rum). A full vibe orders the €200 bottle on
// the taxpayer. Too wild and the bouncer throws Panda out, too tired and he
// falls asleep on the sofa. Survive until closing time.

import { DIRS, createClub, buildChart, judge, findNote, bouncerWatching } from './rules.js';

export const MODELS = ['office'];

export const TEXTS = {
  en: {
    howto: ['Arrows fly in from 4 sides: press that arrow (or swipe) as it hits the ring.', 'Rings 💘 🥃: Space / tap on the beat. Full vibe: Space / tap orders the €200 bottle.', 'Too wild: the bouncer throws you out. Too tired: you sleep on the sofa.', 'Survive until closing time!'],
    objective: 'Dance on the beat until closing time (5:00)',
    ready: 'Le Molière, 2 AM…', go: 'DANCE!',
    perfect: 'PERFECT!', good: 'GOOD', miss: 'MISS',
    vibe: 'Vibe', wild: 'Too wild', tired: 'Tired',
    combo: 'Combo {n}!', mult: 'x{m}',
    bottle: '€200 BOTTLE! On the taxpayer!', bottle_ready: '🍾 Space / tap!', not_ready: 'Vibe not full yet!',
    aline_bottle: 'Who\'s paying for this?',
    flirt_panda: ['Hoho… you come here often?', 'I work in Government Administration…', 'Hoho, want to see my GoPro videos?', 'Nice moves. Mine are better. Hoho.'],
    flirt_fail: ['No thanks!', 'Ha! Nice try.', 'Is that… a panda?', 'I\'m here with my friends!', 'Cute glasses. Bye!'],
    flirt_points: '+{p} for the confidence',
    eugenie_tease: ['Smooth, Panda. So smooth.', 'Hoho, rejected!', 'Again?!'],
    violaine_flirt: 'Awkward!',
    rum_mamar: 'Drink it all!', rum_float: 'Rum! Vibe up… sleepy',
    feral: 'Panda is going wild…',
    watch: '👀', watch_banner: 'The bouncer is watching!', calm: 'Calm down, sir.',
    cous_leave: 'I\'m off home, like the grandpas.',
    victor_door: ['They let PANDA in?!', 'Refused again. Is it the deodorant?', 'Stylish… from out here.', 'I\'m on the list! Croco!'],
    babar_spit: 'Ptoo.', panda_spit: 'Hey! My back!',
    yawn: '*yawn*… that sofa looks comfy', zzz: 'zzz',
    closing: 'CLOSING TIME!',
    win_line: 'Closing time, still standing. Hoho!',
    lose_bouncer: 'Thrown out of the Molière. Victor says hi outside.',
    lose_asleep: 'Asleep on the sofa at {time}. A classic.',
    sign: 'LE MOLIÈRE',
    silo: 'Do it FOR THE SILO!', ole: 'Olé!', eugenie_line: ['Bisous!', 'Go Panda, go!', 'Look at him go!'],
  },
  fr: {
    howto: ['Les flèches arrivent des 4 côtés : appuie sur la bonne (ou swipe) quand elle touche l\'anneau.', 'Anneaux 💘 🥃 : Espace / toucher dans le temps. Ambiance à fond : Espace / toucher = bouteille à 200 €.', 'Trop sauvage : le videur te sort. Trop fatigué : dodo sur le canapé.', 'Tiens jusqu\'à la fermeture !'],
    objective: 'Danse en rythme jusqu\'à la fermeture (5h00)',
    ready: 'Le Molière, 2h du mat…', go: 'DANSE !',
    perfect: 'PARFAIT !', good: 'BIEN', miss: 'RATÉ',
    vibe: 'Ambiance', wild: 'Trop sauvage', tired: 'Fatigue',
    combo: 'Combo {n} !', mult: 'x{m}',
    bottle: 'BOUTEILLE À 200 € ! Aux frais du contribuable !', bottle_ready: '🍾 Espace / toucher !', not_ready: 'Ambiance pas encore à fond !',
    aline_bottle: 'Qui paie, là ?',
    flirt_panda: ['Hoho… tu viens souvent ici ?', 'Je travaille dans l\'Administration publique…', 'Hoho, tu veux voir mes vidéos GoPro ?', 'Pas mal tes pas. Les miens sont mieux. Hoho.'],
    flirt_fail: ['Non merci !', 'Ha ! Bien essayé.', 'C\'est… un panda ?', 'Je suis avec mes copines !', 'Jolies lunettes. Salut !'],
    flirt_points: '+{p} pour l\'audace',
    eugenie_tease: ['Tout en finesse, Panda.', 'Hoho, recalé !', 'Encore ?!'],
    violaine_flirt: 'Malaisant !',
    rum_mamar: 'Bois-z-y tout !', rum_float: 'Rhum ! Ambiance… et sommeil',
    feral: 'Panda devient sauvage…',
    watch: '👀', watch_banner: 'Le videur te regarde !', calm: 'On se calme, monsieur.',
    cous_leave: 'Je rentre, comme des pépés.',
    victor_door: ['Ils laissent entrer PANDA ?!', 'Encore refoulé. C\'est le déo ?', 'Stylé… vu d\'ici.', 'Je suis sur la liste ! Croco !'],
    babar_spit: 'Ptou.', panda_spit: 'Hé ! Mon dos !',
    yawn: '*bâille*… il a l\'air bien, ce canapé', zzz: 'zzz',
    closing: 'FERMETURE !',
    win_line: 'Fermeture, et toujours debout. Hoho !',
    lose_bouncer: 'Viré du Molière. Victor te salue dehors.',
    lose_asleep: 'Endormi sur le canapé à {time}. Un classique.',
    sign: 'LE MOLIÈRE',
    silo: 'Do it FOR THE SILO !', ole: 'Olé !', eugenie_line: ['Bisous !', 'Allez Panda !', 'R\'garde-le danser !'],
  },
};

const DIR_COLOR = { left: '#ff4fa3', up: '#3df2ff', right: '#a6ff4d', down: '#ffd23d' };
const DIR_GLYPH = { left: '◀', up: '▲', right: '▶', down: '▼' };
const DIR_VEC = { left: [-1, 0], up: [0, -1], right: [1, 0], down: [0, 1] };
const NEON = ['#ff2bd6', '#2bf3ff', '#a6ff4d', '#ffd23d', '#9b5de5', '#ff6b2b'];
const MELODY = [0, 0, 7, 5, 3, 3, 10, 7];

const STYLE = `
.w05-pad { position: absolute; left: 50%; top: 37%; width: 0; height: 0; pointer-events: none; }
.w05-target { position: absolute; left: -46px; top: -46px; width: 92px; height: 92px; border-radius: 50%; border: 5px solid #fff; box-shadow: 0 0 18px #ff2bd6, inset 0 0 14px #2bf3ff; background: rgba(20, 0, 40, 0.35); }
.w05-target.beat { transform: scale(1.12); }
.w05-target.ready { border-color: #ffd23d; box-shadow: 0 0 30px #ffd23d, inset 0 0 18px #ffd23d; }
.w05-note { position: absolute; left: -32px; top: -32px; width: 64px; height: 64px; border-radius: 50%; border: 4px solid #1b1b2f; display: flex; align-items: center; justify-content: center; font-size: 30px; color: #1b1b2f; font-weight: 900; box-shadow: 0 0 16px currentColor; will-change: transform; }
.w05-ring { position: absolute; left: -46px; top: -46px; width: 92px; height: 92px; border-radius: 50%; border: 6px solid; display: flex; align-items: center; justify-content: center; font-size: 34px; will-change: transform; }
.w05-judge { position: absolute; left: -150px; width: 300px; top: 58px; text-align: center; font-size: 30px; font-weight: 900; -webkit-text-stroke: 1.5px #1b1b2f; text-shadow: 0 3px 0 #1b1b2f; opacity: 0; }
.w05-judge.pop { animation: w05pop .45s ease-out; }
.w05-hint { position: absolute; left: -150px; width: 300px; top: -96px; text-align: center; font-size: 20px; font-weight: 900; color: #ffd23d; -webkit-text-stroke: 1px #1b1b2f; text-shadow: 0 2px 0 #1b1b2f; display: none; }
.w05-hint.show { display: block; animation: w05blink .6s infinite alternate; }
@keyframes w05pop { 0% { opacity: 1; transform: scale(1.5); } 70% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1) translateY(-10px); } }
@keyframes w05blink { from { opacity: 1; } to { opacity: 0.55; } }
`;

/** A code-drawn adult face for the generic dancers and the bouncer (never a real person). */
function drawFace(THREE, { skin, hair, style, shades }) {
  const c = document.createElement('canvas');
  c.width = 360; c.height = 440;
  const g = c.getContext('2d');
  g.lineWidth = 7; g.strokeStyle = '#2a1d18';
  if (style === 'long') { g.fillStyle = hair; g.beginPath(); g.ellipse(180, 220, 140, 175, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = skin;
  g.beginPath(); g.ellipse(180, 220, 110, 140, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  if (style !== 'bald') {
    g.fillStyle = hair;
    g.beginPath(); g.ellipse(180, 120, 118, 62, 0, Math.PI, 0); g.fill();
    if (style === 'bun') { g.beginPath(); g.arc(180, 52, 40, 0, Math.PI * 2); g.fill(); }
  }
  if (shades) {
    g.fillStyle = '#111';
    g.beginPath(); g.roundRect(92, 180, 80, 46, 14); g.roundRect(188, 180, 80, 46, 14); g.fill();
    g.fillRect(168, 190, 24, 8);
  } else {
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(140, 205, 22, 0, 7); g.arc(220, 205, 22, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#2a1d18';
    g.beginPath(); g.arc(144, 208, 9, 0, 7); g.arc(224, 208, 9, 0, 7); g.fill();
  }
  g.beginPath();
  if (style === 'bald') { g.moveTo(140, 300); g.lineTo(220, 300); } else g.arc(180, 285, 36, 0.2, Math.PI - 0.2);
  g.stroke();
  g.fillStyle = skin;
  g.fillRect(150, 350, 60, 90);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const state = createClub(ctx.mode);
  const cfg = state.cfg;
  const R = () => ctx.random();
  const notes = buildChart(R, cfg);
  const beatLen = 60 / cfg.bpm;
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });

  // --- The club ----------------------------------------------------------------------
  ctx.setupSky({ top: '#14002e', bottom: '#2b0a4a', fog: 0x14002e, fogNear: 16, fogFar: 48 });
  root.add(new THREE.HemisphereLight(0x9a7cff, 0x1a0a2a, 1.1));
  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(0, 8, 10);
  root.add(fill);
  const colorLights = [];
  for (let i = 0; i < 3; i++) {
    const l = new THREE.PointLight(NEON[i], 30, 18, 1.6);
    l.position.set(0, 4, 0);
    root.add(l);
    colorLights.push(l);
  }

  const room = new THREE.Group();
  root.add(room);
  const wallMat = mat('#24123d', { roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(26, 10, 0.4), wallMat);
  back.position.set(0, 5, -9.5);
  room.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 20), wallMat);
    side.position.set(s * 12.5, 5, 0);
    room.add(side);
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), mat('#120a1c', { roughness: 0.3, metalness: 0.4 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, 0);
  room.add(ground);
  // Neon strips.
  const neonMats = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length] });
    neonMats.push(m);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(26, 0.12, 0.12), m);
    strip.position.set(0, 2 + i * 1.8, -9.25);
    room.add(strip);
    for (const s of [-1, 1]) {
      const sideStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 20), m);
      sideStrip.position.set(s * 12.25, 2 + i * 1.8, 0);
      room.add(sideStrip);
    }
  }
  // Neon sign.
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512; signCanvas.height = 128;
  {
    const g = signCanvas.getContext('2d');
    g.font = 'bold 82px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff2bd6'; g.shadowBlur = 24;
    g.fillStyle = '#ffd6f5';
    g.fillText(ctx.t('sign'), 256, 66);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
  sign.position.set(0, 7.4, -9.2);
  room.add(sign);
  // DJ booth with speakers.
  const booth = new THREE.Mesh(new THREE.BoxGeometry(4, 1.3, 1.2), mat('#2e2e3a', { emissive: '#3a0a5a', emissiveIntensity: 0.6 }));
  booth.position.set(0, 0.65, -8.2);
  room.add(booth);
  const speakers = [];
  for (const s of [-1, 1]) {
    const sp = models.get('speaker', { height: 2.6 }) || (() => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1), mat('#15151c'));
      b.position.y = 1.3;
      const cone = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), mat('#444'));
      cone.position.set(0, 1.6, 0.51);
      g.add(b, cone);
      return g;
    })();
    sp.position.set(s * 3.6, 0, -8.4);
    room.add(sp);
    speakers.push(sp);
  }
  // Bar with bottles at the back right.
  const bar = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 1), mat('#5a2d1a', { emissive: '#2a0a00' }));
  bar.position.set(8.5, 0.6, -7.2);
  room.add(bar);
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8), new THREE.MeshStandardMaterial({ color: NEON[i % NEON.length], emissive: NEON[i % NEON.length], emissiveIntensity: 0.4, transparent: true, opacity: 0.85 }));
    b.position.set(6.4 + i * 0.5, 2.2, -9);
    room.add(b);
  }
  // The sofa, waiting for Panda.
  const sofa = models.get('loungeSofa', { width: 3 }) || (() => {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.1), mat('#7a1f4a'));
    seat.position.y = 0.45;
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(3, 0.9, 0.3), mat('#7a1f4a'));
    backrest.position.set(0, 0.9, -0.45);
    g.add(seat, backrest);
    return g;
  })();
  sofa.position.set(8.6, 0, -1.2);
  sofa.rotation.y = -Math.PI / 2;
  room.add(sofa);
  const sofaGlow = new THREE.Mesh(new THREE.CircleGeometry(2, 24), new THREE.MeshBasicMaterial({ color: '#7fb3ff', transparent: true, opacity: 0, depthWrite: false }));
  sofaGlow.rotation.x = -Math.PI / 2;
  sofaGlow.position.set(8.6, 0.02, -1.2);
  room.add(sofaGlow);
  // Front door on the left, with a velvet rope: Victor is outside it.
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 0.3), new THREE.MeshBasicMaterial({ color: '#ffe8a3' }));
  doorFrame.position.set(-8.5, 1.7, -9.25);
  room.add(doorFrame);
  const doorHole = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.1), new THREE.MeshBasicMaterial({ color: '#0a0a1a' }));
  doorHole.position.set(-8.5, 1.55, -9.08);
  room.add(doorHole);
  const ropeMat = mat('#d62839', { emissive: '#5a0010' });
  for (const x of [-9.6, -7.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.1, 8), mat('#d4af37', { metalness: 0.8, roughness: 0.3 }));
    post.position.set(x, 0.55, -7.8);
    room.add(post);
  }
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), ropeMat);
  rope.rotation.z = Math.PI / 2;
  rope.position.set(-8.5, 0.95, -7.8);
  room.add(rope);

  // Dance floor tiles.
  const tiles = [];
  const COLS = 9;
  const ROWS = 6;
  const TILE = 1.4;
  const tileGeo = new THREE.BoxGeometry(TILE * 0.94, 0.1, TILE * 0.94);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const m = new THREE.MeshStandardMaterial({ color: '#1a1026', emissive: NEON[(r + c) % NEON.length], emissiveIntensity: 0.1, roughness: 0.3 });
      const tile = new THREE.Mesh(tileGeo, m);
      tile.position.set((c - (COLS - 1) / 2) * TILE, 0.05, -6 + r * TILE);
      room.add(tile);
      tiles.push({ m, r, c, level: 0 });
    }
  }

  // Mirror ball and its beams.
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 2), new THREE.MeshStandardMaterial({ color: '#e8e8f0', metalness: 1, roughness: 0.15, flatShading: true, emissive: '#3a3a55' }));
  ball.position.set(0, 6.6, -2);
  root.add(ball);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 4), mat('#999'));
  chain.position.set(0, 8.4, -2);
  root.add(chain);
  const beams = new THREE.Group();
  beams.position.copy(ball.position);
  root.add(beams);
  const beamGeo = new THREE.ConeGeometry(0.9, 9, 16, 1, true);
  beamGeo.translate(0, -4.5, 0);
  for (let i = 0; i < 6; i++) {
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: NEON[i], transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 6) * Math.PI * 2;
    beam.rotation.x = 0.55;
    pivot.add(beam);
    beams.add(pivot);
  }

  // --- People ------------------------------------------------------------------------
  const panda = ctx.character('panda');
  panda.position.set(0, 0.1, 1);
  root.add(panda);
  const gang = {};
  const SPOTS = {
    romain: [-4.2, -1.2], mamar: [-2.4, -3.2], babar: [2.6, -3.4], greg: [4.4, -1.4],
    aline: [-5.6, -3.8], eugenie: [5.6, -3.6], violaine: [0.2, -4.6], cous: [-1.2, -5.4],
  };
  for (const [id, [x, z]] of Object.entries(SPOTS)) {
    const c = ctx.character(id, { scale: 0.92 });
    c.position.set(x, 0.1, z);
    c.lookAt(0, 0.1, 1);
    c.userData.anim = 'dance';
    c.userData.speed = 0.85 + R() * 0.3;
    root.add(c);
    gang[id] = c;
  }
  const victor = ctx.character('victor', { scale: 0.92 });
  victor.position.set(-8.5, 0, -8.4);
  root.add(victor);

  const dancers = [];
  const DANCER_LOOKS = [
    { skin: '#f3c9a8', hair: '#3b2414', style: 'long', shirt: '#ff4fa3', legs: '#1d1d24', skirt: true },
    { skin: '#8d5a3b', hair: '#1c1a18', style: 'bun', shirt: '#2bf3ff', legs: '#2c3240' },
    { skin: '#e8b48f', hair: '#d9a441', style: 'short', shirt: '#a6ff4d', legs: '#3a2a5a' },
  ];
  const DANCER_SPOTS = [[-3, 2.4], [3.2, 2.2], [-6, 0.6], [6, 0.4]];
  DANCER_LOOKS.forEach((look, i) => {
    const d = ctx.character(`dancer${i}`, {
      face: drawFace(THREE, look),
      outfit: { shirt: look.shirt, pattern: 'plain', legs: look.legs, skin: look.skin, small: 0.95, skirt: look.skirt },
    });
    const [x, z] = DANCER_SPOTS[i];
    d.position.set(x, 0.1, z);
    d.userData.target = new THREE.Vector3(x, 0.1, z);
    d.userData.spot = i;
    root.add(d);
    dancers.push(d);
  });

  const bouncer = ctx.character('bouncer', {
    scale: 1.15,
    face: drawFace(THREE, { skin: '#c68c64', hair: '#000', style: 'bald', shades: true }),
    outfit: { shirt: '#0d0d12', pattern: 'plain', legs: '#0d0d12', skin: '#c68c64', wide: 1.3 },
  });
  bouncer.position.set(6.5, 0, -5);
  root.add(bouncer);

  // A bottle with a sparkler, raised by Panda when he orders one.
  const bottle = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.55, 10), new THREE.MeshStandardMaterial({ color: '#1f5e2e', metalness: 0.3, roughness: 0.2 }));
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.25, 8), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8 }));
  neck.position.y = 0.38;
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' }));
  spark.position.y = 0.6;
  bottle.add(glass, neck, spark);
  bottle.visible = false;
  bottle.position.set(0, -0.75, 0);
  panda.userData.parts.armR.add(bottle);

  // --- Rhythm pad (DOM) -------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = STYLE;
  const pad = document.createElement('div');
  pad.className = 'w05-pad';
  pad.innerHTML = '<div class="w05-target"></div><div class="w05-judge"></div><div class="w05-hint"></div>';
  const target = pad.querySelector('.w05-target');
  const judgeEl = pad.querySelector('.w05-judge');
  const hint = pad.querySelector('.w05-hint');

  function showJudge(text, color) {
    judgeEl.textContent = text;
    judgeEl.style.color = color;
    judgeEl.classList.remove('pop');
    void judgeEl.offsetWidth;
    judgeEl.classList.add('pop');
  }

  function spawnNoteEl(n) {
    const el = document.createElement('div');
    if (n.kind === 'arrow') {
      el.className = 'w05-note';
      el.textContent = DIR_GLYPH[n.dir];
      el.style.background = DIR_COLOR[n.dir];
      el.style.color = '#1b1b2f';
    } else {
      el.className = 'w05-ring';
      el.textContent = n.kind === 'flirt' ? '💘' : '🥃';
      el.style.borderColor = n.kind === 'flirt' ? '#ff4fa3' : '#ffb347';
      el.style.boxShadow = `0 0 18px ${n.kind === 'flirt' ? '#ff4fa3' : '#ffb347'}`;
    }
    pad.appendChild(el);
    n.el = el;
  }

  // --- State -------------------------------------------------------------------------
  let time = 0;
  let spawnIdx = 0;
  let scanFrom = 0;
  let lastBeat = -1;
  let actionQueued = false;
  let pose = null; // {anim, t, lean, lift}
  let bottleTimer = 0;
  let wasWatching = false;
  let calmWarned = false;
  let yawned = false;
  let cousGone = false;
  let cousLeaving = false;
  let quoteTimer = 3;
  let spitTimer = 12;
  let victorTimer = 6;
  let feralWarned = false;
  let pulse = 0;
  let shake = 0;
  let ended = false;
  let flirtTarget = null;
  const spits = [];
  let buttons = null;
  const tmp = new THREE.Vector3();
  const pandaHome = new THREE.Vector3(0, 0.1, 1);

  function clubTime() {
    const minutes = Math.floor(state.progress() * 180);
    return `${2 + Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }

  function setPose(anim, t, lean = 0, lift = 0) {
    pose = { anim, t, lean, lift };
  }

  function hitArrow(n, grade) {
    n.done = true;
    n.grade = grade;
    n.fade = 0.25;
    const pts = state.hit(grade);
    const color = grade === 'perfect' ? '#ffd23d' : '#3df2ff';
    showJudge(ctx.t(grade), color);
    hud.float(panda, `+${pts}`, color, 3);
    sfx.note(n.dir === 'left' ? 523 : n.dir === 'up' ? 659 : n.dir === 'right' ? 784 : 440);
    const lean = n.dir === 'left' ? 0.3 : n.dir === 'right' ? -0.3 : 0;
    setPose(n.dir === 'up' ? 'jump' : n.dir === 'down' ? 'sit' : 'cheer', 0.2, lean, n.dir === 'up' ? 0.4 : 0);
    if (grade === 'perfect') fx.burst(tmp.set(panda.position.x, 2.2, panda.position.z), 10, { color: new THREE.Color(DIR_COLOR[n.dir]).getHex(), speed: 3, up: 3 });
    lightTiles(n.dir);
    if (state.combo > 0 && state.combo % 10 === 0) {
      hud.banner(`${ctx.t('combo', { n: state.combo })} ${ctx.t('mult', { m: state.multiplier() })}`, 1100, '#ff4fa3');
      sfx.power();
      fx.burst(tmp.set(0, 2.5, 1), 50);
      hud.say(gang.romain, ctx.t('silo'), 1.8);
    } else if (state.combo > 0 && state.combo % 5 === 0) {
      hud.say(gang.mamar, ctx.t('ole'), 1.2);
    }
  }

  function missArrow(n) {
    n.done = true;
    n.fade = 0.35;
    state.miss();
    showJudge(ctx.t('miss'), '#ff5d5d');
    sfx.hit();
    setPose('hit', 0.3);
    panda.userData.flash();
    shake = 0.2;
  }

  function doAction() {
    const watched = bouncerWatching(state.time, cfg);
    const idx = findNote(notes, 'action', time, cfg, scanFrom);
    if (idx >= 0) {
      const n = notes[idx];
      n.done = true;
      n.fade = 0.3;
      if (n.kind === 'flirt') doFlirt(watched);
      else doRum();
      return;
    }
    if (state.vibeFull()) {
      const pts = state.bottle(watched);
      bottleTimer = 3;
      bottle.visible = true;
      sfx.win();
      hud.banner(ctx.t('bottle'), 2000, '#ffd23d');
      hud.float(panda, `+${pts}`, '#ffd23d', 3.2);
      fx.burst(tmp.set(panda.position.x, 3, panda.position.z), 80, { speed: 5, up: 6 });
      fx.burst(tmp.set(8.5, 2.5, -7), 40, { color: 0xffd23d });
      shake = 0.35;
      hud.say(gang.aline, ctx.t('aline_bottle'), 2);
      hud.say(gang.greg, ctx.tShared('quote_greg'), 2);
      for (const c of Object.values(gang)) c.userData.cheer = 2;
      feralWarned = false;
      return;
    }
    hud.float(panda, ctx.t('not_ready'), '#ffffff', 3);
    sfx.click();
  }

  function doFlirt(watched) {
    const pts = state.flirt(watched);
    // Pick the nearest dancer: the attempt always fails, comically.
    let best = dancers[0];
    for (const d of dancers) if (d.position.distanceTo(panda.position) < best.position.distanceTo(panda.position)) best = d;
    flirtTarget = { dancer: best, t: 1.2 };
    hud.say(panda, ctx.t('flirt_panda'), 1.6);
    setPose('cheer', 0.5, best.position.x < 0 ? 0.25 : -0.25);
    sfx.hoho();
    setTimeout(() => {
      if (ended) return;
      hud.say(best, ctx.t('flirt_fail'), 1.8);
      hud.say(R() < 0.5 ? gang.violaine : gang.eugenie, R() < 0.5 ? ctx.t('violaine_flirt') : ctx.t('eugenie_tease'), 1.8);
    }, 700);
    hud.float(panda, ctx.t('flirt_points', { p: pts }), '#ff8fd0', 3.4);
    showJudge('💘', '#ff4fa3');
  }

  function doRum() {
    state.rum();
    hud.say(gang.mamar, ctx.t('rum_mamar'), 1.8);
    hud.float(panda, ctx.t('rum_float'), '#ffb347', 3.2);
    showJudge('🥃', '#ffb347');
    sfx.power();
    setPose('cheer', 0.4);
    fx.burst(tmp.set(panda.position.x, 2.4, panda.position.z), 24, { color: 0xffb347, speed: 3, up: 3 });
  }

  const PATTERNS = [
    (t, b) => (t.r + t.c + b) % 2 === 0,
    (t, b) => Math.abs(t.c - 4) + Math.abs(t.r - 2.5) <= (b % 4) + 1 && Math.abs(t.c - 4) + Math.abs(t.r - 2.5) > (b % 4) - 0.5,
    (t, b) => t.c === b % COLS || t.c === COLS - 1 - (b % COLS),
    (t, b) => t.r === b % ROWS,
  ];
  function onBeat(b) {
    sfx.beat();
    if (b % 2 === 0) sfx.note(130.8 * Math.pow(2, MELODY[(b / 2) % MELODY.length] / 12));
    const pattern = PATTERNS[Math.floor(b / 8) % PATTERNS.length];
    const color = NEON[b % NEON.length];
    for (const t of tiles) {
      if (pattern(t, b)) { t.m.emissive.set(color); t.level = 1.4; }
    }
    pulse = 1;
    target.classList.add('beat');
    setTimeout(() => target.classList.remove('beat'), 90);
    neonMats.forEach((m, i) => m.color.set(NEON[(b + i) % NEON.length]));
    if (b === 0) hud.banner(ctx.t('ready'), 1500, '#ff8fd0');
    if (b === 4) { hud.banner(ctx.t('go'), 900, '#ffd23d'); sfx.whoosh(); }
  }
  function lightTiles(dir) {
    const color = DIR_COLOR[dir];
    for (const t of tiles) {
      const hit = (dir === 'left' && t.c < 3) || (dir === 'right' && t.c > 5) || (dir === 'up' && t.r < 2) || (dir === 'down' && t.r > 3);
      if (hit) { t.m.emissive.set(color); t.level = 1.8; }
    }
  }

  // --- Lifecycle ---------------------------------------------------------------------
  function start() {
    document.head.appendChild(style);
    hud.el.appendChild(pad);
    hud.setObjective(ctx.t('objective'));
    buttons = hud.buttons([{ id: 'act', label: '🍾', side: 'right', onDown: () => { actionQueued = true; } }]);
    hud.say(panda, ctx.tShared('quote_panda'), 2);
    hud.say(victor, ctx.t('victor_door'), 3);
  }

  function update(rawDt) {
    if (ended) { afterEnd(rawDt); return; }
    const dt = rawDt;
    time += dt;
    const watched = bouncerWatching(state.time, cfg);
    const ev = state.step(dt);

    // Beats
    const b = Math.floor(time / beatLen);
    if (b !== lastBeat) { lastBeat = b; onBeat(b); }
    if (Math.floor(time / (beatLen / 2)) % 2 === 1 && Math.floor((time - dt) / (beatLen / 2)) % 2 === 0) sfx.hat();

    // Notes: spawn ahead, judge input, detect misses
    while (spawnIdx < notes.length && notes[spawnIdx].t - cfg.lead <= time) spawnNoteEl(notes[spawnIdx++]);
    const dirsNow = new Set();
    for (const d of DIRS) if (input.pressed(d)) dirsNow.add(d);
    for (const s of input.swipes) if (!input.held(s)) dirsNow.add(s);
    for (const d of dirsNow) {
      const idx = findNote(notes, d, time, cfg, scanFrom);
      if (idx >= 0) hitArrow(notes[idx], judge(notes[idx].t - time, cfg));
      else {
        state.stray(watched);
        setPose('hit', 0.15, d === 'left' ? 0.4 : d === 'right' ? -0.4 : 0);
        sfx.click();
      }
    }
    if (input.pressed('action') || input.taps.length > 0 || actionQueued) doAction();
    actionQueued = false;
    for (let i = scanFrom; i < spawnIdx; i++) {
      const n = notes[i];
      if (!n.done && time - n.t > cfg.good) {
        if (n.kind === 'arrow') missArrow(n);
        else { n.done = true; n.fade = 0.3; }
      }
    }
    // Move the note elements
    const D = Math.min(window.innerWidth * 0.34, window.innerHeight * 0.3, 280);
    for (let i = scanFrom; i < spawnIdx; i++) {
      const n = notes[i];
      if (!n.el) continue;
      if (n.done) {
        n.fade -= dt;
        n.el.style.opacity = String(Math.max(0, n.fade * 3));
        if (n.grade) n.el.style.transform = `scale(${1.6 - n.fade * 2})`;
        if (n.fade <= 0) { n.el.remove(); n.el = null; }
        continue;
      }
      const k = (n.t - time) / cfg.lead; // 1 far .. 0 on the ring
      if (n.kind === 'arrow') {
        const [vx, vy] = DIR_VEC[n.dir];
        n.el.style.transform = `translate(${vx * D * k}px, ${vy * D * k}px)`;
        n.el.style.opacity = String(Math.min(1, (1 - k) * 4));
      } else {
        n.el.style.transform = `scale(${1 + Math.max(0, k) * 2.4})`;
        n.el.style.opacity = String(Math.min(1, (1 - k) * 3));
      }
    }
    while (scanFrom < spawnIdx && notes[scanFrom].done && !notes[scanFrom].el) scanFrom++;

    // Meters and warnings
    hud.meter('vibe', state.vibe, state.vibeFull() ? '#ffd23d' : '#ff4fa3', ctx.t('vibe'));
    hud.meter('wild', state.wild, state.wild > 0.7 ? '#ff2b2b' : '#ff8a3d', `${ctx.t('wild')}${watched ? ' 👀' : ''}`);
    hud.meter('tired', state.tired, state.tired > 0.75 ? '#7fb3ff' : '#9aa5c4', ctx.t('tired'));
    target.classList.toggle('ready', state.vibeFull());
    hint.textContent = ctx.t('bottle_ready');
    hint.classList.toggle('show', state.vibeFull());
    if (buttons?.act) buttons.act.style.background = state.vibeFull() ? '#ffd23d' : '';
    if (state.vibeFull() && !feralWarned) { feralWarned = true; hud.float(panda, ctx.t('feral'), '#ff8a3d', 3.4); }
    if (watched && !wasWatching) { hud.say(bouncer, ctx.t('watch'), 2); if (state.wild > 0.3) hud.banner(ctx.t('watch_banner'), 1100, '#ff5d5d'); }
    wasWatching = watched;
    if (state.wild > 0.72 && !calmWarned) { calmWarned = true; hud.say(bouncer, ctx.t('calm'), 2); sfx.click(); }
    if (state.wild < 0.5) calmWarned = false;
    if (state.tired > 0.75 && !yawned) { yawned = true; hud.say(panda, ctx.t('yawn'), 2.4); }
    if (state.tired < 0.65) yawned = false;
    hud.setScore(state.score);
    hud.setProgress(state.progress(), clubTime());

    animateScene(dt, watched);

    // Gang events
    if (!cousLeaving && state.progress() > 0.3) {
      cousLeaving = true;
      hud.say(gang.cous, ctx.t('cous_leave'), 2.6);
    }
    victorTimer -= dt;
    if (victorTimer <= 0) { victorTimer = 9 + R() * 6; hud.say(victor, ctx.t('victor_door'), 2.4); }
    spitTimer -= dt;
    if (spitTimer <= 0) {
      spitTimer = 11 + R() * 7;
      hud.say(gang.babar, ctx.t('babar_spit'), 1.4);
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#d8f6ff' }));
      gang.babar.getWorldPosition(blob.position);
      blob.position.y += 2.2;
      root.add(blob);
      spits.push({ mesh: blob, v: new THREE.Vector3((panda.position.x - blob.position.x) * 0.9, 3.5, (panda.position.z - 0.3 - blob.position.z) * 0.9), t: 0 });
    }
    quoteTimer -= dt;
    if (quoteTimer <= 0) {
      quoteTimer = 3.5 + R() * 3;
      const ids = ['greg', 'aline', 'eugenie', 'violaine', 'romain', 'mamar'];
      const id = ids[Math.floor(R() * ids.length)];
      hud.say(gang[id], id === 'eugenie' ? ctx.t('eugenie_line') : ctx.tShared(`quote_${id}`), 2);
    }

    // End of the night
    if (ev.ended || state.over) {
      ended = true;
      pad.style.display = 'none';
      hud.buttons([]);
      if (state.won) {
        hud.banner(ctx.t('closing'), 2000, '#ffffff');
        for (const t of tiles) { t.m.emissive.set('#ffffff'); t.level = 1; }
        fx.burst(tmp.set(0, 3, 1), 100);
        ctx.finish({ score: state.score, stars: state.stars(), line: ctx.t('win_line') });
      } else if (state.reason === 'bouncer') {
        hud.say(bouncer, ctx.t('calm'), 2.5);
        ctx.fail({ score: state.score, line: ctx.t('lose_bouncer') });
      } else {
        panda.position.set(8.6, 0.25, -1.2);
        panda.rotation.y = Math.PI / 2;
        hud.say(panda, ctx.t('zzz'), 4);
        ctx.fail({ score: state.score, line: ctx.t('lose_asleep', { time: clubTime() }) });
      }
    }
  }

  function animateScene(dt, watched) {
    // Tiles fade between beats
    for (const t of tiles) {
      t.level = Math.max(0.08, t.level - dt * 3);
      t.m.emissiveIntensity = t.level;
    }
    pulse = Math.max(0, pulse - dt * 5);
    ball.rotation.y += dt * 0.8;
    beams.rotation.y += dt * 0.6;
    colorLights.forEach((l, i) => {
      const a = time * (0.7 + i * 0.25) + i * 2.1;
      l.position.set(Math.cos(a) * 6, 4.5, -2 + Math.sin(a) * 4);
      l.intensity = 25 + pulse * 25;
    });
    for (const sp of speakers) sp.scale.setScalar(1 + pulse * 0.04);
    sofaGlow.material.opacity = state.tired > 0.6 ? (0.15 + Math.sin(time * 3) * 0.1) * (state.tired - 0.4) * 2 : 0;
    if (state.tired > 0.75 && Math.floor(time * 0.8) !== Math.floor((time - dt) * 0.8)) hud.float(sofa, ctx.t('zzz'), '#7fb3ff', 1.4);

    // Panda
    let anim = 'dance';
    let lean = 0;
    let lift = 0;
    if (pose) {
      pose.t -= dt;
      anim = pose.anim; lean = pose.lean; lift = pose.lift;
      if (pose.t <= 0) pose = null;
    }
    const drowsy = state.tired > 0.7 ? (state.tired - 0.7) * 3 : 0;
    panda.userData.animate(dt * (1 - drowsy * 0.5), anim);
    panda.position.set(pandaHome.x, pandaHome.y + lift, pandaHome.z);
    panda.rotation.z += (lean + Math.sin(time * 1.5) * drowsy * 0.25 - panda.rotation.z) * Math.min(1, dt * 14);
    let faceY = 0;
    if (flirtTarget) {
      flirtTarget.t -= dt;
      faceY = Math.atan2(flirtTarget.dancer.position.x - panda.position.x, flirtTarget.dancer.position.z - panda.position.z);
      if (flirtTarget.t <= 0) {
        // The dancer politely moves to another spot.
        const d = flirtTarget.dancer;
        const free = DANCER_SPOTS.findIndex((_, i) => !dancers.some((o) => o.userData.spot === i));
        if (free >= 0) { d.userData.spot = free; d.userData.target.set(DANCER_SPOTS[free][0], 0.1, DANCER_SPOTS[free][1]); }
        flirtTarget = null;
      }
    }
    panda.rotation.y += (faceY - panda.rotation.y) * Math.min(1, dt * 8);
    if (bottleTimer > 0) {
      bottleTimer -= dt;
      panda.userData.parts.armR.rotation.z = -2.6;
      spark.scale.setScalar(0.7 + Math.random() * 0.8);
      if (Math.random() < dt * 20) { bottle.getWorldPosition(tmp); tmp.y += 0.6; fx.burst(tmp, 2, { color: 0xfff3a0, speed: 2, up: 2 }); }
      if (bottleTimer <= 0) bottle.visible = false;
    }

    // The gang
    for (const [id, c] of Object.entries(gang)) {
      if (id === 'cous' && cousLeaving) {
        if (cousGone) continue;
        tmp.set(-8.5, 0, -8.6);
        const d = tmp.sub(c.position);
        if (d.length() < 0.3) { cousGone = true; c.visible = false; continue; }
        d.y = 0;
        d.normalize();
        c.position.addScaledVector(d, dt * 2.2);
        c.rotation.y = Math.atan2(d.x, d.z);
        c.userData.animate(dt, 'run');
        continue;
      }
      if (c.userData.cheer > 0) { c.userData.cheer -= dt; c.userData.animate(dt, 'cheer'); } else c.userData.animate(dt * c.userData.speed, 'dance');
    }
    victor.userData.animate(dt, 'idle');
    victor.rotation.y = Math.sin(time * 0.5) * 0.4;
    for (const d of dancers) {
      const to = d.userData.target;
      const dx = to.x - d.position.x;
      const dz = to.z - d.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.1) {
        d.position.x += (dx / dist) * Math.min(dist, dt * 3);
        d.position.z += (dz / dist) * Math.min(dist, dt * 3);
        d.rotation.y = Math.atan2(dx, dz);
        d.userData.animate(dt, 'run');
      } else {
        d.rotation.y += (Math.atan2(-d.position.x, 6 - d.position.z) - d.rotation.y) * Math.min(1, dt * 4);
        d.userData.animate(dt, 'dance');
      }
    }

    // The bouncer patrols, then stands by Panda and watches.
    const phase = ((state.time % cfg.patrol) / cfg.patrol) / (1 - cfg.watchShare);
    if (watched) tmp.set(2.7, 0, 0.6);
    else { const a = phase * Math.PI * 2; tmp.set(Math.cos(a) * 7, 0, -5.2 + Math.sin(a) * 1.2); }
    moveBouncer(tmp, dt, watched);

    // Babar's spit
    for (let i = spits.length - 1; i >= 0; i--) {
      const s = spits[i];
      s.t += dt;
      s.v.y -= 9 * dt;
      s.mesh.position.addScaledVector(s.v, dt);
      if (s.mesh.position.y < 0.9 || s.t > 2) {
        if (s.mesh.position.distanceTo(panda.position) < 1.6) { hud.say(panda, ctx.t('panda_spit'), 1.4); panda.userData.flash(); }
        fx.burst(s.mesh.position, 8, { color: 0xd8f6ff, speed: 1.5, up: 1 });
        root.remove(s.mesh);
        spits.splice(i, 1);
      }
    }

    // Camera: front view, pulsing on the beat
    shake = Math.max(0, shake - dt);
    const aspect = camera.aspect || 1.6;
    const back = aspect < 1 ? 10 + (1 - aspect) * 9 : 9.5;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    camera.position.set(sx + Math.sin(time * 0.3) * 0.6, 3.6 + pulse * 0.05, back - pulse * 0.25);
    camera.lookAt(0, 1.8, -1);
  }

  function moveBouncer(to, dt, watching) {
    const dx = to.x - bouncer.position.x;
    const dz = to.z - bouncer.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.15) {
      const sp = Math.min(dist, dt * 3.5);
      bouncer.position.x += (dx / dist) * sp;
      bouncer.position.z += (dz / dist) * sp;
      bouncer.rotation.y = Math.atan2(dx, dz);
      bouncer.userData.animate(dt * 0.6, 'run');
    } else {
      const look = watching ? Math.atan2(panda.position.x - bouncer.position.x, panda.position.z - bouncer.position.z) : 0;
      bouncer.rotation.y += (look - bouncer.rotation.y) * Math.min(1, dt * 5);
      bouncer.userData.animate(dt, 'idle');
      bouncer.userData.parts.armL.rotation.z = 1.2;
      bouncer.userData.parts.armR.rotation.z = -1.2;
    }
  }

  // After the end, the scene keeps living (slowed down by the shell).
  function afterEnd(dt) {
    time += dt;
    if (state.reason === 'bouncer') {
      // The bouncer escorts Panda to the door.
      tmp.set(-8.5, 0, -8.2);
      moveBouncer(tmp, dt * 4, false);
      panda.position.set(bouncer.position.x + 0.8, 0.3, bouncer.position.z + 0.3);
      panda.userData.animate(dt * 4, 'hit');
    } else if (state.reason === 'asleep') {
      panda.userData.animate(dt, 'sit');
    } else {
      panda.userData.animate(dt * 4, 'cheer');
    }
    for (const [id, c] of Object.entries(gang)) if (!(id === 'cous' && cousGone)) c.userData.animate(dt * 4, 'cheer');
    for (const d of dancers) d.userData.animate(dt * 4, 'dance');
    victor.userData.animate(dt * 4, state.reason === 'bouncer' ? 'cheer' : 'idle');
  }

  function dispose() {
    style.remove();
    pad.remove();
    signTex.dispose();
    spits.length = 0;
  }

  return { start, update, dispose, state, notes };
}

