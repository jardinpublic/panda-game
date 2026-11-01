// World 2 - "Le concert en visio": Panda plays guitar at his desk during a
// work video call, mic open. Notes slide down a giant guitar neck onto three
// pads (arrows ← ↓ → or the three big buttons). On the big screen, the call:
// Romain the boss, Mamar eating, Greg half asleep (US time), Aline, Eugénie,
// Victor, Cous, Violaine, and Babar photobombing. When the boss is about to
// look at his camera (⚠️ countdown), hit MUTE (Space / button) in time.
//
// The call grid is a real little 3D scene rendered into a texture, tile by
// tile, so every colleague is a live animated character.

import { createConcert, sectionAt, LEAD_IN } from './rules.js';

export const MODELS = ['office', 'nature'];

export const TEXTS = {
  en: {
    howto: [
      'Arrows ← ↓ → (or the 3 big buttons): play each note as it hits its pad.',
      'When the boss is about to look at his camera (⚠️ countdown), hit MUTE (Space)!',
      'Mute late for a clutch bonus. Muting for nothing kills your combo.',
      'Hit streaks raise the multiplier up to x4. Finish the song!',
    ],
    objective: 'Play the song. Mute before the boss looks!',
    go: 'Mic open… let\'s rock! 🎸',
    perfect: 'PERFECT', good: 'GOOD', miss: 'MISS', stray: 'CLONK',
    warn: '⚠️ The boss is about to look!', look: '👀 He\'s looking!',
    saved: '🔇 Muted! Phew', clutch: '🔇 CLUTCH MUTE!', useless: 'Muted for nothing: combo lost!', late: 'Too late!',
    caught: '😱 CAUGHT!', mute_btn: '🔇 MUTE', muted: 'MUTED', live: 'LIVE',
    combo: 'Combo x{m}', boss: 'Boss', meeting: 'Weekly meeting · Government Administration',
    you: 'Panda (you)', boss_name: 'Romain (boss)',
    caught_line: ['Panda… is that a guitar?!', 'Panda, are you giving a concert?', 'Is someone playing guitar?'],
    safe_line: ['Hmm. All good. Carry on.', 'Right. Next slide.', 'Panda, your mic is off again?'],
    mamar_eat: ['Nom nom… sorry, lunch.', 'Aïe aïe aïe, this sandwich!', 'Olé! (mouth full)'],
    greg_sleep: ['Zzz… it\'s 5 am here…', 'Zzz…'], greg_wake: ['Huh? Le crapa!', 'I\'m awake! I\'m awake!'],
    aline_cheer: ['Bravo Panda!', 'So talented!'], eugenie_cheer: ['Encore! Encore!', 'Bisous the artist!'],
    violaine_awk: ['Awkward!', 'Malaisant!'], victor_style: ['Stylish riff!', 'Nice one, monkey!'],
    cous_rock: ['Old Cous approves! 🤘', 'That\'s rock\'n\'roll!'],
    babar_bomb: ['*lighter tap* 🔥', 'Shave it all off!', 'What do I have to do with it?!'],
    combo_banner: '{n} combo! 🔥',
    verse: 'Verse', chorus: 'Chorus!', bridge: 'Bridge', finale: 'Final chorus!',
    win: 'Standing ovation in the call. Romain never noticed. Hoho.',
    win3: 'Flawless! The meeting turned into a fan club. Hoho.',
    lose: 'Romain: "Panda, my office. Bring the guitar."',
  },
  fr: {
    howto: [
      'Flèches ← ↓ → (ou les 3 gros boutons) : joue chaque note quand elle touche son rond.',
      'Quand le chef va regarder sa caméra (compte à rebours ⚠️), coupe le MICRO (Espace) !',
      'Coupe au dernier moment pour un bonus. Couper pour rien casse ton combo.',
      'Les séries font monter le multiplicateur jusqu\'à x4. Finis la chanson !',
    ],
    objective: 'Joue la chanson. Coupe le micro avant que le chef regarde !',
    go: 'Micro ouvert… on y va ! 🎸',
    perfect: 'PARFAIT', good: 'BIEN', miss: 'RATÉ', stray: 'CLONK',
    warn: '⚠️ Le chef va regarder !', look: '👀 Il regarde !',
    saved: '🔇 Micro coupé ! Ouf', clutch: '🔇 COUPÉ IN EXTREMIS !', useless: 'Coupé pour rien : combo perdu !', late: 'Trop tard !',
    caught: '😱 GRILLÉ !', mute_btn: '🔇 MUET', muted: 'MUET', live: 'EN DIRECT',
    combo: 'Combo x{m}', boss: 'Chef', meeting: 'Réunion hebdo · Administration publique',
    you: 'Panda (toi)', boss_name: 'Romain (le chef)',
    caught_line: ['Panda… c\'est une guitare ?!', 'Panda, te fais un concert ?', 'Y a quelqu\'un qui joue de la guitare ?'],
    safe_line: ['Hmm. Bon. On continue.', 'Bien. Slide suivante.', 'Panda, encore ton micro coupé ?'],
    mamar_eat: ['Miam… pardon, je mange.', 'Aïe aïe aïe, ce sandwich !', 'Olé ! (la bouche pleine)'],
    greg_sleep: ['Zzz… il est 5 h ici…', 'Zzz…'], greg_wake: ['Hein ? Le crapa !', 'Je dors pas ! Je dors pas !'],
    aline_cheer: ['Bravo Panda !', 'Quel talent !'], eugenie_cheer: ['Une autre ! Une autre !', 'Bisous l\'artiste !'],
    violaine_awk: ['Malaisant !', 'Gênant !'], victor_style: ['Stylé le riff !', 'Bon boulot l\'🐒 !'],
    cous_rock: ['Old Cous valide ! 🤘', 'Ça c\'est du rock\'n\'roll !'],
    babar_bomb: ['*coup de briquet* 🔥', 'Rase z\'y tout !', 'Qué don\' qu\' j\'ai à voir ?!'],
    combo_banner: '{n} combo ! 🔥',
    verse: 'Couplet', chorus: 'Refrain !', bridge: 'Pont', finale: 'Refrain final !',
    win: 'Ovation debout dans la visio. Romain n\'a rien vu. Hoho.',
    win3: 'Sans faute ! La réunion est devenue un fan-club. Hoho.',
    lose: 'Romain : « Panda, dans mon bureau. Avec la guitare. »',
  },
};

const LANE_COLORS = ['#38d39f', '#ffd84a', '#ff5d8f'];
const LANE_X = [-1.1, 0, 1.1];
const HIT_Z = 2.4;
const TRACK_LEN = 6.2;
const NECK_Y = 1.05;
const NOTE_Y = NECK_Y + 0.16;
const TILE_IDS = ['romain', 'mamar', 'greg', 'aline', 'panda', 'eugenie', 'victor', 'cous', 'violaine'];
const SCREEN = { w: 6.2, h: 3.875, y: 3.35, z: -4.45 };
const RT_W = 960;
const RT_H = 600;
const TILE_W = RT_W / 3;
const TILE_H = RT_H / 3;
const TILE_SPACING = 12;
const MELODY = [0, 4, 7, 9, 7, 4, 2, 4];

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models, renderer } = ctx;
  const state = createConcert({ mode: ctx.mode, rand: ctx.random });
  const cfg = state.cfg;
  const beat = 60 / cfg.bpm;
  const disposables = [];
  const tmp = new THREE.Vector3();

  let ended = false;
  let shake = 0;
  let lastNow = 0;
  let nextMusicAt = LEAD_IN - beat / 2;
  let countIn = 0;
  let section = '';
  let chatterTimer = 6;
  let rtTimer = 0;
  let strum = 0;
  let redFlash = 0;
  let lastMultiplier = 1;
  let overlayDirty = true;
  let lastWarnNumber = -1;
  const laneQueue = [];
  let muteQueued = false;

  // --- Small builders -----------------------------------------------------------------
  function track(x) { disposables.push(x); return x; }
  function mat(color, extra = {}) { return track(new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra })); }
  function box(w, h, d, color, x = 0, y = 0, z = 0, extra) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    track(tex);
    return tex;
  }
  function model(name, opts, fallback) {
    return models.get(name, opts) || fallback();
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function makeGuitar(color) {
    const g = new THREE.Group();
    const bodyMat = mat(color, { roughness: 0.35 });
    const lower = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12), bodyMat);
    lower.scale.set(1, 1, 0.32);
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), bodyMat);
    upper.scale.set(1, 1, 0.32);
    upper.position.x = 0.3;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.08, 18), mat('#1a1010'));
    hole.position.set(0.2, 0, 0.1);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.05), mat('#6b3e1e'));
    neck.position.x = 0.85;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.05), mat('#2a1a10'));
    head.position.x = 1.38;
    g.add(lower, upper, hole, neck, head);
    return g;
  }

  // --- The room (Panda's home office in Martinique) ----------------------------------
  ctx.setupSky({ top: '#3aa7f0', bottom: '#ffe3b8', fog: 0xffe3b8, fogNear: 30, fogFar: 90 });
  const sun = ctx.addLights(root);
  sun.position.set(6, 14, 10);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 26), mat('#e2b07a', { roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  root.add(box(30, 10, 0.3, '#fff1d6', 0, 5, -7.2));
  root.add(box(0.3, 10, 26, '#ffd9a8', -11, 5, 0));
  root.add(box(0.3, 10, 26, '#ffd9a8', 11, 5, 0));
  const seaView = canvasTexture(256, 192, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#4fb8ff'); sky.addColorStop(1, '#bfeaff');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe066'; g.beginPath(); g.arc(w * 0.78, h * 0.22, 18, 0, 7); g.fill();
    g.fillStyle = '#16a3c4'; g.fillRect(0, h * 0.58, w, h * 0.42);
    g.fillStyle = '#7fe0f0'; for (let i = 0; i < 8; i++) g.fillRect((i * 37) % w, h * 0.66 + (i % 3) * 14, 24, 3);
    g.fillStyle = '#f6dca0'; g.fillRect(0, h * 0.88, w, h);
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, h); g.quadraticCurveTo(52, h * 0.5, 34, h * 0.3); g.stroke();
    g.fillStyle = '#2f9a4a';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(34, h * 0.3, 40, 9, i * 0.55, 0, 7); g.fill(); }
  });
  for (const x of [-7.6, 7.6]) {
    const frame = box(4.6, 3.6, 0.15, '#ffffff', x, 4.6, -7);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), track(new THREE.MeshBasicMaterial({ map: seaView })));
    glass.position.set(x, 4.6, -6.9);
    root.add(frame, glass);
  }
  const rug = model('rugRound', { width: 7 }, () => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(3.5, 32), mat('#ff8fab'));
    m.rotation.x = -Math.PI / 2;
    const g = new THREE.Group(); g.add(m); return g;
  });
  rug.position.set(-2.8, 0.01, 2.4);
  root.add(rug);
  const plantL = model('pottedPlant', { height: 2.2 }, () => box(0.8, 2.2, 0.8, '#3fae5a', 0, 1.1, 0));
  plantL.position.set(-9.2, 0, -5.6);
  const plantR = model('pottedPlant', { height: 2.6 }, () => box(0.8, 2.6, 0.8, '#3fae5a', 0, 1.3, 0));
  plantR.position.set(9.3, 0, -5.4);
  const shelf = model('bookcaseOpen', { height: 3.4 }, () => box(2, 3.4, 0.6, '#b07a46', 0, 1.7, 0));
  shelf.position.set(-10.3, 0, -1);
  shelf.rotation.y = Math.PI / 2;
  root.add(plantL, plantR, shelf);

  // Desk, speakers and the big screen.
  root.add(box(9, 0.14, 1.9, '#c58b4f', 0, 1.0, -4.5));
  for (const x of [-4.2, 4.2]) root.add(box(0.14, 1, 1.6, '#9c6a3a', x, 0.5, -4.5));
  for (const x of [-4.1, 4.1]) {
    const spk = model('speaker', { height: 1.3 }, () => box(0.8, 1.3, 0.7, '#22252e', 0, 0.65, 0));
    spk.position.set(x, 1.07, -4.6);
    root.add(spk);
  }
  const FRAME_H = 4.55;
  root.add(box(6.6, FRAME_H, 0.3, '#1d2029', 0, SCREEN.y + 0.2, -4.65));
  root.add(box(0.5, 0.6, 0.3, '#2a2e38', 0, 1.36, -4.7));
  const webcamLed = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), track(new THREE.MeshBasicMaterial({ color: '#ff3b3b' })));
  webcamLed.position.set(0.4, SCREEN.y + 0.2 + FRAME_H / 2 - 0.12, -4.48);
  const webcam = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat('#0c0d10'));
  webcam.position.set(0, SCREEN.y + 0.2 + FRAME_H / 2 - 0.12, -4.5);
  root.add(webcam, webcamLed);

  // The call: rendered into this target, tile by tile.
  const rt = new THREE.WebGLRenderTarget(RT_W, RT_H);
  disposables.push(rt);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), track(new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false })));
  screen.position.set(0, SCREEN.y, SCREEN.z);
  root.add(screen);

  // Overlay: grid lines, names, mic badge (redrawn only when something changes).
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = RT_W;
  overlayCanvas.height = RT_H;
  const overlayTex = track(new THREE.CanvasTexture(overlayCanvas));
  overlayTex.colorSpace = THREE.SRGBColorSpace;
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), track(new THREE.MeshBasicMaterial({ map: overlayTex, transparent: true, toneMapped: false })));
  overlay.position.set(0, SCREEN.y, SCREEN.z + 0.01);
  root.add(overlay);
  function drawOverlay() {
    const g = overlayCanvas.getContext('2d');
    g.clearRect(0, 0, RT_W, RT_H);
    g.fillStyle = '#14161c';
    for (let i = 1; i < 3; i++) {
      g.fillRect(i * TILE_W - 4, 0, 8, RT_H);
      g.fillRect(0, i * TILE_H - 4, RT_W, 8);
    }
    g.font = 'bold 20px sans-serif';
    g.textBaseline = 'middle';
    TILE_IDS.forEach((id, i) => {
      const x = (i % 3) * TILE_W;
      const y = Math.floor(i / 3) * TILE_H;
      const name = id === 'panda' ? ctx.t('you') : id === 'romain' ? ctx.t('boss_name') : id[0].toUpperCase() + id.slice(1).replace('genie', 'génie');
      const w = g.measureText(name).width + 20;
      g.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(g, x + 10, y + TILE_H - 38, w, 28, 8);
      g.fill();
      g.fillStyle = '#fff';
      g.fillText(name, x + 20, y + TILE_H - 24);
      if (id === 'panda') {
        const muted = state.muted();
        const label = muted ? `🔇 ${ctx.t('muted')}` : `🎙️ ${ctx.t('live')}`;
        const lw = g.measureText(label).width + 22;
        g.fillStyle = muted ? '#e63946' : '#2bb673';
        roundRect(g, x + TILE_W - lw - 10, y + 10, lw, 30, 15);
        g.fill();
        g.fillStyle = '#fff';
        g.fillText(label, x + TILE_W - lw + 1, y + 25);
        if (!muted) {
          g.strokeStyle = '#2bb673';
          g.lineWidth = 6;
          g.strokeRect(x + 7, y + 7, TILE_W - 14, TILE_H - 14);
        }
      } else if (id !== 'romain') {
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.beginPath(); g.arc(x + TILE_W - 26, y + 26, 15, 0, 7); g.fill();
        g.fillStyle = '#fff';
        g.fillText('🔇', x + TILE_W - 37, y + 27);
      }
    });
    overlayTex.needsUpdate = true;
  }

  // Title bar of the call on the top bezel.
  const titleTex = canvasTexture(1024, 64, (g, w, h) => {
    g.fillStyle = '#1d2029'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff3b3b'; g.beginPath(); g.arc(30, h / 2, 10, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.textBaseline = 'middle';
    g.fillText(`REC  ·  ${ctx.t('meeting')}  ·  9 👥`, 52, h / 2);
  });
  const titleBar = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.39), track(new THREE.MeshBasicMaterial({ map: titleTex, toneMapped: false })));
  titleBar.position.set(0, SCREEN.y + SCREEN.h / 2 + 0.26, SCREEN.z);
  root.add(titleBar);

  // Tile positions on the big screen (anchors for speech bubbles).
  const tileAnchor = {};
  TILE_IDS.forEach((id, i) => {
    const o = new THREE.Object3D();
    o.position.set(-SCREEN.w / 2 + SCREEN.w / 6 + (i % 3) * SCREEN.w / 3, SCREEN.y + SCREEN.h / 2 - SCREEN.h / 6 - Math.floor(i / 3) * SCREEN.h / 3, SCREEN.z + 0.05);
    root.add(o);
    tileAnchor[id] = o;
  });

  // Boss warning: red frame around his tile, a countdown sign and a red flash.
  const warnMat = track(new THREE.MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0, toneMapped: false }));
  const bossFrame = new THREE.Group();
  const tw = SCREEN.w / 3;
  const th = SCREEN.h / 3;
  for (const [w, h, x, y] of [[tw, 0.12, 0, th / 2], [tw, 0.12, 0, -th / 2], [0.12, th, -tw / 2, 0], [0.12, th, tw / 2, 0]]) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, h), warnMat);
    bar.position.set(x, y, 0);
    bossFrame.add(bar);
  }
  bossFrame.position.copy(tileAnchor.romain.position).setZ(SCREEN.z + 0.03);
  root.add(bossFrame);
  const flashMat = track(new THREE.MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0, toneMapped: false }));
  const flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), flashMat);
  flashPlane.position.set(0, SCREEN.y, SCREEN.z + 0.04);
  root.add(flashPlane);
  const warnCanvas = document.createElement('canvas');
  warnCanvas.width = 256;
  warnCanvas.height = 256;
  const warnTex = track(new THREE.CanvasTexture(warnCanvas));
  warnTex.colorSpace = THREE.SRGBColorSpace;
  const warnSign = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: warnTex, transparent: true, depthTest: false })));
  warnSign.scale.set(1.5, 1.5, 1);
  warnSign.position.set(-SCREEN.w / 2 - 0.8, tileAnchor.romain.position.y - 0.1, SCREEN.z + 0.5);
  warnSign.renderOrder = 5;
  warnSign.visible = false;
  root.add(warnSign);
  function drawWarn(text) {
    const g = warnCanvas.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = '#ff2a2a';
    g.beginPath(); g.arc(128, 128, 116, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#fff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 64px sans-serif';
    g.fillText('👀', 128, 84);
    g.font = 'bold 96px sans-serif';
    g.fillText(text, 128, 170);
    warnTex.needsUpdate = true;
  }

  // --- The guitar-neck highway --------------------------------------------------------
  const neckTex = canvasTexture(128, 512, (g, w, h) => {
    g.fillStyle = '#3b2215'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 40; i++) g.fillRect(0, i * 13, w, 4);
    g.fillStyle = '#f4ead2';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w / 2, 64 + i * 128, 10, 0, 7); g.fill(); }
  });
  const neckLen = TRACK_LEN + 1.2;
  const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.14, neckLen), track(new THREE.MeshStandardMaterial({ map: neckTex, roughness: 0.6 })));
  neckMesh.position.set(0, NECK_Y, HIT_Z + 0.6 - neckLen / 2);
  neckMesh.receiveShadow = true;
  root.add(neckMesh);
  for (const x of [-1.8, 1.8]) root.add(box(0.1, 0.18, neckLen, '#f4ead2', x, NECK_Y, neckMesh.position.z));
  const pads = [];
  const padMats = [];
  LANE_X.forEach((x, lane) => {
    root.add(box(0.05, 0.05, neckLen, LANE_COLORS[lane], x, NECK_Y + 0.09, neckMesh.position.z, { emissive: LANE_COLORS[lane], emissiveIntensity: 0.6 }));
    const pm = mat(LANE_COLORS[lane], { emissive: LANE_COLORS[lane], emissiveIntensity: 0.35 });
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 32), pm);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, NECK_Y + 0.12, HIT_Z);
    root.add(pad);
    pads.push({ mesh: pad, glow: 0, mat: pm, base: new THREE.Color(LANE_COLORS[lane]) });
    padMats.push(pm);
  });
  root.add(box(3.5, 0.03, 0.08, '#ffffff', 0, NECK_Y + 0.08, HIT_Z, { emissive: '#ffffff', emissiveIntensity: 0.5 }));
  const frets = [];
  const fretMat = mat('#d9dde3', { metalness: 0.7, roughness: 0.3 });
  const fretGeo = new THREE.BoxGeometry(3.5, 0.04, 0.07);
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(fretGeo, fretMat);
    f.visible = false;
    root.add(f);
    frets.push(f);
  }
  // Notes: a pool of glowing guitar picks.
  const noteGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.14, 3);
  noteGeo.rotateY(Math.PI / 6);
  const laneMats = LANE_COLORS.map((c) => mat(c, { emissive: c, emissiveIntensity: 0.55, roughness: 0.3 }));
  const ghostMat = mat('#9aa0aa', { transparent: true, opacity: 0.35 });
  const missMat = mat('#5a2a2a', { transparent: true, opacity: 0.6 });
  const pool = [];
  for (let i = 0; i < 32; i++) {
    const m = new THREE.Mesh(noteGeo, laneMats[0]);
    m.castShadow = true;
    m.visible = false;
    root.add(m);
    pool.push(m);
  }
  const noteMesh = new Array(state.notes.length).fill(null);
  let firstVisible = 0;

  // --- Panda at his desk with his guitar ------------------------------------------------
  const panda = ctx.character('panda');
  panda.position.set(-3.3, 0.42, 2.1);
  panda.rotation.y = 0.55;
  const guitar = makeGuitar('#d9480f');
  guitar.position.set(-0.2, 0.85, 0.34);
  guitar.rotation.z = 0.35;
  panda.userData.parts.body.add(guitar);
  root.add(panda);
  const chair = model('chairDesk', { height: 1.3 }, () => box(0.9, 0.5, 0.9, '#2a2e38', 0, 0.25, 0));
  chair.position.set(-3.3, 0, 1.9);
  chair.rotation.y = 0.55 + Math.PI;
  root.add(chair);
  const amp = box(0.9, 0.8, 0.5, '#26262b', -4.6, 0.4, 3.0);
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), mat('#555'));
  grille.position.set(0, 0.05, 0.26);
  amp.add(grille);
  amp.rotation.y = 0.5;
  root.add(amp);

  // --- The video call scene (rendered into rt) ----------------------------------------
  const call = new THREE.Scene();
  call.background = new THREE.Color('#1c1f27');
  call.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
  const callKey = new THREE.DirectionalLight(0xfff4e0, 1.7);
  callKey.position.set(2, 5, 6);
  call.add(callKey);
  const tileCam = new THREE.PerspectiveCamera(36, TILE_W / TILE_H, 0.1, 30);

  function backdrop(id) {
    return canvasTexture(512, 360, (g, w, h) => {
      const fill = (c) => { g.fillStyle = c; g.fillRect(0, 0, w, h); };
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      switch (id) {
        case 'romain':
          fill('#cfe0f2');
          g.fillStyle = '#fff'; g.fillRect(40, 50, 170, 120);
          g.strokeStyle = '#2bb673'; g.lineWidth = 8; g.beginPath(); g.moveTo(55, 150); g.lineTo(100, 120); g.lineTo(140, 135); g.lineTo(195, 65); g.stroke();
          g.fillStyle = '#1d3557'; g.fillRect(320, 40, 160, 110);
          g.fillStyle = '#ffd84a'; g.font = 'bold 26px sans-serif'; g.fillText('FOR THE', 400, 78); g.fillText('SILO!', 400, 112);
          break;
        case 'mamar':
          fill('#f4f1ea');
          g.strokeStyle = '#d8d2c4'; g.lineWidth = 2;
          for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
          for (let y = 0; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
          for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? '#fff' : '#75b7e8'; g.fillRect(330, 40 + i * 40, 150, 40); }
          g.fillStyle = '#f6b40e'; g.beginPath(); g.arc(405, 100, 13, 0, 7); g.fill();
          g.font = '60px sans-serif'; g.fillText('🍟', 90, 100);
          break;
        case 'greg': {
          fill('#1b2140');
          g.fillStyle = '#0b1030'; g.fillRect(300, 40, 170, 140);
          g.fillStyle = '#f5f3c4'; g.beginPath(); g.arc(420, 80, 22, 0, 7); g.fill();
          g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) g.fillRect(310 + (i * 53) % 150, 50 + (i * 37) % 120, 3, 3);
          g.fillStyle = '#ff6b6b'; g.font = 'bold 40px monospace'; g.fillText('05:02', 120, 80);
          g.font = '56px sans-serif'; g.fillText('🎂', 110, 170);
          break;
        }
        case 'aline':
          fill('#f6e2c8');
          for (let i = 0; i < 12; i++) { g.fillStyle = ['#e63946', '#2a9d8f', '#f4a261', '#457b9d'][i % 4]; g.fillRect(40 + i * 18, 60 + (i % 3) * 6, 14, 90 - (i % 3) * 6); }
          g.fillStyle = '#8d5a3b'; g.fillRect(30, 150, 240, 10);
          g.font = '60px sans-serif'; g.fillText('🖼️', 400, 100);
          break;
        case 'panda':
          fill('#fff1d6');
          g.fillStyle = '#4fb8ff'; g.fillRect(250, 30, 230, 160);
          g.fillStyle = '#16a3c4'; g.fillRect(250, 120, 230, 70);
          g.fillStyle = '#ffe066'; g.beginPath(); g.arc(440, 65, 18, 0, 7); g.fill();
          g.font = '60px sans-serif'; g.fillText('🌴', 300, 120);
          g.fillStyle = '#1d3a8a'; g.fillRect(40, 60, 140, 40);
          g.fillStyle = '#e63946'; g.fillRect(40, 74, 140, 12);
          g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText('PSG', 110, 80);
          break;
        case 'eugenie':
          fill('#ffd6e0');
          for (let i = 0; i < 5; i++) { g.save(); g.translate(60 + i * 80, 90 + (i % 2) * 20); g.rotate((i - 2) * 0.1); g.fillStyle = '#fff'; g.fillRect(-28, -34, 56, 68); g.fillStyle = ['#9b5de5', '#00bb7f', '#f15bb5', '#fee440', '#00bbf9'][i]; g.fillRect(-22, -28, 44, 44); g.restore(); }
          g.font = '56px sans-serif'; g.fillText('🪴', 440, 220);
          break;
        case 'victor':
          fill('#bfe6f2');
          g.fillStyle = '#1a6fa0'; g.fillRect(40, 40, 200, 130);
          g.font = '70px sans-serif'; g.fillText('🐋', 140, 105);
          g.font = '70px sans-serif'; g.fillText('🎃', 400, 190);
          g.fillStyle = '#1d3557'; g.font = 'bold 22px sans-serif'; g.fillText('13.6 kg', 400, 245);
          break;
        case 'cous':
          fill('#e9e2d0');
          g.fillStyle = '#c9a227'; g.fillRect(40, 30, 200, 150);
          g.fillStyle = '#3b6e8f'; g.fillRect(55, 45, 170, 120);
          g.fillStyle = '#f4d35e'; g.beginPath(); g.arc(140, 100, 30, 0, 7); g.fill();
          g.font = '60px sans-serif'; g.fillText('🐹', 400, 110);
          g.fillText('🐹', 450, 190);
          break;
        case 'violaine':
          fill('#9fe8e0');
          g.fillStyle = '#ff9f1c'; g.beginPath(); g.ellipse(420, 160, 34, 140, 0.2, 0, 7); g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(410, 30); g.lineTo(430, 290); g.stroke();
          g.font = '60px sans-serif'; g.fillText('🌊', 120, 100);
          break;
        default:
          fill('#ddd');
      }
    });
  }

  const tiles = {};
  TILE_IDS.forEach((id, i) => {
    const cx = i * TILE_SPACING;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.6), track(new THREE.MeshBasicMaterial({ map: backdrop(id) })));
    wall.position.set(cx, 1.8, -1.4);
    call.add(wall);
    const desk = box(3.4, 0.9, 0.8, id === 'greg' ? '#3a3f55' : '#b98a5a', cx, 0.45, 0.75);
    call.add(desk);
    const c = ctx.character(id);
    c.position.set(cx, 0, 0);
    call.add(c);
    tiles[id] = { c, cx, anim: 'idle', animT: 0 };
  });
  // Romain's second screen (he is busy looking at it… until he is not).
  const bossMonitor = box(1, 0.7, 0.08, '#1d2029', -1.35, 1.35, 0.55);
  bossMonitor.rotation.y = 0.9;
  call.add(bossMonitor);
  // Mamar's sandwich, Panda's self-view guitar, Greg's Zzz.
  const sandwich = new THREE.Group();
  [['#e8b866', 0.07], ['#6cb84a', 0.035], ['#c9433b', 0.035], ['#e8b866', 0.07]].forEach(([color, h], i) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, h, 0.2), mat(color));
    l.position.y = i * 0.055;
    sandwich.add(l);
  });
  sandwich.position.set(0, -0.66, 0.12);
  tiles.mamar.c.userData.parts.armR.add(sandwich);
  const selfGuitar = makeGuitar('#d9480f');
  selfGuitar.position.set(-0.2, 0.85, 0.34);
  selfGuitar.rotation.z = 0.35;
  tiles.panda.c.userData.parts.body.add(selfGuitar);
  const zzzTex = canvasTexture(128, 64, (g) => {
    g.fillStyle = '#ffffff'; g.font = 'bold 44px sans-serif'; g.fillText('Zzz', 8, 46);
  });
  const zzz = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: zzzTex, transparent: true })));
  zzz.scale.set(0.8, 0.4, 1);
  call.add(zzz);
  let gregAwake = 0;
  // Babar, photobombing.
  const babar = ctx.character('babar');
  const lighter = new THREE.Group();
  lighter.add(box(0.08, 0.16, 0.05, '#e63946'));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), track(new THREE.MeshBasicMaterial({ color: '#ffb703' })));
  flame.position.y = 0.14;
  lighter.add(flame);
  lighter.position.set(0, -0.66, 0.08);
  babar.userData.parts.armL.add(lighter);
  babar.visible = false;
  call.add(babar);
  const bomb = { tile: null, t: 0, dur: 0, next: 9 + ctx.random() * 4 };
  const BOMB_TILES = ['mamar', 'greg', 'aline', 'panda', 'eugenie', 'victor', 'cous', 'violaine'];

  function react(id, anim, secs = 1.5) {
    tiles[id].anim = anim;
    tiles[id].animT = secs;
  }
  function say(id, key, secs = 2) {
    hud.say(tileAnchor[id], ctx.t(key), secs, 0.25);
  }

  // --- Touch buttons -----------------------------------------------------------------------
  function setupButtons() {
    const map = hud.buttons([
      { id: 'l', label: '◀', side: 'left', onDown: () => laneQueue.push(0) },
      { id: 'm', label: '▼', side: 'left', onDown: () => laneQueue.push(1) },
      { id: 'r', label: '▶', side: 'right', onDown: () => laneQueue.push(2) },
      { id: 'mute', label: ctx.t('mute_btn'), side: 'right', onDown: () => { muteQueued = true; } },
    ]);
    const lanes = [map.l, map.m, map.r];
    lanes.forEach((b, i) => {
      Object.assign(b.style, {
        left: `calc(50% ${i === 2 ? '+' : '-'} ${Math.abs(-162 + i * 112)}px)`, right: 'auto', width: '100px', height: '64px', borderRadius: '20px',
        background: LANE_COLORS[i], color: '#1b1b1b', border: '4px solid rgba(255,255,255,0.85)', opacity: '0.8',
      });
    });
    Object.assign(map.mute.style, {
      right: '14px', left: 'auto', bottom: '104px', width: '128px', height: '64px', borderRadius: '32px',
      fontSize: '20px', fontWeight: 'bold', background: '#e63946', color: '#fff', border: '4px solid #fff',
    });
    return map;
  }
  let buttonMap = null;

  // --- Gameplay reactions ----------------------------------------------------------------
  function pressLane(lane) {
    const r = state.hit(lane);
    if (!r) return;
    const pad = pads[lane];
    if (r.type === 'perfect' || r.type === 'good') {
      pad.glow = 1;
      strum = 1;
      sfx.note(262 * Math.pow(2, r.note.pitch / 12));
      tmp.copy(pad.mesh.position).setY(NOTE_Y + 0.2);
      fx.burst(tmp, r.type === 'perfect' ? 16 : 8, { color: LANE_COLORS[lane], speed: 3, up: 2.5 });
      hud.float(pad.mesh, `${ctx.t(r.type)} +${r.points}`, r.type === 'perfect' ? '#fff27a' : '#9dffcf', 0.6);
      if (state.combo > 0 && state.combo % 20 === 0) {
        hud.banner(ctx.t('combo_banner', { n: state.combo }), 1100, '#ffd84a');
        sfx.power();
        react('aline', 'cheer', 2);
        react('eugenie', 'cheer', 2);
        const who = ['aline', 'eugenie', 'cous', 'victor'][Math.floor(ctx.random() * 4)];
        say(who, { aline: 'aline_cheer', eugenie: 'eugenie_cheer', cous: 'cous_rock', victor: 'victor_style' }[who]);
      }
    } else if (r.type === 'stray') {
      pad.glow = -1;
      sfx.note(98);
      shake = Math.max(shake, 0.08);
      if (ctx.mode !== 'easy') hud.float(pad.mesh, ctx.t('stray'), '#c0c4cc', 0.5);
    } else if (r.type === 'muted') {
      pad.glow = -0.5;
    }
  }

  function pressMute() {
    const r = state.mute();
    if (!r) return;
    overlayDirty = true;
    if (r.type === 'saved' || r.type === 'clutch') {
      sfx.power();
      hud.banner(ctx.t(r.type), 1100, r.type === 'clutch' ? '#ffd84a' : '#8af27a');
      hud.float(tileAnchor.panda, `+${r.points}`, '#ffd84a', 0.4);
      fx.burst(tileAnchor.panda.position, r.type === 'clutch' ? 30 : 14, { color: r.type === 'clutch' ? 0xffd84a : 0x8af27a, speed: 3, up: 2 });
    } else if (r.type === 'useless') {
      sfx.click();
      hud.banner(ctx.t('useless'), 1100, '#ff9f1c');
      say('violaine', 'violaine_awk', 1.6);
      shake = Math.max(shake, 0.12);
    } else if (r.type === 'late') {
      hud.banner(ctx.t('late'), 900, '#ff6b6b');
    }
  }

  function onEvent(e) {
    switch (e.type) {
      case 'miss': {
        const pad = pads[e.note.lane];
        pad.glow = -1;
        hud.float(pad.mesh, ctx.t('miss'), '#ff6b6b', 0.5);
        shake = Math.max(shake, 0.1);
        break;
      }
      case 'warn':
        hud.banner(ctx.t('warn'), Math.min(1600, cfg.warn * 800), '#ff4d4d');
        sfx.whoosh();
        lastWarnNumber = -1;
        warnSign.visible = true;
        break;
      case 'safe':
        hud.say(tileAnchor.romain, ctx.t('safe_line'), 1.8, 0.25);
        react('aline', 'cheer', 1.5);
        warnSign.visible = false;
        break;
      case 'caught':
        warnSign.visible = false;
        sfx.hit();
        hud.banner(ctx.t('caught'), 1500, '#ff3b3b');
        hud.setHearts(state.hearts, cfg.hearts);
        hud.say(tileAnchor.romain, ctx.t('caught_line'), 2.2, 0.25);
        shake = 0.6;
        redFlash = 1;
        panda.userData.flash();
        tiles.panda.c.userData.flash();
        react('romain', 'cheer', 1.8);
        react('aline', 'hit', 1.5);
        react('eugenie', 'hit', 1.5);
        gregAwake = 2.5;
        say('greg', 'greg_wake', 1.8);
        fx.burst(tileAnchor.romain.position, 30, { color: 0xff3b3b, speed: 3, up: 2 });
        break;
      case 'lookEnd':
        overlayDirty = true;
        break;
      case 'fail':
        finish(false);
        break;
      case 'end':
        finish(true);
        break;
      default:
        break;
    }
  }

  function finish(won) {
    if (ended) return;
    ended = true;
    const score = state.score;
    if (won) {
      const stars = state.stars();
      fx.burst(panda.position.clone().setY(2.2), 80);
      TILE_IDS.forEach((id) => react(id, id === 'greg' ? 'idle' : 'cheer', 10));
      hud.say(panda, ctx.tShared('quote_panda'), 3);
      ctx.finish({ score, stars, line: ctx.t(stars === 3 ? 'win3' : 'win') });
    } else {
      react('romain', 'cheer', 10);
      ctx.fail({ score, line: ctx.t('lose') });
    }
  }

  // --- Per-frame visuals ---------------------------------------------------------------------
  function updateNotes() {
    const t = state.t;
    const notes = state.notes;
    while (firstVisible < notes.length && notes[firstVisible].t < t - 0.4) {
      if (noteMesh[firstVisible]) { noteMesh[firstVisible].visible = false; pool.push(noteMesh[firstVisible]); noteMesh[firstVisible] = null; }
      firstVisible++;
    }
    for (let i = firstVisible; i < notes.length; i++) {
      const n = notes[i];
      const ahead = n.t - t;
      if (ahead > cfg.approach) break;
      let m = noteMesh[i];
      const played = n.judged === 'perfect' || n.judged === 'good';
      if (played) {
        if (m) { m.visible = false; pool.push(m); noteMesh[i] = null; }
        continue;
      }
      if (!m) {
        m = pool.pop();
        if (!m) continue;
        noteMesh[i] = m;
        m.visible = true;
      }
      m.material = n.judged === 'ghost' ? ghostMat : n.judged === 'miss' ? missMat : laneMats[n.lane];
      const z = HIT_Z - (ahead / cfg.approach) * TRACK_LEN;
      const grow = Math.min(1, (cfg.approach - ahead) * 4);
      m.position.set(LANE_X[n.lane], NOTE_Y, z);
      m.scale.setScalar(0.4 + grow * 0.6);
    }
    // Frets scroll on the beat.
    const sinceStart = (t - LEAD_IN) / beat;
    const frac = sinceStart - Math.floor(sinceStart);
    for (let k = 0; k < frets.length; k++) {
      const ahead = (k + 1 - frac) * beat;
      const f = frets[k];
      f.visible = ahead <= cfg.approach;
      f.position.set(0, NECK_Y + 0.075, HIT_Z - (ahead / cfg.approach) * TRACK_LEN);
    }
  }

  function updatePads(dt) {
    for (const p of pads) {
      p.glow = p.glow > 0 ? Math.max(0, p.glow - dt * 4) : Math.min(0, p.glow + dt * 4);
      const muted = state.muted();
      p.mat.emissiveIntensity = muted ? 0.05 : 0.35 + Math.max(0, p.glow) * 1.6;
      if (p.glow < 0) p.mat.color.setRGB(0.6, 0.2, 0.2); else p.mat.color.copy(p.base);
      const s = 1 + Math.max(0, p.glow) * 0.35;
      p.mesh.scale.set(s, s, s);
    }
  }

  function updateCall(dt) {
    const time = state.t;
    const look = state.activeLook();
    const phase = state.phase();
    for (const id of TILE_IDS) {
      const tile = tiles[id];
      tile.animT -= dt;
      let anim = tile.animT > 0 ? tile.anim : 'idle';
      if (id === 'cous' && anim === 'idle' && state.multiplier() >= 2) anim = 'dance';
      if (id === 'victor' && anim === 'idle' && state.multiplier() >= 3) anim = 'dance';
      if (id === 'violaine' && anim === 'idle' && state.combo >= 30) anim = 'dance';
      tile.c.userData.animate(dt, anim);
    }
    // Romain: in profile on his other screen, then turns to his camera.
    const romain = tiles.romain.c;
    let turn = -1.2;
    if (look && phase === 'warn') {
      const p = (time - look.warnAt) / (look.lookAt - look.warnAt);
      turn = -1.2 * (1 - p * p * p) + Math.sin(time * 18) * 0.05 * p;
    } else if (phase === 'look') turn = 0;
    romain.rotation.y += (turn - romain.rotation.y) * Math.min(1, dt * 10);
    // Mamar eats, Greg dozes.
    const mamar = tiles.mamar.c.userData.parts;
    const bite = Math.sin(time * 1.6);
    mamar.armR.rotation.x = bite > 0.6 ? -2.5 : -1.1;
    mamar.armR.rotation.z = -0.25;
    const greg = tiles.greg.c.userData.parts;
    gregAwake = Math.max(0, gregAwake - dt);
    if (gregAwake <= 0) {
      greg.body.rotation.z = 0.28 + Math.sin(time * 0.8) * 0.06;
      greg.head.position.y = 1.22;
      zzz.visible = true;
      zzz.position.set(tiles.greg.cx + 0.9, 2.55 + (time * 0.3) % 0.4, 0.3);
      zzz.material.opacity = 1 - ((time * 0.3) % 0.4) / 0.4;
    } else {
      greg.head.position.y = 1.32;
      zzz.visible = false;
    }
    // Panda's self-view strums along.
    const self = tiles.panda.c.userData.parts;
    self.armL.rotation.x = -0.9 - strum * 0.6;
    self.armR.rotation.x = -1.1;
    self.armR.rotation.z = -0.5;
    // Babar photobombs a tile now and then.
    bomb.next -= dt;
    if (!bomb.tile && bomb.next <= 0 && !ended) {
      bomb.tile = BOMB_TILES[Math.floor(ctx.random() * BOMB_TILES.length)];
      bomb.t = 0;
      bomb.dur = 3;
      babar.visible = true;
      hud.say(tileAnchor[bomb.tile], `Babar: ${ctx.t('babar_bomb')}`, 2.2, 0.25);
      if (bomb.tile === 'panda') { panda.userData.flash(); tiles.panda.c.userData.flash(); }
      else react(bomb.tile, 'hit', 1);
    }
    if (bomb.tile) {
      bomb.t += dt;
      const inT = Math.min(1, bomb.t / 0.4, (bomb.dur - bomb.t) / 0.4);
      babar.position.set(tiles[bomb.tile].cx + 2.6 - inT * 1.55, 0, -0.55);
      babar.userData.animate(dt, 'idle');
      babar.userData.parts.armL.rotation.x = -1.8 + Math.sin(bomb.t * 8) * 0.3;
      if (bomb.t >= bomb.dur) {
        bomb.tile = null;
        babar.visible = false;
        bomb.next = 9 + ctx.random() * 6;
      }
    }
    // Render the tiles (30 fps is plenty for a video call).
    rtTimer -= dt;
    if (rtTimer > 0) return;
    rtTimer = 1 / 30;
    const prev = renderer.getRenderTarget();
    TILE_IDS.forEach((id, i) => {
      const cx = tiles[id].cx;
      const zoom = id === 'romain' && phase === 'look' ? 2.1 : 3.2;
      tileCam.position.set(cx, 1.85, zoom);
      tileCam.lookAt(cx, 1.72, 0);
      rt.viewport.set((i % 3) * TILE_W, (2 - Math.floor(i / 3)) * TILE_H, TILE_W, TILE_H);
      rt.scissor.copy(rt.viewport);
      rt.scissorTest = true;
      renderer.setRenderTarget(rt);
      renderer.render(call, tileCam);
    });
    renderer.setRenderTarget(prev);
  }

  function updateWarning(dt, time) {
    const look = state.activeLook();
    const phase = state.phase();
    if (phase === 'warn') {
      const left = look.lookAt - time;
      const n = Math.ceil(left);
      if (n !== lastWarnNumber) {
        lastWarnNumber = n;
        drawWarn(look.muted ? '🔇' : String(n));
        if (!look.muted) sfx.hat();
      }
      warnMat.opacity = look.muted ? 0.35 : 0.5 + 0.5 * Math.sin(time * 20);
      const pulse = 1.4 + Math.sin(time * 12) * 0.12;
      warnSign.scale.set(pulse, pulse, 1);
      hud.meter('boss', left / cfg.warn, look.muted ? '#8af27a' : '#ff4d4d', `👀 ${ctx.t('boss')}`);
    } else if (phase === 'look') {
      warnMat.opacity = look.caught ? 0.9 : 0.4;
      hud.meter('boss', 0, '#ff4d4d', `👀 ${ctx.t('boss')}`);
    } else {
      warnMat.opacity = Math.max(0, warnMat.opacity - dt * 3);
      hud.meter('boss', 1, '#8af27a', `😌 ${ctx.t('boss')}`);
    }
    redFlash = Math.max(0, redFlash - dt * 1.5);
    flashMat.opacity = redFlash * 0.45;
  }

  function placeCamera(dt) {
    const a = camera.aspect || 1.6;
    const k = Math.tan((27.5 * Math.PI) / 180) * a;
    const camZ = Math.max(9.2, HIT_Z + 2.5 / k, SCREEN.z + 3.7 / k);
    const extra = camZ - 9.2;
    shake = Math.max(0, shake - dt * 2.2);
    const sx = shake ? (Math.random() - 0.5) * shake * 0.6 : 0;
    const sy = shake ? (Math.random() - 0.5) * shake * 0.4 : 0;
    camera.position.set(sx, 5 + extra * 0.28 + sy, camZ);
    camera.lookAt(0, 2.3 + extra * 0.05, -1.2);
    const half = (camZ - 2.1) * k;
    panda.position.x = -Math.min(3.3, Math.max(2.1, half - 0.7));
    chair.position.x = panda.position.x;
  }

  // --- Lifecycle ---------------------------------------------------------------------------
  function start() {
    camera.fov = 55;
    camera.updateProjectionMatrix();
    buttonMap = setupButtons();
    hud.setObjective(ctx.t('objective'));
    hud.setHearts(state.hearts, cfg.hearts);
    hud.setScore(0);
    hud.banner(ctx.t('go'), 1800, '#ffd84a');
    drawOverlay();
    sfx.whoosh();
    lastNow = performance.now();
  }

  function update(dt) {
    // Real elapsed time keeps notes in sync with the audio; a long gap means
    // the game was paused, so fall back to dt.
    const now = performance.now();
    let delta = (now - lastNow) / 1000;
    lastNow = now;
    if (!(delta > 0) || delta > 0.25) delta = dt;
    delta = Math.min(delta, 0.1);

    if (!ended) {
      // Count-in clicks, then the groove, restarted every 8 beats to stay in sync.
      if (countIn < 3 && state.t >= LEAD_IN - (3 - countIn) * beat) {
        hud.banner(String(3 - countIn), 450, '#fff');
        countIn++;
        sfx.hat();
      }
      if (state.t >= nextMusicAt) {
        ctx.music(cfg.bpm, MELODY);
        nextMusicAt += beat * 8;
      }
      // Input.
      if (input.pressed('left')) pressLane(0);
      if (input.pressed('down') || input.pressed('up')) pressLane(1);
      if (input.pressed('right')) pressLane(2);
      if (input.pressed('touch') && input.pointer.y < -0.15) pressLane(input.pointer.x < -0.33 ? 0 : input.pointer.x > 0.33 ? 2 : 1);
      while (laneQueue.length) pressLane(laneQueue.shift());
      if (input.pressed('action') || muteQueued) pressMute();
      muteQueued = false;

      const wasMuted = state.muted();
      const events = state.advance(delta);
      for (let i = 0; i < events.length; i++) onEvent(events[i]);
      if (wasMuted !== state.muted()) overlayDirty = true;

      // Section banners and colleague chatter.
      const sec = sectionAt((state.t - LEAD_IN) / (cfg.duration - 2 - LEAD_IN)).key;
      if (state.t > LEAD_IN && sec !== section) {
        if (section) hud.banner(ctx.t(sec), 1200, '#ffffff');
        section = sec;
      }
      chatterTimer -= delta;
      if (chatterTimer <= 0 && state.phase() === 'calm') {
        chatterTimer = 5 + ctx.random() * 4;
        const pick = Math.floor(ctx.random() * 6);
        if (pick === 0) { say('mamar', 'mamar_eat'); fx.burst(tileAnchor.mamar.position, 6, { color: 0xe8b866, speed: 1, up: 1 }); }
        else if (pick === 1) say('greg', gregAwake > 0 ? 'greg_wake' : 'greg_sleep');
        else if (pick === 2) hud.say(tileAnchor.victor, ctx.tShared('quote_victor'), 2, 0.25);
        else if (pick === 3) hud.say(tileAnchor.cous, ctx.tShared('quote_cous'), 2, 0.25);
        else if (pick === 4) hud.say(tileAnchor.eugenie, ctx.tShared('quote_eugenie'), 2, 0.25);
        else hud.say(tileAnchor.violaine, ctx.tShared('quote_violaine'), 2, 0.25);
      }

      // HUD.
      hud.setScore(state.score, '🎸 ');
      const left = Math.max(0, Math.ceil(cfg.duration - state.t));
      hud.setProgress(state.progress(), `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
      const mult = state.multiplier();
      hud.meter('combo', (state.combo % 8) / 8 + (mult === 4 ? 1 : 0), ['#8af27a', '#6bd5ff', '#ffd84a', '#ff5d8f'][mult - 1], `${ctx.t('combo', { m: mult })} · ${state.combo}`);
      if (mult > lastMultiplier) { sfx.coin(); hud.float(panda, `x${mult}!`, '#ffd84a', 2.8); }
      lastMultiplier = mult;
      if (buttonMap) buttonMap.mute.style.background = state.muted() ? '#555' : state.phase() === 'warn' ? (Math.sin(state.t * 20) > 0 ? '#ff2a2a' : '#ffd84a') : '#e63946';
      webcamLed.material.color.set(state.muted() ? '#555555' : '#ff3b3b');
      if (overlayDirty) { overlayDirty = false; drawOverlay(); }
      updateWarning(delta, state.t);
    }

    updateNotes();
    updatePads(dt);
    strum = Math.max(0, strum - dt * 6);
    panda.userData.animate(dt, ended && state.won() ? 'cheer' : 'sit');
    if (!ended || !state.won()) {
      const p = panda.userData.parts;
      p.armL.rotation.x = -0.9 - strum * 0.6;
      p.armL.rotation.z = 0.2;
      p.armR.rotation.x = -1.1;
      p.armR.rotation.z = -0.5;
      p.body.rotation.z = strum * 0.05;
    }
    updateCall(dt);
    placeCamera(dt);
  }

  function dispose() {
    renderer.setRenderTarget(null);
    call.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.map && !disposables.includes(o.material.map) && o.material.map.isCanvasTexture) o.material.map.dispose();
    });
    for (const d of disposables) d.dispose?.();
    disposables.length = 0;
    laneQueue.length = 0;
  }

  return { start, update, dispose, state };
}
